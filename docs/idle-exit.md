# idle-exit: a hub nobody looks at stops by itself

Before: a hub ran until killed. An unused workspace kept its sbd, sb-core
and every agent REPL, each with its plugins bridge and MCP servers
(one audit: 5 unused hubs with 28 REPLs, 175 orphan processes).

## What stops when

The hub counts its UIs: the clients that said `initialize` on `hub.sock`
(docs/client-protocol.md; the
TUI, the ambient app's core) plus the holds others take on it
(`idle::Holds`: a page's open event stream). When the count is 0:

1. a grace period starts (`idle_exit` in `~/.bise/config.toml`, or
   `$BISE_IDLE_EXIT`: `90`, `90s`, `5m`, `1h`, `off`; default 2 min). A UI
   that comes back (a quick relaunch, a reconnect) cancels it. A hub that
   nobody opens starts alone: the grace runs from its boot.
2. after the grace, the hub waits only for its own operations: a REPL
   starting or switching, a version switch on probation (its switcher
   would read the idle exit as a crash and roll back), a `/version`
   build, `/update`, `/release-bise`. A REPL start is bounded by its
   idle limit and a probation by its end; the others have no timeout of
   their own, so all of them hold the hub at most `idle::OWN_MAX` (1 h)
   past the grace. hub.log says what it waits for, once per change.
   Past it the stop cuts them too, and names them. That is the price of
   the bound, a known path: a REPL cut mid-switch starts again at the
   next `bise` on the version the hub runs; a version switch cut on
   probation rolls back (its switcher reads the stop as a failure); a
   `/version` or `/update` build cut halfway leaves a build folder that
   is not a version, and the next `/version` or `/update` builds it
   again; `/release-bise` cut halfway stops where its script was, and
   its plan says what is left at the next run.

   The agents' work does not hold it (Gabriel's choice, #817: quitting
   the app stops the agents): an agent mid-turn (also inside `sb
   wait`), a background job of an agent's bash tool (heavy-run jobs
   included), a standing order (`sb every`). The stop cuts them and
   hub.log names the cut; main's thread gets one line that says what was
   cut. Opt-out: `idle_exit_waits = true` in `~/.bise/config.toml` (no
   env var; a test writes it in its throwaway home's config): the work
   holds the hub as before, a background job while it is at most 6 h
   old (`idle::JOB_MAX`: a forgotten dev server does not hold it
   forever). `idle_exit = "off"` still means never stop.
3. then it stops for good, the stop of `bise --stop`: the socket goes
   first (a `bise` launched meanwhile starts the next hub, which waits for
   this one's process to be gone), each REPL gets `reload` (it
   checkpoints its session and exits 0, like a version switch), the ones
   still there after 5 s get SIGTERM, then everything the agents started
   (procs.rs, docs/proc-cleanup.md): plugins bridges, MCP servers, tmux
   servers, test hubs. sb-core dies with the hub.

hub.log, in order: `idle exit: no UI left, the hub stops in 120 s`,
`idle exit: no UI, the hub waits for: a REPL starting` (only for its
own), `idle exit: no UI for 121 s: the hub stops (cut: t1 mid-turn,
t1's background job 3, 2 standing orders (sb every); all resume at the
next bise)` (or `... and nothing runs: the hub stops`), `hub stop`,
`REPLs saved and gone: 2 of 2`.

The next `bise` in the workspace starts a hub as before: the journal
brings back the agents, cards and messages, each REPL restarts on its
saved session (`BEND_CONTINUE`), the transcripts the feeds. What was
cut comes back:

- an agent cut mid-turn: still busy in the journal, its REPL starts
  with the resume (`its REPL died mid-turn, the turn resumes`); its
  session was saved before its last provider call, so at most the tool
  call in flight runs again. A stop is not a crash (stop-not-crash).
- a background job cut: its watch (the bash tool's, or `sb wake`) sees
  a slot whose process is gone with no rc on two looks in a row
  (`wake::Seen::Cut`): the agent is woken with `background 3 was cut ·
  no rc ... run it again`, never `ended` as if it finished, never left
  `running` for a day.
- a standing order: it is sb-core's state, back with the journal; one
  due while the hub was down fires once at the first tick, then keeps
  its period (no catch-up of each missed period).

## Children die with their parent

- **REPL -> hub.** A hub killed or crashed leaves its REPLs for the next
  hub to adopt. If none comes: repl-live looks at its hub every
  `BEND_HUB_GONE_MS / 10` (default every minute; `hub.pid` next to
  `$SB_SOCKET`, `kill -0`) and exits after ten looks in a row without it
  (`hub-gone-exit` in repl.log). A switch's hub is back in seconds. Its
  session is saved at each turn boundary and before each provider call.
  No `SB_SOCKET` (a bare repl-live, tests): no watch.
- **plugins bridge -> REPL.** `bise plugins serve --parent <pid>` checked
  its parent with a `kill` process every 500 ms and took a reused pid for
  its parent: bridges outlived their REPL. Now kill(2), and every 10 s the
  parent's start time must still be the one it had (`bridge::Parent`).
- **MCP servers -> bridge.** The bridge stops them when it goes; a bridge
  killed hard leaves them to the hub's reap (they carry the agent's tag).

## Standing orders (`sb every`)

They used to hold the hub up (a timer fired on time, nothing installed
in launchd). With agents waking each other and daily orders, two hubs
never stopped after his quit (Oct 27). Now a standing order fires only
while a hub runs: after a quit it fires again from the next `bise`.
Nothing in launchd, no headless relaunch.

## Tests

- `idle::tests`: the grace (env, config, `off`), `idle_exit_waits`, the
  rule (its own hold until `OWN_MAX`, the work holds only with `waits`,
  the cut names the rest), the agents' work cut at the grace, main's
  line and a job's name, a UI back cancels, a hub nobody opens stops,
  holds, background jobs.
- `wake_tests`: a background job whose process is gone with no rc on
  two looks is cut, and its wake says to run it again.
- `every_tests`: a standing order down for hours fires once, then keeps
  its period.
- `bridge::parent_tests`: a reused pid is not the parent.
- `tests/idle_exit_e2e.py` (run_all): a real hub on the fake provider,
  grace 4 s; a UI back within the grace keeps the hub; the last UI
  leaves while t1 is mid-turn with a background job and an `sb every`:
  the hub stops at the grace, names the cut, and every REPL and the job
  go; the next start has main and t1 back with their feeds, main's line,
  t1's turn resumed, t1 told its job was stopped, the standing order
  still there, and t1 answers; a hub killed -9 leaves REPLs that exit by
  themselves, and the next hub brings them back.
