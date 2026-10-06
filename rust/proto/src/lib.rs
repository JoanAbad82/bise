//! bise's typed client protocol (bise desktop S3a; architect's review of
//! the desktop plan, decision D, and of the S3a plan, m_8220).
//!
//! One JSON object per line on `hub.sock`, next to the hub's older feed
//! events (`state`, `line`, …) that the TUI keeps reading for now:
//!
//! - [`hub::HubEv`], tagged `"ev"`: what a hub sends a client that said
//!   `{"cmd": "hello", "proto": 1}` (its agents, its cards, a thread's
//!   pages and live entries, an agent's current step, errors);
//! - [`hub::HubCmd`], tagged `"cmd"`: what a client asks a hub (subscribe
//!   to a thread, an older page, send, answer, stop, archive, unarchive).
//!
//! Every event and command carries `project`: the hub's id
//! (`bise_home`'s hub id of the workspace, e.g. `harness-3abb2bd8`), a
//! plain string here so this crate depends on nothing of bise. Positions
//! are transcript line numbers, the `#pos` of `sb inspect`/`sb history`.
//!
//! v1's rule: a name is added, never renamed or retyped. A reader ignores
//! unknown fields, and an unknown tag decodes to `Unknown { tag, raw }`,
//! never an error, so an older client survives a newer hub and the
//! reverse. What has no producer yet lives in [`draft`]: its fixtures
//! are there for the window's fake core, its names may still move until
//! its stream emits it.
//!
//! [`thread::fold`] turns an agent's transcript lines into entries (the
//! hub folds, clients don't). It brings its own copies of the TUI's
//! `markdown::unescape_md` and `wire::split_thinking` (a test in bend-tui
//! checks they agree); the TUI switches to these at the ambient merge
//! into main, and its copies go then.
//!
//! The fixtures (`fixtures/*.jsonl`) are the one source for the Rust
//! tests, the web's fake core (apps/ambient/web) and the Python e2e.

pub mod draft;
pub mod hub;
pub mod rows;
pub mod thread;

use serde::de::DeserializeOwned;
use serde_json::Value;

/// A hub's id (the workspace's), the `project` of every message.
pub type Project = String;
/// A transcript line number: an entry's position (an entry folding several
/// lines has its first line's).
pub type Pos = u64;

/// The protocol's version, said in `hello` both ways.
pub const PROTO: u32 = 1;

/// A tagged message: the known tags decode as `T`, any other as
/// `unknown(tag, raw)`. A missing tag or a known tag with bad fields is an
/// error (a bug of the sender, not a newer version).
pub(crate) fn decode<T: DeserializeOwned>(v: Value, key: &str, tags: &[&str], unknown: impl FnOnce(String, Value) -> T) -> Result<T, String> {
    let tag = v.get(key).and_then(Value::as_str).ok_or_else(|| format!("no \"{key}\""))?.to_string();
    if !tags.contains(&tag.as_str()) {
        return Ok(unknown(tag, v));
    }
    serde_json::from_value(v).map_err(|e| format!("{tag}: {e}"))
}

/// One line as a JSON value.
pub(crate) fn parse(line: &str) -> Result<Value, String> {
    serde_json::from_str(line).map_err(|e| format!("not JSON: {e}"))
}

pub(crate) fn is_false(b: &bool) -> bool {
    !*b
}
