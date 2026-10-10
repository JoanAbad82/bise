// thread/news-real · bar T, amb-win's batch 3a rows (f97e578a) on amb-feed's typed news (5d4189cb),
// on the REAL core over the throwaway world (../world.ts), next to the TUI on the same hub
// (ambient-lead m_11369; amb-win's thread/news-rows runs them on the scripted core's fixtures).
// Owner: qa-flows. shop's main thread; each row a soft step, the TUI's line the reference:
//   - landed: the seed's 'gift-api landed 1 commit on gift-cards (<sha>)' is a landed row with the
//     same sha, and its sha opens that commit's review;
//   - pr: '#412 checks fail: e2e' is a pr row, failing said by '▲' and the hub's words (data-tone
//     err, never color alone), its number opens the PR (main's test-mode stdout line);
//   - artifact: main's 'sb artifact add <url> --title …' is an artifact card with its title;
//   - answered / approval: his answer to gift-ui's card #2 from the TUI, '/answer 2 no: <note>'
//     on the merge card: whatever rows the hub types for them, next to the TUI's lines (the world
//     has no tool approval in yolo, nor main answering for him: said in the annotations);
//   - from_agent 'a → b': gift-ui's message to main in main's view names only the sender.
import path from 'node:path';
import { test, expect } from '../../harness';
import { Lines } from '../native/world';
import { hubOf, launchOn, realWorld, transcriptHas, tui, tuiReady, worldSay, type Tui } from '../world';

const T = {
  field: '[data-testid="composer.field"]',
  list: '[data-testid="thread.list"]',
  landed: '[data-testid^="thread.landed."]:not([data-testid$=".sha"])',
  pr: '[data-testid^="thread.pr."]:not([data-testid$=".link"])',
  artifact: '[data-testid^="thread.artifact."]',
  answered: '[data-testid^="thread.answered."]',
  approval: '[data-testid^="thread.approval."]',
  review: '[data-testid="review.screen"]',
};
const EXTERNAL = 'bise-desktop: external';
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const flat = (s: string): string => s.replace(/[│╭╮╰╯─┃├┤┬┴]/g, ' ').replace(/\s+/g, ' ');

async function tuiCmd(t: Tui, line: string): Promise<string> {
  for (let i = 0; i < 40; i++) t.keys('BSpace');
  t.keys('-l', line);
  await sleep(500);
  if (/┃\s*\/\w/.test(t.screen().split('\n').slice(-12).join('\n'))) t.keys('Escape');
  t.keys('Enter');
  const seen: string[] = [];
  for (let i = 0; i < 8; i++) {
    await sleep(300);
    seen.push(t.screen());
  }
  return seen.join('\n');
}

