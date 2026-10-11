// thread/streaming · ambient's text-appearing v2 (designer signed), lead m_12371, amb-core's partial
// draft (m_12357). Passes when a reply streamed as partials (R40: the new text at its offset)
// grows in place in perf's thread: no raw ** or backtick in any frame, a word / a code line / a
// table row only once whole, text already shown never moves inside the row, the working sign rides
// after the last word, and the final entry takes the live row's place as the same element (no
// unmount, no jump). With reduced motion, no word is ever mid-fade. On the scripted core
// (FakeCore). Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import type { Page } from '@playwright/test';

const HOME = 'bise-home-00000000';
const P = 'acme-1a2b3c4d';
const agent = (name: string) => ({ name, main: name === 'main', status: name === 'perf' ? 'working' : 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 });
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
      { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 2, working: 1, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: P, agents: [agent('main'), agent('perf')] },
];

// the answer, written by the model; the hub sends its whole text so far (cut anywhere)
const ANSWER = [
  'The cold bench takes **4.1 s** because the index is walked twice: once in `load_all` and once in the check.',
  '',
  '- drop the second walk',
  '- keep the cache warm',
  '',
  '```rust',
  'fn load_all(ix: &Index) -> Vec<Row> {',
  '    ix.rows().collect()',
  '}',
  '```',
  '',
  '| run | before | after |',
  '|---|---|---|',
  '| cold | 4.1 s | 1.9 s |',
  '| warm | 0.8 s | 0.7 s |',
  '',
  'That halves it.',
].join('\n');
// cut points: mid word, mid ** and mid backtick, mid code line, the table header before its separator, a half row
const cuts = (s: string): number[] => {
  const at = (needle: string, plus = 0) => s.indexOf(needle) + plus;
  return [at('cold', 2), at('**4.1', 4), at('`load', 4), at('once in the', 4), at('- keep', 4), at('fn load_all', 8), at('    ix.rows', 9), at('| run', 10), at('|---|---|---|', 13), at('| cold', 8), at('| warm', 20), at('That', 4), s.length];
};
// sent as the hub sends since R40 (main 35509c3b): only the new text at `off`, in UTF-16 units
// (a JS string's length); off 0 starts again, '' at 0 clears
const sent = new WeakMap<FakeCore, string>();
const say = (core: FakeCore, text: string) => {
  const prev = sent.get(core) ?? '';
  sent.set(core, text);
  const off = text !== '' && text.startsWith(prev) ? prev.length : 0;
  return core.send({ ev: 'partial', project: P, agent: 'perf', call: '48.1', off, text: text.slice(off) } as never);
};

async function liveText(page: Page): Promise<string> {
  return page
    .getByTestId('thread.stream')
    .innerText()
    .catch(() => '');
}

test('thread/streaming: a reply grows in place, whole words only, no raw marks, the entry takes the same row', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf` });
  try {
    const { page } = s;
    await core.waitCmd((c) => c.cmd === 'subscribe' && c.agent === 'perf', 10_000);
    // real times: the live row is drawn at this window's receive time (amb-web's at_ms), the entry
    // that replaces it a moment later, both on his day and in his group, as on the real core
    const t0 = Date.now();
    const you = { pos: 40, at_ms: t0 - 5000, kind: 'you', text: 'why is the cold bench slow?' };
    await core.send({ ev: 'thread', project: P, agent: 'perf', entries: [you], before: null, more: false } as never);
    await expect(page.getByTestId('thread.entry.40')).toBeVisible({ timeout: 10_000 });

    const frames: { text: string; firstTop: number | null; firstH: number | null }[] = [];
    for (const n of cuts(ANSWER)) {
      await say(core, ANSWER.slice(0, n));
      await page.waitForTimeout(320);
      const live = page.getByTestId('thread.stream');
      await expect(live, 'the live row shows').toBeVisible();
      const geo = await live.evaluate((row) => {
        const p = row.querySelector('.th-md p');
        const r = row.getBoundingClientRect();
        const b = p?.getBoundingClientRect();
        return { firstTop: b === undefined ? null : b.top - r.top, firstH: b === undefined ? null : b.height };
      });
      frames.push({ text: await liveText(page), ...geo });
    }
    // ambient's sheet: stills mid-stream and at the end, dark and light
    const shoot = async (name: string) => {
      for (const scheme of ['dark', 'light'] as const) {
        await page.emulateMedia({ colorScheme: scheme });
        await page.screenshot({ path: test.info().outputPath(`${name}-${scheme}.png`) });
      }
    };
    console.log('FRONT', await page.evaluate(() => document.hasFocus()));
    await say(core, ANSWER.slice(0, ANSWER.indexOf('| warm')));
    await page.waitForTimeout(320);
    await shoot('mid-stream');
    // the table is the last block: the ∿ sits under it with no line of its own (ambient m_12439)
    expect(await page.getByTestId('thread.stream.wave').evaluate((w) => getComputedStyle(w).position), 'the sign under a table takes no height').toBe('absolute');
    await say(core, ANSWER);
    await page.waitForTimeout(320);
    for (const f of frames) {
      expect(f.text, `no raw ** in a frame: ${f.text}`).not.toContain('**');
      expect(f.text, `no raw backtick in a frame: ${f.text}`).not.toContain('`');
      // a table row only whole: no line with a lone '|' fragment
      expect(f.text, 'no table text before its separator').not.toMatch(/\| run \|(?![\s\S]*before)/);
    }
    // a word only once whole: the first frame (cut in 'cold') shows 'The ' only
    expect(frames[0]?.text.trim()).toMatch(/^bise|^perf|The$/m);
    // the first paragraph never moves inside the row once it is whole (frames after its end)
    const whole = frames.slice(4).map((f) => [f.firstTop, f.firstH]);
    for (const g of whole) expect(g, 'the first paragraph stays put').toEqual(whole[0]);
    // the working sign rides after the last word while it comes
    await expect(page.getByTestId('thread.stream.wave')).toHaveCount(1);

    // mark the row's element, then the entry lands and the clear comes: the same element, no jump
    await page.getByTestId('thread.stream').evaluate((el) => {
      (el as HTMLElement & { __mark?: number }).__mark = 1;
    });
    const before = await page.getByTestId('thread.stream').boundingBox();
    const entry = { pos: 41, at_ms: Date.now(), kind: 'agent', text: ANSWER };
    await core.send({ ev: 'thread', project: P, agent: 'perf', entries: [you, entry], before: null, more: false } as never);
    await say(core, '');
    const row = page.getByTestId('thread.entry.41');
    await expect(row, 'the entry is drawn').toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('thread.stream')).toHaveCount(0);
    expect(await row.evaluate((el) => (el as HTMLElement & { __mark?: number }).__mark), 'the entry took the live row (same element, no unmount)').toBe(1);
    await page.waitForTimeout(400);
    const after = await row.boundingBox();
    expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0)), 'no jump at the swap').toBeLessThan(1);
    await expect(page.getByTestId('thread.stream.wave')).toHaveCount(0);
    await shoot('final');
  } finally {
    await s.close();
    core.dispose();
  }
});

