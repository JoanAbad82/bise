// @vitest-environment happy-dom
// The capsule: its view machine (fn space, talk, answer, a pushed card waits for him, esc, the
// tray), the store mapping, and the one live pearl that stays the same node across views (bug 2).
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Agent, Card, ProjectRow } from '@/proto';
import { Capsule, type CapsuleProps } from './Capsule';
import { cardKind, toSpotData } from './data';
import { NONE, START, step, type CapEvent, type View } from './machine';
import { newCards, type Loaded } from './CapsuleRoot';

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
      fx: [{ fx: 'show', at: 'bottom', keys: false }, { fx: 'talk', cmd: 'talk_start' }, { fx: 'mic', open: true }, { fx: 'talk', cmd: 'talk_end' }, { fx: 'mic', open: false }],
    });
    expect(run([{ ev: 'fn', act: 'talk_start' }, { ev: 'fn', act: 'cancel' }]).fx).toContainEqual({ fx: 'talk', cmd: 'talk_cancel' });
    expect(run([{ ev: 'fn', act: 'talk_start' }, { ev: 'fn', act: 'talk_end' }, { ev: 'answer' }]).view).toEqual({ kind: 'answer' });
  });
  it('a pushed card waits while he is in the spotlight; alone it shows at the bottom', () => {
    expect(run([{ ev: 'fn', act: 'key', key: 'space' }, { ev: 'card', id: 'p.1' }]).view).toEqual({ kind: 'spot' });
    expect(run([{ ev: 'card', id: 'p.1' }])).toEqual({ view: { kind: 'card', id: 'p.1' }, fx: [{ fx: 'show', at: 'bottom', keys: false }] });
    expect(run([{ ev: 'card', id: 'p.1' }, { ev: 'card_done', id: 'p.1' }]).view).toEqual(NONE);
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
  it('a pushed card waits through a quiet moment and shows when it ends; fn space is never held', () => {
    const quiet: CapEvent[] = [{ ev: 'quiet', on: true }, { ev: 'card', id: 'p.9' }];
    expect(run(quiet)).toEqual({ view: NONE, fx: [] });
    expect(run([...quiet, { ev: 'quiet', on: false }])).toEqual({ view: { kind: 'card', id: 'p.9' }, fx: [{ fx: 'show', at: 'bottom', keys: false }] });
    expect(run([...quiet, { ev: 'fn', act: 'key', key: 'space' }]).view).toEqual({ kind: 'spot' });
    expect(run([{ ev: 'fn', act: 'key', key: 'space' }, { ev: 'card', id: 'p.9' }, { ev: 'fn', act: 'esc' }]).view).toEqual({ kind: 'card', id: 'p.9' });
  });
  it('a push is a card new in a project whose cards had loaded', () => {
    const loaded = new Map<string, Loaded>();
    const projects = [{ project: 'tel', waits: 2 }];
    const two = [{ id: 'tel.1', project: 'tel' }, { id: 'tel.2', project: 'tel' }];
    expect(newCards(loaded, projects, [], 0)).toEqual([]);
    expect(newCards(loaded, projects, two, 10)).toEqual([]);
    // the hub's own cards right after the row's: still the load
    expect(newCards(loaded, projects, [...two, { id: 'tel.3', project: 'tel' }], 100)).toEqual([]);
    expect(newCards(loaded, projects, [...two, { id: 'tel.3', project: 'tel' }, { id: 'tel.9', project: 'tel' }], 1100)).toEqual(['tel.9']);
    expect(newCards(new Map(), [{ project: 'shop', waits: 0 }], [], 0)).toEqual([]);
  });
  it('the tray click opens the dropdown; a blur that hid the window closes the view; fn i opens the inbox', () => {
    expect(run([{ ev: 'window', shown: true, why: 'tray' }]).view).toEqual({ kind: 'menu' });
    expect(run([{ ev: 'fn', act: 'key', key: 'space' }, { ev: 'window', shown: false, why: 'blur' }]).view).toEqual(NONE);
    expect(run([{ ev: 'fn', act: 'key', key: 'i' }]).fx).toEqual([{ fx: 'open', route: 'inbox' }]);
  });
});

const P = (p: Partial<ProjectRow> & { project: string }): ProjectRow => ({ name: p.project, path: `/Users/me/${p.project}`, git: true, home: false, order: 0, agents: 0, working: 0, waits: 0, running: true, ...p });
const A = (name: string, status: Agent['status']): Agent => ({ name, main: false, status, archived: false, title: `${name} title`, purpose: '', since_ms: 0, waits: 0 });
const C = (id: number, approval: boolean): Card => ({ id, project: 'tel', kind: approval ? 'confirm' : 'question', agent: 'perf', question: 'go?', options: [], urgent: false, since_ms: 0, approval });

describe('the store mapping', () => {
  it('projects in order without the home one, every agent and card', () => {
    const d = toSpotData(
      [P({ project: 'home', home: true }), P({ project: 'tel', order: 2, branch: 'dev' }), P({ project: 'shop', order: 1 })],
      (p) => (p === 'tel' ? [A('perf', 'working')] : []),
      (p) => (p === 'tel' ? [C(4, true)] : []),
      null,
    );
    expect(d.projects.map((p) => [p.id, p.branch])).toEqual([['shop', 'main'], ['tel', 'dev']]);
    expect(d.agents).toMatchObject([{ name: 'perf', project: 'tel', status: 'working' }]);
    expect(d.cards).toEqual([{ id: 'tel.4', agent: 'perf', project: 'tel', text: 'go?', kind: 'approval' }]);
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
