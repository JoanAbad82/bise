//! The cache gives the rows `history` gives, a window at a time.

use super::*;
use crate::history::history;
use serde_json::json;

/// A session of `turns` turns, each: a prompt, a reply with a bash call,
/// its result, the usage, the end.
fn session(dir: &Path, turns: u64, from_turn: u64, append: bool) {
    let mut seq = if append { 1 + 6 * (from_turn - 1) + 1 } else { 1 };
    let mut lines = Vec::new();
    let mut line = |turn: Option<u64>, typ: &str, data: serde_json::Value| {
        let mut v = json!({"seq": seq, "at": format!("2026-10-02T14:{:02}:{:02}.000Z", (seq / 60) % 60, seq % 60), "type": typ, "v": 1, "data": data});
        if let Some(t) = turn {
            v["turn"] = t.into();
        }
        seq += 1;
        lines.push(v.to_string());
    };
    if !append {
        line(None, "session_start", json!({"session": "s-1", "format": 1, "created_by": "bise", "cwd": "/w"}));
    }
    let text = |t: &str| json!([{"kind": "text", "text": t}]);
    for t in from_turn..from_turn + turns {
        line(Some(t), "turn_started", json!({"cause": "user"}));
        line(Some(t), "user_message", json!({"content": text(&format!("prompt {t}")), "delivery": "prompt"}));
        line(Some(t), "assistant_message", json!({"req": t, "model": "m", "parts": [{"kind": "text", "text": format!("reply {t}")}], "calls": [{"id": format!("c{t}"), "name": "bash", "args": format!("{{\"arg\":\"echo {t}\"}}")}]}));
        line(Some(t), "tool_result", json!({"call": format!("c{t}"), "ok": true, "content": text(&format!("out {t}")), "exit": 0}));
        line(Some(t), "usage", json!({"req": t, "model": "m", "input": 100 * t, "output": 10}));
        line(Some(t), "turn_ended", json!({"outcome": "done"}));
    }
    std::fs::create_dir_all(dir).unwrap();
    let f = dir.join("events.jsonl");
    let mut old = if append { std::fs::read_to_string(&f).unwrap() } else { String::new() };
    old.push_str(&(lines.join("\n") + "\n"));
    std::fs::write(f, old).unwrap();
}

fn tmp(name: &str) -> PathBuf {
    let d = std::env::temp_dir().join(format!("hcache-{name}-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&d);
    d
}

fn key(r: &Item) -> (u64, u64, String, String, Option<String>) {
    (r.pos, r.seq, r.head.clone(), r.body.text().to_string(), r.rule.clone())
}

/// Law: paging up from the end walks every row of `history()` once, in
/// order, the same rows field for field; the open built only the tail.
#[test]
fn pages_walk_the_whole_history_once() {
    let d = tmp("walk");
    session(&d, 700, 1, false);
    let red = Redactor::default();
    let log = read_dir(&d).unwrap();
    let all: Vec<_> = history(&Source { log: &log, blobs: &d, redact: &red }).iter().map(key).collect();
    let mut c = HistoryCache::open(&d, &d, &red).unwrap();
    assert!(c.from() > 0, "the open builds the tail only");
    let mut seen = Vec::new();
    let mut before = None;
    loop {
        let (p, more) = c.page(&red, before, 200, 256 * 1024);
        assert!(!p.is_empty() && p.len() <= 200);
        before = p.first().map(|r| r.pos);
        seen.splice(0..0, p.iter().map(key));
        if !more {
            break;
        }
    }
    assert_eq!(seen.len(), all.len());
    assert_eq!(seen, all);
    // a row's pos never moves: the same in a window and in the whole
    let _ = std::fs::remove_dir_all(&d);
}

/// Find runs on the whole history, not the pages built: the first
/// turn's prompt is found from the tail.
#[test]
fn find_sees_the_whole_history() {
    let d = tmp("find");
    session(&d, 700, 1, false);
    let red = Redactor::default();
    let mut c = HistoryCache::open(&d, &d, &red).unwrap();
    let hits = c.find(&red, "PROMPT 3");
    assert!(!hits.is_empty() && c.from() == 0);
    let row = c.rows().iter().find(|r| r.pos == hits[0]).unwrap();
    assert_eq!(row.head, "prompt 3");
    assert!(c.find(&red, "nowhere").is_empty());
    let _ = std::fs::remove_dir_all(&d);
}

/// A log that grew: read again, its new turns at the end, every row as
/// `history()` has it; nothing changed: no read.
#[test]
fn a_grown_log_adds_its_new_rows() {
    let d = tmp("grow");
    session(&d, 50, 1, false);
    let red = Redactor::default();
    let mut c = HistoryCache::open(&d, &d, &red).unwrap();
    assert!(!c.refresh(&red).unwrap());
    session(&d, 3, 51, true);
    assert!(c.stale() && !c.rewritten());
    assert!(c.refresh(&red).unwrap());
    let log = read_dir(&d).unwrap();
    let all: Vec<_> = history(&Source { log: &log, blobs: &d, redact: &red }).iter().map(key).collect();
    let got: Vec<_> = c.all(&red).iter().map(key).collect();
    assert_eq!(got, all);
    assert!(got.iter().any(|k| k.2 == "prompt 53"));
    let _ = std::fs::remove_dir_all(&d);
}

/// Bound (architect m_34775): at most `max` caches, the least recently
/// read dropped first, and one not read for `idle_ms` dropped.
#[test]
fn the_caches_are_bounded_by_count_and_idle_time() {
    let red = Redactor::default();
    let dirs: Vec<PathBuf> = (0..3).map(|i| tmp(&format!("bound{i}"))).collect();
    for d in &dirs {
        session(d, 2, 1, false);
    }
    let mut c = Caches::new(2, 600_000);
    c.get(&dirs[0], &dirs[0], &red, 1_000).unwrap();
    c.get(&dirs[1], &dirs[1], &red, 2_000).unwrap();
    c.get(&dirs[0], &dirs[0], &red, 3_000).unwrap();
    c.get(&dirs[2], &dirs[2], &red, 4_000).unwrap();
    assert_eq!(c.kept(), vec![dirs[0].as_path(), dirs[2].as_path()], "dirs[1], least recently read, went");
    // ten minutes without a read: dirs[0] goes, dirs[2] (read now) stays
    c.get(&dirs[2], &dirs[2], &red, 3_000 + 600_000).unwrap();
    assert_eq!(c.kept(), vec![dirs[2].as_path()]);
    for d in &dirs {
        let _ = std::fs::remove_dir_all(d);
    }
}
