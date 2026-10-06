// src/ds · the design system's laws on its files (node src/ds/check.mjs; no browser, no deps).
// The pixels are the gallery's (gallery/shoot.mjs); the components' behavior is in the unit tests.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const here = import.meta.dirname;
const ref = join(here, "..", "..", "..", "ambient", "web", "ds");
const read = (p) => readFileSync(p, "utf8");
const cssDir = join(here, "css");
const css = Object.fromEntries(readdirSync(cssDir).filter((f) => f.endsWith(".css")).map((f) => [f, read(join(cssDir, f))]));
const noComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");

let pass = 0, fail = 0;
function law(name, fn) {
  try { fn(); pass++; console.log("  ✓ " + name); } catch (e) { fail++; console.log("  ✗ " + name + "\n    " + String(e instanceof Error ? e.message : e).split("\n")[0]); }
}

law("tokens.css is desktop-ds v5's, byte for byte (apps/ambient/web/ds/tokens.css)", () => {
  assert.equal(read(join(here, "tokens.css")), read(join(ref, "tokens.css")));
});

law("css/ holds every rule of the reference's ds.css, unchanged", () => {
  const all = Object.values(css).join("\n");
  const rules = read(join(ref, "ds.css")).split("\n").filter((l) => l.trim() && !l.startsWith("/*") && !/^\s/.test(l) && l.includes("{"));
  assert.ok(rules.length > 100, `only ${rules.length} rules read from ds.css`);
  for (const l of rules) assert.ok(all.includes(l), `missing from css/: ${l.slice(0, 90)}`);
});

law("index.css imports tokens.css first, then every file of css/, live.css last", () => {
  const imports = [...read(join(here, "index.css")).matchAll(/@import "\.\/([\w/.-]+)";/g)].map((m) => m[1]);
  assert.equal(imports[0], "tokens.css");
  assert.equal(imports[imports.length - 1], "css/live.css");
  assert.deepEqual([...imports.slice(1)].sort(), Object.keys(css).map((f) => "css/" + f).sort());
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

const tsx = readdirSync(here).filter((f) => f.endsWith(".tsx"));
// the code without its comments (a comment may name window.html or document the DOM)
const src = Object.fromEntries(tsx.map((f) => [f, noComments(read(join(here, f))).replace(/^\s*\/\/.*$/gm, "")]));

law("components are pure: no state, effect, store, or DOM rewrite", () => {
  for (const [f, s] of Object.entries(src)) {
    for (const bad of ["useState", "useEffect", "useLayoutEffect", "useReducer", "useSyncExternalStore", "innerHTML", "dangerouslySetInnerHTML"]) {
      assert.ok(!s.includes(bad), `${f} uses ${bad}`);
    }
    const dom = s.match(/\b(?:window|document)\.\w/);
    assert.ok(!dom, `${f} reaches the DOM: ${dom && dom[0]}`);
  }
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
