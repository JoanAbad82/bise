// bise desktop · the setup screens' laws (S11, web side): the first launch's five steps, the
// settings pages and the add-a-project sheet, played on the fake core through the window's model.
//   node apps/ambient/web/window/check-setup.mjs     (web/check.mjs runs it too)
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
const ctx = vm.createContext({ console, Math, JSON, Object, Array, Set, Map, String, Number, Date, Intl, RegExp });
for (const f of ["winwords.js", "winfake.js", "winfake7.js", "winfake11.js", "windock.js", "winfind.js", "winenv.js", "winarts.js", "wins7.js", "winsetup.js", "winmodel.js", "winview.js"].filter((f) => existsSync(join(here, f))))
  vm.runInContext(readFileSync(join(here, f), "utf8"), ctx, { filename: f });
const { AmbWinFake: F, AmbWinFake11: F11, AmbWinModel: M, AmbWinView: V } = ctx;
const j = (x) => (x === undefined ? x : JSON.parse(JSON.stringify(x)));
const eq = (a, b, msg) => assert.deepStrictEqual(j(a), j(b), msg);

let pass = 0, fail = 0;
export const results = () => ({ pass, fail });
function law(name, fn) {
  try { F.reset(); fn(); pass++; } catch (e) { fail++; console.log(`✗ setup: ${name}\n  ${String(e.stack || e.message).split("\n").slice(0, 14).join("\n  ")}`); }
}
// a window on the fake core (fresh: a first install), every cmd answered at once
function win({ fresh = false } = {}) {
  if (fresh) F11.fresh();
  let s = { ...M.init(F.NOW), tz: "Europe/Paris" };
  const sent = [];
  const pump = (cmds) => { for (const c of cmds) { sent.push(c); for (const [, ev] of F.respond(c)) { const r = M.step(s, ev); s = r.s; pump(r.cmds); } } };
  for (const ev of F.boot()) { const r = M.step(s, ev); s = r.s; pump(r.cmds); }
  const st = M.start(s); s = st.s; pump(st.cmds);
  const w = {
    sent, get s() { return s; }, get v() { return V.view(s); },
    feed(ev) { const r = M.step(s, ev); s = r.s; pump(r.cmds); return r; },
    key(key, mods = {}) { return w.feed({ ev: "ui_key", key, digit: /^[0-9]$/.test(key) ? +key : null, ...mods }); },
    cmds: (name) => sent.filter((c) => c.cmd === name),
  };
  return w;
}
const P = F.P;

