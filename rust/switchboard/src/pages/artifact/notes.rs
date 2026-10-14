//! Notes on any artifact (office-artifacts plan §5, §9b; architect
//! m_23701 §9.5 and m_23874): the page's notes system with an artifact as
//! its target. One store, `artifacts/<id>/notes.json` (the page store's
//! notes rules: [`super::super::store::Store::set_drafts`] / `send`), two
//! doors:
//!
//! - the browser: the viewer's note list (kit/notes.js's model, words and
//!   send) posts its drafts to `POST /api/a/<id>/notes` and sends them with
//!   `POST /api/a/<id>/send`: one message to the maker ([`parts`]), as
//!   from the user, through `PageMsg::Sent` with `Target::Artifact`;
//! - the desktop: the frame posts a selection to its parent, it goes as a
//!   `Part::Anchor` of his message; at the door `parts_in::said` checks the
//!   artifact and the version and the hub records it here, sent
//!   ([`record_said`]).
//!
//! `GET /a/<id>/notes` gives the notes with their outcome ([`outcomes`]:
//! a sent note is done in the first version begun after it), which
//! the viewer draws as marks; each change is also an SSE `notes` frame on
//! the artifact's stream ([`stream_key`]).
//!
//! Pure: [`began`], [`outcomes`], [`parts`], [`anchored`]; the rest reads and writes
//! the store under the pages lock.

use super::super::server::Response;
use super::super::store::{Note, Target};
use super::super::{PageMsg, Pages};
use bise_proto::anchor::Anchor;
use bise_proto::parts::{self, Part};
use serde_json::{json, Value};

/// The SSE key of an artifact's stream (art-live's `/a/<id>/events`, one
/// subs map with the pages': `a/` keeps the two apart).
pub fn stream_key(id: &str) -> String {
    format!("a/{id}")
}

fn arts(pages: &Pages) -> crate::artifacts::Store {
    crate::artifacts::Store::new(pages.store.dir.parent().unwrap_or(&pages.store.dir))
}

/// When a version began (architect m_23984): the start of the maker's
/// turn that made it (`turn.started_ms`, art-live's), else, for a version
/// made outside a turn, its first save (`revs[0].at_ms`, else `at_ms`).
/// A version's `at_ms` alone moves with each save of its turn, so a save
/// made before the maker read a note would answer it.
pub fn began(version: &Value) -> u64 {
    let n = |v: &Value| v.as_u64();
    version
        .pointer("/turn/started_ms")
        .and_then(n)
        .or_else(|| version.pointer("/revs/0/at_ms").and_then(n))
        .or_else(|| version.get("at_ms").and_then(n))
        .unwrap_or(0)
}

/// The notes as the viewer draws them: a sent note is `done` in the first
/// version that began after it was sent (`done_in`: the answering one; a
/// later save of the turn it was sent in does not count). The hub decides
/// it on read, never stores it (one fact: the versions). `versions`: each
/// version's `(v, began)`, oldest first.
pub fn outcomes(notes: &[Note], versions: &[(u64, u64)]) -> Vec<Note> {
    notes
        .iter()
        .map(|n| {
            let mut n = n.clone();
            if n.status == "sent" {
                let sent = n.sent_ms.unwrap_or(n.at_ms);
                if let Some((v, _)) = versions.iter().find(|(v, began)| *v > 0 && *began > sent) {
                    n.status = "done".into();
                    n.extra.insert("done_in".into(), json!(v));
                }
            }
            n
        })
        .collect()
}

/// Each version of artifact `id` and when it began ([`began`]), read from
/// its `meta.json` as written (the fields art-live adds included).
fn versions_began(pages: &Pages, id: &str) -> Vec<(u64, u64)> {
    let state = pages.store.dir.parent().unwrap_or(&pages.store.dir);
    let meta: Value = std::fs::read(state.join("artifacts").join(id).join("meta.json")).ok().and_then(|b| serde_json::from_slice(&b).ok()).unwrap_or(Value::Null);
    let list = meta.get("versions").and_then(Value::as_array).cloned().unwrap_or_default();
    list.iter().map(|v| (v.get("v").and_then(Value::as_u64).unwrap_or(0), began(v))).collect()
}

