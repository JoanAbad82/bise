# 38 · the sb requests and the runtime's obs lines are untyped

Status: done (task debt-t5, tech-debt D10): sha 1 bef343639 (sb requests
typed), sha 2a 276a2bdbd (obs records, reader first; shipped in
v2026.10.2-47), sha 2b (the runtime writes the records; signed m_37652).
Plan signed by architect (m_23413, m_35725, m_37394). Label: proto, cli,
hub, runtime.

Before → after: sb request variants 33 (file ops outside) → 45, all
commands; `AgentReq::from_json` 122 lines of string keys → gone; cli.rs
1,000 → 520 lines; core.rs 2,468 → 2,078. Obs: 23 kinds written as text
by 6 Bend files (show_obs + 9 hand writers) and read by prefix in 11 Rust
places → one generated encoder per kind (each proven equal to its fixture
line), one Rust reader (`lines::read`, the text only in legacy.rs, pinned
by tests/obs_readers.rs), 17 Python tests through tests/obs_lines.py; a
turn's end typed (end, why) at its 7 builders instead of parsed words.
A new obs kind: one ObsRec row + its writer's call + its view arm.

## The problem

The last two untyped seams between bise's processes.

- **sb requests.** The CLI built each request with `json!` (cli.rs, 1,000
  lines on main), and the hub read it back by string keys in
  `AgentReq::from_json` (core.rs 299-420 on main, 33 variants); the file
  ops (inspect, history, show, page_*, taste, people, artifact,
  project_list) were not variants at all: the daemon read their keys
  again where it handled them. So every new sb command (`sb wake --then`
  this week) edited untyped parsing in three places, and a key spelled
  differently on one side read as its default, silently.
- **obs lines.** The runtime writes 22 obs kinds as text (`  obs: …`, 17
  through bend/core/obs.bend `show_obs`, 9 by hand in main-pure,
  usage-pure, repl-core, provider-pure, debug-pure); besides proto's
  lines.rs, the Rust side strips their prefixes by hand (switchboard
  wire.rs, pages/mod.rs took_input, search.rs, proto_view.rs step_of,
  session usage_line.rs, and more).

## The plan

**Sha 1 · sb requests typed (`bise_proto::sb`).**

- `bise_proto::sb::Req`: one enum, serde tag `cmd`, a struct variant per
  command (45, file ops included), each with its wire codecs (sb/wire.rs:
  `m_<n>` ids, `@name`, mode, step, a brief's fields). `Req::decode` reads
  a request once; a `cmd` it doesn't know is `Unknown { tag, raw }`, and
  the hub answers it `unknown command: X (sb is newer than this hub)`.
- The CLI builds a `Req` (cli/build.rs) and sends `to_value()`; the hub
  decodes once (daemon.rs `agent_request`) and matches. `from_json` is
  gone. Plain data (Declared, Brief, Ask) moved to proto. A timer's
  schedule and a watch's spec stay wire fields: their one parser
  (`every::Sched::of_wire`, `wake::Spec::from_json`) runs in the handler.
- Fixtures: `fixtures/sb_req.jsonl` (111 lines, one or more per command:
  each reads and writes back the same, and a variant with no line fails);
  `fixtures/released/sb_req_v2026.10.2-44.jsonl` (116 requests as the
  released sb wrote them; the CLI didn't change from -43 to -44 to main):
  today's types read each and keep every key and value
  (tests/released.rs). So the steer default stays written:
  `"mode":"steer"` is a released key.

**Sha 2a · obs records, the reader first** (signed, architect m_35725).
`bise_proto::thread::obs::ObsRec` declares the 23 kinds the runtime
writes (`obs <kind> :: <json>`, like Feed, with core_kinds; its home is
the transcript's, next to lines.rs); `ObsRec::view` gives today's
`lines::Obs`, so the fold and the TUI don't move. thread/lines.rs reads
both forms; the old text parser lives in legacy.rs, for good (old
transcripts stay on disk: not a shim, issue 31's exempt list). Every Rust
reader goes through `lines::read`; tests/obs_readers.rs fails on a
prefix test of obs text anywhere else. core_gen writes
bend/core/gen/obs.bend (one encoder per kind, its whole line), imported
by bend/core/obs.bend and not called yet, and bend/proofs/obs.bend: per
line of fixtures/obs_lines.jsonl, a law that the encoder writes exactly
that record line, so the format is proven equal on both sides before the
writers switch. Python tests read obs lines through tests/obs_lines.py
(both forms).

**Sha 2b · the writers.** The 17 `show_obs` kinds and the 9 hand writers
switch to the records.

## 2b's trigger (the release after 2a)

Issue 25's rule: the reader ships one release before the writers. A REPL
of 2b's version writes `obs <kind> ::` lines; a hub rolled back to a
release without 2a's lines.rs reads them as nothing (the context meter,
took_input and search lose them). So 2b lands only once a published
release has 2a (`bise version` of the latest release tag includes 2a's
sha). Whoever lands 2b checks that, names the release in its commit, and
removes this paragraph.

## Measures (sha 1)

| | main | sha 1 |
|---|---|---|
| request variants (hub) | 33, file ops outside | 45, all commands |
| `from_json` | 122 lines of string keys | gone |
| rust/switchboard/src/cli.rs | 1,000 | 520 (+ cli/build.rs 391) |
| rust/switchboard/src/core.rs | 2,468 (limit 2,475) | 2,091 (limit 2,091) |
| diff | | +558 −1,449 in 40 files, + proto/src/sb.rs 620, sb/wire.rs 193 |

## A new sb command now

One variant, its CLI arm, its handler, and a fixture line. `sb restore`
as it stands:

- `rust/proto/src/sb.rs`, in `sb_reqs!`: 4 lines
  (`Restore = "restore" { #[serde(default)] agent: String },`);
- `rust/switchboard/src/cli/build.rs`: 1 line
  (`"restore" => Req::Restore { agent },`, in the one-agent arm);
- its handler, `rust/switchboard/src/core.rs`: 1 line
  (`AgentReq::Restore { agent } => …`);
- `rust/proto/fixtures/sb_req.jsonl`: 1 line.

7 lines, and the compiler names every place a new field must go. The
prompts' usage line comes from the CLI's COMMANDS table, as before.

## Done when

- no `from_json` on AgentReq (sha 1);
- a fixture of released sb requests still parses (sha 1);
- a new sb command is one variant + its handler, shown above (sha 1);
- no obs reader strips a text prefix outside legacy.rs (sha 2a); the
  runtime writes the records (sha 2b).
