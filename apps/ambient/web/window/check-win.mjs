// bise desktop · the window's laws (node, no deps): the fake core's world played through the
// model, then the view read back. The sidebar, the three threads (bise, a project's main, an
// agent), the rule "everything waiting for you sits above the composer" (questions, approvals,
// the inbox, ← →, 1-9, ⏎, esc), quotes ❝ from diff lines, the keys of desktop-app v9.
//   node apps/ambient/web/window/check-win.mjs     (check.mjs runs it too)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
const ctx = vm.createContext({ console, Math, JSON, Object, Array, Set, Map, String, Number, Date, Intl, RegExp });
// the window as index.html loads it, S7's screens included (amb-web's files, when they are there)
import { existsSync } from "node:fs";
for (const f of ["winwords.js", "winfake.js", "winfake7.js", "windock.js", "winfind.js", "winenv.js", "winarts.js", "winreview.js", "wins7.js", "winmodel.js", "winview.js"].filter((f) => existsSync(join(here, f)))) vm.runInContext(readFileSync(join(here, f), "utf8"), ctx, { filename: f });
const { AmbWinFake: F, AmbWinModel: M, AmbWinView: V, AmbWinDock: D } = ctx;
const j = (x) => (x === undefined ? x : JSON.parse(JSON.stringify(x)));
const eq = (a, b, msg) => assert.deepStrictEqual(j(a), j(b), msg);

let pass = 0, fail = 0;
export const results = () => ({ pass, fail });
function law(name, fn) {
  try { F.reset(); fn(); pass++; } catch (e) { fail++; console.log(`✗ window: ${name}\n  ${String(e.stack || e.message).split("\n").slice(0, 16).join("\n  ")}`); }
}

// a window on the fake core: every cmd answered at once, in order (delays ignored)
function win() {
  let s = { ...M.init(F.NOW), tz: "Europe/Paris" };
  const sent = [];
  const pump = (cmds) => { for (const c of cmds) { sent.push(c); for (const [, ev] of F.respond(c)) s = M.step(s, ev).s; } };
  for (const ev of F.boot()) s = M.step(s, ev).s;
  const st = M.start(s); s = st.s; pump(st.cmds);
  const w = {
    sent,
    get s() { return s; },
    feed(ev) { const r = M.step(s, ev); s = r.s; pump(r.cmds); return r; },
    key(key, mods = {}) { return w.feed({ ev: "ui_key", key, digit: /^[0-9]$/.test(key) ? +key : null, ...mods }); },
    type(text) { return w.feed({ ev: "ui_type", text }); },
    go(project, agent = "main") { return w.feed({ ev: "ui_route", project, agent }); },
    get v() { return V.view(s); },
  };
  return w;
}
const P = F.P;
const sideNames = (v) => v.side.rows.filter((r) => r.kind !== "sh").map((r) => `${r.kind}:${r.name}${r.end ? `(${r.end})` : ""}${r.on ? "*" : ""}`);
const rowsOf = (v, t) => v.thread.rows.filter((r) => r.t === t);

// ---- the sidebar
law("bise's view: bise on top with every card's count, each project with its waits or its ⌘ key, every project's agents", () => {
  const w = win();
  eq(sideNames(w.v), ["me:bise(3)*", "pj:storefront(1)", "ag:checkout", "ag:search(?)", "ag:stock", "ag:promo", "ag:wallet",
    "pj:telemetry(1)", "ag:alerts(?)", "ag:sampling", "pj:engine(1)", "ag:streaming", "ag:netcode(?)", "pj:evals(⌘4)", "ag:rag", "ag:cache"]);
  eq(w.v.side.foot, "+ add a project");
  const dots = Object.fromEntries(w.v.side.rows.filter((r) => r.kind === "ag").map((r) => [r.name, r.dot]));
  eq([dots.checkout, dots.search, dots.streaming, dots.promo], ["wk", "nd", "ok", ""]);
});
law("in a project, only that project's agents unfold; the row in view is marked", () => {
  const w = win();
  w.key("1", { meta: true, digit: 1 });
  eq(sideNames(w.v).slice(0, 9), ["me:bise(3)", "pj:storefront(1)*", "ag:checkout", "ag:search(?)", "ag:stock", "ag:promo", "ag:wallet", "pj:telemetry(1)", "pj:engine(1)"]);
});

