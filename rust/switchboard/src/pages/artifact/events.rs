//! `GET /a/<id>/events` (office-artifacts plan §6, architect m_23911): the
//! SSE stream of an artifact open in a viewer, on the page streams' subs
//! map (`Pages::subscribe`/`push`) under the key [`key`] (`a/<id>`, so a
//! page and an artifact with the same id never mix). server.rs runs the
//! stream; this module says its frames:
//!
//! - `version {n, rev, changed, live}`: a save landed (a new version, or
//!   the newest one's copy replaced in the same turn: `rev` grew);
//!   `changed` is what the version changed from the one before (its
//!   saves together, artifacts_turns::merged; null: no detail), `rev_changed`
//!   what this save changed (the viewer outlines it);
//! - `live {strip?, line?, back?}`: the maker's turn ended (the line now), the
//!   words of `bise_proto::office::live_words`, the same as the row's;
//! - `notes {notes}`: art-notes' (pages/artifact/notes.rs).
//!
//! The hub (daemon/art.rs) calls [`push_version`] after a save and
//! [`push_live`] when sb-core says the maker's turn is over; a new
//! stream's first frame is [`first`].

use crate::artifacts::{Store, Version};
use bise_proto::rows::ArtifactLive;
use serde_json::{json, Value};

use super::super::Pages;

/// The subs map's key of artifact `id`'s streams.
pub fn key(id: &str) -> String {
    format!("a/{id}")
}

/// The `version` frame's data of version `v` with its live words.
pub fn version_data(v: &Version, live: Option<&ArtifactLive>) -> Value {
    json!({
        "n": v.v,
        "rev": v.rev(),
        "changed": v.changed(),
        "rev_changed": v.revs.last().and_then(|r| r.changed.clone()),
        "live": live,
    })
}

fn live_data(live: Option<&ArtifactLive>) -> Value {
    live.map_or_else(|| json!({}), |l| json!(l))
}

/// A save of artifact `id` landed: its `version` frame to every stream.
pub fn push_version(pages: &Pages, id: &str, v: &Version, live: Option<ArtifactLive>) {
    remember(pages, id, live.as_ref());
    pages.push(&key(id), "version", &version_data(v, live.as_ref()));
}

/// The maker's turn ended: the `live` frame (the line, or nothing).
pub fn push_live(pages: &Pages, id: &str, live: Option<ArtifactLive>) {
    remember(pages, id, live.as_ref());
    pages.push(&key(id), "live", &live_data(live.as_ref()));
}

fn remember(pages: &Pages, id: &str, live: Option<&ArtifactLive>) {
    if let Ok(mut m) = pages.art_live.lock() {
        m.insert(id.to_string(), live_data(live));
    }
}

/// The hub's first state push after it started (architect m_24116):
/// every stored artifact's live words, as its row has them, into the
/// cache a new stream starts from. `maker_turn`: when the turn of the
/// agent that made a version started, if it runs now (sb-core's view).
/// Returns the ones whose maker's turn runs: (id, agent, its start), for
/// the hub to watch.
pub fn seed(pages: &Pages, store: &Store, maker_turn: impl Fn(&Version) -> Option<u64>) -> Vec<(String, String, u64)> {
    let mut running = Vec::new();
    for m in store.stored() {
        let Some(v) = m.current() else { continue };
        let at = maker_turn(v);
        remember(pages, &m.id, crate::artifacts_turns::live(v, at).as_ref());
        if let (Some(t), Some(at)) = (&v.turn, at) {
            if t.started_ms == at {
                running.push((m.id.clone(), t.agent.clone(), at));
            }
        }
    }
    running
}

/// A new stream's first frame: the newest version as the store has it,
/// with the live words the hub last pushed or seeded ([`seed`]).
pub fn first(pages: &Pages, id: &str) -> String {
    let state = pages.store.dir.parent().unwrap_or(&pages.store.dir);
    let Some(m) = Store::new(state).get(id).filter(|m| m.by != "page") else { return String::new() };
    let Some(v) = m.current() else { return String::new() };
    let kept = pages.art_live.lock().ok().and_then(|l| l.get(id).cloned());
    let live = match kept {
        Some(l) => serde_json::from_value(l).ok(),
        None => crate::artifacts_turns::live(v, None),
    };
    format!("event: version\ndata: {}\n\n", version_data(v, live.as_ref()))
}

