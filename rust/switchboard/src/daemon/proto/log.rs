//! The window's `/log` (`HubCmd::Log`, TP-N2, architect m_17272): a page
//! of an agent's raw session. The rows are `bise_session::history`'s, the
//! TUI's `/log` builder (every text field redacted inside it); here they
//! only become wire rows ([`items`], bodies cut to TOOL_TEXT_CAP) and a
//! page (`bise_proto::log::page`: rows and bytes capped). A cut body
//! reads whole on his 'show more' ([`whole`], `HubCmd::LogBody`, up to
//! `WHOLE_CAP`).

use bise_proto::log::{LogBody, LogBodyKind, LogItem, LogRole, LOG_PAGE_BYTES, LOG_PAGE_ITEMS};
use bise_proto::thread::TOOL_TEXT_CAP;
use bise_session::history::{iso_ms, Body, Item, Role};
use bise_session::history_cache::Caches;
use bise_session::tool_output::cut_to;
use bise_session::{Log, Redactor};
use std::path::Path;

/// The history's rows as the wire's, in the same order.
pub(super) fn items(rows: &[Item], log: &Log) -> Vec<LogItem> {
    rows.iter().map(|it| item(it, log)).collect()
}

fn item(it: &Item, log: &Log) -> LogItem {
    let (role, ok) = match &it.role {
        Role::You => (LogRole::You, None),
        Role::Assistant => (LogRole::Assistant, None),
        Role::Thinking => (LogRole::Thinking, None),
        Role::Call => (LogRole::Call, None),
        Role::Result { ok } => (LogRole::Result, Some(*ok)),
        Role::Message => (LogRole::Message, None),
        Role::Injected => (LogRole::Injected, None),
        Role::System => (LogRole::System, None),
        Role::Tools => (LogRole::Tools, None),
        Role::Summary => (LogRole::Summary, None),
        Role::Error => (LogRole::Error, None),
        Role::Event | Role::Sent(_) => (LogRole::Event, None),
    };
    let body = |kind, lang: Option<&str>, text: &str| {
        let o = cut_to(text, TOOL_TEXT_CAP);
        Some(LogBody { kind, lang: lang.map(str::to_string), text: o.text, cut: o.cut })
    };
    let some = |s: &str| (!s.is_empty()).then(|| s.to_string());
    LogItem {
        seq: it.seq,
        pos: it.pos,
        turn: it.turn,
        at_ms: log.events.get(it.idx).and_then(|e| iso_ms(&e.at)),
        role,
        ok,
        tool: some(&it.tool),
        head: it.head.clone(),
        body: match &it.body {
            Body::None => None,
            Body::Md(t) => body(LogBodyKind::Md, None, t),
            Body::Code { lang, text } => body(LogBodyKind::Code, Some(lang), text),
            Body::Plain(t) => body(LogBodyKind::Plain, None, t),
        },
        rule: it.rule.clone(),
        tokens: it.tokens.map(|(n, _)| n),
        estimated: it.tokens.is_some_and(|(_, e)| e),
        meta: some(&it.meta),
    }
}

/// The hub's history caches (bise_session::history_cache): one per
/// session folder read, at most [`CACHES_MAX`], one not read for
/// [`CACHES_IDLE_MS`] dropped. Owned here: only the `log` read uses them.
static CACHES: std::sync::LazyLock<std::sync::Mutex<Caches>> =
    std::sync::LazyLock::new(|| std::sync::Mutex::new(Caches::new(CACHES_MAX, CACHES_IDLE_MS)));
const CACHES_MAX: usize = 4;
const CACHES_IDLE_MS: u64 = 10 * 60 * 1000;

/// What a `log` read answers: a page, whether older rows remain, and
/// with `find`, the pos of every row that holds it.
pub(super) type Page = (Vec<LogItem>, bool, Option<Vec<u64>>);

