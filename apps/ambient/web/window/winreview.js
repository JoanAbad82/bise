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
// unit, series?: {before: [n], after: [n]}}}. Frozen in bise-proto (amb-core 6e2503f6): a file may
// come without hunks (truncated, binary, generated), the diff may carry merged: <sha> and a note
// (an archived agent's folder gone); an unknown agent answers error {cmd:'diff', text}.
(function (root) {
  "use strict";
  const init = () => ({ diffs: {}, pick: {}, sel: null });
  const EVS = new Set(["diff", "worktrees", "merged", "ui_rv_file", "ui_rv_line", "ui_rv_merge", "ui_rv_retry", "ui_rv_more", "ui_rv_sha"]);
  const owns = (ev) => EVS.has(ev.ev) || (ev.ev === "error" && ev.cmd === "diff");
  const k = (project, agent) => `${project}/${agent}`;
  // a route's diff: the agent's branch, or one landed commit (review/<p>/<agent>/<sha>; the diff
  // answer echoes commit, amb-core m_8975)
  const kc = (project, agent, commit) => (commit ? `${project}/@${commit}` : k(project, agent));
  const rk = (r) => kc(r.project, r.agent, r.commit);
  // screen 'commit' (amb-win's route commit/<project>/<sha>, m_8977): one landed commit's review,
  // its agent the one 'merged today' names (else main, who lands his own and the features)
  const byOf = (e, project, sha) => { const c = (((e && e.merged) || {})[project] || []).find((x) => x.sha === sha); return c && c.by && c.by !== "you" ? c.by : "main"; };
  const norm = (e, r) => (r && r.screen === "commit" ? { ...r, agent: byOf(e, r.project, r.sha), commit: r.sha } : r);
  // a route's merged sha: the diff's merged (a branch just merged), or the commit itself (screen
  // 'commit' opens a commit already on main: read-only, never 'merge into main', lead m_9357)
  const mergedOf = (d, r) => (d && d.merged) || (r && r.screen === "commit" ? r.sha : null);
  // when that commit landed, from 'merged today' (its at_ms), as hh:mm in his time zone
  const whenOf = (s, e, r, sha) => {
    const c = sha && (((e && e.merged) || {})[r.project] || []).find((x) => x.sha === sha || short(x.sha) === short(sha));
    return c && c.at_ms ? new Date(c.at_ms).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, ...(s.tz ? { timeZone: s.tz } : {}) }) : "";
  };
  const base = (p) => String(p || "").split("/").pop();

  function enter(e, route0) {
    const route = norm(e, route0);
    return { e: { ...e, sel: null, err: null }, cmds: [{ cmd: "diff", project: route.project, agent: route.agent, ...(route.commit ? { commit: route.commit } : {}) }] };
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
    const r = norm(e, s.route);
    switch (ev.ev) {
      case "diff": return { e: { ...e, diffs: { ...e.diffs, [kc(ev.project, ev.agent, ev.commit)]: ev }, err: null }, cmds: [] };
      // the changes tab's summaries: each agent with work ahead gets its diff asked once per state
      // of its worktree (ahead, head), so '3 files · +84 −21' is there before he opens the review
      case "worktrees": {
        const asked = { ...(e.asked || {}) }, cmds = [];
        for (const w of ev.items || []) {
          if (!w.agent || !(w.ahead > 0)) continue;
          const sig = `${w.ahead}:${w.head || ""}`, key = k(ev.project, w.agent);
          if (asked[key] !== sig) { asked[key] = sig; cmds.push({ cmd: "diff", project: ev.project, agent: w.agent }); }
        }
        return { e: { ...e, asked }, cmds };
      }
      // what landed on the trunk today (amb-core m_8975: newest first, by = an agent, 'main', 'you' or absent)
      case "merged": return { e: { ...e, merged: { ...(e.merged || {}), [ev.project]: ev.items || [] } }, cmds: [] };
      // the core couldn't make it (an unknown agent): the screen says so instead of loading forever
      case "error": return { e: { ...e, err: r && r.screen === "review" ? { key: rk(r), text: String(ev.text || ""), more: false } : e.err }, cmds: [] };
      // '↻ try again' asks the diff again; '▸' shows the rest of the core's text
      case "ui_rv_retry": return { e: { ...e, err: null }, cmds: [{ cmd: "diff", project: r.project, agent: r.agent }] };
      case "ui_rv_more": return { e: { ...e, err: e.err && { ...e.err, more: !e.err.more } }, cmds: [] };
      // the merged sha (ambient m_8830, identity10's click audit): the commit on GitHub when the
      // project has a GitHub remote (its row's web url), else the sha copied ('copied e0f3df5')
      case "ui_rv_sha": {
        const sha = mergedOf(e.diffs[rk(r)], r), web = webOf(s, r.project);
        if (!sha) return { e, cmds: [] };
        if (web) return { e, cmds: [{ cmd: "app_open_url", url: `${web}/commit/${sha}`, project: r.project }] };
        return { e: { ...e, copied: sha }, cmds: [{ cmd: "app_copy", text: sha }] };
      }
      case "ui_rv_file": return { e: { ...e, pick: { ...e.pick, [rk(r)]: ev.i }, sel: null }, cmds: [] };
      case "ui_rv_line": {
        const d = e.diffs[rk(r)];
        const fi = e.pick[rk(r)] || 0;
        const file = d && d.files[fi];
        if (!file) return { e, cmds: [] };
        // shift extends the selection in the same file; amb-win's model keeps one quote per pos, so
        // a file's quote has its own pos: -(file index + 1) (no thread entry: a review line has
        // no pos in the agent's thread; file + lines say where it is)
        const a = ev.shift && e.sel && e.sel.key === rk(r) && e.sel.file === fi ? e.sel.a : ev.i;
        const q = { ...quote(r.agent, file, a, ev.i), pos: -(fi + 1) };
        return { e: { ...e, sel: { key: rk(r), file: fi, a, b: ev.i } }, cmds: [], quote: q };
      }
      // merge into main: the agent's approval card when it has one (its "merge" option), else the
      // merge cmd (S3a draft); the core answers with the diff carrying merged: <sha>
      case "ui_rv_merge": {
        // a commit already on main has nothing to merge (⌘⏎ there does nothing)
        if (mergedOf(e.diffs[rk(r)], r)) return { e, cmds: [] };
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
  // a project's web url on GitHub (amb-core's ProjectRow web, when its remote is GitHub)
  const webOf = (s, project) => { const p = (s.projects || []).find((x) => x.project === project); return p && /^https:\/\/github\.com\//.test(p.web || "") ? p.web.replace(/\/$/, "") : null; };
  // the agent's open approval card, if any (the merge decision above the composer)
  const approval = (s, project, agent) => ((s.cards && s.cards[project]) || []).find((c) => c.agent === agent && (c.kind === "approval" || c.kind === "merge"));

  // keys on the review (amb-win forwards ui_key while a screen shows): ⌘⏎ merges, ⌘O opens the
  // worktree in his editor; never while he is writing in the composer
  function key(e, ev, s) {
    const r = norm(e, s.route);
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

  const short = (sha) => String(sha).slice(0, 7);
  const num = (n) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10));
  // a file's note in the list, and the diff's body when it has no lines to show (ambient m_8820):
  // 'renamed from decode.rs' (the old name when the core gives it, f.from), a binary's size when it
  // has one (f.size, bytes), ⌘O open in editor after the ones he can read there
  const fileNote = (f) => (f.status === "added" ? "new file" : f.status === "deleted" ? "deleted" : f.status === "renamed" ? (f.from ? `renamed from ${base(f.from)}` : "renamed")
    : f.binary ? "binary" : f.generated ? "generated" : f.truncated ? "too big to show" : "");
  const bytes = (n) => (n >= 1e6 ? `${num(Math.round(n / 1e5) / 10)} MB` : n >= 1e3 ? `${Math.round(n / 1e3)} KB` : `${n} B`);
  const bodyNote = (f) => (f.binary ? { text: `a binary file${f.size > 0 ? `, ${bytes(f.size)}` : ""}: no lines to show.` }
    : f.generated ? { text: "a generated file: its lines aren't shown.", open: true }
    : f.truncated ? { text: "too big to show here.", open: true } : { text: "no lines to show." });
  const noLines = (f, ed, project) => { const b = bodyNote(f); return { text: b.text, open: b.open && ed ? { ev: "ui_env_open", project, app: "editor", path: ed } : null }; };
  const pm = (f) => [f.add ? `+${f.add}` : "", f.del ? `−${f.del}` : ""].filter(Boolean).join(" ");

  function view(s) {
    const e = s.s7.rv;
    const r = norm(e, s.route);
    const d = e.diffs[rk(r)];
    const p = s.projects.find((x) => x.project === r.project) || { name: r.project };
    const a = (s.agents[r.project] || []).find((x) => x.name === r.agent) || { status: "idle", title: "" };
    const dot = a.status === "working" ? "wk" : a.status === "done" ? "ok" : a.status === "waiting" ? "nd" : "";
    const merged = mergedOf(d, r);
    const landed = r.screen === "commit";
    const when = merged ? whenOf(s, e, r, merged) : "";
    // a landed commit's header says what it is (merged · e0f3df5 · 10:40), not its agent's live branch
    const head = { t1: r.agent, dot: merged ? "ok" : dot, t2: [p.name, ...(!landed && (a.branch || (d && d.head)) ? [`ψ ${a.branch || d.head}`] : []), ...(!landed && a.title ? [a.title] : []),
      merged ? [`merged · ${short(merged)}`, when].filter(Boolean).join(" · ") : a.status], acc: -1,
      end: [{ kind: "btn", text: "thread", act: { ev: "ui_route", project: r.project, agent: r.agent } }] };
    // an error keeps the way back (ambient m_8820): '▲ can't show the changes.', the core's text (one line, ▸ the rest), '↻ try again'
    if (!d && e.err && e.err.key === rk(r)) return { screen: "review", head, err: { title: "can't show the changes.", text: e.err.text, more: e.err.more } };
    if (!d) return { screen: "review", head, loading: true };
    const fi = Math.min(e.pick[rk(r)] || 0, Math.max(0, d.files.length - 1));
    const add = d.files.reduce((n, f) => n + f.add, 0), del = d.files.reduce((n, f) => n + f.del, 0);
    const res = d.result ? { label: d.result.label, sub: d.result.sub || "", text: `${num(d.result.before)} ${d.result.unit} → ${num(d.result.after)} ${d.result.unit}`,
      better: d.result.after < d.result.before, series: d.result.series || null } : null;
    const file = d.files[fi];
    const sel = e.sel && e.sel.key === rk(r) && e.sel.file === fi ? [Math.min(e.sel.a, e.sel.b), Math.max(e.sel.a, e.sel.b)] : null;
    // what he can do with it: merge (primary), ask for changes (the composer, addressed), his editor
    const ed = editorPath(s, r.project, r.agent);
    const actions = merged || !d.files.length ? [] : [
      { text: "merge into main", kbd: "⌘⏎", kind: "pri", act: { ev: "ui_rv_merge" } },
      { text: "ask for changes", act: { ev: "ui_type", text: `${r.agent}, ` } },
      ...(ed ? [{ text: "open in editor", kbd: "⌘O", act: { ev: "ui_env_open", project: r.project, app: "editor", path: ed } }] : [])];
    return { screen: "review", head, result: res, actions,
      changed: d.files.length ? `${d.files.length} file${d.files.length > 1 ? "s" : ""} · +${add} −${del}` : "",
      files: d.files.map((f, i) => ({ name: base(f.path), note: f.note || fileNote(f), end: pm(f), on: i === fi,
        act: { ev: "ui_rv_file", i } })),
      diff: file ? { file: file.path, add: file.add, rm: file.del, none: (file.hunks || []).length ? null : noLines(file, ed, r.project),
        lines: linesOf(file).map((l) => (l.kind === "hunk" ? { hunk: l.text }
          : { old: l.old, new: l.new, sign: l.kind === "add" ? "+" : l.kind === "del" ? "-" : "", text: l.text, i: l.i, sel: !!(sel && l.i >= sel[0] && l.i <= sel[1]),
            act: { ev: "ui_rv_line", i: l.i } })) } : null,
      empty: d.files.length ? null : merged ? { title: `merged into ${d.base || "main"} · `, text: d.note || "",
        sha: { text: e.copied === merged ? `copied ${short(merged)}` : short(merged), tip: webOf(s, r.project) ? "open on GitHub" : "copy", act: { ev: "ui_rv_sha" } } }
        : { title: "nothing changed yet", text: d.note || `${r.agent}'s branch has no commit ahead of ${d.base || "main"}` } };
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
    const { h, act } = UI.core;
    if (d.loading) return h("div", "w7 w7-rv", UI.skel.render({}), UI.skel.render({}));
    if (d.empty && d.empty.sha) {
      const sha = act(h("span", "w7-sha", d.empty.sha.text), d.empty.sha.act);
      sha.title = d.empty.sha.tip;
      return h("div", "w7 w7-rv", h("div", "b-empty", h("b", null, d.empty.title, sha), d.empty.text && h("span", null, d.empty.text)));
    }
    if (d.empty) return h("div", "w7 w7-rv", UI.empty.render(d.empty));
    if (d.err) return h("div", "w7 w7-rv", h("div", "w7-err", h("div", "t", h("span", "m", "▲"), " ", d.err.title),
      h("div", ["x", d.err.more && "all"], h("span", "tx", d.err.text), act(h("span", "mo", d.err.more ? "▾" : "▸"), { ev: "ui_rv_more" })),
      UI.btn.render({ text: "↻ try again", act: { ev: "ui_rv_retry" } })));
    const none = d.diff && d.diff.none;
    const diff = none ? h("div", "w7-none", none.text, none.open ? act(h("span", "w7-hint", "   ", UI.kbd.render({ text: "⌘O" }), " open in editor"), none.open) : null) : d.diff ? UI.diff.render({ file: d.diff.file, add: d.diff.add, rm: d.diff.rm,
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

  // ---- a project's changes tab (lead m_8972; amb-win hooks the tab): one row per agent with work
  // ahead of the trunk (its worktree's branch, the diff's files and ±, 'at work' / 'ready to merge'),
  // a click opens its review; then 'merged today' (sha, title, who, time), a click opens that
  // commit's diff. Words: best guesses, asked to ambient.
  const sum = (d, w) => {
    if (!d || d.merged || !d.files.length) return `${w.ahead} ahead`;
    const add = d.files.reduce((n, f) => n + f.add, 0), del = d.files.reduce((n, f) => n + f.del, 0);
    return `${d.files.length} file${d.files.length > 1 ? "s" : ""} · +${add} −${del}`;
  };
  function changes(s, project) {
    const e = s.s7.rv, agents = s.agents[project] || [];
    const trunk = ((s.projects || []).find((p) => p.project === project) || {}).branch || "main";
    const rows = ((s.s7.env.wt[project]) || []).filter((w) => w.agent && w.ahead > 0).map((w) => {
      const a = agents.find((x) => x.name === w.agent) || { status: "idle" };
      const busy = ["working", "starting"].includes(a.status);
      return { name: w.agent, branch: w.branch, end: sum(e.diffs[k(project, w.agent)], w), what: busy ? "at work" : a.status === "waiting" ? "needs you" : "ready to merge",
        dot: busy ? "wk" : a.status === "waiting" ? "nd" : "ok", act: { ev: "win_open", route: `review/${project}/${w.agent}` } };
    });
    const tz = s.tz || undefined;
    const hm = (ms) => new Date(ms).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, ...(tz ? { timeZone: tz } : {}) });
    const merged = ((e.merged || {})[project] || []).map((c) => ({ sha: short(c.sha), title: c.title, meta: [c.by, hm(c.at_ms)].filter(Boolean).join(" · "),
      act: { ev: "win_open", route: `commit/${project}/${c.sha}` } }));
    return { screen: "changes", rows, merged, empty: rows.length || merged.length ? null
      : { title: `nothing waiting to merge into ${trunk}`, text: "an agent's branch shows here once it has commits ahead" } };
  }
  function drawChanges(d, UI) {
    const { h, act } = UI.core;
    if (d.empty) return h("div", "w7 w7-ch", UI.empty.render(d.empty));
    return h("div", "w7 w7-ch",
      d.rows.map((r) => UI.job.render({ state: r.dot, name: r.name, psi: true, end: r.end, what: `${r.branch} · ${r.what}`, act: r.act })),
      d.merged.length ? h("div", "w7-sec", "merged today") : null,
      d.merged.map((c) => act(h("div", "b-row w7-mg", h("span", "w7-sha", c.sha), h("b", "nm", c.title), h("span", "end", c.meta)), c.act)));
  }

  root.AmbWinReview = { init, owns, enter, step, key, view, draw, linesOf, quote, changes, drawChanges };
})(typeof window !== "undefined" ? window : globalThis);
