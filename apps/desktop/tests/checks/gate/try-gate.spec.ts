// gate/try-gate · the try gate's shots (ambient-lead m_12391, docs/desktop-bar.md 'Regression list
// (try gate)', owner ambient-pm): one shot per row R01–R40 of the candidate try build, on amb-tools'
// rich world (qa.py world up --rich --agents 30), through the harness (off-screen, test mode) with
// its Electron pointed at an LSUIElement copy of the candidate bundle (BISE_HARNESS_ELECTRON_DIST =
// a folder whose Electron.app is that copy), the real core on the world's home, and the scripted
// helper for fn and the capsule. Opt-in: BISE_TRY_GATE_OUT=<~/.bise/gate/try-gate/<sha8>> (the run
// writes <id>.png, strips as <id>-1…n, moments as <id>-a/b, and index.md). It shoots and notes what
// it could not; ambient-pm marks ok/red by eye. Never a gate by itself: no assertion fails the run
// except a launch that doesn't come up.
import { appendFileSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { inflateSync } from 'node:zlib';
import type { Page } from '@playwright/test';
import { FakeHelper, test, type Session } from '../../harness';
import { launchReal, realWorld, type World } from '../world';
import { appMenu, capsulePage, clickMenu, flat, Lines, sleep, CAPSULE } from '../native/world';

const OUT = process.env['BISE_TRY_GATE_OUT'] ?? '';
test.skip(OUT === '', 'the try gate runs only with BISE_TRY_GATE_OUT');
/** BISE_TRY_GATE_ROWS=R03,R18,ASK-…: only these rows (a reshoot), added to index.md as a new section */
const ONLY = (process.env['BISE_TRY_GATE_ROWS'] ?? '').split(',').map((x) => x.trim()).filter((x) => x !== '');

type Row = { id: string; files: string[]; notes: string[] };
const rows = new Map<string, Row>();
const row = (id: string): Row => {
  const r = rows.get(id) ?? { id, files: [], notes: [] };
  rows.set(id, r);
  return r;
};
const note = (id: string, text: string): void => { row(id).notes.push(text); };

/** one shot of a page (the window by default) into OUT/<name>.png, listed under its row */
async function shot(id: string, name: string, p: Page, o: { omitBackground?: boolean; clip?: { x: number; y: number; width: number; height: number } } = {}): Promise<Buffer | null> {
  try {
    const file = path.join(OUT, `${name}.png`);
    const b = await p.screenshot({ path: file, ...o });
    row(id).files.push(`${name}.png`);
    return b;
  } catch (e) {
    note(id, `${name}: shot failed: ${String(e).split('\n')[0] ?? ''}`);
    return null;
  }
}

/** runs one row; a failure is written in index.md, never thrown */
async function each(id: string, body: () => Promise<void>): Promise<void> {
  if (ONLY.length > 0 && !ONLY.includes(id)) return;
  row(id);
  try {
    await body();
  } catch (e) {
    note(id, `not shot (whole or part): ${String(e).split('\n')[0]?.slice(0, 300) ?? ''}`);
  }
}

// ------------------------------------------------------------------ the window

async function width(s: Session, px: number): Promise<void> {
  await s.app.evaluate(({ BrowserWindow }, w) => {
    const win = BrowserWindow.getAllWindows().find((b) => b.webContents.getURL().includes('surface=window'));
    if (!win) throw new Error('no main window');
    win.setContentSize(w, 760);
  }, px);
  await sleep(500);
}

async function go(s: Session, route: string): Promise<void> {
  await s.page.evaluate((r) => { (window as unknown as { bise: { openWindow: (r?: string) => void } }).bise.openWindow(r); }, route);
  await sleep(1200);
}

const testids = (p: Page, prefix: string): Promise<string[]> =>
  p.locator(`[data-testid^="${prefix}"]`).evaluateAll((es) => es.map((e) => e.getAttribute('data-testid') ?? ''));

// ------------------------------------------------------------------ PNG alpha (R02)

/** RGBA pixels of an 8-bit RGBA PNG (Playwright's omitBackground shots) */
function rgba(png: Buffer): { w: number; h: number; px: Buffer } {
  let o = 8;
  let w = 0, h = 0;
  const idat: Buffer[] = [];
  while (o < png.length) {
    const len = png.readUInt32BE(o);
    const type = png.toString('ascii', o + 4, o + 8);
    const data = png.subarray(o + 8, o + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); if (data[8] !== 8 || data[9] !== 6) throw new Error(`PNG not 8-bit RGBA (depth ${data[8]}, type ${data[9]})`); }
    if (type === 'IDAT') idat.push(data);
    o += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * 4;
  const px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)] ?? 0;
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x] ?? 0;
      const a = x >= 4 ? px[y * stride + x - 4] ?? 0 : 0;
      const b = y > 0 ? px[(y - 1) * stride + x] ?? 0 : 0;
      const c = x >= 4 && y > 0 ? px[(y - 1) * stride + x - 4] ?? 0 : 0;
      const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
      const pred = f === 0 ? 0 : f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      px[y * stride + x] = (v + pred) & 0xff;
    }
  }
  return { w, h, px };
}

