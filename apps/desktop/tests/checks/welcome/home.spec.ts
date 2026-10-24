// welcome/home · a new project's first screen (page new-project-home, pick A; designer m_38070,
// m_38080). On FakeCore rows (a project with main alone, its thread empty), off screen, at 1400,
// 1100 and 800 px, light and dark. Passes when:
//   (1) main's thread shows the welcome: the office drawn (the lead, 4 dashed desks, the tray, the
//       3 pins), the legend 1, 2, 3 stacked, the lead's first message with the project's name, the
//       3 ideas; AGENTS lists '○ bise  team lead'; the bar's own office stays closed;
//   (2) his first message: the welcome goes, its copy docks into the bar (the bar's office on, as
//       the cube does), the copy gone after the 400 ms; the thread holds his message;
//   (3) the office can't draw (its WebGL context lost): B's 3 pictures, the legend and the message stay;
//   (4) a project with an agent besides main and open cards: no welcome; main alone with 2 open
//       cards (its thread empty, then a line of main's): the welcome ends over the inbox block and
//       never spills out of its slot (designer m_38701).
// Writes every frame it checks to .harness-cache/welcome-shots (index.html) for the designer's sign.
// Owner: project-home.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { test, expect, FakeCore, Recorder, launchDesktop, pngBytes, type Session } from '../../harness';
import { thread } from '../../../src/proto/words_thread.gen';
import { panel } from '../../../src/proto/words_panel.gen';
import { hub_ev } from '../../../src/proto/fixtures.gen';
import type { Card, HubEv } from '../../../src/proto';

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
        await expect(page.locator('[data-testid="welcome.pins"] [data-pin="3"]')).toBeVisible({ timeout: 10_000 });
        // at least 32 px between any two pins (designer m_38202)
        const pins = await page.locator('[data-testid="welcome.pins"] [data-pin]').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }));
        for (let i = 0; i < pins.length; i++) for (let j = i + 1; j < pins.length; j++) {
          const a = pins[i], b = pins[j];
          if (a !== undefined && b !== undefined) expect(Math.hypot(a.x - b.x, a.y - b.y), `pins ${String(i + 1)} and ${String(j + 1)}`).toBeGreaterThanOrEqual(32);
        }
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
        // the lead's intro stays as the thread's first message, over his
        await expect(page.getByTestId('welcome.intro')).toContainText(thread.welcome_hi({ project: NAME }));
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

// (4) designer m_38701: the welcome only in a project with main alone; there, an open card's inbox
// block and the welcome stack, never overlap (its ideas sat on 'inbox 2 waiting')
const cardsEv = hub_ev.find((e): e is Extract<HubEv, { ev: 'cards' }> => e.ev === 'cards');
const card = (id: number, agent: string): Card => {
  const first = cardsEv?.cards[0];
  if (first === undefined) throw new Error('no card in the fixtures');
  return { ...first, project: P, id, agent, kind: 'question', approval: false, question: 'which bench?' };
};
const perf = { name: 'perf', main: false, status: 'idle', archived: false, title: 'profiling the hub', purpose: '', since_ms: Date.now(), waits: 1, watching: [], dir: 'perf' };

function withCards(theme: Theme, o: { agents: Record<string, unknown>[]; cardAgent: string; mainLines: boolean }): Record<string, unknown>[] {
  const now = Date.now();
  return world(theme).map((ev) => {
    if (ev.ev === 'agents' && ev.project === P) return { ...ev, agents: [...(ev.agents as unknown[]), ...o.agents] };
    if (ev.ev === 'cards' && ev.project === P) return { ...ev, cards: [card(9, o.cardAgent), card(10, o.cardAgent)] };
    if (ev.ev === 'thread' && ev.project === P && o.mainLines) return { ...ev, entries: [{ pos: 1, at_ms: now - 60_000, kind: 'agent', text: 'the repo is cloned.' }] };
    return ev;
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`${theme}: an open card in a project with agents: no welcome; with main alone: welcome and inbox stacked`, async () => {
    test.setTimeout(90_000);
    // a project with an agent and its open cards: main's thread empty, no welcome
    let s = await launchDesktop({ core: new FakeCore(withCards(theme, { agents: [perf], cardAgent: 'perf', mainLines: false }) as never), route: `project/${P}` });
    try {
      await expect(s.page.getByTestId('inbox.block')).toBeVisible({ timeout: 20_000 });
      await s.page.waitForTimeout(800);
      await expect(s.page.getByTestId('welcome')).toHaveCount(0);
      save(`1280-${theme}-5-agents-no-welcome.png`, await shown(s), `1280 ${theme} · a project with agents and open cards: no welcome`);
    } finally {
      await s.close();
    }
    // main alone with open cards, its thread empty then with a line of main's: both stack
    for (const [mainLines, height] of [[false, 720], [true, 720], [false, 900]] as const) {
      s = await launchDesktop({ core: new FakeCore(withCards(theme, { agents: [], cardAgent: 'main', mainLines }) as never), route: `project/${P}` });
      try {
        await s.app.evaluate(({ BrowserWindow }, h) => {
          BrowserWindow.getAllWindows().find((b) => b.webContents.getURL().includes('surface=window'))?.setContentSize(1280, h);
        }, height);
        await expect.poll(() => s.page.evaluate(() => window.innerHeight), { timeout: 5000 }).toBe(height);
        await expect(s.page.getByTestId('welcome')).toBeVisible({ timeout: 20_000 });
        await expect(s.page.getByTestId('inbox.block')).toBeVisible();
        await s.page.waitForTimeout(1200);
        const slot = await s.page.getByTestId('thread.first').boundingBox();
        const inbox = await s.page.getByTestId('inbox.block').boundingBox();
        if (slot === null || inbox === null) throw new Error('no box for the welcome or the inbox');
        expect(slot.y + slot.height, 'the welcome ends over the inbox block').toBeLessThanOrEqual(inbox.y + 0.5);
        // what the welcome draws stays in its slot (it scrolls there, never spills)
        const spills = await s.page.getByTestId('thread.first').evaluate((el) => {
          const box = el.getBoundingClientRect();
          return getComputedStyle(el).overflowY === 'visible' && el.scrollHeight > box.height + 1;
        });
        expect(spills, 'the welcome spills out of its slot').toBe(false);
        // the office gives way first (designer m_38760): the ideas whole over the inbox, and while
        // the office shows the slot doesn't scroll
        const idea = await s.page.getByTestId('welcome.idea.2').boundingBox();
        if (idea === null) throw new Error('no box for the last idea');
        expect(idea.y + idea.height, 'the ideas end over the inbox block').toBeLessThanOrEqual(Math.min(inbox.y, slot.y + slot.height) + 0.5);
        const office = await s.page.getByTestId('welcome').getAttribute('data-room');
        if (office !== 'none') {
          const scrolls = await s.page.getByTestId('thread.first').evaluate((el) => el.scrollHeight > el.clientHeight + 1);
          expect(scrolls, 'the slot scrolls while the office shows').toBe(false);
        }
        const tag = mainLines ? 'under a line of main' : 'empty thread';
        save(`1280x${String(height)}-${theme}-6-stacked-${mainLines ? 'after' : 'centred'}.png`, await shown(s), `1280x${String(height)} ${theme} · main alone, 2 open cards, ${tag}: the welcome over the inbox, stacked${office === 'none' ? ' (no room: the office hid)' : ''}`);
      } finally {
        await s.close();
      }
    }
  });
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
