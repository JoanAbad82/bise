// gate/notify-real · R45-R47 (docs/desktop-bar.md; amb-mac 76198d7e, ambient-lead m_14341): his questions
// as macOS notifications, on the REAL core and the real app, off-screen. Test mode never posts: main says
// each step on 'bise-desktop: notify' + JSON (post, close, answer, open, failed), and this check plays
// his side through main's test globals __biseTestFocused / __biseTestNotify(key, gesture). The cards are
// real: shop's main opens them with `sb notify` (the world's live fake scripts). Passes when:
//   - the cards that waited at start never knock;
//   - a card arriving while no bise window has the keys knocks once: '<who> asks · shop', the question,
//     its choices + 'open in bise', a reply; one arriving while a window has the keys knocks zero times;
//   - a choice and a reply reach the hub as answers (shop main's transcript: 'the user answered card');
//   - a card answered elsewhere (⌘I) closes its notification.
// Out: BISE_NOTIFY_OUT/index.md (appended) + window shots.
import { appendFileSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { FakeHelper, expect, test } from '../../harness';
import { hubOf, launchReal, realWorld, worldSay } from '../world';
import { Lines, sleep } from '../native/world';

import { inbox } from '../../../src/proto/words_inbox.gen';
const OUT = process.env['BISE_NOTIFY_OUT'] ?? path.join(os.homedir(), '.bise', 'gate', 'try-gate', 'notify');
const NOTIFY = 'bise-desktop: notify';
type Line = { t: string; key?: string; note?: { key: string; title: string; body: string; actions: string[]; reply: boolean; silent: boolean }; cmd?: { cmd?: string; card?: number; reply?: string } };

test('gate/notify-real: R45-R47 on the real core: knock when away, words, choice + reply answer, answered elsewhere closes', async () => {
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
  const row = (id: string, ok: boolean, t: string): void => { rows.push(`| ${id} | ${ok ? 'green' : '**red**'} | ${t.replace(/\|/g, '\\|')} |`); };
  const lines = (): Line[] => out.of(NOTIFY).map((l) => { try { return JSON.parse(l) as Line; } catch { return { t: '?' }; } });
  const waitFor = async (pred: (l: Line) => boolean, ms: number): Promise<Line | undefined> => {
    const end = Date.now() + ms;
    for (;;) {
      const hit = lines().find(pred);
      if (hit || Date.now() > end) return hit;
      await sleep(300);
    }
  };
  const focus = (on: boolean): Promise<void> => s.app.evaluate((_e, v) => { (globalThis as { __biseTestFocused?: boolean }).__biseTestFocused = v; }, on);
  const gesture = (key: string, g: unknown): Promise<boolean> =>
    s.app.evaluate((_e, a) => (globalThis as { __biseTestNotify?: (k: string, g: unknown) => boolean }).__biseTestNotify?.(a.key, a.g) ?? false, { key, g });
  const sd = path.join(w.world, 'rich', 'scripts');
  const shopLog = path.join(path.dirname(hubOf(w, 'shop').sock), 'agents', 'main', 'transcript.log');
  const card = async (k: string): Promise<Line | undefined> => {
    mkdirSync(sd, { recursive: true });
    const tmp = path.join(sd, `.notify-${k}.tmp`);
    // the script matches his message only (a later answer quotes the question, never the start word)
    writeFileSync(tmp, JSON.stringify({ match: `${k}-start`, calls: [{ tool: 'bash', arg: `sb notify "${k} which window for the alert? 1. five minutes 2. fifteen minutes"` }], reply: 'Asked you.' }));
    renameSync(tmp, path.join(sd, `notify-${k}.json`));
    worldSay('shop', `${k}-start please ask me`);
    return waitFor((l) => l.t === 'post' && (l.note?.body ?? '').includes(k), 45_000);
  };
  const answered = (k: string, reply: string): boolean => {
    try {
      return readFileSync(shopLog, 'utf8').split('\n').some((l) => l.includes('answered card') && l.includes(k) && l.includes(`"${reply}"`));
    } catch { return false; }
  };
  try {
    await p.locator('[data-testid="composer.field"], [data-testid="setup.skip"]').first().waitFor({ timeout: 20_000 }).catch(() => undefined);
    const skip = p.getByTestId('setup.skip');
    if (await skip.isVisible().catch(() => false)) await skip.click();
    await focus(false);
    await sleep(4000);
    const atStart = lines().filter((l) => l.t === 'post');
    row('R45 seed', atStart.length === 0, `posts for the cards that waited at start: ${String(atStart.length)}`);

    // R45/R46: away, a new question knocks once with its words, choices and a reply
    const a = `nfa-${String(run)}`;
    const pa = await card(a);
    const posts = lines().filter((l) => l.t === 'post' && (l.note?.body ?? '').includes(a)).length;
    row('R45 away', pa !== undefined && posts === 1, pa ? `one post: title ${JSON.stringify(pa.note?.title)}, body ${JSON.stringify(pa.note?.body)}, actions ${JSON.stringify(pa.note?.actions)}, reply ${String(pa.note?.reply)}, silent ${String(pa.note?.silent)} (posts for it: ${String(posts)})` : 'no post in 45 s');
    if (pa?.note) {
      const okWords = /asks · shop$/.test(pa.note.title) && pa.note.actions.includes(inbox.key_open_in_bise) && pa.note.reply;
      row('R46 words', okWords, `'<who> asks · shop': ${pa.note.title}; choices then 'open in bise': ${JSON.stringify(pa.note.actions)}; a reply: ${String(pa.note.reply)}`);
      // R47: its 2nd choice answers, the hub gets '2', the notification closes
      const sent = await gesture(pa.note.key, { action: 1 });
      const ans = await waitFor((l) => l.t === 'answer' && l.key === pa.note?.key, 5000);
      await sleep(4000);
      const closed = lines().some((l) => l.t === 'close' && l.key === pa.note?.key);
      row('R47 choice', sent && ans?.cmd?.reply === '2' && answered(a, '2'), `gesture ${String(sent)}; answer line ${JSON.stringify(ans?.cmd ?? null)}; shop main's transcript 'answered card … "2"': ${String(answered(a, '2'))}; closed after: ${String(closed)}`);
    }

    // a bise window has the keys: nothing knocks
    await focus(true);
    const b = `nfb-${String(run)}`;
    const pb = await card(b);
    row('R45 focused', pb === undefined, pb ? `a post while focused: ${JSON.stringify(pb.note?.title)}` : 'no post in 45 s while a bise window had the keys');
    await focus(false);

    // a reply answers with his trimmed words
    const c = `nfc-${String(run)}`;
    const pc = await card(c);
    if (pc?.note) {
      const sent = await gesture(pc.note.key, { reply: '  the second one please  ' });
      const ans = await waitFor((l) => l.t === 'answer' && l.key === pc.note?.key, 5000);
      await sleep(4000);
      row('R47 reply', sent && ans?.cmd?.reply === 'the second one please' && answered(c, 'the second one please'), `answer line ${JSON.stringify(ans?.cmd ?? null)}; in shop main's transcript: ${String(answered(c, 'the second one please'))}`);
    } else row('R47 reply', false, 'no post for the reply card in 45 s');

    // a card answered elsewhere (⌘I in the window) closes its notification
    const d = `nfd-${String(run)}`;
    const pd = await card(d);
    if (pd?.note) {
      // b1b (416a4ad3): the inbox is a block, never a screen of its own; 'inbox?card=<project>/<id>' (what ⌘I
      // and a click open) puts that card in front in bise's block, where '1' over an empty composer picks
      const route = `inbox?card=${pd.note.key.replace('#', '/')}`;
      await p.evaluate((r) => { (window as unknown as { bise: { openWindow: (r?: string) => void } }).bise.openWindow(r); }, route);
      await sleep(1500);
      await p.keyboard.press('1');
      const closed = await waitFor((l) => l.t === 'close' && l.key === pd.note?.key, 20_000);
      await p.screenshot({ path: path.join(OUT, 'R47-answered-elsewhere.png') });
      row('R47 elsewhere', closed !== undefined && answered(d, '1'), `answered in bise's inbox block (${route}) with '1' (transcript: ${String(answered(d, '1'))}); its notification closed: ${String(closed !== undefined)}`);
    } else row('R47 elsewhere', false, 'no post for that card in 45 s');

    // a0 (amb-mac 830e0676): Help › 'send a test notification' is in the menu of a try/check/test build and
    // posts one card-like note (test mode: a {t:'test'} line instead of <userData>/notify-test.log)
    const help = await s.app.evaluate(({ Menu }) => {
      const m = Menu.getApplicationMenu();
      const helpMenu = m?.items.find((i) => i.role === 'help' || i.label.toLowerCase() === 'help');
      const item = helpMenu?.submenu?.items.find((i) => i.label === 'send a test notification');
      if (!item) return { found: false, menus: m?.items.map((i) => i.label) ?? [] };
      (item.click as () => void)();
      return { found: true, menus: m?.items.map((i) => i.label) ?? [] };
    });
    const tl = help.found ? await waitFor((l) => l.t === 'test', 5000) : undefined;
    row('a0 help', help.found && tl !== undefined, `Help › 'send a test notification' in the menu: ${String(help.found)} (menus ${JSON.stringify(help.menus)}); its test line: ${tl ? JSON.stringify((tl as { note?: unknown }).note ?? tl) : 'none in 5 s'}`);
  } finally {
    writeFileSync(path.join(OUT, 'notify-lines.json'), JSON.stringify(lines(), null, 1));
    appendFileSync(path.join(OUT, 'index.md'), ['', `## R45-R47 notifications on the real core (${new Date().toISOString()})`, '', '| row | result | what the app said |', '|---|---|---|', ...rows, ''].join('\n'));
    await s.close().catch(() => undefined);
    helper.dispose();
  }
  expect(rows.filter((r) => r.includes('**red**')), 'every R45-R47 row green (index.md)').toEqual([]);
});
