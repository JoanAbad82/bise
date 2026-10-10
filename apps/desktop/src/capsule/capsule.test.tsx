// @vitest-environment happy-dom
// The capsule: its view machine (fn space, talk, answer, a card only from the spotlight, esc, the
// tray), the store mapping, and the one live pearl that stays the same node across views (bug 2).
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Agent, Card, ProjectRow } from '@/proto';
import { Capsule, type CapsuleProps } from './Capsule';
import { cardKind, toSpotData } from './data';
import { NONE, START, step, type CapEvent, type View } from './machine';
import { TALK_FIT } from './machine';

afterEach(cleanup);

const run = (events: CapEvent[]): { view: View; fx: unknown[] } => {
  let state = START;
  const fx: unknown[] = [];
  for (const e of events) {
    const s = step(state, e);
    state = s.state;
    fx.push(...s.fx);
  }
  return { view: state.view, fx };
};

describe('the capsule machine', () => {
  it('fn space opens the spotlight with the keys; again or esc closes it', () => {
    expect(run([{ ev: 'fn', act: 'key', key: 'space' }])).toEqual({ view: { kind: 'spot' }, fx: [{ fx: 'show', at: 'top', keys: true }] });
    expect(run([{ ev: 'fn', act: 'key', key: 'space' }, { ev: 'fn', act: 'esc' }]).view).toEqual(NONE);
    expect(run([{ ev: 'fn', act: 'key', key: 'space' }, { ev: 'fn', act: 'key', key: 'space' }]).fx.at(-1)).toEqual({ fx: 'hide' });
  });
  it('hold fn talks at the bottom without the keys, release thinks, the answer replaces it', () => {
    const r = run([{ ev: 'fn', act: 'talk_start' }, { ev: 'fn', act: 'talk_end' }]);
    expect(r).toEqual({
      view: { kind: 'talk', phase: 'think', handsFree: false },
      fx: [{ fx: 'show', at: 'bottom', keys: false, fit: TALK_FIT }, { fx: 'talk', cmd: 'talk_start' }, { fx: 'mic', open: true }, { fx: 'talk', cmd: 'talk_end' }, { fx: 'mic', open: false }],
    });
    expect(run([{ ev: 'fn', act: 'talk_start' }, { ev: 'fn', act: 'cancel' }]).fx).toContainEqual({ fx: 'talk', cmd: 'talk_cancel' });
    expect(run([{ ev: 'fn', act: 'talk_start' }, { ev: 'fn', act: 'talk_end' }, { ev: 'answer' }]).view).toEqual({ kind: 'answer' });
  });
  it('b3: a card is never pushed; one shows only from the spotlight (decision 2026-10-09, card #476)', () => {
    // no event shows a card by itself: the window's inbox block or the native notification does
    const pushes: CapEvent[] = [{ ev: 'answer' }, { ev: 'card_done', id: 'p.1' }, { ev: 'later' }, { ev: 'close' }, { ev: 'window', shown: false, why: 'blur' }];
    for (const e of pushes) expect(run([e])).toEqual({ view: NONE, fx: [] });
    expect(run([{ ev: 'open_card', id: 'p.1' }])).toEqual({ view: NONE, fx: [] });
    // the talk and the answer stay up when a card is answered elsewhere
    expect(run([{ ev: 'fn', act: 'talk_start' }, { ev: 'card_done', id: 'p.1' }]).view).toMatchObject({ kind: 'talk' });
  });
  it('fn fn talks hands-free until the next tap', () => {
    const r = run([{ ev: 'fn', act: 'double' }]);
    expect(r.view).toEqual({ kind: 'talk', phase: 'listen', handsFree: true });
    // the helper reports the ending tap as talk_end (qa-native's VM pass, m_9998): it ends
    // hands-free and the core gets talk_end once, even if a tap follows
    const ended = run([{ ev: 'fn', act: 'double' }, { ev: 'fn', act: 'talk_end' }, { ev: 'fn', act: 'tap' }]);
    expect(ended.view).toEqual({ kind: 'talk', phase: 'think', handsFree: true });
    expect(ended.fx.filter((f) => JSON.stringify(f) === JSON.stringify({ fx: 'talk', cmd: 'talk_end' }))).toHaveLength(1);
    expect(run([{ ev: 'fn', act: 'double' }, { ev: 'fn', act: 'tap' }]).view).toMatchObject({ phase: 'think' });
  });
  it("R03: ⏎ on a spotlight waiting row answers in place, never closes to nothing; esc and the answer go back to the list", () => {
    const space: CapEvent = { ev: 'fn', act: 'key', key: 'space' };
    const open: CapEvent = { ev: 'open_card', id: 'p.4' };
    expect(run([space, open])).toEqual({ view: { kind: 'card', id: 'p.4' }, fx: [{ fx: 'show', at: 'top', keys: true }] });
    expect(run([space, open, { ev: 'later' }]).view).toEqual({ kind: 'spot' });
    expect(run([space, open, { ev: 'fn', act: 'esc' }]).view).toEqual({ kind: 'spot' });
    expect(run([space, open, { ev: 'card_done', id: 'p.4' }]).view).toEqual({ kind: 'spot' });
    // no hide on the way back: the capsule stays up
    expect(run([space, open, { ev: 'later' }]).fx).not.toContainEqual({ fx: 'hide' });
    // only from the spotlight; another card's answer leaves the open one
    expect(run([open]).view).toEqual(NONE);
    expect(run([space, open, { ev: 'card_done', id: 'p.9' }]).view).toEqual({ kind: 'card', id: 'p.4' });
    // from the card, esc then esc closes the capsule
    expect(run([space, open, { ev: 'fn', act: 'esc' }, { ev: 'fn', act: 'esc' }]).fx.at(-1)).toEqual({ fx: 'hide' });
  });
  it('the tray click opens the dropdown; a blur that hid the window closes the view; fn i opens the inbox', () => {
    expect(run([{ ev: 'window', shown: true, why: 'tray' }]).view).toEqual({ kind: 'menu' });
    expect(run([{ ev: 'fn', act: 'key', key: 'space' }, { ev: 'window', shown: false, why: 'blur' }]).view).toEqual(NONE);
    expect(run([{ ev: 'fn', act: 'key', key: 'i' }]).fx).toEqual([{ fx: 'open', route: 'inbox' }]);
  });
});

