// app/design-base · ambient's design sign-off blocker (m_10689): every window screen drew in the
// browser's Times (no root carried the DS's .b-ui), and bise's sidebar row and header drew the
// old ':*' glyph. Passes when the window's and the capsule's body and screens compute the DS's UI
// font (--font-ui), and bise's row and header hold bise's pearl, never the glyph: at rest the ink
// pearl (designer m_12127; the live pink one only while bise waits on him). Owner:
// amb-win (lead m_10690). The new app on the scripted core.
import { FakeCore, FakeHelper, launchDesktop, test, expect } from '../../harness';
import { capsulePage } from '../native/world';

const HOME = 'bise-home-00000000';
const world = () => [
  {
    ev: 'prefs',
    prefs: {
      onboarded: true,
      theme: 'system',
      context: { shot: true, url: true, file: true, window_text: false },
      excluded_apps: [],
      quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 20, away_card: true },
      voice: { fn_hold: true, fn_twice: 'spotlight', language: 'auto' },
      shots_keep_days: 7,
    },
  },
  { ev: 'projects', projects: [{ project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true }] },
  { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
  { ev: 'agents', project: HOME, agents: [{ name: 'main', main: true, status: 'idle', archived: false, title: '', purpose: '', since_ms: 1791100000000, waits: 0 }] },
  { ev: 'thread', project: HOME, agent: 'main', entries: [{ pos: 1, at_ms: 1791100001000, kind: 'agent', text: 'hello' }], before: null, more: false },
];

/** The DS's UI font stack and what an element computes, read in the page. */
const fonts = (sel: string) => {
  const ui = getComputedStyle(document.documentElement).getPropertyValue('--font-ui').trim();
  const el = sel === 'body' ? document.body : document.querySelector(sel);
  return { ui, got: el ? getComputedStyle(el).fontFamily : '' };
};
const first = (stack: string): string => (stack.split(',')[0] ?? '').trim().replace(/^"|"$/g, '');

test("app/design-base: the window and the capsule in the DS's UI font; bise's row and header hold bise's pearl, ink at rest", async () => {
  const helper = new FakeHelper();
  const core = new FakeCore(world() as unknown as ConstructorParameters<typeof FakeCore>[0]);
  const s = await launchDesktop({ helper, core });
  try {
    const { page } = s;
    await expect(page.getByTestId('thread.screen')).toBeVisible({ timeout: 10_000 });
    for (const sel of ['body', '[data-testid="app.root"]', '[data-testid="thread.screen"]', '.b-side']) {
      const f = await page.evaluate(fonts, sel);
      expect(f.ui, '--font-ui is defined').not.toBe('');
      expect(first(f.got), `${sel} computes the DS's UI font, not Times`).toBe(first(f.ui));
    }
    // bise's ':*' (desktop-delight v2: the orb left the window, the pearl is the capsule's): nothing
    // waits on him here, so not the accent; no pearl in the sidebar or the head
    for (const where of ['.b-side', '.b-head']) {
      const mark = page.locator(`${where} .b-bise`).first();
      await expect(mark, `${where}: bise's ':*'`).toBeVisible();
      await expect(mark, `${where}: at rest, not the accent`).not.toHaveAttribute('data-waits', 'true');
      await expect(page.locator(`${where} [data-bise-pearl]`), `${where}: no pearl`).toHaveCount(0);
    }
    await page.screenshot({ path: test.info().outputPath('base.png') });
    const cap = await capsulePage(s);
    const c = await cap.evaluate(fonts, 'body');
    expect(first(c.got), "the capsule's body computes the DS's UI font").toBe(first(c.ui));
  } finally {
    await s.close();
    helper.dispose();
    core.dispose();
  }
});
