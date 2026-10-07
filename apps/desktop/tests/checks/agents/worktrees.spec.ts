// agents/worktrees · bar W5 (docs/desktop-bar.md): a worktree 2+ agents share is a section; an
// agent alone carries its mark. Owner: qa-flows. The NEW app on the REAL core over the throwaway
// world (../world.ts): shop's main spawns 'helper' into checkout's worktree (sb spawn --place
// checkout: they share it and its branch), receipts stays alone in its own. The environments
// screen (amb-win 550d0324, route environments/<project>). Passes when:
//   - the screen's places are the hub's: agents grouped by the folder they work in;
//   - checkout's worktree is one section holding checkout and helper, titled by its branch, first;
//   - receipts, alone in its worktree, is a section of its own with its branch as its mark;
//   - the shared folder (main, search…) comes last;
//   - a place's agent opens its thread.
import path from 'node:path';
import { test, expect } from '../../harness';
import { hubAgents, hubOf, launchOn, realWorld, worldSay } from '../world';

const T = {
  screen: '[data-testid="environments.screen"]',
  places: '[data-testid^="environments.place."]',
  agent: (n: string) => `[data-testid="environments.agent.${n}"]`,
  thread: '[data-testid="thread.screen"]',
};

test('agents/worktrees: a shared worktree is one section, an agent alone carries its branch, the shared folder last', async () => {
  test.setTimeout(240_000);
  const w = realWorld();
  const project = path.basename(path.dirname(hubOf(w, 'shop').sock));
  const s = await launchOn(w, `environments/${project}`, T.screen);
  try {
    const { page } = s;
    await expect(page.locator(T.screen)).toBeVisible({ timeout: 15_000 });
    if (!(await hubAgents(w, 'shop')).some((a) => a.name === 'helper' && !a.dropped)) {
      worldSay('shop', '[[bash: sb spawn helper --place checkout --objective "look over the checkout change with checkout"]]');
    }
    const live = async () => (await hubAgents(w, 'shop')).filter((a) => !a.dropped && a.status !== 'archived');
    await expect.poll(async () => (await live()).find((a) => a.name === 'helper')?.path ?? '', { timeout: 30_000, message: "the hub has helper in checkout's worktree" })
      .toBe((await live()).find((a) => a.name === 'checkout')?.path ?? 'none');
    const hub = await live();
    // the hub's places: agents by the folder they work in (a worktree agent's path is its worktree)
    const shared = hubOf(w, 'shop').ws;
    const byPath = new Map<string, string[]>();
    for (const a of hub) {
      const p = a.path && path.resolve(a.path) !== path.resolve(shared) ? a.path : '';
      byPath.set(p, [...(byPath.get(p) ?? []), a.name].sort());
    }
    // the window's places, in order
    await expect(page.locator(`${T.places} ${T.agent('helper')}`), 'the window has helper').toBeVisible({ timeout: 15_000 });
    const win = await page.locator(T.places).evaluateAll((els) =>
      els.map((el) => ({
        head: (el.querySelector('.b-sec, [class*="sec"]')?.textContent ?? el.firstElementChild?.textContent ?? '').trim(),
        agents: Array.from(el.querySelectorAll('[data-testid^="environments.agent."]')).map((a) => (a.getAttribute('data-testid') ?? '').replace('environments.agent.', '')).sort(),
        text: (el as HTMLElement).innerText.replace(/\s+/g, ' ').trim(),
      })));
    test.info().annotations.push({ type: 'places', description: JSON.stringify({ window: win, hub: Array.from(byPath.entries()) }) });
    await page.screenshot({ path: test.info().outputPath('places.png') });
    expect(win.map((p) => p.agents.join(',')).sort(), "the window's places are the hub's").toEqual(Array.from(byPath.values()).map((v) => v.join(',')).sort());
    expect(win[0]?.agents, "checkout's worktree first: checkout and helper together").toEqual(['checkout', 'helper']);
    expect(win[0]?.head, 'titled by its branch').toContain('checkout');
    const alone = win.find((p) => p.agents.length === 1 && p.agents[0] === 'receipts');
    expect(alone, 'receipts, alone in its worktree, is a place of its own').toBeDefined();
    const branch = hub.find((a) => a.name === 'receipts')?.branch ?? 'sb/receipts';
    expect(alone?.text, 'it carries its branch').toContain(branch);
    expect(win.at(-1)?.head, 'the shared folder last').toContain('the shared folder');
    expect(win.at(-1)?.agents, 'main in the shared folder').toContain('main');
    // an agent of a place opens its thread
    await page.locator(T.agent('helper')).click({ timeout: 10_000 });
    await expect(page.locator(T.thread), "helper's thread opens").toHaveAttribute('data-agent', 'helper', { timeout: 10_000 });
  } finally {
    await s.close();
  }
});
