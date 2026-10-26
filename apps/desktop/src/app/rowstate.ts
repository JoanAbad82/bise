// An agent row's state in words, at its right edge (page agents-float v1, his ask m_45828: who
// works and each agent's status, put forward): '∿ working · 12 min' in ink, '? asks you' in the
// accent (the only pink), '… waits for an agent' text-3 with its line 2 naming which, 'idle · 4 min'
// and '✓ done · 1 h' text-3 (those rows step back), '✗ failed · 20 min' in red. Its tip says the
// full words ('working since 14:02 · 12 min'). Pure. Owner: nm-side.
import type { Agent } from '@/proto';
import { shownName } from '@/agents/model';
import { hm } from '@/running/model';
import { pauseLine, shownPause, waitLen } from '@/thread/wake';
import { panel } from '@/proto/words_panel.gen';
import { side } from '@/proto/words_side.gen';
import { signOf } from './side';

/** how the state reads: work ink 500, ask the accent 600, wait / rest text-3, err red */
export type StateTone = 'work' | 'ask' | 'wait' | 'rest' | 'err';

export interface RowState {
  /** its sign before the words: '∿' (the breath, turning), '?', '…', '✓', '✗', '◷'; '' at rest */
  readonly g: string;
  /** its words, after the sign: 'working · 12 min' */
  readonly words: string;
  readonly tone: StateTone;
  /** the full words on hover */
  readonly tip: string;
  /** idle, done or a next wake: the row steps back (name text-2 400, head at 55 %) */
  readonly back: boolean;
  /** a line 2 that says more than its job: whom it waits for, what failed */
  readonly l2?: string;
}

/** Its state at `now`; `wake`: a scheduled task's next run that wakes it. Pure. */
export function rowState(a: Agent, now: number, wake?: number): RowState {
  const s = signOf(a, now, wake);
  const since = (from: number, state: string) => {
    const len = waitLen(now - from);
    return { len, tip: side.row_since_tip({ state, at: hm(from), len }) };
  };
  switch (s.g) {
    case '?': {
      const t = since(a.since_ms, panel.asks_you);
      return { g: '?', words: side.row_asks, tone: 'ask', tip: t.tip, back: false };
    }
    case '∿': {
      const from = now - (a.turn_ms ?? now - a.since_ms);
      const t = since(from, panel.state_working);
      return { g: '∿', words: side.row_working({ len: t.len }), tone: 'work', tip: t.tip, back: false };
    }
    case '…': {
      const raw = pauseLine(a, now);
      const p = raw === null ? null : shownPause(raw);
      if (a.waiting_on?.who === 'agent') {
        return { g: '…', words: side.row_waits_agent, tone: 'wait', tip: p?.title ?? side.row_waits_agent, back: false, l2: side.waits_for({ agent: shownName(a.waiting_on.name) }) };
      }
      const len = p?.len ?? '';
      return { g: '…', words: len === '' ? side.row_waiting : side.row_waits({ len }), tone: 'wait', tip: p?.title ?? side.row_waiting, back: false };
    }
    case '⋯':
      return { g: '…', words: side.row_waiting, tone: 'wait', tip: s.title, back: false };
    case '✗': {
      const t = since(a.since_ms, panel.state_failed);
      const what = a.report?.kind === 'failed' && a.report.text !== '' ? a.report.text : undefined;
      return { g: '✗', words: side.row_failed({ len: t.len }), tone: 'err', tip: t.tip, back: false, ...(what === undefined ? {} : { l2: what }) };
    }
    case '◷': {
      const at = wake === undefined ? '' : hm(wake);
      return { g: '◷', words: side.row_wakes({ at }), tone: 'rest', tip: s.title, back: true };
    }
    case '✓': {
      const t = since(a.since_ms, panel.state_done);
      return { g: '✓', words: side.row_done({ len: t.len }), tone: 'rest', tip: t.tip, back: true };
    }
    default: {
      const t = since(a.since_ms, panel.state_idle);
      return { g: '', words: side.row_idle({ len: t.len }), tone: 'rest', tip: t.tip, back: true };
    }
  }
}

/** The float's head: '3 working · 1 waiting for you', a part at 0 drops; the waiting part goes in the accent. Pure. */
export function headParts(states: readonly RowState[], waiting: number): { working: string; waiting: string } {
  const n = states.filter((x) => x.tone === 'work').length;
  return { working: n > 0 ? side.working({ n }) : '', waiting: waiting > 0 ? side.waiting_you({ n: waiting }) : '' };
}
