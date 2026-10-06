import { describe, expect, it } from 'vitest';
import { app_cmd, core_ev, hub_cmd, hub_ev } from '@/proto/fixtures.gen';
import type { Entry } from '@/proto';
import type { CoreCmd } from '@/shared/api';
import { allFixtureEvents, replay } from './replay';
import { Store, TAGS, threadKey, typed } from './store';

const P = 'acme-1a2b3c4d';
const K = threadKey(P, 'perf');

function fake(): { sent: CoreCmd[]; store: Store } {
  const sent: CoreCmd[] = [];
  const store = new Store({ send: (c) => sent.push(c) }, { now: () => 1000 });
  store.setCore('up');
  return { sent, store };
}

const entry = (pos: number, text: string, kind: Entry['kind'] = 'agent'): Entry => ({ pos, at_ms: pos, kind, text });

describe('store', () => {
  it('takes every fixture event and skips unknown tags', () => {
    const { store } = fake();
    const events = allFixtureEvents();
    expect(replay(store, events)).toBe(events.length);
    expect(store.apply({ ev: 'spotlight_hint', project: P, text: 'a newer hub' })).toBe(false);
    expect(store.apply({ cmd: 'approve' })).toBe(false);
    expect(store.apply('not an object')).toBe(false);
    expect(store.apply({ ev: 'state', phase: 'idle' })).toBe(false);
  });

  it('knows every tag of the fixtures (TAGS is the generated unions)', () => {
    for (const ev of [...core_ev, ...hub_ev]) expect(Object.hasOwn(TAGS, ev.ev)).toBe(true);
    expect(typed({ ev: 'welcome' })).not.toBeNull();
  });

  it('merges thread pages and keeps the newest page before/more after an older page', () => {
    const { store } = fake();
    replay(store, hub_ev.filter((e) => e.ev === 'thread'));
    const v = store.threadOrder(K);
    expect(v.loaded).toBe(true);
    expect([...v.order]).toEqual([...v.order].sort((a, b) => a - b));
    expect(v.order).toContain(200);
    expect(v.order).toContain(1);
  });

  it('an entry replaces only that entry: other entries keep their object', () => {
    const { store } = fake();
    store.apply({ ev: 'thread', project: P, agent: 'perf', entries: [entry(1, 'a'), entry(2, 'b')], before: null, more: false });
    const one = store.entry(K, 1);
    const order = store.threadOrder(K);
    const seen: string[] = [];
    store.subscribe(`entry:${K}:1`, () => seen.push('1'));
    store.subscribe(`entry:${K}:2`, () => seen.push('2'));
    store.subscribe(`order:${K}`, () => seen.push('order'));
    store.apply({ ev: 'entry', project: P, agent: 'perf', entry: entry(2, 'b, longer') });
    expect(seen).toEqual(['2']);
    expect(store.entry(K, 1)).toBe(one);
    expect(store.threadOrder(K)).toBe(order);
    store.apply({ ev: 'entry', project: P, agent: 'perf', entry: entry(3, 'c') });
    expect(seen).toEqual(['2', 'order']);
    expect(store.threadOrder(K).order).toEqual([1, 2, 3]);
    // the same entry again changes nothing
    store.apply({ ev: 'entry', project: P, agent: 'perf', entry: entry(3, 'c') });
    expect(seen).toEqual(['2', 'order']);
  });

  it('typing re-renders only typing, and only on a change', () => {
    const { store } = fake();
    const seen: string[] = [];
    store.subscribe(`typing:${K}`, () => seen.push('typing'));
    store.subscribe(`order:${K}`, () => seen.push('order'));
    store.apply({ ev: 'typing', project: P, agent: 'perf', text: 'running the tests' });
    store.apply({ ev: 'typing', project: P, agent: 'perf', text: 'running the tests' });
    expect(seen).toEqual(['typing']);
    expect(store.typing(K)).toBe('running the tests');
  });

  it('a send shows at once, is sent typed, and goes when its you entry lands (FIFO)', () => {
    const { store, sent } = fake();
    store.send({ project: P, agent: 'perf', text: 'again' });
    store.send({ project: P, agent: 'perf', text: 'again' });
    expect(store.pending(K).map((p) => p.state)).toEqual(['sending', 'sending']);
    expect(sent).toEqual([
      { cmd: 'send', project: P, agent: 'perf', text: 'again', mode: 'now' },
      { cmd: 'send', project: P, agent: 'perf', text: 'again', mode: 'now' },
    ]);
    const first = store.pending(K)[0]?.cid;
    store.apply({ ev: 'entry', project: P, agent: 'perf', entry: entry(9, 'again', 'you') });
    expect(store.pending(K).map((p) => p.cid)).not.toContain(first);
    expect(store.pending(K)).toHaveLength(1);
  });

  it("a send's error fails the oldest sending row of that project, with the hub's words", () => {
    const { store } = fake();
    store.send({ project: P, agent: 'perf', text: 'one' });
    store.send({ project: 'other', agent: 'main', text: 'two' });
    store.apply({ ev: 'error', project: P, cmd: 'send', text: "send: context isn't supported yet" });
    expect(store.pending(K)[0]).toMatchObject({ state: 'failed', why: "send: context isn't supported yet" });
    expect(store.pending(threadKey('other', 'main'))[0]?.state).toBe('sending');
  });

  it('the core going down fails every send on its way; a send while down fails at once; retry sends again', () => {
    const { store, sent } = fake();
    store.send({ project: P, agent: 'perf', text: 'one' });
    store.setCore('down');
    expect(store.pending(K)[0]).toMatchObject({ state: 'failed', why: 'not sent' });
    store.send({ project: P, agent: 'perf', text: 'two' });
    expect(store.pending(K)[1]?.state).toBe('failed');
    expect(sent).toHaveLength(1);
    store.setCore('up');
    const cid = store.pending(K)[0]?.cid ?? -1;
    store.retry(K, cid);
    expect(sent).toHaveLength(2);
    expect(store.pending(K).map((p) => [p.text, p.state])).toEqual([
      ['two', 'failed'],
      ['one', 'sending'],
    ]);
    store.dismiss(K, store.pending(K)[0]?.cid ?? -1);
    expect(store.pending(K).map((p) => p.text)).toEqual(['one']);
  });

  it('cards: the hub\'s win over the projects row\'s; slices keep their reference until they change', () => {
    const { store } = fake();
    replay(store, core_ev);
    replay(store, hub_ev);
    const cards = store.cards(P);
    expect(cards.length).toBeGreaterThan(0);
    store.apply({ ev: 'projects', projects: store.projects().map((r) => ({ ...r, cards: [] })) });
    expect(store.cards(P)).toBe(cards);
    expect(store.agents(P)).toBe(store.agents(P));
  });

  it('diffs are kept per agent and per commit; jobs, merged, worktrees per project', () => {
    const { store } = fake();
    replay(store, hub_ev);
    expect(store.diff(P, 'perf')?.files.length).toBeGreaterThan(0);
    expect(store.diff(P, 'old')?.merged).toMatch(/^e0f3df5/);
    expect(store.jobs(P).length).toBeGreaterThan(0);
    expect(store.merged(P).length).toBeGreaterThan(0);
    expect(store.worktrees(P).length).toBeGreaterThan(0);
  });

  it('one-shot events reach onEvent; the actions send the typed commands of the fixtures', () => {
    const { store, sent } = fake();
    const ends: string[] = [];
    store.onEvent((ev) => {
      if (ev.ev === 'job_end') ends.push(ev.agent);
    });
    replay(store, hub_ev);
    expect(ends).toEqual(['perf', 'docs']);
    store.subscribeThread(P, 'perf', 50);
    store.answer(P, 9, '1');
    store.stop(P, 'perf');
    for (const c of sent) expect(hub_cmd.map((h) => h.cmd)).toContain(c.cmd);
  });

  it('shown is sent deduped, only when the set changes, and again to a core that comes back up', () => {
    const { store, sent } = fake();
    store.shown(['home', P, 'home']);
    store.shown(['home', P]);
    store.shown(['home']);
    expect(sent).toEqual([
      { cmd: 'shown', projects: ['home', P] },
      { cmd: 'shown', projects: ['home'] },
    ]);
    store.setCore('down');
    store.setCore('starting');
    store.setCore('up');
    expect(sent[2]).toEqual({ cmd: 'shown', projects: ['home'] });
    expect(app_cmd.map((c) => c.cmd)).toContain('shown');
  });

  it('olderPage asks for the page before the oldest entry, only when there is more', () => {
    const { store, sent } = fake();
    store.olderPage(P, 'perf');
    expect(sent).toHaveLength(0);
    store.apply({ ev: 'thread', project: P, agent: 'perf', entries: [entry(50, 'x')], before: 50, more: true });
    store.olderPage(P, 'perf', 20);
    expect(sent).toEqual([{ cmd: 'page', project: P, agent: 'perf', before: 50, limit: 20 }]);
  });
});
