//! What each row's tokens are, part by part: `/debug`'s charts and their
//! filters (architect m_41684). One pass over the same slices the rows are
//! cut from ([`super::split`]); each part's bytes are its own bytes of the
//! body (a content block, a call, a tool's definition), the row's envelope
//! (`{"role":…,"content":[`, commas) goes to its first part, so the parts'
//! tokens sum to the row's. A tool result is named through its call's id;
//! an orphan is `Other`. An image counts as its provider counts it, from
//! its size in its header ([`image_tokens`]), not as its base64's bytes;
//! the row's tokens are then its parts' sum (the list and the charts say
//! the same). The desktop only sums and bins them.

use super::{Family, Items, Pairs, Part, Split};
use crate::Redactor;
use bise_proto::envelope as env;
use bise_proto::log::{CompKind, CompPart, CompRole};
use serde_json::value::RawValue;
use serde_json::Value;
use std::collections::HashMap;

/// A part before its tokens: whose, what, its names, its bytes.
#[derive(Clone, Debug, PartialEq, Eq)]
struct Raw {
    role: CompRole,
    kind: CompKind,
    names: Vec<String>,
    bytes: u64,
    /// an image's tokens as its provider counts them (not its bytes)
    fixed: Option<u64>,
}

fn raw(role: CompRole, kind: CompKind, names: Vec<String>, bytes: usize) -> Raw {
    Raw { role, kind, names, bytes: bytes as u64, fixed: None }
}

/// The parts of every row, indexed by its `n`.
pub fn parts(s: &Split, red: &Redactor) -> Vec<Vec<CompPart>> {
    let last = s.slices.iter().map(|x| x.n).max().unwrap_or(0) as usize;
    let mut out: Vec<Vec<Raw>> = vec![Vec::new(); last + 1];
    let mut row_bytes = vec![0u64; last + 1];
    let mut calls: HashMap<String, Vec<String>> = HashMap::new();
    let mut seen_item = false;
    for x in &s.slices {
        let n = x.n as usize;
        row_bytes[n] += x.raw.len() as u64;
        match x.part {
            Part::Key if x.n == 0 => out[0].extend(head_key(&x.key, x.raw)),
            Part::Key => out[n].push(raw(CompRole::System, CompKind::Prompt, vec![], x.raw.len())),
            Part::Item => {
                let first = !seen_item;
                seen_item = true;
                out[n] = item(s.family, x.raw, first, &mut calls);
            }
        }
    }
    out.into_iter()
        .zip(row_bytes)
        .map(|(ps, bytes)| tokens(ps, bytes, red))
        .collect()
}

/// The parts' tokens: an image its own count; the row's leftover bytes
/// (its envelope) on its first other part, then each one's share of the
/// bytes cut so they sum to their bytes' `div_ceil(4)`. The row's tokens
/// are the parts' sum ([`super::rows`]).
fn tokens(mut ps: Vec<Raw>, bytes: u64, red: &Redactor) -> Vec<CompPart> {
    if ps.is_empty() {
        return Vec::new();
    }
    let inside: u64 = ps.iter().map(|p| p.bytes).sum();
    let envelope = bytes.saturating_sub(inside);
    match ps.iter_mut().find(|p| p.fixed.is_none()) {
        Some(p) => p.bytes += envelope,
        None => ps[0].fixed = ps[0].fixed.map(|t| t + envelope.div_ceil(4)),
    }
    let mut cum = 0u64;
    ps.into_iter()
        .map(|p| {
            let tokens = match p.fixed {
                Some(t) => t,
                None => {
                    let before = cum.div_ceil(4);
                    cum += p.bytes;
                    cum.div_ceil(4) - before
                }
            };
            CompPart { role: p.role, kind: p.kind, names: p.names.iter().map(|n| red.text(n)).collect(), tokens }
        })
        .collect()
}

