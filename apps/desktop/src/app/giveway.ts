// The title bar's give-way order when room runs short (designer m_45616, m_45674): the coins'
// minis and their counts never shrink; first the crumb's fact ('· waits for you') goes, then the
// status pill takes its short form ('updating to v2026.10.3…'), never a word cut mid-way; last the
// crumb's name cuts with … (the bar's flex: the title keeps its width before the slot). Pure:
// widths in, what gives way out; Frame's StatusSlot measures and applies. Owner: amb-win (the
// slot), nm-side (the minis in it).

/** Under this much room for the pill, its short form (designer's desktop-notices v2). */
export const STATUS_NARROW_PX = 160;

/** What the bar holds, px. */
export interface BarRoom {
  /** the status slot's width with the crumb's fact shown */
  readonly slot: number;
  /** the room the crumb's fact takes (its width and its gap), 0 without one */
  readonly fact: number;
  /** the pill's width with its long words whole, 0 without a pill */
  readonly pill: number;
  /** the minis' width with their margins, 0 without them */
  readonly minis: number;
}

/** What gives way: the fact hidden, the pill in its short form. */
export interface GiveWay {
  readonly fact: boolean;
  readonly narrow: boolean;
}

/** The give-way for that room. Pure. */
export function giveWay(r: BarRoom): GiveWay {
  if (r.pill <= 0) return { fact: false, narrow: false };
  const need = r.pill + r.minis;
  if (need <= r.slot) return { fact: false, narrow: r.slot - r.minis < STATUS_NARROW_PX };
  if (r.fact > 0 && need <= r.slot + r.fact) return { fact: true, narrow: false };
  return { fact: r.fact > 0, narrow: true };
}
