// bims/headset · the 'headphones' hat (render/bim.ts), Gabriel: « Est ce que cette barre orange est
// sensé etre un casque audio? ». On FakeCore rows from src/bims/fixtures.ts, off screen: two working
// bims renamed to names whose outfit wears headphones (landing-shots, bp-lazy), on the loft and on
// kyoto, light and night. Passes when both bims are on view; its shots, for bims to sign:
// .harness-cache/bims-shots (hs-*.png), the office's default framing and a 3x close-up on each head.
import { test, expect, type FakeCore, type Session } from '../../harness';
import { office } from '../../../src/bims/fixtures';
import { open, settle, shotOf, showOffice, trackpad, headOf, withRows, writeIndex, type Shot } from './world';

const shots: Shot[] = [];
test.describe.configure({ timeout: 180_000 });
test.afterAll(() => {
  if (shots.length > 0) writeIndex(shots);
});

/** names whose outfit (render/palette.ts outfitOf) wears the headphones */
const WEAR = ['landing-shots', 'bp-lazy'] as const;
const world = {
  ...office,
  agents: withRows(office, {}).agents.map((a) => (a.name === 'signup-perf' ? { ...a, name: WEAR[0] } : a.name === 'dark-mode' ? { ...a, name: WEAR[1] } : a)),
};

async function pick(s: Session, core: FakeCore, theme: 'light' | 'dark', map: string): Promise<void> {
  await core.send({ ev: 'prefs', prefs: { onboarded: true, theme, excluded_apps: [], bims: { map: { 'office-0bims0qa': map } } } } as never);
  await expect(s.page.getByTestId('app.right.bims')).toHaveAttribute('data-map', map, { timeout: 10_000 });
}

for (const map of ['loft', 'kyoto'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`(headset) ${map}, ${theme}: the default framing and a 3x close-up`, async () => {
      const { s, core } = await open(world, { theme, width: 1600 });
      const when = theme === 'dark' ? 'night' : 'day';
      try {
        await showOffice(s);
        await pick(s, core, theme, map);
        await s.page.getByTestId('app.right.agents.width.wide').click();
        await settle(s, 800, 6000);
        const bar = await s.page.getByTestId('app.right.bims').boundingBox();
        if (bar === null) throw new Error('no office');
        const file = `hs-${map}-fit-${theme}.png`;
        await shotOf(s.cdp, s.page, bar, file);
        shots.push({ file, title: `headset, ${map}, default framing, ${when}`, says: `${WEAR.join(' and ')} at their desks: a band over the head, a cup on each ear, a mic arm` });
        const h = await headOf(s.page, WEAR[0]);
        expect(h, `${WEAR[0]} on view`).not.toBeNull();
        if (h === null) return;
        for (let i = 0; i < 2; i++) await trackpad(s.cdp, h.x, h.y, { dy: -55, pinch: true });
        await settle(s, 800, 6000);
        for (const n of WEAR) {
          const at = await headOf(s.page, n);
          if (at === null) continue;
          const f = `hs-${map}-3x-${n}-${theme}.png`;
          await shotOf(s.cdp, s.page, { x: at.x - 140, y: at.y - 100, width: 280, height: 260 }, f);
          shots.push({ file: f, title: `headset, ${map}, 3x, ${n}, ${when}`, says: 'the headset close: band on the hair following the head, cups on the ears, the mic to the mouth' });
        }
      } finally {
        await s.close().catch(() => undefined);
        core.dispose();
      }
    });
  }
}
