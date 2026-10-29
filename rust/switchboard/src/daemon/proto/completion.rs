//! `/debug completion` (`HubCmd::Completion`, debug-cmd, architect
//! m_34601): a request of the agent's ring (`bise_session::reqlog`), the
//! body as its provider got it, cut into rows by
//! `bise_session::completion` (every text redacted there). With a
//! provider: the same request as that provider's family would get it,
//! made by the agent's own runtime (`repl-live` in render mode,
//! BISE_RENDER: Pv.request_body, no call, no key), never by an encoder
//! here. A block cut at 4 KB reads whole on his 'show more' ([`block`]:
//! the same slot, provider and raw, never another request's body). Pure
//! but [`render`], the one process it runs.

use bise_proto::log::{CompRow, CompSlot, Completion, CompletionAsk};
use bise_session::{completion, reqlog, Redactor};
use std::path::Path;

/// A slot as the wire lists it.
pub(super) fn slot_row(s: &reqlog::Slot) -> CompSlot {
    let m = s.meta();
    CompSlot {
        slot: s.n as u64,
        req: m.map_or(0, |m| m.req),
        kind: m.map_or(String::new(), |m| m.kind.clone()),
        model: m.map_or(String::new(), |m| m.model.clone()),
        at_ms: s.at_ms,
        writing: m.is_none(),
    }
}

/// The slot to show: `want` (a slot number), else the newest ready one.
pub(super) fn pick(slots: &[reqlog::Slot], want: Option<u64>) -> Result<&reqlog::Slot, String> {
    match want {
        Some(n) => slots.iter().find(|s| s.n as u64 == n).ok_or_else(|| format!("no request in slot {n} (the last {} only)", reqlog::SLOTS)),
        None => slots.iter().rev().find(|s| s.meta().is_some()).ok_or_else(|| "no request kept yet: the agent has not called its model since its start".into()),
    }
}

/// The model a `provider` word names: a full `provider/model` as is,
/// else the first of `models` (the catalog's ids) of that provider.
pub(super) fn model_for(asked: &str, models: &[String]) -> Result<String, String> {
    let a = asked.trim();
    if a.contains('/') {
        return Ok(a.to_string());
    }
    models.iter().find(|m| m.split('/').next() == Some(a)).cloned().ok_or_else(|| format!("no provider {a} in the catalog"))
}

/// The provider part of a full model id.
fn provider_of(model: &str) -> &str {
    model.split('/').next().unwrap_or(model)
}

/// The `n` of every row that holds `needle` (any case).
pub(super) fn hits(rows: &[CompRow], needle: &str) -> Vec<u64> {
    let n = needle.trim().to_lowercase();
    if n.is_empty() {
        return Vec::new();
    }
    let has = |s: &str| s.to_lowercase().contains(&n);
    rows.iter()
        .filter(|r| has(&r.head) || has(&r.role) || r.blocks.iter().any(|b| has(&b.body.text) || b.label.as_deref().is_some_and(has)))
        .map(|r| r.n)
        .collect()
}

/// The answer to `ask` from the ring in `req_dir`; `models`: the
/// catalog's ids; `render(wire, model)`: the body the runtime makes of a
/// slot's `.wire` for `model`; `store`: the image store, where both
/// bodies' image parts are read back (`reqlog::expand`).
pub(super) fn answer(
    ask: &CompletionAsk,
    req_dir: &Path,
    store: &Path,
    models: &[String],
    render: &dyn Fn(&Path, &str) -> Result<String, String>,
    redact: &Redactor,
) -> Result<Completion, String> {
    let slots = reqlog::slots(req_dir);
    let s = pick(&slots, ask.slot)?;
    let (body, shown_as) = body_of(s, ask.provider.as_deref(), store, models, render)?;
    let split = completion::split(&body)?;
    let rows = if ask.raw { completion::raw_rows(&split, redact) } else { completion::rows(&split, redact) };
    let hits = ask.find.as_deref().map(|f| hits(&rows, f));
    Ok(Completion {
        project: ask.project.clone(),
        agent: ask.agent.clone(),
        slot: slot_row(s),
        family: split.family.word().into(),
        shown_as,
        bytes: body.len() as u64,
        rows,
        slots: slots.iter().map(slot_row).collect(),
        hits,
    })
}

/// Slot `s`'s body as sent, or as `provider`'s family would get it (the
/// model it was rendered for, then).
fn body_of(
    s: &reqlog::Slot,
    provider: Option<&str>,
    store: &Path,
    models: &[String],
    render: &dyn Fn(&Path, &str) -> Result<String, String>,
) -> Result<(String, Option<String>), String> {
    let sent = s.meta().map(|m| m.model.clone()).ok_or("this request is being written: open it again in a moment")?;
    Ok(match provider.filter(|p| !p.trim().is_empty()) {
        Some(p) => {
            let model = model_for(p, models)?;
            if model == sent || (!p.contains('/') && provider_of(&sent) == p.trim()) {
                (reqlog::body(s, store)?, None)
            } else {
                (reqlog::expand(&render(&s.wire, &model)?, store)?, Some(model))
            }
        }
        None => (reqlog::body(s, store)?, None),
    })
}

