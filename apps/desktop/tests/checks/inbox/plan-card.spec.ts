// inbox/plan-card · plan-ok (Gabriel's pick A, from Benjamin's feedback): a plan an agent proposes is
// that agent's own card. On the real shell with the scripted core (FakeCore, fake data), at 1100 px, light
// and dark. Passes when, on acme's main thread, lean-install's plan card opens in place with its head
// 'lean-install proposes a plan', the question, its gist whole, its 4 choices ('start the plan' first,
// the open one last), and the line 'or type what to change: lean-install reads it'; 1 answers the card
// with option 1; his words answer it as words (the hub sends them to lean-install).
// Shots (for designer): the card open, light + dark. Owner: plan-ok.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { common } from '../../../src/proto/words_common.gen';
import { inbox } from '../../../src/proto/words_inbox.gen';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const ag = (name: string) => ({ name, main: name === 'main', status: name === 'main' ? 'idle' : 'working', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 3_600_000, waits: 0 });
const GIST =
  '3 PRs, about −2.6 GB and −2 min 40 for each new worktree: pnpm installs lean by default, AGENTS.md says which install to run, and win32 leaves the platform binaries (that one goes through CI).';
const Q = 'lean installs: start the plan lean-install recommends?';
const OPTIONS = ['start the plan', 'start it, but keep win32', 'start all 3 and linux/arm64', 'open the plan and its alternatives'];
const URL = 'http://127.0.0.1:47100/p/lean#plan';
const CARD = {
  id: 21,
  project: P,
  kind: 'plan',
  rank: 1,
  agent: 'lean-install',
  question: `${Q}\n${GIST}`,
  options: OPTIONS.map((label, i) => ({ n: i + 1, label, ...(i === 3 ? { act: { do: 'open', artifact: 'lean', at: 'plan', url: URL } } : {}) })),
  page: { id: 'lean', url: URL, block: 'plan' },
  urgent: false,
  since_ms: NOW - 240_000,
};
const projects = (cards: readonly unknown[]) => ({
  ev: 'projects',
  projects: [
    { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
    { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 2, working: 1, waits: cards.length, running: true, cards },
  ],
});
const world = [
  prefs('light'),
  projects([CARD]),
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: HOME, agents: [ag('main')] },
  { ev: 'agents', project: P, agents: [ag('main'), ag('lean-install')] },
  { ev: 'thread', project: HOME, agent: 'main', entries: [], before: null, more: false },
  { ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, at_ms: NOW - 300_000, kind: 'agent', text: 'lean-install measured the installs; its plan is on the page.' }], before: null, more: false },
];
type Cmd = { cmd?: string; card?: number; reply?: string };

async function shoot(page: Page, core: FakeCore, name: string): Promise<void> {
  await page.mouse.move(1, 300);
  await page.waitForTimeout(250);
  await page.screenshot({ path: test.info().outputPath(`${name}-light.png`) });
  await core.send(prefs('dark') as never);
  await page.waitForTimeout(400);
  await page.screenshot({ path: test.info().outputPath(`${name}-dark.png`) });
  await core.send(prefs('light') as never);
  await page.waitForTimeout(300);
}

test("inbox/plan-card: lean-install's plan is its own card: 'lean-install proposes a plan', 4 choices, typing goes to lean-install", async () => {
  const core = new FakeCore(world as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/main`, size: '1100x760' });
  try {
    const { page } = s;
    const block = page.getByTestId('inbox.block');
    await expect(block).toBeVisible({ timeout: 10_000 });
    const row = page.locator('[data-testid^="inbox.block.row."]', { hasText: 'start the plan lean-install recommends?' }).first();
    await row.click();
    const card = page.getByTestId(`inbox.block.card.${P}-21`);
    await expect(card).toBeVisible({ timeout: 3000 });
    await test.step("its head names the agent that proposes it, its gist is whole, its choices say what happens", async () => {
      await expect(card).toContainText(common.title_plan({ agent: 'lean-install' }));
      await expect(card).toContainText(Q);
      await expect(card).toContainText('win32 leaves the platform binaries (that one goes through CI).');
      for (const o of OPTIONS) await expect(card).toContainText(o);
      await expect(card).toContainText(inbox.type_plan({ agent: 'lean-install' }));
      await expect(card).not.toContainText('bise asks');
      // its question reads first (ink), the plan under it in text-2 (designer m_26765)
      const gist = card.locator('.ic-qd');
      await expect(gist).toContainText('win32 leaves the platform binaries');
      const [qc, gc] = await Promise.all([card.locator('.ic-q').evaluate((e) => getComputedStyle(e).color), gist.evaluate((e) => getComputedStyle(e).color)]);
      expect(gc).not.toBe(qc);
      await shoot(page, core, 'plan-open');
    });
    await test.step('his words answer it as words (the hub takes them to lean-install)', async () => {
      await page.locator('[data-testid="composer.field"]').first().click();
      // composer-target's answering composer under the card (designer m_26765: card + composer crop)
      await shoot(page, core, 'plan-composer');
      await page.keyboard.type('ok, but keep win32: we need it');
      await page.keyboard.press('Enter');
      const a = (await core.waitCmd((c) => (c as Cmd).cmd === 'answer', 5000)) as Cmd;
      expect(a).toMatchObject({ card: 21, reply: 'ok, but keep win32: we need it' });
    });
  } finally {
    await s.close();
  }
});
