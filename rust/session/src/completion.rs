//! `/debug completion`: a request body as the provider got it (a ring
//! slot's `.json`, `reqlog`, or the render mode's output for another
//! model), cut into rows to read. Nothing here rebuilds a request: the
//! rows are slices of the body's own bytes ([`split`]), and [`rebuild`]
//! puts them back together into the same bytes (the law
//! `the_rows_are_the_body_byte_for_byte`, on a body of each family the
//! runtime wrote). Then [`rows`] says how each slice draws: a bash call as
//! its command, run_typescript as its code, an edit as its diff
//! (`history::call_view`, the same views as `/debug history`), a text as
//! markdown, a result as JSON when it is JSON, else as text. Row 0 is
//! the request's head: every top-level key but the system prompt and the
//! messages (the model, its params, the tools). Every text is redacted
//! and a base64 image is a line ("image png · 120 KB"), after the split.
//! Each row also carries its parts ([`groups`]): whose and what its
//! tokens are, for `/debug`'s charts.

use crate::history::{call_view, first_line, pretty_json, short_bytes, Body};
use crate::Redactor;
use bise_proto::log::{CompBlock, CompRow, LogBody, LogBodyKind};
use bise_proto::thread::TOOL_TEXT_CAP;
use serde::de::{Deserializer, MapAccess, SeqAccess, Visitor};
use serde_json::value::RawValue;
use serde_json::Value;
use std::fmt;

/// Which provider family's shape a body has.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Family {
    /// Messages API: `system`, `messages` of content blocks
    Anthropic,
    /// Chat Completions: `messages` with the system prompt among them
    Chat,
    /// Responses API: `instructions`, `input` items
    Responses,
}

impl Family {
    pub fn word(self) -> &'static str {
        match self {
            Family::Anthropic => "anthropic",
            Family::Chat => "openai-chat",
            Family::Responses => "openai-responses",
        }
    }
}

/// What a slice of the body is.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Part {
    /// a top-level key's whole value (row 0, or the system prompt)
    Key,
    /// one element of the messages array (`messages` or `input`)
    Item,
}

/// A row before drawing: its slices of the body, in the body's order.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Slice<'a> {
    pub n: u64,
    pub part: Part,
    /// the top-level key it comes from
    pub key: String,
    /// the bytes of the body it is
    pub raw: &'a str,
}

/// A body cut into slices: its family, the order of its top-level keys
/// (the messages key among them) and the slices. Row 0 may hold several
/// [`Part::Key`] slices; every other row holds one.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Split<'a> {
    pub family: Family,
    pub keys: Vec<String>,
    /// the key whose array is the messages (`messages` or `input`)
    pub list: Option<String>,
    pub slices: Vec<Slice<'a>>,
}

/// The top-level object as (key, raw value) pairs, in the body's order.
struct Pairs<'a>(Vec<(String, &'a RawValue)>);

impl<'de: 'a, 'a> serde::Deserialize<'de> for Pairs<'a> {
    fn deserialize<D: Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        struct V<'a>(std::marker::PhantomData<&'a ()>);
        impl<'de: 'a, 'a> Visitor<'de> for V<'a> {
            type Value = Pairs<'a>;
            fn expecting(&self, f: &mut fmt::Formatter) -> fmt::Result {
                f.write_str("a JSON object")
            }
            fn visit_map<M: MapAccess<'de>>(self, mut m: M) -> Result<Pairs<'a>, M::Error> {
                let mut v = Vec::new();
                while let Some((k, raw)) = m.next_entry::<String, &'de RawValue>()? {
                    v.push((k, raw));
                }
                Ok(Pairs(v))
            }
        }
        d.deserialize_map(V(std::marker::PhantomData))
    }
}

/// An array's elements as raw values, in order.
struct Items<'a>(Vec<&'a RawValue>);