test("thread/streaming: a reply cut off mid-stream stays as he read it at 0.7, the TUI's dim '▲ turn interrupted by main' under it", async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf` });
  try {
    const { page } = s;
    await page.emulateMedia({ colorScheme: 'light' });
    await core.waitCmd((c) => c.cmd === 'subscribe' && c.agent === 'perf', 10_000);
    const t0 = Date.now();
    const said = ANSWER.slice(0, ANSWER.indexOf('```rust'));
    const entries = [
      { pos: 40, at_ms: t0 - 5000, kind: 'you', text: 'why is the cold bench slow?' },
      // R40 Hub::Kept: the words he read, then the turn's end (proto words.rs)
      { pos: 41, at_ms: t0 - 2000, kind: 'agent', text: said.trim(), cut: true },
      { pos: 42, at_ms: t0 - 2000, kind: 'notice', text: 'turn interrupted by main', notice: { level: 'warn', text: 'turn interrupted by main' } },
    ];
    await core.send({ ev: 'thread', project: P, agent: 'perf', entries, before: null, more: false } as never);
    const cut = page.getByTestId('thread.cut.41');
    await expect(cut).toBeVisible({ timeout: 10_000 });
    await expect(cut).toContainText('keep the cache warm');
    expect(await cut.evaluate((el) => getComputedStyle(el).opacity), 'the cut reply is dim, still readable').toBe('0.7');
    const line = page.getByTestId('thread.notice.42');
    await expect(line).toHaveText('▲turn interrupted by main');
    await expect(line).toHaveClass(/interrupted/);
    const lineTone = await line.evaluate((el) => getComputedStyle(el).color);
    const markTone = await line.locator('.th-notice-mark').evaluate((el) => getComputedStyle(el).color);
    expect(markTone, "the ▲ is the line's dim tone, not the error one").toBe(lineTone);
    const [cutBox, lineBox] = await Promise.all([cut.locator('li').last().boundingBox(), line.boundingBox()]);
    expect((lineBox?.y ?? 0) - ((cutBox?.y ?? 0) + (cutBox?.height ?? 0)), "the line has the wake line's 8 px above it, never touching the last list item").toBeGreaterThanOrEqual(8);
    await page.waitForTimeout(500);
    await page.screenshot({ path: test.info().outputPath('cut-light.png') });
  } finally {
    await s.close();
    core.dispose();
  }
});

test('thread/streaming: with reduced motion the text still comes, never mid-fade', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf` });
  try {
    const { page } = s;
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await core.waitCmd((c) => c.cmd === 'subscribe' && c.agent === 'perf', 10_000);
    await core.send({ ev: 'thread', project: P, agent: 'perf', entries: [{ pos: 40, at_ms: Date.now() - 5000, kind: 'you', text: 'why?' }], before: null, more: false } as never);
    await expect(page.getByTestId('thread.entry.40')).toBeVisible({ timeout: 10_000 });
    for (const n of cuts(ANSWER).slice(0, 6)) {
      await say(core, ANSWER.slice(0, n));
      await page.waitForTimeout(60);
      const mid = await page
        .getByTestId('thread.list')
        .locator('.th-answer .th-w, .th-answer .th-in, .th-answer .th-ln-in')
        .evaluateAll((els) => els.filter((e) => getComputedStyle(e).animationName !== 'none').length);
      expect(mid, 'no word or block animates under reduced motion').toBe(0);
    }
    await expect(page.getByTestId('thread.stream')).toContainText('drop the second walk');
  } finally {
    await s.close();
    core.dispose();
  }
});
