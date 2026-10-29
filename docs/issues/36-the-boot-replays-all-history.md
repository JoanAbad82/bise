# 36 · the boot replays all history

Status: step 0 measured (below); architect's call on it (m_34144): plan v4
chunks 2-4 as signed (keyed photo shapes), chunk 5 becomes "the cold records
out of the photo" (its own plan first). Chunk 2 in progress.
Plan v4 signed by state-schema and snap-review (architect's brief, three
agents: boot-photo chunks 2-5, journal-bugs chunk 1, arch-split chunk 6).
Gabriel's pick on page debt-map (q-snap, « la photo et sortir le froid »):
« fais un plan détaillé et demande à un collègue de le review en regardant
le code. fais quelques itérations pour que le plan soit très bon, puis lance
l'implémentation ». Label: hub, boot. Nothing on GitHub.

## The problem

A hub boot replays the whole journal into sb-core, so it grows with history,
not with the live state. His harness hub, main f03183397: journal 59.7 MB,
134k events (`message_sent` 30.5 MB of it); `journal read` -> `journal
replayed` over his last 12 boots: 9.2 to 47.2 s. The Rust part (read and
parse the file, start sb-core) is 0.3-0.8 s; the rest is sb-core folding
every event over St. A revive (sb-core died) pays it again.

## Step 0 · the measures (2026-10-19, no code)

On a copy of his journal (59.8 MB, 134,537 events), sb-core built from main
f03183397 (`scripts/bins.sh path sb-core`), one heavy slot. Instructions are
sb-core's retired instructions (proc_pid_rusage `ri_instructions`), which a
loaded machine does not change; wall times are under load and only for
scale. Script: boot-photo's tmp `step0.py` (init, `replay_many` of 250, a
`view_all`, then a `ping` whose `pad` field is each string: its J.parse).

| what | bytes | sb-core instructions |
|---|---|---|
| full replay (`replay_many` x 539) | journal 59.8 MB | 134.8 G |
| `view_all` after it | 36.2 MB | 17.2 G (its encode) |
| J.parse of the full view | 36.2 MB | 21.0 G (~580 / byte) |
| the view, message text and parts emptied | 12.7 MB (35.1 %) | 7.6 G (~600 / byte) |
| a 20-byte line | 20 B | 0.12 M |

Where the bytes are (the view: 34,106 messages, 857 agents of which 834
archived):

- message text and parts: 23.3 MB of the 36.2 MB;
- the textless messages: 9.3 MB (271 B each as keyed JSON; 113 B each as
  positional arrays);
- the agents: 3.7 MB, 3.6 MB of it the 834 archived ones; their `brief`
  (1.6 MB), `files` (0.9 MB), `last_report` (0.8 MB), `ws` (0.15 MB); the
  archived agents without those four: 0.3 MB;
- everything else (timers, wakes, order, cards, ended lists): < 0.2 MB.

What it says for the plan:

1. A photo boot is already a large win before chunk 5: parsing the full
   36 MB photo is 21 G instructions against the replay's 135 G (plus the
   decode into St, not measured yet: a photo `_of` walk, expected of the
   same order as the parse).
2. The textless view is 35 %, not the < 20 % step 0 hoped for: chunk 5 as
   written (text and parts stripped) gives a ~12.7 MB photo, not < 5 MB.
3. It does not stay flat: every cold message keeps its record in St
   (113-271 B), so a journal with 10x his cold messages gives a photo of
   ~40-95 MB of message records alone. Flat needs the cold records out of
   the photo, not only their text.
4. The rest of the 5 MB is the archived agents' brief/report/files/ws
   (3.3 MB), "later, only if a boot shows it" in v4.

### Architect's call on step 0 (m_34144)

- **A now, then C; not B.** Chunks 2-4 ship as signed, with KEYED photo
  shapes: a positional shape is what state-schema just removed, and it buys
  a constant factor, not the bound. A full photo is already ~6x cheaper to
  read than a replay (21 G parse vs 135 G).
- Chunk 3 measures the St decode and puts it in its sha.
- Done-when for chunks 2-4 (A): a boot from the photo costs its parse +
  decode, measured, and answers byte-identically to a full replay.
