// The sidebar's signs and words, the frame's widths (designer's desktop-screens v6/v7, signed).
import { describe, expect, it } from 'vitest';
import type { Agent, ProjectRow } from '@/proto';
import { crumbOf, folds, moreWords, panelAt, panelProject, projectSide, signOf, turnShort } from './side';
import { keyAction, type KeyLike } from './keys';
import { newWords } from './Sidebar';

const NOW = new Date(2026, 9, 7, 14, 0).getTime();
const agent = (name: string, status: Agent['status'], over: Partial<Agent> = {}): Agent => ({
  name, main: false, status, archived: false, title: 'product page speed', purpose: '', since_ms: NOW - 60_000, waits: 0, ...over,
});
const row = (over: Partial<ProjectRow> = {}): ProjectRow => ({ project: 'acme-1', name: 'storefront', path: '/x', git: true, home: false, order: 1, agents: 3, working: 0, waits: 0, running: true, ...over });

describe('an agent sign', () => {
  it('asks him first: ? in the accent with his pink count, no end words', () => {
    expect(signOf(agent('search', 'working', { waits: 1 }), NOW)).toMatchObject({ g: '?', tone: 'acc', end: '', count: 1 });
  });
  it('at work: ∿ in ink and its turn time', () => {
    expect(signOf(agent('perf', 'working', { turn_ms: 14 * 60_000 }), NOW)).toMatchObject({ g: '∿', tone: 'ink', end: '14m', count: 0 });
    expect(signOf(agent('perf', 'working', { since_ms: NOW - 6 * 60_000 }), NOW).end).toBe('6m');
  });
  it('waiting on someone: ⋯ with who on hover; failed: ✗ and failed in err', () => {
    const w = signOf(agent('a', 'waiting'), NOW);
    expect(w).toMatchObject({ g: '⋯', end: 'waiting' });
    expect(w.title).toBe('waiting · product page speed');
    expect(signOf(agent('ci-fix', 'failed'), NOW)).toMatchObject({ g: '✗', tone: 'err', end: 'failed', endTone: 'err' });
  });
  it('a next wake: ◷ and its time; done: ✓ done in text-2; at rest: – stopped', () => {
    const wake = new Date(2026, 9, 7, 14, 20).getTime();
    expect(signOf(agent('deploy-watch', 'idle'), NOW, wake)).toMatchObject({ g: '◷', end: '14:20' });
    expect(signOf(agent('size-filter', 'done'), NOW)).toMatchObject({ g: '✓', tone: 'dim', end: 'done' });
    expect(signOf(agent('x', 'idle'), NOW)).toMatchObject({ g: '–', end: 'stopped' });
  });
  it('turn words are short', () => {
    expect([turnShort(40_000), turnShort(6 * 60_000), turnShort(72 * 60_000), turnShort(120 * 60_000)]).toEqual(['40s', '6m', '1h 12m', '2h']);
  });
});

describe('the fold of quiet agents', () => {
  it('folds a done agent quiet for over an hour, never one at rest, that waits, works, failed or wakes', () => {
    const old = NOW - 61 * 60_000;
    expect(folds(agent('a', 'done', { since_ms: old }), NOW)).toBe(true);
    expect(folds(agent('a', 'idle', { since_ms: old }), NOW)).toBe(false);
    expect(folds(agent('a', 'done', { since_ms: NOW - 59 * 60_000 }), NOW)).toBe(false);
    expect(folds(agent('a', 'done', { since_ms: old, waits: 1 }), NOW)).toBe(false);
    expect(folds(agent('a', 'failed', { since_ms: old }), NOW)).toBe(false);
    expect(folds(agent('a', 'done', { since_ms: old }), NOW, NOW + 1000)).toBe(false);
  });
  it("says '3 more today', or '3 more' when one is older than today", () => {
    const today = [1, 2, 3].map((i) => agent(`a${String(i)}`, 'done', { since_ms: NOW - 3 * 3_600_000 }));
    expect(moreWords(today, NOW)).toBe('3 more today');
    expect(moreWords([...today.slice(1), agent('old', 'done', { since_ms: NOW - 86_400_000 })], NOW)).toBe('3 more');
  });
});

