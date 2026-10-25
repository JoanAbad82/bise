import { describe, expect, it } from 'vitest';
import type { Item } from '@/artifacts/model';
import { FOUND_MAX, launchMatches, looksLikeUrl } from './launch';
import { panelKeyOf, PANEL_KEYS } from './keys';

const item = (id: string, title: string, at: number, kind = 'page', agent = 'perf') =>
  ({ project: 'acme', projectName: 'acme', a: { id, title, kind, agent, at_ms: at, version: 1, url: '', new: false } }) as unknown as Item;

describe("the launcher's search (New tab, mockup 3)", () => {
  const items = [item('a', 'Perf notes', 1), item('b', 'Launch deck', 3, 'deck', 'docs'), item('c', 'perf bench', 2)];
  it('finds by every word in the title, the kind or the maker, newest first', () => {
    expect(launchMatches(items, 'perf').map((x) => x.a.id)).toEqual(['c', 'a']);
    expect(launchMatches(items, 'PERF notes').map((x) => x.a.id)).toEqual(['a']);
    expect(launchMatches(items, 'deck docs').map((x) => x.a.id)).toEqual(['b']);
  });
  it('finds nothing for no words, and caps the list', () => {
    expect(launchMatches(items, '  ')).toEqual([]);
    const many = Array.from({ length: 20 }, (_, i) => item(String(i), 'perf', i));
    expect(launchMatches(many, 'perf')).toHaveLength(FOUND_MAX);
  });
  it('tells an address from a search', () => {
    for (const u of ['localhost:5173', 'https://bise.dev', 'bise.dev/docs', 'http://127.0.0.1:4000/x']) expect(looksLikeUrl(u), u).toBe(true);
    for (const q of ['perf notes', 'perf', '', 'launch deck v2']) expect(looksLikeUrl(q), q).toBe(false);
  });
});

const key = (code: string, mods: { meta?: boolean; alt?: boolean; shift?: boolean; ctrl?: boolean } = {}) => ({
  code,
  key: '',
  metaKey: mods.meta ?? false,
  altKey: mods.alt ?? false,
  shiftKey: mods.shift ?? false,
  ctrlKey: mods.ctrl ?? false,
});

describe("the panel's keys (native-mac-qa §7, the launcher's rows)", () => {
  it('⌘T New tab; ⌘P Files; ⌘L Browser; ⌥⌘S Side thread; ⌥⌘D Changes', () => {
    expect(panelKeyOf(key('KeyT', { meta: true }), false)).toBe('new-tab');
    expect(panelKeyOf(key('KeyP', { meta: true }), false)).toBe('files');
    expect(panelKeyOf(key('KeyL', { meta: true }), false)).toBe('browser');
    expect(panelKeyOf(key('KeyS', { meta: true, alt: true }), false)).toBe('side');
    expect(panelKeyOf(key('KeyD', { meta: true, alt: true }), false)).toBe('changes');
  });
  it('⌘W and ⌘⇧[ ] are the open panel\'s only: folded, ⌘W stays the window\'s', () => {
    expect(panelKeyOf(key('KeyW', { meta: true }), true)).toBe('close-tab');
    expect(panelKeyOf(key('KeyW', { meta: true }), false)).toBeUndefined();
    expect(panelKeyOf(key('BracketRight', { meta: true, shift: true }), true)).toBe('next-tab');
    expect(panelKeyOf(key('BracketLeft', { meta: true, shift: true }), true)).toBe('prev-tab');
    expect(panelKeyOf(key('BracketLeft', { meta: true, shift: true }), false)).toBeUndefined();
  });
  it('leaves the other keys alone (⌘D the changes screen, ⌘K, a plain letter, ⌃T)', () => {
    expect(panelKeyOf(key('KeyD', { meta: true }), true)).toBeUndefined();
    expect(panelKeyOf(key('KeyK', { meta: true }), true)).toBeUndefined();
    expect(panelKeyOf(key('KeyT'), true)).toBeUndefined();
    expect(panelKeyOf(key('KeyT', { ctrl: true, meta: true }), true)).toBeUndefined();
  });
  it('the rows name the keys they answer to', () => {
    expect(PANEL_KEYS).toMatchObject({ files: '⌘P', terminal: '⌃`', side: '⌥⌘S', changes: '⌥⌘D', browser: '⌘L', toggle: '⌥⌘0' });
  });
});
