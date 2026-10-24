//! The fixture plugin through the real bridge: resolved, its server
//! started, the index files written, a tool call over loopback HTTP.

use std::io::{BufRead, BufReader, Read, Write};
use std::net::TcpStream;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};

use bend_plugins::connectors::Catalog;
use bend_plugins::id::{PartKind, PluginId};
use bend_plugins::model::{ConnectorAuth, ConnectorEntry, StateV2, ToolEntry};
use bend_plugins::{bridge, resolve, secrets, state, status};

/// The loose skill folders of every bridge in this binary: one of the
/// test's own (`$BISE_SKILL_ROOTS`, set the same by each test), never the
/// user's HOME or the repo's `.agents/skills`.
fn own_skill_roots() -> PathBuf {
    let dir = std::env::temp_dir().join(format!("bp-bridge-skills-{}", std::process::id()));
    let f = dir.join("loose-one/SKILL.md");
    std::fs::create_dir_all(f.parent().unwrap()).unwrap();
    std::fs::write(&f, "---\nname: loose-one\ndescription: A loose skill.\n---\n").unwrap();
    std::env::set_var(bend_plugins::skills::ENV, format!("personal={}\n", dir.display()));
    dir
}

fn fixture_root(tag: &str) -> (PathBuf, PathBuf) {
    own_skill_roots();
    let base = std::env::temp_dir().join(format!("bp-bridge-{}-{}", tag, std::process::id()));
    let _ = std::fs::remove_dir_all(&base);
    let plugins = base.join("ws/.agents/plugins");
    std::fs::create_dir_all(&plugins).unwrap();
    let src = Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/hello-plugin");
    let ok = std::process::Command::new("cp")
        .arg("-R")
        .arg(&src)
        .arg(plugins.join("hello-plugin"))
        .status()
        .unwrap()
        .success();
    assert!(ok);
    (base.canonicalize().unwrap(), plugins)
}

fn wait_until(what: &str, f: impl Fn() -> bool) {
    let t0 = Instant::now();
    while !f() {
        assert!(t0.elapsed() < Duration::from_secs(20), "never: {}", what);
        std::thread::sleep(Duration::from_millis(25));
    }
}

/// POST one JSON-RPC body on a kept-alive connection.
fn post(r: &mut BufReader<TcpStream>, path: &str, body: &str) -> (u32, String) {
    let host = r.get_ref().peer_addr().unwrap();
    write!(
        r.get_mut(),
        "POST {} HTTP/1.1\r\nHost: {}\r\nContent-Type: application/json\r\nContent-Length: {}\r\n\r\n{}",
        path,
        host,
        body.len(),
        body
    )
    .unwrap();
    let mut status = String::new();
    r.read_line(&mut status).unwrap();
    let code: u32 = status.split_whitespace().nth(1).unwrap().parse().unwrap();
    let mut len = 0;
    loop {
        let mut h = String::new();
        r.read_line(&mut h).unwrap();
        if h.trim().is_empty() {
            break;
        }
        if let Some(v) = h.to_ascii_lowercase().strip_prefix("content-length:") {
            len = v.trim().parse().unwrap();
        }
    }
    let mut b = vec![0; len];
    r.read_exact(&mut b).unwrap();
    (code, String::from_utf8(b).unwrap())
}

