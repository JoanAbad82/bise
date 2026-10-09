// gate/images · R41 (docs/desktop-bar.md, regression list): "N'oublie pas que le harness doit être
// multi-modal et donc que le modèle doit voir ces images que je paste" (the user, 10-08, main m_13700).
// An image he pastes or drops in the desktop app must reach the model as an image content block,
// never as a path, a file name or a text tag alone. Owner of the check: qa-native (ambient-lead m_13705).
//
// How: the real core on amb-tools' rich world, every hub on tests/fake_provider.py with $FAKE_BODIES
// set (one JSON line per model request: {family, body}; world.py passes FAKE_BODIES to its hubs).
// Each path pastes or drops tests/checks/fixtures/checker.png (a real PNG, not a 1x1) with a nonce in
// his words, sends, then reads the request whose message holds that nonce: the image block in that
// same message (anthropic {type:image, source:{type:base64, media_type}}, openai-chat {type:image_url,
// image_url:{url:'data:image/…;base64,…'}}, responses input_image, gemini inlineData), the text parts
// next to it, and the agent the request was for (its system prompt).
// Paths: (1) the window composer, ⌘V in amb-mac's order (field, stage on the test clipboard, ⌘V, chip),
// to main and to an agent; (2) a file dropped on the composer, to a project's main and to an agent;
// (3) the spotlight: ⌘V in its field and a drop on the capsule, sent to bise; (4) a card answer with an
// image (⌘I's answer field), to the asking agent. (5) an escalated question (sb card --for) is answered
// through the same HubCmd::Answer as (4): (4) stands for it here. The terminal path is img-paste's.
// Every path is written in a table (index.md next to the shots, BISE_R41_OUT); the test fails on any
// path whose request has no image block, naming it.
// Run: FAKE_BODIES=<file> exported before `qa.py world up --rich`, then this spec through heavy-run.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { FakeHelper, dropFiles, expect, test, type Session } from '../../harness';
import { hubOf, launchReal, realWorld, worldSay } from '../world';
import { capsulePage, CAPSULE, Lines, sleep } from '../native/world';

const PNG = path.join(__dirname, '../fixtures/checker.png');
const BODIES = process.env['FAKE_BODIES'] ?? '';
const OUT = process.env['BISE_R41_OUT'] ?? path.join(os.homedir(), '.bise', 'gate', 'try-gate', 'R41');
const FIELD = '[data-testid="composer.field"]';
const CHIP = '[data-testid^="composer.chip."][data-kind="image"]';

// ------------------------------------------------------------------ the request bodies (pure)

type Part = Record<string, unknown>;
type Seen = { found: boolean; image: string; text: string; agent: string; family: string };

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const obj = (v: unknown): Record<string, unknown> => (v !== null && typeof v === 'object' ? (v as Record<string, unknown>) : {});

/** The messages of a request in any family the fake speaks. */
function messagesOf(body: Record<string, unknown>): Part[] {
  for (const k of ['messages', 'input', 'contents']) if (Array.isArray(body[k])) return body[k] as Part[];
  return [];
}

/** A message's parts (a string content is one text part). */
function partsOf(m: Part): Part[] {
  const c = m['content'] ?? m['parts'];
  if (typeof c === 'string') return [{ type: 'text', text: c }];
  return Array.isArray(c) ? (c as Part[]) : [];
}

/** What image a part is ('' none): 'image/png base64 (N chars)'. */
export function imageOf(p: Part): string {
  const t = str(p['type']);
  if (t === 'image') {
    const s = obj(p['source']);
    return s['type'] === 'base64' && str(s['data']).length > 0 ? `${str(s['media_type'])} base64 (${String(str(s['data']).length)} chars)` : '';
  }
  if (t === 'image_url' || t === 'input_image') {
    const u = t === 'image_url' ? str(obj(p['image_url'])['url']) : str(p['image_url']);
    const m = /^data:(image\/[a-z]+);base64,(.+)$/s.exec(u);
    return m !== null ? `${m[1] ?? ''} base64 (${String((m[2] ?? '').length)} chars)` : '';
  }
  const inline = obj(p['inlineData'] ?? p['inline_data']);
  if (str(inline['data']).length > 0) return `${str(inline['mimeType'] ?? inline['mime_type'])} base64 (${String(str(inline['data']).length)} chars)`;
  return '';
}

