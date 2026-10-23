# Running processes

What the agents left running (a dev server, a watcher, a backgrounded bash
job, a server a script detached with nohup), per agent and per project, with
the ones that ended in the last 24 h: their output, their URL when they
listen, his stop. Gabriel's ask on page enjoy-inspi; the look is page
running-procs. The desktop merges every held hub's list (all of bise); the
TUI shows its project's (`/running`).

## The rows (`bise_proto::rows::Proc`)

One row per process tree: `id` (`bg3.<start s>` for an agent's bg job 3,
`p<pid>.<start s>` for a detached tree), `agent`, `kind` (`bg {n}` or
`detached`), `cmd`, `cwd`, `pid` (the root; a bg job's process group),
`started_ms`, `ports` and `url` (`http://127.0.0.1:<first port>`), `name`
(a known server command), `state` (`running`, `exited {rc?}`,
`stopped_by_you`, `stopped_with`), `ended_ms`, the tree's `cpu`, `rss_mb`,
`procs`, and `out` (`bg`, `file`, `none`). Each agent row carries `procs`
(its running count) and `procs_port` (their lowest port).

The wire: `processes {watch?}` -> `processes` (also `hub/processes` to every
connection when a row comes, goes or changes, and every 2 s while one
watches); `proc_out {agent, id, from?}` -> `proc_out {at, data (base64),
end}` (64 KB at most; no `from`: the last 64 KB); `proc_follow {agent, id,
on}` -> `proc_out` notifications to that connection as the output grows
(every 200 ms, from the end of its last `proc_out`, so no gap); `proc_stop
{agent, id | all}`. The app never gets a path. `dev_servers` is retired: an
older desktop's `devServers/list` gets an empty list (shim `dev-servers`).

## Who's in

Every process of a live agent (`procs::select`: its `BISE_OWNERS` tag or its
REPL's session, docs/proc-cleanup.md), grouped in trees:

- a bg job: its slot's process group (`bg/<n>.pid`) and what that started;
- any other process of the agent outside its REPL's tree: a detached tree,
  by root.

Not listed: the REPL and what runs under it (the turn's own command, which
the thread shows; MCP servers, the sandbox), bise's own job runner and its
watch loop, the user's processes, the hub. Every bash command runs in a
slot: one still under its REPL's wrapper is the turn's, not a bg job yet.

## Who owns it

`rust/switchboard/src/daemon/processes.rs`: one worker thread, never the
loop. It scans (`ps -axE` through the peer table plus one `ps -o` for
groups, starts, cpu, memory and command lines; `lsof` for ports, a root's
folder and its stdout), keeps the last running rows and the caches (by pid
and start), and is the only writer of `<hub>/procs/ended.jsonl` and
`<hub>/procs/<agent>-<id>.out`. The pure part (parsing, trees, rows, the
ended diff, caps, prune, the stop's check) is
`proto_view/processes.rs`, with its unit tests. Nothing goes to the journal
or sb-core: it is an observation; a reload finds the running ones again
(tags and bg files survive) and reads the ended log back.

Scans: every 60 s ps only (so an end is kept with no client), every 15 s
while a typed client is connected, every 2 s with ports while one watches.
Ports are asked once per new pid (all of them while watched); without lsof
there are none (Linux's /proc/net/tcp is not read).

## How a row ends

| state | when |
|---|---|
| `exited {rc}` | it ended by itself; `rc` from the bg slot's `.rc` while it is there (none: a detached one, or a slot the agent cleaned first) |
| `stopped_by_you` | his `proc_stop` |
| `stopped_with` | proc-cleanup killed it with its agent (stop, drop, the hub quitting): the loop sends `Reaping` to the worker before the kill, and the channel keeps the order |

At the end the worker copies its output (the bg `.out`, or the detached
one's stdout file) to `<hub>/procs/<agent>-<id>.out`: its last 2,000 lines,
256 KB at most. Rows and copies go after 24 h.

## His stop

His only (a client's command, never an agent's, issue 16). The worker
marks the row, then on a thread: the same pid and start or nothing; a bg
job gets `[bise: stopped by you from the processes list]` at the end of its
`.out`, then TERM to its group; a detached tree TERM to each process; KILL
to what is left after `procs::STOP_GRACE` (5 s, the same as proc-cleanup's).
Then bise's queued message to the agent (`Input::HubMsg`, sb-core's
IHubMsg, as land's unheard): `[bise] he stopped <cmd> (<id>) from the
processes list`. Queued: it does not wake the agent.

## Tests

Unit tests: `proto_view/processes_tests.rs` (trees, kinds, rows, ps and
lsof parse, the ended diff, prune, caps, the stop's same-start check) and
`daemon/processes_tests.rs` (a throwaway hub folder: a bg slot's files, the
ended log across a reload, the reap's order, his stop's state, output
ranges and follow). The end-to-end (a throwaway hub: a bg
`python3 -m http.server` and a nohup'd one listed with their ports, the
output read, the stop, the agent's queued message, the ended row) runs in
run_all on main's tip.
