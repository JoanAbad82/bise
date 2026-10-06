// bise ambient · the web UI's checks (node, no deps): the pure parts. The words, the kiss face
// (against kiss.rs's laws), the event reducer and state -> view, and every fake-core scene run
// through the model so each SPEC §2 state shows from contract events.
//   node apps/ambient/web/check.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
const ctx = vm.createContext({ console, Math, JSON, Object, Array, Set, Uint8Array, Float32Array, String, Number });
for (const f of ["words.js", "face.js", "policy.js", "spotlist.js", "model.js", "pearl.js", "bar.js", "fakecore.js", "../kit/notelines.js", "../kit/notes.js"]) vm.runInContext(readFileSync(join(here, f), "utf8"), ctx, { filename: f });
const { AmbWords: Wd, AmbFace: F, AmbModel: M, AmbFake: Fake, BiseNotes, BiseLines, AmbPearl: Pearl, AmbBar: Bar } = ctx;
const W = Wd.W;

// the scripts run in their own realm: compare plain data
const j = (x) => (x === undefined ? x : JSON.parse(JSON.stringify(x)));
const eq = (a, b, msg) => assert.deepStrictEqual(j(a), j(b), msg);
const ne = (a, b, msg) => assert.notDeepStrictEqual(j(a), j(b), msg);

let pass = 0, fail = 0;
function law(name, fn) {
  try { fn(); pass++; } catch (e) { fail++; console.log(`✗ ${name}\n  ${String(e.message).split("\n").join("\n  ")}`); }
}

// run events through the model; `at` sample times (ms) give the view then
function run(events, at = [], { answer = false } = {}) {
  let m = M.init();
  const cmds = [], views = {};
  const evs = events.slice().sort((a, b) => a[0] - b[0]);
  const times = [...new Set([...evs.map((e) => e[0]), ...at])].sort((a, b) => a - b);
  let i = 0;
  const pending = [];
  for (const t of times) {
    while (pending.length && pending[0][0] <= t) { const [pt, ev] = pending.shift(); m = M.step(m, ev, pt).m; }
    while (i < evs.length && evs[i][0] === t) {
      const r = M.step(m, evs[i][1], t); m = r.m;
      for (const c of r.cmds) { cmds.push({ t, ...c }); if (answer) for (const [d, ev] of Fake.respond(c)) { pending.push([t + d, ev]); pending.sort((a, b) => a[0] - b[0]); } }
      i++;
    }
    if (at.includes(t)) views[t] = M.view(m, t);
  }
  return { m, cmds, views, view: (t) => views[t] };
}
const sceneEvents = (id) => Fake.SCENES.find((s) => s.id === id).build();
// the view at every 50 ms of a scene
function sweep(id, until) {
  const evs = sceneEvents(id);
  const end = until ?? evs[evs.length - 1][0] + 6000;
  const at = []; for (let t = 0; t <= end; t += 50) at.push(t);
  return { ...run(evs, at, { answer: true }), at };
}
const flat = (v) => [v.label && v.label.text, v.glyph, v.text, v.words && v.words.list.slice(0, v.words.lit).join(" "), v.sub, v.sees].filter(Boolean).join(" | ");

// ---- the words
law("the idle line counts the working agents, and goes quiet at none", () => {
  assert.equal(Wd.idleLine(3), W.idle);
  assert.equal(Wd.idleLine(1), "nothing needs you. 1 agent working.");
  assert.equal(Wd.idleLine(0), W.quiet);
});
law("done and failed lines read like ambient's W", () => {
  // never the report: it's written to main, not to you (ambient, m_4677)
  assert.equal(Wd.doneLine("perf"), "perf is done.");
  assert.equal(Wd.failLine("release"), "release failed.");
});
law("a long report is cut at its first sentence, then at the word", () => {
  assert.equal(Wd.firstSentence("one. two."), "one.");
  assert.equal(Wd.firstSentence("v1.2 is out. more"), "v1.2 is out.");
  const s = Wd.firstSentence("word ".repeat(40), 30);
  assert.ok(s.length <= 30 && s.endsWith("…"), s);
});
law("the answered line names the option", () => {
  assert.equal("✓ " + Wd.answeredLine("cookies"), "✓ cookies has it.");
  assert.equal("✓ " + Wd.answeredLine("cookies", "yes"), "✓ cookies has it: yes.");
});

// ---- the face (rust/tui/src/voicemode/kiss.rs's laws, on the same dots)
const P = ["listen", "talk", "think", "speak", "kiss", "rest"];
const rows = (pose, ms = 0, lvl = 0, still = false) => F.blocks(F.face(pose, ms, lvl, still));
law("every pose is 41 × 9 cells of half blocks", () => {
  for (const p of P) for (const t of [0, 200, 450, 700, 1300, 5000]) {
    const r = rows(p, t, 0.8);
    assert.equal(r.length, 9);
    assert.ok(r.every((x) => [...x].length === 41 && /^[ █▀▄]*$/.test(x)), p);
  }
});
law("the colon is always there on the left", () => {
  for (const p of P) {
    const f = rows(p, 0, 0);
    const cells = (r) => [...f[r]].slice(6, 10).join("");
    eq([cells(2), cells(3), cells(5), cells(6)], ["████", "▀▀▀▀", "▄▄▄▄", "████"], p);
  }
});
law("at rest it smiles: rows 1..7 inked right of the colon, no arcs", () => {
  const m = rows("rest").map((r) => [...r].slice(12).join(""));
  const inked = m.map((r, i) => (r.trim() ? i : -1)).filter((i) => i >= 0);
  eq(inked, [1, 2, 3, 4, 5, 6, 7]);
  const left = (r) => [...r].findIndex((c) => c !== " ");
  assert.ok(left(m[4]) > left(m[1]) && left(m[4]) > left(m[7]));
  assert.ok(rows("rest").every((r) => [...r].slice(34).every((c) => c === " ")));
});
law("listening breathes every 1.2 s, talking holds, thinking turns", () => {
  eq(rows("listen", 0), rows("rest", 0));
  ne(rows("listen", 1200), rows("listen", 0));
  eq(rows("listen", 2400), rows("listen", 0));
  eq(rows("talk", 0), rows("talk", 1200));
  ne(rows("think", 0), rows("think", 150));
});
law("speaking opens the mouth and its arcs with the level; quiet is the smile", () => {
  eq(rows("speak", 0, 0.05), rows("rest", 0));
  assert.equal(F.arcsFor(0.1), 0); assert.equal(F.arcsFor(0.3), 1); assert.equal(F.arcsFor(0.5), 2); assert.equal(F.arcsFor(0.9), 3);
  assert.ok(rows("speak", 0, 0.9).some((r) => [...r].slice(34).some((c) => c !== " ")));
});
law("the kiss presses, puckers, blows its puff, then smiles; still has no kiss", () => {
  const k = (ms) => rows("kiss", ms);
  ne(k(0), k(200));
  ne(k(200), k(450));
  assert.ok(k(450).some((r) => [...r].slice(30).some((c) => c !== " ")), "the puff flies right");
  eq(rows("kiss", 900), rows("rest", 0));
  eq(rows("kiss", 200, 0, true), rows("rest", 0, 0, true));
});
law("the eyes blink at rest, never while speaking, never when still", () => {
  const eyesShut = (f) => [...f[2]].slice(6, 10).join("") !== "████";
  assert.ok(eyesShut(rows("rest", 4100)));
  assert.ok(!eyesShut(rows("speak", 4100, 0.5)));
  assert.ok(!eyesShut(rows("rest", 4100, 0, true)));
});

// ---- the reducer and the view, state by state (SPEC §2)
law("idle: small, the resting face, the idle line", () => {
  const { view } = run(sceneEvents("idle"), [100]);
  const v = view(100);
  assert.equal(v.size, "small"); assert.equal(v.pose, "rest"); assert.equal(v.text, null); assert.equal(v.content.kind, "none"); assert.equal(v.need, false);
});
law("all quiet: hold fn to talk", () => {
  assert.equal(run(sceneEvents("quiet"), [100]).view(100).text, null);
});
law("hold fn: open, the sphere follows your voice, live words, `main sees …`, the edge", () => {
  const s = sweep("talk");
  const v = s.views[2000];
  assert.equal(v.state, "listening"); assert.equal(v.size, "open");
  assert.equal(v.pose, "talk"); assert.ok(v.lvl > 0);
  assert.equal(v.label.text, W.listening); assert.equal(v.label.rest, W.letGo);
  eq(v.sees, { head: "bise sees Chrome · localhost:4801", tail: "/settings" });
  assert.ok(v.words.list.length > 2 && W.said.startsWith(v.words.list.join(" ")));
  assert.ok(v.edge.on);
  // the words grow
  assert.ok(s.views[3000].words.list.length > v.words.list.length);
});
law("a skipped window: `main doesn't see this window`", () => {
  const s = sweep("unseen", 2500);
  eq(s.views[2000].sees, { head: W.notSeen, tail: "" });
});
law("the chip cuts the path or the title, never the app or the host", () => {
  eq(Wd.seesParts("Chrome", "localhost:4801/settings/appearance"), { head: "bise sees Chrome · localhost:4801", tail: "/settings/appearance" });
  eq(Wd.seesParts("Chrome", "https://github.com/acme/web/pull/482"), { head: "bise sees Chrome · https://github.com", tail: "/acme/web/pull/482" });
  eq(Wd.seesParts("Ghostty", "~/acme — bise"), { head: "bise sees Ghostty · ", tail: "~/acme — bise" });
  eq(Wd.seesParts("Finder", ""), { head: "bise sees Finder", tail: "" });
});
law("let go: his words stay on the glass, whole, while bise thinks (the pearl's work mood); no 'got it' / 'on it' line (the user's dogfood, lead m_7163)", () => {
  const evs = sceneEvents("talk");
  const sent = evs.find(([, e]) => e.ev === "sent")[0];
  const r = run(evs, [sent + 100, sent + 1200]);
  const a = r.view(sent + 100), b = r.view(sent + 1200);
  assert.equal(a.label.text, "bise"); assert.equal(a.text, null); assert.equal(a.pose, "think"); assert.equal(a.size, "open");
  assert.equal(a.mood, "work");
  eq(a.said.list.join(" "), W.said);
  eq([b.text, b.said.list.join(" ")], [null, W.said]);
  assert.equal(b.sub, "starting dark-mode");
  const s = Bar.spec(b);
  eq([s.head.line.wrap, s.head.line.words.list.length > 8], [true, true]);
  // while he talks, his words wrap too (never clipped on one line)
  const listen = evs.filter(([, e]) => e.ev === "heard").at(-1)[0];
  assert.equal(Bar.spec(run(evs, [listen + 10]).view(listen + 10)).head.line.wrap, true);
  // nothing on any surface says ':*' any more
  assert.ok(!JSON.stringify(W).includes(":*"));
});
law("main speaks: the sphere follows main's voice, its words light one by one, new agents pop in", () => {
  const evs = sceneEvents("talk");
  const sp = evs.find(([, e]) => e.ev === "phase" && e.phase === "speaking")[0];
  const r = run(evs, [sp + 10, sp + 300, sp + 1000, sp + 2600]);
  const v0 = r.view(sp + 10), v1 = r.view(sp + 1000), v2 = r.view(sp + 2600);
  assert.equal(v1.state, "speaking"); assert.equal(v1.pose, "speak"); assert.ok(v1.lvl > 0 || r.view(sp + 300).lvl > 0);
  assert.equal(v0.words.lit, 1);
  assert.equal(v1.words.lit, 4);
  assert.equal(v1.words.list.join(" "), Fake.ANSWER);
  eq([...v2.chips], ["dark-mode", "cookies"]);
});
law("end of turn: the kiss once (1 s), open, then small after 4 s", () => {
  const evs = sceneEvents("talk");
  const done = evs.find(([, e]) => e.ev === "phase" && e.phase === "done")[0];
  const r = run(evs, [done + 300, done + 1500, done + 4200]);
  assert.equal(r.view(done + 300).pose, "kiss"); assert.equal(r.view(done + 300).size, "open");
  assert.equal(r.view(done + 300).words.lit, r.view(done + 300).words.list.length);
  assert.equal(r.view(done + 1500).pose, "rest"); assert.equal(r.view(done + 1500).size, "open");
  assert.equal(r.view(done + 4200).size, "small");
});
law("needs you: ONE glass (round 8, ambient m_5332): the capsule itself says '? cookies needs you', the question, `1 yes` `2 no` and the hint; no second card", () => {
  const v = run(sceneEvents("needs-wait"), [1000]).view(1000);
  assert.equal(v.size, "open"); assert.equal(v.state, "needs"); assert.ok(v.need); assert.equal(v.mood, "need");
  assert.equal(v.note, null); assert.equal(v.text, null);
  assert.equal(v.ask.title, "cookies needs you");
  assert.equal(v.ask.text, "keep the banner on mobile?");
  eq(v.ask.options.map((o) => `${o.n} ${o.label}`), W.needsOpts);
  assert.equal(v.ask.hint, W.needsKeys);
});
law("answered: fn + 1 sends the answer, `✓ cookies has it: yes.` with the kiss, the glass goes", () => {
  const evs = sceneEvents("needs");
  const k = evs.find(([, e]) => e.ev === "app_key")[0];
  const r = run(evs, [k + 100, k + 3000, k + 5000]);
  eq(r.cmds.map(({ t, ...c }) => c), [{ cmd: "answer", card: "c1", reply: "1" }]);
  const v = r.view(k + 100);
  assert.equal(v.glyph, "✓"); assert.equal(v.text, "cookies has it: yes."); assert.equal(v.pose, "kiss"); assert.equal(v.note, null);
  assert.equal(r.view(k + 5000).text, null);
});
law("a click on an option answers the same", () => {
  let m = M.init();
  m = M.step(m, { ev: "state", agents: Fake.AGENTS, cards: [Fake.CARD] }, 0).m;
  const r = M.step(m, { ev: "ui_option", card: "c1", i: 1 }, 10);
  eq([...r.cmds], [{ cmd: "answer", card: "c1", reply: "2" }]);
  assert.equal(M.view(r.m, 20).text, "cookies has it: no.");
});
law("B3 rows (ambient m_6500, lead m_6487): one row per choice, the first selected; ↑↓ move (clamped), ⏎ picks the selected one, a digit picks its own", () => {
  const card = { id: "q", agent: "ops", text: "Que fais-tu ?", options: [{ n: 1, label: "regarde" }, { n: 2, label: "arrête" }, { n: 3, label: "laisse" }] };
  let m = M.step(M.init(), { ev: "state", agents: [], cards: [card], pages: [] }, 0).m;
  const sel = (x) => M.view(x, 10).ask.options.map((o) => o.sel);
  eq(M.view(m, 10).ask.options.map((o) => [o.n, o.label]), [[1, "regarde"], [2, "arrête"], [3, "laisse"]]);
  eq(sel(m), [true, false, false]);
  m = M.step(m, { ev: "app_key", key: "up" }, 20).m; eq(sel(m), [true, false, false]);
  m = M.step(m, { ev: "app_key", key: "down" }, 30).m; eq(sel(m), [false, true, false]);
  m = M.step(m, { ev: "app_key", key: "down" }, 40).m; m = M.step(m, { ev: "app_key", key: "down" }, 50).m; eq(sel(m), [false, false, true]);
  eq(M.step(m, { ev: "app_key", key: "enter", local: true }, 60).cmds, [{ cmd: "answer", card: "q", reply: "3" }]);
  eq(M.step(m, { ev: "app_key", key: "2" }, 60).cmds, [{ cmd: "answer", card: "q", reply: "2" }]);
  // '… more   ⌘ ⏎' (or a click on it) shows the whole question in place
  assert.equal(M.view(m, 70).ask.full, false);
  assert.equal(M.view(M.step(m, { ev: "ui_ask_more" }, 70).m, 80).ask.full, true);
  assert.equal(W.more, "… more   ⌘ ⏎");
});
law("app_size keeps the glass while the app still hides the panel and the bar has something to show (fn held from rest), glass null only when nothing is left (ambient's sign-off regression, ed63487d)", () => {
  let m = M.step(M.init(), { ev: "app_hidden", on: true }, 0).m;
  m = M.step(m, { ev: "app_fn", state: "down", key: "fn" }, 10).m;
  const v = M.view(m, 20), s = Bar.spec(v);
  assert.equal(v.hidden, true); assert.ok(s.head);
  eq(Bar.size(68, 26, !!s.head).glass, { x: 84, y: 28, w: 700, h: 68 });
  const idle = Bar.spec(M.view(M.init(), 0));
  assert.equal(Bar.size(68, 26, !!idle.head).glass, null);
});
law("a hello long over never eats the next esc (pm's fail 47: 'fn esc later' did nothing after a hello earlier in the run)", () => {
  let m = M.step(M.init(), { ev: "app_hello" }, 0).m;
  m = M.step(m, { ev: "state", agents: [], cards: [{ id: "q", agent: "ops", text: "ship it?", options: [{ n: 1, label: "yes" }, { n: 2, label: "no" }] }], pages: [] }, 60000).m;
  assert.equal(M.view(m, 60010).state, "needs");
  const r = M.step(m, { ev: "app_key", key: "esc", local: true }, 60020).m;
  assert.notEqual(M.view(r, 60030).state, "needs");
  assert.ok(r.later && r.later.q);
});
law("B3 esc = later: the glass goes, the card keeps waiting and the count stays (ambient m_6500)", () => {
  const card = { id: "q", agent: "ops", text: "ship it?", options: [{ n: 1, label: "yes" }, { n: 2, label: "no" }] };
  const m = M.step(M.init(), { ev: "state", agents: [], cards: [card], pages: [] }, 0).m;
  assert.equal(M.view(m, 10).state, "needs");
  const r = M.step(m, { ev: "app_key", key: "esc" }, 20);
  // the last card put off leaves nothing to show: the page asks the app to hide (amb-mac m_8112)
  eq(r.cmds, [{ cmd: "app_hide" }]);
  const v = M.view(r.m, 30);
  assert.notEqual(v.state, "needs"); assert.equal(v.ask, null);
  assert.equal(M.count(r.m), M.count(m)); assert.equal(M.count(r.m), 1);
  // still in the full view's needs-you list
  assert.equal(M.view(M.step(r.m, { ev: "app_key", key: "0" }, 40).m, 50).inbox.length, 1);
});
law("done: `✓ perf is done.` with the kiss, not the report; 8 s, then the count line", () => {
  const r = run(sceneEvents("done"), [1000, 1500, 8800, 9000]);
  assert.equal(r.view(1000).glyph, "✓"); assert.equal(r.view(1000).text, "perf is done."); assert.equal(r.view(1000).pose, "kiss");
  assert.equal(r.view(1500).pose, "kiss");
  assert.equal(r.view(8800).text, "perf is done.");
  assert.equal(r.view(9000).text, null); assert.equal(r.view(9000).content.kind, "none");
});
law("failed: `▲ release failed.`, the face still, no joke, no report", () => {
  const v = run(sceneEvents("failed"), [1200]).view(1200);
  assert.equal(v.glyph, "▲"); assert.equal(v.text, "release failed."); assert.equal(v.pose, "rest"); assert.ok(v.frozen);
});
law("an error shows its one sentence with ▲", () => {
  const v = run(sceneEvents("error"), [900]).view(900);
  assert.equal(v.glyph, "▲"); assert.equal(v.text, "the mic isn't answering. nothing was sent.");
});
law("esc while main speaks: hush, the rest in text", () => {
  const r = run(sceneEvents("hush"), [], {});
  assert.ok(r.cmds.some((c) => c.cmd === "hush"));
  const evs = sceneEvents("hush"), at = evs.find(([, e]) => e.ev === "app_key")[0];
  const v = run(evs, [at + 100]).view(at + 100);
  assert.equal(v.sub, W.hush); assert.equal(v.words.lit, v.words.list.length);
});
law("tap fn while main speaks: cut_in, `main stopped. go ahead.`", () => {
  const evs = sceneEvents("cut"), at = evs.find(([, e]) => e.ev === "app_fn" && e.state === "tap")[0];
  const r = run(evs, [at + 400]);
  assert.ok(r.cmds.some((c) => c.cmd === "cut_in"));
  assert.equal(r.view(at + 400).text, W.cutIn);
});
law("a hold while main speaks cuts in too, then listens", () => {
  let m = M.init();
  m = M.step(m, { ev: "phase", phase: "speaking" }, 0).m;
  const r = M.step(m, { ev: "app_fn", state: "down" }, 10);
  eq([...r.cmds], [{ cmd: "cut_in" }]);
  assert.equal(M.view(r.m, 20).label.text, W.cutIn);
  assert.equal(M.view(r.m, 2000).label.text, W.listening);
});
law("fn + esc in a hold: talk_cancel, `cancelled. nothing sent.`", () => {
  const evs = sceneEvents("cancel"), at = evs.find(([, e]) => e.ev === "app_fn" && e.state === "cancel")[0];
  const r = run(evs, [at + 300]);
  assert.ok(r.cmds.some((c) => c.cmd === "talk_cancel"));
  const v = r.view(at + 300);
  assert.equal(v.size, "small"); assert.equal(v.text, W.cancelled);
});
law("fn fn: hands-free says so until the tap", () => {
  const r = run(sceneEvents("handsfree"), [2000, 4600]);
  assert.equal(r.view(2000).label.rest, W.handsFree); assert.equal(r.view(2000).state, "listening");
  assert.equal(r.view(4600).state, "working");
});
law("fn + 0: the agents, with their glyphs, `? needs you` for a card's agent", () => {
  const v = run(sceneEvents("agents"), [600]).view(600);
  assert.equal(v.state, "agents"); assert.equal(v.size, "open");
  const by = Object.fromEntries(v.list.map((r) => [r.name, r]));
  assert.equal(by.perf.glyph, "✓"); assert.equal(by.perf.what, "signup 4.1 s → 0.9 s", "a done agent says its done line (ambient m_5332 (6))");
  // the running ones first, the done ones after; the title says agents when not all run
  assert.ok(v.list.findIndex((r) => r.name === "perf") > v.list.findIndex((r) => r.name === "dark-mode")); assert.equal(v.titles.running, "agents");
  assert.equal(Wd.rowLabel("signup 4.1 s → 0.9 s."), "signup 4.1 s → 0.9 s", "a row is a label: no final period");
  // the menu-bar click and fn + 0: the cards first, no glass under (it would repeat)
  assert.equal(v.inbox.length, 1); assert.equal(v.inbox[0].agent, "cookies"); assert.equal(v.note, null);
  assert.equal(by["dark-mode"].glyph, "∿"); assert.equal(by["dark-mode"].age, "6m");
  assert.equal(by.cookies.glyph, "?"); assert.equal(by.cookies.what, "needs you");
  assert.equal(by.release.glyph, "…");
});
law("fn + i: the inbox, ↓ chooses, a digit answers the chosen card", () => {
  let r = run(sceneEvents("inbox"), [600]);
  assert.equal(r.view(600).inbox.length, 2);
  assert.equal(r.view(600).label.text, "2 waiting for you");
  let m = M.step(r.m, { ev: "app_key", key: "down" }, 700).m;
  // a hard confirm's options are 1 allow / 3 no: 2 does nothing, 3 answers `3`
  eq(M.step(m, { ev: "app_key", key: "2" }, 750).cmds, []);
  eq(M.view(m, 760).inbox[1].options.map((o) => o.label), ["1 allow", "3 no"]);
  const a = M.step(m, { ev: "app_key", key: "3" }, 800);
  eq(a.cmds, [{ cmd: "answer", card: "c2", reply: "3" }]);
  assert.equal(M.view(a.m, 900).inbox.length, 1);
});
law("plain-string options still count 1, 2, 3", () => {
  eq(Wd.options({ options: ["yes", "no"] }), [{ i: 0, n: 1, label: "yes" }, { i: 1, n: 2, label: "no" }]);
});
law("fn + space: the spotlight takes the keys, ⏎ sends to main and gives them back", () => {
  let m = M.init();
  let r = M.step(m, { ev: "app_key", key: "space" }, 0);
  eq([...r.cmds], [{ cmd: "app_focus", on: true }]);
  assert.equal(M.view(r.m, 10).state, "spotlight");
  r = M.step(r.m, { ev: "ui_spot_type", text: "what's perf doing?" }, 20);
  r = M.step(r.m, { ev: "ui_spot_send" }, 30);
  eq([...r.cmds], [{ cmd: "app_focus", on: false }, { cmd: "send", text: "what's perf doing?" }]);
  r = M.step(r.m, { ev: "sent", text: "what's perf doing?", voice: false, shot: true }, 40);
  eq([M.view(r.m, 50).text, M.view(r.m, 50).said.list], [null, ["what's", "perf", "doing?"]]);
});
law("the spotlight's key bar shows `tab start an agent` only with text; tab asks main to start one", () => {
  let r = M.step(M.init(), { ev: "app_key", key: "space" }, 0);
  eq(M.view(r.m, 1).spot.keys, [["⏎", "send to bise"], ["esc", "close"]]);
  r = M.step(r.m, { ev: "ui_spot_type", text: "a csv importer" }, 2);
  eq(M.view(r.m, 3).spot.keys, [["⏎", "send to bise"], ["tab", "start an agent"], ["esc", "close"]]);
  r = M.step(r.m, { ev: "ui_spot_tab" }, 4);
  // amb-core e00ad291: tab is its own cmd start (⌘⏎ / ⏎ stays send)
  eq(r.cmds, [{ cmd: "app_focus", on: false }, { cmd: "start", text: "a csv importer" }]);
});