const textOf = (p: Part): string => str(p['text']);

/** The agent a request is for, from its system prompt (the hub's agent prompt names it). */
function agentOf(body: Record<string, unknown>, msgs: Part[]): string {
  const sys = [str(body['system']), ...(Array.isArray(body['system']) ? (body['system'] as Part[]).map(textOf) : []),
    ...msgs.filter((m) => m['role'] === 'system' || m['role'] === 'developer').flatMap((m) => partsOf(m).map(textOf))].join('\n');
  const task = /task `([^`]+)`/.exec(sys);
  if (task !== null) return task[1] ?? '';
  return /\bmain\b/.test(sys) ? 'main' : '?';
}

/** The last request whose message holds `nonce`: that message's image block and text parts. */
export function seenIn(lines: string[], nonce: string): Seen {
  let seen: Seen = { found: false, image: '', text: '', agent: '', family: '' };
  for (const line of lines) {
    if (!line.includes(nonce)) continue;
    let rec: { family?: string; body?: Record<string, unknown> };
    try { rec = JSON.parse(line) as typeof rec; } catch { continue; }
    const body = rec.body ?? {};
    const msgs = messagesOf(body);
    const m = [...msgs].reverse().find((x) => partsOf(x).some((p) => textOf(p).includes(nonce)));
    if (m === undefined) continue;
    const parts = partsOf(m);
    seen = {
      found: true,
      image: parts.map(imageOf).find((x) => x !== '') ?? '',
      // around his words: a message can start with the hub's own blocks (<task_status>…)
      text: ((t: string) => t.slice(Math.max(0, t.indexOf(nonce) - 200), t.indexOf(nonce) + nonce.length + 120))(
        parts.map(textOf).filter((t) => t !== '').join(' ¶ ').replace(/\s+/g, ' ')),
      agent: agentOf(body, msgs),
      family: rec.family ?? '',
    };
  }
  return seen;
}

const bodies = (): string[] => (BODIES !== '' && existsSync(BODIES) ? readFileSync(BODIES, 'utf8').split('\n').filter((l) => l !== '') : []);

async function waitSeen(nonce: string, ms = 45_000): Promise<Seen> {
  const t0 = Date.now();
  for (;;) {
    const s = seenIn(bodies(), nonce);
    if (s.found || Date.now() - t0 > ms) return s;
    await sleep(500);
  }
}

// ------------------------------------------------------------------ the app

async function go(s: Session, route: string): Promise<void> {
  await s.page.evaluate((r) => { (window as unknown as { bise: { openWindow: (r?: string) => void } }).bise.openWindow(r); }, route);
  await sleep(1200);
}

const stage = (s: Session): Promise<boolean> =>
  s.app.evaluate((_e, file) => (globalThis as unknown as { __biseTestClip?: (c: { file: string }) => Promise<boolean> }).__biseTestClip?.({ file }) ?? Promise.resolve(false), PNG);

async function chips(p: Page): Promise<number> {
  await p.locator(CHIP).first().waitFor({ timeout: 3000 }).catch(() => undefined);
  return p.locator(CHIP).count();
}

type Row = { path: string; to: string; how: string; seen: Seen; note: string };

test('gate/images R41: an image he pastes or drops reaches the model as an image block', async () => {
  test.setTimeout(15 * 60_000);
  expect(BODIES, 'FAKE_BODIES is set (the world was brought up with it)').not.toBe('');
  mkdirSync(OUT, { recursive: true });
  const w = realWorld();
  const helper = new FakeHelper();
  const s = await launchReal(w, { helper });
  const out = new Lines();
  s.app.process().stdout?.setEncoding('utf8');
  s.app.process().stdout?.on('data', (d: string) => { out.push(d); });
  const p = s.page;
  const rows: Row[] = [];
  let r36 = 'not reached';
  const run = Date.now() % 1_000_000;
  const nonce = (k: string): string => `r41-${k}-${String(run)}`;
  const shot = async (name: string, pg: Page = p): Promise<void> => { await pg.screenshot({ path: path.join(OUT, `${name}.png`) }).catch(() => undefined); };
  try {
    // a fresh keep shows setup first: skip it
    await p.locator(`${FIELD}, [data-testid="setup.skip"], [data-testid="setup.root"]`).first().waitFor({ timeout: 20_000 }).catch(() => undefined);
    const skip = p.getByTestId('setup.skip');
    if (await skip.isVisible().catch(() => false)) await skip.click();
    await sleep(1500);
    const ids: Record<string, string> = {};
    for (const id of await p.locator('[data-testid^="app.sidebar.project."]').evaluateAll((es) => es.map((e) => e.getAttribute('data-testid') ?? ''))) {
      const name = ((await p.getByTestId(id).innerText().catch(() => '')).trim().split(/\s/)[0]) ?? '';
      if (name !== '' && ids[name] === undefined) ids[name] = id.slice('app.sidebar.project.'.length).split('.')[0] ?? '';
    }
    const tel = ids['telemetry'] ?? 'telemetry';
    const shop = ids['shop'] ?? 'shop';

    // (1) and (2): the window's composer, a paste and a drop, to a main and to an agent
    const composer = async (key: string, route: string, to: string, how: 'paste' | 'drop'): Promise<void> => {
      await go(s, route);
      const field = p.locator(FIELD);
      await field.click();
      let note = '';
      if (how === 'paste') {
        note = `staged: ${String(await stage(s))}`;
        await p.keyboard.press('Meta+V');
      } else {
        await dropFiles(p, FIELD, [PNG]);
      }
      note += `${note === '' ? '' : ', '}image chips: ${String(await chips(p))}`;
      const n = nonce(key);
      await p.keyboard.type(`what is in this picture ${n}`);
      await shot(`R41-${key}`);
      await p.keyboard.press('Enter');
      const seen = await waitSeen(n);
      // R17: one row for that send, never a second greyed 'sending…' copy under the delivered one
      await sleep(2500);
      const list = await p.getByTestId('thread.list').innerText().catch(() => '');
      note += `; R17: rows with his words ${String(list.split(n).length - 1)}, 'sending…' in the thread: ${String(/sending…/.test(list))}`;
      rows.push({ path: how === 'paste' ? '(1) window composer ⌘V' : '(2) window composer drop', to, how, seen, note });
    };
    await composer('paste-main', 'bise', 'bise · main', 'paste');
    await composer('paste-agent', `agent/${tel}/dashboards`, 'telemetry · dashboards', 'paste');
    await composer('drop-main', `project/${shop}`, 'shop · main', 'drop');
    await composer('drop-agent', `agent/${tel}/dashboards`, 'telemetry · dashboards', 'drop');

    // (3) the spotlight: ⌘V in its field, then a drop on the capsule, sent to bise
    const cap = await capsulePage(s);
    const spot = async (): Promise<void> => {
      await helper.send({ ev: 'fn', act: 'key', key: 'space' });
      await out.wait(CAPSULE, (l) => l.startsWith('show'), 5000).catch(() => undefined);
      await sleep(500);
    };
    const hide = async (): Promise<void> => { await helper.send({ ev: 'fn', act: 'esc' }); await sleep(500); };
    for (const how of ['paste', 'drop'] as const) {
      await spot();
      const input = cap.getByTestId('spotlight.input');
      await input.click().catch(() => undefined);
      let note = '';
      if (how === 'paste') {
        note = `staged: ${String(await stage(s))}`;
        await cap.keyboard.press('Meta+V');
      } else {
        await dropFiles(cap, '[data-testid="capsule"]', [PNG]).catch((e: unknown) => { note = `drop: ${String(e).split('\n')[0] ?? ''}`; });
      }
      await sleep(600);
      const field = (await input.inputValue().catch(() => '')).trim();
      note += `${note === '' ? '' : ', '}spot field after: ${JSON.stringify(field.slice(0, 80))}, image chips in the capsule: ${String(await cap.locator('[data-kind="image"], img[src^="blob:"], img[src^="data:"]').count())}`;
      const n = nonce(`spot-${how}`);
      await input.click().catch(() => undefined);
      await cap.keyboard.type(` what is in this picture ${n}`);
      await shot(`R41-spot-${how}`, cap);
      await cap.keyboard.press('Enter');
      rows.push({ path: `(3) spotlight ${how === 'paste' ? '⌘V' : 'drop on the capsule'}`, to: 'bise · main', how, seen: await waitSeen(n), note });
      await hide();
    }

    // (4) a card answer with an image: ⌘I's answer field on the asking agent's question (shop · gift-ui)
    {
      await go(s, 'inbox');
      // the list row of gift-ui's own question (the first cut matched the whole list and answered card #1, main's)
      const row = p.getByText(/gift-ui asks/i).first();
      await row.click({ timeout: 5000 }).catch(() => undefined);
      await sleep(600);
      const ans = p.getByTestId('inbox.answer');
      let note = '';
      if (await ans.isVisible().catch(() => false)) {
        await ans.click();
        note = `staged: ${String(await stage(s))}`;
        await p.keyboard.press('Meta+V');
        await sleep(600);
        note += `, field after ⌘V: ${JSON.stringify((await ans.inputValue()).slice(0, 80))}, ⌘I image chips: ${String(await p.locator('[data-testid^="inbox.answer.image."]').count())} ${JSON.stringify((await p.getByTestId('inbox.answer.image.1').innerText().catch(() => '')).trim())}`;
        const n = nonce('card');
        await ans.click();
        await p.keyboard.type(` the balance on the cart page ${n}`);
        await shot('R41-card');
        await p.keyboard.press('Enter');
        rows.push({ path: '(4) card answer (⌘I)', to: 'shop · gift-ui (asked)', how: 'paste', seen: await waitSeen(n), note });
      } else {
        await shot('R41-card');
        rows.push({ path: '(4) card answer (⌘I)', to: 'shop · gift-ui (asked)', how: 'paste', seen: { found: false, image: '', text: '', agent: '', family: '' }, note: 'no answer field (inbox.answer) on the card' });
      }
    }

    // (4b) the thread's docked answer: shop's strip, its first card (main's), an image pasted in the composer + words
    {
      await go(s, `project/${shop}`);
      const r1 = p.getByTestId('strip.row.1');
      let note = '';
      if (await r1.isVisible().catch(() => false)) {
        note = `card: ${JSON.stringify((await r1.innerText()).replace(/\s+/g, ' ').trim().slice(0, 80))}`;
        await r1.click();
        await p.getByTestId('strip.dock').waitFor({ timeout: 3000 }).catch(() => undefined);
        await p.locator(FIELD).click();
        note += `, staged: ${String(await stage(s))}`;
        await p.keyboard.press('Meta+V');
        note += `, image chips: ${String(await chips(p))}`;
        const n = nonce('dock');
        await p.keyboard.type(`this one ${n}`);
        await shot('R41-dock');
        // 4ccfa1d2: a docked item only its options decide (main's merge card) is never answered by typed words:
        // they go as a plain message, the card stays open, and the docked label is one line
        const label = await p.evaluate(() => {
          const el = Array.from(document.querySelectorAll('*')).find((e) => e.children.length === 0 && /^answering /.test(e.textContent.trim()));
          const r = el?.getBoundingClientRect();
          return el ? `${el.textContent.trim().slice(0, 60)} (${String(Math.round(r?.height ?? 0))} px tall)` : 'none';
        });
        note += `, docked label: ${label}`;
        await p.keyboard.press('Enter');
        const seen = await waitSeen(n);
        await sleep(1500);
        note += `; after ⏎: an 'answered card' line in the request: ${String(/answered card/.test(seen.text))}, the merge card still in the strip: ${String((await p.locator('[data-testid^="strip.row."]').allInnerTexts()).some((t) => /merge checkout/.test(t)))}`;
        await shot('R41-dock-after');
        rows.push({ path: '(4b) docked choice card in the thread: words + image go as a plain message', to: 'shop · main', how: 'paste', seen, note });
      } else {
        await shot('R41-dock');
        rows.push({ path: '(4b) docked answer in the thread', to: 'shop · the card\'s asker', how: 'paste', seen: { found: false, image: '', text: '', agent: '', family: '' }, note: 'no strip row in shop\'s thread' });
      }
    }

    // (5) an agent's question escalated by main with `sb card --for`, answered with an image from ⌘I: the
    // ASKING agent's request must carry it. The chain runs on the world's fake scripts ($FAKE_SCRIPTS, read
    // live): shop's main asks gift-ui to ask; gift-ui sends main its question (sb send --expect-reply); main
    // escalates it with sb card --for <that message's id> (read from main's own transcript).
    {
      const sd = path.join(w.world, 'rich', 'scripts');
      const shopDir = path.dirname(hubOf(w, 'shop').sock);
      const k = nonce('esc');
      const put = (name: string, match: string, cmd: string, reply: string): void => {
        mkdirSync(sd, { recursive: true });
        const tmp = path.join(sd, `.${name}.tmp`);
        writeFileSync(tmp, JSON.stringify({ match, calls: [{ tool: 'bash', arg: cmd }], reply }));
        renameSync(tmp, path.join(sd, `${name}.json`));
      };
      const q = `${k}-q which of the two pictures shows the bug?`;
      put(`r41-esc-1-${String(run)}`, `${k}-start`, `sb send gift-ui "${k}-ask: please ask main which picture shows the bug"`, 'Asked gift-ui.');
      put(`r41-esc-2-${String(run)}`, `${k}-ask`, `sb send main --expect-reply "${q}"`, 'Asked main.');
      put(`r41-esc-3-${String(run)}`, `${k}-q`,
        `id=$(grep -o 'agent_message from="gift-ui"[^>]*' "${shopDir}/agents/main/transcript.log" | grep -o 'id="m_[0-9]*"' | tail -1 | cut -d'"' -f2); echo "for $id"; sb card --for "$id" "${k}-card gift-ui asks: which of the two pictures shows the bug?"`,
        'I put it in your inbox.');
      worldSay('shop', `${k}-start please get gift-ui's question to me`);
      await go(s, 'inbox');
      const row = p.getByText(new RegExp(`${k}-card|which of the two pictures`)).first();
      let note = '';
      const t0 = Date.now();
      while (!(await row.isVisible().catch(() => false)) && Date.now() - t0 < 90_000) await sleep(1000);
      if (await row.isVisible().catch(() => false)) {
        await row.click();
        await sleep(600);
        const ans = p.getByTestId('inbox.answer');
        await ans.click();
        note = `card shown after ${String(Math.round((Date.now() - t0) / 1000))} s, staged: ${String(await stage(s))}`;
        await p.keyboard.press('Meta+V');
        await sleep(600);
        note += `, ⌘I image chips: ${String(await p.locator('[data-testid^="inbox.answer.image."]').count())}`;
        const n = nonce('esc-answer');
        await ans.click();
        await p.keyboard.type(` the second one ${n}`);
        await shot('R41-escalated');
        await p.keyboard.press('Enter');
        rows.push({ path: '(5) escalated question (sb card --for), ⌘I', to: 'shop · gift-ui (asked through main)', how: 'paste', seen: await waitSeen(n, 60_000), note });
      } else {
        await shot('R41-escalated');
        rows.push({ path: '(5) escalated question (sb card --for), ⌘I', to: 'shop · gift-ui (asked through main)', how: 'paste', seen: { found: false, image: '', text: '', agent: '', family: '' }, note: `no card with '${k}-card' in ⌘I after 90 s (the script chain: shop main -> gift-ui -> main -> sb card --for)` });
      }
    }

    // R36: shop main's 'you answered gift-ui' rows: his words + one image chip, never the hub's '<image' marker or a path
    {
      await go(s, `project/${shop}`);
      await sleep(1500);
      const heads = p.locator('[data-testid^="thread.answered."][data-testid$=".head"]');
      const n = await heads.count();
      const out: string[] = [];
      for (let i = Math.max(0, n - 2); i < n; i++) {
        const h = heads.nth(i);
        const id = (await h.getAttribute('data-testid')) ?? '';
        const pos = id.split('.')[2] ?? '';
        const row = p.locator(`[data-testid="${id}"]`).locator('xpath=..');
        await h.scrollIntoViewIfNeeded().catch(() => undefined);
        const text = (await row.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
        const imgs = await p.locator(`[data-testid="thread.answered.${pos}"] img`).count();
        out.push(`#${pos} ${JSON.stringify(text.slice(0, 120))}: images ${String(imgs)}, '<image' ${String(text.includes('<image'))}, a path ${String(/\/Users\//.test(text))}`);
      }
      // every 'you answered' image chip in view (not only the last two rows), with the right panel shown and
      // hidden (⌥⌘0 toggles it; the panel's state at start depends on the keep): each chip's right edge inside the
      // thread's column, its label '[Image #n]' (never the store's sha file name)
      const measure = async (): Promise<string> => {
        const panel = await p.getByTestId('app.panel').isVisible().catch(() => false);
        const m = await p.evaluate(() => {
          const list = document.querySelector('[data-testid="thread.list"]')?.getBoundingClientRect();
          const els: HTMLElement[] = Array.from(document.querySelectorAll<HTMLElement>('[data-testid^="thread.answered."] .b-chip'));
          const chips = els.map((c) => c.getBoundingClientRect());
          return { chips: chips.length, out: list ? chips.filter((c) => c.right > list.right + 0.5).length : -1, labels: els.map((c) => c.innerText.trim()).slice(-4) };
        });
        return `panel shown ${String(panel)}: chips ${String(m.chips)}, past the column ${String(m.out)}, labels ${JSON.stringify(m.labels)}`;
      };
      const chipRow = p.locator('[data-testid^="thread.answered."] .b-chip').last();
      await chipRow.scrollIntoViewIfNeeded().catch(() => undefined);
      out.push(await measure());
      await shot('R36-answered');
      await p.keyboard.press('Alt+Meta+0');
      await sleep(800);
      out.push(await measure());
      await shot('R36-answered-panel');
      await p.keyboard.press('Alt+Meta+0');
      r36 = out.join(' · ') || 'no thread.answered row in shop main\'s thread';
    }
  } finally {
    const cell = (x: string): string => x.replace(/\|/g, '\\|');
    const lines = [
      '# R41 · an image reaches the model',
      '',
      `- run ${new Date().toISOString()}, world ${w.home}, bodies ${BODIES}`,
      '- image: the image block in the message that holds his words (type and media type), else no',
      `- R36 (shop main's 'you answered' rows, last two): ${r36}`,
      '',
      '| path | sent to | request for | image block | the message\'s text parts | notes |',
      '|---|---|---|---|---|---|',
      ...rows.map((r) => `| ${r.path} | ${r.to} | ${r.seen.found ? `${cell(r.seen.agent)} (${r.seen.family})` : 'no request with his words'} | ${r.seen.image === '' ? '**no**' : `yes: ${r.seen.image}`} | ${cell(r.seen.text)} | ${cell(r.note)} |`),
      '',
    ];
    writeFileSync(path.join(OUT, 'index.md'), lines.join('\n'));
    writeFileSync(path.join(OUT, 'rows.json'), JSON.stringify(rows, null, 1));
    await s.close().catch(() => undefined);
    helper.dispose();
  }
  const no = rows.filter((r) => r.seen.image === '').map((r) => `${r.path} → ${r.to}: ${r.seen.found ? `text only: ${r.seen.text.slice(0, 120)}` : 'no request with his words'}`);
  expect(no, 'every path carries an image block (see index.md)').toEqual([]);
});
