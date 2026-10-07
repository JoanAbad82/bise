// settings/approvals · bar V8/W21 (amb-feed eeee43f6 typed approvals, amb-kit 5fff1a47 the page,
// a7556130), ambient-lead m_11142 / m_11721. Owner: qa-flows. The NEW app on the REAL core over the
// throwaway world (../world.ts), bise's own TUI (/approvals) on the same home hub as the reference.
// Two rules are seeded in the world's ~/.bise/approvals.toml (every project: no `project` key), then:
//   - the mode switch shows the TUI's mode; a pick in the window is the TUI's mode after (and back);
//   - the rules list has the TUI's words for each rule, with its age;
//   - remove asks inline ('remove it?'): keep keeps it; remove takes it out of the file, the
//     window's list and the TUI's /approvals;
//   - a rule removed behind the window's back (out of the file): its remove is refused by the hub
//     and the refusal shows under the list.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from '../../harness';
import { launchOn, realWorld, tui, tuiReady, type Tui } from '../world';

const T = {
  page: '[data-testid="settings.approvals"]',
  switch: '[data-testid="settings.approvals.switch"]',
  rules: '[data-testid="settings.approvals.rules"]',
  error: '[data-testid="settings.approvals.error"]',
  rule: (i: number, part: 'remove' | 'yes' | 'keep') => `[data-testid="settings.approvals.rule.${String(i)}.${part}"]`,
};
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const flat = (s: string): string => s.replace(/[│╭╮╰╯─┃├┤┬┴]/g, ' ').replace(/\s+/g, ' ');

async function tuiCmd(t: Tui, line: string): Promise<string> {
  for (let i = 0; i < 40; i++) t.keys('BSpace');
  t.keys('-l', line);
  await sleep(500);
  if (/┃\s*\/\w/.test(t.screen().split('\n').slice(-12).join('\n'))) t.keys('Escape');
  t.keys('Enter');
  await sleep(1500);
  return t.screen();
}

