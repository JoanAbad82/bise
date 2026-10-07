// Dictation's words in the field (bar I / 2.6, the TUI's dictation): each update carries the WHOLE
// text so far, and it REPLACES the dictated part (from where the dictation began), never appended.
// Pure: the op touches only the chars that changed (the common prefix stays, so the field's DOM
// text and the caret are not rewritten under him), and the caret stays where he is: at the end of
// the dictated words it follows their new end, after them it shifts by the change, before them it
// does not move.
import type { Op } from './mdlive';

/** The dictated part as it goes in the field: a space before it when it follows a word. */
export function dictated(words: string, before: string): string {
  const w = words.trim();
  if (w === '') return '';
  return before !== '' && !/\s$/u.test(before) ? ` ${w}` : w;
}

/** Replace the dictated part `old` (at `start`) by `next`, the caret (`caret`) kept as above. */
export function replaceOp(start: number, old: string, next: string, caret: number): Op | null {
  if (old === next) return null;
  let p = 0;
  while (p < old.length && p < next.length && old[p] === next[p]) p += 1;
  const end = start + old.length;
  const delta = next.length - old.length;
  const at = caret === end ? start + next.length : caret > end ? caret + delta : caret;
  return { from: start + p, to: end, insert: next.slice(p), caret: at };
}

/** A press of the dictation key shorter than this toggles the mic on; a longer hold is push-to-talk. */
export const HOLD_MS = 400;
