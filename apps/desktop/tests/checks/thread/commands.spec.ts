// thread/commands · bar C3, C13, C40, C42 and the typed slash path (docs/desktop-bar.md; amb-feed
// cd021d67 HubCmd slash, amb-win e07f33e1 sends every hub line as typed, amb-home 44ebcc7a the
// hub's lines in the window; ambient-lead m_11060). Owner: qa-flows. The NEW app on the REAL core
// over the throwaway world (../world.ts), shop's main thread, the TUI on the same hub as the
// reference. Each part a step, soft, so one red keeps the others:
//   - C40: /undo and /cancel say the hub's no-undo line, the TUI's words, and nothing reaches main;
//   - C42: /flow pr sets it (the hub's line), /flow then says which, as the TUI's /flow;
//   - C13: /artifacts add <url> is in /artifacts (the window's screen and the TUI's) and in the thread;
//   - C3: /new -w --with-changes <name>: … starts the agent on its own worktree with his change,
//     his tree keeps it too (copied, as the TUI); the TUI's panel lists it;
//   - typed slash: /compact (compacting, then the folded summary), /close N on a real card (it leaves
//     the hub) and /close 999 (refused), /help (the key list), a refused line
//     ('/new --with-changes x: y') in place with the TUI's words.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubAgents, hubOf, hubState, launchOn, realWorld, transcriptHas, tui, tuiAgents, tuiReady, type Tui } from '../world';

const T = {
  field: '[data-testid="composer.field"]',
  list: '[data-testid="thread.list"]',
  notice: '[data-testid="confirm.notice"]',
  help: '[data-testid="help.overlay"]',
  compacting: '[data-testid^="thread.compacting."]',
  compacted: '[data-testid^="thread.compacted."][data-testid$=".head"]',
};
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const flat = (s: string): string => s.replace(/[│╭╮╰╯─┃├┤┬┴]/g, ' ').replace(/\s+/g, ' ');
const git = (cwd: string, ...a: string[]): string => execFileSync('git', ['-C', cwd, ...a], { encoding: 'utf8', timeout: 20_000 });

/** The TUI's prompt: a slash line with arguments opens its picker on Enter: esc it first. Returns
 *  every screen of the next 2.4 s, joined: a TUI line for a command can be a short-lived flash. */
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

