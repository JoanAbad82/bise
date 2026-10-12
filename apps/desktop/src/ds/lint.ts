// src/ds · the design system's two laws on the screens' source (designer's raw-controls call m_18343,
// ambient-lead m_18391), read by lint.test.ts in pnpm check:
//   1. no bare <button>, <input>, <select> or <textarea> outside src/ds: a screen uses the ds's
//      Button, IconButton, Act, Field, TextArea, Select, Toggle, Row (allowlist: the composer's dev
//      lab and the ds gallery);
//   2. every class a .tsx names (className literals, cx(...) words) has a rule in some .css file:
//      a class with no rule draws the browser's own control (his real-home screenshot's 'go back').
// And the spacing law on the CSS (designer's page desktop-spacing, m_19568, ambient-lead m_19569):
//   3. a margin, padding, gap, inset, top, right, bottom or left is 0, a token (--s-*, --gap-*,
//      --pad-*, --h-*) or a calc() of them, and a control's or a row's height is an --h-*:
//      looseSpacing lists the lengths written by hand instead (a ratchet: spacing.pending.ts).
// Pure: the test reads the files and hands their text here.

/** The bare controls a source writes: one per JSX tag. */
export function rawControls(src: string): number {
  return (src.match(/<(button|input|select|textarea)\b/g) ?? []).length;
}

/** words a literal in a class expression can hold that are values, never classes */
const NOT_CLASSES = new Set(["true", "false", "null", "undefined"]);

/** The classes a .tsx names: className="…", className={…} string literals, cx("…") words. */
export function classesOf(src: string): Set<string> {
  const out = new Set<string>();
  const add = (words: string) => {
    for (const w of words.split(/\s+/)) if (/^-?[_a-zA-Z][\w-]*$/.test(w) && !NOT_CLASSES.has(w)) out.add(w);
  };
  for (const m of src.matchAll(/className="([^"]*)"/g)) add(m[1] ?? "");
  for (const m of src.matchAll(/className=\{/g)) literals(braced(src, m.index + m[0].length - 1)).forEach(add);
  for (const m of src.matchAll(/\bcx\(/g)) literals(paren(src, m.index + m[0].length - 1)).forEach(add);
  return out;
}

/** The classes a stylesheet has rules for (every `.name` in its selectors). */
export function cssClasses(css: string): Set<string> {
  const out = new Set<string>();
  const body = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/url\([^)]*\)/g, "").replace(/"[^"]*"|'[^']*'/g, "");
  for (const m of body.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) out.add(m[1] ?? "");
  return out;
}

/** The text of a balanced {…} or (…) starting at `at` (its opening character). */
function balanced(src: string, at: number, open: string, close: string): string {
  let depth = 0;
  for (let i = at; i < src.length; i += 1) {
    const c = src[i];
    if (c === open) depth += 1;
    else if (c === close) {
      depth -= 1;
      if (depth === 0) return src.slice(at + 1, i);
    }
  }
  return "";
}
const braced = (src: string, at: number) => balanced(src, at, "{", "}");
const paren = (src: string, at: number) => balanced(src, at, "(", ")");

/**
 * The string literals of an expression that can be class words: '…', "…", and a template's
 * static parts (a word touching a ${…} is built at run time: left out). A literal compared with
 * (=== 'err') is a value, not a class: left out.
 */
function literals(expr: string): string[] {
  const e = expr.replace(/[!=]==?\s*(['"])[^'"]*\1/g, "").replace(/(['"])[^'"]*\1\s*[!=]==?/g, "");
  const out: string[] = [];
  for (const m of e.matchAll(/'([^'\n]*)'|"([^"\n]*)"/g)) out.push(m[1] ?? m[2] ?? "");
  for (const m of e.matchAll(/`([^`]*)`/g)) {
    const t = m[1] ?? "";
    out.push(t.replace(/\S*\$\{[^}]*\}\S*/g, " "));
  }
  return out;
}

/** A length written by hand where the spacing law wants a token: its line, property and value. */
export interface LooseSpace {
  line: number;
  prop: string;
  value: string;
}

/** the properties that space things: margin*, padding*, inset*, gap*, top, right, bottom, left */
const SPACE_PROP = /^(?:(?:margin|padding|inset)(?:-[a-z]+)*|gap|row-gap|column-gap|top|right|bottom|left)$/;
/** the heights a control or a row has (28 to 48 px on the page): checked from 20 to 56 px */
const HEIGHT_PROP = /^(?:min-|max-)?(?:height|block-size)$/;
const LENGTH = /(-?\d*\.?\d+)(px|r?em)\b/g;

/**
 * The lengths a stylesheet writes by hand in its spacing properties, one per length: not 0, not a
 * token (a var() or a calc() of them has no length of its own), not a 1 px stroke's offset; and
 * the px heights from 20 to 56 (a control's or a row's, which is an --h-*). Custom properties are
 * not read: tokens.css defines them.
 */
export function looseSpacing(css: string): LooseSpace[] {
  // comments blanked with their newlines kept, so a line is the file's
  const body = css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));
  const out: LooseSpace[] = [];
  for (const m of body.matchAll(/(^|[{;])(\s*)([a-z-]+)(\s*:\s*)([^;{}]+)/g)) {
    const prop = m[3] ?? "";
    const value = (m[5] ?? "").trim();
    const space = SPACE_PROP.test(prop);
    const height = HEIGHT_PROP.test(prop);
    if (!space && !height) continue;
    const at = m.index + (m[1] ?? "").length + (m[2] ?? "").length;
    const line = body.slice(0, at).split("\n").length;
    for (const l of value.matchAll(LENGTH)) {
      const n = Math.abs(Number(l[1]));
      const px = l[2] === "px";
      if (n === 0) continue;
      if (space && px && n === 1) continue;
      if (height && (!px || n < 20 || n > 56)) continue;
      out.push({ line, prop, value });
    }
  }
  return out;
}
