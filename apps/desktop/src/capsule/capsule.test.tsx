// @vitest-environment happy-dom
// The capsule: its view machine (fn space, talk, answer, a card only from the spotlight, esc, the
// tray), the store mapping, and the one live pearl that stays the same node across views (bug 2).
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Agent, Card, ProjectRow } from '@/proto';
import { Capsule, type CapsuleProps } from './Capsule';
import { cardKind, toSpotData } from './data';
import { NONE, START, step, type CapEvent, type View } from './machine';
import { asksForScreen, shotName, shotOf, shotPref } from './shot';

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
      fx: [{ fx: 'show', at: 'corner', keys: false }, { fx: 'talk', cmd: 'talk_start' }, { fx: 'mic', open: true }, { fx: 'talk', cmd: 'talk_end' }, { fx: 'mic', open: false }],
    });
    expect(run([{ ev: 'fn', act: 'talk_start' }, { ev: 'fn', act: 'cancel' }]).fx).toContainEqual({ fx: 'talk', cmd: 'talk_cancel' });
    expect(run([{ ev: 'fn', act: 'talk_start' }, { ev: 'fn', act: 'talk_end' }, { ev: 'answer' }]).view).toEqual({ kind: 'answer' });
  });
  it("a talk the core ends without a send never stays on 'thinking…' (amb-core m_21857): its reason, nothing heard, or a card answered", () => {
    const talk: CapEvent[] = [{ ev: 'fn', act: 'talk_start' }, { ev: 'fn', act: 'talk_end' }];
    // a failure after his release (the listener): its reason in place of 'thinking…'
    expect(run([...talk, { ev: 'talk_over', said: 'voice needs a key. /voice picks one.' }]).view).toEqual({ kind: 'talk', phase: 'over', handsFree: false, said: 'voice needs a key. /voice picks one.' });
    // a failure at fn down (no key, no mic): shown at once, the mic closed, and his release keeps it
    const early = run([{ ev: 'fn', act: 'talk_start' }, { ev: 'talk_over', said: 'no mic' }, { ev: 'fn', act: 'talk_end' }]);
    expect(early.view).toEqual({ kind: 'talk', phase: 'over', handsFree: false, said: 'no mic' });
    expect(early.fx).toContainEqual({ fx: 'mic', open: false });
    expect(early.fx).not.toContainEqual({ fx: 'talk', cmd: 'talk_end' });
    expect(run([...talk, { ev: 'talk_over', said: "i didn't hear anything" }]).view).toMatchObject({ phase: 'over', said: "i didn't hear anything" });
    // a reason with where to fix it
    const link = { label: 'settings › voice', route: 'settings/voice' };
    expect(run([...talk, { ev: 'talk_over', said: 'bise needs a voice key to hear you.', link }]).view).toMatchObject({ phase: 'over', link });
    // his words answered a card (designer m_21945: not silent): said, then gone when its time is up
    const answered = run([...talk, { ev: 'talk_over', said: '✓ answered checkout', fades: true }]);
    expect(answered.view).toEqual({ kind: 'talk', phase: 'over', handsFree: false, said: '✓ answered checkout', fades: true });
    const gone = run([...talk, { ev: 'talk_over', said: '✓ answered checkout', fades: true }, { ev: 'over_gone' }]);
    expect(gone.view).toEqual(NONE);
    expect(gone.fx.at(-1)).toEqual({ fx: 'hide' });
    // a reason never fades; a talk started meanwhile is never closed by an old timer
    expect(run([...talk, { ev: 'talk_over', said: 'x' }, { ev: 'over_gone' }]).view).toMatchObject({ phase: 'over' });
    expect(run([...talk, { ev: 'talk_over', said: 'y', fades: true }, { ev: 'fn', act: 'talk_start' }, { ev: 'over_gone' }]).view).toMatchObject({ phase: 'listen' });
    // esc closes it; the next fn talks again
    expect(run([...talk, { ev: 'talk_over', said: 'x' }, { ev: 'fn', act: 'esc' }]).view).toEqual(NONE);
    expect(run([...talk, { ev: 'talk_over', said: 'x' }, { ev: 'fn', act: 'talk_start' }]).view).toEqual({ kind: 'talk', phase: 'listen', handsFree: false });
    // never outside a talk: an error elsewhere doesn't open the capsule, nor end an answer
    expect(run([{ ev: 'talk_over', said: 'x' }])).toEqual({ view: NONE, fx: [] });
    expect(run([...talk, { ev: 'answer' }, { ev: 'talk_over', said: 'x' }]).view).toEqual({ kind: 'answer' });
  });
  it('b3: a card is never pushed; one shows only from the spotlight (decision 2026-10-09, card #476)', () => {
    // no event shows a card by itself: the window's inbox block or the native notification does
    const pushes: CapEvent[] = [{ ev: 'answer' }, { ev: 'card_done', id: 'p.1' }, { ev: 'later' }, { ev: 'close' }, { ev: 'window', shown: false, why: 'blur' }];
    for (const e of pushes) expect(run([e])).toEqual({ view: NONE, fx: [] });
    expect(run([{ ev: 'open_card', id: 'p.1' }])).toEqual({ view: NONE, fx: [] });
    // the talk and the answer stay up when a card is answered elsewhere
    expect(run([{ ev: 'fn', act: 'talk_start' }, { ev: 'card_done', id: 'p.1' }]).view).toMatchObject({ kind: 'talk' });
  });
  it("fn up ends the core's talk even when another view replaced it (amb-core m_22290: a talk never ended refused every ctrl+r)", () => {
    const ends = (evs: CapEvent[]): number => run(evs).fx.filter((f) => (f as { fx?: string; cmd?: string }).fx === 'talk' && (f as { cmd?: string }).cmd === 'talk_end').length;
    // held, then the spotlight (fn space) before fn up: the end still goes, the spotlight stays
    const spot = run([{ ev: 'fn', act: 'talk_start' }, { ev: 'fn', act: 'key', key: 'space' }, { ev: 'fn', act: 'talk_end' }]);
    expect(spot.view).toEqual({ kind: 'spot' });
    expect(spot.fx.at(-1)).toEqual({ fx: 'talk', cmd: 'talk_end' });
    // the window hidden (a blur) before fn up
    expect(ends([{ ev: 'fn', act: 'talk_start' }, { ev: 'window', shown: false, why: 'blur' }, { ev: 'fn', act: 'talk_end' }])).toBe(1);
    // a card opened from the spotlight meanwhile
    expect(ends([{ ev: 'fn', act: 'talk_start' }, { ev: 'fn', act: 'key', key: 'space' }, { ev: 'open_card', id: 'p.1' }, { ev: 'fn', act: 'talk_end' }])).toBe(1);
    // hands-free: the next tap ends it, whatever the view
    expect(ends([{ ev: 'fn', act: 'double' }, { ev: 'fn', act: 'key', key: 'space' }, { ev: 'fn', act: 'tap' }])).toBe(1);
    // once only: a second fn up, an up after the core ended it, or an up with no talk sends nothing
    expect(ends([{ ev: 'fn', act: 'talk_start' }, { ev: 'fn', act: 'talk_end' }, { ev: 'fn', act: 'talk_end' }])).toBe(1);
    expect(ends([{ ev: 'fn', act: 'talk_start' }, { ev: 'fn', act: 'key', key: 'space' }, { ev: 'fn', act: 'talk_end' }, { ev: 'fn', act: 'talk_end' }])).toBe(1);
    expect(ends([{ ev: 'fn', act: 'talk_start' }, { ev: 'talk_over', said: 'no mic' }, { ev: 'fn', act: 'key', key: 'space' }, { ev: 'fn', act: 'talk_end' }])).toBe(0);
    expect(ends([{ ev: 'fn', act: 'talk_end' }])).toBe(0);
    // fn cancelled while replaced: the core's talk is cancelled
    expect(run([{ ev: 'fn', act: 'talk_start' }, { ev: 'fn', act: 'key', key: 'space' }, { ev: 'fn', act: 'cancel' }]).fx.at(-1)).toEqual({ fx: 'talk', cmd: 'talk_cancel' });
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
  it("one-inbox 3: a tray menu row (a click, fn+n) answers its card in place; esc and the answer go back to the menu", () => {
    const tray: CapEvent = { ev: 'window', shown: true, why: 'tray' };
    const open: CapEvent = { ev: 'open_card', id: 'p.4' };
    expect(run([tray, open]).view).toEqual({ kind: 'card', id: 'p.4', from: 'menu' });
    expect(run([tray, open, { ev: 'fn', act: 'esc' }]).view).toEqual({ kind: 'menu' });
    expect(run([tray, open, { ev: 'later' }]).view).toEqual({ kind: 'menu' });
    expect(run([tray, open, { ev: 'card_done', id: 'p.4' }]).view).toEqual({ kind: 'menu' });
    // the menu stays where the tray put it: no show, no hide on the way
    expect(run([tray, open, { ev: 'later' }]).fx).toEqual([]);
  });
  it('the tray click opens the dropdown; a blur that hid the window closes the view; fn i opens the inbox', () => {
    expect(run([{ ev: 'window', shown: true, why: 'tray' }]).view).toEqual({ kind: 'menu' });
    expect(run([{ ev: 'fn', act: 'key', key: 'space' }, { ev: 'window', shown: false, why: 'blur' }]).view).toEqual(NONE);
    expect(run([{ ev: 'fn', act: 'key', key: 'i' }]).fx).toEqual([{ fx: 'open', route: 'inbox' }]);
  });
});

