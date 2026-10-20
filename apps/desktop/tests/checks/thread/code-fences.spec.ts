// thread/code-fences · his ``` blocks (main m_31084, his feedback on code blocks in his messages).
// The REAL thread screen on the scripted core. Owner: code-fences (amb-win's bubble, amb-web's
// composer). Passes when, for one message of his with a ```ts block (one long line), a bare ```
// block and a ```md block, typed with real keys in bise main's composer then landed as his entry:
//   - wrap: in his bubble the long code line wraps inside the box (no sideways scroll, no row
//     past the bubble's edge);
//   - a bare fence's words are gray (--md-syn-bare), not the text's color, in the composer and in
//     the bubble;
//   - a ```md block is highlighted: its heading colored and bold, its **bold** bold;
//   - composer == bubble: each word of the three blocks has the same color, weight and style in
//     both (one rule, thread/Code.tsx codeLines).
// BISE_SHOTS=1 also takes the designer's shots (light + dark, composer and bubble on one screen)
// at 800 and 1400.
import type { Page } from '@playwright/test';
import { FakeCore, test, expect } from '../../harness';
import { onWorld } from '../native/world';

const HOME = 'bise-home-00000000';
const LONG = 'const answer = computeTheAnswerFromEveryInputWeHave(alpha, beta, gamma, delta, epsilon, zeta, eta, theta, iota) // why';
const LINES = ['voici', '```ts', LONG, '```', '```', 'plain words in a bare fence', '```', '```md', '# Plan', '- **bold** and `code`', '```'];
const TEXT = LINES.join('\n');
// a word of each kind, as one text node of its own in both surfaces
const WORDS = ['const', 'answer', 'computeTheAnswerFromEveryInputWeHave', '// why', 'plain words in a bare fence', 'Plan', 'bold', '`code`'];

const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const world = () => [
  prefs('light'),
  { ev: 'projects', projects: [{ project: HOME, name: 'bise', path: '/tmp', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true }] },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/tmp', name: 'bise' },
  { ev: 'agents', project: HOME, agents: [{ name: 'main', main: true, status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 }] },
  { ev: 'thread', project: HOME, agent: 'main', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'hi. what are we doing today?' }], before: null, more: false },
];

/** His message typed with real keys: ⇧⏎ between lines (a new line everywhere, never a send). */
async function typeIt(page: Page): Promise<void> {
  const field = page.getByTestId('composer.field');
  await field.click();
  for (const [i, line] of LINES.entries()) {
    if (i > 0) await page.keyboard.press('Shift+Enter');
    await page.keyboard.type(line);
  }
  await expect.poll(() => field.evaluate((f) => f.textContent.includes('# Plan')), 'his words are in the composer').toBe(true);
}

type Look = { color: string; weight: string; style: string } | null;

/** Each word's look under `root`: the text node that is the word (else the first that holds it). */
async function looks(page: Page, root: string): Promise<Record<string, Look>> {
  return page.locator(root).first().evaluate((el, words) => {
    const nodes: Text[] = [];
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) nodes.push(n as Text);
    const out: Record<string, { color: string; weight: string; style: string } | null> = {};
    for (const word of words) {
      const n = nodes.find((t) => t.textContent.trim() === word) ?? nodes.find((t) => t.textContent.includes(word));
      const p = n?.parentElement;
      if (!p) {
        out[word] = null;
        continue;
      }
      const cs = getComputedStyle(p);
      out[word] = { color: cs.color, weight: cs.fontWeight, style: cs.fontStyle };
    }
    return out;
  }, WORDS);
}

/** A css color the page resolves (a var), as getComputedStyle says it. */
async function resolved(page: Page, css: string): Promise<string> {
  return page.evaluate((c) => {
    const probe = document.createElement('i');
    probe.style.color = c;
    document.body.append(probe);
    const got = getComputedStyle(probe).color;
    probe.remove();
    return got;
  }, css);
}