#[test]
fn fixture_plugin_end_to_end() {
    let (base, plugins) = fixture_root("e2e");
    let dir = base.join("run/plugins");
    let mut parent = std::process::Command::new("sleep").arg("60").spawn().unwrap();
    let roots = resolve::Roots {
        builtin: None,
        user: Some(base.join("nothing-here")),
        workspace: Some(plugins.clone()),
        data: base.join("data"),
        state: Default::default(),
    };
    let opts = bridge::Opts::new(dir.clone(), Some(parent.id()), roots);
    let server = std::thread::spawn(move || bridge::serve(opts));
    let t0 = Instant::now();
    while !dir.join("ready").exists() {
        assert!(t0.elapsed() < Duration::from_secs(15), "bridge never ready");
        std::thread::sleep(Duration::from_millis(50));
    }

    // written before ready (the REPL's first prompt reads it): the
    // plugin's skill, then the loose folders' (bend_plugins::skills)
    let skills = std::fs::read_to_string(dir.join("skills-index.txt")).unwrap();
    let lines: Vec<&str> = skills.lines().collect();
    assert_eq!(lines.len(), 2, "{}", skills);
    assert!(lines[0].starts_with("hello_plugin:greet\tGreet someone"), "{}", skills);
    assert!(lines[0].ends_with("skills/greet/SKILL.md"), "{}", skills);
    assert!(lines[1].starts_with("loose-one\tA loose skill.\t") && lines[1].ends_with("loose-one/SKILL.md"), "{}", skills);

    let index = std::fs::read_to_string(dir.join("mcp-index.txt")).unwrap();
    let line = index.lines().next().expect("one tool line");
    // <cid> <group> <tool> : #<desc> | input: <schema>
    let mut f = line.splitn(4, ' ');
    let cid = f.next().unwrap().to_string();
    assert_eq!(f.next(), Some("hello_plugin"));
    assert_eq!(f.next(), Some("shout"));
    assert!(line.contains(" : #Upper-case a text"), "{}", line);
    assert!(line.contains("| input: {"), "{}", line);
    assert!(cid.starts_with("http://127.0.0.1:") && cid.ends_with("/hello-plugin/echo"), "{}", cid);

    let report = std::fs::read_to_string(dir.join("report.txt")).unwrap();
    assert!(report.contains("hello-plugin v0.1.0 [loaded] workspace"), "{}", report);
    assert!(report.contains("mcp echo: 1 tool as tools.hello_plugin.*"), "{}", report);

    // the Bend runtime's sequence: initialize, initialized, tools/call on one connection
    let rest = cid.strip_prefix("http://").unwrap();
    let (host, path) = rest.split_at(rest.find('/').unwrap());
    let mut r = BufReader::new(TcpStream::connect(host).unwrap());
    let (c, b) = post(&mut r, path, r#"{"jsonrpc":"2.0","id":0,"method":"initialize","params":{}}"#);
    assert_eq!(c, 200);
    assert!(b.contains("hello-plugin-echo"), "{}", b);
    let (c, b) = post(&mut r, path, r#"{"jsonrpc":"2.0","method":"notifications/initialized"}"#);
    assert_eq!((c, b.as_str()), (202, ""));
    let call = r#"{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"shout","arguments":{"text":"bend"}}}"#;
    let (c, b) = post(&mut r, path, call);
    assert_eq!(c, 200);
    let v: serde_json::Value = serde_json::from_str(&b).unwrap();
    assert_eq!(v["id"], 2);
    assert_eq!(v["result"]["content"][0]["text"], "HELLO-PLUGIN:BEND (call 1)");
    // PLUGIN_DATA is durable and per plugin
    assert_eq!(std::fs::read_to_string(base.join("data/hello-plugin/calls.txt")).unwrap(), "1");

    // a wrong token is a 404
    let bad = path.replacen('/', "/x", 1);
    let (c, _) = post(&mut r, &bad, call);
    assert_eq!(c, 404);

    // the parent goes away: the bridge stops
    parent.kill().unwrap();
    parent.wait().unwrap();
    let t0 = Instant::now();
    while !server.is_finished() {
        assert!(t0.elapsed() < Duration::from_secs(10), "bridge outlived its parent");
        std::thread::sleep(Duration::from_millis(100));
    }
    server.join().unwrap().unwrap();
    let _ = std::fs::remove_dir_all(&base);
}

#[test]
fn failing_server_is_a_diagnostic() {
    let (base, plugins) = fixture_root("fail");
    std::fs::write(
        plugins.join("hello-plugin/mcp.json"),
        r#"{"$schema":"https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
            "mcpServers":{"echo":{"type":"stdio","command":"sh","args":["-c","echo boom >&2; exit 3"]}}}"#,
    )
    .unwrap();
    let dir = base.join("run/plugins");
    let roots = resolve::Roots {
        builtin: None,
        user: None,
        workspace: Some(plugins),
        data: base.join("data"),
        state: Default::default(),
    };
    let mut parent = std::process::Command::new("sleep").arg("60").spawn().unwrap();
    let opts = bridge::Opts::new(dir.clone(), Some(parent.id()), roots);
    let server = std::thread::spawn(move || bridge::serve(opts));
    wait_until("the bridge ready", || dir.join("ready").exists());
    assert_eq!(std::fs::read_to_string(dir.join("mcp-index.txt")).unwrap(), "");
    let report = std::fs::read_to_string(dir.join("report.txt")).unwrap();
    assert!(report.contains("plugin.mcp.connection_failed"), "{}", report);
    assert!(report.contains("boom"), "{}", report);
    // the skill still loads
    assert!(std::fs::read_to_string(dir.join("skills-index.txt")).unwrap().contains("hello_plugin:greet"));
    parent.kill().unwrap();
    parent.wait().unwrap();
    server.join().unwrap().unwrap();
    let _ = std::fs::remove_dir_all(&base);
}

/// mcp.json's own limits (Codex's keys): `disabled_tools` keeps a tool
/// out of the index and refuses its call; `tool_timeout_sec` bounds a
/// call; a server slower than the bridge's ready wait is not waited for:
/// the files are written, the server joins the index when it is up.
#[test]
fn limits_filter_tools_bound_calls_and_late_servers_join() {
    let (base, plugins) = fixture_root("limits");
    std::fs::write(
        plugins.join("hello-plugin/mcp.json"),
        r#"{"mcpServers":{
            "off":{"command":"python3","args":["-B","${PLUGIN_ROOT}/server.py"],"disabled_tools":["shout"]},
            "nap":{"command":"python3","args":["-B","${PLUGIN_ROOT}/server.py"],"env":{"HELLO_NAP":"3"},"tool_timeout_sec":1},
            "slow":{"command":"sh","args":["-c","sleep 8; exec python3 -B \"$0\"","${PLUGIN_ROOT}/server.py"],"startup_timeout_sec":30},
            "gone":{"command":"python3","enabled":false}}}"#,
    )
    .unwrap();
    let dir = base.join("run/plugins");
    let mut parent = std::process::Command::new("sleep").arg("60").spawn().unwrap();
    let roots = resolve::Roots {
        builtin: None,
        user: None,
        workspace: Some(plugins),
        data: base.join("data"),
        state: Default::default(),
    };
    let opts = bridge::Opts { ready_wait: Duration::from_secs(4), ..bridge::Opts::new(dir.clone(), Some(parent.id()), roots) };
    let server = std::thread::spawn(move || bridge::serve(opts));
    let t0 = Instant::now();
    while !dir.join("ready").exists() {
        assert!(t0.elapsed() < Duration::from_secs(15), "bridge never ready");
        std::thread::sleep(Duration::from_millis(50));
    }
    assert!(t0.elapsed() < Duration::from_secs(7), "the ready wait waited for the slow server: {:?}", t0.elapsed());
    let report = std::fs::read_to_string(dir.join("report.txt")).unwrap();
    assert!(report.contains("plugin.mcp.server_off") && report.contains("\"gone\" is off"), "{}", report);
    assert!(!std::fs::read_to_string(dir.join("mcp-index.txt")).unwrap().contains("/hello-plugin/slow"));
    // on a loaded machine "nap" may itself come after the ready wait
    let t1 = Instant::now();
    let index = loop {
        let index = std::fs::read_to_string(dir.join("mcp-index.txt")).unwrap();
        if index.contains("/hello-plugin/nap") {
            break index;
        }
        assert!(t1.elapsed() < Duration::from_secs(20), "nap never joined: {}", index);
        std::thread::sleep(Duration::from_millis(100));
    };
    // "off" lists shout but turned it off: the one shout is "nap"'s
    let cids: Vec<&str> = index.lines().map(|l| l.split(' ').next().unwrap()).collect();
    assert_eq!(cids.len(), 1, "{}", index);
    assert!(cids[0].ends_with("/hello-plugin/nap"), "{}", index);
    let base_url = cids[0].trim_end_matches("/hello-plugin/nap").to_string();
    let rest = base_url.strip_prefix("http://").unwrap();
    let (host, token) = rest.split_at(rest.find('/').unwrap());
    let mut r = BufReader::new(TcpStream::connect(host).unwrap());
    let call = r#"{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"shout","arguments":{"text":"x"}}}"#;
    // a disabled tool is not callable
    let (_, b) = post(&mut r, &format!("{}/hello-plugin/off", token), call);
    assert!(b.contains("shout is turned off in off's mcp.json"), "{}", b);
    // the slow server, still starting
    let (_, b) = post(&mut r, &format!("{}/hello-plugin/slow", token), call);
    assert!(b.contains("slow is still starting"), "{}", b);
    // a call longer than tool_timeout_sec
    let t2 = Instant::now();
    let (_, b) = post(&mut r, &format!("{}/hello-plugin/nap", token), call);
    assert!(b.contains("no answer to tools/call within 1s"), "{}", b);
    assert!(t2.elapsed() < Duration::from_millis(2500), "{:?}", t2.elapsed());
    // the slow one joins the index (its shout collides with nap's: nap
    // keeps it, plugin order; the slow server's entry is there anyway)
    let t0 = Instant::now();
    loop {
        let (_, b) = post(&mut r, &format!("{}/hello-plugin/slow", token), call);
        if b.contains("HELLO-PLUGIN:X") {
            break;
        }
        assert!(t0.elapsed() < Duration::from_secs(30), "the slow server never came up: {}", b);
        std::thread::sleep(Duration::from_millis(200));
    }
    parent.kill().unwrap();
    parent.wait().unwrap();
    server.join().unwrap().unwrap();
    let _ = std::fs::remove_dir_all(&base);
}

