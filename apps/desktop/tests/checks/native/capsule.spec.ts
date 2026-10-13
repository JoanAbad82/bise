// native/capsule · the capsule's place, its keys and quiet moments (desktop v9 S8, bar O.5; the
// helper's quiet events, bise_proto::helper QuietWhy). Passes when:
//   - what he opens (fn space) puts the drawn capsule 170 px under the display's top, centred;
//     the talk is the 320 px corner card, 16 px from the right and the bottom (no Dock here);
//     both measured from the glass drawn in the capsule's page, against the window's bounds;
//   - b3 (the user's decision 2026-10-09, card #476): a new card never pops the capsule (the
//     window's inbox block or the native notification shows it); it waits in the spotlight's
//     'waiting for you' rows, ⏎ answers it in place, esc goes back; a quiet moment never holds his
//     own fn space;
//   - the helper is told his prefs at start (config: the apps fn never reads, right option, meetings).
// In test mode the display is place.ts's OFF_DISPLAY (1920x1200 at -30000,-30000, no menu bar, no
// Dock), never one of his. The glass over a full-screen app and his app staying active are the VM pass's.
import type { Page } from '@playwright/test';
import { FakeCore, test, expect } from '../../harness';
import type { Card, CoreEv, HubEv } from '../../../src/proto';
import { core_ev, hub_ev } from '../../../src/proto/fixtures.gen';
import { CAPSULE, capsulePage, capsuleWindow, onWorld, sleep, type World } from './world';

const DISPLAY = { x: -30000, y: -30000, width: 1920, height: 1200 };
const TOP = 170;
/** the corner card: 320 wide, 16 px from the right and the bottom (designer m_22118; place.ts CORNER) */
const CARD_W = 320;
const CORNER = 16;

/** the glass: the drawn panel of the view (the spotlight's frame, the talk), in its page */
const glassOf = (p: Page, id: string): Promise<{ x: number; y: number; width: number; height: number }> =>
  p.getByTestId(id).evaluate((e) => {
    const r = e.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });

type Placed = { glassTop: number; glassBottom: number; glassMidX: number; glassRight: number; glassWidth: number; overflow: { x: number; y: number } };

async function placed(w: World, glass: string): Promise<Placed> {
  const cap = await capsulePage(w.s);
  await sleep(300); // the page sizes the window after it draws (capsule.size)
  const g = await glassOf(cap, glass);
  const b = await capsuleWindow(w.s);
  // what the page draws past the window's edge is cut off (the glass's right and bottom, its shadow)
  const overflow = await cap.evaluate(() => {
    const d = document.documentElement;
    return { x: d.scrollWidth - window.innerWidth, y: d.scrollHeight - window.innerHeight };
  });
  return { glassTop: b.y + g.y, glassBottom: b.y + g.y + g.height, glassMidX: b.x + g.x + g.width / 2, glassRight: b.x + g.x + g.width, glassWidth: g.width, overflow };
}

/** the fixture world's cards event, and the same with one more card (a push) */
function cardsWorld(): { start: (CoreEv | HubEv)[]; push: HubEv } {
  const start: (CoreEv | HubEv)[] = [...core_ev, ...hub_ev];
  const cards = hub_ev.find((e): e is Extract<HubEv, { ev: 'cards' }> => e.ev === 'cards');
  if (!cards) throw new Error('no cards in the fixtures');
  const first = cards.cards[0];
  if (!first) throw new Error('no card in the fixtures');
  const fresh: Card = { ...first, id: 99, question: 'ship the fix tonight?', since_ms: first.since_ms + 60_000 };
  return { start, push: { ...cards, cards: [...cards.cards, fresh] } };
}

