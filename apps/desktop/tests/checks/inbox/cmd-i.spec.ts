// inbox/cmd-i · bar ⛔5 (docs/desktop-bar.md) · his bug 4: "⌘I does nothing". Owner: qa-flows
// (first cut by qa-type on the old window, where it is red: ⌘I changes nothing there).
// The NEW app on the REAL core over a throwaway world (../world.ts), the TUI on the same hubs as
// the reference. Passes when:
//   - ⌘I from the composer opens the inbox in the window within 1 s;
//   - it holds every card the world's hubs hold (read from each hub's socket), each once, with its
//     question; per project, in the order the TUI's inbox lists them (the TUI also lists its own
//     local setup offer, which is not a hub card: only hub cards are compared);
//   - esc closes it and the composer keeps its text.
// ⌘I's way in: on macOS ⌘I is the key equivalent of the app menu's Inbox item (src/main/menu.ts),
// so the check runs the item that has the CmdOrCtrl+I accelerator, as NSMenu does on the key (CDP
// keys never reach the native menu). That the key itself reaches the menu is qa-native's
// native/mac-keys, in the macOS VM.
// The acts (↑↓, ⏎, 1–n, a typed answer, close) on cards of its own: inbox/acts (next).
import { test, expect } from '../../harness';
import { hubOf, hubState, launchReal, realWorld, tui, tuiInbox, tuiReady } from '../world';

const T = {
  field: '[data-testid="composer.field"]',
  setupSkip: '[data-testid="setup.skip"]',
  inbox: '[data-testid="inbox.root"]',
  item: '[data-testid^="inbox.item."]',
};

type Card = { id: number; text?: string; question?: string };
const firstLine = (c: Card): string => (c.question ?? c.text ?? '').split('\n')[0]?.trim() ?? '';

test('inbox/cmd-i: ⌘I opens the inbox with every hub card, in the TUI order, esc closes it', async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const projects = w.hubs.filter((h) => !h.home).map((h) => h.project);
  // the reference first: each hub's cards (its socket), and the TUI's inbox order on that hub
  const want: { project: string; cards: string[] }[] = [];
  for (const p of projects) {
    const st = await hubState(hubOf(w, p).sock);
    const cards = ((st['cards'] as Card[] | undefined) ?? []).map(firstLine);
    const t = tui(w, p);
    try {
      await tuiReady(t);
      // its panel lists the inbox a moment after the agents: wait for the hub's cards to be drawn
      await expect.poll(() => tuiInbox(t.screen()).length, { timeout: 10_000, message: `the TUI's inbox on ${p}` }).toBeGreaterThanOrEqual(cards.length);
      const listed = tuiInbox(t.screen());
      const order = (c: string): number => listed.findIndex((r) => c.startsWith(r.text) || r.text.startsWith(c));
      for (const c of cards) expect(order(c), `the TUI lists ${p}'s card "${c}"`).toBeGreaterThanOrEqual(0);
      want.push({ project: p, cards: [...cards].sort((a, b) => order(a) - order(b)) });
    } finally {
      t.close();
    }
  }
  const total = want.reduce((n, p) => n + p.cards.length, 0);
  expect(total, 'the world holds cards to show').toBeGreaterThan(0);

  const s = await launchReal(w);
  try {
    const { page, app } = s;
    const field = page.locator(T.field).first();
    await expect(page.locator(`${T.field}, ${T.setupSkip}`).first()).toBeVisible({ timeout: 10_000 }).catch(() => undefined);
    if (await page.locator(T.setupSkip).isVisible()) await page.locator(T.setupSkip).click();
    try {
      await expect(field, "bise's thread opens with its composer on the real core").toBeVisible({ timeout: 10_000 });
    } finally {
      await page.screenshot({ path: test.info().outputPath('opened.png') });
    }
    await field.click();
    await page.keyboard.type('brouillon');
    const ran = await app.evaluate(({ Menu, BrowserWindow }) => {
      const find = (items: Electron.MenuItem[]): Electron.MenuItem | undefined => {
        for (const it of items) {
          if (it.accelerator === 'CmdOrCtrl+I') return it;
          const sub = it.submenu ? find(it.submenu.items) : undefined;
          if (sub) return sub;
        }
        return undefined;
      };
      const it = find(Menu.getApplicationMenu()?.items ?? []);
      if (!it) return '';
      // what NSMenu does on the key: the item's click, with the focused window (none here: the
      // harness never focuses a window, so main's own lookup decides where it goes)
      const click = it.click as unknown as (e: unknown, w: Electron.BrowserWindow | null, c: unknown) => void;
      click.call(it, {}, BrowserWindow.getFocusedWindow(), undefined);
      return it.label;
    });
    expect(ran, 'the app menu has an item on ⌘I').not.toBe('');
    const inbox = page.locator(T.inbox);
    try {
      await expect(inbox, '⌘I opens the inbox in the window').toBeVisible({ timeout: 1000 });
    } finally {
      await page.screenshot({ path: test.info().outputPath('inbox.png') });
    }
    const rows = await inbox.locator(T.item).evaluateAll((es) => es.map((e) => ({ id: e.getAttribute('data-testid') ?? '', text: (e as HTMLElement).innerText })));
    expect(rows.length, 'one row per hub card').toBe(total);
    for (const p of want) {
      const mine = rows.filter((r) => r.id.startsWith(`inbox.item.${p.project}-`));
      expect.soft(mine.map((r) => p.cards.findIndex((c) => r.text.includes(c))), `${p.project}: its cards, in the TUI's order`).toEqual(p.cards.map((_, i) => i));
    }
    await page.keyboard.press('Escape');
    await expect(inbox, 'esc closes the inbox').toBeHidden();
    await expect(field, "the composer's text is kept").toHaveText('brouillon');
  } finally {
    await s.close();
  }
});
