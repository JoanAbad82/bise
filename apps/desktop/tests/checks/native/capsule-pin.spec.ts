// native/capsule-pin · his try's item 6 ('la fenêtre bouge un peu'): the capsule is placed once,
// at show, then pinned (amb-mac fa3bad10 + 2887644d, place.ts Pin / fitBounds). On the scripted
// helper and core, off-screen (place.ts's OFF_DISPLAY: 1920x1200 at -30000,-30000, no Dock: the
// work area's bottom stands for the Dock line). The frame is the capsule window's bounds, read in
// Electron's main after each step; the glass is the drawn panel in the capsule's page.
//   (a) fn space, then 20 real keystrokes that filter the list: the frame's top-left never moves
//       while its size follows the list
//   (b) a voice session (fn held, then its release): the frame's top-left never moves, the glass
//       is placed for its 320 px max (its top + 320 still ends 96 px above the Dock line) and never
//       passes the Dock line
//   (c) a card bise pushes sits bottom-centre and keeps its bottom while it shows
import type { Page } from '@playwright/test';
import { FakeCore, test, expect } from '../../harness';
import type { Card, CoreEv, HubEv } from '../../../src/proto';
import { core_ev, hub_ev } from '../../../src/proto/fixtures.gen';
import { CAPSULE, capsulePage, capsuleWindow, onWorld, sleep, type World } from './world';

const DISPLAY = { x: -30000, y: -30000, width: 1920, height: 1200 };
const DOCK_LINE = DISPLAY.y + DISPLAY.height;
const BOTTOM = 96;
const TALK_MAX = 320;

type Frame = { x: number; y: number; width: number; height: number };
const frame = async (w: World): Promise<Frame> => {
  const { x, y, width, height } = await capsuleWindow(w.s);
  return { x, y, width, height };
};

