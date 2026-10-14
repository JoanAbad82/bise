//! The laws of the notes on an artifact (office-artifacts §5, §9b).

use super::*;
use crate::pages::server::{route, Request};

fn temp(name: &str) -> std::path::PathBuf {
    let d = std::env::temp_dir().join(format!("sb-art-notes-{name}-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&d);
    std::fs::create_dir_all(d.join("work")).unwrap();
    d
}

/// An artifact `q3.xlsx` by t1 with `n` versions, at 100, 200, ...
fn artifact(d: &std::path::Path, n: u64) -> String {
    let arts = crate::artifacts::Store::new(d);
    let work = d.join("work");
    let mut id = String::new();
    for i in 1..=n {
        std::fs::write(work.join("q3.xlsx"), format!("bytes {i}")).unwrap();
        let a = crate::artifacts::Add { target: "q3.xlsx".into(), title: None, kind: None, agent: "t1".into(), by: "t1".into(), cwd: work.to_string_lossy().to_string(), known_only: false };
        id = arts.add(&a, i * 100).unwrap().meta.id;
    }
    id
}

fn note(id: &str, status: &str, sent: u64, anchor: Value) -> Note {
    let mut n = Note { id: id.into(), version: 1, kind: "note".into(), text: Some("why?".into()), status: status.into(), sent_ms: (sent > 0).then_some(sent), at_ms: 1, ..Note::default() };
    n.extra.insert("at".into(), anchor);
    n
}

fn cell() -> Value {
    json!({"kind": "cell", "sheet": "Q3", "range": "B4:D9"})
}

/// A sent note is done in the first version begun after it (the
/// answering one, `done_in`); one sent after the newest stays sent; a
/// draft or an answered note is as kept.
#[test]
fn a_note_is_done_in_the_version_that_answers_it() {
    let versions = [(1, 100), (2, 200), (3, 300)];
    let out = outcomes(&[note("n1", "sent", 150, cell()), note("n2", "sent", 350, cell()), note("n3", "draft", 0, cell()), note("n4", "sent", 200, cell())], &versions);
    assert_eq!((out[0].status.as_str(), out[0].extra.get("done_in")), ("done", Some(&json!(2))));
    assert_eq!((out[1].status.as_str(), out[1].extra.get("done_in")), ("sent", None));
    assert_eq!(out[2].status, "draft");
    // a version begun in the same ms as the send does not answer it
    assert_eq!(out[3].extra.get("done_in"), Some(&json!(3)));
}

/// architect m_23984: a version begins with its maker's turn; a note sent
/// mid-turn is not answered by that turn's later saves (its at_ms moved),
/// only by the next turn's version. Outside a turn: its first save.
#[test]
fn a_note_sent_mid_turn_waits_for_the_next_turn() {
    let v3 = json!({"v": 3, "at_ms": 300, "turn": {"agent": "t1", "started_ms": 100}, "revs": [{"rev": 1, "at_ms": 120}, {"rev": 2, "at_ms": 300}]});
    let v4 = json!({"v": 4, "at_ms": 520, "turn": {"agent": "t1", "started_ms": 400}, "revs": [{"rev": 1, "at_ms": 520}]});
    let mine = json!({"v": 5, "at_ms": 700, "revs": [{"rev": 1, "at_ms": 650}, {"rev": 2, "at_ms": 700}]});
    let old = json!({"v": 1, "at_ms": 50});
    assert_eq!([began(&v3), began(&v4), began(&mine), began(&old)], [100, 400, 650, 50]);
    let versions: Vec<(u64, u64)> = [&v3, &v4, &mine].iter().map(|v| (v["v"].as_u64().unwrap(), began(v))).collect();
    let out = outcomes(&[note("n1", "sent", 200, cell()), note("n2", "sent", 600, cell())], &versions);
    assert_eq!(out[0].extra.get("done_in"), Some(&json!(4)), "v3's save at 300 came in the turn it was sent in");
    assert_eq!(out[1].extra.get("done_in"), Some(&json!(5)), "his own add, outside a turn: its first save");
}

/// The message to the maker: where, each note as its anchor's part and
/// his words, the notes hint; render gives the model's text, the anchor's
/// JSON on its own line for `at()`; a note with no usable anchor is left out.
#[test]
fn the_sent_notes_make_one_message_with_their_anchors() {
    let mut a = note("n1", "sent", 5, json!({"kind": "shape", "slide": 2, "shape": "12"}));
    a.quote = Some("Revenue grew 4%".into());
    a.text = Some("say Q3, not Q2".into());
    a.version = 4;
    let mut b = note("n2", "sent", 5, json!({"kind": "slide", "slide": 5}));
    b.text = Some("too dense, split it".into());
    b.version = 4;
    let mut lost = note("n3", "sent", 5, json!(null));
    lost.extra.remove("at");
    let ps = parts("q3-pptx", "q3.pptx", "http://127.0.0.1:47438/a/q3-pptx/view", &[a, b, lost]);
    assert_eq!(ps.iter().filter(|p| matches!(p, Part::Anchor { .. })).count(), 2);
    assert!(matches!(ps.last(), Some(Part::Hint { of: bise_proto::parts::HintKind::Notes, .. })));
    let text = parts::render(&ps);
    let want = concat!(
        "you sent 2 notes on \"q3.pptx\" (artifact q3-pptx v4, http://127.0.0.1:47438/a/q3-pptx/view):\n",
        "1. <artifact-selection artifact=\"q3-pptx\" version=\"4\" n=\"1\">\n{\"kind\":\"shape\",\"slide\":2,\"shape\":\"12\"}\nRevenue grew 4%\n</artifact-selection> say Q3, not Q2\n",
        "2. <artifact-selection artifact=\"q3-pptx\" version=\"4\" n=\"2\">\n{\"kind\":\"slide\",\"slide\":5}\n</artifact-selection> too dense, split it"
    );
    // (an anchor kept as JSON: its keys sorted, any order reads the same in at())
    let list = r#"[{"id":"n1","anchor":{"kind":"shape","shape":"12","slide":2},"text":"say Q3, not Q2","quote":"Revenue grew 4%"},{"id":"n2","anchor":{"kind":"slide","slide":5},"text":"too dense, split it"}]"#;
    assert_eq!(text, format!("{want}{}\n<artifact-notes artifact=\"q3-pptx\" version=\"4\">{list}</artifact-notes>", parts::NOTES_HINT));
    assert!(parts("x", "x", "u", &[]).is_empty());
}

fn req(p: &Pages, method: &str, path: &str, body: Value) -> Response {
    let origin = format!("http://127.0.0.1:{}", p.port);
    let headers = vec![("Host".into(), format!("127.0.0.1:{}", p.port)), ("Origin".into(), origin), ("X-Bise-Token".into(), p.token.clone())];
    route(p, &Request { method: method.into(), path: path.into(), headers, body: serde_json::to_vec(&body).unwrap() })
}

fn body(r: &Response) -> Value {
    serde_json::from_slice(&r.body).unwrap_or(Value::Null)
}

/// The browser door: drafts in `artifacts/<id>/notes.json` with the
/// page's rules, `send` makes them sent and tells the hub one message for
/// the maker; GET gives them back with their outcome once a new version
/// lands; another artifact is a 404.
#[test]
fn the_browser_door_drafts_sends_and_reads_back() {
    let d = temp("browser");
    let id = artifact(&d, 1);
    let p = Pages::new(&d, 47123, &d);
    let (tx, rx) = std::sync::mpsc::channel();
    let tx = std::sync::Mutex::new(tx);
    p.connect_hub(Box::new(move |m| drop(tx.lock().unwrap().send(m))));
    let draft = json!({"notes": [{"kind": "note", "at": cell(), "quote": "1200 1350", "text": "these look low"}]});
    let r = req(&p, "POST", &format!("/api/a/{id}/notes"), draft);
    assert_eq!(r.status, 200, "{}", String::from_utf8_lossy(&r.body));
    assert_eq!(body(&r)["notes"][0]["status"], "draft");
    assert!(d.join("artifacts").join(&id).join("notes.json").exists(), "the artifact's own notes.json");
    let r = req(&p, "POST", &format!("/api/a/{id}/send"), json!({}));
    assert_eq!(body(&r)["sent"], 1);
    match rx.try_recv().unwrap() {
        PageMsg::Sent { target, agent, text, notes } => {
            assert_eq!((target, agent.as_str(), notes.len()), (Target::Artifact(id.clone()), "t1", 1));
            assert!(text.contains("{\"kind\":\"cell\",\"sheet\":\"Q3\",\"range\":\"B4:D9\"}\n1200 1350\n</artifact-selection> these look low"), "{text}");
        }
        m => panic!("{m:?}"),
    }
    assert_eq!(body(&req(&p, "GET", &format!("/a/{id}/notes"), json!(null)))["notes"][0]["status"], "sent");
    // the maker answers with v2: done in v2
    std::thread::sleep(std::time::Duration::from_millis(2));
    std::fs::write(d.join("work/q3.xlsx"), "bytes 2").unwrap();
    let a = crate::artifacts::Add { target: "q3.xlsx".into(), title: None, kind: None, agent: "t1".into(), by: "t1".into(), cwd: d.join("work").to_string_lossy().to_string(), known_only: false };
    crate::artifacts::Store::new(&d).add(&a, crate::util::now_ms() + 10).unwrap();
    let n = &body(&req(&p, "GET", &format!("/a/{id}/notes"), json!(null)))["notes"][0];
    assert_eq!((n["status"].as_str(), n["done_in"].as_u64()), (Some("done"), Some(2)));
    // no such artifact; no token: refused before anything
    assert_eq!(req(&p, "POST", "/api/a/nope/notes", json!({"notes": []})).status, 404);
    assert_eq!(req(&p, "GET", "/a/nope/notes", json!(null)).status, 404);
    let no_token = route(&p, &Request { method: "POST".into(), path: format!("/api/a/{id}/send"), headers: vec![("Host".into(), "127.0.0.1:47123".into())], body: vec![] });
    assert_eq!(no_token.status, 403);
}

/// The desktop door: an anchor part his message carried is a sent note
/// of its artifact with his words; a draft of his in the browser stays a
/// draft; the door's check knows the artifact's versions.
#[test]
fn the_desktop_door_records_a_sent_note() {
    let d = temp("desktop");
    let id = artifact(&d, 2);
    let p = Pages::new(&d, 0, &d);
    p.locked(|s| s.set_drafts(&Target::Artifact(id.clone()), &[json!({"kind": "note", "at": cell(), "text": "later"})], 2, 5)).unwrap();
    let said = [
        Part::Text { text: "why so ".into() },
        Part::Anchor { artifact: id.clone(), version: 2, rev: 3, anchor: serde_json::from_value(cell()).unwrap(), quote: "1200".into(), n: Some(1) },
        Part::Text { text: " low?".into() },
    ];
    assert_eq!(record_said(&p, &said, 50), vec![id.clone()]);
    let notes = p.store.notes_of(&Target::Artifact(id.clone()));
    let sent: Vec<&Note> = notes.iter().filter(|n| n.status == "sent").collect();
    assert_eq!(notes.iter().filter(|n| n.status == "draft").count(), 1, "his browser draft stays");
    assert_eq!(sent.len(), 1);
    assert_eq!((sent[0].text.as_deref(), sent[0].quote.as_deref(), sent[0].version, sent[0].sent_ms), (Some("why so low?"), Some("1200"), 2, Some(50)));
    assert_eq!((sent[0].extra["rev"].as_u64(), sent[0].extra["via"].as_str()), (Some(3), Some("app")));
    assert_eq!(anchored(sent[0]), serde_json::from_value(cell()).ok());
    assert_eq!(known(&d, &id, 2), Ok(()));
    assert_eq!(known(&d, &id, 3), Err("q3.xlsx has no version 3 here, so the note can't go on it".into()));
    assert_eq!(known(&d, "nope", 1), Err("nope has no version 1 here, so the note can't go on it".into()));
}

/// The door refuses an anchor on an artifact or a version it doesn't
/// have, in words; taken, his message gets the notes hint after it.
#[test]
fn the_door_checks_the_artifact_then_adds_the_hint() {
    let a = Part::Anchor { artifact: "q3".into(), version: 2, rev: 0, anchor: serde_json::from_value(cell()).unwrap(), quote: String::new(), n: None };
    let none = |_: &std::path::Path| -> Result<crate::parts_in::Stored, String> { Err("no".into()) };
    let said = |known: &dyn Fn(&str, u64) -> Result<(), String>| crate::parts_in::said(&[a.clone(), Part::Text { text: "why?".into() }], &[], &crate::parts_in::Door { store: std::path::Path::new("/h/images"), put: &none, exists: &|_| true, known: known });
    assert_eq!(said(&|_, _| Err("no".into())), Err("no".into()), "the door's words, as they are");
    // an anchor it can't read: a known kind with bad fields, or a newer kind (architect m_23912)
    let odd = |at: Value| crate::parts_in::said(&[Part::Anchor { artifact: "q3".into(), version: 2, rev: 0, anchor: serde_json::from_value(at).unwrap(), quote: String::new(), n: None }], &[], &crate::parts_in::Door { store: std::path::Path::new("/h/images"), put: &none, exists: &|_| true, known: &|_, _| Ok(()) });
    assert_eq!(odd(json!({"kind": "cell", "sheet": "Q3"})), Err("that part isn't in this version: the note can't go there".into()));
    assert_eq!(odd(json!({"kind": "voxel", "x": 1})), Err("this bise can't put a note on that kind of part (voxel): update bise".into()));
    let s = said(&|id, v| if id == "q3" && v == 2 { Ok(()) } else { Err("no".into()) }).unwrap();
    assert!(s.text.starts_with("<artifact-selection artifact=\"q3\" version=\"2\">\n{\"kind\":\"cell\""), "{}", s.text);
    assert!(s.text.ends_with(&format!("why?{}", parts::NOTES_HINT)), "{}", s.text);
}
