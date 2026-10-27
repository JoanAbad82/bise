// selbar-float (desk-checks m_48313): the selection bar ('3 picked · move · put · esc') and the undo
// toast sat 20 from the window's bottom, under the floating composer's pill (fixed 24 from the
// bottom, 44 tall, z 40 over their 30): a click on the bar's esc landed on the pill. Before the
// float (the bottom dock) the screen ended above the composer. Both now sit over the float's room
// (--float-room, the pill and 16 over it), as every page's foot keeps it free. The pill at rest is
// what is there while he picks cards: a press outside the float folds it (composer/float/Host.tsx).
// Computed from the stylesheets themselves (happy-dom lays nothing out; vitest gives a css ?raw
// import empty, so they are read from disk), the float's box from its own rules and tokens.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (rel: string): string => readFileSync(new URL(rel, import.meta.url), 'utf8');
const foldersCss = read('./folders.css');
const floatCss = read('../composer/float/float.css');
const tokensCss = read('../ds/tokens.css');

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

/** A length in px: a px number, a token (`var(--s-6)`), a var the page sets live with its fallback
 *  (`var(--float-now, var(--float-h))`: the fallback, the pill at rest), or a sum (`calc(a + b)`). */
function px(v: string): number {
  const s = v.trim();
  const calc = /^calc\((.*)\)$/u.exec(s);
  if (calc !== null) return (calc[1] ?? '').split(/\s\+\s/u).reduce((n, part) => n + px(part), 0);
  const ref = /^var\((--[\w-]+)(?:,\s*(.+))?\)$/u.exec(s);
  if (ref !== null) {
    const name = ref[1] ?? '';
    const m = new RegExp(`${name}:\\s*([^;]+);`, 'u').exec(tokensCss);
    if (m !== null) return px(m[1] ?? '');
    if (ref[2] !== undefined) return px(ref[2]);
    throw new Error(`no token ${name}`);
  }
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n)) throw new Error(`not a length: ${v}`);
  return n;
}

describe("the selection bar and the undo toast over the floating composer's pill", () => {
  // the pill at rest, from the window's bottom: its bottom, then its height (one line at rest)
  const float = rule(floatCss, '.cmp-float');
  const pillTop = px(float.get('bottom') ?? '') + px('var(--float-h)');

  for (const sel of ['.art-selbar', '.art-toast']) {
    it(`${sel}'s bottom clears the pill's top, the float's 16 gap over it`, () => {
      const r = rule(foldersCss, sel);
      expect(r.get('position')).toBe('absolute');
      const bottom = px(r.get('bottom') ?? '');
      expect(bottom).toBeGreaterThanOrEqual(pillTop + px('var(--s-4)'));
      // and it follows the float's live height (composer/float/room.ts): focused, open or mid-fold
      expect(r.get('bottom')).toContain('var(--float-now');
    });
  }
});
