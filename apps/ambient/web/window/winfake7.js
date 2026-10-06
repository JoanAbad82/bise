// bise desktop · the fake core's S7 world: desktop-app v9's worktrees, dev servers (and, next,
// the review's diffs) as S3a's draft events (rust/proto/src/draft.rs: worktrees, dev_servers,
// diff). Loaded after winfake.js; its boot() and respond() append these (amb-win, m_8307).
//
//   AmbWinFake7.boot()          -> [ev]                the S7 events a fresh window gets
//   AmbWinFake7.respond(cmd)    -> [[ms, ev]] | null   what the core answers to an S7 cmd
//
// Draft fields S3a lacks (sent to amb-core m_8304): DevServer.name; a project's git + branch
// (patched onto winfake.js's PROJECTS below until that file carries them).
(function (root) {
  "use strict";
  const F = root.AmbWinFake;
  const { P } = F;

  // the project rows' git facts (draft: S3a's ProjectRow has path only)
  const GIT = { [P.storefront]: "main", [P.telemetry]: "main", [P.engine]: "main", [P.evals]: "main" };
  for (const p of F.PROJECTS) if (GIT[p.project] && p.git == null) Object.assign(p, { git: true, branch: GIT[p.project] });

  const wt = (project, agent, ahead, extra = {}) => ({ path: `/Users/you/.bise/worktrees/${project}/${agent}/${project.split("-")[0]}`,
    branch: `sb/${agent}`, agent, dirty: false, ahead, behind: 0, ...extra });
  const WORKTREES = {
    [P.storefront]: [{ path: "~/storefront", branch: "main", dirty: false, ahead: 0, behind: 0 },
      wt(P.storefront, "checkout", 2, { dirty: true }), wt(P.storefront, "search", 1), wt(P.storefront, "wallet", 0)],
    [P.telemetry]: [],
    [P.engine]: [wt(P.engine, "streaming", 3), wt(P.engine, "netcode", 5)],
    [P.evals]: [],
  };
  const DEV_SERVERS = {
    [P.storefront]: [{ agent: "main", name: "dev server", url: "http://localhost:3000", port: 3000, cmd: "pnpm dev", up: true }],
    [P.telemetry]: [{ agent: "main", name: "grafana (local)", url: "http://localhost:3001", port: 3001, cmd: "grafana-server", up: true }],
    [P.engine]: [],
    [P.evals]: [],
  };

  function boot() {
    const evs = [];
    for (const p of F.PROJECTS) {
      if (p.home) continue;
      evs.push({ ev: "worktrees", project: p.project, items: WORKTREES[p.project] || [] });
      evs.push({ ev: "dev_servers", project: p.project, items: DEV_SERVERS[p.project] || [] });
    }
    return evs;
  }
  // nothing to answer yet: worktrees and dev servers come pushed, like artifacts
  function respond() { return null; }

  root.AmbWinFake7 = { boot, respond, WORKTREES, DEV_SERVERS };
})(typeof window !== "undefined" ? window : globalThis);
