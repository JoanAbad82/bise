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
for (const f of ["words.js", "face.js", "model.js", "fakecore.js"]) vm.runInContext(readFileSync(join(here, f), "utf8"), ctx, { filename: f });
const { AmbWords: Wd, AmbFace: F, AmbModel: M, AmbFake: Fake } = ctx;
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
  assert.equal(v.size, "small"); assert.equal(v.pose, "rest"); assert.equal(v.text, W.idle); assert.equal(v.need, false);
});
law("all quiet: hold fn to talk", () => {
  assert.equal(run(sceneEvents("quiet"), [100]).view(100).text, W.quiet);
});
law("hold fn: open, the sphere follows your voice, live words, `main sees …`, the edge", () => {
  const s = sweep("talk");
  const v = s.views[2000];
  assert.equal(v.state, "listening"); assert.equal(v.size, "open");
  assert.equal(v.pose, "talk"); assert.ok(v.lvl > 0);
  assert.equal(v.label.text, W.listening); assert.equal(v.label.rest, W.letGo);
  eq(v.sees, { head: "main sees Chrome · localhost:4801", tail: "/settings" });
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
  eq(Wd.seesParts("Chrome", "localhost:4801/settings/appearance"), { head: "main sees Chrome · localhost:4801", tail: "/settings/appearance" });
  eq(Wd.seesParts("Chrome", "https://github.com/acme/web/pull/482"), { head: "main sees Chrome · https://github.com", tail: "/acme/web/pull/482" });
  eq(Wd.seesParts("Ghostty", "~/acme — bise"), { head: "main sees Ghostty · ", tail: "~/acme — bise" });
  eq(Wd.seesParts("Finder", ""), { head: "main sees Finder", tail: "" });
});
law("let go: `:* got it.`, then `on it.` under the main label, the * turning", () => {
  const evs = sceneEvents("talk");
  const sent = evs.find(([, e]) => e.ev === "sent")[0];
  const r = run(evs, [sent + 100, sent + 1200]);
  const a = r.view(sent + 100), b = r.view(sent + 1200);
  assert.equal(a.label.text, "main"); assert.equal(a.text, W.got); assert.equal(a.pose, "think"); assert.equal(a.size, "open");
  assert.equal(b.text, W.onShort);
  assert.equal(b.sub, "starting dark-mode");
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
law("needs you: small, `? 1 waiting for you`, the glass under it names the agent with `1 yes` `2 no` and the hint, the sphere breathing", () => {
  const v = run(sceneEvents("needs-wait"), [1000]).view(1000);
  assert.equal(v.size, "small"); assert.equal(v.glyph, "?"); assert.equal(v.text, "1 waiting for you"); assert.ok(v.need);
  assert.equal(v.note.title, "cookies needs you");
  assert.equal(v.note.text, "keep the banner on mobile?");
  eq(v.note.options.map((o) => o.label), W.needsOpts);
  assert.equal(v.note.hint, W.needsHint);
});
law("answered: fn + 1 sends the answer, `✓ cookies has it: yes.` with the kiss, the glass goes", () => {
  const evs = sceneEvents("needs");
  const k = evs.find(([, e]) => e.ev === "app_key")[0];
  const r = run(evs, [k + 100, k + 3000, k + 5000]);
  eq(r.cmds.map(({ t, ...c }) => c), [{ cmd: "answer", card: "c1", reply: "1" }]);
  const v = r.view(k + 100);
  assert.equal(v.glyph, "✓"); assert.equal(v.text, "cookies has it: yes."); assert.equal(v.pose, "kiss"); assert.equal(v.note, null);
  assert.equal(r.view(k + 5000).text, W.idle);
});
law("a click on an option answers the same", () => {
  let m = M.init();
  m = M.step(m, { ev: "state", agents: Fake.AGENTS, cards: [Fake.CARD] }, 0).m;
  const r = M.step(m, { ev: "ui_option", card: "c1", i: 1 }, 10);
  eq([...r.cmds], [{ cmd: "answer", card: "c1", reply: "2" }]);
  assert.equal(M.view(r.m, 20).text, "cookies has it: no.");
});
law("done: `✓ perf is done.` with the kiss, not the report; 8 s, then the count line", () => {
  const r = run(sceneEvents("done"), [1000, 1500, 8800, 9000]);
  assert.equal(r.view(1000).glyph, "✓"); assert.equal(r.view(1000).text, "perf is done."); assert.equal(r.view(1000).pose, "kiss");
  assert.equal(r.view(1500).pose, "kiss");
  assert.equal(r.view(8800).text, "perf is done.");
  assert.equal(r.view(9000).text, Wd.idleLine(2));
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
  assert.equal(by.perf.glyph, "✓"); assert.equal(by.perf.what, "profiling signup", "its task line, never the report");
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
  assert.equal(M.view(r.m, 50).text, W.got);
});
law("the spotlight's key bar shows `tab start an agent` only with text; tab asks main to start one", () => {
  let r = M.step(M.init(), { ev: "app_key", key: "space" }, 0);
  eq(M.view(r.m, 1).spot.keys, [["⏎", "send to main"], ["esc", "close"]]);
  r = M.step(r.m, { ev: "ui_spot_type", text: "a csv importer" }, 2);
  eq(M.view(r.m, 3).spot.keys, [["⏎", "send to main"], ["tab", "start an agent"], ["esc", "close"]]);
  r = M.step(r.m, { ev: "ui_spot_tab" }, 4);
  eq(r.cmds, [{ cmd: "app_focus", on: false }, { cmd: "send", text: "start an agent: a csv importer" }]);
});
law("the words ambient and designer signed (m_4645, m_4648)", () => {
  assert.equal(W.hubDown, "can't reach main. trying again.");
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
law("not now: the refused path, sent to the app", () => {
  let r = M.step(M.init(), { ev: "app_perm", perm: "mic", state: "ask" }, 0);
  r = M.step(r.m, { ev: "ui_perm", perm: "mic", do: "not_now" }, 10);
  eq(r.cmds, [{ cmd: "app_perm", perm: "mic", do: "not_now" }]);
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
  assert.equal(v.size, "small"); assert.equal(v.text, W.idle); assert.equal(v.words, null);
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
law("the hub lost: one line, then back", () => {
  const r = run(sceneEvents("hub"), [1000, 5500]);
  assert.equal(r.view(1000).text, W.hubDown); assert.equal(r.view(5500).text, W.idle);
});
law("reduced motion: every state is still (the pixel smile), no edge glow", () => {
  const s = sweep("still");
  for (const t of s.at) assert.ok(s.views[t].still && !s.views[t].edge.on, String(t));
});
law("unknown events and junk change nothing", () => {
  const m = M.init();
  for (const ev of [null, {}, { ev: "nope" }, { ev: "word", turn: 3, i: 2 }]) M.view(M.step(m, ev, 0).m, 1);
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
      if (v.note) seen.add("note");
      assert.ok(typeof flat(v) === "string");
    }
  }
  for (const st of ["idle", "listening", "working", "speaking", "end", "kiss", "needs", "note", "answered", "done", "failed", "agents", "inbox", "spotlight", "cancel", "error", "perm", "hub_down"]) {
    assert.ok(seen.has(st), `no scene shows ${st} (saw ${[...seen].join(", ")})`);
  }
});

console.log(`${fail ? "✗" : "✓"} ambient web: ${pass} passed${fail ? `, ${fail} failed` : ""}`);
process.exit(fail ? 1 : 0);
