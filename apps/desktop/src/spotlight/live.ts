// bise's answer as the spotlight and the capsule show it, while it streams and once it is done
// (ambient's 'how an answer appears', signed by designer, m_12403). Pure: the text -> runs of
// styled text, and which characters of an update are new (the words that fade in).
//
// Shaping: a light read of the markdown the answer is written in, enough for a small answer area:
//   - **bold** and `code` show styled; a mark still open never shows (plain until it closes);
//   - '# heading' shows bold without its #;
//   - a ``` block shows its lines in a code box; while live, its half line waits for its newline;
//   - a table shows once its separator line arrived, each row only once complete, the columns
//     padded to the header's widths (fixed: a row never shifts them);
//   - lists keep their dash.
// The runs' plain text never contains a mark, so an update that closes a mark keeps the shown
// text a prefix of the next one: only the new characters fade, the closed mark turns bold or
// code in place, with no fade.

export type RunStyle = 'text' | 'bold' | 'code' | 'block' | 'table';

export interface Run {
  readonly style: RunStyle;
  readonly text: string;
}

const FENCE = /^\s*```/;
const TABLE = /^\s*\|/;
const TABLE_SEP = /^\s*\|?\s*:?-{2,}/;

/** **bold**, `code`, a heading's #s; a mark still open is dropped, its text stays plain. */
export function inlineRuns(line: string): Run[] {
  const runs: Run[] = [];
  let style: 'text' | 'bold' | 'code' = 'text';
  let buf = '';
  let openAt = -1; // where in runs the open style's text starts (to undo it if never closed)
  const push = (s: RunStyle, t: string): void => {
    if (t === '') return;
    const last = runs.at(-1);
    if (last !== undefined && last.style === s) runs[runs.length - 1] = { style: s, text: last.text + t };
    else runs.push({ style: s, text: t });
  };
  const head = /^(#{1,6})\s+/.exec(line);
  if (head !== null) return inlineRuns(line.slice(head[0].length)).map((r) => (r.style === 'text' ? { style: 'bold', text: r.text } : r));
  for (let i = 0; i < line.length; i++) {
    if (style !== 'bold' && line[i] === '`') {
      push(style, buf);
      buf = '';
      if (style === 'code') style = 'text';
      else {
        style = 'code';
        openAt = runs.length;
      }
      continue;
    }
    if (style !== 'code' && line.startsWith('**', i)) {
      push(style, buf);
      buf = '';
      i++;
      if (style === 'bold') style = 'text';
      else {
        style = 'bold';
        openAt = runs.length;
      }
      continue;
    }
    buf += line.charAt(i);
  }
  if (style === 'text') push('text', buf);
  else {
    // never closed: its text plain, without the mark
    const open = runs.splice(openAt).map((r) => r.text).join('') + buf;
    push('text', open);
  }
  return runs;
}

const cells = (row: string): string[] => {
  const t = row.trim().replace(/^\|/, '').replace(/\|$/, '');
  return t.split('|').map((c) => c.trim());
};

/** A table run's rows and their cells (its text as tableText wrote it). */
export const tableRows = (text: string): string[][] => text.split('\n').map((r) => r.split('\t'));

/**
 * A table's columns for a CSS grid, fixed from its header so a row that comes later never moves
 * them: each its header's width plus a gap, 6 characters at least, in ch (a longer cell wraps).
 */
export const tableCols = (header: readonly string[]): string => header.map((h) => `${String(Math.max(6, h.length) + 2)}ch`).join(' ');

/**
 * A table's lines (header, separator, rows) as its run text: one line per row, its cells
 * tab-separated, as many as the header has. LiveText draws it as a grid (tableRows, tableCols).
 */
function tableText(lines: readonly string[]): string {
  const head = cells(lines[0] ?? '');
  const fmt = (cs: readonly string[]): string => head.map((_, i) => cs[i] ?? '').join('\t');
  return [fmt(head), ...lines.slice(2).map((l) => fmt(cells(l)))].join('\n');
}

/**
 * The runs of an answer. `live`: it is still being written, so its last line is not whole yet
 * (a code or table line waits for its newline).
 */
export function answerRuns(text: string, live: boolean): Run[] {
  const lines = text.split('\n');
  const lastWhole = live ? lines.length - 2 : lines.length - 1; // a live last line is not whole
  const out: Run[] = [];
  const add = (r: Run): void => {
    if (r.text === '' && r.style !== 'block') return;
    const last = out.at(-1);
    if (last !== undefined && last.style === r.style && r.style !== 'block' && r.style !== 'table') out[out.length - 1] = { style: r.style, text: last.text + r.text };
    else out.push(r);
  };
  // a line break between two prose lines; blocks (code, table) carry their own break
  let prose = false;
  const breakBefore = (): void => {
    if (prose) add({ style: 'text', text: '\n' });
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (FENCE.test(line)) {
      // a code box: the lines up to the closing fence (or the end)
      const code: string[] = [];
      let j = i + 1;
      while (j < lines.length && !FENCE.test(lines[j] ?? '')) {
        if (j <= lastWhole) code.push(lines[j] ?? '');
        j++;
      }
      prose = false;
      add({ style: 'block', text: code.join('\n') });
      i = j;
      continue;
    }
    if (TABLE.test(line)) {
      const rows: string[] = [];
      let j = i;
      while (j < lines.length && TABLE.test(lines[j] ?? '')) {
        if (j <= lastWhole) rows.push(lines[j] ?? '');
        j++;
      }
      // the header shows once its separator line arrived
      if (rows.length >= 2 && TABLE_SEP.test(rows[1] ?? '')) {
        prose = false;
        add({ style: 'table', text: tableText(rows) });
      }
      i = j - 1;
      continue;
    }
    breakBefore();
    for (const r of inlineRuns(line)) add(r);
    prose = true;
  }
  return out;
}

/** The plain text of runs (what a fade compares, update to update). */
export const runsText = (runs: readonly Run[]): string => runs.map((r) => r.text).join('');

/** Fade: 180 ms each, the units of one update staggered by min(30 ms, 120 ms ÷ their count). */
export const FADE_MS = 180;
export const STAGGER_SPAN_MS = 120;
export const staggerOf = (units: number): number => (units <= 0 ? 0 : Math.min(30, STAGGER_SPAN_MS / units));

/** The units that fade one after the other: words (with their trailing space), whole lines in a code box. */
export function fadeUnits(text: string, lines: boolean): string[] {
  return lines ? (text.match(/[^\n]*\n?/g) ?? []).filter((u) => u !== '') : (text.match(/\s*\S+\s*|\s+/g) ?? []);
}
