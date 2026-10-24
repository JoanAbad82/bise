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

#[test]
fn the_key_moves_with_the_spec_and_its_files_never_with_an_env_value() {
    let d = tmp("key");
    std::fs::write(d.join("mcp.json"), "{}").unwrap();
    let k = key("hn", &d, &server(&[("TOKEN", "a")]), None);
    assert_eq!(k, key("hn", &d, &server(&[("TOKEN", "a")]), None), "stable");
    // a secret's value is not in it: the same key
    assert_eq!(k, key("hn", &d, &server(&[("TOKEN", "other secret")]), None));
    assert_ne!(k, key("hn", &d, &server(&[("TOKEN2", "a")]), None), "env names are");
    assert_ne!(k, key("x", &d, &server(&[("TOKEN", "a")]), None));
    let mut other = server(&[("TOKEN", "a")]);
    other.args.push("--flag".into());
    assert_ne!(k, key("hn", &d, &other, None));
    // an edited mcp.json, a secrets file: new keys
    std::thread::sleep(Duration::from_millis(10));
    std::fs::write(d.join("mcp.json"), "{ }").unwrap();
    let edited = key("hn", &d, &server(&[("TOKEN", "a")]), None);
    assert_ne!(k, edited);
    std::fs::write(d.join("secrets.json"), "{}").unwrap();
    assert_ne!(edited, key("hn", &d, &server(&[("TOKEN", "a")]), Some(&d.join("secrets.json"))));
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
