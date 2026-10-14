// app/working-count · a project's row ends with the number of its agents at work (his m_25471: lost
// with '∿ n' in desktop-delight v2), dim, with its ds tip, beside his pink count when something
// waits; a quiet project's row has no end words (its mark says it). Passes when: storefront with 3
// at work ends with '3' ('3 agents working'), at the row's right end, in text-3, never in '∿ 3';
// ts-pattern with 2 at work and 1 waiting ends '2' then the pink '1'; docs-site has neither; the
// left marks at work (the breath) show the same frame on one clock. Shots
// light and dark for designer's sign. The scripted core (FakeCore). Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const P = 'acme-1a2b3c4d';
const TS = 'tspat-0a0b0c0d';
const DOCS = 'docs-cff418c0';
const API = 'api-0e0f0a0b';
const NOW = Date.now();
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const agent = (name: string, status: string, waits = 0) => ({ name, main: name === 'main', status, archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 120_000, waits });
const world = () => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: 'bise-home-00000000', name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: 4, working: 3, waits: 0, running: true },
      { project: TS, name: 'ts-pattern', path: '/nowhere/ts-pattern', git: true, home: false, order: 2, agents: 3, working: 2, waits: 1, running: true },
      { project: DOCS, name: 'docs-site', path: '/nowhere/docs-site', git: true, home: false, order: 3, agents: 0, working: 0, waits: 0, running: true },
      { project: API, name: 'api', path: '/nowhere/api', git: true, home: false, order: 4, agents: 1, working: 1, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  { ev: 'agents', project: P, agents: [agent('main', 'idle'), agent('perf', 'working'), agent('search', 'working'), agent('docs', 'working')] },
  { ev: 'agents', project: TS, agents: [agent('main', 'idle'), agent('types', 'working'), agent('dx', 'working'), agent('ask', 'blocked', 1)] },
];

test("app/working-count: a project's row ends with how many agents work in it, with its tip, beside his pink count", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf`, size: '1400x860' });
  try {
    const { page } = s;
    const row = (p: string) => page.getByTestId(`app.sidebar.project.${p}`);
    const end = (p: string) => page.getByTestId(`app.sidebar.project.${p}.end`);
    await expect(row(P)).toBeVisible({ timeout: 10_000 });

    await expect(end(P), "storefront: '3' at work").toHaveText('3');
    await expect(end(P)).toHaveAttribute('data-tip', '3 agents working');
    await expect(row(P), "never '∿ 3'").not.toContainText('∿');
    const look = await end(P).evaluate((el) => {
      const r = el.getBoundingClientRect();
      const row = (el.closest('.app-r') as HTMLElement).getBoundingClientRect();
      const probe = document.createElement('span');
      probe.style.color = 'var(--c-text-3)';
      document.body.append(probe);
      const dim = getComputedStyle(probe).color;
      probe.remove();
      return { color: getComputedStyle(el).color, dim, fromRight: row.right - r.right };
    });
    expect(look.color, 'dim: text-3').toBe(look.dim);
    expect(look.fromRight, "at the row's right end (its 8 px side)").toBe(8);

    await expect(end(TS), "ts-pattern: '2' at work").toHaveText('2');
    await expect(row(TS).locator('.app-cnt'), 'then his pink count').toHaveText('1');
    const order = await row(TS).evaluate((el) => {
      const n = el.querySelector('[data-testid$=".end"]')?.getBoundingClientRect();
      const c = el.querySelector('.app-cnt')?.getBoundingClientRect();
      return n && c ? c.left - n.right : null;
    });
    expect(order, 'the count right of the number, 8 px apart').toBe(8);
    await expect(end(DOCS), 'docs-site: quiet, no end words').toHaveCount(0);
    await expect(end(API), "api: '1'").toHaveText('1');
    await expect(end(API)).toHaveAttribute('data-tip', '1 agent working');

    // the left marks at work breathe on one shared clock: storefront's and api's show the same frame
    const phase = await page.evaluate(async ([a, b]) => {
      const at = (p: string) => document.querySelector(`[data-testid="app.sidebar.project.${p}.mark"] .wk-sign`)?.textContent ?? null;
      const out: [string | null, string | null][] = [];
      for (let i = 0; i < 8; i++) {
        out.push([at(a as string), at(b as string)]);
        await new Promise((r) => setTimeout(r, 170));
      }
      return out;
    }, [P, API]);
    for (const [x, y] of phase) {
      expect(x, 'a breath frame').not.toBeNull();
      expect(y, 'in phase').toBe(x);
    }
    expect(new Set(phase.map(([x]) => x)).size, 'and it moves').toBeGreaterThan(1);

    await page.getByTestId(`app.sidebar.project.${P}.end`).hover();
    await expect(page.getByTestId('tip')).toHaveText('3 agents working');
    const side = await page.getByTestId('app.sidebar').boundingBox();
    const clip = side ? { x: side.x, y: side.y, width: side.width, height: Math.min(side.height, 360) } : undefined;
    await page.screenshot({ path: test.info().outputPath('count-light.png'), clip });
    await core.send(prefs('dark') as never);
    await page.waitForTimeout(300);
    await page.screenshot({ path: test.info().outputPath('count-dark.png'), clip });
  } finally {
    await s.close();
    core.dispose();
  }
});
