// thread/queue-drawer · his queued messages as a drawer above the composer's tab (designer m_25146,
// his « une petite boîte avec les queued messages … qui se déplierait comme un tiroir »). On the REAL
// thread screen (FakeCore, fake data), bise's main busy with 2 of his messages queued by the hub:
//   - the drawer shows 2 rows, oldest first, under its head '2 queued · sent when bise's turn ends';
//     no dashed bubble in the thread;
//   - each row's three icons explain themselves in the ds tip, on hover and on keyboard focus:
//     'send now: bise reads it mid-turn ⏎', 'edit: back into the composer ↑', 'delete it ⌫';
//   - send now sends queued_steer {id} (the hub steers it in, its id kept); the row leaves when the
//     hub's agents event no longer lists it (nothing optimistic);
//   - edit sends queued_take {id}; the hub's queued_taken puts his words back in the field; with a
//     draft in the field edit waits and its tip says 'empty the composer to edit it';
//   - delete sends queued_take {id}; once taken the head says 'deleted · undo' and undo queues his
//     words again (send {mode: queued});
//   - shots light + dark at 1400, 1100 and 800 (2 queued, a hovered icon with its tip, 5 queued
//     scrolling, folded, 'deleted · undo') for designer.
// The hub's own side (queued_steer delivers once with its id, a take after it refused) is
// tests/proto_e2e_threads.py's queued_round, on a real hub. Owner: queue-drawer.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';
const P = 'shop-ab9f3c3b';
const MIN = 60_000;
const prefs = (theme: 'light' | 'dark') => ({
  ev: 'prefs',
  prefs: { onboarded: true, theme, context: { shot: true, url: true, file: true, window_text: false }, excluded_apps: [], quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true }, voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' }, shots_keep_days: 7 },
});
type Q = { id: number; text: string; created_ms: number };
const ag = (name: string, now: number, over: Record<string, unknown> = {}) => ({ name, dir: name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: now - 9 * MIN, waits: 0, ...over });
const agents = (now: number, queued: readonly Q[]) => ({ ev: 'agents', project: P, agents: [ag('main', now, { status: 'working', since_ms: now - 2 * MIN, queued }), ag('perf', now)] });
const q = (now: number, id: number, text: string): Q => ({ id, text, created_ms: now - MIN + id });
const TWO = (now: number) => [q(now, 7, 'BTW feel free to update the desktop app with the new drawer once the hub op lands'), q(now, 8, 'then open a PR')];
const world = (now: number) => [
  prefs('light'),
  {
    ev: 'projects',
    projects: [
      { project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true },
      { project: P, name: 'shop', path: '/nowhere/shop', git: true, home: false, order: 1, agents: 2, working: 1, waits: 0, running: true },
    ],
  },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/shop', name: 'shop' },
  agents(now, TWO(now)),
  {
    ev: 'thread',
    project: P,
    agent: 'main',
    entries: [
      { pos: 1, at_ms: now - 5 * MIN, kind: 'you', text: 'fix the order of the lands in the queue' },
      { pos: 2, at_ms: now - 4 * MIN, kind: 'agent', text: 'on it: reading land_queue.rs first.' },
    ],
    before: null,
    more: false,
  },
];
type Cmd = { cmd?: string; id?: number; mode?: string; text?: string; agent?: string };
/** a predicate on the fields this check reads, for FakeCore.waitCmd */
const is = (f: (c: Cmd) => boolean) => (x: unknown): boolean => f(x as Cmd);