- **Chunk 5 becomes C: the cold RECORDS out of the photo**, not only their
  text, for St.old and for the archived agents (St.arch, once arch-split
  lands; their brief/files/report/ws are 3.3 of the 3.6 MB). Its shape, to
  turn into its own plan (every reader of St.old and of archived agents
  listed first, and the laws) before code:
  - at photo time, each cold record is written ONCE to an append-only cold
    store (`<state>/cold/`, records in their photo shape, encoded by sb-core:
    one encoder) with a small id -> offset index; the photo keeps only what
    must stay in memory: next_msg / the cold watermark, and for archived
    agents the name index (name + aliases) for name_taken / resolve /
    name-free;
  - a step that needs a cold record (rec_in, reply_at, msg_of and its
    callers, msg_op.cold.go when a cold message turns hot, the restore of an
    archived agent) asks for it through need/ans; the Rust serves the stored
    bytes and never rebuilds a record itself (no second copy of apply's
    message rules in Rust);
  - a cold record that turns hot comes back into St whole; one going cold
    again is written again (last write wins by id in the index);
  - apply/replay never asks (a law or a lint); cold_is_inert, inv Parts and
    their proofs restated over St + store;
  - the Rust mirror's history and boot view read the store behind one fn in
    crate::cold.
- Done-when for C, as v4: the photo < ~5 MB on his copy, flat on a
  synthetic journal with 10x his cold messages and archived agents.

## The plan (v4, final)

The Rust shell keeps reading the whole journal (0.3-0.8 s: the inbox index,
PR lines, follow_moves and unreadable-line logging stay as today). Only
sb-core stops replaying it: it starts from a **photo** of St and replays the
events after it. To keep the photo small, the text and parts of cold
messages leave the photo: sb-core asks the Rust shell for a cold message's
text when a step needs it (its need/ans round trip), and the Rust answers
from the journal itself (an index id -> line). The journal stays the one
durable store; nothing new on disk but the photo.

1. **Two journal bugs** (journal-bugs): an invalid UTF-8 byte boots an empty
   hub (daemon.rs `read_to_string(..).unwrap_or_default()`, at boot and at
   revive): decode per line. A failed journal write is dropped: a
   `journal_ok` flag, false on any failed write or flush, one hub.log line;
   no photo is written while it is false.
2. **The photo shapes** (core_gen): every record of STATE gets a lossless
   `photo` shape whose round law is identity (`_of(_json(x)) == x`); a
   `journal` shape reused only where its round law says `== x` for every
   field; `Wire::Recs` (a list of the item's shape) with one list lemma per
   record type; Sched as its own tagged object; WATCH_RESUMES read plainly.
   A text round trip (J.stringify then J.parse) on a fixture with escapes,
   newlines and non-ASCII is evidence only.
3. **sb-core inputs**: `photo {}` -> `{st}` (read-only, refused while a need
   is pending); `restore_photo {st}` -> `Hub.d := st`, R fresh, a decode
   failure changes nothing. Laws: restore_photo(photo(h)) keeps `Hub.d`;
   replay(prefix ++ tail) == replay(tail) after restore_photo(photo(replay(prefix))).
4. **The Rust side** (crate::photo; daemon.rs gets call lines only): the
   file `<state>/photo/<sb-core key>.json` = `{v:1, key, events: k, last:
   <sha of event k's line>, st}`, the last two keys kept. Boot and revive:
   PR lines of all events to Rust, events[k..] to sb-core when `usable`
   (same key, k <= events, event k's line hashes to `last`, no
   `sweep::migrate` move this boot), else a full replay and one hub.log
   line. Written between two steps with `journal_ok` true: at a clean stop
   (skipped if the last encode took > 2 s), after a boot that did a full
   replay, at most once a day after 10 min without input. tmp + fsync +
   rename. Proof on his copy: photo at 10/50/90/100 % + tail vs full
   replay, every answer and `view_all` sha byte-identical.
5. **Cold records out of the photo** (replaces v4's "cold text out", see
   architect's call above; its own plan to architect before code).
6. **Archived agents out of the walks** (arch-split, issue 21 sha 2).

Every chunk: its sha to architect before it lands, then the full gate, then
`sb land`. Bend: ALL PROOFS CHECK, no unsafe; old_core_replay vs the last two
tags and main; scripts/core_same.py for every no-behaviour-change claim. New
code in new files (crate::photo, crate::cold); daemon.rs, core.rs and
core.bend get call lines only.

## Found on the way: a char cut by a recv was lost (fix sha before chunk 3)

Chunk 3's check (restore a photo, take it again: byte-identical) failed on
one '─' that came back as three U+FFFD. Bend's `TCP.recv` decodes each recv
on its own, so a multi-byte UTF-8 char cut by a recv boundary is lost. Two
readers did that:

- sb-core (`bend/hub/main.bend` `conn`, 64 KB a recv): the hub sent raw
  UTF-8, and a boot's `replay_many` line is ~110 KB. On his journal copy a
  full replay sent ASCII-escaped gives a view with 4 U+FFFD (3 journal
  lines already hold them: that text was lost before, it stays lost); sent
  raw, as the hub did, 18: ~14 chars of message text damaged in sb-core's
  state (and the mirror) at every boot, where the cuts fell.
- an agent's REPL (`bend/runtime/repl-core.bend` `repl_conn`, 4 KB a
  recv): his messages to agents over 4 KB reached the model with U+FFFD
  where a cut fell.

The fix (architect m_34443, m_34454), each sized to its reader:

- the sb-core link: the hub writes every line ASCII-only
  (`bise_proto::ascii`: each non-ASCII char as `\uXXXX`, a surrogate pair
  past U+FFFF; `core_proc.rs` `line_of`, its test pins no byte >= 0x80).
  sb-core's reader is unchanged and safe only because of that (a comment at
  its recv says so). A 36 MB photo as a list of bytes in Bend would cost
  too much.
