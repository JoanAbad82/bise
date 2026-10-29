import type { Width } from "./Frame";

/** What slid over the window, with the route and the width class it opened on. */
export interface Slid {
  readonly what: "side" | "panel";
  readonly at: string;
  readonly width: Width;
}

/**
 * What still slides over the window: the slid one while the route and the width class are the
 * ones it opened on, else nothing. A move closes it (he picked a row in it), and so does the
 * window crossing 1000 or 1100 px (try-gate dc4770c1: slid over at 800, then 1400, the docked
 * bar came under it with the scrim still taking every click). Back under 1000 it stays closed.
 */
export function overOf(
  slid: Slid | null,
  at: string,
  width: Width,
): "side" | "panel" | null {
  return slid !== null && slid.at === at && slid.width === width
    ? slid.what
    : null;
}
