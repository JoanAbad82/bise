# 39 · an agent's pkill kills every agent's gate

Status: done (task repl-kill, 2026-10-24). Plan signed by architect
(m_39955). Label: gate, tools, agents.

## What happened

On 2026-10-24 the quick gates of several agents ended with rc 143 at the
same second, five times: 17:43:57, 18:16:20, 18:37:37, 20:23:52 and
20:57:52. The victims were the processes whose command line holds
`gate.sh quick`: gate.sh, its step subshells (a bash subshell keeps its
parent's argv) and `heavy-run --land tests/gate.sh quick`. The job shell
around each one (`/bin/sh <bg>/<n>.cmd`) lived on and echoed `rc=143`.

## The cause

An agent stopped its own gate before a rebase with
`pkill -f "gate.sh quick" -P <pid>` (or `-u $(id -u)`, `-U ...`). macOS
`pkill` reads its options only before the pattern: after it, `-P <pid>`
is two more patterns, so the command TERMs every process on the Mac whose
command line matches `gate.sh quick`, whatever agent started it. Each
cluster matches one such call to the minute (`sb history "pkill gate.sh"`):
plug-connectors 17:43, plug-tui 18:16, plug-catalog 18:37, plug-bridge
20:23, head-overflow 20:57.

The proof: canaries in repl-kill's own background job, two named
`bash tests/gate.sh quick` (one with an empty environment, like a
`/bin/bash` whose environment macOS hides), a C program that logs the
sender of a signal (`si_pid`). At 20:57:52 both got SIGTERM from pid
61360, a short-lived process (head-overflow's pkill, which it reported
itself). A canary in the same process group under another name was not
hit.

Closed: "one agent's REPL exit (recycle, drop) kills other agents'
processes" is false. The REPL exits were a coincidence (agents pkill
right when they rebase, and REPLs recycle then too); a throwaway hub
with three agents, nine recycles and a drop left the other agents' jobs
alone, the drop's reap hit only the dropped agent's processes.

## The fix

- The bash tool's description (prompts/tool-desc-bash.txt): stop a
  process by the pid you started, or `tests/gate.sh stop` for a gate;
  never `pkill` or `killall` by name or pattern, with the reason.
- `tests/gate.sh stop`: TERM to the gates running in this checkout only
  (each run's folder keeps `.root`, its checkout, next to `.owner`, its
  start); each one's exit kills what its run started. A gate's first line
  names it. Pinned in tests/gate_sweep_test.py: stop of checkout A
  stops A's gate, never B's.
- tests/proc_cleanup.py: every task's REPL is recycled, and every agent's
  processes survive it (an e2e: it runs on main's tip after the land).
- Not done (architect m_39955): refusing pkill in the bash tool. A refusal
  in yolo changes what yolo means (Gabriel's call), and words are easy to
  get around. In auto, the approvals tiers already send pkill and killall
  to the checker (Risk::Processes). If pkill by pattern still turns up in
  transcripts, the question for Gabriel is: does yolo refuse
  pkill/killall by pattern, yes or no?
