// src/ds · the design system's laws on its files (node src/ds/check.mjs; no browser, no deps).
// The pixels are the gallery's (gallery/shoot.mjs); the components' behavior is in the unit tests.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { purityFaults } from "./purity.mjs";

const here = import.meta.dirname;
const read = (p) => readFileSync(p, "utf8");
const cssDir = join(here, "css");
const css = Object.fromEntries(readdirSync(cssDir).filter((f) => f.endsWith(".css")).map((f) => [f, read(join(cssDir, f))]));
const noComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");

let pass = 0, fail = 0;
function law(name, fn) {
  try { fn(); pass++; console.log("  ✓ " + name); } catch (e) { fail++; console.log("  ✗ " + name + "\n    " + String(e instanceof Error ? e.message : e).split("\n")[0]); }
}

// src/ds is the design system now: desktop-ds v5 was copied in from designer's reference, which
// went with the old capsule (amb-mac's delete plan, step 2), so no law compares it with a reference.

law("index.css imports tokens.css first, md-tokens.css next, then every file of css/, live.css last", () => {
  const imports = [...read(join(here, "index.css")).matchAll(/@import "\.\/([\w/.-]+)";/g)].map((m) => m[1]);
  assert.equal(imports[0], "tokens.css");
  assert.equal(imports[1], "md-tokens.css");
  assert.equal(imports[imports.length - 1], "css/live.css");
  assert.deepEqual([...imports.slice(2)].sort(), Object.keys(css).map((f) => "css/" + f).sort());
});

// The markdown roles mirror the TUI (ambient-lead m_11457): each role and the theme.rs palette field it
// must equal, in dark and in light (rust/tui/src/markdown.rs, codeblock.rs, syntax.rs pick the fields).
export const MD_ROLES = {
  "--md-text": "text", "--md-strong": "accent", "--md-em": "text", "--md-code": "ok", "--md-heading": "text",
  "--md-link": "text", "--md-link-line": "accent", "--md-link-url": "dim", "--md-bullet": "accent", "--md-number": "dim",
  "--md-quote": "text", "--md-quote-bar": "text", "--md-rule": "rule", "--md-code-box": "faint", "--md-code-label": "dim",
  "--md-syn-plain": "text", "--md-syn-keyword": "syntax_keyword", "--md-syn-string": "syntax_string", "--md-syn-comment": "syntax_comment",
  "--md-syn-number": "syntax_number", "--md-syn-call": "syntax_call", "--md-syn-type": "syntax_type",
};

/** A theme.rs palette (`pub(crate) const DARK: Palette = Palette { … };`) as {field: "#rrggbb"}. */
function tuiPalette(rs, name) {
  const at = rs.indexOf(`const ${name}: Palette = Palette {`);
  assert.ok(at >= 0, `theme.rs has no ${name} palette`);
  const body = rs.slice(at, rs.indexOf("};", at));
  return Object.fromEntries([...body.matchAll(/^\s*(\w+):\s*rgb\(0x([0-9a-fA-F]{6})\)/gm)].map((m) => [m[1], "#" + m[2].toLowerCase()]));
}

/** The custom properties of the first block whose selector starts with `sel`, in a css text. */
function block(s, sel) {
  const at = s.indexOf(sel);
  assert.ok(at >= 0, `no block ${sel}`);
  const body = s.slice(s.indexOf("{", at) + 1, s.indexOf("}", at));
  return Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

law("the markdown roles are the TUI's palette, dark and light (rust/tui/src/theme.rs)", () => {
  const rs = read(join(here, "..", "..", "..", "..", "rust", "tui", "src", "theme.rs"));
  const tokens = noComments(read(join(here, "tokens.css")));
  const md = noComments(read(join(here, "md-tokens.css")));
  const roles = block(md, ':root, [data-theme="light"], [data-theme="dark"]');
  assert.deepEqual(Object.keys(roles).sort(), Object.keys(MD_ROLES).sort(), "md-tokens.css's roles are not MD_ROLES");
  for (const [mode, tuiName, sel, synSel] of [["dark", "DARK", ":root, [data-theme=\"dark\"]", ":root, [data-theme=\"dark\"]"], ["light", "LIGHT", "[data-theme=\"light\"] {", "[data-theme=\"light\"] {"]]) {
    const tui = tuiPalette(rs, tuiName);
    const pal = { ...block(tokens, sel), ...block(md, synSel) };
    for (const [role, field] of Object.entries(MD_ROLES)) {
      const v = /^var\((--p-[\w-]+)\)$/.exec(roles[role] ?? "");
      assert.ok(v, `${role} does not read a palette entry: ${roles[role]}`);
      const got = (pal[v[1]] ?? "").toLowerCase();
      assert.equal(got, tui[field], `${mode}: ${role} is ${got} (${v[1]}), the TUI's ${field} is ${tui[field]}`);
    }
  }
});

law("components read roles only: no palette (--p-*) and no raw color in css/", () => {
  for (const [f, s] of Object.entries(css)) {
    const body = noComments(s);
    assert.ok(!/--p-/.test(body), `${f} reads the palette (--p-*)`);
    const raw = body.match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/);
    assert.ok(!raw, `${f} has a raw color: ${raw && raw[0]}`);
  }
});