- the REPL link: the REPL reads bytes (`TCP.recv_bytes`) and decodes them
  with `bend/core/utf8.bend`, which keeps the bytes of a cut char (at most
  3) for the next recv; an invalid byte is one U+FFFD and the next byte
  starts afresh (Rust's `from_utf8_lossy` rule). The `say` wire is
  unchanged: any mix of old and new hub and REPL works. Laws
  (bend/laws/utf8.bend): an ASCII chunk decodes to itself; a cut anywhere
  changes nothing; a cut char then ASCII, a stray byte then ASCII: one
  U+FFFD, the ASCII byte kept.

Its limits: the `say` wire's literal backslash-n is still ambiguous
(`wire_escape` escapes newlines only, before this fix too); and a recv that
decodes per chunk is a Bend bug class (a minimal repro for Bend upstream:
tests/fixtures/bend-recv-repro/).

## Done when

- On his journal copy: a boot from a photo at the last event sends 0 events
  to sb-core, costs the photo's parse + decode (measured), and answers
  byte-identically to a full replay; a photo 20k events old replays only
  that tail.
- After chunk 5 (C): the photo is < ~5 MB on his copy, and stays flat on a
  synthetic journal with 10x his cold messages and archived agents (boot
  within 10 % of his).
- The two journal bugs fixed with their tests.
- Every chunk landed on main.

## Slices

(per slice: sha, what moved, proofs and replay)
- **chunk 2, the photo shapes** (boot-photo): `photo` shapes in
  bise_proto::core::state for Agent, MRec, Item, Timer, TimerEnd, Watch,
  WatchEnd, Wakes, Tms, Xs, St (Msg, Card, Ans, Act, XIn, Route, Out reuse
  their journal shape: its round law is already identity); Wire::Recs (a list
  of the item's shape) with one list round law per record type
  (core_gen/photo.rs); Sched's tagged object (tag `kind`, exact; the journal
  keeps its hand codec); Watch's photo reads `resumes` plainly. A unit test
  walks St's photo and fails on a field not carried, a hand codec or an
  inline record. gen/state-codec.bend: ALL PROOFS CHECK, `St.photo_round`
  identity; its check ~4.4 s -> ~4.8 s (7.0 s once under load). Nothing
  imports the photo codec yet: no behaviour change. The text round trip
  (escapes, non-ASCII) moves to chunk 3, where sb-core writes and reads it.
- **UTF-8 fix, 400fbd1eb** (boot-photo, signed architect m_34484, review-gates
  m_34728): see "Found on the way" above. His journal copy: 18 -> 4 U+FFFD in
  a full replay's view.
- **chunk 3, sb-core photo / restore_photo** (boot-photo): bise_proto
  Link::Photo / RestorePhoto and Answer::Photo (fixtures), bend/hub/photo.bend
  (photo: none while an env query is pending; restore: the state from the
  photo, R fresh in the same workspace; not an object: unchanged, an error
  answer), main.bend call lines only. A restore takes only a hub that
  applied nothing yet (Hub.fresh: true at init, false after any step,
  replay or restore; architect m_34907): a photo never replaces a live
  state. Laws (bend/laws/photo.bend, ALL PROOFS CHECK): photo_is_the_state,
  restore_keeps_the_state, restore_only_fresh, replay_from_photo (replay of
  p ++ t from st == replay of t from the photo of p's state); core tests
  core_photo_tests.rs (a stepped hub refuses, a fresh one restores once).
  His journal copy (134,537 events, sb-core with arch): photo after 10, 50,
  90, 100 % of the events, restored in a fresh sb-core, then the tail: every
  view_all and photo byte-identical to the full replay's (0 differing); the
  photo of a restored hub is the same 35,039,299 bytes (125k non-ASCII chars,
  74 astral: the text round trip). Instructions: full replay 76.5 G; photo
  (encode) 15.0 G; restore_photo of the 100 % photo 26.8 G (its J.parse ~21 G,
  the decode ~6 G); so a boot from a fresh photo is ~2.9x cheaper in sb-core
  than a full replay today (it was ~5x before arch-split made the replay 134
  -> 76 G); the parse dominates, and chunk 5 (cold records out) shrinks it.
- **chunk 4, the Rust photo** (boot-photo, signed architect m_35726):
  crate::photo (photo.rs: the file `<state>/photo/<key>.json` =
  `{v:1,key,events,prefix,paths,st}`, key = FNV-1a of the sb-core binary's
  bytes (deviation signed: nothing to run at boot, any rebuild = full
  replay), prefix = chained FNV of journal events 1..k, paths = hash of their
  ws paths; tmp + fsync + rename, two keys kept, tmp cleaned at boot);
  core_photo.rs (child of core: Hub::photo, Hub::rebuild from (k, st) then
  events[k..], PR lines of every event read; Revive and restart_core moved
  here, a revival restores the photo too); daemon/photo_take.rs (boot pick
  and one hub.log line saying why a full replay; photo after a full-replay
  boot, at a clean stop unless the last took > 2 s, idle once a day after
  10 min without a journal event; all only while journal_file::Out::ok).
  sb-core's restore reads any object (St.photo_of is lenient): the key and
  the prefix keep a wrong photo out (signed). core.rs 2467 -> 2415,
  daemon.rs 2008 -> 2006. His copy, release build, retired instructions
  (ignored tests photo_on_a_real_journal, boot_phases_on_a_real_journal):
  photo + tail == full replay (photo and mirror) at 10/50/90/100 %; full
  boot ~103 G (sb-core replay 75.8 + view_all 19.1, hub 7.7); boot from the
  100 % photo ~54 G (sb-core restore 26.6 + view_all 18.7, hub 8.8): 1.9x.
  Restore and view_all both scale with St (35 MB photo, 36 MB view): chunk
  5's target.
- **agents-light, the app's first answer** (boot-photo, signed architect
  m_37000/m_37151/m_37220): (a) 4a0af660c, initialize seeds the heads and
  usage of live agents only; (b) 948318eac, the agents event carries the
  archived ones as a light list (name, aliases, dir, status, since_ms,
  about), sent on a connection's first event and when it changes; older
  clients keep the full shape (shim agents-full-archived, out in
  v2026.10.2-52); agent/get for one full row. Measured on a copy of his
  state (148k events, 892 transcripts, 888 agents of which ~20 live,
  symbolized release, macOS sample, `$TMPDIR/app_boot.py`): the hub loop
  held on a client's initialize ~4.0 s -> ~0.16 s (the rest: seeding the
  live agents' heads on the first connect, hub_state's git spawns);
  initialize 1.49 MB -> 270 KB. Known sizes left, kept on purpose
  (architect m_37382: a local socket): hub/agents 175 KB (the live rows in
  full, each with its whole objective, + the light list), hub/scheduled
  95 KB (the last week's ended timers included). The next measure starts
  from these.
- **chunk 5a, what a step or a batch needs** (boot-photo, signed architect
  m_37467), bbb5e56f3: bend/hub/needs.bend (needs, needs_batch through a
  batch's renames, needs_in, drop_old); laws apply_is_local_msg and
  fetch_then_apply_list proven (bend/proofs/cold-store.bend);
  tests/cold_apply_lint.py (M.apply, replay_batch and needs.bend reach no
  need). step_is_local / view_is_local are aims, not gates (architect
  m_37415), checked on his journal copy by tests/cold_local_check.py: 78
  inputs committed with every cold message outside needs_in dropped,
  journal/effects/need diffs 0, misses 0. No sb-core change.

## Next (not started; boot-photo was archived after 5a)

- **5b, messages out, fetch on miss** (architect m_37415): cold_out of
  St.old with generations into crate::cold's store. In a STEP (never in
  apply), every cold lookup (msg_of, rec_at, reply_at, agent_named/alias on
  arch) that meets a stored id or name not in memory halts with a need for
  it through the existing need/ans, and the input runs again once fetched
  (a step is pure until committed). needs_in stays the batching
  optimisation (one ask up front); a miss costs a round trip, never a wrong
  answer. Law, about the lookup fn only: a step's lookup of a stored record
  reads it or emits its need, never answers None for it. One hub.log line
  per miss ('needs_in missed msg 1234 for input answer') and a miss count
  in the boot/step measure.
- **5c, archived agents out**: the arch name index (name, aliases, dir,
  plus the light row's status, since_ms, about: one index with
  agents-light) stays in memory; the full records go to the store.
- **5d**: the mirror and view_all read cold records through crate::cold;
  done-when as plan v2 (photo < ~5 MB on his copy, restore + view_all flat
  on the 10x synthetic journal, boot by phase). Each 5x sha to the
  architect with core_same, old_core_replay and boot-by-phase numbers.
- **agents-light's TUI parity check** (architect's point 5): on main, the
  TUI's archived section draws the same rows from the light list as from
  the old full shape (age from since_ms, text report/objective/title).
- **Shim agents-full-archived** goes in v2026.10.2-52 (tests/shims.txt).