const P = (p: Partial<ProjectRow> & { project: string }): ProjectRow => ({ name: p.project, path: `/Users/me/${p.project}`, git: true, home: false, order: 0, agents: 0, working: 0, waits: 0, running: true, ...p });
const A = (name: string, status: Agent['status']): Agent => ({ name, dir: name, main: false, status, archived: false, title: `${name} title`, purpose: '', since_ms: 0, waits: 0, watching: [] });
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
    // every card names its project as the window's inbox block does: 'bise' for the home's (one-inbox 3)
    expect(d.cards).toEqual([
      { id: 'home.2', agent: 'perf', project: 'home', text: 'go?', kind: 'question', pname: 'bise' },
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
    expect(ui.queryByTestId('capsule.menu.items')).toBeNull();
  });
  it("one-inbox 3: the tray menu lists the first 5 items as the block's rows, no age, a click opens one, the rest opens bise", () => {
    const cards = Array.from({ length: 7 }, (_, i) => ({ id: `tel.${String(i + 1)}`, agent: `p${String(i + 1)}`, project: 'tel', text: `ship ${String(i + 1)}?\nmore words`, kind: 'question' as const, pname: 'telemetry' }));
    const onOpenCard = vi.fn();
    const onOpenWindow = vi.fn();
    const ui = render(
      <Capsule
        view={{ kind: 'menu' }} spot={{ agents: [], projects: [], cards }} answer={null} heard="" level={0} still
        card={() => null} route={null} onRouteKeep={vi.fn()} onRouteTo={vi.fn()} onAsk={vi.fn()} onOpen={vi.fn()}
        onOpenCard={onOpenCard} onOpenWindow={onOpenWindow} onClose={vi.fn()} onQuit={null} onSize={vi.fn()}
      />,
    );
    expect(ui.getByTestId('capsule.menu.head').textContent).toBe('nobody at work · 7 waiting for you');
    expect(ui.queryByTestId('capsule.menu.item.6')).toBeNull();
    expect(ui.getByTestId('capsule.menu.item.1').textContent).toBe('1?p1ship 1?telemetry');
    ui.getByTestId('capsule.menu.item.2').click();
    expect(onOpenCard).toHaveBeenCalledWith('tel.2');
    expect(ui.getByTestId('capsule.menu.more').textContent).toBe('+ 2 more in the inbox');
    ui.getByTestId('capsule.menu.more').click();
    expect(onOpenWindow).toHaveBeenCalledWith('inbox');
  });
});

