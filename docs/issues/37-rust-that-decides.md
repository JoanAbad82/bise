# 37 · Rust that decides

Status: audit only, nothing started (Gabriel's rule 23: no new
refactoring task; these are picks for him). Measured at main ad11b0378,
2026-10-20. Label: hub, sb-core, laws. Page: `rust-bend` (French), signed
by architect. Brief: architect's brief-rust-bend.md, after Gabriel's
« un audit de ce qui est en Rust qui devrait être en Bend pour que ce soit
plus safe et qu'on puisse avoir des preuves ».

## The answer

Of the 263,712 lines of Rust in the 13 crates of `rust/` (switchboard,
proto, tui, session, catalog, harness, home, peer, computer-use, plugins,
secrets, images, jsrt; `rust/vendor` aside), **9,851 decide** (3.7 %), and
8,485 of them are in `rust/switchboard`. 3,741 of those are the approvals.
The rest is glue (148,867), words and views (12,768) and tests (92,226).
sb-core already owns the big decisions (messages, notifications, waits,
timers, watches, routes, places, names). No Rust copy of them was found:
`model.rs`'s `unanswered_for` and `is_queued` read sb-core's facts. What is
left in Rust is a set of side decisions around processes, sockets, git
and pages.

Five should move, in this order: his words' route, the socket access
decision, the land queue and pick, the REPL reload schedule, and the
notifications a page makes. A sixth pick does not move anything: write
the approvals' laws as Rust property tests. Everything else stays in Rust,
for the reasons below.

## How it was measured

