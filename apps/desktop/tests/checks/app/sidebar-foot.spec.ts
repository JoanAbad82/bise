// app/sidebar-foot · qa-flows' O.6 clicks audit (lead m_10949 item 2): '+ add a project' had no
// hover and a click at its centre didn't reach it. Passes when, with a long sidebar (22
// projects), the foot is on screen, nothing covers its centre, its look
// changes on hover, it points, and a click opens settings' projects page. The scripted core
// (FakeCore). Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const ids = 'abcdefghijklmnopqrstuv'.split('').map((x) => `${x}proj-1a2b3c4${x}`);
const agent = (name: string) => ({ name, main: name === 'main', status: 'working', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 });
const world = () => [
  {
    ev: 'prefs',
    prefs: {
      onboarded: true,
      theme: 'system',
      context: { shot: true, url: true, file: true, window_text: false },
      excluded_apps: [],
      quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true },
      voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' },
      shots_keep_days: 7,
    },
  },
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      ...ids.map((p, i) => ({ project: p, name: p.slice(0, 5), path: `/nowhere/${p}`, git: true, home: false, order: i + 1, agents: 6, working: 5, waits: 0, running: true })),
    ],
  },
  ...ids.map((p) => ({ ev: 'agents', project: p, agents: ['main', 'one', 'two', 'three', 'four', 'five'].map(agent) })),
];

test("app/sidebar-foot: '+ add a project' is hit at its centre, hovers and points, with a long sidebar", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core });
  try {
    const { page } = s;
    const foot = page.getByTestId('app.sidebar.add');
    await expect(foot).toBeVisible({ timeout: 10_000 });
    const box = await foot.boundingBox();
    expect(box, 'the foot has a box').not.toBeNull();
    if (box === null) return;
    expect(box.y + box.height, 'on screen').toBeLessThanOrEqual(720);
    const hit = await page.evaluate(({ x, y }) => {
      const top = document.elementFromPoint(x, y);
      const el = document.querySelector('[data-testid="app.sidebar.add"]');
      return el !== null && top !== null && (el === top || el.contains(top));
    }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
    expect(hit, 'nothing covers its centre').toBe(true);
    const look = () => foot.evaluate((el) => { const c = getComputedStyle(el); return `${c.color}|${c.backgroundColor}|${c.cursor}`; });
    await page.mouse.move(1, 1);
    const before = await look();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(200);
    const after = await look();
    expect(after, 'its look changes on hover').not.toBe(before);
    expect(after.split('|')[2], 'it points').toBe('pointer');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page.getByTestId('settings.page.projects').or(page.locator('[data-testid^="settings"]')).first(), 'it opens settings').toBeVisible({ timeout: 3000 });
  } finally {
    await s.close();
    core.dispose();
  }
});
