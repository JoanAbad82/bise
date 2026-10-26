// The title bar's give-way order (designer m_45616, m_45674): the minis never shrink; the crumb's
// fact goes first, then the pill's short form, never a word cut mid-way.
import { describe, expect, it } from 'vitest';
import { cutCrumb, giveWay, STATUS_NARROW_PX } from './giveway';

describe('the title bar gives way', () => {
  it('room for all: nothing gives way', () => {
    expect(giveWay({ slot: 700, fact: 110, pill: 330, minis: 230 })).toEqual({ fact: false, narrow: false });
  });
  it('a little short: the fact goes first, the pill keeps its long words whole', () => {
    expect(giveWay({ slot: 500, fact: 110, pill: 330, minis: 230 })).toEqual({ fact: true, narrow: false });
  });
  it('shorter still: the fact gone and the pill in its short form (1000 with the pill, ui-review m_45670)', () => {
    expect(giveWay({ slot: 340, fact: 110, pill: 330, minis: 0 })).toEqual({ fact: false, narrow: false });
    expect(giveWay({ slot: 300, fact: 110, pill: 330, minis: 230 })).toEqual({ fact: true, narrow: true });
  });
  it('the long words never cut: whenever they don\'t fit whole, the short form', () => {
    for (let slot = 0; slot < 800; slot += 7) {
      const g = giveWay({ slot, fact: 0, pill: 330, minis: 0 });
      if (!g.narrow) expect(330).toBeLessThanOrEqual(slot);
    }
  });
  it('no pill: nothing gives way for the minis (the crumb\'s name cuts last, by the bar\'s flex)', () => {
    expect(giveWay({ slot: 100, fact: 110, pill: 0, minis: 230 })).toEqual({ fact: false, narrow: false });
  });
  it('under 160 px of room for the pill: its short form, as before', () => {
    expect(giveWay({ slot: STATUS_NARROW_PX + 10, fact: 0, pill: 100, minis: 20 }).narrow).toBe(true);
  });
});

describe('the crumb beside the minis (designer m_45727)', () => {
  const room = { name: 60, role: 180, minis: 200, pillShort: 90, pillSign: 24 };
  it('room for all: the role whole and the pill\'s short form', () => {
    expect(cutCrumb({ ...room, avail: 600 })).toEqual({ role: true, pill: 90 });
  });
  it('short: the role goes whole before the pill gives way; the name stays', () => {
    expect(cutCrumb({ ...room, avail: 400 })).toEqual({ role: false, pill: 90 });
  });
  it('shorter: the role out and the pill its sign alone', () => {
    expect(cutCrumb({ ...room, avail: 300 })).toEqual({ role: false, pill: 24 });
  });
  it('never a cut role: at every room, the role shows only when it fits whole', () => {
    for (let avail = 0; avail < 700; avail += 5) {
      const c = cutCrumb({ ...room, avail });
      if (c.role) expect(room.name + room.role + room.minis + c.pill).toBeLessThanOrEqual(avail);
    }
  });
  it('no minis in the bar: nothing changes for the crumb', () => {
    expect(cutCrumb({ ...room, minis: 0, avail: 10 })).toEqual({ role: true, pill: 90 });
  });
});
