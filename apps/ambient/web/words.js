// bise ambient · the words. Pure: no DOM, loaded by the capsule, dev.html and check.mjs.
// The fixed lines are ambient's `W` (site/content/ambient/amb.js, signed off by designer) and the
// lines of SPEC.md §2-§5. The functions build the lines that carry data (an agent's name, a count,
// a report) on those same shapes. A new line goes through ambient first.
(function (root) {
  "use strict";

  const W = {
    // §2 states
    idle: "nothing needs you. 3 agents working.",
    quiet: "all quiet. hold fn to talk.",
    // the hello, once ever (ambient m_5702)
    hello: "hi, i'm bise. hold fn and talk to me.",
    // the full view's sections (vision §3 G; best guesses, asked to ambient): what's running, and a
    // page being written in it
    // the settings view (fn + ,; amb-mac ef4dbc2e): signed off by ambient (m_5410)
    set: {
      title: "settings",
      edge_glow: "the screen's edge glows while you talk",
      right_option: "right ⌥ works like fn",
      meeting_quiet: "stay quiet in meetings and calls",
      meeting_quiet_note: "bise still shows things, it just doesn't say them.",
      voice_answers: "bise answers out loud",
      launch_at_login: "open bise when you log in",
      approve: "waiting for your OK in System Settings › Login Items",
      skipTitle: "bise never sees",
      // the two rows always there, before his apps (they make an empty line needless)
      fixed: ["private browser windows", "password managers"],
      add: "add an app",
      remove: "remove",
    },
    running: "running",
    agents: "agents",
    pageWriting: "writing…",
    pageUpdating: "updating…",
    // the full view's empty sections (best guesses, asked to ambient; 'nothing needs you.' is the
    // signed idle line's)
    nothingRunning: "nothing running.",
    nothingNeeds: "nothing needs you.",
    listening: "listening",
    letGo: "let go of fn to send",
    got: ":* got it.",
    // roadmap §3.1 'bise speaks': on the capsule the speaker is bise, never main (the TUI keeps
    // main); best guesses, asked to ambient
    on: "bise is on it.",
    onShort: "on it.",
    needsHint: "or hold fn and say it",
    // a card asked from a page (docs/ambient-pages.md §4.2): fn + ⏎ opens the page at the question;
    // key hints are `<keys> <word>`, no + (ambient, m_5067)
    openIt: "fn ⏎ open it",
    // §3 behavior
    hush: "i'll stop talking. the rest is in text.",
    cutIn: "bise stopped. go ahead.",
    notSeen: "bise doesn't see this window",
    // §4 keys
    handsFree: "hands-free. tap fn to send.",
    cancelled: "cancelled. nothing sent.",
    later: "later. it comes back in an hour.",
    hidden: "quiet. i'm still here.",
    showAgain: "fn . to show me again",
    // §5 permissions (designer)
    perm: {
      accessibility: "to hear fn in every app, bise needs Accessibility. it only uses fn and the keys you press with it.",
      mic: "hold fn and talk. the mic is on only while you talk to bise: fn held, or hands-free until you tap fn.",
      screen: "when you talk, bise sees the window in front. it goes to your model with your words, and isn't kept.",
    },
    // the refusals (ambient, m_4645); the screen's pane is named by the running macOS (screenPane)
    permDenied: {
      accessibility: "without Accessibility, bise can't hear fn. turn it on in System Settings › Privacy & Security › Accessibility.",
      mic: "without the mic, bise can't hear you. turn it on in System Settings › Privacy & Security › Microphone.",
      screen: "without Screen Recording, bise can't see the window in front. turn it on in System Settings › Privacy & Security › Screen & System Audio Recording.",
    },
    continue: "continue",
    notNow: "not now",
    // the mocks' examples (the fake core plays them, check.mjs reads them back)
    said: "dark mode for the settings page. and the cookie banner hides the buy button on mobile, make it half the size",
    answer: "dark-mode started. settings page first, then the rest. cookies is on the banner.",
    needs: "cookies needs you: keep the banner on mobile?",
    needsOpts: ["1 yes", "2 no"],
    light: "one question from perf. ten seconds, promise.",
    done: "perf is done: signup 4.1 s → 0.9 s.",
    doneTouch: "three seconds back, every signup.",
    fail: "release couldn't publish: the checksum didn't match. bise is on it.",
    sees: "Chrome · localhost:4801/settings",
    // ambient, m_4645
    hubDown: "can't reach bise. trying again.",
    spotHint: "type to bise",
    spotKeys: [["⏎", "send to bise"], ["tab", "start an agent"], ["esc", "close"]],
    // tab in the spotlight: main starts the agent (it's main's job, like the TUI's /new)
    startAgent: "start an agent: ",
  };

  // the screen recording pane's name: `Screen & System Audio Recording` since macOS 15 (Sequoia),
  // `Screen Recording` before; the app tells the major version (app_settings.macos)
  function permDenied(perm, macos) {
    const s = W.permDenied[perm];
    return perm === "screen" && macos && macos < 15 ? s.replace("Screen & System Audio Recording", "Screen Recording") : s;
  }

  // a page for you (docs/ambient-vision.md §3 B; signed off by ambient, m_4786)
  // key hints: the keys, or the keys then a word, set off by three spaces, no '+', never '·'
  // (ambient, m_5662)
  const pageReady = (name) => `${name} is ready   fn o`;
  const forYou = "for you";
  // today's morning page (morning-<date>, amb-kit's roadmap E), opened by the app on the first fn
  // of the day (app_morning {greet}: true before 11:00 local): the line says how many things need
  // you, and when nothing does, what fn o opens (ambient-lead m_5651, signed by ambient m_5662)
  const morning = (greet, n) => `${greet ? "good morning. " : ""}${n > 0 ? plural(n, "thing needs you", "things need you") : "nothing needs you. your page is ready"}   fn o`;
  // fn held on a bise page: the words pin on the page (§4.1; ambient, m_4877)
  const voiceNoteOn = (name) => `voice note on ${name}`;
  // a page's line in "for you": `v2 · 3 min ago`, or `updating…`
  const agoOf = (atMs, nowMs) => {
    const s = Math.max(0, Math.floor(((nowMs || 0) - (atMs || 0)) / 1000));
    return !atMs || s < 60 ? "just now" : s < 3600 ? `${Math.floor(s / 60)} min ago` : s < 86400 ? `${Math.floor(s / 3600)} h ago` : `${Math.floor(s / 86400)} d ago`;
  };
  // a page's meta in for you (ambient-lead m_5515): one you never opened says 'new'; one with
  // versions since you last opened it 'v3 · 2 new versions'; one you've seen 'v2 · 40 min ago'
  // (best guesses, sent to ambient). openedAt: the newest version you opened (0: never)
  function pageMeta(p, nowMs, openedAt) {
    if (p.state === "updating") return "updating…";
    const v = p.version || 1;
    if (openedAt != null && openedAt < v) return openedAt <= 0 ? "new" : `v${v} · ${plural(v - openedAt, "new version", "new versions")}`;
    return `v${v} · ${agoOf(p.at_ms, nowMs)}`;
  }
  // a page an agent watches (sb every --page; the hub's timers): 'watching · checked 3 min ago'
  const watching = (lastMs, nowMs) => (lastMs > 0 ? `watching · checked ${agoOf(lastMs, nowMs)}` : "watching");

  // the inbox's label, the TUI's `inbox · 2 waiting for you`
  const waiting = (n) => `${n} waiting for you`;

  // the glyphs of an agent's row (the TUI's)
  const GLYPH = { working: "∿", done: "✓", failed: "▲", blocked: "?", needs: "?", idle: "…", waiting: "…" };

  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  // the idle line: what the small capsule says when nothing else is going on
  function idleLine(working) {
    return working > 0 ? `nothing needs you. ${plural(working, "agent", "agents")} working.` : W.quiet;
  }

  // the first sentence of a report, at most `max` characters
  function firstSentence(text, max = 90) {
    const t = plain(text);
    if (!t) return "";
    const m = t.match(/^.*?[.!?](?=\s|$)/);
    let s = m ? m[0] : t;
    if (s.length > max) s = s.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
    return s;
  }

  // an agent's state change in the status line, without its report: the report is written to main,
  // not to you (ambient, m_4677). The result sentence (`perf is done: signup 4.1 s → 0.9 s.`) shows
  // only as main's own words for you.
  const doneLine = (name) => `${name} is done.`;
  // glyph ▲, no joke
  const failLine = (name) => `${name} failed.`;

  const needsLine = (agent) => `${agent} needs you`;
  // `✓ cookies has it.` / with the option it took: `✓ cookies has it: yes.`
  const answeredLine = (agent, choice) => (choice ? `${agent} has it: ${choice}.` : `${agent} has it.`);
  // a batch of drafts waiting on one page (amb-core 34703bf0; ambient m_6056, ambient-lead m_6063):
  // '3 drafts wait for you · launch recap', 'replies to legal, Lucas and Marc', '1 review' first
  // (the filled one: reading comes before sending), '2 send all 3' / 'send both', and right after
  // send all '∿ sending 3 replies.' (nothing has left yet: the hub has only asked the agent)
  const names = (xs) => {
    const n = xs.filter(Boolean);
    if (n.length <= 1) return n[0] || "";
    if (n.length <= 3) return `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`;
    return `${n.slice(0, 2).join(", ")} and ${n.length - 2} more`;
  };
  const drafts = {
    label: (count, title) => `${count} drafts wait for you${title ? ` · ${title}` : ""}`,
    line: (what, who) => (who.length ? `${what || "drafts"} to ${names(who)}` : what || "drafts"),
    review: "review",
    sendAll: (count) => (count === 2 ? "send both" : `send all ${count}`),
    sending: (count, what) => `sending ${count === 2 ? "both" : count} ${what || "drafts"}.`,
  };
  // VoiceOver: the pearl is an image whose label says its mood (best guesses, asked to ambient)
  const MOOD_SAYS = { rest: "bise", listen: "bise is listening", speak: "bise is talking", work: "bise is working", need: "bise needs you", done: "bise: done", fail: "bise: something failed", away: "bise is quiet", still: "bise" };
  const moodLabel = (mood) => MOOD_SAYS[mood] || "bise";
  // what VoiceOver reads when the capsule changes: one sentence per view, its glyphs dropped (they
  // are read as words already: ? waiting, ✓ done, ▲ failed)
  function sayOf(v) {
    if (!v || v.content && v.content.kind === "none" && !v.inbox && !v.list) return "";
    const words = v.words ? v.words.list.slice(0, v.words.lit).join(" ") : "";
    const parts = [v.label && [v.label.text, v.label.rest].filter(Boolean).join(", "), v.text, words, v.sub, v.sees && `${v.sees.head}${v.sees.tail}`, v.perm && v.perm.text, v.ask && `${v.ask.title}: ${v.ask.text}`];
    return parts.filter(Boolean).join(". ").replace(/\s+/g, " ").trim();
  }
  // the speaker on the capsule is bise (roadmap §3.1)
  const seesLine = (app, title) => (title ? `bise sees ${app} · ${title}` : `bise sees ${app}`);
  // the chip in two parts: `head` is never cut (the app, a URL's host), `tail` may end in … (a
  // URL's path, or a window title) (designer: cut the path, never the app or the host)
  function seesParts(app, title) {
    const t = String(title || "");
    if (!t) return { head: `bise sees ${app}`, tail: "" };
    const url = t.match(/^((?:[a-z]+:\/\/)?[^\s/]+)(\/\S*)$/i);
    if (url) return { head: `bise sees ${app} · ${url[1]}`, tail: url[2] };
    return { head: `bise sees ${app} · `, tail: t };
  }
  // an option, numbered: `1 yes`
  const optionLabel = (n, text) => `${n} ${text}`;
  // a card's choices, from the core's [{n, label}] (n: the digit to press, not always i + 1:
  // a hard confirm is `1 allow` / `3 no`); plain strings count 1, 2, 3...
  const options = (card) => ((card && card.options) || []).slice(0, 9).map((o, i) =>
    typeof o === "string" ? { i, n: i + 1, label: o } : { i, n: +(o.n ?? i + 1), label: String(o.label ?? "") });

  // how long an agent has been on its turn: `6m`, `2h`, `40s`
  function age(ms) {
    if (!(ms >= 0)) return "";
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    return `${Math.floor(s / 3600)}h`;
  }

  // main's markdown, word by word: one token per whitespace run of the raw text (so the core's
  // word.i still points at the right word), its marks stripped (**, __, a heading's #, a quote's >,
  // a list's - or 1.), and `code` flagged so it renders in mono without its backticks
  function mdWords(text) {
    const raw = String(text || "").split(/\s+/).filter(Boolean);
    let code = false;
    return raw.map((w, i) => {
      const starts = w.startsWith("`");
      if (starts) code = true;
      const inCode = code;
      if (w.replace(/^`/, "").includes("`") || (w.endsWith("`") && !(starts && w.length === 1))) code = false;
      let s = w.replace(/`/g, "");
      if (!inCode) {
        // a heading's #, a quote's >, a list's - or 1. at the start of a line (the split lost the
        // newlines: the start of the text, or after a sentence or a colon)
        const lineStart = i === 0 || /[.!?:]$/.test(raw[i - 1]);
        if (lineStart && /^(#{1,6}|>|[-*+]|\d+\.)$/.test(w)) s = "";
        s = s.replace(/\*\*|__/g, "").replace(/^\*(?=\S)|(?<=\S)\*$/g, "");
        s = s.replace(/^\[([^\]]*)\]\([^)]*\)([.,;:!?]?)$/, "$1$2");
      }
      return { w: s, code: inCode && s !== "" };
    });
  }
  // the same, as one plain line (an agent's report in a status line)
  const plain = (text) => mdWords(text).map((t) => t.w).filter(Boolean).join(" ");

  // an agent's row is a label, not a sentence: no final period
  const rowLabel = (s) => String(s || "").replace(/\.$/, "");

  root.AmbWords = { W, GLYPH, idleLine, firstSentence, doneLine, failLine, needsLine, answeredLine, drafts, names, seesLine, seesParts, optionLabel, options, age, plural, permDenied, waiting, rowLabel, mdWords, plain, pageReady, forYou, morning, pageMeta, watching, voiceNoteOn, moodLabel, sayOf };
})(typeof window !== "undefined" ? window : globalThis);
