// thread/at-memory · R14 (docs/terminal-parity.md, the TUI's files::picked, B8): the core keeps
// the files he picks in the `@` list per project and ranks them first in their tier (amb-core
// 4519a877). Passes when, in the real thread's composer, picking a FILE sends
// {cmd:'file_picked', project, path} with the path as the files event gave it, and browsing a
// folder sends nothing. bise main's thread on the scripted core (FakeCore); the check answers the
// files ask itself. Real keys. Owner: amb-web.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 });
const world = () => [
  { ev: 'projects', projects: [{ project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 2, working: 0, waits: 0, running: true }] },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'agents', project: HOME, agents: [agent('main'), agent('perf')] },
  { ev: 'thread', project: HOME, agent: 'main', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'hello' }], before: null, more: false },
];

const F = '[data-testid="composer.field"]';

test('thread/at-memory: a file picked in the @ list goes to the core (file_picked), a folder browsed does not', async () => {
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core });
  try {
    const { page } = s;
    await expect(page.getByTestId('thread.screen')).toBeVisible({ timeout: 10_000 });
    await page.locator(F).click();
    const answer = async (q: string, items: { path: string; dir: boolean }[]): Promise<void> => {
      const ask = (await core.waitCmd((c) => c.cmd === 'files' && c.q === q, 3000)) as unknown as { rid: number };
      await core.send({ ev: 'files', project: HOME, rid: ask.rid, q, items } as never);
    };

    // a folder first: tab browses it, no memory
    await page.keyboard.type('@sr');
    await answer('sr', [{ path: 'src/', dir: true }, { path: 'src/b.rs', dir: false }]);
    await expect(page.getByTestId('composer.pick.file.src/')).toBeVisible({ timeout: 2000 });
    await page.keyboard.press('Tab');
    await answer('src/', [{ path: 'src/a.rs', dir: false }, { path: 'src/b.rs', dir: false }]);
    await expect(page.getByTestId('composer.pick.file.src/b.rs'), 'browsing src/ lists its files').toBeVisible({ timeout: 2000 });

    // then the file: ↓ ⏎ picks src/b.rs
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const sent = await core.waitCmd((c) => c.cmd === 'file_picked', 3000);
    expect(sent, 'the pick, with its project and its path as the core gave it').toMatchObject({ cmd: 'file_picked', project: HOME, path: 'src/b.rs' });
    expect(core.cmds().filter((c) => c.cmd === 'file_picked'), 'one pick, never the folder').toHaveLength(1);
  } finally {
    await s.close();
  }
});
