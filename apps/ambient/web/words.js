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
    // the full view's sections (vision §3 G; best guesses, asked to ambient): what's running, and a
    // page being written in it
    running: "running",
    pageWriting: "writing…",
    pageUpdating: "updating…",
    listening: "listening",
    letGo: "let go of fn to send",
    got: ":* got it.",
    on: "main is on it.",
    onShort: "on it.",
    needsHint: "or hold fn and say it",
    // a card asked from a page (docs/ambient-pages.md §4.2): fn + ⏎ opens the page at the question;
    // key hints are `<keys> <word>`, no + (ambient, m_5067)
    openIt: "fn ⏎ open it",
    // §3 behavior
    hush: "i'll stop talking. the rest is in text.",
    cutIn: "main stopped. go ahead.",
    notSeen: "main doesn't see this window",
    // §4 keys
    handsFree: "hands-free. tap fn to send.",
    cancelled: "cancelled. nothing sent.",
    later: "later. it comes back in an hour.",
    hidden: "quiet. i'm still here.",
    showAgain: "fn + . to show me again",
    // §5 permissions (designer)
    perm: {
      accessibility: "to hear fn in every app, bise needs Accessibility. it only uses fn and the keys you press with it.",
      mic: "hold fn and talk. the mic is on only while you talk to bise: fn held, or hands-free until you tap fn.",
      screen: "when you talk, main sees the window in front. it goes to your model with your words, and isn't kept.",
    },
    // the refusals (ambient, m_4645); the screen's pane is named by the running macOS (screenPane)
    permDenied: {
      accessibility: "without Accessibility, bise can't hear fn. turn it on in System Settings › Privacy & Security › Accessibility.",
      mic: "without the mic, bise can't hear you. turn it on in System Settings › Privacy & Security › Microphone.",
      screen: "without Screen Recording, main can't see the window in front. turn it on in System Settings › Privacy & Security › Screen & System Audio Recording.",
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
    fail: "release couldn't publish: the checksum didn't match. main is on it.",
    sees: "Chrome · localhost:4801/settings",
    // ambient, m_4645
    hubDown: "can't reach main. trying again.",
    spotHint: "type to main",
    spotKeys: [["⏎", "send to main"], ["tab", "start an agent"], ["esc", "close"]],
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
  const pageReady = (name) => `${name} is ready · fn + o`;
  const forYou = "for you";
  // today's morning page, opened in front by the app (amb-mac's app_morning {greet}: true before
  // 11:00 local; signed by ambient with amb-mac, m_5016 / m_5067)
  const morning = (greet) => (greet ? "good morning. your page is open   fn o" : "your page is open   fn o");
  // fn held on a bise page: the words pin on the page (§4.1; ambient, m_4877)
  const voiceNoteOn = (name) => `voice note on ${name}`;
  // a page's line in "for you": `v2 · 3 min ago`, or `updating…`
  function pageMeta(p, nowMs) {
    if (p.state === "updating") return "updating…";
    const s = Math.max(0, Math.floor(((nowMs || 0) - (p.at_ms || 0)) / 1000));
    const ago = !p.at_ms || s < 60 ? "just now" : s < 3600 ? `${Math.floor(s / 60)} min ago` : s < 86400 ? `${Math.floor(s / 3600)} h ago` : `${Math.floor(s / 86400)} d ago`;
    return `v${p.version || 1} · ${ago}`;
  }

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
  const seesLine = (app, title) => (title ? `main sees ${app} · ${title}` : `main sees ${app}`);
  // the chip in two parts: `head` is never cut (the app, a URL's host), `tail` may end in … (a
  // URL's path, or a window title) (designer: cut the path, never the app or the host)
  function seesParts(app, title) {
    const t = String(title || "");
    if (!t) return { head: `main sees ${app}`, tail: "" };
    const url = t.match(/^((?:[a-z]+:\/\/)?[^\s/]+)(\/\S*)$/i);
    if (url) return { head: `main sees ${app} · ${url[1]}`, tail: url[2] };
    return { head: `main sees ${app} · `, tail: t };
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

  root.AmbWords = { W, GLYPH, idleLine, firstSentence, doneLine, failLine, needsLine, answeredLine, seesLine, seesParts, optionLabel, options, age, plural, permDenied, waiting, rowLabel, mdWords, plain, pageReady, forYou, morning, pageMeta, voiceNoteOn };
})(typeof window !== "undefined" ? window : globalThis);
