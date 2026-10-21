//! The request ring an agent's REPL writes (bend/runtime/reqlog-pure.bend):
//! the exact body of its last [`SLOTS`] model calls, each next to the
//! neutral wire request it was made from, in `agents/<a>/requests/`
//! (the hub names it in `BEND_WIRE_DUMP`). Per slot `n`: `n.json` (the
//! bytes sent), `n.wire`, `n.json.reply` (a raw reply, when kept) and
//! `n.meta` last, one JSON line with the two files' byte lengths. A slot
//! is [`SlotState::Ready`] only when its `.meta` parses and both lengths
//! match the files: else it is being written. The order is the `.meta`'s
//! mtime, never the slot number (a REPL restart counts req from 1 again).
//! Pure reads: no write, no pruning (the ring bounds itself).

use serde::Deserialize;
use std::path::{Path, PathBuf};

/// How many requests the ring keeps (reqlog-pure.bend's `slots()`).
pub const SLOTS: usize = 8;

/// A slot's `.meta` line.
#[derive(Clone, Debug, PartialEq, Eq, Deserialize)]
pub struct Meta {
    pub req: u64,
    /// `turn` (the agent's answer) or `compaction`
    pub kind: String,
    /// the full model id, `provider/model`
    pub model: String,
    #[serde(rename = "try")]
    pub tries: u64,
    /// the call's id (its start, the REPL's clock)
    pub call: u64,
    pub json_len: u64,
    pub wire_len: u64,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum SlotState {
    Ready(Meta),
    /// no `.meta` yet, or a length that does not match: mid-write
    Writing,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Slot {
    pub n: usize,
    /// when its `.meta` was written (ms since the epoch)
    pub at_ms: u64,
    pub state: SlotState,
    pub json: PathBuf,
    pub wire: PathBuf,
    pub reply: PathBuf,
}

impl Slot {
    pub fn meta(&self) -> Option<&Meta> {
        match &self.state {
            SlotState::Ready(m) => Some(m),
            SlotState::Writing => None,
        }
    }
}

fn mtime_ms(p: &Path) -> Option<u64> {
    let t = std::fs::metadata(p).ok()?.modified().ok()?;
    Some(t.duration_since(std::time::UNIX_EPOCH).ok()?.as_millis() as u64)
}

fn len(p: &Path) -> Option<u64> {
    std::fs::metadata(p).ok().map(|m| m.len())
}

/// The state of a slot from its `.meta` text and the two files' lengths.
pub fn state_of(meta: &str, json_len: Option<u64>, wire_len: Option<u64>) -> SlotState {
    match serde_json::from_str::<Meta>(meta.trim()) {
        Ok(m) if Some(m.json_len) == json_len && Some(m.wire_len) == wire_len => SlotState::Ready(m),
        _ => SlotState::Writing,
    }
}

/// The slots in `dir` that have a `.meta` (even empty), oldest first.
pub fn slots(dir: &Path) -> Vec<Slot> {
    let mut v: Vec<Slot> = (0..SLOTS)
        .filter_map(|n| {
            let meta = dir.join(format!("{n}.meta"));
            let at_ms = mtime_ms(&meta)?;
            let json = dir.join(format!("{n}.json"));
            let wire = dir.join(format!("{n}.wire"));
            let text = std::fs::read_to_string(&meta).unwrap_or_default();
            let state = state_of(&text, len(&json), len(&wire));
            Some(Slot { n, at_ms, state, reply: dir.join(format!("{n}.json.reply")), json, wire })
        })
        .collect();
    v.sort_by_key(|s| (s.at_ms, s.n));
    v
}

/// The slot of the call `req` answered at `reply_ms`: the newest ready
/// one with that req, written before the answer. None: older than the
/// ring (the last [`SLOTS`] only), or never written.
pub fn for_request(slots: &[Slot], req: u64, reply_ms: u64) -> Option<&Slot> {
    slots.iter().rev().find(|s| s.meta().is_some_and(|m| m.req == req) && s.at_ms <= reply_ms)
}

/// A ready slot's body, the bytes sent; an error when it changed since
/// its `.meta` (the next call took the slot) or cannot be read.
pub fn body(s: &Slot) -> Result<String, String> {
    let m = s.meta().ok_or("being written")?;
    let raw = std::fs::read(&s.json).map_err(|e| format!("{}: {e}", s.json.display()))?;
    if raw.len() as u64 != m.json_len {
        return Err("being written".into());
    }
    String::from_utf8(raw).map_err(|_| "not UTF-8".into())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tmp(name: &str) -> PathBuf {
        let d = std::env::temp_dir().join(format!("reqlog-{name}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        std::fs::create_dir_all(&d).unwrap();
        d
    }

    fn meta(req: u64, json: &str, wire: &str) -> String {
        format!(
            "{{\"req\":{req},\"kind\":\"turn\",\"model\":\"fake/m\",\"try\":0,\"call\":7,\"json_len\":{},\"wire_len\":{}}}\n",
            json.len(),
            wire.len()
        )
    }

    fn put(d: &Path, n: usize, req: u64, json: &str, wire: &str) {
        std::fs::write(d.join(format!("{n}.json")), json).unwrap();
        std::fs::write(d.join(format!("{n}.wire")), wire).unwrap();
        std::fs::write(d.join(format!("{n}.meta")), meta(req, json, wire)).unwrap();
    }

    /// Law (architect m_34601): a slot is read only when its .meta is
    /// there and both lengths match; an empty .meta (the writer's first
    /// step) or a body of another length is "being written".
    #[test]
    fn a_slot_is_ready_only_when_its_lengths_match() {
        let j = r#"{"messages":[{"role":"user","content":"é"}]}"#;
        assert!(matches!(state_of(&meta(3, j, "MSG"), Some(j.len() as u64), Some(3)), SlotState::Ready(m) if m.req == 3));
        assert_eq!(state_of("", Some(10), Some(3)), SlotState::Writing);
        assert_eq!(state_of(&meta(3, j, "MSG"), Some(j.len() as u64 - 1), Some(3)), SlotState::Writing);
        assert_eq!(state_of(&meta(3, j, "MSG"), Some(j.len() as u64), None), SlotState::Writing);
    }

    #[test]
    fn slots_read_in_write_order_and_a_request_finds_its_own() {
        let d = tmp("order");
        put(&d, 5, 5, r#"{"a":5}"#, "W5");
        std::thread::sleep(std::time::Duration::from_millis(15));
        put(&d, 2, 2, r#"{"a":2}"#, "W2");
        std::fs::write(d.join("3.meta"), "").unwrap();
        let s = slots(&d);
        assert_eq!(s.iter().map(|s| s.n).collect::<Vec<_>>(), vec![5, 2, 3]);
        assert_eq!(s[2].state, SlotState::Writing);
        let far = s[1].at_ms + 1000;
        assert_eq!(for_request(&s, 2, far).map(|s| s.n), Some(2));
        assert_eq!(body(for_request(&s, 2, far).unwrap()).unwrap(), r#"{"a":2}"#);
        // req 9 is older than the ring; req 2 answered before its slot was written is not it
        assert!(for_request(&s, 9, far).is_none());
        assert!(for_request(&s, 2, s[1].at_ms - 1).is_none());
        // the next call took the slot: its body changed under the meta
        std::fs::write(d.join("2.json"), r#"{"a":22}"#).unwrap();
        assert_eq!(body(&s[1]), Err("being written".into()));
        let _ = std::fs::remove_dir_all(&d);
    }
}
