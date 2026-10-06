// bise desktop · the window's fake core: desktop-app v9's example world (bise + storefront,
// telemetry, engine, evals) as S3a's typed events (amb-core's draft, s3a-plan.md "Types (v1)"),
// and what the core answers to the window's cmds. Pure data and pure answers: the dev page plays
// them through a timer, check-win.mjs reads them back. When S3a's shared fixtures land
// (rust/proto/fixtures/*.jsonl) the world below loads from them instead.
//
//   AmbWinFake.boot()          -> [ev]           the events a fresh window gets
//   AmbWinFake.respond(cmd)    -> [[ms, ev]]     what the core sends back to a cmd, after ms
//
// Fields the S3a draft does not have yet (sent to amb-core): entry.from_project (a project's
// main speaking in bise's thread), delegation.done_ms, card.title/body/origin, job.unit/followed,
// agent.started_ms, quote.file/lines, scheduled {project, items}, hello.user.
(function (root) {
  "use strict";

  // fixed times: 3 Oct 2026, Paris (UTC+2); the window's "now" is 14:33
  const at = (h, m) => Date.UTC(2026, 9, 3, h - 2, m);
  const NOW = at(14, 33);
  const HOME = "home";

  const PROJECTS = [
    { project: HOME, name: "bise", path: "~/bise", home: true, order: 0 },
    { project: "storefront-5c1d", name: "storefront", path: "~/storefront", home: false, order: 1 },
    { project: "telemetry-8e02", name: "telemetry", path: "~/telemetry", home: false, order: 2 },
    { project: "engine-31aa", name: "engine", path: "~/engine", home: false, order: 3 },
    { project: "evals-90b4", name: "evals", path: "~/evals", home: false, order: 4 },
  ];
  const P = Object.fromEntries(PROJECTS.map((p) => [p.name, p.project]));

  const main = (since) => ({ name: "main", status: "idle", main: true, title: "", since_ms: since, waits: 0 });
  const ag = (name, status, title, extra = {}) => ({ name, status, title, main: false, waits: status === "waiting" ? 1 : 0, since_ms: at(9, 20), started_ms: at(9, 20), parent: "main", ...extra });
  const AGENTS = {
    [HOME]: [main(at(14, 32))],
    [P.storefront]: [main(at(10, 40)),
      ag("checkout", "working", "one idempotency key per order (#812)", { branch: "sb/checkout", ahead: 2, started_ms: at(9, 2) }),
      ag("search", "waiting", "reindex tonight 02:00?", { branch: "sb/search", ahead: 1 }),
      ag("stock", "working", "flash sale replay · 6 200 of 10 000", { followed: true, started_ms: at(14, 32) }),
      ag("promo", "idle", "best of the two discounts", { started_ms: at(10, 3) }),
      ag("wallet", "idle", "Apple Pay at checkout", { branch: "sb/wallet", ahead: 0, started_ms: at(8, 40) })],
    [P.telemetry]: [main(at(14, 25)),
      ag("alerts", "waiting", "compaction at 03:00?", { started_ms: at(14, 21) }),
      ag("sampling", "working", "tail sampling at 5%", { started_ms: at(11, 5) })],
    [P.engine]: [main(at(11, 12)),
      ag("streaming", "done", "40 ms → 15 ms, ready to merge", { branch: "sb/streaming", ahead: 3, started_ms: at(9, 30) }),
      ag("netcode", "working", "co-op at 150 ms, 2% loss · run 3 of 8", { branch: "sb/netcode", ahead: 5, started_ms: at(10, 15) })],
    [P.evals]: [main(at(9, 58)),
      ag("rag", "done", "the right chunk cited 94% of the time", { started_ms: at(8, 30) }),
      ag("cache", "working", "prompt cache · 1 400 of 2 000 prompts", { started_ms: at(12, 10) })],
  };

  const opts = (...labels) => labels.map((label, i) => ({ n: i + 1, label }));
  const CARDS = {
    [P.telemetry]: [{ id: "c-alerts", project: P.telemetry, kind: "question", agent: "alerts", title: "compaction at 03:00?",
      question: "passer la compaction de 14:00 à 03:00 ?", options: opts("move it to 03:00", "leave it"), since_ms: at(14, 25),
      body: "la compaction de 14:00 fait monter le p99 à 2,1 s pendant 12 min. à 03:00, le trafic est 9 fois plus bas. le changement : une ligne dans le cron ; je regarde le p99 chaque matin pendant 7 jours.",
      origin: { shot: "p99", at_ms: at(14, 21), by: "you", via: "bise" } }],
    [P.storefront]: [{ id: "c-search", project: P.storefront, kind: "question", agent: "search", title: "reindex tonight 02:00?",
      question: "réindexer ce soir à 02:00, ou maintenant avec le second index ?", options: opts("tonight 02:00", "now, second index"), since_ms: at(9, 46) }],
    [P.engine]: [{ id: "c-netcode", project: P.engine, kind: "approval", agent: "netcode", title: "merge the rollback fix?",
      question: "merger le fix du rollback dans main ? 5 commits, la désync à 150 ms disparaît sur 3 runs.", options: opts("merge into main", "not yet"), since_ms: at(13, 50) }],
    [P.evals]: [],
  };

  const JOBS = {
    [P.storefront]: [{ agent: "stock", label: "flash sale replay", step: 6200, steps: 10000, unit: "orders", state: "running", followed: true }],
    [P.engine]: [{ agent: "netcode", label: "co-op at 150 ms, 2% loss", step: 3, steps: 8, unit: "runs", state: "running", followed: false }],
    [P.evals]: [{ agent: "cache", label: "prompt cache", step: 1400, steps: 2000, unit: "prompts", state: "running", followed: false }],
  };

  const ARTIFACTS = {
    [P.engine]: [{ id: "a-frames", kind: "chart", title: "frame times, before and after", agent: "streaming", version: 1, at_ms: at(11, 12), url: "", new: true }],
    [P.storefront]: [{ id: "a-replay", kind: "bars", title: "flash sale replay", agent: "stock", version: 1, at_ms: at(10, 40), url: "", new: true },
      { id: "a-3ds", kind: "table", title: "3-D Secure timeouts", agent: "checkout", version: 2, at_ms: at(9, 50), url: "", new: true }],
    [P.evals]: [{ id: "a-evals", kind: "report", title: "eval report", agent: "rag", version: 3, at_ms: at(9, 58), url: "", new: true }],
    [P.telemetry]: [],
  };

  const SCHEDULED = { [P.storefront]: [{ agent: "search", label: "search reindex", at_ms: at(26, 0) }] };

  // ---- the threads (pos = the transcript position; cards sort at the end as the hub does)
  const you = (pos, t, text, extra = {}) => ({ pos, at_ms: t, kind: "you", text, via: "typed", ...extra });
  const said = (pos, t, text, extra = {}) => ({ pos, at_ms: t, kind: "agent", text, ...extra });
  const from = (pos, t, who, text, extra = {}) => ({ pos, at_ms: t, kind: "from_agent", from: who, text, ...extra });
  const card = (pos, t, c, extra = {}) => ({ pos, at_ms: t, kind: "card", from: c.agent, text: c.question,
    card: { id: c.id, question: c.question, options: c.options, answered: false }, ...extra });
  const tools = (pos, t, summary, items) => ({ pos, at_ms: t, kind: "tools", text: summary,
    tools: { count: items.length, summary, items: items.map(([kind, text], i) => ({ pos: pos + i, at_ms: t + i * 20000, kind, text })) } });

  const C = (p, i = 0) => CARDS[p][i];
  const THREADS = {
    [`${HOME}/main`]: [
      you(101, at(14, 21), "pourquoi le p99 d'ingest monte à 14 h ?", { via: "voice",
        context: { app: "Chrome", url: "https://grafana.internal/d/ingest", title: "grafana · ingest p99", selection: "13:00–15:00 · last 7 days", shot: "p99" } }),
      said(102, at(14, 21), "c'est telemetry. je l'ai passé à son main."),
      { pos: 103, at_ms: at(14, 21), kind: "delegation", text: "p99 d'ingest à 14 h, avec ta capture",
        delegation: { project_to: P.telemetry, agent: "alerts", state: "done", done_ms: at(14, 25) } },
      from(104, at(14, 25), "main", "le p99 monte quand la compaction de 14 h tourne : 2,1 s au lieu de 300 ms pendant 12 min. alerts propose de la passer à 03:00, quand personne n'envoie rien.", { from_project: P.telemetry }),
      card(105, at(14, 25), C(P.telemetry), { from_project: P.telemetry }),
      you(106, at(14, 32), "relance le replay de la flash sale et dis-moi quand c'est fini"),
      said(107, at(14, 32), "c'est parti, je te dis à la fin."),
      { pos: 108, at_ms: at(14, 32), kind: "delegation", text: "flash sale replay",
        delegation: { project_to: P.storefront, agent: "stock", state: "running", step: 6200, steps: 10000, followed: true } },
    ],
    [`${P.storefront}/main`]: [
      ...[1, 2, 3, 4, 5, 6].map((i) => you(i, at(8, 30 + i), `filler ${i}`)).map((e, i) => i % 2 ? said(e.pos, e.at_ms, ["checkout prend la clé d'idempotence.", "wallet attend la clé Apple Pay.", "les tests e2e passent."][i >> 1]) : you(e.pos, e.at_ms, ["une clé d'idempotence par commande, s'il te plaît (#812).", "et Apple Pay au checkout ?", "on en est où ?"][i >> 1])),
      you(10, at(10, 2), "BLACKFRIDAY se cumule avec la remise membre. il faut garder la meilleure des deux, pas les deux."),
      said(11, at(10, 2), "promo prend la règle, checkout garde le total de la commande à un seul endroit."),
      { pos: 12, at_ms: at(10, 6), kind: "agents", text: "4 messages between 2 agents", agents: { count: 4, names: ["promo", "checkout"], items: [
        from(12, at(10, 6), "promo", "je calcule la meilleure des deux remises dans promo/stack.ts ; checkout, tu peux lire le total depuis order.total ?", { to: "checkout" }),
        from(13, at(10, 9), "checkout", "oui, order.total est la seule source maintenant. j'ai retiré le calcul en double dans cart.ts.", { to: "promo" }),
        from(14, at(10, 21), "promo", "règle en place : max(BLACKFRIDAY, membre), jamais les deux. 18 tests.", { to: "checkout" }),
        from(15, at(10, 24), "checkout", "vérifié de mon côté sur 3 paniers.", { to: "promo" })] } },
      { pos: 16, at_ms: at(10, 30), kind: "card", from: "promo", text: "on garde le cumul pour les cartes cadeaux ?",
        card: { id: "c-promo", question: "on garde le cumul pour les cartes cadeaux ?", options: opts("oui", "non"), answered: true,
          answer: "non, une carte cadeau est un paiement, pas une remise", by: "main", why: "une carte cadeau se paie au checkout : la cumuler, c'est un moyen de paiement, pas une deuxième remise." } },
      said(17, at(10, 40), "stock a fini : le replay de la flash sale vend 500 sur 500, aucune survente. la réservation se fait à l'ajout au panier et tombe après 15 min."),
      { pos: 18, at_ms: at(10, 40), kind: "artifact", from: "stock", text: "flash sale replay", artifact: { id: "a-replay", kind: "bars", title: "flash sale replay", url: "" } },
      card(1000000001, at(9, 46), C(P.storefront)),
    ],
    [`${P.storefront}/search`]: [
      from(1, at(9, 20), "main", "la recherche ne trouve pas « tshirt » : seul « t-shirt » marche. ajoute le synonyme, sans casser « shirt ».", { to: "search" }),
      tools(2, at(9, 21), "read 6 files, ran 4 commands · 2 files changed", [["read", "search/analyzer.ts"], ["read", "search/synonyms.json"], ["read", "search/index.ts"], ["search", "rg 't-shirt' search/"], ["read", "search/test/synonyms.test.ts"], ["read", "search/reindex.ts"], ["run", "$ pnpm test search  → 11 passed"], ["edit", "search/synonyms.json"], ["edit", "search/test/synonyms.test.ts"], ["run", "$ pnpm test search  → 12 passed"]]),
      said(12, at(9, 41), "c'est un synonyme manquant dans l'analyzer : tshirt, t-shirt et tee pointent maintenant vers le même terme. « shirt » ne bouge pas (12 tests). il faut réindexer 1,2 M produits pour que ça prenne."),
      { pos: 13, at_ms: at(9, 41), kind: "diff", text: "search/synonyms.json", diff: { path: "search/synonyms.json", add: 1, del: 0, hunk: { header: "@@ -14,2 +14,3 @@", lines: [
        { kind: "ctx", old: 14, new: 14, text: "  \"jeans, denim\"," }, { kind: "add", new: 15, text: "  \"tshirt, t-shirt, tee\"," }, { kind: "ctx", old: 15, new: 16, text: "  \"sneakers, trainers\"" }] } } },
      you(14, at(9, 44), "ça peut se faire sans ralentir la recherche ?"),
      said(15, at(9, 45), "oui avec un second index : je le construis à côté, puis je bascule l'alias. 20 min de build, pas de ralentissement, 2 GB de disque en plus pour la nuit."),
      card(1000000001, at(9, 46), C(P.storefront)),
    ],
    [`${P.telemetry}/main`]: [
      from(1, at(14, 21), "bise", "pourquoi le p99 d'ingest monte à 14 h ?", { via: "bise",
        context: { app: "Chrome", url: "https://grafana.internal/d/ingest", title: "grafana · ingest p99", selection: "13:00–15:00 · last 7 days", shot: "p99" } }),
      said(2, at(14, 21), "alerts regarde : la courbe a la forme d'un job planifié."),
      said(3, at(14, 25), "le p99 monte quand la compaction de 14 h tourne : 2,1 s au lieu de 300 ms pendant 12 min. alerts propose de la passer à 03:00, quand personne n'envoie rien."),
      card(1000000001, at(14, 25), C(P.telemetry)),
    ],
    [`${P.engine}/main`]: [
      you(1, at(9, 28), "le decode des textures bloque le thread principal sur PS5. sors-le de là."),
      said(2, at(9, 30), "streaming s'en charge, dans son worktree."),
      said(3, at(11, 12), "streaming a fini : le replay PS5 passe de 40 ms à 15 ms au pire. prêt à merger."),
      { pos: 4, at_ms: at(11, 12), kind: "artifact", from: "streaming", text: "frame times, before and after", artifact: { id: "a-frames", kind: "chart", title: "frame times, before and after", url: "" } },
      card(1000000001, at(13, 50), C(P.engine)),
    ],
    [`${P.evals}/main`]: [
      you(1, at(8, 28), "le rag cite le mauvais chunk une fois sur trois. regarde."),
      said(2, at(9, 58), "rag a fini : le bon chunk est cité 94% du temps (contre 67%). le rapport est prêt."),
      { pos: 3, at_ms: at(9, 58), kind: "artifact", from: "rag", text: "eval report", artifact: { id: "a-evals", kind: "report", title: "eval report", url: "" } },
    ],
  };
  // an agent's thread nobody wrote out: its brief, its work, its last words
  function generic(project, a) {
    return [
      from(1, a.started_ms || at(9, 20), "main", `${a.title}.`, { to: a.name }),
      tools(2, (a.started_ms || at(9, 20)) + 60000, "read 4 files, ran 2 commands", [["read", "README.md"], ["read", "src/main.ts"], ["read", "src/config.ts"], ["read", "test/main.test.ts"], ["run", "$ make test  → ok"], ["run", "$ make bench"]]),
      said(8, (a.started_ms || at(9, 20)) + 600000, a.status === "done" ? `fini : ${a.title}.` : `j'avance : ${a.title}.`),
      ...(CARDS[project] || []).filter((c) => c.agent === a.name).map((c) => card(1000000001, c.since_ms, c)),
    ];
  }
  function thread(project, agent) {
    const k = `${project}/${agent}`;
    if (THREADS[k]) return THREADS[k];
    const a = (AGENTS[project] || []).find((x) => x.name === agent);
    return a ? generic(project, a) : [];
  }

  // the projects row: counts from the agents and cards (the core builds it from view.json)
  function projectsEv() {
    return { ev: "projects", projects: PROJECTS.map((p) => ({ ...p,
      agents: (AGENTS[p.project] || []).filter((a) => !a.main).length,
      working: (AGENTS[p.project] || []).filter((a) => a.status === "working").length,
      waits: (CARDS[p.project] || []).length })) };
  }

  function boot() {
    const evs = [{ ev: "welcome", project: HOME, proto: 1, workspace: "~/bise", name: "bise", user: { name: "Gabriel" }, now_ms: NOW }, projectsEv()];
    for (const p of PROJECTS) {
      evs.push({ ev: "agents", project: p.project, agents: AGENTS[p.project] || [] });
      evs.push({ ev: "cards", project: p.project, cards: CARDS[p.project] || [] });
      evs.push({ ev: "jobs", project: p.project, jobs: JOBS[p.project] || [] });
      evs.push({ ev: "artifacts", project: p.project, items: ARTIFACTS[p.project] || [] });
      if (SCHEDULED[p.project]) evs.push({ ev: "scheduled", project: p.project, items: SCHEDULED[p.project] });
    }
    // S7's worlds (amb-web's winfake7.js: worktrees, dev servers, diffs), when loaded
    if (root.AmbWinFake7) evs.push(...root.AmbWinFake7.boot());
    if (root.AmbWinFake11) evs.push(...root.AmbWinFake11.boot());
    return evs;
  }

  // the project a sentence is about: a project's or an agent's name in it, else none (S2's pure
  // route guess will replace this; here it only makes bise's fake answers plausible)
  function guess(text) {
    const w = String(text).toLowerCase();
    for (const p of PROJECTS) if (!p.home && w.includes(p.name)) return { project: p.project, agent: "main" };
    for (const p of PROJECTS) for (const a of AGENTS[p.project] || []) if (!a.main && w.includes(a.name)) return { project: p.project, agent: a.name };
    return null;
  }
  const nameOf = (project) => (PROJECTS.find((p) => p.project === project) || {}).name || project;

  // the world as it starts: respond() changes AGENTS and CARDS (an answer drops its card, a stop
  // idles its agent); reset() puts them back (check-win.mjs, between laws)
  const SAVED = JSON.stringify({ AGENTS, CARDS });
  // the projects themselves stay the same objects (winfake7.js adds their git fields): a reset
  // drops the ones added since and puts the first ones back in their order
  const FIRST = PROJECTS.slice();
  let seq = 2000;
  function reset() {
    if (root.AmbWinFake11) root.AmbWinFake11.reset();
    const o = JSON.parse(SAVED);
    for (const k of Object.keys(o.AGENTS)) AGENTS[k] = o.AGENTS[k];
    for (const k of Object.keys(AGENTS)) if (!(k in o.AGENTS)) delete AGENTS[k];
    for (const k of Object.keys(CARDS)) if (k in o.CARDS) CARDS[k] = o.CARDS[k]; else delete CARDS[k];
    PROJECTS.splice(0, PROJECTS.length, ...FIRST);
    FIRST.forEach((p, i) => { p.order = i; });
    seq = 2000;
  }
  function respond(cmd) {
    const s7 = root.AmbWinFake7 && root.AmbWinFake7.respond(cmd);
    if (s7) return s7;
    const s11 = root.AmbWinFake11 && root.AmbWinFake11.respond(cmd, { PROJECTS, AGENTS, CARDS, projectsEv });
    if (s11) return s11;
    const out = [];
    const { project, agent } = cmd;
    if (cmd.cmd === "subscribe" || cmd.cmd === "page") {
      const all = thread(project, agent);
      const limit = cmd.limit || 60;
      const older = cmd.cmd === "page" && cmd.before != null ? all.filter((e) => e.pos < cmd.before) : all;
      const page = older.slice(Math.max(0, older.length - limit));
      out.push([cmd.cmd === "page" ? 150 : 0, { ev: "thread", project, agent, entries: page, before: page.length ? page[0].pos : null, more: older.length > page.length }]);
    } else if (cmd.cmd === "send") {
      const pos = ++seq;
      // a queued message reaches the agent when its turn ends (here: 2.5 s later)
      const later = cmd.mode === "queued" ? 2500 : 0;
      out.push([later, { ev: "entry", project, agent, entry: { pos, at_ms: NOW, kind: "you", text: cmd.text, via: "typed", ...(cmd.quote ? { quote: cmd.quote } : {}) } }]);
      if (later) { out.push([later + 900, { ev: "entry", project, agent, entry: { pos: ++seq, at_ms: NOW, kind: "agent", text: "vu à la fin de mon tour : je m'y mets." } }]); return out; }
      out.push([300, { ev: "typing", project, agent, text: "reading the thread" }]);
      if (project === HOME) {
        const to = guess(cmd.text);
        const text = to ? `c'est ${nameOf(to.project)}. je l'ai passé à ${to.agent === "main" ? "son main" : to.agent}.` : "je regarde, je te réponds ici.";
        out.push([1200, { ev: "entry", project, agent, entry: { pos: ++seq, at_ms: NOW, kind: "agent", text } }]);
        if (to) out.push([1250, { ev: "entry", project, agent, entry: { pos: ++seq, at_ms: NOW, kind: "delegation", text: cmd.text, delegation: { project_to: to.project, agent: to.agent === "main" ? undefined : to.agent, state: "running" } } }]);
      } else {
        out.push([1200, { ev: "entry", project, agent, entry: { pos: ++seq, at_ms: NOW, kind: "agent", text: cmd.quote ? "bonne question : je regarde ces lignes et je te réponds." : "noté, je m'y mets." } }]);
      }
      out.push([1300, { ev: "typing", project, agent, text: "" }]);
    } else if (cmd.cmd === "answer") {
      const list = CARDS[project] || [];
      const c = list.find((x) => x.id === cmd.card);
      if (c) {
        CARDS[project] = list.filter((x) => x !== c);
        const opt = c.options.find((o) => String(o.n) === String(cmd.reply));
        const reply = opt ? opt.label : cmd.reply;
        out.push([0, { ev: "cards", project, cards: CARDS[project] }]);
        out.push([0, projectsEv()]);
        const done = { pos: 1000000001, at_ms: c.since_ms, kind: "card", from: c.agent, text: c.question,
          card: { id: c.id, question: c.question, options: c.options, answered: true, answer: reply, by: "you" } };
        out.push([0, { ev: "entry", project, agent: c.agent, entry: done }]);
        out.push([0, { ev: "entry", project, agent: "main", entry: done }]);
        out.push([900, { ev: "entry", project, agent: c.agent, entry: { pos: ++seq, at_ms: NOW, kind: "agent", text: `ok : ${reply}.` } }]);
      }
    } else if (cmd.cmd === "stop") {
      AGENTS[project] = (AGENTS[project] || []).map((a) => (a.name === agent ? { ...a, status: "idle" } : a));
      out.push([200, { ev: "agents", project, agents: AGENTS[project] }]);
      out.push([200, { ev: "typing", project, agent, text: "" }]);
    }
    return out;
  }

  // the browser player: boot, then answer each cmd after its delay (dev.html, index.html without
  // an app)
  function player(recv) {
    const timers = [];
    for (const ev of boot()) recv(ev);
    return {
      post(cmd) { for (const [ms, ev] of respond(cmd)) timers.push(setTimeout(() => recv(ev), ms)); },
      stop() { timers.forEach(clearTimeout); },
    };
  }

  root.AmbWinFake = { boot, respond, reset, player, guess, thread, at, NOW, HOME, P, PROJECTS, AGENTS, CARDS, JOBS, ARTIFACTS };
})(typeof window !== "undefined" ? window : globalThis);
