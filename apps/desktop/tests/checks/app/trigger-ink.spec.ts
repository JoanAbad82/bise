// app/trigger-ink · no menu trigger crops its words (his shot: the composer's 'opus 5.5 high', the p and
// g cut at the bottom: « le texte du label des dropdown était légèrement croppé »). The ds trigger's
// words clip (overflow:hidden, for the ellipsis); their line must hold the font's whole height.
// On the real shell with the scripted core (FakeCore, fake data). Passes when, on the inbox (its
// 'all projects' / 'agent-…' menus) and in the composer (its mode and model chips, the model 'opus
// 5.5' at effort 'high'):
//   - every menu trigger on the screen (aria-haspopup=menu) has words, and their glyphs (each text's
//     baseline, from a 0x0 probe on it, ± canvas measureText's ink for those words in their font)
//     sit inside the box that clips them, and that box never scrolls (scrollHeight ≤ clientHeight);
//     (a Range's rects or scrollHeight alone pass on a cropped label: they follow the line box);
//   - the words are still centered with the caret (±1 px), the caret 8 px after them;
//   - squeezed to 72 px, the model chip's words end in an ellipsis (a block that clips, text-overflow
//     ellipsis, wider than shown), still one line high, the caret whole.
// Shots (for designer): the composer's chips and the squeezed one, light; the inbox's triggers.
// Owner: trigger-crop.
import type { Page } from '@playwright/test';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const prefs = { ev: 'prefs', prefs: { onboarded: true, theme: 'light', context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 } };
const AGENTS = ['agent-gjpqy', 'jpq-bug', 'perf'];
const ag = (name: string, model = '') => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 3_600_000, waits: 0, model, effort: 'high' });
const MODELS = [
  { id: 'anthropic/opus-5.5', label: 'opus 5.5', provider: 'Anthropic', short: '200k', context: 200000, vision: true, efforts: ['low', 'medium', 'high', 'max'], default_effort: 'high' },
  { id: 'openai/gpt-5', label: 'gpt 5', provider: 'OpenAI', short: '200k', context: 200000, vision: true, efforts: ['low', 'medium', 'high'], default_effort: 'high' },
];
const RECORDS = AGENTS.map((a, i) => ({
  card: i + 1, project: P, asker: a, kind: 'question', question: `does ${a} ship today?`, options: [], state: 'answered', said: 'yes',
  where: { kind: 'inbox' }, asked_ms: NOW - (i + 2) * 600_000, at_ms: NOW - (i + 1) * 600_000, line2: 'you: yes · in the inbox',
}));
const world = () => [
  prefs,
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'storefront', path: '/nowhere/storefront', git: true, home: false, order: 1, agents: AGENTS.length + 1, working: 0, waits: 0, running: true, cards: [] },
    ],
  },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/storefront', name: 'storefront' },
  { ev: 'approvals', project: P, mode: 'yolo', env: false, checker: 'off', checker_who: '', repo: '/nowhere/storefront', rules: [] },
  { ev: 'agents', project: HOME, agents: [ag('main')] },
  { ev: 'agents', project: P, agents: [ag('main'), ...AGENTS.map((a) => ag(a, 'anthropic/opus-5.5'))] },
  { ev: 'thread', project: HOME, agent: 'main', entries: [], before: null, more: false },
  { ev: 'thread', project: P, agent: 'perf', entries: [{ pos: 1, at_ms: NOW - 9 * 60_000, kind: 'agent', text: 'the bench is ready.' }], before: null, more: false },
  { ev: 'inbox_history', project: P, items: RECORDS, more: false, answered: RECORDS.length, withdrawn: 0 },
  { ev: 'inbox_history', project: HOME, items: [], more: false, answered: 0, withdrawn: 0 },
];

interface Ink { id: string; words: string; boxTop: number; boxBottom: number; inkTop: number; inkBottom: number; scrolls: boolean; dy: number; gap: number }

/** Every visible menu trigger: its words' line boxes against the box that clips them. */
async function inks(page: Page): Promise<Ink[]> {
  return page.locator('[aria-haspopup="menu"]').evaluateAll((els) =>
    els
      .filter((el) => (el as HTMLElement).offsetParent !== null)
      .map((el) => {
        const w = el.querySelector('.w') as HTMLElement | null;
        const v = el.querySelector('svg.v')?.getBoundingClientRect();
        const t = el.getBoundingClientRect();
        const box = w?.getBoundingClientRect();
        // each text's glyph bounds: its baseline (a 0x0 probe on it) ± the font's measured ink for
        // those very words (canvas measureText, the element's own font)
        let inkTop = Infinity;
        let inkBottom = -Infinity;
        if (w !== null) {
          const ctx = document.createElement('canvas').getContext('2d');
          const walk = document.createTreeWalker(w, NodeFilter.SHOW_TEXT);
          const texts: Text[] = [];
          for (let n = walk.nextNode(); n !== null; n = walk.nextNode()) if ((n.textContent ?? '').trim() !== '') texts.push(n as Text);
          for (const n of texts) {
            const host = n.parentElement;
            if (host === null || ctx === null) continue;
            const probe = document.createElement('span');
            probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
            host.insertBefore(probe, n);
            const baseline = probe.getBoundingClientRect().bottom;
            probe.remove();
            const cs = getComputedStyle(host);
            ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
            const m = ctx.measureText(n.textContent ?? '');
            inkTop = Math.min(inkTop, baseline - m.actualBoundingBoxAscent);
            inkBottom = Math.max(inkBottom, baseline + m.actualBoundingBoxDescent);
          }
        }
        return {
          id: el.getAttribute('data-testid') ?? '',
          words: w?.textContent ?? '',
          boxTop: box?.top ?? 0, boxBottom: box?.bottom ?? 0, inkTop, inkBottom,
          scrolls: w === null || w.scrollHeight > w.clientHeight,
          dy: box === undefined || v === undefined ? 99 : Math.abs(box.top + box.height / 2 - (t.top + t.height / 2)),
          gap: v === undefined || box === undefined ? -1 : Math.round(v.left - box.right),
        };
      }),
  );
}

