//! The request ring an agent's REPL writes (bend/runtime/reqlog-pure.bend):
//! the exact body of its last [`SLOTS`] model calls, each next to the
//! neutral wire request it was made from, in `agents/<a>/requests/`
//! (the hub names it in `BEND_WIRE_DUMP`). Per slot `n`: `n.json` (the
//! bytes sent), `n.wire`, `n.json.reply` (a raw reply, when kept) and
//! `n.meta` last, one JSON line with the two files' byte lengths. A slot
//! is [`SlotState::Ready`] only when its `.meta` parses and both lengths
//! match the files: else it is being written. The order is the `.meta`'s
//! mtime, never the slot number (a REPL restart counts req from 1 again).
//! An image's base64 is a file part in the `.json` (NUL
//! `bend-file:<size>:<path>` NUL, vendor/http/http.bend's `file_part`):
//! [`body`] and [`expand`] put the file back, read only inside the image
//! store, so the body read is the bytes sent (a gone or changed file is
//! a word the view shows).
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

/// A ready slot's body, the bytes sent (its image parts put back by
/// [`expand`] from `store`, the image store); an error when it changed
/// since its `.meta` (the next call took the slot) or cannot be read.
pub fn body(s: &Slot, store: &Path) -> Result<String, String> {
    let m = s.meta().ok_or("being written")?;
    let raw = std::fs::read(&s.json).map_err(|e| format!("{}: {e}", s.json.display()))?;
    if raw.len() as u64 != m.json_len {
        return Err("being written".into());
    }
    let text = String::from_utf8(raw).map_err(|_| "not UTF-8".to_string())?;
    expand(&text, store).map_err(|e| format!("the request in slot {}: {e}", s.n))
}

/// What the runtime writes in place of an image's base64
/// (vendor/http/http.bend's `file_part`): NUL `bend-file:<size>:<path>`
/// NUL. Its HTTP client sends the file's bytes there; the ring and the
/// render mode keep the part (reqlog-pure.bend's slot format).
const FILE_MARK: &str = "bend-file:";

/// What an image part that cannot be put back reads as: a word the
/// view shows, never base64 (`completion`'s image rows).
fn not_put_back(why: &str) -> String {
    format!("[image {why}]")
}

/// The bytes sent for one file part: the `.b64` file when its real path
/// is in the image store (the ring sits in the agent's own folder: a
/// path it names is never read outside the store), it has the size sent
/// and holds base64 only; else what [`not_put_back`] says.
fn file_part(path: &Path, size: u64, store: Option<&Path>) -> String {
    let Ok(real) = std::fs::canonicalize(path) else { return not_put_back("gone") };
    if !store.is_some_and(|s| real.starts_with(s)) || real.extension().and_then(|e| e.to_str()) != Some("b64") {
        return not_put_back("not in the image store");
    }
    match std::fs::read(&real) {
        Ok(b) if b.len() as u64 != size => not_put_back(&format!(
            "changed: {} sent, {} now",
            crate::history::short_bytes(size as usize),
            crate::history::short_bytes(b.len())
        )),
        Ok(b) if b.iter().all(|c| c.is_ascii_alphanumeric() || b"+/=".contains(c)) => String::from_utf8(b).unwrap_or_default(),
        Ok(_) => not_put_back("not base64"),
        Err(_) => not_put_back("gone"),
    }
}

