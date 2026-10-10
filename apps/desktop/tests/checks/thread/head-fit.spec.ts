// thread/head-fit · the agent head's room (designer N1, m_17181 on 29ec1b92's shots): 'perf  make t' cut the
// role to 6 letters with no '…' while 'context 42k · 17%' and 'sb/perf' kept their room. Passes when, on the
// built app with the scripted core (FakeCore's default world, fake data), in perf's thread at 1400 and at
// 1100 with the panel open: the role ends with '…' when it is cut (never clipped silently), and it is cut
// only once the usage note and the branch have given their room; the state chip and 'changes ⌘D' stay whole.
// Owner: amb-home.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const P = 'acme-1a2b3c4d';

test("thread/head-fit: the role gets the head's room first and ends with '…'", async () => {
  const core = new FakeCore();
  const s = await launchDesktop({ core, route: `agent/${P}/perf` });
  const { page } = s;
  try {
    await expect(page.getByTestId('thread.head.role')).toBeVisible({ timeout: 10_000 });
    const win = await s.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().sort((a, b) => (b.getSize()[0] ?? 0) - (a.getSize()[0] ?? 0))[0]?.id ?? -1);
    for (const w of [1400, 1100]) {
      await s.app.evaluate(({ BrowserWindow }, [id, w2]) => BrowserWindow.fromId(id ?? -1)?.setContentSize(w2 ?? 0, 720), [win, w]);
      await expect.poll(() => page.evaluate(() => window.innerWidth), { timeout: 5000 }).toBe(w);
      await page.waitForTimeout(200);
      const m = await page.evaluate(() => {
        const el = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
        const fit = (e: HTMLElement | null) => (e === null ? null : { w: Math.round(e.clientWidth), full: e.scrollWidth <= e.clientWidth + 1 });
        const role = el('thread.head.role');
        return {
          role: fit(role),
          ellipsis: role === null ? '' : getComputedStyle(role).textOverflow,
          usage: fit(el('thread.usage')),
          branch: fit(el('thread.head.branch')),
          chip: fit(el('thread.head.state')),
          changes: fit(el('thread.head.changes')),
        };
      });
      test.info().annotations.push({ type: `head ${String(w)}`, description: JSON.stringify(m) });
      expect(m.ellipsis, `${String(w)}: a cut role ends with '…'`).toBe('ellipsis');
      if (m.role !== null && !m.role.full) {
        expect(m.usage === null || m.usage.w <= 4, `${String(w)}: the usage note gave its room before the role was cut ${JSON.stringify(m)}`).toBe(true);
        expect(m.branch === null || m.branch.w <= 4, `${String(w)}: the branch gave its room before the role was cut ${JSON.stringify(m)}`).toBe(true);
      }
      expect(m.chip?.full, `${String(w)}: the state chip stays whole`).toBe(true);
      expect(m.changes?.full, `${String(w)}: 'changes ⌘D' stays whole`).toBe(true);
      await page.getByTestId('thread.head').screenshot({ path: test.info().outputPath(`head-${String(w)}.png`) });
    }
  } finally {
    await s.close();
    core.dispose();
  }
});
