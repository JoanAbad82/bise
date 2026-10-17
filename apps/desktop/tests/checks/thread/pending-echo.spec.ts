// thread/pending-echo · his pending row turns into the delivered entry (ambient-lead m_20138: his
// message to main was delivered, main answered it, the window still showed it 'sending…'). The
// store matched his row only on an `entry` event; an echo that comes in a `thread` page (a thread
// opened after the send, the page a reconnection sends) left the row forever. Runs the new app on
// the scripted core (FakeCore: the fixture world, bise-home + acme), real keys only. Passes when:
//   - a send whose echo comes in a page: the 'sending…' row goes, his words show once;
//   - a steered send (echo 'received', then sent again 'read' + steered_at): the row goes at the first
//     echo and his words show once after the re-send;
//   - a queued send (its echo written later, when it is said): the row stays until then, then goes;
//   - an OLDER entry with the same words (in a page) never takes a new send's row.
// Owner: amb-feed (store side), amb-win (the row).
import { test, expect, FakeCore, launchDesktop } from '../../harness';
import type { Entry } from '../../../src/proto';

const HOME = 'bise-home-00000000';
const T = { field: '[data-testid="composer.field"]', pending: '[data-testid^="thread.pending."]' };

type Cmd = Record<string, unknown>;
const isSend = (text: string) => (c: unknown): boolean => (c as Cmd)['cmd'] === 'send' && (c as Cmd)['text'] === text;

test('thread/pending-echo: a page, a steer or a queued delivery turns his pending row into the entry', async () => {
  test.setTimeout(120_000);
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: 'bise' });
  try {
    const { page } = s;
    const field = page.locator(T.field).first();
    await expect(field, "bise's composer").toBeVisible({ timeout: 10_000 });
    // the hub answers each send with its message id, and its echo carries it (A1: no words match)
    const send = async (words: string, msgId: number): Promise<void> => {
      await core.result('send', undefined, { msg_id: msgId });
      await field.click();
      await page.keyboard.type(words);
      await page.keyboard.press('Enter');
      await core.waitCmd(isSend(words));
    };
    const pending = (words: string) => page.locator(T.pending, { hasText: words });
    const you = (pos: number, text: string, more: Partial<Entry> = {}): Entry => ({ pos, at_ms: Date.now(), kind: 'you', text, ...more });
    const tag = Date.now() % 100000;

    // 1. the echo comes in a page (an older 'ok' with the same words is in it too)
    const w1 = `il y a pas des updates de UI aussi? l'historique ${tag}`;
    await send(w1, 901);
    await expect(pending(w1), 'his row shows at once').toHaveCount(1, { timeout: 1000 });
    const old: Entry = { pos: 9001, at_ms: Date.now() - 3_600_000, kind: 'you', text: w1, msg_id: 900, delivery: 'read' };
    await core.send({ ev: 'thread', project: HOME, agent: 'main', entries: [old], before: null, more: false });
    await page.waitForTimeout(400);
    await expect(pending(w1), 'an older entry with the same words never takes it').toHaveCount(1);
    await core.send({ ev: 'thread', project: HOME, agent: 'main', entries: [old, you(9002, w1, { msg_id: 901, delivery: 'read' })], before: null, more: false });
    await expect(pending(w1), 'its echo in a page takes his row').toHaveCount(0, { timeout: 2000 });
    await page.screenshot({ path: test.info().outputPath('page.png') });

    // 2. steered: received, then read mid-turn
    const w2 = `also try webp ${tag}`;
    await send(w2, 902);
    await core.send({ ev: 'entry', project: HOME, agent: 'main', entry: you(9003, w2, { msg_id: 902, delivery: 'received' }) });
    await expect(pending(w2), 'the first echo takes his row').toHaveCount(0, { timeout: 2000 });
    await core.send({ ev: 'entry', project: HOME, agent: 'main', entry: { pos: 9004, at_ms: Date.now(), kind: 'agent', text: `webp saves 30% ${tag}` } });
    await core.send({ ev: 'entry', project: HOME, agent: 'main', entry: you(9003, w2, { msg_id: 902, delivery: 'read', steered_at: 9004 }) });
    await page.waitForTimeout(400);
    await expect(pending(w2)).toHaveCount(0);
    await expect(page.getByText(w2, { exact: false }), 'his words show once').toHaveCount(1);
    await page.screenshot({ path: test.info().outputPath('steered.png') });

    // 3. queued: no echo until it is said; then the row goes
    const w3 = `and the changelog ${tag}`;
    await send(w3, 903);
    await page.waitForTimeout(1500);
    await expect(pending(w3), 'still on its way while queued').toHaveCount(1);
    await core.send({ ev: 'entry', project: HOME, agent: 'main', entry: you(9005, w3, { msg_id: 903, delivery: 'read' }) });
    await expect(pending(w3), 'said at last: the row goes').toHaveCount(0, { timeout: 2000 });
    await page.screenshot({ path: test.info().outputPath('queued.png') });
  } finally {
    await s.close();
  }
});
