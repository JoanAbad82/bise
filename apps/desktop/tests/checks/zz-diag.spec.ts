import { test } from '../harness';
import { realWorld, launchReal } from './world';
test('diag', async () => {
  test.setTimeout(120_000);
  const w = realWorld();
  const s = await launchReal(w, { route: 'inbox' });
  try {
    const p = s.page;
    await p.evaluate(() => (window as any).bise.core.send({ cmd: 'shown', projects: [] }));
    await p.waitForTimeout(4000);
    console.log('IDS', (await p.locator('[data-testid]').evaluateAll((es) => es.map((e) => e.getAttribute('data-testid')))).join(' '));
    console.log('ITEMS', JSON.stringify(await p.locator('[data-testid^="inbox.item."]').evaluateAll((es) => es.map((e) => [e.getAttribute('data-testid'), (e as HTMLElement).innerText]))));
    await p.screenshot({ path: process.env.TMPDIR + '/x4.png' });
  } finally { await s.close(); }
});