test('native/capsule: fn space sits 170 px under the top, centred; the talk is the 320 px corner card, 16 px from the right and the bottom', async () => {
  await onWorld(async (w) => {
    await w.helper.send({ ev: 'fn', act: 'key', key: 'space' });
    await w.out.wait(CAPSULE, (l) => l.startsWith('show'));
    const top = await placed(w, 'spot.frame');
    expect.soft(top.overflow, 'nothing of the spotlight is drawn past its window (cut off)').toEqual({ x: 0, y: 0 });
    expect.soft(Math.abs(top.glassTop - (DISPLAY.y + TOP)), `the spotlight's glass top is ${TOP} px under the display's top`).toBeLessThanOrEqual(2);
    expect.soft(Math.abs(top.glassMidX - (DISPLAY.x + DISPLAY.width / 2)), 'centred').toBeLessThanOrEqual(2);
    await w.helper.send({ ev: 'fn', act: 'esc' });
    await w.out.wait(CAPSULE, (l) => l === 'hide');
    await w.helper.send({ ev: 'fn', act: 'talk_start', by: 'fn' });
    await w.out.wait(CAPSULE, (l) => l.startsWith('show corner'));
    const card = await placed(w, 'capsule.talk');
    expect.soft(card.overflow, 'nothing of the talk is drawn past its window (cut off)').toEqual({ x: 0, y: 0 });
    // his pick C (designer m_22118): bottom-right like a notification, pinned at its bottom, it
    // grows upward (amb-mac's 'corner', d6622e50); no Dock here: 16 px from the display's edges
    expect.soft(Math.abs(card.glassWidth - CARD_W), `the card is ${CARD_W} px wide`).toBeLessThanOrEqual(1);
    expect.soft(Math.abs(DISPLAY.x + DISPLAY.width - CORNER - card.glassRight), `its right ${CORNER} px from the display's right`).toBeLessThanOrEqual(2);
    expect.soft(Math.abs(DISPLAY.y + DISPLAY.height - CORNER - card.glassBottom), `its bottom ${CORNER} px above the display's bottom`).toBeLessThanOrEqual(2);
    await capsulePage(w.s).then((p) => p.screenshot({ path: test.info().outputPath('talk.png') }));
  });
});

test('native/capsule b3: a new card never pops the capsule; it waits in the spotlight, ⏎ answers it in place', async () => {
  // the user's decision 2026-10-09 (card #476, ambient-lead m_14205): with the window's inbox block
  // (b) and the native notification (a), the capsule no longer pushes a card
  const { start, push } = cardsWorld();
  await onWorld(async ({ s, helper, core, out }) => {
    const cap = await capsulePage(s);
    await sleep(1000); // the start world is the inbox's; he hasn't opened the capsule yet
    expect(out.of(CAPSULE), 'nothing shows at start').toEqual([]);
    await core.send(push);
    await sleep(1500);
    expect(out.of(CAPSULE), 'a new card shows nothing in the capsule').toEqual([]);
    await expect(cap.getByTestId('capsule.card'), 'no card drawn').toHaveCount(0);
    // a quiet moment changes nothing; his own fn space still opens the spotlight
    await helper.send({ ev: 'quiet', on: true, why: 'call' });
    await sleep(200);
    await helper.send({ ev: 'fn', act: 'key', key: 'space' });
    expect(await out.wait(CAPSULE, (l) => l.startsWith('show')), 'fn space opens with the keys').toBe('show top keys');
    await helper.send({ ev: 'quiet', on: false, why: '' });
    // the new card is a 'waiting for you' row; the spot's first row is a waiting one
    await expect(cap.getByTestId('spot.frame'), 'the spotlight').toBeVisible();
    await expect(cap.getByTestId('spot.frame'), 'the new card waits in the spotlight').toContainText('ship the fix tonight?');
    await cap.screenshot({ path: test.info().outputPath('b3-spot-waiting.png') });
    // ⏎ on the first waiting row: its answer in place (amb-home's card v2 on the glass), esc back
    await cap.keyboard.press('Enter');
    const view = cap.getByTestId('capsule.card.view');
    await expect(view, 'the card answers in place').toBeVisible();
    await expect(cap.locator('[data-testid="capsule.card"] .ic.glass'), 'the inbox card on the glass').toBeVisible();
    await expect(cap.getByTestId('capsule.card.view.later'), 'esc later').toBeVisible();
    await sleep(300);
    await cap.screenshot({ path: test.info().outputPath('b3-card-in-place.png') });
    await cap.keyboard.press('Escape');
    await expect(view, 'esc goes back to the list').toHaveCount(0);
    await expect(cap.getByTestId('spot.frame'), 'the spotlight again').toBeVisible();
  }, { core: new FakeCore(start) });
});

test('native/capsule: the helper gets his prefs at start (config: excluded apps, right option, meetings)', async () => {
  await onWorld(async ({ helper }) => {
    const config = await helper.waitCmd((c) => c.cmd === 'config', 3000).catch(() => null);
    expect(config, `the helper was configured at start (it got ${JSON.stringify(helper.cmds())})`).not.toBeNull();
    if (config?.cmd !== 'config') return;
    // the fixture world's prefs exclude 1Password (prefs.excluded_apps): the helper must never read it
    expect.soft(config.exclude.length, 'his excluded apps reach the helper').toBeGreaterThan(0);
  });
});