/** the glass (a data-glass panel of the view) in screen coordinates */
async function glass(w: World, cap: Page, id: string): Promise<Frame> {
  const g = await cap.getByTestId(id).evaluate((e) => {
    const r = e.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  const f = await frame(w);
  return { x: f.x + g.x, y: f.y + g.y, width: g.width, height: g.height };
}

const sizes = (fs: readonly Frame[]): string[] => [...new Set(fs.map((f) => `${f.width}x${f.height}`))];

test('native/capsule-pin (a): fn space, 20 keystrokes filter the list, the frame top-left never moves', async () => {
  await onWorld(async (w) => {
    await w.helper.send({ ev: 'fn', act: 'key', key: 'space' });
    await w.out.wait(CAPSULE, (l) => l.startsWith('show'));
    const cap = await capsulePage(w.s);
    await expect(cap.getByTestId('spot.input'), 'the spotlight has the keys').toBeFocused({ timeout: 3000 });
    await sleep(300);
    const first = await frame(w);
    const seen: Frame[] = [first];
    // 20 keystrokes: matches, no match (the list empties), back to matches
    const back = ['Backspace', 'Backspace', 'Backspace', 'Backspace'];
    const keys = ['p', 'e', 'r', 'f', ...back, 's', 'h', 'o', 'p', ...back, 'z', 'q', 'x', 'w'];
    expect(keys).toHaveLength(20);
    for (const k of keys) {
      await cap.keyboard.press(k);
      await sleep(150); // the page sends its new size (capsule.size), main applies it
      seen.push(await frame(w));
    }
    await cap.screenshot({ path: test.info().outputPath('spot-after-20.png') });
    test.info().annotations.push({ type: 'sizes', description: sizes(seen).join(' ') });
    const moved = seen.filter((f) => f.x !== first.x || f.y !== first.y);
    expect(moved, `the frame's top-left stays at ${first.x},${first.y} through 20 keystrokes`).toEqual([]);
    expect(sizes(seen).length, 'the frame did resize as the list filtered (else this proves nothing)').toBeGreaterThan(1);
  });
});

test('native/capsule-pin (b): a voice session never moves the frame, the glass stays above the Dock line', async () => {
  await onWorld(async (w) => {
    await w.helper.send({ ev: 'fn', act: 'talk_start', by: 'fn' });
    await w.out.wait(CAPSULE, (l) => l.startsWith('show bottom'));
    const cap = await capsulePage(w.s);
    await sleep(300);
    const first = await frame(w);
    const seen: Frame[] = [first];
    const glasses: Frame[] = [await glass(w, cap, 'capsule.talk')];
    for (let i = 0; i < 10; i++) {
      await sleep(150);
      seen.push(await frame(w));
      glasses.push(await glass(w, cap, 'capsule.talk'));
    }
    await cap.screenshot({ path: test.info().outputPath('talk-listen.png') });
    await w.helper.send({ ev: 'fn', act: 'talk_end' }); // the release: bise thinks
    for (let i = 0; i < 10; i++) {
      await sleep(150);
      seen.push(await frame(w));
      const v = cap.getByTestId('capsule.talk');
      if (await v.isVisible()) glasses.push(await glass(w, cap, 'capsule.talk'));
    }
    await cap.screenshot({ path: test.info().outputPath('talk-think.png') });
    test.info().annotations.push({ type: 'sizes', description: sizes(seen).join(' ') });
    const moved = seen.filter((f) => f.x !== first.x || f.y !== first.y);
    expect(moved, `the frame's top-left stays at ${first.x},${first.y} through the session`).toEqual([]);
    const g0 = glasses[0];
    if (!g0) throw new Error('no glass');
    expect(g0.y + TALK_MAX, `the glass is placed for its ${TALK_MAX} px max: its top + ${TALK_MAX} ends ${BOTTOM} px above the Dock line`).toBeLessThanOrEqual(DOCK_LINE - BOTTOM + 2);
    const past = glasses.filter((g) => g.y + g.height > DOCK_LINE - BOTTOM + 2);
    expect(past, 'the glass never passes the Dock line (96 px above the work area)').toEqual([]);
  });
});

/** the fixture world's cards event, and the same with one more card (a push) */
function cardsWorld(): { start: (CoreEv | HubEv)[]; push: HubEv } {
  const start: (CoreEv | HubEv)[] = [...core_ev, ...hub_ev];
  const cards = hub_ev.find((e): e is Extract<HubEv, { ev: 'cards' }> => e.ev === 'cards');
  const first = cards?.cards[0];
  if (!cards || !first) throw new Error('no card in the fixtures');
  const fresh: Card = { ...first, id: 99, question: 'ship the fix tonight?', since_ms: first.since_ms + 60_000 };
  return { start, push: { ...cards, cards: [...cards.cards, fresh] } };
}

test('native/capsule-pin (c): a pushed card sits bottom-centre and keeps its bottom', async () => {
  const { start, push } = cardsWorld();
  await onWorld(async (w) => {
    const cap = await capsulePage(w.s);
    await sleep(1000);
    await w.core.send(push);
    await w.out.wait(CAPSULE, (l) => l.startsWith('show bottom'));
    await expect(cap.getByTestId('capsule.card'), 'the card is drawn').toBeVisible();
    await sleep(300);
    const g = await glass(w, cap, 'capsule.card');
    expect(Math.abs(DOCK_LINE - BOTTOM - (g.y + g.height)), `its glass bottom is ${BOTTOM} px above the Dock line`).toBeLessThanOrEqual(2);
    expect(Math.abs(g.x + g.width / 2 - (DISPLAY.x + DISPLAY.width / 2)), 'centred').toBeLessThanOrEqual(2);
    const first = await frame(w);
    const seen: Frame[] = [first];
    for (let i = 0; i < 10; i++) {
      await sleep(200);
      seen.push(await frame(w));
    }
    await cap.screenshot({ path: test.info().outputPath('card.png') });
    const moved = seen.filter((f) => f.y + f.height !== first.y + first.height || f.x !== first.x);
    expect(moved, 'the card keeps its bottom and its left while it shows').toEqual([]);
  }, { core: new FakeCore(start) });
});