const P = (p: Partial<ProjectRow> & { project: string }): ProjectRow => ({ name: p.project, path: `/Users/me/${p.project}`, git: true, home: false, order: 0, agents: 0, working: 0, waits: 0, running: true, ...p });
const A = (name: string, status: Agent['status']): Agent => ({ name, dir: name, main: false, status, archived: false, title: `${name} title`, purpose: '', since_ms: 0, waits: 0 });
const C = (id: number, approval: boolean): Card => ({ id, project: 'tel', kind: approval ? 'confirm' : 'question', agent: 'perf', question: 'go?', options: [], urgent: false, since_ms: 0, approval });

describe('the store mapping', () => {
  it('projects in order without the home one, every agent and card', () => {
    const d = toSpotData(
      [P({ project: 'home', home: true }), P({ project: 'tel', order: 2, branch: 'dev' }), P({ project: 'shop', order: 1 })],
      (p) => (p === 'tel' ? [A('perf', 'working')] : []),
      (p) => (p === 'tel' ? [C(4, true)] : p === 'home' ? [C(2, false)] : []),
      null,
    );
    expect(d.projects.map((p) => [p.id, p.branch])).toEqual([['shop', 'main'], ['tel', 'dev']]);
    expect(d.agents).toMatchObject([{ name: 'perf', project: 'tel', status: 'working' }]);
    // bise's home card leaves the project column empty ('? bise   send the mail…'), a real project names it
    expect(d.cards).toEqual([
      { id: 'home.2', agent: 'perf', project: 'home', text: 'go?', kind: 'question', pname: '' },
      { id: 'tel.4', agent: 'perf', project: 'tel', text: 'go?', kind: 'approval', pname: 'tel' },
    ]);
    expect(cardKind(C(1, false))).toBe('question');
  });
});

describe('the capsule', () => {
  it('keeps one live pearl node from the spotlight to the talk to the answer', () => {
    const base: CapsuleProps = {
      view: { kind: 'spot' }, spot: { agents: [], projects: [], cards: [] }, answer: null, heard: '', level: 0, still: true,
      card: () => null, route: null, onRouteKeep: vi.fn(), onRouteTo: vi.fn(), onAsk: vi.fn(), onOpen: vi.fn(), onOpenWindow: vi.fn(), onClose: vi.fn(), onQuit: null, onSize: vi.fn(),
    };
    const ui = render(<Capsule {...base} />);
    const pearl = ui.getByTestId('capsule.pearl');
    ui.rerender(<Capsule {...base} view={{ kind: 'talk', phase: 'listen', handsFree: false }} />);
    expect(ui.getByTestId('capsule.talk').textContent).toBe('listening…');
    ui.rerender(<Capsule {...base} view={{ kind: 'answer' }} answer={{ text: 'yes', done: true }} />);
    expect(ui.getByTestId('capsule.pearl')).toBe(pearl);
    expect(ui.getByTestId('capsule.answer').textContent).toContain('yes');
    ui.rerender(<Capsule {...base} view={{ kind: 'menu' }} />);
    expect(ui.getByTestId('capsule.menu.quit').getAttribute('aria-disabled')).toBe('true');
  });
});
