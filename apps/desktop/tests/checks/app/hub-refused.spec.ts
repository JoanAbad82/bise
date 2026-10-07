// app/hub-refused · lead m_11347, amb-core 44d64919: a project whose hub refused this core shows
// the hub's own words and a retry, instead of an endless 'connecting…'. Passes when, on the
// scripted core (FakeCore), a CoreEv hub_refused for acme puts '✗ acme's hub refused bise ·
// <the hub's words>' + 'retry' under acme's sidebar row (its end says 'refused') and over acme's
// composer; a click on retry sends AppCmd hub_retry {project: acme}; then acme's welcome clears
// both lines. Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const ACME = 'acme-1a2b3c4d';
const WORDS = 'this hub only takes connections from its own bise';

type Cmd = Record<string, unknown>;
const isCmd = (name: string, extra: Record<string, unknown> = {}) => (c: unknown): boolean => {
  const o = c as Cmd;
  return o['cmd'] === name && Object.entries(extra).every(([k, v]) => o[k] === v);
};

test("app/hub-refused: the hub's words and a retry on the project's sidebar line and in its thread, cleared by its welcome", async () => {
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `project/${ACME}` });
  try {
    const { page } = s;
    await expect(page.getByTestId(`app.sidebar.project.${ACME}`), "acme's row").toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('thread.refused')).toHaveCount(0);
    await core.send({ ev: 'hub_refused', project: ACME, error: WORDS });

    const side = page.getByTestId(`app.sidebar.project.${ACME}.refused`);
    await expect(side, "the sidebar says acme's hub refused").toContainText(`acme's hub refused bise · ${WORDS}`, { timeout: 5000 });
    await expect(page.getByTestId(`app.sidebar.project.${ACME}`)).toContainText('refused');
    const line = page.getByTestId('thread.refused');
    await expect(line, "acme's thread says it over the composer").toContainText(`acme's hub refused bise · ${WORDS}`);
    await page.screenshot({ path: test.info().outputPath('refused.png') });

    await page.getByTestId('thread.refused.retry').click();
    await core.waitCmd(isCmd('hub_retry', { project: ACME }));
    await expect(page.getByTestId('thread.refused.retry')).toHaveText('retrying…');

    await core.send({ ev: 'welcome', project: ACME, proto: 1, workspace: '/nowhere/acme', name: 'acme', cmds: [] });
    await expect(line, 'its welcome clears the thread line').toHaveCount(0, { timeout: 5000 });
    await expect(side, 'and the sidebar line').toHaveCount(0);
    await page.screenshot({ path: test.info().outputPath('welcomed.png') });
  } finally {
    await s.close();
    core.dispose();
  }
});
