// welcome/home · a new project's first screen (page new-project-home, pick A; designer m_38070,
// m_38080). On FakeCore rows (a project with main alone, its thread empty), off screen, at 1400,
// 1100 and 800 px, light and dark. Passes when:
//   (1) main's thread shows the welcome: the office drawn (the lead, 4 dashed desks, the tray, the
//       3 pins), the legend 1, 2, 3 stacked, the lead's first message with the project's name, the
//       3 ideas; AGENTS lists '○ bise  team lead'; the bar's own office stays closed;
//   (2) his first message: the welcome goes, its copy docks into the bar (the bar's office on, as
//       the cube does), the copy gone after the 400 ms; the thread holds his message;
//   (3) the office can't draw (its WebGL context lost): B's 3 pictures, the legend and the message stay.
// Writes every frame it checks to .harness-cache/welcome-shots (index.html) for the designer's sign.
// Owner: project-home.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { test, expect, FakeCore, Recorder, launchDesktop, pngBytes, type Session } from '../../harness';
import { thread } from '../../../src/proto/words_thread.gen';
import { panel } from '../../../src/proto/words_panel.gen';

const HOME = 'bise-home-00000000';
const P = 'type-level-typescript-0a1b2c3d';
const NAME = 'type-level-typescript';
const SHOTS = path.resolve(__dirname, '..', '..', '..', '.harness-cache', 'welcome-shots');

type Theme = 'light' | 'dark';

