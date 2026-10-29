//! `POST /api/a/<id>/save` (page xlsx-univer, architect m_37322,
//! m_37328, m_37387): his edits in the viewer's grid (kit/office/sheet.js)
//! saved as the file and the artifact's next version. The body is one
//! JSON line `{base, rev, session, seq, force}` then the file's bytes.
//!
//! The page thread parses and waits; the hub's loop (the artifact store's
//! only writer, daemon/art.rs `art_save`) decides with [`decide`], writes
//! the file and adds the version, and answers through [`Reply`]. A loop
//! slower than [`WAIT`] gives a 503 the viewer retries: the same `(session,
//! seq)` again answers the version it made, never a second one.
//!
//! Answers: 200 `{v, rev}`; 409 `{v, rev, error}` a version came in since
//! `base` (or `disk: true`, the file changed on disk since the newest
//! version); 410 the file's folder is gone; 503 the hub did not answer
//! in time.

use super::super::server::Response;
use super::super::{PageMsg, Pages};
use crate::artifacts::Version;
use serde::Deserialize;
use serde_json::{json, Value};
use std::sync::mpsc::{channel, Sender};
use std::time::Duration;

/// How long the page thread waits for the hub's answer.
pub const WAIT: Duration = Duration::from_secs(5);

/// His save, as the viewer sends it.
#[derive(Clone, Debug, PartialEq, Deserialize)]
pub struct SaveReq {
    /// The version his edits started from, and its rev.
    pub base: u64,
    #[serde(default = "one")]
    pub rev: u32,
    /// The viewer's edit session, and this save's number in it (from 1).
    pub session: String,
    pub seq: u64,
    /// `keep mine` after a 409 for a file changed on disk: write over it.
    #[serde(default)]
    pub force: bool,
    #[serde(skip)]
    pub bytes: Vec<u8>,
}

fn one() -> u32 {
    1
}

/// The body: a JSON line, then the bytes.
pub fn parse(body: &[u8]) -> Result<SaveReq, String> {
    let nl = body.iter().position(|&b| b == b'\n').ok_or("no header line")?;
    let mut req: SaveReq = serde_json::from_slice(&body[..nl]).map_err(|e| format!("the header: {e}"))?;
    if req.session.is_empty() || req.session.len() > 64 {
        return Err("no session".into());
    }
    req.bytes = body[nl + 1..].to_vec();
    if !req.bytes.starts_with(b"PK") {
        return Err("not an xlsx".into());
    }
    Ok(req)
}

/// What the hub does with a save.
#[derive(Clone, Debug, PartialEq)]
pub enum Decision {
    /// write the file, add the version
    Write,
    /// this save (or a later one of the sitting) is in already: its version
    Already { v: u64, rev: u32 },
    /// a version came in since his base
    Stale { v: u64, rev: u32 },
    /// the file on disk is not the newest version's copy (an agent wrote it)
    Disk { v: u64, rev: u32 },
}

/// The rule, pure. His own sitting's newest version is never a conflict
/// (a 503 then a retry, or a save after a slow one); another version since
/// his base is; and unless he said `keep mine`, so is a file on disk that
/// is not the newest version's copy (`disk_same`, read only when needed).
pub fn decide(latest: Option<&Version>, req: &SaveReq, disk_same: impl FnOnce() -> bool) -> Decision {
    let Some(l) = latest else { return Decision::Write };
    let (v, rev) = (l.v, l.rev());
    match &l.sitting {
        Some(s) if s.by == "you" && s.session == req.session => {
            if req.seq <= s.seq {
                return Decision::Already { v, rev };
            }
        }
        _ => {
            if req.base != v || req.rev != rev {
                return Decision::Stale { v, rev };
            }
        }
    }
    if !req.force && !disk_same() {
        return Decision::Disk { v, rev };
    }
    Decision::Write
}

/// The hub's answer, back to the waiting page thread: (status, body).
pub struct Reply(pub Sender<(u16, Value)>);

impl Reply {
    pub fn send(self, status: u16, body: Value) {
        let _ = self.0.send((status, body));
    }
}

impl std::fmt::Debug for Reply {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("Reply")
    }
}

/// Two messages are equal on what they carry; a reply channel is no fact.
impl PartialEq for Reply {
    fn eq(&self, _: &Reply) -> bool {
        true
    }
}

