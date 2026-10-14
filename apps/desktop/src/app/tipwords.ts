// The hover tips' words for the two bars' compact marks (designer m_24359/m_24363, his 'every compact
// mark explains itself'): one string per mark and state, the shape '<what it is>: <what it says
// now>', lowercase, no period; a mark whose click goes elsewhere than its row says so ('· click
// opens the PR'). Words the TUI has already come from their one source: the pause words
// (thread/wake.ts, words.rs's fixture), a worktree's (barplaces.ts tipWords). The new ones are
// plain functions of numbers and names, so the TUI's twin can move them into words.rs as they are.
// Pure: Sidebar.tsx and RightBar.tsx spread them with the ds's tipAttrs. Owner: amb-win.
import type { Agent, ProjectRow } from '@/proto';
import { shortAge } from '@/agents/model';
import { pauseLine, shownPause, waitLen } from '@/thread/wake';
import { tilde, type Mark } from './barplaces';
import { projectMark } from './markstates';

const plural = (n: number, one: string, many: string) => `${String(n)} ${n === 1 ? one : many}`;

// ---- the sidebar

/** 'perf', 'perf and search', 'perf, search and ui', 'perf, search and 2 more'. Pure. */
export function namesWords(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length <= 3) return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1] ?? ''}`;
  return `${names.slice(0, 2).join(', ')} and ${String(names.length - 2)} more`;
}

/** bise's ':*', bise-presence's words (designer m_24644): 'bise: 1 thing waits for you', 'bise: working with 3 agents', 'bise: all quiet'. */
export function biseTip(waits: number, working: number): string {
  if (waits > 0) return `bise: ${plural(waits, 'thing waits', 'things wait')} for you`;
  if (working > 0) return `bise: working with ${plural(working, 'agent', 'agents')}`;
  return 'bise: all quiet';
}

/**
 * A project's mark: 'storefront: perf and search are working · 2 agents', 'ts-pattern:
 * pattern-error-dx waits for you', 'docs-site: all quiet'. The names from its agents when the
 * window has them, else the counts. Pure.
 */
export function projectTip(p: Pick<ProjectRow, 'name' | 'waits' | 'working' | 'missing'>, who: { working: readonly string[]; asking: readonly string[] }): string {
  const kind = projectMark(p);
  if (kind === 'asks') {
    const asks = who.asking.length > 0 ? `${namesWords(who.asking)} ${who.asking.length === 1 ? 'waits' : 'wait'} for you` : `${plural(p.waits, 'thing waits', 'things wait')} for you`;
    return p.working > 0 ? `${p.name}: ${asks} · ${plural(p.working, 'agent', 'agents')} working` : `${p.name}: ${asks}`;
  }
  if (kind === 'works') {
    const n = Math.max(p.working, who.working.length);
    if (who.working.length === 0) return `${p.name}: ${plural(n, 'agent', 'agents')} working`;
    const names = `${namesWords(who.working)} ${who.working.length === 1 ? 'is' : 'are'} working`;
    return n > 1 ? `${p.name}: ${names} · ${plural(n, 'agent', 'agents')}` : `${p.name}: ${names}`;
  }
  return `${p.name}: all quiet`;
}

/** A pink count: '2 waiting for you'; bise's (every project's): '… in all your projects'. */
export function waitsTip(n: number, everywhere = false): string {
  return everywhere ? `${String(n)} waiting for you, in all your projects` : `${String(n)} waiting for you`;
}

/** A project's 'folder gone': where it was. */
export function goneTip(path: string): string {
  return path === '' ? 'folder gone: its folder is no longer on disk' : `folder gone: ${path} is no longer on disk`;
}

/** The artifacts row's '3 new · designer'. */
export function newTip(n: number, makers: readonly string[]): string {
  const what = `${plural(n, 'artifact', 'artifacts')} you haven't opened yet`;
  return makers.length === 0 ? what : `${what}, from ${makers.join(', ')}`;
}

/** The scheduled row's '4'. */
export function scheduledTip(n: number): string {
  return `${plural(n, 'scheduled task', 'scheduled tasks')}, in all your projects`;
}

// ---- the right bar

/**
 * An agent's sign: '∿ perf is working', '? perf waits for you', '… perf continues when cargo test
 * ends', '▲ perf failed', '✓ perf is done', '○ perf is idle' ('○ perf is idle: wakes at 14:20').
 * `g`: the bar's sign (barrows barSign), `wake`: its next wake's clock, ''. A click opens it.
 */
export function signTip(g: string, a: Agent, now: number, wake = ''): string {
  const n = a.name;
  const what = ((): string => {
    switch (g) {
      case '∿':
        return `${n} is working`;
      case '?':
        return `${n} waits for you`;
      case '…': {
        const raw = pauseLine(a, now);
        const p = raw === null ? null : shownPause(raw);
        return p === null ? `${n} is waiting` : `${n} ${p.state} ${p.note}${p.more}`;
      }
      case '▲':
        return `${n} failed`;
      case '✓':
        return `${n} is done`;
      case '–':
        return `${n} stopped`;
      default:
        return wake === '' ? `${n} is idle` : `${n} is idle: wakes at ${wake}`;
    }
  })();
  return `${g} ${what}`;
}

/** The time column: 'working for 6 min on this turn', 'waiting for 3 min'; '' when it shows none. */
export function timeTip(a: Agent, now: number): string {
  const p = pauseLine(a, now);
  if (p !== null) return `waiting for ${p.len}`;
  if (a.status === 'working') return `working for ${waitLen(a.turn_ms ?? now - a.since_ms)} on this turn`;
  return '';
}

const kilo = (n: number) => (n >= 1000 ? `${String(Math.round(n / 1000))}k` : String(n));

/** The % column: "17% of perf's context used: 42k of 256k"; '' when it shows none. */
export function pctTip(a: Agent, pct: string): string {
  if (pct === '') return '';
  const u = a.usage;
  const of = u?.window != null && u.window > 0 ? `: ${kilo(u.context)} of ${kilo(u.window)}` : '';
  return `${pct} of ${a.name}'s context used${of}`;
}

/**
 * A worktree's mark (ψ ↑ … Δ): its words (wt-sign's barplaces.ts tipParts, signed m_24019), its
 * branch and folder mono (`…` in the ds tip), his home folded to '~', then where its click goes.
 */
export function markTip(m: Mark, orphan = false, home?: string): string {
  if (m.tip === '') return '';
  const words = m.parts.map((x) => (x.mono === true ? `\`${tilde(x.t, home)}\`` : x.t)).join('');
  const goes = orphan ? 'click opens its branch' : m.g === '↑' ? 'click opens the PR' : 'click opens its changes';
  return `${words} · ${goes}`;
}

/** An archived agent's age: 'done 2 h ago', 'failed 1 d ago', 'stopped 3 d ago'. */
export function archivedAgeTip(state: 'done' | 'failed' | 'stopped', ms: number): string {
  const age = shortAge(ms);
  return age === 'now' ? `${state} just now` : `${state} ${age} ago`;
}

/** An artifact's 'new' chip. */
export const NEW_CHIP_TIP = "new: you haven't opened it yet";

/** An artifact's end ('14:20', '3 d'): 'made at 14:20', 'made 3 d ago'. */
export function madeTip(end: string): string {
  if (end === '') return '';
  return /^\d\d:\d\d$/.test(end) ? `made at ${end}` : end === 'now' ? 'made just now' : `made ${end} ago`;
}