test("thread/news-real: landed, PR news, artifact, answered, approval and agent rows on the real core, next to the TUI's lines", async () => {
  test.setTimeout(480_000);
  const w = realWorld();
  const shop = hubOf(w, 'shop');
  const project = path.basename(path.dirname(shop.sock));
  const n = `n${Date.now() % 1_000_000}`;
  const s = await launchOn(w, `project/${project}`, T.field);
  const out = new Lines();
  s.app.process().stdout?.setEncoding('utf8');
  s.app.process().stdout?.on('data', (d: string) => {
    out.push(d);
  });
  let t: Tui | undefined;
  const term = (): Tui => {
    if (t === undefined) throw new Error('no TUI');
    return t;
  };
  const { page } = s;
  const list = page.locator(T.list);
  const toThread = async () => {
    // the thread's list, not the composer: a commit screen has the composer too (63eb6c0a: the
    // landed sha's commit stayed open and the PR step looked for rows and ⌘F there)
    if (await page.locator(T.list).isVisible()) return;
    await page.locator(`[data-testid="app.sidebar.project.${project}"]`).click({ timeout: 10_000 });
    await expect(page.locator(T.list), "back in shop's thread").toBeVisible({ timeout: 10_000 });
  };
  const note = (type: string, v: unknown) => test.info().annotations.push({ type, description: typeof v === 'string' ? v : JSON.stringify(v) });
  try {
    await expect(page.locator(T.field).first(), "shop's main thread").toBeVisible({ timeout: 15_000 });
    t = tui(w, 'shop');
    await tuiReady(t);
    await page.screenshot({ path: test.info().outputPath('opened.png') });

    await test.step('landed', async () => {
      const row = list.locator(T.landed).filter({ hasText: 'gift-api' }).first();
      await expect.soft(row, "the seed's gift-api landing is a landed row").toBeVisible({ timeout: 15_000 });
      const words = ((await row.textContent().catch(() => '')) ?? '').trim();
      const sha = /\b[0-9a-f]{7,}\b/.exec(words)?.[0] ?? '';
      const tuiLine = /gift-api landed[^·]*?\(([0-9a-f]{7,})\)/.exec(flat(term().screen()));
      note('landed', { window: words, tui: tuiLine?.[0] ?? '' });
      // the seeds land more than once since b571ced9: the window's sha must be one the TUI shows for gift-api
      expect.soft(sha !== '' && flat(term().screen()).includes(`(${sha})`), `the TUI shows the window's sha (${sha})`).toBe(true);
      await row.screenshot({ path: test.info().outputPath('landed.png') }).catch(() => undefined);
      const link = page.locator(`[data-testid="${(await row.getAttribute('data-testid', { timeout: 2000 }).catch(() => null)) ?? 'none'}.sha"]`);
      await link.click({ timeout: 5000 }).catch(() => undefined);
      await expect.soft(page.locator(T.review), 'its sha opens that commit').toBeVisible({ timeout: 10_000 });
      await page.screenshot({ path: test.info().outputPath('landed-commit.png') });
      await toThread();
    });

    await test.step('pr', async () => {
      // #412 has several news rows ('opened', then 'checks fail: e2e'): the failing one is the TUI's '↑ #412 checks fail'
      note('pr-rows', (await list.locator(T.pr).allTextContents()).map((r) => r.trim().slice(0, 120)));
      // wait on the row's event, not a time (bar S21): the hub's own feed line for #412's failing
      // checks ('sb pr : red : 412 : … : checks fail: e2e …' in main's transcript), then go to it
      // as he would, with the thread's find (⌘F): only the rows near the view are drawn, and the
      // seeds push it up the thread
      await expect.poll(() => transcriptHas(w, 'shop', 'main', 'sb pr : red : 412'), { timeout: 60_000, message: "the hub's event: #412's checks fail" }).toBe(true);
      const row = list.locator(T.pr).filter({ hasText: '#412' }).filter({ hasText: 'checks fail' }).last();
      // the thread as it is when the hub has the event: its PR rows, or none
      note('pr-rows-at-event', (await list.locator(T.pr).allTextContents()).map((r) => r.trim().slice(0, 120)));
      await page.screenshot({ path: test.info().outputPath('pr-at-event.png') });
      if ((await row.count()) === 0) {
        await page.locator(T.field).first().click();
        await page.keyboard.press('Meta+f');
        await sleep(500);
        // the ⌘F moment, framed whatever happens (12a9efbf/63eb6c0a: its field never showed)
        await page.screenshot({ path: test.info().outputPath('find.png') });
        note('find-after-cmd-f', { field: await page.locator('[data-testid="thread.find.field"]').count(), bar: await page.locator('[data-testid="thread.find"]').count(), focused: await page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.tagName ?? '') });
        await page.locator('[data-testid="thread.find.field"]').waitFor({ timeout: 5000 });
        await page.keyboard.type('checks fail: e2e');
        await page.keyboard.press('Enter');
        await expect.soft(row, 'find brings it into view').toBeVisible({ timeout: 10_000 });
        note('pr-find', ((await page.locator('[data-testid="thread.find.count"]').textContent({ timeout: 2000 }).catch(() => '')) ?? '').trim());
      }
      await expect.soft(row, "#412's failing checks are a pr row").toBeVisible({ timeout: 15_000 });
      await row.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => undefined);
      // the row by its own id from here: the filtered locator above can drift while the thread
      // redraws around find (12a9efbf: its text read empty); assertions retry, no one-shot read
      const rowId = (await row.getAttribute('data-testid', { timeout: 5000 }).catch(() => null)) ?? '';
      const pr = rowId !== '' ? page.locator(`[data-testid="${rowId}"]`) : row;
      await expect.soft(pr, "failing said by '▲', never color alone").toContainText('▲', { timeout: 5000 });
      await expect.soft(pr, "the hub's words, as the TUI").toContainText('checks fail', { timeout: 5000 });
      await expect.soft(pr, 'failing: an err tone').toHaveAttribute('data-tone', 'err', { timeout: 5000 });
      const words = ((await pr.textContent({ timeout: 2000 }).catch(() => '')) ?? '').trim();
      note('pr', { id: rowId, window: words, tone: await pr.getAttribute('data-tone', { timeout: 2000 }).catch(() => null), tuiHas: flat(term().screen()).includes('#412 checks fail: e2e') });
      await pr.screenshot({ path: test.info().outputPath('pr.png') }).catch(() => undefined);
      // the number is a button (rows.tsx PrRow: ctx.onLink(url)); the world's fake gh seeds
      // https://github.com/acme-qa/shop/pull/412. Every miss is said: the row's id, the link's
      // words, the click's error (no silent catch), main's stdout
      const id = await row.getAttribute('data-testid', { timeout: 2000 }).catch((e: unknown) => `none: ${String(e).split('\n')[0] ?? ''}`);
      const link = row.locator('button[data-testid$=".link"]');
      await link.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => undefined);
      const linkWords = await link.textContent({ timeout: 2000 }).catch((e: unknown) => `none: ${String(e).split('\n')[0] ?? ''}`);
      const clicked = await link.click({ timeout: 5000 }).then(() => 'ok', (e: unknown) => String(e).split('\n')[0] ?? 'error');
      const url = await out.wait(EXTERNAL, () => true, 5000).catch((e: unknown) => `none: ${String(e).split('\n')[0] ?? ''}`);
      note('pr-open', { id, link: linkWords, clicked, url, stdout: out.lines.filter((l) => l.includes('bise-desktop')).slice(-5) });
      expect.soft(clicked, "a click on the PR's number").toBe('ok');
      expect.soft(url, 'its number opens the PR').toContain('/pull/412');
      // find left the thread up at #412: close it and go back to the end, where the next rows are
      await page.keyboard.press('Escape');
      await page.locator(T.field).first().click().catch(() => undefined);
      await page.keyboard.press('End');
      await page.keyboard.press('Meta+ArrowDown').catch(() => undefined);
      await sleep(800);
    });

    await test.step('artifact', async () => {
      const title = `the logo ${n}`;
      worldSay('shop', `[[bash: sb artifact add https://x.test/logo-${n} --title "${title}"]] made it`);
      const row = list.locator(T.artifact).filter({ hasText: title }).first();
      await expect.soft(row, 'an artifact card with its title').toBeVisible({ timeout: 30_000 });
      await sleep(1000);
      note('artifact', { window: ((await row.textContent().catch(() => '')) ?? '').trim(), tuiHas: flat(term().screen()).includes(title) });
      expect.soft(flat(term().screen()), 'the TUI shows it too').toContain(title);
      await row.screenshot({ path: test.info().outputPath('artifact.png') }).catch(() => undefined);
    });

    await test.step('answered: his answer to gift-ui from the TUI', async () => {
      const seen = await tuiCmd(term(), '/answer 2 on the cart page');
      note('answer-tui', flat(seen).slice(-500));
      await sleep(3000);
      const rows = await list.locator(`${T.answered}, ${T.approval}`).allTextContents();
      note('answer-rows', rows.map((r) => r.trim()));
      await page.screenshot({ path: test.info().outputPath('answered.png') });
    });

    // amb-tools' seeds (b571ced9): release's 'git push --force …' card answered 'no: use a branch,
    // never force main' as him (shop), alerts' question answered by main itself with --why
    // (telemetry), receipts' message to checkout (shop)
    await test.step('approval: his no with its note (seeded)', async () => {
      const row = list.locator(T.approval).filter({ hasText: 'git push --force' }).first();
      await expect.soft(row, "release's force push said no to: an approval row").toBeVisible({ timeout: 15_000 });
      const words = ((await row.textContent({ timeout: 2000 }).catch(() => '')) ?? '').trim();
      const tuiScreen = flat(term().screen());
      // data-ok sits on the row's wrapper (.th-approval), not on the bubble that carries the
      // thread.approval.<pos> id (105f0c5d read the bubble: 'no data-ok' was this check's miss;
      // thread/approval-raw showed the entry's approval.ok false and the wrapper's data-ok 'false')
      const wrap = row.locator('xpath=ancestor-or-self::*[contains(@class,"th-approval")][1]');
      note('approval', { window: words, ok: await wrap.getAttribute('data-ok', { timeout: 2000 }).catch(() => null), tuiHasNote: tuiScreen.includes('use a branch, never force main'), tuiLine: /[^·]{0,60}git push --force[^·]{0,80}/.exec(tuiScreen)?.[0] ?? '' });
      await expect.soft(wrap, 'said no').toHaveAttribute('data-ok', 'false');
      expect.soft(words, "'✕', never color alone").toContain('✕');
      expect.soft(words, 'who it was').toContain('release');
      expect.soft(words, 'his note under it').toContain('use a branch, never force main');
      expect.soft(tuiScreen, "the TUI's line has the same note").toContain('use a branch, never force main');
      await row.screenshot({ path: test.info().outputPath('approval.png') }).catch(() => undefined);
    });

    await test.step('from_agent: receipts → checkout in main\'s view (seeded)', async () => {
      const row = list.locator('[data-testid^="thread.entry."]').filter({ hasText: 'does total() round before or after the code' }).first();
      await expect.soft(row, "receipts' message to checkout shows in main's thread").toBeVisible({ timeout: 15_000 });
      const words = ((await row.textContent({ timeout: 2000 }).catch(() => '')) ?? '').trim();
      note('from-agent', { window: words.slice(0, 200), tuiHas: flat(term().screen()).includes('receipts → checkout') });
      expect.soft(words, "a message between two other agents names both: 'receipts → checkout'").toContain('receipts → checkout');
      await row.screenshot({ path: test.info().outputPath('from-agent.png') }).catch(() => undefined);
    });

    await test.step("from_agent: gift-ui → main in main's view", async () => {
      const head = list.locator('[data-testid^="thread.entry."]').filter({ hasText: 'waiting for your answer' }).first();
      const words = ((await head.textContent().catch(() => '')) ?? '').trim();
      note('from-agent-main', words.slice(0, 200));
      expect.soft(words, "the sender's name").toContain('gift-ui');
      expect.soft(words, "sent to the agent in view: only the sender, no 'gift-ui → bise'").not.toMatch(/gift-ui → (main|bise)/);
    });

    await test.step('answered for him: main answers alerts (telemetry, seeded)', async () => {
      const tele = path.basename(path.dirname(hubOf(w, 'telemetry').sock));
      await page.locator(`[data-testid="app.sidebar.project.${tele}"]`).click({ timeout: 10_000 });
      const row = page.locator(T.list).locator(T.answered).filter({ hasText: 'alerts' }).first();
      await expect.soft(row, "main's answer for him to alerts: an answered row").toBeVisible({ timeout: 15_000 });
      const words = ((await row.textContent({ timeout: 2000 }).catch(() => '')) ?? '').trim();
      const tt = tui(w, 'telemetry');
      try {
        await tuiReady(tt);
        const tuiScreen = flat(tt.screen());
        note('answered-for-you', { window: words, tuiHasAnswer: tuiScreen.includes('PagerDuty'), tuiHasWhy: tuiScreen.includes('the runbook pages on-call through PagerDuty') });
        test.info().attachments.push({ name: 'tui-telemetry', contentType: 'text/plain', body: Buffer.from(tt.screen()) });
        expect.soft(tuiScreen, "the TUI's answered line").toContain('PagerDuty');
      } finally {
        tt.close();
      }
      expect.soft(words, "'answered alerts for you'").toContain('answered alerts for you');
      expect.soft(words, 'the answer').toContain('PagerDuty');
      expect.soft(words, 'and why, under it').toContain('the runbook pages on-call through PagerDuty');
      await row.screenshot({ path: test.info().outputPath('answered-for-you.png') }).catch(() => undefined);
    });
    test.info().attachments.push({ name: 'tui', contentType: 'text/plain', body: Buffer.from(term().screen()) });
  } finally {
    t?.close();
    await s.close();
  }
});
