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

const rank: Record<Status, number> = { blocked: 0, waiting: 0, failed: 1, working: 2, done: 3, idle: 4 };

/**
 * The live list: main first, then what needs him (cards, blocked, failed),
 * then at work, done, at rest; within a group the newest change first.
 * Archived agents are not in it (`archivedOf`).
 */
export function liveOf(agents: readonly Agent[]): Agent[] {
  return agents
    .filter((a) => !a.archived)
    .sort((a, b) => {
      if (a.main !== b.main) return a.main ? -1 : 1;
      const ra = a.waits > 0 ? -1 : rank[a.status];
      const rb = b.waits > 0 ? -1 : rank[b.status];
      return ra - rb || b.since_ms - a.since_ms || a.name.localeCompare(b.name);
    });
}

/** The archived ones, newest first (/archived). */
export function archivedOf(agents: readonly Agent[]): Agent[] {
  return agents.filter((a) => a.archived).sort((a, b) => b.since_ms - a.since_ms || a.name.localeCompare(b.name));
}

/** One line of what it does: its title, else its purpose. */
export function lineOf(a: Agent): string {
  return a.title !== '' ? a.title : a.purpose;
}