impl<'de: 'a, 'a> serde::Deserialize<'de> for Items<'a> {
    fn deserialize<D: Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        struct V<'a>(std::marker::PhantomData<&'a ()>);
        impl<'de: 'a, 'a> Visitor<'de> for V<'a> {
            type Value = Items<'a>;
            fn expecting(&self, f: &mut fmt::Formatter) -> fmt::Result {
                f.write_str("a JSON array")
            }
            fn visit_seq<S: SeqAccess<'de>>(self, mut s: S) -> Result<Items<'a>, S::Error> {
                let mut v = Vec::new();
                while let Some(raw) = s.next_element::<&'de RawValue>()? {
                    v.push(raw);
                }
                Ok(Items(v))
            }
        }
        d.deserialize_seq(V(std::marker::PhantomData))
    }
}

/// The family of a body, by its keys: `input` is the Responses API's; a
/// top-level `system`, or an Anthropic content block, the Messages API's;
/// else Chat Completions.
fn family_of(pairs: &[(String, &RawValue)]) -> Family {
    let has = |k: &str| pairs.iter().any(|(x, _)| x == k);
    if has("input") && !has("messages") {
        return Family::Responses;
    }
    if has("system") {
        return Family::Anthropic;
    }
    let anth_block = pairs.iter().find(|(k, _)| k == "messages").is_some_and(|(_, raw)| {
        let t = raw.get();
        ["\"type\":\"tool_use\"", "\"type\":\"tool_result\"", "\"type\":\"thinking\""].iter().any(|b| t.contains(b))
    });
    if anth_block { Family::Anthropic } else { Family::Chat }
}

/// The body cut into slices: row 0 the head keys, then the system prompt
/// (`system` / `instructions`) when it is a key, then one row per message.
pub fn split(body: &str) -> Result<Split<'_>, String> {
    let Pairs(pairs) = serde_json::from_str(body).map_err(|e| format!("not a JSON object: {e}"))?;
    let family = family_of(&pairs);
    let list = match family {
        Family::Responses => "input",
        _ => "messages",
    };
    let sys = match family {
        Family::Anthropic => Some("system"),
        Family::Responses => Some("instructions"),
        Family::Chat => None,
    };
    let mut head = Vec::new();
    let mut system = Vec::new();
    let mut items = Vec::new();
    let mut has_list = false;
    for (k, raw) in &pairs {
        if k == list {
            let Items(xs) = serde_json::from_str(raw.get()).map_err(|e| format!("{list}: {e}"))?;
            items = xs;
            has_list = true;
        } else if Some(k.as_str()) == sys {
            system.push(Slice { n: 1, part: Part::Key, key: k.clone(), raw: raw.get() });
        } else {
            head.push(Slice { n: 0, part: Part::Key, key: k.clone(), raw: raw.get() });
        }
    }
    let first = 1 + system.len() as u64;
    let mut slices = head;
    slices.extend(system);
    slices.extend(items.into_iter().enumerate().map(|(i, raw)| Slice {
        n: first + i as u64,
        part: Part::Item,
        key: list.to_string(),
        raw: raw.get(),
    }));
    Ok(Split {
        family,
        keys: pairs.iter().map(|(k, _)| k.clone()).collect(),
        list: has_list.then(|| list.to_string()),
        slices,
    })
}

/// The body the slices are cut from, put back together: each top-level
/// key in its order, the messages key as the array of its rows' slices.
pub fn rebuild(s: &Split) -> String {
    let mut out = String::from("{");
    for (i, k) in s.keys.iter().enumerate() {
        if i > 0 {
            out.push(',');
        }
        out.push_str(&serde_json::to_string(k).unwrap_or_default());
        out.push(':');
        if s.list.as_deref() == Some(k.as_str()) {
            let items: Vec<&str> = s.slices.iter().filter(|x| x.part == Part::Item).map(|x| x.raw).collect();
            out.push('[');
            out.push_str(&items.join(","));
            out.push(']');
        } else if let Some(x) = s.slices.iter().find(|x| x.part == Part::Key && &x.key == k) {
            out.push_str(x.raw);
        }
    }
    out.push('}');
    out
}

// ---- drawing ----

