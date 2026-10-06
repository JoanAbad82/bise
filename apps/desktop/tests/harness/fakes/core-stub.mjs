#!/usr/bin/env node
// The scripted stand-in for `bise ambient-core` in a test run: src/main/core spawns
// `<BISE_DESKTOP_BISE> ambient-core --workspace <ws>` (or --home); the harness points
// BISE_DESKTOP_BISE at this file, so no bise, no hub, no provider runs. Arguments are ignored.
//   stdout  the start world at once, then every line a test sends to the control socket
//           (a core or hub event each: bise-proto's CoreEv | HubEv)
//   stdin   the app's commands (AppCmd | HubCmd), appended to the log: a test reads what the app
//           sent ("a sent message does nothing" is a send that never reaches here)
// env: BISE_HARNESS_CORE_EVENTS  the start world: a JSONL file of events; unset = every fixture of
//                                rust/proto/fixtures (core_ev.jsonl then hub_ev.jsonl), 'none' = nothing
//      BISE_HARNESS_CORE_SOCK    the unix socket a test writes events to (fakes/core.ts)
//      BISE_HARNESS_CORE_LOG     the file the commands go to
// (src/main/core/env.ts drops BISE_DESKTOP_* from the core's env; BISE_HARNESS_* passes.)
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runStub } from './stub-lib.mjs';

const FIXTURES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', 'rust', 'proto', 'fixtures');
const jsonl = (file) => readFileSync(file, 'utf8').split(String.fromCharCode(10)).map((l) => l.trim()).filter(Boolean);

const world = process.env.BISE_HARNESS_CORE_EVENTS;
const start = world === 'none' ? []
  : world ? jsonl(world)
  : [...jsonl(path.join(FIXTURES, 'core_ev.jsonl')), ...jsonl(path.join(FIXTURES, 'hub_ev.jsonl'))];

// The world is written at spawn: the app's main keeps the newest state events and replays them to
// a window that loads later (amb-core 162ec18b). A thread's lines aren't state: like the real core,
// the stub sends them when the window asks (subscribe, page) and answers the per-project asks
// (diff, worktrees, dev_servers, merged) from the same world.
const evs = start.map((l) => JSON.parse(l));
const same = (ev, cmd) => ev.project === cmd.project && (cmd.agent === undefined || ev.agent === undefined || ev.agent === cmd.agent);
function answer(cmd) {
  const of = (kinds, more = () => true) => evs.filter((ev) => kinds.includes(ev.ev) && same(ev, cmd) && more(ev));
  switch (cmd.cmd) {
    case 'subscribe': return of(['thread', 'entry', 'typing'], (ev) => ev.ev !== 'thread' || ev.before === null || ev.before === undefined);
    case 'page': return of(['thread'], (ev) => ev.before !== null && ev.before !== undefined);
    case 'diff': return of(['diff'], (ev) => (cmd.commit ? ev.merged === cmd.commit : !ev.merged));
    case 'worktrees': case 'dev_servers': case 'merged': return of([cmd.cmd]);
    default: return [];
  }
}
runStub({ start, sock: process.env.BISE_HARNESS_CORE_SOCK, log: process.env.BISE_HARNESS_CORE_LOG, answer });
