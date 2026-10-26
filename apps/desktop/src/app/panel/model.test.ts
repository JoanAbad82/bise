import { describe, expect, it } from 'vitest';
import {
  activate,
  fitW,
  clampW,
  closable,
  closeIn,
  closeOthers,
  dropGone,
  FIRST,
  fitTabs,
  FOLDED,
  MAX_W,
  MIN_W,
  moveIn,
  nextBrowser,
  tabIdOf,
  nextLauncher,
  nextShell,
  openIn,
  parseKept,
  pushRecent,
  RECENT_MAX,
  shownOf,
  stepIn,
  widenFor,
  widthOf,
  WIDTHS,
  type TabWhat,
  type Tabs,
} from './model';

const art = (id: string): TabWhat => ({ kind: 'thing', e: { kind: 'artifact', project: 'acme', id } });
const agent = (name: string, project = 'acme'): TabWhat => ({ kind: 'thing', e: { kind: 'agent', project, agent: name } });
const ids = (t: Tabs | undefined) => t?.list.map((x) => x.id);

describe('the tab model: open', () => {
  it('a fresh panel is Overview alone', () => {
    expect(ids(FIRST)).toEqual(['overview']);
    expect(FIRST.active).toBe('overview');
  });
  it('a new thing goes right after the tab in front and comes to the front', () => {
    let t = openIn(FIRST, art('a'));
    t = openIn(t, art('b'));
    expect(ids(t)).toEqual(['overview', 'artifact:acme/a', 'artifact:acme/b']);
    t = activate(t, 'overview');
    t = openIn(t, art('c'));
    expect(ids(t)).toEqual(['overview', 'artifact:acme/c', 'artifact:acme/a', 'artifact:acme/b']);
    expect(t.active).toBe('artifact:acme/c');
  });
  it('an open thing comes to the front, never twice', () => {
    let t = openIn(openIn(FIRST, art('a')), art('b'));
    t = openIn(t, art('a'));
    expect(ids(t)).toEqual(['overview', 'artifact:acme/a', 'artifact:acme/b']);
    expect(t.active).toBe('artifact:acme/a');
  });
  it("a pick from New tab takes the launcher's place, as a browser's tab becomes the page", () => {
    let t = openIn(FIRST, nextLauncher(FIRST));
    expect(t.active).toBe('new:1');
    t = openIn(t, art('a'), 'new:1');
    expect(ids(t)).toEqual(['overview', 'artifact:acme/a']);
  });
  it('a pick of an open thing from New tab closes the launcher', () => {
    let t = openIn(FIRST, art('a'));
    t = openIn(t, nextLauncher(t));
    t = openIn(t, art('a'), 'new:1');
    expect(ids(t)).toEqual(['overview', 'artifact:acme/a']);
    expect(t.active).toBe('artifact:acme/a');
  });
  it('an Overview pinned to a project keeps its one tab and takes the project', () => {
    const t = openIn(FIRST, { kind: 'overview', project: 'shop' });
    expect(t.list).toEqual([{ id: 'overview', what: { kind: 'overview', project: 'shop' } }]);
  });
  it('New tabs and shells are numbered by the first free number', () => {
    const t = openIn(openIn(FIRST, nextLauncher(FIRST)), { kind: 'terminal', project: 'acme', n: 0 });
    expect(nextLauncher(t)).toEqual({ kind: 'launcher', n: 2 });
    expect(nextLauncher(t, true)).toEqual({ kind: 'launcher', n: 2, artifacts: true });
    expect(nextBrowser(t)).toEqual({ kind: 'browser', n: 1 });
    expect(tabIdOf({ kind: 'browser', n: 1 })).toBe('web:1');
    expect(widthOf({ kind: 'browser', n: 1 })).toBe('page');
    expect(nextShell(t, 'acme')).toBe(1);
    expect(nextShell(t, 'shop')).toBe(0);
  });
});