/// A note's anchor (its `at`: notes.js keeps `anchor` for its own
/// ok/moved), when it has a usable one.
pub fn anchored(n: &Note) -> Option<Anchor> {
    serde_json::from_value(n.extra.get("at")?.clone()).ok()
}

/// The message his sent notes make (designer signs the words): a line
/// that says where, then each note as its anchor's part and his words,
/// then the notes hint. Its text is `parts::render` of these parts.
///
/// ```text
/// you sent 2 notes on "q3.pptx" (v4, http://127.0.0.1:47438/a/q3-pptx/view):
/// 1. <artifact-selection artifact="q3-pptx" version="4" n="1">
/// {"kind":"shape","slide":2,"shape":"12"}
/// Revenue grew 4%
/// </artifact-selection> say Q3, not Q2
/// 2. …
/// ```
pub fn parts(id: &str, title: &str, url: &str, notes: &[Note]) -> Vec<Part> {
    let notes: Vec<&Note> = notes.iter().filter(|n| anchored(n).is_some()).collect();
    if notes.is_empty() {
        return Vec::new();
    }
    let count = if notes.len() == 1 { "1 note".to_string() } else { format!("{} notes", notes.len()) };
    let version = notes.iter().map(|n| n.version).max().unwrap_or(0);
    let mut out = vec![Part::Text { text: format!("you sent {count} on \"{title}\" (v{version}, {url}):\n") }];
    for (i, n) in notes.iter().enumerate() {
        let lead = if i == 0 { format!("{}. ", i + 1) } else { format!("\n{}. ", i + 1) };
        out.push(Part::Text { text: lead });
        let rev = n.extra.get("rev").and_then(Value::as_u64).unwrap_or(0) as u32;
        let quote = n.quote.clone().unwrap_or_default();
        out.push(Part::Anchor { artifact: id.to_string(), version: n.version, rev, anchor: anchored(n).unwrap_or(Anchor::Unknown(Value::Null)), quote, n: Some(i as u32 + 1) });
        let words = n.text.as_deref().map(str::trim).unwrap_or("");
        if !words.is_empty() {
            out.push(Part::Text { text: format!(" {words}") });
        }
    }
    out.extend(parts::notes_hint(&out));
    out
}

/// The parts' JSON of artifact `id`'s message for `sent` (the hub's
/// `ClientInput.parts`; "" when it has none).
pub fn parts_json(pages: &Pages, id: &str, sent: &[Note]) -> String {
    let Some(m) = arts(pages).get(id) else { return String::new() };
    let ps = parts(id, &m.title, &view_url(pages, id), sent);
    if ps.is_empty() {
        return String::new();
    }
    serde_json::to_string(&ps).unwrap_or_default()
}

fn view_url(pages: &Pages, id: &str) -> String {
    format!("{}/a/{id}/view", pages.base())
}

/// The notes of artifact `id` with their outcomes, as served and pushed.
fn served(pages: &Pages, id: &str) -> Value {
    json!({"notes": outcomes(&pages.store.notes_of(&Target::Artifact(id.to_string())), &versions_began(pages, id))})
}

/// Tell the artifact's open viewers its notes changed.
pub fn push(pages: &Pages, id: &str) {
    pages.push(&stream_key(id), "notes", &served(pages, id));
}

/// `GET /a/<id>/notes`: its notes and their outcomes.
pub fn get(pages: &Pages, id: &str) -> Response {
    match arts(pages).get(id) {
        Some(_) => Response::json(200, &served(pages, id)),
        None => Response::missing(&format!("no such artifact: a/{id}/notes")),
    }
}

