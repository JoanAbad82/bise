//! The core as a client of the projects' hubs (core/hubs.rs, desktop S3b
//! step 2): fake hubs, one socket pair per connection the core opens.

use super::*;
use crate::ambient::core::{ProjectFacts, ProjectPorts};
use bise_home::projects::Row;
use std::collections::HashMap;

/// The projects' side: each connection the core opened, by project id,
/// and what their reader threads say.
struct World {
    ends: Receiver<(String, HubEnd)>,
    rx: Receiver<(String, HubIn)>,
    open: HashMap<String, HubEnd>,
}

fn rows() -> Vec<Row> {
    let r = |id: &str, home: bool| Row { path: PathBuf::from(format!("/p/{id}")), name: id.into(), id: id.into(), home, added_ms: 0 };
    vec![r("home", true), r("shop", false), r("docs", false)]
}

fn world(t: &mut T) -> World {
    let (etx, ends) = mpsc::channel::<(String, HubEnd)>();
    let (ptx, rx) = mpsc::channel::<(String, HubIn)>();
    let spawn: crate::ambient::core::Spawn = Box::new(move |_path, id| {
        let (etx, id) = (etx.clone(), id.to_string());
        let tag = id.clone();
        let connect: super::super::hub::Connect = Box::new(move || {
            let (mut core_end, hub_end) = UnixStream::pair()?;
            core_end.write_all(b"{\"op\":\"hello\"}\n")?;
            let r = BufReader::new(hub_end.try_clone()?);
            r.get_ref().set_read_timeout(Some(Duration::from_secs(3)))?;
            etx.send((id.clone(), HubEnd { w: hub_end, r })).map_err(std::io::Error::other)?;
            Ok(core_end)
        });
        Hub::start(connect, ptx.clone(), move |h| (tag.clone(), h), Duration::from_millis(20))
    });
    let facts = ProjectFacts {
        rows: Box::new(rows),
        view: Box::new(|id| (id == "docs").then(|| bise_proto::draft::ProjectView {
            v: 1,
            project: "docs".into(),
            written_ms: 1,
            stopped_ms: Some(2),
            last_activity_ms: 1,
            agents: vec![],
            cards: vec![],
        })),
        running: Box::new(|_| false),
        exists: Box::new(|p| p != Path::new("/p/docs")),
        git: Box::new(|p| if p == Path::new("/p/shop") { (Some("main".into()), true) } else { (None, false) }),
    };
    t.core.set_projects(ProjectPorts { spawn, facts });
    World { ends, rx, open: HashMap::new() }
}

impl World {
    /// Both sides' events in, a tick, events out, until `done` holds.
    fn until(&mut self, t: &mut T, done: impl Fn(&[Value]) -> bool) {
        let t0 = Instant::now();
        loop {
            while let Ok((id, e)) = self.ends.try_recv() {
                self.open.insert(id, e);
            }
            while let Ok((id, h)) = self.rx.try_recv() {
                t.core.project_hub(&id, h);
            }
            while let Ok(h) = t.rx.try_recv() {
                t.core.hub(h);
            }
            t.out.extend(t.core.take_out());
            if done(&t.out) {
                return;
            }
            assert!(t0.elapsed() < Duration::from_secs(3), "timed out; out: {:#?}; open: {:?}", t.out, self.open.keys().collect::<Vec<_>>());
            std::thread::sleep(Duration::from_millis(5));
        }
    }

    /// Until the core has a connection to each of `ids` (its reader
    /// threads connect on their own).
    fn opened(&mut self, t: &mut T, ids: &[&str]) {
        let t0 = Instant::now();
        while !ids.iter().all(|id| self.open.contains_key(*id)) {
            self.until(t, |_| true);
            assert!(t0.elapsed() < Duration::from_secs(3), "never opened {ids:?}: {:?}", self.open.keys().collect::<Vec<_>>());
            std::thread::sleep(Duration::from_millis(5));
        }
    }

    fn end(&mut self, id: &str) -> &mut HubEnd {
        self.open.get_mut(id).unwrap_or_else(|| panic!("no connection to {id}"))
    }

    /// The hub of `id` says welcome (after the core's typed hello).
    fn welcome(&mut self, t: &mut T, id: &str) {
        self.until(t, |_| true);
        // next() skips the hellos: read the raw lines up to the typed one
        let e = self.end(id);
        loop {
            let mut l = String::new();
            e.r.read_line(&mut l).expect("the typed hello");
            let v: Value = serde_json::from_str(l.trim()).unwrap();
            if v["cmd"] == "hello" {
                assert_eq!(v, json!({"cmd": "hello", "proto": 1, "typed_only": true}), "a window's connection: typed only");
                break;
            }
            assert_eq!(v["op"], "hello", "only the connector's hello before it: {v}");
        }
        self.end(id).say(json!({"ev": "welcome", "project": id, "proto": 1, "workspace": format!("/p/{id}"), "name": id}));
        self.until(t, |o| o.iter().any(|v| v["ev"] == "welcome" && v["project"] == id));
    }
}

fn typed(t: &mut T, v: Value) {
    t.cmd(Cmd::parse(&v.to_string()).unwrap());
}

