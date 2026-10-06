// The core's stdout cut into lines (pure): chunks come in at any boundary,
// a line is only given out once its newline arrived.

/** The line feed (named: one JSON object per line both ways). */
export const NL = String.fromCharCode(10);
const CR = String.fromCharCode(13);

export class LineSplitter {
  private rest = '';

  /** The complete lines in `chunk` (with what was held before), without their newline. */
  feed(chunk: string): string[] {
    const parts = (this.rest + chunk).split(NL);
    this.rest = parts.pop() ?? '';
    return parts.map((l) => (l.endsWith(CR) ? l.slice(0, -1) : l));
  }

  /** What is held without a newline yet (dropped at the core's exit). */
  get pending(): string {
    return this.rest;
  }
}

/**
 * One line of the core as an event: a JSON object with a string `ev`, else
 * null (the caller logs it). Its shape is checked by the store, not here.
 */
export function eventOf(line: string): Record<string, unknown> | null {
  if (line.trim() === '') return null;
  try {
    const v: unknown = JSON.parse(line);
    if (typeof v === 'object' && v !== null && !Array.isArray(v) && typeof (v as { ev?: unknown }).ev === 'string') {
      return v as Record<string, unknown>;
    }
  } catch {
    // not JSON: null below
  }
  return null;
}

/**
 * A command from the renderer as one line for the core's stdin: an object
 * with a string `cmd`, else null (refused, never written).
 */
export function lineOf(cmd: unknown): string | null {
  if (typeof cmd !== 'object' || cmd === null || Array.isArray(cmd)) return null;
  if (typeof (cmd as { cmd?: unknown }).cmd !== 'string') return null;
  return JSON.stringify(cmd) + NL;
}
