// spotlight/projects · the empty spotlight's 'projects' rows (designer's N4, m_13021, m_13196).
// Owner: amb-web. The new app on the scripted core (FakeCore), fn+space from the scripted helper.
// Passes when:
//   - a project with a long path reads its count and branch first ('30 agents · main · ~/…'), so a
//     cut at the row's end lands on the path, never on the count;
//   - the rows are in view with no card above them (the shot designer signs).
import { test, expect, FakeCore, FakeHelper, launchDesktop } from '../../harness';

type Ev = Parameters<FakeCore['send']>[0];
const LONG = 'telemetry-1a2b3c4d';

test('spotlight/projects: the count and branch come first, the long path is what gets cut', async () => {
  test.setTimeout(60_000);
  const core = new FakeCore();
  const helper = new FakeHelper();
  const s = await launchDesktop({ core, helper });
  try {
    const { app } = s;
    await s.page.waitForTimeout(1500);
    await core.send({
      ev: 'projects',
      projects: [
        { project: 'bise-home-00000000', name: 'bise', path: '/Users/camille/bise', home: true, order: 0, agents: 1, working: 0, waits: 0, git: false, running: true },
        { project: 'acme-1a2b3c4d', name: 'acme', path: '/Users/camille/acme', home: false, order: 1, agents: 3, working: 0, waits: 0, git: true, branch: 'main', running: true },
        {
          project: LONG, name: 'telemetry', path: '/Users/camille/.bise/worktrees/w-qanative/h/code/telemetry-ingest-service/backend',
          home: false, order: 2, agents: 30, working: 0, waits: 0, git: true, branch: 'feat/batch-flush', running: true,
        },
      ],
    } as unknown as Ev);
    await core.send({ ev: 'cards', project: 'acme-1a2b3c4d', cards: [] } as unknown as Ev);
    await core.send({ ev: 'cards', project: 'bise-home-00000000', cards: [] } as unknown as Ev);
    await helper.send({ ev: 'fn', act: 'key', key: 'space' });
    await expect.poll(() => app.windows().some((p) => p.url().includes('surface=capsule'))).toBe(true);
    const cap = app.windows().find((p) => p.url().includes('surface=capsule'));
    if (!cap) throw new Error('no capsule window');
    await expect(cap.locator('[data-testid="spot.input"]')).toBeVisible({ timeout: 5000 });

    const row = cap.locator(`[data-testid="spot.row.env.${LONG}"]`);
    await expect(row, 'the long project has its row').toHaveCount(1, { timeout: 5000 });
    await row.scrollIntoViewIfNeeded();
    await expect(row, 'count and branch first, the path after').toContainText('30 agents · feat/batch-flush · ~/');
    // the path is what overflows: the count's words sit inside the row's box
    const fits = await row.evaluate((el) => {
      const box = el.getBoundingClientRect();
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n !== null; n = walker.nextNode()) {
        const i = (n.textContent ?? '').indexOf('30 agents');
        if (i < 0) continue;
        const r = document.createRange();
        r.setStart(n, i);
        r.setEnd(n, i + '30 agents · feat/batch-flush'.length);
        const b = r.getBoundingClientRect();
        return b.right <= box.right + 0.5;
      }
      return false;
    });
    expect(fits, 'the count and branch are never cut').toBe(true);
    // the presence slot left of the field: the spot keeps a hole there and the capsule's own ':*'
    // (one BiseMark for every view, SVG: bise-presence v10) sits over it, shown in the spot view
    const pearl = await cap.locator('[data-testid="capsule.pearl"]').evaluate((el) => {
      const slot = el.closest('.b-cap-pearl');
      const svg = el.querySelector('svg');
      const box = (slot ?? el).getBoundingClientRect();
      return { off: slot?.classList.contains('off') ?? true, mark: svg !== null && el.classList.contains('b-bise'), w: box.width, x: box.left, y: box.top };
    });
    test.info().annotations.push({ type: 'pearl', description: JSON.stringify(pearl) });
    expect(pearl.off, 'the capsule pearl is on in the spot view').toBe(false);
    expect(pearl.mark, "the ':*' draws in SVG").toBe(true);
    await cap.screenshot({ path: test.info().outputPath('projects.png') });
  } finally {
    await s.close();
  }
});