function world(theme: Theme): Record<string, unknown>[] {
  const now = Date.now();
  const main = { name: 'main', main: true, status: 'idle', archived: false, title: '', purpose: 'orchestrator: routes the requests', since_ms: now, waits: 0, watching: [], dir: 'main' };
  return [
    {
      ev: 'prefs',
      prefs: {
        onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [],
        quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true },
        voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7,
      },
    },
    {
      ev: 'projects',
      projects: [
        { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
        { project: P, name: NAME, path: '/nowhere/tlt', git: true, home: false, order: 1, agents: 1, working: 0, waits: 0, running: true },
      ],
    },
    { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/tlt', name: NAME },
    { ev: 'agents', project: P, agents: [main] },
    { ev: 'agents', project: HOME, agents: [main] },
    { ev: 'cards', project: P, cards: [] },
    { ev: 'thread', project: P, agent: 'main', entries: [], before: null, more: false },
  ];
}

const shots: { file: string; title: string }[] = [];

function save(file: string, png: PNG, title: string): void {
  mkdirSync(SHOTS, { recursive: true });
  writeFileSync(path.join(SHOTS, file), PNG.sync.write(png));
  shots.push({ file, title });
}

/** the frame the compositor shows now (a still WebGL canvas comes out blank in page.screenshot) */
async function shown(s: Session): Promise<PNG> {
  const rec = new Recorder(s.cdp, s.page);
  await rec.start();
  await s.page.waitForTimeout(400);
  const f = (await rec.stop()).at(-1);
  if (f === undefined) throw new Error('no screencast frame');
  return f.png;
}

async function open(width: number, theme: Theme): Promise<Session> {
  const s = await launchDesktop({ core: new FakeCore(world(theme) as never), route: `project/${P}` });
  // the app's window opens at 1280 x 720 (native/main-frame): this width, 900 tall
  await s.app.evaluate(({ BrowserWindow }, w) => {
    BrowserWindow.getAllWindows().find((b) => b.webContents.getURL().includes('surface=window'))?.setContentSize(w, 900);
  }, width);
  await expect.poll(() => s.page.evaluate(() => window.innerWidth), { timeout: 5000 }).toBe(width);
  await expect(s.page.getByTestId('welcome')).toBeVisible({ timeout: 20_000 });
  return s;
}

test.afterAll(() => {
  mkdirSync(SHOTS, { recursive: true });
  const rows = shots.map((x) => `<figure><img src="${x.file}" alt=""><figcaption>${x.title}</figcaption></figure>`).join('\n');
  writeFileSync(
    path.join(SHOTS, 'index.html'),
    `<!doctype html><meta charset="utf-8"><title>a new project's welcome · shots</title>
<style>body{font:14px/1.5 -apple-system,system-ui,sans-serif;margin:24px;background:#faf8f5;color:#2a2622}
figure{display:inline-block;vertical-align:top;margin:0 16px 24px 0;max-width:720px}
img{max-width:100%;border:1px solid #e3ddd5;border-radius:6px}figcaption{margin-top:6px}</style>
<h1>a new project's welcome</h1><p>apps/desktop/tests/checks/welcome, FakeCore rows, off screen. ${String(shots.length)} shots.</p>
${rows}
`,
  );
});

for (const width of [1400, 1100, 800]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${String(width)} ${theme}: the welcome, then the dock at his first message`, async () => {
      test.setTimeout(90_000);
      const s = await open(width, theme);
      try {
        const page = s.page;
        // (1) the office draws, its pins on; the legend, the lead's message, the ideas
        await expect(page.getByTestId('welcome')).toHaveAttribute('data-office', 'on', { timeout: 20_000 });
        await expect(page.getByTestId('welcome.legend')).toContainText(thread.welcome_lead_head);
        await expect(page.getByTestId('welcome.hi')).toContainText(thread.welcome_hi({ project: NAME }));
        await expect(page.getByTestId('welcome.idea.0')).toHaveText(thread.welcome_idea_tests);
        await expect(page.locator('[data-testid="welcome.pins"] [data-pin="1"]')).toBeVisible({ timeout: 10_000 });
        await expect(page.getByTestId('app.right.bims.fold')).toHaveCount(0);
        if (width > 800) await expect(page.getByTestId('app.right.agent.main')).toContainText(panel.role_lead);
        await page.waitForTimeout(1200);
        save(`${String(width)}-${theme}-1-first-open.png`, await shown(s), `${String(width)} ${theme} · first open`);

        // (2) his first message: the welcome docks into the bar
        await page.locator('[data-testid="composer.field"]').click();
        await page.keyboard.type(thread.welcome_idea_tests);
        const rec = new Recorder(s.cdp, page);
        await rec.start();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(900);
        const frames = await rec.stop();
        await expect(page.getByTestId('welcome')).toHaveCount(0);
        await expect(page.getByTestId('welcome.dock')).toHaveCount(0);
        const t0 = frames[0]?.t ?? 0;
        const mid = frames.find((f) => f.t - t0 >= 200) ?? frames[Math.floor(frames.length / 2)];
        if (mid !== undefined) save(`${String(width)}-${theme}-2-mid-dock.png`, PNG.sync.read(pngBytes(mid)), `${String(width)} ${theme} · mid-dock (~200 ms after ⏎)`);
        if (width > 800) await expect(page.getByTestId('app.right.bims')).toBeVisible({ timeout: 5000 });
        await page.waitForTimeout(800);
        save(`${String(width)}-${theme}-3-after.png`, await shown(s), `${String(width)} ${theme} · after the dock`);
      } finally {
        await s.close();
      }
    });
  }
}

test('the office cannot draw: B\'s three pictures', async () => {
  test.setTimeout(60_000);
  for (const theme of ['light', 'dark'] as const) {
    const s = await open(1100, theme);
    try {
      await expect(s.page.getByTestId('welcome')).toHaveAttribute('data-office', 'on', { timeout: 20_000 });
      await s.page.evaluate(() => {
        const c = document.querySelector<HTMLCanvasElement>('[data-testid="welcome"] canvas');
        const gl = c?.getContext('webgl2') ?? c?.getContext('webgl') ?? null;
        gl?.getExtension('WEBGL_lose_context')?.loseContext();
      });
      await expect(s.page.getByTestId('welcome.pictures')).toBeVisible({ timeout: 10_000 });
      await expect(s.page.getByTestId('welcome.legend')).toBeVisible();
      save(`1100-${theme}-4-pictures.png`, await shown(s), `1100 ${theme} · the office can't draw: B's pictures`);
    } finally {
      await s.close();
    }
  }
});
