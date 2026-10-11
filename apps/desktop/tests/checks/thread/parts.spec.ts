// thread/parts · msg-parts in the window (the user's regression: his quotes, images and pastes
// showed as raw tags since the protocol; architect m_17621, ambient-lead m_17908). On the REAL
// thread screen (FakeCore): his entries carry Entry.parts, and the window draws his message from
// them, never from Entry.text (the model's templated text): a quote (and a diff quote's place), his
// words with a paste's chip '▤ 1' in place, the paste's chip under them ('▤ 1 · 14 lines', a click
// shows it), his image's chip, his file's chip; a card answer's words and image from its parts. No
// '<selection', '<pasted' or '<image' anywhere on screen. An older entry with no parts still draws
// from its text. Light and dark at 1100, one frame each. Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const P = 'shop-ab9f3c3b';
const NOW = Date.now();
const MIN = 60_000;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const ag = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 30 * MIN, waits: 0, watching: [] });
const PASTE = Array.from({ length: 14 }, (_, i) => `2026-10-10 03:${String(i).padStart(2, '0')} cart total mismatch`).join('\n');
const world = () => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: 'bise-home-00000000', name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'shop', path: '/nowhere/shop', git: true, home: false, order: 1, agents: 1, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/shop', name: 'shop' },
  { ev: 'agents', project: P, agents: [ag('main')] },
  {
    ev: 'thread',
    project: P,
    agent: 'main',
    entries: [
      { pos: 1, at_ms: NOW - 20 * MIN, kind: 'agent', text: 'the cart totals drift at night: the batch size is the shared one.' },
      // his message as parts (the text is the model's template: never drawn)
      {
        pos: 2,
        at_ms: NOW - 18 * MIN,
        kind: 'you',
        text: `<selection from="main">\nthe batch size is the shared one.\n</selection>\nwhat does <pasted n="1" lines="14">\n${PASTE}\n</pasted> mean? <image name="[Image #2]" path="/nowhere/shot.png" mime="image/png" b64="">\n\n[files he attached:]\n/nowhere/notes.md`,
        parts: [
          { kind: 'quote', from: 'main', text: 'the batch size is the shared one.' },
          { kind: 'text', text: 'what does ' },
          { kind: 'paste', n: 1, text: PASTE },
          { kind: 'text', text: ' mean? ' },
          { kind: 'image', name: '[Image #2]', source: '/nowhere/shot.png', mime: 'image/png' },
          { kind: 'file', path: '/nowhere/notes.md' },
        ],
      },
      { pos: 3, at_ms: NOW - 16 * MIN, kind: 'agent', text: 'the paste shows the mismatch every 5 min.' },
      // a diff quote: its place names it
      {
        pos: 4,
        at_ms: NOW - 12 * MIN,
        kind: 'you',
        text: '<selection from="t1 vs main" file="src/cart.rs" new="12-13">\nlet batch = shared();\nlet n = batch.len();\n</selection>\nwhy shared here?',
        parts: [
          { kind: 'quote', from: 't1 vs main', text: 'let batch = shared();\nlet n = batch.len();', file: 'src/cart.rs', new: '12-13' },
          { kind: 'text', text: 'why shared here?' },
        ],
      },
      { pos: 5, at_ms: NOW - 10 * MIN, kind: 'agent', text: 'merge the fix into main? 1. merge 2. not yet' },
      // his card answer: its words and image from its parts
      {
        pos: 6,
        at_ms: NOW - 8 * MIN,
        kind: 'approval',
        text: 'you answered main: <image name="[Image #1]" path="/nowhere/after.png" mime="image/png" b64=""> this one',
        approval: { ok: true, text: 'you answered main: <image name="[Image #1]" path="/nowhere/after.png" mime="image/png" b64=""> this one' },
        parts: [
          { kind: 'image', name: '[Image #1]', source: '/nowhere/after.png', mime: 'image/png' },
          { kind: 'text', text: ' this one' },
        ],
      },
      { pos: 7, at_ms: NOW - 6 * MIN, kind: 'agent', text: 'merged.' },
      // an older entry, no parts: drawn from its text as before
      { pos: 8, at_ms: NOW - 2 * MIN, kind: 'you', text: 'thanks, ship it' },
    ],
    before: null,
    more: false,
  },
];

