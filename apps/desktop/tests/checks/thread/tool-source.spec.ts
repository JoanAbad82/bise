// thread/tool-source (his ask, main m_22134; tui-parity m_22152): an opened run_typescript or bash
// call shows the source it ran as the TUI's box does (code.rs tool_source): run_typescript's 'code'
// field, bash's command, decoded (real lines, real quotes, no '\n'), in their colours; never the
// args' JSON, never the description again (it is the row's words); the output under a rule.
// Shots: tool-source-<theme>-<w>.png at 1100 and 800. Owner: amb-win.
import { FakeCore, launchDesktop, test, expect } from '../../harness';
import { thread } from '../../../src/proto/words.gen';

const P = 'acme-1a2b3c4d';
const NOW = Date.now();
const MIN = 60_000;
const prefs = (theme: string) => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
const ag = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 5 * MIN, waits: 0, watching: [] });
const TS = [
  'async function main() {',
  "  const qs = ['\"nombre maximal de tentatives\" Boursorama', 'BoursoBank crédit immobilier'];",
  '  const res = await Promise.allSettled(qs.map((q) => tools.web_search.web_search({ query: q, limit: 8 })));',
  "  return res.map((r, i) => ({ q: qs[i], ok: r.status === 'fulfilled' }));",
  '}',
].join('\n');
const SH = ['# the tests, then the lint', 'cargo test -p perf --quiet && echo "ok: $PWD"'].join('\n');
const world = (theme: string) => [
  prefs(theme),
  { ev: 'projects', projects: [{ project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 0, agents: 2, working: 0, waits: 0, running: true }] },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: P, agents: [ag('main'), ag('perf')] },
  {
    ev: 'thread',
    project: P,
    agent: 'perf',
    entries: [
      { pos: 1, at_ms: NOW - 4 * MIN, kind: 'you', text: 'why does the credit simulator say I hit the limit?' },
      {
        pos: 2,
        at_ms: NOW - 3 * MIN,
        kind: 'tools',
        text: thread.did_run({ n: 2 }),
        tools: {
          count: 2,
          summary: thread.did_run({ n: 2 }),
          items: [
            { pos: 3, id: 1, at_ms: NOW - 3 * MIN, name: 'run_typescript', intent: "recherche du message d'erreur BoursoBank", text: "recherche du message d'erreur BoursoBank", kind: 'run', state: 'ok', ms: 7600, code: JSON.stringify({ code: TS, description: "recherche du message d'erreur BoursoBank" }), out: '[{"q":"\\"nombre maximal de tentatives\\" Boursorama","ok":true},{"q":"BoursoBank crédit immobilier","ok":true}]' },
            { pos: 4, id: 2, at_ms: NOW - 3 * MIN + 9000, name: 'bash', intent: 'the tests, then the lint', text: 'the tests, then the lint', kind: 'run', state: 'ok', ms: 2300, code: JSON.stringify({ arg: SH, description: 'the tests, then the lint' }), out: 'test result: ok. 12 passed\nok: /nowhere/acme' },
          ],
        },
      },
      { pos: 5, at_ms: NOW - 2 * MIN, kind: 'agent', text: 'it is an anti-abuse limit on the simulator.' },
    ],
    before: null,
    more: false,
  },
];

for (const theme of ['light', 'dark']) {
  test(`thread/tool-source: an opened run_typescript and bash call show their source decoded and coloured, never the args' JSON (${theme})`, async () => {
    const core = new FakeCore(world(theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `agent/${P}/perf`, size: '1100x820' });
    try {
      const { page } = s;
      const line = (pos: number) => page.getByTestId(`thread.tool.${String(pos)}`);
      await expect(line(3)).toBeVisible({ timeout: 10_000 });
      await expect(line(3), 'the description is the row').toContainText("recherche du message d'erreur BoursoBank");
      // the TUI's signs: 'ƒ' a TypeScript run, '$' a command; the description in words (sans), the sign and time mono (designer m_22284)
      await expect(line(3).locator('.th-tool-mark')).toHaveText('ƒ');
      await expect(line(4).locator('.th-tool-mark')).toHaveText('$');
      const fonts = await line(3).evaluate((e) => ({ text: getComputedStyle(e.querySelector('.th-tool-text') as Element).fontFamily, mark: getComputedStyle(e.querySelector('.th-tool-mark') as Element).fontFamily }));
      expect(fonts.text, 'the description: sans').not.toMatch(/mono/iu);
      expect(fonts.mark, 'the sign: mono').toMatch(/mono/iu);
      await page.mouse.move(1, 300);
      await page.getByTestId('thread.tools.2').or(line(3)).first().screenshot({ path: test.info().outputPath(`tool-rows-${theme}-1100.png`) }).catch(() => undefined);
      await line(3).click();
      await line(4).click();
      for (const [pos, lang, first, last] of [
        [3, 'typescript', 'async function main() {', '}'],
        [4, 'bash', '# the tests, then the lint', 'cargo test -p perf --quiet && echo "ok: $PWD"'],
      ] as const) {
        const code = page.getByTestId(`thread.tool.${String(pos)}.code`);
        await expect(code).toBeVisible();
        await expect(code).toHaveAttribute('data-lang', lang);
        const text = await code.innerText();
        const rows = text.replace(/\n$/u, '').split('\n');
        expect(rows[0], `${lang}: its first line`).toBe(first);
        expect(rows.at(-1), `${lang}: its last line`).toBe(last);
        expect(text, `${lang}: no args JSON`).not.toMatch(/^\{"|"code":|"arg":|"description":/u);
        expect(text, `${lang}: no escaped newline`).not.toContain('\\n');
        expect(text, `${lang}: the description only on the row`).not.toContain(pos === 3 ? 'recherche du message' : 'description');
        // its colours: tokens with their own colour (prism, the TUI's syntax roles)
        const coloured = await code.locator('span[style*="color"]').count();
        expect(coloured, `${lang}: coloured tokens`).toBeGreaterThan(3);
      }
      await expect(page.getByTestId('thread.tool.3.code'), 'real quotes, not \\"').toContainText("['\"nombre maximal de tentatives\" Boursorama'");
      await expect(page.getByTestId('thread.tool.4.out')).toContainText('test result: ok. 12 passed');
      for (const w of [1100, 800]) {
        await page.setViewportSize({ width: w, height: 820 });
        await page.mouse.move(1, 300);
        await page.waitForTimeout(150);
        await page.screenshot({ path: test.info().outputPath(`tool-source-${theme}-${String(w)}.png`) });
      }
    } finally {
      await s.close();
      core.dispose();
    }
  });
}
