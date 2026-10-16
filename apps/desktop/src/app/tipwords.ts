// The hover tips' words for the two bars' compact marks (designer m_24359/m_24363, his 'every compact
// mark explains itself'): one string per mark and state, the shape '<what it is>: <what it says
// now>', lowercase, no period; a mark whose click goes elsewhere than its row says so ('· click
// opens the PR'). The words are the catalog's (bise_proto::words::panel, words_panel.gen.ts; the
// pause words thread/wake.ts's, a worktree's barplaces.ts tipWords); the choices are here.
// Pure: Sidebar.tsx and RightBar.tsx spread them with the ds's tipAttrs. Owner: amb-win.
import type { Agent, ProjectRow } from '@/proto';
import { panel } from '@/proto/words_panel.gen';
import { shortAge } from '@/agents/model';
import { pauseLine, shownPause, waitLen } from '@/thread/wake';
import { tilde, type Mark } from './barplaces';
import { projectMark } from './markstates';
import { composer } from '../proto/words.gen';

// ---- the sidebar

/** 'perf', 'perf and search', 'perf, search and ui', 'perf, search and 2 more'. Pure. */
export function namesWords(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length <= 3) return panel.names_and({ names: names.slice(0, -1).join(', '), last: names[names.length - 1] ?? '' });
  return panel.names_more({ names: names.slice(0, 2).join(', '), n: names.length - 2 });
}

/** bise's ':*', bise-presence's words (designer m_24644): 'bise: 1 thing waits for you', 'bise: working with 3 agents', 'bise: all quiet'. */
export function biseTip(waits: number, working: number): string {
  const tip = (what: string) => panel.tip_of({ who: panel.bise, what });
  if (waits > 0) return tip(panel.tip_things_wait({ n: waits }));
  if (working > 0) return tip(panel.tip_working_with({ n: working }));
  return tip(panel.tip_quiet);
}

/**
 * A project's mark: 'storefront: perf and search are working · 2 agents', 'ts-pattern:
 * pattern-error-dx waits for you', 'docs-site: all quiet'. The names from its agents when the
 * window has them, else the counts. Pure.
 */
export function projectTip(p: Pick<ProjectRow, 'name' | 'waits' | 'working' | 'missing'>, who: { working: readonly string[]; asking: readonly string[] }): string {
  const kind = projectMark(p);
  if (kind === 'asks') {
    const asks = who.asking.length > 0 ? (who.asking.length === 1 ? panel.tip_name_waits : panel.tip_names_wait)({ names: namesWords(who.asking) }) : panel.tip_things_wait({ n: p.waits });
    return panel.tip_of({ who: p.name, what: p.working > 0 ? `${asks} · ${panel.tip_agents_working({ n: p.working })}` : asks });
  }
  if (kind === 'works') {
    const n = Math.max(p.working, who.working.length);
    if (who.working.length === 0) return panel.tip_of({ who: p.name, what: panel.tip_agents_working({ n }) });
    const names = (who.working.length === 1 ? panel.tip_name_working : panel.tip_names_working)({ names: namesWords(who.working) });
    return panel.tip_of({ who: p.name, what: n > 1 ? `${names} · ${panel.tip_agents({ n })}` : names });
  }
  return panel.tip_of({ who: p.name, what: panel.tip_quiet });
}

/** A project's working count '3': '3 agents working'. */
export function workingTip(n: number): string {
  return panel.tip_agents_working({ n });
}

/** A pink count: '2 waiting for you'; bise's (every project's): '… in all your projects'. */
export function waitsTip(n: number, everywhere = false): string {
  return everywhere ? panel.tip_waiting_you_all({ n }) : panel.tip_waiting_you({ n });
}

/** A project's 'folder gone': where it was. */
export function goneTip(path: string): string {
  return path === '' ? panel.tip_gone : panel.tip_gone_at({ path });
}

/** The artifacts row's '3 new · designer'. */
export function newTip(n: number, makers: readonly string[]): string {
  const what = panel.tip_not_opened({ n });
  return makers.length === 0 ? what : panel.tip_not_opened_from({ what, who: makers.join(', ') });
}

/** The scheduled row's '4'. */
export function scheduledTip(n: number): string {
  return panel.tip_scheduled({ n });
}

// ---- the right bar

/**
 * An agent's sign: '∿ perf is working', '? perf waits for you', '… perf continues when cargo test
 * ends', '✗ perf failed', '✓ perf is done', '○ perf is idle' ('○ perf is idle: wakes at 14:20').
 * `g`: the bar's sign (barrows barSign), `wake`: its next wake's clock, ''. A click opens it.
 */
