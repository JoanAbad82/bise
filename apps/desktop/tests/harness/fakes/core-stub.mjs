#!/usr/bin/env node
// The scripted stand-in for `bise ambient-core` in a test run: src/main/core spawns
// `<BISE_DESKTOP_BISE> ambient-core --workspace <ws>` (or --home); the harness points
// BISE_DESKTOP_BISE at this file, so no bise, no hub, no provider runs. Arguments are ignored.
//   stdout  the start world at once, then every line a test sends to the control socket
//           (a core or hub event each: bise-proto's CoreEv | HubEv)
//   stdin   the app's requests (JSON-RPC), each appended to the log as the command it
//           carries (AppCmd | HubCmd): a test reads what the app sent ("a sent message does
//           nothing" is a send that never reaches here)
//   stdout  JSON-RPC: initialize answered, the events as notifications once initialized
// env: BISE_HARNESS_CORE_EVENTS  the start world: a JSONL file of events; unset = every fixture of
//                                rust/proto/fixtures (core_ev.jsonl then hub_ev.jsonl), 'none' = nothing
//      BISE_HARNESS_CORE_SOCK    the unix socket a test writes events to (fakes/core.ts)
//      BISE_HARNESS_CORE_LOG     the file the commands go to
// (src/main/core/env.ts drops BISE_DESKTOP_* from the core's env; BISE_HARNESS_* passes.)
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runStub } from './stub-lib.mjs';

const FIXTURES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', 'rust', 'proto', 'fixtures');
const jsonl = (file) => readFileSync(file, 'utf8').split(String.fromCharCode(10)).map((l) => l.trim()).filter(Boolean);

const world = process.env.BISE_HARNESS_CORE_EVENTS;
// The fixtures' `broken` (a core with no runtime: no hub can start) is not part of the healthy
// world: a test that wants it sends it (app/keep, app/core-line went red with its ▲ line on).
const all = world === 'none' ? []
  : world ? jsonl(world)
  : [...jsonl(path.join(FIXTURES, 'core_ev.jsonl')), ...jsonl(path.join(FIXTURES, 'hub_ev.jsonl'))].filter((l) => JSON.parse(l).ev !== 'broken');
// A restart (FakeCore.exit: the app's main spawns the stub again) sends the start world again, but
// never the hub's one-shot ask: a `confirm` goes to the connection whose command asked it, and a
// real core restart is a new connection, so it is gone (app/keep-all :166 red: the replayed
// 'archive it anyway? (y/n)' bar took the keys from Tune's half-typed model id).
const started = process.env.BISE_HARNESS_CORE_LOG ? `${process.env.BISE_HARNESS_CORE_LOG}.started` : null;
const again = started !== null && existsSync(started);
if (started !== null) writeFileSync(started, '');
// Nor his voice answer (bar N14): a `voice_answer` is what the core heard once; the real core never
// says it again after a restart, and the inbox block, still mounted, took the replayed one for a new
// answer to card 9 and dropped it (app/keep-all's ⌘I case: '2 waiting' after the restart, not 3).
const ONCE = new Set(['confirm', 'voice_answer']);
const start = again ? all.filter((l) => !ONCE.has(JSON.parse(l).ev)) : all;

// The world is written at spawn: the app's main keeps the newest state events and replays them to
// a window that loads later (amb-core 162ec18b). A thread's lines aren't state: like the real core,
// the stub sends them when the window asks (subscribe, page) and answers the per-project asks
// (diff, worktrees, dev_servers, merged, inbox_history) from the same world.
const evs = start.map((l) => JSON.parse(l));
const same = (ev, cmd) => ev.project === cmd.project && (cmd.agent === undefined || ev.agent === undefined || ev.agent === cmd.agent);
function answer(cmd) {
  const of = (kinds, more = () => true) => evs.filter((ev) => kinds.includes(ev.ev) && same(ev, cmd) && more(ev));
  switch (cmd.cmd) {
    case 'subscribe': return of(['thread', 'entry', 'typing'], (ev) => ev.ev !== 'thread' || ev.before === null || ev.before === undefined);
    case 'page': return of(['thread'], (ev) => ev.before !== null && ev.before !== undefined);
    case 'diff': return of(['diff'], (ev) => (cmd.commit ? ev.merged === cmd.commit : !ev.merged));
    case 'worktrees': case 'dev_servers': case 'merged': return of([cmd.cmd]);
    // the inbox screen's history (inbox/history): the world's page of that project; an older one
    // (before) has none
    case 'inbox_history': return cmd.before == null ? of(['inbox_history']) : [];
    // /log: the world's pages of that agent's session, the newest (no before) or the one before a seq
    case 'log': return of(['log'], (ev) => (cmd.before === undefined ? (ev.items[0]?.seq ?? 0) >= Math.max(...evs.filter((e) => e.ev === 'log' && same(e, cmd)).map((e) => e.items[0]?.seq ?? 0)) : (ev.items.at(-1)?.seq ?? 0) < cmd.before)).slice(-1);
    default: return [];
  }
}
// JSON-RPC like `ambient-core`: the HubEv tags (hub/<tag>) from the generated names
const NAMES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'src', 'proto', 'app_methods.gen.ts');
const notes = JSON.parse(/export const NOTIFICATIONS = (\[.*\]) as const;/.exec(readFileSync(NAMES, 'utf8'))[1]);
const hubEvs = notes.filter((n) => n.startsWith('hub/')).map((n) => n.slice(4));
runStub({ start, sock: process.env.BISE_HARNESS_CORE_SOCK, log: process.env.BISE_HARNESS_CORE_LOG, answer, rpc: { hubEvs } });
