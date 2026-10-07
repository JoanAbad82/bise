import { describe, expect, it } from 'vitest';
import type { Agent, ProjectRow } from '@/proto';
import { keyAction, type KeyCtx, type KeyLike } from './keys';
import { paletteItems } from './Palette';

const row = (project: string, name: string, order: number, home = false): ProjectRow => ({ project, name, path: `/${name}`, git: !home, home, order, agents: 1, working: 0, waits: 0, running: true });
const ag = (name: string, over: Partial<Agent> = {}): Agent => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1, waits: 0, ...over });
const projects = [row('h', 'bise', 0, true), row('s', 'shop', 2), row('a', 'acme', 1)];
const agents: Record<string, Agent[]> = {
  h: [ag('main')],
  a: [ag('main'), ag('perf', { status: 'working', since_ms: 5 }), ag('docs', { status: 'working', since_ms: 3 }), ag('old', { archived: true })],
  s: [ag('main')],
};
const ctx = (over: Partial<KeyCtx> = {}): KeyCtx => ({ route: { screen: 'thread', project: 'a', agent: 'main' }, projects, agents: (p) => agents[p] ?? [], typing: false, ...over });
const k = (code: string, mods: Partial<KeyLike> = {}): KeyLike => ({ key: '', code, metaKey: false, altKey: false, ctrlKey: false, shiftKey: false, ...mods });

describe("the window's keys", () => {
  it('⌘0 bise, ⌘1-9 his projects in his order, nothing past the last', () => {
    expect(keyAction(k('Digit0', { metaKey: true }), ctx())).toEqual({ go: { screen: 'bise' } });
    expect(keyAction(k('Digit1', { metaKey: true }), ctx())).toEqual({ go: { screen: 'thread', project: 'a', agent: 'main' } });
    expect(keyAction(k('Digit2', { metaKey: true }), ctx())).toEqual({ go: { screen: 'thread', project: 's', agent: 'main' } });
    expect(keyAction(k('Digit3', { metaKey: true }), ctx())).toBeUndefined();
  });

  it("⌥0 the project's main, ⌥1-9 its live agents in the panel's order (by code: ⌥1 types '¡')", () => {
    expect(keyAction(k('Digit0', { altKey: true, key: 'º' }), ctx())).toEqual({ go: { screen: 'thread', project: 'a', agent: 'main' } });
    expect(keyAction(k('Digit1', { altKey: true, key: '¡' }), ctx())).toEqual({ go: { screen: 'thread', project: 'a', agent: 'perf' } });
    expect(keyAction(k('Digit2', { altKey: true }), ctx())).toEqual({ go: { screen: 'thread', project: 'a', agent: 'docs' } });
    expect(keyAction(k('Digit3', { altKey: true }), ctx())).toBeUndefined();
    // on bise's own screen, bise's agents
    expect(keyAction(k('Digit0', { altKey: true }), ctx({ route: { screen: 'bise' } }))).toEqual({ go: { screen: 'thread', project: 'h', agent: 'main' } });
  });

  it('⌘K palette, ⌘D changes / review, ⌘⇧A artifacts, ⌘E ⌘. ctrl+y to the screen, ⌘/ the key list', () => {
    expect(keyAction(k('KeyK', { metaKey: true }), ctx())).toEqual({ palette: true });
    expect(keyAction(k('KeyD', { metaKey: true }), ctx())).toEqual({ go: { screen: 'changes', project: 'a' } });
    expect(keyAction(k('KeyD', { metaKey: true }), ctx({ route: { screen: 'thread', project: 'a', agent: 'perf' } }))).toEqual({ go: { screen: 'review', project: 'a', agent: 'perf' } });
    expect(keyAction(k('KeyA', { metaKey: true, shiftKey: true }), ctx())).toEqual({ go: { screen: 'artifacts', project: 'a' } });
    expect(keyAction(k('KeyE', { metaKey: true }), ctx())).toEqual({ screen: 'fold-all' });
    expect(keyAction(k('Period', { metaKey: true }), ctx())).toEqual({ screen: 'stop' });
    expect(keyAction(k('KeyY', { ctrlKey: true }), ctx())).toEqual({ screen: 'copy-code' });
    expect(keyAction(k('Slash', { metaKey: true }), ctx())).toEqual({ help: true });
    // editing keys are not the window's
    expect(keyAction(k('KeyC', { metaKey: true }), ctx())).toBeUndefined();
    expect(keyAction(k('KeyA', { metaKey: true }), ctx())).toBeUndefined();
  });

  it('end and ⌥↑↓ only when no text is being typed', () => {
    expect(keyAction({ ...k('End'), key: 'End' }, ctx())).toEqual({ screen: 'to-end' });
    expect(keyAction({ ...k('End'), key: 'End' }, ctx({ typing: true }))).toBeUndefined();
    expect(keyAction({ ...k('ArrowDown', { altKey: true }), key: 'ArrowDown' }, ctx())).toEqual({ go: { screen: 'thread', project: 'a', agent: 'perf' } });
    expect(keyAction({ ...k('ArrowUp', { altKey: true }), key: 'ArrowUp' }, ctx({ route: { screen: 'thread', project: 'a', agent: 'docs' } }))).toEqual({ go: { screen: 'thread', project: 'a', agent: 'perf' } });
    expect(keyAction({ ...k('ArrowDown', { altKey: true }), key: 'ArrowDown' }, ctx({ typing: true }))).toBeUndefined();
  });
});

describe('the agent palette', () => {
  it('every agent, bise first then his order, archived last; a query ranks name prefix first', () => {
    const all = paletteItems(projects, (p) => agents[p] ?? [], '');
    expect(all.map((i) => `${i.projectName}/${i.agent.name}`)).toEqual(['bise/main', 'acme/main', 'acme/perf', 'acme/docs', 'shop/main', 'acme/old']);
    expect(paletteItems(projects, (p) => agents[p] ?? [], 'do').map((i) => i.agent.name)).toEqual(['docs']);
    expect(paletteItems(projects, (p) => agents[p] ?? [], 'shop').map((i) => i.projectName)).toEqual(['shop']);
  });
});

describe('the key list (amb-web 1e60fbd6)', () => {
  it('? opens it when not typing, never in a field with text', () => {
    const q = { key: '?', code: 'Slash', metaKey: false, altKey: false, ctrlKey: false, shiftKey: true };
    expect(keyAction(q, { route: { screen: 'bise' }, projects: [], agents: () => [], typing: false })).toEqual({ help: true });
    expect(keyAction(q, { route: { screen: 'bise' }, projects: [], agents: () => [], typing: true })).toBeUndefined();
  });
});