test('thread/parts: his message, his card answer from their typed parts, never a tag', async () => {
  test.setTimeout(90_000);
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${P}`, size: '1100x760' });
  try {
    const { page } = s;
    await expect(page.getByTestId('thread.you.8')).toBeVisible({ timeout: 10_000 });
    const screen = page.getByTestId('thread.screen');
    for (const t of ['light', 'dark'] as const) {
      await core.send(prefs(t) as never);
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(t);
      // the card answer and the old entry, at the bottom
      await expect(page.getByTestId('thread.approval.6.words')).toHaveText('this one');
      await expect(page.getByTestId('thread.approval.6.image.1')).toBeVisible();
      await expect(page.getByTestId('thread.you.8')).toContainText('thanks, ship it');
      // the diff quote: its place names it, his words after
      await page.getByTestId('thread.you.4').evaluate((el) => { el.scrollIntoView({ block: 'center' }); });
      await expect(page.getByTestId('thread.you.4.quote.1')).toContainText('src/cart.rs:12-13 · 2 lines');
      await expect(page.getByTestId('thread.you.4.quote.1')).toContainText('let batch = shared();');
      await expect(page.getByTestId('thread.you.4')).toContainText('why shared here?');
      // his first message: quote, words with the paste's chip in place, the chips under them
      await page.getByTestId('thread.you.2').evaluate((el) => { el.scrollIntoView({ block: 'center' }); });
      await expect(page.getByTestId('thread.you.2.quote.1')).toContainText('the batch size is the shared one.');
      await expect(page.getByTestId('thread.you.2')).toContainText('what does ▤ 1 mean?');
      await expect(page.getByTestId('thread.you.2.paste.1')).toHaveText('▤ 1 · 14 lines');
      await expect(page.getByTestId('thread.you.2.image.1')).toHaveText('image 1');
      await expect(page.getByTestId('thread.you.2.file')).toHaveText('notes.md');
      // designer m_17969: the parts in one row (paste, file, image), the artifact chip's look:
      // a 1 px line, r 9, 6 px apart, never the accent (pink is for what waits on him)
      const chips = await page.getByTestId('thread.you.2.parts').evaluate((row) =>
        Array.from(row.children).map((c) => {
          const s = getComputedStyle(c);
          const b = c.getBoundingClientRect();
          return { top: Math.round(b.top), left: b.left, right: b.right, border: s.borderTopWidth, radius: s.borderTopLeftRadius, bg: s.backgroundColor, color: s.color };
        }),
      );
      expect(chips.length).toBe(3);
      expect(new Set(chips.map((c) => c.top)).size, `${t}: one row`).toBe(1);
      for (const c of chips) {
        expect(c.border, `${t}: a 1 px line`).toBe('1px');
        expect(c.radius, `${t}: r 9`).toBe('9px');
      }
      for (let i = 1; i < chips.length; i++) expect(Math.round((chips[i]?.left ?? 0) - (chips[i - 1]?.right ?? 0)), `${t}: 6 px apart`).toBe(6);
      const accent = await page.evaluate(() => {
        const probe = document.createElement('span');
        probe.style.color = 'var(--c-accent)';
        document.body.appendChild(probe);
        const c = getComputedStyle(probe).color;
        probe.remove();
        return c;
      });
      const img = await page.getByTestId('thread.you.2.image.1').locator('.ink').evaluate((e) => getComputedStyle(e).color);
      expect(img, `${t}: the image's words never in the accent`).not.toBe(accent);
      // never a tag on screen
      expect(await screen.innerText(), `${t}: no tag drawn`).not.toMatch(/<selection|<pasted|<image|\[files he attached:\]/u);
      await page.mouse.move(1, 300);
      await page.waitForTimeout(200);
      await page.screenshot({ path: test.info().outputPath(`parts-${t}-1100.png`) });
    }
    // the paste's chip shows the paste
    await page.getByTestId('thread.you.2.paste.1').click();
    await expect(page.getByTestId('thread.you.2.paste.1.text')).toContainText('03:13 cart total mismatch');
  } finally {
    await s.close();
  }
});
