// thread/news-rows · bar T, amb-feed's batch 3a (5d4189cb): the hub's news lines as typed rows.
// Passes when, on the scripted core's fixtures (hub_ev pos 27-32), main's thread shows perf's
// landing with its sha (a click opens that commit), the logo artifact as a card, main's answer
// for docs with its why, and perf's message to docs named 'perf → docs'; perf's thread shows its
// PR's failing checks with the ▲ mark (never color alone) and his 'no' to an approval with his
// note. Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const P = 'acme-1a2b3c4d';

test('thread/news-rows: landed, PR news, artifact, answered, approval and agent-to-agent rows draw as the hub typed them', async () => {
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `project/${P}` });
  try {
    const { page } = s;
    const landed = page.getByTestId('thread.landed.27');
    await expect(landed, 'perf landed').toContainText('perf landed on main', { timeout: 10_000 });
    await expect(landed).toContainText('3 files +42 −18');
    await expect(page.getByTestId('thread.artifact.29')).toContainText('the logo');
    await expect(page.getByTestId('thread.answered.30')).toContainText('answered docs for you: v1 or v2? → v2');
    await expect(page.getByTestId('thread.answered.30')).toContainText('the brief says v2');
    await expect(page.getByTestId('thread.entry.32')).toContainText('perf → docs');
    await page.screenshot({ path: test.info().outputPath('main.png') });
    await page.getByTestId('thread.landed.27.sha').click();
    await expect(page.getByTestId('review.screen'), 'the sha opens the commit').toBeVisible({ timeout: 5000 });

    await page.getByTestId('app.sidebar.agent.perf').click();
    const pr = page.getByTestId('thread.pr.28');
    await expect(pr, "perf's PR news").toContainText('PR #412', { timeout: 10_000 });
    await expect(pr).toHaveAttribute('data-tone', 'err');
    await expect(pr).toContainText('▲');
    const ap = page.getByTestId('thread.approval.31');
    await expect(ap).toContainText('you said no to perf: rm -rf target');
    await expect(ap).toContainText('not that');
    await page.screenshot({ path: test.info().outputPath('perf.png') });
  } finally {
    await s.close();
    core.dispose();
  }
});
