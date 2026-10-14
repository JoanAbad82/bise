// The try app's swap from inside, its pure part (tryswap.ts, ambient-lead m_22832): where the
// swap script is, on which home it may run and with what, its answer read, the refusals.
import { describe, expect, it } from 'vitest';
import { firstLine, parseState, refusalWords, swapEnv, swapRefusal, tryBundle, versionCommit } from './tryswap';

const ME = '/Users/me';
const TRY = '/Users/me/.bise/dev/try-src/apps/desktop/dist/mac-arm64/bise try.app';

describe('tryBundle', () => {
  it("his try bundle: its checkout's scripts/desktop_try_swap.py", () => {
    expect(tryBundle(`${TRY}/Contents/MacOS/bise try`)).toEqual({ bundle: TRY, script: '/Users/me/.bise/dev/try-src/scripts/desktop_try_swap.py' });
  });
  it('a dev run, a candidate, his release app: none', () => {
    expect(tryBundle('/repo/apps/desktop/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')).toBeNull();
    expect(tryBundle('/b/desktop-cand/abc/dist/mac-arm64/bise cand.app/Contents/MacOS/bise cand')).toBeNull();
    expect(tryBundle('/Applications/bise.app/Contents/MacOS/bise')).toBeNull();
    expect(tryBundle(`${TRY}/Contents/Frameworks/x/bise try`)).toBeNull();
  });
});

describe('versionCommit', () => {
  it('the commit line of the runtime VERSION', () => {
    expect(versionCommit('id=root-e91f98d78363\ncommit=e91f98d7836320a31f275428424f80c783263379\nrepo=/x\n')).toBe('e91f98d7836320a31f275428424f80c783263379');
    expect(versionCommit('id=root-x\n')).toBeNull();
    expect(versionCommit(null)).toBeNull();
  });
});

describe('swapEnv', () => {
  it('his own run: his variables, never an agent one, no BISE_HOME', () => {
    const r = swapEnv({ HOME: ME, PATH: '/opt/bin:/usr/bin', SB_SOCKET: '/s', BISE_ROLE: 'x', BISE_HOME: '/Users/me/.bise', LANG: 'fr' }, ME);
    expect(r).toEqual({ env: { HOME: ME, PATH: '/opt/bin:/usr/bin', LANG: 'fr' } });
  });
  it('his own run with no PATH: the system one (python3 is found)', () => {
    expect(swapEnv({ HOME: ME }, ME)).toEqual({ env: { HOME: ME, PATH: '/usr/bin:/bin:/usr/sbin:/sbin' } });
  });
  it('the off-screen knob is a stand-in thing only', () => {
    expect(swapEnv({ HOME: ME, BISE_DESKTOP_OFFSCREEN: '1' }, ME)).toEqual({ env: { HOME: ME, PATH: '/usr/bin:/bin:/usr/sbin:/sbin' } });
  });
  it('a stand-in under ~/.bise/gate: its HOME (its build dir, its open), off-screen kept', () => {
    const h = '/Users/me/.bise/gate/amb-mac-swap/h';
    const r = swapEnv({ HOME: h, BISE_HOME: `${h}/.bise`, BISE_DESKTOP_OFFSCREEN: '1', PATH: '/usr/bin' }, ME);
    expect(r).toEqual({ env: { HOME: h, PATH: '/usr/bin', BISE_DESKTOP_OFFSCREEN: '1' } });
  });
  it('the try home, a stand-in outside the gate, a mixed one: a test app, no swap from here', () => {
    expect(swapEnv({ HOME: ME, BISE_HOME: '/Users/me/.bise/try/desktop' }, ME)).toEqual({ none: 'test_home' });
    expect(swapEnv({ HOME: '/tmp/h' }, ME)).toEqual({ none: 'test_home' });
    expect(swapEnv({ HOME: '/Users/me/.bise/gate' }, ME)).toEqual({ none: 'test_home' });
    expect(swapEnv({ HOME: '/Users/me/.bise/gate/x/h', BISE_HOME: ME + '/.bise' }, ME)).toEqual({ none: 'test_home' });
  });
});

describe('parseState', () => {
  it("the script's line", () => {
    expect(parseState('{"state": "staged", "live": "aaa1111", "staged": "bbb2222", "why": null}\n')).toEqual({
      state: 'staged',
      live: 'aaa1111',
      staged: 'bbb2222',
      why: null,
      none: null,
      failed: null,
    });
    expect(parseState('{"state":"current","live":"aaa1111","staged":null,"why":null}')?.state).toBe('current');
    expect(parseState('{"state":"none","live":null,"staged":null,"why":"no try build here"}')?.why).toBe('no try build here');
  });
  it('none says which (an older script: not_try); failed only on a staged state', () => {
    expect(parseState('{"state":"none","live":"a","staged":null,"why":"w"}')?.none).toBe('not_try');
    expect(parseState('{"state":"none","live":"a","staged":null,"why":"w","none":"not_gated","failed":null,"log":"/b/restart.log"}')?.none).toBe('not_gated');
    expect(parseState('{"state":"staged","live":"a","staged":"b","why":null,"none":null,"failed":"b"}')?.failed).toBe('b');
    expect(parseState('{"state":"current","live":"a","staged":null,"why":null,"none":null,"failed":"b"}')?.failed).toBeNull();
    expect(parseState('{"state":"none","live":"a","staged":null,"why":"w","none":"later"}')).toBeNull();
    expect(parseState('{"state":"staged","live":"a","staged":"b","why":null,"failed":3}')).toBeNull();
  });
  it('junk, an unknown state, staged without its commit (or the reverse): null', () => {
    for (const t of ['', 'nope', '[]', '{"error": "Traceback"}', '{"state":"ready","live":null,"staged":null,"why":null}',
      '{"state":"staged","live":"a","staged":null,"why":null}', '{"state":"current","live":"a","staged":"b","why":null}',
      '{"state":"current","live":3,"staged":null,"why":null}']) {
      expect(parseState(t), t).toBeNull();
    }
  });
});

describe('swapRefusal', () => {
  it('only a staged build swaps; otherwise which refusal', () => {
    expect(swapRefusal({ state: 'staged', live: 'a', staged: 'b', why: null })).toBeNull();
    expect(swapRefusal({ state: 'current', live: 'a', staged: null, why: null })).toBe('newest');
    expect(swapRefusal({ state: 'none', live: null, staged: null, why: 'x', none: 'not_gated' })).toBe('not_gated');
    expect(swapRefusal({ state: 'none', live: null, staged: null, why: 'x' })).toBe('not_try');
  });
});

describe('refusalWords', () => {
  it("designer's five rewritten sentences", () => {
    expect(refusalWords('newest', null)).toBe('nothing new to install: this is the newest build.');
    expect(refusalWords('not_gated', null)).toBe('nothing new to install: this is the newest build.');
    expect(refusalWords('test_home', null)).toBe("this app runs on a test home, not yours: it can't update itself.");
    expect(refusalWords('old_checkout', null)).toBe('this build is too old to update from here. the next try updates it.');
    expect(refusalWords('unreadable', 'Traceback (most recent call last):')).toBe("couldn't read the update's state: Traceback (most recent call last):");
    expect(refusalWords('not_started', 'spawn python3 ENOENT')).toBe("the update didn't start: spawn python3 ENOENT");
  });
  it('firstLine: the first non-empty line, trimmed', () => {
    expect(firstLine('\n  boom  \nmore')).toBe('boom');
    expect(firstLine('')).toBe('');
  });
});