// ---- round 9's bar (ambient's identity9.html#spec): bar.js turns every view into the same blocks
law("round 9: a pushed question is one bar: '? main needs you · now', '⌘ ⏎ full text', the text clamped at 4 lines, rows with keycaps (the first selected), fn chords in the footer until he clicks it", () => {
  const card = { id: "q", agent: "main", label: "? main needs you", text: "Que fais-tu ?", options: [{ n: 1, label: "regarde" }, { n: 2, label: "arrête" }, { n: 3, label: "laisse" }] };
  let m = M.step(M.init(), { ev: "state", agents: [], cards: [card], pages: [] }, 0).m;
  let s = Bar.spec(M.view(m, 10));
  eq([s.head.h, s.head.lab, s.head.right.keys, s.head.right.w], [52, { acc: "? bise needs you", rest: "now" }, ["⌘", "⏎"], "full text"]);
  eq(s.text, { s: "Que fais-tu ?", clamp: 4, full: false, act: { ev: "ui_ask_more" } });   // the body takes a click (pm's fail 45)
  eq(s.sections[0].rows.map((r) => [r.g, r.gk, r.t, !!r.sel]), [["1", true, "regarde", true], ["2", true, "arrête", false], ["3", true, "laisse", false]]);
  eq(s.sections[0].rows[1].act, { ev: "ui_option", card: "q", i: 1 });
  const flat = (it) => [it.pre || "", ...it.keys, it.w || ""].join(" ").trim();
  eq(s.foot.left.map(flat), ["fn 1 – 3 pick", "fn ⏎ open in bise", "fn esc later"]);
  // a range is info, not a target: the rows are (ambient m_6681 (2)); esc later is a key
  eq(s.foot.left.map((i) => !!i.act), [false, true, true]);   // fn ⏎ opens it in bise (desktop S8)
  eq(s.foot.right.map(flat), ["or hold fn and say it"]);
  // clicked (the panel has the keys): the plain keys
  m = M.step(m, { ev: "app_focused", on: true }, 20).m;
  eq(Bar.spec(M.view(m, 30)).foot.left.map(flat), ["1 – 3 pick", "↑ ↓ move", "esc later"]);
  // ⌘ ⏎: the full text, the hint goes
  s = Bar.spec(M.view(M.step(m, { ev: "ui_ask_more" }, 40).m, 50));
  eq([s.text.full, s.head.right], [true, null]);
  // without a label (an agent's card): '? cookies needs you'
  assert.equal(Bar.spec(run(sceneEvents("needs-wait"), [1000]).view(1000)).head.lab.acc, "? cookies needs you");
});
law("round 9: drafts are a pushed card too: '? 3 drafts wait for you · your inbox', the big line, '1 review' and '2 send all 3' with their subs", () => {
  const v = run(sceneEvents("drafts"), [1000]).view(1000);
  const s = Bar.spec(v);
  eq([s.head.lab, s.big, s.text], [{ acc: "? 3 drafts wait for you", rest: "your inbox" }, "replies to legal, Lucas and Marc", null]);
  eq(s.sections[0].rows.map((r) => [r.g, r.t, r.sub]), [["1", "review", W.bar.reviewSub], ["2", "send all 3", W.bar.sendSub]]);
});
law("round 9: every state draws as a bar with a header and a footer whose items are keys (a chord is caps side by side, never a '+'); every row and every hint a click can reach acts", () => {
  const seen = new Set();
  for (const sc of Fake.SCENES) {
    const evs = sceneEvents(sc.id);
    const end = Math.max(...evs.map(([t]) => t)) + 200;
    const ts = Array.from({ length: 30 }, (_, i) => Math.round((end * i) / 29));
    const r = run(evs, ts);
    for (const t of ts) {
      const v = r.view(t), s = Bar.spec(v);
      seen.add(v.state);
      if (v.state === "idle") { assert.equal(s.head, null, `${sc.id}@${t}`); continue; }
      if (!s.head) { assert.equal(v.text, null, `${sc.id}@${t} ${v.state}`); continue; }
      assert.ok([52, 68].includes(s.head.h), `${sc.id}@${t}`);
      const items = s.foot ? [...s.foot.left, ...s.foot.right] : [];
      for (const it of items) for (const k of it.keys) assert.ok(!k.includes("+"), `${sc.id}: '${k}'`);
      for (const sec of s.sections) for (const row of sec.rows) assert.ok(row.act || row.fixed || !row.sel || v.state === "spotlight", `${sc.id}: row ${row.t}`);
    }
  }
  for (const st of ["needs", "listening", "agents", "inbox", "settings", "spotlight", "hello", "perm"]) assert.ok(seen.has(st), st);
});
law("round 9: the panel's box holds the pearl's 76 px canvas at the glass's left (x -82) and the drawn shadow; app_size says the glass inside it", () => {
  const msg = Bar.size(200, 26);
  eq(msg, { cmd: "app_size", w: 844, h: 320, radius: 26, glass: { x: 84, y: 28, w: 700, h: 200 } });
  assert.ok(msg.glass.x - 82 >= 0);                   // the pearl's canvas fits in the box
  assert.ok(msg.h - msg.glass.y - msg.glass.h >= 86);   // 0 30 80 -24: 86 px of shadow below
});
law("round 9 slice 2: ↑↓ move over every row of an open bar (n from the page, clamped), the cards first so a card row is also m.sel; ⏎ runs the selected row; ⌘ 1-9 finds that page", () => {
  // the fn i scene (two cards), its model built by hand (run keeps views only)
  let m = M.init(); for (const [t, ev] of sceneEvents("inbox")) m = M.step(m, ev, t).m;
  let s = Bar.spec(M.view(m, 9000));
  const n = Bar.selectable(s).length;
  assert.equal(n, 2);
  eq(Bar.selRow(s).act.ev, "ui_card");                       // the first card
  m = M.step(m, { ev: "app_key", key: "down", local: true, n }, 9001).m;
  s = Bar.spec(M.view(m, 9002));
  assert.equal(Bar.selectable(s).indexOf(Bar.selRow(s)), 1);
  for (let i = 0; i < n + 3; i++) m = M.step(m, { ev: "app_key", key: "down", local: true, n }, 9003 + i).m;
  s = Bar.spec(M.view(m, 9100));
  assert.equal(Bar.selectable(s).indexOf(Bar.selRow(s)), n - 1);   // clamped at the last row
  // a pane opened again starts at the top
  assert.equal(m.sel, 1);                                     // the card row is the card 1-9 answer
  m = M.step(M.step(m, { ev: "app_key", key: "esc" }, 9200).m, { ev: "app_key", key: "0" }, 9300).m;
  assert.equal(M.view(m, 9400).rowSel, 0);
});
law("round 9 (lead m_6613, pm's fail 44): a drafts card opened from fn i comes up as its own bar and never loses 'send all': 1 review, 2 send all 3, esc later; its big line takes a click (review)", () => {
  const evs = sceneEvents("drafts");
  let m = M.init(); for (const [t, ev] of evs) m = M.step(m, ev, t).m;
  m = M.step(m, { ev: "app_key", key: "esc", local: true }, 2000).m;          // put off: into the count
  assert.notEqual(M.view(m, 2100).state, "needs");
  m = M.step(m, { ev: "app_key", key: "i" }, 2200).m;
  const row = Bar.selRow(Bar.spec(M.view(m, 2300)));
  eq(row.act, { ev: "ui_card", card: "b1" });
  m = M.step(m, row.act, 2400).m;
  const s = Bar.spec(M.view(m, 2500));
  eq([s.kind, s.sections[0].rows.map((r) => `${r.g} ${r.t}`)], ["needs", ["1 review", "2 send all 3"]]);
  eq(s.bigAct, { ev: "ui_option", card: "b1", i: 0 });
  // drafts to send are an approval: words never send them, so 'pick 1 or 2', no 'or hold fn' (ambient m_8772)
  eq(s.foot.right.map((i) => i.w), ["pick 1 or 2"]);
  assert.ok(s.foot.left.some((i) => i.w === W.bar.later));
});

