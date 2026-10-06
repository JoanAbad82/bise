// bise desktop · state -> what the window shows, pure: plain data for the sidebar, the header, the
// jobs strip, the thread's rows, the dock above the composer, the composer and the right column.
// winui.js draws it with the design system's markup (apps/ambient/web/ds, then amb-kit's
// window/components); check-win.mjs reads it. Words follow desktop-app v9.
(function (root) {
  "use strict";
  const D = root.AmbWinDock, M = root.AmbWinModel;
  const { HOME, keyOf } = D;
  // bise's own thread (its main); bise's other agents draw like any project's agent
  const isBise = (r) => !r.screen && r.project === HOME && r.agent === "main";
  const T = (s, k, v) => (root.AmbWinWords ? root.AmbWinWords.t(s, k, v) : k);

  // ---- time, in his timezone (s.tz; undefined = the machine's)
  const fmts = {};
  const fmt = (tz) => (fmts[tz || ""] = fmts[tz || ""] || new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz }));
  const dayf = (tz) => new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: tz });
  const hm = (s, ms) => fmt(s.tz).format(new Date(ms));
  function dayLabel(s, ms) {
    const f = dayf(s.tz);
    const d = f.format(new Date(ms)), today = f.format(new Date(s.now)), yest = f.format(new Date(s.now - 86400000));
    if (d === today) return T(s, "today");
    if (d === yest) return T(s, "yesterday");
    const loc = root.AmbWinWords && root.AmbWinWords.lang(s) === "fr" ? "fr-FR" : "en-GB";
    return new Intl.DateTimeFormat(loc, { weekday: "short", day: "numeric", month: "short", timeZone: s.tz }).format(new Date(ms));
  }
  const mins = (ms) => { const m = Math.max(0, Math.round(ms / 60000)); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min` : ""}`.trim(); };
  const num = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const pct = (a, b) => (b ? Math.max(0, Math.min(100, Math.round((a / b) * 100))) : 0);

  // ---- dots: the sidebar's and the board's state, one word each
  const DOT = { working: "wk", waiting: "nd", done: "ok", blocked: "er", failed: "er", idle: "" };
  const agentDot = (s, project, a) => (openCardsOf(s, project, a.name).length ? "nd" : DOT[a.status] || "");
  const openCardsOf = (s, project, agent) => D.allCards(s).filter((c) => c.project === project && (agent == null || c.agent === agent));
  // a project whose hub the core doesn't hold (S3b: only home, the one in view and subscribed
  // ones) has no agents or cards here: its projects row's counts stand in
  const rowOf = (s, project) => s.projects.find((p) => p.project === project) || {};
  const projectWaits = (s, project) => (s.cards[project] ? openCardsOf(s, project).length : rowOf(s, project).waits || 0);
  const projectWorking = (s, project) => (s.agents[project] ? M.agentsOf(s, project).filter((a) => a.status === "working").length : rowOf(s, project).working || 0);

  function sidebar(s) {
    const r = s.route;
    const rows = [{ kind: "me", name: "bise", sub: T(s, "every_project"), end: String(D.allCards(s).length || ""), nd: D.allCards(s).length > 0, on: isBise(r), act: { ev: "ui_route", project: HOME, agent: "main" } }];
    // bise's own agents (every agent on the single-hub core) under its row
    for (const a of M.agentsOf(s, HOME)) {
      const dot = agentDot(s, HOME, a);
      rows.push({ kind: "ag", name: a.name, dot, end: dot === "nd" ? "?" : dot === "er" ? "▲" : "", on: r.project === HOME && r.agent === a.name, act: { ev: "ui_route", project: HOME, agent: a.name } });
    }
    rows.push({ kind: "sh", text: T(s, "projects") });
    M.projectsInOrder(s).forEach((p, i) => {
      const waits = projectWaits(s, p.project), working = projectWorking(s, p.project);
      const off = p.offline || p.missing;
      rows.push({ kind: "pj", name: p.name, dot: off ? "off" : waits ? "nd" : working ? "wk" : "",
        end: off ? T(s, p.missing ? "missing" : "offline") : waits ? String(waits) : i < 9 ? `⌘${i + 1}` : "", nd: waits > 0,
        on: r.project === p.project && r.agent === "main", act: { ev: "ui_route", project: p.project, agent: "main" } });
      // a project's agents show under it on bise's view, and under the project in view
      if (r.project === HOME || r.project === p.project) {
        const list = M.agentsOf(s, p.project);
        if (!list.length && s.agents[p.project]) rows[rows.length - 1].end = rows[rows.length - 1].end || T(s, "no_agent");
        for (const a of list) {
          const dot = agentDot(s, p.project, a);
          rows.push({ kind: "ag", name: a.name, dot, end: dot === "nd" ? "?" : dot === "er" ? "▲" : "",
            on: r.project === p.project && r.agent === a.name, act: { ev: "ui_route", project: p.project, agent: a.name } });
        }
      }
    });
    return { rows, foot: T(s, "add_project"), sh: T(s, "projects") };
  }

  function header(s) {
    const r = s.route;
    const all = D.allCards(s).length;
    if (r.screen === "notfound") return { t1: T(s, "notfound"), t2: [r.want], acc: -1, end: [] };
    if (isBise(r)) {
      const working = s.projects.reduce((n, p) => n + projectWorking(s, p.project), 0);
      const fresh = Object.values(s.arts).flat().filter((a) => a && a.new).length;
      return { pearl: true, t1: "bise", t2: [T(s, "every_project"), T(s, "at_work", { n: working }), ...(all ? [T(s, "waiting", { n: all })] : [])], acc: all ? 2 : -1,
        end: [...(fresh ? [{ kind: "chip", text: T(s, "n_new", { n: fresh }) }] : []), { kind: "chip", text: "⌕", kbd: "⌘K" }] };
    }
    const p = r.project === HOME ? { name: "bise", path: "" } : s.projects.find((x) => x.project === r.project) || { name: r.project, path: "" };
    const waits = projectWaits(s, r.project);
    if (r.agent === "main") {
      const n = M.agentsOf(s, r.project).length;
      const tab = s.tab[r.project] || "thread";
      return { t1: p.name, dot: waits ? "nd" : projectWorking(s, r.project) ? "wk" : "", t2: [p.path, p.branch || "main", T(s, "agents_n", { n }), ...(waits ? [T(s, "waiting", { n: waits })] : [])], acc: waits ? 3 : -1,
        seg: ["thread", "changes", "artifacts"].map((t) => ({ text: T(s, `tab_${t}`), on: t === tab, act: { ev: "ui_tab", tab: t } })) };
    }
    const a = M.agentRow(s) || { name: r.agent, status: "idle" };
    const mine = openCardsOf(s, r.project, r.agent).length;
    const t = s.threads[keyOf(r)];
    const files = t ? new Set(t.entries.filter((e) => e.kind === "diff").map((e) => e.diff.path)).size : 0;
    const t2 = [p.name, ...(a.branch ? [`ψ ${a.branch}`] : []), ...(a.started_ms ? [T(s, "started_by", { who: a.parent || "main", at: hm(s, a.started_ms) })] : []),
      mine ? T(s, "waiting_for_you") : a.status === "working" ? T(s, "working") : T(s, `status_${a.status}`)];
    return { t1: r.agent, dot: agentDot(s, r.project, a), t2, acc: mine ? t2.length - 1 : -1,
      end: [...(files ? [{ kind: "chip", text: T(s, "files_n", { n: files }) }] : []),
        ...(a.status === "working" ? [{ kind: "btn", text: T(s, "stop"), kbd: "⌘.", act: { ev: "ui_stop" } }] : []),
        { kind: "btn", text: T(s, "back_to", { p: p.name }), tip: T(s, "back_tip"), act: { ev: "ui_route", project: r.project, agent: "main" } }] };
  }

  // what runs now, on bise's view: every running job, the followed ones first
  function jobs(s) {
    if (!isBise(s.route)) return [];
    const out = [];
    for (const p of M.projectsInOrder(s)) for (const j of s.jobs[p.project] || []) if (j.state === "running" || j.state === "failed")
      out.push({ title: `${p.name} · ${j.agent}`, following: !!j.followed, failed: j.state === "failed",
        s: `${j.label} · ${num(j.step)} / ${num(j.steps)}${j.unit ? ` ${j.unit}` : ""} · ${pct(j.step, j.steps)}%`, pct: pct(j.step, j.steps), act: { ev: "ui_route", project: p.project, agent: j.agent } });
    return out.sort((a, b) => (b.following ? 1 : 0) - (a.following ? 1 : 0)).slice(0, 3);
  }

  // ---- the thread's rows
  function who(s, e) {
    const r = s.route;
    if (e.kind === "you") return { name: T(s, "you"), av: (s.user.name || "you")[0].toUpperCase() };
    // an agent's avatar takes its own state (pink only while it waits on him); a main is plain
    const dotOf = (project, name) => { const a = (s.agents[project] || []).find((x) => x.name === name && !x.main); return a ? agentDot(s, project, a) : ""; };
    if (e.kind === "agent") return isBise(r) ? { name: "bise", pearl: true } : { name: r.agent, dot: dotOf(r.project, r.agent) };
    // from_agent: a project's main in bise's thread, main's brief in an agent's, an agent in main's
    if (e.from_project && isBise(r)) return { name: `${D.pname(s, e.from_project)} · ${e.from}`, dot: dotOf(e.from_project, e.from), in: true };
    if (e.from === "bise") return { name: "bise", pearl: true };
    if (e.to && r.agent !== "main") return { name: `${e.from} → ${e.to}`, dot: dotOf(r.project, e.from) };
    return { name: e.from || "", dot: dotOf(r.project, e.from), in: r.agent === "main" && r.project !== HOME };
  }
  const VIA = { voice: "by_voice", capsule: "from_capsule", page: "from_page", bise: "via_bise" };
  function meta(s, e) {
    const bits = [hm(s, e.at_ms)];
    if (e.via && VIA[e.via]) bits.push(`${T(s, VIA[e.via])}${e.context && e.context.app ? `, ${T(s, "from_app", { app: e.context.app })}` : ""}`);
    else if (e.context && e.context.app) bits.push(T(s, "from_app", { app: e.context.app }));
    if (e.pending) bits.push(e.queued ? T(s, "queued") : T(s, "sending"));
    if (e.failed) bits.push(`${T(s, "not_sent")}: ${e.failed}`);
    return bits.join(" · ");
  }
  function ctx(e) {
    const c = e.context;
    if (!c) return null;
    const chips = [c.title, c.file && `${c.file}${c.selection ? "" : ""}`, c.selection].filter(Boolean);
    return { shot: c.shot || "", chips };
  }

  function row(s, e) {
    const k = keyOf(s.route);
    const open = M.isOpen(s, e.pos);
    switch (e.kind) {
      case "you": case "agent": case "from_agent": case "report": case "page": {
        const w = who(s, e);
        return { t: "msg", pos: e.pos, you: e.kind === "you", who: w, meta: meta(s, e), text: e.text, ctx: ctx(e),
          quote: e.quote ? D.quoteChip(e.quote, 0, (ms) => hm(s, ms), s).replace(/^❝ 1 /, "❝ ") : null,
          page: e.page ? { title: e.page.title, url: e.page.url } : null, pending: !!e.pending,
          error: (e.kind === "report" && e.report && e.report.kind === "failed") || !!e.failed };
      }
      case "delegation": {
        const d = e.delegation || {};
        const to = D.pname(s, d.project_to);
        const p1 = d.agent ? `${to} · main → ${d.agent}` : `${to} · main`;
        const running = d.state === "running";
        const steps = d.steps ? pct(d.step, d.steps) : null;
        return { t: "route", pos: e.pos, dot: running ? "wk" : d.state === "failed" ? "er" : "ok", p1, p2: `${e.text}${d.followed ? ` · ${T(s, "following")}` : ""}`,
          p3: running ? (steps != null ? `${steps}%` : mins(s.now - e.at_ms)) : d.state === "failed" ? hm(s, e.at_ms) : d.done_ms ? T(s, "done_at", { at: hm(s, d.done_ms) }) : T(s, "done"),
          bar: running ? (steps != null ? steps : -1) : null, act: { ev: "ui_route", project: d.project_to, agent: d.agent || "main" } };
      }
      case "agents": {
        const a = e.agents || { items: [], count: 0, names: [] };
        return { t: "fold", pos: e.pos, text: `${open ? "▾" : "▸"} ${T(s, "fold", { n: a.count, k: a.names.length })}`, open,
          items: open ? a.items.map((x) => row(s, { ...x, kind: "from_agent", to: undefined })) : [] };
      }
      case "tools": {
        const t = e.tools || { items: [] };
        return { t: "tool", pos: e.pos, label: t.summary || e.text, open, run: !!e.running, items: open ? t.items.map((i) => i.text) : [] };
      }
      case "card": {
        const c = e.card || {};
        if (c.answered && c.by && c.by !== "you")
          return { t: "answered", pos: e.pos, text: T(s, "asked_answered", { who: e.from, q: c.question, by: c.by === "main" ? T(s, "i") : c.by, a: c.answer }), why: c.why || "", open };
        const text = D.markerText(s, e);
        // '✓ answered: <his words>' holds one line; ▸ opens the rest (designer DS v5, as the TUI's)
        const done = (c.id in s.answered) || (c.answered && c.answer && (!c.by || c.by === "you"));
        if (done && text && (text.length > 90 || text.includes("\n")) && !open)
          return { t: "marker", pos: e.pos, text: `${D.oneLine(text, 88)} ▸`, card: c.id, act: { ev: "ui_fold", pos: e.pos } };
        if (done) return { t: "marker", pos: e.pos, text, card: c.id, act: text && text.length > 90 ? { ev: "ui_fold", pos: e.pos } : null };
        return { t: "marker", pos: e.pos, text, card: c.id, act: { ev: "ui_inbox", card: c.id } };
      }
      case "diff": {
        const d = e.diff;
        const sel = s.sel && s.sel.key === k && s.sel.pos === e.pos ? [Math.min(s.sel.a, s.sel.b), Math.max(s.sel.a, s.sel.b)] : null;
        return { t: "diff", pos: e.pos, file: d.path, add: d.add, del: d.del,
          lines: (d.hunk ? d.hunk.lines : []).map((l, i) => ({ i, o: l.old != null ? l.old : "", n: l.new != null ? l.new : "", sign: l.kind === "add" ? "+" : l.kind === "del" ? "−" : "", cls: l.kind === "add" ? "ad" : l.kind === "del" ? "rm" : "", text: l.text, sel: !!sel && i >= sel[0] && i <= sel[1] })) };
      }
      case "artifact": {
        const a = e.artifact || {};
        const fresh = Object.values(s.arts).flat().some((x) => x && x.id === a.id && x.new);
        return { t: "art", pos: e.pos, title: a.title || e.text, kind: a.kind || "page", meta: `${e.from || ""}${e.from ? " · " : ""}${hm(s, e.at_ms)}`, new: fresh, url: a.url || "" };
      }
    }
    return { t: "msg", pos: e.pos, who: { name: e.from || "" }, meta: hm(s, e.at_ms), text: e.text || "" };
  }

  function thread(s) {
    if (s.route.screen === "notfound") return { rows: [], empty: { b: T(s, "notfound_b"), s: T(s, "notfound_s", { want: s.route.want }) } };
    const t = s.threads[keyOf(s.route)];
    if (!t || (t.loading && !t.entries.length)) return { loading: true, rows: [] };
    const rows = [];
    let day = null;
    for (const e of t.entries) {
      const d = dayLabel(s, e.at_ms);
      if (d !== day && !(e.kind === "card" && e.pos >= 1000000000)) { rows.push({ t: "day", text: d }); day = d; }
      rows.push(row(s, e));
    }
    const a = M.agentRow(s);
    const empty = !t.entries.length && t.error ? { b: T(s, "thread_err"), s: t.error, err: true } : !t.entries.length ? (isBise(s.route) ? { b: T(s, "empty_bise"), s: T(s, "empty_bise_s") }
      : s.route.agent === "main" && !M.agentsOf(s, s.route.project).length ? { b: T(s, "empty_project", { p: D.pname(s, s.route.project) }), s: T(s, "empty_project_s") }
      : { b: T(s, "empty_agent"), s: "" }) : null;
    return { rows, more: !!t.more, paging: !!t.paging, typing: t.typing ? { who: isBise(s.route) ? "bise" : s.route.agent, text: t.typing } : null, empty, working: !!(a && a.status === "working") };
  }

  // ---- the composer and what sits above it
  function composer(s) {
    const k = keyOf(s.route);
    const d = D.dock(s);
    const a = M.agentRow(s);
    const text = s.drafts[k] || "";
    const quotes = (s.quotes[k] || []).map((q, i) => ({ i, text: D.quoteChip(q, i, (ms) => hm(s, ms), s) }));
    const working = a && a.status === "working" && s.route.agent !== "main";
    const div = D.dividerParts(s, d, a);
    return { dock: D.dockWords(s, d), div: div.text, divAcc: div.acc, divHint: div.hint, ph: D.placeholder(s, d, a), text, quotes,
      send: D.gone(s) ? "off" : text.trim() ? "on" : working ? "stop" : "off", disabled: !!s.offline || D.gone(s), locked: D.gone(s),
      keys: T(s, "keys", { working }) };
  }

  // ---- the right column: bise = waiting + made today; a project = its agents + scheduled
  function board(s) {
    const r = s.route;
    if (isBise(r)) {
      const waiting = D.allCards(s).map((c) => ({ who: `${D.pname(s, c.project)} · ${c.agent}`, text: c.title || c.question, act: { ev: "ui_inbox", card: c.id } }));
      const day = dayLabel(s, s.now);
      const made = Object.entries(s.arts).flatMap(([project, list]) => (Array.isArray(list) ? list : []).filter(Boolean).map((a) => ({ ...a, project })))
        .filter((a) => dayLabel(s, a.at_ms) === day).sort((a, b) => b.at_ms - a.at_ms).slice(0, 4)
        .map((a) => ({ title: a.title, kind: a.kind, new: !!a.new, act: { ev: "ui_route", project: a.project, agent: a.agent } }));
      return { sections: [{ sh: T(s, "board_waiting", { n: waiting.length }), kind: "cards", items: waiting }, { sh: T(s, "made_today"), kind: "thumbs", items: made }] };
    }
    if (r.agent !== "main") return null;
    const list = M.agentsOf(s, r.project).map((a, i) => {
      const dot = agentDot(s, r.project, a);
      // a job with a known end (S10's progress) draws its bar under the line, like the jobs strip
      const job = (s.jobs[r.project] || []).find((j) => j.agent === a.name && j.state === "running" && j.steps);
      return { name: a.name, key: i < 9 ? `⌥${i + 1}` : "", psi: !!a.branch, dot, w: a.title, pct: job ? pct(job.step, job.steps) : null, nd: dot === "nd", er: dot === "er", done: a.status === "done", act: { ev: "ui_route", project: r.project, agent: a.name } };
    });
    const sched = (s.sched[r.project] || []).map((x) => ({ text: `◷ ${x.label}`, when: whenText(s, x.at_ms) }));
    return { sections: [{ sh: T(s, "board_agents", { n: list.length }), kind: "agents", items: list }, ...(sched.length ? [{ sh: T(s, "scheduled"), kind: "sched", items: sched }] : [])] };
  }
  function whenText(s, ms) {
    const d = dayLabel(s, ms);
    const f = dayf(s.tz).format(new Date(s.now + 86400000)) === dayf(s.tz).format(new Date(ms));
    const h = +fmt(s.tz).format(new Date(ms)).slice(0, 2);
    if (f && h < 6) return T(s, "tonight", { at: hm(s, ms) });
    return d === T(s, "today") ? hm(s, ms) : f ? T(s, "tomorrow", { at: hm(s, ms) }) : `${d} ${hm(s, ms)}`;
  }

  // the pearl's mood (pearl.js MOODS): pink when someone waits, whirling while agents work
  function mood(s) {
    if (D.allCards(s).length) return "need";
    if (s.projects.some((p) => projectWorking(s, p.project))) return "work";
    return "rest";
  }

  // ⌘K's finder: its field and its rows, the selected one marked
  function finder(s) {
    if (!s.finder) return null;
    const list = root.AmbWinFind.rows(s, s.finder.q);
    const i = Math.min(s.finder.i, Math.max(0, list.length - 1));
    return { q: s.finder.q, rows: list.slice(0, 12).map((r, n) => ({ kind: r.kind, name: r.name, where: r.where, note: r.note || "",
      dot: r.kind === "ag" ? (openCardsOf(s, r.route.project, r.name).length ? "nd" : DOT[r.status] || "")
        : r.kind === "pj" ? (projectWaits(s, r.route.project) ? "nd" : projectWorking(s, r.route.project) ? "wk" : "") : "", on: n === i, act: { ev: "ui_find_open", i: n } })),
      empty: list.length ? "" : T(s, "find_none"), keys: T(s, "find_keys"), ph: T(s, "find_ph") };
  }

  // a project's other tabs: its changes (the agents' branches, S7 opens their review) and its
  // artifacts
  function tab(s) {
    const r = s.route;
    const t = r.project !== HOME && r.agent === "main" ? s.tab[r.project] || "thread" : "thread";
    if (t === "changes") {
      const items = M.agentsOf(s, r.project).filter((a) => a.branch).map((a) => ({ name: a.name, branch: a.branch, ahead: a.ahead || 0, dot: agentDot(s, r.project, a),
        what: a.ahead ? T(s, "changes_ahead", { n: a.ahead, t: a.title }) : T(s, "changes_none", { t: a.title }), act: { ev: "ui_route", project: r.project, agent: a.name } }));
      return { tab: t, items, empty: items.length ? null : { b: T(s, "no_branch"), s: T(s, "no_branch_s") } };
    }
    if (t === "artifacts") {
      const items = (s.arts[r.project] || []).slice().sort((a, b) => b.at_ms - a.at_ms).map((a) => ({ title: a.title, kind: a.kind, new: !!a.new,
        meta: `${a.agent} · ${dayLabel(s, a.at_ms) === T(s, "today") ? hm(s, a.at_ms) : dayLabel(s, a.at_ms)}`, act: { ev: "ui_route", project: r.project, agent: a.agent } }));
      return { tab: t, items, empty: items.length ? null : { b: T(s, "nothing_made"), s: T(s, "nothing_made_s") } };
    }
    return null;
  }

  // S7's part (amb-web): its screen's view, or a project's changes/artifacts tab when it draws
  // them; null leaves the window's own
  function s7(s) {
    const x = root.AmbWinS7;
    if (!x) return null;
    const r = s.route;
    if (r.screen) return ["review", "artifacts", "environments", "commit"].includes(r.screen) && x.view ? x.view(s) : null;
    const t = r.project !== HOME && r.agent === "main" ? s.tab[r.project] || "thread" : "thread";
    return t !== "thread" && x.tab ? x.tab(s, r.project, t) : null;
  }

  // the core's error, one line over the window (the toast's one action closes it)
  function toast(s) {
    const t = s.toast;
    if (!t) return null;
    const where = t.project ? (t.project === HOME ? "bise" : D.pname(s, t.project)) : "";
    return { text: where ? T(s, "err_line", { p: where, text: t.text }) : t.text, at: t.at, close: { text: T(s, "close"), act: { ev: "ui_toast_close", at: t.at } } };
  }

  function view(s) {
    const x = s7(s);
    const S11 = root.AmbWinS11;
    return { setup: S11 ? S11.view(s) : null, sheet: S11 ? S11.overlay(s) : null, s7: x, finder: finder(s), tab: x ? null : tab(s), theme: s.theme, focused: s.focused, route: s.route, title: M.titleOf(s, s.route), mood: mood(s),
      side: sidebar(s), head: x && x.head ? x.head : header(s), jobs: jobs(s), thread: thread(s), composer: composer(s), board: board(s), inbox: !!s.inbox, toast: toast(s) };
  }

  root.AmbWinView = { view, sidebar, header, jobs, thread, composer, board, mood, finder, tab, hm, dayLabel };
})(typeof window !== "undefined" ? window : globalThis);
