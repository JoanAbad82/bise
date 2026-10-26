// The panel per project (his m_45500, architect m_45519 #6): the laws of scope.ts, and the live
// state's (state.ts) across a switch and a restart.
import { beforeEach, describe, expect, it } from 'vitest';
import type { Route } from '@/app/route';
import { dropGoneArts, FIRST, FOLDED, openIn, type TabWhat, type Tabs } from './model';
import { EMPTY_REC, isFlat, parseRec, pruneScopes, putView, scopeOf, switchTo, viewOf } from './scope';
import { activateTab, closeTabBack, openWhat, panelScope, panelState, panelToggle, setArtShare, setWidth } from './state';

const art = (project: string, id: string): TabWhat => ({ kind: 'thing', e: { kind: 'artifact', project, id } });
const ids = (t: Tabs) => t.list.map((x) => x.id);
const thread = (project: string): Route => ({ screen: 'thread', project, agent: 'main' });
/** A restart: the window reads back what it kept, as keep gives it (JSON). */
const restart = () => {
  panelState.reset(JSON.parse(JSON.stringify(panelState.rec())));
};

describe('scopeOf: the project whose panel shows', () => {
  it("is the route's project; bise's screen is the home's; a screen of no project keeps the one before", () => {
    expect(scopeOf(thread('acme'), 'home', 'x')).toBe('acme');
    expect(scopeOf({ screen: 'bise' }, 'home', 'x')).toBe('home');
    expect(scopeOf({ screen: 'bise' }, undefined, 'x')).toBe('x');
    expect(scopeOf({ screen: 'inbox' }, 'home', 'acme')).toBe('acme');
    expect(scopeOf({ screen: 'settings' }, 'home', 'acme')).toBe('acme');
  });
});

describe('the record per project (pure)', () => {
  it('A → B → A gives back A as it was; B shows its own; a project that never opened one has none', () => {
    const a = { ...FOLDED, open: true, tabs: openIn(FIRST, art('p1', 'a')), width: 500, dragged: true };
    let rec = putView(switchTo(EMPTY_REC, 'p1'), a);
    rec = switchTo(rec, 'p2');
    expect(viewOf(rec).open).toBe(false);
    expect(ids(viewOf(rec).tabs)).toEqual(['overview']);
    const b = { ...viewOf(rec), open: true, tabs: openIn(FIRST, art('p2', 'b')) };
    rec = putView(rec, b);
    rec = switchTo(rec, 'p1');
    expect(viewOf(rec)).toEqual(a);
    expect(viewOf(switchTo(rec, 'p2')).tabs).toEqual(b.tabs);
  });
  it('set writes only the scope in front; Recent and shares are the window’s', () => {
    let rec = putView(switchTo(EMPTY_REC, 'p1'), { ...FOLDED, open: true });
    rec = switchTo(rec, 'p2');
    const before = rec.byProject['p1'];
    rec = putView(rec, { ...viewOf(rec), width: 600, recent: [{ kind: 'artifact', project: 'p2', id: 'r' }], shares: { sheet: 0.65 } });
    expect(rec.byProject['p1']).toBe(before);
    expect(viewOf(switchTo(rec, 'p1')).recent).toEqual([{ kind: 'artifact', project: 'p2', id: 'r' }]);
    expect(viewOf(switchTo(rec, 'p1')).shares).toEqual({ sheet: 0.65 });
    expect(viewOf(switchTo(rec, 'p1')).width).toBe(FOLDED.width);
  });
  it('reads back what it wrote; anything unreadable is dropped', () => {
    const rec = putView(switchTo(EMPTY_REC, 'p1'), { ...FOLDED, open: true, tabs: openIn(FIRST, art('p1', 'a')), width: 520 });
    expect(parseRec(JSON.parse(JSON.stringify(rec)))).toEqual(rec);
    expect(parseRec('junk')).toEqual(EMPTY_REC);
    expect(parseRec({ at: 'p1', byProject: { '': { open: true }, p2: 7 } }).byProject).toEqual({});
  });
  it('a flat record from before becomes the panel of the first project in front (TODO(panel-scope))', () => {
    const flat = { open: true, tabs: { list: [{ what: { kind: 'overview' } }, { what: art('p1', 'a') }], active: 'artifact:p1/a' }, width: 500, dragged: true, recent: [], shares: { sheet: 0.6 } };
    expect(isFlat(flat)).toBe(true);
    expect(isFlat(parseRec(flat, 'p1'))).toBe(false);
    const rec = parseRec(flat, 'p1');
    expect(rec.at).toBe('p1');
    expect(viewOf(rec).open).toBe(true);
    expect(viewOf(rec).tabs.active).toBe(viewOf(rec).tabs.list[1]?.id);
    expect(viewOf(rec).width).toBe(500);
    expect(viewOf(rec).shares).toEqual({ sheet: 0.6 });
  });
  it('a full projects list drops the panels of projects gone; an empty one drops nothing', () => {
    let rec = putView(switchTo(EMPTY_REC, 'p1'), { ...FOLDED, open: true });
    rec = putView(switchTo(rec, 'p2'), { ...FOLDED, open: true });
    expect(pruneScopes(rec, [])).toBe(rec);
    expect(pruneScopes(rec, ['p1', 'p2'])).toBe(rec);
    expect(Object.keys(pruneScopes(rec, ['p2', 'home']).byProject)).toEqual(['p2']);
    // the project in front removed (architect m_45552): its panel goes, the window shows none
    const gone = pruneScopes(rec, ['p1', 'home']);
    expect(gone.at).toBe('p2');
    expect(viewOf(gone)).toEqual(FOLDED);
  });
  it("an artifact tab whose artifact is gone goes, once its project's artifacts came", () => {
    const t = openIn(openIn(FIRST, art('p1', 'a')), art('p1', 'b'));
    expect(ids(dropGoneArts(t, () => undefined))).toEqual(ids(t));
    const out = dropGoneArts(t, () => new Set(['b']));
    expect(ids(out)).toEqual(['overview', 'artifact:p1/b']);
    expect(out.active).toBe('artifact:p1/b');
  });
});