law("a card says its kind (ambient m_8772, lead m_8776): a question is answered by voice ('answering checkout · …', '✓ answered: <words>'); an approval says 'pick 1 or 2', and a held fn on it sends his words to its agent as a message, never an answer, the card stays", () => {
  const q = { id: "q1", kind: "question", agent: "checkout", text: "which date works?", options: [{ n: 1, label: "monday" }, { n: 2, label: "friday" }] };
  const a = { id: "a1", kind: "merge", agent: "checkout", text: "merge sb/checkout into main?", options: [{ n: 1, label: "merge" }, { n: 2, label: "not now" }] };
  const talk = (card, words) => {
    let m = M.step(M.init(), { ev: "state", agents: [{ name: "checkout", status: "waiting" }], cards: [card], pages: [] }, 0).m;
    m = M.step(m, { ev: "app_fn", state: "down", key: "fn" }, 100).m;
    m = M.step(m, { ev: "heard", text: words, final: true }, 200).m;
    return { during: M.view(m, 300), r: M.step(m, { ev: "app_fn", state: "up", key: "fn" }, 400) };
  };
  // the glass: a question keeps 'or hold fn and say it'; an approval says 'pick 1 or 2'
  const glass = (card) => Bar.spec(M.view(M.step(M.init(), { ev: "state", agents: [], cards: [card], pages: [] }, 0).m, 10)).foot.right.map((i) => i.w);
  eq([glass(q), glass(a), glass({ ...a, kind: "confirm" })], [[W.bar.sayIt], ["pick 1 or 2"], ["pick 1 or 2"]]);
  // a question: the label says whom he answers; his words are the answer, '✓ answered: friday please'
  const tq = talk(q, "friday please");
  eq(tq.during.label.text, "answering checkout · which date works?");
  eq(tq.r.cmds, [{ cmd: "answer", card: "q1", reply: "friday please" }]);
  eq([M.view(tq.r.m, 500).text, M.view(tq.r.m, 500).glyph], ["answered: friday please", "✓"]);
  // an approval: 'to checkout · the merge waits for 1 or 2'; 'merge it' goes to checkout as a message, the card stays
  const ta = talk(a, "merge it");
  eq(ta.during.label.text, "to checkout · the merge waits for 1 or 2");
  eq(ta.r.cmds, [{ cmd: "agent_send", agent: "checkout", text: "merge it", mode: "now" }]);
  eq([M.view(ta.r.m, 500).glyph, M.view(ta.r.m, 500).text], ["✉", "sent to checkout as a message   the merge still waits for 1 or 2"]);
  eq(M.view(ta.r.m, 10000).ask.id, "a1");
  // the nouns (ambient m_8793): a confirm names what it runs, else 'the approval'; drafts wait (plural); a trial
  const to = (c) => talk({ ...a, ...c }, "x").during.label.text;
  eq([to({ kind: "confirm", text: "run `rm -rf target`?" }), to({ kind: "confirm", text: "publish the weekly update?" }), to({ kind: "confirm", text: "ok?" }),
    to({ kind: "feature_try" }), to({ kind: "question", batch: { count: 2 }, page: { id: "p", drafts: true } })],
  ["to checkout · the delete waits for 1 or 2", "to checkout · the publish waits for 1 or 2", "to checkout · the approval waits for 1 or 2",
    "to checkout · the trial waits for 1 or 2", "to checkout · the drafts wait for 1 or 2"]);
  // the spotlight's card rows: the kind by the glyph alone (? question, ! approval in the accent, ✉ drafts, faint)
  const cards = [q, a, { ...a, id: "d1", kind: "question", page: { id: "p", drafts: true }, batch: { count: 2 } }];
  const sp = M.step(M.step(M.init(), { ev: "state", agents: [], cards, pages: [] }, 0).m, { ev: "app_key", key: "space" }, 10).m;
  eq(Bar.spec(M.view(sp, 20)).sections[0].rows.map((r) => [r.g, r.gc, r.sub]), [["?", "a", "which date works?"], ["!", "a", "merge sb/checkout into main?"], ["✉", null, "merge sb/checkout into main?"]]);
  // main's approval: bise's usual send (main reads it), never an answer
  const tm = talk({ ...a, agent: "main" }, "merge it");
  eq([tm.during.label.text, tm.r.cmds.some((c) => c.cmd === "answer")], ["to bise · the merge waits for 1 or 2", false]);
  // fn 2 still picks it
  eq(M.step(talk(a, "").r.m, { ev: "app_key", key: "2" }, 600).cmds, [{ cmd: "answer", card: "a1", reply: "2" }]);
});
law("round 9 slice 2: fn p, your pages: 'new for you' then 'seen' (dim), ⌘ 1-9 on the rows, ⏎ opens the page and closes the bar", () => {
  let m = M.init(); for (const [t, ev] of sceneEvents("your-pages")) m = M.step(m, ev, t).m;
  const v = M.view(m, 1000, Date.now());
  assert.equal(v.state, "pages"); eq(v.content, { kind: "open" });
  const s = Bar.spec(v);
  eq(s.sections.map((x) => [x.label, x.rows.map((r) => r.t)]), [["new for you", ["weekly update", "launch thread on HN"]], ["seen", ["which gray wins?"]]]);
  assert.ok(s.sections[1].rows[0].seen);
  eq(Bar.cmdRow(s, 2).act, { ev: "ui_page", page: "hn-watch" });
  assert.ok(/^watching/.test(s.sections[0].rows[1].sub));
  const r = M.step(m, Bar.selRow(s).act, 1100);
  eq(r.cmds.map((c) => c.cmd), ["app_open_url"]); assert.equal(r.m.pane, null);
});
law("round 9 slice 2: can't reach bise: a type not answered with 'sent' in 3 s; rows try again (⏎), start bise in a terminal (⌘ ⏎), copy what you said (⌘ C); esc closes and keeps the words; the hub back sends them; 'sent' after it says '✓ bise is back · …'", () => {
  let m = M.init(); for (const [t, ev] of sceneEvents("offline")) m = M.step(m, ev, t).m;
  assert.notEqual(M.view(m, 3000).state, "offline");
  const v = M.view(m, 3800);
  eq([v.state, v.content.kind], ["offline", "open"]);
  const s = Bar.spec(v);
  eq([s.head.line.glyph, s.head.line.text, s.head.right.text], ["▲", "can't reach bise.", "your words are kept"]);
  eq(s.sections[0].rows.map((r) => [r.t, r.right.keys.join(" "), r.act.ev]), [["try again", "⏎", "ui_retry"], ["start bise in a terminal", "⌘ ⏎", "ui_terminal"], ["copy what you said", "⌘ C", "ui_copy"]]);
  eq(M.step(m, { ev: "ui_retry" }, 3900).cmds, [{ cmd: "send", text: "dark mode for the settings page" }]);
  eq(M.step(m, { ev: "ui_terminal" }, 3900).cmds, [{ cmd: "app_run_bise" }]);
  const closed = M.step(m, { ev: "app_key", key: "esc", local: true }, 3900).m;
  assert.notEqual(M.view(closed, 4000).state, "offline");
  eq(M.step(M.step(closed, { ev: "hub", up: false }, 4100).m, { ev: "hub", up: true }, 4200).cmds, [{ cmd: "send", text: "dark mode for the settings page" }]);
  const back = M.step(m, { ev: "sent", voice: false }, 5000).m;
  const bv = M.view(back, 5010);
  eq([bv.glyph, bv.text, back.pending], ["✓", "bise is back · your words went to main", null]);
});
law("round 9 gate fixes (ambient m_6607): the listening hint says 'bise sees' once; '↑↓ move' and '⌘ 1–9' are info, not targets; the answer's footer has ⌘ C copy", () => {
  let m = M.step(M.init(), { ev: "app_fn", state: "down", key: "fn" }, 0).m;
  m = M.step(m, { ev: "app_shot", app: "Chrome", title: "localhost:4801/settings" }, 10).m;
  const right = Bar.spec(M.view(m, 20)).head.right.text;
  assert.equal(right, "bise sees Chrome · localhost:4801/settings");
  for (const id of ["agents", "inbox", "settings", "your-pages"]) {
    let x = M.init(); for (const [t, ev] of sceneEvents(id)) x = M.step(x, ev, t).m;
    const f = Bar.spec(M.view(x, 9000, Date.now())).foot;
    for (const it of [...f.left, ...f.right]) if (it.keys[0] === "↑" || (it.keys[0] === "⌘" && it.keys.includes("–"))) assert.equal(it.act, undefined, `${id}: ${it.keys.join(" ")}`);
  }
  const t = run(sceneEvents("talk"), [8000]);
  const evs = sceneEvents("talk"); const done = evs.find(([, e]) => e.ev === "phase" && e.phase === "done")[0];
  const sv = Bar.spec(run(evs, [done + 300]).view(done + 300));
  eq(sv.foot.left.map((i) => [i.keys.join(" "), i.w, i.act.ev]), [["⌘ C", "copy", "ui_copy"]]);
});
law("round 9: settings rows are switches (white, never pink: the switch is the row's right), 'windows bise never sees' with 'private browser windows · always' not selectable, each app with ⌫, '+ add an app'", () => {
  let m = M.step(M.init(), { ev: "app_settings", edge_glow: true, sounds: true, skip: [{ bundle: "com.1password", name: "1Password" }] }, 0).m;
  m = M.step(m, { ev: "app_key", key: "," }, 10).m;
  const s = Bar.spec(M.view(m, 20));
  assert.ok(s.sections[0].rows.every((r) => r.right && "sw" in r.right && r.act.ev === "ui_setting"));
  eq(s.sections[1].label, "windows bise never sees");
  const rows = s.sections[1].rows;
  eq([rows[0].t, rows[0].sub, !!rows[0].fixed], ["private browser windows", "always", true]);
  eq(rows.filter((r) => r.right && r.right.keys).map((r) => [r.t, r.right.keys, r.act.value]), [["1Password", ["⌫"], "com.1password"]]);
  eq(rows[rows.length - 1].act, { ev: "ui_setting", key: "skip_add" });
});
law("the words ambient and designer signed (m_4645, m_4648)", () => {
  assert.equal(W.hubDown, "can't reach bise. trying again.");
  assert.equal(Wd.permDenied("mic"), "without the mic, bise can't hear you. turn it on in System Settings › Privacy & Security › Microphone.");
  assert.ok(Wd.permDenied("screen", 15).endsWith("› Screen & System Audio Recording."));
  assert.ok(Wd.permDenied("screen", 14).endsWith("› Screen Recording."));
  assert.equal(Wd.waiting(1), "1 waiting for you");
});
law("typed: main answers in text, whole, no voice", () => {
  const evs = sceneEvents("typed");
  const r = run(evs, [4650, 5000]);
  const v = r.view(5000);
  assert.equal(v.state, "end"); assert.equal(v.words.lit, v.words.list.length);
});
law("a level older than 250 ms is silence", () => {
  let m = M.init();
  m = M.step(m, { ev: "app_fn", state: "down" }, 0).m;
  m = M.step(m, { ev: "level", who: "you", v: 0.8 }, 100).m;
  assert.equal(M.view(m, 200).lvl, 0.8);
  assert.equal(M.view(m, 400).lvl, 0);
});
law("main's own turns keep the capsule small, the * turning", () => {
  let m = M.step(M.init(), { ev: "phase", phase: "working" }, 0).m;
  const v = M.view(m, 10);
  assert.equal(v.size, "small"); assert.equal(v.pose, "think");
});
law("fn + . : the line, then app_hide 1.5 s later", () => {
  const r = M.step(M.init(), { ev: "app_key", key: "." }, 0);
  assert.equal(M.view(r.m, 10).text, W.hidden); assert.equal(M.view(r.m, 10).sub, W.showAgain);
  eq([...r.cmds], [{ cmd: "app_hide", delay: 1500 }]);
});
law("a permission: its sentence and continue; continue goes to the app", () => {
  let r = M.step(M.init(), { ev: "app_perm", perm: "accessibility", state: "ask" }, 0);
  assert.equal(M.view(r.m, 10).perm.text, W.perm.accessibility);
  r = M.step(r.m, { ev: "ui_perm", perm: "accessibility", do: "continue" }, 20);
  eq([...r.cmds], [{ cmd: "app_perm", perm: "accessibility", do: "continue" }]);
  r = M.step(M.init(), { ev: "app_perm", perm: "accessibility", state: "denied" }, 0);
  assert.equal(M.view(r.m, 10).text, W.permDenied.accessibility);
});
law("a permission ask is alone in the capsule: no agent line under it (ambient, m_4671)", () => {
  let m = M.step(M.init(), { ev: "state", agents: Fake.AGENTS, cards: [] }, 0).m;
  m = M.step(m, { ev: "app_perm", perm: "accessibility", state: "ask" }, 10).m;
  m = M.step(m, { ev: "state", agents: Fake.AGENTS.map((a) => a.name === "perf" ? { ...a, status: "done", report: "Both fixes are on `ambient-app` as 4d74d7d." } : a), cards: [] }, 20).m;
  const v = M.view(m, 30);
  assert.equal(v.state, "perm"); assert.equal(v.sub, null); assert.equal(v.text, null); assert.equal(v.words, null);
  // once the ask is answered, the line shows, without the report
  m = M.step(m, { ev: "ui_perm", perm: "accessibility", do: "not_now" }, 40).m;
  assert.equal(M.view(m, 50).text, "perf is done.");
});
law("every refusal shows with the way back (the user's rule via amb-mac m_6932, ambient m_6936): each app_perm denied flashes its line, even an old one; the path on its own line; ⏎ open System Settings sends app_perm settings and the line leaves; esc closes it", () => {
  let m = M.step(M.init(), { ev: "app_perm", perm: "mic", state: "denied" }, 0).m;
  m = M.step(m, { ev: "app_key", key: "esc" }, 10).m;
  assert.equal(M.view(m, 20).text, null);                                  // esc closed it
  m = M.step(m, { ev: "app_perm", perm: "mic", state: "denied" }, 30).m;   // the next fn hold: again
  const v = M.view(m, 40);
  eq([v.text, v.denied, v.content.kind], [W.permDenied.mic, "mic", "line"]);
  const s = Bar.spec(v);
  eq([s.head.line.text, s.head.line.glyph, s.text], ["without the mic, bise can't hear you.", "▲", { s: "turn it on in System Settings › Privacy & Security › Microphone.", path: true }]);
  eq(s.foot.left.map((i) => [i.keys, i.w, i.act]), [[["⏎"], "open System Settings", { ev: "ui_perm", perm: "mic", do: "settings" }]]);
  eq(s.foot.right.map((i) => i.w), ["close"]);
  const r = M.step(m, { ev: "app_key", key: "enter" }, 50);
  eq(r.cmds, [{ cmd: "app_perm", perm: "mic", do: "settings" }]);
  assert.equal(M.view(r.m, 60).text, null);
  // a click on the hint does the same
  eq(M.step(m, s.foot.left[0].act, 50).cmds, [{ cmd: "app_perm", perm: "mic", do: "settings" }]);
  // the two new ones: the emoji picker on fn, and refused banners
  for (const perm of ["globe", "notifications", "accessibility", "screen"]) {
    const sp = Bar.spec(M.view(M.step(M.init(), { ev: "app_perm", perm, state: "denied" }, 0).m, 10));
    assert.ok(sp.text.s.includes("System Settings ›"), perm);
    assert.ok(!sp.head.line.text.includes("›"), perm);                    // the path never on the first line
  }
  assert.equal(Bar.spec(M.view(M.step(M.init(), { ev: "app_perm", perm: "globe", state: "denied" }, 0).m, 10)).text.s, "set System Settings › Keyboard › Press 🌐 key to › Do Nothing.");
});
law("not now: the refused path, sent to the app", () => {
  let r = M.step(M.init(), { ev: "app_perm", perm: "mic", state: "ask" }, 0);
  assert.equal(M.view(r.m, 5).content.kind, "open");                 // the ask waits for him
  r = M.step(r.m, { ev: "ui_perm", perm: "mic", do: "not_now" }, 10);
  eq(r.cmds, [{ cmd: "app_perm", perm: "mic", do: "not_now" }]);
  // its refused line is a timed line (8 s), never a pinned pane (amb-mac m_5679)
  const d = M.view(M.step(M.init(), { ev: "app_perm", perm: "accessibility", state: "denied" }, 0).m, 10);
  eq([d.text, d.content.kind], [W.permDenied.accessibility, "line"]);
  assert.equal(M.view(r.m, 20).perm, null);
  r = M.step(r.m, { ev: "app_perm", perm: "mic", state: "denied" }, 30);
  assert.equal(M.view(r.m, 40).text, W.permDenied.mic);
});
law("at launch the capsule shows the status line, never main's last reply", () => {
  let m = M.init();
  for (const [, ev] of sceneEvents("idle")) m = M.step(m, ev, 0).m;
  m = M.step(m, { ev: "main", text: "amb-web is done: **both** fixes", turn: 41 }, 10).m;
  m = M.step(m, { ev: "phase", phase: "done" }, 20).m;
  const v = M.view(m, 30);
  assert.equal(v.size, "small"); assert.equal(v.text, null); assert.equal(v.words, null);
});
law("main's markdown: marks stripped, `code` flagged, one token per raw word (word.i stays right), 3 lines", () => {
  const t = Wd.mdWords("**done**: the fix is in `apps/ambient/web/ui.js` now. - next: run `node check.mjs` and see [the page](http://x).");
  eq(t.map((x) => x.w), ["done:", "the", "fix", "is", "in", "apps/ambient/web/ui.js", "now.", "", "next:", "run", "node", "check.mjs", "and", "see", "[the", "page](http://x)."]);
  eq(t.filter((x) => x.code).map((x) => x.w), ["apps/ambient/web/ui.js", "node", "check.mjs"]);
  let m = M.init();
  m = M.step(m, { ev: "sent", text: "x", voice: true, shot: false }, 0).m;
  m = M.step(m, { ev: "main", text: "the `fix` is in", turn: 1 }, 10).m;
  m = M.step(m, { ev: "phase", phase: "speaking" }, 20).m;
  m = M.step(m, { ev: "word", turn: 1, i: 1 }, 30).m;
  const v = M.view(m, 40);
  eq(v.words.list, ["the", "fix", "is", "in"]); eq(v.words.code, [false, true, false, false]);
  assert.equal(v.words.lit, 2); assert.equal(v.words.clamp, 3);
});
law("the corners follow macOS's window radius (app_settings.radius), 16 until it comes", () => {
  assert.equal(M.view(M.init(), 0).radius, 16);
  const m = M.step(M.init(), { ev: "app_settings", edge_glow: true, macos: 26, radius: 26 }, 0).m;
  assert.equal(M.view(m, 1).radius, 26);
  assert.equal(M.view(M.step(m, { ev: "app_settings", edge_glow: false }, 2).m, 3).radius, 26);
});
law("the hub lost: one line, then back", () => {
  const r = run(sceneEvents("hub"), [1000, 5500]);
  assert.equal(r.view(1000).text, W.hubDown); assert.equal(r.view(5500).text, null);
});
law("reduced motion: every state is still (the pixel smile), no edge glow", () => {
  const s = sweep("still");
  for (const t of s.at) assert.ok(s.views[t].still && !s.views[t].edge.on, String(t));
});
law("unknown events and junk change nothing", () => {
  const m = M.init();
  for (const ev of [null, {}, { ev: "nope" }, { ev: "word", turn: 3, i: 2 }]) M.view(M.step(m, ev, 0).m, 1);
});

