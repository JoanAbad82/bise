// spotlight/menu · one-inbox 3 (designer m_19631, amb-web agreed): the tray menu lists the window's
// inbox block rows under its head. Owner: amb-home. The new app on the scripted core (FakeCore),
// fn from the scripted helper; the tray's click is the capsule state main sends on it (at 'menu',
// why 'tray'), sent here from main as the tray does.
// Passes when:
//   - with 7 cards the menu shows 5 rows in the block's order (hub rank, then the oldest), each
//     '<n> <sign> <agent> <first line> … <project>' at the tight row (28 px), no age, main's
//     project read 'bise', then '+ 2 more · open bise';
//   - a click on a row opens that card in the capsule, esc goes back to the menu; fn+3 opens row 3;
//   - the spotlight's waiting rows draw the same sign.
// Shots: the menu light and dark (menu-light.png, menu-dark.png).
import { test, expect, FakeCore, FakeHelper, launchDesktop } from '../../harness';

const HOME = 'bise-home-00000000';
type Ev = Parameters<FakeCore['send']>[0];
const prefs = (theme: 'light' | 'dark'): Ev =>
  ({
    ev: 'prefs',
    prefs: {
      onboarded: true,
      theme,
      context: { shot: true, url: true, file: true, window_text: false },
      excluded_apps: [],
      quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true },
      voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' },
      shots_keep_days: 7,
    },
  }) as unknown as Ev;
const card = (id: number, agent: string, question: string, since: number, rank = 1, approval = false): Record<string, unknown> => ({
  id, project: HOME, kind: approval ? 'confirm' : 'question', rank, agent, question,
  options: [{ n: 1, label: 'yes' }, { n: 2, label: 'no' }], urgent: false, since_ms: 1791100000000 + since * 1000, ...(approval ? { approval: true } : {}),
});
const CARDS = [
  card(1, 'checkout', 'merge the retry fix into main?', 50),
  card(2, 'main', 'send the mail to legal?\nthey asked for it on monday', 10),
  card(3, 'gift-cards', 'run the migration on staging?', 40, 1, true),
  card(4, 'telemetry', 'keep the p99 alert at 800 ms?', 30),
  card(5, 'docs', 'publish the changelog page?', 20),
  card(6, 'search', 'drop the old index?', 60),
  card(7, 'billing', 'refund the double charge?', 70),
];

test('spotlight/menu: the tray menu lists the inbox block rows, 5 at most, a click or fn+n answers one in place', async () => {
  test.setTimeout(120_000);
  const core = new FakeCore();
  const helper = new FakeHelper();
  const s = await launchDesktop({ core, helper });
  try {
    const { app } = s;
    await s.page.waitForTimeout(1500);
    // the fixture world's acme cards are answered first: the menu lists only these 7
    await core.send({ ev: 'cards', project: 'acme-1a2b3c4d', cards: [], others: [] } as unknown as Ev);
    await core.send({ ev: 'cards', project: HOME, cards: CARDS } as unknown as Ev);
    // the capsule window comes with the first fn+space; then the tray's click shows its menu
    await helper.send({ ev: 'fn', act: 'key', key: 'space' });
    await expect.poll(() => app.windows().some((p) => p.url().includes('surface=capsule'))).toBe(true);
    const cap = app.windows().find((p) => p.url().includes('surface=capsule'));
    if (!cap) throw new Error('no capsule window');
    await expect(cap.locator('[data-testid="spot.input"]')).toBeVisible({ timeout: 5000 });
    // the spotlight's waiting row draws the block's sign
    await expect(cap.locator(`[data-testid="spot.row.card.${HOME}.2"] .ib-sign`), "the waiting row's sign").toHaveText('?', { timeout: 3000 });
    const tray = async (): Promise<void> => {
      await app.evaluate(({ BrowserWindow }) => {
        const w = BrowserWindow.getAllWindows().find((b) => b.webContents.getURL().includes('surface=capsule'));
        w?.webContents.send('bise:capsule-state', { shown: true, at: 'menu', keys: true, why: 'tray' });
      });
    };
    await tray();
    const rows = cap.locator('[data-testid="capsule.menu.items"]');
    await expect(rows, 'the tray menu lists the waiting items').toBeVisible({ timeout: 3000 });
    const item = (n: number) => cap.locator(`[data-testid="capsule.menu.item.${String(n)}"]`);
    await expect(rows.locator('[data-testid^="capsule.menu.item."]'), '5 rows at most').toHaveCount(5);
    await expect(cap.locator('[data-testid="capsule.menu.more"]')).toHaveText('+ 2 more · open bise');
    // the block's order: the oldest first at one rank (main's mail, then docs, telemetry…)
    await expect(item(1), "main's card reads bise, its first line only").toContainText('bise');
    await expect(item(1)).toContainText('send the mail to legal?');
    await expect(item(1)).not.toContainText('monday');
    await expect(item(1), 'its project at the end').toContainText('bise');
    await expect(item(2)).toContainText('docs');
    await expect(item(3)).toContainText('telemetry');
    await expect(item(4)).toContainText('gift-cards');
    await expect(item(4).locator('.ib-sign'), "an approval's sign").toHaveText('!');
    for (let n = 1; n <= 5; n++) {
      const h = await item(n).evaluate((el) => el.getBoundingClientRect().height);
      expect(h, `row ${String(n)} is the tight row (28 px)`).toBe(28);
      await expect(item(n), 'no age on a row').not.toContainText(/\d+ ?(s|min|h|d) ago|\b\d+(m|h|d)\b/u);
    }
    for (const t of ['light', 'dark'] as const) {
      await core.send(prefs(t));
      await cap.waitForTimeout(400);
      await cap.screenshot({ path: test.info().outputPath(`menu-${t}.png`) });
    }
    // a click answers it here; esc goes back to the menu
    const view = cap.locator('[data-testid="capsule.card.view"]');
    await item(2).click();
    await expect(view, 'a click opens that card in the capsule').toBeVisible({ timeout: 3000 });
    await expect(view).toContainText('publish the changelog page?');
    await cap.screenshot({ path: test.info().outputPath('menu-card.png') });
    await cap.keyboard.press('Escape');
    await expect(rows, 'esc: back to the menu').toBeVisible({ timeout: 3000 });
    // fn+3 opens row 3
    await helper.send({ ev: 'fn', act: 'key', key: '3' });
    await expect(view, 'fn+3 opens row 3').toContainText('keep the p99 alert at 800 ms?', { timeout: 3000 });
  } finally {
    await s.close();
    core.dispose();
  }
});
