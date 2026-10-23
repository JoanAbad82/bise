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
// (diff, worktrees, dev_servers, merged, processes, proc_out, inbox_history) from the same world.
const evs = start.map((l) => JSON.parse(l)).filter((ev) => ev.ev !== 'transcript');
// A world may give an agent's whole thread as one `{ev: 'transcript', project, agent, entries}` (the
// harness's own line, never sent to the app): then subscribe and page answer as the hub does,
// paged by pos (thread/subscribe: the newest `limit`, 40; thread/page: the newest `limit` before
// `before`), so a test can reach an entry pages back (inbox-open: the window around his answer).
const transcripts = start.map((l) => JSON.parse(l)).filter((ev) => ev.ev === 'transcript');
function paged(cmd) {
  const t = transcripts.find((ev) => same(ev, cmd));
  if (t === undefined) return null;
  const under = t.entries.filter((e) => cmd.before === undefined || cmd.before === null || e.pos < cmd.before);
  const n = Math.max(1, Math.min(200, cmd.limit ?? 40));
  const entries = under.slice(-n);
  const more = under.length > entries.length;
  return [{ ev: 'thread', project: cmd.project, agent: cmd.agent, entries, before: more ? (entries[0]?.pos ?? null) : null, more }];
}
const same = (ev, cmd) => ev.project === cmd.project && (cmd.agent === undefined || ev.agent === undefined || ev.agent === cmd.agent);
function answer(cmd) {
  const of = (kinds, more = () => true) => evs.filter((ev) => kinds.includes(ev.ev) && same(ev, cmd) && more(ev));
  const t = cmd.cmd === 'subscribe' || cmd.cmd === 'page' ? paged(cmd) : null;
  if (t !== null) return t;
  switch (cmd.cmd) {
    case 'subscribe': return of(['thread', 'entry', 'typing'], (ev) => ev.ev !== 'thread' || ev.before === null || ev.before === undefined);
    case 'page': return of(['thread'], (ev) => ev.before !== null && ev.before !== undefined);
    case 'diff': return of(['diff'], (ev) => (cmd.commit ? ev.merged === cmd.commit : !ev.merged));
    case 'worktrees': case 'dev_servers': case 'merged': case 'processes': return of([cmd.cmd]);
    // a process's output (the running screen's terminal): the world's ranges of that one, in order
    case 'proc_out': return of(['proc_out'], (ev) => ev.id === cmd.id);
    // an @ query (at-chips): the world's newest `files` list of that project, whatever the query,
    // answered with the ask's own rid and query
    case 'files': return of(['files']).slice(-1).map((ev) => ({ ...ev, q: cmd.q, rid: cmd.rid }));
    // the inbox screen's history (inbox/history): the world's page of that project; an older one
    // (before) has none
    case 'inbox_history': return cmd.before == null ? of(['inbox_history']) : [];
    // /debug history: the world's pages of that agent's session, the newest (no before) or the one
    // before a pos; a find: the pos of every row of every page that holds it (any case), no rows
    case 'log': {
      if (cmd.find !== undefined) {
        const n = String(cmd.find).toLowerCase();
        const rows = of(['log']).flatMap((ev) => ev.items);
        const has = (it) => [it.head, it.rule ?? '', it.meta ?? '', it.body?.text ?? ''].join('\n').toLowerCase().includes(n);
        const hits = [...new Set(rows.filter(has).map((it) => it.pos))].sort((a, b) => a - b);
        return [{ ev: 'log', project: cmd.project, agent: cmd.agent, items: [], more: false, hits }];
      }
      const newest = Math.max(...of(['log']).map((e) => e.items[0]?.pos ?? 0));
      return of(['log'], (ev) => (cmd.before === undefined ? (ev.items[0]?.pos ?? 0) >= newest : (ev.items.at(-1)?.pos ?? 0) < cmd.before)).slice(-1);
    }
    // /debug completion: the world's request in that slot, else its newest; raw: the world's raw
    // one when it has it
    case 'completion': {
      const all = of(['completion'], (ev) => (cmd.slot === undefined || ev.slot.slot === cmd.slot) && (ev.raw === true) === (cmd.raw === true));
      return [...all].sort((a, b) => a.slot.req - b.slot.req).slice(-1).map((ev) => Object.fromEntries(Object.entries(ev).filter(([k]) => k !== 'raw')));
    }
    default: return [];
  }
}
// The real core lists a held hub's cards in its `projects` rows in the same beat it forwards that
// hub's `cards` (core/hubs.rs project_ev: emit_projects after 'cards'; his cards and bise's own by
// id, inbox_cards); the window reads the rows only (inbox-sync). So does the stub: a start row that
// says nothing of its cards gets its hub's from the start world (a row that lists them keeps what
// the test wrote), and a `cards` line a test sends later is followed by the rows it changes.
// One card per id, his first (a hub's ids are its own; the fixtures' hub_ev reuses #11 in `others`).
const cardsOf = (ev) => {
  const all = [...ev.cards, ...(ev.others ?? [])];
  return all.filter((c, i) => all.findIndex((x) => x.id === c.id) === i).sort((a, b) => a.id - b.id);
};
const withCards = (list, byProject, onlyUnsaid = false) =>
  list.map((r) => (byProject.has(r.project) && !(onlyUnsaid && r.cards !== undefined) ? { ...r, cards: byProject.get(r.project), waits: byProject.get(r.project).length } : r));
const held = new Map(evs.filter((ev) => ev.ev === 'cards' && typeof ev.project === 'string' && Array.isArray(ev.cards)).map((ev) => [ev.project, cardsOf(ev)]));
const startLines = start
  .filter((l) => JSON.parse(l).ev !== 'transcript')
  .map((l) => {
    const ev = JSON.parse(l);
    return ev.ev === 'projects' && Array.isArray(ev.projects) && held.size > 0 ? JSON.stringify({ ...ev, projects: withCards(ev.projects, held, true) }) : l;
  });
let rows = null;
let seen = 0;
function follow(line) {
  seen += 1;
  let ev;
  try { ev = JSON.parse(line); } catch { return []; }
  if (ev?.ev === 'projects' && Array.isArray(ev.projects)) {
    rows = ev.projects;
    return [];
  }
  // the start world's own cards are in its rows already
  if (seen <= startLines.length) return [];
  if (ev?.ev !== 'cards' || typeof ev.project !== 'string' || !Array.isArray(ev.cards) || rows === null) return [];
  if (!rows.some((r) => r.project === ev.project)) return [];
  const next = withCards(rows, new Map([[ev.project, cardsOf(ev)]]));
  if (JSON.stringify(next) === JSON.stringify(rows)) return [];
  rows = next;
  return [JSON.stringify({ ev: 'projects', projects: rows })];
}

// JSON-RPC like `ambient-core`: the HubEv tags (hub/<tag>) from the generated names
const NAMES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'src', 'proto', 'app_methods.gen.ts');
const notes = JSON.parse(/export const NOTIFICATIONS = (\[.*\]) as const;/.exec(readFileSync(NAMES, 'utf8'))[1]);
const hubEvs = notes.filter((n) => n.startsWith('hub/')).map((n) => n.slice(4));
runStub({ start: startLines, sock: process.env.BISE_HARNESS_CORE_SOCK, log: process.env.BISE_HARNESS_CORE_LOG, answer, rpc: { hubEvs }, follow });
