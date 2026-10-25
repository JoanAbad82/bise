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

/** A row's mark's tip: 'running', 'ended, exit 1', 'stopped by you · 10:12' (designer m_41694 #6). */
export function markTip(p: Proc, s: St, now: number): string {
  switch (s.k) {
    case 'running':
      return running.state_running;
    case 'exited':
      return s.rc === null ? running.mark_ended : running.mark_exit({ rc: s.rc });
    default:
      return endWords(p, s, now);
  }
}

const MIN = 60_000;

/** A row's right end: its age while it runs, else how it ended ('stopped by you · 10:12'). */
export function endWords(p: Proc, s: St, now: number): string {
  switch (s.k) {
    case 'running':
      return shortAge(now - p.started_ms);
    case 'stopping':
      return running.stopping;
    case 'exited': {
      // under a minute: 'ended just now', never 'ended now ago' (designer m_41694 #8)
      const ended = now - (s.at ?? now) < MIN ? running.ended_now : running.ended_ago({ ago: shortAge(now - (s.at ?? now)) });
      return s.rc === 0 || s.rc === null ? ended : `${ended} · ${running.exit_rc({ rc: s.rc })}`;
    }
    case 'by_you':
      return running.stopped_by_you_at({ at: hm(s.at) });
    case 'with':
      return running.stopped_with({ agent: p.agent });
  }
}

/**
 * Its address while it serves web pages: 'localhost:5173 ↗' (opens 127.0.0.1). Only when its hub
 * found HTTP there (`url`, procs-bar: a port that isn't a web page opened an empty tab); none when
 * it doesn't listen, isn't HTTP, or ended.
 */
export function urlWords(p: Proc, s: St): { readonly label: string; readonly url: string; readonly row: string; readonly tip: string } | null {
  if (s.k !== 'running' && s.k !== 'stopping') return null;
  const url = p.url ?? '';
  const port = /^https?:\/\/[^/]*:(\d+)/u.exec(url)?.[1];
  if (port === undefined) return null;
  // the screen's row says it quietly, ':5173 ↗', its tip the whole address (designer m_41694 #4)
  return { label: `localhost:${port} ↗`, url, row: running.url_row({ port }), tip: running.url_tip({ port }) };
}

/**
 * A screen row's command (designer m_41694 #1): its program by name ('python3', not
 * '/Library/…/bin/python3') and its arguments as they are; a leading 'cd <its own folder> &&' says
 * nothing and goes, any other cd stays. The whole command is in the tip and the pane. Pure.
 */
