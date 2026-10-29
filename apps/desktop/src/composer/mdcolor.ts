// The colors of live markdown in the composer (B9/W8, the TUI's mdlive.rs + syntax.rs, simpler):
// a ``` block's fences dim, its code colored by his bubble's own rule (thread/Code.tsx codeLines:
// prism and the bubble's THEME, so a block looks the same in both; a bare fence's block gray,
// code-fences), and in prose the list markers, headings and `inline code`. Pure: lines in, each
// line's runs out (text and a class or a code style, adjacent runs of one class merged);
// pm/colors.ts draws them as decorations.
import type { CSSProperties } from 'react';
import { codeLines } from '@/thread/Code';
import { item, lineKinds } from './mdlive';

export type Cls = 'fence' | 'mark' | 'code' | 'head';

export interface Run {
  readonly text: string;
  readonly cls: Cls | null;
  /** a code run's look, the bubble's (codeLines) as an inline style; none for plain code */
  readonly css?: string;
}

/** A React style as inline css text ('font-weight: 700; color: var(--x)'). Pure. */
export function cssText(style: CSSProperties): string {
  return Object.entries(style)
    .map(([k, v]) => `${k.replace(/[A-Z]/gu, (c) => `-${c.toLowerCase()}`)}: ${String(v)}`)
    .join('; ');
}

function push(out: Run[], text: string, cls: Cls | null): void {
  if (text === '') return;
  const last = out[out.length - 1];
  if (last !== undefined && last.cls === cls) out[out.length - 1] = { text: last.text + text, cls };
  else out.push({ text, cls });
}


/** One line of prose: a heading, a list marker, `inline code`. */
export function proseRuns(line: string): Run[] {
  const out: Run[] = [];
  if (/^#{1,6} /u.test(line)) {
    push(out, line, 'head');
    return out;
  }
  let from = 0;
  const it = item(line);
  if (it !== null) {
    push(out, line.slice(0, it.indent), null);
    push(out, line.slice(it.indent, it.content), 'mark');
    from = it.content;
  } else if (/^\s*> /u.test(line)) {
    const m = /^\s*> /u.exec(line)?.[0] ?? '';
    push(out, m, 'mark');
    from = m.length;
  }
  const re = /`[^`\n]+`/gu;
  re.lastIndex = from;
  let at = from;
  for (let m = re.exec(line); m !== null; m = re.exec(line)) {
    push(out, line.slice(at, m.index), null);
    push(out, m[0], 'code');
    at = m.index + m[0].length;
  }
  push(out, line.slice(at), null);
  return out;
}

/** Every line's runs, for the whole text ('\n' between lines). */
export function colorLines(text: string): Run[][] {
  const lines = text.split('\n');
  const kinds = lineKinds(lines);
  const out: Run[][] = [];
  for (let k = 0; k < lines.length; ) {
    const line = lines[k] ?? '';
    const { kind, lang } = kinds[k] ?? { kind: 'prose', lang: '' };
    if (kind !== 'code') {
      out.push(kind === 'open' || kind === 'close' ? (line === '' ? [] : [{ text: line, cls: 'fence' }]) : proseRuns(line));
      k += 1;
      continue;
    }
    // a block's lines go together through the bubble's rule (a comment or a string may span lines)
    let end = k;
    while (end < lines.length && kinds[end]?.kind === 'code') end += 1;
    for (const runs of codeLines(lines.slice(k, end).join('\n'), lang)) {
      out.push(runs.filter((r) => r.text !== '').map((r) => {
        const css = cssText(r.style);
        return css === '' ? { text: r.text, cls: null } : { text: r.text, cls: null, css };
      }));
    }
    k = end;
  }
  return out;
}

/** A class's look as an inline style, in the theme's tokens (pm/colors.ts's decorations). */
export const COLOR_STYLE: Record<Cls, string> = {
  fence: 'color: var(--c-text-3)',
  mark: 'color: var(--c-accent)',
  code: 'color: var(--c-accent); font-family: var(--font-mono)',
  head: 'font-weight: 600',
};

