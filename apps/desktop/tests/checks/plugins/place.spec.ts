// plugins/place · the plugins place (page plugins v48, plug-desktop): on the scripted core's fixture
// world (its `plugins`, `browse` and `plugins_summary` lines), from the sidebar's '⊞ plugins' row.
// Passes when:
//   - the sidebar row says what waits on him in the accent, with its tip;
//   - the place heads with the core's counts, the room, 'connect your tools' (Mistral's connectors
//     to connect, the import line) and the installed list by kind, each row with its one control;
//   - connect on a band card sends plugin_connect for that connector, a switch sends plugin_set;
//   - a row opens its page (parts, tools folded, try lines); the add menu lists its 6 items;
//   - an add's preview shows what it runs before his click; cancel sends plugin_add_cancel.
// Shots of each state go to the test's output (and to $PLUGINS_SHOTS when set), for designer.
import { copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { FakeCore, FakeHelper, launchDesktop, test, expect, type Session } from '../../harness';
import { settings } from '../../../src/proto/words_settings.gen';

const W = 1400;
const H = 1000;

async function shot(s: Session, name: string): Promise<void> {
  const file = test.info().outputPath(`${name}.png`);
  await s.page.screenshot({ path: file });
  const dir = process.env['PLUGINS_SHOTS'];
  if (dir !== undefined && dir !== '') {
    mkdirSync(dir, { recursive: true });
    copyFileSync(file, path.join(dir, `${name}.png`));
  }
}

async function scrollTo(s: Session, testId: string): Promise<void> {
  await s.page.getByTestId(testId).evaluate((el) => { el.scrollIntoView({ block: 'start' }); });
  await s.page.waitForTimeout(150);
}

test('the plugins place: the sidebar row, the band, the list, a page, add', async () => {
  test.setTimeout(90_000);
  const core = new FakeCore();
  const s = await launchDesktop({ core, helper: new FakeHelper(), route: 'bise' });
  try {
    await s.app.evaluate(({ BrowserWindow }, size) => {
      for (const w of BrowserWindow.getAllWindows()) w.setSize(size.w, size.h);
    }, { w: W, h: H });
    const row = s.page.getByTestId('app.sidebar.plugins');
    await expect(row).toBeVisible();
    await expect(s.page.getByTestId('app.sidebar.plugins.count')).toHaveText('3');
    await row.click();
    await expect(s.page.getByTestId('plugins.place')).toBeVisible();
    await expect(s.page.getByTestId('plugins.counts')).toHaveText(`${settings.plugins_place_counts({ on: 16, off: 2 })} · ${settings.plugins_place_waits({ n: 3 })}`);
    // the room draws his plugins' objects, and each row's icon is its object (p7)
    await expect(s.page.getByTestId('plugins.room.canvas')).toBeVisible();
    await expect(s.page.locator('[data-testid="plugins.row.blender.icon"][data-obj="easel"] img')).toBeVisible();
    await shot(s, '1-place-top');
    await scrollTo(s, 'plugins.band');
    await expect(s.page.getByTestId('plugins.band.count')).toHaveText(settings.plugins_band_count({ connected: 3, total: 10 }));
    await shot(s, '2-band');
    await s.page.getByTestId('plugins.band.mistral:linear.connect').click();
    await expect.poll(() => core.cmds().some((c) => c['cmd'] === 'plugin_connect' && c['id'] === 'mistral:linear')).toBe(true);
    await scrollTo(s, 'plugins.group.plugin');
    await shot(s, '3-list-plugins');
    await scrollTo(s, 'plugins.group.mistral');
    await shot(s, '4-list-connectors-mcp');
    await scrollTo(s, 'plugins.group.skills');
    await shot(s, '5-list-skills');
    await s.page.getByTestId('plugins.row.x.toggle').click();
    await expect.poll(() => core.cmds().some((c) => c['cmd'] === 'plugin_set' && c['name'] === 'x' && c['on'])).toBe(true);
    // a plugin's page
    await s.page.getByTestId('plugins.row.blender').click();
    await expect(s.page.getByTestId('plugins.page.blender')).toBeVisible();
    await s.page.getByTestId('plugins.part.blender#mcp:blender.fold').click();
    await shot(s, '6-page-blender');
    await s.page.goBack().catch(() => undefined);
    await s.page.getByTestId('app.sidebar.plugins').click();
    // add
    await s.page.getByTestId('plugins.add').click();
    await expect(s.page.getByTestId('plugins.add.menu')).toBeVisible();
    // the menu's 120 ms rise, done
    await s.page.waitForTimeout(250);
    await shot(s, '7-add-menu');
    await s.page.getByTestId('plugins.add.plugin').click();
    await s.page.getByTestId('plugins.sheet.plugin.source').fill('openai/plugins');
    await s.page.getByTestId('plugins.sheet.go').click();
    await expect.poll(() => core.cmds().some((c) => c['cmd'] === 'plugin_add')).toBe(true);
    void core.send({ ev: 'plugin_preview', token: 'a1b2c3d4e5f60718', preview: { name: 'latex', from: 'git github.com/openai/plugins (plugins/latex)', runs: [{ server: 'latex', transport: 'stdio', argv: ['npx', '-y', 'latex-mcp'] }], skills: ['latex-compile', 'latex-doctor'], secrets: ['TEX_TOKEN'] } });
    await expect(s.page.getByTestId('plugins.preview')).toBeVisible();
    await shot(s, '8-add-preview');
    await s.page.getByTestId('plugins.preview.cancel').click();
    await expect.poll(() => core.cmds().some((c) => c['cmd'] === 'plugin_add_cancel')).toBe(true);
    // dark: the room under the night light, the rows' objects and badges
    await core.send({ ev: 'prefs', prefs: { theme: 'dark' } } as never);
    await expect(s.page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await s.page.getByTestId('plugins.place').evaluate((el) => { el.scrollTo(0, 0); });
    await s.page.waitForTimeout(300);
    await shot(s, '9-place-top-dark');
    await scrollTo(s, 'plugins.group.mistral');
    await shot(s, '10-list-connectors-mcp-dark');
  } finally {
    await s.close();
  }
});
