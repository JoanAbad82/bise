// The extensions' kept mark (ext-keep.ts): read back as it was written, junk as none, never lowered.
import { describe, expect, it } from 'vitest';
import { needOfKept } from './ext-keep';
import { NO_NEED } from './extensions';

describe("the extensions' kept mark", () => {
  it('reads a kept need back, and anything else as none', () => {
    expect(needOfKept({ wing: 4, garden: true })).toEqual({ wing: 4, garden: true });
    expect(needOfKept({ wing: 3 })).toEqual({ wing: 3, garden: false });
    for (const junk of [null, undefined, 3, 'wing', [], { wing: -1 }, { wing: Number.NaN }, { garden: 'yes' }]) expect(needOfKept(junk)).toEqual(NO_NEED);
  });
});