/// What a 'show more' names in the ring (`BodyOf::Block`'s fields).
pub(super) struct BlockAsk<'a> {
    pub slot: u64,
    pub req: u64,
    pub provider: Option<&'a str>,
    pub raw: bool,
    pub row: u64,
    pub block: u64,
}

/// The words when the slot holds another request now (the ring's
/// oldest written over since he opened it).
pub(super) const GONE: &str = "this request is gone from the ring: a newer one took its slot";

/// One block of the rows [`answer`] drew for the same slot, provider and
/// raw (`bise_session::completion::block`: the same list), whole up to
/// `max` bytes: `(text, cut, total)`; the slot written over since: [`GONE`].
pub(super) fn block(
    ask: &BlockAsk,
    req_dir: &Path,
    store: &Path,
    models: &[String],
    render: &dyn Fn(&Path, &str) -> Result<String, String>,
    redact: &Redactor,
    max: usize,
) -> Result<(String, bool, u64), String> {
    let slots = reqlog::slots(req_dir);
    let s = slots.iter().find(|s| s.n as u64 == ask.slot && s.meta().is_some_and(|m| m.req == ask.req)).ok_or(GONE)?;
    let (body, _) = body_of(s, ask.provider, store, models, render)?;
    let split = completion::split(&body)?;
    let o = completion::block(&split, redact, ask.raw, ask.row, ask.block as usize, max).ok_or_else(|| format!("no block {} in row {}", ask.block, ask.row))?;
    Ok((o.text, o.cut, o.total as u64))
}

/// The longest a render may take (a body of a few MB in Bend).
const RENDER_TIMEOUT: std::time::Duration = std::time::Duration::from_secs(30);

/// The body `repl` (the agents' runtime) makes of `wire` for `model`:
/// its render mode writes it to a file beside, prints RENDER_OK, or
/// RENDER_ERR and why. `keys`: the REPLs' spawn env (the models file);
/// no call is made, no key is read.
pub(super) fn render(repl: &Path, root: &Path, wire: &Path, model: &str, keys: &[(String, Option<String>)]) -> Result<String, String> {
    let out = wire.with_extension(format!("render-{}.json", std::process::id()));
    let mut env = bise_home::env::for_child(bise_home::env::Child::Repl, [("BISE_RENDER", wire.as_os_str()), ("BISE_RENDER_OUT", out.as_os_str())]);
    for (k, v) in keys {
        match v {
            Some(v) => env.set(k, v),
            None => env.unset(k),
        };
    }
    env.set("BISE_MODEL", model).unset("BISE_AGENT_MODEL").unset("BEND_MODEL").unset("BEND_WIRE_DUMP");
    let mut cmd = std::process::Command::new(repl);
    env.apply(&mut cmd);
    let mut child = cmd
        .current_dir(root)
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::null())
        .spawn()
        .map_err(|e| format!("cannot start {}: {e}", repl.display()))?;
    let start = std::time::Instant::now();
    loop {
        match child.try_wait() {
            Ok(Some(_)) => break,
            Ok(None) if start.elapsed() < RENDER_TIMEOUT => std::thread::sleep(std::time::Duration::from_millis(20)),
            _ => {
                let _ = child.kill();
                let _ = child.wait();
                return Err(format!("the render took more than {} s", RENDER_TIMEOUT.as_secs()));
            }
        }
    }
    let mut said = String::new();
    if let Some(mut o) = child.stdout.take() {
        let _ = std::io::Read::read_to_string(&mut o, &mut said);
    }
    let last = said.lines().last().unwrap_or("").trim().to_string();
    let got = if last == "RENDER_OK" {
        std::fs::read_to_string(&out).map_err(|e| format!("the render wrote nothing: {e}"))
    } else {
        Err(last.strip_prefix("RENDER_ERR ").map(str::to_string).unwrap_or_else(|| format!("the render failed: {last}")))
    };
    let _ = std::fs::remove_file(&out);
    got
}

#[cfg(test)]
mod tests {
    use super::*;

    fn put(d: &Path, n: usize, req: u64, model: &str, json: &str) {
        std::fs::write(d.join(format!("{n}.json")), json).unwrap();
        std::fs::write(d.join(format!("{n}.wire")), "MODEL x").unwrap();
        let meta = format!(
            "{{\"req\":{req},\"kind\":\"turn\",\"model\":\"{model}\",\"try\":0,\"call\":1,\"json_len\":{},\"wire_len\":7}}\n",
            json.len()
        );
        std::fs::write(d.join(format!("{n}.meta")), meta).unwrap();
    }

