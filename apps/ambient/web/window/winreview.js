// bise desktop · the review screen (S7, desktop-app v9 "review", ⌘D on an agent): what an
// agent's branch changes, result first (the number, before → after, a small graph), then the
// files with a note and ±, then the picked file's diff; selected lines become a quote ❝ in the
// composer below (a question to that agent: amb-win's model files it under the screen's
// key 'review:<p>/<agent>' and ⏎ sends it with his words); the merge decision is that agent's approval card,
// above the composer (amb-win's dock: the rule "everything waiting for you sits above the
// composer" holds here too). Pure enter/step/view; draw() builds it from amb-kit's components.
//
// Core: entering asks {cmd:'diff', project, agent}; the core answers the S3a draft event
// diff {project, agent, base, head, files: [{path, status, add, del, note?, hunks: [{header,
// lines: [{kind: ctx|add|del, old?, new?, text}]}]}], result?: {label, sub?, before, after,
// unit, series?: {before: [n], after: [n]}}}.
(function (root) {
  "use strict";
  const init = () => ({ diffs: {}, pick: {}, sel: null });
  const EVS = new Set(["diff", "ui_rv_file", "ui_rv_line", "ui_rv_merge"]);
  const owns = (ev) => EVS.has(ev.ev);
  const k = (project, agent) => `${project}/${agent}`;
  const base = (p) => String(p || "").split("/").pop();

  function enter(e, route) {
    return { e: { ...e, sel: null }, cmds: [{ cmd: "diff", project: route.project, agent: route.agent }] };
  }

  // the picked file's lines, hunk headers between them; i counts the selectable lines only
  function linesOf(file) {
    const out = [];
    let i = 0;
    for (const hk of (file && file.hunks) || []) {
      out.push({ kind: "hunk", text: hk.header });
      for (const l of hk.lines || []) out.push({ kind: l.kind, old: l.old, new: l.new, text: l.text, i: i++ });
    }
    return out;
  }
  // lines a..b of a file -> the quote the send carries (windock's shape: agent, text, file, lines, n)
  function quote(agent, file, a, b) {
    const ls = linesOf(file).filter((l) => l.kind !== "hunk" && l.i >= Math.min(a, b) && l.i <= Math.max(a, b));
    const nums = ls.map((l) => (l.new != null ? l.new : l.old)).filter((n) => n != null);
    return { agent, text: ls.map((l) => l.text).join("\n"), file: file.path, lines: [Math.min(...nums), Math.max(...nums)], n: ls.length };
  }

  function step(e, ev, s) {
    const r = s.route;
    switch (ev.ev) {
      case "diff": return { e: { ...e, diffs: { ...e.diffs, [k(ev.project, ev.agent)]: ev } }, cmds: [] };
      case "ui_rv_file": return { e: { ...e, pick: { ...e.pick, [k(r.project, r.agent)]: ev.i }, sel: null }, cmds: [] };
      case "ui_rv_line": {
        const d = e.diffs[k(r.project, r.agent)];
        const fi = e.pick[k(r.project, r.agent)] || 0;
        const file = d && d.files[fi];
        if (!file) return { e, cmds: [] };
        // shift extends the selection in the same file; amb-win's model keeps one quote per pos, so
        // a file's quote has its own pos: -(file index + 1) (no thread entry: a review line has
        // no pos in the agent's thread; file + lines say where it is)
        const a = ev.shift && e.sel && e.sel.key === k(r.project, r.agent) && e.sel.file === fi ? e.sel.a : ev.i;
        const q = { ...quote(r.agent, file, a, ev.i), pos: -(fi + 1) };
        return { e: { ...e, sel: { key: k(r.project, r.agent), file: fi, a, b: ev.i } }, cmds: [], quote: q };
      }
      // merge into main: the agent's approval card when it has one (its "merge" option), else the
      // merge cmd (S3a draft); the core answers with the diff carrying merged: <sha>
      case "ui_rv_merge": {
        const c = approval(s, r.project, r.agent);
        if (c) {
          const o = (c.options || []).find((x) => /merge/i.test(x.label)) || (c.options || [])[0];
          return { e, cmds: [{ cmd: "answer", project: r.project, card: c.id, reply: String(o ? o.n : 1) }] };
        }
        return { e, cmds: [{ cmd: "merge", project: r.project, agent: r.agent }] };
      }
    }
    return { e, cmds: [] };
  }
  // the agent's open approval card, if any (the merge decision above the composer)
  const approval = (s, project, agent) => ((s.cards && s.cards[project]) || []).find((c) => c.agent === agent && (c.kind === "approval" || c.kind === "merge"));

  // keys on the review (amb-win forwards ui_key while a screen shows): ⌘⏎ merges, ⌘O opens the
  // worktree in his editor; never while he is writing in the composer
  function key(e, ev, s) {
    const r = s.route;
    if (!ev.meta || ((s.drafts && s.drafts[`review:${k(r.project, r.agent)}`]) || "").trim()) return null;
    if (ev.key === "Enter") return step(e, { ev: "ui_rv_merge" }, s);
    const lower = String(ev.key || "").toLowerCase();
    const p = editorPath(s, r.project, r.agent);
    if (lower === "o" && p) return { e, cmds: [{ cmd: "open_in", project: r.project, app: "editor", path: p }], eat: true };
    return null;
  }
  const editorPath = (s, project, agent) => {
    const w = ((s.s7.env && s.s7.env.wt[project]) || []).find((x) => x.agent === agent);
    return w ? w.path : null;
  };

  const num = (n) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10));
  const pm = (f) => [f.add ? `+${f.add}` : "", f.del ? `−${f.del}` : ""].filter(Boolean).join(" ");

  function view(s) {
    const r = s.route;
    const e = s.s7.rv;
    const d = e.diffs[k(r.project, r.agent)];
    const p = s.projects.find((x) => x.project === r.project) || { name: r.project };
    const a = (s.agents[r.project] || []).find((x) => x.name === r.agent) || { status: "idle", title: "" };
    const dot = a.status === "working" ? "wk" : a.status === "done" ? "ok" : a.status === "waiting" ? "nd" : "";
    const merged = d && d.merged;
    const head = { t1: r.agent, dot: merged ? "ok" : dot, t2: [p.name, ...(a.branch || (d && d.head) ? [`ψ ${a.branch || d.head}`] : []), ...(a.title ? [a.title] : []), merged ? `merged · ${merged}` : a.status], acc: -1,
      end: [{ kind: "btn", text: "thread", act: { ev: "ui_route", project: r.project, agent: r.agent } }] };
    if (!d) return { screen: "review", head, loading: true };
    const fi = Math.min(e.pick[k(r.project, r.agent)] || 0, Math.max(0, d.files.length - 1));
    const add = d.files.reduce((n, f) => n + f.add, 0), del = d.files.reduce((n, f) => n + f.del, 0);
    const res = d.result ? { label: d.result.label, sub: d.result.sub || "", text: `${num(d.result.before)} ${d.result.unit} → ${num(d.result.after)} ${d.result.unit}`,
      better: d.result.after < d.result.before, series: d.result.series || null } : null;
    const file = d.files[fi];
    const sel = e.sel && e.sel.key === k(r.project, r.agent) && e.sel.file === fi ? [Math.min(e.sel.a, e.sel.b), Math.max(e.sel.a, e.sel.b)] : null;
    // what he can do with it: merge (primary), ask for changes (the composer, addressed), his editor
    const ed = editorPath(s, r.project, r.agent);
    const actions = merged || !d.files.length ? [] : [
      { text: "merge into main", kbd: "⌘⏎", kind: "pri", act: { ev: "ui_rv_merge" } },
      { text: "ask for changes", act: { ev: "ui_type", text: `${r.agent}, ` } },
      ...(ed ? [{ text: "open in editor", kbd: "⌘O", act: { ev: "ui_env_open", project: r.project, app: "editor", path: ed } }] : [])];
    return { screen: "review", head, result: res, actions,
      changed: d.files.length ? `${d.files.length} file${d.files.length > 1 ? "s" : ""} · +${add} −${del}` : "",
      files: d.files.map((f, i) => ({ name: base(f.path), note: f.note || (f.status === "added" ? "new file" : f.status === "deleted" ? "deleted" : ""), end: pm(f), on: i === fi,
        act: { ev: "ui_rv_file", i } })),
      diff: file ? { file: file.path, add: file.add, rm: file.del,
        lines: linesOf(file).map((l) => (l.kind === "hunk" ? { hunk: l.text }
          : { old: l.old, new: l.new, sign: l.kind === "add" ? "+" : l.kind === "del" ? "-" : "", text: l.text, i: l.i, sel: !!(sel && l.i >= sel[0] && l.i <= sel[1]),
            act: { ev: "ui_rv_line", i: l.i } })) } : null,
      empty: d.files.length ? null : { title: "nothing changed yet", text: `${r.agent}'s branch has no commit ahead of ${d.base || "main"}` } };
  }

  // ---- draw: the result, the files, the picked file's diff (amb-kit's sideview + diff)
  function graph(series) {
    const doc = root.document;
    if (!series || !doc) return null;
    const all = [...series.before, ...series.after];
    const hi = Math.max(...all, 1), W = 300, H = 56;
    const pts = (xs) => xs.map((v, i) => `${Math.round((i / Math.max(1, xs.length - 1)) * W)},${Math.round(H - 4 - (v / hi) * (H - 8))}`).join(" ");
    const t = doc.createElement("template");
    t.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="w7-graph"><polyline class="sv-err" points="${pts(series.before)}"/><polyline class="sv-ok" points="${pts(series.after)}"/></svg>`;
    return t.content.firstChild;
  }
  function draw(d, UI) {
    const { h } = UI.core;
    if (d.loading) return h("div", "w7 w7-rv", UI.skel.render({}), UI.skel.render({}));
    if (d.empty) return h("div", "w7 w7-rv", UI.empty.render(d.empty));
    const diff = d.diff ? UI.diff.render({ file: d.diff.file, add: d.diff.add, rm: d.diff.rm,
      lines: d.diff.lines.filter((l) => !l.hunk).map((l) => ({ old: l.old, new: l.new, sign: l.sign, text: l.text, sel: l.sel, act: l.act })) }) : null;
    return h("div", "w7 w7-rv",
      d.result ? h("div", "w7-result", h("div", "w7-rl", h("span", "lb", d.result.label), d.result.sub ? h("span", "sb", d.result.sub) : null,
        d.result.series ? h("span", "lg", h("i", "bf", "before"), " · ", h("i", "af", "after")) : null),
        h("div", ["w7-rn", d.result.better && "ok"], d.result.text), graph(d.result.series)) : null,
      d.actions.length ? h("div", "w7-acts", d.actions.map((x) => UI.btn.render({ kind: x.kind, text: x.kbd ? [x.text, " ", UI.kbd.render({ text: x.kbd })] : x.text, act: x.act }))) : null,
      UI.sideview.render({ title: "what changed", chip: { text: d.changed },
        files: d.files.map((f) => ({ name: f.note ? `${f.name}  ·  ${f.note}` : f.name, end: f.end, on: f.on, act: f.act })) }),
      diff);
  }

  root.AmbWinReview = { init, owns, enter, step, key, view, draw, linesOf, quote };
})(typeof window !== "undefined" ? window : globalThis);
