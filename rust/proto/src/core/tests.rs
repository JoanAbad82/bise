//! The tables can't drift from the serde derive (architect m_18326): for
//! every kind of every enum, a value with each field set reads and writes
//! back unchanged (its names and types), and an object with only the tag
//! writes each field as its kind says (written empty, null, or absent).

use super::*;
use serde_json::{json, Map, Value};

/// A table and its enum's read-then-write.
type Rw = fn(Value) -> Result<Value, String>;

fn tables() -> [(Table, Rw); 4] {
    [
        (In::TABLE, |v| In::decode(v).map(|x| x.to_value())),
        (Link::TABLE, |v| Link::decode(v).map(|x| x.to_value())),
        (Fx::TABLE, |v| Fx::decode(v).map(|x| x.to_value())),
        (Feed::TABLE, |v| Feed::decode(v).map(|x| x.to_value())),
    ]
}

/// A value of each kind that is not its default.
fn full(k: FieldKind, name: &str) -> Value {
    use FieldKind::*;
    match k {
        Str | StrOmit | OptStr | OptStrOmit => json!(format!("{name}-x")),
        Nat | OptNat | OptNatOmit => json!(42),
        Bool => json!(true),
        Json => json!({"k": [1, "two", null]}),
        Strs | OptStrsOmit => json!(["a", "b c"]),
        Nats => json!([3, 5]),
        Jsons => json!([{"type": "x"}, 7]),
        Msgs => json!([{"id": 9, "rel": "peer"}]),
        Ver => json!(2),
    }
}

/// What a missing field writes back: None when absent.
fn empty(k: FieldKind) -> Option<Value> {
    use FieldKind::*;
    match k {
        Str => Some(json!("")),
        Nat => Some(json!(0)),
        Bool => Some(json!(false)),
        OptStr | OptNat | Json => Some(Value::Null),
        Strs | Nats | Jsons | Msgs => Some(json!([])),
        Ver => Some(json!(1)),
        StrOmit | OptStrOmit | OptNatOmit | OptStrsOmit => None,
    }
}

#[test]
fn every_tables_kinds_match_what_serde_writes() {
    for (t, rw) in tables() {
        for k in t.kinds {
            let mut m = Map::new();
            m.insert(t.tag_key.into(), json!(k.tag));
            for f in k.fields {
                m.insert(f.name.into(), full(f.kind, f.name));
            }
            let v = Value::Object(m);
            assert_eq!(rw(v.clone()).unwrap(), v, "{}::{} with every field set", t.name, k.rust);

            let mut want = Map::new();
            want.insert(t.tag_key.into(), json!(k.tag));
            for f in k.fields {
                if let Some(e) = empty(f.kind) {
                    want.insert(f.name.into(), e);
                }
            }
            let bare = json!({ t.tag_key: k.tag });
            assert_eq!(rw(bare).unwrap(), Value::Object(want), "{}::{} with only its tag", t.name, k.rust);
        }
    }
}

#[test]
fn tags_are_unique_and_the_table_is_the_enums() {
    for (t, _) in tables() {
        let mut tags: Vec<&str> = t.kinds.iter().map(|k| k.tag).collect();
        let n = tags.len();
        tags.sort();
        tags.dedup();
        assert_eq!(tags.len(), n, "{}: a tag twice", t.name);
    }
    assert_eq!(In::TAGS.len(), In::TABLE.kinds.len());
    assert_eq!(In::TAGS.len(), 51, "today's in_tag has 51 tags");
    // two tags share a Bend constructor only when their fields are the same
    for t in [In::TABLE, Link::TABLE, Fx::TABLE, Feed::TABLE] {
        for a in t.kinds {
            for b in t.kinds.iter().filter(|b| b.bend == a.bend) {
                assert_eq!(a.fields, b.fields, "{}: {} and {} share {}", t.name, a.tag, b.tag, a.bend);
            }
        }
    }
}

#[test]
fn an_unknown_tag_is_kept_whole() {
    let v = json!({"t": "weather", "sky": "blue"});
    let i = In::decode(v.clone()).unwrap();
    assert!(matches!(&i, In::Unknown { tag, .. } if tag == "weather"));
    assert_eq!(i.to_value(), v);
    assert!(matches!(Fx::decode(json!({"fx": "dance"})).unwrap(), Fx::Unknown { .. }));
    assert!(In::decode(json!({"agent": "x"})).is_err(), "no tag: a bug of the sender");
}

