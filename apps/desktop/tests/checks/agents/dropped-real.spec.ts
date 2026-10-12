// agents/dropped-real · amb-tools' as-he-does run on the cut 724c0bb9 (ambient-lead m_20101): main
// spawns two agents and drops one, then he types /agents in main's composer. The REAL core over the
// throwaway world (../world.ts), run through tests/checks/real.sh. Owner: amb-home.
// Found: the window was right. The seed dropped gone in the turn that spawned it, so the hub asked
// him with a card instead of archiving it (core.bend drop.decide: mid-turn -> DAsk), and gone was
// still live. That card is a question for him like any other (the TUI shows it): ambient-lead
// m_20142. Passes when, on telemetry, after main's `sb spawn keeper-N && sb spawn gone-N && sb drop
// gone-N` in one turn (gone-N mid-turn):
//   - the hub asks with a 'drop' card naming @gone-N, and gone-N stays live;
//   - that card is in his inbox block on main's thread, opens in place, and 'yes' typed in the
//     composer answers it: the hub archives gone-N (status 'done', archived true);
//   - /agents typed in main's composer lists keeper-N and never gone-N;
//   - /archived lists gone-N with its restore, and never keeper-N.
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubAgents, hubOf, hubState, launchOn, realWorld, worldSay } from '../world';

const T = {
  thread: '[data-testid="thread.screen"]',
  field: '[data-testid="composer.field"]',
  screen: '[data-testid="agents.screen"]',
  row: (n: string) => `[data-testid="agents.row.${n}"]`,
  restore: (n: string) => `[data-testid="agents.restore.${n}"]`,
};

test('agents/dropped-real: a drop mid-turn asks him in the inbox; yes archives it: out of /agents, under /archived', async () => {
  test.setTimeout(180_000);
  const w = realWorld();
  const P = 'telemetry';
  const project = path.basename(path.dirname(hubOf(w, P).sock));
  const n = String(Date.now() % 1_000_000);
  const keeper = `keeper-${n}`;
  const gone = `gone-${n}`;
  const s = await launchOn(w, `project/${project}`, T.field);
  try {
    const { page } = s;
    // the real core starts with the window ('starting bise…'): main's thread comes once it is up
    await expect(page.locator(`${T.thread} ${T.field}`), "main's thread and its composer").toBeVisible({ timeout: 60_000 });
    // main's side, as amb-tools' as-he-does seed on 724c0bb9: two spawns and the drop in one turn.
    // gone is mid-turn then: the hub doesn't archive it, it asks him with a 'drop' card ('main
    // suggests: archive @gone? the agent is mid-turn. (answer yes or no)')
    // Each command in its own bash block: one `a && b && sb drop` ran before gone's first turn began,
    // and a drop at rest archives at once (no card); its own block finds gone in its first turn.
    worldSay(P, `[[bash: sb spawn ${keeper} --objective "keep the dashboard green"]] [[bash: sb spawn ${gone} --objective "a task main drops"]] [[bash: sb drop ${gone}]]`);
    const row = async (name: string) => (await hubAgents(w, P)).find((a) => a.name === name) as ({ status: string; archived?: boolean } | undefined);
    // the hub sends bise's own cards (a drop, a done, a merge...) under hub/cards' `others`, his
    // under `cards`: the TUI's inbox lists both, and so must the window (the store merges them)
    const dropCard = async () => {
      const st = await hubState(hubOf(w, P).sock);
      const all = [...((st['cards'] as unknown[] | undefined) ?? []), ...((st['others'] as unknown[] | undefined) ?? [])] as { kind?: string; text?: string; id?: number }[];
      return all.find((c) => c.kind === 'drop' && (c.text ?? '').includes(`@${gone}`));
    };
    await expect.poll(async () => (await row(keeper))?.status, { timeout: 30_000, message: `the hub has ${keeper}` }).toBeTruthy();
    await expect.poll(async () => (await dropCard())?.kind, { timeout: 30_000, message: `the hub asks him to drop ${gone} (mid-turn)` }).toBe('drop');
    expect((await row(gone))?.archived ?? false, `${gone} stays live until he answers`).toBe(false);
    test.info().annotations.push({ type: 'card', description: JSON.stringify(await dropCard()) });

    // his side: the card is in the inbox block on main's thread, like any card
    const block = page.locator('[data-testid="inbox.block"]');
    const open = block.locator('[data-testid^="inbox.block.open."]');
    await expect(block, 'the inbox block on main’s thread').toBeVisible({ timeout: 15_000 });
    const itsRow = block.locator('[data-testid^="inbox.block.row."]').filter({ hasText: gone });
    if (await itsRow.first().isVisible({ timeout: 10_000 }).catch(() => false)) {
      await itsRow.first().click();
    } else {
      // under the fold ('+ N more'): open the first item, then walk with ↓ to it
      await block.locator('[data-testid^="inbox.block.row."]').first().click({ timeout: 10_000 });
      for (let i = 0; i < 10 && !((await open.textContent({ timeout: 2000 }).catch(() => '')) ?? '').includes(gone); i++) await page.keyboard.press('ArrowDown');
    }
    await expect(open, `the drop card opens in place and names @${gone}`).toContainText(`@${gone}`, { timeout: 5000 });
    await page.screenshot({ path: test.info().outputPath('drop-card.png') });
    await page.locator(`${T.thread} ${T.field}`).click({ timeout: 10_000 });
    await page.keyboard.type('yes');
    await page.keyboard.press('Enter');
    await expect.poll(async () => (await row(gone))?.archived, { timeout: 30_000, message: `'yes' archives ${gone}` }).toBe(true);
    await expect(block.locator('[data-testid^="inbox.block.row."], [data-testid^="inbox.block.open."]').filter({ hasText: gone }), 'the card leaves the inbox').toHaveCount(0, { timeout: 10_000 });
    test.info().annotations.push({ type: 'hub', description: JSON.stringify(await row(gone)) });

    const run = async (line: string) => {
      await page.locator(`${T.thread} ${T.field}`).click({ timeout: 10_000 });
      await page.keyboard.type(line);
      await page.keyboard.press('Enter');
    };
    await run('/agents');
    const live = page.locator(`${T.screen}:not([data-archived])`);
    await expect(live, '/agents opens the live list').toBeVisible({ timeout: 10_000 });
    await expect(live.locator(T.row(keeper)), `${keeper} is live`).toBeVisible({ timeout: 10_000 });
    await expect(live.locator(T.row(gone)), `${gone} (dropped) is not in /agents`).toHaveCount(0);
    await page.screenshot({ path: test.info().outputPath('agents.png') });

    await page.locator(`[data-testid="app.sidebar.project.${project}"]`).click();
    await expect(page.locator(T.thread), "the project's row opens main's thread").toBeVisible({ timeout: 5000 });
    await run('/archived');
    const arch = page.locator(`${T.screen}[data-archived]`);
    await expect(arch, '/archived opens the archived list').toBeVisible({ timeout: 10_000 });
    await expect(arch.locator(T.restore(gone)), `${gone} is under /archived with its restore`).toBeVisible({ timeout: 10_000 });
    await expect(arch.locator(T.row(keeper)), `${keeper} is not under /archived`).toHaveCount(0);
    await page.screenshot({ path: test.info().outputPath('archived.png') });
  } finally {
    await s.close();
  }
});
