// r2-hints item 3 (Gabriel m_44317): the floating composer's history sat flush on the glass's
// edges: its rows read their column (--th-col, --th-col-x) from .th-screen, and the float's rows
// are in no thread screen. The float's body gives them the thread's column, 24 in from each side.
// Computed from the stylesheets themselves (happy-dom lays nothing out; vitest gives a css ?raw
// import empty, so they are read from disk).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (rel: string): string => readFileSync(new URL(rel, import.meta.url), 'utf8');
const floatCss = read('./float.css');
const threadCss = read('../../thread/thread.css');
const tokensCss = read('../../ds/tokens.css');

/** The declarations of every rule whose selector list holds `sel`, in order (a later one wins). */
function rule(css: string, sel: string): Map<string, string> {
  const blocks = css
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

/** A token's px from tokens.css (`--pad-column: var(--s-6)` → 24). */
function px(name: string): number {
  const m = new RegExp(`${name}:\\s*([^;]+);`, 'u').exec(tokensCss);
  if (m === null) throw new Error(`no token ${name}`);
  const v = (m[1] ?? '').trim();
  const ref = /^var\((--[\w-]+)\)$/u.exec(v);
  return ref !== null ? px(ref[1] ?? '') : Number.parseFloat(v);
}

describe("the floating composer's history", () => {
  it("its rows take the thread's column: 24 in from each side of the glass, as the field and the bar row", () => {
    const row = rule(threadCss, '.th-row');
    // the rows draw on the column's vars
    expect(row.get('width')).toBe('var(--th-col)');
    expect(row.get('margin-left')).toBe('var(--th-col-x)');
    const body = rule(floatCss, '.cmp-float .body');
    expect(body.get('--th-col')).toBe('calc(100% - 2 * var(--pad-column))');
    expect(body.get('--th-col-x')).toBe('var(--pad-column)');
    expect(px('--pad-column')).toBeGreaterThanOrEqual(24);
    // the scroller (and its 24 fade) stays edge to edge: no padding on the body itself
    expect(body.has('padding')).toBe(false);
  });
});

// his m_46152: answering a card, the float's box drew its accent border square (the box has no
// radius in the glass). It takes the glass's radius in each state, inside the glass's edge.
describe("the floating composer's answer border", () => {
  it("follows the glass's corners: r 16 focused or open, r 22 at rest, an inset ring", () => {
    const glass = rule(floatCss, ".cmp-float[data-state='open']");
    const ans = rule(floatCss, '.cmp-float .b-composer .box.ans:not(.quiet):focus-within');
    expect(ans.get('border-radius')).toBe(glass.get('border-radius'));
    expect(ans.get('box-shadow')).toBe('inset 0 0 0 1.5px var(--c-accent)');
    const rest = rule(floatCss, ".cmp-float[data-state='rest'] .b-composer .box.ans:not(.quiet)");
    expect(rest.get('border-radius')).toBe(rule(floatCss, '.cmp-float').get('border-radius'));
  });
});
