// The nightly invariants on a real core (fast-try p5, architect m_29198, m_29407): tonight's
// recording of `bise ambient-core` on the QA world (tests/core_record.py, scripts/core_record.sh,
// tests/nightly/rec/rec.jsonl) goes through the same window as the feature tests (../feature/run.ts):
// its events and the core's answers in (main's window-local events built by src/shared/local.ts,
// as main builds them), his recorded commands as his gestures. Invariants only, no expected
// output: nothing throws, a card the hub took and dropped never shows again, every request is
// answered and no send is left on its way. Run: vitest -c vitest.nightly.config.ts (not pnpm test),
// which reads the recording and hands it here (inject).
import { describe, expect, inject, it } from 'vitest';
import { answeredEv, refusedEv } from '@/shared/local';
import { answer, close, send, type Gesture, type Input } from '../feature/inputs';
import { feature, type Feature } from '../feature/run';

declare module 'vitest' {
  export interface ProvidedContext {
    /** tonight's rec.jsonl, one parsed line each (null: no recording) */
    rec: unknown[] | null;
    recPath: string;
  }
}

type Cmd = Readonly<Record<string, unknown>> & { readonly cmd: string };
type Line =
  | { readonly cmd: Cmd }
  | { readonly ev: Record<string, unknown> & { readonly ev: string } }
  | { readonly answer: { readonly cmd: Cmd; readonly result: unknown } }
  | { readonly refused: { readonly cmd: Cmd; readonly error: { readonly message: string } } }
  | { readonly reload: true };

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const num = (v: unknown): number => (typeof v === 'number' ? v : -1);

/** His gesture for a recorded command (the ones the window makes from his hand); null: none. */
function gestureOf(c: Cmd): Gesture | null {
  if (c.cmd === 'send') return send(str(c['project']), str(c['agent']), str(c['text']));
  if (c.cmd === 'answer') return answer(str(c['project']), num(c['card']), str(c['reply']));
  if (c.cmd === 'close') return close(str(c['project']), num(c['card']));
  return null;
}

const key = (project: unknown, card: unknown): string => `${str(project)}-${String(num(card))}`;

/**
 * The card keys a `projects` event lists; null for a row whose cards aren't known. The core leaves
 * an empty list out of a row (bise-proto app_rows.rs), so no `cards` with `waits` 0 is none; no
 * `cards` with waits (a hub starting, a row from its files) is unknown.
 */
function listed(ev: Record<string, unknown>): Map<string, Set<string> | null> {
  const out = new Map<string, Set<string> | null>();
  for (const r of (ev['projects'] as readonly Record<string, unknown>[] | undefined) ?? []) {
    const cards = r['cards'] as readonly Record<string, unknown>[] | undefined;
    const none = cards === undefined && r['waits'] === 0;
    out.set(str(r['project']), none ? new Set() : cards === undefined ? null : new Set(cards.map((c) => key(c['project'], c['id']))));
  }
  return out;
}

describe("tonight's real core, through the window", () => {
  const lines = (inject('rec') ?? []) as Line[];

  it('has a recording (scripts/core_record.sh)', () => {
    expect(inject('rec'), `no recording at ${inject('recPath')}: scripts/core_record.sh records one`).not.toBeNull();
    expect(lines.length).toBeGreaterThan(0);
  });

  it('never throws, never shows again a card the hub took and dropped, and settles every request', () => {
    const w: Feature = feature();
    const breaks: string[] = [];
    // the cards the hub took (his answer's result, his close's), and the ones its rows then dropped
    const took = new Set<string>();
    const dropped = new Set<string>();
    let open = 0;
    const check = (at: number): void => {
      for (const c of w.view.inbox()) {
        const k = key(c.project, c.id);
        if (dropped.has(k)) breaks.push(`line ${String(at + 1)}: card ${k} shows again after the hub took it and dropped it`);
      }
    };
    lines.forEach((l, i) => {
      try {
        if ('reload' in l) {
          if (open !== 0) breaks.push(`line ${String(i + 1)}: ${String(open)} request(s) never answered before the reload`);
          if (w.view.sending()) breaks.push(`line ${String(i + 1)}: a send still on its way at the reload`);
          open = 0;
          w.reload();
        } else if ('cmd' in l) {
          open += 1;
          const g = gestureOf(l.cmd);
          if (g !== null) w.does(g);
        } else if ('answer' in l) {
          open -= 1;
          const { cmd, result } = l.answer;
          if (cmd.cmd === 'answer' || cmd.cmd === 'close') took.add(key(cmd['project'], cmd['card']));
          const ev = answeredEv(cmd, result);
          if (ev !== null) w.given(ev as unknown as Input);
        } else if ('refused' in l) {
          open -= 1;
          const { cmd, error } = l.refused;
          if (cmd.cmd === 'answer' || cmd.cmd === 'close') w.given(refusedEv(cmd['project'], cmd['card'], error.message) as unknown as Input);
        } else {
          if (l.ev.ev === 'projects') {
            const rows = listed(l.ev);
            for (const k of took) {
              const p = k.slice(0, k.lastIndexOf('-'));
              const now = rows.get(p);
              if (now !== undefined && now !== null && !now.has(k)) dropped.add(k);
            }
          }
          w.given(l.ev as unknown as Input);
        }
      } catch (e) {
        breaks.push(`line ${String(i + 1)}: threw ${String(e)}`);
      }
      check(i);
    });
    if (open !== 0) breaks.push(`the end: ${String(open)} request(s) never answered`);
    if (w.view.sending()) breaks.push('the end: a send still on its way');
    w.reload();
    check(lines.length);
    expect(breaks).toEqual([]);
  });
});