// ---- the keys of the map
law("⌘0 bise, ⌘1-9 the projects in the sidebar's order, ⌥0 the main, ⌥1-9 the agents, ⌘[ ⌘] back and forward", () => {
  const w = win();
  const at = () => `${w.s.route.project}/${w.s.route.agent}`;
  assert.equal(w.key("2", { meta: true, digit: 2 }).eat, true);
  assert.equal(at(), `${P.telemetry}/main`);
  w.key("1", { alt: true, key: "¡", digit: 1 });
  assert.equal(at(), `${P.telemetry}/alerts`);
  w.key("0", { alt: true, digit: 0 });
  assert.equal(at(), `${P.telemetry}/main`);
  w.key("[", { meta: true });
  assert.equal(at(), `${P.telemetry}/alerts`);
  w.key("[", { meta: true });
  assert.equal(at(), `${P.telemetry}/main`);
  w.key("]", { meta: true });
  assert.equal(at(), `${P.telemetry}/alerts`);
  w.key("0", { meta: true, digit: 0 });
  assert.equal(at(), `${F.HOME}/main`);
  // a key past the list does nothing, but stays the window's
  assert.equal(w.key("9", { meta: true, digit: 9 }).eat, true);
  assert.equal(at(), `${F.HOME}/main`);
  // plain letters and the system's ⌘ keys stay the field's
  eq([w.key("a").eat, w.key("c", { meta: true }).eat, w.key("v", { meta: true }).eat], [false, false, false]);
});
law("a route subscribes to its thread once, with its project, and names the window", () => {
  const w = win();
  w.go(P.storefront, "search"); w.go(F.HOME); w.go(P.storefront, "search");
  eq(w.sent.filter((c) => c.cmd === "subscribe"), [
    { cmd: "subscribe", project: F.HOME, agent: "main", limit: 60 }, { cmd: "subscribe", project: P.storefront, agent: "search", limit: 60 }]);
  eq(w.sent.filter((c) => c.cmd === "win_title").map((c) => c.text), ["bise", "search · storefront", "bise", "search · storefront"]);
  // every cmd to the core carries its project (S3a)
  for (const c of w.sent) if (!c.cmd.startsWith("win_")) assert.ok(c.project, JSON.stringify(c));
});
law("deep links from the shell: project/<name>, agent/<name>/<agent>, inbox", () => {
  const w = win();
  w.feed({ ev: "win_open", route: "agent/storefront/search" });
  eq(w.s.route, { project: P.storefront, agent: "search" });
  w.feed({ ev: "win_open", route: `project/${P.engine}` });
  eq(w.s.route, { project: P.engine, agent: "main" });
  w.feed({ ev: "win_open", route: "inbox" });
  assert.equal(w.v.composer.dock.mode, "inbox");
  w.feed({ ev: "win_open", route: "nowhere/at/all" });
  eq(w.s.route, { screen: "notfound", project: F.HOME, agent: "main", want: "nowhere/at/all" });
});

// ---- bise's thread
law("bise's thread: his words with the capture and the tab's context, bise's routing line, the project's answer, one line for the question", () => {
  const v = win().v;
  const m = rowsOf(v, "msg");
  eq([m[0].who.name, m[0].meta, m[0].ctx], ["you", "14:21 · by voice, from Chrome", { shot: "p99", chips: ["grafana · ingest p99", "13:00–15:00 · last 7 days"] }]);
  eq([m[1].who.name, m[1].who.pearl], ["bise", true]);
  eq([m[2].who.name, m[2].who.in], ["telemetry · main", true]);
  const r = rowsOf(v, "route");
  eq(r.map((x) => [x.p1, x.p2, x.p3, x.bar]), [["telemetry · main → alerts", "p99 d'ingest à 14 h, avec ta capture", "done 14:25", null],
    ["storefront · main → stock", "flash sale replay · following", "62%", 62]]);
  eq(rowsOf(v, "marker").map((x) => x.text), ["? telemetry · alerts asked you · below"]);
  eq(v.thread.rows[0], { t: "day", text: "today" });
  eq(v.head.t1, "bise");
  eq(v.head.t2, ["every project", "5 at work", "3 waiting for you"]);
});
law("bise's view: what runs now (the followed job first) and the right column (waiting for you, made today)", () => {
  const v = win().v;
  eq(v.jobs.map((x) => [x.title, x.s, x.pct, x.following]), [["storefront · stock", "flash sale replay · 6 200 / 10 000 orders · 62%", 62, true],
    ["engine · netcode", "co-op at 150 ms, 2% loss · 3 / 8 runs · 38%", 38, false], ["evals · cache", "prompt cache · 1 400 / 2 000 prompts · 70%", 70, false]]);
  eq(v.board.sections.map((x) => x.sh), ["3 waiting for you", "made today"]);
  eq(v.board.sections[0].items.map((x) => `${x.who}: ${x.text}`), ["telemetry · alerts: compaction at 03:00?", "engine · netcode: merge the rollback fix?", "storefront · search: reindex tonight 02:00?"]);
  eq(v.board.sections[1].items.map((x) => x.title), ["frame times, before and after", "flash sale replay", "eval report", "3-D Secure timeouts"]);
  assert.equal(v.mood, "need");
});

