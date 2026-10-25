// The home gags' laws (gags.ts, page bims-home): the brief's weight in frames, every gag ending on the
// pose its bim holds, the blink closing its eyes, the skater's path step by step, the 4 phone gags,
// and no attention colour among the studio's own.
import { describe, expect, it } from 'vitest';
import { readsAsAttention } from '../render/palette.testkit';
import { MAX_FRAMES, MIN_FRAMES, SHEETS, idleFrames } from './gags';
import { STUDIO_COLOURS } from './studio';

describe('the home gags', () => {
  it('draw 8 to 16 frames each, and play only those', () => {
    for (const s of SHEETS) {
      expect(s.frames.length, s.id).toBeGreaterThanOrEqual(MIN_FRAMES);
      expect(s.frames.length, s.id).toBeLessThanOrEqual(MAX_FRAMES);
      for (const i of s.seq) expect(s.frames[i], `${s.id} plays frame ${String(i)}`).toBeDefined();
      // every frame drawn is played: none weighs for nothing
      expect(new Set(s.seq).size, s.id).toBe(s.frames.length);
    }
  });

  it('end on the pose their bim then holds', () => {
    for (const s of SHEETS) expect(s.seq.at(-1), s.id).toBe(s.idle);
  });

  it('blink: the idle sheet is its pose, then the same with its eyes shut', () => {
    for (const s of SHEETS) {
      const [open, shut] = idleFrames(s);
      expect(open, s.id).toBe(s.frames[s.idle]);
      for (const b of shut?.bims ?? []) expect(b.rig.eyes, s.id).toBeLessThan(0.25);
      expect(shut?.bims.map((b) => ({ ...b.rig, eyes: 0 })), s.id).toEqual(open?.bims.map((b) => ({ ...b.rig, eyes: 0 })));
    }
  });

  it('the skater moves along its path at each step, never back, and stops at its end', () => {
    for (const s of SHEETS.filter((x) => x.travel)) {
      const t = s.travel ?? [];
      expect(t.length, s.id).toBe(s.seq.length);
      t.forEach((u, i) => {
        expect(u, `${s.id} step ${String(i)}`).toBeGreaterThanOrEqual(t[i - 1] ?? 0);
      });
      expect(t.at(-1), s.id).toBe(1);
    }
  });

  it('on a phone: desktop or terminal?, babysit robots, it talks back and the end', () => {
    expect(SHEETS.filter((s) => s.phone).map((s) => s.id)).toEqual(['ways-sit', 'ways-climb', 'why', 'fun', 'end']);
  });

  it('one bim per agent name: no two gags share a bim', () => {
    const names = SHEETS.flatMap((s) => [...new Set(s.frames.flatMap((f) => f.bims.map((b) => b.name)))]);
    expect(new Set(names).size).toBe(names.length);
  });

  it('the studio adds no accent pink and no error red', () => {
    for (const c of STUDIO_COLOURS) expect(readsAsAttention(c), c).toBeUndefined();
  });
});