/// A body as written (the ring's `.json`, the render's output) to the
/// bytes sent: each image file part replaced by its file (see
/// [`file_part`]). A body without a NUL is returned as is; a NUL that
/// opens no well-formed part is an error.
pub fn expand(text: &str, store: &Path) -> Result<String, String> {
    if !text.contains('\0') {
        return Ok(text.to_string());
    }
    let store = std::fs::canonicalize(store).ok();
    let segs: Vec<&str> = text.split('\0').collect();
    if segs.len().is_multiple_of(2) {
        return Err("an image part with no end".into());
    }
    let mut out = String::with_capacity(text.len());
    for (i, seg) in segs.iter().enumerate() {
        if i % 2 == 0 {
            out.push_str(seg);
            continue;
        }
        let part = seg.strip_prefix(FILE_MARK).ok_or("a NUL that opens no image part")?;
        let (size, path) = part.split_once(':').ok_or("an image part with no size")?;
        let size: u64 = size.parse().map_err(|_| format!("an image part with a bad size: {size:?}"))?;
        out.push_str(&file_part(Path::new(path), size, store.as_deref()));
    }
    Ok(out)
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

    /// A body the real runtime wrote (repl-live's render mode on a wire
    /// with an image and a tool output holding ESC, NUL and US, the
    /// image store at `store/`): its image is a file part, raw NULs.
    const IMAGE_SLOT: &str = include_str!("reqlog/image_slot.json");
    const SHOT_B64: &str = include_str!("reqlog/shot.b64");

    /// The fixture's body with its store at `store` (the part names the
    /// runtime's `store/shot.b64`; only that path changes).
    fn image_body(store: &Path) -> String {
        IMAGE_SLOT.replace(":store/shot.b64", &format!(":{}", store.join("shot.b64").display()))
    }

    /// The bug (debug-parse): /debug completion read the ring's .json as
    /// is and died on its first image ("control character found while
    /// parsing a string"). Read back, it is the bytes sent: JSON, the
    /// file's base64 where the part was, the tool output's control
    /// characters escaped as the runtime sent them.
    #[test]
    fn a_body_with_an_image_reads_back_as_the_bytes_sent() {
        let d = tmp("image");
        let store = d.join("images");
        std::fs::create_dir_all(&store).unwrap();
        std::fs::write(store.join("shot.b64"), SHOT_B64).unwrap();
        let body = image_body(&store);
        put(&d, 4, 9, &body, "W");
        let got = body_of(&slots(&d)[0], &store).unwrap();
        let v: serde_json::Value = serde_json::from_str(&got).unwrap();
        assert_eq!(v.pointer("/messages/0/content/2/source/data").and_then(|x| x.as_str()), Some(SHOT_B64));
        let out = v.pointer("/messages/2/content/0/content").and_then(|x| x.as_str()).unwrap();
        assert_eq!(out, "tput \u{1b}[31mred\u{1b}[0m nul\u{0} us\u{1f}");
        assert!(crate::completion::split(&got).is_ok());
        let _ = std::fs::remove_dir_all(&d);
    }

    fn body_of(s: &Slot, store: &Path) -> Result<String, String> {
        body(s, store)
    }

    fn data_of(body: &str) -> String {
        let v: serde_json::Value = serde_json::from_str(body).unwrap();
        v.pointer("/messages/0/content/2/source/data").and_then(|x| x.as_str()).unwrap().to_string()
    }

    /// Architect m_41721: a part is read only inside the image store
    /// (the agent can write its ring); a gone or changed file is said,
    /// never silent; a malformed part is an error that names the slot.
    #[test]
    fn an_image_part_is_read_only_from_the_store_and_only_as_sent() {
        let d = tmp("image-guard");
        let (store, out) = (d.join("images"), d.join("elsewhere"));
        std::fs::create_dir_all(&store).unwrap();
        std::fs::create_dir_all(&out).unwrap();
        std::fs::write(out.join("shot.b64"), SHOT_B64).unwrap();
        assert_eq!(data_of(&expand(&image_body(&out), &store).unwrap()), "[image not in the image store]");
        assert_eq!(data_of(&expand(&image_body(&store), &store).unwrap()), "[image gone]");
        std::fs::write(store.join("shot.b64"), "QUJD").unwrap();
        assert_eq!(data_of(&expand(&image_body(&store), &store).unwrap()), "[image changed: 92 B sent, 4 B now]");
        std::fs::write(store.join("shot.b64"), "\"".repeat(SHOT_B64.len())).unwrap();
        assert_eq!(data_of(&expand(&image_body(&store), &store).unwrap()), "[image not base64]");
        let cut = IMAGE_SLOT.replacen("store/shot.b64\0", "store/shot.b64", 1);
        put(&d, 6, 3, &cut, "W");
        let e = body_of(&slots(&d)[0], &store).unwrap_err();
        assert_eq!(e, "the request in slot 6: an image part with no end");
        assert!(expand("{\"a\":\"\0x\0\"}", &store).unwrap_err().contains("opens no image part"));
        let _ = std::fs::remove_dir_all(&d);
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
        assert_eq!(body(for_request(&s, 2, far).unwrap(), &d).unwrap(), r#"{"a":2}"#);
        // req 9 is older than the ring; req 2 answered before its slot was written is not it
        assert!(for_request(&s, 9, far).is_none());
        assert!(for_request(&s, 2, s[1].at_ms - 1).is_none());
        // the next call took the slot: its body changed under the meta
        std::fs::write(d.join("2.json"), r#"{"a":22}"#).unwrap();
        assert_eq!(body(&s[1], &d), Err("being written".into()));
        let _ = std::fs::remove_dir_all(&d);
    }
}
