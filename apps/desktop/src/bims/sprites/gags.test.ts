// The home islands' laws (gags.ts, page bims-home v7): one island per section, the brief's weight in
// frames, every gag ending on the pose its bims then hold, the blink closing their eyes and nothing
// else, the bims and their bits never leaving the island, its own bims per gag, and no attention
// colour among the studio's own.
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
      expect(shut?.bims.length, s.id).toBe(open?.bims.length);
      shut?.bims.forEach((b, i) => {
        expect(b.rig.eyes, s.id).toBeLessThan(0.25);
        expect({ ...b.rig, eyes: 0 }, s.id).toEqual({ ...open?.bims[i]?.rig, eyes: 0 });
      });
      expect(shut?.bits, s.id).toEqual(open?.bits);
    }
  });

  it('the bims and their bits never leave the island', () => {
    const half = SLAB.w / 2 - 0.15;
    for (const s of ISLANDS) {
      for (const f of s.frames) {
        for (const b of f.bims) {
          expect(Math.abs(b.rig.x), s.id).toBeLessThan(half);
          expect(Math.abs(b.rig.z), s.id).toBeLessThan(half);
        }
        for (const { at: [x, , z] } of f.bits ?? []) {
          expect(Math.abs(x), s.id).toBeLessThan(half);
          expect(Math.abs(z), s.id).toBeLessThan(half);
        }
      }
    }
  });

  it('one island per section, in the page order', () => {
    expect(ISLANDS.map((s) => s.id)).toEqual(['ways', 'why', 'lead', 'arts', 'fun', 'hard', 'faq', 'end']);
  });

  it('the same bims all through a gag, and no bim on two islands', () => {
    const names = ISLANDS.map((s) => {
      const first = s.frames[0]?.bims.map((b) => b.name) ?? [];
      for (const f of s.frames) expect(f.bims.map((b) => b.name), s.id).toEqual(first);
      return first;
    });
    const all = names.flat();
    expect(new Set(all).size).toBe(all.length);
  });

  it('the studio adds no accent pink and no error red', () => {
    for (const c of STUDIO_COLOURS) expect(readsAsAttention(c), c).toBeUndefined();
  });
});
