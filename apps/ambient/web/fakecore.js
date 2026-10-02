// bise ambient · the fake core: every SPEC §2 state played from contract events (the core's and
// the app's app_*), so the capsule reviews in a plain browser (dev.html) and check.mjs can run
// every scene through the model. Pure scenes: each one is a list of [ms, event]; the player
// (browser only) times them and answers the capsule's cmds like the core would.
(function (root) {
  "use strict";
  const { W } = root.AmbWords;

  // a voice's level: syllables and pauses, deterministic in t (the mocks' voice())
  function voice(t, seed = 0) {
    if (t < 0) return 0;
    const syl = Math.max(0, Math.sin(t * 11 + seed) * 0.5 + 0.5) ** 1.4;
    const phrase = 0.55 + 0.45 * Math.sin(t * 2.1 + seed * 3.1);
    const pause = ((t * 0.9 + seed) % 2.6) > 2.25 ? 0.08 : 1;
    return Math.min(1, syl * phrase * pause * 1.1);
  }

  const AGENTS = [
    { name: "perf", status: "working", note: "profiling signup", report: "", working: true, turn_ms: 120000 },
    { name: "dark-mode", status: "working", note: "settings page first", report: "", working: true, turn_ms: 360000 },
    { name: "cookies", status: "working", note: "the banner, half the size", report: "", working: true, turn_ms: 240000 },
    { name: "release", status: "idle", note: "waits for the others", report: "", working: false, turn_ms: 60000 },
  ];
  const EMOJI = { name: "emoji-csv", status: "working", note: "it's always unicode", report: "", working: true, turn_ms: 540000 };
  // the core's cards: options [{n, label}], n the digit (a hard confirm skips 2)
  const CARD = { id: "c1", kind: "question", agent: "cookies", text: "keep the banner on mobile?", options: [{ n: 1, label: "yes" }, { n: 2, label: "no" }] };
  const CARD2 = { id: "c2", kind: "confirm", agent: "perf", text: "run the migration on the shared staging db?", options: [{ n: 1, label: "allow" }, { n: 3, label: "no" }] };
  const SAID = W.said || "dark mode for the settings page. and the cookie banner hides the buy button on mobile, make it half the size";
  const ANSWER = "dark-mode started. settings page first, then the rest. cookies is on the banner.";

  // before your turn: main hasn't started dark-mode and cookies yet
  const BEFORE = AGENTS.filter((a) => a.name !== "dark-mode" && a.name !== "cookies");
  const with_ = (list, name, patch) => list.map((a) => (a.name === name ? { ...a, ...patch } : a));
  const state = (agents, cards = []) => ({ ev: "state", agents, cards });
  const base = (agents = AGENTS, cards = []) => [[0, { ev: "hub", up: true, workspace: "~/acme" }], [0, state(agents, cards)]];

  // ~30 Hz levels between a and b (ms)
  function levels(who, a, b, seed) {
    const out = [];
    for (let t = a; t <= b; t += 33) {
      const s = (t - a) / 1000, edge = Math.min(1, s * 4, ((b - t) / 1000) * 4);
      out.push([t, { ev: "level", who, v: +(voice(s, seed) * edge).toFixed(3) }]);
    }
    return out;
  }
  // your words as you say them, one every `per` ms
  function heard(text, a, per = 240) {
    const w = text.split(" ");
    return w.map((_, i) => [a + i * per, { ev: "heard", text: w.slice(0, i + 1).join(" "), final: false }]);
  }
  // main's voice reaching each word
  function said(turn, text, a, per = 290) {
    return text.split(" ").map((_, i) => [a + i * per, { ev: "word", turn, i }]);
  }

  // hold fn, talk, let go: the whole voice turn, from `at`
  function talkTurn(at, { shot = true, skipped = false, newAgent = true, end = true } = {}) {
    const ev = [];
    const talkEnd = at + 400 + SAID.split(" ").length * 240 + 500;
    ev.push([at, { ev: "app_fn", state: "down", key: "fn" }]);
    if (shot) ev.push([at + 30, { ev: "app_shot", app: "Chrome", title: skipped ? "" : "localhost:4801/settings", skipped, frame: { x: 330, y: 300, w: 720, h: 520 } }]);
    ev.push([at + 60, { ev: "phase", phase: "listening" }]);
    ev.push(...levels("you", at + 300, talkEnd - 200, 0));
    ev.push(...heard(SAID, at + 400));
    ev.push([talkEnd, { ev: "app_fn", state: "up", key: "fn" }]);
    ev.push([talkEnd + 20, { ev: "phase", phase: "sending" }]);
    ev.push([talkEnd + 300, { ev: "heard", text: SAID, final: true }]);
    ev.push([talkEnd + 500, { ev: "sent", text: SAID, voice: true, shot }]);
    ev.push([talkEnd + 600, { ev: "phase", phase: "working" }]);
    ev.push([talkEnd + 1400, { ev: "phase", phase: "working", line: "starting dark-mode" }]);
    const speakAt = talkEnd + 2400;
    ev.push([speakAt - 100, { ev: "main", text: ANSWER, turn: 7 }]);
    ev.push([speakAt, { ev: "phase", phase: "speaking" }]);
    const n = ANSWER.split(" ").length, speakEnd = speakAt + n * 290 + 200;
    ev.push(...levels("main", speakAt, speakEnd, 2));
    ev.push(...said(7, ANSWER, speakAt));
    // the agents main starts pop in as chips (the scene's base has neither)
    if (newAgent) {
      ev.push([speakAt + 900, state(BEFORE.concat(AGENTS.filter((a) => a.name === "dark-mode")))]);
      ev.push([speakAt + 1500, state(AGENTS)]);
    }
    if (end) {
      ev.push([speakEnd, { ev: "phase", phase: "done" }]);
      ev.push([speakEnd + 4600, { ev: "phase", phase: "idle" }]);
    }
    return { ev, talkEnd, speakAt, speakEnd };
  }

  const sort = (ev) => ev.slice().sort((a, b) => a[0] - b[0]);

  // the scenes: id, the SPEC §2 state(s) it shows, its label, its events
  const SCENES = [
    { id: "idle", spec: ["idle"], label: "idle", build: () => base() },
    { id: "quiet", spec: ["idle"], label: "all quiet", build: () => base(AGENTS.map((a) => ({ ...a, status: "idle", working: false }))) },
    { id: "talk", spec: ["hold fn", "let go", "main speaks", "end of turn"], label: "hold fn → main speaks → kiss", build: () => sort([...base(BEFORE), ...talkTurn(600).ev]) },
    { id: "listen", spec: ["hold fn"], label: "hold fn (held)", build: () => {
      const t = talkTurn(400);
      return sort([...base(), ...t.ev.filter(([ms, e]) => ms < t.talkEnd && e.ev !== "app_fn" || (e.ev === "app_fn" && e.state === "down"))]);
    } },
    { id: "unseen", spec: ["hold fn"], label: "hold fn, a skipped window", build: () => {
      const t = talkTurn(400, { skipped: true });
      return sort([...base(), ...t.ev.filter(([ms]) => ms < t.talkEnd - 600)]);
    } },
    { id: "typed", spec: ["let go", "end of turn"], label: "spotlight: typed, answered in text", build: () => sort([
      ...base(),
      [500, { ev: "app_key", key: "space" }],
      ...["what's", "what's perf", "what's perf doing?"].map((t, i) => [1200 + i * 450, { ev: "ui_spot_type", text: t }]),
      [2900, { ev: "ui_spot_send" }],
      [3000, { ev: "sent", text: "what's perf doing?", voice: false, shot: true }],
      [3100, { ev: "phase", phase: "working" }],
      [4600, { ev: "main", text: "perf is profiling signup: the fonts block the first paint. it's on the lazy-load now.", turn: 8 }],
      [4700, { ev: "phase", phase: "done" }],
      [9200, { ev: "phase", phase: "idle" }],
    ]) },
    { id: "needs", spec: ["needs you", "answered"], label: "needs you → fn + 1", build: () => sort([
      ...base(),
      [900, state(AGENTS, [CARD])],
      [5200, { ev: "app_key", key: "1" }],
      [5600, state(AGENTS, [])],
    ]) },
    { id: "needs-wait", spec: ["needs you"], label: "needs you (waits for you)", build: () => sort([...base(), [600, state(AGENTS, [CARD])]]) },
    { id: "done", spec: ["done"], label: "an agent is done", build: () => sort([
      ...base(),
      [900, state(with_(AGENTS, "perf", { status: "done", working: false, report: "signup 4.1 s → 0.9 s. the fonts load lazily now." }))],
    ]) },
    { id: "failed", spec: ["failed"], label: "an agent failed", build: () => sort([
      ...base(),
      [800, { ev: "phase", phase: "working" }],
      [900, state(with_(AGENTS, "release", { status: "failed", working: false, report: "release couldn't publish: the checksum didn't match." }))],
    ]) },
    { id: "hush", spec: ["main speaks"], label: "esc while main speaks", build: () => {
      const t = talkTurn(400, { end: false, newAgent: false });
      const at = t.speakAt + 2000;
      return sort([...base(), ...t.ev.filter(([ms]) => ms < at), [at, { ev: "app_key", key: "esc" }], [at + 300, { ev: "phase", phase: "done" }], [at + 5000, { ev: "phase", phase: "idle" }]]);
    } },
    { id: "cut", spec: ["main speaks", "hold fn"], label: "tap fn while main speaks", build: () => {
      const t = talkTurn(400, { end: false, newAgent: false });
      const at = t.speakAt + 1800;
      return sort([...base(), ...t.ev.filter(([ms]) => ms < at), [at, { ev: "app_fn", state: "tap" }], [at + 200, { ev: "phase", phase: "idle" }]]);
    } },
    { id: "cancel", spec: ["hold fn"], label: "fn + esc: cancelled", build: () => {
      const t = talkTurn(400, { newAgent: false });
      const at = 2200;
      return sort([...base(), ...t.ev.filter(([ms]) => ms < at), [at, { ev: "app_fn", state: "cancel" }], [at + 100, { ev: "phase", phase: "idle" }]]);
    } },
    { id: "handsfree", spec: ["hold fn"], label: "fn fn: hands-free", build: () => sort([
      ...base(),
      [500, { ev: "app_fn", state: "double", key: "fn" }],
      [520, { ev: "app_shot", app: "Ghostty", title: "~/acme", skipped: false }],
      [560, { ev: "phase", phase: "listening" }],
      ...levels("you", 900, 3600, 1), ...heard("what's left before the release?", 1000, 300),
      [4400, { ev: "app_fn", state: "up", key: "fn" }],
      [4420, { ev: "phase", phase: "sending" }],
      [4700, { ev: "sent", text: "what's left before the release?", voice: true, shot: true }],
      [4800, { ev: "phase", phase: "working" }],
      [6400, { ev: "phase", phase: "idle" }],
    ]) },
    { id: "agents", spec: ["agents"], label: "fn + 0: the agents", build: () => sort([
      ...base([...AGENTS.map((a) => a.name === "perf" ? { ...a, status: "done", working: false, report: "signup 4.1 s → 0.9 s." } : a), EMOJI], [CARD]),
      [500, { ev: "app_key", key: "0" }],
    ]) },
    { id: "inbox", spec: ["needs you"], label: "fn + i: the inbox", build: () => sort([...base(AGENTS, [CARD, CARD2]), [500, { ev: "app_key", key: "i" }]]) },
    { id: "hello", spec: ["idle"], label: "the hello (once ever)", build: () => sort([...base(), [300, { ev: "app_hello" }]]) },
    { id: "settings", spec: ["settings"], label: "fn + ,: settings", build: () => sort([...base(),
      [100, { ev: "app_settings", edge_glow: true, right_option: false, meeting_quiet: true, voice_answers: true, launch_at_login: "on", macos: 26, radius: 26,
        skip: [{ bundle: "com.agilebits.onepassword7", name: "1Password", fixed: true }, { bundle: "com.tinyspeck.slackmacgap", name: "Slack", fixed: false }] }],
      [400, { ev: "app_key", key: "," }]]) },
    { id: "spot", spec: ["spotlight"], label: "fn + space: spotlight", build: () => sort([...base(), [400, { ev: "app_key", key: "space" }]]) },
    { id: "error", spec: ["failed"], label: "an error", build: () => sort([...base(), [700, { ev: "error", text: "the mic isn't answering. nothing was sent." }]]) },
    { id: "hub", spec: ["idle"], label: "the hub is down", build: () => sort([...base(), [700, { ev: "hub", up: false, workspace: "~/acme" }], [5200, { ev: "hub", up: true, workspace: "~/acme" }]]) },
    { id: "hide", spec: ["idle"], label: "fn + .: hide", build: () => sort([...base(), [600, { ev: "app_key", key: "." }]]) },
    { id: "perm", spec: ["idle"], label: "a permission", build: () => sort([...base(), [500, { ev: "app_perm", perm: "accessibility", state: "ask" }]]) },
    { id: "perm-denied", spec: ["idle"], label: "a permission refused", build: () => sort([...base(), [500, { ev: "app_perm", perm: "accessibility", state: "denied" }]]) },
    // v2, the page loop: a page is ready (`weekly update is ready   fn o`), fn + o opens it, fn + 0 lists "for you"
    { id: "pages", spec: ["for you"], label: "a page is ready   fn o", build: () => {
      const t0 = Date.now();
      const old = { id: "grays", title: "which gray wins?", agent: "dark-mode", version: 2, url: "http://127.0.0.1:47123/p/grays", at_ms: t0 - 40 * 60000, state: "ready", open_notes: 0 };
      const wu = { id: "weekly-update", title: "weekly update", agent: "weekly-update", version: 1, url: "http://127.0.0.1:47123/p/weekly-update", at_ms: t0, state: "ready", open_notes: 0 };
      // a page an agent watches (sb every --page), opened at v2, now at v4
      const hn = { id: "hn-watch", title: "launch thread on HN", agent: "hn-watch", version: 4, opened_version: 2, url: "http://127.0.0.1:47123/p/hn-watch", at_ms: t0 - 3 * 60000, state: "ready", open_notes: 0 };
      const timers = [{ id: 3, agent: "hn-watch", label: "every 15 min", text: "check the HN thread", by: "main", next_ms: t0 + 12 * 60000, fired: 4, page: "hn-watch", last_ms: t0 - 3 * 60000 }];
      return sort([
        [0, { ev: "hub", up: true, workspace: "~/acme" }], [0, { ...state(AGENTS), pages: [old, hn], timers }],
        [900, { ev: "page", ...wu }],
        [3500, { ev: "app_key", key: "o" }],
        [5000, { ev: "app_key", key: "0" }],
      ]);
    } },
    { id: "still", spec: ["reduced motion"], label: "reduced motion", build: () => sort([[0, { ev: "app_reduce_motion", on: true }], ...base(), ...talkTurn(1500).ev, [16000, state(AGENTS, [CARD])]]) },
  ];

  // what the core answers to the capsule's cmds (the player feeds these back)
  function respond(cmd) {
    switch (cmd.cmd) {
      case "answer": return [[300, state(AGENTS, [])]];
      case "send": return [[150, { ev: "sent", text: cmd.text, voice: false, shot: true }], [250, { ev: "phase", phase: "working" }],
        [1600, { ev: "main", text: "on it: " + cmd.text, turn: 99 }], [1700, { ev: "phase", phase: "done" }], [6200, { ev: "phase", phase: "idle" }]];
      case "hush": return [[200, { ev: "phase", phase: "done" }], [4500, { ev: "phase", phase: "idle" }]];
      case "cut_in": return [[100, { ev: "phase", phase: "idle" }]];
      case "talk_cancel": return [[100, { ev: "phase", phase: "idle" }]];
      case "app_hide": return [[0, { ev: "app_hidden", on: true }], [2500, { ev: "app_hidden", on: false }]];
      // the app's show/hide policy, roughly (amb-mac's Visibility): something to show shows the
      // glass, nothing to show hides it (so dev.html closes the glass with its last words on it)
      case "app_content": return [[0, { ev: "app_hidden", on: cmd.kind === "none" }]];
      case "app_perm": return cmd.do === "continue" ? [[600, { ev: "app_perm", perm: cmd.perm, state: "granted" }]] : [];
      default: return [];
    }
  }

  // the browser player: plays a scene into recv, answers cmds; returns stop()
  function player(recv) {
    let timers = [];
    const at = (ms, ev) => timers.push(setTimeout(() => recv(ev), ms));
    return {
      play(id, from = 0) {
        this.stop();
        const sc = SCENES.find((s) => s.id === id);
        if (!sc) return 0;
        const evs = sc.build();
        // jump to `from` ms: the events before it at once, in order (the old levels are silence)
        for (const [ms, ev] of evs) if (ms < from && ev.ev !== "level") recv(ev);
        for (const [ms, ev] of evs) if (ms >= from) at(ms - from, ev);
        return evs.length ? evs[evs.length - 1][0] : 0;
      },
      cmd(c) { if (c.cmd !== "app_size") for (const [ms, ev] of respond(c)) at(ms, ev); },
      stop() { timers.forEach(clearTimeout); timers = []; },
    };
  }

  root.AmbFake = { SCENES, respond, player, voice, AGENTS, CARD, SAID, ANSWER };
})(typeof window !== "undefined" ? window : globalThis);
