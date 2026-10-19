//! The photo's codegen helpers (issue 36): which shapes read back whole,
//! the lists of records a photo holds (`Wire::Recs`), and each list's
//! codec and round law. A part of core_gen.rs, used by core_gen/state.rs.

use super::state::{hand_of, inner_shape, named};
use super::*;
use bise_proto::core::state as st;
use bise_proto::core::state::{Wire, STATE};

/// A shape read back whole: every field carried, no hand key (its
/// `_round` law is over the record).
pub(crate) fn whole(r: &st::Record, sh: &st::Shape) -> bool {
    sh.read && hand_of(sh).is_none() && r.fields.iter().all(|f| sh.keys.iter().any(|k| k.field == f.name))
}

/// The (record, shape) pairs a `Wire::Recs` key writes a list of.
pub(crate) fn listed() -> Vec<(&'static str, &'static str)> {
    let mut out: Vec<(&'static str, &'static str)> = Vec::new();
    for r in STATE.records {
        for sh in r.shapes {
            for k in sh.keys.iter().filter(|k| k.wire == Wire::Recs) {
                let inner = STATE.record(named(r.field(k.field).ty)).unwrap();
                let pair = (inner.name, inner_shape(inner, sh.name).name);
                if !out.contains(&pair) {
                    out.push(pair);
                }
            }
        }
    }
    out
}

/// A list of records in one shape: `T.<shape>_list` / `_list_of` and its
/// round law, by induction on the list with the record's `_round`.
pub(crate) fn list_codec(s: &mut String, n: &str, shn: &str) {
    let l = format!("{n}.{shn}_list");
    let lt = format!("List<&2, S.{n}>");
    writeln!(s, "# ---- a list of {n}, each in its {shn} shape ----
").unwrap();
    writeln!(s, "def {l}(xs: {lt}) -> List<&2, J.Json>:
  match xs:
    case Nil{{}}:
      Nil{{}}
    case Con{{+h, +t}}:
      {n}.{shn}_json(h) <> {l}(t)
").unwrap();
    writeln!(s, "def {l}_of.go(xs: List<&2, J.Json>) -> {lt}:
  match xs:
    case Nil{{}}:
      Nil{{}}
    case Con{{+h, +t}}:
      {n}.{shn}_of(h) <> {l}_of.go(t)
").unwrap();
    writeln!(s, "# an array's items; anything else: none
def {l}_of(+j: J.Json) -> {lt}:
  match j:
    case J.JArr{{+xs}}:
      {l}_of.go(xs)
    case _:
      Nil{{}}
").unwrap();
    writeln!(s, "law {l}_round.go:
  for xs: {lt}
  {{{l}_of.go({l}(xs)) == xs : {lt}}}
").unwrap();
    writeln!(s, "def {l}_round.go(xs):
  match xs:
    case Nil{{}}:
      {{==}}
    case Con{{h, t}}:
      %{n}.{shn}_round(h) : {{{n}.{shn}_of({n}.{shn}_json(h)) <> {l}_of.go({l}(t)) == _ <> t : {lt}}}
      %{l}_round.go(t) : {{{n}.{shn}_of({n}.{shn}_json(h)) <> {l}_of.go({l}(t)) == {n}.{shn}_of({n}.{shn}_json(h)) <> _ : {lt}}}
      {{==}}
").unwrap();
    writeln!(s, "law {l}_round:
  for xs: {lt}
  {{{l}_of(J.JArr{{{l}(xs)}}) == xs : {lt}}}
").unwrap();
    writeln!(s, "def {l}_round(xs):
  {l}_round.go(xs)
").unwrap();
}

