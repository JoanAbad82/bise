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

// a control's button: a plain one, or the one among its chips (denied + 'open System Settings')
const btnOf = (c) => c.btn || ((c.chips || []).map((x) => x.btn).find(Boolean));
const ok = (text) => ({ chip: { text, tone: "ok" } });

law("a fresh install opens on the first launch: hello, then the permissions with their live state as chips", () => {
  const w = win({ fresh: true });
  eq(w.s.route.screen, "onboarding");
  let o = w.v.setup;
  eq([o.kind, o.step, o.steps, o.title, o.cta.text, o.pearl, o.skip, o.back], ["onboarding", 0, 5, "hi. i'm bise.", "start", "rest", "skip for now", ""]);
  w.key("Enter");
  o = w.v.setup;
  eq([o.title, o.groups[0].items.map((i) => [i.label, btnOf(i.control).text]), o.cta.text, o.back],
    ["three permissions", [["microphone", "allow"], ["accessibility", "allow"], ["screen recording", "allow"]], "continue for now", "← back"]);
  // allow = the app's one permission path (the bar's app_perm); the shell answers with perms
  w.feed(o.groups[0].items[0].control.btn.act);
  eq(w.cmds("app_perm"), [{ cmd: "app_perm", perm: "mic", do: "continue" }]);
  eq(w.v.setup.groups[0].items[0].control, ok("✓ allowed"));
  // denied: a chip, the line says what he loses, and the button opens System Settings
  w.feed({ ev: "perms", mic: "allowed", accessibility: "allowed", screen: "denied" });
  const scr = w.v.setup.groups[0].items[2];
  eq(scr.control.chips.map((c) => (c.chip ? c.chip.text : c.btn.text)), ["denied", "open System Settings"]);
  assert.notEqual(scr.sub, "");
  w.feed(btnOf(scr.control).act);
  eq(w.cmds("app_perm").pop(), { cmd: "app_perm", perm: "screen", do: "settings" });
  // all three allowed: the button is the primary 'continue'
  w.feed({ ev: "perms", mic: "allowed", accessibility: "allowed", screen: "allowed" });
  eq([w.v.setup.cta.text, w.v.setup.cta.kind], ["continue", "pri"]);
});
law("the model step waits for a sign-in or a key; esc steps back, ⏎ goes on", () => {
  const w = win({ fresh: true });
  w.key("Enter"); w.key("Enter");
  let o = w.v.setup;
  eq([o.title, o.cta.state, o.help, o.groups[0].items.map((i) => i.label)], ["which model?", "disabled", "sign in to one of them to go on", ["ChatGPT plan", "Claude plan", "an API key"]]);
  w.key("Enter");
  eq(w.v.setup.step, 2);
  w.key("Escape");
  eq(w.v.setup.step, 1);
  w.key("Enter");
  w.feed({ ev: "ui_acct_sign_in", id: "claude" });
  eq(w.cmds("sign_in"), [{ cmd: "sign_in", id: "claude" }]);
  o = w.v.setup;
  eq([o.groups[0].items[1].control, o.cta.state], [ok("✓ signed in"), ""]);
  w.key("Enter");
  eq(w.v.setup.title, "your projects");
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
  eq(w.v.setup.groups[0].items[2].control, ok("✓ added"));
  eq(w.v.setup.cta.state, "");
});
law("the projects step scans his folder: recent repos come checked, old ones not; ⏎ adds the checked ones", () => {
  const w = win({ fresh: true });
  w.key("Enter"); w.key("Enter"); w.feed({ ev: "ui_acct_sign_in", id: "chatgpt" }); w.key("Enter");
  eq(w.cmds("found_scan"), [{ cmd: "found_scan", dir: "~" }]);
  const o = w.v.setup;
  eq(o.sub, "i found these repos in your folder. each gets its main; bise coordinates them.");
  // storefront … are already his in the fake world: only the new ones show
  eq(o.groups[0].items.map((i) => [i.label, i.check.on, i.control.value]), [["checkout-api", true, "git · today"], ["engine-shaders", true, "git · 3 days ago"], ["dotfiles", false, "git · 2 months ago"]]);
  eq(o.cta.text, "add 2 projects");
  w.feed(o.groups[0].items[1].act);
  eq(w.v.setup.cta.text, "add 1 project");
  w.key("Enter");
  eq(w.cmds("project_add"), [{ cmd: "project_add", path: "~/work/checkout-api", worktrees: true, land: false }]);
  eq(w.s.projects.map((p) => p.name).slice(-1), ["checkout-api"]);
  eq(w.v.setup.title, "try it: hold fn");
});
law("try fn: the pearl listens while he holds fn and his words land under it; once he let go '✓ that's it'; ⏎ opens bise and marks him onboarded", () => {
  const w = win({ fresh: true });
  w.feed({ ev: "ui_onb_skip" });
  eq([w.cmds("prefs_set"), w.s.route], [[{ cmd: "prefs_set", key: "onboarded", value: true }], { project: F.HOME, agent: "main" }]);
  const w2 = win({ fresh: true });
  for (let i = 0; i < 4; i++) w2.feed({ ev: "ui_onb_next" });
  w2.feed({ ev: "ui_acct_sign_in", id: "chatgpt" }); w2.feed({ ev: "ui_onb_next" }); w2.feed({ ev: "ui_onb_next" });
  let o = w2.v.setup;
  eq([o.title, o.fn, o.pearl, o.cta.text, o.skip], ["try it: hold fn", "up", "rest", "open bise without trying", ""]);
  w2.feed({ ev: "app_fn", state: "down" });
  eq([w2.v.setup.fn, w2.v.setup.pearl, w2.v.setup.heard], ["down", "listen", "listening…"]);
  w2.feed({ ev: "heard", text: "what moved in storefront" });
  eq(w2.v.setup.heard, "what moved in storefront");
  w2.feed({ ev: "app_fn", state: "up" });
  o = w2.v.setup;
  eq([o.fn, o.pearl, o.heard, o.done, o.cta.text, o.hint], ["up", "done", "what moved in storefront", true, "open bise", "✓ that's it: bise answers in the capsule, at the bottom of the screen."]);
  w2.key("Enter");
  eq([w2.s.route, w2.cmds("prefs_set").pop()], [{ project: F.HOME, agent: "main" }, { cmd: "prefs_set", key: "onboarded", value: true }]);
  // an onboarded window never opens it again by itself
  w2.feed({ ev: "prefs", prefs: { onboarded: true } });
  eq(w2.s.route, { project: F.HOME, agent: "main" });
});
law("⌘, opens the settings on any thread; the pages; a toggle writes its pref; a choice is a menu; esc goes back where he was", () => {
  const w = win();
  w.feed({ ev: "ui_route", project: P.storefront, agent: "search" });
  eq(w.key(",", { meta: true }).eat, true);
  let o = w.v.setup;
  eq([o.kind, o.title, o.navTitle, o.back, o.nav.map((n) => n.name)], ["settings", "general", "settings", "← back", ["general", "voice and fn", "context and privacy", "quiet moments", "models", "projects", "keys"]]);
  w.feed({ ev: "ui_set_page", page: "quiet moments" });
  o = w.v.setup;
  eq(o.groups.map((g) => [g.title, g.items.map((i) => i.label)]), [["cards wait", ["during a call", "while you share your screen", "in full screen", "in focus mode"]],
    ["then", ["they come together", "at most every", "while you were away"]]]);
  eq(o.groups[0].items[0].control.toggle.on, true);
  w.feed(o.groups[0].items[0].control.toggle.act);
  eq(w.cmds("prefs_set"), [{ cmd: "prefs_set", key: "quiet.call", value: false }]);
  eq(w.v.setup.groups[0].items[0].control.toggle.on, false);
  // 'at most every 30 min ▾': a menu; a pick writes the pref and closes it; esc closes it too
  let m = w.v.setup.groups[1].items[1].control.menu;
  eq([m.text, m.open], ["30 min ▾", false]);
  w.feed(m.act);
  m = w.v.setup.groups[1].items[1].control.menu;
  eq([m.open, m.items.map((i) => [i.text, !!i.on])], [true, [["10 min", false], ["30 min", true], ["60 min", false]]]);
  w.feed(m.items[2].act);
  eq([w.cmds("prefs_set").pop(), w.v.setup.groups[1].items[1].control.menu.text, w.v.setup.groups[1].items[1].control.menu.open], [{ cmd: "prefs_set", key: "quiet.batch_min", value: 60 }, "60 min ▾", false]);
  w.feed(w.v.setup.groups[1].items[1].control.menu.act);
  eq(w.key("Escape").eat, true);
  eq([w.v.setup.groups[1].items[1].control.menu.open, w.v.setup.kind], [false, "settings"]);
  w.feed({ ev: "ui_set_page", page: "context and privacy" });
  const kept = w.v.setup.groups[1].items;
  eq([kept[0].control.menu.text, kept[1].sub], ["7 days ▾", "the excluded apps · 1Password, Messages"]);
  // the theme's and the language's segmented controls send the value of their part
  w.feed({ ev: "ui_set_page", page: "general" });
  w.feed({ ev: "ui_set_pref", key: "theme", value: "dark" });
  eq(w.v.setup.groups[0].items.map((i) => i.control.seg && i.control.seg.on).slice(0, 2), [2, 0]);
  // digits are his, never a card's answer, on a settings page
  eq(w.key("1").eat, false);
  eq(w.cmds("answer"), []);
  w.key("Escape");
  eq([w.s.route, w.v.setup], [{ project: P.storefront, agent: "search" }, null]);
  // ⌘0 still goes to bise from the settings
  w.key(",", { meta: true }); w.key("0", { meta: true, digit: 0 });
  eq(w.s.route, { project: F.HOME, agent: "main" });
});
law("settings › projects: a drag handle orders ⌘1-9; '…' opens it in Terminal or the editor; remove asks once (⏎ remove · esc keep); '+ add a project' opens the sheet", () => {
  const w = win();
  w.feed({ ev: "win_open", route: "settings/projects" });
  let o = w.v.setup;
  eq(o.groups[0].items.map((i) => `${i.key} ${i.label} ${i.drag.order} ${i.control.menu.text}`), ["⌘1 storefront 1 …", "⌘2 telemetry 2 …", "⌘3 engine 3 …", "⌘4 evals 4 …"]);
  // a drop of engine's handle on telemetry's row (winui's dragstart/drop)
  w.feed({ ev: "ui_set_move", project: P.engine, order: o.groups[0].items[1].drag.order });
  eq(w.cmds("project_move"), [{ cmd: "project_move", project: P.engine, order: 2 }]);
  eq(w.v.setup.groups[0].items.map((i) => i.label), ["storefront", "engine", "telemetry", "evals"]);
  // '…'
  w.feed(w.v.setup.groups[0].items[0].control.menu.act);
  const items = w.v.setup.groups[0].items[0].control.menu.items;
  eq(items.map((i) => (i.sep ? "—" : `${i.text}${i.danger ? " (red)" : ""}`)), ["open in Terminal", "open in editor", "—", "remove from bise (red)"]);
  w.feed(items[0].act);
  eq([w.cmds("open"), w.v.setup.groups[0].items[0].control.menu.open], [[{ cmd: "open", project: P.storefront, what: "terminal" }], false]);
  // remove: asks, esc keeps it
  w.feed(w.v.setup.groups[0].items[3].control.menu.act);
  w.feed(w.v.setup.groups[0].items[3].control.menu.items[3].act);
  eq([w.v.setup.confirm.text, w.v.setup.confirm.keys, w.v.setup.confirm.yes.text, w.v.setup.confirm.no.text],
    ["remove evals from bise? its folder and its git history stay.", "⏎ remove · esc keep", "remove", "keep"]);
  w.key("Escape");
  eq([w.v.setup.confirm, w.cmds("project_remove"), w.v.setup.kind], [null, [], "settings"]);
  // ⏎ removes
  w.feed({ ev: "ui_set_confirm", project: P.evals });
  w.key("Enter");
  eq(w.cmds("project_remove"), [{ cmd: "project_remove", project: P.evals }]);
  eq(w.v.side.rows.filter((r) => r.kind === "pj").map((r) => r.name), ["storefront", "engine", "telemetry"]);
  w.feed(w.v.setup.add.act);
  assert.ok(w.v.sheet);
});
law("the add-a-project sheet: a path field with choose…, his repos with ticks, the two choices with their effects, the button counts the ticks", () => {
  const w = win();
  w.feed({ ev: "ui_add_open" });
  let o = w.v.sheet;
  eq([o.title, o.path.text, o.path.ph, o.path.choose.text, o.foundTitle, o.go.state, o.go.text, o.items.map((i) => i.label)],
    ["add a project", "", "drop a folder here, or choose one", "choose…", "found in your folders", "disabled", "add", ["checkout-api", "engine-shaders", "dotfiles"]]);
  eq([o.cancel.tip, o.go.tip], ["esc", "⏎"]);
  eq(o.choices.map((c) => [c.label, c.control.toggle.on, c.sub]), [["agents in their own worktree", true, "ψ: each agent has its own copy of the repo, nobody steps on anyone"],
    ["main may land on main", false, "otherwise an approval each time"]]);
  w.feed(o.items[1].act);
  w.feed(o.choices[1].control.toggle.act);
  o = w.v.sheet;
  eq([o.go.text, o.choices[1].sub, o.items[1].check.on], ["add engine-shaders", "sb land after the tests, without asking you", true]);
  w.feed(o.items[0].act);
  eq(w.v.sheet.go.text, "add 2 projects");
  // the sheet holds the keys: a digit is not a card's answer; ⏎ adds
  eq(w.key("2").eat, false);
  w.key("Enter");
  eq(w.cmds("project_add"), [{ cmd: "project_add", path: "~/engine-shaders", worktrees: true, land: true }, { cmd: "project_add", path: "~/work/checkout-api", worktrees: true, land: true }]);
  eq([w.v.sheet, w.v.side.rows.filter((r) => r.kind === "pj").map((r) => r.name).slice(-2)], [null, ["engine-shaders", "checkout-api"]]);
});
law("a folder dropped on the window opens the sheet on it; a typed path counts; choose… asks the shell's picker; esc closes", () => {
  const w = win();
  w.feed({ ev: "win_drop", paths: ["~/code/notes"] });
  eq([w.v.sheet.path.text, w.v.sheet.go.text], ["~/code/notes", "add notes"]);
  w.key("Escape");
  eq(w.v.sheet, null);
  w.feed({ ev: "ui_add_open" });
  w.feed({ ev: "ui_add_type", text: "~/code/blog " });
  eq([w.v.sheet.path.text, w.v.sheet.go.text, w.v.sheet.go.state], ["~/code/blog ", "add blog", ""]);
  w.feed(w.v.sheet.path.choose.act);
  eq(w.cmds("win_pick_folder"), [{ cmd: "win_pick_folder" }]);
  // the picked folder is one of his found repos: it comes ticked
  eq([w.v.sheet.items[0].check.on, w.v.sheet.go.text], [true, "add 2 projects"]);
  // the harness's picker never opens: path null leaves the sheet as it was
  w.feed({ ev: "win_folder", path: null, reason: "harness" });
  eq(w.v.sheet.go.text, "add 2 projects");
  w.key("Enter");
  eq(w.cmds("project_add").map((c) => c.path), ["~/work/checkout-api", "~/code/blog"]);
});
law("one language per screen: his setting, else macOS's (win_lang), else English; marks and key names stay", () => {
  const w = win({ fresh: true });
  eq(w.v.setup.title, "hi. i'm bise.");
  w.feed({ ev: "win_lang", lang: "fr-FR" });
  eq([w.v.setup.title, w.v.setup.cta.text, w.v.setup.skip], ["salut. moi, c'est bise.", "commencer", "plus tard"]);
  // his setting wins over macOS's
  w.feed({ ev: "prefs", prefs: { ...w.s.s11.prefs, language: "en" } });
  eq(w.v.setup.title, "hi. i'm bise.");
  w.feed({ ev: "prefs", prefs: { ...w.s.s11.prefs, language: "fr" } });
  w.key("Enter");
  eq([w.v.setup.title, w.v.setup.groups[0].items.map((i) => btnOf(i.control).text)], ["trois permissions", ["autoriser", "autoriser", "autoriser"]]);
  // a settings page in French: every word French, the key names the same
  w.feed({ ev: "ui_onb_skip" });
  w.key(",", { meta: true });
  w.feed({ ev: "ui_set_page", page: "keys" });
  const o = w.v.setup;
  eq([o.navTitle, o.nav[0].name, o.title], ["réglages", "général", "touches"]);
  eq(o.groups[0].items.find((i) => i.control.kbd === "⌘K") != null, true);
  w.key("Escape");
  // an unknown macOS language falls back to English
  w.feed({ ev: "prefs", prefs: { ...w.s.s11.prefs, language: "system" } });
  w.feed({ ev: "win_lang", lang: "de" });
  eq(w.v.setup, null);
  w.key(",", { meta: true });
  eq(w.v.setup.navTitle, "settings");
});

const direct = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (direct) {
  console.log(`${fail ? "✗" : "✓"} ambient window setup: ${pass} passed${fail ? `, ${fail} failed` : ""}`);
  process.exit(fail ? 1 : 0);
}
