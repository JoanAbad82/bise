// settings/models · bar S.3 / V17 (docs/desktop-bar.md): which model does what, the TUI's /models
// roles. Owner: qa-flows. The NEW app on the REAL core over the throwaway world (../world.ts), the
// TUI on bise's home hub as the reference (amb-kit 6078b20c + fb8e5da7). Passes when:
//   - settings · models has 'which model does what' with the TUI's roles, each with a working
//     default (nothing to pick for it to work);
//   - a role's model picked in the window shows in the TUI's /models, and back to its default;
//   - a role's reasoning picked in the window shows there too.
import { test, expect } from '../../harness';
import { launchOn, realWorld, tui, tuiReady, type Tui } from '../world';

const T = {
  roles: '[data-testid="settings.roles"]',
  model: (r: string) => `[data-testid="settings.role.${r}.model"]`,
  effort: (r: string) => `[data-testid^="settings.role.${r}.effort."]`,
  error: '[data-testid="settings.roles.error"]',
};
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const flat = (s: string): string => s.replace(/[│╭╮╰╯─┃├┤┬┴]/g, ' ').replace(/\s+/g, ' ');
const short = (id: string): string => (id.split('/').pop() ?? id).replace(/-latest$/, '');

/** The TUI's /models screen, opened and read, then closed. */
async function models(t: Tui): Promise<string> {
  for (let i = 0; i < 30; i++) t.keys('BSpace');
  t.keys('-l', '/models');
  await sleep(500);
  t.keys('Enter');
  await sleep(900);
  if (/│\s+\/models\s/.test(t.screen())) t.keys('Enter');
  await sleep(1200);
  const s = t.screen();
  t.keys('Escape');
  await sleep(300);
  return s;
}

test('settings/models: the roles are the TUI\'s; a model and a reasoning picked here show in its /models', async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  let t: Tui | undefined;
  const s = await launchOn(w, 'settings/models', T.roles);
  try {
    const { page } = s;
    await expect(page.locator(T.roles), "'which model does what'").toBeVisible({ timeout: 15_000 });
    t = tui(w, 'bise');
    await tuiReady(t);
    const before = await models(t);
    test.info().attachments.push({ name: 'tui-models-before', contentType: 'text/plain', body: Buffer.from(before) });
    const rows = await page.locator(`${T.roles} [data-testid^="settings.role."][data-testid$=".model"]`).evaluateAll((els) =>
      els.map((e) => ({ role: (e.getAttribute('data-testid') ?? '').replace(/^settings\.role\./, '').replace(/\.model$/, ''), select: e.tagName === 'SELECT', value: (e as HTMLSelectElement).value })));
    const labels = await page.locator(`${T.roles} .b-gi, ${T.roles} [data-testid^="settings.roles."]`).allInnerTexts();
    test.info().annotations.push({ type: 'roles', description: JSON.stringify({ rows, labels }) });
    await page.screenshot({ path: test.info().outputPath('roles.png') });
    expect(rows.length, 'roles listed').toBeGreaterThan(0);
    // each role: its name is on the TUI's /models screen
    for (const l of labels) {
      const name = l.split('\n')[0]?.trim() ?? '';
      if (name !== '') expect.soft(flat(before), `the TUI's /models has the role '${name}'`).toContain(name);
    }
    // a chat role's model: pick one that's ready, see it in the TUI, then back to the default
    const role = rows.find((r) => r.select);
    expect(role, 'a role with a model to pick').toBeDefined();
    const R = role?.role ?? '';
    const sel = page.locator(T.model(R));
    const options = await sel.locator('option').evaluateAll((os) => os.map((o) => ({ v: (o as HTMLOptionElement).value, t: o.textContent })));
    const pick = options.find((o) => o.v !== '' && o.v !== role?.value && !o.t.includes('set up first'));
    test.info().annotations.push({ type: 'options', description: JSON.stringify({ role: R, options, pick }) });
    expect(pick, 'a ready model to pick').toBeDefined();
    await sel.selectOption(pick?.v ?? '');
    await expect(sel, 'the select follows the core').toHaveValue(pick?.v ?? '', { timeout: 10_000 });
    await expect(page.locator(T.error), 'no refusal').toHaveCount(0);
    const picked = await models(t);
    test.info().attachments.push({ name: 'tui-models-picked', contentType: 'text/plain', body: Buffer.from(picked) });
    expect.soft(flat(picked), `the TUI's /models shows ${R} on ${short(pick?.v ?? '')}`).toContain(short(pick?.v ?? ''));
    // its reasoning, when the model has some
    const efforts = page.locator(T.effort(R));
    if ((await efforts.count()) > 1) {
      // another word than the one on, and not 'none' (the TUI says no word for none)
      const all = await efforts.evaluateAll((es) => es.map((e) => ({ w: e.textContent.trim(), on: e.getAttribute('aria-selected') === 'true' || e.classList.contains('on') })));
      const other = all.findIndex((e) => !e.on && e.w !== 'none');
      const word = all[other]?.w ?? '';
      test.info().annotations.push({ type: 'efforts', description: JSON.stringify(all) });
      // only 'none' and the one on (mistral: none, high, high on): no word to see change in the TUI
      if (other < 0) return;
      await efforts.nth(other).click({ timeout: 5000 });
      await sleep(1500);
      const reasoned = await models(t);
      test.info().attachments.push({ name: 'tui-models-effort', contentType: 'text/plain', body: Buffer.from(reasoned) });
      test.info().annotations.push({ type: 'effort', description: JSON.stringify({ role: R, word }) });
      expect.soft(flat(reasoned), `the TUI's /models shows ${R}'s reasoning '${word}'`).toContain(word);
    }
    // back to its default
    await sel.selectOption(role?.value ?? '');
    await expect(sel, 'back to how it was').toHaveValue(role?.value ?? '', { timeout: 10_000 });
    await page.screenshot({ path: test.info().outputPath('roles-back.png') });
  } finally {
    if (t) t.close();
    await s.close();
  }
});