// ---- v2: pages for you in the capsule
law("a page ready: `weekly update is ready   fn o`; fn + o opens it (app_open_url); fn + 0 lists for you", () => {
  const evs = sceneEvents("pages");
  const t0 = evs.find(([, e]) => e.ev === "page")[1].at_ms;
  let m = M.init();
  for (const [t, ev] of evs.filter(([t]) => t < 3500)) m = M.step(m, ev, t).m;
  const v = M.view(m, 1000, t0 + 1000);
  assert.equal(v.text, "weekly update is ready   fn o");
  const o = M.step(m, { ev: "app_key", key: "o" }, 3500);
  eq(o.cmds, [{ cmd: "app_open_url", url: "http://127.0.0.1:47123/p/weekly-update", page: "weekly-update" }]);
  const a = M.view(M.step(o.m, { ev: "app_key", key: "0" }, 5000).m, 5000, t0 + 5000);
  // unopened first: weekly update was just opened by fn + o, so the grays come first
  eq(a.forYou.pages.map((p) => [p.name, p.meta, p.unopened, p.watch]), [["launch thread on HN", "v4 · 2 new versions", true, "watching · checked 3 min ago"], ["which gray wins?", "new", true, null], ["weekly update", "v1 · just now", false, null]]);
  // a click in for you opens that page
  eq(M.step(o.m, { ev: "ui_page", page: "grays" }, 6000).cmds, [{ cmd: "app_open_url", url: "http://127.0.0.1:47123/p/grays", page: "grays" }]);
});
law("a page updating, then its next version ready, says ready again; a page opened in front says nothing", () => {
  let m = M.step(M.init(), { ev: "state", agents: [], cards: [], pages: [] }, 0).m;
  m = M.step(m, { ev: "page", id: "wu", title: "weekly update", version: 1, url: "u", at_ms: 1, state: "ready", front: true }, 10).m;
  assert.equal(M.view(m, 20).text, null);
  m = M.step(m, { ev: "page", id: "wu", version: 1, state: "updating", at_ms: 2 }, 30).m;
  assert.equal(M.view(m, 40, 50).text, null);
  m = M.step(m, { ev: "page", id: "wu", version: 2, state: "ready", at_ms: 3 }, 50).m;
  assert.equal(M.view(m, 60).text, "weekly update is ready   fn o");
  eq(M.step(M.init(), { ev: "app_key", key: "o" }, 0).cmds, []);   // no page: nothing
});
law("in a call or a meeting (app_quiet), only urgent cards ask; the rest wait in the inbox; off, they ask again", () => {
  const cards = [{ id: "c1", agent: "cookies", text: "keep the banner?", options: ["yes", "no"] }, { id: "c2", agent: "deploy", text: "ship it now?", options: ["yes", "no"], urgent: true }];
  let m = M.step(M.init(), { ev: "state", agents: [], cards, pages: [] }, 0).m;
  m = M.step(m, { ev: "app_quiet", on: true, why: "meeting" }, 10).m;
  let v = M.view(m, 20);
  assert.equal(v.state, "needs"); assert.equal(v.ask.agent, "deploy"); assert.equal(v.ask.more, 0);
  m = M.step(m, { ev: "state", agents: [], cards: [cards[0]], pages: [] }, 30).m;
  v = M.view(m, 40);
  assert.equal(v.state, "idle"); assert.equal(v.ask, null); assert.equal(v.need, false);
  assert.equal(M.view(M.step(m, { ev: "app_key", key: "i" }, 50).m, 60).inbox.length, 1);   // still in the inbox
  m = M.step(m, { ev: "app_quiet", on: false, why: "" }, 70).m;
  assert.equal(M.view(m, 80).ask.agent, "cookies");
});
law("a card clicked in the menu bar (app_key i + card) opens the inbox at that card", () => {
  const cards = ["a", "b", "c"].map((id) => ({ id, agent: id, text: id, options: ["yes", "no"] }));
  let m = M.step(M.init(), { ev: "state", agents: [], cards, pages: [] }, 0).m;
  const r = M.step(m, { ev: "app_key", key: "i", card: "c" }, 10);
  const v = M.view(r.m, 20);
  assert.equal(v.state, "inbox"); eq(v.inbox.map((c) => c.sel), [false, false, true]);
  // again while open: it stays open (a click never closes it)
  assert.equal(M.view(M.step(r.m, { ev: "app_key", key: "i", card: "a" }, 30).m, 40).state, "inbox");
});
law("a card asked from a page (card.page): the glass says `fn o open it`; fn + o or a click opens the page at the question (⏎ picks the selected row since B3)", () => {
  const card = { id: "c1", agent: "launch-recap", text: "post now or wait?", options: ["post now", "wait"], page: { id: "recap", block: "q1", url: "http://127.0.0.1:47123/p/recap#q1" } };
  let m = M.step(M.init(), { ev: "state", agents: [], cards: [card, { id: "c2", agent: "x", text: "y", options: [] }], pages: [] }, 0).m;
  assert.equal(M.view(m, 10).ask.open, "fn o open it");
  const open = [{ cmd: "app_open_url", url: "http://127.0.0.1:47123/p/recap#q1", page: "recap" }];
  eq(M.step(m, { ev: "app_key", key: "o" }, 20).cmds, open);
  eq(M.step(m, { ev: "app_key", key: "enter", local: true }, 20).cmds, [{ cmd: "answer", card: "c1", reply: "1" }]);
  eq(M.step(m, { ev: "ui_open_card", card: "c1" }, 20).cmds, open);
  // no page: fn ⏎ opens it in bise's window, on the thread it waits in (desktop S8)
  eq(M.step(m, { ev: "ui_open_card", card: "c2" }, 20).cmds, [{ cmd: "app_window", route: "agent/home/x" }]);
});
law("out of the way (§8): what the capsule has to show, for the app's policy: talk, type, got, answer, needs, open, line, none", () => {
  assert.equal(run(sceneEvents("idle"), [100]).view(100).content.kind, "none");
  const needs = run(sceneEvents("needs-wait"), [1000]).view(1000).content;
  eq(needs, { kind: "needs", card: needs.card }); assert.ok(needs.card);
  let m = M.step(M.init(), { ev: "state", agents: [], cards: [], pages: [] }, 0).m;
  assert.equal(M.view(M.step(m, { ev: "app_fn", state: "down", key: "fn" }, 10).m, 20).content.kind, "talk");
  assert.equal(M.view(M.step(m, { ev: "app_key", key: "space" }, 10).m, 20).content.kind, "type");
  assert.equal(M.view(M.step(m, { ev: "app_key", key: "0" }, 10).m, 20).content.kind, "open");
  let s = M.step(m, { ev: "app_fn", state: "down", key: "fn" }, 10).m;
  s = M.step(M.step(s, { ev: "app_fn", state: "up", key: "fn" }, 15).m, { ev: "sent", voice: false }, 20).m;
  s = M.step(s, { ev: "phase", phase: "sending" }, 30).m;
  assert.equal(M.view(s, 40).content.kind, "got");
  s = M.step(M.step(s, { ev: "main", text: "done: the login test waits now.", turn: 1 }, 50).m, { ev: "phase", phase: "done" }, 60).m;
  assert.equal(M.view(s, 70).content.kind, "answer");
  // SPEC §0: never for done, failed, a page ready (the marble carries them); a key's answer is a line
  assert.equal(M.view(M.step(m, { ev: "page", id: "wu", title: "weekly update", version: 1, url: "u", at_ms: 1, state: "ready" }, 10).m, 20).content.kind, "none");
  assert.equal(run(sceneEvents("done"), [1000]).view(1000).content.kind, "none");
  assert.equal(run(sceneEvents("failed"), [1200]).view(1200).content.kind, "none");
  assert.equal(M.view(M.step(m, { ev: "app_fn", state: "cancel" }, 10).m, 20).content.kind, "line");
});
law("out of the way (§8): hidden (app_hidden on) closes an open pane and the spotlight's focus; app_visible false stops the orb's frames", () => {
  let m = M.step(M.init(), { ev: "state", agents: [], cards: [], pages: [] }, 0).m;
  m = M.step(m, { ev: "app_key", key: "space" }, 10).m;
  const r = M.step(m, { ev: "app_hidden", on: true }, 20);
  assert.equal(r.m.pane, null); eq(r.cmds, [{ cmd: "app_focus", on: false }]);
  assert.equal(M.view(r.m, 30).unseen, true);
  m = M.step(M.step(m, { ev: "app_hidden", on: false }, 40).m, { ev: "app_visible", on: false }, 50).m;
  assert.equal(M.view(m, 60).unseen, true);
  assert.equal(M.view(M.step(m, { ev: "app_visible", on: true }, 70).m, 80).unseen, false);
});
law("the full view (fn 0, a hand-open): running (agents + pages being written), needs you (1-9 answer), for you (unopened first, then newest; fn o opens the first); esc closes", () => {
  const agents = [{ name: "perf", status: "working", note: "signup 4.1 s → 0.9 s" }, { name: "docs", status: "done", note: "readme" }];
  const cards = [{ id: "c1", agent: "perf", text: "ship it?", options: ["yes", "no"] }];
  const pages = [
    { id: "a", title: "launch recap", version: 3, state: "ready", url: "ua", at_ms: 300 },
    { id: "b", title: "the grays", version: 1, state: "ready", url: "ub", at_ms: 200, opened_version: 1 },
    { id: "c", title: "weekly update", version: 1, state: "writing", url: "uc", at_ms: 400 },
    { id: "d", title: "inbox", version: 2, state: "updating", url: "ud", at_ms: 100 },
  ];
  let m = M.step(M.init(), { ev: "state", agents, cards, pages }, 0).m;
  m = M.step(m, { ev: "app_key", key: "0" }, 10).m;
  const v = M.view(m, 20, 1000);
  assert.equal(v.state, "agents"); assert.equal(v.content.kind, "open");
  eq(v.titles, { running: "agents", needs: "1 waiting for you" });   // docs is done: not all of them run
  eq(v.list.map((r) => [r.name, r.what]), [["perf", "needs you"], ["docs", "readme"], ["weekly update", "writing…"], ["inbox", "updating…"]]);
  eq(v.inbox.map((c) => c.id), ["c1"]);
  // a page being written is not for you yet; unopened first (b was opened at its version)
  eq(v.forYou.pages.map((p) => [p.id, p.unopened]), [["a", true], ["d", true], ["b", false]]);
  // fn o opens the first, which then counts as opened
  const o = M.step(m, { ev: "app_key", key: "o" }, 30);
  eq(o.cmds, [{ cmd: "app_open_url", url: "ua", page: "a" }]);
  eq(M.view(o.m, 40, 1000).forYou.pages.map((p) => p.id), ["d", "a", "b"]);
  // a new version of an opened page is unopened again
  const n = M.step(o.m, { ev: "page", id: "a", version: 4, state: "ready", at_ms: 500 }, 50).m;
  assert.equal(M.view(n, 60, 1000).forYou.pages[0].id, "a");
  // 1 answers the card; esc closes
  eq(M.step(m, { ev: "app_key", key: "1" }, 30).cmds, [{ cmd: "answer", card: "c1", reply: "1" }]);
  assert.equal(M.step(m, { ev: "app_key", key: "esc" }, 30).m.pane, null);
});
law("the full view's empty sections: 'nothing running.' and 'nothing needs you.', no '0 waiting' title", () => {
  let m = M.step(M.init(), { ev: "state", agents: [], cards: [], pages: [{ id: "a", title: "x", version: 1, state: "ready", url: "u", at_ms: 1 }] }, 0).m;
  const v = M.view(M.step(m, { ev: "app_key", key: "0" }, 10).m, 20, 100);
  eq(v.empty, { running: "nothing running.", needs: "nothing needs you." });
  assert.equal(v.titles.needs, null); eq(v.list, []); assert.equal(v.forYou.pages.length, 1);
  // a page being written counts as running
  m = M.step(m, { ev: "page", id: "b", title: "y", version: 1, state: "writing", url: "u", at_ms: 2 }, 30).m;
  assert.equal(M.view(M.step(m, { ev: "app_key", key: "0" }, 40).m, 50, 100).empty.running, null);
});
law("it grows out of the menu-bar icon (SPEC §0): scale + fade from the icon's centre, 0.75 s expo out; back in 0.6 s expo in (ambient m_5152); a fade under reduced motion", () => {
  assert.equal(M.grow(true, true, false, null, null), null);                       // no change: no motion
  const icon = { x: 300, y: -20, w: 18, h: 18 };
  const o = M.grow(true, false, false, icon, { x: 10, y: 0, w: 360 });
  eq([o.open, o.ms, o.fade, o.from, o.origin], [true, 750, false, 0.15, "299px -11px"]);
  assert.equal(o.ease, "cubic-bezier(.16, 1, .3, 1)");
  const c = M.grow(false, true, false, icon, { x: 10, y: 0, w: 360 });
  eq([c.open, c.ms], [false, 600]); assert.equal(c.ease, "cubic-bezier(.7, 0, .84, 0)");
  // no icon yet: from the panel's top right
  assert.equal(M.grow(true, false, false, null, { x: 0, y: 0, w: 360 }).origin, "360px 0px");
  eq(M.grow(true, false, true, icon, null), { open: true, ms: 200, fade: true, ease: "linear" });
  // reduced motion from either side, in any order (ambient m_5557): the app's flag or the system's
  eq([M.reduced(false, false), M.reduced(true, false), M.reduced(false, true)], [false, true, true]);
  for (const sys of [false, true]) for (const app of [false, true]) if (app || sys) {
    const g = M.grow(true, false, M.reduced(app, sys), icon, { x: 10, y: 0, w: 360 });
    assert.equal(g.fade, true); assert.equal(g.from, undefined); assert.equal(g.ms, 200);
  }
  // app_icon is kept on the model, a broken one dropped
  assert.equal(M.view(M.step(M.init(), { ev: "app_icon", x: 1, y: -2, w: 18, h: 18 }, 0).m, 0).icon.y, -2);
  assert.equal(M.view(M.step(M.init(), { ev: "app_icon", x: "a" }, 0).m, 0).icon, null);
});
law("the pearl (SPEC §1): every mood value eases with 1 - e^(-dt/.3) (~0.9 s to land), flow = dt · speed · (1 + 1.2 · voice · level)", () => {
  let S = Pearl.start(0);
  S = Pearl.ease(S, "work", 0, 0.3, false);
  assert.ok(Math.abs(S.think - (1 - Math.exp(-1))) < 1e-9, "one time constant: 63%");
  for (let i = 0; i < 30; i++) S = Pearl.ease(S, "work", 0, 0.033, false);
  assert.ok(S.think > 0.95, "about a second: landed");
  // the flow follows the speed and the real level while you talk
  let L = { ...Pearl.start(0), ...Pearl.MOODS.listen };
  const quiet = Pearl.ease(L, "listen", 0, 0.1, false).flow, loud = Pearl.ease(L, "listen", 1, 0.1, false).flow;
  assert.ok(Math.abs(quiet - 0.07) < 1e-9); assert.ok(Math.abs(loud - 0.07 * 2.2) < 1e-9);
  // reduced motion: still in every mood (no flow, no breath), the tint still eases, then settled
  let R = Pearl.start(5);
  for (let i = 0; i < 100; i++) R = Pearl.ease(R, "need", 1, 0.05, true);
  assert.equal(Math.round(R.flow * 1000), 5000 + Math.round((R.flow - 5) * 1000)); assert.ok(R.flow - 5 < 0.05);
  assert.ok(R.need > 0.99 && R.still > 0.99); assert.ok(Pearl.settled(R, "need", true));
  // bise pink, from SPEC §1
  eq(Pearl.PINK.AMBER, [0.96, 0.56, 0.64]); eq(Pearl.PINK.EMBER, [0.58, 0.46, 0.96]);
  assert.ok(Pearl.FS.includes("mist pearl"));
});
law("the page frame's pearl is the capsule's: apps/ambient/kit/pearl.js is byte-identical to apps/ambient/web/pearl.js", () => {
  assert.equal(readFileSync(join(here, "../kit/pearl.js"), "utf8"), readFileSync(join(here, "pearl.js"), "utf8"), "copy web/pearl.js to kit/pearl.js");
});
law("the pearl's mood follows the capsule: listen, speak, work, need, done, fail, away, rest", () => {
  let m = M.step(M.init(), { ev: "state", agents: [{ name: "perf", status: "working" }], cards: [], pages: [] }, 0).m;
  assert.equal(M.view(m, 10).mood, "rest");
  assert.equal(M.view(M.step(m, { ev: "app_fn", state: "down", key: "fn" }, 10).m, 20).mood, "listen");
  assert.equal(M.view(M.step(m, { ev: "app_key", key: "0" }, 10).m, 20).mood, "work");
  assert.equal(M.view(M.step(m, { ev: "app_quiet", on: true, why: "call" }, 10).m, 20).mood, "away");
  assert.equal(run(sceneEvents("needs-wait"), [1000]).view(1000).mood, "need");
  assert.equal(run(sceneEvents("done"), [1000]).view(1000).mood, "done");
  assert.equal(run(sceneEvents("failed"), [1200]).view(1200).mood, "fail");
  const sp = sweep("talk");
  assert.ok(sp.at.some((t) => sp.view(t).state === "speaking" && sp.view(t).mood === "speak"));
});
law("VoiceOver: the pearl's label says its mood; one sentence per view is read, nothing at rest", () => {
  eq(["rest", "listen", "speak", "work", "need", "away"].map(Wd.moodLabel), ["bise", "bise is listening", "bise is talking", "bise is working", "bise needs you", "bise is quiet"]);
  assert.equal(Wd.sayOf(run(sceneEvents("idle"), [100]).view(100)), "");
  const n = run(sceneEvents("needs-wait"), [1000]).view(1000);
  assert.equal(Wd.sayOf(n), "cookies needs you: keep the banner on mobile?");
  let m = M.step(M.init(), { ev: "state", agents: [], cards: [], pages: [] }, 0).m;
  m = M.step(m, { ev: "app_fn", state: "down", key: "fn" }, 10).m;
  m = M.step(m, { ev: "heard", text: "make it half the size", final: false }, 20).m;
  assert.equal(Wd.sayOf(M.view(m, 30)), "listening, let go of fn to send. make it half the size");
});
law("the morning page (app_morning, morning-<date>): 'good morning. N things need you · fn + o' (greet), the count shared with the menu bar, the page itself opened; fn + o opens it", () => {
  let m = M.step(M.init(), { ev: "state", agents: [], cards: [], pages: [] }, 0).m;
  assert.equal(M.view(M.step(m, { ev: "app_morning", id: "x", title: "t", url: "u", greet: true }, 10).m, 20).text, "good morning. nothing needs you. your page is ready   fn o");
  const cards = [{ id: "c1", agent: "a", text: "q?", options: ["yes"] }, { id: "c2", agent: "b", text: "r?", options: ["yes"] }];
  const pages = [{ id: "morning-2026-10-03", title: "your morning", version: 1, opened_version: 0, state: "ready", url: "um", at_ms: 2 }, { id: "recap", title: "recap", version: 2, opened_version: 1, state: "ready", url: "ur", at_ms: 1 }];
  const busy = M.step(M.init(), { ev: "state", agents: [], cards, pages }, 0).m;
  const g = M.step(busy, { ev: "app_morning", id: "morning-2026-10-03", title: "your morning", url: "um", greet: true }, 10).m;
  assert.equal(M.view(g, 20).text, "good morning. 3 things need you   fn o");   // 2 cards + the recap's new version
  assert.equal(M.count(g), 3);                                                     // the morning page itself is opened
  assert.equal(Wd.morning(false, 1), "1 thing needs you   fn o");
  m = M.step(m, { ev: "app_morning", id: "morning-0612", title: "your morning", url: "http://127.0.0.1:47123/p/morning-0612", greet: false }, 10).m;
  const v = M.view(m, 20);
  assert.equal(v.text, "nothing needs you. your page is ready   fn o"); assert.equal(v.content.kind, "line");
  eq(M.step(m, { ev: "app_key", key: "o" }, 30).cmds, [{ cmd: "app_open_url", url: "http://127.0.0.1:47123/p/morning-0612", page: "morning-0612" }]);
});