// ---- the rule: everything waiting for you sits above the composer
law("above bise's composer: the newest card, '1 of 3 ← →'; ← → walk the others; the divider says who he answers", () => {
  const w = win();
  let c = w.v.composer;
  eq([c.dock.h, c.dock.k, c.dock.q, c.dock.opts.map((o) => o.label)], ["? telemetry · alerts needs you", "1 of 3   ← →", "passer la compaction de 14:00 à 03:00 ?", ["move it to 03:00", "leave it"]]);
  eq([c.div, c.ph], ["you → bise · answering alerts", "your answer, then ⏎"]);
  assert.equal(w.key("ArrowRight").eat, true);
  c = w.v.composer;
  eq([c.dock.h, c.dock.k], ["? engine · netcode · merge the rollback fix?", "approval · 2 of 3   ← →"]);
  w.key("ArrowLeft"); w.key("ArrowLeft");
  eq(w.v.composer.dock.h, "? storefront · search needs you");
  // with words in the field, the arrows are the field's
  w.type("hm");
  assert.equal(w.key("ArrowLeft").eat, false);
  eq(w.v.composer.dock.h, "? storefront · search needs you");
});
law("1-9 in an empty field answers the card above; it leaves at once, the thread's line says what he answered", () => {
  const w = win();
  w.key("1");
  eq(w.sent.filter((c) => c.cmd === "answer"), [{ cmd: "answer", project: P.telemetry, card: "c-alerts", reply: "1" }]);
  eq(w.v.composer.dock.h, "? engine · netcode · merge the rollback fix?");
  eq(w.v.composer.dock.k, "approval · 1 of 2   ← →");
  eq(rowsOf(w.v, "marker").map((x) => x.text), ["? telemetry · alerts asked you · you answered: move it to 03:00"]);
  eq(w.v.side.rows[0].end, "2");
  // a digit with no such option does nothing, and is still eaten (it is not his text)
  w.key("7");
  eq(w.sent.filter((c) => c.cmd === "answer").length, 1);
  // a digit in a field with words is text
  w.type("a 1");
  assert.equal(w.key("1").eat, false);
});
law("words then ⏎ answer the card above; with no card, ⏎ sends to the thread", () => {
  const w = win();
  w.type("attends le test à 150 ms");
  w.key("Enter");
  eq(w.sent.filter((c) => c.cmd === "answer"), [{ cmd: "answer", project: P.telemetry, card: "c-alerts", reply: "attends le test à 150 ms" }]);
  eq(w.v.composer.text, "");
  w.go(P.evals);
  assert.equal(w.v.composer.dock, null);
  eq([w.v.composer.div, w.v.composer.ph], ["you → evals · main", "write to evals’s main, then ⏎"]);
  w.type("relance l'eval rag"); w.key("Enter");
  eq(w.sent.filter((c) => c.cmd === "send"), [{ cmd: "send", project: P.evals, agent: "main", text: "relance l'eval rag", mode: "now" }]);
  // the core's echo replaces the line he sent
  eq(rowsOf(w.v, "msg").filter((m) => m.you && m.text === "relance l'eval rag").map((m) => m.pending), [false]);
  // shift+⏎ is a new line
  w.type("a"); assert.equal(w.key("Enter", { shift: true }).eat, false);
});
law("esc puts the card off (the line says ⌘I), opens nothing; ⌘I opens every card above the composer, esc goes back to the thread", () => {
  const w = win();
  w.key("Escape");
  eq(w.v.composer.dock.h, "? engine · netcode · merge the rollback fix?");
  w.key("Escape"); w.key("Escape");
  eq(w.v.composer.dock, null);
  eq(rowsOf(w.v, "marker").map((x) => x.text), ["? telemetry · alerts asked you · ⌘I"]);
  eq(w.v.composer.ph, "write to bise, then ⏎");
  w.key("i", { meta: true });
  const d = w.v.composer.dock;
  eq([d.mode, d.h, d.k], ["inbox", "? telemetry · alerts needs you", "1 of 3   ← → the others   esc back to the thread"]);
  eq(d.tabs.map((t) => [t.text, t.on]), [["alerts · compaction at 03:00?", true], ["netcode · merge the rollback fix?", false], ["search · reindex tonight 02:00?", false]]);
  assert.match(d.body, /^la compaction de 14:00/);
  eq([d.origin, d.shot], ["asked by you, via bise", "p99"]);
  eq(rowsOf(w.v, "marker").map((x) => x.text), ["? telemetry · alerts asked you · below"]);
  w.key("ArrowRight");
  eq(w.v.composer.dock.tabs.map((t) => t.on), [false, true, false]);
  w.key("Escape");
  eq(w.v.composer.dock, null);
});
law("ctrl+1-9 opens the inbox at that card, from any thread; an answer moves to the next, the last one closes it", () => {
  const w = win();
  w.go(P.evals);
  w.key("3", { ctrl: true, digit: 3 });
  eq([w.v.composer.dock.mode, w.v.composer.dock.h], ["inbox", "? storefront · search needs you"]);
  w.key("2");
  eq(w.sent.filter((c) => c.cmd === "answer"), [{ cmd: "answer", project: P.storefront, card: "c-search", reply: "2" }]);
  eq(w.v.composer.dock.tabs.length, 2);
  w.key("1"); w.key("1");
  assert.equal(w.s.inbox, null);
  eq(w.v.side.rows[0].end, "");
  // ⌘I with nothing waiting does nothing
  w.key("i", { meta: true });
  assert.equal(w.s.inbox, null);
});
law("each thread's composer answers its own cards: a project's main its project's, an agent its own", () => {
  const w = win();
  w.go(P.storefront);
  eq([w.v.composer.dock.h, w.v.composer.dock.k, w.v.composer.div], ["? search needs you", "1 of 1", "you → storefront · main · answering search"]);
  w.go(P.storefront, "checkout");
  eq(w.v.composer.dock, null);
  eq(w.v.composer.ph, "steer checkout while it works, then ⏎");
  eq(w.v.composer.send, "stop");
  w.go(P.storefront, "search");
  eq(w.v.composer.dock.h, "? search needs you");
});
law("the thread never holds an open question: one line, never its text", () => {
  const w = win();
  for (const [p, a] of [[F.HOME, "main"], [P.storefront, "main"], [P.storefront, "search"], [P.telemetry, "main"], [P.engine, "main"]]) {
    w.go(p, a);
    const qs = D.allCards(w.s).map((c) => c.question);
    for (const r of w.v.thread.rows) if (r.t === "msg") assert.ok(!qs.includes(r.text), `${p}/${a}: ${r.text}`);
    assert.ok(rowsOf(w.v, "marker").length >= 1, `${p}/${a} has its line`);
  }
});

