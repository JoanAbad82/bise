// bise ambient · the capsule's cards, pure (split out of model.js, rule 6): every project's cards,
// what the question glass may ask, and S9's parts (amb-mac m_9037, amb-core m_9044): the quiet
// batch, the 'while you were away' card and a drop on the pearl. model.js calls them.
(function (root) {
  "use strict";
  const Wd = root.AmbWords;

  // every project's open cards (amb-mac m_8894): home's come in state.cards, the others in the core's
  // projects rows (ProjectRow.cards, 'question' for text); ids are per hub, so a project's card is
  // '<project>#<id>' here and keeps its own id (cid) and project for the answer and the app
  const projCards = (ps) => ps.filter((p) => !p.home).flatMap((p) => (p.cards || []).map((c) => ({ ...c, text: c.text ?? c.question ?? "", cid: c.id, id: `${p.project}#${c.id}`, project: p.project })));
  const allCards = (m) => m.cards.concat(m.pcards || []);
  const visibleCards = (m) => allCards(m).filter((c) => !m.answered[c.id]);
  // an answer to a card, its own id and, for a project's, its project
  const ansCmd = (card, reply) => ({ cmd: "answer", card: card.cid ?? card.id, reply, ...(card.cid != null ? { project: card.project } : {}) });

  // ---- the quiet batch (S9): the cards that came while he was quiet (a call, a meeting, full
  // screen, paused: app_quiet) wait; when it ends they come together, '2 questions · about 1 min',
  // one at a time (fn 1/2 answers and the next comes, esc puts the rest off). The app shows the bar
  // once for the batch (app_content {kind:'batch', cards}). An urgent card never waits.
  function quiet(m, on) {
    const ids = visibleCards(m).map((c) => c.id);
    if (on) return { ...m, quietSeen: m.quietSeen || ids, batch: null };
    const seen = new Set(m.quietSeen || ids);
    const held = visibleCards(m).filter((c) => !seen.has(c.id) && !c.urgent && !(m.later || {})[c.id]).map((c) => c.id);
    return { ...m, quietSeen: null, batch: held.length ? { cards: held } : null };
  }
  const batchLeft = (m) => (m.batch ? m.batch.cards.filter((id) => !m.answered[id] && !(m.later || {})[id] && allCards(m).some((c) => c.id === id)) : []);
  // the glass's head while a batch card asks: '2 questions · about 1 min', '1 of 2' (half a minute each)
  function batchHead(m, c) {
    const left = batchLeft(m);
    if (!c || !left.includes(c.id)) return null;
    const n = m.batch.cards.length;
    return { title: Wd.s9.batch(n, Math.max(1, Math.ceil(n / 2))), k: Wd.s9.of(n - left.length + 1, n), cards: left };
  }
  // esc on a batch card: the rest of the batch waits in the inbox
  const batchLater = (m) => ({ ...m, later: { ...(m.later || {}), ...Object.fromEntries(batchLeft(m).map((id) => [id, true])) }, batch: null });

  // what the question glass may ask: not a card he put off with esc (it keeps waiting in the inbox
  // and the count, ambient m_6500), and in a call or a meeting only the urgent ones; the card he
  // brought up from fn i / fn 0 (m.frontCard) asks first, even in a call, then a batch's in order;
  // while bise's window holds the cards (app_card_seat 'window') the bar asks nothing
  const askable = (m) => {
    if (m.seat === "window") return [];
    const b = batchLeft(m);
    const a = visibleCards(m).filter((c) => !(m.later || {})[c.id] && (c.id === m.frontCard || !m.quiet || c.urgent));
    const rank = (c) => (c.id === m.frontCard ? -1e9 : b.includes(c.id) ? b.indexOf(c.id) - b.length : 0);
    return a.map((c, i) => [c, i]).sort((x, y) => rank(x[0]) - rank(y[0]) || x[1] - y[1]).map((x) => x[0]);
  };

  // ---- while you were away (S9): after the app's away_back the core sends away_summary {since_ms,
  // done, questions, failed, projects: [{project, done, questions, failed}]}; one card, before any
  // list: 'while you were away · 08:52', '3 done · 1 question · nothing broke', a row per project
  // that moved; ⏎ (or a row) opens bise, esc closes. Nothing happened: no card.
  const moved = (x) => (x.done || 0) + (x.questions || 0) + (x.failed || 0) > 0;
  const away = (m, ev) => (moved(ev) ? { ...m, away: { since_ms: +ev.since_ms || 0, done: +ev.done || 0, questions: +ev.questions || 0, failed: +ev.failed || 0, projects: (ev.projects || []).filter(moved) } } : m);
  function awayView(m, tz) {
    const a = m.away;
    const hm = new Date(a.since_ms).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, ...(tz ? { timeZone: tz } : {}) });
    const name = (id) => (m.projects.find((p) => p.project === id) || {}).name || id;
    return { since: hm, line: Wd.s9.awayParts(a), rows: a.projects.map((p) => ({ project: p.project, name: name(p.project), line: Wd.s9.awayParts(p) })) };
  }
  // ⏎ or a row: bise's window (a row: that project), the card goes; esc: it goes
  function awayAct(m, project) {
    const cmds = project === undefined ? [] : [{ cmd: "app_window", route: project ? `project/${project}` : "bise" }];
    return { m: { ...m, away: null }, cmds };
  }

  // ---- a drop on the pearl (S9): app_drop {files: [{name, path, kind}], url?} opens the spotlight
  // with them; his words (or ⏎ alone) send them, {cmd:'send', text, files: [paths]} (a link as text),
  // and the capsule says '→ bise · forest.ktx' until bise routes it (the route line)
  const drop = (ev) => ({ files: (ev.files || []).filter((f) => f && f.path), url: ev.url || "" });
  const dropName = (d) => (d.files.length ? d.files[0].name + (d.files.length > 1 ? ` +${d.files.length - 1}` : "") : d.url.replace(/^https?:\/\//, ""));
  function dropSend(d, text) {
    const words = [text, d.url].filter(Boolean).join(" ");
    return { cmd: "send", text: words, ...(d.files.length ? { files: d.files.map((f) => f.path) } : {}) };
  }

  root.AmbCards = { projCards, allCards, visibleCards, ansCmd, askable, quiet, batchLeft, batchHead, batchLater, away, awayView, awayAct, drop, dropName, dropSend };
})(typeof window !== "undefined" ? window : globalThis);
