import { describe, expect, it } from 'vitest';
import { restartTail, sameVersion, tailWords, type AppBuild } from './restart';

const LIVE = 'e91f98d7836a1b2c3d4e5f60718293a4b5c6d7e8';
const build = (state: AppBuild['state'], live: string | null = LIVE): AppBuild => ({ state, live, staged: state === 'staged' ? '5a5a5a5a' : null, why: null });

describe('the restart row says the truth (ambient-lead m_22833)', () => {
  it('a staged build: a newer one is ready, whatever the hub runs', () => {
    const t = restartTail(build('staged'), '041168b2');
    expect(t).toEqual({ kind: 'staged', live: 'e91f98d7' });
    expect(t === null ? '' : tailWords(t)).toBe('this app is e91f98d7, a newer one is ready');
  });

  it('nothing staged, another version than the hub: it updates at the next try', () => {
    const t = restartTail(build('current'), '041168b2');
    expect(t === null ? '' : tailWords(t)).toBe('this app is e91f98d7 · it updates at the next try');
  });

  it("the same version, no live build (dev, test), an app that can't swap, or the hub's version unknown: the hub's line alone", () => {
    expect(restartTail(build('current'), 'e91f98d7')).toBeNull();
    expect(restartTail(build('current', null), '041168b2')).toBeNull();
    expect(restartTail(build('none'), '041168b2')).toBeNull();
    expect(restartTail(build('current'), null)).toBeNull();
    expect(restartTail(null, '041168b2')).toBeNull();
  });

  it('a short id and its full sha are the same version', () => {
    expect(sameVersion(LIVE, 'E91F98D7')).toBe(true);
    expect(sameVersion('e91f98d7', LIVE)).toBe(true);
    expect(sameVersion(LIVE, '041168b2')).toBe(false);
    expect(sameVersion('', LIVE)).toBe(false);
  });
});
