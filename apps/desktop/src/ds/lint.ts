// src/ds · the design system's two laws on the screens' source (designer's raw-controls call m_18343,
// ambient-lead m_18391), read by lint.test.ts in pnpm check:
//   1. no bare <button>, <input>, <select> or <textarea> outside src/ds: a screen uses the ds's
//      Button, IconButton, Act, Field, TextArea, Select, Toggle, Row (allowlist: the composer's dev
//      lab and the ds gallery);
//   2. every class a .tsx names (className literals, cx(...) words) has a rule in some .css file:
//      a class with no rule draws the browser's own control (his real-home screenshot's 'go back').
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
