// The terminal panel's rules, pure (bar T W25/V13/K26/M16): its height when
// dragged, which keys are the shell's, how a paste is cut for main's 64 kB
// writes. Owner: amb-win. The view is Terminal.tsx; the shells are main's
// (src/main/term).

/** The panel's height when he never dragged it (px). */
export const DEFAULT_H = 240;
/** The smallest panel: a few lines of the shell. */
export const MIN_H = 80;
/** What the panel always leaves above it for the screen (the thread, its composer). */
export const KEEP_ABOVE = 200;

/** A height that fits: at least MIN_H, at most what leaves KEEP_ABOVE for the screen. */
export function clampHeight(h: number, avail: number): number {
  const max = Math.max(MIN_H, avail - KEEP_ABOVE);
  if (!Number.isFinite(h)) return Math.min(DEFAULT_H, max);
  return Math.round(Math.min(max, Math.max(MIN_H, h)));
}

/** Dragging the panel's top edge from `startY` to `y`: up makes it taller (M16). */
export function dragHeight(startH: number, startY: number, y: number, avail: number): number {
  return clampHeight(startH + (startY - y), avail);
}

export interface KeyLike {
  readonly code: string;
  readonly key: string;
  readonly metaKey: boolean;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
}

/** ⌃` shows or hides the panel (the TUI's key; the menu's View > Terminal). */
export function isToggleKey(e: KeyLike): boolean {
  return e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && (e.code === 'Backquote' || e.key === '`');
}

/**
 * While the shell has the focus every key is its own (⌥ numbers, ctrl+y,
 * esc, End...), except ⌘ keys (⌘C / ⌘V copy and paste, ⌘K, ⌘1...: the app's)
 * and ⌃` (hides the panel). True: the shell takes it.
 */
export function shellTakes(e: KeyLike): boolean {
  return !e.metaKey && !isToggleKey(e);
}

/** Max UTF-16 units a write carries: 3 bytes each at most in UTF-8, under main's 64 kB. */
export const WRITE_UNITS = 16_384;

/** A paste cut in writes main takes (≤ 64 kB of UTF-8), never inside a surrogate pair. */
export function writesOf(data: string, units = WRITE_UNITS): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < data.length) {
    let end = Math.min(data.length, i + units);
    if (end < data.length && end > i + 1) {
      const c = data.charCodeAt(end - 1);
      if (c >= 0xd800 && c <= 0xdbff) end -= 1;
    }
    out.push(data.slice(i, end));
    i = end;
  }
  return out;
}

/** The project the panel's shell runs in: the route's, else bise's own (home). */
export function shellProject(routeProject: string | undefined, home: string | undefined): string | undefined {
  return routeProject ?? home;
}
