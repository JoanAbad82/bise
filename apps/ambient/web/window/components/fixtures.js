// bise desktop window · every component in every state the design system shows, on its own
// example data (ds: components/*.html). dev.html draws them in both themes; check.mjs renders each
// one. Data only: no element, so the same fixture works in the browser and in node.
(function (root) {
  "use strict";
  const UI = root.BiseUI;
  const go = (to) => ({ ev: "ui_open", to });

  UI.fixtures = {
    btn: [
      ["rest", { text: "open" }], ["hover", { text: "open", state: "hover" }], ["pressed", { text: "open", state: "active" }],
      ["focus", { text: "open", state: "focus" }], ["disabled", { text: "open", state: "disabled" }],
      ["primary", { text: "merge into main", kind: "pri", act: { ev: "ui_merge" } }], ["primary, loading", { text: "merge", kind: "pri", state: "loading" }],
      ["ghost", { text: "not yet", kind: "ghost" }], ["danger", { text: "stop", kind: "danger" }],
    ],
    chip: [["plain", { text: "from Chrome" }], ["accent", { text: "new", tone: "acc" }], ["error", { text: "1 failed", tone: "err" }], ["done", { text: "merged", tone: "ok" }]],
    kbd: [["key", { text: "⌘I" }]],
    seg: [["two choices", { items: ["merge", "rebase"], on: 0, act: { ev: "ui_seg" } }]],
    toggle: [["off", {}], ["on", { on: true }], ["focus", { on: true, state: "focus" }], ["disabled", { state: "disabled" }]],
    field: [["empty", { placeholder: "search projects" }], ["focus", { value: "store", state: "focus" }], ["error", { value: "~/nope", state: "error" }]],
    help: [["help", { text: "⏎ try again   ⌘. stop" }], ["error", { text: "that folder isn't a git repo", err: true }]],
    dot: [["idle", {}], ["working", { state: "wk" }], ["needs you", { state: "nd" }], ["done", { state: "ok" }], ["failed", { state: "er" }], ["off", { state: "off" }], ["large", { state: "nd", lg: true }]],
    pearl: [["22", { size: 22 }], ["40", { size: 40 }], ["56", { size: 56 }]],
    bar: [["45 %", { pct: 45 }], ["no known end", { state: "ind" }], ["done", { pct: 100, state: "done" }], ["failed", { pct: 60, state: "err" }]],
    skel: [["loading", {}]],
    empty: [["empty thread", { title: "evals has no agent yet", text: "ask bise: “rerun the rag eval on yesterday's set”" }]],
    err: [["error", { text: "the provider timed out" }]],
    row: [
      ["bise, in view", { kind: "me", name: "bise", sub: "every project", end: 3, needs: true, on: true, act: go("bise") }],
      ["project, needs you", { kind: "pj", name: "storefront", dot: { state: "nd" }, end: 1, needs: true, act: go("storefront") }],
      ["project, working", { kind: "pj", name: "telemetry", dot: { state: "wk" }, end: "⌘2" }],
      ["agent, working", { kind: "ag", name: "checkout", dot: { state: "wk" } }],
      ["agent, in view", { kind: "ag", name: "search", dot: { state: "nd" }, on: true }],
      ["hover", { kind: "ag", name: "stock", dot: { state: "ok" }, state: "hover" }],
      ["focus", { kind: "ag", name: "stock", dot: { state: "ok" }, state: "focus" }],
      ["archived", { kind: "arch", name: "old-promo" }],
    ],
    sh: [["section head", { text: "projects" }]],
    side: [["the sidebar", {
      rows: [
        { kind: "me", name: "bise", sub: "every project", end: 3, needs: true, on: true },
        { sh: "projects" },
        { kind: "pj", name: "storefront", dot: { state: "nd" }, end: 1, needs: true },
        { kind: "ag", name: "checkout", dot: { state: "wk" } }, { kind: "ag", name: "search", dot: { state: "nd" } }, { kind: "ag", name: "stock", dot: { state: "ok" } },
        { kind: "pj", name: "telemetry", dot: { state: "wk" }, end: "⌘2" }, { kind: "pj", name: "engine", dot: {}, end: "⌘3" },
      ],
      foot: { text: "+ add a project", act: { ev: "ui_add_project" } },
    }]],
    head: [["bise", { title: "bise", sub: "every project · 3 at work", pearl: 40 }], ["an agent", { title: "checkout", sub: "storefront · one idempotency key per order", dot: { state: "wk" } }]],
    msg: [
      ["yours", { from: "you", name: "you", av: "G", time: "14:21", via: "by voice, from Chrome", text: "why does ingest p99 climb at 14:00?" }],
      ["yours, with its context", { from: "you", name: "you", av: "G", time: "14:21", text: "this one", chips: [{ text: "Chrome · grafana" }, { text: "selection · 3 lines" }] }],
      ["bise, streaming", { from: "bise", name: "bise", time: "14:21", text: "it's telemetry. i passed it to its main", state: "streaming" }],
      ["an agent, with code", { from: "agent", name: "checkout", dot: { state: "wk" }, time: "09:40", text: "the key is `order_id` plus the cart's hash." }],
      ["agent to agent", { from: "agent", name: "alerts", dot: { state: "ok" }, time: "14:24", text: "compaction moved, p99 back to 80 ms.", in: true }],
      ["a stopped turn", { from: "agent", name: "checkout", dot: { state: "er" }, time: "09:52", text: "▲ your ChatGPT sign-in expired. ⏎ signs you in again.", state: "error" }],
    ],
    route: [
      ["working", { state: "wk", p1: "telemetry · main → alerts", p2: "ingest p99 at 14:00", p3: "4 min", pct: 45 }],
      ["done", { state: "ok", p1: "telemetry · main → alerts", p2: "ingest p99 at 14:00", p3: "done 14:25" }],
      ["failed", { state: "er", p1: "telemetry · main", p2: "▲ stopped: the provider timed out", p3: "14:23" }],
    ],
    tool: [
      ["folded", { text: "ran 4 commands · 2 files changed", act: { ev: "ui_unfold", id: "t1" } }],
      ["open", { text: "cargo test -p streaming", state: "open", out: "test decode_pool::keeps_order ... ok\ntest result: ok. 12 passed" }],
      ["running", { text: "running the PS5 replay", state: "run" }],
      ["failed", { text: "cargo test · 1 failed", state: "err" }],
    ],
    fold: [["between agents", { text: "4 messages between 2 agents", act: { ev: "ui_unfold", id: "f1" } }]],
    answered: [["main answered for you", { text: "promo asked: stack with gift cards? · i answered: no ▸ why" }]],
    marker: [["a question", { text: "? search asked you · it waits above the composer" }]],
    art: [["an artifact", { title: "↗ flash sale replay", meta: "stock · 10:40", act: { ev: "ui_art", id: "a1" } }], ["new, hovered", { title: "↗ frame times", meta: "streaming · 11:12", isNew: true, state: "hover" }]],
    diff: [["a diff, a line picked", {
      file: "search/synonyms.json", add: 1,
      lines: [{ old: 14, new: 14, text: "\"jeans, denim\"," }, { new: 15, sign: "+", text: "\"tshirt, t-shirt, tee\",", sel: true, act: { ev: "ui_line", n: 15 } }],
      pop: "❝ quote in the composer",
    }]],
    quote: [["2 lines", { text: "1 “workers: [Worker; 4],”  decode_pool.rs:13-14 · 2 lines" }]],
    opts: [["keyboard on 1", { items: [{ n: 1, text: "tonight 02:00", on: true }, { n: 2, text: "now" }], typeHint: "or type your answer below" }],
      ["picked, sending", { items: [{ n: 1, text: "tonight 02:00", picked: true }, { n: 2, text: "now", state: "disabled" }] }]],
    dock: [
      ["a question", { head: "? telemetry · alerts needs you", keys: "1 of 3   ← →", q: "move the compaction from 14:00 to 03:00?", opts: [{ n: 1, text: "move it to 03:00", act: { ev: "ui_answer", i: 1 } }, { n: 2, text: "leave it", act: { ev: "ui_answer", i: 2 } }], typeHint: "or type your answer below" }],
      ["the review", { head: "? streaming is done · merge it?", keys: "approval", q: "merge sb/streaming into main: 3 files, 40 ms → 15 ms on the PS5 replay.", opts: [{ n: 1, text: "merge into main" }, { n: 2, text: "not yet" }], typeHint: "or type your answer below" }],
      ["an error to pick up", { kind: "err", head: "▲ checkout stopped", keys: "bise", q: "your ChatGPT sign-in expired. your agents on ChatGPT stopped; they resume once you sign in.", opts: [{ n: 1, text: "sign in again" }] }],
      ["nothing to answer", { kind: "plain", head: "stock is done", keys: "esc closes", q: "500 sold out of 500, no oversell.", opts: [{ n: 1, text: "open the report" }] }],
    ],
    tabs: [["the inbox", { items: [{ text: "alerts · compaction?", dot: { state: "nd" }, on: true }, { text: "search · reindex?", dot: { state: "nd" } }, { text: "netcode · merge?", dot: { state: "nd" } }] }]],
    composer: [
      ["rest", { to: "you → bise · opus · high", placeholder: "talk to bise, or hold fn", send: "off", keys: "@ file   $ skills   / commands   ⌘I inbox" }],
      ["focus", { to: "you → bise · opus · high", focus: true, send: "off", keys: "@ file   $ skills   / commands   ⌘I inbox" }],
      ["typing", { to: "you → bise · opus · high", text: "rerun the flash sale replay", focus: true, send: "on", sendAct: { ev: "ui_send" }, keys: "@ file   $ skills   / commands   ⌘I inbox" }],
      ["with a quote", { to: "you → streaming · opus · high", quote: { text: "1 “workers: [Worker; 4],”  decode_pool.rs:13-14 · 2 lines" }, text: "why a pool of 4?", focus: true, send: "on", keys: "@ file   $ skills   / commands   ⌘I inbox" }],
      ["the agent works", { to: "you → checkout · opus · high", placeholder: "steer checkout while it works", send: "stop", keys: "@ file   $ skills   / commands   ⌘I inbox" }],
      ["offline", { to: "you → bise · opus · high", placeholder: "offline · your message waits and goes when you're back", send: "off", disabled: true, keys: "@ file   $ skills   / commands   ⌘I inbox" }],
      ["a question above it", { to: "you → bise · answering alerts · opus · high", placeholder: "or type your answer, then ⏎", send: "off", keys: "@ file   $ skills   / commands   ⌘I inbox",
        dock: { head: "? telemetry · alerts needs you", keys: "1 of 3   ← →", q: "move the compaction from 14:00 to 03:00?", opts: [{ n: 1, text: "move it to 03:00" }, { n: 2, text: "leave it" }], typeHint: "or type your answer below" } }],
    ],
    job: [
      ["working", { state: "wk", name: "checkout", key: "⌥1", psi: true, end: "12 min", what: "one idempotency key per order (#812)", pct: 45 }],
      ["working, no known end", { state: "wk", name: "promo", key: "⌥4", end: "3 min", what: "best of the two discounts", ind: true }],
      ["needs you", { state: "nd", name: "search", key: "⌥2", psi: true, end: "?", what: "reindex tonight 02:00?" }],
      ["done", { state: "ok", name: "stock", key: "⌥3", end: "10:40", what: "500 of 500, no oversell" }],
      ["failed", { state: "er", name: "netcode", key: "⌥5", psi: true, end: "▲", what: "stopped: test at 150 ms failed" }],
      ["idle", { state: "", name: "wallet", key: "⌥6", psi: true, end: "idle", what: "Apple Pay at checkout" }],
      ["in view", { state: "wk", name: "checkout", key: "⌥1", psi: true, end: "12 min", what: "one idempotency key per order (#812)", pct: 45, on: true }],
      ["hover", { state: "wk", name: "checkout", key: "⌥1", psi: true, end: "12 min", what: "one idempotency key per order (#812)", states: ["hover"] }],
      ["scheduled", { state: "sched", name: "search reindex", key: "⌥7", end: "02:00", what: "tonight, then every night" }],
      ["loading", { state: "loading", key: "⌥0" }],
    ],
  };
  // the board: a column of the jobs above (working, needs you, done, failed)
  UI.fixtures.board = [["a project's board", { jobs: [0, 2, 3, 4].map((i) => UI.fixtures.job[i][1]) }]];
  if (typeof module !== "undefined" && module.exports) module.exports = UI.fixtures;
})(typeof window !== "undefined" ? window : globalThis);