/// A page of the session log in `dir` (the agent's current session):
/// the rows with a pos under `before`, and whether older ones remain;
/// with `find`, its hits in the whole history and, without `before`,
/// the page that ends at the newest hit.
pub(super) fn answer(dir: &Path, blobs: &Path, redact: &Redactor, before: Option<u64>, find: Option<&str>) -> Result<Page, String> {
    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_millis() as u64).unwrap_or(0);
    let mut all = CACHES.lock().unwrap_or_else(|e| e.into_inner());
    let c = all.get(dir, blobs, redact, now).map_err(|e| format!("no session log: {e}"))?;
    let hits = find.map(|f| c.find(redact, f));
    let before = match (&hits, before) {
        (Some(h), None) => h.last().map(|p| p + 1),
        _ => before,
    };
    let (rows, more) = c.page(redact, before, LOG_PAGE_ITEMS, LOG_PAGE_BYTES);
    Ok((items(&rows, c.log()), more, hits))
}

/// The body of the row at `pos` in the session log in `dir`, redacted,
/// cut to `max` bytes ('show more' on a body [`items`] cut; debug-more):
/// `(text, cut, total)`, or why there is none.
pub(super) fn whole(dir: &Path, blobs: &Path, redact: &Redactor, pos: u64, max: usize) -> Result<(String, bool, u64), String> {
    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_millis() as u64).unwrap_or(0);
    let mut all = CACHES.lock().unwrap_or_else(|e| e.into_inner());
    let c = all.get(dir, blobs, redact, now).map_err(|e| format!("no session log: {e}"))?;
    body_at(&c.page(redact, Some(pos + 1), 1, 0).0, pos, max)
}

/// The body of the row at `pos` among `rows`, cut to `max` bytes.
fn body_at(rows: &[Item], pos: u64, max: usize) -> Result<(String, bool, u64), String> {
    let it = rows.iter().find(|r| r.pos == pos).ok_or_else(|| format!("no row {pos} in the session log"))?;
    let o = cut_to(it.body.text(), max);
    Ok((o.text, o.cut, o.total as u64))
}

#[cfg(test)]
mod tests {
    use super::*;
    use bise_session::history::{history, Source};
    use serde_json::json;

    /// a session of one turn with `key` in every text the rows show: his
    /// prompt, a call's id (a result's meta), its args, its result, the
    /// reply
    fn planted(dir: &Path, key: &str) {
        let line = |seq: u64, turn: Option<u64>, typ: &str, data: serde_json::Value| {
            let mut v = json!({"seq": seq, "at": format!("2026-10-02T14:02:{:02}.000Z", seq), "type": typ, "v": 1, "data": data});
            if let Some(t) = turn {
                v["turn"] = t.into();
            }
            v.to_string()
        };
        let text = |t: &str| json!([{"kind": "text", "text": t}]);
        let id = format!("call_{key}");
        let lines = [
            line(1, None, "session_start", json!({"session": "s-1", "format": 1, "created_by": "bise", "cwd": "/w"})),
            line(2, Some(1), "turn_started", json!({"cause": "user"})),
            line(3, Some(1), "user_message", json!({"content": text(&format!("use {key} for the api")), "delivery": "prompt"})),
            line(4, Some(1), "assistant_message", json!({"req": 1, "model": "m", "parts": [], "calls": [{"id": id, "name": "bash", "args": format!("curl -H 'auth: {key}' x")}]})),
            line(5, Some(1), "tool_result", json!({"call": id, "ok": true, "content": text(&format!("token {key} ok")), "exit": 0})),
            line(6, Some(1), "assistant_message", json!({"req": 2, "model": "m", "parts": [{"kind": "text", "text": format!("done with {key}")}], "calls": []})),
            line(7, Some(1), "turn_ended", json!({"outcome": "done"})),
        ];
        std::fs::create_dir_all(dir).unwrap();
        std::fs::write(dir.join("events.jsonl"), lines.join("\n") + "\n").unwrap();
    }