/// An image's tokens as its provider counts them, from the width and
/// height in its header (None: no base64 or no size read; it then counts
/// as its bytes). Anthropic: w*h/750 after its resize to 1568 on the long
/// edge and 1.15 megapixels; OpenAI: 85, plus 170 per 512 tile after its
/// fit in 2048 and 768 on the short side, unless `detail` is low.
pub fn image_tokens(family: Family, v: &Value) -> Option<u64> {
    let data = ["/source/data", "/image_url/url", "/image_url", "/data"].iter().find_map(|p| v.pointer(p).and_then(Value::as_str))?;
    let b64 = data.find(";base64,").map_or(data, |i| &data[i + ";base64,".len()..]);
    // the head is enough: a JPEG's size can sit some KB in
    let head = &b64[..b64.len().min(87_380)];
    let head = &head[..head.len() - head.len() % 4];
    let (w, h) = bend_images::dimensions(&bend_images::base64_decode(head)?)?;
    let (w, h) = (f64::from(w.max(1)), f64::from(h.max(1)));
    Some(match family {
        Family::Anthropic => {
            let s = (1568.0 / w.max(h)).min((1_150_000.0 / (w * h)).sqrt()).min(1.0);
            ((w * s).round() * (h * s).round() / 750.0).ceil() as u64
        }
        Family::Chat | Family::Responses => {
            let detail = v.pointer("/image_url/detail").or_else(|| v.get("detail")).and_then(Value::as_str);
            if detail == Some("low") {
                return Some(85);
            }
            let s = (2048.0 / w.max(h)).min(1.0);
            let (w, h) = (w * s, h * s);
            let s = (768.0 / w.min(h)).min(1.0);
            let (w, h) = ((w * s).round(), (h * s).round());
            85 + 170 * ((w / 512.0).ceil() * (h / 512.0).ceil()) as u64
        }
    })
}

fn is_image(v: &Value) -> bool {
    matches!(str_at(v, "type"), "image" | "input_image" | "image_url")
}

fn image(family: Family, role: CompRole, names: Vec<String>, v: &Value, bytes: usize) -> Raw {
    Raw { fixed: image_tokens(family, v), ..raw(role, CompKind::Image, names, bytes) }
}

/// A part whose `key` may be a list holding images (a tool result with a
/// screenshot): the images as their own parts (`Image`, the tool's name),
/// the rest the part itself.
fn with_images(family: Family, base: Raw, raw_v: &str, key: &str) -> Vec<Raw> {
    let mut out = vec![base];
    let list = keys(raw_v).into_iter().find(|(k, _)| k == key);
    let Some(Ok(Items(xs))) = list.map(|(_, l)| serde_json::from_str::<Items>(l.get())) else { return out };
    for x in xs {
        let xv: Value = serde_json::from_str(x.get()).unwrap_or(Value::Null);
        if is_image(&xv) {
            let len = x.get().len();
            out[0].bytes = out[0].bytes.saturating_sub(len as u64);
            let names = out[0].names.first().cloned().into_iter().collect();
            out.push(image(family, out[0].role, names, &xv, len));
        }
    }
    out
}

/// A key of the request's head: each tool's definition, the rest params.
fn head_key(key: &str, raw_v: &str) -> Vec<Raw> {
    if key == "tools" {
        if let Ok(Items(xs)) = serde_json::from_str::<Items>(raw_v) {
            let mut v: Vec<Raw> = xs
                .iter()
                .map(|t| {
                    let d: Value = serde_json::from_str(t.get()).unwrap_or(Value::Null);
                    let name = ["/name", "/function/name"].iter().find_map(|p| d.pointer(p).and_then(Value::as_str)).unwrap_or("");
                    raw(CompRole::System, CompKind::Tools, named(name), t.get().len())
                })
                .collect();
            if let Some(first) = v.first_mut() {
                first.bytes += (raw_v.len() - xs.iter().map(|t| t.get().len()).sum::<usize>()) as u64;
            }
            return v;
        }
    }
    vec![raw(CompRole::System, CompKind::Params, vec![], raw_v.len())]
}

fn named(s: &str) -> Vec<String> {
    if s.is_empty() { vec![] } else { vec![s.to_string()] }
}

fn str_at<'a>(v: &'a Value, k: &str) -> &'a str {
    v.get(k).and_then(Value::as_str).unwrap_or("")
}

/// The top-level keys of a JSON object as raw values.
fn keys(raw_v: &str) -> Vec<(String, &RawValue)> {
    serde_json::from_str::<Pairs>(raw_v).map(|p| p.0).unwrap_or_default()
}

