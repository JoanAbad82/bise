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
for (const f of ["words.js", "face.js", "model.js", "fakecore.js", "../kit/notes.js"]) vm.runInContext(readFileSync(join(here, f), "utf8"), ctx, { filename: f });
const { AmbWords: Wd, AmbFace: F, AmbModel: M, AmbFake: Fake, BiseNotes } = ctx;
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
  assert.equal(r.view(k + 5000).text, null);
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
law("a page ready: `weekly update is ready · fn + o`; fn + o opens it (app_open_url); fn + 0 lists for you", () => {
  const evs = sceneEvents("pages");
  const t0 = evs.find(([, e]) => e.ev === "page")[1].at_ms;
  let m = M.init();
  for (const [t, ev] of evs.filter(([t]) => t < 3500)) m = M.step(m, ev, t).m;
  const v = M.view(m, 1000, t0 + 1000);
  assert.equal(v.text, "weekly update is ready · fn + o");
  const o = M.step(m, { ev: "app_key", key: "o" }, 3500);
  eq(o.cmds, [{ cmd: "app_open_url", url: "http://127.0.0.1:47123/p/weekly-update", page: "weekly-update" }]);
  const a = M.view(M.step(o.m, { ev: "app_key", key: "0" }, 5000).m, 5000, t0 + 5000);
  eq(a.forYou.pages.map((p) => [p.name, p.meta]), [["weekly update", "v1 · just now"], ["which gray wins?", "v2 · 40 min ago"]]);
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
  assert.equal(M.view(m, 60).text, "weekly update is ready · fn + o");
  eq(M.step(M.init(), { ev: "app_key", key: "o" }, 0).cmds, []);   // no page: nothing
});
law("in a call or a meeting (app_quiet), only urgent cards ask; the rest wait in the inbox; off, they ask again", () => {
  const cards = [{ id: "c1", agent: "cookies", text: "keep the banner?", options: ["yes", "no"] }, { id: "c2", agent: "deploy", text: "ship it now?", options: ["yes", "no"], urgent: true }];
  let m = M.step(M.init(), { ev: "state", agents: [], cards, pages: [] }, 0).m;
  m = M.step(m, { ev: "app_quiet", on: true, why: "meeting" }, 10).m;
  let v = M.view(m, 20);
  assert.equal(v.text, "1 waiting for you"); assert.equal(v.note.agent, "deploy"); assert.equal(v.note.more, 0);
  m = M.step(m, { ev: "state", agents: [], cards: [cards[0]], pages: [] }, 30).m;
  v = M.view(m, 40);
  assert.equal(v.state, "idle"); assert.equal(v.note, null); assert.equal(v.need, false);
  assert.equal(M.view(M.step(m, { ev: "app_key", key: "i" }, 50).m, 60).inbox.length, 1);   // still in the inbox
  m = M.step(m, { ev: "app_quiet", on: false, why: "" }, 70).m;
  assert.equal(M.view(m, 80).note.agent, "cookies");
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
law("a card asked from a page (card.page): the glass says `fn ⏎ open it`; fn + ⏎ or a click opens the page at the question", () => {
  const card = { id: "c1", agent: "launch-recap", text: "post now or wait?", options: ["post now", "wait"], page: { id: "recap", block: "q1", url: "http://127.0.0.1:47123/p/recap#q1" } };
  let m = M.step(M.init(), { ev: "state", agents: [], cards: [card, { id: "c2", agent: "x", text: "y", options: [] }], pages: [] }, 0).m;
  assert.equal(M.view(m, 10).note.open, "fn ⏎ open it");
  const open = [{ cmd: "app_open_url", url: "http://127.0.0.1:47123/p/recap#q1", page: "recap" }];
  eq(M.step(m, { ev: "app_key", key: "enter" }, 20).cmds, open);
  eq(M.step(m, { ev: "ui_open_card", card: "c1" }, 20).cmds, open);
  eq(M.step(m, { ev: "ui_open_card", card: "c2" }, 20).cmds, []);   // no page: nothing
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
  // a line: a key's answer, done, failed, a page ready
  assert.equal(M.view(M.step(m, { ev: "page", id: "wu", title: "weekly update", version: 1, url: "u", at_ms: 1, state: "ready" }, 10).m, 20).content.kind, "line");
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
law("the morning page (app_morning): 'good morning. your page is open   fn o' before 11:00 (greet), 'your page is open   fn o' after; fn + o opens it", () => {
  let m = M.step(M.init(), { ev: "state", agents: [], cards: [], pages: [] }, 0).m;
  assert.equal(M.view(M.step(m, { ev: "app_morning", id: "x", title: "t", url: "u", greet: true }, 10).m, 20).text, "good morning. your page is open   fn o");
  m = M.step(m, { ev: "app_morning", id: "morning-0612", title: "your morning", url: "http://127.0.0.1:47123/p/morning-0612", greet: false }, 10).m;
  const v = M.view(m, 20);
  assert.equal(v.text, "your page is open   fn o"); assert.equal(v.content.kind, "line");
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
  m.react("k1", "t1", null, "", 1, 6);                          // unticked
  eq(m.drafts().map((n) => n.kind), ["drop", "pick"]);
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
