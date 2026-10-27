// bise kit · the laws of storage.js (node, no deps): a site copy's localStorage in its sandbox
// (web-storage, architect m_46151). The site writes, its frame posts the whole map to bise's
// viewer, the hub keeps it and seeds the next load (the page server's inert JSON block): after a
// reload, a new panel or an app restart, the site reads back what it wrote. storage.js runs in a
// vm with a fake sandboxed window (its Storage getters throw, as in an opaque origin).
//   node --experimental-strip-types kit/storage.check.ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(here, "storage.js"), "utf8");

type Posted = { bise: string; local: Record<string, string> };
type Load = { window: Record<string, unknown>; posted: Posted[]; run: (js: string) => unknown };

/** One load of a site page: `seed` is the map the hub put in the page (none: no block), `framed`
 * whether bise's viewer frames it, `working` a window whose Storage works (not sandboxed). */
function load(seed: Record<string, string> | null, opts: { framed?: boolean; working?: boolean } = {}): Load {
  const posted: Posted[] = [];
  const parent = { postMessage: (m: Posted) => { posted.push(JSON.parse(JSON.stringify(m))); } };
  const window: Record<string, unknown> = {};
  window.parent = opts.framed === false ? window : parent;
  for (const name of ["localStorage", "sessionStorage"]) {
    Object.defineProperty(window, name, {
      configurable: true,
      get() {
        if (opts.working) return { real: true };
        throw new Error("SecurityError: the sandbox forbids it");
      },
    });
  }
  // the page server's block: `<` escaped as \u003c (site.rs seed_block), parsed back the same
  const block = seed === null ? null : { getAttribute: (a: string) => (a === "type" ? "application/json" : null), textContent: JSON.stringify(seed).replace(/</g, "\\u003c") };
  const document = { getElementById: (id: string) => (id === "bise-storage" ? block : null) };
  const ctx = vm.createContext({ window, document, queueMicrotask });
  vm.runInContext(SRC, ctx);
  return { window, posted, run: (js) => vm.runInContext(`(function(localStorage, sessionStorage){ return ${js}; })(window.localStorage, window.sessionStorage)`, ctx) };
}
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

let n = 0;
const law = async (_name: string, f: () => Promise<void> | void) => { await f(); n++; };

await law("he writes in the panel, reloads it, reopens it: his edits are back", async () => {
  // what the hub keeps (artifacts_storage), between loads
  let hub: Record<string, string> | null = null;
  const first = load(hub);
  assert.equal(first.run(`localStorage.getItem("budget")`), null, "nothing yet");
  first.run(`(localStorage.setItem("budget", JSON.stringify({ rent: 900 })), localStorage.setItem("note", "</script>x"), localStorage.removeItem("none"))`);
  await tick();
  assert.equal(first.posted.length, 1, "one post for the writes of one task");
  assert.deepEqual(first.posted[0], { bise: "site-storage", local: { budget: '{"rent":900}', note: "</script>x" } });
  hub = first.posted[0]!.local;
  // a reload, a new panel, an app restart: a new load, seeded by the hub
  for (const again of [load(hub), load(hub)]) {
    assert.equal(again.run(`localStorage.getItem("budget")`), '{"rent":900}');
    assert.equal(again.run(`localStorage.getItem("note")`), "</script>x");
    assert.equal(again.run(`localStorage.length`), 2);
    assert.equal(again.posted.length, 0, "reading posts nothing");
  }
  const later = load(hub);
  later.run(`localStorage.clear()`);
  await tick();
  assert.deepEqual(later.posted.at(-1), { bise: "site-storage", local: {} }, "a clear is kept too");
});

await law("sessionStorage stays in memory: never seeded, never posted", async () => {
  const l = load({ k: "v" });
  assert.equal(l.run(`sessionStorage.getItem("k")`), null);
  l.run(`sessionStorage.setItem("s", "1")`);
  await tick();
  assert.equal(l.posted.length, 0);
  assert.equal(l.run(`sessionStorage.getItem("s")`), "1");
});

await law("a copy alone in a tab: seeded, its writes in memory for that load only", async () => {
  const l = load({ k: "v" }, { framed: false });
  assert.equal(l.run(`localStorage.getItem("k")`), "v");
  l.run(`localStorage.setItem("k", "w")`);
  await tick();
  assert.equal(l.run(`localStorage.getItem("k")`), "w");
  assert.equal(l.posted.length, 0, "no parent to post to");
});

await law("a working Storage is never replaced, and a broken seed is an empty one", async () => {
  const ok = load({ k: "v" }, { working: true });
  assert.deepEqual(ok.run(`localStorage`), { real: true });
  const broken = load(null);
  assert.equal(broken.run(`localStorage.length`), 0);
});

console.log(`storage.check: ${n} laws ok`);
