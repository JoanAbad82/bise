// src/composer/float · how the floating composer fits its max height (designer m_45666, his
// m_45466). Pure: from what the float measures, its layout and what gives way, in this order: his
// field (down to 4 lines, then it scrolls), then the attachment list (2 rows and '+ N more'),
// then the open question's own text (inbox.css .ic-q), last the inbox's other lines (its head and
// the other items' rows fold away); the float's head and the question's options never give way. Host.tsx measures and writes the answer on the float. Owner: composer-grow.

/** The lines the field keeps before anything else gives way. */
export const FIELD_MIN_LINES = 4;
/** The attachment rows kept once the list gives way ('+ N more' under them). */
export const ATTACH_CUT_ROWS = 2;
/** The rows the list shows before it scrolls (composer.css .b-attach). */
const ATTACH_MAX_ROWS = 4;

/** What the float measures, in px. */
export interface FloatSizes {
  /** the float's max height (--float-max-h) */
  readonly maxH: number;
  /** everything but the field and the attachment list, at its natural height (the open question whole) */
  readonly rest: number;
  /** his words' natural height (the field's scrollHeight) */
  readonly words: number;
  /** one line of the field */
  readonly line: number;
  /** the field's own cap, with room to spare */
  readonly cap: number;
  /** the attachment rows, their height and the list's own rule and margins */
  readonly rows: number;
  readonly rowH: number;
  readonly listChrome: number;
  /** the open question's text, which scrolls down to nothing (counted in `rest`) */
  readonly question: number;
  /** the inbox's other lines around the open item: its head, the other items (counted in `rest`) */
  readonly others: number;
}

/** The field's max height, whether the attachment list is cut to 2 rows, whether the inbox's other lines fold. */
export interface FloatFit {
  readonly fieldMax: number;
  readonly cutAttach: boolean;
  readonly foldOthers: boolean;
}

/** The list's height with `shown` rows at most (and its '+ N more' row when some are hidden). */
function listH(s: FloatSizes, shown: number): number {
  if (s.rows === 0) return 0;
  const more = s.rows > shown && shown === ATTACH_CUT_ROWS ? 1 : 0;
  return (Math.min(s.rows, shown) + more) * s.rowH + s.listChrome;
}

/** How the float fits: the field takes the room left up to its cap, never under 4 lines; when his
 *  words can't keep 4 lines, the list is cut to 2 rows; what still doesn't fit is the question's
 *  text (it scrolls), and past it the inbox's other lines fold. Pure. */
export function floatFit(s: FloatSizes): FloatFit {
  const keep = Math.min(s.words, FIELD_MIN_LINES * s.line);
  const whole = s.maxH - s.rest - listH(s, ATTACH_MAX_ROWS);
  const cutAttach = whole < keep && s.rows > ATTACH_CUT_ROWS;
  const room = cutAttach ? s.maxH - s.rest - listH(s, ATTACH_CUT_ROWS) : whole;
  const fieldMax = Math.max(FIELD_MIN_LINES * s.line, Math.min(s.cap, room));
  const over = keep - room;
  return { fieldMax, cutAttach, foldOthers: s.others > 0 && over > s.question };
}

/**
 * Whether the float lays its box out as the docked one (his words on their own lines, '+' at the
 * left and mic + send at the right on a row under them): once his words take a second line or an
 * attachment is in, until the draft is empty again (so a line that fits the wider field never
 * flips it back and forth). Pure.
 */
export function floatTall(was: boolean, now: { lines: number; attached: boolean; empty: boolean }): boolean {
  if (now.attached || now.lines > 1) return true;
  if (now.empty) return false;
  return was;
}
