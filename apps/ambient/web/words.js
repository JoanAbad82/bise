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
    listening: "listening",
    letGo: "let go of fn to send",
    got: ":* got it.",
    on: "main is on it.",
    onShort: "on it.",
    needsHint: "or hold fn and say it",
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
    permDenied: {
      accessibility: "without Accessibility, bise can't hear fn. turn it on in System Settings › Privacy & Security › Accessibility.",
      mic: "without the Microphone, bise can't hear you. turn it on in System Settings › Privacy & Security › Microphone.",
      screen: "without Screen Recording, main can't see the window in front. turn it on in System Settings › Privacy & Security › Screen Recording.",
    },
    continue: "continue",
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
    // not signed off yet: asked to ambient (the hub is down; the spotlight's placeholder)
    hubDown: "bise isn't reachable. trying again.",
    spotHint: "type to main",
  };

  // the glyphs of an agent's row (the TUI's)
  const GLYPH = { working: "∿", done: "✓", failed: "▲", blocked: "?", needs: "?", idle: "…", waiting: "…" };

  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  // the idle line: what the small capsule says when nothing else is going on
  function idleLine(working) {
    return working > 0 ? `nothing needs you. ${plural(working, "agent", "agents")} working.` : W.quiet;
  }

  // the first sentence of a report, at most `max` characters
  function firstSentence(text, max = 90) {
    const t = String(text || "").trim().replace(/\s+/g, " ");
    if (!t) return "";
    const m = t.match(/^.*?[.!?](?=\s|$)/);
    let s = m ? m[0] : t;
    if (s.length > max) s = s.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
    return s;
  }

  const doneLine = (name, report) => {
    const r = firstSentence(report);
    return r ? `${name} is done: ${r}` : `${name} is done.`;
  };

  // `release couldn't publish: the checksum didn't match. main is on it.` (no joke, glyph ▲)
  function failLine(name, report, mainOnIt) {
    const r = firstSentence(report, 120);
    const head = !r ? `${name} failed.` : r.toLowerCase().startsWith(name.toLowerCase() + " ") ? r : `${name} failed: ${r}`;
    return mainOnIt ? `${head} ${W.on}` : head;
  }

  const needsLine = (agent) => `${agent} needs you`;
  // `✓ cookies has it.` / with the option it took: `✓ cookies has it: yes.`
  const answeredLine = (agent, choice) => (choice ? `${agent} has it: ${choice}.` : `${agent} has it.`);
  const seesLine = (app, title) => (title ? `main sees ${app} · ${title}` : `main sees ${app}`);
  // an option, numbered: `1 yes`
  const optionLabel = (i, text) => `${i + 1} ${text}`;

  // how long an agent has been on its turn: `6m`, `2h`, `40s`
  function age(ms) {
    if (!(ms >= 0)) return "";
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    return `${Math.floor(s / 3600)}h`;
  }

  root.AmbWords = { W, GLYPH, idleLine, firstSentence, doneLine, failLine, needsLine, answeredLine, seesLine, optionLabel, age, plural };
})(typeof window !== "undefined" ? window : globalThis);
