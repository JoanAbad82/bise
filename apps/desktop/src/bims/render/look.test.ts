// His bim's look (page bim-pick): the pref reads back what was written, the ready-made looks keep
// designer's rules (m_46521 5), a hat only where the hair takes it, and main's outfit carries the look.
import { describe, expect, it } from 'vitest';
import { COLORS, HAIRS, HAT_COLORS, READY, SKINS, TODAY, WEARS, anyLook, lookOf, mainOutfit, prefOf, sameLook, wearsFor, withHair } from './look';
import { CUTS, OWN, outfitOf } from './palette';
import { allColours } from './palette';

describe('his bim look', () => {
  it('reads back every look it writes, and nothing else', () => {
    for (const hair of HAIRS) for (const wear of wearsFor(hair)) {
      const l = { skin: 4, hair, color: 5, wear, hat: 2 };
      expect(lookOf(prefOf(l))).toEqual(l);
    }
    expect(lookOf(undefined)).toBeNull();
    expect(lookOf({ skin: 9, hair: 'short', color: 0, wear: 'none' })).toBeNull();
    expect(lookOf({ skin: 0, hair: 'fez', color: 0, wear: 'none' })).toBeNull();
    expect(lookOf({ skin: 0, hair: 'short', color: 0, wear: 'crown' })).toBeNull();
    // a hat the hair can't take (an older build's pick): bare-headed
    expect(lookOf({ skin: 0, hair: 'curls', color: 0, wear: 'cap' })).toEqual({ skin: 0, hair: 'curls', color: 0, wear: 'none', hat: 0 });
  });

  it('keeps the accessory colour; a look from before it, or one this build does not know, wears the sky blue', () => {
    for (let hat = 0; hat < HAT_COLORS.length; hat++) {
      const l = { ...TODAY, wear: 'cap' as const, hat };
      expect(lookOf(prefOf(l))).toEqual(l);
      expect(mainOutfit(l).hatColor).toBe(HAT_COLORS[hat]);
    }
    expect(HAT_COLORS[0]).toBe('#6cb4ee');
    expect(lookOf({ skin: 0, hair: 'short', color: 0, wear: 'beanie' })?.hat).toBe(0);
    expect(lookOf({ skin: 0, hair: 'short', color: 0, wear: 'beanie', hat: 99 })?.hat).toBe(0);
    expect(lookOf({ skin: 0, hair: 'short', color: 0, wear: 'beanie', hat: 'red' })?.hat).toBe(0);
    // every place his bim shows goes through mainOutfit: the headset's cups and a cut's hat too
    expect(mainOutfit({ ...TODAY, wear: 'headphones', hat: 2 })).toMatchObject({ hat: 'headphones', hatColor: HAT_COLORS[2] });
    expect(mainOutfit({ ...TODAY, hair: 'long', wear: 'beanie', hat: 4 })).toMatchObject({ cut: 'long', hat: 'beanie', hatColor: HAT_COLORS[4] });
    expect(sameLook({ ...TODAY, hat: 1 }, { ...TODAY, hat: 2 })).toBe(false);
  });

  it('puts a hat only where the hair takes it, and drops it when the hair changes', () => {
    expect(wearsFor('short')).toEqual(WEARS);
    for (const h of OWN) expect(wearsFor(h)).toEqual(['none']);
    expect(wearsFor('buns')).toEqual(['none']);
    expect(withHair({ ...TODAY, wear: 'cap' }, 'pigtails').wear).toBe('none');
    expect(withHair({ ...TODAY, wear: 'cap' }, 'long').wear).toBe('cap');
  });

  it('offers 12 ready-made looks: every skin twice, five bare-headed women, never one silhouette twice side by side', () => {
    expect(READY).toHaveLength(12);
    for (let i = 0; i < SKINS.length; i++) expect(READY.filter((l) => l.skin === i)).toHaveLength(2);
    expect(READY.filter((l) => (CUTS as readonly string[]).includes(l.hair) && l.wear === 'none').length).toBeGreaterThanOrEqual(4);
    const shape = (i: number): string => `${READY[i]?.hair ?? ''}/${READY[i]?.wear ?? ''}`;
    for (let i = 1; i < READY.length; i++) expect(shape(i)).not.toBe(shape(i - 1));
    for (const l of READY) expect(lookOf(prefOf(l))).toEqual(l);
    // skip picks among them, never one fixed look
    expect(new Set([0, 0.3, 0.6, 0.99].map((r) => READY.indexOf(anyLook(r)))).size).toBe(4);
  });

  it('dresses main in his look, keeping its ink hoodie, :* and chain', () => {
    expect(mainOutfit(null)).toEqual(outfitOf('main', true));
    const l = { skin: 5, hair: 'pigtails', color: 4, wear: 'none', hat: 0 } as const;
    const o = mainOutfit(l);
    expect(o).toMatchObject({ skin: SKINS[5], hair: COLORS[4], own: 'pigtails', cut: null, hat: 'bare', mark: true, hoodie: outfitOf('main', true).hoodie, kind: 'hoodie' });
    expect(mainOutfit({ ...l, hair: 'long', wear: 'beanie' })).toMatchObject({ cut: 'long', own: null, hat: 'beanie', mark: true });
    // short and bare-headed: main's own hat slot draws the hair, the :* and the chain
    expect(mainOutfit({ ...TODAY, skin: 5 })).toMatchObject({ hat: 'main', mark: false, skin: SKINS[5] });
    expect(sameLook(TODAY, { ...TODAY })).toBe(true);
  });

  it('draws only colours the world already may (never the accent or the error red)', () => {
    const ok = new Set(allColours());
    for (const c of [...SKINS, ...COLORS, ...HAT_COLORS]) expect(ok.has(c), c).toBe(true);
  });
});
