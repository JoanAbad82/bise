// inbox/approvals · bar O.1 (a tool call that needs approval is a card with approve and deny, in ⌘I
// too; the agent goes on after approve), da90eaec / ambient-lead m_12176. Owner: qa-flows.
// The NEW app on the REAL core over the throwaway world. As amb-tools' approval seed (b571ced9):
// shop's hub goes auto for this session ({op: approvals, mode: auto} on its socket; BISE_APPROVALS
// keeps config.toml on yolo), shop's main tries a forced push to a missing local path (a hard rule:
// a card even in auto; never the network), then yolo again at the end. Passes when:
//   - the call is a card in ⌘I with its options (allow … no);
//   - allow (a click on its option) closes the card and main goes on: the call runs (its output,
//     the push's error on a missing path, reaches main's transcript);
//   - a second call, no: the card closes and the call never runs.

import path from 'node:path';
import { readFileSync } from 'node:fs';
import { test, expect } from '../../harness';
import { hubCall, hubOf, hubState, launchOn, realWorld, worldSay } from '../world';
import type { Page } from '@playwright/test';

// one inbox (designer m_19631): no ⌘I screen; the block at the bottom of the view opens items in place
const T = {
  root: '[data-testid="inbox.block"]',
};

/** Open that card in the block: its row is listed by rank, ↓ walks the open item to it. */
async function openCard(page: Page, key: string): Promise<void> {
  const card = page.getByTestId(`inbox.block.card.${key}`);
  if (!(await page.locator('[data-testid^="inbox.block.open."]').isVisible())) await page.getByTestId('inbox.block.row.1').click({ timeout: 15_000 });
  for (let i = 0; i < 10 && !(await card.isVisible()); i++) {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(150);
  }
  await expect.soft(card, 'the card is in the inbox').toBeVisible({ timeout: 5000 });
}

test('inbox/approvals: a gated call is a card in ⌘I; allow lets main go on, no stops the call', async () => {
  test.setTimeout(300_000);
  const w = realWorld();
  const shop = hubOf(w, 'shop');
  const project = path.basename(path.dirname(shop.sock));
  const n = `a${Date.now() % 1_000_000}`;
  const nowhere = path.join(w.home, `nowhere-${n}.git`);
  const transcript = () => { try { return readFileSync(path.join(path.dirname(shop.sock), 'agents', 'main', 'transcript.log'), 'utf8'); } catch { return ''; } };
  const cards = async () => ((await hubState(shop.sock))['cards'] as { id: number; text?: string; question?: string; kind?: string }[] | undefined) ?? [];
  const gated = async (tag: string) => (await cards()).find((c) => `${c.text ?? ''}${c.question ?? ''}`.includes(tag));
  const note = (type: string, v: unknown) => test.info().annotations.push({ type, description: typeof v === 'string' ? v : JSON.stringify(v) });
  await hubCall(shop.sock, 'approvals/set', { mode: 'auto' });
  const s = await launchOn(w, `project/${project}`, T.root);
  const { page } = s;
  try {
    await expect(page.locator(T.root)).toBeVisible({ timeout: 15_000 });

    await test.step('allow: the card closes and main goes on', async () => {
      const tag = `HEAD:qa-allow-${n}`;
      worldSay('shop', `[[bash: git push --force ${nowhere} ${tag}]] pushing`);
      await expect.poll(async () => (await gated(tag)) !== undefined, { timeout: 60_000, message: 'the gated call is a card in the hub' }).toBe(true);
      const c = await gated(tag);
      note('allow-card', c);
      // its row shows the card's first line ('wants to run'), not the command: found by its id
      const k = `${project}-${String(c?.id ?? 0)}`;
      await openCard(page, k);
      const opts = await page.locator(`[data-testid^="inbox.block.card.${k}.opt."]`).allTextContents();
      note('allow-options', opts);
      expect.soft(opts.join(' ').toLowerCase(), 'its options: allow … no').toMatch(/allow[\s\S]*no/);
      await page.screenshot({ path: test.info().outputPath('card.png') });
      await page.locator(`[data-testid="inbox.block.card.${k}.opt.1"]`).click({ timeout: 5000 });
      await expect.soft.poll(async () => (await gated(tag)) === undefined, { timeout: 15_000, message: 'allow: the card closes' }).toBe(true);
      await expect.soft.poll(() => /qa-allow-[\s\S]*(does not appear|not a git repository|fatal|No such file)/i.test(transcript().slice(transcript().lastIndexOf(`qa-allow-${n}`) - 400)), { timeout: 30_000, message: 'main goes on: the call ran (the push fails on a missing path)' }).toBe(true);
    });

    await test.step('no: the card closes and the call never runs', async () => {
      const tag = `HEAD:qa-deny-${n}`;
      worldSay('shop', `[[bash: git push --force ${nowhere} ${tag}]] pushing`);
      await expect.poll(async () => (await gated(tag)) !== undefined, { timeout: 60_000, message: 'the second call is a card' }).toBe(true);
      const d = await gated(tag);
      note('deny-card', d);
      const k = `${project}-${String(d?.id ?? 0)}`;
      await openCard(page, k);
      const no = page.locator(`[data-testid^="inbox.block.card.${k}.opt."]`, { hasText: /^\s*\d?\s*no\b/i }).first();
      await no.click({ timeout: 5000 });
      await expect.soft.poll(async () => (await gated(tag)) === undefined, { timeout: 15_000, message: 'no: the card closes' }).toBe(true);
      await page.waitForTimeout(3000);
      const tail = transcript().slice(transcript().lastIndexOf(`qa-deny-${n}`) - 200);
      note('deny-tail', tail.slice(-600));
      expect.soft(/qa-deny-[\s\S]*(does not appear|not a git repository|fatal|No such file)/i.test(tail), 'the call never ran').toBe(false);
      await page.screenshot({ path: test.info().outputPath('denied.png') });
    });
  } finally {
    await hubCall(shop.sock, 'approvals/set', { mode: 'yolo' }).catch(() => undefined);
    await s.close();
  }
});
