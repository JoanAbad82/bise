// bims/shade · nordic's table lamps (bims m_33456, m_33464): the pendants over the long table hid
// the heads of the bims at it on the screen; mushroom lamps on the table now, between its rows of
// places. On FakeCore rows, off screen: the nordic office at 640 docked, eight bims seated at work,
// light and dark, a shot each for bims to sign. The law is render/shade.test.ts. Passes when it draws.
// Shots: .harness-cache/bims-shots (shade-nordic-*.png).
import { test, expect, type FakeCore, type Session } from '../../harness';
import { agent, mainAgent, snap } from '../../../src/bims/fixtures';
import { P, open, settle, shotOf, showOffice, writeIndex, type Shot } from './world';

const shots: Shot[] = [];
test.describe.configure({ timeout: 180_000 });
test.afterAll(() => {
  if (shots.length > 0) writeIndex(shots);
});

const CREW = snap([mainAgent({ status: 'working' }), ...Array.from({ length: 8 }, (_, i) => agent(`desk-${String(i + 1)}`, { status: 'working' }))]);

async function pick(s: Session, core: FakeCore, theme: 'light' | 'dark'): Promise<void> {
  await core.send({ ev: 'prefs', prefs: { onboarded: true, theme, excluded_apps: [], bims: { map: { [P]: 'nordic' } } } } as never);
  await expect(s.page.getByTestId('app.right.bims'), 'his pick draws nordic').toHaveAttribute('data-map', 'nordic', { timeout: 10_000 });
}

for (const theme of ['light', 'dark'] as const) {
  test(`nordic's table lamps never hide a seated bim's head, 640 docked, ${theme}`, async () => {
    const { s, core } = await open(CREW, { theme, width: 1600 });
    try {
      await showOffice(s);
      await pick(s, core, theme);
      await s.page.getByTestId('app.right.agents.width.wide').click();
      await settle(s, 800, 8000);
      const bar = await s.page.getByTestId('app.right.bims').boundingBox();
      if (bar === null) throw new Error('no office for the shot');
      const file = `shade-nordic-${theme}.png`;
      await shotOf(s.cdp, s.page, bar, file);
      shots.push({ file, title: `nordic, 640 docked, ${theme === 'dark' ? 'night' : 'day'}: eight bims at work`, says: 'mushroom lamps on the table\'s middle line, between the rows of places; every seated head clear of them' });
    } finally {
      await s.close().catch(() => undefined);
      core.dispose();
    }
  });
}