describe('the talk still (designer m_21903)', () => {
  const base: CapsuleProps = {
    view: { kind: 'talk', phase: 'listen', handsFree: false }, spot: { agents: [], projects: [], cards: [] }, answer: null, heard: 'what does this cost', level: 0, still: true,
    card: () => null, route: null, onRouteKeep: vi.fn(), onRouteTo: vi.fn(), onAsk: vi.fn(), onOpen: vi.fn(), onOpenWindow: vi.fn(), onClose: vi.fn(), onQuit: null, onSize: vi.fn(),
  };
  const shot = { file: '/h/images/ab12.png', app: 'Safari', title: 'Stripe pricing: pay as you go, per transaction, no fees' };
  it("the chip's words: the app, then the title cut with '…'; the app alone without one", () => {
    expect(shotName({ app: 'Safari', title: 'stripe.com' })).toBe('Safari · stripe.com');
    expect(shotName(shot)).toBe('Safari · Stripe pricing: pay as you go…');
    expect(shotName({ app: 'Notes', title: '' })).toBe('Notes');
    expect(shotOf({ file: null })).toBeNull();
    expect(shotOf({ file: '/a.png', app: 'Mail' })).toEqual({ file: '/a.png', app: 'Mail', title: '' });
  });
  it('while he talks: the row under his words, its ✕ drops it, the keys line says fn ⌫; thinking: the chip alone', () => {
    const onShotDrop = vi.fn();
    const ui = render(<Capsule {...base} shot={shot} onShotDrop={onShotDrop} />);
    expect(ui.getByTestId('capsule.shot.chip').textContent).toBe('Safari · Stripe pricing: pay as you go…');
    expect(ui.getByTestId('capsule.shot.chip').querySelector('img')?.getAttribute('src')).toBe('file:///h/images/ab12.png');
    expect(ui.getByTestId('capsule.keys').textContent).toBe('fn ⌫ no screenshot');
    ui.getByTestId('capsule.shot.drop').click();
    expect(onShotDrop).toHaveBeenCalledTimes(1);
    ui.rerender(<Capsule {...base} view={{ kind: 'talk', phase: 'think', handsFree: false }} shot={shot} onShotDrop={onShotDrop} />);
    expect(ui.getByTestId('capsule.shot')).toBeTruthy();
    expect(ui.queryByTestId('capsule.shot.drop')).toBeNull();
    expect(ui.queryByTestId('capsule.keys')).toBeNull();
    ui.rerender(<Capsule {...base} shot={null} />);
    expect(ui.queryByTestId('capsule.shot')).toBeNull();
  });
  it('the ask: only without Screen Recording and never asked; its two buttons', () => {
    expect(asksForScreen('ask', undefined)).toBe(true);
    expect(asksForScreen('denied', undefined)).toBe(true);
    expect(asksForScreen('allowed', undefined)).toBe(false);
    expect(asksForScreen('ask', false)).toBe(false);
    expect(asksForScreen(undefined, undefined)).toBe(false);
    expect(shotPref({ context: { shot: false } })).toBe(false);
    expect(shotPref({ context: {} })).toBeUndefined();
    const onOpen = vi.fn();
    const onLater = vi.fn();
    const ui = render(<Capsule {...base} screenAsk={{ onOpen, onLater }} />);
    expect(ui.getByTestId('capsule.ask').textContent).toContain("bise can see the window you're on when you talk. it needs Screen Recording for that.");
    ui.getByTestId('capsule.ask.open').click();
    ui.getByTestId('capsule.ask.later').click();
    expect([onOpen.mock.calls.length, onLater.mock.calls.length]).toEqual([1, 1]);
  });
});
