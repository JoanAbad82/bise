// bise desktop · S7's laws (node, no deps): the review, artifacts and environments screens on the
// fake core (winfake.js + winfake7.js), played through amb-win's model with the AmbWinS7
// extension, then the screen's view read back.
//   node apps/ambient/web/window/check-s7.mjs     (web/check.mjs runs it too)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
const ctx = vm.createContext({ console, Math, JSON, Object, Array, Set, Map, String, Number, Date, Intl, RegExp });
for (const f of ["winwords.js", "winfake.js", "winfake7.js", "windock.js", "winenv.js", "winarts.js", "winreview.js", "wins7.js", "winmodel.js", "winview.js"]) vm.runInContext(readFileSync(join(here, f), "utf8"), ctx, { filename: f });
const { AmbWinFake: F, AmbWinFake7: F7, AmbWinModel: M, AmbWinView: V, AmbWinS7: S7 } = ctx;
const j = (x) => (x === undefined ? x : JSON.parse(JSON.stringify(x)));
const eq = (a, b, msg) => assert.deepStrictEqual(j(a), j(b), msg);

let pass = 0, fail = 0;
export const results = () => ({ pass, fail });
function law(name, fn) {
  try { F.reset(); fn(); pass++; } catch (e) { fail++; console.log(`✗ window S7: ${name}\n  ${String(e.stack || e.message).split("\n").slice(0, 16).join("\n  ")}`); }
}

// a window on the fake core (winfake.js chains winfake7.js), played through amb-win's model, which
// calls AmbWinS7 for S7's events and routes
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
    open(screen, project = "home", agent = "main") { return w.feed({ ev: "win_open", route: screen === "review" ? `review/${project}/${agent}` : screen }); },
    get v() { return S7.view(s); },
    get win() { return V.view(s); },
  };
  return w;
}
const P = F.P;

