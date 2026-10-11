import { describe, expect, it } from 'vitest';
import { standInPaths } from './userdata';

const REAL = '/Users/gabriel';

describe('standInPaths (amb-tools m_18637: a stand-in HOME never writes his real Application Support)', () => {
  it('his own home, unset or relative: nothing moves (Electron keeps its own folders)', () => {
    expect(standInPaths({ HOME: REAL }, REAL, 'bise')).toBeNull();
    expect(standInPaths({ HOME: `${REAL}/` }, REAL, 'bise')).toBeNull();
    expect(standInPaths({}, REAL, 'bise')).toBeNull();
    expect(standInPaths({ HOME: 'h' }, REAL, 'bise')).toBeNull();
  });

  it("a stand-in HOME: userData, session data and crash dumps under its Library/Application Support/<name>, logs under its Library/Logs", () => {
    const h = `${REAL}/.bise/gate/real-shape/w/h`;
    expect(standInPaths({ HOME: h }, REAL, 'bise try')).toEqual({
      userData: `${h}/Library/Application Support/bise try`,
      sessionData: `${h}/Library/Application Support/bise try`,
      crashDumps: `${h}/Library/Application Support/bise try/Crashpad`,
      logs: `${h}/Library/Logs/bise try`,
      temp: `${h}/Library/Application Support/bise try/tmp`,
    });
  });

  it('his HOME with a bise home of its own (the try home, a gate home): the folders go under that bise home', () => {
    const t = `${REAL}/.bise/try/desktop`;
    expect(standInPaths({ HOME: REAL, BISE_HOME: t }, REAL, 'bise try')).toEqual({
      userData: `${t}/dev/desktop/bise try/userdata`,
      sessionData: `${t}/dev/desktop/bise try/userdata`,
      crashDumps: `${t}/dev/desktop/bise try/userdata/Crashpad`,
      logs: `${t}/dev/desktop/bise try/logs`,
      temp: `${t}/dev/desktop/bise try/tmp`,
    });
    expect(standInPaths({ BISE_HOME: `${REAL}/.bise` }, REAL, 'bise'), 'his own bise home: unchanged').toBeNull();
    expect(standInPaths({ BISE_HOME: `${REAL}/.bise/` }, REAL, 'bise')).toBeNull();
    expect(standInPaths({ BISE_HOME: 'rel' }, REAL, 'bise')).toBeNull();
  });

  it('nothing it gives is under his real Library, for any stand-in', () => {
    for (const env of [{ HOME: '/private/tmp/w/h' }, { HOME: '/private/tmp/w/h', BISE_HOME: '/private/tmp/w/h/.bise' }, { BISE_HOME: `${REAL}/.bise/gate/x/.bise` }]) {
      const p = standInPaths(env, REAL, 'bise');
      if (p === null) throw new Error(`a stand-in: ${JSON.stringify(env)}`);
      for (const v of [p.userData, p.sessionData, p.crashDumps, p.logs, p.temp]) expect(v.startsWith(`${REAL}/Library`)).toBe(false);
    }
  });
});
