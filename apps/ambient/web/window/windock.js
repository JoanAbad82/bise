// bise desktop · the window's rule "everything waiting for you sits above the composer", pure.
// Which cards a thread's composer answers, the inbox (every card of every project, one at a time),
// the quotes ❝ from selected lines, and the words of the dock, the marker and the composer's
// divider. No DOM, no state of its own: winmodel.js calls it, winview.js draws from it,
// check-win.mjs checks it.
(function (root) {
  "use strict";

  const HOME = "home";
  // a thread's key; a screen (S7's review, artifacts, environments) keys its own composer
  const keyOf = (r) => `${r.screen ? `${r.screen}:` : ""}${r.project}/${r.agent}`;

  // every open card, newest first (the inbox's order: "la plus récente en haut"), minus the ones
  // he answered a moment ago (the core's next `cards` drops them; until then they stay hidden)
  function allCards(s) {
    const out = [];
    for (const p of s.projects) for (const c of s.cards[p.project] || []) if (!(c.id in s.answered)) out.push({ ...c, project: c.project || p.project });
    return out.sort((a, b) => (b.since_ms || 0) - (a.since_ms || 0) || String(a.id).localeCompare(String(b.id)));
  }

  // the cards a thread's composer answers: bise's = every project's; a project's main = that
  // project's; an agent = its own
  function scopeCards(s, route) {
    const all = allCards(s);
    if (route.project === HOME) return all;
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

  // the dock's words (DS composer "dock · une question" / "dock · l'inbox" / "dock · la revue")
  function dockWords(s, d) {
    if (!d) return null;
    const c = d.card;
    const wide = d.mode === "inbox" || s.route.project === HOME;
    const who = asker(s, c, wide);
    const approval = c.kind === "approval" || c.kind === "merge" || c.kind === "confirm";
    const nav = d.list.length > 1 ? `${d.i + 1} of ${d.list.length}   ← →` : `1 of 1`;
    const k = d.mode === "inbox" ? `${nav}${d.list.length > 1 ? " the others" : ""}   esc back to the thread` : approval ? `approval · ${nav}` : nav;
    return {
      mode: d.mode,
      h: approval ? `? ${who} · ${c.title || "approve it?"}` : `? ${who} needs you`,
      k,
      body: d.mode === "inbox" ? c.body || "" : "",
      origin: d.mode === "inbox" && c.origin ? `asked by ${c.origin.by}${c.origin.via ? `, via ${c.origin.via}` : ""}` : "",
      shot: d.mode === "inbox" && c.origin ? c.origin.shot || "" : "",
      q: c.question,
      opts: (c.options || []).map((o) => ({ n: o.n, label: o.label, picked: s.picked && s.picked.card === c.id && s.picked.n === o.n })),
      ty: "or type your answer below",
      tabs: d.mode === "inbox" ? d.list.map((x, i) => ({ id: x.id, text: `${x.agent} · ${x.title || x.question}`, on: i === d.i })) : null,
      card: c.id,
    };
  }

  // the thread's one line for a card: it never holds the question itself
  function markerText(s, e) {
    const c = e.card || {};
    const project = e.from_project || s.route.project;
    const who = s.route.project === HOME ? `${pname(s, project)} · ${e.from}` : e.from;
    if (c.answered && c.by && c.by !== "you") return null; // main answered it: an "asked · i answered" line
    if (c.id in s.answered) return `? ${who} asked you · you answered: ${s.answered[c.id]}`;
    const open = allCards(s).some((x) => x.id === c.id);
    if (!open) return c.answered && c.answer ? `? ${who} asked you · you answered: ${c.answer}` : `? ${who} asked you · answered`;
    // two forms only (ambient m_8298): its card is above the composer now, or ⌘I brings it
    const d = dock(s);
    return d && d.list.some((x) => x.id === c.id) ? `? ${who} asked you · below` : `? ${who} asked you · ⌘I`;
  }

  // the composer's line above the field, and its placeholder
  function divider(s, d, agentRow) {
    const r = s.route;
    const to = r.project === HOME ? "bise" : r.agent === "main" ? `${pname(s, r.project)} · main` : r.agent;
    const model = agentRow && agentRow.model ? ` · ${agentRow.model}` : "";
    const answering = d ? ` · answering ${d.card.agent}` : "";
    return `you → ${to}${answering}${model}`;
  }
  function placeholder(s, d, agentRow) {
    const r = s.route;
    if (s.offline) return "offline · your message waits and goes when you're back";
    if (d) return "your answer, then ⏎";
    if (r.project === HOME) return "write to bise, then ⏎";
    if (r.agent === "main") return `write to ${pname(s, r.project)}’s main, then ⏎`;
    if (agentRow && agentRow.status === "working") return `steer ${r.agent} while it works, then ⏎`;
    return `write to ${r.agent}, then ⏎`;
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
  function quoteChip(q, i, fmt) {
    const first = (q.text.split("\n").find((l) => l.trim()) || "").trim();
    if (q.file) {
      const where = q.lines[0] === q.lines[1] ? `${q.lines[0]}` : `${q.lines[0]}-${q.lines[1]}`;
      return `❝ ${i + 1} “${clip(first, 48)}”  ${base(q.file)}:${where} · ${q.n} line${q.n > 1 ? "s" : ""}`;
    }
    return `❝ ${i + 1} “${clip(first, 48)}”  ${q.who}${q.at_ms && fmt ? ` ${fmt(q.at_ms)}` : ""}`;
  }

  root.AmbWinDock = { HOME, keyOf, allCards, scopeCards, dock, dockWords, markerText, divider, placeholder, quoteLines, quoteText, quoteChip, pname };
})(typeof window !== "undefined" ? window : globalThis);