    /// The newest request as sent; another family's through the render
    /// (never here); its own provider named: as sent, no render; rows,
    /// hits and the slots listed; a key in no row.
    #[test]
    fn a_request_as_sent_or_as_another_provider_would_get_it() {
        let d = std::env::temp_dir().join(format!("sb-comp-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        std::fs::create_dir_all(&d).unwrap();
        let key = "sk-test-0123456789abcdefKEY";
        let anth = format!(r#"{{"model":"claude-x","system":"s {key}","messages":[{{"role":"user","content":"bench the hero"}}]}}"#);
        put(&d, 2, 2, "fake/claude-x", &anth);
        let red = Redactor::new(vec![("K".into(), key.into())]);
        let ask = |provider: Option<&str>| CompletionAsk {
            project: "p".into(),
            agent: "perf".into(),
            slot: None,
            provider: provider.map(str::to_string),
            raw: false,
            find: Some("HERO".into()),
        };
        let models = vec!["fake/claude-x".to_string(), "oai/gpt-x".to_string()];
        let rendered = std::cell::RefCell::new(Vec::new());
        let render = |w: &Path, m: &str| {
            rendered.borrow_mut().push((w.to_path_buf(), m.to_string()));
            Ok(r#"{"model":"gpt-x","messages":[{"role":"system","content":"s"},{"role":"user","content":"bench the hero"}]}"#.to_string())
        };
        let c = answer(&ask(None), &d, &d, &models, &render, &red).unwrap();
        assert_eq!((c.family.as_str(), c.shown_as.clone(), c.slot.req), ("anthropic", None, 2));
        assert_eq!(c.hits, Some(vec![2]));
        assert!(!serde_json::to_string(&c).unwrap().contains(key));
        let same = answer(&ask(Some("fake")), &d, &d, &models, &render, &red).unwrap();
        assert_eq!((same.shown_as, rendered.borrow().len()), (None, 0), "its own provider: as sent");
        let other = answer(&ask(Some("oai")), &d, &d, &models, &render, &red).unwrap();
        assert_eq!((other.family.as_str(), other.shown_as.as_deref()), ("openai-chat", Some("oai/gpt-x")));
        assert_eq!(rendered.borrow()[0], (d.join("2.wire"), "oai/gpt-x".to_string()));
        assert!(answer(&ask(Some("nowhere")), &d, &d, &models, &render, &red).is_err());
        assert_eq!(c.slots.len(), 1);
        let _ = std::fs::remove_dir_all(&d);
    }

    /// Law (debug-more, architect m_45986): a block's whole text is the
    /// block of the list `answer` drew (raw and rendered), uncut up to the
    /// cap and cut past it; a slot holding another request since: gone.
    #[test]
    fn a_blocks_whole_text_is_the_drawn_blocks_or_gone() {
        let d = std::env::temp_dir().join(format!("sb-comp-whole-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        std::fs::create_dir_all(&d).unwrap();
        let long = "ab ".repeat(4000);
        let body = format!(r#"{{"model":"claude-x","system":"s","messages":[{{"role":"user","content":"{long}"}}]}}"#);
        put(&d, 2, 7, "fake/claude-x", &body);
        let red = Redactor::new(Vec::new());
        let models = vec!["fake/claude-x".to_string(), "oai/gpt-x".to_string()];
        let rendered = format!(r#"{{"model":"gpt-x","messages":[{{"role":"system","content":"s"}},{{"role":"user","content":"{long}"}}]}}"#);
        let render = |_: &Path, _: &str| Ok(rendered.clone());
        for (provider, raw) in [(None, false), (None, true), (Some("oai"), false)] {
            let ask = CompletionAsk { project: "p".into(), agent: "perf".into(), slot: Some(2), provider: provider.map(str::to_string), raw, find: None };
            let drawn = answer(&ask, &d, &d, &models, &render, &red).unwrap();
            let (row, i, b) = drawn.rows.iter().find_map(|r| r.blocks.iter().position(|b| b.body.cut).map(|i| (r.n, i, &r.blocks[i]))).expect("a cut block");
            let at = |max| block(&BlockAsk { slot: 2, req: 7, provider, raw, row, block: i as u64 }, &d, &d, &models, &render, &red, max);
            let (text, cut, total) = at(bise_proto::log::WHOLE_CAP).unwrap();
            assert!(!cut && text.len() as u64 == total && text.starts_with(&b.body.text) && text.len() > b.body.text.len(), "{provider:?} {raw}");
            assert!(text.contains(long.trim_end()), "{provider:?} {raw}: the whole message");
            let (small, cut, total2) = at(5000).unwrap();
            assert_eq!((small.len(), cut, total2), (5000, true, total), "{provider:?} {raw}");
        }
        let gone = block(&BlockAsk { slot: 2, req: 6, provider: None, raw: false, row: 0, block: 0 }, &d, &d, &models, &render, &red, 10);
        assert_eq!(gone.unwrap_err(), GONE);
        let _ = std::fs::remove_dir_all(&d);
    }

    #[test]
    fn no_request_yet_says_so() {
        assert!(pick(&[], None).unwrap_err().contains("no request kept yet"));
        assert!(pick(&[], Some(3)).unwrap_err().contains("the last 8 only"));
    }
}
