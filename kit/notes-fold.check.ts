// bise kit · the laws of notes-fold.js's pure half (node, no deps): when the notes box comes
// folded, what opens it by itself, what a page keeps.
//   node --experimental-strip-types kit/notes-fold.check.ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
// notes-fold.js's pure half, as these laws use it
type Note = { id: string; status: string; answer?: string };
type Fold = { started: boolean; folded: boolean; explicit: boolean | null; seen: string[] };
type Saved = { folded: boolean | null; seen: string[] };
type FoldCore = {
  FW: { pill(n: number): string; key: string };
  start(saved: unknown): Fold;
  step(st: Fold, notes: Note[], composing: boolean): Fold;
  toggle(st: Fold): Fold;
  shown(st: Fold, count: number, composing: boolean): boolean;
  saved(st: Fold): Saved;
};
const ctx = {};
vm.runInNewContext(readFileSync(join(here, "notes-fold.js"), "utf8"), ctx);
const F: FoldCore = Reflect.get(ctx, "BiseNotesFold").core;

let n = 0;
const law = (_name: string, f: () => void) => { f(); n++; };
const plain = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const draft = (id: string): Note => ({ id, status: "draft" });
const done = (id: string): Note => ({ id, status: "done" });
const answered = (id: string, answer: string): Note => ({ id, status: "answered", answer });
// a visit: the page kept `saved`, the render passes, then what it keeps
const visit = (saved: unknown, ...renders: [notes: Note[], composing?: boolean][]) => {
  let st = F.start(saved);
  for (const [notes, composing] of renders) st = F.step(st, notes, !!composing);
  return st;
};

law("a first visit with only your drafts: folded once read", () => {
  const st = visit(null, [[]], [[draft("n1")]]);
  assert.equal(F.shown(st, 1, false), true);
});

law("the empty render before the server answers decides nothing", () => {
  const st = visit(null, [[]]);
  assert.equal(st.started, false);
  assert.equal(F.shown(st, 0, false), false);
});

law("an agent's answer or a done you have not seen opens the box", () => {
  assert.equal(visit(null, [[answered("n1", "on it")]]).folded, false);
  assert.equal(visit({ folded: true, seen: [] }, [[done("n1")]]).folded, false);
});

law("seen with the box open, the same outcomes come folded on the next visit", () => {
  const first = visit(null, [[done("n1")]]);
  assert.equal(first.folded, false);
  const again = visit(F.saved(first), [[done("n1")]]);
  assert.equal(again.folded, true);
  // the empty render before the server answers forgets nothing you saw or chose
  const kept = visit(plain(F.saved(F.toggle(first))), [[]], [[done("n1")]]);
  assert.equal(kept.folded, true);
  assert.equal(kept.explicit, true);
});

law("your fold and your open are kept per page", () => {
  const opened = F.toggle(visit(null, [[draft("n1")]]));
  assert.equal(opened.folded, false);
  assert.equal(visit(plain(F.saved(opened)), [[draft("n1")]]).folded, false);
  const folded = F.toggle(F.toggle(visit(null, [[draft("n1")]])));
  assert.equal(visit(plain(F.saved(folded)), [[draft("n1")]]).folded, true);
});

law("your own typing never opens it for good: the composer shows it, the fold stays", () => {
  let st = visit(null, [[draft("n1")]]);
  st = F.step(st, [draft("n1"), draft("n2")], true);
  assert.equal(F.shown(st, 2, true), false, "the composer is in the box: it shows while you type");
  st = F.step(st, [draft("n1"), draft("n2")], false);
  assert.equal(F.shown(st, 2, false), true);
});

law("a note you add on a page that had none keeps the box open", () => {
  const st = visit(null, [[]], [[draft("n1")], true], [[draft("n1")]]);
  assert.equal(F.shown(st, 1, false), false);
});

law("something new while folded opens it and forgets your fold", () => {
  let st = F.toggle(visit(null, [[draft("n1")]], [[draft("n1")]]));
  st = F.toggle(st);
  assert.equal(st.folded, true);
  st = F.step(st, [answered("n1", "done, see v2")], false);
  assert.equal(st.folded, false);
  assert.equal(st.explicit, null);
  // a new answer text on the same note is new too
  st = F.toggle(st);
  st = F.step(st, [answered("n1", "and v3")], false);
  assert.equal(st.folded, false);
});

law("sending is not news: a sent note does not open the box", () => {
  let st = visit(null, [[draft("n1")]]);
  st = F.step(st, [{ id: "n1", status: "sent" }], false);
  assert.equal(st.folded, true);
});

law("0 notes: no pill", () => {
  const st = F.toggle(visit(null, [[draft("n1")]]));
  assert.equal(F.shown(F.toggle(st), 0, false), false);
});

law("a broken saved value is a first visit", () => {
  for (const s of ["x", 3, { folded: "yes", seen: "n1" }]) assert.equal(visit(s, [[draft("n1")]]).folded, true);
});

law("the pill's words", () => {
  assert.equal(F.FW.pill(1), "notes · 1");
  assert.equal(F.FW.key, "l fold");
});

console.log(`notes-fold: ${n} laws ok`);
