// An esc the composer leaves free. ProseMirror preventDefaults every Escape
// in its field (prosemirror-view's captureKeyDown), so a blank composer with
// nothing for its screen to do cannot say "not mine" the usual way; it marks
// the event here instead, and the window's esc-up (src/app/esc-up.ts) reads
// it as free: esc goes up the hierarchy (designer's desktop-history).
// Owner: amb-web.

const free = new WeakSet<Event>();

/** The composer took no act on this esc: the window may use it. */
export function freeEscape(e: Event): void {
  free.add(e);
}

/** Nobody took this esc: not prevented, or prevented by a field that left it free. */
export function escapeIsFree(e: Event): boolean {
  return !e.defaultPrevented || free.has(e);
}