// ---- the page's note layer (apps/ambient/kit/notes.js): anchoring, re-anchoring, the model
const N = BiseNotes.core;
// the tests' notes count n1, n2... (the page's own ids are n + time + random)
const counted = () => { let i = 0; return { id: () => `n${++i}` }; };
law("notes: every note gets its own id (n + time + random), never one in use, never the server's numbering", () => {
  const m = N.model([{ id: "n1", status: "sent" }]);
  const ids = new Set(Array.from({ length: 200 }, (_, i) => m.add({ kind: "note" }, 1700000000000 + i).id));
  assert.equal(ids.size, 200);
  for (const id of ids) assert.ok(/^n[0-9a-z]{8,}$/.test(id) && id !== "n1", id);
});
law("notes: a quote anchors on the block's visible text, the occurrence nearest its old offset", () => {
  const t = "Revenue  grew in Q2.\n Revenue in Q3 is flat.";
  eq(N.locate(t, "Revenue", 0), { start: 0, end: 7 });
  eq(N.locate(t, "Revenue", 20), { start: 20, end: 27 });
  eq(N.locate(t, "grew   in", 0), { start: 8, end: 15 });
  assert.equal(N.locate(t, "Q4"), null);
  assert.equal(N.locate(t, ""), null);
});
law("notes: on a new version, a note whose block or quote is gone is `moved`; an edit holds on its words", () => {
  const notes = [
    { id: "n1", block: "t1", kind: "note", text: "use March" },
    { id: "n2", block: "p2", kind: "drop", quote: "we shipped dark mode" },
    { id: "n3", block: "p4", kind: "edit", before: "Q2", after: "Q3" },
    { id: "n4", block: "p9", kind: "keep" },
    { id: "n5", block: "p4", kind: "edit", before: "May", after: "June" },
  ];
  const v2 = { t1: "Revenue March", p2: "we shipped  dark mode, and more", p4: "numbers for Q3 are in" };
  eq(N.reanchor(notes, v2).map((n) => n.anchor), ["ok", "ok", "ok", "moved", "moved"]);
  eq(N.reanchor(notes, { t1: "x", p2: "we shipped the light mode", p4: "Q2" }).map((n) => n.anchor), ["ok", "moved", "ok", "moved", "moved"]);
});
law("notes: an edit is the smallest changed span, by words", () => {
  const d = N.diffWords("revenue for Q2 was 4.1 M", "revenue for Q3 was 4.1 M");
  eq([d.before, d.after], ["Q2", "Q3"]);
  eq((({ before, after }) => [before, after])(N.diffWords("a b c", "a x y c")), ["b", "x y"]);
  assert.equal(N.label({ kind: "edit", before: "Q2", after: "Q3" }), 'you changed "Q2" → "Q3"');
});
law("notes: the model keeps drafts until send, one edit note per block, ⌘z undoes edits and removals", () => {
  const m = N.model([], counted());
  const a = m.add({ version: 1, block: "t1", kind: "note", text: "use March" }, 1);
  const b = m.add({ version: 1, block: "p2", kind: "drop", quote: "dark mode" }, 2);
  assert.equal(a.id, "n1"); assert.equal(b.id, "n2"); assert.equal(m.drafts().length, 2);
  const e = m.edit("p4", "Q2", "Q3", 3);
  assert.equal(e.kind, "edit");
  m.edit("p4", "Q2", "Q4", 4);                       // the same block again: one note, its first before
  eq(m.all().filter((n) => n.kind === "edit").map((n) => [n.before, n.after]), [["Q2", "Q4"]]);
  assert.equal(m.edit("p4", "Q2", "Q2", 5), null);   // back to the original: the note goes
  assert.equal(m.all().some((n) => n.kind === "edit"), false);
  m.edit("p4", "Q2", "Q3", 6);
  m.remove("n1");
  assert.equal(m.undo().type, "remove");             // the removal comes back
  assert.ok(m.get("n1"));
  assert.equal(m.undo().note.kind, "edit");          // then the edit goes
  assert.equal(m.all().some((n) => n.kind === "edit"), false);
  eq(m.payload().notes.map((n) => n.id).sort(), ["n1", "n2"]);
});
law("notes: send makes the drafts sent; the server's outcomes win; a new version says done, the answer, or open", () => {
  const m = N.model([], counted());
  m.add({ version: 1, block: "t1", kind: "note", text: "x" }, 1);
  m.add({ version: 1, block: "p2", kind: "keep" }, 2);
  m.add({ version: 1, block: "p3", kind: "drop" }, 3);
  m.sent(10);
  assert.equal(m.drafts().length, 0);
  m.merge([{ id: "n1", version: 1, block: "t1", kind: "note", text: "x", status: "done" }, { id: "n2", version: 1, block: "p2", kind: "keep", status: "answered", answer: "kept: Marc asked for it" }]);
  m.reanchor({ t1: "a", p2: "b", p3: "c" }, 2);
  eq(m.all().map((n) => N.outcome(n).text), ["✓ done", "kept: Marc asked for it", "open"]);
  // a server draft we don't know (another tab, a reload) joins; a new id never takes one in use
  m.merge([{ id: "n4", version: 2, block: "t1", kind: "note", text: "y", status: "draft" }]);
  assert.equal(m.get("n4").text, "y");
  assert.equal(m.add({ version: 2, block: "t1", kind: "note" }, 20).id, "n5");
  // the server never takes a note back to draft
  m.merge([{ id: "n1", status: "draft" }]);
  assert.equal(m.get("n1").status, "done");
});
law("notes: a pick on a question (kit.js's bise:pick) is one note per block, the latest wins, the same again takes it back", () => {
  const m = N.model([]);
  const p = m.pick("q1", 2, "the barn", 1, 1);
  assert.equal(p.kind, "pick"); assert.equal(N.label(p), "you picked 2: the barn");
  m.pick("q1", 3, "the loft", 1, 2);
  eq(m.drafts().map((n) => [n.block, n.option]), [["q1", 3]]);
  assert.equal(m.pick("q1", 3, "the loft", 1, 3), null);
  assert.equal(m.drafts().length, 0);
});
law("notes: a voice note at the mouse: start pins it listening (not a draft yet), heard fills it, end saves it, cancel and empty words remove it", () => {
  const m = N.model([], counted());
  const v = m.voiceStart({ block: "p2", pin: { x: 0.4, y: 0.5 }, quote: "we shipped dark mode", offset: 12 }, 1, 1);
  assert.equal(v.kind, "voice"); assert.ok(m.listening());
  assert.equal(m.drafts().length, 0); eq(m.payload().notes, []);
  m.voiceHeard("this gray is");
  m.voiceHeard("this gray is too light");
  assert.equal(m.listening().text, "this gray is too light");
  const done = m.voiceEnd("this gray is too light. use the one in tokens.css", 5);
  assert.equal(done.text, "this gray is too light. use the one in tokens.css");
  assert.equal(m.listening(), null);
  eq(m.payload().notes.map((n) => [n.kind, n.block, n.quote, n.text]), [["voice", "p2", "we shipped dark mode", "this gray is too light. use the one in tokens.css"]]);
  assert.equal(m.payload().notes[0].listening, undefined);
  m.voiceStart({ block: "p3" }, 1, 6); m.voiceHeard("hmm"); m.voiceCancel();
  m.voiceStart({ block: "p3" }, 1, 7); assert.equal(m.voiceEnd("  ", 8), null);
  assert.equal(m.all().length, 1);
});
law("notes: a voice note anchors on the words nearest the mouse, never across a sentence", () => {
  const t = "Revenue grew in Q2. We shipped dark mode for the settings page last week.";
  eq(N.nearestQuote(t, t.indexOf("dark") + 1), { quote: "We shipped dark mode for", offset: t.indexOf("We") });
  eq(N.nearestQuote(t, 2), { quote: "Revenue grew in Q2.", offset: 0 });
  assert.equal(N.nearestQuote("", 0), null);
});
law("notes: a question answered elsewhere drops our draft pick; a pick taken back (option null) goes too", () => {
  const m = N.model([], counted());
  m.pick("q1", 2, "the barn", 1, 1);
  assert.equal(m.answered("q1"), true); assert.equal(m.drafts().length, 0);
  m.pick("q2", 1, "yes", 1, 2);
  assert.equal(m.pick("q2", null, null, 1, 3), null); assert.equal(m.drafts().length, 0);
});
law("capsule: fn held on a bise page says `voice note on weekly update`, no `main sees`, then back to the status line", () => {
  let m = M.init();
  for (const [, ev] of sceneEvents("idle")) m = M.step(m, ev, 0).m;
  m = M.step(m, { ev: "app_fn", state: "down", key: "fn" }, 10).m;
  m = M.step(m, { ev: "phase", phase: "listening", page: { id: "weekly-update", title: "weekly update" } }, 20).m;
  m = M.step(m, { ev: "heard", text: "this gray", final: false }, 30).m;
  const v = M.view(m, 40);
  assert.equal(v.state, "voice_note"); assert.equal(v.label.text, "voice note on weekly update"); assert.equal(v.sees, null);
  m = M.step(m, { ev: "app_fn", state: "up", key: "fn" }, 50).m;
  m = M.step(m, { ev: "phase", phase: "idle" }, 60).m;
  const w = M.view(m, 70);
  assert.equal(w.size, "small"); assert.equal(w.text, null);
});
law("notes: a drawing is one note: its path (near points dropped), its box, the blocks under it top to bottom; it holds while one of them is there", () => {
  const p = N.strokePath([[10, 10], [10.5, 10.2], [20, 10], [20, 30.04]]);
  assert.equal(p, "M10 10 L20 10 L20 30");
  assert.equal(N.strokePath([[5, 5]]), "M5 5 L5.1 5");
  assert.equal(N.strokePath([]), "");
  eq(N.strokesBox([[[10, 40], [30, 45]], [[25, 90], [5, 60]]]), { x: 5, y: 40, w: 25, h: 50 });
  const rects = { h1: { x: 0, y: 0, w: 600, h: 30 }, p2: { x: 0, y: 40, w: 600, h: 80 }, t3: { x: 0, y: 130, w: 600, h: 200 } };
  eq(N.blocksIn({ x: 5, y: 100, w: 25, h: 50 }, rects), ["p2", "t3"]);
  eq(N.blocksIn({ x: 700, y: 0, w: 5, h: 5 }, rects), []);
  const d = { kind: "draw", block: "p2", blocks: ["p2", "t3"] };
  assert.equal(N.anchorOf(d, { t3: "x" }), "ok");
  assert.equal(N.anchorOf(d, { h1: "x" }), "moved");
  assert.equal(N.label({ kind: "draw", text: "this one is off" }), "✎ drawing: this one is off");
});
law("notes: the frame's count says nothing at 0, then `1 note` / `3 notes` (ambient, m_4868)", () => {
  eq([N.NW.count(0), N.NW.count(1), N.NW.count(3)], ["", "1 note", "3 notes"]);
});
law("notes: the words (ambient's), names with spaces", () => {
  assert.equal(N.NW.listTitle("weekly update", 3), "notes for weekly update · 3");
  assert.equal(N.NW.sendBar(3, N.spaced("weekly-update")), '3 notes for weekly update · or just say "send"');
  assert.equal(N.NW.sent(N.spaced("weekly-update")), "sent. weekly update is on it.");
  assert.equal(N.NW.updating("weekly update"), "weekly update is updating this page…");
  assert.equal(N.NW.keys, "t type   p pin   d draw   ⌘z undo   ⌘⏎ send");
  assert.equal(N.NW.empty, "no notes yet. select some text, or hold fn and talk.");
  // signed by ambient (m_4926): every key hint is `<key> <word>`
  assert.equal(N.NW.drawHint, "draw on the page   d done");
  assert.equal(N.NW.writing, "notes open with the first version");
  assert.equal(N.NW.replyBy(N.spaced("launch-recap")), "launch recap:");
});
law("notes: approve / skip (kit.js's bise:react) is one note per review item or email, the latest wins, kind null takes it back; an edit is one per item", () => {
  const m = N.model([], counted());
  m.react("r1", "m1", "approve", "reply to Anna", 1, 1);
  m.react("r1", "m2", "skip", "reply to Bob", 1, 2);
  m.react("r1", "m1", "skip", "reply to Anna", 1, 3);          // the latest wins
  m.react("e1", null, "approve", "", 1, 4);                    // a whole email
  eq(m.drafts().map((n) => [n.block, n.item || null, n.kind]), [["r1", "m1", "skip"], ["r1", "m2", "skip"], ["e1", null, "approve"]]);
  m.react("r1", "m2", null, "", 1, 5);                          // taken back
  eq(m.drafts().map((n) => n.item || n.block), ["m1", "e1"]);
  assert.equal(N.label(m.get("n1")), "skip"); assert.equal(m.get("n1").text, "reply to Anna");
  assert.equal(N.label({ kind: "approve" }), "approve");
  // edits on two items of one review are two notes; a second edit of one item updates it
  m.edit("r1", "Thanks", "Thank you", 6, "m1");
  m.edit("r1", "see you", "talk soon", 7, "m3");
  m.edit("r1", "Thanks", "Many thanks", 8, "m1");
  eq(m.drafts().filter((n) => n.kind === "edit").map((n) => [n.item, n.after]), [["m1", "Many thanks"], ["m3", "talk soon"]]);
});
law("notes: an answered or done note shows its outcome even when its block is gone; `moved` only for an open one (QA m_5008 (10))", () => {
  const gone = { anchor: "moved", version: 1, version_seen: 2 };
  eq(N.tagOf({ ...gone, status: "answered", answer: "which one?" }), { tag: "answer", text: "which one?" });
  eq(N.tagOf({ ...gone, status: "done" }), { tag: "done", text: "✓ done" });
  assert.equal(N.tagOf({ ...gone, status: "sent" }).tag, "moved");
  assert.equal(N.tagOf({ ...gone, status: "draft" }).tag, "moved");
});
law("notes: words only added or removed carry the words around them (QA m_5008 (11)); changed only when both sides have words (ambient m_5007)", () => {
  const ins = N.editSpan("we start day 1 at nine", "we start day 1 (or not) at nine");
  eq([ins.before, ins.after, ins.added, ins.ctx, ins.side], ["day 1", "day 1 (or not)", "(or not)", "day 1", "after"]);
  assert.equal(N.label({ kind: "edit", ...ins }), 'you added "(or not)" after "day 1"');
  const del = N.editSpan("we start day 1 at nine sharp", "we start day 1 at nine");
  assert.equal(N.label({ kind: "edit", ...del }), 'you removed "sharp" after "at nine"');
  const first = N.editSpan("day 1 at nine", "honestly day 1 at nine");
  assert.equal(N.label({ kind: "edit", ...first }), 'you added "honestly" before "day 1"');
  assert.equal(N.label({ kind: "edit", ...N.editSpan("Q2 was good", "Q3 was good") }), 'you changed "Q2" → "Q3"');
  eq([N.NW.changed("", "x"), N.NW.changed("x", "")], ['you added "x"', 'you removed "x"']);
  // a second edit of the block replaces the whole span (from the block's first text)
  const m = N.model([], counted());
  const a = N.editSpan("day 1 at nine", "day 1 (or not) at nine");
  m.edit("p1", a.before, a.after, 1, null, a);
  const b = N.editSpan("day 1 at nine", "day one at nine");
  m.edit("p1", b.before, b.after, 2, null, b);
  eq(m.drafts().map((n) => N.label(n)), ['you changed "1" → "one"']);
});
law("notes: an edit the new version kept is `✓ kept`, found in its block or anywhere on the page (QA m_5008 (12))", () => {
  const m = N.model([], counted());
  const s = N.editSpan("we start day 1 at nine", "we start day 1 (or not) at nine");
  m.edit("p1", s.before, s.after, 1, null, { ...s, version: 1 });
  assert.equal(m.drafts()[0].version, 1);
  m.sent(2);
  m.reanchor({ p7: "we start on day 1 (or not) at nine" }, 3);   // the block got a new id
  const n = m.all()[0];
  assert.equal(n.anchor, "ok");
  eq(N.tagOf(n), { tag: "done", text: "✓ kept" });
  m.reanchor({ p7: "we start on day 2" }, 4);
  assert.equal(N.tagOf(m.all()[0]).tag, "moved");
});
law("notes: kit.js's reactions: keep/drop one per variant, a pick one per block, tick on an item, null takes back (amb-kit m_5018)", () => {
  const m = N.model([], counted());
  m.react("c1", "v1", "keep", "", 1, 1);
  m.react("c1", "v1", "drop", "", 1, 2);                       // keep/drop replace each other
  m.react("c1", "v1", "pick", "the barn", 1, 3);
  m.react("c1", "v2", "pick", "the mill", 1, 4);               // one pick per block: the last wins
  m.react("k1", "t1", "tick", "book the room", 1, 5);
  eq(m.drafts().map((n) => [n.block, n.item, n.kind]), [["c1", "v1", "drop"], ["c1", "v2", "pick"], ["k1", "t1", "tick"]]);
  assert.equal(N.label(m.drafts()[1]), "picked");
  // a mark on a variant reads just its word; the variant's words stay on the note (QA m_5280 (17))
  const k = m.react("c2", "v9", "keep", "Le Moulin, Normandy 12-14 june, €12,400", 1, 7);
  assert.equal(N.label(k), "♡ keep"); assert.equal(k.text, "Le Moulin, Normandy 12-14 june, €12,400"); assert.equal(k.quote, undefined);
  assert.equal(N.label({ kind: "keep", text: "use this one", block: "p1" }), "♡ keep: use this one");
  assert.equal(N.where({ block: "c2", item: "v9" }, "Le Moulin, Normandy"), "Le Moulin, Normandy");
  m.react("c2", "v9", null, "", 1, 8);
  m.react("k1", "t1", null, "", 1, 6);                          // unticked
  eq(m.drafts().map((n) => n.kind), ["drop", "pick"]);
});
law("notes: the watching frame's stop is one stop note to main with its timer, read 'stop watching' (roadmap B, amb-kit f0a88b01)", () => {
  const m = N.model([], counted());
  const s = m.stop("b1", 3, 1, 1);
  eq([s.kind, s.block, s.timer, s.status], ["stop", "b1", 3, "draft"]);
  assert.equal(m.stop("b1", 3, 1, 2), s);                       // a second click: the same note
  assert.equal(N.label(s), "stop watching");
  assert.equal(m.stop("b1", null, 1, 3).timer, 3);
  m.sent(4);
  assert.equal(m.stop("b1", null, 1, 5).timer, undefined);      // sent: a new stop is a new note
});
law("notes: stop goes alone: the payload holds only it, and after the send his drafts stay drafts (ambient-lead m_5502)", () => {
  const m = N.model([], counted());
  m.react("k1", "t1", "tick", "book the room", 1, 1);
  const s = m.stop("b1", 7, 1, 2);
  eq(m.payload(s.id).notes.map((n) => n.kind), ["stop"]);
  eq(m.payload().notes.map((n) => n.kind), ["tick", "stop"]);
  m.sentOne(s.id, 3);
  eq(m.drafts().map((n) => n.kind), ["tick"]);
  assert.equal(m.get(s.id).status, "sent");
});
law("notes: a report's 'start an agent' (bise:start) is the toolbar's start note, sent alone, never a take-back (amb-kit d418d973)", () => {
  const m = N.model([], counted());
  m.react("k1", "t1", "tick", "book the room", 1, 1);
  const s = m.startNow("r1", "i2", "the install path is wrong", 1, 2);
  eq([s.kind, s.block, s.item, s.text], ["start", "r1", "i2", "the install path is wrong"]);
  assert.equal(m.startNow("r1", "i2", "the install path is wrong", 1, 3), s);   // again: the same note
  assert.equal(N.label(s), "start an agent");
  eq(m.payload(s.id).notes.map((n) => n.kind), ["start"]);
  m.sentOne(s.id, 4);
  eq(m.drafts().map((n) => n.kind), ["tick"]);
});
law("notes: a row its agent ticked (bise:ticked) drops our draft tick on that row only (amb-kit 74539129)", () => {
  const m = N.model([], counted());
  m.react("k1", "t1", "tick", "book the room", 1, 1);
  m.react("k1", "t2", "tick", "send the invites", 1, 2);
  assert.equal(m.ticked("k1", "t1"), true);
  eq(m.drafts().map((n) => n.item), ["t2"]);
  assert.equal(m.ticked("k1", "t1"), false);                   // nothing left there
});
law("notes: taste: a note that states a preference is offered once; yes marks it taste, no stops asking (roadmap §3.4)", () => {
  for (const t of ["never use emoji", "always cite the source", "too long", "no emoji", "shorter please", "jamais de tirets", "toujours en français", "trop long"]) assert.ok(N.tastes(t), t);
  for (const t of ["use March", "the barn", "longest day"]) assert.ok(!N.tastes(t), t);
  const m = N.model([], counted());
  const a = m.add({ version: 1, block: "p1", kind: "note", text: "too long, cut it in half" }, 1);
  assert.ok(N.offerTaste(a));
  m.update(a.id, { taste: true });
  assert.ok(!N.offerTaste(m.get(a.id)));
  assert.equal(m.payload().notes[0].taste, true);
  const b = m.add({ version: 1, block: "p1", kind: "note", text: "never this" }, 2);
  m.update(b.id, { taste: false });
  assert.ok(!N.offerTaste(m.get(b.id)));
  assert.equal(N.NW.taste, "keep this for next time?");
});
law("notes: start an agent on a review's item is a `start` note with the item's words, one per item, again takes it back (slice C)", () => {
  const m = N.model([], counted());
  const s = m.start("r1", "m2", "Marc · invoice #2231 paid on friday", 1, 1);
  eq([s.kind, s.block, s.item, s.text], ["start", "r1", "m2", "Marc · invoice #2231 paid on friday"]);
  assert.equal(N.label(s), "start an agent");
  assert.equal(m.start("r1", "m2", "", 1, 2), null);
  assert.equal(m.drafts().length, 0);
});
law("notes: the kit's own controls (data-kit-ui) are never in a block's text, so never in a quote or an anchor", () => {
  const ui = { nodeType: 1, childNodes: [fakeText("approve skip")], classList: { contains: () => false }, hasAttribute: (a) => a === "data-kit-ui" };
  const li = fakeEl(fakeText("Hi Anna, yes for tuesday."), ui);
  const pts = BiseNotes.rawPoints(li);
  assert.equal(pts.map(([n, i]) => n.nodeValue[i]).join(""), "Hi Anna, yes for tuesday.");
});
law("notes: a note on a ui block's rows keeps each line's numbers and text, and its place says the lines and the tab (page-notes)", () => {
  const L = BiseLines.core;
  // a diff's row: old and/or new number; a terminal's line: its n; numbers only from digits
  eq(L.line({ old: "34", new: null, n: 2, text: "Skills contain   " }), { old: 34, text: "Skills contain" });
  eq(L.line({ old: "39", new: "35", n: 9, text: "<skills>" }), { old: 39, new: 35, text: "<skills>" });
  eq(L.line({ old: null, new: null, n: 3, text: "/scheduled" }), { n: 3, text: "/scheduled" });
  eq(L.line({ old: "x", new: "", n: 1, text: "" }), { n: 1, text: "" });
  assert.equal(L.line({ n: 1, text: "y".repeat(400) }).text.length, L.CUT);
  const many = L.linesOf(Array.from({ length: 45 }, (_, i) => ({ n: i + 1, text: "z" })));
  eq([many.lines.length, many.more], [L.MAX, 5]);
  const diff = [{ old: 34, text: "a" }, { old: 35, text: "" }, { new: 34, text: "b" }];
  // in words, never '-5-7' (mono reads it as hyphens: ambient m_7871)
  assert.equal(L.label(diff), "old 34–35 · new 34");
  assert.equal(L.label(diff.slice(0, 2)), "old 34–35");
  assert.equal(L.label(diff.slice(2)), "new 34");
  assert.equal(L.label([{ n: 3, text: "x" }]), "line 3");
  assert.equal(L.label(many.lines, many.more), "lines 1–40");
  // the side list's place: the lines and the tab, before any quote
  assert.equal(N.where({ block: "diff", quote: "a b", lines: diff, part: "main" }, "the diff"), "old 34–35 · new 34 · main");
  assert.equal(N.NW.emptyLines, "no notes yet. select some text, click a line's number, or hold fn and talk.");
  assert.equal(N.where({ block: "screen", quote: "x", lines: [{ n: 3, text: "x" }] }, ""), "line 3");
  assert.equal(N.where({ block: "diff", quote: "a b", lines: [] }, ""), '"a b"');
});
law("notes: a note's place is the quoted words or the block's name (its kicker or heading, else its section's), never a block id (ambient, m_4919)", () => {
  assert.equal(N.where({ block: "c-check", quote: "post it now" }, "check before posting"), '"post it now"');
  assert.equal(N.where({ block: "c-check" }, "check before posting"), "check before posting");
  // the block is gone (a reload on a newer version): the name kept on the note, else nothing
  assert.equal(N.where({ block: "h-numbers", where: "raw numbers" }, ""), "raw numbers");
  assert.equal(N.where({ block: "h-numbers" }, ""), "");
  assert.equal(N.blockName("check before posting", "numbers", "x"), "check before posting");
  assert.equal(N.blockName("", "raw numbers", "11 stars today"), "raw numbers");
  assert.equal(N.blockName(" ", "", "we shipped dark mode on monday and light mode today"), "we shipped dark mode on monday…");
});
// a fake DOM: text nodes and elements, enough for the Range walk
function fakeText(s) { return { nodeType: 3, nodeValue: s }; }
function fakeEl(...kids) { return { nodeType: 1, childNodes: kids, classList: { contains: () => false } }; }
law("notes: a Range for a quote walks the block's text nodes, whitespace collapsed like norm()", () => {
  const a = fakeText("  Revenue\n   grew "), b = fakeText("in "), c = fakeText(" Q2.  ");
  const block = fakeEl(a, fakeEl(b), c);
  const pts = BiseNotes.rawPoints(block);
  // one point per normalized char (a collapsed run keeps its first whitespace char)
  assert.equal(pts.map(([n, i]) => n.nodeValue[i].replace(/\s/, " ")).join(""), "Revenue grew in Q2.");
  const doc = { createRange: () => ({ setStart(n, o) { this.s = [n, o]; }, setEnd(n, o) { this.e = [n, o]; } }) };
  const at = N.locate("Revenue grew in Q2.", "in Q2");
  const r = BiseNotes.rangeFor(doc, block, at.start, at.end);
  assert.equal(r.s[0], b); assert.equal(r.s[1], 0);
  assert.equal(r.e[0], c); assert.equal(c.nodeValue.slice(0, r.e[1]), " Q2");
});

law("the glass leaves with its last words: after content none, through the hide and its close (normal or reduced), until new content (ambient m_5574)", () => {
  const evs = sceneEvents("talk");
  for (const reduce of [false, true]) {
    let m = reduce ? M.step(M.init(), { ev: "app_reduce_motion", on: true }, 0).m : M.init();
    const upTo = (t) => { for (const [te, ev] of evs) if (te <= t && te > (upTo.done ?? -1)) m = M.step(m, ev, te).m; upTo.done = t; return m; };
    let shown = null;
    const at = (t, mm) => { const h = M.hold(shown, M.view(mm, t, 0)); shown = h.shown; return h.v; };
    for (let t = 0; t <= 13500; t += 100) at(t, upTo(t));
    const last = at(13500, upTo(13500));
    assert.equal(last.state, "end"); assert.equal(last.words.lit, last.words.list.length);
    const idle = at(17500, upTo(17500));                         // content none, still shown
    m = upTo(Infinity);
    eq([idle.content.kind, idle.state, idle.size, idle.words.list], ["none", "end", "open", last.words.list]);
    assert.equal(idle.still, reduce);
    const hidden = M.step(m, { ev: "app_hidden", on: true }, 17600).m;
    for (const t of [17700, 17900, 19000]) {                     // the close (0.2 s or 0.6 s) and after
      const h = at(t, hidden);
      eq([h.hidden, h.size, h.words.list], [true, "open", last.words.list]);
    }
    // new content ends the hold
    const next = at(19500, M.step(hidden, { ev: "app_key", key: "0" }, 19400).m);
    assert.equal(next.state, "agents");
  }
});