async function noneCropped(page: Page, want: string[]): Promise<void> {
  const all = await inks(page);
  test.info().attachments.push({ name: `inks-${want.join('+')}`, contentType: 'application/json', body: Buffer.from(JSON.stringify(all, null, 1)) });
  for (const id of want) expect(all.map((i) => i.id), `${id} on the screen`).toContain(id);
  for (const i of all) {
    expect(i.words.trim(), `${i.id}: has words`).not.toBe('');
    // 1 px of room past the measured ink: the antialiased edge (at 13/1 the descenders' ink ended
    // 0.4 px past the box, his 'légèrement croppé')
    expect(i.inkTop, `${i.id} '${i.words}': its words' top inside its box`).toBeGreaterThanOrEqual(i.boxTop + 1);
    expect(i.inkBottom, `${i.id} '${i.words}': its descenders inside its box`).toBeLessThanOrEqual(i.boxBottom - 1);
    expect(i.scrolls, `${i.id}: its words never overflow their box`).toBe(false);
    expect(i.dy, `${i.id}: its words centered on the trigger`).toBeLessThanOrEqual(1);
    expect(i.gap, `${i.id}: the caret 8 px after the words`).toBe(8);
  }
}

test('app/trigger-ink: the inbox menus never crop a descender', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: 'inbox/all', size: '1400x820' });
  try {
    const { page } = s;
    await expect(page.getByTestId('inbox.screen')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId(`inbox.row.p:${P}/1`)).toBeVisible({ timeout: 5000 });
    await page.getByTestId('inbox.agents').click();
    await page.getByTestId('inbox.agents.agent-gjpqy').click();
    await expect(page.getByTestId('inbox.agents')).toHaveText('agent-gjpqy');
    await noneCropped(page, ['inbox.projects', 'inbox.agents']);
    await page.getByTestId('inbox.agents').screenshot({ path: test.info().outputPath('inbox-agents.png') });
    await page.getByTestId('inbox.projects').screenshot({ path: test.info().outputPath('inbox-projects.png') });
  } finally {
    await s.close();
  }
});

test("app/trigger-ink: the composer's chips never crop a descender, the squeezed one ends in an ellipsis", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf`, size: '1100x800' });
  try {
    const { page } = s;
    await expect(page.getByTestId('composer.box')).toBeVisible({ timeout: 10_000 });
    await core.send({ ev: 'models', project: P, items: MODELS } as never);
    const model = page.getByTestId('composer.model');
    await expect(model).toHaveText('opus 5.5 high');
    await noneCropped(page, ['composer.mode', 'composer.model']);
    const box = page.getByTestId('composer.box');
    await box.screenshot({ path: test.info().outputPath('composer-chips.png') });

    await test.step('squeezed, the words end in an ellipsis on one line, the caret whole', async () => {
      await model.evaluate((el) => { (el as HTMLElement).style.maxWidth = '72px'; });
      const e = await model.evaluate((el) => {
        const w = el.querySelector('.w') as HTMLElement;
        const cs = getComputedStyle(w);
        const v = el.querySelector('svg.v')?.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        return {
          display: cs.display, overflow: cs.overflowX, ellipsis: cs.textOverflow,
          clipped: w.scrollWidth > w.clientWidth, lines: Math.round(w.clientHeight / parseFloat(cs.lineHeight)),
          caretIn: v !== undefined && v.width === 8 && v.right <= r.right + 0.5,
        };
      });
      expect(e.display, 'the words a block (an ellipsis needs one)').toBe('block');
      expect(e.overflow).toBe('hidden');
      expect(e.ellipsis).toBe('ellipsis');
      expect(e.clipped, 'the words wider than shown').toBe(true);
      expect(e.lines, 'one line').toBe(1);
      expect(e.caretIn, 'the caret whole inside the chip').toBe(true);
      await noneCropped(page, ['composer.model']);
      await box.screenshot({ path: test.info().outputPath('composer-squeezed.png') });
      await model.evaluate((el) => { (el as HTMLElement).style.maxWidth = ''; });
    });
  } finally {
    await s.close();
  }
});
