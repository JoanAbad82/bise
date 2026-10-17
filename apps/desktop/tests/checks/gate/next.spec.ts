// gate/next · candidate 19d26863's new rows (ambient-lead m_15419), on the packed app off-screen, rich world:
//   INIT    the app's own core (the world's bise, no stub) comes up through JSON-RPC initialize: the core
//           line goes away, the projects fill, <userData>/core.log has no 'initialize refused' and no
//           'not an event' line (proto-stdio m_15152, architect m_15151);
//   LIGHTS  the sidebar's top sits under the macOS lights at rest and scrolled, and drops their room in full
//           screen (window.bise.onFullScreen, f58585d2). Full screen is never entered for real (it would take a
//           Space on his screen): the window's own 'enter-full-screen' / 'leave-full-screen' events are emitted;
//   INBOXB  the one inbox block at the bottom of a thread, settings and a review; ⌘I from settings opens the
//           inbox; a notification's click opens 'inbox?card=<project>/<id>' with that card in front.
// Out: BISE_NEXT_OUT/index.md (appended) + shots. Every shot is looked at by a person before a row is green.
import { appendFileSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { FakeHelper, test, type Session } from '../../harness';
import { launchReal, realWorld, worldSay } from '../world';
import { Lines, sleep } from '../native/world';

const OUT = process.env['BISE_NEXT_OUT'] ?? path.join(os.homedir(), '.bise', 'gate', 'try-gate', 'next');
const FIELD = '[data-testid="composer.field"]';
const NOTIFY = 'bise-desktop: notify';

async function go(s: Session, route: string): Promise<void> {
  await s.page.evaluate((r) => { (window as unknown as { bise: { openWindow: (r?: string) => void } }).bise.openWindow(r); }, route);
  await sleep(1200);
}

type Note = { t: string; key?: string; note?: { key: string; body: string } };

test('gate/next: core through initialize, the lights room, the one inbox block', async () => {
  test.setTimeout(10 * 60_000);
  mkdirSync(OUT, { recursive: true });
  const w = realWorld();
  const helper = new FakeHelper();
  const s = await launchReal(w, { helper });
  const out = new Lines();
  s.app.process().stdout?.setEncoding('utf8');
  s.app.process().stdout?.on('data', (d: string) => { out.push(d); });
  const p = s.page;
  const run = Date.now() % 1_000_000;
  const rows: string[] = [];
  const row = (id: string, t: string): void => { rows.push(`| ${id} | ${t.replace(/\|/g, '\\|')} |`); };
  const shot = async (name: string, pg: Page = p): Promise<void> => { await pg.screenshot({ path: path.join(OUT, `${name}.png`) }).catch(() => undefined); };
  const fullScreen = (on: boolean): Promise<void> =>
    s.app.evaluate(({ BrowserWindow }, v) => {
      for (const b of BrowserWindow.getAllWindows()) if (b.webContents.getURL().includes('index.html')) b.emit(v ? 'enter-full-screen' : 'leave-full-screen');
    }, on);
  const sidebarTop = (): Promise<string> =>
    p.evaluate(() => {
      const sb = document.querySelector<HTMLElement>('[data-testid="app.sidebar"]');
      const first = document.querySelector<HTMLElement>('[data-testid="app.sidebar.search"]');
      const r = first?.getBoundingClientRect();
      return `sidebar scrollTop ${String(sb?.scrollTop ?? -1)}, search box top ${r ? r.top.toFixed(0) : 'none'} px, left ${r ? r.left.toFixed(0) : 'none'} px`;
    });
  try {
    await p.locator(`${FIELD}, [data-testid="setup.skip"]`).first().waitFor({ timeout: 30_000 }).catch(() => undefined);
    const skip = p.getByTestId('setup.skip');
    if (await skip.isVisible().catch(() => false)) await skip.click();
    await sleep(3000);

    // INIT
    {
      const userData = await s.app.evaluate(({ app }) => app.getPath('userData'));
      let log = '';
      try { log = readFileSync(path.join(userData, 'core.log'), 'utf8'); } catch { log = '(no core.log)'; }
      const lines = log.split('\n');
      const refused = lines.filter((l) => l.includes('initialize refused')).length;
      const notEvent = lines.filter((l) => l.includes('not an event')).length;
      const coreLine = await p.getByTestId('app.core').isVisible().catch(() => false);
      const projects = await p.locator('[data-testid^="app.sidebar.project."]').count();
      await shot('INIT');
      row('INIT', `core line shown: ${String(coreLine)}; sidebar project rows: ${String(projects)}; core.log ${String(lines.length)} lines, 'initialize refused' ${String(refused)}, 'not an event' ${String(notEvent)}; initialize lines: ${JSON.stringify(lines.filter((l) => /initiali[sz]e/.test(l)).slice(0, 3))}; last: ${JSON.stringify(lines.filter((l) => l.trim() !== '').slice(-2))}`);
    }

    const ids: Record<string, string> = {};
    for (const id of await p.locator('[data-testid^="app.sidebar.project."]').evaluateAll((es) => es.map((e) => e.getAttribute('data-testid') ?? ''))) {
      const name = (await p.getByTestId(id).innerText().catch(() => '')).trim().split(/\s/)[0] ?? '';
      if (name !== '' && ids[name] === undefined) ids[name] = id.slice('app.sidebar.project.'.length).split('.')[0] ?? '';
    }
    const shop = ids['shop'] ?? 'shop';

    // LIGHTS
    {
      await go(s, `project/${shop}`);
      row('LIGHTS rest', await sidebarTop());
      await shot('LIGHTS-1-rest');
      await p.evaluate(() => { const sb = document.querySelector<HTMLElement>('[data-testid="app.sidebar"]'); if (sb) sb.scrollTop = sb.scrollHeight; });
      await sleep(500);
      row('LIGHTS scrolled', await sidebarTop());
      await shot('LIGHTS-2-scrolled');
      await p.evaluate(() => { const sb = document.querySelector<HTMLElement>('[data-testid="app.sidebar"]'); if (sb) sb.scrollTop = 0; });
      await fullScreen(true);
      await sleep(600);
      row('LIGHTS full screen', await sidebarTop());
      await shot('LIGHTS-3-fullscreen');
      await fullScreen(false);
      await sleep(600);
      row('LIGHTS left full screen', await sidebarTop());
    }

    // INBOXB: the block on a thread, settings and a review
    {
      const block = async (where: string): Promise<void> => {
        const b = p.getByTestId('inbox.block');
        const shown = await b.isVisible().catch(() => false);
        const text = shown ? (await b.innerText()).replace(/\s+/g, ' ').slice(0, 200) : '';
        row(`INBOXB ${where}`, `block shown: ${String(shown)}; ${JSON.stringify(text)}`);
      };
      await go(s, `project/${shop}`);
      await block('thread (shop main)');
      await shot('INBOXB-1-thread');
      await go(s, 'settings');
      await block('settings');
      await shot('INBOXB-2-settings');
      // ⌘I is the menu's (Go › Inbox, CmdOrCtrl+I): a page key press never reaches NSMenu, so the item is clicked.
      // b1b: the inbox is a block, never a screen; ⌘I opens bise's view with its first item open in the block
      const clicked = await s.app.evaluate(({ Menu }) => {
        const find = (items: Electron.MenuItem[]): Electron.MenuItem | undefined => {
          for (const i of items) {
            if (i.label === 'Inbox') return i;
            const sub = i.submenu ? find(i.submenu.items) : undefined;
            if (sub) return sub;
          }
          return undefined;
        };
        const item = find(Menu.getApplicationMenu()?.items ?? []);
        if (!item) return false;
        (item.click as () => void)();
        return true;
      });
      await sleep(1500);
      const settingsLeft = !(await p.getByTestId('settings.root').isVisible().catch(() => false));
      const blockText = (await p.getByTestId('inbox.block').innerText().catch(() => '')).replace(/\s+/g, ' ');
      const label = (await p.locator('body').innerText()).includes('answering');
      row('INBOXB ⌘I from settings', `menu item clicked: ${String(clicked)}; left settings: ${String(settingsLeft)}; an item open in the block ('esc fold' in its keys): ${String(blockText.includes('esc'))}; composer 'answering …': ${String(label)}`);
      await shot('INBOXB-3-cmdI-from-settings');
      await go(s, `review/${shop}/gift-ui`);
      await sleep(1500);
      await block('review (shop · gift-ui)');
      await shot('INBOXB-4-review');
    }

    // INBOXB: a notification's click opens its card in the inbox
    {
      const sd = path.join(w.world, 'rich', 'scripts');
      mkdirSync(sd, { recursive: true });
      const k = `nxb-${String(run)}`;
      const tmp = path.join(sd, `.next-${k}.tmp`);
      writeFileSync(tmp, JSON.stringify({ match: `${k}-start`, calls: [{ tool: 'bash', arg: `sb notify "${k} which branch first? 1. checkout 2. gift-ui"` }], reply: 'Asked you.' }));
      renameSync(tmp, path.join(sd, `next-${k}.json`));
      await go(s, `project/${shop}`);
      await s.app.evaluate((_e, v) => { (globalThis as { __biseTestFocused?: boolean }).__biseTestFocused = v; }, false);
      worldSay('shop', `${k}-start please ask me`);
      const parse = (): Note[] => out.of(NOTIFY).map((l) => { try { return JSON.parse(l) as Note; } catch { return { t: '?' }; } });
      let post: Note | undefined;
      for (let i = 0; i < 150 && post === undefined; i++) {
        post = parse().find((l) => l.t === 'post' && (l.note?.body ?? '').includes(k));
        if (post === undefined) await sleep(300);
      }
      if (post?.note) {
        const ok = await s.app.evaluate((_e, a) => (globalThis as { __biseTestNotify?: (k: string, g: unknown) => boolean }).__biseTestNotify?.(a, { click: true }) ?? false, post.note.key);
        await sleep(1500);
        const key = post.note.key;
        const open = parse().find((l) => l.t === 'open' && l.key === key);
        const front = (await p.locator('body').innerText()).includes(k);
        await shot('INBOXB-5-notification-card');
        row('INBOXB notification', `click ${String(ok)}; open line ${JSON.stringify(open ?? null)}; the card's words on screen: ${String(front)}`);
      } else row('INBOXB notification', 'no post for the card in 45 s');
      await s.app.evaluate((_e, v) => { (globalThis as { __biseTestFocused?: boolean }).__biseTestFocused = v; }, true);
    }
  } finally {
    appendFileSync(path.join(OUT, 'index.md'), ['', `## gate/next (${new Date().toISOString()})`, '', '| row | what the app did |', '|---|---|', ...rows, ''].join('\n'));
    await s.close().catch(() => undefined);
    helper.dispose();
  }
});