// ---- a project's main
law("a project's main: its header, the folded messages between agents, 'asked · i answered ▸ why', the artifact; its agents on the right", () => {
  const w = win();
  w.go(P.storefront);
  const v = w.v;
  eq([v.head.t1, v.head.t2, v.head.seg.map((x) => x.text)], ["storefront", ["~/storefront", "main", "5 agents", "1 waiting for you"], ["thread", "changes", "artifacts"]]);
  const f = rowsOf(v, "fold")[0];
  eq([f.text, f.items.length], ["▸ 4 messages between 2 agents", 0]);
  w.feed({ ev: "ui_fold", pos: f.pos });
  const f2 = rowsOf(w.v, "fold")[0];
  eq([f2.text, f2.items.map((x) => x.who.name)], ["▾ 4 messages between 2 agents", ["promo", "checkout", "promo", "checkout"]]);
  const a = rowsOf(w.v, "answered")[0];
  eq(a.text, "promo asked: on garde le cumul pour les cartes cadeaux ? · i answered: non, une carte cadeau est un paiement, pas une remise");
  eq(rowsOf(w.v, "art").map((x) => [x.title, x.meta, x.new]), [["flash sale replay", "stock · 10:40", true]]);
  const b = w.v.board.sections;
  eq(b[0].items.map((x) => `${x.key} ${x.name}${x.psi ? " ψ" : ""} ${x.dot}`), ["⌥1 checkout ψ wk", "⌥2 search ψ nd", "⌥3 stock wk", "⌥4 promo ", "⌥5 wallet ψ "]);
  eq(b[0].items.map((x) => x.pct), [null, null, 62, null, null]);
  eq(b[1], { sh: "scheduled", kind: "sched", items: [{ text: "◷ search reindex", when: "tonight 02:00" }] });
  eq(w.v.jobs, []);
});
law("⌘E unfolds everything; a fold clicked by hand folds back under it", () => {
  const w = win();
  w.go(P.storefront, "search");
  eq(rowsOf(w.v, "tool")[0].items, []);
  w.key("e", { meta: true });
  eq(rowsOf(w.v, "tool")[0].items.length, 10);
  w.feed({ ev: "ui_fold", pos: rowsOf(w.v, "tool")[0].pos });
  eq(rowsOf(w.v, "tool")[0].open, false);
  w.key("e", { meta: true });
  eq(rowsOf(w.v, "tool")[0].open, false);
});

