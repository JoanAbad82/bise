// The agents list's words and order (bar A.2: the same agents and
// statuses as the TUI's panel, live). Owner: amb-win. Pure: the list
// component reads the store's agents and draws these.
import type { Agent, Status } from '@/proto';
import type { DotState } from '@/ds';

/** A status as the ds's dot: at work, needs him, done, failed, at rest. */
export function dotOf(s: Status): DotState {
  switch (s) {
    case 'working':
      return 'wk';
    case 'waiting':
    case 'blocked':
      return 'nd';
    case 'done':
      return 'ok';
    case 'failed':
      return 'er';
    case 'idle':
      return 'off';
  }
}

/** How long ago, short: "now", "4 min", "2 h", "3d". */
export function ago(ms: number, now: number): string {
  const s = Math.max(0, Math.floor((now - ms) / 1000));
  if (s < 60) return 'now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)}d`;
}

/** A row's end: what waits on him first (accent), else its state or age. */
export function endOf(a: Agent, now: number): { text: string; needs: boolean } {
  if (a.waits > 0) return { text: String(a.waits), needs: true };
  switch (a.status) {
    case 'working':
      return { text: ago(a.since_ms, now), needs: false };
    case 'waiting':
    case 'blocked':
      return { text: a.status, needs: true };
    case 'done':
      return { text: 'done', needs: false };
    case 'failed':
      return { text: 'failed', needs: true };
    case 'idle':
      return { text: ago(a.since_ms, now), needs: false };
  }
}

/**
 * The live list in the TUI's panel order (qa-flows 5ee10a00): main first,
 * then the hub's order, which is start order; a status never moves a row
 * (the dot and the end say what needs him). Archived agents are not in it
 * (`archivedOf`).
 */
export function liveOf(agents: readonly Agent[]): Agent[] {
  return agents.filter((a) => !a.archived && a.main).concat(agents.filter((a) => !a.archived && !a.main));
}

/** An agent's ⌥ number: main 0, the others from 1. */
export type Slots = ReadonlyMap<string, number>;

/**
 * The TUI's numbers (sb/panel.rs assign): `slots` brought up to date with
 * the `live` agents in panel order; a gone agent frees its number, one that
 * stays keeps it (an archive never renumbers the others), a newcomer takes
 * the smallest free number from 1, main is 0. Pure.
 */
export function assign(slots: Slots, live: readonly Agent[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const [name, n] of slots) {
    if (live.some((a) => a.name === name && a.main === (n === 0))) out.set(name, n);
  }
  const used = new Set(out.values());
  for (const a of live) {
    if (out.has(a.name)) continue;
    let n = 0;
    if (!a.main) {
      n = 1;
      while (used.has(n)) n += 1;
    }
    used.add(n);
    out.set(a.name, n);
  }
  return out;
}

const kept = new Map<string, Map<string, number>>();

/**
 * The project's ⌥ numbers now, kept for the window's life as the TUI keeps
 * them for its session: the sidebar shows them, ⌥1-9 reads them.
 */
export function numbersOf(project: string, agents: readonly Agent[]): ReadonlyMap<string, number> {
  const next = assign(kept.get(project) ?? new Map(), liveOf(agents));
  kept.set(project, next);
  return next;
}

/** The archived ones, newest first (/archived). */
export function archivedOf(agents: readonly Agent[]): Agent[] {
  return agents.filter((a) => a.archived).sort((a, b) => b.since_ms - a.since_ms || a.name.localeCompare(b.name));
}

/** One line of what it does: its title, else its purpose. */
export function lineOf(a: Agent): string {
  return a.title !== '' ? a.title : a.purpose;
}
