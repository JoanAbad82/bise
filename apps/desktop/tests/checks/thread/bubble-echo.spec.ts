// thread/bubble-echo · bubble-parts (his m_29158: « le user message en mode "sending" n'a pas le meme
// formatting que le user message "sent" … les chips inline ne sont pas rendues comme dans l'input
// composer »). The REAL thread screen on the scripted core. Passes when, for a message with a quote
// (a drag across main's answer), an image (⌘V), a file (a Finder drop) and a long paste (⌘V):
//   - the chips in his sending bubble's words are the composer's: same kinds, same numbers, same
//     classes, same size as they were in the field;
//   - when the hub's 'you' entry lands with his parts, the sending row goes and the landed bubble
//     has the same rect (±0.5 px) and the same inner DOM (its test ids aside): no visual jump;
//   - the mouse on a chip in his words lights its part chip under them.
// Shots (light and dark, 800 and wide) in its output folder, for designer: before and after the echo.
// Owner: bubble-parts (amb-win's bubble, amb-web's chips).
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { dropFiles } from '../../harness/inputs';

const HOME = 'bise-home-00000000';
const ROOT = mkdtempSync(path.join(tmpdir(), 'bubble-echo-'));
const PNG = path.join(ROOT, 'shot.png');
copyFileSync(path.join(__dirname, '../fixtures/checker.png'), PNG);
const DOC = path.join(ROOT, 'notes.md');
writeFileSync(DOC, '# notes\n');
test.afterAll(() => {
  rmSync(ROOT, { recursive: true, force: true });
});
const ANSWER = 'the p99 climbs when the 14:00 compaction runs.';
const LONG = Array.from({ length: 30 }, (_, i) => `log line ${String(i + 1)}: compaction took ${String(200 + i)} ms`).join('\n');

const world = (theme: string) => [
  {
    ev: 'prefs',
    prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
  },
  { ev: 'projects', projects: [{ project: HOME, name: 'bise', path: ROOT, git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true }] },
  { ev: 'welcome', project: HOME, proto: 1, workspace: ROOT, name: 'bise' },
  { ev: 'agents', project: HOME, agents: [{ name: 'main', main: true, status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 }] },
  {
    ev: 'thread',
    project: HOME,
    agent: 'main',
    entries: [
      { pos: 1, at_ms: Date.now() - 60_000, kind: 'you', text: 'why does ingest p99 climb at 14:00?' },
      { pos: 2, at_ms: Date.now() - 30_000, kind: 'agent', text: ANSWER },
    ],
    before: null,
    more: false,
  },
];

/** The bubble's inner DOM, its row's own test ids made the same. */
const inner = (page: Page, sel: string, id: string): Promise<string> =>
  page.locator(`${sel} .th-bubble`).first().evaluate((el, id) => el.innerHTML.replaceAll(id, 'ID'), id);

async function clip(s: { app: { evaluate: (f: (e: unknown, a: unknown) => unknown, a: unknown) => Promise<unknown> } }, o: unknown): Promise<void> {
  const ok = await s.app.evaluate((_e, a) => (globalThis as unknown as { __biseTestClip?: (o: unknown) => Promise<boolean> }).__biseTestClip?.(a) ?? false, o);
  expect(ok, 'the clipboard is staged').toBe(true);
}

