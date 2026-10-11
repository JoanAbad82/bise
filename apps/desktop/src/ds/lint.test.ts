// The design system's two laws on the screens (lint.ts), in pnpm check: no bare control outside
// src/ds, and no class without a CSS rule. What was there when the laws came in is listed in
// lint.pending.ts and may only shrink: a file that drops below its count, or a class that gets its
// rule, must leave the list (so the list is always the work left: raw-controls.md section 2).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { classesOf, cssClasses, rawControls } from './lint';
import { PENDING_CLASSES, PENDING_RAW } from './lint.pending';

const SRC = join(__dirname, '..');
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const files = walk(SRC);
const rel = (p: string) => relative(SRC, p).split('\\').join('/');
const screens = files.filter((p) => p.endsWith('.tsx') && !p.endsWith('.test.tsx'));
/** where a bare control may be written: the ds itself, its gallery, the composer's dev lab */
const ALLOWED = (r: string) => r.startsWith('ds/') || r === 'composer/Lab.tsx';

describe('the ds laws (designer m_18343)', () => {
  it('reads the files it judges', () => {
    expect(rawControls('<button type="button"/><input/><Button/>')).toBe(2);
    expect([...classesOf('<i className="a b" /><i className={cx("c", on && "d", s === "x" && "e")} /><i className={`f ${g} h-${k}`} />')].sort()).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    expect([...cssClasses('/* .no */ .a, .b:hover > .c { x: url(.d) } @media (x) { .e-f { } }')].sort()).toEqual(['a', 'b', 'c', 'e-f']);
  });

  it('no bare <button>/<input>/<select>/<textarea> outside src/ds (the pending list only shrinks)', () => {
    const now: Record<string, number> = {};
    for (const p of screens) {
      const r = rel(p);
      if (ALLOWED(r)) continue;
      const n = rawControls(readFileSync(p, 'utf8'));
      if (n > 0) now[r] = n;
    }
    const grown = Object.entries(now).filter(([f, n]) => n > (PENDING_RAW[f] ?? 0)).map(([f, n]) => `${f}: ${String(n)} (pending ${String(PENDING_RAW[f] ?? 0)})`);
    expect(grown, 'a bare control outside src/ds: use the ds component (raw-controls.md)').toEqual([]);
    const done = Object.entries(PENDING_RAW).filter(([f, n]) => (now[f] ?? 0) < n).map(([f, n]) => `${f}: ${String(now[f] ?? 0)} now, pending says ${String(n)}`);
    expect(done, 'lint.pending.ts lists more than is left: lower it').toEqual([]);
  });

  it('every class a .tsx names has a CSS rule (the pending list only shrinks)', () => {
    const css = new Set<string>();
    for (const p of files.filter((f) => f.endsWith('.css'))) for (const c of cssClasses(readFileSync(p, 'utf8'))) css.add(c);
    const missing = new Set<string>();
    for (const p of screens) for (const c of classesOf(readFileSync(p, 'utf8'))) if (!css.has(c)) missing.add(c);
    const fresh = [...missing].filter((c) => !PENDING_CLASSES.includes(c)).sort();
    expect(fresh, 'a class with no CSS rule: give it one, or use a data-testid for a test hook').toEqual([]);
    const done = PENDING_CLASSES.filter((c) => !missing.has(c));
    expect(done, 'lint.pending.ts lists a class that has its rule now: drop it').toEqual([]);
  });
});
