// settings/onboarding-first · the first launch in four screens (desktop-onboarding v4, his pick):
// hello shows bise's typed ':*' alone (never the mist pearl: no pearl, no canvas; the ':*' in the
// mono font, ':' ink, '*' accent), then model, projects, first (a real composer, ideas from his
// ticked projects that fill it, ⏎ sends to bise). On the scripted core (FakeCore) and helper.
//   mark   hello: no pearl or canvas, the ':*' computes to JetBrains Mono 700, '*' in the accent;
//          bise's empty thread: the same typed ':*', no pearl
//   shots  (ONB_SHOTS=<dir>) for designer: light + dark, 1100 and a narrow window: the 4 screens,
//          the model's live check, first with an idea clicked, fn's permissions sheet (capsule),
//          hello under reduced motion
import { mkdirSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { FakeCore, FakeHelper, launchDesktop, test, expect, type Session } from '../../harness';

const NOW = 1791100400000;
const HOME = 'bise-home-00000000';
const prefs = (theme: string, onboarded = false) => ({ ev: 'prefs', prefs: { onboarded, theme } });
const accounts = {
  ev: 'accounts',
  items: [
    { id: 'chatgpt', kind: 'subscription', label: 'ChatGPT', state: 'signed_out' },
    { id: 'anthropic-key', kind: 'key', label: 'Anthropic', state: 'signed_in', from: { t: 'env', var: 'ANTHROPIC_API_KEY' } },
  ],
};
const WORKS = { ev: 'provider_check', id: 'anthropic-key', name: 'Anthropic', state: 'works', model: 'anthropic/claude-opus-5-5', label: 'opus 5.5', answer: 'hi, ready when you are.', ms: 1200, main: 'anthropic/claude-opus-5-5', lines: ['main uses anthropic/claude-opus-5-5.'] };
const found = (home: string) => ({
  ev: 'found',
  dir: `${home}/code`,
  items: [
    { name: 'storefront', path: `${home}/code/storefront`, git: true, known: false, last_ms: NOW - 2 * 3600_000 },
    { name: 'shop', path: `${home}/code/shop`, git: true, known: false, last_ms: NOW - 86_400_000 },
    { name: 'telemetry', path: `${home}/code/telemetry`, git: true, known: false, last_ms: NOW - 21 * 86_400_000 },
  ],
});

/** what the typed ':*' computes to: its font, weight, and the '*' against the accent */
async function markLook(page: Page, id: string): Promise<{ font: string; weight: string; star: string; accent: string; colon: string; ink: string }> {
  return page.evaluate((tid) => {
    const m = document.querySelector(`[data-testid="${tid}"]`);
    if (!m) throw new Error(`no ${tid}`);
    const probe = (v: string): string => {
      const p = document.createElement('span');
      p.style.color = `var(${v})`;
      document.body.append(p);
      const c = getComputedStyle(p).color;
      p.remove();
      return c;
    };
    const cs = getComputedStyle(m);
    return {
      font: cs.fontFamily,
      weight: cs.fontWeight,
      star: getComputedStyle(m.querySelector('.b-kiss-s') ?? m).color,
      colon: getComputedStyle(m.querySelector('.b-kiss-c') ?? m).color,
      accent: probe('--c-accent'),
      ink: probe('--c-ink'),
    };
  }, id);
}

/** the fonts Chromium really drew a node's text with (CDP CSS.getPlatformFontsForNode): never just the declared family */
async function drawnFonts(page: Page, selector: string): Promise<string[]> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
  await cdp.detach();
  return fonts.map((f) => f.familyName);
}

/** a monospace face: JetBrains Mono, else the system's mono (the token's fallbacks) */
const MONO = /JetBrains Mono|SF Mono|Menlo|Monaco|Courier/i;

