# 34 · a reused name keeps a few old traces

Status: accepted limits of name-free (architect m_31494, m_31497), not
planned. Label: hub. Brief: task name-free.

## What name-free does

An archived agent's name and an old name (an alias) no longer hold the name
forever. A take (a new task, a rename) frees it in sb-core
(bend/hub/take.bend): an archived holder is renamed `<name>-2` and keeps its
folder (Agent.dir); a live holder (renamed from the name) keeps what still
says it: pages and artifacts (fx retarget), open cards, timers, watches, and
its queued messages and owed replies (journal `msgs_moved`, same ids, laws
take_moves_live_queued, take_moves_live_owed, msgs_moved_replays). An
archived holder's queued messages are refused and its owed replies settled.

## The limits

- **card_links**: a card closed and opened again under its holder's name
  gets a new id; its card_links.json link (to the page or thread it came
  from) stays on the old id, so the new card has no link.
- **history keeps the bare name**: `sb inspect` and a cold message (St.old)
  keep the name `n` as written then. After the take, an old line "to @n"
  means the agent that held `n` then, which may not be today's `@n`.
- **rollback, folders**: an older sb-core replaying a journal with a reused
  name puts the new `x` in folder `x` (it knows no `free_dir`), so after a
  /version rollback its transcript shares agents/x with `x-2`.
- **rollback, moved messages**: an older sb-core skips `msgs_moved`, so after
  a rollback those messages are addressed to `n` again, which in that core is
  the NEW agent. Rare: a rollback, a live alias holder and queued or owed
  messages at the take, all three.

The two rollback limits go in the release notes.