// ---- an agent's thread
law("an agent's thread: main's brief, its folded work, the inline diff; header with ψ worktree, who started it, back to the project", () => {
  const w = win();
  w.go(P.storefront, "search");
  const v = w.v;
  eq([v.head.t1, v.head.t2, v.head.acc], ["search", ["storefront", "ψ sb/search", "started by main 09:20", "waiting for you"], 3]);
  eq(v.head.end.map((e) => e.text), ["± 1 file", "← storefront"]);
  eq(rowsOf(v, "msg")[0].who.name, "main → search");
  eq(rowsOf(v, "tool")[0].label, "read 6 files, ran 4 commands · 2 files changed");
  const d = rowsOf(v, "diff")[0];
  eq([d.file, d.lines.map((l) => `${l.o}|${l.n}|${l.sign}|${l.cls}`)], ["search/synonyms.json", ["14|14||", "|15|+|ad", "15|16||"]]);
  assert.equal(v.board, null);
  // a working agent has stop (⌘.) in its header
  w.go(P.storefront, "checkout");
  eq(w.v.head.end.map((e) => e.text), ["stop", "← storefront"]);
  w.key(".", { meta: true });
  eq(w.sent.filter((c) => c.cmd === "stop"), [{ cmd: "stop", project: P.storefront, agent: "checkout" }]);
});
law("esc in an agent's thread with nothing above the composer goes back to its project's main (the terminal's esc)", () => {
  const w = win();
  w.go(P.storefront, "checkout");
  w.key("Escape");
  eq(w.s.route, { project: P.storefront, agent: "main" });
  // bise's thread has nowhere to go back to
  w.key("0", { meta: true, digit: 0 }); w.key("Escape"); w.key("Escape"); w.key("Escape"); w.key("Escape");
  eq(w.s.route, { project: F.HOME, agent: "main" });
});
law("quotes ❝: diff lines selected (shift extends) become a quote above the field; ⏎ sends it with the question, not as an answer", () => {
  const w = win();
  w.go(P.storefront, "search");
  const pos = rowsOf(w.v, "diff")[0].pos;
  w.feed({ ev: "ui_line", pos, i: 1 });
  w.feed({ ev: "ui_line", pos, i: 2, shift: true });
  eq(rowsOf(w.v, "diff")[0].lines.map((l) => l.sel), [false, true, true]);
  eq(w.v.composer.quotes.map((q) => q.text), ["❝ 1 “\"tshirt, t-shirt, tee\",”  synonyms.json:15-16 · 2 lines"]);
  w.type("pourquoi tee ?");
  w.key("Enter");
  const s = w.sent.filter((c) => c.cmd === "send");
  eq(s, [{ cmd: "send", project: P.storefront, agent: "search", text: "pourquoi tee ?", mode: "now",
    quote: { agent: "search", pos, text: "  \"tshirt, t-shirt, tee\",\n  \"sneakers, trainers\"", file: "search/synonyms.json", lines: [15, 16] } }]);
  eq(w.sent.filter((c) => c.cmd === "answer"), []);
  eq(w.v.composer.quotes, []);
  // the line he sent shows its quote
  assert.match(rowsOf(w.v, "msg").find((m) => m.text === "pourquoi tee ?").quote, /^❝ “"tshirt/);
});
law("a sentence selected in a message is a quote too; esc drops the last quote first", () => {
  const w = win();
  w.go(P.storefront, "search");
  const m = rowsOf(w.v, "msg").find((x) => /second index/.test(x.text));
  w.feed({ ev: "ui_quote_text", pos: m.pos, text: "20 min de build" });
  eq(w.v.composer.quotes.map((q) => q.text), ["❝ 1 “20 min de build”  search 09:45"]);
  w.key("Escape");
  eq(w.v.composer.quotes, []);
  eq(w.v.composer.dock.h, "? search needs you");
});

// ---- ⌘K and a project's tabs
law("⌘K finds an agent or a project by its name: starts-with first, ↑ ↓ move, ⏎ opens, esc closes; other keys type", () => {
  const w = win();
  assert.equal(w.key("k", { meta: true }).eat, true);
  eq(w.v.finder.rows.length, 12);
  w.feed({ ev: "ui_find_type", text: "s" });
  eq(w.v.finder.rows.map((r) => `${r.name}·${r.where}`), ["storefront·~/storefront", "search·storefront", "stock·storefront", "sampling·telemetry", "streaming·engine",
    "bise·every project", "alerts·telemetry", "evals·~/evals"]);
  assert.ok(!w.v.finder.rows.some((r) => r.name === "netcode"));
  w.feed({ ev: "ui_find_type", text: "st" });
  eq(w.v.finder.rows.map((r) => [r.name, r.dot]), [["storefront", "nd"], ["stock", "wk"], ["streaming", "ok"]]);
  // a letter is the finder field's, not a 1-9 answer nor a send
  eq([w.key("r").eat, w.key("1").eat], [false, false]);
  w.key("ArrowDown"); w.key("ArrowDown");
  eq(w.v.finder.rows.filter((r) => r.on).map((r) => r.name), ["streaming"]);
  w.key("Enter");
  eq([w.s.route, w.s.finder], [{ project: P.engine, agent: "streaming" }, null]);
  w.key("k", { meta: true }); w.feed({ ev: "ui_find_type", text: "zzz" });
  eq([w.v.finder.rows, w.v.finder.empty], [[], "no agent or project by that name"]);
  w.key("Escape");
  eq([w.s.finder, w.s.route], [null, { project: P.engine, agent: "streaming" }]);
  w.key("k", { meta: true }); w.feed({ ev: "ui_find_open", i: 0 });
  eq(w.s.route, { project: F.HOME, agent: "main" });
});
law("a project's changes tab lists its agents' branches, its artifacts tab what they made; thread comes back", () => {
  const w = win();
  w.go(P.storefront);
  assert.equal(w.v.tab, null);
  w.feed({ ev: "ui_tab", tab: "changes" });
  eq(w.v.tab.items.map((x) => [x.name, x.branch, x.what]), [["checkout", "sb/checkout", "2 commits ahead · one idempotency key per order (#812)"],
    ["search", "sb/search", "1 commit ahead · reindex tonight 02:00?"], ["wallet", "sb/wallet", "nothing to merge · Apple Pay at checkout"]]);
  eq(w.v.head.seg.map((x) => x.on), [false, true, false]);
  w.feed({ ev: "ui_tab", tab: "artifacts" });
  eq(w.v.tab.items.map((x) => [x.title, x.meta, x.new]), [["flash sale replay", "stock · 10:40", true], ["3-D Secure timeouts", "checkout · 09:50", true]]);
  w.go(P.telemetry); w.feed({ ev: "ui_tab", tab: "artifacts" });
  eq(w.v.tab.empty.b, "nothing made yet");
  w.go(P.storefront);
  eq(w.v.tab.tab, "artifacts");
  w.feed({ ev: "ui_tab", tab: "thread" });
  assert.equal(w.v.tab, null);
  // the composer above stays: the card still waits there on every tab
  eq(w.v.composer.dock.h, "? search needs you");
});

// ---- the states the DS draws: a project with no agent, an agent that failed, a hub offline
law("a project with no agent says so in the sidebar and its thread; a failed agent is ▲ in red, its report an error line", () => {
  const w = win();
  w.feed({ ev: "projects", projects: [...w.s.projects, { project: "docs-11aa", name: "docs", path: "~/docs", home: false, order: 5, agents: 0, working: 0, waits: 0 }] });
  w.feed({ ev: "agents", project: "docs-11aa", agents: [{ name: "main", main: true, status: "idle", title: "", since_ms: F.NOW, waits: 0 }] });
  w.feed({ ev: "agents", project: P.engine, agents: F.AGENTS[P.engine].map((a) => (a.name === "netcode" ? { ...a, status: "failed" } : a)) });
  eq(sideNames(w.v).filter((x) => /docs|netcode/.test(x)), ["ag:netcode(?)", "pj:docs(⌘5)"]);
  w.go("docs-11aa");
  eq(sideNames(w.v).filter((x) => /docs/.test(x)), ["pj:docs(⌘5)*"]);
  eq(w.v.thread.empty, { b: "docs has no agent yet", s: "ask its main below, or ask bise from anywhere" });
  w.feed({ ev: "cards", project: P.engine, cards: [] });
  w.go(P.engine);
  eq(w.v.side.rows.filter((r) => r.name === "netcode").map((r) => [r.dot, r.end]), [["er", "▲"]]);
  w.go(P.engine, "netcode");
  w.feed({ ev: "entry", project: P.engine, agent: "netcode", entry: { pos: 50, at_ms: F.NOW, kind: "report", text: "your ChatGPT sign-in expired", report: { kind: "failed" } } });
  eq(rowsOf(w.v, "msg").filter((m) => m.error).map((m) => m.text), ["your ChatGPT sign-in expired"]);
  eq(w.v.head.t2.slice(-1), ["failed"]);
});

law("⌥⏎ queues his words for the end of a working agent's turn; the line says so until the agent gets it", () => {
  const w = win();
  w.go(P.storefront, "checkout");
  assert.match(w.v.composer.keys, /⌥⏎ after its turn/);
  w.type("et ajoute un test");
  let s = w.s;
  const r = M.step(s, { ev: "ui_key", key: "Enter", alt: true });
  eq([r.eat, r.cmds], [true, [{ cmd: "send", project: P.storefront, agent: "checkout", text: "et ajoute un test", mode: "queued" }]]);
  const line = V.view(r.s).thread.rows.filter((x) => x.t === "msg").pop();
  eq([line.text, line.meta], ["et ajoute un test", "14:33 · queued · goes at the end of its turn"]);
  // the fake core delivers it at the turn's end
  eq(F.respond(r.cmds[0])[0][0], 2500);
  w.go(P.storefront, "promo");
  assert.doesNotMatch(w.v.composer.keys, /⌥⏎/);
});

law("every route change names the window with its route; a link to a place that isn't there opens 'not found' with that link", () => {
  const w = win();
  w.feed({ ev: "win_open", route: "telemetry/p99" });
  eq([w.s.route.screen, w.v.head.t1, w.v.head.t2, w.v.thread.empty.b], ["notfound", "not found", ["telemetry/p99"], "nothing here"]);
  eq(w.sent.filter((c) => c.cmd === "win_title").pop(), { cmd: "win_title", text: "not found", route: "telemetry/p99" });
  w.feed({ ev: "win_open", route: "telemetry/alerts" });
  eq(w.s.route, { project: P.telemetry, agent: "alerts" });
  w.feed({ ev: "win_open", route: "storefront" });
  eq(w.s.route, { project: P.storefront, agent: "main" });
  w.key(",", { meta: true });
  eq(w.sent.filter((c) => c.cmd === "win_title").pop(), { cmd: "win_title", text: "settings", route: "settings" });
  eq(w.sent.filter((c) => c.cmd === "win_title").map((c) => c.route), ["bise", "telemetry/p99", `agent/${P.telemetry}/alerts`, `project/${P.storefront}`, "settings"]);
  // no cmd for a place that isn't there: nothing to subscribe
  eq(w.sent.filter((c) => c.cmd === "subscribe" && c.agent === "p99"), []);
});

law("bise's own agents (every agent on the single-hub core): agent/home/<a> opens its thread, named '<a> · bise', under bise's row; esc goes back to bise", () => {
  const w = win();
  w.feed({ ev: "agents", project: F.HOME, agents: [{ name: "main", main: true, status: "idle" }, { name: "perf", status: "idle", title: "profile the replay" }] });
  w.feed({ ev: "win_open", route: "agent/home/perf" });
  eq(w.s.route, { project: F.HOME, agent: "perf" });
  eq(w.sent.filter((c) => c.cmd === "win_title").pop(), { cmd: "win_title", text: "perf · bise", route: "agent/home/perf" });
  eq(w.sent.filter((c) => c.cmd === "subscribe").pop().agent, "perf");
  eq([w.v.head.t1, w.v.head.pearl || false, w.v.jobs.length], ["perf", false, 0]);
  const rows = w.v.side.rows;
  eq([rows[0].on, rows[1].kind, rows[1].name, rows[1].on], [false, "ag", "perf", true]);
  // already there: the same link changes nothing; esc goes back to bise
  const n = w.sent.length;
  w.feed({ ev: "win_open", route: "agent/home/perf" });
  eq(w.sent.length, n);
  // esc puts away what sits above the composer first (the fake world's waiting cards), then leaves
  for (let i = 0; i < 4 && w.s.route.agent !== "main"; i++) w.key("Escape");
  eq([w.s.route, w.v.head.t1], [{ project: F.HOME, agent: "main" }, "bise"]);
});

law("the single-hub core's state (the bar's {agents, cards}) reaches the window: main's card above the composer and in 'waiting for you', its agents under bise", () => {
  const w = win();
  // a window that only ever gets the single-hub core: no projects, no typed cards
  w.feed({ ev: "projects", projects: [] });
  for (const p of Object.keys(w.s.cards)) w.feed({ ev: "cards", project: p, cards: [] });
  eq(w.v.board.sections[0].items.length, 0);
  w.feed({ ev: "state", agents: [{ name: "main", status: "waiting" }, { name: "perf", status: "working", title: "profile the replay" }],
    cards: [{ id: 1, agent: "main", text: "compaction at 03:00?", options: ["yes", "not yet"], urgent: false }] });
  const d = w.v.composer.dock;
  eq([d.q, d.opts.map((o) => [o.n, o.label])], ["compaction at 03:00?", [[1, "yes"], [2, "not yet"]]]);
  eq(w.v.board.sections[0].items.map((i) => i.text), ["compaction at 03:00?"]);
  eq(w.v.side.rows.filter((r) => r.kind === "ag").map((r) => r.name), ["perf"]);
  // he answers it: the S3a answer for bise's own hub (the option's digit)
  w.feed({ ev: "ui_pick", card: d.card, n: 1 });
  eq(w.sent.filter((c) => c.cmd === "answer").pop(), { cmd: "answer", project: F.HOME, card: 1, reply: "1" });
  // the next state drops the card: nothing waits any more
  w.feed({ ev: "state", agents: [{ name: "main", status: "idle" }], cards: [] });
  eq([w.v.composer.dock, w.v.board.sections[0].items.length, w.v.side.rows.filter((r) => r.kind === "ag").length], [null, 0, 0]);
});

law("bise-proto's shared fixtures (rust/proto/fixtures, what the real core forwards) step through the window and draw", () => {
  const dir = join(here, "../../../../rust/proto/fixtures");
  if (!existsSync(dir)) return;
  const lines = (f) => (existsSync(join(dir, f)) ? readFileSync(join(dir, f), "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l)) : []);
  let s = { ...M.init(F.NOW), tz: "Europe/Paris" };
  const evs = [...lines("core_ev.jsonl"), ...lines("hub_ev.jsonl"), ...lines("draft_hub_ev.jsonl")];
  assert.ok(evs.length > 10);
  const acme = (evs.find((e) => e.ev === "projects").projects.find((p) => !p.home) || {}).project;
  s = M.step(s, { ev: "ui_route", project: acme, agent: "perf" }).s;
  // the first page is the newest; the fixture's second page answers a `page` (older) cmd
  let v = null;
  for (const ev of evs) {
    // an older page lands only when the window asked for it (paging's own law covers that)
    if (ev.ev === "thread" && v) s = { ...s, threads: { ...s.threads, [`${ev.project}/${ev.agent}`]: { ...s.threads[`${ev.project}/${ev.agent}`], paging: true } } };
    s = M.step(s, ev).s;
    if (ev.ev === "thread" && !v) v = V.view(s);
    V.view(s);
  }
  const rows = v.thread.rows.filter((r) => r.t !== "day");
  assert.ok(rows.length >= 3, JSON.stringify(rows).slice(0, 200));
  // their entry kinds all have a row: you, agent, tools, from_agent, report, card
  const kinds = new Set(rows.map((r) => r.t));
  for (const k of ["msg", "tool"]) assert.ok(kinds.has(k), k);
  assert.ok(rows.some((r) => r.t === "msg" && r.who.name === "ambient-lead"), "a from_agent entry draws as its sender's message");
  // after the older page and the live entries, the thread holds all of them in pos order
  const all = s.threads[`${acme}/perf`].entries.map((e) => e.pos);
  eq(all, all.slice().sort((a, b) => a - b));
  assert.ok(all.includes(200) && all.includes(16) && all.includes(10));
});

// ---- the core's pages and live entries
law("older messages page in once at a time, before the first one; a live entry with a known pos replaces it", () => {
  const w = win();
  w.go(P.storefront);
  // the fake's storefront thread has 15 entries; ask a 5-entry page to see paging
  const k = `${P.storefront}/main`;
  let s = w.s;
  s = M.step(s, { ev: "thread", project: P.storefront, agent: "main", entries: F.thread(P.storefront, "main").slice(-5), before: 16, more: true }).s;
  let r = M.step(s, { ev: "ui_older" });
  eq(r.cmds, [{ cmd: "page", project: P.storefront, agent: "main", before: 16, limit: 60 }]);
  eq(M.step(r.s, { ev: "ui_older" }).cmds, []);
  s = r.s;
  for (const [, ev] of F.respond(r.cmds[0])) s = M.step(s, ev).s;
  eq(s.threads[k].entries.map((e) => e.pos), F.thread(P.storefront, "main").map((e) => e.pos));
  eq(s.threads[k].more, false);
  const e = { ...F.thread(P.storefront, "main")[0], text: "edited" };
  s = M.step(s, { ev: "entry", project: P.storefront, agent: "main", entry: e }).s;
  eq(s.threads[k].entries[0].text, "edited");
  eq(s.threads[k].entries.length, F.thread(P.storefront, "main").length);
});
law("the theme follows the shell; offline greys the composer and says the message waits", () => {
  const w = win();
  w.feed({ ev: "win_theme", dark: false });
  eq(w.v.theme, "light");
  w.feed({ ev: "hub", up: false });
  eq([w.v.composer.disabled, w.v.composer.ph], [true, "offline · your message waits and goes when you're back"]);
});
law("the fake core speaks S3a v1: welcome, number-free ids aside, every event names its project", () => {
  const evs = F.boot();
  eq(evs[0].ev, "welcome");
  for (const ev of evs) if (ev.ev !== "projects") assert.ok(ev.project, JSON.stringify(ev).slice(0, 80));
  for (const p of F.PROJECTS) assert.ok(evs.some((e) => e.ev === "agents" && e.project === p.project));
});

const direct = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (direct) {
  console.log(`${fail ? "✗" : "✓"} ambient window: ${pass} passed${fail ? `, ${fail} failed` : ""}`);
  process.exit(fail ? 1 : 0);
}