fn cut(kind: LogBodyKind, lang: Option<&str>, text: &str, red: &Redactor) -> LogBody {
    let t = red.text(text);
    let o = crate::tool_output::cut_to(&t, TOOL_TEXT_CAP);
    LogBody { kind, lang: lang.map(str::to_string), text: o.text, cut: o.cut }
}

fn md(label: Option<&str>, text: &str, red: &Redactor) -> CompBlock {
    CompBlock { label: label.map(str::to_string), body: cut(LogBodyKind::Md, None, &crate::history::image_tags(text), red) }
}

/// A JSON value pretty, its long base64 strings as a word.
fn json_block(label: Option<&str>, v: &Value, red: &Redactor) -> CompBlock {
    let mut v = v.clone();
    shorten_blobs(&mut v);
    let text = serde_json::to_string_pretty(&v).unwrap_or_default();
    CompBlock { label: label.map(str::to_string), body: cut(LogBodyKind::Code, Some("json"), &text, red) }
}

fn shorten_blobs(v: &mut Value) {
    match v {
        Value::String(s) if s.len() > 4000 && !s.contains(' ') => *s = format!("[{} of base64]", short_bytes(s.len())),
        Value::Array(a) => a.iter_mut().for_each(shorten_blobs),
        Value::Object(m) => m.values_mut().for_each(shorten_blobs),
        _ => {}
    }
}

/// A call (its tool and its arguments as a JSON text), drawn as
/// `/debug history` draws it.
fn call(name: &str, args: &str, red: &Redactor) -> (String, CompBlock) {
    let (head, body) = call_view(name, args);
    let b = match body {
        Body::Code { lang, text } => cut(LogBodyKind::Code, Some(lang), &text, red),
        Body::Md(t) => cut(LogBodyKind::Md, None, &t, red),
        Body::Plain(t) => cut(LogBodyKind::Plain, None, &t, red),
        Body::None => cut(LogBodyKind::Plain, None, args, red),
    };
    (red.text(&head), CompBlock { label: Some(format!("tool_use · {name}")), body: b })
}

/// A tool's output: JSON when it parses as an object or an array, else
/// text.
fn output(label: &str, text: &str, red: &Redactor) -> CompBlock {
    let body = match pretty_json(text) {
        Some(p) => cut(LogBodyKind::Code, Some("json"), &p, red),
        None => cut(LogBodyKind::Plain, None, &crate::history::image_tags(text), red),
    };
    CompBlock { label: Some(label.to_string()), body }
}

fn image(label: &str, v: &Value) -> CompBlock {
    let mime = ["media_type", "mime_type"]
        .iter()
        .find_map(|k| v.pointer(&format!("/source/{k}")).or_else(|| v.get(*k)).and_then(Value::as_str))
        .unwrap_or("image");
    let data = ["/source/data", "/image_url/url", "/image_url", "/data"]
        .iter()
        .find_map(|p| v.pointer(p).and_then(Value::as_str))
        .unwrap_or("");
    // an image the ring could not put back reads as its word
    // (`reqlog::expand`: "[image gone]"), never as a size
    let size = data.find("[image ").map_or_else(|| short_bytes(data.len()), |i| data[i..].to_string());
    let text = format!("{} · {}", mime.replace("image/", "image "), size);
    CompBlock { label: Some(label.to_string()), body: LogBody { kind: LogBodyKind::Plain, lang: None, text, cut: false } }
}

fn str_of(v: &Value, k: &str) -> String {
    v.get(k).and_then(Value::as_str).unwrap_or("").to_string()
}

