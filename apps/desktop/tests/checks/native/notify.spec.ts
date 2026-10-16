// native/notify · his questions as macOS notifications when bise isn't in front (the user's decision
// 2026-10-09, card #476: « b + la notification native ... Pas de notification nécessaire si j'étais
// focused sur l'app au moment de la réception »; designer m_14211's words; lead m_14206 a1). Test
// mode never posts: main says each step on NOTIFY_LINE, and the check plays his side through main's
// test globals (__biseTestFocused, __biseTestNotify). Passes when, on the real app with the scripted
// helper and core:
//   - the cards already waiting at start never knock;
//   - a new question while no bise window has the keys posts one notification: 'perf asks · acme',
//     the question as written, its four choices then 'open in bise', a reply field;
//   - its second choice answers the hub {cmd:'answer', card, reply:'2'} (the window's path);
//   - the card leaving its list (answered anywhere) takes the notification away;
//   - a new question while a bise window has the keys posts nothing;
//   - a reply answers with his words; a click opens the window on that card in the inbox;
//   - the permission: 'never' until asked; ask() answers what macOS said (the test's answer);
//   - an approval offers its two words as buttons and no reply;
//   - during a quiet moment (the helper's call) a new question still knocks, silent.
import { FakeCore, test, expect } from '../../harness';
import type { Card, CoreEv, HubEv } from '../../../src/proto';
import { core_ev, hub_ev } from '../../../src/proto/fixtures.gen';
import { onWorld, sleep, type World } from './world';

import { inbox } from '../../../src/proto/words_inbox.gen';
const NOTIFY = 'bise-desktop: notify';
type Cmd = { cmd?: string; project?: string; card?: number; reply?: string };
type Line = { t: string; key?: string; route?: string; note?: { key: string; title: string; body: string; actions: string[]; reply: boolean; silent: boolean }; cmd?: Cmd };

const cardsEv = hub_ev.find((e): e is Extract<HubEv, { ev: 'cards' }> => e.ev === 'cards');
if (cardsEv === undefined) throw new Error('no cards in the fixtures');
const base = cardsEv.cards;
const P = cardsEv.project;
const first = base[0];
if (first === undefined) throw new Error('no card in the fixtures');
const q = (id: number, o: Partial<Card> = {}): Card => ({
  ...first,
  id,
  kind: 'question',
  approval: false,
  question: 'which model for the review?',
  options: [
    { n: 1, label: 'gpt-5' },
    { n: 2, label: 'opus' },
    { n: 3, label: 'sonnet' },
    { n: 4, label: 'skip it' },
  ],
  ...o,
});
const push = (cards: Card[]): HubEv => ({ ...cardsEv, cards: [...base, ...cards] });
const lines = (w: World): Line[] => w.out.of(NOTIFY).map((l) => JSON.parse(l) as Line);
const waitLine = async (w: World, pred: (l: Line) => boolean, why: string): Promise<Line> => {
  await expect.poll(() => lines(w).some(pred), { message: why, timeout: 3000 }).toBe(true);
  return lines(w).find(pred) as Line;
};
const focus = (w: World, on: boolean) => w.s.app.evaluate((_e, v) => { (globalThis as { __biseTestFocused?: boolean }).__biseTestFocused = v; }, on);
const gesture = (w: World, key: string, g: unknown) =>
  w.s.app.evaluate((_e, a) => (globalThis as { __biseTestNotify?: (k: string, g: unknown) => boolean }).__biseTestNotify?.(a.key, a.g) ?? false, { key, g });

