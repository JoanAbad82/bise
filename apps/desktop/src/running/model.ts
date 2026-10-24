// The processes his agents leave running (designer's running-procs, procs-lead's brief B): the
// rows' words, the screen's groups and filters, the output's head. Pure: the screen, the right
// bar's RUNNING section and the Environments screen read these. The rows are the hubs'
// rows::Proc (HubEv processes {project, items}); what he stopped from this window shows
// 'stopping…' until its hub's row says it ended. Owner: procs-desktop.
import type { Proc } from '@/proto';
import { running } from '@/proto/words_running.gen';
import { shortAge } from '@/agents/model';

export type { Proc };

/** A process with its project (the event is per project). */
export interface ProcItem {
  readonly project: string;
  readonly projectName: string;
  readonly p: Proc;
}

/** A row's state, one shape whatever the wire's. */
export type St =
  | { readonly k: 'running' }
  | { readonly k: 'stopping' }
  /** `rc` null: its code isn't known (a detached one, a bg slot cleaned before the scan saw it) */
  | { readonly k: 'exited'; readonly rc: number | null; readonly at: number | null }
  | { readonly k: 'by_you'; readonly at: number }
  | { readonly k: 'with'; readonly at: number };

/** Its state; `stopping`: he stopped it here and its hub still lists it running. */
export function stateOf(p: Proc, stopping = false): St {
  const s = p.state;
  const at = p.ended_ms ?? p.started_ms;
  switch (s.is) {
    case 'running':
      return stopping ? { k: 'stopping' } : { k: 'running' };
    case 'exited':
      return { k: 'exited', rc: s.rc ?? null, at: p.ended_ms ?? null };
    case 'stopped_by_you':
      return { k: 'by_you', at };
    // a state this window doesn't know (a newer hub): ended, as stopped with its agent says least
    case 'stopped_with':
    case 'unknown':
      return { k: 'with', at };
  }
}

export const isRunning = (p: Proc): boolean => p.state.is === 'running';
const portsOf = (p: Proc): readonly number[] => p.ports ?? [];

/** A process's key across projects: `project/agent/id`. */
export const keyOf = (x: ProcItem): string => `${x.project}/${x.p.agent}/${x.p.id}`;

/** When it ended (ms), for 'ended today' newest first; a running one: none. */
export function endedAt(p: Proc): number | null {
  const s = stateOf(p);
  if (s.k === 'by_you' || s.k === 'with') return s.at;
  if (s.k === 'exited') return s.at;
  return null;
}

const pad = (n: number) => String(n).padStart(2, '0');
/** '13:52' in the window's time zone. */
export const hm = (ms: number): string => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** A row's mark: '∿' dim while it runs (and stops), '✓' rc 0, '✗' (the only red) another rc, '–' stopped. */
export function markOf(s: St): { readonly glyph: string; readonly tone: 'dim' | 'ink' | 'err' } {
  switch (s.k) {
    case 'running':
    case 'stopping':
      return { glyph: '∿', tone: 'dim' };
    case 'exited':
      // its code unknown: it ended, nothing says it failed (never a red ✗)
      if (s.rc === null) return { glyph: '–', tone: 'dim' };
      return s.rc === 0 ? { glyph: '✓', tone: 'ink' } : { glyph: '✗', tone: 'err' };
    case 'by_you':
    case 'with':
      return { glyph: '–', tone: 'dim' };
  }
}

/** A row's right end: its age while it runs, else how it ended ('stopped by you · 10:12'). */
export function endWords(p: Proc, s: St, now: number): string {
  switch (s.k) {
    case 'running':
      return shortAge(now - p.started_ms);
    case 'stopping':
      return running.stopping;
    case 'exited': {
      const ago = shortAge(now - (s.at ?? now));
      return s.rc === 0 || s.rc === null ? running.ended_ago({ ago }) : `${running.ended_ago({ ago })} · ${running.exit_rc({ rc: s.rc })}`;
    }
    case 'by_you':
      return running.stopped_by_you_at({ at: hm(s.at) });
    case 'with':
      return running.stopped_with({ agent: p.agent });
  }
}

/** Its address while it listens: 'localhost:5173 ↗' (opens 127.0.0.1); none when it doesn't or ended. */
export function urlWords(p: Proc, s: St): { readonly label: string; readonly url: string } | null {
  if (s.k !== 'running' && s.k !== 'stopping') return null;
  const port = portsOf(p)[0];
  if (port === undefined) return null;
  return { label: `localhost:${String(port)} ↗`, url: p.url ?? `http://127.0.0.1:${String(port)}` };
}

/** A folder as the tip says it: '~/…/worktrees/perf' (home as ~, the last two folders). */
export function shortCwd(path: string, home?: string): string {
  if (path === '') return '';
  const homeOf = home ?? /^\/Users\/[^/]+|^\/home\/[^/]+/.exec(path)?.[0];
  const rel = homeOf !== undefined && (path === homeOf || path.startsWith(`${homeOf}/`)) ? `~${path.slice(homeOf.length)}` : path;
  const parts = rel.split('/').filter((x, i) => x !== '' || i === 0);
  if (parts.length <= 3) return parts.join('/') || '/';
  return `${parts[0] ?? ''}/…/${parts.slice(-2).join('/')}`;
}

/** The row's tip: 'bg3 · started 13:52 · ~/…/worktrees/perf'; a detached one says it was started outside its agent's commands. */
export function tipOf(p: Proc, home?: string): string {
  // its short name: the agent's bg job number ('bg3'), a detached one's pid; the row's id also carries its start
  const id = p.kind.is === 'bg' ? `bg${String(p.kind.n)}` : `p${String(p.pid)}`;
  const at = hm(p.started_ms);
  const head = p.cwd != null && p.cwd !== '' ? running.tip({ id, at, cwd: shortCwd(p.cwd, home) }) : running.tip_no_cwd({ id, at });
  return p.kind.is === 'detached' ? `${head}\n${running.tip_detached({ agent: p.agent })}` : head;
}