law("the hello, once ever (app_hello): the pearl gathers 1.2 s, 'hi, i'm bise. hold fn and talk to me.', the kiss puff, 5 s; fn, esc or a click end it (ambient m_5702)", () => {
  const m = M.step(M.init(), { ev: "app_hello" }, 1000).m;
  const at = (t) => M.view(m, 1000 + t);
  eq([at(0).state, at(0).content.kind, at(0).text, at(0).gather], ["hello", "hello", null, 1]);
  assert.ok(at(600).gather > 0 && at(600).gather < 0.2);              // expo out: mostly gathered by 0.6 s
  eq([at(1200).gather, at(400).text], [0, W.hello]);
  eq([at(1300).puff, at(1500).puff, at(2500).puff], [false, true, false]);
  eq([at(5700).state, at(5900).content.kind], ["hello", "none"]);   // the words land at ~0.8 s, then 5 s
  assert.equal(at(0).mood, "rest"); assert.equal(at(0).still, false);
  // it leaves at once on a fn hold (the talk takes over), esc, or a click
  assert.equal(M.view(M.step(m, { ev: "app_fn", state: "down", key: "fn" }, 2000).m, 2010).state, "listening");
  assert.equal(M.view(M.step(m, { ev: "app_key", key: "esc" }, 2000).m, 2010).content.kind, "none");
  assert.equal(M.view(M.step(m, { ev: "ui_capsule" }, 2000).m, 2010).content.kind, "none");
  // reduced motion: no gathering, no puff, the words at once, gone after 5.5 s
  const r = M.step(M.step(M.init(), { ev: "app_reduce_motion", on: true }, 0).m, { ev: "app_hello" }, 1000).m;
  const rv = (t) => M.view(r, 1000 + t);
  eq([rv(0).gather, rv(0).text, rv(1500).puff, rv(5400).state, rv(5600).content.kind], [0, W.hello, false, "hello", "none"]);
});

law("every project's cards reach the bar (amb-mac m_8894): the core's projects rows (fixture acme, ProjectRow.cards) join home's state.cards; ids are per hub, so acme's #4 and home's #4 stay two cards; answers and app_content carry the card's own id and its project", () => {
  const fx = readFileSync(join(here, "../../../rust/proto/fixtures/core_ev.jsonl"), "utf8").split(String.fromCharCode(10)).filter(Boolean).map((l) => JSON.parse(l));
  const rows = fx.find((e) => e.ev === "projects").projects;
  const acme = rows.find((p) => p.project === "acme-1a2b3c4d");
  // home's card #9 collides with acme's #9 on purpose
  let m = M.step(M.init(), { ev: "state", agents: [], cards: [{ id: 9, kind: "question", agent: "main", text: "home's own?", options: [{ n: 1, label: "yes" }, { n: 2, label: "no" }] }], pages: [] }, 0).m;
  m = M.step(m, { ev: "projects", projects: rows }, 10).m;
  eq(M.visibleCards(m).map((c) => [c.id, c.cid ?? null, c.text]), [[9, null, "home's own?"], ["acme-1a2b3c4d#9", 9, "which bench?"], ["acme-1a2b3c4d#10", 10, "run rm -rf target?"]]);
  // the spotlight marks acme's confirm (approval: true) as an approval
  const sp = Bar.spec(M.view(M.step(m, { ev: "app_key", key: "space" }, 20).m, 30));
  eq(sp.sections[0].rows.map((r) => r.g), ["?", "?", "!"]);
  // the glass asks home's first; picking acme's from fn i answers acme's #9 with its project
  const v = M.view(m, 40);
  eq(v.content, { kind: "needs", card: 9 });
  const acmeFirst = M.step(m, { ev: "ui_card", card: "acme-1a2b3c4d#9" }, 50).m;
  eq(M.view(acmeFirst, 60).content, { kind: "needs", card: 9, project: acme.project });
  eq(M.step(acmeFirst, { ev: "app_key", key: "2" }, 70).cmds.filter((c) => c.cmd === "answer"), [{ cmd: "answer", card: 9, reply: "2", project: acme.project }]);
  // answered stays hidden on the next state (numeric ids kept across the prune), home's #9 still asks
  const after = M.step(M.step(acmeFirst, { ev: "app_key", key: "2" }, 70).m, { ev: "state", agents: [], cards: m.cards, pages: [] }, 80).m;
  eq(M.visibleCards(after).map((c) => c.id), [9, "acme-1a2b3c4d#10"]);
  const home = M.step(m, { ev: "app_key", key: "1" }, 90).m;
  eq(M.visibleCards(M.step(home, { ev: "state", agents: [], cards: m.cards, pages: [] }, 100).m).map((c) => c.id), ["acme-1a2b3c4d#9", "acme-1a2b3c4d#10"]);
});

law("card seat (amb-mac 9c529bdd): while bise's window holds the cards (app_card_seat 'window') the bar keeps the hello and never turns into the card, its keys answer nothing; at 'bar' the card asks again (lead m_8746)", () => {
  const card = { id: "c1", agent: "search", text: "reindex tonight 02:00?", options: ["yes", "no"] };
  let m = M.step(M.init(), { ev: "app_card_seat", at: "window" }, 0).m;
  m = M.step(m, { ev: "app_hello" }, 1000).m;
  m = M.step(m, { ev: "state", agents: [{ name: "search", status: "waiting" }], cards: [card], pages: [] }, 1500).m;
  eq([M.view(m, 2000).state, M.view(m, 2000).need], ["hello", false]);
  eq([M.view(m, 7000).state, M.view(m, 7000).content.kind], ["idle", "none"]);   // the hello over: nothing, no card
  eq(M.step(m, { ev: "app_key", key: "1" }, 7100).cmds.filter((c) => c.cmd === "answer"), []);
  // he leaves the window: the card is the bar's again
  const b = M.step(m, { ev: "app_card_seat", at: "bar" }, 8000).m;
  eq([M.view(b, 8100).state, M.view(b, 8100).ask.id], ["needs", "c1"]);
  // the card he brought up (fn i) stays first after the front app changes (app_front kept its own field)
  const two = M.step(b, { ev: "state", agents: [], cards: [card, { ...card, id: "c2" }], pages: [] }, 8200).m;
  const f = M.step(M.step(two, { ev: "ui_card", card: "c2" }, 8300).m, { ev: "app_front", app: "Code", bundle: "com.microsoft.VSCode" }, 8400).m;
  eq(M.view(f, 8500).ask.id, "c2");
});

law("a batch of drafts is one glass: '3 drafts wait for you · <page>', 'replies to …', 1 review (opens the page), 2 send all 3 ('∿ sending 3 replies.') (ambient m_6056, lead m_6063)", () => {
  const card = { id: "b1", agent: "inbox", kind: "drafts", text: "3 drafts ready: legal · Lucas · Marc",
    options: [{ n: 1, label: "review" }, { n: 2, label: "send all 3" }],
    page: { id: "inbox", block: "r1", item: "i1", drafts: true, url: "http://127.0.0.1:47123/p/inbox#i1" },
    batch: { count: 3, title: "your inbox", what: "replies", names: ["legal", "Lucas", "Marc"] } };
  const m = M.step(M.init(), { ev: "state", agents: [], cards: [card], pages: [] }, 0).m;
  const v = M.view(m, 10);
  eq([v.state, v.mood, v.ask.title, v.ask.text, v.ask.hint, v.ask.open], ["needs", "need", "3 drafts wait for you · your inbox", "replies to legal, Lucas and Marc", W.needsKeys, null]);
  eq(v.ask.options.map((o) => `${o.n} ${o.label}`), ["1 review", "2 send all 3"]);
  // 1 review: the answer, and the page at the first draft
  eq(M.step(m, { ev: "app_key", key: "1" }, 20).cmds, [{ cmd: "answer", card: "b1", reply: "1" }, { cmd: "app_open_url", url: "http://127.0.0.1:47123/p/inbox#i1", page: "inbox" }]);
  // 2 send all: '∿ sending 3 replies.' (nothing has left yet), a timed line
  const s = M.step(m, { ev: "app_key", key: "2" }, 20);
  eq(s.cmds, [{ cmd: "answer", card: "b1", reply: "2" }]);
  const sv = M.view(s.m, 30);
  eq([sv.glyph, sv.text, sv.content.kind], ["∿", "sending 3 replies.", "line"]);
  // fn o opens the batch's page too
  eq(M.step(m, { ev: "app_key", key: "o" }, 20).cmds, [{ cmd: "app_open_url", url: "http://127.0.0.1:47123/p/inbox#i1", page: "inbox" }]);
  // two: 'send both', 'sending both replies.'; more than 3 names: 'and N more'; no batch: read from the text
  eq([Wd.drafts.sendAll(2), Wd.drafts.sending(2, "replies"), Wd.names(["legal", "Lucas", "Marc", "Ana", "Ivo", "Zoé"])], ["send both", "sending both replies.", "legal, Lucas and 4 more"]);
  const bare = M.view(M.step(M.init(), { ev: "state", agents: [], cards: [{ ...card, batch: undefined }], pages: [] }, 0).m, 10);
  eq([bare.ask.title, bare.ask.text], ["3 drafts wait for you", "legal, Lucas and Marc"]);
  // amb-core's card text since e2d256e1, without batch: its first two lines
  const v2 = M.view(M.step(M.init(), { ev: "state", agents: [], cards: [{ ...card, batch: undefined, text: "2 drafts wait for you · launch recap\nreplies to Ana and Ivo\n1. review\n2. send both" }], pages: [] }, 0).m, 10);
  eq([v2.ask.title, v2.ask.text], ["2 drafts wait for you · launch recap", "replies to Ana and Ivo"]);
  eq(Wd.drafts.line("steps", ["book the room", "send invites"]), "book the room and send invites");
  // batch.line, when the hub writes it, is shown as is (amb-core 2e114ebe)
  const v3 = M.view(M.step(M.init(), { ev: "state", agents: [], cards: [{ ...card, batch: { count: 3, title: "inbox", what: "replies", names: ["Benjamin"], topics: ["proxy", "fish", "French"], line: "3 replies to Benjamin: proxy · fish · French" } }], pages: [] }, 0).m, 10);
  eq([v3.ask.title, v3.ask.text], ["3 drafts wait for you · inbox", "3 replies to Benjamin: proxy · fish · French"]);
});

// ---- for you with opened_version (amb-core 03821a37) and the count shared with the menu bar
law("for you: unopened first, newest first, 'new' or 'v3 · 2 new versions'; seen ones after; a watched page says when it was checked", () => {
  const pages = [
    { id: "a", title: "launch recap", version: 3, opened_version: 1, state: "ready", url: "ua", at_ms: 9000 },
    { id: "b", title: "which gray wins?", version: 2, opened_version: 2, state: "ready", url: "ub", at_ms: 8000 },
    { id: "c", title: "hn watch", version: 1, opened_version: 0, state: "ready", url: "uc", at_ms: 7000 },
    { id: "d", title: "draft", version: 1, state: "writing", url: "ud", at_ms: 9500 },
  ];
  const timers = [{ id: 3, agent: "hn", label: "every 15 min", text: "check HN", by: "main", next_ms: 0, fired: 4, page: "c", last_ms: 1000 * 60 * 57 }, { agent: "x" }];
  let m = M.step(M.init(), { ev: "state", agents: [], cards: [], pages, timers }, 0).m;
  m = M.step(m, { ev: "app_key", key: "0" }, 10).m;
  const fy = M.view(m, 20, 1000 * 60 * 60).forYou.pages;
  eq(fy.map((p) => [p.id, p.meta, p.unopened]), [["a", "v3 · 2 new versions", true], ["c", "new", true], ["b", "v2 · 59 min ago", false]]);
  eq(fy.map((p) => p.watch), [null, "watching · checked 3 min ago", null]);
  assert.equal(Wd.watching(0, 5), "watching");
  assert.equal(Wd.pageMeta({ version: 2 }, 0, 1), "v2 · 1 new version");
  // fn + ⏎ in the full view (no card from a page): the first unopened page, at its newest version
  const r = M.step(m, { ev: "app_key", key: "enter" }, 30);
  eq(r.cmds, [{ cmd: "app_open_url", url: "ua", page: "a" }]);
  eq(M.view(r.m, 40, 1000 * 60 * 60).forYou.pages.map((p) => p.id), ["c", "a", "b"]);
});
law("the menu-bar count = cards waiting + ready pages with an unopened version: fixtures/count.json, shared with amb-mac", () => {
  const fx = JSON.parse(readFileSync(join(here, "fixtures/count.json"), "utf8"));
  assert.ok(fx.cases.length >= 4);
  for (const c of fx.cases) {
    const m = M.step(M.init(), { ev: "state", agents: [], ...c.state }, 0).m;
    assert.equal(M.count(m), c.count, c.name);
  }
  // the list agrees: its unopened rows + the waiting cards
  const c = fx.cases[3];
  const m = M.step(M.step(M.init(), { ev: "state", agents: [], ...c.state }, 0).m, { ev: "app_key", key: "0" }, 10).m;
  const v = M.view(m, 20, 100);
  assert.equal(v.forYou.pages.filter((p) => p.unopened).length + v.inbox.length, M.count(m));
});

// ---- settings (fn + ,; amb-mac ef4dbc2e)
const SETTINGS = { ev: "app_settings", edge_glow: true, right_option: false, meeting_quiet: false, voice_answers: true, launch_at_login: "off", macos: 26, radius: 26,
  skip: [{ bundle: "com.agilebits.onepassword7", name: "1Password", fixed: true }] };
law("settings: fn + , opens the view (content open), again closes it; rows in amb-mac's order with their state", () => {
  let m = M.step(M.init(), SETTINGS, 0).m;
  m = M.step(m, { ev: "app_key", key: "," }, 10).m;
  const v = M.view(m, 20);
  assert.equal(v.state, "settings"); assert.equal(v.size, "open"); assert.equal(v.content.kind, "open");
  eq(v.settings.rows.map((r) => [r.key, r.on]), [["edge_glow", true], ["right_option", false], ["meeting_quiet", false], ["voice_answers", true], ["sounds", true], ["launch_at_login", false]]);
  assert.ok(v.settings.rows.every((r) => typeof r.label === "string" && r.label));
  assert.equal(M.view(M.step(m, { ev: "app_key", key: "," }, 30).m, 40).state, "idle");
  assert.equal(M.view(M.step(m, { ev: "app_hidden", on: true }, 30).m, 40).settings, undefined);
});
law("settings: a toggle flips at once and sends app_setting {key, value}; launch at login waits for macOS's OK", () => {
  let m = M.step(M.step(M.init(), SETTINGS, 0).m, { ev: "app_key", key: "," }, 10).m;
  let r = M.step(m, { ev: "ui_setting", key: "right_option" }, 20);
  eq(r.cmds, [{ cmd: "app_setting", key: "right_option", value: true }]);
  assert.equal(M.view(r.m, 30).settings.rows[1].on, true);
  r = M.step(r.m, { ev: "ui_setting", key: "edge_glow" }, 40);
  eq(r.cmds, [{ cmd: "app_setting", key: "edge_glow", value: false }]);
  r = M.step(r.m, { ev: "ui_setting", key: "launch_at_login" }, 50);
  eq(r.cmds, [{ cmd: "app_setting", key: "launch_at_login", value: true }]);
  let row = M.view(r.m, 60).settings.rows[5];
  assert.equal(row.on, true); assert.equal(row.note, W.set.approve);
  row = M.view(M.step(r.m, { ...SETTINGS, launch_at_login: "on" }, 70).m, 80).settings.rows[5];
  assert.equal(row.on, true); assert.equal(row.note, null);
  eq(M.step(r.m, { ev: "ui_setting", key: "nope" }, 90).cmds, []);
});
law("settings: 'bise never sees' starts with its two fixed rows, then his apps with remove; no empty line (ambient m_5410)", () => {
  let m = M.step(M.step(M.init(), SETTINGS, 0).m, { ev: "app_key", key: "," }, 10).m;
  let s = M.view(m, 20).settings;
  assert.equal(s.skipTitle, "bise never sees");
  eq(s.always, ["private browser windows", "password managers"]); eq(s.skip, []); assert.equal(s.empty, undefined);
  assert.equal(s.rows[2].note, "bise still shows things, it just doesn't say them.");
  eq(M.step(m, { ev: "ui_setting", key: "skip_add" }, 30).cmds, [{ cmd: "app_setting", key: "skip_add" }]);
  eq(M.step(m, { ev: "ui_setting", key: "skip_remove", value: "com.agilebits.onepassword7" }, 30).cmds, []);
  m = M.step(m, { ...SETTINGS, skip: [...SETTINGS.skip, { bundle: "com.tinyspeck.slackmacgap", name: "Slack" }] }, 40).m;
  s = M.view(m, 50).settings;
  eq(s.skip.map((x) => x.name), ["Slack"]);   // amb-mac's fixed 1Password is the 'password managers' row
  const r = M.step(m, { ev: "ui_setting", key: "skip_remove", value: "com.tinyspeck.slackmacgap" }, 60);
  eq(r.cmds, [{ cmd: "app_setting", key: "skip_remove", value: "com.tinyspeck.slackmacgap" }]);
  eq(M.view(r.m, 70).settings.skip, []);
});

// ---- coverage: every scene plays, every SPEC §2 state shows from contract events
law("every scene plays without throwing, and every SPEC §2 state shows", () => {
  const seen = new Set();
  for (const sc of Fake.SCENES) {
    const s = sweep(sc.id);
    for (const t of s.at) {
      const v = s.views[t];
      seen.add(v.state);
      if (v.state === "end" && v.pose === "kiss") seen.add("kiss");
      if (v.ask) seen.add("ask");
      assert.ok(typeof flat(v) === "string");
    }
  }
  for (const st of ["idle", "listening", "working", "speaking", "end", "kiss", "needs", "ask", "answered", "done", "failed", "agents", "inbox", "spotlight", "cancel", "error", "perm", "hub_down"]) {
    assert.ok(seen.has(st), `no scene shows ${st} (saw ${[...seen].join(", ")})`);
  }
});