#[test]
fn the_window_reaches_every_projects_hub_through_the_core() {
    let mut t = T::new();
    t.ready();
    let mut w = world(&mut t);
    // no window yet: nothing held, a project command is refused
    typed(&mut t, json!({"cmd": "send", "project": "shop", "agent": "main", "text": "hi", "mode": "now"}));
    let e = t.take().into_iter().find(|v| v["ev"] == "error").expect("refused");
    assert_eq!((e["project"].as_str(), e["cmd"].as_str()), (Some("shop"), Some("send")));
    w.until(&mut t, |_| true);
    assert!(w.open.is_empty(), "the capsule alone opens nothing");
    // the window shows shop: home and shop are held, the rows come
    typed(&mut t, json!({"cmd": "shown", "projects": ["shop"]}));
    w.until(&mut t, |o| has(o, "projects"));
    let p = t.take().into_iter().find(|v| v["ev"] == "projects").unwrap();
    let rows = p["projects"].as_array().unwrap();
    assert_eq!(rows.iter().map(|r| r["project"].as_str().unwrap()).collect::<Vec<_>>(), ["home", "shop", "docs"]);
    assert_eq!((rows[0]["home"].as_bool(), rows[0]["order"].as_u64()), (Some(true), Some(0)));
    assert_eq!((rows[1]["branch"].as_str(), rows[1]["git"].as_bool()), (Some("main"), Some(true)));
    assert_eq!((rows[2]["missing"].as_bool(), rows[2]["running"].as_bool()), (Some(true), Some(false)), "docs: from its files only");
    w.opened(&mut t, &["home", "shop"]);
    let mut open: Vec<&String> = w.open.keys().collect();
    open.sort();
    assert_eq!(open, ["home", "shop"]);
    // before its welcome: a send is refused (never held), a subscribe kept
    typed(&mut t, json!({"cmd": "send", "project": "shop", "agent": "main", "text": "hi", "mode": "now"}));
    assert!(t.take().iter().any(|v| v["ev"] == "error" && v["project"] == "shop"));
    typed(&mut t, json!({"cmd": "subscribe", "project": "shop", "agent": "main"}));
    assert!(!has(&t.take(), "error"));
    w.welcome(&mut t, "shop");
    assert_eq!(w.end("shop").next(), json!({"cmd": "subscribe", "project": "shop", "agent": "main"}), "the kept subscription at welcome");
    // its typed events go out as they are; its rows feed the sidebar
    w.end("shop").say(json!({"ev": "thread", "project": "shop", "agent": "main", "entries": [], "more": false}));
    w.end("shop").say(json!({"ev": "agents", "project": "shop", "agents": [
        {"name": "main", "main": true, "status": "idle", "archived": false, "title": "", "purpose": "", "since_ms": 1, "waits": 0},
        {"name": "perf", "main": false, "status": "working", "archived": false, "title": "x", "purpose": "y", "since_ms": 1, "waits": 0}]}));
    w.until(&mut t, |o| o.iter().any(|v| v["ev"] == "projects" && v["projects"][1]["working"] == 1));
    let out = t.take();
    assert!(out.iter().any(|v| v["ev"] == "thread" && v["project"] == "shop"));
    assert!(out.iter().any(|v| v["ev"] == "projects" && v["projects"][1]["running"] == true));
    // a send now: to shop's hub as it came
    let send = json!({"cmd": "send", "project": "shop", "agent": "main", "text": "ship it", "mode": "now"});
    typed(&mut t, send.clone());
    assert_eq!(w.end("shop").next(), send);
    // a subscribe in docs (not shown) holds docs while it lasts
    typed(&mut t, json!({"cmd": "subscribe", "project": "docs", "agent": "main"}));
    w.opened(&mut t, &["docs"]);
    // an unknown project: refused
    typed(&mut t, json!({"cmd": "page", "project": "nope", "agent": "main", "before": 3}));
    assert!(t.take().iter().any(|v| v["ev"] == "error" && v["project"] == "nope"));
    // shop's hub restarts: hello again, its welcome subscribes again
    w.end("shop").w.shutdown(std::net::Shutdown::Both).unwrap();
    w.open.remove("shop");
    w.opened(&mut t, &["shop"]);
    w.welcome(&mut t, "shop");
    assert_eq!(w.end("shop").next()["cmd"], "subscribe");
    // the window shows nothing, docs unsubscribed: only home stays held
    typed(&mut t, json!({"cmd": "unsubscribe", "project": "docs", "agent": "main"}));
    typed(&mut t, json!({"cmd": "unsubscribe", "project": "shop", "agent": "main"}));
    typed(&mut t, json!({"cmd": "shown", "projects": []}));
    // what each wrote before it closed, then its end (never a timeout)
    let closed = |e: &mut HubEnd| -> Vec<String> {
        let mut lines = Vec::new();
        loop {
            let mut l = String::new();
            match e.r.read_line(&mut l) {
                Ok(0) => return lines,
                Ok(_) => lines.push(l.trim().to_string()),
                Err(err) => panic!("still open after {lines:?}: {err}"),
            }
        }
    };
    let shop = closed(w.end("shop"));
    assert_eq!(shop.len(), 1, "its unsubscribe, then closed: {shop:?}");
    assert!(shop[0].contains("unsubscribe"));
    let docs = closed(w.end("docs"));
    assert!(docs.iter().all(|l| l.contains("\"hello\"")), "docs never welcomed: only the hellos went: {docs:?}");
}
