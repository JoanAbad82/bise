// bise desktop · the fake core's setup world (S11): his prefs, his model accounts, the repos in his
// home folder, the Mac's permissions, and what the core and the shell answer to the setup screens'
// cmds (prefs_set, sign_in, key_set, found_scan, project_add/remove/move, app_perm,
// win_pick_folder). Pure data and pure answers, chained by winfake.js's boot and respond. Shapes:
// amb-core's proto::draft (m_8389) and amb-mac's perms/folder (m_8388).
(function (root) {
  "use strict";
  const at = (h, m, daysAgo = 0) => Date.UTC(2026, 9, 3, h - 2, m) - daysAgo * 86400000;
  const START = () => ({
    prefs: { onboarded: true, theme: "system", login: true, menubar_count: true, voice: { fn_hold: true, fn_twice: true, language: "auto" },
      context: { shot: true, url: true, file: true, window_text: true }, excluded_apps: ["1Password", "Messages"], shots_keep_days: 7,
      quiet: { call: true, share: true, fullscreen: true, focus: true, batch_min: 30, away_card: true } },
    accounts: [{ id: "chatgpt", label: "ChatGPT plan", kind: "subscription", state: "signed_in", who: "gabriel@…" },
      { id: "claude", label: "Claude plan", kind: "subscription", state: "signed_out" },
      { id: "anthropic", label: "Anthropic", kind: "key", state: "signed_out" }],
    perms: { mic: "allowed", accessibility: "allowed", screen: "ask" },
    found: [["storefront", 3], ["telemetry", 0], ["engine", 0], ["evals", 1], ["checkout-api", 0], ["engine-shaders", 3], ["dotfiles", 62]]
      .map(([name, d]) => ({ path: `~/${name === "checkout-api" ? "work/" : ""}${name}`, name, git: true, last_ms: at(12, 0, d), known: false })),
  });
  let W = START();
  // a fresh install (screens.html #fresh, the onboarding's laws): nothing signed in, nothing allowed
  function fresh() {
    W = START();
    W.prefs.onboarded = false;
    W.accounts = W.accounts.map((a) => ({ ...a, state: "signed_out", who: undefined }));
    W.perms = { mic: "ask", accessibility: "ask", screen: "ask" };
  }
  const reset = () => { W = START(); };

  function boot() {
    return [{ ev: "prefs", prefs: W.prefs }, { ev: "accounts", items: W.accounts }, { ev: "perms", ...W.perms }];
  }
  function put(o, path, v) {
    const [k, ...rest] = path.split(".");
    return { ...(o || {}), [k]: rest.length ? put((o || {})[k], rest.join("."), v) : v };
  }

  // known = already one of his projects
  const foundEv = (C) => ({ ev: "found", dir: "~", items: W.found.map((f) => ({ ...f, known: C.PROJECTS.some((p) => p.path === f.path) })) });

  function respond(cmd, C) {
    switch (cmd.cmd) {
      case "prefs_set": W.prefs = put(W.prefs, cmd.key, cmd.value); return [[0, { ev: "prefs", prefs: W.prefs }]];
      case "sign_in":
        W.accounts = W.accounts.map((a) => (a.id === cmd.id ? { ...a, state: "signed_in", who: "gabriel@…" } : a));
        return [[1500, { ev: "accounts", items: W.accounts }]];
      case "key_set":
        W.accounts = W.accounts.map((a) => (a.id === cmd.id ? { ...a, state: "signed_in", who: `…${String(cmd.key).slice(-3)}` } : a));
        return [[300, { ev: "accounts", items: W.accounts }]];
      case "key_remove":
        W.accounts = W.accounts.map((a) => (a.id === cmd.id ? { ...a, state: "signed_out", who: undefined } : a));
        return [[0, { ev: "accounts", items: W.accounts }]];
      case "found_scan": return [[400, foundEv(C)]];
      case "app_perm": W.perms = { ...W.perms, [cmd.perm]: "allowed" }; return [[600, { ev: "perms", ...W.perms }]];
      case "win_pick_folder": return [[500, { ev: "win_folder", path: "~/work/checkout-api" }]];
      case "project_add": {
        if (C.PROJECTS.some((p) => p.path === cmd.path)) return [[0, C.projectsEv()]];
        const name = String(cmd.path).replace(/\/$/, "").split("/").pop();
        const project = `${name}-${(C.PROJECTS.length * 2654435761 >>> 0).toString(16).slice(0, 4)}`;
        C.PROJECTS.push({ project, name, path: cmd.path, home: false, order: C.PROJECTS.length });
        C.AGENTS[project] = [{ name: "main", status: "idle", main: true, title: "", since_ms: Date.UTC(2026, 9, 3, 12, 33), waits: 0 }];
        C.CARDS[project] = [];
        return [[300, C.projectsEv()], [300, { ev: "agents", project, agents: C.AGENTS[project] }], [300, { ev: "cards", project, cards: [] }], [320, foundEv(C)]];
      }
      case "project_remove": {
        const i = C.PROJECTS.findIndex((p) => p.project === cmd.project && !p.home);
        if (i < 0) return [];
        C.PROJECTS.splice(i, 1);
        C.PROJECTS.forEach((p, n) => { p.order = n; });
        return [[200, C.projectsEv()], [220, foundEv(C)]];
      }
      case "project_move": {
        const i = C.PROJECTS.findIndex((p) => p.project === cmd.project);
        if (i < 1) return [];
        const [p] = C.PROJECTS.splice(i, 1);
        C.PROJECTS.splice(Math.max(1, cmd.order), 0, p);
        C.PROJECTS.forEach((x, n) => { x.order = n; });
        return [[100, C.projectsEv()]];
      }
    }
    return null;
  }

  root.AmbWinFake11 = { boot, respond, reset, fresh, world: () => W };
})(typeof window !== "undefined" ? window : globalThis);
