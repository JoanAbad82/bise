// thread/at-start · his words opening with @<agent> (his ask: « si le message COMMENCE par
// @agent-name, la UI du composer passe en rose avec le "to agent-name" … et quand j'envoie le
// message je suis redirigé vers le thread de l'agent. si @agent-name est au milieu … un message
// normal »; before, the hub routed it and his row stayed 'sending…' in main's thread forever).
// The REAL thread screen on the scripted core. Passes when, in main's thread:
//   - '@architect …' typed (after spaces too): the composer is pink, its tab '↳ to architect';
//   - ⏎: the send goes to architect without the '@architect', the window opens architect's thread
//     with his row there, and main's thread has no row of it;
//   - 'ask @architect …' (the name in the middle) and '@nobody …' (no such agent): plain, sent to main.
// Shots (light and dark) of the pink composer and of architect's thread after, for designer.
// Owner: at-start (amb-win's composer).
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const T = { field: '[data-testid="composer.field"]', pending: '[data-testid^="thread.pending."]' };
type Cmd = Record<string, unknown>;

const agent = (name: string, main: boolean) => ({ name, main, status: 'idle', archived: false, title: main ? '' : 'the codebase architect', purpose: '', since_ms: 1791100000000, waits: 0 });
const world = (theme: string) => [
  {
    ev: 'prefs',
    prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
  },
  { ev: 'projects', projects: [{ project: HOME, name: 'bise', path: '/tmp', git: false, home: true, order: 0, agents: 2, working: 0, waits: 0, running: true }] },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/tmp', name: 'bise' },
  { ev: 'agents', project: HOME, agents: [agent('main', true), agent('architect', false)] },
  { ev: 'thread', project: HOME, agent: 'main', entries: [{ pos: 1, at_ms: Date.now() - 60_000, kind: 'agent', text: 'the launch is done.' }], before: null, more: false },
  { ev: 'thread', project: HOME, agent: 'architect', entries: [{ pos: 1, at_ms: Date.now() - 60_000, kind: 'agent', text: 'the map of the seams is on main.' }], before: null, more: false },
];

for (const theme of ['light', 'dark'] as const) {
  test(`thread/at-start: a leading @agent turns the composer pink and sends to its thread · ${theme}`, async () => {
    test.setTimeout(60_000);
    const core = new FakeCore(world(theme) as unknown as ConstructorParameters<typeof FakeCore>[0]);
    const s = await launchDesktop({ core, route: `agent/${HOME}/main`, size: '1200x800' });
    try {
      const { page } = s;
      const screen = page.getByTestId('thread.screen');
      const field = page.locator(T.field).first();
      const box = page.getByTestId('composer.box');
      const tab = page.getByTestId('composer.tab');
      await expect(screen, "main's thread").toHaveAttribute('data-agent', 'main', { timeout: 10_000 });
      await expect(field).toBeVisible();

      // the name in the middle, then no such agent: plain, to main
      for (const words of ['ask @architect for the map', '@nobody look at it']) {
        await field.click();
        await page.keyboard.type(words);
        await expect(box, `'${words}' stays plain`).not.toHaveAttribute('data-answering', 'true');
        await expect(field.locator('[data-lead="true"]'), 'no address in the accent').toHaveCount(0);
        await core.result('send', undefined, { msg_id: 0, reason: 'command' });
        await page.keyboard.press('Enter');
        const c = (await core.waitCmd((x) => (x as Cmd)['cmd'] === 'send' && (x as Cmd)['text'] === words)) as Cmd;
        expect(c['agent'], `'${words}' goes to main`).toBe('main');
      }

      // a leading @architect, after spaces: the pink, '↳ to architect'
      const words = 'fais une map de la tech debt';
      await field.click();
      await page.keyboard.type(`  @architect ${words}`);
      await expect(box, 'the pink').toHaveAttribute('data-answering', 'true', { timeout: 2000 });
      await expect(tab).toContainText('↳ to architect');
      await expect(tab).toContainText('erase the @ to stay with bise');
      // the address itself in the accent, 600 (designer m_34049)
      const mark = field.locator('[data-lead="true"]');
      await expect(mark, 'the @architect in the accent').toHaveText('@architect');
      expect(await mark.evaluate((el) => getComputedStyle(el).fontWeight)).toBe('600');
      await page.screenshot({ path: test.info().outputPath(`pink-${theme}.png`) });
      await tab.screenshot({ path: test.info().outputPath(`pink-tab-${theme}.png`) });

      // ⏎: to architect, without the address; his thread opens with his row there
      await core.result('send', undefined, { msg_id: 77, reason: 'made' });
      await page.keyboard.press('Enter');
      const c = (await core.waitCmd((x) => (x as Cmd)['cmd'] === 'send' && (x as Cmd)['agent'] === 'architect')) as Cmd;
      expect(c['text'], 'his words without the @architect').toBe(words);
      await expect(screen, "architect's thread opens").toHaveAttribute('data-agent', 'architect', { timeout: 3000 });
      await expect(page.locator(T.pending, { hasText: words }), 'his row, in its thread').toHaveCount(1, { timeout: 2000 });
      // its own thread's state: 'to architect', no '↳' (an agent that is not main keeps its quiet pink)
      await expect(tab, "back to the thread's own tab").not.toContainText('↳');
      await expect(tab).toContainText('to architect');
      await page.screenshot({ path: test.info().outputPath(`architect-${theme}.png`) });

      // main's thread has no row of it
      await page.getByTestId('app.sidebar.bise').click();
      await core.send({ ev: 'entry', project: HOME, agent: 'architect', entry: { pos: 2, at_ms: Date.now(), kind: 'you', text: words, msg_id: 77, delivery: 'read' } });
      await expect(screen).toHaveAttribute('data-agent', 'main', { timeout: 3000 });
      await expect(page.locator(T.pending), "no row left in main's thread").toHaveCount(0);
      await expect(page.getByText(words), "his words aren't in main's thread").toHaveCount(0);
    } finally {
      await s.close();
    }
  });
}
