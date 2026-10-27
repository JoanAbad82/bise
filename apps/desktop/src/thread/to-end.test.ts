// His m_46274: the '↓ back to the bottom' pill sat right of the composer: it was centred in the
// screen (left: 50%) while the column slides left of the bims' world. Its centre is the composer's
// (and the inbox block's) in every place the column takes: centred, slid left, the panel open, a
// panel's tab. Computed from the stylesheets themselves with the column's vars from column.ts
// (happy-dom lays nothing out; vitest gives a css ?raw import empty, so they are read from disk).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { sideLayout } from '@/app/side3d/layout';
import { columnPlace, COL_PAD } from './column';

const threadCss = readFileSync(new URL('./thread.css', import.meta.url), 'utf8');

/** The declarations of every rule whose selector list holds `sel`, in order (a later one wins). */
function rule(sel: string): Map<string, string> {
  const blocks = threadCss
    .replace(/\/\*[\s\S]*?\*\//gu, '')
    .split(/(?<=\})/u)
    .filter((block) => block.includes('{') && block.slice(0, block.indexOf('{')).split(',').map((s) => s.trim()).includes(sel));
  if (blocks.length === 0) throw new Error(`no rule for ${sel}`);
  const out = new Map<string, string>();
  for (const b of blocks)
    for (const d of b.slice(b.indexOf('{') + 1, b.lastIndexOf('}')).split(';')) {
      const i = d.indexOf(':');
      if (i > 0) out.set(d.slice(0, i).trim(), d.slice(i + 1).trim());
    }
  return out;
}

/**
 * A length (px) of calc/min/var/px/% for a box `w` wide, the vars given (a var not given takes its
 * fallback): enough of CSS for the column's expressions.
 */
function length(expr: string, w: number, vars: Readonly<Record<string, string>>): number {
  const toks = expr.match(/var\(|calc\(|min\(|max\(|--[\w-]+|-?\d*\.?\d+(?:px|%)?|[-+*/(),]/gu) ?? [];
  let i = 0;
  const peek = (): string | undefined => toks[i];
  const take = (t?: string): string => {
    const v = toks[i++];
    if (v === undefined || (t !== undefined && v !== t)) throw new Error(`bad length ${expr}`);
    return v;
  };
  const atom = (): number => {
    const t = take();
    if (t === '(' || t === 'calc(') {
      const v = sum();
      take(')');
      return v;
    }
    if (t === 'min(' || t === 'max(') {
      const vs = [sum()];
      while (peek() === ',') {
        take(',');
        vs.push(sum());
      }
      take(')');
      return t === 'min(' ? Math.min(...vs) : Math.max(...vs);
    }
    if (t === 'var(') {
      const name = take();
      let fallback: number | undefined;
      if (peek() === ',') {
        take(',');
        fallback = sum();
      }
      take(')');
      const v = vars[name];
      if (v !== undefined) return length(v, w, vars);
      if (fallback === undefined) throw new Error(`no ${name}`);
      return fallback;
    }
    if (t === '-') return -atom();
    if (t.endsWith('%')) return (Number.parseFloat(t) / 100) * w;
    return Number.parseFloat(t);
  };
  const product = (): number => {
    let v = atom();
    while (peek() === '*' || peek() === '/') v = take() === '*' ? v * atom() : v / atom();
    return v;
  };
  const sum = (): number => {
    let v = product();
    while (peek() === '+' || peek() === '-') v = take() === '+' ? v + product() : v - product();
    return v;
  };
  return sum();
}

/** rail 56 + sidebar 240: the screen starts where the left ends */
const LEFT = 296;

/** The screen's vars: .th-screen's own, the place useColumn sets over them when it has one. */
function screenVars(place: { x: number; w: number } | null): Record<string, string> {
  const s = rule('.th-screen');
  return {
    '--w-col': '720px',
    '--pad-column': `${String(COL_PAD)}px`,
    '--th-col': place === null ? (s.get('--th-col') ?? '') : `${String(place.w)}px`,
    '--th-col-x': place === null ? (s.get('--th-col-x') ?? '') : `${String(place.x)}px`,
  };
}

/** The pill's centre and the composer's, the inbox block's, in a screen `w` wide (the list spans it). */
function centres(w: number, place: { x: number; w: number } | null) {
  const vars = screenVars(place);
  const pill = rule('.th-to-end');
  const cmp = rule('.th-screen .b-composer');
  const inbox = rule('.th-screen .inbox-strip');
  const mid = (r: Map<string, string>) => length(r.get('margin-left') ?? '', w, vars) + length(r.get('width') ?? '', w, vars) / 2;
  return {
    // left at the axis, then back by half its own width
    pill: length(pill.get('left') ?? '', w, vars),
    composer: mid(cmp),
    inbox: mid(inbox),
  };
}

describe("the '↓ back to the bottom' pill", () => {
  it('stands on its own centre: translated back by half its width', () => {
    expect(rule('.th-to-end').get('transform')).toBe('translateX(-50%)');
  });

  it.each([
    ['1920, the side folded', 1920, false],
    ['1440, the column slid left of the bims\' world (his shot)', 1440, false],
    ['1920, the panel open', 1920, true],
    ['1440, the panel open, the column narrowed', 1440, true],
  ] as const)('%s: on the composer\'s axis, and the inbox block\'s', (_, win, panel) => {
    const lay = panel ? sideLayout(win, LEFT, true, 384) : sideLayout(win, LEFT, false);
    const w = win - LEFT - (panel ? 384 : 0);
    const place = columnPlace(lay, LEFT, w);
    expect(place).not.toBeNull();
    const c = centres(w, place);
    expect(c.pill).toBeCloseTo(c.composer, 3);
    expect(c.pill).toBeCloseTo(c.inbox, 3);
  });

  it("a thread in a panel's tab (no layout place): the CSS's centred column, the pill in its middle", () => {
    const c = centres(560, null);
    expect(c.pill).toBeCloseTo(280, 3);
    expect(c.pill).toBeCloseTo(c.composer, 3);
  });
});
