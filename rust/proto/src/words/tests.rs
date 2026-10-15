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
