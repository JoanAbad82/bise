use super::*;

use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;

fn tmp(tag: &str) -> PathBuf {
    let d = std::env::temp_dir().join(format!("bp-tools-cache-{}-{}", tag, std::process::id()));
    let _ = std::fs::remove_dir_all(&d);
    std::fs::create_dir_all(&d).unwrap();
    d
}

fn server(env: &[(&str, &str)]) -> StdioServer {
    StdioServer {
        id: "echo".into(),
        command: "node".into(),
        args: vec!["server.mjs".into()],
        env: env.iter().map(|(k, v)| (k.to_string(), v.to_string())).collect(),
        cwd: PathBuf::from("/p"),
        limits: Default::default(),
    }
}

/// The key of `s` as a bridge makes it: its declared env resolved by
/// `vars`, the inherited `env`, the `salt`.
fn key_of(root: &Path, s: &StdioServer, vars: &dyn Fn(&str) -> Option<String>, env: &[(&str, &str)], salt: &[u8]) -> String {
    let env = inherited(env.iter().map(|(k, v)| (OsString::from(k), OsString::from(v))));
    key("hn", root, s, &env_mac(salt, &declared(s, vars), &env))
}

fn none(_: &str) -> Option<String> {
    None
}

#[test]
fn the_key_moves_with_the_spec_its_files_and_its_env_values_never_holding_one() {
    let d = tmp("key");
    std::fs::write(d.join("mcp.json"), "{}").unwrap();
    let salt = [7u8; 32];
    let k = key_of(&d, &server(&[("TOKEN", "a")]), &none, &[], &salt);
    assert_eq!(k, key_of(&d, &server(&[("TOKEN", "a")]), &none, &[], &salt), "stable");
    // a declared value is in it (hashed): another token, another key
    assert_ne!(k, key_of(&d, &server(&[("TOKEN", "other secret")]), &none, &[], &salt));
    assert!(!k.contains("other secret") && k.len() == 32);
    // a ${VAR} resolved as the start does: the env, then his secrets
    let tpl = server(&[("TOKEN", "${GH}")]);
    let from = |v: &'static str| move |n: &str| (n == "GH").then(|| v.to_string());
    assert_ne!(key_of(&d, &tpl, &from("t1"), &[], &salt), key_of(&d, &tpl, &from("t2"), &[], &salt));
    assert_ne!(key_of(&d, &tpl, &from("t1"), &[], &salt), key_of(&d, &tpl, &none, &[], &salt), "unset is a value of its own");
    // the inherited env (GitHub's GITHUB_TOOLSETS from the hub's env)
    assert_ne!(k, key_of(&d, &server(&[("TOKEN", "a")]), &none, &[("GITHUB_TOOLSETS", "repos")], &salt));
    // another home's salt: another key for the same values
    assert_ne!(k, key_of(&d, &server(&[("TOKEN", "a")]), &none, &[], &[8u8; 32]));
    assert_ne!(k, key_of(&d, &server(&[("TOKEN2", "a")]), &none, &[], &salt), "env names are");
    let mut other = server(&[("TOKEN", "a")]);
    other.args.push("--flag".into());
    assert_ne!(k, key_of(&d, &other, &none, &[], &salt));
    // an edited mcp.json: a new key
    std::thread::sleep(Duration::from_millis(10));
    std::fs::write(d.join("mcp.json"), "{ }").unwrap();
    assert_ne!(k, key_of(&d, &server(&[("TOKEN", "a")]), &none, &[], &salt));
    let _ = std::fs::remove_dir_all(&d);
}

/// Two agents of one hub: their REPLs' env as the hub builds it
/// (`env_for`, their own internal names and temp folder), under the
/// bridge's /bin/sh: one key. A token changed in the hub's env: another.
#[test]
fn two_agents_of_one_hub_share_a_key_and_a_changed_hub_token_does_not() {
    use bise_home::env::{env_for, Child};
    let d = tmp("agents");
    let hub = |token: &str| -> Vec<(OsString, OsString)> {
        [("PATH", "/usr/bin"), ("GITHUB_PERSONAL_ACCESS_TOKEN", token), ("SB_STATE_DIR", "/t/state"), ("SB_AGENT", "main")]
            .iter()
            .map(|(k, v)| (OsString::from(k), OsString::from(v)))
            .collect()
    };
    let bridge_env = |hub_env: Vec<(OsString, OsString)>, agent: &str, port: &str| -> Vec<(OsString, OsString)> {
        let tmp = format!("/h/agents/{agent}/tmp");
        let mut needed: Vec<(&str, String)> = vec![("SB_AGENT", agent.into()), ("BEND_REPL_PORT", port.into()), ("SB_TASK", agent.into())];
        needed.extend(bise_home::env::PER_CHILD_NAMES.iter().map(|k| (*k, tmp.clone())));
        let mut env: Vec<(OsString, OsString)> = env_for(Child::Repl, hub_env, needed).iter().map(|(k, v)| (k.clone(), v.clone())).collect();
        // what /bin/sh adds when it starts the bridge
        env.extend([("PWD", "/app"), ("SHLVL", port), ("_", "/app/bise")].iter().map(|(k, v)| (OsString::from(k), OsString::from(v))));
        env
    };
    let s = server(&[("GITHUB_TOOLSETS", "repos")]);
    let k = |env: Vec<(OsString, OsString)>| key("gh", &d, &s, &env_mac(&[1u8; 32], &declared(&s, &none), &inherited(env)));
    let a = k(bridge_env(hub("tok-1"), "alpha", "4001"));
    assert_eq!(a, k(bridge_env(hub("tok-1"), "beta", "4002")), "one key per hub env");
    assert_ne!(a, k(bridge_env(hub("tok-2"), "alpha", "4001")), "a changed token");
    let _ = std::fs::remove_dir_all(&d);
}

