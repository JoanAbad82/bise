// Every launch's own home (main m_9882): a run can't reach his real home, and one that tries is
// stopped. The pure parts on synthetic tables; then amb-mac's 22:33 case end to end with a fake
// bise (fixtures/fake-bise.sh), the test runner's own HOME being his real one.
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { breaches, harnessEnv, realHome, testHome } from '../isolation';
import { launchDesktop } from '../launch';

const REAL = realHome();
const FAKE_BISE = path.join(__dirname, '..', 'fixtures', 'fake-bise.sh');
const built = existsSync(path.join(__dirname, '..', '..', '..', 'out', 'main', 'index.js'));

test('harnessEnv: the test home always wins, a caller can\'t pick a home or a workspace outside it', () => {
  const h = testHome();
  const env = harnessEnv(h, { BISE_DESKTOP_TEST: '1' }, {}, { HOME: REAL, BISE_HOME: `${REAL}/.bise`, SB_SOCKET: '/x', PATH: '/usr/bin' });
  expect(env['HOME']).toBe(h.home);
  expect(env['BISE_HOME']).toBe(h.biseHome);
  expect(env['SB_SOCKET']).toBeUndefined();
  expect(env['PATH']).toBe('/usr/bin');
  expect(() => harnessEnv(h, {}, { HOME: REAL })).toThrow(/can't set HOME/);
  expect(() => harnessEnv(h, {}, { BISE_HOME: `${REAL}/.bise` })).toThrow(/can't set BISE_HOME/);
  expect(() => harnessEnv(h, {}, { BISE_DESKTOP_WORKSPACE: `${REAL}/bise` })).toThrow(/outside the test home/);
  expect(harnessEnv(h, {}, { BISE_DESKTOP_WORKSPACE: path.join(h.home, 'bise') })['BISE_DESKTOP_WORKSPACE']).toBe(path.join(h.home, 'bise'));
  rmSync(h.root, { recursive: true, force: true });
});

test('breaches: his real hub from anywhere, sbd/launchctl of the app outside the test home', () => {
  const h = testHome();
  const app = 100;
  const table = [
    { pid: 100, ppid: 50, command: 'Electron .' },
    { pid: 101, ppid: 100, command: '/x/bise ambient-core --home', home: h.home, biseHome: h.biseHome },
    { pid: 102, ppid: 1, command: '/x/bise sbd --workspace /Users/u/bise', biseHome: `${REAL}/.bise` },
    { pid: 103, ppid: 101, command: 'launchctl bootstrap gui/501 /x/dev.bise.hub.plist', home: REAL },
    { pid: 104, ppid: 101, command: `/x/bise sbd --workspace ${h.home}/bise`, home: h.home, biseHome: h.biseHome },
    { pid: 105, ppid: 1, command: '/y/bise sbd --workspace /tmp/gate', home: REAL, biseHome: '/tmp/gate/.bise' },
    // another agent's gate e2e (seen live: interrupt's): his HOME, no BISE_HOME, its own SB_STATE_DIR
    { pid: 106, ppid: 1, command: `/z/bise sbd --workspace ${REAL}/.bise/gate/1/ws`, home: REAL, stateDir: `${REAL}/.bise/gate/1/state` },
  ];
  const found = breaches(table, new Set([50]), app, h, REAL);
  expect(found.some((b) => b.includes('pid 102') && b.includes('real bise home'))).toBe(true);
  expect(found.some((b) => b.includes('pid 103') && b.includes('launchctl outside'))).toBe(true);
  expect(found.some((b) => b.includes('pid 104'))).toBe(false);
  expect(found.some((b) => b.includes('pid 105'))).toBe(false); // another agent's throwaway hub
  expect(found.some((b) => b.includes('pid 106'))).toBe(false); // a gate's test hub
  expect(breaches(table, new Set([50, 102, 103]), app, h, REAL)).toEqual([]); // there before the run
  rmSync(h.root, { recursive: true, force: true });
});

test.describe('the app on a fake bise (needs pnpm build)', () => {
  test.skip(!built, 'no build in out/: pnpm build');
  test.beforeAll(() => { chmodSync(FAKE_BISE, 0o755); });

  test('the core the app starts gets the test home, never his (the runner\'s own HOME is his)', async () => {
    expect(process.env['HOME']).toBe(REAL);
    const out = path.join(mkdtempSync(path.join(os.tmpdir(), 'bh-probe-')), 'env');
    const s = await launchDesktop({ env: { BISE_DESKTOP_BISE: FAKE_BISE, BISE_DESKTOP_WORKSPACE: '', BISE_HARNESS_PROBE_OUT: out } });
    try {
      await expect.poll(() => existsSync(out), { timeout: 10_000 }).toBe(true);
      const seen = readFileSync(out, 'utf8');
      expect(seen).toMatch(/HOME=\/tmp\/bh-/);
      expect(seen).not.toContain(`HOME=${REAL} `);
      expect(seen).not.toContain(`${REAL}/.bise`);
    } finally {
      await s.close();
    }
  });

  test('amb-mac\'s 22:33 case: a hub on his real ~/.bise appearing during the run stops it, loudly', async () => {
    const out = path.join(mkdtempSync(path.join(os.tmpdir(), 'bh-probe-')), 'env');
    let failed = '';
    try {
      const s = await launchDesktop({ env: {
        BISE_DESKTOP_BISE: FAKE_BISE, BISE_DESKTOP_WORKSPACE: '', BISE_HARNESS_PROBE_OUT: out,
        BISE_HARNESS_PROBE_MODE: 'real-hub', BISE_HARNESS_PROBE_REAL: REAL,
      } });
      await new Promise((r) => setTimeout(r, 4000));
      await s.close();
    } catch (e) {
      failed = String(e);
    }
    test.info().annotations.push({ type: 'failed with', description: failed.slice(0, 600) });
    // the fake hub is `exec -a "bise sbd" sleep`, whose environment ps doesn't show: it is caught as
    // the app's own sbd outside the test home; a real hub (its env visible) is caught as his real home
    expect(failed).toMatch(/real bise home|sbd outside the test home/);
    expect(failed).not.toMatch(/proof step|no '/);
  });
});