describe('the tab model: close, reorder, step', () => {
  const three = openIn(openIn(openIn(FIRST, art('a')), art('b')), art('c'));
  it('closing the tab in front brings its right neighbour, else its left one', () => {
    const t = activate(three, 'artifact:acme/b');
    expect(closeIn(t, 'artifact:acme/b').active).toBe('artifact:acme/c');
    expect(closeIn(three, 'artifact:acme/c').active).toBe('artifact:acme/b');
  });
  it('closing another tab keeps the one in front', () => {
    expect(closeIn(three, 'artifact:acme/a').active).toBe('artifact:acme/c');
  });
  it('Overview, the home, never closes (no ×)', () => {
    expect(closable('overview')).toBe(false);
    expect(closable('artifact:acme/a')).toBe(true);
    expect(closeIn(FIRST, 'overview')).toBe(FIRST);
    expect(closeIn(three, 'overview')).toBe(three);
  });
  it('close others keeps that one and Overview', () => {
    expect(ids(closeOthers(three, 'artifact:acme/a'))).toEqual(['overview', 'artifact:acme/a']);
    expect(ids(closeOthers(three, 'overview'))).toEqual(['overview']);
  });
  it('a drag moves a tab to its place, the others keep their order', () => {
    expect(ids(moveIn(three, 'artifact:acme/c', 0))).toEqual(['artifact:acme/c', 'overview', 'artifact:acme/a', 'artifact:acme/b']);
    expect(ids(moveIn(three, 'overview', 9))).toEqual(['artifact:acme/a', 'artifact:acme/b', 'artifact:acme/c', 'overview']);
    expect(moveIn(three, 'nope', 0)).toBe(three);
  });
  it('⌘⇧] and ⌘⇧[ step round the ends', () => {
    expect(stepIn(three, 1).active).toBe('overview');
    expect(stepIn(three, -1).active).toBe('artifact:acme/b');
    expect(stepIn(FIRST, 1)).toBe(FIRST);
  });
});

describe('the tab model: six at most in the bar (HIG), the rest in the overflow menu', () => {
  let many: Tabs = FIRST;
  for (const id of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) many = openIn(many, art(id));
  it('the first six show, the rest overflow', () => {
    const t = activate(many, 'overview');
    const { shown, over } = shownOf(t);
    expect(shown).toHaveLength(6);
    expect(over.map((x) => x.id)).toEqual(['artifact:acme/f', 'artifact:acme/g']);
  });
  it('the tab in front always shows: past the sixth it takes the sixth place', () => {
    const { shown, over } = shownOf(many);
    expect(shown.at(-1)?.id).toBe('artifact:acme/g');
    expect(over.map((x) => x.id)).toEqual(['artifact:acme/e', 'artifact:acme/f']);
  });
  it('six or fewer: nothing overflows', () => {
    expect(shownOf(FIRST).over).toEqual([]);
  });
  it('tabs at their own widths: only what really does not fit goes to ⌄ N, six at most, one at least (designer m_43050 #5)', () => {
    // Overview 92, Perf notes 120, New tab 96 in the 320 a 384 panel leaves them: all three
    expect(fitTabs([92, 120, 96], 2, 320)).toBe(3);
    expect(fitTabs([92, 120, 96], 2, 250)).toBe(2);
    // 64 and 180 bound a tab's width
    expect(fitTabs([10, 10, 10], 0, 200)).toBe(3);
    expect(fitTabs([500, 500], 0, 370)).toBe(2);
    expect(fitTabs(Array.from({ length: 9 }, () => 64), 0, 2000)).toBe(6);
    expect(fitTabs([180, 180], 1, 100)).toBe(1);
    // the one in front takes the last place: its own width counts there
    expect(fitTabs([64, 64, 64, 180], 3, 64 * 2 + 180 + 8)).toBe(3);
    const t = activate(many, 'overview');
    expect(shownOf(t, fitTabs([92, 120, 120], 0, 250)).shown.map((x) => x.id)).toEqual(['overview', 'artifact:acme/a']);
  });
});

describe("the tab model: an agent's tabs go with the agent (a rename changes its key)", () => {
  const t = openIn(openIn(openIn(FIRST, agent('perf')), agent('docs')), { kind: 'thing', e: { kind: 'diff', project: 'acme', agent: 'perf' } });
  it('drops the tabs of agents no longer in the rows', () => {
    const out = dropGone(t, () => new Set(['main', 'docs']));
    expect(ids(out)).toEqual(['overview', 'agent:acme/docs']);
  });
  it("keeps a project's tabs while its rows haven't come", () => {
    expect(dropGone(t, () => undefined)).toBe(t);
  });
});