test('thread/commands: /undo /cancel /flow /artifacts add /new -w --with-changes and the typed slash path, next to the TUI', async () => {
  test.setTimeout(360_000);
  const w = realWorld();
  const shop = hubOf(w, 'shop');
  const project = path.basename(path.dirname(shop.sock));
  const n = `c${Date.now() % 1_000_000}`;
  const s = await launchOn(w, `project/${project}`, T.field);
  let t: Tui | undefined;
  const term = (): Tui => {
    if (t === undefined) throw new Error('no TUI');
    return t;
  };
  const { page } = s;
  const say = async (line: string) => {
    const field = page.locator(T.field).first();
    await field.click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(line);
    await sleep(300);
    await page.keyboard.press('Enter');
  };
  /** the hub's line for his last command, in the window: waits for words other than `before` */
  const noticeAfter = async (before: string): Promise<string> => {
    const box = page.locator(T.notice);
    await expect.poll(async () => ((await box.textContent().catch(() => '')) ?? '').trim(), { timeout: 10_000 }).not.toBe(before);
    return ((await box.textContent().catch(() => '')) ?? '').trim();
  };
  const noticeNow = async (): Promise<string> => ((await page.locator(T.notice).textContent({ timeout: 500 }).catch(() => '')) ?? '').trim();
  /** back to shop's main thread from another screen: its sidebar row, as his click */
  const toThread = async () => {
    if (await page.locator(T.field).first().isVisible()) return;
    await page.locator(`[data-testid="app.sidebar.project.${project}"]`).click({ timeout: 10_000 });
    await expect(page.locator(T.field).first(), "back in shop's thread").toBeVisible({ timeout: 10_000 });
  };
  const words = (label: string, window: string, tuiScreen: string) => {
    const head = flat(window).slice(0, 32);
    test.info().annotations.push({ type: label, description: JSON.stringify({ window, inTui: head !== '' && flat(tuiScreen).includes(head) }) });
    return head;
  };
  try {
    await expect(page.locator(T.field).first(), "shop's main thread").toBeVisible({ timeout: 15_000 });
    t = tui(w, 'shop');
    await tuiReady(t);
    await page.screenshot({ path: test.info().outputPath('opened.png') });

    await test.step('C40 /undo and /cancel', async () => {
      for (const cmd of ['/undo', '/cancel']) {
        const before = await noticeNow();
        await say(cmd);
        const said = await noticeAfter(before).catch(() => '');
        expect.soft(said, `${cmd}: the hub's no-undo line in the window`).toContain('no undo: an agent may already have acted');
        const seen = await tuiCmd(term(), cmd);
        const head = words(cmd, said, seen);
        expect.soft(flat(seen), `${cmd}: the TUI says the same words`).toContain(head);
        await page.locator(T.notice).screenshot({ path: test.info().outputPath(`${cmd.slice(1)}.png`) }).catch(() => undefined);
        // a later line about this command would sit in the transcript under its own words
        expect.soft(transcriptHas(w, 'shop', 'main', cmd), `${cmd}: nothing reaches main`).toBe(false);
      }
      test.info().attachments.push({ name: 'tui-undo', contentType: 'text/plain', body: Buffer.from(term().screen()) });
    });

    await test.step('C42 /flow pr then /flow', async () => {
      let before = await noticeNow();
      await say('/flow pr');
      const set = await noticeAfter(before).catch(() => '');
      test.info().annotations.push({ type: 'flow-set', description: set });
      expect.soft(set, '/flow pr: the hub says it is set').toMatch(/pr/i);
      before = set;
      await say('/flow');
      const which = await noticeAfter(before).catch(async () => noticeNow());
      expect.soft(which, '/flow: says which (pr)').toMatch(/\bpr\b|pull request/i);
      const seen = await tuiCmd(term(), '/flow');
      const head = words('flow-which', which, seen);
      expect.soft(flat(seen), "/flow: the TUI's words").toContain(head);
      test.info().attachments.push({ name: 'tui-flow', contentType: 'text/plain', body: Buffer.from(term().screen()) });
      await page.screenshot({ path: test.info().outputPath('flow.png') });
    });

    await test.step('C13 /artifacts add <url>', async () => {
      const url = `https://x.test/${n}`;
      const before = await noticeNow();
      await say(`/artifacts add ${url}`);
      const said = await noticeAfter(before).catch(() => '');
      test.info().annotations.push({ type: 'artifacts-add', description: said });
      await sleep(1500);
      await expect.soft(page.locator(T.list).getByText(`x.test/${n}`).first(), 'a chip / row in the thread').toBeVisible({ timeout: 8000 });
      await page.screenshot({ path: test.info().outputPath('artifact-thread.png') });
      await say('/artifacts');
      await expect.soft(page.getByText(`x.test/${n}`).first(), "the window's /artifacts lists it").toBeVisible({ timeout: 10_000 });
      await page.screenshot({ path: test.info().outputPath('artifacts.png') });
      const seenAdd = await tuiCmd(term(), `/artifacts add ${url}-tui`);
      test.info().annotations.push({ type: 'artifacts-add-tui', description: flat(seenAdd).slice(-600) });
      await tuiCmd(term(), '/artifacts');
      await sleep(1000);
      const tuiHas = flat(term().screen()).includes(`x.test/${n}`);
      test.info().attachments.push({ name: 'tui-artifacts', contentType: 'text/plain', body: Buffer.from(term().screen()) });
      expect.soft(tuiHas, "the TUI's /artifacts lists it").toBe(true);
      term().keys('Escape');
      await sleep(500);
      await toThread();
    });

    await test.step('C3 /new -w --with-changes', async () => {
      const ws = shop.ws;
      // a change to a tracked file: --with-changes carries what `git stash create` takes (worktree.rs),
      // never an untracked file, in the TUI too
      const file = git(ws, 'ls-files').split('\n').find((f) => f.endsWith('.py') || f.endsWith('.md')) ?? 'README.md';
      writeFileSync(path.join(ws, file), `${readFileSync(path.join(ws, file), 'utf8')}\n# his change ${n}\n`);
      const name = `wt${n}`;
      await expect(page.locator(T.field).first()).toBeVisible({ timeout: 10_000 });
      await say(`/new -w --with-changes ${name}: qa check, keep the change and do nothing else`);
      const agent = async () => (await hubAgents(w, 'shop')).find((a) => a.name === name);
      await expect.soft.poll(async () => (await agent()) !== undefined, { timeout: 30_000, message: 'the hub starts it' }).toBe(true);
      const a = await agent();
      const wtPath = a?.path ?? git(ws, 'worktree', 'list').split('\n').find((l) => l.includes(name))?.split(/\s+/)[0] ?? '';
      test.info().annotations.push({ type: 'c3', description: JSON.stringify({ branch: a?.branch, path: wtPath, notice: await noticeNow() }) });
      expect.soft(wtPath !== '' && path.resolve(wtPath) !== path.resolve(ws), 'its own worktree').toBe(true);
      await expect.soft.poll(() => wtPath !== '' && existsSync(path.join(wtPath, file)) && readFileSync(path.join(wtPath, file), 'utf8').includes(`his change ${n}`), { timeout: 15_000, message: 'his change moved into the new worktree' }).toBe(true);
      const status = git(ws, 'status', '--porcelain');
      test.info().attachments.push({ name: 'his-status', contentType: 'text/plain', body: Buffer.from(status) });
      // copied, never moved (ambient-lead m_11252: the TUI is the bar): his tree keeps the edit too,
      // as worktree.rs with_changes_carries_the_user_edits asserts
      expect.soft(status.includes(file), 'copied: his tree keeps his edit').toBe(true);
      await expect.soft.poll(() => tuiAgents(t?.screen() ?? '').some((x) => x.name === name), { timeout: 10_000, message: "the TUI's panel lists it" }).toBe(true);
      await page.screenshot({ path: test.info().outputPath('new-wt.png') });
    });

    await test.step('a refused line in place', async () => {
      await toThread();
      const before = await noticeNow();
      await say('/new --with-changes x: y');
      const said = await noticeAfter(before).catch(() => '');
      expect.soft(said, "the hub's refusal in place").toContain('--with-changes only works with -w');
      await expect.soft(page.locator(T.notice), 'as an error').toHaveAttribute('data-level', 'error');
      const seen = await tuiCmd(term(), '/new --with-changes x: y');
      const head = words('refused', said, seen);
      expect.soft(flat(seen), "the TUI's words").toContain(head);
      test.info().attachments.push({ name: 'tui-refused', contentType: 'text/plain', body: Buffer.from(term().screen()) });
      await page.screenshot({ path: test.info().outputPath('refused.png') });
    });

    await test.step('/help', async () => {
      const before = await noticeNow();
      await say('/help');
      await sleep(1000);
      const overlay = await page.locator(T.help).isVisible();
      const now = await noticeNow();
      test.info().annotations.push({ type: 'help', description: JSON.stringify({ overlay, notice: now !== before ? now : '' }) });
      expect.soft(overlay || now !== before, '/help shows the keys (the key list or the hub help notice)').toBe(true);
      await page.screenshot({ path: test.info().outputPath('help.png') });
      if (overlay) await page.keyboard.press('Escape');
    });

    await test.step('/compact', async () => {
      await say(`a line before the compaction ${n}`);
      await expect(page.locator(T.list).getByText('ack:').last(), 'the answer came').toBeVisible({ timeout: 30_000 }).catch(() => undefined);
      await say('/compact');
      const list = page.locator(T.list);
      const seen = await Promise.race([
        list.locator(T.compacting).last().waitFor({ timeout: 30_000 }).then(() => 'compacting'),
        list.locator(T.compacted).last().waitFor({ timeout: 30_000 }).then(() => 'compacted'),
      ]).catch(() => 'none');
      test.info().annotations.push({ type: 'compact-first', description: seen });
      expect.soft(seen, '/compact: compacting… shows').not.toBe('none');
      await expect.soft(list.locator(T.compacted).last(), "then the folded 'context compacted'").toBeVisible({ timeout: 60_000 });
      await page.screenshot({ path: test.info().outputPath('compact.png') });
      test.info().attachments.push({ name: 'tui-compact', contentType: 'text/plain', body: Buffer.from(term().screen()) });
    });

    // last: the TUI's '/close 999' panicked shop's hub on cfeb8b4b ('sb-core: json: number too large',
    // core.rs Hub::core from user_cmd Close), so nothing else runs after it
    await test.step('/close N on a real card, /close 999 refused', async () => {
      const cards = ((await hubState(shop.sock))['cards'] as { id: number }[] | undefined) ?? [];
      test.info().annotations.push({ type: 'cards', description: JSON.stringify(cards.map((c) => c.id)) });
      const card = cards[0];
      if (card === undefined) {
        test.info().annotations.push({ type: 'close-real', description: 'shop has no open card: /close N on a real card not run' });
      } else {
        await say(`/close ${card.id}`);
        await expect.soft.poll(async () => (((await hubState(shop.sock))['cards'] as { id: number }[] | undefined) ?? []).some((c) => c.id === card.id), { timeout: 10_000, message: `/close ${card.id}: the card leaves the hub` }).toBe(false);
        test.info().annotations.push({ type: 'close-real', description: JSON.stringify({ id: card.id, notice: await noticeNow() }) });
      }
      const before = await noticeNow();
      await say('/close 999');
      const said = await noticeAfter(before).catch(() => '');
      test.info().annotations.push({ type: 'close-999', description: said });
      expect.soft(said, '/close 999: the hub says why, in place').not.toBe('');
      const seen = await tuiCmd(term(), '/close 999');
      test.info().attachments.push({ name: 'tui-close-999', contentType: 'text/plain', body: Buffer.from(seen) });
      const head = words('close-999-tui', said, seen);
      expect.soft(flat(seen), "/close 999: the TUI's words").toContain(head);
      await sleep(1500);
      const alive = await hubState(shop.sock, 5000).then(() => true, () => false);
      expect.soft(alive, "shop's hub still answers after the TUI's /close 999").toBe(true);
    });
  } finally {
    if (t) {
      test.info().attachments.push({ name: 'tui', contentType: 'text/plain', body: Buffer.from(t.screen()) });
      t.close();
    }
    await s.close();
  }
});
