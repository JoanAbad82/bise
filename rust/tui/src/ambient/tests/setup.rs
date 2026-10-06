//! The window's setup commands on the core (core/setup.rs, desktop S11):
//! a fake world behind the Setup port, no HOME, no browser, no key store.

use super::*;
use crate::ambient::setup::{Done, Entry, RegistryOp, SetupPorts};
use bise_home::projects::Row;
use bise_proto::draft::{Account, Plugin, PluginLogin};
use std::cell::RefCell;
use std::rc::Rc;

#[derive(Default)]
struct World {
    prefs: Option<Value>,
    keys: Vec<(String, String)>,
    sign_ins: Vec<String>,
    added: Vec<PathBuf>,
    flows: Vec<(PathBuf, bool)>,
    ops: Vec<RegistryOp>,
    /// the sign-in's channel, to end it from the test
    signing: Option<std::sync::mpsc::Sender<Done>>,
    /// plugins.json's toggles, the plugin logins started, the logouts
    plugin_sets: Vec<(String, bool)>,
    plugin_logins: Vec<(PathBuf, String)>,
    plugin_logouts: Vec<(PathBuf, String)>,
    logging_in: Option<std::sync::mpsc::Sender<Done>>,
}

fn rows() -> Vec<Row> {
    let r = |id: &str, home: bool| Row { path: PathBuf::from(format!("/p/{id}")), name: id.into(), id: id.into(), home, added_ms: 0 };
    vec![r("home", true), r("shop", false), r("docs", false)]
}

fn setup(t: &mut T) -> Rc<RefCell<World>> {
    let w = Rc::new(RefCell::new(World::default()));
    let (a, b, c, d, e, f, g, h, i) = (w.clone(), w.clone(), w.clone(), w.clone(), w.clone(), w.clone(), w.clone(), w.clone(), w.clone());
    let (j, k, l, m) = (w.clone(), w.clone(), w.clone(), w.clone());
    t.core.set_setup(SetupPorts {
        prefs: Box::new(move || a.borrow().prefs.clone()),
        write_prefs: Box::new(move |v| {
            b.borrow_mut().prefs = Some(v.clone());
            Ok(())
        }),
        accounts: Box::new(move || {
            let keyed = c.borrow().keys.iter().any(|(id, _)| id == "anthropic");
            vec![Account {
                id: "anthropic".into(),
                label: "Anthropic".into(),
                kind: "key".into(),
                state: if keyed { "signed_in" } else { "signed_out" }.into(),
                who: None,
            }]
        }),
        key_set: Box::new(move |id, key| {
            if key.trim().is_empty() {
                return Err("an empty key".into());
            }
            d.borrow_mut().keys.push((id.into(), key.into()));
            Ok(())
        }),
        key_remove: Box::new(move |id| {
            e.borrow_mut().keys.retain(|(k, _)| k != id);
            Ok(())
        }),
        sign_in: Box::new(move |id, tx| {
            let mut w = f.borrow_mut();
            w.sign_ins.push(id.into());
            w.signing = Some(tx);
            Ok(())
        }),
        scan: Box::new(|dir, tx| {
            let e = |n: &str, t: u64| Entry { path: PathBuf::from(format!("/p/{n}")), name: n.into(), last_ms: t };
            let _ = tx.send(Done::Scanned { dir, entries: vec![e("shop", 2), e("blog", 5)] });
        }),
        home_dir: PathBuf::from("/h"),
        rows: Box::new(rows),
        add: Box::new(move |p| {
            if p == Path::new("/p/home") {
                return Err("that's bise's home".into());
            }
            g.borrow_mut().added.push(p.into());
            Ok(())
        }),
        registry: Box::new(move |op| {
            h.borrow_mut().ops.push(op);
            Ok(())
        }),
        flow: Box::new(move |p, trunk| {
            i.borrow_mut().flows.push((p.into(), trunk));
            Ok(())
        }),
        plugins: Box::new(move |ws, pending| {
            let off = j.borrow().plugin_sets.iter().rev().find(|(n, _)| n == "computer").is_none_or(|(_, on)| !on);
            let login = |name: &str| PluginLogin { name: name.into(), host: "mcp.linear.app".into(), state: if pending.iter().any(|p| p == name) { "pending" } else { "needs" }.into(), tools: None };
            let p = |name: &str, state: &str, logins| Plugin { name: name.into(), state: state.into(), scope: "user".into(), what: Some(ws.to_string_lossy().into_owned()), logins };
            vec![p("linear", "loaded", vec![login("linear")]), p("computer", if off { "disabled" } else { "loaded" }, vec![])]
        }),
        plugin_set: Box::new(move |name, on| {
            if name == "nope" {
                return Err("no plugin nope".into());
            }
            k.borrow_mut().plugin_sets.push((name.into(), on));
            Ok(())
        }),
        plugin_login: Box::new(move |ws, name, _project, tx| {
            let mut w = l.borrow_mut();
            w.plugin_logins.push((ws.into(), name.into()));
            w.logging_in = Some(tx);
            Ok(())
        }),
        plugin_logout: Box::new(move |ws, name| {
            m.borrow_mut().plugin_logouts.push((ws.into(), name.into()));
            Ok(())
        }),
    });
    w
}

