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

/**
 * The menu law (his m_26194, « de manière systémique »): a menu that opens from something is the
 * ds Dropdown or PickerPop (ds/dropdown.tsx), so it is the Picker, capped at half the window, with
 * the one trigger and its centered caret. What a screen writes that draws a menu itself, one entry
 * each: an import of Picker, Menu, MenuItem or MenuSep from the ds; a role="menu" or "menuitem"; a
 * class of the picker's or the old menu's (b-picker*, b-menu, b-mi); a '⌄' glyph for a caret
 * (comments aside). Pure.
 */
export function menuDrawn(src: string): string[] {
  const out: string[] = [];
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/.*$/gm, "$1");
  for (const m of code.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]@\/ds['"]/g)) {
    for (const part of (m[1] ?? "").split(",")) {
      const name = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0] ?? "";
      if (["Picker", "Menu", "MenuItem", "MenuSep"].includes(name)) out.push(`imports ${name}`);
    }
  }
  for (const m of code.matchAll(/role=\{?["'](menu|menuitem)["']/g)) out.push(`role="${m[1] ?? ""}"`);
  for (const c of classesOf(code)) if (/^b-(picker|menu$|mi$)/.test(c)) out.push(`class ${c}`);
  if (code.includes("⌄")) out.push("a '⌄' caret (the ds trigger draws its caret)");
  return out;
}

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

/** A text size under the floor: its line and the value written. */
export interface SmallText {
  line: number;
  value: string;
}

/** the ds's floor, --t-11: 11.5 px (ambient m_8298) */
const FLOOR_PX = 11.5;

/**
 * The text sizes a stylesheet writes under the ds's floor (--t-11, 11.5 px; ui-review-app #7): a
 * font-size, or a font shorthand's size, in px or rem (16 px) under 11.5. A var() is the token's
 * business; em and % follow their parent and are not read. Pure.
 */
export function smallText(css: string): SmallText[] {
  const body = css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));
  const out: SmallText[] = [];
  for (const m of body.matchAll(/(^|[{;])(\s*)(font-size|font)(\s*:\s*)([^;{}]+)/g)) {
    const value = (m[5] ?? "").trim();
    // a shorthand's size is the length before its optional '/ line-height'
    const size = m[3] === "font" ? /(?:^|\s)(\d*\.?\d+)(px|rem)\s*(?:\/|\s)/.exec(`${value} `) : /^(\d*\.?\d+)(px|rem)$/.exec(value);
    if (!size) continue;
    const px = Number(size[1]) * (size[2] === "rem" ? 16 : 1);
    if (px >= FLOOR_PX) continue;
    const at = m.index + (m[1] ?? "").length + (m[2] ?? "").length;
    out.push({ line: body.slice(0, at).split("\n").length, value });
  }
  return out;
}

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

/**
 * A thing he clicks says what it is: ds/css/base.css's root rule (the hand on a control and a link,
 * chrome text not selectable) and VoiceOver match controls and roles. A plain element
 * he clicks (a div, a span, an li with onClick) and no role is outside both. A double-click or a
 * drag alone is no click (designer m_38970). One entry per such tag: its line and its tag. A
 * native control (button,
 * a, input, select, textarea, label, summary, option) is the rule's own. Pure.
 */
export function plainClicks(src: string): string[] {
  const out: string[] = [];
  const native = new Set(["button", "a", "input", "select", "textarea", "label", "summary", "option"]);
  for (const m of src.matchAll(/<([a-z][a-z0-9]*)\b/g)) {
    const tag = m[1] ?? "";
    if (native.has(tag)) continue;
    const text = openingTag(src, m.index);
    if (!/\sonClick\s*=/.test(text) || /\srole=/.test(text)) continue;
    out.push(`${String(src.slice(0, m.index).split("\n").length)} <${tag}>`);
  }
  return out;
}

/** The text of the JSX opening tag at `at` (its '<'), up to its '>' outside braces and strings. */
function openingTag(src: string, at: number): string {
  let depth = 0;
  let quote = "";
  for (let i = at + 1; i < src.length; i += 1) {
    const c = src[i] ?? "";
    if (quote !== "") {
      if (c === quote && src[i - 1] !== "\\") quote = "";
    } else if (c === "/" && src[i + 1] === "/") i = src.indexOf("\n", i) < 0 ? src.length : src.indexOf("\n", i);
    else if (c === "/" && src[i + 1] === "*") i = src.indexOf("*/", i) < 0 ? src.length : src.indexOf("*/", i) + 1;
    else if (c === '"' || c === "'" || c === "`") quote = c;
    else if (c === "{") depth += 1;
    else if (c === "}") depth -= 1;
    else if (c === ">" && depth === 0) return src.slice(at, i + 1);
  }
  return "";
}

/**
 * The hand law (his m_44190, round 2 of native-mac: the hand on everything he clicks):
 * ds/css/base.css's root rule gives every control, every clicked role and every link the hand. A
 * screen's own cursor:pointer is then useless, or puts the hand on something that is no control
 * (give it its role instead). The rules of a stylesheet that put the hand on something: one
 * selector each. A link's (a[href], [role=link]) is left out. Pure.
 */
export function handRules(css: string): string[] {
  return cursorRules(css, /^pointer$/).filter((sel) => !/a\[href\]|\[role=["']?link/.test(sel));
}

/**
 * The other side of the hand law: a rule that puts the arrow (cursor default or auto) back on
 * something, so a control under it loses the root rule's hand. A disabled one's is right (the
 * arrow on what does nothing): a selector that says :disabled or aria-disabled is left out. Pure.
 */
export function arrowRules(css: string): string[] {
  return cursorRules(css, /^(default|auto)$/).filter((sel) => !/:disabled|aria-disabled/.test(sel));
}

/** the selectors of the rules whose cursor matches `value`, one each, comments dropped */
function cursorRules(css: string, value: RegExp): string[] {
  const body = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out: string[] = [];
  for (const m of body.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const cursor = /(?:^|[;\s])cursor\s*:\s*([\w-]+)/.exec(m[2] ?? "")?.[1] ?? "";
    if (!value.test(cursor)) continue;
    for (const sel of (m[1] ?? "").split(",").map((s) => s.trim().replace(/\s+/g, " "))) {
      if (sel !== "") out.push(sel);
    }
  }
  return out;
}

/** the 7 text sizes of native-mac §6 in px: 30, 15, 14, 13, 12 (and 12 mono), 11.5 in a kbd */
export const TYPE_SCALE: readonly number[] = [30, 15, 14, 13, 12, 11.5];
/** the size tokens off that scale, kept for the screens not moved yet */
const OFF_SCALE_TOKENS = ["--t-17", "--t-22"];

/**
 * The text sizes a stylesheet writes off the 7 of native-mac §6 (TYPE_SCALE): a font-size, or a
 * font shorthand's size, in px or rem off the scale, or one of the off-scale tokens (--t-17,
 * --t-22). Under the floor is smallText's. em and % follow their parent and are not read. Pure.
 */
export function offScaleText(css: string): SmallText[] {
  const body = css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));
  const out: SmallText[] = [];
  for (const m of body.matchAll(/(^|[{;])(\s*)(font-size|font)(\s*:\s*)([^;{}]+)/g)) {
    const value = (m[5] ?? "").trim();
    const at = m.index + (m[1] ?? "").length + (m[2] ?? "").length;
    const line = body.slice(0, at).split("\n").length;
    if (OFF_SCALE_TOKENS.some((t) => value.includes(`var(${t})`))) {
      out.push({ line, value });
      continue;
    }
    const size = m[3] === "font" ? /(?:^|\s)(\d*\.?\d+)(px|rem)\s*(?:\/|\s)/.exec(`${value} `) : /^(\d*\.?\d+)(px|rem)$/.exec(value);
    if (!size) continue;
    const px = Number(size[1]) * (size[2] === "rem" ? 16 : 1);
    if (px < FLOOR_PX || TYPE_SCALE.includes(px)) continue;
    out.push({ line, value });
  }
  return out;
}

/**
 * The scrollbars a stylesheet draws itself: scrollbar-width, scrollbar-color or a
 * ::-webkit-scrollbar rule, one entry each. Any of them turns Chromium's macOS overlay scrollbar
 * (drawn by the system over the content, gone when still) into a classic bar that takes room
 * (ds/css/base.css). Pure.
 */
export function drawnScrollbars(css: string): string[] {
  const body = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return [...body.matchAll(/scrollbar-(?:width|color)\s*:|::-webkit-scrollbar[\w-]*/g)].map((m) => m[0].replace(/\s*:$/, ""));
}

/**
 * The length tokens of tokens.css off the 4 px grid (designer's rule: every size is a 4 px step):
 * a custom property whose whole value is one px length that is not a multiple of 4. Radii
 * (--r-*: macOS's 6, 10, 22) and the 1 px of a stroke are the rule's own. Pure.
 */
export function offGridTokens(css: string): string[] {
  const body = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out: string[] = [];
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*(-?\d*\.?\d+)px\s*[;}]/g)) {
    const name = m[1] ?? "";
    const n = Math.abs(Number(m[2]));
    if (name.startsWith("--r-") || n === 1 || n % 4 === 0) continue;
    out.push(`${name}: ${m[2] ?? ""}px`);
  }
  return out;
}
