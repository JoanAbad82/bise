import { describe, expect, it } from 'vitest';
import { inside, testHomeProblem } from './testhome';

const real = '/Users/camille';
const run = '/Users/camille/.bise/gate/run-1/home';

describe('testHomeProblem (the throwaway home of a test run)', () => {
  it('a throwaway HOME with BISE_HOME and the workspace inside it: ok', () => {
    expect(testHomeProblem({ HOME: run, BISE_HOME: `${run}/.bise`, BISE_DESKTOP_WORKSPACE: `${run}/bise` }, real)).toBeNull();
    expect(testHomeProblem({ HOME: '/private/tmp/t1', BISE_HOME: '/private/tmp/t1/.bise' }, real)).toBeNull();
  });

  it('his real home, or a folder holding it, is refused (the 22:33 run)', () => {
    expect(testHomeProblem({ HOME: real, BISE_HOME: `${real}/.bise` }, real)).toMatch(/real home/);
    expect(testHomeProblem({ HOME: '/Users', BISE_HOME: '/Users/x' }, real)).toMatch(/real home/);
    expect(testHomeProblem({ HOME: `${real}/`, BISE_HOME: `${real}/.bise` }, real)).toMatch(/real home/);
  });

  it('no HOME, a relative one, no BISE_HOME, or one outside HOME: refused', () => {
    expect(testHomeProblem({}, real)).toMatch(/HOME is not set/);
    expect(testHomeProblem({ HOME: 'tmp/h' }, real)).toMatch(/HOME is not set/);
    expect(testHomeProblem({ HOME: run }, real)).toMatch(/BISE_HOME is not set/);
    expect(testHomeProblem({ HOME: run, BISE_HOME: `${real}/.bise` }, real)).toMatch(/BISE_HOME .* outside/);
    expect(testHomeProblem({ HOME: run, BISE_HOME: `${run}/../../.bise` }, real)).toMatch(/BISE_HOME .* outside/);
  });

  it("a workspace outside the test home (his ~/bise) is refused; '' (the home workspace) is ok", () => {
    expect(testHomeProblem({ HOME: run, BISE_HOME: `${run}/.bise`, BISE_DESKTOP_WORKSPACE: `${real}/bise` }, real)).toMatch(/WORKSPACE .* outside/);
    expect(testHomeProblem({ HOME: run, BISE_HOME: `${run}/.bise`, BISE_DESKTOP_WORKSPACE: '' }, real)).toBeNull();
  });
});

describe('BISE_TEST_HOME (the jail every bise of the run obeys)', () => {
  it('when the harness sets it, HOME must be inside it', () => {
    expect(testHomeProblem({ HOME: run, BISE_HOME: `${run}/.bise`, BISE_TEST_HOME: run }, real)).toBeNull();
    expect(testHomeProblem({ HOME: run, BISE_HOME: `${run}/.bise`, BISE_TEST_HOME: '/private/tmp/other' }, real)).toMatch(/outside BISE_TEST_HOME/);
  });
});

describe('inside', () => {
  it('same folder, a child, never a sibling with the same prefix or a .. escape', () => {
    expect(inside('/a/b', '/a/b')).toBe(true);
    expect(inside('/a/b/c', '/a/b')).toBe(true);
    expect(inside('/a/bc', '/a/b')).toBe(false);
    expect(inside('/a/b/../c', '/a/b')).toBe(false);
    expect(inside('a/b', '/a')).toBe(false);
  });
});
