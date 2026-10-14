// thread/agent-parts · an agent's attachments (send-parts, architect m_23962, designer m_24147).
// `sb send --attach` puts images and files in an agent's message: on the REAL thread screen
// (FakeCore) the note's words, then the ink chips of his bubble ('image 1' with its thumbnail, the
// file's name) 4 px under them (--s-1), never the accent, never the marker. A message main sent a
// task and one a task sent main. Shots at 1100, light and dark. Owner: send-parts.
import { copyFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const P = 'shop-ab9f3c3b';
const DIR = mkdtempSync(path.join(os.tmpdir(), 'agent-parts-'));
const PNG = path.join(DIR, 'bench.png');
copyFileSync(path.join(__dirname, '../fixtures/checker.png'), PNG);
const LOG = path.join(DIR, 'cold-start.log');
writeFileSync(LOG, 'cold start: 4.1 s\n');
const NOW = Date.now();
const MIN = 60_000;
const ag = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: NOW - 30 * MIN, waits: 0, watching: [] });
const world = (theme: 'light' | 'dark') => [
  { ev: 'prefs', prefs: { onboarded: true, theme } },
  {
    ev: 'projects',
    projects: [
      { project: 'bise-home-00000000', name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'shop', path: '/nowhere/shop', git: true, home: false, order: 1, agents: 2, working: 0, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/shop', name: 'shop' },
  { ev: 'agents', project: P, agents: [ag('main'), ag('perf')] },
  {
    ev: 'thread',
    project: P,
    agent: 'main',
    entries: [
      { pos: 1, at_ms: NOW - 12 * MIN, kind: 'you', text: 'why is the cold start so slow? here is the bench', parts: [{ kind: 'text', text: 'why is the cold start so slow? here is the bench' }] },
      // main forwards his image to the task
      {
        pos: 2,
        at_ms: NOW - 11 * MIN,
        kind: 'to_agent',
        to: 'perf',
        text: 'find why the cold start takes 4 s: his bench is attached',
        parts: [
          { kind: 'text', text: 'find why the cold start takes 4 s: his bench is attached' },
          { kind: 'image', name: '[Image #1]', source: PNG, mime: 'image/png' },
        ],
      },
      // the task answers with an image and a file
      {
        pos: 3,
        at_ms: NOW - 4 * MIN,
        kind: 'from_agent',
        from: 'perf',
        to: 'main',
        text: 'the cold start reads the whole cache first: the flame graph and the trace are attached',
        parts: [
          { kind: 'text', text: 'the cold start reads the whole cache first: the flame graph and the trace are attached' },
          { kind: 'image', name: '[Image #1]', source: PNG, mime: 'image/png' },
          { kind: 'file', name: 'cold-start.log', path: LOG },
        ],
      },
    ],
    before: null,
    more: false,
  },
];

for (const theme of ['light', 'dark'] as const) {
  test(`thread/agent-parts (${theme}): an agent's images and files are ink chips 4 px under its words`, async () => {
    test.setTimeout(60_000);
    const core = new FakeCore(world(theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `project/${P}`, size: '1100x760' });
    try {
      const { page } = s;
      // the two messages between agents fold into '▸ 2 messages between 2 agents': open it
      await expect(page.getByTestId('thread.run.2')).toBeVisible({ timeout: 10_000 });
      await page.getByTestId('thread.run.2').click();
      await expect(page.getByTestId('thread.from.3')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('thread.you.3.image.1')).toHaveText('image 1');
      await expect(page.getByTestId('thread.you.3.file.1')).toContainText('cold-start.log');
      await expect(page.getByTestId('thread.you.2.image.1')).toHaveText('image 1');
      await expect(page.getByTestId('thread.from.3')).not.toContainText('[Image #1]');
      await expect(page.getByTestId('thread.from.3')).toContainText('reads the whole cache first');
      const gap = await page.evaluate(() => {
        const row = document.querySelector('[data-testid="thread.you.3.parts"]');
        const prev = row?.previousElementSibling;
        if (row === null || prev === null || prev === undefined) return null;
        return Math.round(row.getBoundingClientRect().top - prev.getBoundingClientRect().bottom);
      });
      expect(gap, 'the chips sit 4 px under the words (--s-1)').toBe(4);
      await page.waitForTimeout(300);
      await page.screenshot({ path: test.info().outputPath(`agent-parts-1100-${theme}.png`) });
    } finally {
      await s.close();
    }
  });
}