test("settings/approvals: the mode, the rules in the TUI's words, remove asks inline and reaches the TUI, a refusal shows", async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const n = `q${Date.now() % 1_000_000}`;
  const file = path.join(w.home, '.bise', 'approvals.toml');
  const before = existsSync(file) ? readFileSync(file, 'utf8') : '';
  // epoch milliseconds, as the gate writes it: the hub sends added_ms (the age) only when `added`
  // reads as a number (proto_view/approvals.rs: added.parse())
  const added = String(Date.now());
  const keepPat = `make check-${n} *`;
  const gonePat = `make gone-${n} *`;
  writeFileSync(file, `${before}\n[[allow]]\ntool = "bash"\npattern = "${keepPat}"\nadded = "${added}"\nfrom = "qa-flows ${n}"\n\n[[allow]]\ntool = "bash"\npattern = "${gonePat}"\nadded = "${added}"\nfrom = "qa-flows ${n}"\n`);
  const s = await launchOn(w, 'settings/approvals', T.page);
  let t: Tui | undefined;
  const { page } = s;
  const note = (type: string, v: unknown) => test.info().annotations.push({ type, description: typeof v === 'string' ? v : JSON.stringify(v) });
  const rowOf = async (pat: string): Promise<number> => {
    const texts = await page.locator(`${T.rules} [data-testid^="settings.approvals.rule."][data-testid$=".remove"]`).evaluateAll((els) => els.map((e) => (e.closest('[class*="row"], li, div')?.textContent ?? '')));
    return texts.findIndex((x) => x.includes(pat.replace(' *', '')));
  };
  try {
    await expect(page.locator(T.page), 'the approvals page').toBeVisible({ timeout: 15_000 });
    t = tui(w, 'bise');
    await tuiReady(t);
    await page.screenshot({ path: test.info().outputPath('opened.png') });

    await test.step("the mode = the TUI's /approvals", async () => {
      const tuiScreen = flat(await tuiCmd(t as Tui, '/approvals'));
      test.info().attachments.push({ name: 'tui-approvals', contentType: 'text/plain', body: Buffer.from(t?.screen() ?? '') });
      const win = ((await page.locator(T.page).textContent({ timeout: 5000 }).catch(() => '')) ?? '').trim();
      // the world forces the mode for the session (BISE_APPROVALS): then both say it in words, no switch
      const forced = win.includes('this session (BISE_APPROVALS)');
      const on = forced
        ? (/(auto|yolo) · this session/.exec(win)?.[1] ?? '')
        : ((await page.locator(`${T.switch} [aria-pressed="true"], ${T.switch} [aria-checked="true"], ${T.switch} [data-on="true"]`).first().textContent({ timeout: 2000 }).catch(() => '')) ?? '').trim();
      const tuiMode = /\b(auto|yolo)\b/.exec(tuiScreen.slice(tuiScreen.indexOf('approvals')))?.[1] ?? '';
      note('mode', { forced, window: on, tui: tuiMode, tuiForced: tuiScreen.includes('this session (BISE_APPROVALS)'), windowPage: win.slice(0, 200) });
      expect.soft(on, "the window's mode is the TUI's").toBe(tuiMode);
      if (forced) expect.soft(tuiScreen, "the TUI says it's this session's too").toContain('this session (BISE_APPROVALS)');
    });

    await test.step("the rules in the TUI's words, with their age", async () => {
      const rules = ((await page.locator(T.rules).textContent({ timeout: 10_000 }).catch(() => '')) ?? '').trim();
      const tuiScreen = flat(t?.screen() ?? '');
      note('rules', { window: rules.slice(0, 400), tuiHasKeep: tuiScreen.includes(`check-${n}`), tuiHasGone: tuiScreen.includes(`gone-${n}`) });
      expect.soft(rules, 'the seeded rule shows').toContain(`check-${n}`);
      expect.soft(rules, 'with its age (added just now)').toMatch(/today|just now|0 min|now/);
      expect.soft(tuiScreen, "the TUI's /approvals lists it too").toContain(`check-${n}`);
      t?.keys('Escape');
      await page.locator(T.rules).screenshot({ path: test.info().outputPath('rules.png') }).catch(() => undefined);
    });

    await test.step('remove asks inline: keep keeps, remove reaches the file and the TUI', async () => {
      const i = await rowOf(keepPat);
      note('keep-row', i);
      expect.soft(i, 'the rule has a row').toBeGreaterThanOrEqual(0);
      await page.locator(T.rule(i, 'remove')).click({ timeout: 5000 });
      await expect.soft(page.getByText('remove it?'), 'it asks inline').toBeVisible({ timeout: 5000 });
      await page.locator(T.rule(i, 'keep')).click({ timeout: 5000 });
      await expect.soft(page.locator(T.rules), 'keep: still there').toContainText(`check-${n}`);
      expect.soft(readFileSync(file, 'utf8'), 'keep: still in the file').toContain(keepPat);
      await page.locator(T.rule(i, 'remove')).click({ timeout: 5000 });
      await page.locator(T.rule(i, 'yes')).click({ timeout: 5000 });
      await expect.soft(page.locator(T.rules), 'remove: gone from the list').not.toContainText(`check-${n}`, { timeout: 10_000 });
      await expect.soft.poll(() => readFileSync(file, 'utf8').includes(keepPat), { timeout: 10_000, message: 'remove: gone from approvals.toml' }).toBe(false);
      const tuiScreen = flat(await tuiCmd(t as Tui, '/approvals'));
      note('removed-tui', tuiScreen.slice(tuiScreen.indexOf('approvals'), tuiScreen.indexOf('approvals') + 400));
      expect.soft(tuiScreen, "and from the TUI's /approvals").not.toContain(`check-${n}`);
      t?.keys('Escape');
      await page.screenshot({ path: test.info().outputPath('removed.png') });
    });

    await test.step('a rule gone behind its back: the refusal under the list', async () => {
      // out of the file only: the window's list (and the hub's last event) still has it
      writeFileSync(file, readFileSync(file, 'utf8').replace(new RegExp(`\\n\\[\\[allow\\]\\]\\ntool = "bash"\\npattern = "make gone-${n} \\*"[^[]*`), '\n'));
      expect(readFileSync(file, 'utf8'), 'taken out of the file').not.toContain(gonePat);
      const i = await rowOf(gonePat);
      note('gone-row', i);
      await page.locator(T.rule(i, 'remove')).click({ timeout: 5000 });
      await page.locator(T.rule(i, 'yes')).click({ timeout: 5000 });
      const err = page.locator(T.error);
      await expect.soft(err, "the hub's refusal under the list").toBeVisible({ timeout: 10_000 });
      note('refusal', ((await err.textContent({ timeout: 2000 }).catch(() => '')) ?? '').trim());
      await expect.soft(err).toContainText('no longer in');
      await page.screenshot({ path: test.info().outputPath('refused.png') });
    });

    await test.step("a pick in the window is the TUI's mode (then back)", async () => {
      const seg = page.locator(T.switch);
      if ((await seg.count()) === 0) {
        note('switch', 'not run: the mode is forced for the session (BISE_APPROVALS), no switch in the window (as the TUI)');
        return;
      }
      const was = /\b(auto|yolo)\b/.exec(flat(await tuiCmd(t as Tui, '/approvals')).split('approvals').slice(1).join(' '))?.[1] ?? 'yolo';
      t?.keys('Escape');
      const other = was === 'yolo' ? 'auto' : 'yolo';
      await seg.getByText(other, { exact: true }).click({ timeout: 5000 });
      await sleep(1500);
      const after = flat(await tuiCmd(t as Tui, '/approvals'));
      const now = /\b(auto|yolo)\b/.exec(after.split('approvals').slice(1).join(' '))?.[1] ?? '';
      t?.keys('Escape');
      note('switch', { was, picked: other, tui: now });
      expect.soft(now, `the window's '${other}' is the TUI's mode`).toBe(other);
      await page.screenshot({ path: test.info().outputPath('switched.png') });
      await seg.getByText(was, { exact: true }).click({ timeout: 5000 }).catch(() => undefined);
    });
  } finally {
    if (t) {
      test.info().attachments.push({ name: 'tui', contentType: 'text/plain', body: Buffer.from(t.screen()) });
      t.close();
    }
    await s.close();
  }
});