for (const theme of ['light', 'dark'] as const) {
  for (const width of [800, 1400]) {
    test(`thread/bubble-echo: sending and sent draw the same, chips as in the composer · ${theme} ${String(width)}`, async () => {
      test.setTimeout(60_000);
      const core = new FakeCore(world(theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
      const s = await launchDesktop({ core, route: `agent/${HOME}/main`, size: `${String(width)}x900` });
      try {
        const { page } = s;
        const answer = page.getByTestId('thread.entry.2').locator('.th-md').first();
        await expect(answer, "main's answer").toBeVisible({ timeout: 10_000 });
        // a quote: a drag across main's answer, then his words
        const b = await answer.boundingBox();
        if (!b) throw new Error('no answer box');
        await page.mouse.move(b.x + 1, b.y + 6);
        await page.mouse.down();
        await page.mouse.move(b.x + b.width - 4, b.y + b.height - 4, { steps: 8 });
        await page.mouse.up();
        await page.keyboard.type('about ');
        const field = page.getByTestId('composer.field');
        await expect(field.locator('[data-kind="quote"]'), 'a quote chip').toHaveCount(1, { timeout: 5000 });
        await page.keyboard.type(', see ');
        await clip(s, { file: PNG });
        await page.keyboard.press('Meta+V');
        await expect(field.locator('[data-kind="image"]'), 'an image chip').toHaveCount(1, { timeout: 5000 });
        await page.keyboard.type(' and ');
        await dropFiles(page, '[data-testid="composer.field"]', [DOC]);
        await expect(field.locator('[data-kind="file"]'), 'a file chip').toHaveCount(1, { timeout: 5000 });
        await page.keyboard.type(' with this log ');
        await clip(s, { text: LONG });
        await page.keyboard.press('Meta+V');
        await expect(field.locator('[data-kind="paste"]'), 'a paste chip').toHaveCount(1, { timeout: 5000 });
        // the chips as the composer draws them: kind, number, size
        const inField = await field.locator('.b-chip[data-n]').evaluateAll((els) =>
          els.map((e) => ({ kind: e.getAttribute('data-kind'), n: e.getAttribute('data-n'), w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height), cls: (e.getAttribute('class') ?? '').replace(/\blit\b/u, '').trim() })),
        );
        expect(inField.map((c) => c.kind), 'the four chips in his order').toEqual(['quote', 'image', 'file', 'paste']);

        await page.keyboard.press('Enter');
        const sent = (await core.waitCmd((c) => c.cmd === 'send', 5000)) as { parts?: unknown[]; cid?: number };
        const parts = sent.parts ?? [];
        const pending = page.locator('[data-testid^="thread.pending."]');
        await expect(pending, 'his sending row').toHaveCount(1, { timeout: 2000 });
        const pid = (await pending.getAttribute('data-testid')) ?? '';
        const sel = `[data-testid="${pid}"]`;
        // the image's thumbnail loaded, so the shot and the rect are its final ones
        await page.waitForTimeout(400);
        const inBubble = await page.locator(`${sel} .th-bubble .b-chip.b-inchip`).evaluateAll((els) =>
          els.map((e) => ({ kind: e.getAttribute('data-kind'), n: e.getAttribute('data-n'), w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height), cls: (e.getAttribute('class') ?? '').replace(/\blit\b/u, '').trim() })),
        );
        expect(inBubble, 'the chips in his words are the composer chips: kind, number, class, size').toEqual(inField);
        const before = await page.locator(`${sel} .th-bubble`).boundingBox();
        // the body's ids say 'sending' (thread.pending.<cid> is the row alone, as the checks count it)
        const html = await inner(page, sel, pid.replace('thread.pending.', 'thread.sending.'));
        await page.locator(`${sel} .th-you`).screenshot({ path: test.info().outputPath(`sending-${theme}-${String(width)}.png`) });

        // the hub's echo: his parts, the model's text it rendered
        await core.send({ ev: 'entry', project: HOME, agent: 'main', entry: { pos: 3, at_ms: Date.now(), kind: 'you', text: 'rendered for the model', parts, delivery: 'received' } } as never);
        await expect(pending, 'the sending row leaves at its echo').toHaveCount(0, { timeout: 3000 });
        const landed = '[data-testid="thread.entry.3"]';
        await expect(page.locator(`${landed} .th-bubble`)).toBeVisible();
        await page.waitForTimeout(400);
        const after = await page.locator(`${landed} .th-bubble`).boundingBox();
        if (before === null || after === null) throw new Error('no bubble box');
        for (const k of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(after[k] - before[k]), `the bubble's ${k}: ${String(before[k])} → ${String(after[k])}`).toBeLessThanOrEqual(0.5);
        expect(await inner(page, landed, 'thread.you.3'), 'the same DOM inside the bubble').toBe(html);
        await page.locator(`${landed} .th-you`).screenshot({ path: test.info().outputPath(`sent-${theme}-${String(width)}.png`) });

        // the mouse on the paste chip in his words lights its part chip
        await page.locator(`${landed} .th-bubble .b-inchip[data-kind="paste"]`).hover();
        await expect(page.locator(`${landed} [data-testid="thread.you.3.paste.${String(inField[3]?.n)}"]`)).toHaveClass(/is-hover/u);
        await page.locator(`${landed} .th-you`).screenshot({ path: test.info().outputPath(`hover-${theme}-${String(width)}.png`) });
      } finally {
        await s.close();
        core.dispose();
      }
    });
  }
}