// ---- the session's one tool index: connectors, toggles, no server ----

/// A catalog with one ready connector (`gmail`, one tool), given once.
fn fake_catalog() -> bridge::CatalogSource {
    let given = AtomicBool::new(false);
    Arc::new(move |_now| {
        if given.swap(true, Ordering::SeqCst) {
            return None;
        }
        Some(Catalog {
            connectors: vec![ConnectorEntry {
                name: "gmail".into(),
                display_name: "Gmail".into(),
                id: "c0ffee-gmail".into(),
                auth: ConnectorAuth::Ready,
                tools: vec![ToolEntry { name: "send_email".into(), description: "Send a mail".into(), input_schema: r#"{"type":"object"}"#.into() }],
            }],
            fetched_ms: 1,
            error: None,
        })
    })
}

fn roots_of(base: &Path, workspace: Option<PathBuf>) -> resolve::Roots {
    resolve::Roots { builtin: None, user: None, workspace, data: base.join("data"), state: StateV2::default() }
}

fn index(dir: &Path) -> String {
    std::fs::read_to_string(dir.join("mcp-index.txt")).unwrap_or_default()
}

/// The loopback connection and path of the line of `tool` in the index.
fn route(dir: &Path, tool: &str) -> (BufReader<TcpStream>, String) {
    let i = index(dir);
    let line = i.lines().find(|l| l.split(' ').nth(2) == Some(tool)).unwrap_or_else(|| panic!("no {tool} in {i}"));
    let rest = line.split(' ').next().unwrap().strip_prefix("http://").unwrap().to_string();
    let (host, path) = rest.split_at(rest.find('/').unwrap());
    (BufReader::new(TcpStream::connect(host).unwrap()), path.to_string())
}

const SHOUT: &str = r#"{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"shout","arguments":{"text":"x"}}}"#;

/// The index has the plugin's tools and the connectors'; a connector, a
/// tool and a server turned off leave it within one poll (no relaunch);
/// a call to a tool turned off is refused with the words at once, and a
/// server turned on again starts and answers.
#[test]
fn connectors_and_toggles_reach_the_index_within_a_poll() {
    let (base, plugins) = fixture_root("toggles");
    let (dir, sp) = (base.join("run/plugins"), base.join("plugins.json"));
    let mut parent = std::process::Command::new("sleep").arg("60").spawn().unwrap();
    let sd = base.join("status");
    let opts = bridge::Opts {
        state_path: Some(sp.clone()),
        catalog: Some(fake_catalog()),
        status_dir: Some(sd.clone()),
        poll: Duration::from_millis(100),
        grace: Duration::from_millis(500),
        ..bridge::Opts::new(dir.clone(), Some(parent.id()), roots_of(&base, Some(plugins)))
    };
    let server = std::thread::spawn(move || bridge::serve(opts));
    wait_until("the bridge ready", || dir.join("ready").exists());
    // a stdio server's state for the Plugins list: its command's name and
    // its tools by name (the switches)
    let st = status::read(&sd, "hello-plugin", "echo").expect("the stdio server's status");
    assert_eq!((st.transport.as_str(), st.host.as_str(), st.tools.clone()), ("stdio", "python3", Ok(1)));
    assert_eq!(st.listed.iter().map(|(n, _)| n.as_str()).collect::<Vec<_>>(), vec!["shout"]);
    let i = index(&dir);
    assert!(i.lines().any(|l| l.contains(" hello_plugin shout : #Upper-case")), "{i}");
    assert!(i.lines().any(|l| l.starts_with("c0ffee-gmail ") && l.contains(" send_email : #Send a mail")), "{i}");

    // a connector off
    state::set(&sp, &PluginId::mistral("gmail"), false).unwrap();
    wait_until("gmail out of the index", || !index(&dir).contains("send_email"));
    assert!(index(&dir).contains(" shout "));

    // a tool off: refused at once (plugins.json read at the call), then
    // out of the index
    let plugin = PluginId::plugin("hello-plugin");
    let (mut r, path) = route(&dir, "shout");
    state::set(&sp, &plugin.part(PartKind::Tool, Some("echo"), "shout"), false).unwrap();
    let (_, b) = post(&mut r, &path, SHOUT);
    assert!(b.contains(&bridge::off_error("hello_plugin.shout")), "{b}");
    wait_until("shout out of the index", || !index(&dir).contains(" shout "));
    state::set(&sp, &plugin.part(PartKind::Tool, Some("echo"), "shout"), true).unwrap();
    wait_until("shout back", || index(&dir).contains(" shout "));
    let (_, b) = post(&mut r, &path, SHOUT);
    assert!(b.contains("HELLO-PLUGIN:X"), "{b}");

    // its server off: refused, out of the index; on again: started, answers
    state::set(&sp, &plugin.part(PartKind::Mcp, None, "echo"), false).unwrap();
    let (_, b) = post(&mut r, &path, SHOUT);
    assert!(b.contains(&bridge::off_error("hello_plugin.shout")), "{b}");
    wait_until("echo out of the index", || !index(&dir).contains("/hello-plugin/echo"));
    let (_, b) = post(&mut r, &path, SHOUT);
    assert!(b.contains(&bridge::off_error("hello_plugin.shout")), "the retired server still says why: {b}");
    state::set(&sp, &plugin.part(PartKind::Mcp, None, "echo"), true).unwrap();
    wait_until("echo back", || index(&dir).contains("/hello-plugin/echo"));
    let (mut r, path) = route(&dir, "shout");
    let (_, b) = post(&mut r, &path, SHOUT);
    assert!(b.contains("HELLO-PLUGIN:X"), "{b}");

    parent.kill().unwrap();
    parent.wait().unwrap();
    server.join().unwrap().unwrap();
    let _ = std::fs::remove_dir_all(&base);
}

/// No plugin server: the bridge stays (it keeps the connectors' lines
/// fresh) and stops with its parent.
#[test]
fn the_bridge_stays_up_with_no_server_and_stops_with_its_parent() {
    let base = std::env::temp_dir().join(format!("bp-bridge-alone-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&base);
    let dir = base.join("run/plugins");
    let mut parent = std::process::Command::new("sleep").arg("60").spawn().unwrap();
    let opts = bridge::Opts { catalog: Some(fake_catalog()), poll: Duration::from_millis(100), ..bridge::Opts::new(dir.clone(), Some(parent.id()), roots_of(&base, None)) };
    let server = std::thread::spawn(move || bridge::serve(opts));
    wait_until("the bridge ready", || dir.join("ready").exists());
    assert!(index(&dir).contains("c0ffee-gmail gmail send_email"), "{}", index(&dir));
    std::thread::sleep(Duration::from_millis(500));
    assert!(!server.is_finished(), "the bridge left with no server");
    parent.kill().unwrap();
    parent.wait().unwrap();
    wait_until("the bridge gone with its parent", || server.is_finished());
    server.join().unwrap().unwrap();
    let _ = std::fs::remove_dir_all(&base);
}

/// A `${VAR}` of a server's env that the env lacks comes from his MCP
/// secrets for that plugin; with none, the server does not start and the
/// report names the variable.
#[test]
fn an_env_var_falls_back_to_his_mcp_secrets() {
    let (base, plugins) = fixture_root("secret-env");
    std::fs::write(
        plugins.join("hello-plugin/mcp.json"),
        r#"{"mcpServers":{"echo":{"command":"python3","args":["-B","${PLUGIN_ROOT}/server.py"],
            "env":{"HELLO_STATE":"${BP_BRIDGE_TEST_STATE}"}}}}"#,
    )
    .unwrap();
    let (dir, secrets_dir) = (base.join("run/plugins"), base.join("mcp-env"));
    let calls = base.join("from-secret.txt");
    let start = |dir: &Path| {
        let parent = std::process::Command::new("sleep").arg("60").spawn().unwrap();
        let opts = bridge::Opts { env_dir: Some(secrets_dir.clone()), ..bridge::Opts::new(dir.to_path_buf(), Some(parent.id()), roots_of(&base, Some(plugins.clone()))) };
        let server = std::thread::spawn(move || bridge::serve(opts));
        wait_until("the bridge ready", || dir.join("ready").exists());
        (parent, server)
    };
    // nothing saved: not started, the report says which variable
    let (mut parent, server) = start(&dir);
    let report = std::fs::read_to_string(dir.join("report.txt")).unwrap();
    assert!(report.contains("env HELLO_STATE uses ${BP_BRIDGE_TEST_STATE}, which is not set"), "{report}");
    parent.kill().unwrap();
    parent.wait().unwrap();
    server.join().unwrap().unwrap();
    // saved: the server gets it
    secrets::write(&secrets_dir, &PluginId::plugin("hello-plugin"), &[("BP_BRIDGE_TEST_STATE".to_string(), calls.to_string_lossy().into_owned())]).unwrap();
    let dir2 = base.join("run2/plugins");
    let (mut parent, server) = start(&dir2);
    let (mut r, path) = route(&dir2, "shout");
    let (_, b) = post(&mut r, &path, SHOUT);
    assert!(b.contains("HELLO-PLUGIN:X (call 1)"), "{b}");
    assert_eq!(std::fs::read_to_string(&calls).unwrap(), "1");
    parent.kill().unwrap();
    parent.wait().unwrap();
    server.join().unwrap().unwrap();
    let _ = std::fs::remove_dir_all(&base);
}

/// An opt-in plugin (`"dev.bise": {"default": "off"}`, like `computer`)
/// is on only while named in `enabled`: emptied by hand, its tool's call
/// is refused at once, before any poll retires its server.
#[test]
fn an_opt_in_plugins_tool_is_refused_once_it_leaves_enabled() {
    let (base, plugins) = fixture_root("opt-in");
    let manifest = plugins.join("hello-plugin/plugin.json");
    let mut m: serde_json::Value = serde_json::from_str(&std::fs::read_to_string(&manifest).unwrap()).unwrap();
    m["extensions"] = serde_json::json!({"dev.bise": {"default": "off"}});
    std::fs::write(&manifest, m.to_string()).unwrap();
    let (dir, sp) = (base.join("run/plugins"), base.join("plugins.json"));
    std::fs::write(&sp, r#"{"enabled": ["hello-plugin"]}"#).unwrap();
    let mut parent = std::process::Command::new("sleep").arg("60").spawn().unwrap();
    let opts = bridge::Opts {
        state_path: Some(sp.clone()),
        // no poll during the test: the refusal is the call's own check
        poll: Duration::from_secs(600),
        ..bridge::Opts::new(dir.clone(), Some(parent.id()), roots_of(&base, Some(plugins)))
    };
    let server = std::thread::spawn(move || bridge::serve(opts));
    wait_until("the bridge ready", || dir.join("ready").exists());
    let (mut r, path) = route(&dir, "shout");
    let (_, b) = post(&mut r, &path, SHOUT);
    assert!(b.contains("HELLO-PLUGIN:X"), "{b}");
    std::fs::write(&sp, r#"{"enabled": []}"#).unwrap();
    let (_, b) = post(&mut r, &path, SHOUT);
    assert!(b.contains(&bridge::off_error("hello_plugin.shout")), "{b}");
    parent.kill().unwrap();
    parent.wait().unwrap();
    server.join().unwrap().unwrap();
    let _ = std::fs::remove_dir_all(&base);
}
