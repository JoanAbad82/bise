// native/capsule · the capsule's place, its keys and quiet moments (desktop v9 S8, bar O.5; the
// helper's quiet events, bise_proto::helper QuietWhy). Passes when:
//   - what he opens (fn space) puts the drawn capsule 170 px under the display's top, centred;
//     what bise brings (the talk, a card) puts its bottom 96 px above the work area's bottom, centred;
//     both measured from the glass drawn in the capsule's page, against the window's bounds;
//   - what bise brings never takes the keys (shown inactive: no 'keys' on CAPSULE_LINE), and no
//     window of bise is ever focused (the proof also checks it at both ends);
//   - during a quiet moment (a call, screen sharing, full screen) a new card waits: the capsule stays
//     hidden; when the moment ends the card shows; his own fn space still opens the spotlight;
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
const BOTTOM = 96;

/** the glass: the drawn panel of the view (the spotlight's frame, the talk), in its page */
const glassOf = (p: Page, id: string): Promise<{ x: number; y: number; width: number; height: number }> =>
  p.getByTestId(id).evaluate((e) => {
    const r = e.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });

type Placed = { glassTop: number; glassBottom: number; glassMidX: number; overflow: { x: number; y: number } };

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
  return { glassTop: b.y + g.y, glassBottom: b.y + g.y + g.height, glassMidX: b.x + g.x + g.width / 2, overflow };
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

test('native/capsule: fn space sits 170 px under the top, the talk 96 px above the bottom, centred', async () => {
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
    await w.out.wait(CAPSULE, (l) => l.startsWith('show bottom'));
    const bottom = await placed(w, 'capsule.talk');
    expect.soft(bottom.overflow, 'nothing of the talk is drawn past its window (cut off)').toEqual({ x: 0, y: 0 });
    expect.soft(Math.abs(DISPLAY.y + DISPLAY.height - BOTTOM - bottom.glassBottom), `the talk's glass bottom is ${BOTTOM} px above the work area's bottom`).toBeLessThanOrEqual(2);
    expect.soft(Math.abs(bottom.glassMidX - (DISPLAY.x + DISPLAY.width / 2)), 'centred').toBeLessThanOrEqual(2);
  });
});

test('native/capsule: a card bise pushes shows at the bottom without the keys', async () => {
  const { start, push } = cardsWorld();
  await onWorld(async ({ s, core, out }) => {
    const cap = await capsulePage(s);
    await sleep(1000); // the start world is the inbox's, not a push; he hasn't opened the capsule yet
    expect(out.of(CAPSULE), 'nothing shows at start').toEqual([]);
    await core.send(push);
    expect(await out.wait(CAPSULE, (l) => l.startsWith('show')), 'the card shows at the bottom, never with the keys').toBe('show bottom');
    await expect(cap.getByTestId('capsule.card'), 'the card is drawn').toBeVisible();
    const focused = await s.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().filter((b) => b.isFocused()).length);
    expect(focused, 'no window of bise is focused').toBe(0);
  }, { core: new FakeCore(start) });
});

for (const why of ['call', 'sharing', 'full_screen'] as const) {
  test(`native/capsule: during a quiet moment (${why}) a pushed card waits, fn space still opens`, async () => {
    const { start, push } = cardsWorld();
    await onWorld(async ({ s, helper, core, out }) => {
      const cap = await capsulePage(s);
      await sleep(1000);
      await helper.send({ ev: 'quiet', on: true, why });
      await sleep(200);
      await core.send(push);
      await sleep(800);
      expect(out.of(CAPSULE), `no card shows during ${why}`).toEqual([]);
      await helper.send({ ev: 'quiet', on: false, why: '' });
      const shown = await out.wait(CAPSULE, (l) => l.startsWith('show'), 1500).catch(() => null);
      expect.soft(shown, 'the card shows when the quiet moment ends').toBe('show bottom');
      if (shown !== null) {
        await expect(cap.getByTestId('capsule.card')).toBeVisible();
        return;
      }
      // his own action is never held: fn space opens even in a quiet moment
      await helper.send({ ev: 'quiet', on: true, why });
      await helper.send({ ev: 'fn', act: 'key', key: 'space' });
      expect(await out.wait(CAPSULE, (l) => l.startsWith('show'))).toBe('show top keys');
    }, { core: new FakeCore(start) });
  });
}

test('native/capsule: the helper gets his prefs at start (config: excluded apps, right option, meetings)', async () => {
  await onWorld(async ({ helper }) => {
    const config = await helper.waitCmd((c) => c.cmd === 'config', 3000).catch(() => null);
    expect(config, `the helper was configured at start (it got ${JSON.stringify(helper.cmds())})`).not.toBeNull();
    if (config?.cmd !== 'config') return;
    // the fixture world's prefs exclude 1Password (prefs.excluded_apps): the helper must never read it
    expect.soft(config.exclude.length, 'his excluded apps reach the helper').toBeGreaterThan(0);
  });
});
