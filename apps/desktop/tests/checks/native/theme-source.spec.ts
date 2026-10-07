// native/theme-source · the glass follows his theme pref (lead m_10834; amb-web's app/theme put
// prefs.theme on the pages, but the native vibrancy followed the system, so 'light' on a dark Mac drew
// light tokens over a dark glass). Main sets Electron's nativeTheme.themeSource from prefs.theme
// (src/main/theme.ts): 'system' before his prefs come, 'light' / 'dark' when he picks one, 'system'
// again for 'system' and the old 'auto'. Read from the app's main process. Owner: amb-mac. The new app
// on the scripted core.
import { FakeCore, FakeHelper, launchDesktop, test, expect } from '../../harness';

const HOME = 'bise-home-00000000';

const prefs = (theme: string) => ({ ev: 'prefs', prefs: { onboarded: true, theme, excluded_apps: [] } });

test("native/theme-source: nativeTheme.themeSource follows prefs.theme, live ('light', 'dark', 'auto' = 'system')", async () => {
  const helper = new FakeHelper();
  const core = new FakeCore([
    prefs('light'),
    { ev: 'projects', projects: [{ project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true }] },
    { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  ] as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ helper, core });
  try {
    const source = () => s.app.evaluate(({ nativeTheme }) => nativeTheme.themeSource);
    await expect.poll(source, { message: "his 'light' at start", timeout: 10_000 }).toBe('light');
    await core.send(prefs('dark') as never);
    await expect.poll(source, { message: "a change to 'dark' applies at once", timeout: 4000 }).toBe('dark');
    await core.send(prefs('auto') as never);
    await expect.poll(source, { message: "the old 'auto' follows the system", timeout: 4000 }).toBe('system');
    await core.send(prefs('light') as never);
    await expect.poll(source, { message: "'light' again", timeout: 4000 }).toBe('light');
    await core.send(prefs('system') as never);
    await expect.poll(source, { message: "'system' follows the system", timeout: 4000 }).toBe('system');
  } finally {
    await s.close();
    helper.dispose();
    core.dispose();
  }
});
