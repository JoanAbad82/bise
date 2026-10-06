// bise desktop window · the components' laws (node apps/ambient/web/window/check.mjs). A small fake
// DOM, no browser: every fixture renders, the markup is the design system's, a click reaches on(act),
// the css reads only roles. Pixels are dev.html's, in headless shots.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ---- the fake DOM: elements, text, attributes, click events, serialization ----
class Text { constructor(t) { this.nodeType = 3; this.data = t; this.parentNode = null; } get textContent() { return this.data; } }
class El {
  constructor(tag) { this.nodeType = 1; this.tagName = tag.toUpperCase(); this.attrs = new Map(); this.childNodes = []; this.parentNode = null; this.listeners = {}; }
  get className() { return this.attrs.get("class") || ""; }
  set className(v) { if (v) this.attrs.set("class", v); else this.attrs.delete("class"); }
  setAttribute(k, v) { this.attrs.set(k, String(v)); }
  getAttribute(k) { return this.attrs.has(k) ? this.attrs.get(k) : null; }
  append(...ns) { for (const n of ns) { n.parentNode = this; this.childNodes.push(n); } }
  get children() { return this.childNodes.filter((n) => n.nodeType === 1); }
  get textContent() { return this.childNodes.map((n) => n.textContent).join(""); }
  addEventListener(t, f) { (this.listeners[t] ||= []).push(f); }
  click() { let n = this; const e = { target: this }; while (n) { for (const f of n.listeners.click || []) f(e); n = n.parentNode; } }
  all(pred, out = []) { for (const c of this.children) { if (pred(c)) out.push(c); c.all(pred, out); } return out; }
}
const doc = { createElement: (t) => new El(t), createTextNode: (t) => new Text(t) };
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const html = (n) => n.nodeType === 3 ? esc(n.data)
  : `<${n.tagName.toLowerCase()}${[...n.attrs].map(([k, v]) => ` ${k}="${esc(v).replace(/"/g, "&quot;")}"`).join("")}>${n.childNodes.map(html).join("")}</${n.tagName.toLowerCase()}>`;

// ---- load the components like the page does ----
globalThis.BiseUI = undefined;
const UI = require("./components/core.js");
for (const f of ["prim", "window", "thread", "composer", "board", "fixtures"]) require(`./components/${f}.js`);
UI.use(doc);

let pass = 0, fail = 0;
function law(name, f) {
  try { f(); pass++; } catch (e) { fail++; console.log(`✗ ${name}\n  ${e.message.split("\n").join("\n  ")}`); }
}

const css = Object.fromEntries(readdirSync(join(here, "components")).filter((f) => f.endsWith(".css")).map((f) => [f, readFileSync(join(here, "components", f), "utf8")]));
const allCss = Object.values(css).join("\n");
const classesIn = (el) => el.all(() => true, [el]).flatMap((n) => n.className.split(/\s+/).filter(Boolean));

law("every fixture renders, twice the same (no state kept), and every class it uses is in the css", () => {
  for (const [name, states] of Object.entries(UI.fixtures)) {
    assert.equal(typeof UI[name], "function", `${name}: no component`);
    for (const [label, data] of states) {
      const a = html(UI[name](data)), b = html(UI[name](data));
      assert.equal(a, b, `${name} · ${label}: two renders differ`);
      for (const c of classesIn(UI[name](data))) assert.ok(new RegExp(`\\.${c.replace(/[-]/g, "\\-")}(?![\\w-])`).test(allCss), `${name} · ${label}: class .${c} is in no css`);
    }
  }
});

law("every component has fixtures, except the frames that only hold children", () => {
  const frames = ["win", "main", "thread"];
  const defined = Object.keys(UI).filter((k) => typeof UI[k] === "function" && UI[k].render && !frames.includes(k));
  for (const k of defined) assert.ok(UI.fixtures[k], `${k} has no fixtures (dev.html wouldn't show it)`);
});

