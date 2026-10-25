// The home islands' laws (gags.ts, prototype A of page bims-home v4): the brief's weight in frames,
// every gag ending on the pose its bim then holds, the blink closing its eyes and nothing else, the
// bim and its notes never leaving the island, one bim per gag, and no attention colour among the
// studio's own.
import { describe, expect, it } from 'vitest';
import { readsAsAttention } from '../render/palette.testkit';
import { ISLANDS, MAX_FRAMES, MIN_FRAMES, SLAB } from './gags';
import { STUDIO_COLOURS } from './studio';

describe('the home islands', () => {
  it('draw 8 to 16 frames each, and play them all but the blink', () => {
    for (const s of ISLANDS) {
      expect(s.frames.length, s.id).toBeGreaterThanOrEqual(MIN_FRAMES);
      expect(s.frames.length, s.id).toBeLessThanOrEqual(MAX_FRAMES);
      for (const i of s.seq) expect(s.frames[i], `${s.id} plays frame ${String(i)}`).toBeDefined();
      expect(new Set([...s.seq, s.blink]).size, s.id).toBe(s.frames.length);
    }
  });

  it('end on the pose their bim then holds', () => {
    for (const s of ISLANDS) expect(s.seq.at(-1), s.id).toBe(s.idle);
  });

  it('blink: the held pose with its eyes shut, nothing else', () => {
    for (const s of ISLANDS) {
      const open = s.frames[s.idle];
      const shut = s.frames[s.blink];
      expect(shut?.bim.rig.eyes, s.id).toBeLessThan(0.25);
      expect({ ...shut?.bim.rig, eyes: 0 }, s.id).toEqual({ ...open?.bim.rig, eyes: 0 });
    }
  });

  it('the bim and its notes never leave the island', () => {
    const half = SLAB.w / 2 - 0.15;
    for (const s of ISLANDS) {
      for (const f of s.frames) {
        expect(Math.abs(f.bim.rig.x), s.id).toBeLessThan(half);
        expect(Math.abs(f.bim.rig.z), s.id).toBeLessThan(half);
        for (const [x, , z] of f.notes ?? []) {
          expect(Math.abs(x), s.id).toBeLessThan(half);
          expect(Math.abs(z), s.id).toBeLessThan(half);
        }
      }
    }
  });

  it('one bim per gag, never the same on both', () => {
    const names = ISLANDS.map((s) => new Set(s.frames.map((f) => f.bim.name)));
    for (const n of names) expect(n.size).toBe(1);
    expect(new Set(names.flatMap((n) => [...n])).size).toBe(ISLANDS.length);
  });

  it('the studio adds no accent pink and no error red', () => {
    for (const c of STUDIO_COLOURS) expect(readsAsAttention(c), c).toBeUndefined();
  });
});