test("settings/onboarding-first/mark: hello's ':*' is typed in the mono font, ':' ink, '*' accent; no pearl, no canvas", async () => {
  const core = new FakeCore([prefs('light')] as never);
  const s = await launchDesktop({ core, route: 'onboarding' });
  try {
    const { page } = s;
    const hello = page.getByTestId('setup.step.hello');
    await expect(hello).toBeVisible({ timeout: 10_000 });
    await expect(hello.locator('[data-bise-pearl], canvas'), 'no mist pearl on hello').toHaveCount(0);
    await expect(hello.locator('.b-onb, .steps i').first()).toBeAttached();
    await expect(hello.locator('.steps i'), 'four dots').toHaveCount(4);
    const look = await markLook(page, 'setup.mark');
    expect(look.font.split(',')[0]?.replace(/["']/g, '').trim(), `the ':*' font (${look.font})`).toBe('JetBrains Mono');
    expect(look.weight).toBe('700');
    expect(look.star, "'*' in the accent").toBe(look.accent);
    expect(look.colon, "':' in ink").toBe(look.ink);
    for (const part of ['.b-kiss-c', '.b-kiss-s']) {
      const drawn = await drawnFonts(page, `[data-testid="setup.mark"] ${part}`);
      expect(drawn.length > 0 && drawn.every((f) => MONO.test(f)), `${part} drawn in a mono face (${drawn.join(', ')})`).toBe(true);
    }
    // the '*' is the ':' 's size (never a 15 px line's: an Onb's .s once caught it)
    const sizes = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>('[data-testid="setup.mark"] > span'), (e) => getComputedStyle(e).fontSize));
    expect(sizes).toEqual(['112px', '112px']);
    await expect(hello).toContainText("hi. i'm bise.");
  } finally {
    await s.close();
  }
});

test("settings/onboarding-first/empty-thread: bise's thread with no project shows the typed ':*', never the mist pearl", async () => {
  const core = new FakeCore([
    prefs('light', true),
    { ev: 'projects', projects: [{ project: HOME, name: 'bise', path: '/nowhere', git: false, home: true, order: 0, agents: 1, working: 0, waits: 0, running: true }] },
    { ev: 'welcome', project: HOME, proto: 1, workspace: '/nowhere', name: 'bise' },
    { ev: 'agents', project: HOME, agents: [{ name: 'main', main: true, status: 'idle', archived: false, title: '', purpose: '', since_ms: NOW, waits: 0 }] },
    { ev: 'thread', project: HOME, agent: 'main', entries: [], before: null, more: false },
  ] as never);
  const s = await launchDesktop({ core, route: 'bise' });
  try {
    const { page } = s;
    const empty = page.getByTestId('thread.noproject');
    await expect(empty).toBeVisible({ timeout: 10_000 });
    await expect(empty.locator('[data-bise-pearl], canvas')).toHaveCount(0);
    const look = await markLook(page, 'thread.noproject.mark');
    expect(look.font.split(',')[0]?.replace(/["']/g, '').trim()).toBe('JetBrains Mono');
    expect(look.star).toBe(look.accent);
    const drawn = await drawnFonts(page, '[data-testid="thread.noproject.mark"] .b-kiss-s');
    expect(drawn.every((f) => MONO.test(f)) && drawn.length > 0, `drawn in a mono face (${drawn.join(', ')})`).toBe(true);
    await page.screenshot({ path: test.info().outputPath('empty-thread.png') });
  } finally {
    await s.close();
  }
});

const SHOTS = process.env['ONB_SHOTS'];

async function shot(page: Page, name: string): Promise<void> {
  const file = test.info().outputPath(`${name}.png`);
  await page.screenshot({ path: file });
  if (SHOTS) {
    mkdirSync(SHOTS, { recursive: true });
    copyFileSync(file, path.join(SHOTS, path.basename(file)));
  }
}

async function size(s: Session, w: number, h: number): Promise<void> {
  await s.app.evaluate(({ BrowserWindow }, [w2, h2]) => {
    const win = BrowserWindow.getAllWindows().find((b) => !b.webContents.getURL().includes('surface=capsule'));
    win?.setContentSize(w2 ?? 0, h2 ?? 0);
  }, [w, h]);
  await expect.poll(() => s.page.evaluate(() => `${String(window.innerWidth)}x${String(window.innerHeight)}`), { timeout: 5000 }).toBe(`${String(w)}x${String(h)}`);
  await s.page.waitForTimeout(150);
}

for (const theme of ['light', 'dark'] as const) {
  test(`settings/onboarding-first/shots (${theme}): the four screens, the live check, an idea clicked, the permissions sheet, at 1100 and 720`, async () => {
    test.skip(!SHOTS, 'designer shots: ONB_SHOTS=<dir>');
    test.setTimeout(120_000);
    const core = new FakeCore([prefs(theme), accounts] as never);
    const helper = new FakeHelper();
    const s = await launchDesktop({ core, helper, route: 'onboarding', size: '1100x720' });
    try {
      const { page } = s;
      await page.emulateMedia({ colorScheme: theme });
      const both = async (name: string): Promise<void> => {
        await size(s, 1100, 720);
        await shot(page, `${theme}-1100-${name}`);
        await size(s, 720, 720);
        await shot(page, `${theme}-720-${name}`);
        await size(s, 1100, 720);
      };
      await expect(page.getByTestId('setup.step.hello')).toBeVisible({ timeout: 10_000 });
      await page.waitForTimeout(1500); // the ':' in, the '*' pop
      await both('1-hello');
      if (theme === 'light') {
        await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
        await page.reload();
        await expect(page.getByTestId('setup.step.hello')).toBeVisible({ timeout: 10_000 });
        await shot(page, `${theme}-1100-1-hello-reduced-motion`);
        await page.emulateMedia({ colorScheme: theme, reducedMotion: 'no-preference' });
      }
      await page.getByTestId('setup.next').click();
      await expect(page.getByTestId('setup.pay')).toBeVisible({ timeout: 5000 });
      await both('2-model');
      await page.getByTestId('setup.pay.found-anthropic-key').click();
      await page.waitForTimeout(1200);
      await core.send(WORKS as never);
      await expect(page.getByTestId('setup.pay.works')).toBeVisible({ timeout: 5000 });
      await both('2-model-works');
      await page.getByTestId('setup.next').click();
      const home = await page.evaluate(() => (window as unknown as { bise: { home: string } }).bise.home);
      await core.send(found(home) as never);
      await expect(page.getByTestId('setup.found.shop')).toBeAttached({ timeout: 5000 });
      await both('3-projects');
      await page.getByTestId('setup.next').click();
      await expect(page.getByTestId('setup.step.first')).toBeVisible({ timeout: 5000 });
      await both('4-first');
      await page.getByTestId('setup.idea.0').click();
      await both('4-first-idea');
      // fn's permissions sheet, in the capsule, at his first hold with one missing
      await helper.send({ ev: 'perms', accessibility: 'ask', mic: 'ask', screen: 'ask' });
      let cap: Page | undefined;
      await helper.send({ ev: 'fn', act: 'talk_start', by: 'fn' });
      await expect.poll(() => (cap = s.app.windows().find((p) => p.url().includes('surface=capsule'))) !== undefined, { timeout: 5000 }).toBe(true);
      if (cap === undefined) throw new Error('no capsule');
      await cap.emulateMedia({ colorScheme: theme });
      await cap.evaluate((c) => {
        document.documentElement.style.background = c;
      }, theme === 'dark' ? '#2a2a2c' : '#ececec');
      await expect(cap.getByTestId('capsule.perms')).toBeVisible({ timeout: 5000 });
      await cap.waitForTimeout(300);
      await shot(cap, `${theme}-capsule-5-perms`);
      await helper.send({ ev: 'fn', act: 'talk_end', by: 'fn' });
    } finally {
      await s.close();
    }
  });
}