#[test]
fn the_salt_is_made_once_0600_and_read_after() {
    use std::os::unix::fs::PermissionsExt;
    let d = tmp("salt");
    let p = d.join("cache/mcp-tools.salt");
    let s = salt(&p).unwrap();
    assert_eq!(s.len(), 32);
    assert_eq!(std::fs::metadata(&p).unwrap().permissions().mode() & 0o777, 0o600);
    assert_eq!(salt(&p).unwrap(), s, "read, not made again");
    assert_ne!(salt(&d.join("other.salt")).unwrap(), s, "random per home");
    let _ = std::fs::remove_dir_all(&d);
}

#[test]
fn a_list_is_fresh_for_its_ttl_and_an_idle_server_stops_after_idle_stop() {
    assert!(fresh(100, 100, TTL));
    assert!(fresh(100, 100 + TTL.as_secs() - 1, TTL));
    assert!(!fresh(100, 100 + TTL.as_secs(), TTL));
    // a clock gone back: listed again
    assert!(!fresh(200, 100, TTL));
    let t = Instant::now();
    assert!(!idle(t, t + IDLE_STOP - Duration::from_secs(1), IDLE_STOP));
    assert!(idle(t, t + IDLE_STOP, IDLE_STOP));
}

#[test]
fn a_cold_key_is_listed_once_then_read_and_a_stale_one_again() {
    let d = tmp("cold");
    let c = Cache::new(d.clone());
    let n = AtomicUsize::new(0);
    let listed = Listed { tools: vec![json!({"name": "stars"})], init: json!({"serverInfo": {"name": "gh"}}) };
    let list = || {
        n.fetch_add(1, Ordering::SeqCst);
        Ok(listed.clone())
    };
    assert_eq!(c.tools_of("k", Duration::from_secs(1), list).unwrap(), listed);
    assert_eq!(c.tools_of("k", Duration::from_secs(1), || panic!("listed again")).unwrap(), listed);
    assert_eq!(n.load(Ordering::SeqCst), 1);
    // a failed list is not cached
    assert!(c.tools_of("bad", Duration::from_secs(1), || Err("boom".into())).is_err());
    assert!(c.read("bad", SystemTime::now()).is_none());
    // older than the TTL: a miss
    let stale = Cache::with_ttl(d.clone(), Duration::from_secs(0));
    assert!(stale.read("k", SystemTime::now()).is_none());
    // dropped (a stale list, rule 3): listed again
    c.remove("k");
    assert!(c.read("k", SystemTime::now()).is_none());
    // a broken file: a miss, never an error
    std::fs::write(d.join("k.json"), "not json").unwrap();
    assert!(c.read("k", SystemTime::now()).is_none());
    let _ = std::fs::remove_dir_all(&d);
}

/// N cold bridges: one lists (the slow fake), the others wait for its
/// list and read it; one that waits less than the list takes gives up
/// on time.
#[test]
fn cold_bridges_share_one_list_and_a_waiter_gives_up_at_its_bound() {
    let d = tmp("lock");
    let starts = Arc::new(AtomicUsize::new(0));
    let slow = Duration::from_millis(800);
    let mut threads = Vec::new();
    for _ in 0..6 {
        let (c, starts) = (Cache::new(d.clone()), starts.clone());
        threads.push(std::thread::spawn(move || {
            c.tools_of("k", Duration::from_secs(10), || {
                starts.fetch_add(1, Ordering::SeqCst);
                std::thread::sleep(slow);
                Ok(Listed { tools: vec![json!({"name": "t"})], init: Value::Null })
            })
        }));
    }
    // a bridge with a short bound, while the list is under way
    std::thread::sleep(Duration::from_millis(150));
    let t0 = Instant::now();
    let short = Cache::new(d.clone()).tools_of("k", Duration::from_millis(200), || panic!("it holds no lock"));
    let waited = t0.elapsed();
    for t in threads {
        assert_eq!(t.join().unwrap().unwrap().tools, vec![json!({"name": "t"})]);
    }
    assert_eq!(starts.load(Ordering::SeqCst), 1, "one start for six cold bridges");
    // gave up at its bound, well before the list's end
    assert!(short.unwrap_err().contains("gave up"));
    assert!(waited >= Duration::from_millis(200) && waited < Duration::from_millis(600), "{:?}", waited);
    let _ = std::fs::remove_dir_all(&d);
}