/// The path of an artifact's stream (`/a/<id>/events`): its subs key.
pub fn route(path: &str) -> Option<String> {
    let id = path.strip_prefix("/a/")?.strip_suffix("/events")?;
    super::super::store::valid_id(id).then(|| key(id))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::artifacts::{Add, Store};
    use crate::artifacts_turns::Turn;
    use bise_proto::anchor::Anchor;
    use std::sync::mpsc;

    fn slide(n: u32) -> Anchor {
        Anchor::Slide { slide: n, rect: None }
    }

    /// The file a save adds, written with its own mtime (`at` s): the
    /// store's unchanged check is size and mtime, and two saves of the
    /// same size in the same millisecond would read as one unchanged file.
    fn put(p: &std::path::Path, bytes: &str, at: u64) {
        std::fs::write(p, bytes).unwrap();
        let f = std::fs::File::options().write(true).open(p).unwrap();
        f.set_modified(std::time::UNIX_EPOCH + std::time::Duration::from_secs(1_000_000 + at)).unwrap();
    }

    /// A deck saved three times in one turn and once in the next: the
    /// streams of `a/<id>` get each save as `version {n, rev, changed}`,
    /// a page's streams with the same id get none; a new stream starts
    /// from the newest version and the last live words.
    #[test]
    fn each_save_is_a_version_frame_on_the_artifacts_stream() {
        let d = std::env::temp_dir().join(format!("sb-art-events-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        let work = d.join("work");
        std::fs::create_dir_all(&work).unwrap();
        let p = Pages::new(&d, 0, &d);
        let store = Store::new(&d);
        let (tx, rx) = mpsc::channel();
        let (page_tx, page_rx) = mpsc::channel();
        p.subscribe(&key("q3-pptx"), tx);
        p.subscribe("q3-pptx", page_tx);
        let save = |bytes: &str, turn: u64, changed: Vec<Anchor>, at: u64| {
            put(&work.join("q3.pptx"), bytes, at);
            let a = Add {
                target: "q3.pptx".into(),
                agent: "deck".into(),
                by: "deck".into(),
                cwd: work.to_string_lossy().to_string(),
                turn: Some(Turn { agent: "deck".into(), started_ms: turn }),
                changed: Some(changed),
                ..Default::default()
            };
            let m = store.add(&a, at).unwrap().meta;
            let v = m.current().unwrap().clone();
            push_version(&p, &m.id, &v, crate::artifacts_turns::live(&v, Some(turn)));
            m
        };
        save("one", 100, vec![], 1);
        save("two", 200, vec![slide(2)], 2);
        let m = save("three", 200, vec![slide(5)], 3);
        assert_eq!(m.id, "q3-pptx");
        let frames: Vec<String> = rx.try_iter().collect();
        assert_eq!(frames.len(), 3);
        let data = |f: &str| -> Value { serde_json::from_str(f.split("data: ").nth(1).unwrap().trim()).unwrap() };
        assert!(frames.iter().all(|f| f.starts_with("event: version\n")));
        let last = data(&frames[2]);
        assert_eq!((last["n"].as_u64(), last["rev"].as_u64()), (Some(2), Some(2)), "the same turn: v2 again, rev 2");
        assert_eq!(last["changed"], json!([{"kind": "slide", "slide": 2}, {"kind": "slide", "slide": 5}]));
        assert_eq!(last["rev_changed"], json!([{"kind": "slide", "slide": 5}]));
        assert_eq!(last["live"]["strip"], json!("∿ deck is updating · slide 5"));
        assert_eq!(page_rx.try_iter().count(), 0, "a page with the same id hears nothing");

        // the turn ends: the line, and a new stream starts from it
        let v = m.current().unwrap().clone();
        push_live(&p, &m.id, crate::artifacts_turns::live(&v, None));
        let f = rx.try_iter().next().unwrap();
        assert!(f.starts_with("event: live\n"));
        assert_eq!(data(&f), json!({"line": "v2 · 2 slides changed", "back": {"text": "← v1", "v": 1}}));
        let start = first(&p, &m.id);
        assert_eq!(data(&start)["live"], data(&f), "a new stream starts from the same words");
        assert_eq!(data(&start)["rev"], json!(2));
        assert_eq!(first(&p, "nope"), "");
        let _ = std::fs::remove_dir_all(d);
    }

    /// architect m_24116: after a restart, the first state push seeds the
    /// cache, so a new stream's first frame says what the row says (the
    /// strip while the maker's turn runs), not the line of a turn over.
    #[test]
    fn a_fresh_server_seeded_once_starts_streams_with_the_rows_words() {
        let d = std::env::temp_dir().join(format!("sb-art-seed-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        let work = d.join("work");
        std::fs::create_dir_all(&work).unwrap();
        let store = Store::new(&d);
        for (bytes, at) in [("one", 1), ("two", 2)] {
            put(&work.join("q3.pptx"), bytes, at);
            let turn = Some(Turn { agent: "deck".into(), started_ms: at * 100 });
            let a = Add { target: "q3.pptx".into(), agent: "deck".into(), by: "deck".into(), cwd: work.to_string_lossy().to_string(), turn, changed: Some(vec![slide(2)]), ..Default::default() };
            store.add(&a, at).unwrap();
        }
        let p = Pages::new(&d, 0, &d);
        let v = store.get("q3-pptx").unwrap().current().unwrap().clone();
        let running = seed(&p, &store, |_| Some(200));
        assert_eq!(running, [("q3-pptx".to_string(), "deck".to_string(), 200)]);
        let data: Value = serde_json::from_str(first(&p, "q3-pptx").split("data: ").nth(1).unwrap().trim()).unwrap();
        let row = crate::artifacts_turns::live(&v, Some(200));
        assert_eq!(data["live"], json!(row), "the stream's words are the row's");
        assert_eq!(data["live"]["strip"], json!("∿ deck is updating · slide 2"));
        assert!(seed(&Pages::new(&d, 0, &d), &store, |_| None).is_empty(), "no turn running: nothing to watch");
        let _ = std::fs::remove_dir_all(d);
    }

    #[test]
    fn the_route_is_the_artifacts_key() {
        assert_eq!(route("/a/q3-pptx/events").as_deref(), Some("a/q3-pptx"));
        assert_eq!(route("/a/../events"), None);
        assert_eq!(route("/p/q3/events"), None);
        assert_eq!(route("/a/q3/2/events"), None);
    }
}