law("live.css shows focus with real selectors (:focus-within on the field and the composer's box)", () => {
  const live = noComments(css["live.css"]);
  assert.ok(/\.b-field:focus-within\{/.test(live));
  assert.ok(/\.b-composer \.box:focus-within\{/.test(live));
  assert.ok(/caret-color:var\(--c-text\)/.test(live));
});

law("never by color alone (bar N2): increase contrast gives every color cue of css/ a glyph or a shape", () => {
  const live = noComments(css["live.css"]);
  const at = live.indexOf("@media (prefers-contrast: more), (forced-colors: active)");
  assert.ok(at >= 0, "live.css has no increase-contrast block");
  const block = live.slice(at);
  // each color cue: the selector that must get a stand-in inside the block
  const cues = {
    ".b-dot.wk::after{content:": "a working dot", ".b-dot.nd::after{content:": "a needs-you dot", ".b-dot.ok::after{content:": "a done dot",
    ".b-dot.er::after{content:": "an error dot", ".b-dot.off::after{content:": "an offline dot", ".b-chip.err::before{content:": "an error chip",
    ".b-chip.ok::before{content:": "an ok chip", ".b-chip.acc{box-shadow:": "an accent chip", ".b-bar.err>i{background:repeating-linear-gradient": "an error bar",
    ".b-help.err::before{content:": "an error help line", ".b-field.is-error::after{content:": "a field in error", ".b-msg.is-error .b-text::before{content:": "a message in error",
  };
  for (const [sel, what] of Object.entries(cues)) assert.ok(block.includes(sel), `${what} has no stand-in (${sel})`);
  // and the reference's color-only rules are all covered: every tone/state class with a color in prim.css,
  // but a done bar, which already reads by its shape (solid and still, where a running bar is dashed and moves)
  const byShape = new Set([".b-bar.done"]);
  for (const m of noComments(css["prim.css"]).matchAll(/\.(b-(?:chip|dot|bar|help))\.(\w+)[^{]*\{[^}]*var\(--c-(?:err|ok|accent)/g)) {
    const sel = `.${m[1]}.${m[2]}`;
    assert.ok(byShape.has(sel) || block.includes(sel), `${sel} is colored in prim.css but has no stand-in`);
  }
});

law("every control he can act on shows a hover (bar O.6)", () => {
  const all = noComments(Object.values(css).join(" "));
  for (const sel of [".b-btn:hover", ".b-row:hover", ".b-opt:hover", ".b-seg>span:hover", ".b-toggle:not(.is-disabled):hover", ".b-check:hover", ".b-field:not(.is-focus):not(.is-error):not(:focus-within):hover", ".b-chip[role=button]:hover", ".b-mi:not(.dis):not(.on):hover", ".b-tabs>span:not(.on):hover", ".b-task:hover", ".b-art:hover", ".b-tn:hover"]) {
    assert.ok(all.includes(sel), `no hover rule: ${sel}`);
  }
});

const tsx = readdirSync(here).filter((f) => f.endsWith(".tsx"));
// the code without its comments (a comment may name window.html or document the DOM)
const src = Object.fromEntries(tsx.map((f) => [f, noComments(read(join(here, f))).replace(/^\s*\/\/.*$/gm, "")]));

law("components are pure: their state and effects only through hooks.ts, never the store, the app or a DOM rewrite (purity.mjs)", () => {
  const files = readdirSync(here).filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$|\.pending\.ts$/.test(f));
  const faults = purityFaults(Object.fromEntries(files.map((f) => [f, noComments(read(join(here, f))).replace(/^\s*\/\/.*$/gm, "")])));
  assert.deepEqual(faults, []);
});

law("every clickable part can carry a data-testid", () => {
  for (const [f, s] of Object.entries(src)) {
    // an open tag with onClick, its arrows (=>) kept inside it
    const tags = [...s.matchAll(/<(?:button|div|span|label)\b(?:=>|[^>])*?\bonClick=(?:=>|[^>])*>/g)].map((m) => m[0]);
    assert.ok(f !== "prim.tsx" || tags.length >= 3, `${f}: the tag scan found only ${tags.length} clickable parts`);
    for (const t of tags) assert.ok(/data-testid=/.test(t), `${f}: a clickable part without data-testid: ${t.slice(0, 90)}`);
  }
});

law("the rows of long lists are memo'd and take a ref", () => {
  const all = Object.values(src).join("\n");
  for (const name of ["Row", "Msg", "SpotRow", "Job"]) {
    assert.ok(new RegExp(`export const ${name} = memo\\(function ${name}\\(\\{[^}]*\\bref\\b`).test(all), `${name} is not memo'd with a ref`);
  }
  assert.ok(/export const MenuItem = memo\(/.test(all));
});

law("the composer's frame and the spotlight take their input as a slot, never their own editable", () => {
  for (const f of ["composer.tsx", "overlays.tsx"]) {
    assert.ok(!/contentEditable|<input|<textarea/.test(src[f]), `${f} draws its own input`);
  }
});

console.log(`${fail ? "✗" : "✓"} src/ds: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
