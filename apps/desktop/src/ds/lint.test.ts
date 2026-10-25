// The design system's two laws on the screens (lint.ts), in pnpm check: no bare control outside
// src/ds, and no class without a CSS rule. What was there when the laws came in is listed in
// lint.pending.ts and may only shrink: a file that drops below its count, or a class that gets its
// rule, must leave the list (so the list is always the work left: raw-controls.md section 2).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { classesOf, cssClasses, cursorFaults, looseSpacing, menuDrawn, plainClicks, rawControls, smallText } from './lint';
import { PENDING_CLASSES, PENDING_RAW, PENDING_SMALL_TEXT } from './lint.pending';
import { PENDING_SPACING } from './spacing.pending';

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

  it('reads a menu drawn outside the ds Dropdown/PickerPop', () => {
    expect(menuDrawn(`import { Button, Menu, type Picker as P } from '@/ds';\n// all agents ⌄\n<div role="menu" className="b-picker-row b-mi x">all ⌄</div>`)).toEqual([
      'imports Menu',
      'imports Picker',
      'role="menu"',
      'class b-picker-row',
      'class b-mi',
      "a '⌄' caret (the ds trigger draws its caret)",
    ]);
    expect(menuDrawn(`import { Dropdown, PickerPop } from '@/ds';\n/* 'yolo ⌄' */\n<Dropdown label="all agents" />`)).toEqual([]);
  });

  it('every menu is the ds Dropdown or PickerPop: the Picker with its trigger and its 50vh cap (his m_26194)', () => {
    // the composer's / @ $ list rides the editor's keys inside the box (a Picker, the same cap); the
    // capsule's tray menu is its own window, drawn in the Picker's still shell (Menu)
    const may: Record<string, readonly string[]> = {
      'composer/Picker.tsx': ['imports Picker', 'class b-picker-path'],
      // its submenu (a live project's agents) is a second column of the same window, the same shell
      'capsule/TrayMenu.tsx': ['imports Menu', 'imports MenuItem', 'imports MenuSep'],
      // the tray menu's projects block, drawn inside that Menu (its 'N more in bise' row)
      'capsule/MenuProjects.tsx': ['imports MenuItem'],
    };
    const drawn = screens
      .filter((p) => !rel(p).startsWith('ds/'))
      .flatMap((p) => menuDrawn(readFileSync(p, 'utf8')).filter((w) => !(may[rel(p)] ?? []).includes(w)).map((w) => `${rel(p)}: ${w}`));
    expect(drawn, 'a menu drawn by a screen: use the ds Dropdown (a trigger and its menu) or PickerPop (a menu from your own anchor)').toEqual([]);
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

describe('the text floor (--t-11, 11.5 px: ambient m_8298, ui-review-app #7)', () => {
  it('reads the sizes under 11.5 px, and only those', () => {
    const css = ['/* font-size: 9px */', '.a{font-size:11px;font:600 10.5px/16px var(--font-ui)}', '.b{font-size:var(--t-11);font:12px/1 x;font-size:.6875rem;font-size:.9em}'].join('\n');
    expect(smallText(css).map((t) => `${String(t.line)} ${t.value}`)).toEqual(['2 11px', '2 600 10.5px/16px var(--font-ui)', '3 .6875rem']);
  });

  it('no stylesheet writes text under the floor (lint.pending.ts PENDING_SMALL_TEXT only shrinks)', () => {
    // drawings, not words: a sleeping bim's z's grow 9, 11, 13 px as they rise (bims' art)
    const ART: Record<string, number> = { 'bims/office.css': 2 };
    const now: Record<string, number> = {};
    for (const p of files.filter((f) => f.endsWith('.css'))) {
      const r = rel(p);
      // bise.dev/desktop's hero bundle: the site's page, its sizes designer's page specs in px
      if (r.startsWith('hero/')) continue;
      // the dots' state glyphs in high contrast (✓ ! ?) fill a 14-16 px ring: a mark, not text
      if (r === 'ds/css/live.css') continue;
      const n = smallText(readFileSync(p, 'utf8')).length - (ART[r] ?? 0);
      if (n > 0) now[r] = n;
    }
    const grown = Object.entries(now).filter(([f, n]) => n > (PENDING_SMALL_TEXT[f] ?? 0)).map(([f, n]) => `${f}: ${String(n)} (pending ${String(PENDING_SMALL_TEXT[f] ?? 0)})`);
    expect(grown, 'text under 11.5 px: use var(--t-11), the floor').toEqual([]);
    const done = Object.entries(PENDING_SMALL_TEXT).filter(([f, n]) => (now[f] ?? 0) < n).map(([f, n]) => `${f}: ${String(now[f] ?? 0)} now, pending says ${String(n)}`);
    expect(done, 'PENDING_SMALL_TEXT lists more than is left: lower it').toEqual([]);
  });
});

describe('the spacing law (designer desktop-spacing m_19568, ambient-lead m_19569)', () => {
  it('reads the lengths written by hand, and only those', () => {
    const css = ['/* top: 9px */', '.a{margin:0;padding:6px 10px}', '.b{gap:var(--s-2);top:-1px;height:28px;max-height:320px;left:calc(var(--s-4) + 3px)}', '@media (max-width: 800px){.c{margin-top:.5em;--x:6px;width:30px}}'].join('\n');
    expect(looseSpacing(css).map((l) => `${String(l.line)} ${l.prop}: ${l.value}`)).toEqual([
      '2 padding: 6px 10px',
      '2 padding: 6px 10px',
      '3 height: 28px',
      '3 left: calc(var(--s-4) + 3px)',
      '4 margin-top: .5em',
    ]);
  });

  it("no stylesheet writes more spacing by hand than when the law came in (spacing.pending.ts, a ratchet)", () => {
    const grown: string[] = [];
    for (const p of files.filter((f) => f.endsWith('.css'))) {
      const r = rel(p);
      if (r === 'ds/tokens.css' || r === 'ds/md-tokens.css') continue;
      // bise.dev/desktop's hero bundle (src/hero, kiln's mock shop in it): the site's page, not the
      // app; its lengths are designer's page specs in px (hero-fix-2, kiln-app), outside the app's tokens
      if (r.startsWith('hero/')) continue;
      const loose = looseSpacing(readFileSync(p, 'utf8'));
      const was = PENDING_SPACING[r] ?? 0;
      if (loose.length > was) grown.push(`${r}: ${String(loose.length)} (was ${String(was)}): ${loose.map((l) => `${String(l.line)} ${l.prop}: ${l.value}`).join(' | ')}`);
    }
    expect(grown, 'a margin, padding, gap or inset is 0, a --s-*/--gap-*/--pad-* token or a calc() of them; a control or row height is an --h-* (src/ds/tokens.css)').toEqual([]);
  });
});

describe('the pointer law (his words: « chaque chose sur laquelle tu peux cliquer ... cursor pointer »)', () => {
  it('reads a plain element he clicks with no role, and a rule that puts the arrow back', () => {
    expect(plainClicks(`<div onClick={go}>a</div>
<span role="button" onClick={go} />
<button onClick={go} />
<li className={x ? "a>b" : "c"}
  onClick={() => { if (a > b) go(); }}>x</li>
<div onMouseDown={keep} />
<div className="sash" onDoubleClick={reset} />
<span
  // the menu's esc: a comment's quote is not a string
  onPointerDown={hold}
>
  <Press onClick={go} />
</span>`)).toEqual(['1 <div>', '4 <li>']);
    expect(cursorFaults('/* .no{cursor:default} */ .a{color:red;cursor:default} .b,.c:disabled{cursor: auto} .d[aria-disabled="true"]{cursor:default} .e{cursor:pointer} .f{cursor:text}')).toEqual(['.a', '.b']);
  });

  it('every plain element he clicks has a role, so the root rule gives it the hand', () => {
    // Frame: the scrim, a click outside what floats over it, not a thing he aims at; MapChip: a
    // wrapper that only stops the map's clicks; the office and the town: a map that picks what is
    // under the mouse and sets the hand itself over a bim or a sign (data-pointer, office.css)
    const may: Record<string, number> = { 'app/Frame.tsx': 1, 'bims/MapChip.tsx': 1, 'bims/Office.tsx': 1, 'bims/town/Town.tsx': 1, 'plugins/Room.tsx': 1 };
    const found = screens.flatMap((p) => {
      const hits = plainClicks(readFileSync(p, 'utf8'));
      return hits.length > (may[rel(p)] ?? 0) ? hits.map((h) => `${rel(p)}:${h}`) : [];
    });
    expect(found, 'a div/span he clicks: give it its role (button, option, tab, link...) or use a ds control').toEqual([]);
  });

  it('no stylesheet puts the arrow back on a control (only a disabled state, or a thing that takes no click)', () => {
    // labels that look like rows but take no click
    // an object's '?' pill that takes no click (only a broken plugin's '✗' opens it: objpills.ts)
    const may = new Set(['app/app.css .app-rb-none', 'app/app.css .app-rb-none:hover', "bims/office.css .bims-pill.bims-objpill:not([role='button'])"]);
    const found = files
      .filter((f) => f.endsWith('.css'))
      .flatMap((p) => cursorFaults(readFileSync(p, 'utf8')).map((s) => `${rel(p)} ${s}`))
      .filter((s) => !may.has(s));
    expect(found, 'cursor:default on a control undoes the hand (ds/css/base.css owns the cursor)').toEqual([]);
  });
});