#[test]
fn a_step_carries_the_envelope() {
    let s = In::Ready(input::Ready { agent: "docs".into() }).step(7, true, vec![json!({"ok": true})]);
    let v = s.to_value();
    assert_eq!(v, json!({"t": "ready", "agent": "docs", "now": 7, "git": true, "ans": [{"ok": true}]}));
    assert_eq!(Step::decode(v).unwrap(), s);
    let bare = Step::decode(json!({"t": "tick"})).unwrap();
    assert_eq!((bare.now, bare.git, bare.ans.len()), (0, false, 0));
}

#[test]
fn a_feed_record_is_one_line_with_its_kind_in_front() {
    let r = Feed::CardClosed(feed::CardClosed { id: 3, res: "answered".into() });
    let l = r.line();
    assert_eq!(l, r#"sb card-closed :: {"id":3,"res":"answered"}"#);
    let (kind, back) = Feed::read_rest(l.strip_prefix("sb ").unwrap()).unwrap();
    assert_eq!((kind, back.unwrap()), ("card-closed", r));
    // an older text line is the legacy reader's, whatever its text
    for old in ["card-closed : #3 answered", "you : {\"text\": \"x\"}", "you : a :: b", "you : :: x"] {
        assert!(Feed::read_rest(old).is_none(), "{old}");
    }
    assert!(Feed::read_rest("card :: [1]").unwrap().1.is_err(), "not an object: the writer's bug, never a guess");
}

#[test]
fn each_answer_shape_reads_as_its_row_and_writes_back() {
    let kill = json!({"fx": "kill", "agent": "a"});
    for k in link::ANSWER.kinds {
        let mut m = Map::new();
        for f in k.fields {
            let v = match (k.tag, f.name) {
                ("step", "fx") => json!([kill, {"fx": "dance", "x": 1}]),
                _ => full(f.kind, f.name),
            };
            m.insert(f.name.into(), v);
        }
        let v = Value::Object(m);
        let a: Answer = serde_json::from_value(v.clone()).unwrap();
        let rust = match &a {
            Answer::Step(_) => "Step",
            Answer::Need(_) => "Need",
            Answer::View(_) => "View",
            Answer::Skipped(_) => "Skipped",
            Answer::Error(_) => "Error",
            Answer::Done(_) => "Done",
            Answer::Unknown(_) => "Unknown",
        };
        assert_eq!(rust, k.rust, "{}: {v}", k.tag);
        assert_eq!(a.to_value(), v, "{}", k.tag);
    }
}

#[test]
fn an_answer_keeps_what_it_does_not_know() {
    let a = Answer::decode_line(r#"{"fx": [{"fx": "dance"}], "dirty": true, "view": {}}"#).unwrap();
    let Answer::Step(s) = &a else { panic!("{a:?}") };
    assert!(matches!(&s.fx[0], Fx::Unknown { tag, .. } if tag == "dance"), "an unknown effect, not a failed answer");
    // an old sb-core's step without a view
    assert!(matches!(Answer::decode_line(r#"{"fx": [], "dirty": false}"#).unwrap(), Answer::Step(_)));
    let odd = json!({"weather": "blue"});
    assert_eq!(serde_json::from_value::<Answer>(odd.clone()).unwrap(), Answer::Unknown(odd));
    assert!(matches!(Answer::decode_line("{}").unwrap(), Answer::Done(_)));
    assert!(Answer::decode_line("nope").is_err());
}

#[test]
fn an_answer_with_fx_is_never_unknown_whatever_its_items() {
    for fx in [
        json!([]),
        json!([{"fx": "kill"}]),
        json!([{"fx": "kill", "agent": 3}]),
        json!([7, "x", null, {"no": "tag"}, {"fx": 1}]),
        json!("not a list"),
    ] {
        for v in [json!({"fx": fx.clone(), "dirty": true, "view": {}}), json!({"fx": fx.clone()})] {
            let a: Answer = serde_json::from_value(v.clone()).unwrap();
            assert!(matches!(a, Answer::Step(_)), "{v} -> {a:?}");
        }
    }
}

#[test]
fn a_bad_effect_costs_only_itself() {
    let a = Answer::decode_line(
        r#"{"fx": [{"fx": "kill", "agent": "a"}, {"fx": "rt", "agent": "b", "turns": "many"}, {"fx": "kill", "agent": "c"}], "dirty": true, "view": {}}"#,
    )
    .unwrap();
    let Answer::Step(s) = a else { panic!("{a:?}") };
    let kills: Vec<&str> = s.fx.iter().filter_map(|f| if let Fx::Kill(k) = f { Some(k.agent.as_str()) } else { None }).collect();
    assert_eq!(kills, ["a", "c"], "both good effects, in order");
    assert!(matches!(&s.fx[1], Fx::Unknown { tag, raw } if tag == "rt" && raw["turns"] == "many"), "the bad one kept whole");
}
