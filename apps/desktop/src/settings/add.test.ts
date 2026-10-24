import { describe, expect, it } from 'vitest';
import type { Found, ProjectRow } from '@/proto';
import { addedRow, addLabel, addSay, brokenLine, foundSub, scanSay, WAIT_MS } from './add';

const row = (project: string, path: string): ProjectRow => ({ project, name: path.split('/').pop() ?? '', path, git: true, home: false, order: 1, agents: 1, working: 0, waits: 0, running: true });
const BROKEN = "bise's runtime is missing: no repl-live in /Applications/bise.app/Contents/Resources/bin. reinstall bise";

describe("the add sheet's waits never spin forever (ambient-lead m_18490)", () => {
  it('the scan looks, then says what it found, or why not', () => {
    const s = { answered: false, n: 0, error: null, broken: null, ms: 0 };
    expect(scanSay(s)).toEqual({ kind: 'looking', text: 'looking in your folders…' });
    expect(scanSay({ ...s, ms: 3_400 }).text).toBe('looking in your folders…');
    expect(scanSay({ ...s, answered: true, n: 2 })).toEqual({ kind: 'found', n: 2, text: 'found in your folders · 2' });
    expect(scanSay({ ...s, answered: true, n: 0 }).text).toBe('nothing new in your folders');
    expect(scanSay({ ...s, error: 'no such folder' })).toEqual({ kind: 'failed', text: '▲ the look in your folders failed: no such folder' });
    expect(scanSay({ ...s, ms: WAIT_MS })).toEqual({ kind: 'failed', text: "▲ bise didn't answer in 20 s" });
  });

  it("broken wins, in CoreLine's words, even over an answer", () => {
    expect(brokenLine(BROKEN)).toBe(`▲ bise can't start your projects: ${BROKEN}.`);
    expect(brokenLine('x.')).toBe("▲ bise can't start your projects: x.");
    expect(scanSay({ answered: true, n: 3, error: null, broken: BROKEN, ms: 0 })).toEqual({ kind: 'failed', text: brokenLine(BROKEN) });
  });

  it('the primary says what it adds', () => {
    expect(addLabel([])).toBe('add');
    expect(addLabel(['/Users/camille/code/shop/'])).toBe('add shop');
    expect(addLabel(['/a/x', '/a/y'])).toBe('add 2 projects');
  });

  it("an added path is its row: the same path, or a new row with the folder's name (the core's canonical path)", () => {
    const before = new Set(['acme-1']);
    const acme = row('acme-1', '/Users/camille/acme');
    const shop = row('shop-2', '/private/var/shop');
    expect(addedRow('/Users/camille/acme/', [acme], before)).toBe(acme);
    expect(addedRow('~/shop', [acme, shop], before)).toBe(shop);
    // an old row with the same folder name is not this add's
    expect(addedRow('/elsewhere/acme', [acme], before)).toBeUndefined();
  });

  it('add: adding, then added (every path in the list), or the refusal, broken, or no answer, naming what is not added', () => {
    const before = new Set(['acme-1']);
    const acme = row('acme-1', '/Users/camille/acme');
    const shop = row('shop-2', '/x/shop');
    const s = { paths: ['/x/shop', '/x/blog'], projects: [acme], before, error: null, broken: null, ms: 0 };
    expect(addSay(s)).toEqual({ kind: 'adding', text: 'adding 2 projects…' });
    expect(addSay({ ...s, paths: ['/x/shop'] })).toEqual({ kind: 'adding', text: 'adding shop… its main starts there' });
    expect(addSay({ ...s, projects: [acme, shop] }).kind).toBe('adding');
    expect(addSay({ ...s, projects: [acme, shop, row('blog-3', '/x/blog')] })).toMatchObject({ kind: 'added', rows: [shop, { project: 'blog-3' }] });
    expect(addSay({ ...s, projects: [acme, shop], error: 'not a folder' })).toEqual({ kind: 'failed', text: "▲ couldn't add blog: not a folder" });
    expect(addSay({ ...s, broken: BROKEN })).toEqual({ kind: 'failed', text: brokenLine(BROKEN) });
    expect(addSay({ ...s, ms: WAIT_MS })).toEqual({ kind: 'failed', text: "▲ bise didn't answer in 20 s: shop, blog isn't added" });
  });

  it("a found repo's line: its folder, git, and its day (shot 19's 'git · today')", () => {
    const now = Date.UTC(2026, 9, 11, 22);
    const f = (last_ms: number, git = true): Found => ({ name: 'shop', path: '/x/shop', git, known: false, last_ms });
    expect(foundSub(f(now - 3_600_000), now)).toBe('/x/shop · git · today');
    expect(foundSub(f(now - 86_400_000), now)).toBe('/x/shop · git · yesterday');
    expect(foundSub(f(now - 5 * 86_400_000, false), now)).toBe('/x/shop · 5 days ago');
  });
});
