// bise desktop · the fake core's S7 world: desktop-app v9's worktrees, dev servers (and, next,
// the review's diffs) as S3a's draft events (rust/proto/src/draft.rs: worktrees, dev_servers,
// diff, answered to the review's diff cmd), and the answer to artifacts_seen. Loaded after winfake.js; its boot() and respond() append these (amb-win, m_8307).
//
//   AmbWinFake7.boot()          -> [ev]                the S7 events a fresh window gets
//   AmbWinFake7.respond(cmd)    -> [[ms, ev]] | null   what the core answers to an S7 cmd
//
// Draft fields S3a lacks (sent to amb-core m_8304, carried in its S3a step 2): diff.result,
// DiffFile.note, DevServer.name; a project's git + branch
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

  // the review's diffs, by "project/agent" (v9: streaming's 3 files and its result first)
  const L = (kind, o, n, text) => ({ kind, ...(o != null ? { old: o } : {}), ...(n != null ? { new: n } : {}), text });
  const DIFFS = {
    [`${P.engine}/streaming`]: { base: "main", head: "sb/streaming",
      result: { label: "worst frame, PS5 replay", sub: "forest level", before: 40, after: 15, unit: "ms",
        series: { before: [16, 17, 40, 16, 17, 16, 38, 17, 16, 39, 16, 17], after: [15, 15, 15, 14, 15, 15, 15, 14, 15, 15, 15, 15] } },
      files: [
        { path: "engine/src/streaming/decode_pool.rs", status: "added", add: 61, del: 0, note: "new: 4 workers", hunks: [{ header: "@@ -0,0 +1,61 @@", lines: [
          L("add", null, 10, "use crossbeam::queue::SegQueue;"), L("add", null, 11, ""), L("add", null, 12, "pub struct DecodePool {"),
          L("add", null, 13, "    workers: [Worker; 4],"), L("add", null, 14, "    queue: Arc<SegQueue<Job>>,"), L("add", null, 15, "}")] }] },
        { path: "engine/src/streaming/streamer.rs", status: "modified", add: 19, del: 17, note: "decode off the frame", hunks: [{ header: "@@ -88,6 +88,8 @@ fn tick(&mut self)", lines: [
          L("ctx", 88, 88, "    let tex = self.next_texture();"), L("del", 89, null, "    let img = decode(&tex.bytes);"), L("del", 90, null, "    self.upload(img);"),
          L("add", null, 89, "    self.pool.push(Job::decode(tex));"), L("add", null, 90, "    for img in self.pool.ready() {"), L("add", null, 91, "        self.upload(img);"),
          L("add", null, 92, "    }"), L("ctx", 91, 93, "    self.frame += 1;")] }] },
        { path: "engine/config/budget.toml", status: "modified", add: 4, del: 4, note: "pool size per platform", hunks: [{ header: "@@ -3,4 +3,4 @@", lines: [
          L("del", 3, null, "ps5 = 0"), L("add", null, 3, "ps5 = 4"), L("ctx", 4, 4, "xbox = 4")] }] }] },
    [`${P.engine}/netcode`]: { base: "main", head: "sb/netcode", files: [
      { path: "engine/src/net/rollback.rs", status: "modified", add: 12, del: 3, hunks: [{ header: "@@ -40,5 +40,14 @@ fn resim(&mut self)", lines: [
        L("ctx", 40, 40, "    let from = self.confirmed_frame;"), L("del", 41, null, "    self.resim(from..self.frame);"), L("add", null, 41, "    let to = self.frame.min(from + MAX_ROLLBACK);"),
        L("add", null, 42, "    self.resim(from..to);")] }] }] },
    [`${P.storefront}/search`]: { base: "main", head: "sb/search", files: [
      { path: "search/synonyms.json", status: "modified", add: 1, del: 0, hunks: [{ header: "@@ -14,2 +14,3 @@", lines: [
        L("ctx", 14, 14, "  \"jeans, denim\","), L("add", null, 15, "  \"tshirt, t-shirt, tee\","), L("ctx", 15, 16, "  \"sneakers, trainers\"")] }] },
      { path: "search/test/synonyms.test.ts", status: "modified", add: 4, del: 0, hunks: [{ header: "@@ -30,1 +30,5 @@", lines: [
        L("ctx", 30, 30, "});"), L("add", null, 31, "test(\"tshirt finds t-shirt\", () => {"), L("add", null, 32, "  expect(search(\"tshirt\")).toContain(\"t-shirt\");"),
        L("add", null, 33, "  expect(search(\"shirt\")).not.toContain(\"tee\");"), L("add", null, 34, "});")] }] }] },
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
  // worktrees and dev servers come pushed, like artifacts; he looked at a project's artifacts:
  // none is new any more (the core owns 'new'; winfake.js's ARTIFACTS stay as they are)
  function respond(cmd) {
    // the review asks an agent's diff: its branch against main (nothing ahead: no file)
    if (cmd.cmd === "diff") {
      const d = DIFFS[`${cmd.project}/${cmd.agent}`] || { base: "main", head: `sb/${cmd.agent}`, files: [] };
      return [[0, { ev: "diff", project: cmd.project, agent: cmd.agent, ...d }]];
    }
    // merge into main: the diff comes back merged (the agent's branch is in main now)
    if (cmd.cmd === "merge") {
      const d = DIFFS[`${cmd.project}/${cmd.agent}`] || { base: "main", head: `sb/${cmd.agent}`, files: [] };
      return [[0, { ev: "diff", project: cmd.project, agent: cmd.agent, ...d, merged: "4f2a9c1" }]];
    }
    if (cmd.cmd === "artifacts_seen") return [[0, { ev: "artifacts", project: cmd.project, items: (F.ARTIFACTS[cmd.project] || []).map((a) => ({ ...a, new: false })) }]];
    return null;
  }

  root.AmbWinFake7 = { boot, respond, WORKTREES, DEV_SERVERS, DIFFS };
})(typeof window !== "undefined" ? window : globalThis);