describe('the panel width (page native-mac §6: 384; mockup 2: 480; mockup 4: 640)', () => {
  it('each kind of tab asks its width', () => {
    expect(widthOf({ kind: 'overview' })).toBe('rows');
    expect(widthOf({ kind: 'launcher', n: 1 })).toBe('rows');
    expect(widthOf({ kind: 'terminal', project: 'acme', n: 0 })).toBe('shell');
    expect(widthOf(art('a'))).toBe('page');
    expect(WIDTHS).toEqual({ rows: 384, shell: 480, page: 640 });
  });
  it('one width per window: a page newly opened widens it once to 640, never after his drag (designer m_43050 #7a)', () => {
    expect(FOLDED.width).toBe(384);
    expect(widenFor(FOLDED, art('a'))).toBe(640);
    expect(widenFor(FOLDED, { kind: 'terminal', project: 'acme', n: 0 })).toBe(384);
    expect(widenFor(FOLDED, { kind: 'launcher', n: 1 })).toBe(384);
    expect(widenFor({ ...FOLDED, width: 500, dragged: true }, art('a'))).toBe(500);
    expect(parseKept({ widths: { rows: 500 } }).width).toBe(384);
  });
  it('the thread keeps 560 beside the left: a wide tab caps (ui-review m_42509)', () => {
    expect(fitW(640, 1440, 296)).toEqual({ width: 584, over: false });
    expect(fitW(640, 1920, 296)).toEqual({ width: 640, over: false });
    expect(fitW(384, 1440, 296)).toEqual({ width: 384, over: false });
    expect(fitW(640, 1176, 296)).toEqual({ width: 320, over: false });
  });
  it('no room for 320 beside a 560 thread: a sheet over it, never a thread under 560 (ui-review m_42619 #3)', () => {
    expect(fitW(640, 1100, 296)).toEqual({ width: 640, over: true });
    expect(fitW(384, 1100, 296)).toEqual({ width: 384, over: true });
    expect(fitW(640, 800, 296)).toEqual({ width: 504, over: true });
  });
  it('a drag stays from 320 to 640', () => {
    expect(clampW(100)).toBe(MIN_W);
    expect(clampW(900)).toBe(MAX_W);
    expect(clampW(400.4)).toBe(400);
    expect(clampW(Number.NaN)).toBe(384);
  });
});

describe('Recent', () => {
  it('newest first, once, eight at most', () => {
    const e = (id: string) => ({ kind: 'artifact' as const, project: 'acme', id });
    let r = pushRecent([], e('a'));
    r = pushRecent(r, e('b'));
    r = pushRecent(r, e('a'));
    expect(r.map((x) => (x.kind === 'artifact' ? x.id : ''))).toEqual(['a', 'b']);
    for (let i = 0; i < 20; i++) r = pushRecent(r, e(String(i)));
    expect(r).toHaveLength(RECENT_MAX);
  });
});

describe('the kept record (kept per window, read back after a reload)', () => {
  it('a record without Overview gets it back first (the home)', () => {
    expect(ids(parseKept({ tabs: { list: [{ what: { kind: 'launcher', n: 1 } }] } }).tabs)).toEqual(['overview', 'new:1']);
    expect(parseKept({ tabs: { list: [{ what: { kind: 'launcher', n: 1, artifacts: true } }, { what: { kind: 'browser', n: 2 } }] } }).tabs.list.map((x) => x.what)).toEqual([{ kind: 'overview' }, { kind: 'launcher', n: 1, artifacts: true }, { kind: 'browser', n: 2 }]);
  });
  it('a broken or missing record reads folded, on Overview', () => {
    expect(parseKept(undefined)).toEqual(FOLDED);
    expect(parseKept('x')).toEqual(FOLDED);
    expect(FOLDED.open).toBe(false);
  });
  it('reads its tabs back, drops what it cannot read and a double', () => {
    const k = parseKept({
      open: true,
      tabs: {
        active: 'artifact:acme/a',
        list: [{ what: { kind: 'overview' } }, { what: { kind: 'thing', e: { kind: 'artifact', project: 'acme', id: 'a' } } }, { what: { kind: 'thing', e: { kind: 'artifact', project: '', id: 'b' } } }, { what: { kind: 'bogus' } }, { what: { kind: 'overview' } }],
      },
      width: 9999,
      dragged: true,
      recent: [{ kind: 'pr', project: 'acme', number: 6 }, { kind: 'pr' }],
    });
    expect(k.open).toBe(true);
    expect(ids(k.tabs)).toEqual(['overview', 'artifact:acme/a']);
    expect(k.tabs.active).toBe('artifact:acme/a');
    expect(k.width).toBe(640);
    expect(k.dragged).toBe(true);
    expect(k.recent).toEqual([{ kind: 'pr', project: 'acme', number: 6 }]);
  });
  it('a tab in front that is gone falls back to the first', () => {
    const k = parseKept({ tabs: { active: 'nope', list: [{ what: { kind: 'terminal', project: 'acme', n: 1 } }] } });
    expect(k.tabs.active).toBe('overview');
  });
  it('round-trips what it wrote', () => {
    const k = { ...FOLDED, open: true, tabs: openIn(FIRST, art('a')) };
    expect(parseKept(JSON.parse(JSON.stringify(k)))).toEqual(k);
  });
});
