//! The hub ↔ sb-core link as it really goes (issue 25): every line of
//! `fixtures/core_{in,link,fx,answer}.jsonl`, captured from the e2e corpus and
//! switchboard's tests on throwaway hubs (tests/core_capture.py), reads
//! as its kind (never `Unknown`) and writes back the same JSON value; and
//! every kind of `In`, `Link` and `Fx` has at least one line.

use bise_proto::core::{Answer, Fx, In, Link, Step, Table};
use serde_json::Value;
use std::collections::BTreeSet;
use std::path::Path;

fn lines(name: &str) -> Vec<Value> {
    let p = Path::new(env!("CARGO_MANIFEST_DIR")).join("fixtures").join(name);
    let text = std::fs::read_to_string(&p).unwrap_or_else(|e| panic!("{}: {e}", p.display()));
    text.lines().filter(|l| !l.trim().is_empty()).map(|l| serde_json::from_str(l).unwrap_or_else(|e| panic!("{name}: {e}: {l}"))).collect()
}

fn covered(t: &Table, seen: &BTreeSet<String>, file: &str) {
    let missing: Vec<&str> = t.kinds.iter().map(|k| k.tag).filter(|tag| !seen.contains(*tag)).collect();
    assert!(missing.is_empty(), "{file}: no line of {}: {missing:?}", t.name);
}

#[test]
fn every_input_line_round_trips() {
    let mut seen = BTreeSet::new();
    for v in lines("core_in.jsonl") {
        // a step, or a bare input (a restarted sb-core's force_run, Hub::raw)
        let (input, back) = if v.get("now").is_some() {
            let s = Step::decode(v.clone()).unwrap_or_else(|e| panic!("{e}: {v}"));
            let back = s.to_value();
            (s.input, back)
        } else {
            let i = In::decode(v.clone()).unwrap_or_else(|e| panic!("{e}: {v}"));
            let back = i.to_value();
            (i, back)
        };
        assert!(!matches!(input, In::Unknown { .. }), "unknown input: {v}");
        assert_eq!(back, v, "{}", input.tag());
        seen.insert(input.tag().to_string());
    }
    covered(&In::TABLE, &seen, "core_in.jsonl");
}

#[test]
fn every_link_line_round_trips() {
    let mut seen = BTreeSet::new();
    for v in lines("core_link.jsonl") {
        let l = Link::decode(v.clone()).unwrap_or_else(|e| panic!("{e}: {v}"));
        assert!(!matches!(l, Link::Unknown { .. }), "unknown link request: {v}");
        assert_eq!(l.to_value(), v, "{}", l.tag());
        seen.insert(l.tag().to_string());
    }
    covered(&Link::TABLE, &seen, "core_link.jsonl");
}

#[test]
fn every_effect_line_round_trips() {
    let mut seen = BTreeSet::new();
    for v in lines("core_fx.jsonl") {
        let f = Fx::decode(v.clone()).unwrap_or_else(|e| panic!("{e}: {v}"));
        assert!(!matches!(f, Fx::Unknown { .. }), "unknown effect: {v}");
        assert_eq!(f.to_value(), v, "{}", f.tag());
        seen.insert(f.tag().to_string());
    }
    covered(&Fx::TABLE, &seen, "core_fx.jsonl");
}

#[test]
fn every_answer_line_round_trips() {
    use bise_proto::core::link::{Skipped, ANSWER};
    let mut seen = BTreeSet::new();
    for v in lines("core_answer.jsonl") {
        let a: Answer = serde_json::from_value(v.clone()).unwrap_or_else(|e| panic!("{e}: {v}"));
        let tag = match &a {
            Answer::Step(_) => "step",
            Answer::Need(_) => "need",
            Answer::View(_) => "view",
            Answer::Skipped(s) if matches!(s.skipped, Skipped::One(_)) => "skipped",
            Answer::Skipped(_) => "skipped_at",
            Answer::Error(_) => "error",
            Answer::Done(_) => "done",
            Answer::Unknown(_) => panic!("unknown answer: {v}"),
        };
        assert_eq!(a.to_value(), v, "{tag}");
        seen.insert(tag.to_string());
    }
    covered(&ANSWER, &seen, "core_answer.jsonl");
}
