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
for (const f of ["winfake.js", "winfake7.js", "windock.js", "winenv.js", "wins7.js", "winmodel.js", "winview.js"]) vm.runInContext(readFileSync(join(here, f), "utf8"), ctx, { filename: f });
const { AmbWinFake: F, AmbWinFake7: F7, AmbWinModel: M, AmbWinS7: S7 } = ctx;
const j = (x) => (x === undefined ? x : JSON.parse(JSON.stringify(x)));
const eq = (a, b, msg) => assert.deepStrictEqual(j(a), j(b), msg);

let pass = 0, fail = 0;
export const results = () => ({ pass, fail });
function law(name, fn) {
  try { F.reset(); fn(); pass++; } catch (e) { fail++; console.log(`✗ window S7: ${name}\n  ${String(e.stack || e.message).split("\n").slice(0, 16).join("\n  ")}`); }
}

// a window on the fake core. amb-win's model calls AmbWinS7 itself once its hook lands (s.s7 in
// init); until then the laws hand S7's events to the extension the way the hook will.
const hooked = !!M.init(0).s7;
function win() {
  let s = { ...M.init(F.NOW), tz: "Europe/Paris" };
  if (!hooked) s = { ...s, s7: S7.init() };
  const sent = [];
  const step = (ev) => {
    if (!hooked && S7.owns(ev)) {
      const r = S7.step(s.s7, ev, s);
      s = { ...s, s7: r.s7 };
      return { s, cmds: r.cmds, eat: r.eat };
    }
    const r = M.step(s, ev);
    s = r.s;
    return r;
  };
  const pump = (cmds) => { for (const c of cmds) { sent.push(c); for (const [, ev] of F.respond(c)) step(ev); for (const [, ev] of (F7.respond(c) || [])) step(ev); } };
  for (const ev of [...F.boot(), ...(hooked ? [] : F7.boot())]) step(ev);
  const st = M.start(s); s = st.s; pump(st.cmds);
  const w = {
    sent,
    get s() { return s; },
    feed(ev) { const r = step(ev); pump(r.cmds || []); return r; },
    open(screen, project = "home", agent = "main") {
      if (hooked) return w.feed({ ev: "win_open", route: screen === "review" ? `review/${project}/${agent}` : screen });
      s = { ...s, route: { screen, project, agent } };
      const r = S7.enter(s.s7, s.route, s);
      s = { ...s, s7: r.s7 };
      pump(r.cmds);
      return r;
    },
    get v() { return S7.view(s); },
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
