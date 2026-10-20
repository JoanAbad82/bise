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
- **Card + Ans, 7d34bc2ce** (state-card, signed + architect's builders
  d57d581b2): hand Card/Ans/no_ans/getters and C.card_* deleted; 15 bend files
  on S.Card/S.Ans; card row on SC Card.journal, card_closed on Inline SC
  Ans.journal (generator: inline_record_cases); Card's view pinned on
  core_view.jsonl (pinned() reads null as None); picks.bend's Ans renamed
  Answer. PROOF 15 + gen laws green; core_same 260 steps 0 differing;
  bench_byte_equal 5 digests equal; old_core_replay -28, -29, -43, main ok;
  instructions within 0.25%.
- **Agent, 240586af4** (state-agent, signed + builders): hand
  Agent/Life/Decl/Run, 16 getters, every positional pattern deleted (12 hub,
  5 laws, 8 proofs files); new_agent -> agent_of_new(e, dir) by name; life/decl
  codecs deleted, rows on SC Life.journal / Decl.opt_journal. Eta rewrites only,
  no pairwise lemma. Gate quick + PROOF green; core_same 0 differing, view_all
  sha equal; bench_byte_equal 5/5; old_core_replay ok; instructions within
  +0.6%.
- **timers + wakes, d074f38c5** (state-timers, signed m_33484 + builders):
  Timer/TimerEnd/Tms/Act/Watch/WatchEnd/Wakes, Sched, What; hand types, 34
  getters, every hand codec (timers.bend/wakes.bend JSON, codec.bend
  timer/act/watch) deleted; TIMER/ACT/WATCH rows on SC; core_view.jsonl's
  wakes refreshed (resumes) and pinned (Watch, WatchEnd). Lemmas: Timer.name
  set_get/set_set, no pairwise. PROOF 15 green; core_same 260 steps 0
  differing; bench_byte_equal equal; old_core_replay ok; instructions replay
  +0.16%, ticks -0.6%, says -8%, view_all -0.4%; core.bend 3765 -> 3763.
- **xhub + gone, 187b2631f + cdcebac69 + 42e5b9452** (state-xhub, signed
  m_33495 + builders): Out/XIn/Route/Xs/Item, XKind/OutSt/RSt; xhub-model.bend
  464 -> ~175 lines (7 hand types, 30 getters, the codecs gone); gone.bend's
  Item; builders by name (route_of_hold, out_to, out_of_route, xin_from);
  core.bend's commit record Out renamed Turn; ~60 positional sites -> 0. Eta
  rewrites only, no pairwise. PROOF 15/15, gate quick green; core_same 0
  differing, view_all sha equal; bench_byte_equal equal; old_core_replay ok;
  instructions replay -0.7%, ticks -0.8%, view_all -0.5%; core.bend 3760.

After the five families: MIGRATING = {St}; codec.bend is 68 lines of readers
core.bend still calls. Next: St (and codec.bend whole), then the probe, then
the Rust chunk.

- **St, a54961883** (state-st, signed): hand St, its getters and apply's
  positional match gone, codec.bend gone; generated `T.over_f` keeps apply's
  fields single-owner (replay within ±0.4% of base). MIGRATING empty.
- **Rust chunk, 0fa32ab06 + 9e8c9eccc + ad11b0378** (signed m_34330): the
  records switchboard reads (Msg, Card, MsgState, Lifecycle, Declared, Run)
  generated from `core::state::STATE` into `state/generated.rs`, read as
  sb-core reads them, pinned on core_view.jsonl, core_journal.jsonl and
  fixtures/core_state_defaults.jsonl (both sides); Workspace/Mode/Brief/Report
  in `bise_proto::core::state`; model.rs's hand copies gone; `model::Agent` =
  sb-core's view row whole (`core: ViewAgent`) + the hub's
  activity/place/place_branch.

## The probe (done-when, run on main ad11b0378, then reverted)

A field `lang: Str` added to Msg, `probe: Nat` to St, each used once; blessed
(core_gen), quick gate green. Lines outside gen/ and `state/generated.rs`:

| field | declaration (`rust/proto/src/core/state.rs`) | use site | total |
|---|---|---|---|
| Msg.lang | 2 (the field, its journal key) | 3 (prompts.rs: a `lang` attr) | 5 |
| St.probe | 2 (the field, its photo key, issue 36) | 1 (model.bend: ECardOpened bumps it with `S.St.over_probe`) | 3 |

Generated: gen/state.bend, state-codec.bend, state-laws.bend and 3 lines of
`state/generated.rs`. Before the probe, six switchboard tests built a Msg
field by field and would each have broken (11 lines for Msg); they now take
the rest from `..Default::default()`.

Not counted, still by hand: a St field that Rust also reads goes through the
view, and switchboard's `State` copies 5 view keys by hand (order, main_notes,
next_msg, next_card, paused; `HAND_MIRRORS` in core_view_tests.rs, may only
shrink): such a field costs ~5 more lines (the view row, view.bend's fill,
State's field, its load, HAND_MIRRORS). **Follow-up, owner state-schema**:
take HAND_MIRRORS to zero by reading the view's scalars as one generated
record (a VIEW shape change, planned and signed on its own).