async function run(size: string, shots: boolean): Promise<void> {
  await onWorld(
    async ({ s, core }) => {
      const { page } = s;
      // the launch's size is the display's; setContentSize isn't held to it (bims/office)
      const [w, h] = size.split('x').map(Number);
      await s.app.evaluate(({ BrowserWindow }, [cw, ch]) => {
        for (const b of BrowserWindow.getAllWindows()) if (b.webContents.getURL().includes('index.html')) b.setContentSize(cw ?? 800, ch ?? 900);
      }, [w, h]);
      await expect(page.getByTestId('composer.field'), "bise main's composer").toBeVisible({ timeout: 10_000 });
      await typeIt(page);
      const composer = await looks(page, '[data-testid="composer.field"]');

      // ⏎ on the prose line after the last fence sends; his entry lands as the hub keeps it
      await core.result('send', undefined, { msg_id: 2, reason: 'made' });
      await page.keyboard.press('Enter');
      await core.waitCmd((c) => c.cmd === 'send', 5000);
      await core.send({ ev: 'entry', project: HOME, agent: 'main', entry: { pos: 2, at_ms: Date.now(), kind: 'you', msg_id: 2, text: TEXT, parts: [{ kind: 'text', text: TEXT }] } } as never);
      const bubble = page.locator('[data-testid="thread.you.2"]');
      await expect(bubble, 'his bubble').toBeVisible({ timeout: 5000 });
      await expect(bubble.locator('pre'), 'three code boxes').toHaveCount(3);

      // wrap: the long line stays inside the box and the bubble
      const box = await bubble.locator('pre').first().evaluate((pre) => {
        const b = pre.closest('.th-bubble')?.getBoundingClientRect();
        const r = pre.getBoundingClientRect();
        const line = pre.querySelector('code > span');
        return { scroll: pre.scrollWidth - pre.clientWidth, rows: line ? line.getClientRects().length : 0, inside: b !== undefined && r.right <= b.right + 0.5 };
      });
      const bare = await resolved(page, 'var(--md-syn-bare)');
      const text = await resolved(page, 'var(--md-syn-plain)');
      const bubbleLooks = await looks(page, '[data-testid="thread.you.2"]');
      // the shots before the verdict: a red run (before the change) shows its look too
      if (shots) await shoot(page, core, bubble, size);

      expect(box.scroll, 'no sideways scroll in his code box').toBeLessThanOrEqual(0);
      expect(box.rows, 'the long line wraps over several rows').toBeGreaterThan(1);
      expect(box.inside, 'the box stays inside his bubble').toBe(true);

      // a bare fence: gray, in both
      expect(bare, 'the bare gray is its own color').not.toBe(text);
      expect(bubbleLooks['plain words in a bare fence']?.color, "a bare fence's words gray in his bubble").toBe(bare);
      expect(composer['plain words in a bare fence']?.color, "a bare fence's words gray in the composer").toBe(bare);

      // ```md: its heading colored and bold, its **bold** bold
      expect(bubbleLooks['Plan']?.color, "a md block's heading is colored").not.toBe(text);
      expect(Number(bubbleLooks['Plan']?.weight), "a md block's heading is bold").toBeGreaterThanOrEqual(600);
      expect(Number(bubbleLooks['bold']?.weight), "a md block's **bold** is bold").toBeGreaterThanOrEqual(600);

      // composer == bubble, word for word
      for (const w of WORDS) expect.soft(composer[w], `'${w}': the composer draws it as his bubble does`).toEqual(bubbleLooks[w]);
    },
    { core: new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]), route: `agent/${HOME}/main`, size },
  );
}

/** The same words in the composer again, under his bubble: both on one screen, light then dark. */
async function shoot(page: Page, core: FakeCore, bubble: ReturnType<Page['locator']>, size: string): Promise<void> {
  await typeIt(page);
  await bubble.evaluate((el) => {
    el.scrollIntoView({ block: 'start' });
  });
  await page.mouse.move(1, 300);
  const tag = size.split('x')[0] ?? size;
  await page.screenshot({ path: test.info().outputPath(`code-fences-${tag}-light.png`) });
  await core.send(prefs('dark') as never);
  await page.waitForTimeout(300);
  await page.screenshot({ path: test.info().outputPath(`code-fences-${tag}-dark.png`) });
  await core.send(prefs('light') as never);
  await page.waitForTimeout(300);
}

test("thread/code-fences: his ``` blocks wrap in his bubble, a bare fence is gray, md is highlighted, the composer draws them as the bubble", async () => {
  await run('800x900', process.env['BISE_SHOTS'] === '1');
});

test('thread/code-fences: the shots at 1400', async () => {
  test.skip(process.env['BISE_SHOTS'] !== '1', 'shots only (BISE_SHOTS=1)');
  await run('1400x900', true);
});
