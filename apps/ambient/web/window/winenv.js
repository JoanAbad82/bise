// bise desktop · the environments screen (S7, desktop-app v9 "les environnements"): each project
// with its folder and branch, its worktrees ψ (the agent working there, what it does, how far
// ahead) and what runs (dev servers), plus "open in Terminal / editor". Pure step + view;
// draw() builds it from amb-kit's components. wins7.js wires it into the window (AmbWinS7).
//
// Core events (S3a drafts): worktrees {project, items: [{path, branch, agent?, dirty, ahead,
// behind}]} (frozen in bise-proto, amb-core e4160bd6: branch '' when detached, dirty a bool or a
// count of untracked files, head: the commit a detached one sits at, no agent = his own checkout), dev_servers {project, items: [{agent, name?, url, port, cmd, up}]}.
// Cmds: {cmd:'open_in', project, app:'terminal'|'editor', path} and {cmd:'app_open_url',
// project, url} go to the app (amb-mac); a worktree's row opens its agent's thread.
(function (root) {
  "use strict";
  const HOME = "home";

  const init = () => ({ wt: {}, dev: {} });
  const EVS = new Set(["worktrees", "dev_servers", "ui_env_open", "ui_env_url", "ui_env_sha"]);
  const owns = (ev) => EVS.has(ev.ev);

  function step(e, ev, s) {
    switch (ev.ev) {
      case "worktrees": return { e: { ...e, wt: { ...e.wt, [ev.project]: ev.items || [] } }, cmds: [] };
      case "dev_servers": return { e: { ...e, dev: { ...e.dev, [ev.project]: ev.items || [] } }, cmds: [] };
      case "ui_env_open": return { e, cmds: [{ cmd: "open_in", project: ev.project, app: ev.app, path: ev.path }] };
      case "ui_env_url": return { e, cmds: [{ cmd: "app_open_url", project: ev.project, url: ev.url }] };
      // a detached worktree's commit (ambient m_8946, the sha rule): GitHub with a GitHub remote, else copied
      case "ui_env_sha": {
        const p = ((s && s.projects) || []).find((x) => x.project === ev.project);
        const web = p && /^https:\/\/github\.com\//.test(p.web || "") ? p.web.replace(/\/$/, "") : null;
        if (web) return { e, cmds: [{ cmd: "app_open_url", project: ev.project, url: `${web}/commit/${ev.sha}` }] };
        return { e: { ...e, copied: ev.sha }, cmds: [{ cmd: "app_copy", text: ev.sha }] };
      }
    }
    return { e, cmds: [] };
  }

  const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
  const bare = (url) => String(url || "").replace(/^https?:\/\//, "").replace(/\/$/, "");

  // the worktrees an agent works in (the project's own folder is the project's line, not a row)
  const agentTrees = (e, p) => (e.wt[p.project] || []).filter((w) => w.agent && w.path !== p.path);

  function treeRow(s, p, w) {
    const a = (s.agents[p.project] || []).find((x) => x.name === w.agent) || { status: "idle", title: "" };
    const what = a.status === "done" && w.ahead > 0 ? "ready to merge" : a.title || "";
    const end = w.ahead > 0 ? `${w.ahead} ahead` : w.behind > 0 ? `${w.behind} behind` : a.status === "working" ? "working" : "idle";
    const dot = a.status === "working" ? "wk" : a.status === "done" ? "ok" : a.status === "waiting" ? "nd" : "";
    // detached: git's own words with its commit, 'detached at e0f3df5' (ambient m_8946); 'detached' with no sha
    const web = /^https:\/\/github\.com\//.test(p.web || "");
    const sha = !w.branch && w.head ? { text: s.s7.env.copied === w.head ? `copied ${w.head.slice(0, 7)}` : w.head.slice(0, 7), tip: web ? "open on GitHub" : "copy",
      act: { ev: "ui_env_sha", project: p.project, sha: w.head } } : null;
    return { kind: "wt", branch: w.branch || (sha ? "detached at " : "detached"), sha, agent: w.agent, what, end, dot, dirty: !!w.dirty,
      act: { ev: "ui_route", project: p.project, agent: w.agent } };
  }
  function serverRow(p, d) {
    return { kind: "dev", name: d.name || d.cmd || "dev server", url: bare(d.url), end: d.up ? "running" : "stopped", up: !!d.up,
      act: d.up ? { ev: "ui_env_url", project: p.project, url: d.url } : null };
  }

  function view(s) {
    const e = s.s7.env;
    const projects = s.projects.filter((p) => !p.home && p.project !== HOME).sort((a, b) => (a.order || 0) - (b.order || 0));
    const groups = projects.map((p) => {
      const rows = [...agentTrees(e, p).map((w) => treeRow(s, p, w)), ...(e.dev[p.project] || []).map((d) => serverRow(p, d))];
      const line = [p.path, ...(p.git ? ["git", p.branch || ""] : [])].filter(Boolean).join(" · ");
      const open = (app, text) => ({ text, act: { ev: "ui_env_open", project: p.project, app, path: p.path } });
      return { project: p.project, name: p.name, line, offline: !!p.offline,
        open: [open("terminal", "open in Terminal"), open("editor", "open in editor")],
        rows, empty: rows.length ? null : "no worktree" };
    });
    const trees = projects.reduce((n, p) => n + agentTrees(e, p).length, 0);
    const servers = projects.reduce((n, p) => n + (e.dev[p.project] || []).length, 0);
    return { screen: "environments",
      head: { t1: "environments", t2: [plural(projects.length, "project"), plural(trees, "worktree"), plural(servers, "dev server")], acc: -1,
        end: [{ kind: "btn", text: "+ add a project", act: { ev: "ui_add_project" } }] },
      groups };
  }

  // ---- draw: a group per project (its line, the two opens), then its rows
  function draw(d, UI) {
    const { h, act } = UI.core;
    // the sha takes its own click (its row's click opens the agent)
    const shaEl = (x) => { const el = act(h("span", "w7-sha", x.text), x.act); el.title = x.tip; return el; };
    return h("div", "w7 w7-env", d.groups.map((g) => h("section", ["w7-group", g.offline && "is-off"],
      h("div", "w7-gh", h("b", "nm", g.name), h("span", "sub", g.line), h("span", "end",
        g.open.map((o) => UI.btn.render({ kind: "ghost", text: o.text, act: o.act })))),
      g.rows.map((r) => (r.kind === "wt"
        ? act(h("div", "b-row w7-wt", h("span", "psi", "ψ"), h("span", "br", r.branch, r.sha ? shaEl(r.sha) : null), h("b", "nm", r.agent),
          h("span", "w", r.what), h("span", "end", r.end)), r.act)
        : act(h("div", "b-row w7-dev", UI.dot.render({ state: r.up ? "ok" : "" }), h("span", "nm", r.name),
          h("span", "url", r.url), h("span", ["end", r.up && "ok"], r.end)), r.act))),
      g.empty ? h("div", "w7-none", g.empty) : null)));
  }

  root.AmbWinEnv = { init, owns, step, view, draw };
})(typeof window !== "undefined" ? window : globalThis);