// ------------------------------------------------------------------ the run

test('try gate: R01–R40 shots of the candidate on the rich world', async () => {
  test.setTimeout(30 * 60_000);
  mkdirSync(OUT, { recursive: true });
  const w: World = realWorld();
  const helper = new FakeHelper();
  // the core's fake voice (BISE_AMBIENT_FAKE_VOICE): the words of this file, read and removed at talk_start
  const voice = path.join(w.home, 'tmp', 'qa-native-gate-voice.txt');
  mkdirSync(path.dirname(voice), { recursive: true });
  const s = await launchReal(w, { helper, env: { BISE_AMBIENT_FAKE_VOICE: voice } });
  const out = new Lines();
  s.app.process().stdout?.setEncoding('utf8');
  s.app.process().stdout?.on('data', (d: string) => { out.push(d); });
  const p = s.page;
  const projects = w.hubs.map((h) => h.project).join(', ');
  const started = new Date().toISOString();
  try {
    // ---- first launch, a fresh keep: onboarding (R33), then the folders at launch (R26)
    await each('R33', async () => {
      await p.getByTestId('setup.root').waitFor({ timeout: 15_000 });
      await shot('R33', 'R33', p);
      const buttons = await p.evaluate(() => document.querySelectorAll('.traffic, [data-testid*="window.buttons"]').length);
      note('R33', `window buttons drawn by the page: ${buttons} (macOS draws its own off-screen: not visible here)`);
    });
    await each('R34', async () => {
      note('R34', 'the rich world has 3 projects, not 22: the picker is shot as it is');
      await p.getByTestId('setup.root').waitFor({ timeout: 20_000 });
      // setup's own steps (hello, permissions, …) to its project picker (setup.list / setup.filter / setup.choose)
      const picker = p.locator('[data-testid="setup.list"], [data-testid="setup.filter"], [data-testid="setup.choose"]').first();
      const seen: string[] = [];
      for (let i = 0; i < 8 && !(await picker.isVisible().catch(() => false)); i++) {
        seen.push((await testids(p, 'setup.step.')).join('+'));
        const next = p.getByTestId('setup.next');
        if (!(await next.isVisible().catch(() => false))) break;
        await next.click({ timeout: 20_000 });
        await sleep(1500);
      }
      note('R34', `setup steps on the way: ${seen.join(' → ')}`);
      if (await picker.isVisible().catch(() => false)) {
        await shot('R34', 'R34-1100', p);
        await width(s, 800);
        await shot('R34', 'R34-800', p);
        await width(s, 1100);
      } else note('R34', `no project picker reached in setup (steps seen: ${(await testids(p, 'setup.step')).join(', ')})`);
    });
    const skip = p.getByTestId('setup.skip');
    if (await skip.isVisible().catch(() => false)) await skip.click();
    else await go(s, 'bise');
    await sleep(1500);
    // the projects' ids (the routes take ids, not names), from the sidebar's rows
    const pid = async (name: string): Promise<string> => {
      for (const id of await testids(p, 'app.sidebar.project.')) {
        const t = (await p.getByTestId(id).innerText().catch(() => '')).trim();
        if (t.split(/\s/)[0] === name) return id.slice('app.sidebar.project.'.length).split('.')[0] ?? name;
      }
      return name;
    };
    const shop = await pid('shop');
    const tel = await pid('telemetry');
    await each('R26', async () => { await shot('R26', 'R26', p); });
    await each('R28', async () => { await shot('R28', 'R28', p, { clip: { x: 0, y: 0, width: 260, height: 140 } }); });

    // ---- R01 / R22: screens at 1100 and 800
    await each('R01', async () => {
      for (const [r, name] of [['bise', 'bise'], ['inbox', 'inbox'], ['settings', 'settings'], [`project/${shop}`, 'shop-main']] as const) {
        await go(s, r);
        await width(s, 1100);
        await shot('R01', `R01-${name}-1100`, p);
        await width(s, 800);
        await shot('R01', `R01-${name}-800`, p);
      }
      await width(s, 1100);
    });
    await each('R22', async () => {
      await go(s, 'inbox');
      await shot('R22', 'R22-1100', p);
      await width(s, 800);
      await shot('R22', 'R22-800', p);
      await width(s, 1100);
    });

    // ---- R16: ⌘I through the app's menu (Go/Inbox, its item)
    await each('R16', async () => {
      await go(s, 'bise');
      await clickMenu(s, 'Go/Inbox');
      await sleep(1000);
      await shot('R16', 'R16', p);
      note('R16', `inbox items: ${(await p.locator('[data-testid^="inbox.item"]').count())}`);
    });

    // ---- R06: the menu model as text
    await each('R06', async () => {
      const m = await appMenu(s);
      const lines = flat(m).filter((e) => e.label !== '').map((e) => `${e.path}${e.key ? `  ${e.key}` : ''}${e.role ? `  (role ${e.role})` : ''}`);
      writeFileSync(path.join(OUT, 'R06-menus.txt'), lines.join('\n') + '\n');
      row('R06').files.push('R06-menus.txt');
      note('R06', 'native menus cannot be shot off-screen: the menu model, each item with its key, in R06-menus.txt');
    });

    // ---- R21 / R27 / R20: the sidebar
    await each('R21', async () => { await go(s, 'bise'); await shot('R21', 'R21', p); });
    await each('R27', async () => {
      await go(s, `project/${tel}`);
      for (let i = 1; i <= 6; i++) { await shot('R27', `R27-${i}`, p, { clip: { x: 0, y: 0, width: 260, height: 760 } }); await sleep(250); }
    });
    await each('R20', async () => { await go(s, 'bise'); await shot('R20', 'R20-sidebar', p, { clip: { x: 0, y: 0, width: 260, height: 140 } }); });

    // ---- R31 / R39 / R23 / R35 / R37: threads
    await each('R31', async () => { await go(s, `project/${shop}`); await shot('R31', 'R31', p); note('R31', `side panel ids: ${(await testids(p, 'thread.side')).slice(0, 8).join(', ') || 'none found'}`); });
    await each('R23', async () => { await go(s, `project/${tel}`); await sleep(1000); await shot('R23', 'R23-thread', p); });
    await each('R37', async () => { await go(s, `project/${tel}`); await shot('R37', 'R37', p); note('R37', `thinking rows visible: ${await p.getByText(/thought/).count()}`); });
    await each('R39', async () => {
      await go(s, `project/${tel}`);
      const list = p.getByTestId('thread.list');
      for (let i = 0; i < 12; i++) { await list.hover(); await p.mouse.wheel(0, -4000); await sleep(400); }
      await shot('R39', 'R39', p);
    });
    await each('R35', async () => { await go(s, `project/${tel}`); await width(s, 1800); await shot('R35', 'R35-1800', p); await width(s, 1100); });
    await each('R36', async () => { await go(s, 'bise'); await sleep(800); await shot('R36', 'R36', p); note('R36', `raw tags in the thread text: ${(await p.getByTestId('thread.list').innerText().catch(() => '')).match(/<\/?(screen_context|selection|pasted)[^>]*>/g)?.join(' ') ?? 'none'}`); });

    // ---- the composer: R13, R25, R12, R24/R15, R23's composer, R32
    const field = p.getByTestId('composer.field').first();
    await each('R13', async () => {
      await go(s, `project/${shop}`);
      for (const [ch, n] of [['/', 'slash'], ['@', 'at'], ['$', 'skills']] as const) {
        await field.click();
        await p.keyboard.type(ch);
        await sleep(700);
        await shot('R13', `R13-${n}`, p);
        await p.keyboard.press('Escape');
        await p.keyboard.press('Backspace');
      }
    });
    await each('R25', async () => {
      await go(s, `project/${shop}`);
      // the input box: the field's nearest ancestor that also holds the send button (not the hints line under it)
      const b = await field.evaluate((el) => {
        let e: HTMLElement | null = el;
        while (e && !e.querySelector('[data-testid="composer.send"]')) e = e.parentElement;
        const r = (e ?? el).getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      });
      await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await sleep(300);
      await shot('R25', 'R25-a-hover', p);
      const at = { x: b.x + b.width - 6, y: b.y + b.height - 6 };
      const under = await p.evaluate(({ x, y }) => {
        const e = document.elementFromPoint(x, y);
        const id = e?.closest('[data-testid]')?.getAttribute('data-testid') ?? '';
        return e === null ? 'nothing' : `${e.tagName.toLowerCase()}${(e.getAttribute('class') ?? '').split(' ').filter((c) => c !== '').map((c) => `.${c}`).join('')} (inside ${id})`;
      }, at);
      note('R25', `the corner click lands at ${Math.round(at.x)},${Math.round(at.y)} (6 px inside the composer box's bottom-right), on ${under}`);
      await p.mouse.click(at.x, at.y);
      await sleep(300);
      await shot('R25', 'R25-b-clicked', p);
      note('R25', `after the corner click the focus is in the field: ${await field.evaluate((e) => e === document.activeElement || e.contains(document.activeElement))}`);
    });
    await each('R12', async () => {
      await go(s, `project/${shop}`);
      await field.click();
      for (let i = 1; i <= 6; i++) { await p.keyboard.type('typing '); await shot('R12', `R12-${i}`, p); }
      await p.keyboard.press('Meta+a');
      await p.keyboard.press('Backspace');
    });
    await each('R23', async () => {
      await field.click();
      await p.keyboard.type('**bold** and `code` and\n- a list item');
      await sleep(300);
      await shot('R23', 'R23-composer', p);
      await p.keyboard.press('Meta+a');
      await p.keyboard.press('Backspace');
    });
    // R24 / R15: one composer with a pasted image, a quote of the thread and dictation running
    await each('R24', async () => {
      await go(s, `project/${tel}`);
      // the quote: a real drag-selection over an answer's words (mouse down, move, up), then Space
      const para = p.getByTestId('thread.list').locator('p').filter({ hasText: /\w{4,}/ }).last();
      const pb = await para.boundingBox();
      if (pb) {
        await p.mouse.move(pb.x + 4, pb.y + Math.min(10, pb.height / 2));
        await p.mouse.down();
        await p.mouse.move(pb.x + Math.min(260, pb.width - 4), pb.y + Math.min(10, pb.height / 2), { steps: 8 });
        await p.mouse.up();
        await sleep(500);
        await shot('R24', 'R24-a-selection', p);
        await p.keyboard.press('Space');
        await sleep(700);
      } else note('R24', 'no answer paragraph to select');
      // the image: a PNG on the app's clipboard (Electron's clipboard, the test's own: test mode fences it), then ⌘V in the field
      await s.app.evaluate(({ clipboard, nativeImage }) => {
        // a 1x1 PNG, scaled to 64x40
        const one = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- NativeImage.resize, typed in Electron's main
        clipboard.writeImage(one.resize({ width: 64, height: 40 }));
      });
      await field.click();
      await p.keyboard.press('Meta+v');
      await sleep(1000);
      await p.keyboard.type('what is this? ');
      await p.keyboard.press('Control+r');
      await sleep(900);
      await shot('R24', 'R24', p);
      row('R15').files.push('R24.png');
      const chips = await p.locator('[data-testid="composer"] [data-testid*="chip"]').evaluateAll((es) => es.map((e) => `${e.getAttribute('data-testid') ?? ''}:${(e.textContent).trim().slice(0, 30)}`));
      note('R24', `chips in the composer: ${chips.join(' | ') || 'none'}`);
      note('R15', 'same shot as R24 (image pasted, quote by Space on a selection, ctrl+r dictation); its chips are listed under R24');
      await p.keyboard.press('Control+r');
      await p.keyboard.press('Meta+a');
      await p.keyboard.press('Backspace');
    });
    await each('R32', async () => {
      await go(s, `project/${shop}`);
      await field.click();
      await p.keyboard.type('a draft that must survive a reload');
      await sleep(600);
      await shot('R32', 'R32-a-before', p);
      await p.reload();
      await sleep(2500);
      await shot('R32', 'R32-b-after-reload', p);
      note('R32', `draft after reload: ${JSON.stringify(await p.getByTestId('composer.field').first().innerText().catch(() => ''))}`);
    });

    // ---- sends: R11, R17, R40 (streaming)
    await each('R17', async () => {
      await go(s, 'bise');
      await field.click();
      await p.keyboard.press('Meta+a');
      await p.keyboard.press('Backspace');
      await p.keyboard.type('hello from the try gate [[slow: 2]]');
      await p.keyboard.press('Enter');
      await sleep(100);
      await shot('R17', 'R17-a-100ms', p);
      await sleep(1900);
      await shot('R17', 'R17-b-2s', p);
    });
    await each('R11', async () => {
      await sleep(2500);
      await shot('R11', 'R11', p);
      note('R11', `core line shown: ${await p.getByTestId('app.core').count()}`);
    });
    await each('R40', async () => {
      await field.click();
      await p.keyboard.type('stream please [[drip: 12 0.25]]');
      await p.keyboard.press('Enter');
      for (let i = 1; i <= 6; i++) { await sleep(400); await shot('R40', `R40-${i}`, p); }
    });

    // ---- R38: a selection's pop, then Space
    await each('R38', async () => {
      await go(s, `project/${tel}`);
      const text = p.getByTestId('thread.list').locator('p').last();
      await text.dblclick();
      await sleep(500);
      await shot('R38', 'R38-a-selection', p);
      await p.keyboard.press('Space');
      await sleep(600);
      await shot('R38', 'R38-b-after-space', p);
    });

    // ---- R10 / R09: artifacts, a landed commit's diff
    await each('R10', async () => { await go(s, 'artifacts'); await shot('R10', 'R10', p); });
    await each('R09', async () => {
      await go(s, `changes/${shop}`);
      await shot('R09', 'R09-a-changes', p);
      const landed = p.locator('[data-testid^="changes.row"]').first();
      if (await landed.isVisible().catch(() => false)) { await landed.click(); await sleep(1200); await shot('R09', 'R09-b-diff', p); } else note('R09', 'no changes row to open');
    });

    // ---- designer's R40 redo (m_12775): a reply that streams (amb-tools 9a0a1cd7: a script's "stream" key,
    // 12 text deltas 250 ms apart), a list and a code block; 6 frames ~150 ms apart DURING the stream
    await each('ASK-designer-2', async () => {
      const phrase = 'show me the rollout steps as they come';
      const reply = ['Here is the rollout, step by step:', '', '- ship the ingest batch size fix', '- watch the p99 for one hour', '- then flip the alert to the real percentile', '', '```sh', 'bise run alerts --percentile p99 --window 1h', '```', '', 'I will tell you when the dashboard is up.'].join(String.fromCharCode(10));
      const dir = path.join(path.dirname(w.home), 'rich', 'scripts');
      writeFileSync(path.join(dir, 'qa-native-r40.json.tmp'), JSON.stringify({ match: phrase, calls: [], reply, stream: { chunks: 12, every: 0.25 } }));
      renameSync(path.join(dir, 'qa-native-r40.json.tmp'), path.join(dir, 'qa-native-r40.json'));
      await sleep(500);
      await go(s, 'bise');
      await field.click();
      await p.keyboard.type(phrase);
      await p.keyboard.press('Enter');
      // the first words: then 6 frames 150 ms apart
      await p.getByText('Here is the rollout', { exact: false }).first().waitFor({ timeout: 20_000 });
      for (let i = 1; i <= 6; i++) { await shot('ASK-designer-2', `R40-redo-${i}`, p); await sleep(150); }
      await sleep(3500);
      await shot('ASK-designer-2', 'R40-redo-done', p);
      note('ASK-designer-2', 'R40 redo: reply streamed in 12 deltas 250 ms apart (fake script stream key); frames 1-6 from the first words on, ~150 ms apart plus the shot time; -done after the stream');
    });

    // ---- ambient-pm's asks on the window (m_12768, m_12769, m_12771, m_12772)
    const docs = await pid('docs');
    await each('ASK-pm-1', async () => {
      await go(s, `agent/${tel}/dashboards`);
      await sleep(1000);
      await shot('ASK-pm-1', 'ask-ambient-pm-1-dashboards-tools', p);
    });
    await each('ASK-pm-2', async () => {
      await clickMenu(s, 'Go/Inbox');
      await sleep(1000);
      const card = p.locator('[data-testid^="inbox.item"]').filter({ hasText: /dark-mode/ }).first();
      await card.click({ timeout: 10_000 });
      await sleep(1000);
      await shot('ASK-pm-2', 'ask-ambient-pm-2-inbox-feature-try', p);
    });
    await each('ASK-pm-5', async () => {
      await go(s, `feature/${docs}/dark-mode`);
      await sleep(1500);
      await shot('ASK-pm-5', 'ask-ambient-pm-5-feature-dark-mode', p);
    });
    await each('ASK-pm-4', async () => {
      const theme = (): Promise<string> => p.evaluate(() => document.documentElement.getAttribute('data-theme') ?? '(none)');
      // 1. '/theme dark' typed in bise's composer: does it change <html data-theme>? (ambient-pm m_12808)
      await go(s, 'bise');
      const before = await theme();
      await field.click();
      await p.keyboard.type('/theme dark');
      await sleep(500);
      await p.keyboard.press('Enter');
      await sleep(1500);
      note('ASK-pm-4', `'/theme dark' in bise's composer: data-theme ${before} -> ${await theme()}`);
      // 2. settings · general's theme control, 'dark' picked (as he would)
      await go(s, 'settings/general');
      const ctl = p.getByTestId('settings.pref.theme');
      await ctl.getByText(/^dark$/i).first().click({ timeout: 10_000 });
      await sleep(1200);
      note('ASK-pm-4', `settings · general theme → dark: data-theme ${await theme()}`);
      await shot('ASK-pm-4', 'ask-ambient-pm-4-settings-dark', p);
      await go(s, 'bise');
      await sleep(800);
      await shot('ASK-pm-4', 'ask-ambient-pm-4-bise-dark', p);
      // designer's ask (m_12774, m_12803): telemetry's main thread in dark
      await go(s, `project/${tel}`);
      await sleep(1000);
      await shot('ASK-pm-4', 'ask-designer-1-telemetry-dark', p);
      note('ASK-pm-4', `data-theme on the dark shots: ${await theme()}`);
      // back to light for the rest
      await go(s, 'settings/general');
      await ctl.getByText(/^light$/i).first().click({ timeout: 10_000 }).catch(() => undefined);
      await sleep(800);
    });

    // ---- the capsule (scripted helper): R04, R07, R19, R29, R18, R02, R05, R08, R14, R20, R30, R03
    const cap = await capsulePage(s);
    const spot = async (): Promise<void> => {
      await helper.send({ ev: 'fn', act: 'key', key: 'space' });
      await out.wait(CAPSULE, (l) => l.startsWith('show'), 5000);
      await sleep(500);
    };
    const hide = async (): Promise<void> => { await helper.send({ ev: 'fn', act: 'esc' }); await sleep(500); };
    await each('R04', async () => {
      await spot();
      await cap.keyboard.press('ArrowDown');
      await sleep(400);
      await shot('R04', 'R04-spot', cap, { omitBackground: true });
      await hide();
    });
    await each('R07', async () => {
      await spot();
      await cap.keyboard.type('p99');
      await sleep(600);
      await shot('R07', 'R07-a-spot', cap, { omitBackground: true });
      await cap.keyboard.press('Enter');
      await sleep(1500);
      await shot('R07', 'R07-b-window', p);
      note('R07', "typed 'p99' (telemetry's p99), then ⏎: the window's route after it is in R07-b-window.png");
      await hide();
    });
    await each('R19', async () => {
      await spot();
      for (let i = 1; i <= 6; i++) { await cap.keyboard.type('ab'[i % 2] ?? 'a'); await shot('R19', `R19-${i}`, cap, { omitBackground: true }); }
      await hide();
    });
    await each('R29', async () => {
      await spot();
      const frames: string[] = [];
      const fieldTop = await cap.getByTestId('spot.input').evaluate((e) => e.getBoundingClientRect().top);
      await cap.evaluate((top) => {
        const g = document.createElement('div');
        g.id = 'qa-guide';
        g.style.cssText = `position:fixed;left:0;right:0;top:${top}px;height:1px;background:red;z-index:99999;pointer-events:none`;
        document.body.appendChild(g);
      }, fieldTop);
      for (let i = 1; i <= 4; i++) {
        await cap.keyboard.type('tsbc'[i - 1] ?? 'a');
        await sleep(400);
        const b = await s.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((x) => x.webContents.getURL().includes('surface=capsule'))?.getBounds());
        frames.push(JSON.stringify(b));
        await shot('R29', `R29-${i}`, cap, { omitBackground: true });
      }
      await cap.evaluate(() => document.getElementById('qa-guide')?.remove());
      note('R29', `capsule frame per letter (x,y must stay): ${frames.join(' ')}; red guide line at the field's top as it was at show`);
      await hide();
    });
    await each('R18', async () => {
      // a 52-line markdown answer from the world's fake model: a script of its own ($FAKE_SCRIPTS, the rich world's)
      const phrase = 'walk me through the whole notification rollout plan';
      const body = ['## Notification rollout', '', ...Array.from({ length: 50 }, (_, i) => (i % 10 === 0 ? `### Step ${String(i / 10 + 1)}` : `- line ${String(i + 1)}: check the **p99** of \`notify-${String(i)}\` before the next region`))];
      writeFileSync(path.join(path.dirname(w.home), 'rich', 'scripts', 'qa-native-r18.json'), JSON.stringify({ match: phrase, calls: [], reply: body.join(String.fromCharCode(10)) }));
      await spot();
      await cap.keyboard.type(phrase);
      await cap.keyboard.press('Enter');
      await sleep(8000);
      await shot('R18', 'R18', cap, { omitBackground: true });
      // ambient-pm m_12807: did the answer land in bise's thread? the window right after
      await go(s, 'bise');
      await sleep(800);
      await shot('R18', 'R18-window-bise', p);
      note('R18', `the 52-line answer in bise's thread: ${(await p.getByTestId('thread.list').innerText().catch(() => '')).includes('Notification rollout') ? 'yes' : 'no'}`);
      note('R18', `asked in the spot; the fake model answers ${String(body.length)} lines of markdown; capsule ${JSON.stringify(await s.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((x) => x.webContents.getURL().includes('surface=capsule'))?.getBounds()))}, its view: ${await cap.getByTestId('capsule').getAttribute('data-view').catch(() => '?')}`);
      await hide();
    });
    // R08's spoken ask, about three lines long, heard through the core's real talk path
    writeFileSync(voice, 'can you look at why the checkout page gets slower every friday afternoon, compare it with the dashboards from last week, and tell me if the cache change from tuesday is the cause or if it is the new image pipeline that ships the bigger thumbnails to every phone');
    await helper.send({ ev: 'fn', act: 'talk_start', by: 'fn' });
    await out.wait(CAPSULE, (l) => l.startsWith('show bottom'), 5000).catch(() => undefined);
    await each('R05', async () => {
      await sleep(300);
      await shot('R05', 'R05-300ms', cap, { omitBackground: true });
      note('R05', 'fn from rest with another app in front: native/fn-from-rest on this bundle, result below');
    });
    await each('R02', async () => {
      const png = await shot('R02', 'R02-talk', cap, { omitBackground: true });
      const pearl = await cap.getByTestId('capsule.pearl').boundingBox();
      if (png && pearl) {
        await shot('R02', 'R02-pearl-2x', cap, { omitBackground: true, clip: { x: pearl.x - 20, y: pearl.y - 20, width: pearl.width + 40, height: pearl.height + 40 } });
        const { w: W, h: H, px } = rgba(png);
        const dpr = W / (await cap.evaluate(() => window.innerWidth));
        const glow = 24;
        let outside = 0, total = 0;
        const glass = await cap.getByTestId('capsule.talk').boundingBox();
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const cx = x / dpr, cy = y / dpr;
          const inPearl = cx >= pearl.x - glow && cx <= pearl.x + pearl.width + glow && cy >= pearl.y - glow && cy <= pearl.y + pearl.height + glow;
          const inGlass = glass !== null && cx >= glass.x && cx <= glass.x + glass.width && cy >= glass.y && cy <= glass.y + glass.height;
          if (inPearl || inGlass) continue;
          total++;
          if ((px[(y * W + x) * 4 + 3] ?? 0) !== 0) outside++;
        }
        note('R02', `pixels outside the pearl's glow (${glow} px) and the talk glass with alpha > 0: ${outside} of ${total} (window ${W}x${H} px, dpr ${dpr}); the glass itself is the talk's panel, the pearl sits on it`);
      }
    });
    await each('R14', async () => {
      for (let i = 1; i <= 3; i++) { await shot('R14', `R14-${i}-listen`, cap, { omitBackground: true, clip: (await cap.getByTestId('capsule.pearl').boundingBox()) ?? undefined }); await sleep(200); }
    });
    await each('R30', async () => {
      const bs: string[] = [];
      for (let i = 1; i <= 5; i++) {
        await shot('R30', `R30-${i}`, cap, { omitBackground: true });
        bs.push(JSON.stringify(await s.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((x) => x.webContents.getURL().includes('surface=capsule'))?.getBounds())));
        await sleep(2000);
      }
      note('R30', `held 10 s, capsule frame every 2 s: ${bs.join(' ')}`);
    });
    await each('R20', async () => { await shot('R20', 'R20-talk', cap, { omitBackground: true }); });
    await helper.send({ ev: 'fn', act: 'talk_end' });
    await each('R08', async () => {
      await sleep(200);
      await shot('R08', 'R08-a', cap, { omitBackground: true });
      await sleep(1000);
      await shot('R08', 'R08-b-1s', cap, { omitBackground: true });
      note('R08', `the core's fake voice said a ~3-line ask during the 10 s hold; the talk right after its release, then 1 s later. capsule text: ${JSON.stringify((await cap.getByTestId('capsule').innerText().catch(() => '')).slice(0, 300))}`);
    });
    await each('R14', async () => {
      for (let i = 4; i <= 6; i++) { await shot('R14', `R14-${i}-think`, cap, { omitBackground: true }); await sleep(300); }
    });
    await hide();
    // R03: a card in the capsule (the spot's first waiting row, ⏎), one of its buttons hovered
    await each('R03', async () => {
      await spot();
      await cap.keyboard.press('Enter');
      await sleep(1000);
      await shot('R03', 'R03-a-after-enter', cap, { omitBackground: true });
      note('R03', `after ⏎ on the spot's first waiting row: view ${await cap.getByTestId('capsule').getAttribute('data-view').catch(() => '?')}, buttons ${JSON.stringify(await cap.locator('button').evaluateAll((es) => es.map((e) => e.textContent.trim().slice(0, 20)).slice(0, 6)))}`);
      const btn = cap.locator('[data-testid="capsule"] button').first();
      await btn.hover({ timeout: 5000 });
      await sleep(300);
      await shot('R03', 'R03-card-hover', cap, { omitBackground: true });
      note('R03', `capsule view: ${await cap.getByTestId('capsule').getAttribute('data-view').catch(() => '?')}; hovered: ${JSON.stringify((await btn.innerText()).trim())}; app/clicks: green on 723648da (real.sh, ambient-lead m_12764)`);
      await hide();
    });
    // ambient-pm's capsule ask: the spot with 'ingest' typed and its row selected
    await each('ASK-pm-3', async () => {
      await spot();
      await cap.keyboard.type('ingest');
      await sleep(800);
      await shot('ASK-pm-3', 'ask-ambient-pm-3-spot-ingest', cap, { omitBackground: true });
      await hide();
    });
  } finally {
    const lines = [
      `# try gate shots`,
      '',
      `- candidate: ${path.basename(OUT)} (packed bundle via BISE_HARNESS_ELECTRON_DIST=${process.env['BISE_HARNESS_ELECTRON_DIST'] ?? ''})`,
      `- world: ${w.home} (projects: ${projects}), bise ${w.bise}`,
      `- started ${started}, ended ${new Date().toISOString()}; width 1100 and light unless the name says; capsule shots on its transparent window (omitBackground)`,
      '',
      '| row | files | notes |',
      '|---|---|---|',
      ...[...rows.values()].sort((a, b) => a.id.localeCompare(b.id)).map((r) => `| ${r.id} | ${r.files.join('<br>') || '—'} | ${r.notes.join('<br>').replace(/\|/g, '\\|') || ''} |`),
      '',
    ];
    const text = lines.join(String.fromCharCode(10));
    if (ONLY.length > 0) appendFileSync(path.join(OUT, 'index.md'), `${String.fromCharCode(10)}## reshoot: ${ONLY.join(', ')}${String.fromCharCode(10)}${text.split(String.fromCharCode(10)).slice(1).join(String.fromCharCode(10))}`);
    else writeFileSync(path.join(OUT, 'index.md'), text);
    await s.close().catch(() => undefined);
    helper.dispose();
  }
});
