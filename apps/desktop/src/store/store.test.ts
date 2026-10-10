import { describe, expect, it } from 'vitest';
import { app_cmd, core_ev, hub_cmd, hub_ev } from '@/proto/fixtures.gen';
import type { Entry } from '@/proto';
import type { CoreCmd } from '@/shared/api';
import { allFixtureEvents, replay } from './replay';
import { sentWords, Store, TAGS, threadKey, typed } from './store';

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
  it("keeps the hub's yes/no questions; an answer or esc drops one; a new welcome drops them all (I9)", () => {
    const { sent, store } = fake();
    store.apply({ ev: 'confirm', project: P, id: 3, text: '@perf is working: archive it anyway? (y/n)' });
    store.apply({ ev: 'confirm', project: P, id: 4, text: '@ux is working: archive it anyway? (y/n)' });
    expect(store.confirms(P).map((c) => c.id)).toEqual([3, 4]);
    store.confirm(P, 3, false);
    expect(sent.at(-1)).toEqual({ cmd: 'confirm', project: P, id: 3, yes: false });
    store.apply({ ev: 'notice', project: P, cmd: 'confirm', text: 'drop of @perf cancelled' });
    expect(store.notice(P)).toEqual({ text: 'drop of @perf cancelled', level: 'note' });
    // a refused typed line (HubCmd slash) is an error line, never a notice
    store.apply({ ev: 'error', project: P, cmd: 'slash', text: 'no undo: an agent may already have acted.', cid: 3, reason: 'refused' });
    expect(store.notice(P)).toEqual({ text: 'no undo: an agent may already have acted.', level: 'error' });
    store.apply({ ev: 'notice', project: P, cmd: 'slash', text: 'flow: pr', cid: 4 });
    expect(store.notice(P)).toEqual({ text: 'flow: pr', level: 'note' });
    const n = sent.length;
    store.putOff(P, 4);
    expect(sent.length).toBe(n);
    expect(store.confirms(P)).toEqual([]);
    store.apply({ ev: 'confirm', project: P, id: 5, text: 'archive it anyway? (y/n)' });
    store.apply({ ev: 'welcome', project: P, proto: 1, workspace: '/w', name: 'acme' });
    expect(store.confirms(P)).toEqual([]);
  });

  it('keeps the approvals mode and rules per project, whole each time (V8/W21)', () => {
    const { store } = fake();
    expect(store.approvals(P)).toBeNull();
    const rule = { tool: 'bash', pattern: 'cargo test *', added: '1791100000000', added_ms: 1791100000000, what: 'cargo test *', note: 'from perf' };
    store.apply({ ev: 'approvals', project: P, mode: 'auto', env: false, checker: 'jev', checker_who: 'TypeSafe', repo: '/w', rules: [rule], flash: true });
    expect(store.approvals(P)?.mode).toBe('auto');
    expect(store.approvals(P)?.rules.map((r) => r.what)).toEqual(['cargo test *']);
    store.apply({ ev: 'approvals', project: P, mode: 'yolo', env: false, checker: 'jev', checker_who: 'TypeSafe', repo: '/w', rules: [] });
    expect(store.approvals(P)?.mode).toBe('yolo');
    expect(store.approvals(P)?.rules).toEqual([]);
    expect(store.approvals('other')).toBeNull();
  });

  it('keeps the live scheduled tasks per project, whole each time', () => {
    const { store } = fake();
    expect(store.scheduled(P)).toEqual([]);
    const task = { id: 3, agent: 'main', by: 'main', words: 'every 10m', every: '10m', done: 0, next_ms: 1791100600000 };
    store.apply({ ev: 'scheduled', project: P, items: [task] });
    expect(store.scheduled(P).map((t) => t.id)).toEqual([3]);
    store.apply({ ev: 'scheduled', project: P, items: [] });
    expect(store.scheduled(P)).toEqual([]);
    expect(store.scheduled('other')).toEqual([]);
  });

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
    // a later page of older history (pos 2, the hub's order) lands in its place, not at the end
    expect(v.order.slice(0, 3)).toEqual([1, 2, 3]);
    expect(v.order.at(-1)).not.toBe(2);
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
      { cmd: 'send', project: P, agent: 'perf', text: 'again', mode: 'now', cid: 1 },
      { cmd: 'send', project: P, agent: 'perf', text: 'again', mode: 'now', cid: 2 },
    ]);
    const first = store.pending(K)[0]?.cid;
    store.apply({ ev: 'entry', project: P, agent: 'perf', entry: entry(9, 'again', 'you') });
    expect(store.pending(K).map((p) => p.cid)).not.toContain(first);
    expect(store.pending(K)).toHaveLength(1);
  });

  it("a send with an image goes when its echo lands with the hub's marker before his words (qa-native R41)", () => {
    const { store } = fake();
    store.send({ project: P, agent: 'perf', text: 'what is in this picture?', files: ['/tmp/shot.png'] });
    store.send({ project: P, agent: 'perf', text: '[Image #1] and this one', files: ['/tmp/b.png'] });
    expect(store.pending(K)).toHaveLength(2);
    const marker = '<image name="[Image #1]" path="/tmp/shot.png" mime="image/png" b64="/h/images/ab12.b64">';
    store.apply({ ev: 'entry', project: P, agent: 'perf', entry: entry(9, `${marker}
what is in this picture?`, 'you') });
    expect(store.pending(K).map((p) => p.text)).toEqual(['[Image #1] and this one']);
    store.apply({ ev: 'entry', project: P, agent: 'perf', entry: entry(10, `${marker.replace('shot', 'b')} and this one`, 'you') });
    expect(store.pending(K)).toEqual([]);
    expect(sentWords('<image name="[Image #2]" path="a b.png" mime="image/png" b64="x">  hi\n there')).toBe('hi there');
  });

  it('a send carries the files he attached, typed, and a retry sends them again; no files means no field', () => {
    const { store, sent } = fake();
    const files = ['/Users/ana/notes/q3-notes.md', '/Users/ana/Desktop/shot.png'];
    const cid = store.send({ project: P, agent: 'main', text: 'what stands out here', files });
    store.send({ project: P, agent: 'main', text: 'plain', files: [] });
    expect(sent).toEqual([
      { cmd: 'send', project: P, agent: 'main', text: 'what stands out here', mode: 'now', files, cid: 1 },
      { cmd: 'send', project: P, agent: 'main', text: 'plain', mode: 'now', cid: 2 },
    ]);
    store.apply({ ev: 'error', project: P, cmd: 'send', text: 'hub gone' });
    store.retry(threadKey(P, 'main'), cid);
    expect(sent[2]).toEqual({ cmd: 'send', project: P, agent: 'main', text: 'what stands out here', mode: 'now', files, cid: 3 });
  });

  it("G: a send's error with its cid fails exactly that row; undelivered: the thread's entry stands in for it", () => {
    const { store, sent } = fake();
    const one = store.send({ project: P, agent: 'perf', text: 'one' });
    const two = store.send({ project: P, agent: 'perf', text: 'two' });
    const three = store.send({ project: P, agent: 'perf', text: 'three' });
    expect(sent.map((c) => (c as { cid?: number }).cid)).toEqual([one, two, three]);
    // refused: only the second row, with the words; the oldest stays sending
    store.apply({ ev: 'error', project: P, cmd: 'send', text: 'no agent perf', cid: two, reason: 'refused' });
    expect(store.pending(K).map((p) => [p.cid, p.state, p.why])).toEqual([
      [one, 'sending', undefined],
      [two, 'failed', 'no agent perf'],
      [three, 'sending', undefined],
    ]);
    // undelivered: the hub's undelivered entry is in the thread; his row goes, one fact
    store.apply({ ev: 'error', project: P, cmd: 'send', text: '@perf is archived', cid: three, reason: 'undelivered' });
    expect(store.pending(K).map((p) => p.cid)).toEqual([one, two]);
    // an unknown cid changes nothing
    store.apply({ ev: 'error', project: P, cmd: 'send', text: 'x', cid: 999, reason: 'refused' });
    expect(store.pending(K).map((p) => p.state)).toEqual(['sending', 'failed']);
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
    // the terminal's /diff answers (a req) left out: the review's diffs only
    replay(store, hub_ev.filter((e) => !(e.ev === 'diff' && e.req != null)));
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

  it('R41: an answer carries the images he attached (absolute paths, as a send); none: no files field', () => {
    const { store, sent } = fake();
    store.answer(P, 9, 'this one', ['/Users/me/.bise/images/a.png']);
    store.answer(P, 9, '', ['/Users/me/.bise/images/b.png']);
    store.answer(P, 10, 'yes', []);
    store.answer(P, 10, 'yes');
    expect(sent.filter((c) => c.cmd === 'answer')).toEqual([
      { cmd: 'answer', project: P, card: 9, reply: 'this one', files: ['/Users/me/.bise/images/a.png'] },
      { cmd: 'answer', project: P, card: 9, reply: '', files: ['/Users/me/.bise/images/b.png'] },
      { cmd: 'answer', project: P, card: 10, reply: 'yes' },
      { cmd: 'answer', project: P, card: 10, reply: 'yes' },
    ]);
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

  it('a core that comes back up gets shown and every followed thread again, not the dropped ones (qa-native m_9736)', () => {
    const { store, sent } = fake();
    store.shown(['home', P]);
    store.subscribeThread(P, 'perf', 60);
    store.subscribeThread(P, 'main');
    store.subscribeThread(P, 'old');
    store.unsubscribeThread(P, 'old');
    sent.length = 0;
    store.setCore('down');
    store.setCore('starting');
    expect(sent).toEqual([]);
    store.setCore('up');
    expect(sent).toEqual([
      { cmd: 'shown', projects: ['home', P] },
      { cmd: 'subscribe', project: P, agent: 'perf', limit: 60 },
      { cmd: 'subscribe', project: P, agent: 'main' },
    ]);
  });

  it('olderPage asks for the page before the oldest entry, only when there is more', () => {
    const { store, sent } = fake();
    store.olderPage(P, 'perf');
    expect(sent).toHaveLength(0);
    store.apply({ ev: 'thread', project: P, agent: 'perf', entries: [entry(50, 'x')], before: 50, more: true });
    store.olderPage(P, 'perf', 20);
    expect(sent).toEqual([{ cmd: 'page', project: P, agent: 'perf', before: 50, limit: 20 }]);
  });
  it("I: a dictation's whole text replaces, one final ends it, an id it never started is ignored", () => {
    const { sent, store } = fake();
    const id = store.dictateStart();
    expect(sent).toEqual([{ cmd: 'dictate_start', id }]);
    expect(store.dictation(id)).toEqual({ text: '', final: false, cancelled: false, error: null });
    store.apply({ ev: 'dictation', id, text: 'fix the', final: false });
    store.apply({ ev: 'dictation', id, text: 'fix the login', final: false });
    expect(store.dictation(id)?.text).toBe('fix the login');
    store.dictateStop(id);
    expect(sent.at(-1)).toEqual({ cmd: 'dictate_stop', id });
    store.apply({ ev: 'dictation', id, text: 'fix the login test', final: true });
    expect(store.dictation(id)).toEqual({ text: 'fix the login test', final: true, cancelled: false, error: null });
    // over: a late event changes nothing, stop/cancel send nothing
    store.apply({ ev: 'dictation', id, text: 'late', final: false });
    expect(store.dictation(id)?.text).toBe('fix the login test');
    const n = sent.length;
    store.dictateCancel(id);
    expect(sent.length).toBe(n);
    // another window's dictation never lands here
    store.apply({ ev: 'dictation', id: 'not-mine', text: 'secret', final: false });
    expect(store.dictation('not-mine')).toBeNull();
    // a refused start is its final, with the error
    const busy = store.dictateStart();
    store.apply({ ev: 'dictation', id: busy, text: '', final: true, error: 'the mic is busy.' });
    expect(store.dictation(busy)).toEqual({ text: '', final: true, cancelled: false, error: 'the mic is busy.' });
  });
  it('V14: signing holds the open sign-in link until accounts or its error', () => {
    const { store } = fake();
    expect(store.signing()).toBeNull();
    store.apply({ ev: 'signing', id: 'chatgpt', url: 'https://auth.openai.test/x' });
    expect(store.signing()).toEqual({ id: 'chatgpt', url: 'https://auth.openai.test/x' });
    store.apply({ ev: 'error', cmd: 'sign_in', text: 'chatgpt: cancelled' });
    expect(store.signing()).toBeNull();
    store.apply({ ev: 'signing', id: 'chatgpt', url: 'https://auth.openai.test/y' });
    store.apply({ ev: 'accounts', items: [] });
    expect(store.signing()).toBeNull();
  });

  it("heard: fn's talk words so far, then final; a new talk starts empty (the capsule's talk view)", () => {
    const { sent, store } = fake();
    expect(store.heard()).toBeNull();
    store.apply({ ev: 'heard', text: 'why is the cold', final: false });
    expect(store.heard()).toEqual({ text: 'why is the cold', final: false });
    store.apply({ ev: 'heard', text: 'why is the cold bench slow', final: true });
    expect(store.heard()).toEqual({ text: 'why is the cold bench slow', final: true });
    store.command({ cmd: 'talk_start' });
    expect(sent.at(-1)).toEqual({ cmd: 'talk_start' });
    expect(store.heard()).toBeNull();
  });

  it("level: each voice's loudness, the last value, a repeat changes nothing", () => {
    const { store } = fake();
    expect(store.level('you')).toBe(0);
    let n = 0;
    store.subscribe('level:you', () => (n += 1));
    store.apply({ ev: 'level', who: 'you', v: 0.42 });
    store.apply({ ev: 'level', who: 'you', v: 0.42 });
    store.apply({ ev: 'level', who: 'main', v: 0.9 });
    expect([store.level('you'), store.level('main'), n]).toEqual([0.42, 0.9, 1]);
  });
  it('C/A/B: commands asked once per core, skills per project, an @ query resolves with its newest rid only', async () => {
    const { sent, store } = fake();
    store.askCommands();
    store.askCommands();
    expect(sent.filter((c) => c.cmd === 'commands')).toHaveLength(1);
    store.apply({ ev: 'commands', items: [{ name: '/new', desc: 'start an agent', args: [{ kind: 'text' }], runs: 'hub', runnable: true }] });
    expect(store.commands().map((c) => c.name)).toEqual(['/new']);
    store.askSkills(P);
    store.apply({ ev: 'skills', project: P, items: [{ name: 'bise-pages', desc: 'a page' }] });
    expect(store.skills(P)).toEqual([{ name: 'bise-pages', desc: 'a page' }]);
    // two queries: the first is replaced (null), only the newest rid lands
    const first = store.files(P, 'ma');
    const second = store.files(P, 'mai');
    const rids = sent.filter((c) => c.cmd === 'files').map((c) => (c as { rid: number }).rid);
    expect(await first).toBeNull();
    store.apply({ ev: 'files', project: P, rid: rids[0] ?? 0, q: 'ma', items: [{ path: 'late.rs', dir: false }] });
    expect(store.filesNow(P)).toBeNull();
    store.apply({ ev: 'files', project: P, rid: rids[1] ?? 0, q: 'mai', items: [{ path: 'src/main.rs', dir: false }], partial: true });
    expect(await second).toEqual({ q: 'mai', items: [{ path: 'src/main.rs', dir: false }], folder: null, partial: true });
    // the fuller answer of the same rid lands in the slice
    store.apply({ ev: 'files', project: P, rid: rids[1] ?? 0, q: 'mai', items: [{ path: 'src/main.rs', dir: false }, { path: 'main.md', dir: false }] });
    expect(store.filesNow(P)?.items).toHaveLength(2);
    // a core that comes up again is asked the commands again
    store.setCore('down');
    store.setCore('up');
    expect(sent.filter((c) => c.cmd === 'commands')).toHaveLength(2);
  });
});

describe('computer use live (S29)', () => {
  it('keeps the rows whole, the latest still per agent in memory only, and sends acts by key', () => {
    const { sent, store } = fake();
    expect(store.computerLive()).toEqual([]);
    const rows = [{ key: 'h.perf', project: P, agent: 'perf', driving: 'Chrome', place: 'amazon.fr', since_ms: 5 }];
    store.apply({ ev: 'computer_live', items: rows });
    expect(store.computerLive()).toEqual(rows);
    store.apply({ ev: 'computer_live', items: [] });
    expect(store.computerLive()).toEqual([]);
    store.computer('take', 'h.perf');
    store.computer('peek', 'h.perf', 640);
    expect(sent.slice(-2)).toEqual([
      { cmd: 'computer', act: 'take', key: 'h.perf' },
      { cmd: 'computer', act: 'peek', key: 'h.perf', max_width: 640 },
    ]);
    const shot = { data: 'QUJD', mime: 'image/jpeg', width: 640, height: 400, at_ms: 9 };
    store.apply({ ev: 'computer_peek', key: 'h.perf', shot });
    store.apply({ ev: 'computer_peek', key: 'h.perf', why: 'too_soon' });
    expect(store.peek('h.perf')).toEqual({ ev: 'computer_peek', key: 'h.perf', why: 'too_soon' });
    store.dropPeek('h.perf');
    expect(store.peek('h.perf')).toBeNull();
  });
});

describe("a tool call's real output (amb-feed dece0fe9)", () => {
  const P = 'acme-1a2b3c4d';
  it('asks once, keeps the answer by its pos, and a refusal names the last ask', () => {
    const sent: CoreCmd[] = [];
    const store = new Store({ send: (c) => sent.push(c) }, { now: () => 1000 });
    store.askToolOut(P, 'perf', 4);
    store.askToolOut(P, 'perf', 4);
    expect(sent.filter((c) => c.cmd === 'tool_out')).toEqual([{ cmd: 'tool_out', project: P, agent: 'perf', pos: 4 }]);
    store.apply({ ev: 'tool_out', project: P, agent: 'perf', pos: 4, out: 'running 40 tests', cut: true });
    expect(store.toolOut(P, 'perf', 4)).toEqual({ out: 'running 40 tests', cut: true });
    // the whole size, when the hub read the session log (amb-feed a928ab09)
    store.apply({ ev: 'tool_out', project: P, agent: 'perf', pos: 5, out: 'running 40 tests', cut: true, total: 18_432 });
    expect(store.toolOut(P, 'perf', 5)).toEqual({ out: 'running 40 tests', cut: true, total: 18_432 });
    store.askToolOut(P, 'perf', 4);
    expect(sent.filter((c) => c.cmd === 'tool_out'), 'answered: never asked again').toHaveLength(1);
    store.askToolOut(P, 'perf', 9);
    store.apply({ ev: 'error', cmd: 'tool_out', project: P, text: 'no result yet' });
    expect(store.toolOut(P, 'perf', 9)).toEqual({ error: 'no result yet' });
    expect(store.toolOut(P, 'perf', 7)).toBeNull();
  });
});
