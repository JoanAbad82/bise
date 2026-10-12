// thread/report-rows · designer D14 in agent threads (try gate cb1f2b44, N3-gift-ui.png): an agent's
// report to bise is a to_agent row in its own thread ('gift-ui → bise · [report: blocked] …'). Passes
// when, on the scripted core (FakeCore, fake data), perf's thread shows its reports as status lines:
//   - '[report: blocked] waiting for your answer: …' -> 'blocked · waiting for your answer';
//   - '[report: done] p95 at 180 ms …' -> '✓ done · p95 at 180 ms, nothing to fix.';
//   - no '[report:' anywhere in the thread; a plain message to bise still reads as a message.
// Shots: light and dark, 1100 wide. Owner: amb-home.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const ACME = 'acme-1a2b3c4d';
const AT = 1791100000000;
const entries = [
  { pos: 1, at_ms: AT, kind: 'you', text: 'make the product page fast' },
  { pos: 2, at_ms: AT + 60_000, kind: 'to_agent', to: 'main', text: 'i measured it: p95 is 900 ms on mobile.' },
  { pos: 3, at_ms: AT + 120_000, kind: 'to_agent', to: 'main', asks: true, text: '[report: blocked] waiting for your answer: cart page or checkout only?' },
  { pos: 4, at_ms: AT + 180_000, kind: 'to_agent', to: 'main', text: '[report: done] p95 at 180 ms, nothing to fix.\n- ran 3 times on staging' },
];

test('thread/report-rows: an agent\'s reports to bise read as status lines in its own thread, never the [report: …] tag', async () => {
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `agent/${ACME}/perf` });
  const { page } = s;
  try {
    await expect(page.getByTestId('thread.screen')).toHaveAttribute('data-agent', 'perf', { timeout: 10_000 });
    await core.send({ ev: 'thread', project: ACME, agent: 'perf', entries, before: null, more: false } as never);
    await expect(page.getByTestId('thread.report.3')).toHaveText('blocked · waiting for your answer', { timeout: 3000 });
    // H8 (amb-win, designer m_19832): one line, '▸ report' opens the rest
    await expect(page.locator('[data-testid="thread.report.4"] .b-marker')).toHaveText('✓ done · p95 at 180 ms, nothing to fix.');
    await expect(page.getByTestId('thread.report.4.more')).toHaveText('▸ report');
    await expect(page.getByTestId('thread.to.2')).toContainText('i measured it');
    const all = (await page.getByTestId('thread.screen').innerText()).replace(/\s+/g, ' ');
    expect(all, 'no raw report tag').not.toContain('[report:');
    // the scripted world's perf has older rows after these: the shots show the reports
    await page.getByTestId('thread.report.3').scrollIntoViewIfNeeded();
    await page.screenshot({ path: test.info().outputPath('report-rows-light.png') });
    // dark as the app sets it (src/theme applyTheme): the attribute AND the root's color-scheme, which the
    // ds tokens follow; the attribute alone left the option chips and the send button on light ink
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.setProperty('color-scheme', 'dark');
    });
    // the option chips and the send button transition their colours: shoot once they end, never mid-way
    // (finite ones only: a looping one, like a working agent's ∿, never finishes)
    await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => undefined))));
    await page.waitForTimeout(250);
    await page.screenshot({ path: test.info().outputPath('report-rows-dark.png') });
  } finally {
    await s.close().catch(() => undefined);
    core.dispose();
  }
});