export function rowCmd(cmd: string, cwd?: string | null): { readonly prog: string; readonly args: string } {
  const clean = (x: string) => x.replace(/^['"]|['"]$/gu, '').replace(/\/+$/u, '');
  let c = cmd.trim();
  const cd = /^cd\s+("[^"]*"|'[^']*'|\S+)\s*(?:&&|;)\s*/u.exec(c);
  if (cd !== null && cwd != null && cwd !== '' && clean(cd[1] ?? '') === clean(cwd)) c = c.slice(cd[0].length);
  const sp = c.search(/\s/u);
  const first = sp < 0 ? c : c.slice(0, sp);
  const args = sp < 0 ? '' : c.slice(sp).trim();
  const prog = /^['"]?\//u.test(first) ? (clean(first).split('/').pop() ?? first) : first;
  return { prog, args };
}

/**
 * The output's words while it has printed nothing (designer m_41694 #10): running, 'running for
 * 3 min · nothing printed yet'; ended, 'it ended without printing anything · exit 0'. Pure.
 */
export function quietWords(p: Proc, s: St, now: number): string {
  if (s.k === 'running' || s.k === 'stopping') return running.quiet_running({ age: ageWords(now - p.started_ms) });
  return s.k === 'exited' && s.rc !== null ? running.quiet_ended_rc({ rc: s.rc }) : running.quiet_ended;
}

/** An age in the pane's words: under a minute '1 min' would lie, 'less than a minute' is long: 'a moment'. */
const ageWords = (ms: number): string => (ms < MIN ? '< 1 min' : shortAge(ms));

/** The day of `ms` is `now`'s, in the window's time zone. */
export function today(ms: number, now: number): boolean {
  const a = new Date(ms);
  const b = new Date(now);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** A port it listens on that isn't a web page: ':9229', plain (no link); none when it has a url or no port. */
export function portWords(p: Proc, s: St): string {
  if (s.k !== 'running' && s.k !== 'stopping') return '';
  if (urlWords(p, s) !== null) return '';
  const port = portsOf(p)[0];
  return port === undefined ? '' : `:${String(port)}`;
}

/** A folder that names where a process runs: the project's root (name ''), an agent's worktree. */
export interface Root {
  readonly path: string;
  readonly name: string;
}

/**
 * Where it runs, as the bar says it (procs-bar, Gabriel: the full path says nothing): its folder
 * under the deepest root that holds it, past the project's root ('apps/desktop', '' at the root
 * itself), a worktree by its name ('perf', 'perf/apps/desktop'); elsewhere its last folder. Never a
 * home path. Pure.
 */
export function whereOf(cwd: string | null | undefined, roots: readonly Root[]): string {
  if (cwd == null || cwd === '') return '';
  const clean = (x: string) => x.replace(/\/+$/u, '');
  const at = clean(cwd);
  const root = roots
    .filter((r) => r.path !== '' && (at === clean(r.path) || at.startsWith(`${clean(r.path)}/`)))
    .sort((a, b) => b.path.length - a.path.length)[0];
  if (root === undefined) return at.split('/').filter((x) => x !== '').pop() ?? '/';
  const rel = at.slice(clean(root.path).length).replace(/^\//u, '');
  return [root.name, rel].filter((x) => x !== '').join('/');
}

/**
 * The pane's 'where' (designer m_41694 #8): its folder past its agent's own worktree ('apps/web';
 * none at the worktree's root: the head names the agent already), past the project's root, else
 * short ('~/…/shop/perf'). Pure.
 */
export function paneWhere(x: ProcItem, roots: readonly Root[], home?: string): string {
  const cwd = x.p.cwd ?? '';
  const w = whereOf(cwd, roots);
  if (w === x.p.agent) return '';
  if (w.startsWith(`${x.p.agent}/`)) return w.slice(x.p.agent.length + 1);
  return w !== '' || cwd === '' ? w : shortCwd(cwd, home);
}

/**
 * A worktree's name from its path: its folder, or the one above when the folder is the repo's own
 * name (bise's `worktrees/<hub>/<task>/<repo>`: the task). Pure.
 */
export function worktreeName(path: string, repo: string): string {
  const parts = path.split('/').filter((x) => x !== '');
  const last = parts.at(-1) ?? '';
  return last === repo && parts.length > 1 ? (parts.at(-2) ?? last) : last;
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

/**
 * The output's head line (designer m_41694 #8), in order: its mark and 'running for 3 min' (or how
 * it ended), pid, cpu and memory while it runs, where it runs (`where`: its folder past its
 * worktree, whereOf), whose ('perf · storefront'). Its address is the head's 'open ↗'.
 */
export function metaOf(x: ProcItem, s: St, now: number, where: string): readonly MetaPart[] {
  const p = x.p;
  const st = s.k === 'running' ? `∿ ${running.running_for({ age: ageWords(now - p.started_ms) })}` : `${markOf(s).glyph} ${endWords(p, s, now)}`;
  const live = s.k === 'running' || s.k === 'stopping';
  const parts: MetaPart[] = [
    { k: 'state', w: st },
    { k: 'pid', w: running.pid_of({ pid: p.pid }) },
    { k: 'usage', w: live ? running.usage({ cpu: Math.round(p.cpu), mb: p.rss_mb }) : '' },
    { k: 'where', w: where },
    { k: 'whose', w: running.whose({ agent: p.agent, project: x.projectName }) },
  ];
  return parts.filter((m) => m.w !== '');
}

/** A part of the head line, by kind: a narrow pane drops pid first, then usage (designer m_41800 #2). */
export interface MetaPart {
  readonly k: 'state' | 'pid' | 'usage' | 'where' | 'whose';
  readonly w: string;
}

export type Filter = 'running' | 'ended';

/** One project's processes under its head ('storefront'); the agent is a column of each row (designer m_41694 #2). */
export interface Group {
  readonly key: string;
  readonly project: string;
  readonly projectName: string;
  readonly items: readonly ProcItem[];
}

/** How long a row that ended stays in place under 'running' (designer m_38389), then it goes to 'ended' (m_41694 #5). */
export const KEEP_MS = 60_000;

/** It shows under 'running': it runs, or it ended a moment ago while he looked (`kept`). */
function underRunning(x: ProcItem, kept: ReadonlySet<string>, now: number): boolean {
  if (isRunning(x.p)) return true;
  if (!kept.has(keyOf(x))) return false;
  const at = endedAt(x.p);
  return at === null || now - at < KEEP_MS;
}

/** It shows under 'ended today': it ended, today in his time zone (designer m_41694 #3). */
const endedToday = (x: ProcItem, now: number): boolean => {
  if (isRunning(x.p)) return false;
  return today(endedAt(x.p) ?? x.p.started_ms, now);
};

/**
 * The screen's list: the filter's rows grouped by project in the order they come (his sidebar's),
 * an agent's rows together in the order its first one comes; running ones oldest first, ended ones
 * newest first. `kept`: rows seen running while 'running' is shown; one that ends stays where it
 * was for KEEP_MS (designer m_38389: nothing jumps under his pointer).
 */
export function groupsOf(items: readonly ProcItem[], filter: Filter, now: number, kept: ReadonlySet<string> = new Set()): Group[] {
  const shown = items.filter((x) => (filter === 'running' ? underRunning(x, kept, now) : endedToday(x, now)));
  const order = filter === 'running' ? (a: ProcItem, b: ProcItem) => a.p.started_ms - b.p.started_ms : (a: ProcItem, b: ProcItem) => (endedAt(b.p) ?? 0) - (endedAt(a.p) ?? 0);
  const sorted = [...shown].sort(order);
  const agents = [...new Set(sorted.map((x) => `${x.project}/${x.p.agent}`))];
  const groups = new Map<string, { project: string; projectName: string; items: ProcItem[] }>();
  for (const x of shown) {
    const g = groups.get(x.project) ?? { project: x.project, projectName: x.projectName, items: [] };
    g.items.push(x);
    groups.set(x.project, g);
  }
  const rank = (x: ProcItem) => agents.indexOf(`${x.project}/${x.p.agent}`);
  return [...groups.entries()].map(([key, g]) => ({ key, ...g, items: [...g.items].sort((a, b) => rank(a) - rank(b) || order(a, b)) }));
}

/** The filters' counts: what runs, what ended today (his day). */
export function countsOf(items: readonly ProcItem[], now: number): { readonly running: number; readonly ended: number; readonly projects: number; readonly listening: number } {
  const live = items.filter((x) => isRunning(x.p));
  return {
    running: live.length,
    ended: items.filter((x) => endedToday(x, now)).length,
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

/**
 * The bar's row command, short (procs-bar): past a package runner's exec, its program by name and
 * its arguments, a path by its last part ('python3 -m http.server 8000', 'node server.js'), five
 * words at most. Never a home path.
 */
export function shortCmd(cmd: string): string {
  const w = cmd.trim().split(/\s+/u);
  const runner = ['pnpm', 'npx', 'npm', 'yarn'].includes(w[0] ?? '') && w[1] === 'exec' ? 2 : 0;
  const base = (x: string) => (x.includes('/') && /^['"]?[~/.]/u.test(x) ? (x.replace(/['"]/gu, '').split('/').filter((y) => y !== '').pop() ?? x) : x);
  return w.slice(runner, runner + 5).map(base).join(' ');
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
