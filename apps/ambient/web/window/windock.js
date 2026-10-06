// bise desktop · the window's rule "everything waiting for you sits above the composer", pure.
// Which cards a thread's composer answers, the inbox (every card of every project, one at a time),
// the quotes ❝ from selected lines, and the words of the dock, the marker and the composer's
// divider. No DOM, no state of its own: winmodel.js calls it, winview.js draws from it,
// check-win.mjs checks it.
(function (root) {
  "use strict";

  const HOME = "home";
  // the words (winwords.js): one table, en + fr; English when the table isn't loaded
  const T = (s, k, v) => (root.AmbWinWords ? root.AmbWinWords.t(s, k, v) : k);
  // a thread's key; a screen (S7's review, artifacts, environments) keys its own composer
  const keyOf = (r) => `${r.screen ? `${r.screen}${r.want ? `=${r.want}` : ""}:` : ""}${r.project}/${r.agent}`;

  // every open card, newest first (the inbox's order: "la plus récente en haut"), minus the ones
  // he answered a moment ago (the core's next `cards` drops them; until then they stay hidden)
  function allCards(s) {
    const out = [];
    // bise's own hub counts even when no projects list names it (the single-hub core sends none)
    const ids = [...new Set([HOME, ...s.projects.map((p) => p.project)])];
    for (const id of ids) for (const c of s.cards[id] || []) if (!(c.id in s.answered)) out.push({ ...c, project: c.project || id });
    return out.sort((a, b) => (b.since_ms || 0) - (a.since_ms || 0) || String(a.id).localeCompare(String(b.id)));
  }

  // the cards a thread's composer answers: bise's = every project's; a project's main = that
  // project's; an agent = its own
  function scopeCards(s, route) {
    const all = allCards(s);
    // bise's thread answers every project's; bise's other agents answer only their own
    if (route.project === HOME && route.agent === "main") return all;
    if (route.agent === "main") return all.filter((c) => c.project === route.project);
    return all.filter((c) => c.project === route.project && c.agent === route.agent);
  }

  // what sits above the composer now: the inbox when it is open, else the thread's first card he
  // has not put off with esc; null when nothing waits
  function dock(s) {
    const k = keyOf(s.route);
    if (s.inbox) {
      const list = allCards(s);
      if (!list.length) return null;
      const i = Math.min(Math.max(0, s.inbox.i), list.length - 1);
      return { mode: "inbox", list, i, card: list[i] };
    }
    const off = s.dockOff[k] || [];
    const list = scopeCards(s, s.route).filter((c) => !off.includes(c.id));
    if (!list.length) return null;
    const i = Math.min(Math.max(0, s.dockI[k] || 0), list.length - 1);
    return { mode: "thread", list, i, card: list[i] };
  }

  const pname = (s, project) => (s.projects.find((p) => p.project === project) || {}).name || project;
  // who asks, as the place you are needs it: from bise or the inbox, "telemetry · alerts"; inside
  // the project, "alerts"
  function asker(s, c, wide) {
    return wide ? `${pname(s, c.project)} · ${c.agent}` : c.agent;
  }

  // the card's kind decides what typed words do (ambient m_8771, lead m_8775): a question is
  // answered by his words; an approval (merge, send, publish, run, delete: anything that acts or
  // leaves) only by 1 / 2 or a click, his words go to the agent as a plain message
  // the hub says it (Card.approval, amb-core m_8808); until then its kind does
  const isApproval = (c) => !!c && (c.approval != null ? !!c.approval : ["approval", "merge", "confirm"].includes(c.kind));
  // the composer answers the card above it: a question, unless he chose a plain message (esc)
  const answers = (s, d) => !!d && !isApproval(d.card) && !((s.plain || {})[keyOf(s.route)] === d.card.id);
  const oneLine = (t, n = 64) => { const l = String(t || "").split("\n")[0].trim(); return l.length > n ? `${l.slice(0, n - 1)}…` : l; };

  // the dock's words (DS composer "dock · une question" / "dock · l'inbox" / "dock · la revue")
  function dockWords(s, d) {
    if (!d) return null;
    const c = d.card;
    const wide = d.mode === "inbox" || s.route.project === HOME;
    const who = asker(s, c, wide);
    const approval = c.kind === "approval" || c.kind === "merge" || c.kind === "confirm";
    const nav = d.list.length > 1 ? `${T(s, "n_of", { i: d.i + 1, n: d.list.length })}   ← →` : T(s, "n_of", { i: 1, n: 1 });
    const k = d.mode === "inbox" ? `${nav}${d.list.length > 1 ? T(s, "the_others") : ""}   ${T(s, "esc_back")}` : approval ? `${T(s, "approval")} · ${nav}` : nav;
    return {
      mode: d.mode,
      h: approval ? `? ${who} · ${c.title || T(s, "approve_it")}` : T(s, "needs_you", { who }),
      k,
      body: d.mode === "inbox" ? c.body || "" : "",
      origin: d.mode === "inbox" && c.origin ? `asked by ${c.origin.by}${c.origin.via ? `, via ${c.origin.via}` : ""}` : "",
      shot: d.mode === "inbox" && c.origin ? c.origin.shot || "" : "",
      q: c.question,
      opts: (c.options || []).map((o, i) => ({ n: o.n, label: o.label, picked: s.picked && s.picked.card === c.id && s.picked.n === o.n, sel: !!(s.optSel && s.optSel.card === c.id && s.optSel.i === i) })),
      // a question keeps 'or type your answer below'; an approval says to pick
      ty: approval ? T(s, "pick_n", { n: (c.options || []).length || 2 }) : T(s, "type_below"),
      tabs: d.mode === "inbox" ? d.list.map((x, i) => ({ id: x.id, text: `${x.agent} · ${x.title || x.question}`, on: i === d.i })) : null,
      card: c.id,
    };
  }

  // the thread's one line for a card: it never holds the question itself
  function markerText(s, e) {
    const c = e.card || {};
    const project = e.from_project || s.route.project;
    // the asker: the entry's sender, else the card's agent, else the thread's own agent (a hub's
    // card entry carries only the card: amb-tools' run read '? undefined asked you')
    const from = e.from || c.agent || s.route.agent;
    const who = s.route.project === HOME ? `${project === HOME ? "bise" : pname(s, project)} · ${from}` : from;
    if (c.answered && c.by && c.by !== "you") return null; // main answered it: an "asked · i answered" line
    if (c.id in s.answered) return T(s, "asked_answered_you", { who, a: s.answered[c.id] });
    const open = allCards(s).some((x) => x.id === c.id);
    if (!open) return c.answered && c.answer ? T(s, "asked_answered_you", { who, a: c.answer }) : T(s, "asked_done", { who });
    // two forms only (ambient m_8298): its card is above the composer now, or ⌘I brings it
    const d = dock(s);
    return d && d.list.some((x) => x.id === c.id) ? T(s, "asked_below", { who }) : T(s, "asked_cmd_i", { who });
  }

  // the composer's line above the field, and its placeholder: it says before he types what his
  // words will do: answer the question (in the accent, with 'esc write a plain message'), or go
  // to the agent while an approval waits for 1 or 2
  function dividerParts(s, d, agentRow) {
    const r = s.route;
    const to = r.project === HOME ? "bise" : r.agent === "main" ? `${pname(s, r.project)} · main` : r.agent;
    const model = agentRow && agentRow.model ? ` · ${agentRow.model}` : "";
    if (answers(s, d)) {
      const who = asker(s, d.card, d.mode === "inbox" || r.project === HOME);
      return { text: T(s, "answering_q", { who, q: oneLine(d.card.question) }), acc: true, hint: T(s, "esc_plain") };
    }
    if (d && isApproval(d.card)) {
      const what = d.card.kind === "merge" || /\bmerge\b/i.test(`${d.card.title || ""} ${d.card.question || ""}`) ? T(s, "the_merge") : T(s, "the_approval");
      return { text: `${T(s, "you_to", { to })} · ${T(s, "waits_pick", { what })}`, acc: false, hint: "" };
    }
    return { text: `${T(s, "you_to", { to })}${model}`, acc: false, hint: "" };
  }
  const divider = (s, d, agentRow) => dividerParts(s, d, agentRow).text;
  function placeholder(s, d, agentRow) {
    const r = s.route;
    if (s.offline) return T(s, "ph_offline");
    if (answers(s, d)) return T(s, "ph_answer");
    if (r.project === HOME) return T(s, "ph_write", { to: "bise" });
    if (r.agent === "main") return T(s, "ph_main", { p: pname(s, r.project) });
    if (agentRow && agentRow.status === "working") return T(s, "ph_steer", { a: r.agent });
    return T(s, "ph_write", { to: r.agent });
  }

  // ---- quotes ❝ (selected diff lines or a selected sentence of a message)
  const base = (p) => String(p || "").split("/").pop();
  const clip = (t, n) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);
  // a diff entry's selected lines a..b (indexes in hunk.lines) -> the quote the send carries
  function quoteLines(agent, e, a, b) {
    const lines = ((e.diff && e.diff.hunk && e.diff.hunk.lines) || []).slice(Math.min(a, b), Math.max(a, b) + 1);
    const nums = lines.map((l) => l.new != null ? l.new : l.old).filter((n) => n != null);
    const text = lines.map((l) => l.text).join("\n");
    return { agent, pos: e.pos, text, file: e.diff.path, lines: [Math.min(...nums), Math.max(...nums)], n: lines.length };
  }
  function quoteText(agent, e, text) {
    return { agent, pos: e.pos, text: String(text).trim(), who: e.kind === "you" ? "you" : e.from || agent, at_ms: e.at_ms };
  }
  // the chip: ❝ 1 “workers: [Worker; 4],”  decode_pool.rs:13-14 · 2 lines
  function quoteChip(q, i, fmt, s) {
    const first = (q.text.split("\n").find((l) => l.trim()) || "").trim();
    if (q.file) {
      const where = q.lines[0] === q.lines[1] ? `${q.lines[0]}` : `${q.lines[0]}-${q.lines[1]}`;
      return `❝ ${i + 1} “${clip(first, 48)}”  ${base(q.file)}:${where} · ${s && root.AmbWinWords ? T(s, "lines_n", { n: q.n }) : `${q.n} line${q.n > 1 ? "s" : ""}`}`;
    }
    return `❝ ${i + 1} “${clip(first, 48)}”  ${q.who}${q.at_ms && fmt ? ` ${fmt(q.at_ms)}` : ""}`;
  }

  root.AmbWinDock = { HOME, keyOf, allCards, scopeCards, dock, dockWords, markerText, divider, dividerParts, isApproval, answers, oneLine, placeholder, quoteLines, quoteText, quoteChip, pname };
})(typeof window !== "undefined" ? window : globalThis);
