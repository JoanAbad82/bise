// settings/onboarding-keys · the first launch's model step on the REAL core (onboard-keys-2, his
// words: « tu choisis ton provider, tu ajoutes ta clé ou ta subscription, et boom tout marche »).
// A throwaway home with no key; bise's own core (BISE_DESKTOP_BISE: the tree's build, rust/target/
// debug/bise, or ONB_BISE); the fake provider (tests/fake_provider.py) behind each provider's
// base_url (config.toml), the fake ChatGPT auth (tests/fake_openai_auth.py) and a fake "browser"
// that follows its consent link. Never a real key, account or browser.
//   key   an API key -> Anthropic -> a bad key: failed with Anthropic's own words, nothing saved;
//         a good one: "it works", the model's own answer, main's model in config.toml, the key in
//         auth.json, continue enabled
//   plan  Continue with ChatGPT -> the browser sign-in -> the plan checked -> "it works" on the plan
// Shots of every screen in the test's output folder (and ONB_SHOTS=<dir> when set).
import { spawn, type ChildProcess } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { launchDesktop, test, expect, type Session } from '../../harness';
import { testHome } from '../../harness/isolation';
import { settings } from '../../../src/proto/words.gen';

const ROOT = path.resolve(__dirname, '../../../../..');
const BISE = process.env['ONB_BISE'] ?? path.join(ROOT, 'rust/target/debug/bise');

/** a python fake started on any port: its "PORT <n>" first line */
async function fake(script: string, env: Record<string, string> = {}): Promise<{ p: ChildProcess; port: string }> {
  const p = spawn('python3', ['-u', path.join(ROOT, 'tests', script)], { env: { PATH: process.env['PATH'] ?? '', ...env }, stdio: ['ignore', 'pipe', 'inherit'] });
  const port = await new Promise<string>((res, rej) => {
    let buf = '';
    p.stdout.on('data', (d: Buffer) => {
      buf += d.toString();
      const m = /PORT (\d+)/.exec(buf) ?? /^\S+ (\d+)/m.exec(buf);
      if (m?.[1]) res(m[1]);
    });
    p.on('exit', () => { rej(new Error(`${script} exited`)); });
  });
  return { p, port };
}

const BROWSER = 'import sys, urllib.request\nurllib.request.urlopen(sys.argv[-1], timeout=30).read()\n';

async function world(body: (s: Session, biseHome: string) => Promise<void>, theme: 'light' | 'dark' = 'light'): Promise<void> {
  test.skip(!existsSync(BISE), `no bise build at ${BISE}`);
  const prov = await fake('fake_provider.py');
  const auth = await fake('fake_openai_auth.py');
  const h = testHome();
  const base = `http://127.0.0.1:${prov.port}/v1`;
  writeFileSync(path.join(h.biseHome, 'config.toml'), ['anthropic', 'openai', 'mistral', 'chatgpt'].map((p) => `[providers.${p}]\nbase_url = "${base}"\n`).join('\n'));
  writeFileSync(path.join(h.biseHome, 'prefs.json'), JSON.stringify({ theme }));
  const browser = path.join(h.tmp, 'browser.py');
  writeFileSync(browser, BROWSER);
  const s = await launchDesktop({
    home: h.home,
    route: 'onboarding',
    size: '1100x720',
    env: {
      BISE_DESKTOP_BISE: BISE,
      BISE_CHATGPT_ISSUER: `http://127.0.0.1:${auth.port}`,
      BISE_OPENROUTER_AUTH: `http://127.0.0.1:${auth.port}`,
      BISE_BROWSER: `python3 ${browser}`,
      BISE_OPEN: 'true',
      BISE_DETECT_KEYCHAIN: '0',
    },
  });
  try {
    await body(s, h.biseHome);
  } finally {
    await s.close();
    prov.p.kill();
    auth.p.kill();
  }
}

let n = 0;
async function shot(s: Session, name: string): Promise<void> {
  n += 1;
  const file = test.info().outputPath(`${String(n).padStart(2, '0')}-${name}.png`);
  await s.page.screenshot({ path: file });
  const dir = process.env['ONB_SHOTS'];
  if (dir) {
    mkdirSync(dir, { recursive: true });
    copyFileSync(file, path.join(dir, path.basename(file)));
  }
}