/// A call's names: its tool, then the program (bash) or the group
/// (run_typescript) when one reads.
fn call_names(tool: &str, args: &str) -> Vec<String> {
    if tool.is_empty() {
        return vec![];
    }
    let obj: Value = serde_json::from_str(args).unwrap_or(Value::Null);
    let sub = match tool {
        "bash" => program(obj.get("arg").or_else(|| obj.get("command")).and_then(Value::as_str).unwrap_or("")),
        "run_typescript" => ts_group(obj.get("code").and_then(Value::as_str).unwrap_or("")),
        _ => None,
    };
    let mut v = vec![tool.to_string()];
    v.extend(sub);
    v
}

/// The program a command runs, best effort: past `cd … &&`, env
/// assignments and a path; none when nothing reads.
pub fn program(cmd: &str) -> Option<String> {
    let mut rest = cmd.trim_start();
    loop {
        rest = rest.trim_start_matches(['(', '{', ' ']);
        let word: String = rest.split_whitespace().next()?.to_string();
        let is_env = word.contains('=') && !word.starts_with('=') && word.split('=').next().is_some_and(|k| k.chars().all(|c| c.is_ascii_alphanumeric() || c == '_'));
        if word == "cd" {
            let at = rest.find("&&").or_else(|| rest.find(';'))?;
            rest = rest[at..].trim_start_matches(['&', ';']).trim_start();
        } else if is_env {
            rest = rest[word.len()..].trim_start();
        } else {
            let w = word.rsplit('/').next().unwrap_or("");
            let ok = !w.is_empty() && w.chars().all(|c| c.is_ascii_alphanumeric() || "-_.+".contains(c));
            return ok.then(|| w.to_string());
        }
    }
}

/// The first `tools.<group>` a run_typescript code calls.
pub fn ts_group(code: &str) -> Option<String> {
    let at = code.find("tools.")? + "tools.".len();
    let g: String = code[at..].chars().take_while(|c| c.is_ascii_alphanumeric() || *c == '_').collect();
    (!g.is_empty()).then_some(g)
}

/// A user text's kind by its envelope (the constants its writers use).
pub fn text_kind(t: &str) -> (CompKind, Vec<String>) {
    let t = t.trim_start();
    let tag = |name: &str| t.strip_prefix('<').is_some_and(|r| r.starts_with(name) && r[name.len()..].starts_with([' ', '>']));
    if tag(env::USER_MESSAGE) {
        (CompKind::Words, vec![])
    } else if tag(env::AGENT_MESSAGE) {
        let from = attr(t, "from").map(|f| vec![f]).unwrap_or_default();
        (CompKind::AgentMessage, from)
    } else if tag(env::BISE_STATE) {
        (CompKind::BiseState, vec![])
    } else if t.starts_with(env::ROLE_PREAMBLE) {
        (CompKind::Preamble, vec![])
    } else if t.starts_with(env::SUMMARY_PREFIX) || t.starts_with(env::COMPACTED_PREFIX) {
        (CompKind::Summary, vec![])
    } else if t.starts_with(env::BISE_NOTE_PREFIX) {
        (CompKind::Note, vec![])
    } else if let Some(name) = t.strip_prefix('<').map(|r| r.chars().take_while(|c| c.is_ascii_alphanumeric() || *c == '_' || *c == '-').collect::<String>()).filter(|n| !n.is_empty()) {
        (CompKind::Tagged, vec![name])
    } else {
        (CompKind::Text, vec![])
    }
}

/// An attribute of the opening tag (`from="main"`).
fn attr(t: &str, name: &str) -> Option<String> {
    let open = &t[..t.find('>')?];
    let k = format!(" {name}=\"");
    let at = open.find(&k)? + k.len();
    let end = open[at..].find('"')?;
    Some(open[at..at + end].to_string())
}

