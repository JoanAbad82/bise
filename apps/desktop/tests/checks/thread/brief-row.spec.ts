// thread/brief-row · designer's nit (m_13856, ambient-lead m_13859): an agent's thread opened on the hub's
// brief drawn as markdown (a 28 px 'Task gift-ui' heading, 'Objective: …', 'No end criterion: …'). Passes
// when, on the scripted core (FakeCore, fake data), gift-ui's thread shows the brief (the TUI's is_brief:
// a text starting '# Task `name`') as one quiet row:
//   - 'bise started gift-ui · make the gift page fast', dim, one line, no heading drawn;
//   - the brief's words are folded: 'No end criterion' isn't on screen until a click opens it under a
//     rail; a second click folds it again;
//   - the next message still reads as a message.
// Shots: light and dark, folded and open. Owner: amb-home.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const ACME = 'acme-1a2b3c4d';
const AT = 1791100000000;
const BRIEF = '# Task `gift-ui`\n\nObjective: make the gift page fast\n\nContext: the cart team asked; p95 is 900 ms on mobile.\n\nNo end criterion: this is a long-running task. Stay available.\n';
const entries = [
  { pos: 1, at_ms: AT, kind: 'from_agent', from: 'main', to: 'gift-ui', text: BRIEF },
  { pos: 2, at_ms: AT + 60_000, kind: 'agent', text: 'measuring the gift page on mobile first.' },
];

const dark = async (page: import('@playwright/test').Page, on: boolean) => {
  await page.evaluate((d) => {
    document.documentElement.setAttribute('data-theme', d ? 'dark' : 'light');
    document.documentElement.style.setProperty('color-scheme', d ? 'dark' : 'light');
  }, on);
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))));
  await page.waitForTimeout(250);
};

test("thread/brief-row: the hub's brief is one quiet row 'bise started gift-ui · …', the whole brief folded under it", async () => {
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `agent/${ACME}/gift-ui` });
  const { page } = s;
  try {
    await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-agent', 'gift-ui', { timeout: 10_000 });
    await core.send({ ev: 'thread', project: ACME, agent: 'gift-ui', entries, before: null, more: false } as never);
    const row = page.getByTestId('thread.brief.1');
    await expect(row).toHaveText(/bise started gift-ui · make the gift page fast/, { timeout: 3000 });
    const screen = page.getByTestId('thread.screen');
    await expect(screen.locator('h1'), 'no heading drawn').toHaveCount(0);
    await expect(screen, 'the brief is folded').not.toContainText('No end criterion');
    await expect(screen).not.toContainText('# Task');
    const look = await row.locator('.th-brief-line').evaluate((el) => ({ size: getComputedStyle(el).fontSize, h: el.getBoundingClientRect().height }));
    expect(Number.parseFloat(look.size), 'quiet: 13 px words').toBeLessThanOrEqual(13);
    expect(look.h, 'one line').toBeLessThan(24);
    await expect(page.getByTestId('thread.entry.2')).toContainText('measuring the gift page');
    await page.screenshot({ path: test.info().outputPath('brief-light.png') });
    await dark(page, true);
    await page.screenshot({ path: test.info().outputPath('brief-dark.png') });
    await dark(page, false);

    await row.locator('.th-brief-line').click();
    const body = page.getByTestId('thread.brief.1.body');
    await expect(body).toContainText('No end criterion: this is a long-running task. Stay available.');
    await expect(body).toContainText('Context: the cart team asked');
    await page.screenshot({ path: test.info().outputPath('brief-open-light.png') });
    await dark(page, true);
    await page.screenshot({ path: test.info().outputPath('brief-open-dark.png') });
    await row.locator('.th-brief-line').click();
    await expect(body).toHaveCount(0);
  } finally {
    await s.close().catch(() => undefined);
    core.dispose();
  }
});
