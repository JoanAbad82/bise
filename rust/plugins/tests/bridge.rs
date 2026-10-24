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

/// A plugin he removes (bend_plugins::remove) while its server runs:
/// within a poll its tools leave the index, and the next call gets the
/// off words (architect m_39853).
#[test]
fn a_removed_plugins_server_is_retired_within_a_poll() {
    let (base, plugins) = fixture_root("removed");
    let dir = base.join("run/plugins");
    let mut parent = std::process::Command::new("sleep").arg("60").spawn().unwrap();
    let ctx = bend_plugins::add::Ctx { user_root: plugins.clone(), ..bend_plugins::add::Ctx::under(&base) };
    let roots = resolve::Roots { builtin: None, user: Some(plugins.clone()), workspace: None, data: base.join("data"), state: StateV2::default() };
    let opts = bridge::Opts {
        state_path: Some(ctx.state.clone()),
        poll: Duration::from_millis(100),
        grace: Duration::from_millis(500),
        ..bridge::Opts::new(dir.clone(), Some(parent.id()), roots)
    };
    let server = std::thread::spawn(move || bridge::serve(opts));
    wait_until("the bridge ready", || dir.join("ready").exists());
    let (mut r, path) = route(&dir, "shout");
    let (_, b) = post(&mut r, &path, SHOUT);
    assert!(b.contains("HELLO-PLUGIN:X"), "{b}");

    bend_plugins::remove::remove(&ctx, None, &PluginId::plugin("hello-plugin")).unwrap();
    wait_until("shout out of the index", || !index(&dir).contains(" shout "));
    let (_, b) = post(&mut r, &path, SHOUT);
    assert!(b.contains(&bridge::off_error("hello_plugin.shout")), "{b}");

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

/// Lazy stdio servers (`bend_plugins::tools_cache`): N cold bridges
/// sharing one tools cache start the server once (listed, then stopped)
/// and each lists its tools; a warm bridge starts it 0 times; a call
/// starts it, a server idle past `idle_stop` is stopped, and the next
/// call starts it again. The wrapper counts the starts (its pid, one
/// line each).
#[test]
fn lazy_servers_start_once_for_n_cold_bridges_and_on_a_call() {
    let (base, plugins) = fixture_root("lazy");
    let starts = base.join("starts.txt");
    std::fs::write(
        plugins.join("hello-plugin/mcp.json"),
        format!(
            r#"{{"mcpServers":{{"echo":{{"command":"sh","args":["-c","echo $$ >> {}; exec python3 -B \"$0\"","${{PLUGIN_ROOT}}/server.py"]}}}}}}"#,
            starts.display()
        ),
    )
    .unwrap();
    let (cache, sd) = (base.join("cache/mcp-tools"), base.join("status"));
    let count = || std::fs::read_to_string(&starts).unwrap_or_default().lines().count();
    let start = |dir: &Path| {
        let parent = std::process::Command::new("sleep").arg("60").spawn().unwrap();
        let opts = bridge::Opts {
            tools_cache: Some(place(&cache)),
            status_dir: Some(sd.clone()),
            idle_stop: Duration::from_secs(2),
            ..bridge::Opts::new(dir.to_path_buf(), Some(parent.id()), roots_of(&base, Some(plugins.clone())))
        };
        (parent, std::thread::spawn(move || bridge::serve(opts)))
    };
    let stop = |(mut parent, server): (std::process::Child, std::thread::JoinHandle<std::io::Result<()>>)| {
        parent.kill().unwrap();
        parent.wait().unwrap();
        server.join().unwrap().unwrap();
    };
    // 4 cold bridges at once: one start among them
    let dirs: Vec<PathBuf> = (0..4).map(|i| base.join(format!("run{i}/plugins"))).collect();
    let cold: Vec<_> = dirs.iter().map(|d| start(d)).collect();
    for d in &dirs {
        wait_until("a cold bridge ready", || d.join("ready").exists());
        wait_until("shout in its index", || index(d).contains(" shout :"));
    }
    assert_eq!(count(), 1, "one start for 4 cold bridges");
    let first: u32 = std::fs::read_to_string(&starts).unwrap().trim().parse().unwrap();
    let alive = |pid: u32| std::process::Command::new("kill").args(["-0", &pid.to_string()]).stderr(std::process::Stdio::null()).status().unwrap().success();
    wait_until("the listing start stopped", || !alive(first));
    // listed, not running: a state, not an error
    let st = status::read(&sd, "hello-plugin", "echo").unwrap();
    assert!(st.idle && st.tools == Ok(1), "{st:?}");
    // a warm bridge: 0 starts
    let warm_dir = base.join("warm/plugins");
    let warm = start(&warm_dir);
    wait_until("the warm bridge ready", || warm_dir.join("ready").exists());
    assert!(index(&warm_dir).contains(" shout :"), "{}", index(&warm_dir));
    assert_eq!(count(), 1, "a warm bridge started it");
    // a call starts it, once
    let (mut r, path) = route(&dirs[0], "shout");
    let (_, b) = post(&mut r, &path, SHOUT);
    assert!(b.contains("HELLO-PLUGIN:X"), "{b}");
    let (_, b) = post(&mut r, &path, SHOUT);
    assert!(b.contains("HELLO-PLUGIN:X"), "{b}");
    assert_eq!(count(), 2, "one start for two calls");
    let running: u32 = std::fs::read_to_string(&starts).unwrap().lines().last().unwrap().parse().unwrap();
    assert!(alive(running));
    // idle past idle_stop: stopped; the next call starts it again
    wait_until("the idle server stopped", || !alive(running));
    assert!(index(&dirs[0]).contains(" shout :"), "still listed");
    let (_, b) = post(&mut r, &path, SHOUT);
    assert!(b.contains("HELLO-PLUGIN:X"), "{b}");
    assert_eq!(count(), 3);
    for b in cold {
        stop(b);
    }
    stop(warm);
    let _ = std::fs::remove_dir_all(&base);
}

// ---- the tools cache's rules (bend_plugins::tools_cache, architect t_40590) ----

/// The cache at `dir`, its salt next to it (as `Home::mcp_tools_salt`).
fn place(dir: &Path) -> bend_plugins::tools_cache::Place {
    bend_plugins::tools_cache::Place { dir: dir.to_path_buf(), salt: dir.with_extension("salt") }
}

/// Every list in the cache at `dir`.
fn cached(dir: &Path) -> Vec<String> {
    let Ok(rd) = std::fs::read_dir(dir) else { return Vec::new() };
    rd.flatten().filter(|e| e.path().extension().is_some_and(|x| x == "json")).map(|e| std::fs::read_to_string(e.path()).unwrap()).collect()
}

/// One bridge on the shared cache `cache` of the plugin `hello-plugin`
/// in `plugins`; `env_dir`: his typed secrets.
fn cached_bridge(base: &Path, plugins: &Path, cache: &Path, dir: &Path, env_dir: Option<PathBuf>) -> (std::process::Child, std::thread::JoinHandle<std::io::Result<()>>) {
    let parent = std::process::Command::new("sleep").arg("60").spawn().unwrap();
    let opts = bridge::Opts {
        tools_cache: Some(place(cache)),
        env_dir,
        ..bridge::Opts::new(dir.to_path_buf(), Some(parent.id()), roots_of(base, Some(plugins.to_path_buf())))
    };
    let server = std::thread::spawn(move || bridge::serve(opts));
    wait_until("the bridge ready", || dir.join("ready").exists());
    (parent, server)
}

fn stop_bridge((mut parent, server): (std::process::Child, std::thread::JoinHandle<std::io::Result<()>>)) {
    parent.kill().unwrap();
    parent.wait().unwrap();
    server.join().unwrap().unwrap();
}

/// The echo server, its starts counted in `starts` (its pid, one line
/// each), with `env`.
fn counted_server(plugins: &Path, starts: &Path, env: &str) {
    std::fs::write(
        plugins.join("hello-plugin/mcp.json"),
        format!(
            r#"{{"mcpServers":{{"echo":{{"command":"sh","args":["-c","echo $$ >> {}; exec python3 -B \"$0\"","${{PLUGIN_ROOT}}/server.py"],"env":{}}}}}}}"#,
            starts.display(),
            env
        ),
    )
    .unwrap();
}

/// Rule 2: a server whose tools depend on an env value (a token's
/// scopes, GITHUB_TOOLSETS) gets one cache entry per value: another
/// value is listed by its own start, never served the first one's list;
/// the same value again is served from the cache.
#[test]
fn a_server_listed_with_another_env_value_is_listed_again_not_served_from_the_cache() {
    let (base, plugins) = fixture_root("cache-env");
    let starts = base.join("starts.txt");
    counted_server(&plugins, &starts, r#"{"HELLO_TOOLS":"${BP_CACHE_TOOLSET}"}"#);
    let cache = base.join("cache/mcp-tools");
    let count = || std::fs::read_to_string(&starts).unwrap_or_default().lines().count();
    let with = |set: &str| {
        let d = base.join(format!("secrets-{set}"));
        secrets::write(&d, &PluginId::plugin("hello-plugin"), &[("BP_CACHE_TOOLSET".to_string(), set.to_string())]).unwrap();
        Some(d)
    };
    let run = |n: &str, set: &str| {
        let dir = base.join(format!("{n}/plugins"));
        let b = cached_bridge(&base, &plugins, &cache, &dir, with(set));
        wait_until("listed", || index(&dir).contains(" shout :"));
        let i = index(&dir);
        stop_bridge(b);
        i
    };
    let a = run("a", "alpha");
    assert!(a.contains(" alpha :"), "{a}");
    let b = run("b", "beta");
    assert!(b.contains(" beta :") && !b.contains(" alpha :"), "the other value's list: {b}");
    assert_eq!(count(), 2, "one start per value");
    let a2 = run("a2", "alpha");
    assert!(a2.contains(" alpha :") && !a2.contains(" beta :"), "{a2}");
    assert_eq!(count(), 2, "the same value: served from the cache");
    for l in cached(&cache) {
        assert!(!l.contains("BP_CACHE_TOOLSET"), "a value or its name in the cache: {l}");
    }
    let _ = std::fs::remove_dir_all(&base);
}

/// Rule 1: a server that grows its list for one session after a call
/// (`list_changed`, like FastMCP's enable_components): that session's
/// index gets the new tool, the shared cache keeps the cold list, and
/// another session never sees it.
#[test]
fn a_list_after_list_changed_reaches_its_session_never_the_cache() {
    let (base, plugins) = fixture_root("cache-changed");
    let starts = base.join("starts.txt");
    counted_server(&plugins, &starts, r#"{"HELLO_GROW":"1"}"#);
    let cache = base.join("cache/mcp-tools");
    let dir = base.join("one/plugins");
    let one = cached_bridge(&base, &plugins, &cache, &dir, None);
    wait_until("listed", || index(&dir).contains(" shout :"));
    let (mut r, path) = route(&dir, "shout");
    let (_, b) = post(&mut r, &path, SHOUT);
    assert!(b.contains("HELLO-PLUGIN:X"), "{b}");
    wait_until("grown in its session's index", || index(&dir).contains(" grown :"));
    let lists = cached(&cache);
    assert_eq!(lists.len(), 1, "{lists:?}");
    assert!(lists[0].contains("\"shout\"") && !lists[0].contains("grown"), "a session's list in the cache: {}", lists[0]);
    // another session, warm: the cold list
    let dir2 = base.join("two/plugins");
    let two = cached_bridge(&base, &plugins, &cache, &dir2, None);
    wait_until("listed", || index(&dir2).contains(" shout :"));
    assert!(!index(&dir2).contains(" grown :"), "{}", index(&dir2));
    stop_bridge(one);
    stop_bridge(two);
    let _ = std::fs::remove_dir_all(&base);
}

/// Rule 3: a cached list gone stale (the server's tools changed without
/// a word): the call to a tool it lost is answered with the server's
/// -32602 and its tools now, the session's index is listed again and
/// the cache entry dropped; a -32602 for a bad argument of a tool it
/// still has keeps the entry.
#[test]
fn an_unknown_tool_relists_the_session_and_drops_a_stale_entry_once() {
    let (base, plugins) = fixture_root("cache-unknown");
    let (starts, tools) = (base.join("starts.txt"), base.join("tools.txt"));
    std::fs::write(&tools, "old").unwrap();
    counted_server(&plugins, &starts, &format!(r#"{{"HELLO_TOOLS_FILE":"{}"}}"#, tools.display()));
    let cache = base.join("cache/mcp-tools");
    let count = || std::fs::read_to_string(&starts).unwrap_or_default().lines().count();
    let cold = base.join("cold/plugins");
    stop_bridge(cached_bridge(&base, &plugins, &cache, &cold, None));
    assert_eq!(count(), 1);
    // the server's list changes; a warm bridge still lists "old"
    std::fs::write(&tools, "new").unwrap();
    let dir = base.join("warm/plugins");
    let warm = cached_bridge(&base, &plugins, &cache, &dir, None);
    wait_until("listed", || index(&dir).contains(" old :"));
    assert_eq!(count(), 1, "served from the cache");
    let (mut r, path) = route(&dir, "old");
    let (_, b) = post(&mut r, &path, &SHOUT.replace("\"shout\"", "\"old\""));
    assert!(b.contains("-32602") && b.contains("Unknown tool: old"), "the server's error: {b}");
    assert!(b.contains("its tools now: hello_plugin.shout, hello_plugin.new"), "the fresh names: {b}");
    assert!(cached(&cache).is_empty(), "the stale entry is dropped");
    wait_until("the session's index listed again", || index(&dir).contains(" new :") && !index(&dir).contains(" old :"));
    assert_eq!(count(), 2, "one start: the call's");
    // a cold bridge writes it again; a bad argument keeps it
    stop_bridge(cached_bridge(&base, &plugins, &cache, &base.join("again/plugins"), None));
    assert_eq!(cached(&cache).len(), 1);
    let (_, b) = post(&mut r, &path, r#"{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"shout","arguments":{}}}"#);
    assert!(b.contains("-32602") && b.contains("text is required"), "{b}");
    assert_eq!(cached(&cache).len(), 1, "a bad argument dropped the entry");
    stop_bridge(warm);
    let _ = std::fs::remove_dir_all(&base);
}