/// A content that is a string or a list of parts (text, image, tool
/// use, tool result, thinking), as blocks; the head is its first call's
/// or first text's line.
fn content(v: Option<&Value>, red: &Redactor, out: &mut Vec<CompBlock>, head: &mut String) {
    let mut put_head = |h: &str| {
        if head.is_empty() {
            *head = first_line(h, 90);
        }
    };
    match v {
        Some(Value::String(s)) => {
            put_head(s);
            out.push(md(None, s, red));
        }
        Some(Value::Array(parts)) => {
            for p in parts {
                let ty = str_of(p, "type");
                match ty.as_str() {
                    "text" | "input_text" | "output_text" => {
                        let t = str_of(p, "text");
                        put_head(&t);
                        out.push(md(None, &t, red));
                    }
                    "thinking" | "reasoning_text" | "summary_text" => out.push(CompBlock {
                        label: Some(ty.clone()),
                        body: cut(LogBodyKind::Plain, None, &str_of(p, if ty == "thinking" { "thinking" } else { "text" }), red),
                    }),
                    "image" | "input_image" | "image_url" => out.push(image(&ty, p)),
                    "tool_use" => {
                        let args = p.get("input").map(Value::to_string).unwrap_or_default();
                        let (h, b) = call(&str_of(p, "name"), &args, red);
                        put_head(&h);
                        out.push(b);
                    }
                    "tool_result" => {
                        let label = if p.get("is_error").and_then(Value::as_bool) == Some(true) { "result · failed" } else { "result" };
                        match p.get("content") {
                            Some(Value::String(s)) => {
                                put_head(s);
                                out.push(output(label, s, red));
                            }
                            Some(Value::Array(xs)) => {
                                for x in xs {
                                    if str_of(x, "type") == "text" {
                                        let t = str_of(x, "text");
                                        put_head(&t);
                                        out.push(output(label, &t, red));
                                    } else {
                                        out.push(image(label, x));
                                    }
                                }
                            }
                            _ => {}
                        }
                    }
                    _ => out.push(json_block(Some(&ty), p, red)),
                }
            }
        }
        Some(other) => out.push(json_block(None, other, red)),
        None => {}
    }
}

/// One message (or Responses input item) as a row.
fn item_row(n: u64, family: Family, raw: &str, red: &Redactor) -> CompRow {
    let v: Value = serde_json::from_str(raw).unwrap_or(Value::Null);
    let mut blocks = Vec::new();
    let mut head = String::new();
    let ty = str_of(&v, "type");
    let role = match (family, ty.as_str()) {
        (Family::Responses, "function_call") | (Family::Responses, "custom_tool_call") => {
            let args = v.get("arguments").and_then(Value::as_str).map(str::to_string).or_else(|| v.get("input").map(Value::to_string)).unwrap_or_default();
            let (h, b) = call(&str_of(&v, "name"), &args, red);
            head = h;
            blocks.push(b);
            ty.clone()
        }
        (Family::Responses, "function_call_output") | (Family::Responses, "custom_tool_call_output") => {
            let out = match v.get("output") {
                Some(Value::String(s)) => s.clone(),
                Some(o) => o.to_string(),
                None => String::new(),
            };
            head = first_line(&out, 90);
            blocks.push(output("result", &out, red));
            ty.clone()
        }
        (Family::Responses, "reasoning") => {
            content(v.get("summary"), red, &mut blocks, &mut head);
            if blocks.is_empty() {
                head = "encrypted".into();
            }
            ty.clone()
        }
        _ => {
            let role = str_of(&v, "role");
            if family == Family::Chat && role == "tool" {
                let t = match v.get("content") {
                    Some(Value::String(s)) => s.clone(),
                    Some(o) => o.to_string(),
                    None => String::new(),
                };
                head = first_line(&t, 90);
                blocks.push(output("result", &t, red));
            } else {
                content(v.get("content"), red, &mut blocks, &mut head);
                for c in v.get("tool_calls").and_then(Value::as_array).into_iter().flatten() {
                    let f = c.get("function").unwrap_or(c);
                    let (h, b) = call(&str_of(f, "name"), &str_of(f, "arguments"), red);
                    if head.is_empty() {
                        head = h;
                    }
                    blocks.push(b);
                }
            }
            if role.is_empty() { if ty.is_empty() { "item".into() } else { ty.clone() } } else { role }
        }
    };
    CompRow { n, role, head: red.text(&head), blocks, bytes: raw.len() as u64, tokens: (raw.len() as u64).div_ceil(4), parts: Vec::new() }
}

