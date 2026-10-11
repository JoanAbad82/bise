// The static law of an off-screen run (amb-tools m_18837, ambient-lead m_18841): under
// BISE_DESKTOP_OFFSCREEN nothing in main can ask him a permission or post to him. It reads main's
// sources: every API that makes macOS ask (or show) something is either absent or sits behind the
// knob's check in the same function. A new call site fails here until it says what it does under
// the knob.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MIC_CMDS, noAsks, offscreenGrants } from './offscreen';

const MAIN = __dirname;

function sources(dir: string): Array<{ file: string; text: string }> {
  const out: Array<{ file: string; text: string }> = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...sources(p));
    else if (n.endsWith('.ts') && !n.endsWith('.test.ts')) out.push({ file: relative(MAIN, p), text: readFileSync(p, 'utf8') });
  }
  return out;
}

const ALL = sources(MAIN);

/** The body around `at`: from the nearest function or method start before it. */
function enclosing(text: string, at: number): string {
  const starts = ['\nexport function ', '\nfunction ', '\n  private ', '\n  async ', '\n  const ', '\n  ipcMain.', '\n  test('];
  const from = Math.max(...starts.map((s) => text.lastIndexOf(s, at)));
  return text.slice(Math.max(0, from), at);
}

function sites(token: string): Array<{ file: string; before: string }> {
  const out: Array<{ file: string; before: string }> = [];
  for (const { file, text } of ALL) {
    let i = text.indexOf(token);
    while (i !== -1) {
      out.push({ file, before: enclosing(text, i) });
      i = text.indexOf(token, i + token.length);
    }
  }
  return out;
}

describe('an off-screen run asks him nothing (static)', () => {
  it('no main code asks macOS for a privacy permission directly', () => {
    for (const api of ['askForMediaAccess', 'getMediaAccessStatus', 'isTrustedAccessibilityClient', 'desktopCapturer', 'systemPreferences.']) {
      expect(sites(api).map((s) => s.file), `${api} would ask him: put it behind noAsks first`).toEqual([]);
    }
  });

  it('every notification posted is behind the knob in its own function', () => {
    const posts = sites('new Notification(');
    expect(posts.length).toBeGreaterThan(0);
    for (const p of posts) expect(p.before, `${p.file}: a notification without the knob's check`).toMatch(/quiet/);
  });

  it('the helper (fn tap, TCC preflights) starts only past the knob', () => {
    const made = sites('new Helper(');
    expect(made.map((s) => s.file)).toEqual([join('helper', 'run.ts')]);
    // the whole of startHelper up to where it makes the helper
    const run = ALL.find((s) => s.file === join('helper', 'run.ts'))?.text ?? '';
    const body = run.slice(run.indexOf('export function startHelper('), run.indexOf('new Helper('));
    expect(run, 'the pages see every permission granted').toMatch(/quiet \? \[GRANTED\]/);
    expect(body, 'startHelper checks noAsks before it makes the helper').toMatch(/noAsks\(process\.env, testMode\)[\s\S]*quiet \? null : helperPath/);
  });

  it("a page's permission requests are answered by offscreenGrants under the knob", () => {
    const ipc = ALL.find((s) => s.file === 'ipc.ts')?.text ?? '';
    expect(ipc).toMatch(/if \(noAsks\(process\.env, testMode\)\) \{[\s\S]*setPermissionCheckHandler\(\(_wc, permission\) => offscreenGrants\(permission\)\)[\s\S]*done\(offscreenGrants\(permission\)\)/);
  });

  it('the core never gets a mic command under the knob, before anything else sees it', () => {
    const core = ALL.find((s) => s.file === join('core', 'ipc.ts'))?.text ?? '';
    const drop = core.indexOf('MIC_CMDS.has(name)');
    expect(drop, 'core/ipc.ts drops the mic commands').toBeGreaterThan(-1);
    expect(drop < core.indexOf('dictations.sent(e.sender.id, cmd)')).toBe(true);
  });
});

describe('the knob\'s rules (pure)', () => {
  it('noAsks follows the knob, never in test mode', () => {
    expect(noAsks({ BISE_DESKTOP_OFFSCREEN: '1' }, false)).toBe(true);
    expect(noAsks({}, false)).toBe(false);
    expect(noAsks({ BISE_DESKTOP_OFFSCREEN: '1' }, true)).toBe(false);
  });
  it('only the clipboard passes; mic, camera, screen and notifications are denied', () => {
    for (const p of ['clipboard-sanitized-write', 'clipboard-read']) expect(offscreenGrants(p)).toBe(true);
    for (const p of ['media', 'display-capture', 'notifications', 'geolocation', 'midi', 'speaker-selection']) expect(offscreenGrants(p)).toBe(false);
  });
  it('the commands that open the mic in the core', () => {
    expect([...MIC_CMDS].sort()).toEqual(['dictate_start', 'talk_start', 'voice_mode']);
  });
});