// ---- round 10, preview A (identity10, lead m_7027, amb-core m_7030's shapes)
const R10 = () => {
  let m = M.init();
  m = M.step(m, { ev: "hub", up: true, workspace: "~/acme" }, 0).m;
  return M.step(m, { ev: "state", agents: Fake.ROSTER, cards: [Fake.CARD] }, 0).m;
};
const v10 = (m, t = 100) => M.view(m, t, Fake.T0);
law("round 10: fn a lists your agents, waiting on you first, then blocked, working, idle, done; archived ones only in a search; the bar opens at 860 with the preview", () => {
  const r = M.step(R10(), { ev: "app_key", key: "a" }, 10);
  eq(r.cmds, [{ cmd: "app_focus", on: true }]);
  const v = v10(r.m);
  eq([v.state, v.content.kind], ["find", "type"]);
  eq(v.find.rows.map((x) => x.name), ["cookies", "emoji-csv", "perf", "dark-mode", "weekly-update", "release"]);
  const s = Bar.spec(v);
  eq([s.w, s.head.input.ph, s.head.right.keys], [860, "find an agent", ["fn", "a"]]);
  eq([s.sections[0].label, s.sections[0].acc], ["your agents", "1 waiting on you"]);
  const rows = s.sections[0].rows;
  eq(rows.map((x) => [x.g, x.gc]), [["?", "a"], ["▲", "risk"], ["∿", "work"], ["∿", "work"], ["◌", null], ["✓", "ok"]]);
  eq([rows[0].right, rows[2].right, rows[2].sub], [{ wait: 1 }, { age: "12m" }, "signup is 4.1 s → 0.9 s; checking the e2e tests"]);
  eq(rows[0].act, { ev: "ui_agent", agent: "cookies" });
  assert.ok(rows[0].sel);
  eq(Bar.size(420, 26, true, s.w), { cmd: "app_size", w: 1004, h: 540, radius: 26, glass: { x: 84, y: 28, w: 860, h: 420 } });
  // fn a again closes it
  eq(M.step(r.m, { ev: "app_key", key: "a" }, 20).cmds, [{ cmd: "app_focus", on: false }]);
});
law("round 10: the preview follows ↑↓; it's asked once per agent (the page waits 80 ms), the core's agent_preview fills it: now, waits on you, last actions, last report, its pages, ⏎ ⌘O ⌘D", () => {
  let m = M.step(R10(), { ev: "app_key", key: "a" }, 10).m;
  let v = v10(m);
  eq([v.find.agent, v.find.want], ["cookies", "cookies"]);
  // before it comes: the title line stands for now
  let p = Bar.spec(v).preview;
  eq([p.name, p.chip, p.now, p.loading], ["cookies", { text: "needs you · 4m", gc: "a" }, "the banner, half the size on mobile", true]);
  eq(p.act, { ev: "ui_agent", agent: "cookies" });   // a click on the preview = its ⏎: the side panel
  let r = M.step(m, { ev: "ui_preview_ask", agent: "cookies" }, 20);
  eq(r.cmds, [{ cmd: "agent_preview", agent: "cookies" }]);
  eq(M.step(r.m, { ev: "ui_preview_ask", agent: "cookies" }, 30).cmds, []);   // asked once: the core re-sends on its events
  m = M.step(r.m, { ev: "agent_preview", agent: "cookies", ...Fake.PREVIEWS.cookies }, 40).m;
  v = v10(m);
  assert.equal(v.find.want, null);
  p = Bar.spec(v).preview;
  eq([p.now, p.loading], [Fake.PREVIEWS.cookies.now, false]);
  eq(p.waits, [{ label: "? cookies needs you", text: "keep the banner on mobile, or only a link in the footer?", act: { ev: "ui_card", card: "c1" }, qa: "wait-c1" }]);
  eq(p.actions.map((a) => a.text), ["built the banner at 50% height under 480 px", "ran the visual tests · 2 snapshots changed", "asked you: keep the banner on mobile?"]);
  assert.ok(p.actions.every((a) => /^\d\d:\d\d$/.test(a.at)));
  eq(p.report, { glyph: "", text: "banner at 50% on mobile, snapshots updated." });
  eq(p.ways.map((w) => [w.keys.join(" "), w.w]), [["⏎", "open its history"], ["⌘ O", "terminal"], ["⌘ D", "follow"]]);
  // ↓: the next agent, its preview asked in turn
  m = M.step(m, { ev: "app_key", key: "down", local: true, n: 6 }, 50).m;
  v = v10(m);
  eq([v.find.agent, v.find.want, Bar.selRow(Bar.spec(v)).t], ["emoji-csv", "emoji-csv", "emoji-csv"]);
  m = M.step(m, { ev: "agent_preview", agent: "emoji-csv", ...Fake.PREVIEWS["emoji-csv"] }, 60).m;
  eq(Bar.spec(v10(m)).preview.report, { glyph: "▲", text: "needs to know: fix on main or on release-2.5?" });
  // a page in the preview opens in the browser
  m = M.step(m, { ev: "agent_preview", agent: "perf", ...Fake.PREVIEWS.perf }, 70).m;
  m = M.step(m, { ev: "app_key", key: "down", local: true, n: 6 }, 80).m;
  const pg = Bar.spec(v10(m)).preview.pages[0];
  eq(pg.t, "signup perf · v2");
  eq(M.step(m, pg.act, 90).cmds, [{ cmd: "app_open_url", url: "https://bise.dev/p/signup-perf", page: "signup-perf" }]);
  // the fake core answers the ask the same way (dev.html)
  eq(Fake.respond({ cmd: "agent_preview", agent: "perf" })[0][1].ev, "agent_preview");
  // ambient's gate (m_7074): no preview ~1 s after the ask: no '…' that stays; the row's title as
  // now, its cards as what waits on you, and the ways in
  let n = M.step(R10(), { ev: "app_key", key: "a" }, 10).m;
  n = M.step(n, { ev: "ui_preview_ask", agent: "cookies" }, 100).m;
  let q = Bar.spec(v10(n, 500)).preview;
  eq([q.loading, q.waits.map((w) => w.text)], [true, ["keep the banner on mobile?"]]);
  q = Bar.spec(v10(n, 1100)).preview;
  eq([q.loading, q.now, q.waits[0].act, q.ways.map((w) => w.w)], [false, "the banner, half the size on mobile", { ev: "ui_card", card: "c1" }, ["open its history", "terminal", "follow"]]);
});
law("desktop S8 spotlight (v9): fn space asks bise or finds an agent; 1-2 words naming an agent list it and ⏎ opens it in the window; a sentence puts 'ask bise' first, the agents it names at ↓", () => {
  let m = M.step(R10(), { ev: "app_key", key: "space" }, 10).m;
  let s = Bar.spec(v10(m));
  eq([s.kind, s.head.input.ph, s.head.right.text], ["spotlight", "ask bise, or find an agent", "hold fn to talk"]);
  const foot = (x) => x.foot.left.map((i) => `${i.keys.join(" ")} ${i.w}`);
  // v9's example 1: a name -> that agent, ⏎ opens it, ⌘⏎ still sends the words to bise
  m = M.step(m, { ev: "ui_spot_type", text: "perf" }, 20).m;
  s = Bar.spec(v10(m));
  eq(s.sections.map((x) => [x.label, x.rows.map((r) => r.t)]), [["found", ["perf"]]]);
  eq(s.sections[0].rows[0].mark, { t: [0, 4], sub: null });
  eq(foot(s), ["⏎ open perf", "⌘ ⏎ send “perf” to bise", "tab start an agent"]);
  eq(s.head.right.text, "to bise");   // once he has typed (ambient m_8498 (4))
  const row = Bar.selRow(s);
  eq(row.act, { ev: "ui_agent", agent: "perf" });
  const r = M.step(m, row.act, 30);
  eq(r.cmds, [{ cmd: "app_focus", on: false }, { cmd: "app_window", route: "agent/home/perf" }]);
  assert.equal(r.m.pane, null);
  // the title and the purpose name an agent too
  m = M.step(m, { ev: "ui_spot_type", text: "banner" }, 40).m;
  eq(Bar.spec(v10(m)).sections[0].rows.map((x) => [x.t, x.mark.sub]), [["cookies", [4, 10]]]);
  m = M.step(m, { ev: "ui_spot_type", text: "emoji" }, 45).m;
  eq(Bar.spec(v10(m)).sections[0].rows.map((x) => x.t), ["emoji-csv"]);
  // v9's example 2: a sentence goes to bise; ⏎ sends it
  m = M.step(m, { ev: "ui_spot_type", text: "dark theme for billing" }, 60).m;
  s = Bar.spec(v10(m));
  eq(s.sections[0].rows.map((x) => [x.t, x.sub]), [["ask bise", "dark theme for billing"]]);
  eq(Bar.selRow(s).act, { ev: "ui_spot_send", text: "dark theme for billing" });
  eq(foot(s), ["⏎ send to bise", "tab start an agent"]);
  // v9's example 3: a sentence that starts with an agent's name still goes to bise; the agent waits at ↓
  m = M.step(m, { ev: "ui_spot_type", text: "perf ne trouve pas le cache" }, 70).m;
  s = Bar.spec(v10(m));
  eq(s.sections[0].rows.map((x) => x.t), ["ask bise", "perf"]);
  eq([Bar.selRow(s).act.ev, foot(s)], ["ui_spot_send", ["⏎ send to bise", "↓ then ⏎ open perf", "tab start an agent"]]);
  m = M.step(m, { ev: "app_key", key: "down", local: true, n: 2 }, 75).m;
  eq(Bar.selRow(Bar.spec(v10(m))).act, { ev: "ui_agent", agent: "perf" });
  // typing puts the selection back on the first row
  m = M.step(m, { ev: "ui_spot_type", text: "perf ne trouve pas le cache !" }, 80).m;
  eq(Bar.selRow(Bar.spec(v10(m))).act.ev, "ui_spot_send");
});
law("desktop S8 spotlight empty (v9): waiting for you, at work, environments with the front app's project first and ⌘1-9; ⏎ opens each in the window", () => {
  const projects = [{ project: "home", name: "bise", home: true, order: 0 },
    { project: "storefront-5c1d", name: "storefront", path: "/Users/you/storefront", branch: "main", agents: 5, order: 1 },
    { project: "telemetry-8e02", name: "telemetry", path: "/Users/you/telemetry", branch: "main", agents: 2, order: 2, hosts: ["grafana.internal"] }];
  const agents = [{ name: "alerts", status: "waiting", title: "compaction at 03:00?", project: "telemetry-8e02" },
    { name: "stock", status: "working", title: "flash sale replay · 62%", project: "storefront-5c1d" },
    { name: "wallet", status: "idle", title: "Apple Pay", project: "storefront-5c1d" }];
  const cards = [{ id: "c-alerts", agent: "alerts", project: "telemetry-8e02", title: "compaction at 03:00?", text: "passer la compaction à 03:00 ?", options: ["move it", "leave it"] }];
  let m = M.step(M.init(), { ev: "state", agents, cards, projects }, 0).m;
  m = M.step(m, { ev: "app_front", app: "Chrome", bundle: "com.google.Chrome", url: "https://grafana.internal/d/ingest", title: "ingest p99" }, 5).m;
  m = M.step(m, { ev: "app_key", key: "space" }, 10).m;
  const s = Bar.spec(M.view(m, 20, Fake.T0));
  eq(s.sections.map((x) => [x.label, x.rows.map((r) => [r.t, r.p || "", r.sub, r.right ? r.right.keys.join("") : ""])]), [
    ["waiting for you", [["alerts", "telemetry", "compaction at 03:00?", "⏎"]]],
    ["at work", [["stock", "storefront", "flash sale replay · 62%", ""]]],
    ["environments", [["telemetry", "", "/Users/you/telemetry  ·  in front: grafana.internal", "⌘1"], ["storefront", "", "/Users/you/storefront  ·  main · 5 agents", "⌘2"]]]]);
  // nothing typed: only ⏎ and esc (ambient m_8617 (2)); ⌘⏎ and tab come with the first character
  eq(s.foot.left.map((i) => `${i.keys.join(" ")} ${i.w}`), ["⏎ open in bise"]);
  // ⏎ on the card (selected first) opens it in the window; ⌘2 = storefront
  eq(M.step(m, Bar.selRow(s).act, 30).cmds.at(-1), { cmd: "app_window", route: "agent/telemetry-8e02/alerts" });
  eq(M.step(m, Bar.cmdRow(s, "2").act, 30).cmds.at(-1), { cmd: "app_window", route: "project/storefront-5c1d" });
  // an editor on a project's folder puts it first; an excluded app (app null) knows nothing
  m = M.step(m, { ev: "app_front", app: "Code", bundle: "com.microsoft.VSCode", path: "/Users/you/storefront/src/cart.ts" }, 40).m;
  eq(Bar.spec(M.view(m, 50, Fake.T0)).sections[2].rows.map((r) => r.t), ["storefront", "telemetry"]);
  m = M.step(m, { ev: "app_front", app: null }, 60).m;
  eq(Bar.spec(M.view(m, 70, Fake.T0)).sections[2].rows.map((r) => r.sub), ["/Users/you/storefront  ·  main · 5 agents", "/Users/you/telemetry  ·  main · 2 agents"]);
  // a project's name finds it and its agents ("eng" in v9: engine's agents, then engine)
  m = M.step(m, { ev: "ui_spot_type", text: "store" }, 80).m;
  eq(Bar.spec(M.view(m, 90, Fake.T0)).sections[0].rows.map((r) => r.t), ["stock", "wallet", "storefront"]);
  // main's card is bise's on ambient surfaces, in the spotlight and the dropdown; an agent keeps its name (ambient m_8725)
  const both = [{ id: "c-main", agent: "main", project: "telemetry-8e02", title: "compaction at 03:00?", options: ["move", "leave"] }, cards[0]];
  let mm = M.step(M.init(), { ev: "state", agents, cards: both, projects }, 0).m;
  eq(Bar.spec(M.view(M.step(mm, { ev: "app_key", key: "space" }, 10).m, 20, Fake.T0)).sections[0].rows.map((r) => r.t).sort(), ["alerts", "bise"]);
  eq(Bar.spec(M.view(M.step(mm, { ev: "app_menu", on: true }, 10).m, 20)).sections[0].rows.map((r) => r.t).sort(), ["alerts", "bise"]);
});
law("desktop S8 route line (v9): after a talk, '→ telemetry · main' for 2 s; tab = the next project (route_correct), fn esc = cancel (route_cancel); then bise's usual 'working'", () => {
  const projects = [{ project: "home", name: "bise", home: true, order: 0 }, { project: "storefront-5c1d", name: "storefront", order: 1 },
    { project: "telemetry-8e02", name: "telemetry", order: 2 }, { project: "engine-31aa", name: "engine", order: 3 }];
  let m = M.step(M.init(), { ev: "state", agents: [], cards: [], projects }, 0).m;
  m = M.step(M.step(m, { ev: "app_fn", state: "down", key: "fn" }, 10).m, { ev: "app_fn", state: "up", key: "fn" }, 20).m;
  m = M.step(M.step(m, { ev: "sent", voice: true }, 30).m, { ev: "phase", phase: "sending" }, 40).m;
  // the core's deadline is its wall clock: 1.8 s left when it came (at_wall, stamped by ui.js)
  // bise-proto's route (amb-hub eed00361): project = the home hub's id, rid, name
  m = M.step(m, { ev: "route", project: "bise-home-00000000", rid: "r7", to: "telemetry-8e02", name: "telemetry", text: "pourquoi le p99 monte à 14 h", correct_until_ms: 1800, why: "telemetry is the ingest", at_wall: 0 }, 50).m;
  let v = M.view(m, 60), s = Bar.spec(v);
  eq([v.state, v.mood, v.content, s.head.line.text], ["route", "work", { kind: "got", route: true }, "→ telemetry · main"]);
  eq(s.foot.left.map((i) => `${i.keys.join(" ")} ${i.w}`), ["tab another project", "fn esc cancel"]);
  // tab: the next project in order (wraps), the line follows
  let r = M.step(m, { ev: "app_key", key: "tab" }, 100);
  eq([r.cmds, Bar.spec(M.view(r.m, 110)).head.line.text], [[{ cmd: "route_correct", project: "bise-home-00000000", rid: "r7", to: "engine-31aa" }], "→ engine · main"]);
  r = M.step(r.m, { ev: "app_key", key: "tab" }, 120);
  eq(r.cmds, [{ cmd: "route_correct", project: "bise-home-00000000", rid: "r7", to: "storefront-5c1d" }]);
  // the hub's route again with the same rid is that correction: its name, the same deadline
  const fixed = M.step(r.m, { ev: "route", project: "bise-home-00000000", rid: "r7", to: "storefront-5c1d", name: "storefront", text: "…", correct_until_ms: 1800, at_wall: 500 }, 130).m;
  eq([Bar.spec(M.view(fixed, 140)).head.line.text, fixed.route.until], ["→ storefront · main", r.m.route.until]);
  // route_done ends the line (sent or cancelled); another rid's doesn't
  eq(M.step(fixed, { ev: "route_done", project: "bise-home-00000000", rid: "r6", state: "sent", to: "x" }, 150).m.route.rid, "r7");
  eq(M.view(M.step(fixed, { ev: "route_done", project: "bise-home-00000000", rid: "r7", state: "sent", to: "storefront-5c1d", xid: "x1" }, 150).m, 160).state, "working");
  // fn esc: cancelled, the line goes
  const c = M.step(m, { ev: "app_key", key: "esc" }, 100);
  eq([c.cmds, M.view(c.m, 110).state], [[{ cmd: "route_cancel", project: "bise-home-00000000", rid: "r7" }], "working"]);
  // after the deadline: no line, tab and esc are the usual keys again
  eq([M.view(m, 1900).state, M.step(m, { ev: "app_key", key: "tab" }, 1900).cmds], ["working", []]);
  // amb-hub's error for a tab / fn esc after the route ended (56087c96): plain words; a wrong target keeps its text
  // (bise is working on his words here, so the line is the working glass's sub line)
  const err = (text, cmd = "route_correct") => M.view(M.step(m, { ev: "error", project: "bise-home-00000000", cmd, text }, 1950).m, 1960);
  eq([err("route r7 already went or was cancelled").sub, err("route r7 already went or was cancelled", "route_cancel").sub], ["too late: your words already went.", "too late: your words already went."]);
  eq(err("no project named nope (sb project list)").sub, "no project named nope (sb project list)");
  // a followed job's agent: '→ storefront · stock · following'
  m = M.step(m, { ev: "route", project: "home", to: "storefront-5c1d", agent: "stock", followed: true, text: "relance le replay", correct_until_ms: 2000, at_wall: 0 }, 2000).m;
  eq(Bar.spec(M.view(m, 2010)).head.line.text, "→ storefront · stock · following");
});
law("round 10: ⌘D follows the selected agent (again to stop), ⌘O opens it in the terminal; fn space with no agents stays round 9's 700 px field", () => {
  let m = M.step(R10(), { ev: "app_key", key: "a" }, 10).m;
  const s = Bar.spec(v10(m));
  const fol = s.foot.left.find((x) => x.keys.join(" ") === "⌘ D"), term = s.foot.left.find((x) => x.keys.join(" ") === "⌘ O");
  let r = M.step(m, fol.act, 20);
  eq(r.cmds, [{ cmd: "follow", agent: "cookies", on: true }]);
  eq(Bar.spec(v10(r.m)).foot.left.find((x) => x.keys.join(" ") === "⌘ D").w, "following");
  eq(M.step(r.m, fol.act, 30).cmds, [{ cmd: "follow", agent: "cookies", on: false }]);
  eq(M.step(m, term.act, 40).cmds, [{ cmd: "open_terminal", agent: "cookies" }]);
  // dark-mode is followed already (state.followed): ⌘D stops it
  eq(M.step(m, { ev: "ui_follow", agent: "dark-mode" }, 50).cmds, [{ cmd: "follow", agent: "dark-mode", on: false }]);
  const s0 = Bar.spec(M.view(M.step(M.init(), { ev: "app_key", key: "space" }, 0).m, 10));
  eq([s0.w, s0.preview], [undefined, undefined]);
  // an agent's sent (amb-core 67ba0b31: the panel's send) is not main's: the bar stays as it was
  const before = R10();
  eq(M.step(before, { ev: "sent", agent: "perf", mode: "now" }, 60).m, before);
  // fn a with no agents says what to do next (ambient m_7036)
  eq(Bar.spec(M.view(M.step(M.init(), { ev: "app_key", key: "a" }, 0).m, 10)).text, { s: "no agents yet. type what you want done, tab starts one.", dim: true });
});

