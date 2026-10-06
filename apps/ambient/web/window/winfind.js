// bise desktop · ⌘K in the window: find an agent or a project by its name, pure. What he types
// filters bise, every project and every agent (a name that starts with it first, then one that
// holds it); ↑ ↓ move, ⏎ opens, esc closes. winmodel.js holds its state ({q, i}); winview.js
// shows its rows; check-win.mjs checks both.
(function (root) {
  "use strict";
  const HOME = "home";

  // every place he can open, in the sidebar's order
  function places(s) {
    const out = [{ kind: "me", name: "bise", where: "every project", route: { project: HOME, agent: "main" } }];
    const projects = s.projects.filter((p) => !p.home).sort((a, b) => (a.order || 0) - (b.order || 0));
    for (const p of projects) {
      out.push({ kind: "pj", name: p.name, where: p.path || "", route: { project: p.project, agent: "main" } });
      for (const a of (s.agents[p.project] || []).filter((x) => !x.main && !x.archived))
        out.push({ kind: "ag", name: a.name, where: p.name, note: a.title || "", status: a.status, route: { project: p.project, agent: a.name } });
    }
    return out;
  }

  // the rows for what he typed: starts-with before holds, the sidebar's order inside each
  function rows(s, q) {
    const w = String(q || "").trim().toLowerCase();
    const all = places(s);
    if (!w) return all;
    const starts = all.filter((x) => x.name.toLowerCase().startsWith(w));
    const holds = all.filter((x) => !x.name.toLowerCase().startsWith(w) && x.name.toLowerCase().includes(w));
    return [...starts, ...holds];
  }

  // a key while the finder is open: {f, route, eat}; route = where ⏎ goes, f = null closes it
  function key(s, f, k) {
    const list = rows(s, f.q);
    if (k === "Escape") return { f: null, eat: true };
    if (k === "ArrowDown") return { f: { ...f, i: list.length ? (f.i + 1) % list.length : 0 }, eat: true };
    if (k === "ArrowUp") return { f: { ...f, i: list.length ? (f.i - 1 + list.length) % list.length : 0 }, eat: true };
    if (k === "Enter") { const r = list[Math.min(f.i, list.length - 1)]; return { f: r ? null : f, route: r ? r.route : null, eat: true }; }
    return { f, eat: false };
  }

  root.AmbWinFind = { places, rows, key };
})(typeof window !== "undefined" ? window : globalThis);
