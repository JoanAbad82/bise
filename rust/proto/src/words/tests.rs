//! The catalog's own rules, over every area (architect m_27078).

use super::{fill, holes, inbox, Word, ALL};
use std::collections::BTreeSet;

fn every() -> impl Iterator<Item = (&'static str, &'static Word)> {
    ALL.iter().flat_map(|(area, ws)| ws.iter().map(move |w| (*area, w)))
}

#[test]
fn keys_are_unique_and_in_their_area() {
    let mut seen = BTreeSet::new();
    for (area, w) in every() {
        assert!(seen.insert(w.key), "{} twice", w.key);
        assert!(w.key.starts_with(&format!("{area}.")), "{} is not in {area}", w.key);
    }
}

#[test]
fn every_hole_is_an_arg_and_every_arg_a_hole() {
    for (_, w) in every() {
        for form in [Some(w.text), w.one].into_iter().flatten() {
            let hs: BTreeSet<&str> = holes(form).into_iter().collect();
            let args: BTreeSet<&str> = w.args.iter().copied().collect();
            assert_eq!(hs, args, "{}: {form:?} has holes {hs:?}, args {args:?}", w.key);
            // a brace is a hole's, never a word's
            assert_eq!(form.matches('{').count(), form.matches('}').count(), "{}: {form:?}", w.key);
            assert_eq!(form.matches('{').count(), holes(form).len(), "{}: {form:?}", w.key);
        }
        if w.one.is_some() {
            assert!(w.args.contains(&"n"), "{}: a plural picks on n", w.key);
        }
        assert!(!w.doc.trim().is_empty(), "{}: say what it is (a /// line)", w.key);
    }
}

#[test]
fn an_area_split_in_parts_is_one_list() {
    #[allow(dead_code)]
    mod a {
        crate::words! { demo:
            /// first
            one_word = "one";
            /// second
            two_words = "two";
        }
    }
    #[allow(dead_code)]
    mod b {
        crate::words! { demo:
            /// third
            three_words(n) = "{n} three";
        }
    }
    const PARTS: &[&[Word]] = &[a::WORDS, b::WORDS];
    const ALL_DEMO: &[Word] = &super::concat::<{ super::count(PARTS) }>(PARTS);
    assert_eq!(super::count(PARTS), 3);
    let keys: Vec<&str> = ALL_DEMO.iter().map(|w| w.key).collect();
    assert_eq!(keys, ["demo.one_word", "demo.two_words", "demo.three_words"]);
    assert_eq!(ALL_DEMO[2].args, ["n"]);
}

/// A word with no arg is a `const`; a template's arg of the same name in
/// its area is a fn param pattern that hits that const (E0308, words-
/// scheduled's `title`). The build already fails then: this test is the
/// clear message for a key added in a branch that also renames an arg.
#[test]
fn no_key_shares_a_name_with_an_arg_of_its_area() {
    assert_eq!(clashes(&[("demo", DEMO_CLASH)]), vec!["demo.title is also an arg of demo.ended: a key must not share a name with any arg of its area (the generated fn param shadows the const, E0308)".to_string()]);
    let found = clashes(ALL);
    assert!(found.is_empty(), "{found:#?}");
}

const DEMO_CLASH: &[Word] = &[
    Word { key: "demo.title", args: &[], one: None, text: "scheduled", doc: "the head
" },
    Word { key: "demo.ended", args: &["title", "why"], one: None, text: "{title} ended · {why}", doc: "a line
" },
];

/// Each const key of an area that is also an arg of a template of that area.
fn clashes(all: &[(&str, &[Word])]) -> Vec<String> {
    let mut out = Vec::new();
    for (_, ws) in all {
        for k in ws.iter().filter(|w| w.args.is_empty()) {
            let name = k.key.split_once('.').map_or(k.key, |(_, n)| n);
            if let Some(t) = ws.iter().find(|w| w.args.contains(&name)) {
                out.push(format!("{} is also an arg of {}: a key must not share a name with any arg of its area (the generated fn param shadows the const, E0308)", k.key, t.key));
            }
        }
    }
    out
}

#[test]
fn a_template_fills_and_a_plural_picks() {
    assert_eq!(inbox::where_thread("old"), "in old's thread");
    assert_eq!(inbox::answered_at("avif", inbox::where_inbox), "you: avif · in the inbox");
    assert_eq!(fill("{n} left of {n}", &[("n", &3)]), "3 left of 3");
    assert_eq!(fill("{x} {y}", &[("x", &"a")]), "a {y}");
    crate::words! { demo:
        /// a plural for the test
        rows_left(n) = one "{n} row left" | "{n} rows left";
    }
    assert_eq!(rows_left(1), "1 row left");
    assert_eq!(rows_left(0), "0 rows left");
    assert_eq!(rows_left(12u64), "12 rows left");
    assert_eq!(WORDS[0].key, "demo.rows_left");
    assert_eq!(WORDS[0].one, Some("{n} row left"));
    assert_eq!(WORDS[0].doc, " a plural for the test\n");
}