/// `POST /api/a/<id>/notes` `{notes: [...]}`: his drafts (the page's
/// rule: the list replaces every draft).
pub fn post_notes(pages: &Pages, id: &str, body: &[u8]) -> Response {
    let Some(m) = arts(pages).get(id) else { return Response::err(404, "no such artifact") };
    let Ok(v) = serde_json::from_slice::<Value>(body) else { return Response::err(400, "not JSON") };
    let Some(list) = v.get("notes").and_then(Value::as_array) else { return Response::err(400, "no notes") };
    let version = m.current().map_or(0, |c| c.v);
    let now = crate::util::now_ms();
    match pages.locked(|s| s.set_drafts(&Target::Artifact(id.to_string()), list, version, now)) {
        Ok(_) => {
            push(pages, id);
            Response::json(200, &served(pages, id))
        }
        Err(e) => Response::err(409, &e),
    }
}

/// `POST /api/a/<id>/send`: the drafts go to the maker, one message.
pub fn post_send(pages: &Pages, id: &str) -> Response {
    let Some(m) = arts(pages).get(id) else { return Response::err(404, "no such artifact") };
    let now = crate::util::now_ms();
    let sent = match pages.locked(|s| s.send(&Target::Artifact(id.to_string()), now)) {
        Ok(s) => s,
        Err(e) => return Response::err(409, &e),
    };
    if sent.is_empty() {
        return Response::json(200, &json!({"sent": 0}));
    }
    let text = parts::render(&parts(id, &m.title, &view_url(pages, id), &sent));
    push(pages, id);
    let n = sent.len();
    pages.tell_hub(PageMsg::Sent { target: Target::Artifact(id.to_string()), agent: m.agent.clone(), text, notes: sent });
    Response::json(200, &json!({"sent": n, "agent": m.agent}))
}

/// Whether version `v` of artifact `id` exists (the door's check of a
/// `Part::Anchor`).
pub fn known(state: &std::path::Path, id: &str, v: u64) -> bool {
    crate::artifacts::Store::new(state).get(id).is_some_and(|m| m.versions.iter().any(|x| x.v == v))
}

/// His message's anchor parts (the desktop door), recorded as sent notes
/// of their artifacts with his words (the message's text parts), like a
/// browser send. The artifacts whose notes changed.
pub fn record_said(pages: &Pages, said: &[Part], now: u64) -> Vec<String> {
    let words: String = said.iter().filter_map(|p| if let Part::Text { text } = p { Some(text.as_str()) } else { None }).collect::<String>().split_whitespace().collect::<Vec<_>>().join(" ");
    let mut changed: Vec<String> = Vec::new();
    for p in said {
        let Part::Anchor { artifact, version, rev, anchor, quote, .. } = p else { continue };
        let t = Target::Artifact(artifact.clone());
        let note = json!({"kind": "note", "at": anchor, "quote": quote, "text": words, "version": version, "rev": rev, "via": "app"});
        let ok = pages.locked(|s| {
            // a draft of his in the browser stays a draft: only this one goes
            let drafts: Vec<Value> = s.notes_of(&t).into_iter().filter(|n| n.status == "draft").filter_map(|n| serde_json::to_value(n).ok()).collect();
            let before: Vec<String> = drafts.iter().filter_map(|d| d["id"].as_str().map(str::to_string)).collect();
            let mut all = drafts;
            all.push(note);
            let after = s.set_drafts(&t, &all, *version, now)?;
            let mut notes = after;
            for n in notes.iter_mut().filter(|n| n.status == "draft" && !before.contains(&n.id)) {
                n.status = "sent".into();
                n.sent_ms = Some(now);
            }
            s.save_notes_of(&t, &notes)
        });
        if ok.is_ok() && !changed.contains(artifact) {
            changed.push(artifact.clone());
        }
    }
    changed
}

#[cfg(test)]
#[path = "notes_tests.rs"]
mod tests;
