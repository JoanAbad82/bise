// thread/status-line · the waiting line over the composer (designer's desktop-status-line, his
// pick A, ambient-lead m_22740). The REAL agent view on the scripted core: perf waits for an event.
// Passes when, light and dark at 1400, 1100 and 800, for a long note (since 3 h: 'since 04:12'),
// a wait under an hour ('for 12 min') and two watches ('and 1 more'): the line starts with the state
// in words ('waiting since …' / 'waiting for …'), never a glyph; the state is whole; the note is
// whole or cut after a whole word with '…' (never mid-word), or gone under 3 words; the title
// lists every watch; the label row right of 'to perf' never says 'waiting', and its parts (model ·
// effort · mode) each show whole or not at all. Shots for designer: status-<case>-<w>-<theme>.png.
// Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const LONG = "nightly full gate (all tests, main's tip)";
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const ag = (name: string, over: Record<string, unknown> = {}) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 30 * MIN, waits: 0, watching: [], model: 'anthropic/claude-opus-5-5', effort: 'high', ...over });
const CASES = {
  long: [{ id: 9, kind: 'bg', what: LONG, noted: true, since_ms: NOW - 3 * 60 * MIN }],
  short: [{ id: 9, kind: 'bg', what: 'cargo bench', since_ms: NOW - 12 * MIN - 5000 }],
  two: [
    { id: 9, kind: 'bg', what: LONG, noted: true, since_ms: NOW - 3 * 60 * MIN },
    { id: 10, kind: 'file', what: 'build.rc', since_ms: NOW - 40_000 },
  ],
} as const;
const agents = (watching: readonly unknown[]) => ({ ev: 'agents', project: P, agents: [ag('main'), ag('perf', { purpose: 'product page speed', watching })] });
const world = () => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: 'bise-home-00000000', name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 1, agents: 2, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  {
    ev: 'models',
    project: P,
    items: [{ id: 'anthropic/claude-opus-5-5', label: 'opus 5.5', provider: 'Anthropic', short: '1M', context: 1000000, vision: true, efforts: ['low', 'medium', 'high'], default_effort: 'high', default_for: ['main', 'agents'] }],
  },
  { ev: 'approvals', project: P, mode: 'yolo', env: false, checker: '', checker_who: '', repo: '/nowhere/acme', rules: [] },
  agents(CASES.long),
  {
    ev: 'thread',
    project: P,
    agent: 'perf',
    entries: [{ pos: 1, at_ms: NOW - 3 * 60 * MIN, kind: 'agent', text: "the full gate is running. i'll read the results when it ends and tell you what failed." }],
    before: null,
    more: false,
  },
];

for (const w of [1400, 1100, 800]) {
  test(`thread/status-line: the state first, whole; the note cut on a word; the label row never says waiting (${String(w)})`, async () => {
    test.setTimeout(90_000);
    const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `agent/${P}/perf`, size: `${String(w)}x720` });
    try {
      const { page } = s;
      const line = page.getByTestId('thread.waiting');
      await expect(line).toBeVisible({ timeout: 10_000 });
      for (const theme of ['light', 'dark'] as const) {
        await core.send(prefs(theme) as never);
        await expect.poll(() => page.evaluate(() => document.documentElement.dataset['theme']), { timeout: 5000 }).toBe(theme);
        for (const [name, watching] of Object.entries(CASES)) {
          await core.send(agents(watching) as never);
          const want = name === 'short' ? /^waiting for 12 min/u : /^waiting since /u;
          await expect(line, `${name}: the state in words first, never a glyph`).toHaveText(want);
          await page.waitForTimeout(150);
          const m = await line.evaluate((el) => {
            const st = el.querySelector<HTMLElement>('.th-wait-state');
            const note = el.querySelector<HTMLElement>('.th-wait-note');
            const end = document.querySelector<HTMLElement>('[data-testid="composer"] .end');
            const parts = Array.from(end?.querySelectorAll<HTMLElement>('.th-end-parts > span') ?? []);
            const box = end?.getBoundingClientRect();
            return {
              state: st?.textContent ?? '',
              stateWhole: st !== null && st.scrollWidth <= st.clientWidth + 0.5,
              note: note?.textContent ?? '',
              lineFits: el.scrollWidth <= el.clientWidth + 1,
              title: el.getAttribute('title') ?? '',
              end: end?.textContent ?? '',
              // each part either inside the row's box whole or wrapped out of sight, never cut
              partsWhole: parts.every((p) => {
                const r = p.getBoundingClientRect();
                return box === undefined || r.top >= box.bottom - 0.5 || (r.left >= box.left - 0.5 && r.right <= box.right + 0.5);
              }),
            };
          });
          expect(m.stateWhole, `${name}: the state is whole`).toBe(true);
          expect(m.lineFits, `${name}: the line fits its width`).toBe(true);
          const full = name === 'short' ? 'cargo bench' : LONG;
          if (m.note !== full && m.note !== '') {
            expect(m.note.endsWith('…'), `${name}: a cut note ends with … (${m.note})`).toBe(true);
            const kept = m.note.slice(0, -1);
            expect(full.startsWith(kept) && full[kept.length] === ' ', `${name}: cut after a whole word (${m.note})`).toBe(true);
            expect(kept.split(' ').length, `${name}: 3 words at least`).toBeGreaterThanOrEqual(3);
          }
          if (name === 'two') {
            await expect(line).toContainText(' and 1 more');
            expect(m.title.split('\n'), 'the title lists both').toHaveLength(2);
          }
          expect(m.end, `${name}: the label row never says waiting`).not.toMatch(/waiting/u);
          expect(m.partsWhole, `${name}: model · effort · mode whole or gone`).toBe(true);
          await page.mouse.move(1, 300);
          await page.screenshot({ path: test.info().outputPath(`status-${name}-${String(w)}-${theme}.png`) });
        }
      }
    } finally {
      await s.close();
      core.dispose();
    }
  });
}
