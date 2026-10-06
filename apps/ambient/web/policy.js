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
    if (v.state === "agents" || v.state === "inbox" || v.state === "find") return asking.length ? "need" : working(m.agents) ? "work" : m.quiet ? "away" : "rest";
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
      case "agents": case "inbox": case "settings": case "pages": case "offline": return { kind: "open" };
      case "hello": return { kind: "hello" };
      // a permission ask is opened (until he answers); its refused line is a timed line, 8 s (amb-mac m_5679)
      case "perm": return { kind: v.perm ? "open" : "line" };
      case "needs": return { kind: "needs", card: asking[0] && asking[0].id };
      case "idle": return { kind: "none" };
      // SPEC §0: never for done, failed, a page ready (they live in the menu-bar marble); an
      // answer's line (`cookies has it: yes.`), the morning page, a key's answer, the hub lost do
      case "done": case "failed": case "page": return { kind: "none" };
      default: return { kind: flash || v.state === "hub_down" ? "line" : "none" };
    }
  }

  // ---- what the capsule shows now
  // `wall`: the epoch clock (a page's age); `now` may be the page's own monotonic clock
  root.AmbPolicy = { moodOf, hold, reduced, grow, contentOf, GROW, working };
})(typeof window !== "undefined" ? window : globalThis);