/// The system prompt key (`system` / `instructions`) as a row.
fn system_row(n: u64, raw: &str, red: &Redactor) -> CompRow {
    let v: Value = serde_json::from_str(raw).unwrap_or(Value::Null);
    let mut blocks = Vec::new();
    let mut head = String::new();
    content(Some(&v), red, &mut blocks, &mut head);
    let lines: usize = blocks.iter().map(|b| b.body.text.lines().count()).sum();
    CompRow { n, role: "system".into(), head: format!("the system prompt · {lines} lines"), blocks, bytes: raw.len() as u64, tokens: (raw.len() as u64).div_ceil(4), parts: Vec::new() }
}

/// Row 0: the head keys (model, params) as one JSON block, the tools as
/// another, folded by the clients.
fn head_row(s: &Split, red: &Redactor) -> CompRow {
    let mut params = serde_json::Map::new();
    let mut tools: Option<Value> = None;
    let mut bytes = 0u64;
    let mut model = String::new();
    for x in s.slices.iter().filter(|x| x.n == 0) {
        bytes += x.raw.len() as u64;
        let v: Value = serde_json::from_str(x.raw).unwrap_or(Value::Null);
        if x.key == "model" {
            model = v.as_str().unwrap_or("").to_string();
        }
        if x.key == "tools" {
            tools = Some(v);
        } else {
            params.insert(x.key.clone(), v);
        }
    }
    let n_tools = tools.as_ref().and_then(Value::as_array).map_or(0, Vec::len);
    let mut blocks = vec![json_block(Some("params"), &Value::Object(params), red)];
    if let Some(t) = &tools {
        blocks.push(json_block(Some(&format!("tools · {n_tools}")), t, red));
    }
    let head = format!("{} · {model} · {n_tools} tools", s.family.word());
    CompRow { n: 0, role: "request".into(), head, blocks, bytes, tokens: bytes.div_ceil(4), parts: Vec::new() }
}

/// The rows of a body: the head, the system prompt, the messages.
pub fn rows(s: &Split, red: &Redactor) -> Vec<CompRow> {
    let mut out = vec![head_row(s, red)];
    for x in s.slices.iter().filter(|x| x.n > 0) {
        out.push(match x.part {
            Part::Key => system_row(x.n, x.raw, red),
            Part::Item => item_row(x.n, s.family, x.raw, red),
        });
    }
    with_parts(out, s, red)
}

/// Each row with its parts ([`groups::parts`]), the same in both views.
fn with_parts(mut rows: Vec<CompRow>, s: &Split, red: &Redactor) -> Vec<CompRow> {
    let mut parts = groups::parts(s, red);
    for r in &mut rows {
        if let Some(p) = parts.get_mut(r.n as usize) {
            r.parts = std::mem::take(p);
        }
    }
    rows
}

/// The rows of each slice as its raw bytes (`r`: the JSON sent, as is),
/// redacted, long base64 strings as a word.
pub fn raw_rows(s: &Split, red: &Redactor) -> Vec<CompRow> {
    let mut out: Vec<CompRow> = Vec::new();
    for x in &s.slices {
        let text = if x.raw.len() > 4000 {
            let mut v: Value = serde_json::from_str(x.raw).unwrap_or(Value::Null);
            shorten_blobs(&mut v);
            v.to_string()
        } else {
            x.raw.to_string()
        };
        let block = CompBlock { label: Some(x.key.clone()), body: cut(LogBodyKind::Code, Some("json"), &text, red) };
        match out.last_mut() {
            Some(r) if r.n == x.n => {
                r.blocks.push(block);
                r.bytes += x.raw.len() as u64;
                r.tokens = r.bytes.div_ceil(4);
            }
            _ => out.push(CompRow {
                n: x.n,
                role: if x.n == 0 { "request".into() } else { x.key.clone() },
                head: format!("{} · {}", x.key, short_bytes(x.raw.len())),
                blocks: vec![block],
                bytes: x.raw.len() as u64,
                tokens: (x.raw.len() as u64).div_ceil(4),
                parts: Vec::new(),
            }),
        }
    }
    with_parts(out, s, red)
}

pub mod groups;

#[cfg(test)]
mod tests;