law("a fresh install opens on the first launch: hello, then the permissions with their live state", () => {
  const w = win({ fresh: true });
  eq(w.s.route.screen, "onboarding");
  let o = w.v.setup;
  eq([o.kind, o.step, o.steps, o.title, o.cta.text, o.pearl], ["onboarding", 0, 5, "salut. moi, c'est bise.", "commencer", true]);
  w.key("Enter");
  o = w.v.setup;
  eq([o.title, o.groups[0].items.map((i) => [i.label, i.control.btn ? i.control.btn.text : i.control.value]), o.cta.text],
    ["trois permissions", [["microphone", "allow"], ["accessibility", "allow"], ["screen recording", "allow"]], "continue for now"]);
  // allow = the app's one permission path (the bar's app_perm); the shell answers with perms
  w.feed(o.groups[0].items[0].control.btn.act);
  eq(w.cmds("app_perm"), [{ cmd: "app_perm", perm: "mic", do: "continue" }]);
  eq(w.v.setup.groups[0].items[0].control, { value: "allowed" });
  w.feed({ ev: "perms", mic: "allowed", accessibility: "allowed", screen: "denied" });
  w.feed(w.v.setup.groups[0].items[2].control.btn.act);
  eq(w.cmds("app_perm").pop(), { cmd: "app_perm", perm: "screen", do: "settings" });
});
law("the model step waits for a sign-in or a key; esc steps back, ⏎ goes on", () => {
  const w = win({ fresh: true });
  w.key("Enter"); w.key("Enter");
  let o = w.v.setup;
  eq([o.title, o.cta.state, o.help, o.groups[0].items.map((i) => i.label)], ["avec quel modèle ?", "disabled", "sign in to one of them to go on", ["ChatGPT plan", "Claude plan", "an API key"]]);
  w.key("Enter");
  eq(w.v.setup.step, 2);
  w.key("Escape");
  eq(w.v.setup.step, 1);
  w.key("Enter");
  w.feed({ ev: "ui_acct_sign_in", id: "claude" });
  eq(w.cmds("sign_in"), [{ cmd: "sign_in", id: "claude" }]);
  o = w.v.setup;
  eq([o.groups[0].items[1].control, o.cta.state], [{ value: "signed in" }, ""]);
  w.key("Enter");
  eq(w.v.setup.title, "tes projets");
});
law("an API key: its field takes every key (a digit never answers a card), ⏎ saves it", () => {
  const w = win({ fresh: true });
  w.key("Enter"); w.key("Enter");
  w.feed({ ev: "ui_key_edit", id: "anthropic" });
  eq(w.v.setup.key, { id: "anthropic", text: "", ph: "paste your key, then ⏎" });
  // the window's own keys never see them here: no card answered, nothing sent
  eq([w.key("1").eat, w.key("i", { meta: true }).eat], [false, false]);
  eq([w.cmds("answer"), w.s.inbox], [[], null]);
  w.feed({ ev: "ui_key_type", text: "sk-ant-1234" });
  w.key("Enter");
  eq(w.cmds("key_set"), [{ cmd: "key_set", id: "anthropic", key: "sk-ant-1234" }]);
  eq(w.v.setup.groups[0].items[2].control, { value: "added" });
  eq(w.v.setup.cta.state, "");
});
law("the projects step scans his folder: recent repos come checked, old ones not; ⏎ adds the checked ones", () => {
  const w = win({ fresh: true });
  w.key("Enter"); w.key("Enter"); w.feed({ ev: "ui_acct_sign_in", id: "chatgpt" }); w.key("Enter");
  eq(w.cmds("found_scan"), [{ cmd: "found_scan", dir: "~" }]);
  const o = w.v.setup;
  // storefront … are already his in the fake world: only the new ones show
  eq(o.groups[0].items.map((i) => [i.label, i.check.on, i.control.value]), [["checkout-api", true, "git · today"], ["engine-shaders", true, "git · 3 days ago"], ["dotfiles", false, "git · 2 months ago"]]);
  eq(o.cta.text, "add 2 projects");
  w.feed(o.groups[0].items[1].act);
  eq(w.v.setup.cta.text, "add 1 project");
  w.key("Enter");
  eq(w.cmds("project_add"), [{ cmd: "project_add", path: "~/work/checkout-api", worktrees: true, land: false }]);
  eq(w.s.projects.map((p) => p.name).slice(-1), ["checkout-api"]);
  eq(w.v.setup.title, "essaie : tiens fn");
});
law("try fn: the key goes down while he holds fn, the line changes once he let go; ⏎ opens bise and marks him onboarded", () => {
  const w = win({ fresh: true });
  w.feed({ ev: "ui_onb_skip" });
  eq([w.cmds("prefs_set"), w.s.route], [[{ cmd: "prefs_set", key: "onboarded", value: true }], { project: F.HOME, agent: "main" }]);
  const w2 = win({ fresh: true });
  for (let i = 0; i < 4; i++) w2.feed({ ev: "ui_onb_next" });
  w2.feed({ ev: "ui_acct_sign_in", id: "chatgpt" }); w2.feed({ ev: "ui_onb_next" }); w2.feed({ ev: "ui_onb_next" });
  let o = w2.v.setup;
  eq([o.title, o.fn, o.cta.text], ["essaie : tiens fn", "up", "open bise without trying"]);
  w2.feed({ ev: "app_fn", state: "down" });
  eq(w2.v.setup.fn, "down");
  w2.feed({ ev: "app_fn", state: "up" });
  o = w2.v.setup;
  eq([o.fn, o.cta.text, o.hint], ["up", "open bise", "c'est parti : bise te répond dans la capsule, en bas de l'écran."]);
  w2.key("Enter");
  eq([w2.s.route, w2.cmds("prefs_set").pop()], [{ project: F.HOME, agent: "main" }, { cmd: "prefs_set", key: "onboarded", value: true }]);
  // an onboarded window never opens it again by itself
  w2.feed({ ev: "prefs", prefs: { onboarded: true } });
  eq(w2.s.route, { project: F.HOME, agent: "main" });
});
law("⌘, opens the settings on any thread; the pages; a toggle writes its pref; esc goes back where he was", () => {
  const w = win();
  w.feed({ ev: "ui_route", project: P.storefront, agent: "search" });
  eq(w.key(",", { meta: true }).eat, true);
  let o = w.v.setup;
  eq([o.kind, o.title, o.nav.map((n) => n.name)], ["settings", "general", ["general", "voice and fn", "context and privacy", "quiet moments", "models", "projects", "keys"]]);
  w.feed({ ev: "ui_set_page", page: "quiet moments" });
  o = w.v.setup;
  eq(o.groups.map((g) => [g.title, g.items.map((i) => i.label)]), [["cards wait", ["during a call", "while you share your screen", "in full screen", "in focus mode"]],
    ["then", ["they come together", "at most every", "while you were away"]]]);
  eq(o.groups[0].items[0].control.toggle.on, true);
  w.feed(o.groups[0].items[0].control.toggle.act);
  eq(w.cmds("prefs_set"), [{ cmd: "prefs_set", key: "quiet.call", value: false }]);
  eq(w.v.setup.groups[0].items[0].control.toggle.on, false);
  w.feed({ ev: "ui_set_page", page: "context and privacy" });
  eq(w.v.setup.groups[1].items.map((i) => i.control.value), ["7 days", "1Password, Messages"]);
  // the theme's segmented control sends the value of its part
  w.feed({ ev: "ui_set_page", page: "general" });
  w.feed({ ev: "ui_set_pref", key: "theme", value: "dark" });
  eq(w.v.setup.groups[0].items[0].control.seg.on, 2);
  // digits are his, never a card's answer, on a settings page
  eq(w.key("1").eat, false);
  eq(w.cmds("answer"), []);
  w.key("Escape");
  eq([w.s.route, w.v.setup], [{ project: P.storefront, agent: "search" }, null]);
  // ⌘0 still goes to bise from the settings
  w.key(",", { meta: true }); w.key("0", { meta: true, digit: 0 });
  eq(w.s.route, { project: F.HOME, agent: "main" });
});
law("settings › projects: the order of ⌘1-9, ↑ moves one up, remove drops it; '+ add a project' opens the sheet", () => {
  const w = win();
  w.feed({ ev: "win_open", route: "settings/projects" });
  let o = w.v.setup;
  eq(o.groups[0].items.map((i) => `${i.key} ${i.label} ${i.control.btns.map((b) => b.text).join(" ")}`), ["⌘1 storefront remove", "⌘2 telemetry ↑ remove", "⌘3 engine ↑ remove", "⌘4 evals ↑ remove"]);
  w.feed(o.groups[0].items[2].control.btns[0].act);
  eq(w.cmds("project_move"), [{ cmd: "project_move", project: P.engine, order: 2 }]);
  eq(w.v.setup.groups[0].items.map((i) => i.label), ["storefront", "engine", "telemetry", "evals"]);
  w.feed(w.v.setup.groups[0].items[3].control.btns[1].act);
  eq(w.cmds("project_remove"), [{ cmd: "project_remove", project: P.evals }]);
  eq(w.v.side.rows.filter((r) => r.kind === "pj").map((r) => r.name), ["storefront", "engine", "telemetry"]);
  w.feed(w.v.setup.add.act);
  assert.ok(w.v.sheet);
});
law("the add-a-project sheet: his repos not added yet, one picked, the two choices with their effects, add sends project_add and the project appears", () => {
  const w = win();
  w.feed({ ev: "ui_add_open" });
  let o = w.v.sheet;
  eq([o.title, o.drop, o.go.state, o.items.map((i) => i.label)], ["add a project", "drop a folder here, or choose one…", "disabled", ["checkout-api", "engine-shaders", "dotfiles"]]);
  eq(o.choices.map((c) => [c.label, c.control.toggle.on, c.sub]), [["agents in their own worktree", true, "ψ : chaque agent a sa copie du repo, rien ne se marche dessus"],
    ["main may land on main", false, "sinon une approbation à chaque fois"]]);
  w.feed(o.items[1].act);
  w.feed(o.choices[1].control.toggle.act);
  o = w.v.sheet;
  eq([o.go.text, o.choices[1].sub, o.items[1].check.on], ["add engine-shaders", "sb land après les tests, sans te demander", true]);
  // the sheet holds the keys: a digit is not a card's answer; ⏎ adds
  eq(w.key("2").eat, false);
  w.key("Enter");
  eq(w.cmds("project_add"), [{ cmd: "project_add", path: "~/engine-shaders", worktrees: true, land: true }]);
  eq([w.v.sheet, w.v.side.rows.filter((r) => r.kind === "pj").map((r) => r.name).pop()], [null, "engine-shaders"]);
});
law("a folder dropped on the window opens the sheet on it; choose… asks the shell's picker; esc closes", () => {
  const w = win();
  w.feed({ ev: "win_drop", paths: ["~/code/notes"] });
  eq([w.v.sheet.drop, w.v.sheet.go.text], ["~/code/notes", "add notes"]);
  w.key("Escape");
  eq(w.v.sheet, null);
  w.feed({ ev: "ui_add_open" });
  w.feed(w.v.sheet.dropAct);
  eq(w.cmds("win_pick_folder"), [{ cmd: "win_pick_folder" }]);
  eq(w.v.sheet.drop, "~/work/checkout-api");
  // the harness's picker never opens: path null leaves the sheet as it was
  w.feed({ ev: "win_folder", path: null, reason: "harness" });
  eq(w.v.sheet.drop, "~/work/checkout-api");
});

const direct = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (direct) {
  console.log(`${fail ? "✗" : "✓"} ambient window setup: ${pass} passed${fail ? `, ${fail} failed` : ""}`);
  process.exit(fail ? 1 : 0);
}
