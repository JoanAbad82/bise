// les bims' fake rows (tests and the headless harness only, never the app's runtime): one office
// whose agents cover every ActivityKind of model.ts, the row builders the other chunks' tests use
// (layout, paths, timeline, labels, render, qa), and a crowd for the 3-column layout. Every row is a
// real proto row (rows.ts), only the fields the spec's [a] lines read are set past the required ones.
import type { Agent, Card, Place } from '@/proto';
import type { Activity, ActivityKind, BimFrame, Segment, Snapshot, Spot } from './model';

/** the fixtures' wall clock (ms): a row's `since_ms` is a minute before it */
export const NOW_MS = 1_791_100_000_000;
const MIN_MS = 60_000;

/** an agent row: idle, not main, nothing waiting; `over` sets the rest */
export function agent(name: string, over: Partial<Agent> = {}): Agent {
  return {
    name,
    main: false,
    status: 'idle',
    phase: null,
    archived: false,
    title: '',
    purpose: `${name}'s job`,
    since_ms: NOW_MS - MIN_MS,
    waits: 0,
    dir: name,
    watching: [],
    waiting_on: null,
    turn_ms: null,
    place_id: `wt:${name}`,
    ...over,
  };
}

/** main's row: the big desk, the shared checkout */
export function mainAgent(over: Partial<Agent> = {}): Agent {
  return agent('main', { main: true, place_id: '', ...over });
}

/** an open card from `agentName` (a question unless `over` says otherwise) */
export function card(id: number, agentName: string, over: Partial<Card> = {}): Card {
  return {
    id,
    project: 'shop',
    kind: 'question',
    agent: agentName,
    question: `${agentName} asks`,
    options: [],
    urgent: false,
    since_ms: NOW_MS - MIN_MS,
    ...over,
  };
}

/** a place in the land queue at `rank` (1: it lands now), its one agent */
export function landing(agentName: string, rank: number): Place {
  return { id: `wt:${agentName}`, branch: `sb/${agentName}`, agents: [agentName], landing: rank };
}

/** a watch the agent waits on (a backgrounded command by default) */
export function watch(what: string, kind: 'bg' | 'pid' | 'file' | 'job' | 'reply' = 'bg') {
  return { id: what.length, kind, what, since_ms: NOW_MS - MIN_MS, resumes: kind === 'bg' };
}

/**
 * The office: one agent per row of the spec's §4 [a] lines, in start order. `office.agents[i]`
 * takes the activity `EXPECT[name]` at any t (an idle one: nap or snack, by time).
 */
export const office: Snapshot = {
  agents: [
    mainAgent({ status: 'working', title: 'routing your requests', turn_ms: 40_000 }),
    agent('signup-perf', { status: 'working', title: 'signup 4.1 s to 0.9 s', turn_ms: 2 * MIN_MS }),
    agent('dark-mode', { status: 'working', title: 'tokens for the dark theme', turn_ms: 25 * MIN_MS }),
    agent('login-test', { status: 'waiting', title: 'waits for cargo test', watching: [watch('cargo test')] }),
    agent('nightly', { status: 'idle', title: 'if the nightly gate goes red', watching: [watch('gate.rc', 'file')] }),
    agent('pricing-page', { status: 'waiting', title: "waits for perf's numbers", waiting_on: { who: 'agent', name: 'signup-perf' } }),
    agent('empty-state', { status: 'idle', title: 'empty inbox shipped' }),
    agent('onboarding', { status: 'waiting', title: 'which welcome copy?', waits: 1, waiting_on: { who: 'you' } }),
    agent('deploy', { status: 'working', title: 'run the deploy?', waits: 1, waiting_on: { who: 'you' }, turn_ms: 3 * MIN_MS }),
    agent('cookie-banner', { status: 'blocked', title: 'no access to the CMS' }),
    agent('search-index', { status: 'failed', title: 'out of disk on the index build' }),
    agent('changelog', { status: 'working', title: 'landing', turn_ms: MIN_MS }),
    agent('release', { status: 'idle', title: 'waits to land · 2nd' }),
    agent('copy-fix', { status: 'done', title: 'landed: the footer copy' }),
    agent('import', { status: 'done', phase: 'stopped', title: 'stopped' }),
    agent('analytics', { status: 'working', phase: 'starting', title: 'starting' }),
  ],
  cards: [card(41, 'onboarding'), card(42, 'deploy', { kind: 'confirm', urgent: true, approval: true })],
  places: [landing('changelog', 1), landing('release', 2)],
};

/** what each office agent maps to (activity.ts); main idle is `mainIdle` below */
export const EXPECT: Readonly<Record<string, ActivityKind | 'nap|snack'>> = {
  main: 'main',
  'signup-perf': 'work',
  'dark-mode': 'hot',
  'login-test': 'sleep',
  nightly: 'sleep',
  'pricing-page': 'waitagent',
  'empty-state': 'nap|snack',
  onboarding: 'asks',
  deploy: 'asks',
  'cookie-banner': 'blocked',
  'search-index': 'failed',
  changelog: 'landing',
  release: 'landing',
  'copy-fix': 'done',
  import: 'stopped',
  analytics: 'starting',
};

/** the office with main idle (reads the paper: 'mainidle') */
export const mainIdle: Snapshot = {
  ...office,
  agents: office.agents.map((a) => (a.main ? { ...a, status: 'idle' as const, turn_ms: null } : a)),
};

/** `n` working agents and main (n > 16: the layout's 3 columns, n > 30: the office scrolls) */
export function crowd(n: number): Snapshot {
  const agents = [mainAgent({ status: 'working' })];
  for (let i = 1; i <= n; i++) agents.push(agent(`agent-${String(i)}`, { status: 'working', turn_ms: MIN_MS }));
  return { agents, cards: [], places: [] };
}

const SPOT: Spot = { x: 0, z: 0, wz: 0, ax: 0, face: 0 };

/**
 * A bim's frame without an office: its segment started at `t` with `act`, after `from` (null: its
 * first), standing at the origin unless `moving` (labels' tests; the real ones come from timeline.ts).
 */
export function frame(
  name: string,
  act: Activity,
  o: { t?: number; from?: ActivityKind | null; moving?: boolean; main?: boolean; now?: number } = {},
): BimFrame {
  const t = o.t ?? 0;
  const seg: Segment = { t, act, sig: act.k, spot: SPOT, path: { pts: [SPOT], seg: [], len: 0 }, speed: 2.4, from: o.from ?? null };
  return { name, main: o.main ?? false, pose: { x: 0, z: 0, dir: 0, moving: o.moving ?? false, since: (o.now ?? t) - t, seg } };
}

/** a snapshot with these agents and nothing else (cards and places empty unless given) */
export function snap(agents: readonly Agent[], cards: readonly Card[] = [], places: readonly Place[] = []): Snapshot {
  return { agents, cards, places };
}
