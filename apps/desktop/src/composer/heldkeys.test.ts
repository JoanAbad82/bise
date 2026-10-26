// The held keys' list (designer m_44287): only bise's keys, in the drop order, one keycap per key.
import { describe, expect, it } from 'vitest';
import { heldPairs, type HeldState } from './heldkeys';

const NONE: HeldState = { fold: null, inbox: 0, itemOpen: false, code: false, agents: 0, thread: false, busy: false, typing: false, voice: false };
const ALL: HeldState = { fold: 'expand', inbox: 3, itemOpen: true, code: true, agents: 12, thread: true, busy: true, typing: false, voice: true };
const read = (mod: Parameters<typeof heldPairs>[0], s: HeldState) => heldPairs(mod, s).map((p) => p.caps.join(p.sep === '…' ? ' … ' : ' '));

describe('heldPairs', () => {
  it('⌃: stop, the inbox items, the next item, the folds, copy code, voice mode, terminal, in that order; ⌃R alone is the mic’s own keycap, never listed twice', () => {
    expect(read('Control', ALL)).toEqual(['⌃C', '⌃1 … ⌃3', '⌃N ⌃P', '⌃O', '⌃Y', '⌃R ⌃R', '⌃`']);
    expect(read('Control', NONE)).toEqual(['⌃`']);
    // one item: ⌃1 alone, no walk
    expect(read('Control', { ...NONE, inbox: 1, itemOpen: true })).toEqual(['⌃1', '⌃`']);
    expect(heldPairs('Control', { ...ALL, fold: 'collapse' }).find((p) => p.caps[0] === '⌃O')?.word).toBe('collapse');
  });

  it('⌥: the agents (9 at most), the agent above or below unless he types, newline', () => {
    expect(read('Alt', ALL)).toEqual(['⌥0 … ⌥9', '⌥↑ ⌥↓', '⌥⏎']);
    expect(read('Alt', { ...ALL, agents: 2, typing: true })).toEqual(['⌥0 … ⌥2', '⌥⏎']);
    expect(read('Alt', NONE)).toEqual(['⌥⏎']);
  });

  it('⌘: find, find in thread, stop, new project; never what every text field does', () => {
    expect(read('Meta', ALL)).toEqual(['⌘K', '⌘F', '⌘.', '⌘N']);
    expect(read('Meta', NONE)).toEqual(['⌘K', '⌘N']);
    const caps = heldPairs('Meta', { ...ALL, typing: true }).flatMap((p) => p.caps);
    for (const k of ['⌘C', '⌘X', '⌘V', '⌘A']) expect(caps).not.toContain(k);
  });
});