// ---- environments
law("environments: the header counts projects, agents' worktrees and dev servers; + add a project", () => {
  const w = win();
  w.open("environments");
  eq(w.v.head, { t1: "environments", t2: ["4 projects", "5 worktrees", "2 dev servers"], acc: -1,
    end: [{ kind: "btn", text: "+ add a project", act: { ev: "ui_add_project" } }] });
});
law("environments: each project in order with its folder · git · branch, then its worktrees ψ and what runs; 'no worktree' when nothing", () => {
  const w = win();
  w.open("environments");
  const g = w.v.groups;
  eq(g.map((x) => [x.name, x.line]), [["storefront", "~/storefront · git · main"], ["telemetry", "~/telemetry · git · main"],
    ["engine", "~/engine · git · main"], ["evals", "~/evals · git · main"]]);
  // the project's own folder (branch main, no agent) is its line, not a row
  eq(g[0].rows.map((r) => r.kind === "wt" ? [r.branch, r.agent, r.what, r.end] : [r.name, r.url, r.end]), [
    ["sb/checkout", "checkout", "one idempotency key per order (#812)", "2 ahead"],
    ["sb/search", "search", "reindex tonight 02:00?", "1 ahead"],
    ["sb/wallet", "wallet", "Apple Pay at checkout", "idle"],
    ["dev server", "localhost:3000", "running"]]);
  eq(g[1].rows.map((r) => [r.kind, r.name, r.url]), [["dev", "grafana (local)", "localhost:3001"]]);
  // a finished agent with commits ahead is ready to merge
  eq(g[2].rows.map((r) => [r.agent, r.what, r.end, r.dot]), [["streaming", "ready to merge", "3 ahead", "ok"], ["netcode", "co-op at 150 ms, 2% loss · run 3 of 8", "5 ahead", "wk"]]);
  eq([g[0].empty, g[1].empty, g[2].empty, g[3].empty, g[3].rows], [null, null, null, "no worktree", []]);
});
law("environments: open in Terminal / editor and a running dev server are cmds to the app, each with its project; a worktree opens its agent", () => {
  const w = win();
  w.open("environments");
  const sf = w.v.groups[0];
  eq(sf.open.map((o) => o.text), ["open in Terminal", "open in editor"]);
  eq(w.feed(sf.open[0].act).cmds, [{ cmd: "open_in", project: P.storefront, app: "terminal", path: "~/storefront" }]);
  eq(w.feed(sf.open[1].act).cmds, [{ cmd: "open_in", project: P.storefront, app: "editor", path: "~/storefront" }]);
  eq(w.feed(sf.rows[3].act).cmds, [{ cmd: "app_open_url", project: P.storefront, url: "http://localhost:3000" }]);
  eq(sf.rows[0].act, { ev: "ui_route", project: P.storefront, agent: "checkout" });
});
law("environments: live: a new worktree, a stopped server, an agent that finishes all show at once; a stopped server has no click", () => {
  const w = win();
  w.open("environments");
  w.feed({ ev: "worktrees", project: P.evals, items: [{ path: "/w/evals/rag", branch: "sb/rag", agent: "rag", dirty: false, ahead: 4, behind: 0 }] });
  w.feed({ ev: "dev_servers", project: P.storefront, items: [{ agent: "main", name: "dev server", url: "http://localhost:3000", port: 3000, cmd: "pnpm dev", up: false }] });
  const g = w.v.groups;
  eq([g[3].rows.map((r) => [r.agent, r.what, r.end]), g[3].empty], [[["rag", "ready to merge", "4 ahead"]], null]);
  eq([g[0].rows[3].end, g[0].rows[3].act], ["stopped", null]);
  eq(w.v.head.t2, ["4 projects", "6 worktrees", "2 dev servers"]);
});
// ---- artifacts
const tiles = (v) => v.items.map((a) => [a.title, a.meta, a.new]);
law("artifacts: every project's, newest first, 'project · agent · time', new marked; the header says how many are new since he looked", () => {
  const w = win();
  const r = w.open("artifacts");
  eq(w.v.head, { t1: "artifacts", t2: ["every project", "4", "4 new since you looked"], acc: 2 });
  eq(tiles(w.v), [["frame times, before and after", "engine · streaming · 11:12", true], ["flash sale replay", "storefront · stock · 10:40", true],
    ["eval report", "evals · rag · 09:58", true], ["3-D Secure timeouts", "storefront · checkout · 09:50", true]]);
  eq(w.v.items.map((a) => a.version || ""), ["", "", "v3", "v2"]);
  eq(w.v.filter, { items: ["all", "storefront", "telemetry", "engine", "evals"], on: 0, act: { ev: "ui_art_filter" } });
  // the core hears he looked, once per project with something new
  eq(r.cmds.filter((c) => c.cmd === "artifacts_seen"), [{ cmd: "artifacts_seen", project: P.storefront }, { cmd: "artifacts_seen", project: P.engine }, { cmd: "artifacts_seen", project: P.evals }]);
  assert.deepEqual(w.sent.filter((c) => c.cmd === "artifacts_seen").map((c) => c.project).sort(), [P.storefront, P.engine, P.evals].sort());
});
law("artifacts: 'new' stays for this visit after the core drops it, and is gone the next time he opens the screen", () => {
  const w = win();
  w.open("artifacts");
  // the fake core answered artifacts_seen: nothing is new for it any more
  assert.ok(Object.values(w.s.arts).flat().every((a) => !a.new));
  eq(tiles(w.v).map((t) => t[2]), [true, true, true, true]);
  w.feed({ ev: "win_open", route: "bise" });
  w.open("artifacts");
  eq([w.v.head.t2, tiles(w.v).map((t) => t[2])], [["every project", "4"], [false, false, false, false]]);
  assert.equal(w.sent.filter((c) => c.cmd === "artifacts_seen").length, 3);
  // one made while he looks shows new at once
  w.feed({ ev: "artifacts", project: P.telemetry, items: [{ id: "a-p99", kind: "chart", title: "ingest p99, 7 days", agent: "alerts", version: 1, at_ms: F.NOW - 60000, url: "", new: true }] });
  eq([w.v.head.t2, tiles(w.v)[0]], [["every project", "5", "1 new since you looked"], ["ingest p99, 7 days", "telemetry · alerts · 14:32", true]]);
});
law("artifacts: the filter keeps one project's (by the seg's part); a project with none says so", () => {
  const w = win();
  w.open("artifacts");
  w.feed({ ev: "ui_art_filter", i: 1 });
  eq([w.v.head.t2, w.v.filter.on, tiles(w.v).map((t) => t[0])], [["storefront", "2", "2 new since you looked"], 1, ["flash sale replay", "3-D Secure timeouts"]]);
  w.feed({ ev: "ui_art_filter", i: 2 });
  eq([w.v.head.t2, w.v.items, w.v.empty], [["telemetry", "0"], [], { title: "nothing from telemetry yet", text: "what its agents make shows here" }]);
  w.feed({ ev: "ui_art_filter", i: 0 });
  eq([w.v.filter.on, w.v.items.length], [0, 4]);
});
law("artifacts: one with a url opens in his browser (app_open_url with its project); one without has no click; older ones say yesterday or the day", () => {
  const w = win();
  w.open("artifacts");
  const day = 86400000;
  w.feed({ ev: "artifacts", project: P.evals, items: [
    { id: "deck", kind: "report", title: "model card deck", agent: "report", version: 1, at_ms: F.NOW - day, url: "http://127.0.0.1:47123/p/deck", new: false },
    { id: "old", kind: "table", title: "baseline", agent: "rag", version: 1, at_ms: F.NOW - 4 * day, url: "", new: false }] });
  const deck = w.v.items.find((a) => a.id === "deck"), old = w.v.items.find((a) => a.id === "old");
  eq([deck.meta, old.meta, old.act], ["evals · report · yesterday", "evals · rag · Tue 29 Sept", null]);
  eq(w.feed(deck.act).cmds, [{ cmd: "app_open_url", project: P.evals, url: "http://127.0.0.1:47123/p/deck" }]);
});

