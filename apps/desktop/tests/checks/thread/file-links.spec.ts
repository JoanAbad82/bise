// thread/file-links · tui-parity M4 and B14 (docs/terminal-parity.md): a file path an agent
// names in an answer (`src/app.ts:12`) is a link; a click opens it in his editor at that line.
// Owner: amb-win (lead m_10125). The new app on the scripted core (a world of one project whose
// main answered with a path), a real click; the effect read outside the page: main's test-mode
// stdout line for openPath (amb-mac a0b3ebce: 'bise-desktop: open-path {path, line, how, url?}'),
// never his editor.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { FakeCore, test, expect } from '../../harness';
import { onWorld } from '../native/world';
import { expectShown } from './shown';

const HOME = 'bise-home-00000000';
// main opens only a file that exists (src/main/ipc.ts openFile): a throwaway project folder
const ROOT = mkdtempSync(path.join(tmpdir(), 'file-links-'));
const DIR = path.join(ROOT, 'bise');
mkdirSync(path.join(DIR, 'src', 'app'), { recursive: true });
mkdirSync(path.join(ROOT, 'notes'), { recursive: true });
writeFileSync(path.join(DIR, 'src', 'app', 'router.ts'), '// router\n');
writeFileSync(path.join(ROOT, 'notes', 'plan.md'), '# plan\n');
test.afterAll(() => {
  rmSync(ROOT, { recursive: true, force: true });
});
const OPEN = 'bise-desktop: open-path';

const world = () => [
  { ev: 'projects', projects: [{ project: HOME, name: 'bise', path: DIR, git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true }] },
  { ev: 'welcome', project: HOME, proto: 1, workspace: DIR, name: 'bise' },
  { ev: 'agents', project: HOME, agents: [{ name: 'main', main: true, status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 }] },
  {
    ev: 'thread',
    project: HOME,
    agent: 'main',
    entries: [
      { pos: 1, at_ms: 1791100001000, kind: 'you', text: 'where is the router?' },
      { pos: 2, at_ms: 1791100002000, kind: 'agent', text: 'it is in `src/app/router.ts:12`, next to `../notes/plan.md`.' },
    ],
    before: null,
    more: false,
  },
];

test('thread/file-links: a path in an answer opens in his editor at its line', async () => {
  await onWorld(
    async ({ s, out }) => {
      const link = s.page.getByTestId('thread.path').first();
      await expect(link, 'the path is drawn as a link').toBeVisible({ timeout: 10_000 });
      // in the DOM is not on screen (amb-win 35d08ae5): the answer's row and its link are shown
      await expectShown(s.page.getByTestId('thread.entry.2'), "the answer's row");
      await expectShown(link, 'the path link');
      await link.click();
      const line = await out.wait(OPEN, () => true, 3000);
      const ask = JSON.parse(line) as { path: string; line?: number };
      expect(ask.path, "the path, under the agent's folder").toBe(`${DIR}/src/app/router.ts`);
      expect(ask.line, 'at its line').toBe(12);
      await s.page.getByTestId('thread.path').nth(1).click();
      await expect.poll(() => out.of(OPEN).length, { message: 'a second path opens too' }).toBe(2);
      expect((JSON.parse(out.of(OPEN)[1] ?? '{}') as { path: string }).path, 'a relative ../ path').toBe(path.join(ROOT, 'notes', 'plan.md'));
    },
    { core: new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]) },
  );
});