/// The route: parsed here, decided and written by the hub.
pub fn post(pages: &Pages, id: &str, body: &[u8]) -> Response {
    let req = match parse(body) {
        Ok(r) => r,
        Err(e) => return Response::err(400, &e),
    };
    let (tx, rx) = channel();
    pages.tell_hub(PageMsg::Save { id: id.to_string(), req, reply: Reply(tx) });
    match rx.recv_timeout(WAIT) {
        Ok((status, v)) => Response::json(status, &v),
        Err(_) => Response::json(503, &json!({"error": "bise is busy: trying again"})),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::artifacts_turns::Sitting;

    fn req(base: u64, rev: u32, session: &str, seq: u64) -> SaveReq {
        SaveReq { base, rev, session: session.into(), seq, force: false, bytes: b"PK".to_vec() }
    }

    fn version(v: u64, revs: u32, sitting: Option<(&str, u64)>) -> Version {
        Version {
            v,
            revs: (1..=revs).map(|r| crate::artifacts_turns::Rev { rev: r, at_ms: 0, changed: None }).collect(),
            sitting: sitting.map(|(s, seq)| Sitting { by: "you".into(), session: s.into(), seq }),
            ..Default::default()
        }
    }

    #[test]
    fn the_body_is_a_header_line_then_the_bytes() {
        let r = parse(b"{\"base\":3,\"rev\":2,\"session\":\"s1\",\"seq\":1}\nPK\x03\x04rest").unwrap();
        assert_eq!((r.base, r.rev, r.session.as_str(), r.seq, r.force, r.bytes.as_slice()), (3, 2, "s1", 1, false, &b"PK\x03\x04rest"[..]));
        assert!(parse(b"PK").is_err(), "no header");
        assert!(parse(b"{\"base\":1,\"session\":\"s\",\"seq\":1}\nhello").is_err(), "not a zip");
        assert!(parse(b"{\"base\":1,\"session\":\"\",\"seq\":1}\nPK").is_err(), "no session");
    }

    /// The law: his base is the newest version, or the newest is his own
    /// sitting; a save of the sitting already in answers its version.
    #[test]
    fn a_save_writes_only_on_the_newest_version_or_his_own_sitting() {
        let same = || true;
        let agents = version(3, 2, None);
        assert_eq!(decide(Some(&agents), &req(3, 2, "s1", 1), same), Decision::Write);
        assert_eq!(decide(Some(&agents), &req(2, 1, "s1", 1), same), Decision::Stale { v: 3, rev: 2 }, "a version came in");
        assert_eq!(decide(Some(&agents), &req(3, 1, "s1", 1), same), Decision::Stale { v: 3, rev: 2 }, "the agent saved again in its turn");
        let his = version(4, 3, Some(("s1", 3)));
        assert_eq!(decide(Some(&his), &req(4, 2, "s1", 4), same), Decision::Write, "his own sitting: a stale rev is no conflict (503 then retry)");
        assert_eq!(decide(Some(&his), &req(4, 2, "s1", 3), same), Decision::Already { v: 4, rev: 3 }, "a retry of a save that landed");
        assert_eq!(decide(Some(&his), &req(4, 3, "s2", 1), same), Decision::Write, "another sitting on the newest version");
        assert_eq!(decide(Some(&his), &req(3, 1, "s0", 9), same), Decision::Stale { v: 4, rev: 3 }, "an older sitting after another saved");
        assert_eq!(decide(None, &req(1, 1, "s1", 1), same), Decision::Write);
    }

    #[test]
    fn a_file_changed_on_disk_is_a_conflict_unless_he_keeps_his() {
        let v = version(2, 1, None);
        assert_eq!(decide(Some(&v), &req(2, 1, "s1", 1), || false), Decision::Disk { v: 2, rev: 1 });
        assert_eq!(decide(Some(&v), &SaveReq { force: true, ..req(2, 1, "s1", 1) }, || false), Decision::Write);
        assert_eq!(decide(Some(&v), &SaveReq { force: true, ..req(1, 1, "s1", 1) }, || false), Decision::Stale { v: 2, rev: 1 }, "keep mine never skips the base");
    }

    /// A 503 (the hub answered after the page thread gave up) then the
    /// retry: one version, no 409 (architect m_37387).
    #[test]
    fn a_retry_after_a_late_answer_makes_one_version_and_no_conflict() {
        let d = std::env::temp_dir().join(format!("sb-save-retry-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        let work = d.join("work");
        std::fs::create_dir_all(&work).unwrap();
        let f = work.join("q3.xlsx");
        std::fs::write(&f, b"PK agent").unwrap();
        let store = crate::artifacts::Store::new(&d.join("state"));
        let add = |sitting: Option<Sitting>| crate::artifacts::Add { target: f.to_string_lossy().to_string(), agent: "deck".into(), by: "deck".into(), cwd: work.to_string_lossy().to_string(), sitting, ..Default::default() };
        let m = store.add(&add(None), 10).unwrap().meta;
        // what art_save does with a decision to write
        let save = |m: &crate::artifacts::Meta, r: &SaveReq| -> Decision {
            let latest = m.current().cloned();
            let d = decide(latest.as_ref(), r, || std::fs::read(&f).ok() == store.copy_bytes(m, latest.as_ref().unwrap()));
            if d == Decision::Write {
                store.write_source(m, &r.bytes).unwrap();
                store.add(&add(Some(Sitting { by: "you".into(), session: r.session.clone(), seq: r.seq })), 20).unwrap();
            }
            d
        };
        let first = SaveReq { bytes: b"PK his".to_vec(), ..req(1, 1, "s1", 1) };
        assert_eq!(save(&m, &first), Decision::Write, "it lands, but the browser got a 503");
        let m = store.stored().pop().unwrap();
        assert_eq!(save(&m, &first), Decision::Already { v: 2, rev: 1 }, "the retry answers it");
        let next = SaveReq { bytes: b"PK his, more".to_vec(), ..req(1, 1, "s1", 2) };
        assert_eq!(save(&m, &next), Decision::Write, "his next save, on a base he never got: his sitting, no 409");
        let m = store.stored().pop().unwrap();
        assert_eq!((m.versions.len(), m.current().unwrap().rev()), (2, 2), "one version for the sitting");
    }
}
