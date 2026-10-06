// bise ambient · the bar's agents and the spotlight's list, pure (split out of model.js, rule 6):
// roster() = your agents in the bar (round 10: fn a, the finder), spotList() = desktop S8's
// spotlight (v9: waiting for you, at work, environments with the front app's first; typed: names
// or a sentence for bise). model.js calls them with the cards it shows (visibleCards); check.mjs
// reads them through the model's view.
(function (root) {
  "use strict";
  const Wd = root.AmbWords;

  // ---- round 10 (identity10, preview A): your agents in the bar. fn a lists them all, fn space
  // + typing filters them (name, title, purpose; amb-core m_7030: archived rows come too, search
  // only); waiting on you first, then blocked, working, idle, done, failed. Pure: the view and
  // check.mjs read it.
  const ROSTER_ORDER = { waiting: 0, blocked: 1, working: 2, starting: 2, idle: 3, done: 4, failed: 5 };
  const match = (s, q) => {
    const i = q ? String(s || "").toLowerCase().indexOf(q) : -1;
    return i < 0 ? null : [i, i + q.length];
  };
  function roster(m, text, wall, cards) {
    const q = String(text || "").trim().toLowerCase();
    const rows = m.agents.map((a, i) => {
      const waits = cards.filter((c) => c.agent === a.name).length || Math.max(0, +a.waits || 0);
      const status = waits ? "waiting" : a.status === "starting" ? "working" : a.status || "idle";
      // its title line, never its brief or its last message (ambient m_8617)
      const title = Wd.oneLine(a.title || "");
      const sinceMs = +a.since_ms > 0 ? Math.max(0, wall - a.since_ms) : +a.turn_ms >= 0 && a.turn_ms != null ? +a.turn_ms : null;
      const followed = a.name in m.follows ? m.follows[a.name] : !!a.followed;
      return { name: a.name, project: a.project || null, pname: a.project_name || null, status, title, purpose: a.purpose || "", waits, followed, archived: !!a.archived, age: sinceMs == null ? "" : Wd.age(sinceMs), i,
        marks: { name: match(a.name, q), title: match(title, q) } };
    });
    const hit = (r) => !q || r.marks.name || r.marks.title || (r.purpose && r.purpose.toLowerCase().includes(q));
    // archived ones only when he searches for them
    return rows.filter((r) => (q ? hit(r) : !r.archived))
      .sort((a, b) => (ROSTER_ORDER[a.status] ?? 3) - (ROSTER_ORDER[b.status] ?? 3) || a.i - b.i)
      .map(({ i, ...r }) => r);
  }

  // ---- desktop S8: the spotlight's list (v9). Empty: waiting for you (cards), at work (working
  // agents), environments (the projects, the front app's first, ⌘1-9). Typed: 1-2 words that
  // name an agent or a project list those, the first one ⏎'s ("eng" opens streaming); a sentence
  // puts 'ask bise' first and keeps the agents it names below (↓ then ⏎ opens one).
  const words = (s) => String(s || "").toLowerCase().split(/[^\p{L}\p{N}_-]+/u).filter(Boolean);
  function frontProject(m, projects) {
    const f = m.front;
    if (!f) return null;
    const host = (/^[a-z]+:\/\/([^/:]+)/i.exec(f.url || "") || [])[1] || "";
    return projects.find((p) => p.path && f.path && (f.path === p.path || f.path.startsWith(p.path.replace(/\/$/, "") + "/")))
      || projects.find((p) => (p.hosts || []).includes(host))
      || projects.find((p) => p.name && ((host && host.includes(p.name)) || words(f.title).includes(p.name.toLowerCase()))) || null;
  }
  function spotList(m, wall, cards) {
    const q = m.spotText.trim(), ql = q.toLowerCase(), ws = words(q);
    const pname = (id) => (m.projects.find((p) => p.project === id) || {}).name || null;
    const all = roster(m, "", wall, cards).map((r) => ({ ...r, pname: r.pname || pname(r.project) }));
    const projects = m.projects.filter((p) => !p.home).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
    const front = frontProject(m, projects);
    const envs = (front ? [front, ...projects.filter((p) => p !== front)] : projects).map((p) => {
      const host = (/^[a-z]+:\/\/([^/:]+)/i.exec((m.front && m.front.url) || "") || [])[1];
      const n = p.agents != null ? +p.agents : m.agents.filter((a) => a.project === p.project).length;
      return { kind: "env", project: p.project, name: p.name, path: p.path || "", front: p === front,
        sub: p === front ? Wd.spot.inFront(host || (m.front && (m.front.path || m.front.app)) || "") : Wd.spot.envSub(p.branch || "main", n) };
    });
    const agentRow = (r) => ({ kind: "agent", name: r.name, project: r.project, pname: r.pname, status: r.status, title: r.title, marks: r.marks });
    if (!q) {
      // the kind by the glyph alone (ambient m_8793): ? a question, ! an approval, ✉ drafts to send
      const mark = (c) => { const P = root.AmbPolicy, G = Wd.card.glyph; return !P.approval(c) ? G.question : P.approvalKind(c) === "drafts" ? G.drafts : G.approval; };
      const cardRows = cards.map((c) => ({ kind: "card", id: c.id, agent: c.agent, pname: pname(c.project), text: root.AmbPolicy.approval(c) ? Wd.cardLine(c.title || c.text || "") : Wd.oneLine(c.title || c.text || ""), mark: mark(c) }));
      // what's in front when no project matches it (T1 run 4, step 16): its own row, first in
      // the environments ('Pricing · Acme', 'in front: acme.test · Chrome'); nothing to open
      const f = m.front, fhost = f && ((/^[a-z]+:\/\/([^/:]+)/i.exec(f.url || "") || [])[1] || "");
      const frontRow = f && !front ? [{ kind: "front", name: f.title || f.app, sub: Wd.spot.inFront([fhost || Wd.spot.path(f.path), f.title ? f.app : ""].filter(Boolean).join(" · ")) }] : [];
      const envRows = [...frontRow, ...envs];
      const work = all.filter((r) => r.status === "working").map(agentRow);
      return { q, mode: "empty", sections: [
        ...(cardRows.length ? [{ label: Wd.spot.waiting, acc: true, rows: cardRows }] : []),
        ...(work.length ? [{ label: Wd.spot.atWork, rows: work }] : []),
        ...(envRows.length ? [{ label: Wd.spot.envs, rows: envRows }] : [])] };
    }
    // 1-2 words: names (an agent's or a project's name, title or purpose, the project's agents)
    const short = ws.length <= 2;
    const nameHit = (r) => r.marks.name || r.marks.title || (r.purpose && r.purpose.toLowerCase().includes(ql)) || (r.pname && r.pname.toLowerCase().startsWith(ql));
    const marked = roster(m, q, wall, cards).map((r) => ({ ...r, pname: r.pname || pname(r.project) }));
    const withArchived = all.concat(marked.filter((r) => r.archived && !all.some((x) => x.name === r.name && x.project === r.project)));
    const byName = withArchived.map((r) => ({ ...r, marks: { name: match(r.name, ql), title: match(r.title, ql) } })).filter(nameHit);
    const envHit = envs.filter((e) => e.name.toLowerCase().startsWith(ql) || e.path.toLowerCase().includes(ql));
    if (short && (byName.length || envHit.length)) {
      return { q, mode: "names", sections: [{ label: Wd.spot.found, rows: [...byName.map(agentRow), ...envHit] }] };
    }
    // a sentence: bise first; the agents it names (a word is its name, or 2 of its title's words)
    const big = new Set(ws.filter((w) => w.length >= 4));
    const named = all.filter((r) => ws.includes(r.name.toLowerCase()) || words(r.title).filter((w) => big.has(w)).length >= 2)
      .map((r) => ({ ...r, marks: { name: ws.includes(r.name.toLowerCase()) ? [0, r.name.length] : null, title: null } }));
    return { q, mode: "ask", sections: [{ label: null, rows: [{ kind: "ask", text: q }, ...named.map(agentRow)] }] };
  }

  root.AmbSpot = { roster, spotList, match, frontProject, ROSTER_ORDER };
})(typeof window !== "undefined" ? window : globalThis);
