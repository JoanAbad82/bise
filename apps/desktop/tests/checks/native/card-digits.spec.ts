// native/card-digits · « Taper 1 à 4 ne marche pas quand la popup d'inbox est ouverte » (the user on
// cb1f2b44, lead m_14146). A card bise pushes shows in the capsule without the keys (shown inactive,
// native/capsule), so his keys stay in bise's window: there, a digit over an empty composer picks in
// that card, as the TUI does; with words in the composer the digit types. Passes when, on the real
// app (no lab route) with the scripted helper and core:
//   - a pushed card with four options shows at the bottom ('show bottom', no keys);
//   - with 'ab' in the window's composer, '3' types ('ab3') and no answer goes to the hub;
//   - with the composer emptied, '2' sends the hub {cmd:'answer', card, reply:'2'}, and the composer
//     stays empty (the digit never typed).
// Shots: the window with the card up, the capsule's card.
import { FakeCore, test, expect } from '../../harness';
import type { Card, CoreEv, HubEv } from '../../../src/proto';
import { core_ev, hub_ev } from '../../../src/proto/fixtures.gen';
import { CAPSULE, capsulePage, onWorld, sleep } from './world';

type Cmd = { cmd?: string; project?: string; card?: number; reply?: string };

/** the fixture world, and a push of one more card with four options (his screenshot's card) */
function world(): { start: (CoreEv | HubEv)[]; push: HubEv; card: Card } {
  const start: (CoreEv | HubEv)[] = [...core_ev, ...hub_ev];
  const cards = hub_ev.find((e): e is Extract<HubEv, { ev: 'cards' }> => e.ev === 'cards');
  const first = cards?.cards[0];
  if (cards === undefined || first === undefined) throw new Error('no cards in the fixtures');
  const card: Card = {
    ...first,
    id: 99,
    kind: 'question',
    question: 'which model for the review?',
    options: [
      { n: 1, label: 'gpt-5' },
      { n: 2, label: 'opus' },
      { n: 3, label: 'sonnet' },
      { n: 4, label: 'skip it' },
    ],
    since_ms: first.since_ms + 60_000,
  };
  return { start, push: { ...cards, cards: [...cards.cards, card] }, card };
}

test("native/card-digits: a digit in bise's window picks in the pushed card over an empty composer, types over words", async () => {
  const { start, push, card } = world();
  await onWorld(
    async ({ s, core, out }) => {
      const { page } = s;
      const cap = await capsulePage(s);
      const field = page.locator('[data-testid="composer.field"]').first();
      await expect(field, "the window's composer").toBeVisible({ timeout: 10_000 });
      await sleep(800);
      await core.send(push);
      expect(await out.wait(CAPSULE, (l) => l.startsWith('show')), 'the card shows at the bottom, without the keys').toBe('show bottom');
      await expect(cap.getByTestId('capsule.card'), 'the card is drawn').toBeVisible();
      await expect(cap.getByTestId('capsule.card')).toContainText(card.question);
      await sleep(300); // the page tells main the card is up, main tells the windows

      // words in the composer: the digit is his, it types
      await field.click();
      await page.keyboard.type('ab');
      await page.keyboard.press('3');
      await expect(field, 'a digit after his words types').toContainText('ab3');
      await sleep(400);
      expect(core.cmds().filter((c) => (c as Cmd).cmd === 'answer'), 'no answer while he writes').toEqual([]);
      await page.screenshot({ path: test.info().outputPath('window-card-up-typing.png') });
      await cap.screenshot({ path: test.info().outputPath('capsule-card.png') });

      // the composer emptied: the digit picks in the card
      await page.keyboard.press('Meta+A');
      await page.keyboard.press('Backspace');
      await expect(field, 'the composer is empty').toHaveText('');
      await page.screenshot({ path: test.info().outputPath('window-card-up-empty.png') });
      await page.keyboard.press('2');
      const a = (await core.waitCmd((c) => (c as Cmd).cmd === 'answer', 3000)) as Cmd;
      expect(a.card, 'the pushed card').toBe(card.id);
      expect(a.project).toBe(card.project);
      expect(a.reply, 'its option 2').toBe('2');
      await expect(field, 'the digit never typed').toHaveText('');
    },
    { core: new FakeCore(start), route: `project/${card.project}` },
  );
});
