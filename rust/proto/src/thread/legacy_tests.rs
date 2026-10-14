//! The corpus of every older line shape (`fixtures/legacy_lines.jsonl`):
//! one sample of each shape ever written, taken from the git history of
//! each writer (bend/hub/core.bend, rust/switchboard's core.rs, gate.rs,
//! art.rs, ...) and the lines the tests and fixtures carry. Each row: the
//! line, where it comes from (`src`), the record it upgrades to (`feed`,
//! null: it reads as its text), and the view the fold and the TUI get
//! (`hub`, the `Debug` of `lines::read`); `before`/`why` when that view
//! differs from the parser's before issue 25 on purpose.

use super::*;
use crate::thread::lines::read;
use serde_json::Value;

const CORPUS: &str = include_str!("../../fixtures/legacy_lines.jsonl");

fn rows() -> Vec<Value> {
    CORPUS.lines().filter(|l| !l.trim().is_empty()).map(|l| serde_json::from_str(l).expect("a corpus row is JSON")).collect()
}

fn s<'a>(r: &'a Value, k: &str) -> &'a str {
    r[k].as_str().unwrap_or_else(|| panic!("{k} in {r}"))
}

#[test]
fn every_old_shape_upgrades_to_its_record() {
    for r in rows() {
        let line = s(&r, "line");
        let got = upgrade(line).map(|f| f.to_value()).unwrap_or(Value::Null);
        assert_eq!(got, r["feed"], "{line} ({})", s(&r, "src"));
    }
}

#[test]
fn every_old_shape_reads_as_it_did() {
    for r in rows() {
        let line = s(&r, "line");
        assert_eq!(format!("{:?}", read(line)), s(&r, "hub"), "{line} ({})", s(&r, "src"));
        if r.get("before").is_some() {
            assert!(!s(&r, "why").is_empty(), "a changed view says why: {line}");
        }
    }
}

/// The record an old line upgrades to, written as a new line, reads as
/// the same view: the fold and the TUI can't tell the two forms apart.
#[test]
fn an_upgraded_record_written_anew_reads_the_same() {
    for r in rows() {
        let line = s(&r, "line");
        if let Some(f) = upgrade(line) {
            let new = f.line();
            assert!(new.starts_with(&format!("sb {} :: {{", f.tag())), "{new}");
            assert_eq!(read(&new), read(line), "{line} -> {new}");
            assert_eq!(upgrade(&new), None, "a new line is never the legacy reader's: {new}");
        }
    }
}

/// Two colons can't start an old line: every old writer wrote ` : `
/// after the kind, so the new form is one prefix test.
#[test]
fn no_old_line_has_the_new_form() {
    for r in rows() {
        let line = s(&r, "line");
        assert!(crate::core::Feed::read_rest(line.strip_prefix("sb ").unwrap_or(line)).is_none(), "{line}");
    }
}

/// The kinds born in the new form (`sb <kind> :: <json>`): no old line
/// ever had them, so they have no old sample.
const BORN_NEW: &[&str] = &["routed"];

/// Each kind of `Feed` has an old sample (but those born new), and the
/// corpus has no two equal lines.
#[test]
fn the_corpus_covers_every_kind() {
    let rows = rows();
    let kinds: std::collections::BTreeSet<String> = rows.iter().filter_map(|r| r["feed"]["sb"].as_str().map(String::from)).collect();
    let missing: Vec<&&str> = crate::core::Feed::TAGS.iter().filter(|t| !kinds.contains(**t) && !BORN_NEW.contains(t)).collect();
    assert!(missing.is_empty(), "no old sample of {missing:?}");
    let lines: std::collections::BTreeSet<&str> = rows.iter().map(|r| s(r, "line")).collect();
    assert_eq!(lines.len(), rows.len(), "a line twice");
}

#[test]
fn a_bad_new_line_shows_its_json_and_an_unknown_kind_its_text() {
    use crate::thread::lines::Hub;
    let h = |l: &str| match read(l) {
        Rec::Hub(h) => h,
        r => panic!("{r:?}"),
    };
    assert_eq!(h(r#"sb card :: {"id":"x"}"#), Hub::Other { kind: "card".into(), text: r#"{"id":"x"}"#.into() });
    assert_eq!(h(r#"sb dance :: {"text":"a newer hub's words","n":2}"#), Hub::Other { kind: "dance".into(), text: "a newer hub's words".into() });
    assert_eq!(h(r#"sb dance :: {"n":2}"#), Hub::Other { kind: "dance".into(), text: r#"{"n":2}"#.into() });
    // a newer hub's added field: still the record
    assert!(matches!(h(r#"sb you :: {"text":"hi","lang":"fr"}"#), Hub::You(t, None) if t == "hi"));
}

use crate::thread::lines::Rec;