/** hello -> the model step */
async function toModel(s: Session): Promise<void> {
  const { page } = s;
  await expect(page.getByTestId('setup.step.hello')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('setup.next').click();
  await expect(page.getByTestId('setup.step.model')).toBeVisible();
  await expect(page.getByTestId('setup.pay'), 'the core lists how to pay').toBeVisible({ timeout: 20_000 });
}

for (const theme of ['light', 'dark'] as const) {
  test(`onboarding-keys/key (${theme}): pick a provider, paste a key, checked live, it works with its answer`, async () => {
    await world(async (s, biseHome) => {
      const { page } = s;
      const t = (name: string) => (theme === 'light' ? name : `${name}-dark`);
      await toModel(s);
      await expect(page.getByTestId('setup.next'), 'nothing works yet: no continue').toBeDisabled();
      await expect(page.getByTestId('setup.pay.coding'), "the TUI's fourth row: a coding plan key").toBeVisible();
      await shot(s, t('pay'));
      await page.getByTestId('setup.pay.api').click();
      await expect(page.getByTestId('setup.pay.which')).toBeVisible();
      await shot(s, t('which-provider'));
      await page.getByTestId('setup.pay.which.anthropic').click();
      const field = page.getByTestId('setup.pay.key');
      await expect(field).toHaveAttribute('type', 'password');
      await shot(s, t('paste'));
      await field.fill('sk-bad-key-123');
      await field.press('Enter');
      // a wrong key: on the paste step, under its field; no 'try again'
      await expect(page.getByTestId('setup.pay.failed')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('setup.pay.failed')).toContainText('Anthropic says this key is wrong: “');
      await expect(page.getByTestId('setup.pay.again')).toHaveCount(0);
      await shot(s, t('bad-key'));
      const auth = path.join(biseHome, 'auth.json');
      expect(existsSync(auth) ? readFileSync(auth, 'utf8') : '', 'a failed key is never saved').not.toContain('sk-bad-key');
      await field.fill('sk-good-key-123');
      await field.press('Enter');
      await expect(page.getByTestId('setup.pay.works')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('setup.step.model')).toContainText(settings.first_works({ model: 'opus 5.5' }));
      await expect(page.getByTestId('setup.pay.answer'), "the model's own first words").toContainText('it said: “');
      await expect(page.getByTestId('setup.pay.works')).toContainText(settings.first_main_uses({ model: 'anthropic/claude-opus-5-5' }));
      await shot(s, t('works'));
      expect(readFileSync(auth, 'utf8')).toContain('sk-good-key-123');
      expect(readFileSync(path.join(biseHome, 'config.toml'), 'utf8')).toContain('main = "anthropic/claude-opus-5-5"');
      expect(await page.locator('body').innerText()).not.toContain('sk-good-key-123');
      await expect(page.getByTestId('setup.next')).toBeEnabled();
      await page.getByTestId('setup.next').click();
      await expect(page.getByTestId('setup.step.projects')).toBeVisible();
    }, theme);
  });
}

test('onboarding-keys/plan: Continue with ChatGPT signs in, the plan is checked, it works on the plan', async () => {
  await world(async (s, biseHome) => {
    const { page } = s;
    await toModel(s);
    await page.getByTestId('setup.pay.chatgpt').click();
    await expect(page.getByTestId('setup.pay.works')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('setup.step.model')).toContainText(/it works: gpt[\w .-]+ answered\./);
    await shot(s, 'plan-works');
    const auth = JSON.parse(readFileSync(path.join(biseHome, 'auth.json'), 'utf8')) as Record<string, { type?: string }>;
    expect(auth['chatgpt']?.type).toBe('oauth');
    expect(readFileSync(path.join(biseHome, 'config.toml'), 'utf8')).toMatch(/main = "chatgpt\//);
    await expect(page.getByTestId('setup.next')).toBeEnabled();
  });
});
