// bise ambient · the capsule's policy parts, pure (split out of model.js, rule 6): the pearl's
// mood for a view, what the capsule has to show for the app's show/hide policy (contentOf), the
// grow out of the menu-bar icon, and the view held while it shrinks. model.js's view() calls them.
(function (root) {
  "use strict";
  // how many agents run (working, waiting on him, starting)
  const working = (agents) => agents.filter((a) => a.working ?? ["working", "waiting", "starting"].includes(a.status)).length;

  // ---- the pearl's mood (SPEC §1, round 8): listen while you talk (level = your mic), speak
  // while bise talks (level = its voice), work while main or agents work, need for a question,
  // done / fail for those lines, away while quiet (a call, a meeting), rest otherwise
  function moodOf(v, m, flash, asking) {
    switch (v.state) {
      case "listening": case "voice_note": return "listen";
      case "speaking": return m.hushed ? "work" : "speak";
      case "working": case "route": return "work";
      case "needs": case "perm": return "need";
      case "answered": case "done": return "done";
      case "failed": case "error": case "hub_down": return "fail";
    }
    if (v.state === "agents" || v.state === "inbox" || v.state === "find" || v.state === "menu") return asking.length ? "need" : working(m.agents) ? "work" : m.quiet ? "away" : "rest";
    if (m.quiet) return "away";
    if (v.pose === "think") return "work";
    return "rest";
  }

  // ---- it grows out of the menu-bar icon (SPEC §0): the open/close motion when the app shows or
  // hides the capsule. `icon` is the icon's rect in the page's CSS px (amb-mac's app_icon; above
  // the panel, so y < 0); without it, the panel's top right. Reduced motion: a plain fade.
  const GROW = { open: 750, close: 600, fade: 200, from: 0.15, easeOut: "cubic-bezier(.16, 1, .3, 1)", easeIn: "cubic-bezier(.7, 0, .84, 0)" };
  // the glass leaves with its last words on it (ambient's gate run 3 (b), and its reduced-motion
  // recheck m_5574): with nothing left to show (content none), the capsule keeps drawing the last
  // view it showed (words, chips, label, width, so app_size never shrinks the panel either), with
  // the live hidden flag, mood and settings, through the app's hide and its close (0.6 s, or the
  // 0.2 s fade) and after it, until new content comes; it never draws the empty view in between
  function hold(shown, v) {
    if (v.content.kind !== "none") return { shown: v.hidden ? shown : v, v };
    if (!shown) return { shown, v };
    return { shown, v: { ...shown, hidden: v.hidden, content: v.content, mood: v.mood, lvl: v.lvl, still: v.still, unseen: v.unseen, icon: v.icon, radius: v.radius } };
  }
  // reduced motion for the grow: the app's flag (app_reduce_motion) or the system's (the web
  // view's prefers-reduced-motion), either one is enough, whichever arrived first
  const reduced = (appFlag, system) => !!appFlag || !!system;
  function grow(wasHidden, hidden, reduce, icon, box) {
    if (wasHidden === hidden) return null;
    const open = !hidden;
    if (reduce) return { open, ms: GROW.fade, fade: true, ease: "linear" };
    const b = box || { x: 0, y: 0, w: 0 };
    // the origin, in the animated box's own px: the icon's centre, else the box's top right
    const ox = icon ? icon.x + icon.w / 2 - b.x : b.w;
    const oy = icon ? icon.y + icon.h / 2 - b.y : 0;
    return { open, ms: open ? GROW.open : GROW.close, fade: false, from: GROW.from, origin: `${Math.round(ox)}px ${Math.round(oy)}px`, ease: open ? GROW.easeOut : GROW.easeIn };
  }

  // ---- what the capsule has to show, for the app's show/hide policy (amb-mac, m_5073): talk,
  // type, answer, got and needs the app also derives itself; it acts on line (4 s), open (until
  // esc, fn ., a click away), needs (6 s) and none
  function contentOf(v, flash, asking) {
    switch (v.state) {
      case "listening": case "voice_note": return { kind: "talk" };
      case "spotlight": case "find": return { kind: "type" };
      case "working": return { kind: v.words ? "answer" : "got" };
      // '→ telemetry · main': still 'got' for the app's policy; route: the app gives tab and fn esc
      // to the page until then (desktop S8)
      case "route": return { kind: "got", route: true };
      case "speaking": case "end": return { kind: "answer" };
      case "agents": case "inbox": case "settings": case "pages": case "offline": case "menu": return { kind: "open" };
      case "hello": return { kind: "hello" };
      // a permission ask is opened (until he answers); its refused line is a timed line, 8 s (amb-mac m_5679)
      case "perm": return { kind: v.perm ? "open" : "line" };
      // the card's own id and its project (ids are per hub; amb-mac m_8894 keys its once-per-card rule by both)
      case "needs": {
        // a quiet batch (S9, amb-mac m_9037): the app shows the bar once for its card list
        if (v.ask && v.ask.batch9) return { kind: "batch", cards: v.ask.batch9.cards };
        const c = asking[0]; return { kind: "needs", card: c && (c.cid ?? c.id), ...(c && c.project ? { project: c.project } : {}) };
      }
      // while you were away (S9): shown once, like a card
      case "away": return { kind: "away", since: v.away.since };
      case "idle": return { kind: "none" };
      // SPEC §0: never for done, failed, a page ready (they live in the menu-bar marble); an
      // answer's line (`cookies has it: yes.`), the morning page, a key's answer, the hub lost do
      case "done": case "failed": case "page": return { kind: "none" };
      default: return { kind: flash || v.state === "hub_down" ? "line" : "none" };
    }
  }

  // ---- what the capsule shows now
  // `wall`: the epoch clock (a page's age); `now` may be the page's own monotonic clock
  // ---- a card's kind (ambient's composer rule m_8772): an approval acts or leaves (a confirm, a
  // merge, a try, an update, a sign-in, drafts to send); words never approve it, only 1/2. A
  // question (or a card with no kind, the fake core's) takes words.
  const approval = (c) => !!c && (c.approval === true || !!c.batch || !!(c.page && c.page.drafts) || (!!c.kind && c.kind !== "question"));
  const approvalKind = (c) => (c.batch || (c.page && c.page.drafts) ? "drafts" : c.kind);
  // his talk on the card the glass asks: a question gets it as its answer; an approval's agent gets
  // it as a plain message (main's: bise's usual send) and the card stays. null: the usual send.
  function talkOnCard(c, text) {
    if (!c || !text) return null;
    // a project's card (another hub) answers with its own id and its project (model.js projCards)
    const pj = c.cid != null ? { project: c.project } : {};
    if (!approval(c)) return { answer: true, cmd: { cmd: "answer", card: c.cid ?? c.id, reply: text, ...pj } };
    if (!c.agent || c.agent === "main") return null;
    return { answer: false, cmd: { cmd: "agent_send", agent: c.agent, text, mode: "now", ...pj } };
  }

  // a batch of drafts on one page (amb-core 34703bf0, card.page.drafts, card.batch {count, title,
  // what, names}); without batch, read from its text '<n> drafts ready: a · b · c'
  function batchOf(c) {
    if (!c || !c.page || !c.page.drafts) return null;
    const b = c.batch || {};
    // without batch: amb-core's text, '<n> drafts wait for you · <title>\n<line>\n1. review…' (e2d256e1),
    // or the first one's '<n> drafts ready: a · b · c'
    const lines = String(c.text || "").split("\n");
    const tm = /^(\d+)\s+drafts?[^:]*:\s*(.*)$/.exec(lines[0]);
    const tw = /^(\d+)\s+drafts? wait for you(?:\s*·\s*(.*))?$/.exec(lines[0]);
    const opts = root.AmbWords.options(c);
    const review = opts.find((o) => /review/i.test(o.label)) || { i: 0, n: 1 };
    const send = opts.find((o) => /send/i.test(o.label)) || { i: 1, n: 2 };
    const names = Array.isArray(b.names) ? b.names.map(String) : tm ? tm[2].split(/\s*·\s*/).filter(Boolean) : [];
    const count = +b.count || (tm ? +tm[1] : tw ? +tw[1] : names.length || 2);
    // the card's own second line, ready to show (amb-core 2e114ebe: '3 replies to Benjamin: proxy · fish ·
    // French'), else read from its text
    const line = b.line ? String(b.line) : !c.batch && tw && lines[1] && !/^\d+\./.test(lines[1]) ? lines[1] : null;
    return { count, title: b.title || (tw && tw[2]) || c.page.title || "", what: b.what || "drafts", names, line, review, send };
  }

  // a card's choices in the order the glass shows them (a batch: review, then send all)
  function choices(card) {
    const b = batchOf(card);
    return b ? [b.review, b.send] : root.AmbWords.options(card);
  }

  root.AmbPolicy = { moodOf, hold, reduced, grow, contentOf, GROW, working, approval, approvalKind, talkOnCard, batchOf, choices };
})(typeof window !== "undefined" ? window : globalThis);
