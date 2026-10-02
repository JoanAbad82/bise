// bise kit · the laws of kit.js (node, no deps): the in-place swap by data-id (nodes kept,
// order, scroll kept, bise:swapped), what changed by block hash, the components' behavior
// (numbers in tables, question picks), and that the kit itself never writes a style. kit.js runs
// in a vm with a small fake DOM (no browser).
//   node apps/ambient/kit/check.mjs
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));

// ---- a fake DOM: elements with attributes, children, text; a tiny HTML parser for fragments ----
const VOID = new Set(["br", "img", "hr"]);
class Text { constructor(t) { this.text = t; this.parent = null; } get textContent() { return this.text; } get outerHTML() { return this.text; } }
class El {
  constructor(tag) { this.tagName = tag.toUpperCase(); this.attrs = new Map(); this.nodes = []; this.parent = null; }
  get children() { return this.nodes.filter((n) => n instanceof El); }
  getAttribute(k) { return this.attrs.has(k) ? this.attrs.get(k) : null; }
  setAttribute(k, v) { this.attrs.set(k, String(v)); }
  removeAttribute(k) { this.attrs.delete(k); }
  hasAttribute(k) { return this.attrs.has(k); }
  get textContent() { return this.nodes.map((n) => n.textContent).join(""); }
  get outerHTML() {
    const t = this.tagName.toLowerCase();
    const a = [...this.attrs].map(([k, v]) => (v === "" ? ` ${k}` : ` ${k}="${v}"`)).join("");
    return VOID.has(t) ? `<${t}${a}>` : `<${t}${a}>${this.nodes.map((n) => n.outerHTML).join("")}</${t}>`;
  }
  append(...ns) { for (const n of ns) { if (n.parent) n.parent.removeChild(n); n.parent = this; this.nodes.push(n); } }
  removeChild(n) { const i = this.nodes.indexOf(n); assert.ok(i >= 0, "removeChild of a non-child"); this.nodes.splice(i, 1); n.parent = null; return n; }
  insertBefore(n, ref) {
    if (n.parent) n.parent.removeChild(n);
    const i = ref == null ? this.nodes.length : this.nodes.indexOf(ref);
    assert.ok(i >= 0, "insertBefore: ref is not a child");
    this.nodes.splice(i, 0, n); n.parent = this; ops.push(["insert", n.getAttribute && n.getAttribute("data-id")]); return n;
  }
  // descendants by tag name only (what kit.js's pure half asks for)
  querySelectorAll(tag) {
    const out = [], T = tag.toUpperCase();
    const walk = (e) => { for (const c of e.children) { if (c.tagName === T) out.push(c); walk(c); } };
    walk(this);
    return out;
  }
}
let ops = [];
function parse(html) {
  const root = new El("main");
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<\/([a-z0-9]+)\s*>|<([a-z0-9]+)((?:\s+[a-z-]+(?:="[^"]*")?)*)\s*\/?>|([^<]+)/gi;
  for (const m of html.matchAll(re)) {
    const top = stack[stack.length - 1];
    if (m[1]) { while (stack.length > 1 && stack.pop().tagName !== m[1].toUpperCase()); continue; }
    if (m[2]) {
      const e = new El(m[2]);
      for (const a of (m[3] || "").matchAll(/([a-z-]+)(?:="([^"]*)")?/gi)) e.setAttribute(a[1], a[2] ?? "");
      top.append(e);
      if (!VOID.has(m[2].toLowerCase())) stack.push(e);
      continue;
    }
    if (m[4]) top.append(new Text(m[4]));
  }
  return root;
}
const blocks = (main) => main.children.filter((c) => c.getAttribute("data-kit") != null);
const ids = (main) => blocks(main).map((b) => b.getAttribute("data-id"));

// ---- kit.js in a vm: no document, so only BiseKit (the pure half) loads ----
const events = [];
class CustomEvent { constructor(type, init) { this.type = type; this.detail = init && init.detail; } }
const ctx = vm.createContext({ console, Math, JSON, Object, Array, Set, Map, WeakMap, String, Number, Date, CustomEvent, parseInt });
vm.runInContext(readFileSync(join(here, "kit.js"), "utf8"), ctx, { filename: "kit.js" });
const K = ctx.BiseKit;
const doc = { dispatchEvent: (e) => events.push({ type: e.type, detail: JSON.parse(JSON.stringify(e.detail)) }) };
const j = (x) => JSON.parse(JSON.stringify(x));

// FNV-1a 64 over the folded block source, like rust/switchboard/src/pages/lint.rs, for fake metas
function fnv(s) {
  let h = 0xcbf29ce484222325n;
  for (const b of Buffer.from(s)) { h ^= BigInt(b); h = (h * 0x100000001b3n) & 0xffffffffffffffffn; }
  return h.toString(16).padStart(16, "0");
}
const blockList = (html) => blocks(parse(html)).map((b) => ({ id: b.getAttribute("data-id"), kit: b.getAttribute("data-kit"), hash: fnv(K.norm(b.outerHTML)) }));
const metaOf = (...versions) => ({ versions: versions.map((html, i) => ({ n: i + 1, at_ms: 1000 * i, blocks: blockList(html) })) });

let pass = 0, fail = 0;
function law(name, fn) {
  ops = []; events.length = 0;
  try { fn(); pass++; } catch (e) { fail++; console.log(`✗ ${name}\n  ${String(e.stack || e.message).split("\n").slice(0, 6).join("\n  ")}`); }
}

const V1 = `<section data-kit="heading" data-id="h"><h1>week 41</h1></section>
<section data-kit="prose" data-id="p1"><p>signup is 4× faster.</p></section>
<section data-kit="table" data-id="t1"><table><tr><td>signups</td><td>412</td></tr></table></section>
<section data-kit="prose" data-id="p2"><p>the banner is smaller.</p></section>`;
const V2 = `<section data-kit="heading" data-id="h"><h1>week 41</h1></section>
<section data-kit="prose" data-id="p1"><p>signup is faster: 4.1 s → 0.9 s.</p></section>
<section data-kit="callout" data-id="c1" data-tone="risk"><h3>heads-up</h3><p>2.5 slips.</p></section>
<section data-kit="table" data-id="t1"><table><tr><td>signups</td><td>412</td></tr></table></section>`;

// ---- the swap ----
law("an unchanged block stays the same node; a changed one is replaced; a new one comes in; a gone one goes", () => {
  const main = parse(V1);
  blocks(main).forEach(K.remember);
  const [h, p1, t1, p2] = blocks(main);
  const res = K.swap(main, blocks(parse(V2)), null, null);
  assert.deepEqual(ids(main), ["h", "p1", "c1", "t1"]);
  const now = blocks(main);
  assert.equal(now[0], h, "heading kept");
  assert.equal(now[3], t1, "table kept");
  assert.notEqual(now[1], p1, "p1 replaced");
  assert.equal(now[1].textContent, "signup is faster: 4.1 s → 0.9 s.");
  assert.ok(!now.includes(p2) && p2.parent === null, "p2 removed");
  assert.deepEqual(j(res), { changed: ["p1", "c1"], removed: ["p2"] });
  assert.ok(now[1].hasAttribute("data-arrived") && !now[0].hasAttribute("data-arrived"));
});

law("with hashes, only the blocks whose hash differs are replaced, even if notes.js decorated the others", () => {
  const main = parse(V1);
  const p2 = blocks(main)[3];
  p2.append(new El("span")); // a pin notes.js put in
  const meta = metaOf(V1, V1.replace("4× faster", "faster"));
  const changed = K.diffBlocks(meta.versions[0].blocks, meta.versions[1].blocks).changed;
  assert.deepEqual(j(changed), ["p1"]);
  K.swap(main, blocks(parse(meta && V1.replace("4× faster", "faster"))), changed, null);
  assert.equal(blocks(main)[3], p2, "the decorated block is kept with its pin");
  assert.equal(p2.children.length, 2);
});

law("without hashes, a block is compared with the source it came with, not with notes.js's decorations", () => {
  const main = parse(V1);
  blocks(main).forEach(K.remember);
  const p2 = blocks(main)[3];
  p2.setAttribute("data-bn-anchored", ""); // notes.js's mark
  const res = K.swap(main, blocks(parse(V1)), null, null);
  assert.equal(blocks(main)[3], p2);
  assert.deepEqual(j(res.changed), []);
});

law("a reorder moves blocks, it does not rebuild them", () => {
  const main = parse(V1);
  const before = blocks(main);
  const re = `${V1.split("\n")[3]}\n${V1.split("\n")[0]}\n${V1.split("\n")[1]}\n${V1.split("\n")[2]}`;
  blocks(main).forEach(K.remember);
  const res = K.swap(main, blocks(parse(re)), null, null);
  assert.deepEqual(ids(main), ["p2", "h", "p1", "t1"]);
  assert.deepEqual(blocks(main), [before[3], before[0], before[1], before[2]]);
  assert.deepEqual(j(res.changed), []);
  assert.equal(ops.length, 1, `one move, got ${JSON.stringify(ops)}`);
});

law("the same version again changes nothing and moves nothing", () => {
  const main = parse(V2);
  blocks(main).forEach(K.remember);
  const before = blocks(main);
  const res = K.swap(main, blocks(parse(V2)), null, null);
  assert.deepEqual(blocks(main), before);
  assert.equal(ops.length, 0);
  assert.deepEqual(j(res), { changed: [], removed: [] });
});

// a fake layout: each block is as tall as its text, the page scrolled by scrollY
function layout(main, scrollY) {
  const view = {
    scrollY,
    heights: () => blocks(main).map((b) => 40 + b.textContent.length * 2),
    topOf(id) { let y = -view.scrollY; for (const b of blocks(main)) { if (b.getAttribute("data-id") === id) return y; y += 40 + b.textContent.length * 2; } return null; },
    anchor() { let y = -view.scrollY; for (const b of blocks(main)) { const h = 40 + b.textContent.length * 2; if (y + h > 46) return { id: b.getAttribute("data-id"), top: y }; y += h; } return null; },
    scrollBy(dy) { view.scrollY += dy; },
  };
  return view;
}
law("scroll is kept: the block you read stays where it was when blocks above it change", () => {
  const main = parse(V1);
  const view = layout(main, 120);
  const a = view.anchor();
  assert.equal(a.id, "t1");
  const longer = V1.replace("signup is 4× faster.", "signup is faster: 4.1 s → 0.9 s on a mid-range phone, from #perf.");
  K.swap(main, blocks(parse(longer)), ["p1"], view);
  assert.equal(view.topOf("t1"), a.top, "t1 still at the same place on screen");
  assert.ok(view.scrollY > 120);
});

law("scroll is kept: when the block you read is gone, the next one takes its place", () => {
  const main = parse(V1);
  const view = layout(main, 120);
  assert.equal(view.anchor().id, "t1");
  const without = V1.split("\n").filter((l) => !l.includes('data-id="t1"')).join("\n");
  K.swap(main, blocks(parse(without)), null, view);
  assert.deepEqual(ids(main), ["h", "p1", "p2"]);
});

law("applyVersion: swaps, marks what changed against the version before, and fires one bise:swapped", () => {
  const main = parse(V1);
  main.setAttribute("data-version", "1");
  const meta = metaOf(V1, V2);
  const res = K.applyVersion(doc, main, blocks(parse(V2)), meta, 1, 2, { agent: "weekly update" });
  assert.equal(main.getAttribute("data-version"), "2");
  assert.deepEqual(j(res.marked), ["p1", "c1"]);
  assert.deepEqual(blocks(main).filter((b) => b.hasAttribute("data-changed")).map((b) => b.getAttribute("data-id")), ["p1", "c1"]);
  assert.deepEqual(events, [{ type: "bise:swapped", detail: { version: 2, changed: ["p1", "c1"], removed: ["p2"] } }]);
});

law("applyVersion skipping a version: replaced by v1→v3 hashes, marked by v2→v3", () => {
  const V3 = V2.replace("2.5 slips.", "2.5 ships wednesday.");
  const main = parse(V1);
  const meta = metaOf(V1, V2, V3);
  const res = K.applyVersion(doc, main, blocks(parse(V3)), meta, 1, 3, {});
  assert.deepEqual(j(res.changed), ["p1", "c1"]);
  assert.deepEqual(j(res.marked), ["c1"]);
});

// ---- what changed ----
law("what changed: by hash; v1 has none; new blocks count, removed ones are listed apart", () => {
  const meta = metaOf(V1, V2);
  assert.deepEqual(j(K.changedIn(meta, 1)), []);
  assert.deepEqual(j(K.changedIn(meta, 2)), ["p1", "c1"]);
  assert.deepEqual(j(K.diffBlocks(meta.versions[0].blocks, meta.versions[1].blocks)), { changed: ["p1", "c1"], removed: ["p2"] });
  assert.deepEqual(j(K.changedIn(null, 2)), []);
  assert.deepEqual(j(K.changedIn({ versions: [{ n: 2, blocks: [] }] }, 2)), []);
});

law("the kit's hash is the lint's: re-indenting a block changes nothing", () => {
  const a = blockList(`<section data-kit="prose" data-id="p"><p>one two</p></section>`)[0].hash;
  const b = blockList(`<section data-kit="prose" data-id="p">\n   <p>one\n two</p>\n</section>`)[0].hash;
  assert.equal(a, b);
});

// ---- components ----
law("tables: numeric columns get data-num, text columns don't, the header follows its column", () => {
  const main = parse(`<section data-kit="table" data-id="t"><table><thead><tr><th>metric</th><th>last</th><th>this</th><th>note</th></tr></thead>
<tbody><tr><td>signups</td><td>412</td><td>1,468</td><td>up</td></tr><tr><td>p50</td><td>4.1 s</td><td>0.9 s</td><td>12</td></tr>
<tr><td>conversion</td><td>3.2 %</td><td>−3.4%</td><td></td></tr></tbody></table></section>`);
  K.decorate(blocks(main), "a");
  const rows = main.querySelectorAll("tr").map((tr) => tr.children.map((c) => (c.hasAttribute("data-num") ? "n" : "-")).join(""));
  assert.deepEqual(rows, ["-nn-", "-nn-", "-nn-", "-nn-"]);
});

law("numbers: what reads as a number", () => {
  for (const t of ["412", "1,468", "4.1 s", "3.2 %", "−3.4%", "$1,200", "€ 12", "+12%", "(3)", "4.1 s → 0.9 s", "~40 ms", "12k"]) assert.ok(K.isNumeric(t), t);
  for (const t of ["signups", "v2", "Q3 plan", "up 12%", "", "dark mode"]) assert.ok(!K.isNumeric(t), t);
});

const Q = `<section data-kit="question" data-id="q1"><p>post it now?</p><ol><li>post now</li><li>wait for <strong>Marc</strong></li></ol></section>`;
law("question: a pick marks one option and tells notes.js; the same pick again takes it back", () => {
  const main = parse(Q);
  const q = blocks(main)[0];
  K.decorate([q], "weekly update");
  assert.equal(q.getAttribute("data-by"), "weekly update");
  K.pick(doc, q, 2);
  assert.deepEqual(K.options(q).map((li) => li.hasAttribute("data-picked")), [false, true]);
  K.pick(doc, q, 1);
  assert.deepEqual(K.options(q).map((li) => li.hasAttribute("data-picked")), [true, false]);
  K.pick(doc, q, 1);
  assert.deepEqual(K.options(q).map((li) => li.hasAttribute("data-picked")), [false, false]);
  assert.deepEqual(events, [
    { type: "bise:pick", detail: { block: "q1", option: 2, text: "wait for Marc" } },
    { type: "bise:pick", detail: { block: "q1", option: 1, text: "post now" } },
    { type: "bise:pick", detail: { block: "q1", option: null, text: null } },
  ]);
  assert.equal(K.pick(doc, q, 3), null, "no option 3");
});

law("question: an answered one (data-answer, by number or by text) shows its pick and takes no other", () => {
  for (const ans of ["2", "Wait for Marc"]) {
    events.length = 0;
    const q = blocks(parse(Q.replace('data-id="q1"', `data-id="q1" data-answer="${ans}"`)))[0];
    K.decorate([q], "a");
    assert.deepEqual(K.options(q).map((li) => li.hasAttribute("data-picked")), [false, true], ans);
    assert.equal(K.pick(doc, q, 1), null);
    assert.equal(events.length, 0);
  }
});

law("ago: short words", () => {
  const now = 10_000_000;
  assert.equal(K.ago(now - 5_000, now), "just now");
  assert.equal(K.ago(now - 3 * 60_000, now), "3 min ago");
  assert.equal(K.ago(now - 2 * 3_600_000, now), "2 h ago");
  assert.equal(K.ago(now - 26 * 3_600_000, now), "yesterday");
  assert.equal(K.ago(now - 72 * 3_600_000, now), "3 days ago");
});

// ---- no style anywhere ----
law("the kit never writes a style: no style= in kit.js, no .style in its code, none in the examples", () => {
  const js = readFileSync(join(here, "kit.js"), "utf8").replace(/\/\/.*$/gm, "");
  assert.ok(!/style\s*=|\.style\b|setProperty\(/.test(js), "kit.js touches style");
  for (const f of readdirSync(join(here, "examples"))) {
    const html = readFileSync(join(here, "examples", f), "utf8");
    assert.ok(!/style/i.test(html), `${f} has a style`);
  }
});

law("kit.css takes its colors from tokens.css only", () => {
  const css = readFileSync(join(here, "kit.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const hex = css.match(/#[0-9a-f]{3,8}\b/gi) || [];
  assert.deepEqual(hex, [], `raw colors in kit.css: ${hex.join(" ")}`);
  assert.ok(!/rgba?\(|hsla?\(/.test(css), "raw rgb/hsl in kit.css");
});

law("every example page is a fragment of known blocks with unique ids", () => {
  const kinds = new Set(["prose", "heading", "callout", "sources", "table", "question"]);
  for (const f of readdirSync(join(here, "examples"))) {
    const main = parse(readFileSync(join(here, "examples", f), "utf8"));
    assert.ok(main.children.length > 0 && main.children.every((c) => c.tagName === "SECTION" && kinds.has(c.getAttribute("data-kit"))), f);
    const all = ids(main);
    assert.equal(new Set(all).size, all.length, `${f}: duplicate ids`);
  }
});

console.log(`${fail ? "✗" : "✓"} kit.js laws: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
