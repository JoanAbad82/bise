// composer/approvals-toggle · TP-R6 (docs/terminal-parity.md, re-audit at e3f7e598; the TUI's
// input.rs + keybar.rs, approvals-design.md §8.1): ⇧⇥ in a thread's composer sends the hub
// `approvals {project, mode: 'toggle'}`, the caret stays in the field, and when the hub answers
// with its switch (`approvals` with `flash`), the label line's right says it for 3 s (the mode
// word in accent, then its sentence), then the divider reads the new mode. FakeCore records the
// window's commands and stands in for the hub's answer. Owner: amb-web.
import { FakeCore, launchDesktop, test, expect } from '../../harness';

const P = 'acme-1a2b3c4d';
const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 });
const approvals = (mode: 'yolo' | 'auto', flash: boolean) => ({ ev: 'approvals', project: P, mode, env: false, checker: 'jev', checker_who: 'TypeSafe', repo: '/nowhere/acme', rules: [], ...(flash ? { flash: true } : {}) });
const world = () => [
  { ev: 'projects', projects: [{ project: P, name: 'acme', path: '/nowhere/acme', git: true, home: false, order: 0, agents: 2, working: 0, waits: 0, running: true }] },
  { ev: 'welcome', project: P, proto: 1, workspace: '/nowhere/acme', name: 'acme' },
  { ev: 'agents', project: P, agents: [agent('main'), agent('perf')] },
  { ev: 'thread', project: P, agent: 'perf', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'the thumbnails are 380 KB now.' }], before: null, more: false },
  approvals('yolo', false),
];
const toggles = (core: FakeCore) => core.cmds().filter((c) => c.cmd === 'approvals');

test('composer/approvals-toggle: ⇧⇥ switches yolo ↔ auto and the label line flashes it for 3 s', async () => {
  test.setTimeout(90_000);
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ core, route: `agent/${P}/perf` });
  try {
    const { page } = s;
    const field = page.locator('[data-testid="composer.field"]');
    const end = page.locator('[data-testid="composer"] .div .end');
    const flash = page.getByTestId('composer.flash');
    await expect(field).toBeVisible({ timeout: 10_000 });
    await expect(end, 'the divider reads the mode the hub said').toContainText('yolo', { timeout: 5000 });
    await expect(flash, 'the mode it had at start never flashes').toHaveCount(0);
    await field.click();
    await page.keyboard.type('a draft');

    // yolo → auto
    await page.keyboard.press('Shift+Tab');
    await expect.poll(() => toggles(core), { timeout: 3000 }).toHaveLength(1);
    expect(toggles(core)[0]).toMatchObject({ cmd: 'approvals', project: P, mode: 'toggle' });
    expect(await field.evaluate((el) => el.contains(document.activeElement)), '⇧⇥ keeps the caret in the field').toBe(true);
    await expect(field, 'his draft is untouched').toHaveText('a draft');
    await core.send(approvals('auto', true) as never);
    await expect(flash).toHaveText('auto · safe calls run, risky ones ask you', { timeout: 3000 });
    const color = (sel: string) => page.locator(sel).evaluate((el) => getComputedStyle(el).color);
    expect(await color('[data-testid="composer.flash"] .flash-word'), 'the mode word is in accent').not.toBe(await color('[data-testid="composer.flash"]'));
    await page.screenshot({ path: test.info().outputPath('1-flash-auto.png') });
    // after 3 s: the divider again, with the new mode
    await expect(flash, 'the flash lasts 3 s').toHaveCount(0, { timeout: 4500 });
    await expect(end).toContainText('auto');
    await expect(end).not.toContainText('yolo');
    await page.screenshot({ path: test.info().outputPath('2-divider-auto.png') });

    // auto → yolo
    await page.keyboard.press('Shift+Tab');
    await expect.poll(() => toggles(core), { timeout: 3000 }).toHaveLength(2);
    expect(toggles(core)[1]).toMatchObject({ cmd: 'approvals', project: P, mode: 'toggle' });
    await core.send(approvals('yolo', true) as never);
    await expect(flash).toHaveText('yolo · everything runs, nothing asks', { timeout: 3000 });
    await page.screenshot({ path: test.info().outputPath('3-flash-yolo.png') });
    await expect(flash).toHaveCount(0, { timeout: 4500 });
    await expect(end).toContainText('yolo');

    // with the / list open, ⇧⇥ is the list's (no switch)
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('/');
    await expect(page.locator('[data-testid="composer.pick"]')).toBeVisible({ timeout: 3000 });
    await page.keyboard.press('Shift+Tab');
    await page.waitForTimeout(300);
    expect(toggles(core), 'an open list takes ⇧⇥').toHaveLength(2);
  } finally {
    await s.close();
    core.dispose();
  }
});