law("the markup is the design system's (components/*.html)", () => {
  assert.equal(html(UI.btn({ text: "merge", kind: "pri", state: "loading" })), `<button class="b-btn pri is-loading">merge</button>`);
  assert.equal(html(UI.dot({ state: "nd", lg: true })), `<i class="b-dot nd lg"></i>`);
  assert.equal(html(UI.row({ kind: "ag", name: "checkout", dot: { state: "wk" } })), `<div class="b-row ag"><i class="b-dot wk"></i><span class="nm">checkout</span></div>`);
  assert.equal(html(UI.row({ kind: "pj", name: "storefront", dot: { state: "nd" }, end: 1, needs: true })), `<div class="b-row pj"><i class="b-dot nd lg"></i><span class="nm">storefront</span><span class="end nd">1</span></div>`);
  assert.equal(html(UI.row({ kind: "me", name: "bise", sub: "every project", end: 3, needs: true, on: true })),
    `<div class="b-row me on"><span class="b-pearl s22" data-bise-pearl="22">:*</span><span><span class="nm">bise</span><span class="sub">every project</span></span><span class="end nd">3</span></div>`);
  assert.equal(html(UI.route({ state: "wk", p1: "telemetry · main → alerts", p2: "p99", p3: "4 min", pct: 45 })),
    `<div class="b-route"><i class="b-dot wk"></i><span><span class="p1">telemetry · main → alerts</span> <span class="p2">p99</span></span><span class="p3">4 min</span><div class="b-bar"><i class="w45"></i></div></div>`);
  assert.equal(html(UI.tool({ text: "ran 4 commands" })), `<div class="b-tool"><span class="chev">▸</span><span class="lbl">ran 4 commands</span></div>`);
  assert.equal(html(UI.diff({ file: "a.json", add: 1, lines: [{ new: 15, sign: "+", text: "x", sel: true }] })),
    `<div class="b-diff"><div class="fh">a.json <span class="ok">+1</span></div><div class="b-dl ad pk"><i></i><i>15</i><i>+</i>x</div></div>`);
  assert.equal(html(UI.opts({ items: [{ n: 1, text: "tonight", on: true }], typeHint: "or type" })),
    `<div class="b-opts"><span class="b-opt on"><b>1</b>tonight</span><span class="b-opt ty">or type</span></div>`);
  assert.equal(html(UI.composer({ to: "you → bise", placeholder: "talk to bise", send: "off", keys: "⌘I inbox" })),
    `<div class="b-composer"><div class="div">you → bise</div><div class="box"><div class="in"><span class="ph">talk to bise</span></div><span class="send off">↑</span></div><div class="keys">⌘I inbox</div></div>`);
  assert.equal(html(UI.job({ state: "nd", name: "search", key: "⌥2", psi: true, end: "?", what: "reindex?" })),
    `<div class="b-task nd"><div class="a"><i class="b-dot nd"></i> <b>search</b> <span class="b-kbd">⌥2</span> ψ<span class="end">?</span></div><div class="w">reindex?</div></div>`);
});

law("a click on a part with an act calls on(act) once; a disabled part, or a part without act, never", () => {
  const got = [];
  const side = UI.side(UI.fixtures.side[0][1], (a) => got.push(a));
  side.all((n) => n.className === "foot")[0].click();
  assert.deepEqual(got, [{ ev: "ui_add_project" }]);
  const dock = UI.dock(UI.fixtures.dock[0][1], (a) => got.push(a));
  dock.all((n) => n.className.split(" ")[0] === "b-opt")[1].all(() => true, [])[0].click(); // the <b> inside option 2
  assert.deepEqual(got.at(-1), { ev: "ui_answer", i: 2 });
  const n = got.length;
  UI.btn({ text: "x", state: "disabled", act: { ev: "no" } }, (a) => got.push(a)).click();
  UI.chip({ text: "plain" }, (a) => got.push(a)).click();
  assert.equal(got.length, n);
});

law("words from data are text, never markup; `code` becomes a code element", () => {
  const m = UI.msg({ from: "agent", name: "x", text: "<img src=x onerror=alert(1)> and `cargo test`" });
  const out = html(m);
  assert.ok(out.includes("&lt;img src=x onerror=alert(1)&gt;"), out);
  assert.ok(out.includes("<code>cargo test</code>"), out);
  assert.equal(m.all((n) => n.tagName === "IMG").length, 0);
});

law("components read roles only: no palette (--p-*) and no raw color in components/*.css", () => {
  for (const [f, s] of Object.entries(css)) {
    const body = s.replace(/\/\*[\s\S]*?\*\//g, "");
    assert.ok(!/--p-/.test(body), `${f} reads the palette (--p-*)`);
    const raw = body.match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/);
    assert.ok(!raw, `${f} has a raw color: ${raw && raw[0]}`);
  }
});

law("all.css imports every component css, and tokens.css is the design system's", () => {
  for (const f of Object.keys(css)) if (f !== "all.css") assert.ok(css["all.css"].includes(`@import url("${f}")`), `all.css misses ${f}`);
  assert.equal(readFileSync(join(here, "tokens.css"), "utf8"), readFileSync(join(here, "..", "ds", "tokens.css"), "utf8"));
});

law("the split css holds every rule of the design system's ds.css", () => {
  const ds = readFileSync(join(here, "..", "ds", "ds.css"), "utf8").split("\n").filter((l) => l.trim() && !l.startsWith("/*") && !/^\s/.test(l) && l.includes("{"));
  for (const l of ds) assert.ok(allCss.includes(l), `missing from components/*.css: ${l.slice(0, 80)}`);
});

console.log(`${fail ? "✗" : "✓"} window components: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