`classify.py` (rust-bend-audit's tmp; the rules are in its header): every
`.rs` file of the 13 crates (their `src/` and `tests/`, never `target/`)
is GLUE, VIEW, DECISION or TEST (`#[cfg(test)] mod` tails, `*_tests.rs`,
`tests/`, computer-use's `e2e`). A file that mixes
glue and decisions is MIXED: its decision functions are named, and their
lines (brace matched, with their doc comments) count as DECISION. VIEW is
pure projection and words for people (rows, labels, prompts, `sb list`):
the brief's "words keyed on facts". It has no law worth stating, and
issue 29 owns the words.

Bugs: the commits on a family's decision code in the last 60 days whose
message says what was wrong, read one by one (the `fix` prefix alone
misses most of September's, and a file-level count of daemon.rs or
core.rs picks up every hub fix). Contagion: the use sites of the family's
names outside tests (`grep -rn`, the patterns are in the table's notes).

| crate | GLUE | VIEW | DECISION | TEST | total |
|---|---:|---:|---:|---:|---:|
| switchboard | 37,616 | 5,799 | 8,485 | 25,184 | 77,084 |
| proto | 12,121 | 6,124 | 0 | 9,009 | 27,254 |
| tui | 68,387 | 845 | 39 | 44,228 | 113,499 |
| session | 4,019 | 0 | 0 | 1,224 | 5,243 |
| catalog | 8,206 | 0 | 0 | 3,899 | 12,105 |
| harness | 3,785 | 0 | 10 | 1,250 | 5,045 |
| home | 2,973 | 0 | 0 | 1,542 | 4,515 |
| peer | 338 | 0 | 163 | 368 | 869 |
| computer-use | 3,512 | 0 | 375 | 1,607 | 5,494 |
| plugins | 5,372 | 0 | 275 | 1,972 | 7,619 |
| secrets | 1,018 | 0 | 174 | 510 | 1,702 |
| images | 611 | 0 | 154 | 264 | 1,029 |
| jsrt | 909 | 0 | 176 | 1,169 | 2,254 |
| all | 148,867 | 12,768 | 9,851 | 92,226 | 263,712 |

proto, catalog, session and home decide nothing that matters: types,
codecs, words, the model catalog's merge of two config files, paths. The
TUI's decisions moved to the hub with issues 22 and 23; what is left is
view state (`turns.rs`, 39 lines). The six security and support crates
decide 1,317 lines: see "the security crates" below.

## The decision families, ranked

score = (bugs + contagion / 20) / (decision lines / 100). A bug weighs
as much as 20 use sites; the cost is the lines that move. The cost
columns say what the lines do not: the seam and the hot path. "If it is
wrong" is Gabriel's own criterion (« plus safe »): what is lost when the
decision is wrong. It does not change the ranking.

| # | family | decision lines | bugs 60 d | contagion | score | if it is wrong | verdict |
|---|---|---:|---:|---:|---:|---|---|
| 1 | route of his words | 68 | 2 | 16 sites, 2 files | 4.1 | his words misrouted to another project | move |
| 2 | socket access (peer) | 105 | 3 | 19 sites, 7 files | 3.8 | security: an agent acts as him or as another agent | move |
| 3 | land queue and pick | 527 | 3 | 89 sites, 17 files | 1.4 | work lost, or main broken | move |
| 4 | REPL reloads and starts, idle exit | 1,009 | 5 | 90 sites, 11 files | 0.94 | REPL restarts (CPU bursts, a turn late), a switch rolled back | move |
| 5 | notifications a page makes | 1,090 | 2 | 130 sites, 15 files | 0.78 | his answer lost | move |
| 6 | PR follow (news, merge item) | 687 | 0 | 91 sites, 11 files | 0.66 | a review missed or told twice | later |
| 7 | message parts checks | 357 | 0 | 34 sites, 9 files | 0.48 | security: the model reads a file outside the store | stays |
| 8 | hub-made notifications (sign-in, update) | 414 | 0 | 29 sites, 8 files | 0.35 | a notification late or stale | stays |
| 9 | approvals tiers and gate | 3,741 | 0 | 71 sites, 9 files | 0.09 | security: a command runs that should have asked | stays; laws as Rust property tests (pick 6) |
| - | loop order (inbox lanes, state gate) | 130 | 0 | - | - | a client waits | stays: hot path |
| - | process kills, worktree sweep | 161 | 0 | - | - | work lost | stays: OS lists |
| - | version switch probation | 99 | 1 | - | - | a bad version kept, or a good one rolled back | stays: no sb-core there |
| - | artifact saves in one turn | 97 | 0 | - | - | cosmetic: one version too many | stays: no bug, a file rule |
| - | client state (TUI turns, home hub restarts) | 49 | 4 | - | - | cosmetic, or a home hub restart | stays: client view state |
| - | peer judge (who the peer is) | 163 | 0 | 48 sites | - | security: a wrong identity | stays: a fact, shared with the broker |
| - | computer-use broker (who drives which tab) | 375 | 0 | - | - | security: an agent drives a tab it must not | stays: no sb-core in the broker |
| - | jsrt script door (paths a script may touch) | 176 | 0 | - | - | security: a script writes outside its roots | stays: per file operation, no sb-core |
| - | secrets store and keychain steps | 174 | 0 | - | - | a keychain dialog, a secret in the wrong store | stays: already proved in Rust |
| - | plugins precedence and limits | 275 | 0 | - | - | a plugin or tool enabled wrongly | stays: no bug, runs in every client |
| - | image store retention | 154 | 0 | - | - | an image lost | stays: debt-t9 owns it |

### 1 · the route of his words

- **Where**: `rust/switchboard/src/daemon/routing.rs:34-62` (`route_input`,
  `routable`), `route.rs:21-55` (`address`, `addressed`).
- **The fact**: does his line to bise's main go to a project? sb-core
  owns the rest of the route: the hold, the fire, the cancel and their
  laws (`bend/hub/xhub.bend`, laws `route_fire_says_where`,
  `route_one_outcome`, `route_fires_at_due_only`). Rust owns only the
  first decision, so a route has two owners.
- **Law**: his words leave bise's main only when they start with
  `@<project>`, that project is registered, no agent of this hub has that
  name, and they are sent now (not queued, not a command).
- **Bugs**: 9556e0f99 (2026-10-14): his m_75 « je les voie pas dans
  harness non plus » went to harness only because it named it (route.rs
  scored a plain name 0.85). 0170ed3fb (the same day): a project name
  inside a path or a URL named it.
- **Cost**: about 70 Rust lines out, about 50 Bend lines in `xhub.bend`
  (243 lines, far from any limit; core.bend stays as it is). One new
  input field: the registered projects, on the home hub's user input
  only. Once per message he sends: no hot path.
- **Contagion**: 16 sites in 2 files.
- **Done** (rust-to-bend, architect m_35221): input `route_ask` and fx
  `route_asked` (xhub.bend `addressed`, laws in `bend/laws/route.bend`);
  route.rs is gone, routing.rs only reads the projects and the answer.
  Measured on his journal copy: a plain line to main costs 3.9 M
  instructions more (on top of the input's 25.6 M, about +15 %).
  Known cost: a long pasted text is parsed twice, by `route_ask` then by
  the input step (a 200 KB paste: 127 M for the ask). Accepted, a rare
  line.

### 2 · the socket access check

- **Where**: `rust/switchboard/src/peer.rs:46-140` (`speaker`, `access`),
  called by `daemon/accept.rs` and `peer_os.rs`.
- **The fact**: who may say what on `hub.sock` and `agent.sock`: the user,
  an agent as itself, never an agent as another or as the user. Rust only.
  Issues 16 and 17 fixed it in Rust and own the threat model; this item
  is only where the decision lives.
- **Law**: a request on `agent.sock` speaks only as the agent whose REPL
  started the process; nothing on `agent.sock` acts as the user.
- **Bugs**: 6887139fe (issue 16, 2026-10-07): an agent's process could
  act as the user on its hub's socket. bc90689bf (the same gate): a
  notice was refused when not proven an agent's. f07dca16f (issue 17,
  2026-10-14): an agent could speak as another on agent.sock. Found by
  audits, not by a loss.
- **What moves, exactly**: the policy on top of the identity, never the
  identity. `judge()` and `judge_any()` (`rust/peer/src/judge.rs`) stay in
  Rust: they are shared with the computer-use broker, which has no
  sb-core, and from the process table they only read a fact (who the peer
  is: the user, agent X, unknown). That fact rides the request's input.
  What moves is `access` (which socket may carry which op) and `speaker`
  (a request's `from` against who the judge says the peer is). One owner
  per rule: the judge owns "who", sb-core owns "may".
- **It fails closed**: while sb-core is down, restarting or replaying the
  journal at boot, an agent's request waits for it (as every `sb` request
  does today) or is refused; it is never let through.
- **The hello on `hub.sock` stays a Rust gate**: today it is refused
  before the loop when the judge says the peer is an agent's process. It
  keeps that gate on the judge's fact, so a flood of an agent's
  connections to `hub.sock` never reaches the loop. Only the requests
  that pass it get sb-core's `access` and `speaker`.
- **Cost**: about 105 Rust lines out, about 120 Bend lines and two laws.
  Once per `sb` call: no new sb-core step, the decision rides the step the
  request makes anyway.
- **Contagion**: 19 sites in 7 files.

### 3 · the land queue and pick

- **Where**: `land_queue.rs` (whole: one land per target ref, rank, a
  second land of the same place refused), `land_pick.rs:64-172` (`pick`:
  what a land takes and what it names), `land_check.rs:42` (`checked`:
  which lands run the check), `land.rs` `run_onto`, `land_branch`,
  `own_changes` (149 lines).
- **The fact**: which files a land takes, who lands next, whether main can
  move unchecked. Rust only; sb-core knows the agents' places and claims
  but not the queue.
- **Law**: one land at a time per target; a land takes only its agent's
  own changes (all of them in a worktree it has alone); nothing moves the
  trunk without the check on the exact tree.
- **Bugs**: cf52f972a (2026-10-02): new files made by bash dropped
  silently from lands. c9a1615b0 (2026-10-05): a land from a worktree
  onto the wrong trunk (issue #8's twin). Issue 28 (a3d52808f): two lands,
  each green, broke main's build. 5ce1b2999 (2026-10-17): a slow land
  check failed lands. Issue 12 owns the pick rule; issue 28 owns the
  check.
- **Cost**: about 530 Rust lines out, about 400 Bend lines in a new
  `bend/hub/land.bend`. git stays Rust (status, commit-tree, the check).
  A land runs on its own thread; each decision becomes one round trip
  through the loop (a land is rare: one or two a minute at most). File
  lists up to `SWEEP_MAX`: small for Bend.
- **Contagion**: 89 sites in 17 files.

### 4 · REPL reloads and starts, and the idle exit

- **Where**: `daemon.rs:1217-1422` (`keys_changed`, `plugins_changed`,
  `skills_before_turn`, `switch_idle_repls`, `idle_busy`, `idle_check`),
  `repl_start.rs` (order, the 4-in-flight limit, stalls), `watch.rs`,
  `boot.rs`, `daemon/repl_starts.rs` (`admit_starts`, `switch_admitted`,
  `check_starts`, `start_gone`), `daemon/recycling.rs` `main_holds`,
  `daemon/keys.rs`, `idle.rs`.
- **The fact**: when an agent's REPL reloads or restarts, how many at
  once and in what order, and when the hub stops by itself. sb-core owns
  the agent's run state (`Run`), and Rust reads it; the reload set
  (`reload_repls`, `switching`), the start queue and the idle watch are
  Rust only.
- **Law**: a REPL reloads only when its agent is idle, once per change;
  at most 4 starts at once, the one he waits on first; main's own recycle
  never runs while his message to main waits; the hub never stops itself
  while an agent works, a REPL starts or a switch is on probation.
- **Bugs**, each in his own hub:
  - 3812814be (2026-10-07): a switch reloaded 22 REPLs in one tick, 5
    failed a flat 20 s limit, the switch rolled back. Same commit: a hub
    on probation idle-exited, and the exit read as a crash.
  - bb486992d (2026-10-07): a slow journal replay failed a switch.
  - 959d1e474 (2026-10-12): every live REPL relaunched at once (26 REPLs,
    6 MCP servers each), 30-40 bursts a day since 10-10: a temp file's
    path read as a key change.
  - 4a9c30223 (2026-10-15): main's relaunch was held 2 min after each of
    his lines, so /reload and plugin changes never came while he talked.
  - 975c5750b (2026-10-17): main was recycled while he talked to it.
- **Cost**: the biggest of the five: about 1,000 Rust lines out, about
  700 Bend lines in a new `bend/hub/repls.bend`. New inputs: `repl_stale
  {dir, why}` (the fingerprints, key hashes and file stats stay Rust:
  only "changed" goes in), `start_step`, `start_gone`, the idle facts
  (UIs, background jobs, builds). New effects: `reload`, `spawn`,
  `kill_stalled`, `stop_hub`. Per tick (2 s) and per REPL change: small
  records, no byte work. Shrinks daemon.rs (2,020 lines, at its limit in
  tests/line_limits.txt). Leave `recycle.rs`'s budget in Rust as an input
  (`due`): it is a workaround for the Bend allocator, meant to go, not to
  get a law.
- **Contagion**: 71 sites in 8 files, and 19 more in 3 for the idle exit.

### 5 · the notifications a page makes

- **Where**: `daemon/page_cards.rs` (579 of its 874 lines: `page_steps`,
  `page_batch`, `page_drafts_answer`, `page_tick`,
  `page_question_answer`, `page_answers`, ...), `pages/drafts.rs`
  (`pending`, `ready`, `batch_answer`, ...), `pages/checklist.rs`
  (`judged`, `due`, `closed_by`), `pages/questions.rs` (`plan`),
  `pages/plan.rs`, `daemon/page_plan.rs`.
- **The fact**: which notifications a page opens and closes (its
  questions, his steps, the drafts waiting for his word, a plan) and
  where his answer goes. sb-core owns the notification once it exists
  (and the plan's `page_card`); Rust decides when it exists and who gets
  the answer. Two owners.
- **Law**: each open question, due step and waiting draft of a page's
  newest version has exactly one open notification; his answer reaches
  the asking agent once, and never goes nowhere.
- **Bugs**: 5b19b5864 (2026-10-13): his words on a drafts notification
  emptied the field and went nowhere (« Ou sont les drafts ? »).
  f681138e2 (the same day): page answers did not tell the asker.
- **Cost**: about 1,100 Rust lines out, about 800 Bend lines in a new
  `bend/hub/pages.bend`. The HTML stays in Rust (the lint, the block
  parsers): sb-core gets the parsed blocks as records
  (`page_published {id, version, questions, steps, drafts, plan}`) and
  his answer (`page_answer {card, reply}`). Per publish and per answer:
  no hot path.
- **Contagion**: 130 sites in 15 files.

### Pick 6 · the approvals' laws as Rust property tests

The approvals are the decision with the most at stake (a command runs that
should have asked) and the biggest block (3,741 lines). They stay in Rust
(see below), but their laws can be written and checked where they are:
property tests over generated commands, paths and tool names, run in the
gate. The laws, from the module headers (`approvals/mod.rs`, `tiers.rs`,
`paths.rs`, `secrets.rs`, `connector.rs`, `arity.rs`, `rules.rs`), to
check against the code as each test is written:

1. a part that reads or writes a secret (`auth.json`, `secrets/`,
   `~/.ssh`'s private keys: `Secrets::of`) never runs at once;
2. in `auto`, a connector write on his accounts always asks him (a
   notification, never the checker), and a name that is not clearly a
   read is never taken for a read;
3. a write outside the roots, or to a protected path, never runs at once;
4. a hard rule is never lifted by a saved rule, the cache or the checker;
5. a saved "always" rule allows only what its pattern covers (`cargo test
   -p x` gives `cargo test *`, never `cargo *`);
6. in `auto`, every bash call runs under the agent's sandbox profile, and
   the profile never grants a read of a secret.

Cost: tests only, no move, no new seam. The tests today are examples
(29 in `approvals/tests.rs`, 25 sandbox, 19 checker, 8 connector, 5
secrets): a property test states the rule for every input. Issues 19 and
20 own the sandbox itself.

### 6 · later: the PR follow

`forge/news.rs` (`event`, `activity`, `failing`, `owner`), `forge/mod.rs`
(`diff`, `belongs`, `journal_line`), `merge.rs` (`ready`, `merge_sync`),
`core.rs:1687-1850` (`prs_in`, `news_out`, `pr_cleanup`): 687 lines.
Law: a PR's news reaches the agent that owns it once; the third failure
of the same check is the user's; the merge item is open only while the
PR is ready. Its `pr_*` journal lines are the journal's second reader
(architecture principle 2's bad example, approved change 1). No bug in
60 days, because his repos use the trunk flow and no PR. It moves when PRs
are used.

## What stays in Rust, and why

- **I/O** (sockets, files, git, processes, the page server, `gh`):
  sb-core is pure by design; it asks, and the shell does.
- **Bytes and text** (the bash parser `approvals/parse.rs`, `router.rs`,
  the page lint and HTML, transcripts and thread lines): Bend is slow over
  strings and bytes, and parsing has no law beyond round trips, which
  issues 24, 25 and the typed `bise_proto` already give.
- **The loop's own order** (`daemon/inbox.rs`, `daemon/state_gate.rs`):
  one decision per message on the hot path; a sb-core step per message
  would double the loop's cost. Its rules are pinned by unit tests.
- **The approvals** (3,741 lines): the decision with the most at stake,
  but no bug on it in 60 days, the biggest move, one more round trip per
  gated call, and path work that Bend does slowly. Issues 19 and 20 own
  the sandbox. The cheaper step to the same safety is pick 6.
- **The security crates**, each outside the hub, so no sb-core to ask:
  - `rust/peer` `judge.rs` (163 lines): who the peer is, a fact read from
    the process table, shared by the hub and the computer-use broker
    (48 use sites); pick 2 moves the policy on top of it, not it.
  - `rust/computer-use` `who.rs`, `refuse.rs`, `broker.rs`'s
    `pick_browser`, `owner`, `handle`, `on_target` (375 lines): who may
    drive which tab. The broker is one process per machine with no
    sb-core; issue 18 owns it. No bug on the decision in 60 days.
  - `rust/jsrt` `door.rs` (176 lines): the paths a script may read or
    write, checked on every file operation inside the script runtime.
  - `rust/secrets` `ready.rs`, `setting.rs`, `lib.rs`'s `place`,
    `write_to`, `move_to` (174 lines): where a secret is read and written.
    "Never a keychain dialog" is already proved in Rust over every pair of
    keychain states (`law_no_security_call_on_a_locked_keychain`): the
    model for pick 6.
  These four would gain property tests like pick 6 more than a move.
- **Plugins** (`resolve.rs` precedence and tool limits, `state.rs`
  enable state: 275 lines): read by the REPL, the TUI and the desktop's
  core, no bug in 60 days.
- **The image store's retention** (`rust/images/src/prune.rs`, 154
  lines): shared by every hub of a home; debt-t9 owns it.
- **Process kills and the worktree sweep** (`procs.rs`, `sweep.rs`): a
  filter over the OS process table and git status, big lists, no bug;
  "never deletes unsaved work" is tested on real repos.
- **The version switch** (`switch.rs`): it runs in `sbswitch` while the
  hub (and its sb-core) is being replaced: there is no sb-core to ask.
- **Words and views** (12,768 lines): no law worth stating; issue 29 owns
  the words.
- **Client state** (the TUI's turn edges, the desktop core's voice and
  home hub restarts): view state of one client; no Bend runs in a client,
  and the shared facts already moved to the hub (issues 22, 23).
- **The recycle budget** (`recycle.rs`): a workaround for the Bend
  allocator, to delete when the runtime keeps its heap compact.

## Not checked

- The ambient-app branch (its own `every.rs` timer wakes, the principles'
  bad example 3): main only.
- Decisions inside glue functions not named in `classify.py`'s MIXED
  list: they count as glue, so the 9,851 is a floor.
- `rust/vendor` (third-party code).
- No timing of a new sb-core step: the costs say "one step" from issue 36's
  measures (a tick 4-5 ms on his journal copy), not from a run.
