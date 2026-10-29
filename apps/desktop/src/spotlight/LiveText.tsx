// bise's answer in the spotlight and the capsule, live or done (ambient's 'how an answer appears',
// signed by designer, m_12403):
//   - only the text new in an update fades in (opacity 0 -> 1, 180 ms, ease-out, no slide), its
//     words staggered by min(30 ms, 120 ms ÷ their count); once faded, they are plain text again
//     (their spans merge back), so nothing above re-animates or moves;
//   - no caret: the '∿' working sign rides after the last word with its pulse while it is live;
//   - an update that is not a continuation (rare: the final text differs) crossfades once, 120 ms;
//   - reduced motion, or the window not in front: no fade, the '∿' still.
// The shaping (bold, code, code box, table) is live.ts's.

import { useEffect, useMemo, useState, type CSSProperties, type JSX, type ReactNode } from 'react';
import { FADE_MS, STAGGER_SPAN_MS, answerRuns, fadeUnits, runsText, staggerOf, tableCols, tableRows, type Run } from './live';

interface Batch {
  readonly from: number;
  readonly to: number;
  /** each fading unit's start (a flat offset) -> its delay in ms */
  readonly delays: ReadonlyMap<number, number>;
}

/** The units of the new characters [from, to) over the runs, each with its delay. */
function batchOf(runs: readonly Run[], from: number, to: number): Batch {
  const starts: number[] = [];
  let at = 0;
  for (const r of runs) {
    const end = at + r.text.length;
    const a = Math.max(at, from);
    const b = Math.min(end, to);
    if (a < b) {
      let o = a;
      for (const u of fadeUnits(r.text.slice(a - at, b - at), r.style === 'block' || r.style === 'table')) {
        starts.push(o);
        o += u.length;
      }
    }
    at = end;
  }
  const step = staggerOf(starts.length);
  return { from, to, delays: new Map(starts.map((s, i) => [s, Math.round(i * step)])) };
}

const still = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches || !document.hasFocus();

/** One run's text, its settled part plain, its new units in fading spans keyed by their offset. */
function runPieces(text: string, at: number, settled: number, batches: readonly Batch[], lines: boolean): ReactNode[] {
  const out: ReactNode[] = [];
  const end = at + text.length;
  const plainTo = Math.min(end, Math.max(at, settled));
  if (plainTo > at) out.push(text.slice(0, plainTo - at));
  let o = plainTo;
  while (o < end) {
    const b = batches.find((x) => o >= x.from && o < x.to);
    const to = Math.min(end, b?.to ?? end);
    if (b === undefined) {
      out.push(text.slice(o - at, to - at));
    } else {
      for (const u of fadeUnits(text.slice(o - at, to - at), lines)) {
        const style = { '--d': `${b.delays.get(o) ?? 0}ms` } as CSSProperties;
        out.push(
          <span key={o} className="fade" style={style}>
            {u}
          </span>,
        );
        o += u.length;
      }
    }
    o = to;
  }
  return out;
}

/**
 * A table as the thread draws one (ambient m_12433): the ui font, the header in 600 over a 1 px
 * --c-line rule, tabular numbers, the columns fixed from the header (a grid per row with the
 * same columns, so a row that comes later never moves them). A row is the unit that fades.
 */
function Table({ text, at, settled, batches }: { text: string; at: number; settled: number; batches: readonly Batch[] }): JSX.Element {
  const rows = tableRows(text);
  const cols = { gridTemplateColumns: tableCols(rows[0] ?? []) } as CSSProperties;
  // each row's flat offset: the rows before it and their '\n'
  const starts = rows.reduce<number[]>((acc, cells, i) => [...acc, (acc[i] ?? at) + cells.join('\t').length + 1], [at]);
  return (
    <span className="table" role="table">
      {rows.map((cells, i) => {
        const start = starts[i] ?? at;
        const b = start >= settled ? batches.find((x) => start >= x.from && start < x.to) : undefined;
        // a new row's units start at its '\n' (the line before it) or at its first character
        const d = b?.delays.get(start) ?? b?.delays.get(start - 1) ?? 0;
        const style = b === undefined ? cols : ({ ...cols, '--d': `${String(d)}ms` } as CSSProperties);
        return (
          <span key={start} role="row" className={`tr${i === 0 ? ' th' : ''}${b === undefined ? '' : ' fade'}`} style={style}>
            {cells.map((c, j) => (
              <span key={j} role={i === 0 ? 'columnheader' : 'cell'}>
                {c}
              </span>
            ))}
          </span>
        );
      })}
    </span>
  );
}