/** The output's meta line, in order: state and age, its address, pid, cpu and memory, its folder. */
export function metaOf(p: Proc, s: St, now: number, home?: string): readonly string[] {
  const st = s.k === 'running' ? `∿ ${running.state_running} · ${shortAge(now - p.started_ms)}` : `${markOf(s).glyph} ${endWords(p, s, now)}`;
  const url = urlWords(p, s);
  const live = s.k === 'running' || s.k === 'stopping';
  return [
    st,
    url === null ? '' : url.label.replace(/ ↗$/u, ''),
    running.pid_of({ pid: p.pid }),
    live ? running.usage({ cpu: Math.round(p.cpu), mb: p.rss_mb }) : '',
    p.cwd != null && p.cwd !== '' ? shortCwd(p.cwd, home) : '',
  ].filter((x) => x !== '');
}

export type Filter = 'running' | 'ended';

/** One agent's processes under its project's head ('storefront › perf'). */
export interface Group {
  readonly key: string;
  readonly project: string;
  readonly projectName: string;
  readonly agent: string;
  readonly items: readonly ProcItem[];
}

/**
 * The screen's list: the filter's rows grouped project > agent, projects and agents in the order
 * they come (his sidebar's), running ones oldest first, ended ones newest first. `kept`: rows that
 * ended (or he stopped) while the screen is open stay in 'running' where they were (designer
 * m_38389: nothing jumps under his pointer).
 */
export function groupsOf(items: readonly ProcItem[], filter: Filter, kept: ReadonlySet<string> = new Set()): Group[] {
  const shown = items.filter((x) => (filter === 'running' ? isRunning(x.p) || kept.has(keyOf(x)) : !isRunning(x.p)));
  const order = filter === 'running' ? (a: ProcItem, b: ProcItem) => a.p.started_ms - b.p.started_ms : (a: ProcItem, b: ProcItem) => (endedAt(b.p) ?? 0) - (endedAt(a.p) ?? 0);
  const groups = new Map<string, { project: string; projectName: string; agent: string; items: ProcItem[] }>();
  for (const x of shown) {
    const k = `${x.project}/${x.p.agent}`;
    const g = groups.get(k) ?? { project: x.project, projectName: x.projectName, agent: x.p.agent, items: [] };
    g.items.push(x);
    groups.set(k, g);
  }
  return [...groups.entries()].map(([key, g]) => ({ key, ...g, items: [...g.items].sort(order) }));
}

/** The filters' counts: what runs, what ended. */
export function countsOf(items: readonly ProcItem[]): { readonly running: number; readonly ended: number; readonly projects: number; readonly listening: number } {
  const live = items.filter((x) => isRunning(x.p));
  return {
    running: live.length,
    ended: items.length - live.length,
    projects: new Set(live.map((x) => x.project)).size,
    listening: live.filter((x) => portsOf(x.p).length > 0).length,
  };
}

/** His search: the command, the agent, the project's name or a port. */
export function matches(x: ProcItem, q: string): boolean {
  const w = q.trim().toLowerCase();
  if (w === '') return true;
  return [x.p.cmd, x.p.agent, x.projectName, x.p.name ?? '', ...portsOf(x.p).map(String)].some((s) => s.toLowerCase().includes(w));
}

/**
 * The right bar's RUNNING rows, scoped like the bar: an agent's thread, that agent's; main, the
 * project's; running ones only, oldest first.
 */
export function barProcs(items: readonly ProcItem[], project: string, agent: string | null): ProcItem[] {
  return items
    .filter((x) => x.project === project && isRunning(x.p) && (agent === null || x.p.agent === agent))
    .sort((a, b) => a.p.started_ms - b.p.started_ms);
}

/**
 * The screen's list in the bar's scope ('all ›', designer m_38642): a project's, an agent's in it;
 * none: every project's. Running and ended alike: the screen's filters split them. Pure.
 */
export function inScope(items: readonly ProcItem[], scope: { readonly project: string; readonly agent?: string } | undefined): readonly ProcItem[] {
  if (scope === undefined) return items;
  return items.filter((x) => x.project === scope.project && (scope.agent === undefined || x.p.agent === scope.agent));
}

/** The bar's row command, short: its first two words past a package runner ('pnpm dev', 'playwright test --ui'). */
export function shortCmd(cmd: string): string {
  const w = cmd.trim().split(/\s+/u);
  const runner = ['pnpm', 'npx', 'npm', 'yarn'].includes(w[0] ?? '') && w[1] === 'exec' ? 2 : 0;
  return w.slice(runner, runner + 3).join(' ');
}

/**
 * The process a thread's '$' call left running: its agent's bg job whose command is the call's
 * source (the bg slot's .cmd is the command as the agent ran it), the running one first, else the
 * latest. Never a phrase read in the call's output. None: it ended its own way, or isn't a bg job.
 */
export function procOfCall(procs: readonly Proc[], agent: string, code: string): Proc | null {
  const c = code.trim();
  if (c === '') return null;
  const same = procs.filter((p) => p.agent === agent && p.kind.is === 'bg' && p.cmd.trim() === c);
  const pick = (xs: readonly Proc[]) => [...xs].sort((a, b) => b.started_ms - a.started_ms)[0] ?? null;
  return pick(same.filter(isRunning)) ?? pick(same);
}
