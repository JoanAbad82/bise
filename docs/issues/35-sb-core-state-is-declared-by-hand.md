# 35 · sb-core's state is declared by hand

Status: in progress (task state-schema). Generator shape signed by architect
(m_31904, m_31905). Label: hub, proto. Gabriel's pick on page debt-audit
(q-next, debt #1): « Pour 1 on peut être ambitieux aussi ».

## The problem

sb-core keeps 18 records (St, Agent, Msg, MRec, Card, Ans, the timers', the
watches', the cross-hub ones) and 9 enums inside them. Each is written by
hand three or four times: its Bend type, its getters, its JSON codec
(bend/hub/codec.bend, 410 lines, "in the exact serde format of model.rs"),
the Rust mirror (rust/switchboard/src/model.rs, 596 lines), and every
positional pattern that opens or builds it (111 `St{…}`, 153 `Msg{…}`
across code and proofs, main 2026-10-18).

So one field costs a pass over every pattern: withdrawn-answer's St.gone was
+332/−113 lines in 9 files before its real fix (c9131a8bd); bp-hot, name-free
and hub-loop paid the same that week. Agents route around it ("opaque" JSON
strings, Maybe avoided because each one doubles a round law's cases:
codec.bend's card_round has 8). Issue 33 (Msg.cid) and issue 21 sha 2
(St.arch) wait on it.

## The plan (signed)

`bise_proto::core::state` (rust/proto/src/core/state.rs) declares every
record: its fields in Bend order, each field's default, and its JSON shapes
(`journal`, read back at boot; `view`, written only), each key with its wire
kind. core_gen writes from it:

- `bend/hub/gen/state.bend`: the types, `T.empty()`, `T.f` and `T.with_f`;
- `bend/hub/gen/state-laws.bend`: per field `T.f.get_with` and `T.f.eta`
  (a pairwise lemma only when a real proof sticks, named);
- `bend/hub/gen/state-codec.bend`: per shape `_kvs`/`_json` (and `_of` when
  read), one law per field and one per record that rewrites once per field
  (no case split over the record), the view shapes pinned on
  fixtures/core_view.jsonl; per enum its words and its law. Two hand codecs
  stay (bend/hub/state-hand.bend): a timer's schedule (one key that says the
  variant, read back normalised) and a watch's `resumes` (an old line reads
  its spec's default);
- the Rust serde types (the Rust chunk), model.rs's mirrors deleted, and
  Workspace/Brief/Report moved to bise_proto as Rust-only records.

Then, one chunk per family, in parallel: Card+Ans, Msg+MRec, Agent, St,
timers+wakes, xhub+gone. Each moves its sites and proofs to the getters and
setters, deletes its hand type and codec, and takes its names out of
tests/state_guard.py's MIGRATING. The guard (quick, land, full) is red on
`<alias of gen/state.bend>.<Rec>{` outside gen/, on a hand twin of a moved
record, and on a new hand record in bend/hub/ without its declaration.

Each land: same.py on his journal copy (every step, view_all sha), bench
byte-equal, old_core_replay vs -28/-29/main and the latest release, ALL
PROOFS CHECK, core_profile before/after (over 5%: architect's word).

## Done when

- the guard is green with MIGRATING empty;
- codec.bend and model.rs's mirrors are gone;
- the probe: one field added to Msg and one to St, blessed, each used once;
  the diff outside gen/ and the use sites under 10 lines (shown here, then
  reverted);
- issue 33 and issue 21 sha 2 need no pattern change.

## Slices

(per slice: sha, what moved, proofs and replay)

- **sha 1, 76f5a683c** (state-schema, signed m_32573): the declaration, the
  generator, gen/state.bend + state-laws + state-codec, state-hand.bend,
  Codec.module, tests/state_guard.py in quick/land/full (lists only shrink, a
  check). Nothing imports the new files: no behaviour change; gen/journal.bend
  byte-identical. All 4 Bend files ALL PROOFS CHECK; gate quick green.
- **sha 2, 70be5f6ea** (state-schema): the families' asks: journal rows can name
  SC (S, SC imported by journal/journal-laws), enum codecs `<E>.journal_*`,
  `T.f.eta` stated rebuilt == setter (a proof rewrites with it, no positional
  term), view pins fall back to the journal shape; scripts/core_same.py
  (bp-hot's same.py, durable).
- **guard, 0b84a2b96 + d3a9f7375 + 7fd915868**: HAND gains Answer and Turn
  (picks.bend's Ans and core.bend's Out hid behind generated names; renamed by
  their families) through RENAMES; the land compares the lists with its base.
- **laws, e26bc1824**: per field `T.f.set_get`, `T.f.set_set` (state-timers:
  named_keeps_the_rest); state-laws 536 lemmas, 1.35 s.
- **Msg + MRec + MSt, 4d487aac8 + 18fe68ea7** (state-msg, signed by architect):
  hub 12 files, laws 5, proofs 11 moved to S./HS.; hand MSt/Msg/MRec, their
  getters, Msg.with_parts and codec.bend's msg/mst codecs deleted; MST/MSG rows
  on SC; architect's builders (new_msg gone: msg_of_snd, msg_of_route). No
  pairwise lemma. PROOF 15 files green, gen laws green; core_same on his
  journal copy 260 steps 0 differing, view_all sha equal; bench_byte_equal 5
  digests equal; old_core_replay -28, -29, -43, main ok; instructions within
  ±1% (replay 127.0G -> 126.6G, tick 30.6M, say 22.9M -> 23.0M, view_all
  15.9G); model.bend 1000 -> 906.