test('thread/queue-drawer: 2 queued as drawer rows; send now steers, edit puts it back, delete removes it with undo; tips on the 3 icons', async () => {
  test.setTimeout(180_000);
  const now = Date.now();
  const core = new FakeCore(world(now) as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `project/${P}`, size: '1100x760' });
  try {
    const { page } = s;
    const drawer = page.getByTestId('composer.queue');
    const rows = page.locator('[data-testid="composer.queue.rows"] > [role="listitem"]');
    const tip = page.getByTestId('tip');
    const field = page.locator('[data-testid="composer.field"]').first();
    const size = async (w: number) => {
      await page.setViewportSize({ width: w, height: 760 });
      await page.waitForTimeout(250);
    };
    const shot = async (name: string) => {
      await page.mouse.move(1, 1);
      // no focus ring left by an earlier step on the shot
      await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur();
      });
      await page.screenshot({ path: test.info().outputPath(`${name}.png`) });
    };

    await test.step('2 queued: two rows, oldest first, the head, no bubble in the thread', async () => {
      await expect(drawer).toBeVisible();
      await expect(rows).toHaveCount(2);
      await expect(page.getByTestId('composer.queue.head')).toContainText("2 queued · sent when bise's turn ends");
      await expect(page.getByTestId('composer.queue.2.text')).toHaveText('then open a PR');
      await expect(page.locator('[data-testid^="thread.queued."]')).toHaveCount(0);
      // glued above the tab: the drawer's bottom is the tab's top, the same width
      const [d, t] = await Promise.all([drawer.boundingBox(), page.getByTestId('composer.tab').boundingBox()]);
      expect(d && t && Math.abs(d.y + d.height - t.y), 'the drawer sits on the tab').toBeLessThanOrEqual(1);
      expect(d && t && Math.abs(d.width - t.width), 'the tab\'s width').toBeLessThanOrEqual(1);
    });

    await test.step('the three icons explain themselves on hover and on focus', async () => {
      const words = { steer: 'send now: bise reads it mid-turn', edit: 'edit: back into the composer', delete: 'delete it' } as const;
      for (const [k, w] of Object.entries(words)) {
        await page.getByTestId(`composer.queue.1.${k}`).hover();
        await expect(tip, `${k}: its tip on hover`).toBeVisible();
        await expect(page.getByTestId('tip.words')).toHaveText(w);
      }
      await page.mouse.move(1, 1);
      await page.getByTestId('composer.queue.1.steer').focus();
      await expect(page.getByTestId('tip.words'), 'on keyboard focus too').toHaveText(words.steer);
      await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur();
      });
      // a click never leaves a ring: only keyboard focus draws one (designer m_25886 1)
      await page.getByTestId('composer.queue.2.edit').click({ trial: true });
      await page.getByTestId('composer.queue.1.edit').hover();
      await expect(tip).toBeVisible();
      await page.screenshot({ path: test.info().outputPath('hover-edit-light-1100.png') });
      await drawer.screenshot({ path: test.info().outputPath('crop-hover-edit-light-1100.png') });
    });

    await test.step('shots: light + dark at 1400, 1100, 800', async () => {
      for (const t of ['light', 'dark'] as const) {
        await core.send(prefs(t) as never);
        for (const w of [1400, 1100, 800]) {
          await size(w);
          await shot(`two-${t}-${String(w)}`);
        }
      }
      await size(1100);
      await core.send(agents(now, [...TWO(now), q(now, 9, 'and the TUI too'), q(now, 10, 'with the same words'), q(now, 11, 'run the gate before you land')]) as never);
      await expect(rows).toHaveCount(5);
      // rows out of sight: the bottom fade says so; scrolled, the top one too (designer m_25886 2)
      const list = page.getByTestId('composer.queue.rows');
      await expect(list).toHaveAttribute('data-below', 'true');
      await expect(list).not.toHaveAttribute('data-above', 'true');
      await shot('five-dark-1100');
      await drawer.screenshot({ path: test.info().outputPath('crop-five-dark-1100.png') });
      await list.evaluate((el) => {
        el.scrollTop = 20;
      });
      await expect(list).toHaveAttribute('data-above', 'true');
      await expect(list).toHaveAttribute('data-below', 'true');
      await list.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      await expect(list).not.toHaveAttribute('data-below', 'true');
      await list.evaluate((el) => {
        el.scrollTop = 0;
      });
      await page.getByTestId('composer.queue.fold').click();
      await expect(rows).toHaveCount(0);
      await expect(page.getByTestId('composer.queue.head')).toContainText('5 queued');
      await shot('folded-dark-1100');
      await page.getByTestId('composer.queue.fold').click();
      await core.send(prefs('light') as never);
      await core.send(agents(now, TWO(now)) as never);
      await expect(rows).toHaveCount(2);
    });

    await test.step('send now: queued_steer with its id; the row leaves when the hub says so', async () => {
      await page.getByTestId('composer.queue.1.steer').click();
      expect(await core.waitCmd(is((c) => c.cmd === 'queued_steer'), 3000)).toMatchObject({ project: P, agent: 'main', id: 7 });
      await expect(rows, 'nothing optimistic').toHaveCount(2);
      await core.send(agents(now, [q(now, 8, 'then open a PR')]) as never);
      await expect(rows).toHaveCount(1);
      await expect(page.getByTestId('composer.queue.head')).toContainText("queued · sent when bise's turn ends");
    });

    await test.step('edit waits while a draft is in the field, then puts his words back', async () => {
      await field.click();
      await page.keyboard.type('a draft');
      await expect(page.getByTestId('composer.queue.1.edit')).toBeDisabled();
      await page.getByTestId('composer.queue.1.edit').locator('..').hover();
      await expect(page.getByTestId('tip.words')).toHaveText('empty the composer to edit it');
      await field.click();
      await page.keyboard.press('Meta+a');
      await page.keyboard.press('Backspace');
      await expect(page.getByTestId('composer.queue.1.edit')).toBeEnabled();
      await page.getByTestId('composer.queue.1.edit').click();
      expect(await core.waitCmd(is((c) => c.cmd === 'queued_take' && c.id === 8), 3000)).toMatchObject({ project: P, agent: 'main', id: 8 });
      await core.send({ ev: 'queued_taken', project: P, agent: 'main', id: 8, text: 'then open a PR' } as never);
      await expect(field, 'his words back in the field').toContainText('then open a PR');
      await core.send(agents(now, []) as never);
      await expect(drawer, 'the last one gone: the drawer closes').toHaveCount(0);
      await field.click();
      await page.keyboard.press('Meta+a');
      await page.keyboard.press('Backspace');
    });

    await test.step('delete: queued_take, then deleted · undo; undo queues his words again', async () => {
      await core.send(agents(now, [q(now, 12, 'drop me')]) as never);
      await expect(rows).toHaveCount(1);
      await page.getByTestId('composer.queue.1.delete').click();
      expect(await core.waitCmd(is((c) => c.cmd === 'queued_take' && c.id === 12), 3000)).toMatchObject({ project: P, agent: 'main', id: 12 });
      await core.send({ ev: 'queued_taken', project: P, agent: 'main', id: 12, text: 'drop me' } as never);
      await core.send(agents(now, []) as never);
      await expect(page.getByTestId('composer.queue.head')).toContainText('deleted ·');
      await shot('deleted-undo-light-1100');
      await page.getByTestId('composer.queue.undo').click();
      expect(await core.waitCmd(is((c) => c.cmd === 'send' && c.mode === 'queued'), 3000)).toMatchObject({ project: P, agent: 'main', text: 'drop me', mode: 'queued' });
      // ⌘Z does the same while 'deleted · undo' shows (designer m_25886 3)
      await core.send(agents(now, [q(now, 13, 'drop me too')]) as never);
      await page.getByTestId('composer.queue.1.delete').click();
      await core.waitCmd(is((c) => c.cmd === 'queued_take' && c.id === 13), 3000);
      await core.send({ ev: 'queued_taken', project: P, agent: 'main', id: 13, text: 'drop me too' } as never);
      await core.send(agents(now, []) as never);
      await expect(page.getByTestId('composer.queue.undo')).toBeVisible();
      await page.keyboard.press('Meta+z');
      expect(await core.waitCmd(is((c) => c.cmd === 'send' && c.text === 'drop me too'), 3000)).toMatchObject({ mode: 'queued' });
    });
  } finally {
    await s.close();
    core.dispose();
  }
});