describe("a project's row", () => {
  it("'∿ 2' and his pink count; 'all quiet' when nothing moves; a gone folder or a refusal in err", () => {
    expect(projectSide(row({ working: 2, waits: 1 }))).toEqual({ text: '∿ 2', err: false, count: 1 });
    expect(projectSide(row())).toEqual({ text: 'all quiet', err: false, count: 0 });
    expect(projectSide(row({ waits: 2 }))).toEqual({ text: '', err: false, count: 2 });
    expect(projectSide(row({ missing: true }))).toMatchObject({ text: 'folder gone', err: true });
  });
});

describe('the frame', () => {
  it('the panel: open by default from 1100 px, closed below, his choice kept, sliding over under 1000 px', () => {
    expect(panelAt(1400, undefined)).toEqual({ docked: true, open: true });
    expect(panelAt(1050, undefined)).toEqual({ docked: true, open: false });
    expect(panelAt(1400, false)).toEqual({ docked: true, open: false });
    expect(panelAt(1050, true)).toEqual({ docked: true, open: true });
    expect(panelAt(800, true)).toEqual({ docked: false, open: false });
  });
  it("the panel's project: the route's, every project's on bise's thread, none without a project or on the global screens", () => {
    expect(panelProject({ screen: 'thread', project: 'p', agent: 'perf' }, 'h', 1)).toBe('p');
    expect(panelProject({ screen: 'bise' }, 'h', 2), "bise's own thread: every project's").toBe('');
    expect(panelProject({ screen: 'thread', project: 'h', agent: 'main' }, 'h', 2)).toBe('');
    expect(panelProject({ screen: 'bise' }, 'h', 0), 'no project yet: no panel').toBeUndefined();
    expect(panelProject({ screen: 'artifacts', project: '' }, 'h', 2)).toBeUndefined();
    expect(panelProject({ screen: 'settings' }, 'h', 2)).toBeUndefined();
  });
  it("the crumb: 'storefront › perf', a project's main is the project", () => {
    const name = () => 'storefront';
    expect(crumbOf({ screen: 'thread', project: 'p', agent: 'perf' }, name)).toEqual(['storefront', 'perf']);
    expect(crumbOf({ screen: 'thread', project: 'p', agent: 'main' }, name)).toEqual(['storefront']);
    expect(crumbOf({ screen: 'scheduled' }, name)).toEqual(['scheduled']);
  });
  it('the keys: ⌘\\ the sidebar, ⌥⌘0 the panel, ⌘N add a project, ⌘, settings', () => {
    const k = (code: string, m: Partial<KeyLike> = {}): KeyLike => ({ key: '', code, metaKey: true, altKey: false, ctrlKey: false, shiftKey: false, ...m });
    const ctx = { route: { screen: 'bise' as const }, projects: [], agents: () => [], typing: false };
    expect(keyAction(k('Backslash'), ctx)).toEqual({ frame: 'sidebar' });
    expect(keyAction(k('Digit0', { altKey: true }), ctx)).toEqual({ frame: 'panel' });
    expect(keyAction(k('Digit0'), ctx)).toEqual({ go: { screen: 'bise' } });
    expect(keyAction(k('KeyN'), ctx)).toEqual({ go: { screen: 'settings', page: 'projects' } });
    expect(keyAction(k('Comma'), ctx)).toEqual({ go: { screen: 'settings' } });
  });
});

describe("the artifacts row's new ones (tui-parity R17)", () => {
  it("'1 new · designer' when one agent made them, '3 new' from several, nothing when none", () => {
    expect(newWords(1, ['designer'])).toBe('1 new · designer');
    expect(newWords(3, ['perf', 'search'])).toBe('3 new');
    expect(newWords(0, [])).toBe('');
  });
});
