// The room the AGENTS head has for the cube's 'the bims' (his bug, bims-toggle: at the 320 bar
// with the office open the label wrapped under a clip and left an empty pill). Designer m_31047:
// decided by measure, not a width threshold: the label shows only when every part of the head fits
// whole ('AGENTS · N' uncut, '320 · wide', cube + label, 'all ›'); else the cube alone. Pure: the
// widths come from Cube.tsx's measure of the laid-out head. Owner: bims-toggle.

/** The head's widths in css px, each part's outer width (its margins in) at its natural size. */
export interface HeadRoom {
  /** the head's content box (its padding out) */
  readonly head: number;
  /** the title's natural width: its padding and 'AGENTS · N' whole, the ▾ slot in */
  readonly title: number;
  /** the head's other parts ('320 · wide', 'all ›'), never shrunk */
  readonly others: readonly number[];
  /** the cube's button without its label: padding, the 16 px cube, its margin */
  readonly cube: number;
  /** the label's own width and the gap before it */
  readonly label: number;
}

/** sub-pixel slack: a width measured whole fits when it is within this of the head */
const EPS = 0.5;

/** Whether 'the bims' fits beside the cube with every other part of the head whole. */
export function labelFits(r: HeadRoom): boolean {
  const need = r.title + r.others.reduce((n, w) => n + w, 0) + r.cube + r.label;
  return need <= r.head + EPS;
}