fn app(t: &mut T, line: &str) {
    let c = Cmd::parse(line).unwrap();
    t.cmd(c);
}

fn evs<'a>(o: &'a [Value], ev: &str) -> Vec<&'a Value> {
    o.iter().filter(|v| v["ev"] == ev).collect()
}

#[test]
fn the_window_gets_prefs_and_accounts_and_sets_a_known_pref() {
    let mut t = T::new();
    let w = setup(&mut t);
    t.core.app_start();
    t.out.extend(t.core.take_out());
    let out = t.take();
    let prefs = evs(&out, "prefs");
    assert_eq!(prefs.len(), 1);
    assert!(prefs[0]["prefs"]["excluded_apps"].as_array().is_some_and(|a| a.contains(&json!("com.apple.MobileSMS"))), "the seed");
    assert_eq!(evs(&out, "accounts")[0]["items"][0]["state"], "signed_out");

    app(&mut t, r#"{"cmd":"prefs_set","key":"quiet.call","value":false}"#);
    assert_eq!(w.borrow().prefs, Some(json!({"quiet": {"call": false}})));
    let out = t.take();
    assert_eq!(evs(&out, "prefs")[0]["prefs"]["quiet"]["call"], false);

    app(&mut t, r#"{"cmd":"prefs_set","key":"hints","value":{}}"#);
    app(&mut t, r#"{"cmd":"prefs_set","key":"shots_keep_days","value":"many"}"#);
    let out = t.take();
    assert_eq!(evs(&out, "error").iter().map(|e| e["cmd"].as_str().unwrap()).collect::<Vec<_>>(), vec!["prefs_set", "prefs_set"]);
    assert!(evs(&out, "prefs").is_empty());
    assert_eq!(w.borrow().prefs, Some(json!({"quiet": {"call": false}})), "nothing written");

    // the window (re)opens: both again
    t.cmd(Cmd::Shown { projects: vec![] });
    let out = t.take();
    assert_eq!((evs(&out, "prefs").len(), evs(&out, "accounts").len()), (1, 1));
}

#[test]
fn a_key_set_shows_in_accounts_and_never_in_an_event() {
    let mut t = T::new();
    let w = setup(&mut t);
    app(&mut t, r#"{"cmd":"key_set","id":"anthropic","key":"sk-fake-secret"}"#);
    assert_eq!(w.borrow().keys, vec![("anthropic".to_string(), "sk-fake-secret".to_string())]);
    let out = t.take();
    assert_eq!(evs(&out, "accounts")[0]["items"][0]["state"], "signed_in");
    assert!(!serde_json::to_string(&out).unwrap().contains("sk-fake-secret"));
    app(&mut t, r#"{"cmd":"key_set","id":"anthropic","key":" "}"#);
    assert_eq!(evs(&t.take(), "error")[0]["cmd"], "key_set");
    app(&mut t, r#"{"cmd":"key_remove","id":"anthropic"}"#);
    assert_eq!(evs(&t.take(), "accounts")[0]["items"][0]["state"], "signed_out");
}

#[test]
fn a_sign_in_runs_once_at_a_time_and_accounts_come_at_its_end() {
    let mut t = T::new();
    let w = setup(&mut t);
    app(&mut t, r#"{"cmd":"sign_in","id":"chatgpt"}"#);
    app(&mut t, r#"{"cmd":"sign_in","id":"chatgpt"}"#);
    assert_eq!(w.borrow().sign_ins, vec!["chatgpt"]);
    let out = t.take();
    assert_eq!(evs(&out, "error")[0]["cmd"], "sign_in");
    assert!(evs(&out, "accounts").is_empty(), "not before its end");
    let tx = w.borrow_mut().signing.take().unwrap();
    tx.send(Done::SignedIn { id: "chatgpt".into(), res: Err("you closed the page".into()) }).unwrap();
    t.until(|o| !evs(o, "accounts").is_empty());
    let out = t.take();
    assert!(evs(&out, "error")[0]["text"].as_str().unwrap().contains("you closed the page"));
    app(&mut t, r#"{"cmd":"sign_in","id":"chatgpt"}"#);
    assert_eq!(w.borrow().sign_ins.len(), 2, "a new one after the end");
}

#[test]
fn found_scan_answers_found_newest_first_with_his_projects_flagged() {
    let mut t = T::new();
    setup(&mut t);
    app(&mut t, r#"{"cmd":"found_scan"}"#);
    t.until(|o| !evs(o, "found").is_empty());
    let out = t.take();
    let f = evs(&out, "found")[0];
    assert_eq!(f["dir"], "/h");
    assert_eq!(f["items"].as_array().unwrap().iter().map(|i| (i["name"].as_str().unwrap(), i["known"].as_bool().unwrap())).collect::<Vec<_>>(), vec![("blog", false), ("shop", true)]);
}

#[test]
fn projects_are_added_moved_renamed_and_removed_through_the_registry() {
    let mut t = T::new();
    let w = setup(&mut t);
    app(&mut t, r#"{"cmd":"project_add","path":"/p/blog","land":true}"#);
    app(&mut t, r#"{"cmd":"project_add","path":"/p/notes"}"#);
    app(&mut t, r#"{"cmd":"project_move","project":"docs","order":0}"#);
    app(&mut t, r#"{"cmd":"project_rename","project":"shop","name":"shop web"}"#);
    app(&mut t, r#"{"cmd":"project_remove","project":"docs"}"#);
    app(&mut t, r#"{"cmd":"project_remove","project":"home"}"#);
    app(&mut t, r#"{"cmd":"project_rename","project":"nope","name":"x"}"#);
    let w = w.borrow();
    assert_eq!(w.added, vec![PathBuf::from("/p/blog"), PathBuf::from("/p/notes")]);
    assert_eq!(w.flows, vec![(PathBuf::from("/p/blog"), true)], "land: trunk; absent: devflow decides");
    assert_eq!(
        w.ops,
        vec![
            RegistryOp::Move("/p/docs".into(), 0),
            RegistryOp::Rename("/p/shop".into(), "shop web".into()),
            RegistryOp::Remove("/p/docs".into()),
        ]
    );
    let out = t.take();
    let errs: Vec<&str> = evs(&out, "error").iter().map(|e| e["cmd"].as_str().unwrap()).collect();
    assert_eq!(errs, vec!["project_remove", "project_rename"], "home and an unknown id refused");
}

#[test]
fn setup_lines_parse_as_the_cores_and_hub_commands_stay_typed() {
    assert!(matches!(Cmd::parse(r#"{"cmd":"found_scan","dir":"/x"}"#), Ok(Cmd::App(_))));
    assert!(matches!(Cmd::parse(r#"{"cmd":"project_rename","project":"a","name":"b"}"#), Ok(Cmd::App(_))));
    assert!(matches!(Cmd::parse(r#"{"cmd":"send","project":"a","agent":"main","text":"x","mode":"now"}"#), Ok(Cmd::Typed(_))));
    let e = Cmd::parse(r#"{"cmd":"key_set","id":"a"}"#).err().unwrap();
    assert!(e.starts_with("key_set"), "{e}");
}

/// P.1: the plugins of bise's home or of a project, a toggle through the
/// one writer, a logout, and a login that runs once, pending until it
/// ends (the fake's runner: never his browser).
#[test]
fn the_window_lists_toggles_and_logs_in_to_plugins() {
    let mut t = T::new();
    let w = setup(&mut t);
    app(&mut t, r#"{"cmd":"plugins"}"#);
    let out = t.take();
    let ev = evs(&out, "plugins");
    assert_eq!(ev.len(), 1);
    assert!(ev[0].get("project").is_none());
    assert_eq!(ev[0]["items"][0]["what"], "/p/home", "bise's home workspace");
    assert_eq!(ev[0]["items"][1]["state"], "disabled");

    app(&mut t, r#"{"cmd":"plugin_set","project":"shop","name":"computer","on":true}"#);
    let out = t.take();
    assert_eq!(w.borrow().plugin_sets, vec![("computer".to_string(), true)]);
    let ev = evs(&out, "plugins");
    assert_eq!((ev[0]["project"].as_str(), ev[0]["items"][1]["state"].as_str()), (Some("shop"), Some("loaded")));
    assert_eq!(ev[0]["items"][0]["what"], "/p/shop");

    app(&mut t, r#"{"cmd":"plugin_set","name":"nope","on":false}"#);
    let out = t.take();
    assert_eq!(evs(&out, "error")[0]["cmd"], "plugin_set");
    app(&mut t, r#"{"cmd":"plugins","project":"gone"}"#);
    assert!(evs(&t.take(), "error")[0]["text"].as_str().is_some_and(|e| e.contains("no project gone")));

    app(&mut t, r#"{"cmd":"plugin_logout","name":"linear"}"#);
    assert_eq!(w.borrow().plugin_logouts, vec![(PathBuf::from("/p/home"), "linear".to_string())]);
    t.take();

    app(&mut t, r#"{"cmd":"plugin_login","name":"linear"}"#);
    let out = t.take();
    assert_eq!(evs(&out, "plugins")[0]["items"][0]["logins"][0]["state"], "pending");
    app(&mut t, r#"{"cmd":"plugin_login","name":"linear"}"#);
    assert!(evs(&t.take(), "error")[0]["text"].as_str().is_some_and(|e| e.contains("still open")));
    assert_eq!(w.borrow().plugin_logins.len(), 1, "one login at a time");

    let tx = w.borrow_mut().logging_in.take().unwrap();
    tx.send(Done::LoggedIn { name: "linear".into(), project: None, res: Err("the browser closed".into()) }).unwrap();
    t.until(|o| !evs(o, "plugins").is_empty());
    let out = t.take();
    assert!(evs(&out, "error")[0]["text"].as_str().is_some_and(|e| e.contains("linear: the browser closed")));
    assert_eq!(evs(&out, "plugins")[0]["items"][0]["logins"][0]["state"], "needs", "no longer pending");
}