    /// Laws (architect m_17272): the window's rows are the TUI's history()
    /// for the same log, field by field (one builder), and a key the
    /// redactor knows is in no text field of either.
    #[test]
    fn the_windows_rows_are_the_tuis_and_a_key_is_in_neither() {
        let tmp = std::env::temp_dir().join(format!("sb-log-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&tmp);
        let key = "sk-test-0123456789abcdefKEY";
        planted(&tmp, key);
        let redact = Redactor::new(vec![("TEST_KEY".into(), key.into())]);
        let log = bise_session::read_dir(&tmp).unwrap();
        let rows = history(&Source { log: &log, blobs: &tmp, redact: &redact });
        let wire = items(&rows, &log);
        assert_eq!(wire.len(), rows.len());
        assert!(rows.len() >= 4, "{rows:?}");
        for (w, r) in wire.iter().zip(&rows) {
            assert_eq!((w.seq, w.turn, &w.head, w.rule.as_ref(), w.tool.as_deref().unwrap_or(""), w.meta.as_deref().unwrap_or("")), (r.seq, r.turn, &r.head, r.rule.as_ref(), r.tool.as_str(), r.meta.as_str()));
            assert_eq!(w.body.as_ref().map_or("", |b| b.text.as_str()), r.body.text());
        }
        let json = serde_json::to_string(&wire).unwrap();
        let tui = format!("{rows:?}");
        assert!(!json.contains(key) && !tui.contains(key), "the key leaked: {json}");
        assert!(json.contains("you") && json.contains("call") && json.contains("result"), "{json}");
        let (p, more, hits) = answer(&tmp, &tmp, &redact, None, Some("done with")).unwrap();
        assert_eq!((p, more), (wire.clone(), false));
        assert_eq!(hits, Some(vec![wire.last().unwrap().pos]));
        let _ = std::fs::remove_dir_all(&tmp);
    }

    /// a session whose one bash call printed `out`
    fn printed(dir: &Path, out: &str) {
        let line = |seq: u64, typ: &str, data: serde_json::Value| json!({"seq": seq, "at": "2026-10-02T14:02:00.000Z", "turn": 1, "type": typ, "v": 1, "data": data}).to_string();
        let lines = [
            json!({"seq": 1, "at": "2026-10-02T14:02:00.000Z", "type": "session_start", "v": 1, "data": {"session": "s-1", "format": 1, "created_by": "bise", "cwd": "/w"}}).to_string(),
            line(2, "turn_started", json!({"cause": "user"})),
            line(3, "assistant_message", json!({"req": 1, "model": "m", "parts": [], "calls": [{"id": "call_1", "name": "bash", "args": "cargo test"}]})),
            line(4, "tool_result", json!({"call": "call_1", "ok": true, "content": [{"kind": "text", "text": out}], "exit": 0})),
            line(5, "turn_ended", json!({"outcome": "done"})),
        ];
        std::fs::create_dir_all(dir).unwrap();
        std::fs::write(dir.join("events.jsonl"), lines.join("\n") + "\n").unwrap();
    }

    /// Law (debug-more, architect m_45981): a row whose body the page
    /// cut at TOOL_TEXT_CAP reads whole through `whole`, the session log's
    /// own text; past WHOLE_CAP cut again, with the whole size.
    #[test]
    fn a_cut_rows_body_reads_whole_up_to_the_whole_cap() {
        use bise_proto::log::WHOLE_CAP;
        let redact = Redactor::new(Vec::new());
        for (name, out, max) in [("10k", "x".repeat(10_000), WHOLE_CAP), ("3m", "y".repeat(3 * 1024 * 1024), WHOLE_CAP)] {
            let tmp = std::env::temp_dir().join(format!("sb-log-whole-{name}-{}", std::process::id()));
            let _ = std::fs::remove_dir_all(&tmp);
            printed(&tmp, &out);
            let (page, _, _) = answer(&tmp, &tmp, &redact, None, None).unwrap();
            let row = page.iter().find(|i| i.body.as_ref().is_some_and(|b| b.cut)).expect("the page cuts the output");
            let (text, cut, total) = whole(&tmp, &tmp, &redact, row.pos, max).unwrap();
            assert_eq!(total, out.len() as u64, "{name}");
            assert_eq!(cut, out.len() > max, "{name}");
            assert_eq!(text, out[..out.len().min(max)], "{name}");
            assert!(whole(&tmp, &tmp, &redact, row.pos + 1_000_000, max).is_err(), "no such row");
            let _ = std::fs::remove_dir_all(&tmp);
        }
    }
}
