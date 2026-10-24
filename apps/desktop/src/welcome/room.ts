// The welcome's office gives way first (designer m_38760): its height is what the slot has left
// after the legend, the lead's message and the ideas; under 120 px it hides (its pins with it, the
// legend keeps its numbers), and only then the slot scrolls. Pure. Owner: project-home.

/** under this height the office hides */
export const OFFICE_MIN_H = 120;

/**
 * The office's height in the welcome, or null when it hides: `slot` is the height the welcome may
 * take, `words` the height of its words (legend, message, ideas), `gap` the space between the
 * office and the words.
 */
export function officeRoom(slot: number, words: number, gap: number): number | null {
  const room = Math.floor(slot - words - gap);
  return room < OFFICE_MIN_H ? null : room;
}
