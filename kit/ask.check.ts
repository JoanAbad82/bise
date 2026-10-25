// bise kit · the laws of ask.js's pure half (node, no deps): what a page's ask linked to its
// notification says while it waits in the inbox, then who picked what, where and when.
//   node --experimental-strip-types kit/ask.check.ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
// ask.js's pure half, as these laws use it: a page's ask as the hub keeps it, its line
type Ask = { block: string; open?: boolean; count?: number; reply?: string | number; n?: number; key?: string; via?: string; at_ms?: number };
type AskCore = { line(a: Ask | null, count: number): string | null };
const ctx = { Date, String };
vm.runInNewContext(readFileSync(join(here, "ask.js"), "utf8"), ctx);
const A: AskCore = Reflect.get(ctx, "BiseAsk").core;

let n = 0;
const law = (_name: string, f: () => void) => { f(); n++; };

law("it waits in the inbox while its notification is open, with the keys there", () => {
  assert.equal(A.line({ block: "look", open: true }, 4), "? waits in your inbox · 1–4 there, or pick here");
  assert.equal(A.line({ block: "look", open: true }, 2), "? waits in your inbox · 1 2 there, or pick here");
  assert.equal(A.line({ block: "look", open: true }, 1), "? waits in your inbox · 1 there, or pick here");
  // a pick of 6: its card holds the first 3 (the hub's count)
  assert.equal(A.line({ block: "look", open: true, count: 3 }, 6), "? waits in your inbox · 1–3 there, or pick here");
});

law("closed unanswered or unknown: the page asks alone, no line", () => {
  assert.equal(A.line({ block: "look", open: false }, 4), null);
  assert.equal(A.line(null, 4), null);
});

law("answered: a pick by its key, a question by its words; the inbox named; the time", () => {
  const at = new Date(2026, 9, 15, 11, 42).getTime();
  assert.equal(A.line({ block: "look", reply: "A · pink", n: 1, key: "a", via: "inbox", at_ms: at }, 4), "✓ you picked A in the inbox · 11:42");
  assert.equal(A.line({ block: "look", reply: "B · frame", n: 2, key: "b", via: "page", at_ms: at }, 4), "✓ you picked B · 11:42");
  assert.equal(A.line({ block: "q1", reply: "post now", n: 1, via: "page", at_ms: at }, 2), "✓ you picked post now · 11:42");
  assert.equal(A.line({ block: "q1", reply: "post now" }, 2), "✓ you picked post now", "an older hub: no time");
});

console.log(`✓ ask.js laws: ${n} passed`);