/// One message (or Responses input item) as parts.
fn item(family: Family, raw_v: &str, first: bool, calls: &mut HashMap<String, Vec<String>>) -> Vec<Raw> {
    let v: Value = serde_json::from_str(raw_v).unwrap_or(Value::Null);
    let ty = str_at(&v, "type");
    let len = raw_v.len();
    match (family, ty) {
        (Family::Responses, "function_call" | "custom_tool_call") => {
            let args = v.get("arguments").and_then(Value::as_str).map(str::to_string).or_else(|| v.get("input").map(Value::to_string)).unwrap_or_default();
            let names = call_names(str_at(&v, "name"), &args);
            calls.insert(str_at(&v, "call_id").to_string(), names.clone());
            return vec![tool(CompRole::ToolCall, names, len)];
        }
        (Family::Responses, "function_call_output" | "custom_tool_call_output") => return with_images(family, result(calls.get(str_at(&v, "call_id")), len), raw_v, "output"),
        (Family::Responses, "reasoning") => return vec![raw(CompRole::Assistant, CompKind::Thinking, vec![], len)],
        _ => {}
    }
    let role_word = str_at(&v, "role");
    if family == Family::Chat && role_word == "tool" {
        return with_images(family, result(calls.get(str_at(&v, "tool_call_id")), len), raw_v, "content");
    }
    let role = match role_word {
        "assistant" => CompRole::Assistant,
        "system" | "developer" => CompRole::System,
        "user" => CompRole::User,
        _ => CompRole::Unknown,
    };
    let mut out = Vec::new();
    for (k, val) in keys(raw_v) {
        match k.as_str() {
            "content" => content(family, role, first, val.get(), calls, &mut out),
            "tool_calls" => {
                if let Ok(Items(xs)) = serde_json::from_str::<Items>(val.get()) {
                    for c in xs {
                        let cv: Value = serde_json::from_str(c.get()).unwrap_or(Value::Null);
                        let f = cv.get("function").unwrap_or(&cv);
                        let names = call_names(str_at(f, "name"), str_at(f, "arguments"));
                        calls.insert(str_at(&cv, "id").to_string(), names.clone());
                        out.push(tool(CompRole::ToolCall, names, c.get().len()));
                    }
                }
            }
            _ => {}
        }
    }
    if out.is_empty() {
        out.push(raw(role, CompKind::Other, vec![], 0));
    }
    out
}

fn tool(role: CompRole, names: Vec<String>, bytes: usize) -> Raw {
    if names.is_empty() { raw(role, CompKind::Other, vec![], bytes) } else { raw(role, CompKind::Tool, names, bytes) }
}

fn result(call: Option<&Vec<String>>, bytes: usize) -> Raw {
    tool(CompRole::ToolResult, call.cloned().unwrap_or_default(), bytes)
}

/// A text's part: a system message is `Prompt` first, `Mid` after; an
/// assistant's is `Text`; a user's by its envelope.
fn text_part(role: CompRole, first: bool, t: &str, bytes: usize) -> Raw {
    match role {
        CompRole::System => raw(role, if first { CompKind::Prompt } else { CompKind::Mid }, vec![], bytes),
        CompRole::User => {
            let (k, names) = text_kind(t);
            raw(role, k, names, bytes)
        }
        _ => raw(role, CompKind::Text, vec![], bytes),
    }
}

/// A content: a string (one part) or a list of blocks (one part each).
fn content(family: Family, role: CompRole, first: bool, raw_v: &str, calls: &mut HashMap<String, Vec<String>>, out: &mut Vec<Raw>) {
    let Ok(Items(xs)) = serde_json::from_str::<Items>(raw_v) else {
        let t = serde_json::from_str::<String>(raw_v).unwrap_or_default();
        out.push(text_part(role, first, &t, raw_v.len()));
        return;
    };
    for p in xs {
        let pv: Value = serde_json::from_str(p.get()).unwrap_or(Value::Null);
        let len = p.get().len();
        out.extend(match str_at(&pv, "type") {
            "text" | "input_text" | "output_text" => vec![text_part(role, first, str_at(&pv, "text"), len)],
            "thinking" | "redacted_thinking" | "reasoning_text" | "summary_text" => vec![raw(role, CompKind::Thinking, vec![], len)],
            "image" | "input_image" | "image_url" => vec![image(family, role, vec![], &pv, len)],
            "tool_use" => {
                let names = call_names(str_at(&pv, "name"), &pv.get("input").map(Value::to_string).unwrap_or_default());
                calls.insert(str_at(&pv, "id").to_string(), names.clone());
                vec![tool(CompRole::ToolCall, names, len)]
            }
            "tool_result" => with_images(family, result(calls.get(str_at(&pv, "tool_use_id")), len), p.get(), "content"),
            _ => vec![raw(role, CompKind::Other, vec![], len)],
        });
    }
}

#[cfg(test)]
mod tests;