export function signTip(g: string, a: Agent, now: number, wake = ''): string {
  const n = a.name;
  const what = ((): string => {
    switch (g) {
      case '∿':
        return panel.tip_working({ agent: n });
      case '?':
        return panel.tip_asks({ agent: n });
      case '…': {
        const raw = pauseLine(a, now);
        const p = raw === null ? null : shownPause(raw);
        return p === null ? panel.tip_waiting({ agent: n }) : panel.tip_paused({ agent: n, state: p.state, note: `${p.note}${p.more}` });
      }
      case '✗':
        return panel.tip_failed({ agent: n });
      case '✓':
        return panel.tip_done({ agent: n });
      case '–':
        return panel.tip_stopped({ agent: n });
      default:
        return wake === '' ? panel.tip_idle({ agent: n }) : panel.tip_idle_wakes({ agent: n, at: wake });
    }
  })();
  return `${g} ${what}`;
}

/** The time column: 'working for 6 min on this turn', 'waiting for 3 min'; '' when it shows none. */
export function timeTip(a: Agent, now: number): string {
  const p = pauseLine(a, now);
  if (p !== null) return panel.tip_waiting_for({ len: p.len });
  if (a.status === 'working') return panel.tip_working_for({ len: waitLen(a.turn_ms ?? now - a.since_ms) });
  return '';
}

const kilo = (n: number) => (n >= 1000 ? `${String(Math.round(n / 1000))}k` : String(n));

/** The % column: "17% of perf's context used: 42k of 256k"; '' when it shows none. */
export function pctTip(a: Agent, pct: string): string {
  if (pct === '') return '';
  const u = a.usage;
  return u?.window != null && u.window > 0
    ? panel.tip_context_of({ pct, agent: a.name, used: kilo(u.context), window: kilo(u.window) })
    : panel.tip_context({ pct, agent: a.name });
}

/**
 * A worktree's mark (ψ ↑ … Δ): its words (wt-sign's barplaces.ts tipParts, signed m_24019), its
 * branch and folder mono (`…` in the ds tip), his home folded to '~', then where its click goes.
 */
export function markTip(m: Mark, orphan = false, home?: string): string {
  if (m.tip === '') return '';
  const words = m.parts.map((x) => (x.mono === true ? `\`${tilde(x.t, home)}\`` : x.t)).join('');
  const goes = orphan ? panel.tip_opens_branch : m.g === '↑' ? panel.tip_opens_pr : panel.tip_opens_changes;
  return `${words} · ${goes}`;
}

/** An archived agent's age: 'done 2 h ago', 'failed 1 d ago', 'stopped 3 d ago'. */
export function archivedAgeTip(state: 'done' | 'failed' | 'stopped', ms: number): string {
  const age = shortAge(ms);
  const st = stateWord(state);
  return age === 'now' ? panel.tip_archived_now({ state: st }) : panel.tip_archived_ago({ state: st, age });
}

/** An archived agent's state in one word: 'done', 'failed', 'stopped'. Pure. */
export function stateWord(state: 'done' | 'failed' | 'stopped'): string {
  return state === 'done' ? panel.state_done : state === 'failed' ? panel.state_failed : panel.state_stopped;
}

/** An artifact's end ('14:20', '3 d'): 'made at 14:20', 'made 3 d ago'. */
export function madeTip(end: string): string {
  if (end === '') return '';
  return /^\d\d:\d\d$/.test(end) ? panel.tip_made_at({ at: end }) : end === 'now' ? panel.tip_made_now : panel.tip_made_ago({ age: end });
}

// ---- the app's own update (desktop-dist v7, designer m_25362)

/** Settings' 'updated to <version> · <when>' line, after a quiet install. */
export function updatedTip(): string {
  return 'installed while you were away';
}

// ---- the composer answering a question (composer-target A, designer m_26531)

/** The pink border's tip while his words answer `who`'s question: 'your words answer search's question · esc writes to bise'. */
export function answerTip(who: string, escTo: string): string {
  return composer.answer_tip({ agent: who, esc_to: escTo });
}

/** The pink border's tip while an open artifact's words go to its maker (art-target): 'your words go to perf, not bise · esc writes to bise'; no thread to go back to: 'esc closes it'. */
export function aboutTip(who: string, escTo: string | undefined): string {
  return composer.about_tip({ agent: who, esc: escTo === undefined ? composer.esc_closes : composer.esc_writes_to({ agent: escTo }) });
}
