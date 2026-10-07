// settings/plugins · bar P.1 (docs/desktop-bar.md): /plugins in the window, next to the TUI's.
// Owner: qa-flows. The NEW app on the REAL core over the throwaway world (../world.ts), the TUI on
// bise's home hub as the reference (the settings page lists bise's home's agent plugins).
// Passes when:
//   - the window lists the plugins the TUI's /plugins lists;
//   - turning one off in the window shows in the TUI's /plugins (disabled), and on again (loaded);
// Not here: a log in to a fake connector (the world has no remote MCP server that logs in; the
// TUI's '/plugins login' says so there): it needs a fake one in the world (amb-tools).
import { test, expect } from '../../harness';
import { launchOn, realWorld, tui, tuiReady, tuiSay, type Tui } from '../world';

const T = {
  page: '[data-testid="settings.plugins"]',
  toggles: '[data-testid^="settings.plugin."][role="switch"]',
  toggle: (n: string) => `[data-testid="settings.plugin.${n}"]`,
};
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** '/plugins list' run as typed: its argument list stays open on the line, esc closes it, ⏎ runs. */
async function plugins(t: Tui): Promise<void> {
  for (let i = 0; i < 30; i++) t.keys('BSpace');
  t.keys('-l', '/plugins list');
  await sleep(600);
  if (t.screen().includes('┃')) t.keys('Escape');
  await sleep(300);
  t.keys('Enter');
  await sleep(1500);
}

/** The TUI's last /plugins listing: from its last 'plugins (' line to the next prompt-ish line. */
function listing(screen: string): string {
  const flat = screen.split('\n').map((l) => l.replace(/[│╭╮╰╯─┃├┤┬┴]/g, ' ').trim());
  const at = flat.map((l, i) => (l.startsWith('· plugins (') || l.startsWith('plugins (') ? i : -1)).filter((i) => i >= 0).at(-1) ?? -1;
  return at < 0 ? '' : flat.slice(at, at + 25).join('\n');
}

test('settings/plugins: the window lists the TUI\'s plugins; off and on again show in the TUI', async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  let t: Tui | undefined;
  const s = await launchOn(w, 'settings/plugins', T.page);
  try {
    const { page } = s;
    await expect(page.locator(T.page), 'the plugins page').toBeVisible({ timeout: 15_000 });
    t = tui(w, 'bise');
    await tuiReady(t);
    await plugins(t);
    const before = listing(t.screen());
    const names = await page.locator(T.toggles).evaluateAll((els) => els.map((e) => (e.getAttribute('data-testid') ?? '').replace('settings.plugin.', '')));
    test.info().annotations.push({ type: 'lists', description: JSON.stringify({ window: names, tui: before }) });
    await page.screenshot({ path: test.info().outputPath('plugins.png') });
    expect(names.length, 'the window lists plugins').toBeGreaterThan(0);
    for (const n of names) expect(before, `the TUI's /plugins lists ${n} too`).toContain(n);
    const name = names[0] ?? '';
    const sw = page.locator(T.toggle(name));
    const wasOn = (await sw.getAttribute('aria-checked')) === 'true';
    await sw.click({ timeout: 10_000 });
    await expect(sw, 'the switch follows the core').toHaveAttribute('aria-checked', String(!wasOn), { timeout: 10_000 });
    await plugins(t);
    const flipped = listing(t.screen());
    const lineOf = (text: string) => text.split('\n').find((l) => l.includes(name)) ?? '';
    test.info().annotations.push({ type: 'flipped', description: JSON.stringify({ name, wasOn, before: lineOf(before), after: lineOf(flipped) }) });
    expect(lineOf(flipped), `the TUI's /plugins has ${name} ${wasOn ? 'disabled' : 'on'}`).toMatch(wasOn ? /disabled/ : /^(?!.*disabled)/);
    await sw.click({ timeout: 10_000 });
    await expect(sw, 'and back').toHaveAttribute('aria-checked', String(wasOn), { timeout: 10_000 });
    await plugins(t);
    expect(lineOf(listing(t.screen())), 'the TUI has it back as before').toBe(lineOf(before));
  } finally {
    if (t) {
      test.info().attachments.push({ name: 'tui', contentType: 'text/plain', body: Buffer.from(t.screen()) });
      t.close();
    }
    await s.close();
  }
});