// ---- review
law("review: entering asks the agent's diff; the result comes first (40 ms → 15 ms), then 'what changed' with each file's note and ±, the first file's diff", () => {
  const w = win();
  const r = w.open("review", P.engine, "streaming");
  eq(r.cmds.filter((c) => c.cmd === "diff"), [{ cmd: "diff", project: P.engine, agent: "streaming" }]);
  const v = w.v;
  eq(v.head, { t1: "streaming", dot: "ok", t2: ["engine", "ψ sb/streaming", "40 ms → 15 ms, ready to merge", "done"], acc: -1,
    end: [{ kind: "btn", text: "thread", act: { ev: "ui_route", project: P.engine, agent: "streaming" } }] });
  eq([v.result.label, v.result.sub, v.result.text, v.result.better, v.result.series.before.length], ["worst frame, PS5 replay", "forest level", "40 ms → 15 ms", true, 12]);
  eq(v.changed, "3 files · +84 −21");
  eq(v.files.map((f) => [f.name, f.note, f.end, f.on]), [["decode_pool.rs", "new: 4 workers", "+61", true], ["streamer.rs", "decode off the frame", "+19 −17", false],
    ["budget.toml", "pool size per platform", "+4 −4", false]]);
  eq([v.diff.file, v.diff.lines[0], v.diff.lines[4].text, v.diff.lines[4].sign], ["engine/src/streaming/decode_pool.rs", { hunk: "@@ -0,0 +1,61 @@" }, "    workers: [Worker; 4],", "+"]);
  eq(w.win.title, "review · streaming · engine");
});
law("review: picking a file shows its diff (− and + lines, old and new numbers)", () => {
  const w = win();
  w.open("review", P.engine, "streaming");
  w.feed(w.v.files[1].act);
  const v = w.v;
  eq(v.files.map((f) => f.on), [false, true, false]);
  eq(v.diff.lines.filter((l) => !l.hunk).slice(0, 4).map((l) => [l.old ?? null, l.new ?? null, l.sign]), [[88, 88, ""], [89, null, "-"], [90, null, "-"], [null, 89, "+"]]);
});
law("review: lines picked (click, shift extends) become one quote ❝ under the composer; ⏎ sends it with his words to that agent", () => {
  const w = win();
  w.open("review", P.engine, "streaming");
  w.feed({ ev: "ui_rv_line", i: 3 });
  w.feed({ ev: "ui_rv_line", i: 4, shift: true });
  eq(w.v.diff.lines.filter((l) => l.sel).map((l) => l.new), [13, 14]);
  eq(w.win.composer.quotes.map((q) => q.text), ["❝ 1 “workers: [Worker; 4],”  decode_pool.rs:13-14 · 2 lines"]);
  // a new selection in the same file replaces its quote; another file's adds one
  w.feed({ ev: "ui_rv_line", i: 2 });
  w.feed(w.v.files[2].act);
  w.feed({ ev: "ui_rv_line", i: 1 });
  eq(w.win.composer.quotes.map((q) => q.text), ["❝ 1 “pub struct DecodePool {”  decode_pool.rs:12 · 1 line", "❝ 2 “ps5 = 4”  budget.toml:3 · 1 line"]);
  w.feed({ ev: "ui_type", text: "pourquoi un pool de 4 ?" });
  const r = w.feed({ ev: "ui_send" });
  const send = r.cmds.find((c) => c.cmd === "send");
  eq([send.project, send.agent, send.text], [P.engine, "streaming", "pourquoi un pool de 4 ?"]);
  eq(send.quote.map((q) => [q.file, q.lines, q.text]), [["engine/src/streaming/decode_pool.rs", [12, 12], "pub struct DecodePool {"], ["engine/config/budget.toml", [3, 3], "ps5 = 4"]]);
  eq(w.win.composer.quotes, []);
});
law("review: the merge decision is the agent's approval card above the composer; answering it is S3a's answer", () => {
  const w = win();
  w.open("review", P.engine, "netcode");
  const v = w.v;
  eq([v.result, v.changed, v.files.map((f) => [f.name, f.end])], [null, "1 file · +12 −3", [["rollback.rs", "+12 −3"]]]);
  const dock = w.win.composer.dock;
  eq([dock.h, dock.opts.map((o) => o.label)], ["? netcode · merge the rollback fix?", ["merge into main", "not yet"]]);
  const r = w.feed({ ev: "ui_pick", card: dock.card, n: 1 });
  eq(r.cmds.filter((c) => c.cmd === "answer"), [{ cmd: "answer", project: P.engine, card: "c-netcode", reply: "1" }]);
});
law("review: one action row under the result (ambient m_8443): merge into main ⌘⏎, ask for changes (the composer, addressed), open in editor ⌘O; merging says 'merged · <sha>' and the row goes", () => {
  const w = win();
  w.open("review", P.engine, "streaming");
  eq(w.v.actions.map((a) => [a.text, a.kbd || "", a.kind || ""]), [["merge into main", "⌘⏎", "pri"], ["ask for changes", "", ""], ["open in editor", "⌘O", ""]]);
  w.feed(w.v.actions[1].act);
  eq(w.win.composer.text, "streaming, ");
  w.feed({ ev: "ui_type", text: "" });
  eq(w.feed(w.v.actions[2].act).cmds, [{ cmd: "open_in", project: P.engine, app: "editor", path: F7.WORKTREES[P.engine][0].path }]);
  // ⌘O and ⌘⏎ on the screen (an empty composer): the same acts
  const kO = S7.key(w.s.s7, { ev: "ui_key", key: "o", meta: true }, w.s);
  eq([kO.cmds[0].cmd, kO.eat], ["open_in", true]);
  // no approval card for streaming: the merge cmd; the core answers merged
  const r = w.feed(w.v.actions[0].act);
  eq(r.cmds, [{ cmd: "merge", project: P.engine, agent: "streaming" }]);
  eq([w.v.head.t2[3], w.v.actions], ["merged · 4f2a9c1", []]);
  // with words in the composer, ⌘⏎ is the composer's
  w.feed({ ev: "ui_type", text: "attends" });
  eq(S7.key(w.s.s7, { ev: "ui_key", key: "Enter", meta: true }, w.s), null);
});
law("review: an agent with an approval card merges by answering it (its 'merge' option); the graph has its legend", () => {
  const w = win();
  w.open("review", P.engine, "netcode");
  const k = S7.key(w.s.s7, { ev: "ui_key", key: "Enter", meta: true }, w.s);
  eq(k.cmds, [{ cmd: "answer", project: P.engine, card: "c-netcode", reply: "1" }]);
  // netcode has no worktree path known to the review? it has one: open in editor is offered
  eq(w.v.actions.map((a) => a.text), ["merge into main", "ask for changes", "open in editor"]);
});
law("review: loading until the diff comes; an agent with nothing ahead says so", () => {
  const w = win();
  // the fake answers at once; a review whose diff hasn't come shows the skeleton
  const s7 = { ...w.s.s7, rv: { ...w.s.s7.rv, diffs: {} } };
  eq(S7.view({ ...w.s, s7, route: { screen: "review", project: P.engine, agent: "streaming" } }).loading, true);
  w.open("review", P.storefront, "wallet");
  eq([w.v.files, w.v.empty], [[], { title: "nothing changed yet", text: "wallet's branch has no commit ahead of main" }]);
});

law("the fake S7 world speaks S3a's drafts: every event names its project, no event for bise's own", () => {
  const evs = F7.boot();
  eq([...new Set(evs.map((e) => e.ev))], ["worktrees", "dev_servers"]);
  for (const ev of evs) assert.ok(ev.project && ev.project !== F.HOME, JSON.stringify(ev).slice(0, 80));
});

const direct = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (direct) {
  console.log(`${fail ? "✗" : "✓"} ambient window S7: ${pass} passed${fail ? `, ${fail} failed` : ""}`);
  process.exit(fail ? 1 : 0);
}
