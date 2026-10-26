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

/** What the crumb and the pill keep beside the minis, px. */
export interface CrumbRoom {
  /** the room the crumb and the status slot share */
  readonly avail: number;
  /** the crumb's name with its lead padding */
  readonly name: number;
  /** its role ('profiling the hub · acme') and its gap, 0 without one */
  readonly role: number;
  readonly minis: number;
  /** the pill's short form, and its sign alone; 0 without a pill */
  readonly pillShort: number;
  readonly pillSign: number;
}

/**
 * Beside the minis, nothing is cut mid-word (designer m_45727): the crumb's role shows whole or
 * not at all, before the pill's short form gives way to its sign alone; the name always stays.
 * `role`: the role shows; `pill`: the room the pill keeps (its short form, else its sign). Pure.
 */
export function cutCrumb(r: CrumbRoom): { readonly role: boolean; readonly pill: number } {
  if (r.minis <= 0) return { role: true, pill: r.pillShort };
  const role = r.role > 0 && r.name + r.role + r.minis + r.pillShort <= r.avail;
  const pill = r.name + (role ? r.role : 0) + r.minis + r.pillShort <= r.avail ? r.pillShort : r.pillSign;
  return { role, pill };
}
