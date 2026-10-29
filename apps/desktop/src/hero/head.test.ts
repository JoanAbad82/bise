// checkout's hair in the hero (Gabriel m_46420, hero-hair): the film's own look over its name's,
// never a palette change, so an agent named checkout in his own projects keeps its own.
import { describe, expect, it } from 'vitest';
import { herHair, outfitOf } from '../bims/render/palette';
import { outfitWithHead } from '../bims/render/office-scene';
import { ACME, CHECKOUT_HEAD, HARNESS, headOf, KILN } from './cast';

describe("the hero cast's heads", () => {
  it('checkout in kiln wears the picked cut, bare-headed, its clothes and colours its name\'s', () => {
    expect(headOf(KILN, 'checkout')).toEqual(CHECKOUT_HEAD);
    const own = outfitOf('checkout', false);
    const film = outfitWithHead('checkout', false, headOf(KILN, 'checkout'));
    expect(film).toEqual({ ...own, cut: CHECKOUT_HEAD.cut, hat: CHECKOUT_HEAD.hat });
    expect(film?.cut).not.toBe(own.cut);
  });

  it("the palette is unchanged: checkout's name still draws its 'long' cut outside the film", () => {
    expect(herHair('checkout')?.cut).toBe('long');
    expect(outfitOf('checkout', false).cut).toBe('long');
  });

  it('no head set: the bim keeps its own (another office, another bim, main)', () => {
    expect(headOf(HARNESS, 'checkout')).toBeUndefined();
    expect(headOf(ACME, 'search')).toBeUndefined();
    expect(headOf(KILN, 'cart')).toBeUndefined();
    expect(outfitWithHead('cart', false, undefined)).toBeUndefined();
    expect(outfitWithHead('main', true, CHECKOUT_HEAD)).toBeUndefined();
  });
});