// ---- the user's bugs, web side (lead m_8094)
const talked = (m, t, text = "") => {
  m = M.step(m, { ev: "app_fn", state: "down" }, t).m;
  if (text) m = M.step(m, { ev: "heard", text, final: false }, t + 100).m;
  return M.step(m, { ev: "app_fn", state: "up" }, t + 500).m;
};
law("bug 2/4: a talk the core heard nothing in never ends in 'can't reach bise': an empty final heard, or idle/cancelled without 'sent', says 'i didn't hear anything.' and drops it; any word from the core keeps it off the offline view; a new talk clears a stale one", () => {
  const up = M.step(M.init(), { ev: "hub", up: true }, 0).m;
  // the core's final heard is empty
  let m = M.step(talked(up, 100), { ev: "heard", text: "", final: true }, 900).m;
  let v = M.view(m, 900);
  eq([v.text, m.pending, v.mine], ["i didn't hear anything.", null, undefined]);
  assert.notEqual(M.view(m, 6000).state, "offline");
  // idle (or cancelled) without 'sent'
  for (const phase of ["idle", "cancelled"]) {
    m = M.step(talked(up, 100, "hello"), { ev: "phase", phase }, 900).m;
    eq([M.view(m, 950).text, m.pending, M.view(m, 6000).state !== "offline"], ["i didn't hear anything.", null, true]);
  }
  // the core is there (sending, working) but 'sent' never came: no 'can't reach' either
  m = M.step(talked(up, 100, "hello"), { ev: "phase", phase: "sending" }, 900).m;
  assert.notEqual(M.view(m, 6000).state, "offline");
  // nothing at all from the core for 3 s: can't reach bise, as before
  m = talked(up, 100, "hello");
  assert.equal(M.view(m, 3700).state, "offline");
  // the next talk never carries it
  m = M.step(m, { ev: "app_fn", state: "down" }, 4000).m;
  eq([m.pending, M.view(m, 8000).state === "offline"], [null, false]);
});
law("spotlight (bug, lead m_8094 (2)): a close (esc or send) empties the field; ↑ in an empty field edits the last message; with text, ↓ moves to 'start an agent' and ⏎ runs it", () => {
  let m = M.step(M.init(), { ev: "app_key", key: "space" }, 0).m;
  m = M.step(m, { ev: "ui_spot_type", text: "plan the offsite" }, 10).m;
  m = M.step(m, { ev: "app_key", key: "esc", local: true }, 20).m;
  for (let i = 0; i < 5; i++) m = M.step(M.step(m, { ev: "app_key", key: "space" }, 30 + i).m, { ev: "app_key", key: "esc", local: true }, 31 + i).m;
  m = M.step(m, { ev: "app_key", key: "space" }, 50).m;
  eq([m.spotText, Bar.spec(M.view(m, 60)).head.input.text], ["", ""]);
  m = M.step(m, { ev: "ui_spot_type", text: "plan the offsite" }, 70).m;
  const r = M.step(m, { ev: "ui_spot_send" }, 80);
  eq([r.m.spotText, r.m.lastSent], ["", "plan the offsite"]);
  m = M.step(r.m, { ev: "app_key", key: "space" }, 90).m;
  eq(M.view(m, 95).spot.text, "");
  m = M.step(m, { ev: "ui_spot_last" }, 100).m;
  eq(M.view(m, 110).spot.text, "plan the offsite");
  let s = Bar.spec(M.view(m, 110));
  eq(Bar.selRow(s).qa, "ask-main");
  m = M.step(m, { ev: "app_key", key: "down", local: true, n: Bar.selectable(s).length }, 120).m;
  s = Bar.spec(M.view(m, 130));
  eq(Bar.selRow(s).act, { ev: "ui_spot_tab", text: "plan the offsite" });
  // a said message is the last one too
  m = M.step(talked(M.init(), 200, "book the train"), { ev: "sent", voice: true }, 900).m;
  assert.equal(m.lastSent, "book the train");
});
law("hints (lead m_8094 (3), amb-mac m_8112): one source for which keys a card shows: the app's app_focused (sent exactly when the bar takes or gives back the keys), never while hidden", () => {
  const card = { id: "c9", kind: "question", agent: "cookies", text: "keep it?", options: [{ n: 1, label: "yes" }, { n: 2, label: "no" }] };
  let m = M.step(M.init(), { ev: "state", agents: Fake.AGENTS, cards: [] }, 0).m;
  // he had the spotlight (the keys), closed it: the page sends app_focus off, the app answers
  // app_focused off; then a card is pushed
  m = M.step(M.step(m, { ev: "app_key", key: "space" }, 10).m, { ev: "app_focused", on: true }, 20).m;
  const closed = M.step(m, { ev: "app_key", key: "esc", local: true }, 30);
  assert.ok(closed.cmds.some((c) => c.cmd === "app_focus" && c.on === false));
  m = M.step(closed.m, { ev: "app_focused", on: false }, 35).m;
  m = M.step(m, { ev: "state", agents: Fake.AGENTS, cards: [card] }, 40).m;
  let v = M.view(m, 50);
  eq([v.state, v.focused], ["needs", false]);
  const keys = (s) => s.foot.left.map((i) => i.keys.join(" "));
  eq(keys(Bar.spec(v)), ["fn 1 – 2", "fn ⏎", "fn esc"]);
  // he clicked it: the app gives the keys for this card: plain keys
  m = M.step(m, { ev: "app_focused", on: true }, 60).m;
  v = M.view(m, 70);
  eq([v.focused, keys(Bar.spec(v))], [true, ["1 – 2", "↑ ↓", "esc"]]);
  // hidden: no keys reach it
  m = M.step(m, { ev: "app_hidden", on: true }, 80).m;
  assert.equal(M.view(m, 90).focused, false);
  // a card that comes while the bar has the keys shows the plain keys that reach it
  let k = M.step(M.step(M.init(), { ev: "app_key", key: "i" }, 0).m, { ev: "app_focused", on: true }, 10).m;
  k = M.step(M.step(k, { ev: "app_key", key: "esc", local: true }, 20).m, { ev: "state", agents: Fake.AGENTS, cards: [card] }, 30).m;
  eq([M.view(k, 40).state, keys(Bar.spec(M.view(k, 40)))], ["needs", ["1 – 2", "↑ ↓", "esc"]]);
});
law("can't reach bise names the bise the app runs (amb-mac m_8082: app_bise {path}); none found: no terminal row", () => {
  let m = M.init(); for (const [t, ev] of sceneEvents("offline")) m = M.step(m, ev, t).m;
  const term = (mm) => Bar.spec(M.view(mm, 3800)).sections[0].rows.find((r) => r.qa === "terminal");
  eq([term(m).t, term(m).sub], ["start bise in a terminal", "runs: bise"]);
  const at = M.step(m, { ev: "app_bise", path: "/Users/gabriel/.local/bin/bise" }, 3700).m;
  eq([term(at).t, term(at).sub], ["start ~/.local/bin/bise in a terminal", "runs: ~/.local/bin/bise"]);
  assert.equal(term(M.step(m, { ev: "app_bise", path: null }, 3700).m), undefined);
});

// ---- fix round 2 (lead m_8108)
law("round 2 (2): can't reach bise, trying again (hub down) offers the start row naming app_bise.path; null: no row", () => {
  let m = M.step(M.init(), { ev: "hub", up: true }, 0).m;
  m = M.step(m, { ev: "hub", up: false }, 10).m;
  let s = Bar.spec(M.view(m, 20));
  eq([s.kind, s.head.line.text, s.sections[0].rows[0].t, s.sections[0].rows[0].act], ["hub_down", "can't reach bise. trying again.", "start bise in a terminal", { ev: "ui_terminal" }]);
  s = Bar.spec(M.view(M.step(m, { ev: "app_bise", path: "/Users/g/.local/bin/bise" }, 15).m, 20));
  eq([s.sections[0].rows[0].t, s.foot.left[0].act], ["start ~/.local/bin/bise in a terminal", { ev: "ui_terminal" }]);
  assert.equal(Bar.spec(M.view(M.step(m, { ev: "app_bise", path: null }, 15).m, 20)).sections.length, 0);
  eq(M.step(m, { ev: "ui_terminal" }, 30).cmds, [{ cmd: "app_run_bise" }]);
});
law("round 2 (3)(5): no dead clicks: fn 0's agent rows open the side panel (⏎, space or a click), every '⏎' hint runs what ⏎ runs (agents, inbox, spotlight)", () => {
  const cards = [Fake.CARD];
  let m = M.step(M.init(), { ev: "state", agents: Fake.ROSTER, cards }, 0).m;
  m = M.step(m, { ev: "app_key", key: "0" }, 10).m;
  let s = Bar.spec(M.view(m, 20, Fake.T0));
  const ag = s.sections.flatMap((x) => x.rows).filter((r) => r.qa && r.qa.startsWith("agent-"));
  assert.ok(ag.length >= 6);
  eq(ag[0].act.ev, "ui_agent");
  eq(M.step(m, ag[0].act, 30).cmds.at(-1), { cmd: "app_window", route: `agent/home/${ag[0].act.agent}` });
  // ⏎ hint = the selected row (the card first), then an agent row once ↓ reaches it
  eq(s.foot.left.find((i) => i.keys.join("") === "⏎").act, { ev: "ui_card", card: "c1" });
  m = M.step(m, { ev: "app_key", key: "down", local: true, n: Bar.selectable(s).length }, 40).m;
  s = Bar.spec(M.view(m, 50, Fake.T0));
  eq(s.foot.left.find((i) => i.keys.join("") === "⏎").act, Bar.selRow(s).act);
  eq(Bar.selRow(s).act.ev, "ui_agent");
  // inbox: the ⏎ hint opens the selected card
  const ib = Bar.spec(M.view(M.step(M.step(M.init(), { ev: "state", agents: [], cards }, 0).m, { ev: "app_key", key: "i" }, 10).m, 20));
  eq(ib.foot.left.find((i) => i.keys.join("") === "⏎").act, { ev: "ui_card", card: "c1" });
  // spotlight: the ⏎ hint sends (with text: the selected row)
  let sp = M.step(M.init(), { ev: "app_key", key: "space" }, 0).m;
  eq(Bar.spec(M.view(sp, 10)).foot.left[0].act, { ev: "ui_spot_send" });
  sp = M.step(sp, { ev: "ui_spot_type", text: "hello main" }, 20).m;
  eq(Bar.spec(M.view(sp, 30)).foot.left[0].act, { ev: "ui_spot_send", text: "hello main" });
});
law("round 2 (4): in the inbox ↑ moves up a row (never leaves the list for the pushed card)", () => {
  const three = ["a", "b", "c"].map((id) => ({ id, agent: "ops", text: `q ${id}?`, options: [{ n: 1, label: "yes" }] }));
  let m = M.step(M.step(M.init(), { ev: "state", agents: [], cards: three }, 0).m, { ev: "app_key", key: "i" }, 10).m;
  for (const k of ["down", "down", "up"]) m = M.step(m, { ev: "app_key", key: k, local: true, n: 3 }, 20).m;
  const v = M.view(m, 30);
  eq([v.state, Bar.selRow(Bar.spec(v)).qa], ["inbox", "card-b"]);
  m = M.step(M.step(m, { ev: "app_key", key: "up", local: true, n: 3 }, 40).m, { ev: "app_key", key: "up", local: true, n: 3 }, 50).m;
  eq([M.view(m, 60).state, Bar.selRow(Bar.spec(M.view(m, 60))).qa], ["inbox", "card-a"]);
});
law("round 2 (6): main's answer and a card never hide each other: a pane he opened stays over main's turn; after main speaks a waiting card shows at once (no 4 s behind the line); fn 0's 'bise said' brings the answer back", () => {
  const card = { id: "q", agent: "ops", text: "ship it?", options: [{ n: 1, label: "yes" }, { n: 2, label: "no" }] };
  let m = M.step(M.init(), { ev: "state", agents: [], cards: [] }, 0).m;
  m = M.step(m, { ev: "sent", text: "hi", voice: false }, 10).m;
  m = M.step(m, { ev: "phase", phase: "working" }, 20).m;
  // fn i during main's turn: the inbox, not the working line
  assert.equal(M.view(M.step(m, { ev: "app_key", key: "i" }, 30).m, 40).state, "inbox");
  m = M.step(m, { ev: "main", text: "on it. the banner is half the size now.", turn: 1 }, 50).m;
  m = M.step(M.step(m, { ev: "phase", phase: "speaking" }, 60).m, { ev: "state", agents: [], cards: [card] }, 70).m;
  assert.equal(M.view(m, 80).state, "speaking");            // his turn while main talks
  m = M.step(m, { ev: "phase", phase: "done" }, 100).m;
  assert.equal(M.view(m, 110).state, "needs");              // then the card, at once
  // the answer is reachable from fn 0
  m = M.step(m, { ev: "app_key", key: "0" }, 200).m;
  const row = Bar.spec(M.view(m, 210)).sections.flatMap((x) => x.rows).find((r) => r.qa === "answer");
  eq(row.t, "on it.");
  m = M.step(m, row.act, 220).m;
  const v = M.view(m, 230);
  eq([v.state, v.words.list.join(" ")], ["end", "on it. the banner is half the size now."]);
  assert.notEqual(M.view(m, 230 + M.T.endOpen).state, "end");
});

law("desktop S8: ⏎ on an agent opens its thread in bise's window (app_window with amb-win's route), its project named on the row; fn ⏎ on a card does the same", () => {
  const agents = [{ name: "alerts", status: "waiting", title: "compaction at 03:00?", project: "telemetry-8e02", project_name: "telemetry" },
    { name: "alerts", status: "idle", title: "old alerts", project: "storefront-5c1d", project_name: "storefront" }];
  const cards = [{ id: "c-alerts", agent: "alerts", project: "telemetry-8e02", text: "passer la compaction à 03:00 ?", options: ["move it to 03:00", "leave it"] }];
  let m = M.step(M.init(), { ev: "state", agents, cards }, 0).m;
  m = M.step(m, { ev: "app_key", key: "0" }, 10).m;
  const rows = Bar.spec(M.view(m, 20, Fake.T0)).sections.flatMap((x) => x.rows).filter((r) => r.qa && r.qa.startsWith("agent-"));
  eq(rows.map((r) => [r.t, r.p, r.act]), [["alerts", "telemetry", { ev: "ui_agent", agent: "alerts", project: "telemetry-8e02" }],
    ["alerts", "storefront", { ev: "ui_agent", agent: "alerts", project: "storefront-5c1d" }]]);
  // two agents of the same name in two projects: the row's project picks the right thread
  eq(M.step(m, rows[1].act, 30).cmds.at(-1), { cmd: "app_window", route: "agent/storefront-5c1d/alerts" });
  // a card (no page): fn ⏎ opens the thread it waits in; a project's main opens its project
  m = M.step(M.init(), { ev: "state", agents, cards }, 0).m;
  eq(M.step(m, { ev: "app_key", key: "enter" }, 10).cmds.at(-1), { cmd: "app_window", route: "agent/telemetry-8e02/alerts" });
  m = M.step(M.init(), { ev: "state", agents: [], cards: [{ ...cards[0], agent: "main" }] }, 0).m;
  eq(M.step(m, { ev: "ui_open_card", card: "c-alerts" }, 10).cmds.at(-1), { cmd: "app_window", route: "project/telemetry-8e02" });
});

law("desktop S8 menu-bar dropdown (v9): app_menu on opens it under the pearl: '3 at work · 2 waiting for you' (no calm line while something waits), what waits (fn 1 on the first), followed jobs with progress, open bise ⌘0, quiet for 1 h, settings… ⌘,; off leaves", () => {
  const projects = [{ project: "telemetry-8e02", name: "telemetry", order: 1 }, { project: "storefront-5c1d", name: "storefront", order: 2 }];
  const agents = [{ name: "alerts", status: "waiting", project: "telemetry-8e02" }, { name: "stock", status: "working", project: "storefront-5c1d", followed: true,
    job: { label: "flash sale replay", step: 6200, steps: 10000, unit: "orders" } }, { name: "search", status: "working", project: "storefront-5c1d" }];
  const cards = [{ id: "c1", agent: "alerts", project: "telemetry-8e02", title: "compaction at 03:00?", options: ["move", "leave"] },
    { id: "c2", agent: "search", project: "storefront-5c1d", title: "reindex tonight?", options: ["yes", "no"] }];
  let m = M.step(M.init(), { ev: "state", agents, cards, projects }, 0).m;
  m = M.step(m, { ev: "app_menu", on: true }, 10).m;
  const v = M.view(m, 20), s = Bar.spec(v);
  eq([v.state, v.content.kind, s.head.lab.acc, s.text], ["menu", "open", "3 at work · 2 waiting for you", null]);
  eq(s.sections.map((x) => x.rows.map((r) => [r.t, r.p || "", r.sub || "", r.right && r.right.keys ? r.right.keys.join("") : ""])), [
    [["alerts", "telemetry", "compaction at 03:00?", "fn1"], ["search", "storefront", "reindex tonight?", ""]],
    [["storefront · stock · following", "", "flash sale replay · 6 200 / 10 000 orders", ""]],
    [["open bise", "", "", "⌘0"], ["quiet for 1 h", "", "", ""], ["settings…", "", "", "⌘,"]],
    [["quit bise ambient", "", "", "⌘Q"]]]);
  const row = (qa) => s.sections.flatMap((x) => x.rows).find((r) => r.qa === qa);
  eq(M.step(m, row("open-bise").act, 30).cmds.at(-1), { cmd: "app_window", route: "bise" });
  eq(M.step(m, row("quiet-hour").act, 30).cmds, [{ cmd: "app_quiet_hour", on: true }]);
  eq(M.step(m, row("job-stock").act, 30).cmds.at(-1), { cmd: "app_window", route: "agent/storefront-5c1d/stock" });
  eq(M.step(m, row("settings").act, 30).m.pane, "settings");
  eq(M.step(m, row("quit").act, 30).cmds, [{ cmd: "app_quit" }]);
  // paused: 'quiet until 15:21' said (not selectable), then 'resume' ends it (ambient m_8653 (3)); off leaves the pane
  const q = M.step(m, { ev: "app_quiet", on: true, why: "paused", until_ms: new Date(2026, 9, 3, 15, 21).getTime() }, 40).m;
  const qs = Bar.spec(M.view(q, 50)).sections[2].rows;
  eq(qs.map((r) => [r.t, !!r.fixed, !!r.act]), [["open bise", false, true], ["quiet until 15:21", true, false], ["resume", false, true], ["settings…", false, true]]);
  eq(M.step(q, qs[2].act, 60).cmds, [{ cmd: "app_quiet_hour", on: false }]);
  eq(M.step(m, { ev: "app_menu", on: false }, 70).m.pane, null);
  // nobody working, nothing waiting: no zero as a label (ambient m_8617 (3))
  const idle = M.step(M.step(M.init(), { ev: "state", agents: [], cards: [], projects }, 0).m, { ev: "app_menu", on: true }, 10).m;
  eq([Bar.spec(M.view(idle, 20)).head.lab.rest, Bar.spec(M.view(idle, 20)).text.s], ["nobody at work", "all quiet."]);
  // one waits: '1 waiting for you'; a failure says itself instead of the calm line (ambient m_8653 (1) (2))
  const one = M.step(M.step(M.init(), { ev: "state", agents: [agents[0]], cards: [cards[0]], projects }, 0).m, { ev: "app_menu", on: true }, 10).m;
  eq([Bar.spec(M.view(one, 20)).head.lab.acc, Bar.spec(M.view(one, 20)).text], ["1 at work · 1 waiting for you", null]);
});

law("desktop S8: app_anchor says where the bar sits (top, bottom, menu); the view carries it so the bar rises from the bottom", () => {
  let m = M.step(M.init(), { ev: "app_anchor", at: "bottom" }, 0).m;
  assert.equal(M.view(m, 10).anchor, "bottom");
  m = M.step(m, { ev: "app_anchor", at: "menu" }, 20).m;
  assert.equal(M.view(m, 30).anchor, "menu");
  assert.equal(M.view(M.step(m, { ev: "app_anchor", at: "side" }, 40).m, 50).anchor, null);
});

law("rows are one plain line (lead m_8547): an agent's line loses the hub's wrappers and markup, keeps its words, its first sentence, an ellipsis when long", () => {
  eq(Wd.oneLine('ack: <agent_message from="main" id="m_1">on it. i\'ll profile signup first</agent_message>'), "ack: on it.");
  eq(Wd.oneLine("**fixed** the `login` test\nand more"), "fixed the login test and more");
  assert.ok(Wd.oneLine("x".repeat(200)).endsWith("…"));
  const agents = [{ name: "perf", status: "working", title: 'ack: <agent_message from="main">profiling signup. then the fix</agent_message>', project: "p1" }];
  let m = M.step(M.init(), { ev: "state", agents, cards: [], projects: [{ project: "p1", name: "acme", order: 1 }] }, 0).m;
  m = M.step(m, { ev: "app_key", key: "space" }, 10).m;
  eq(Bar.spec(M.view(m, 20, Fake.T0)).sections.find((x) => x.label === "at work").rows[0].sub, "ack: profiling signup.");
});

// the desktop window's laws (window/check-win.mjs) run with the capsule's
{ const w = (await import("./window/check-win.mjs")).results(); pass += w.pass; fail += w.fail; }
{ const w = (await import("./window/check-setup.mjs")).results(); pass += w.pass; fail += w.fail; }
// and S7's screens (window/check-s7.mjs: review, artifacts, environments)
{ const w = (await import("./window/check-s7.mjs")).results(); pass += w.pass; fail += w.fail; }

console.log(`${fail ? "✗" : "✓"} ambient web: ${pass} passed${fail ? `, ${fail} failed` : ""}`);
process.exit(fail ? 1 : 0);