test('native/notify: a new question knocks only when bise is not in front; its buttons, reply and click answer like the window', async () => {
  const start: (CoreEv | HubEv)[] = [...core_ev, ...hub_ev];
  await onWorld(
    async (w) => {
      await sleep(1500);
      expect(lines(w).filter((l) => l.t === 'post'), 'what already waited at start never knocks').toEqual([]);

      // bise not in front: a new question knocks
      await w.core.send(push([q(99)]));
      const post = await waitLine(w, (l) => l.t === 'post' && l.note?.key === `${P}#99`, 'a notification for card 99');
      expect(post.note?.title).toBe('perf asks · acme');
      expect(post.note?.body).toBe('which model for the review?');
      expect(post.note?.actions).toEqual(['gpt-5', 'opus', 'sonnet', 'skip it', inbox.key_open_in_bise]);
      expect(post.note?.reply).toBe(true);

      // its second choice answers the hub as the window does
      expect(await gesture(w, `${P}#99`, { action: 1 })).toBe(true);
      const a = (await w.core.waitCmd((c) => (c as Cmd).cmd === 'answer' && (c as Cmd).card === 99, 3000)) as Cmd;
      expect(a).toMatchObject({ cmd: 'answer', project: P, card: 99, reply: '2' });

      // answered: the card leaves its list, the notification goes
      await w.core.send(push([]));
      await waitLine(w, (l) => l.t === 'close' && l.key === `${P}#99`, 'the notification goes when the card is answered');

      // a bise window has the keys: nothing knocks
      await focus(w, true);
      await w.core.send(push([q(100)]));
      await sleep(600);
      expect(lines(w).some((l) => l.t === 'post' && l.note?.key === `${P}#100`), 'no notification while bise is in front').toBe(false);
      await focus(w, false);

      // a reply answers with his words; a click opens the inbox
      await w.core.send(push([q(100), q(101)]));
      await waitLine(w, (l) => l.t === 'post' && l.note?.key === `${P}#101`, 'a notification for card 101');
      expect(await gesture(w, `${P}#101`, { reply: ' opus, please ' })).toBe(true);
      const r = (await w.core.waitCmd((c) => (c as Cmd).cmd === 'answer' && (c as Cmd).card === 101, 3000)) as Cmd;
      expect(r.reply).toBe('opus, please');
      expect(await gesture(w, `${P}#101`, { click: true })).toBe(true);
      await waitLine(w, (l) => l.t === 'open' && l.route === `inbox?card=${P}/101`, 'a click opens the window on that card in the inbox');

      // an approval: its two words as buttons, no reply
      await w.core.send(push([q(100), q(101), q(102, { approval: true, kind: 'merge', question: 'merge gift-cards into main?', options: [{ n: 1, label: 'merge' }, { n: 2, label: 'not yet' }] })]));
      const ap = await waitLine(w, (l) => l.t === 'post' && l.note?.key === `${P}#102`, 'a notification for the approval');
      expect(ap.note?.actions).toEqual(['merge', 'not yet']);
      expect(ap.note?.reply).toBe(false);

      // a quiet moment (a call): a new question still knocks, silent; back to sound after
      expect(post.note?.silent, 'a question outside a quiet moment makes its sound').toBe(false);
      await w.helper.send({ ev: 'quiet', on: true, why: 'call' });
      await sleep(200);
      await w.core.send(push([q(100), q(101), q(102, { approval: true, kind: 'merge', question: 'merge gift-cards into main?', options: [{ n: 1, label: 'merge' }, { n: 2, label: 'not yet' }] }), q(103)]));
      const quiet = await waitLine(w, (l) => l.t === 'post' && l.note?.key === `${P}#103`, 'a notification during the call');
      expect(quiet.note?.silent, 'during a call it makes no sound').toBe(true);
      await w.helper.send({ ev: 'quiet', on: false, why: '' });

      // the permission: 'never' until asked, then what macOS answered (the test's 'off')
      const page = w.s.page;
      expect(await page.evaluate(() => (window as unknown as { bise: { notify: { state: () => Promise<string> } } }).bise.notify.state())).toBe('never');
      await w.s.app.evaluate(() => { (globalThis as { __biseTestNotifyAuth?: string }).__biseTestNotifyAuth = 'off'; });
      expect(await page.evaluate(() => (window as unknown as { bise: { notify: { ask: () => Promise<string> } } }).bise.notify.ask())).toBe('off');
      await waitLine(w, (l) => l.t === 'ask', 'ask() reached macOS (the test line)');
      expect(await page.evaluate(() => (window as unknown as { bise: { notify: { state: () => Promise<string> } } }).bise.notify.state())).toBe('off');
    },
    { core: new FakeCore(start) },
  );
});
