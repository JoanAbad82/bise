// The ring on the floor under a lit bim (focus.ts; bims m_28199), in the office's own units. The
// followed bim's: a soft ring at the bim's scale. A row hovered's: a line that reads at any zoom
// (designer m_48539, m_48541): at least ROW_RING.minPx across, ROW_RING.linePx thick on screen, at
// 0.6 of the text's colour; at a close zoom the follow ring's size if that is bigger. Never the
// accent. Pure. Owner: bims-hover.

/** the followed bim's halo: the text's colour at low alpha */
export const HALO = { inner: 0.34, outer: 0.5, alpha: 0.28, day: '#1d1a17', night: '#f3ede4' } as const;
/** a hovered row's ring, in css px on screen */
export const ROW_RING = { minPx: 20, linePx: 1.5, alpha: 0.6 } as const;

export interface Ring {
  /** radii in world units */
  readonly inner: number;
  readonly outer: number;
  readonly alpha: number;
}

/** The ring under a bim lit from `from` at `scale` world units per css px. Pure. */
export function ringOf(from: 'row' | 'follow', scale: number): Ring {
  if (from === 'follow') return { inner: HALO.inner, outer: HALO.outer, alpha: HALO.alpha };
  const outer = Math.max(HALO.outer, (ROW_RING.minPx / 2) * scale);
  return { inner: Math.max(0, outer - ROW_RING.linePx * scale), outer, alpha: ROW_RING.alpha };
}