interface View {
  /** the plain text shown */
  readonly flat: string;
  /** characters before this are plain text (their fade is over) */
  readonly settled: number;
  readonly batches: readonly Batch[];
  /** how many crossfades so far (a text that is not a continuation) */
  readonly swap: number;
}

/** The view after the text became `flat`: the new characters fade (or all settle when still). */
export function nextView(v: View, flat: string, runs: readonly Run[], still: boolean): View {
  if (flat === v.flat) return v;
  if (!flat.startsWith(v.flat)) return { flat, settled: flat.length, batches: [], swap: still ? v.swap : v.swap + 1 };
  if (still) return { ...v, flat, settled: flat.length, batches: [] };
  return { ...v, flat, batches: [...v.batches, batchOf(runs, v.flat.length, flat.length)] };
}

export function LiveText({ text, live, testId }: { text: string; live: boolean; testId?: string }): JSX.Element {
  const runs = useMemo(() => answerRuns(text, live), [text, live]);
  const flat = runsText(runs);
  const [view, setView] = useState<View>(() => ({ flat, settled: flat.length, batches: [], swap: 0 }));
  // the text changed: the new view at once, in this render (React's 'state from the previous render')
  if (flat !== view.flat) setView(nextView(view, flat, runs, still()));

  // once a batch's last unit faded, its characters are plain text again
  const newest = view.batches.at(-1);
  useEffect(() => {
    if (newest === undefined) return;
    const t = window.setTimeout(() => {
      setView((v) => ({ ...v, settled: Math.max(v.settled, newest.to), batches: v.batches.filter((x) => x.to > newest.to) }));
    }, STAGGER_SPAN_MS + FADE_MS + 20);
    return () => {
      window.clearTimeout(t);
    };
  }, [newest]);

  const starts = runs.reduce<number[]>((acc, r, i) => [...acc, (acc[i] ?? 0) + r.text.length], [0]);
  const body = runs.map((r, i) => {
    const start = starts[i] ?? 0;
    const pieces = runPieces(r.text, start, view.settled, view.batches, r.style === 'block' || r.style === 'table');
    switch (r.style) {
      case 'text':
        return pieces;
      case 'bold':
        return <strong key={`r${start}`}>{pieces}</strong>;
      case 'code':
        return <code key={`r${start}`}>{pieces}</code>;
      case 'block':
        return (
          <span key={`r${start}`} className="box">
            {pieces}
          </span>
        );
      case 'table':
        return <Table key={`r${start}`} text={r.text} at={start} settled={view.settled} batches={view.batches} />;
    }
  });
  // after a code box or a table, the '∿' sits in that block's bottom margin at the left edge,
  // out of the layout, so its leaving moves nothing (ambient m_12433); after text, inline
  const last = runs.at(-1)?.style;
  const after = last === 'block' || last === 'table';
  return (
    <span className={`b-live${view.swap > 0 ? ` swap${view.swap % 2}` : ''}`} data-testid={testId} data-live={live ? '1' : '0'}>
      {body}
      {live && (
        <span className={`sign${after ? ' after' : ''}${still() ? ' still' : ''}`} aria-hidden="true" data-testid={testId === undefined ? undefined : `${testId}.sign`}>
          {after ? '∿' : ' ∿'}
        </span>
      )}
    </span>
  );
}