describe('the live panel per project (state.ts)', () => {
  beforeEach(() => {
    panelState.reset();
  });
  it('the law: tabs A in project 1, B in project 2; back to 1 shows A (same front, same width), back to 2 shows B; after a restart the same', () => {
    panelScope('p1');
    openWhat(art('p1', 'a'));
    openWhat(art('p1', 'a2'));
    activateTab('artifact:p1/a');
    setWidth(520);
    const one = panelState.get();
    panelScope('p2');
    expect(panelState.get().open).toBe(false);
    openWhat(art('p2', 'b'));
    const two = panelState.get();
    panelScope('p1');
    expect(panelState.get().tabs).toEqual(one.tabs);
    expect(panelState.get().tabs.active).toBe('artifact:p1/a');
    expect(panelState.get().width).toBe(520);
    expect(panelState.get().open).toBe(true);
    panelScope('p2');
    expect(panelState.get().tabs).toEqual(two.tabs);
    restart();
    expect(panelState.get().tabs).toEqual(two.tabs);
    panelScope('p1');
    expect(panelState.get().tabs).toEqual(one.tabs);
    expect(panelState.get().width).toBe(520);
    panelScope('p2');
    expect(panelState.get().tabs).toEqual(two.tabs);
    expect(panelState.get().width).toBe(two.width);
  });
  it('a folded panel stays folded in its project, an open one open in its own', () => {
    panelScope('p1');
    panelToggle();
    panelScope('p2');
    expect(panelState.get().open).toBe(false);
    panelScope('p1');
    expect(panelState.get().open).toBe(true);
  });
  it("esc's memory of what was in front is per project", () => {
    panelScope('p1');
    openWhat({ kind: 'launcher', n: 1 });
    panelScope('p2');
    openWhat({ kind: 'browser', n: 1 });
    openWhat({ kind: 'launcher', n: 1 });
    // esc on p2's new:1 goes back to p2's browser tab, not to how p1 was
    closeTabBack('new:1');
    expect(panelState.get().open).toBe(true);
    expect(panelState.get().tabs.active).toBe('web:1');
    panelScope('p1');
    closeTabBack('new:1');
    expect(panelState.get().open).toBe(false);
  });
  it('his artifact shares are the same in every project', () => {
    panelScope('p1');
    setArtShare('sheet', 0.66);
    panelScope('p2');
    expect(panelState.get().shares).toEqual({ sheet: 0.66 });
  });
  it('a flat record from before opens as the first project in front, his tabs kept', () => {
    panelState.reset({ open: true, tabs: { list: [{ what: { kind: 'overview' } }, { what: art('p1', 'a') }], active: 'artifact:p1/a' }, width: 500, dragged: true, recent: [], shares: {} });
    panelScope('p1');
    expect(panelState.get().open).toBe(true);
    expect(panelState.get().tabs.active).toBe('artifact:p1/a');
    panelScope('p2');
    expect(panelState.get().open).toBe(false);
  });
});
