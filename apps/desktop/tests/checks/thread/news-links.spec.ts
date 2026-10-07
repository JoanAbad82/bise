// thread/news-links · qa-flows' news-real red (28a5419b, ambient-lead m_11514): a click on a PR
// news row's number opens the PR (window.bise.openExternal; test mode: main prints
// 'bise-desktop: external <url>' on stdout). Passes when, in perf's thread on the scripted core's
// fixtures (hub_ev pos 28, PR #412), a click on 'PR #412' prints that line with the PR's url.
// Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { Lines } from '../native/world';

const P = 'acme-1a2b3c4d';
const EXTERNAL = 'bise-desktop: external';

test("thread/news-links: a PR row's number opens the PR in his browser", async () => {
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `agent/${P}/perf` });
  const out = new Lines();
  s.app.process().stdout?.setEncoding('utf8');
  s.app.process().stdout?.on('data', (d: string) => {
    out.push(d);
  });
  try {
    const { page } = s;
    const link = page.getByTestId('thread.pr.28.link');
    await expect(link, "PR #412's number").toBeVisible({ timeout: 10_000 });
    await link.click();
    const line = await out.wait(EXTERNAL, () => true, 5000);
    expect(line).toContain('https://github.com/acme/app/pull/412');
  } finally {
    await s.close();
    core.dispose();
  }
});
