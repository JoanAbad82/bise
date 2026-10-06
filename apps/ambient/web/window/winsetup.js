// bise desktop · the window's setup screens (stream S11, web side), pure: the first launch's five
// steps, the settings pages and the add-a-project sheet, per desktop-app v9 ("le premier
// lancement, ajouter un projet, les réglages"). An extension of winmodel.js like S7's:
// root.AmbWinS11 = { init, owns, step, key, wantsKeys, enter, view, overlay }, its state in s.s11.
// No DOM: winscreens.js draws it with amb-kit's onb, set, group, check, toggle, fnkey, btn.
//
// What it reads from the core and the shell (drafts sent to amb-core m_8382, amb-mac m_8383):
// prefs {prefs}, accounts {items}, found {dir, items}, perms {mic, accessibility, screen},
// win_folder {path}, win_drop {paths}, app_fn {state}. What it sends: prefs_set {key, value},
// sign_in {id}, key_set {id, key}, found_scan {dir}, project_add {path, worktrees, land},
// project_remove {project}, project_move {project, order}, app_perm {perm, do: continue|settings}
// (the bar's own, amb-mac m_8388), win_pick_folder.
(function (root) {
  "use strict";
  const HOME = "home";
  const STEPS = ["hello", "permissions", "model", "projects", "fn"];
  const PAGES = ["general", "voice and fn", "context and privacy", "quiet moments", "models", "projects", "keys"];
  const SCREENS = ["onboarding", "settings"];

  function init() {
    return { perms: { mic: "ask", accessibility: "ask", screen: "ask" }, accounts: [], found: { dir: "", items: [] }, prefs: null,
      step: 0, picks: {}, fn: "up", tried: false, keyFor: null, keyText: "", page: "general", sheet: null, adding: null };
  }

  const CORE = ["prefs", "accounts", "found", "perms", "win_folder", "win_drop", "app_fn"];
  const owns = (ev) => CORE.includes(ev.ev) || /^ui_(onb|set|add|perm|acct|key)_/.test(ev.ev || "");
  const set = (o, k, v) => ({ ...o, [k]: v });
  // prefs keys are dotted paths ("quiet.call"): read and write one
  const get = (o, path) => path.split(".").reduce((x, k) => (x == null ? undefined : x[k]), o);
  function put(o, path, v) {
    const [k, ...rest] = path.split(".");
    return { ...(o || {}), [k]: rest.length ? put((o || {})[k], rest.join("."), v) : v };
  }
  const recent = (ms, now) => ms && now - ms < 30 * 86400000;
  const signedIn = (x) => x.accounts.some((a) => a.state === "signed_in");

  // ---- events
  function step(x, ev, s) {
    const cmds = [];
    const out = (nx, extra = {}) => ({ s11: nx, cmds, ...extra });
    switch (ev.ev) {
      case "prefs": {
        const nx = { ...x, prefs: ev.prefs };
        // a fresh install opens on the first launch's first step, wherever the window was
        if (ev.prefs && ev.prefs.onboarded === false && !x.prefs && !(s.route && s.route.screen === "onboarding"))
          return out({ ...nx, step: 0 }, { route: { screen: "onboarding", project: HOME, agent: "main" } });
        return out(nx);
      }
      case "accounts": return out({ ...x, accounts: ev.items });
      case "perms": return out({ ...x, perms: { ...x.perms, ...ev, ev: undefined } });
      case "found": {
        // his recent repos come checked, the old ones not (v9: dotfiles, 2 months ago, unchecked)
        const picks = { ...x.picks };
        for (const it of ev.items) if (!(it.path in picks)) picks[it.path] = !it.known && recent(it.last_ms, s.now);
        return out({ ...x, found: { dir: ev.dir, items: ev.items }, picks });
      }
      case "app_fn": return out({ ...x, fn: ev.state === "down" ? "down" : "up", tried: x.tried || (ev.state === "up" && x.fn === "down") });
      case "win_folder": return ev.path ? out(x.sheet ? { ...x, sheet: { ...x.sheet, path: ev.path } } : { ...x, picks: { ...x.picks, [ev.path]: true },
        found: { ...x.found, items: x.found.items.some((i) => i.path === ev.path) ? x.found.items : [...x.found.items, { path: ev.path, name: base(ev.path), git: true, last_ms: s.now }] } }) : out(x);
      case "win_drop": {
        const path = (ev.paths || [])[0];
        return path ? out({ ...x, sheet: sheet(path) }) : out(x);
      }
      // onboarding
      case "ui_onb_next": return next(x, s, cmds);
      case "ui_onb_back": return out({ ...x, step: Math.max(0, x.step - 1) });
      case "ui_onb_pick": return out({ ...x, picks: set(x.picks, ev.path, !x.picks[ev.path]) });
      case "ui_onb_fn": return out({ ...x, fn: x.fn === "down" ? "up" : "down", tried: x.tried || x.fn === "down" });
      case "ui_onb_skip": return finish(x, cmds);
      // the app's one permission path, the bar's too (amb-mac m_8388): continue = the system's prompt
      // when macOS still allows one, else its pane; settings = the pane
      case "ui_perm_ask": cmds.push({ cmd: "app_perm", perm: ev.perm, do: x.perms[ev.perm] === "denied" ? "settings" : "continue" }); return out(x);
      case "ui_acct_sign_in": cmds.push({ cmd: "sign_in", id: ev.id }); return out({ ...x, accounts: x.accounts.map((a) => (a.id === ev.id ? { ...a, state: "signing_in" } : a)) });
      case "ui_key_edit": return out({ ...x, keyFor: ev.id, keyText: "" });
      case "ui_key_type": return out({ ...x, keyText: ev.text });
      case "ui_key_save": {
        if (!x.keyFor || !x.keyText.trim()) return out(x);
        cmds.push({ cmd: "key_set", id: x.keyFor, key: x.keyText.trim() });
        return out({ ...x, keyFor: null, keyText: "" });
      }
      // settings
      case "ui_set_page": return out({ ...x, page: PAGES.includes(ev.page) ? ev.page : x.page });
      case "ui_set_pref": {
        cmds.push({ cmd: "prefs_set", key: ev.key, value: ev.value });
        return out({ ...x, prefs: put(x.prefs, ev.key, ev.value) });
      }
      case "ui_set_remove": cmds.push({ cmd: "project_remove", project: ev.project }); return out(x);
      case "ui_set_move": cmds.push({ cmd: "project_move", project: ev.project, order: ev.order }); return out(x);
      // the add-a-project sheet
      case "ui_add_open": {
        if (!x.found.items.length) cmds.push({ cmd: "found_scan", dir: "~" });
        return out({ ...x, sheet: sheet(ev.path || null) });
      }
      case "ui_add_pick": return out(x.sheet ? { ...x, sheet: { ...x.sheet, path: ev.path } } : x);
      case "ui_add_choose": cmds.push({ cmd: "win_pick_folder" }); return out(x);
      case "ui_add_toggle": return out(x.sheet ? { ...x, sheet: set(x.sheet, ev.key, !x.sheet[ev.key]) } : x);
      case "ui_add_close": return out({ ...x, sheet: null });
      case "ui_add_go": {
        if (!x.sheet || !x.sheet.path) return out(x);
        cmds.push({ cmd: "project_add", path: x.sheet.path, worktrees: x.sheet.worktrees, land: x.sheet.land });
        return out({ ...x, sheet: null, adding: x.sheet.path });
      }
    }
    return out(x);
  }
  const base = (p) => String(p || "").replace(/\/$/, "").split("/").pop();
  const sheet = (path) => ({ path, worktrees: true, land: false });

  // the first launch's ⏎: each step's own action, then the next step
  function next(x, s, cmds) {
    const at = STEPS[x.step];
    if (at === "model" && !signedIn(x)) return { s11: x, cmds };
    if (at === "projects") {
      for (const it of x.found.items) if (x.picks[it.path] && !it.known) cmds.push({ cmd: "project_add", path: it.path, worktrees: true, land: false });
    }
    if (at === "fn") return finish(x, cmds);
    const nx = { ...x, step: x.step + 1 };
    // the projects step scans his folder when it comes up
    if (STEPS[nx.step] === "projects" && !x.found.items.length) cmds.push({ cmd: "found_scan", dir: "~" });
    return { s11: nx, cmds };
  }
  function finish(x, cmds) {
    cmds.push({ cmd: "prefs_set", key: "onboarded", value: true });
    return { s11: { ...x, prefs: put(x.prefs, "onboarded", true) }, cmds, route: { project: HOME, agent: "main" } };
  }

  // the keys these screens take before the window's: ⏎ and esc in onboarding, esc in the sheet
  // and in settings (back to where he was)
  const wantsKeys = (x, s) => !!(x && (x.sheet || (s.route && SCREENS.includes(s.route.screen))));
  // a key these screens leave alone still never reaches the thread's keys (a digit typed in the
  // key field must not answer a card): {eat:false} keeps it in its field; null hands it on (only
  // ⌘ keys, in settings and the sheet: ⌘0, ⌘1-9, ⌘[ keep working there)
  function key(x, ev, s) {
    const cmds = [];
    const keep = { s11: x, cmds, eat: false };
    if (x.sheet) {
      if (ev.key === "Escape") return { s11: { ...x, sheet: null }, cmds, eat: true };
      if (ev.key === "Enter" && !ev.shift) return { ...step(x, { ev: "ui_add_go" }, s), eat: true };
      return ev.meta ? null : keep;
    }
    if (s.route.screen === "onboarding") {
      if (x.keyFor) return ev.key === "Enter" ? { ...step(x, { ev: "ui_key_save" }, s), eat: true } : ev.key === "Escape" ? { s11: { ...x, keyFor: null }, cmds, eat: true } : keep;
      if (ev.key === "Enter" && !ev.meta) return { ...next(x, s, cmds), eat: true };
      if (ev.key === "Escape") return { s11: { ...x, step: Math.max(0, x.step - 1) }, cmds, eat: true };
      return keep;
    }
    if (s.route.screen === "settings") {
      if (x.keyFor && ev.key === "Enter") return { ...step(x, { ev: "ui_key_save" }, s), eat: true };
      if (ev.key === "Escape") return x.keyFor ? { s11: { ...x, keyFor: null }, cmds, eat: true } : { s11: x, cmds, back: true, eat: true };
      return ev.meta ? null : keep;
    }
    return null;
  }

  function enter(x, route) {
    const cmds = [];
    if (route.screen === "settings" && route.page) x = { ...x, page: route.page };
    if (route.screen === "settings" && !x.found.items.length) cmds.push({ cmd: "found_scan", dir: "~" });
    return { s11: x, cmds };
  }

  // ---- views
  const ago = (ms, now) => {
    if (!ms) return "";
    const d = Math.floor((now - ms) / 86400000);
    return d < 1 ? "today" : d < 2 ? "yesterday" : d < 30 ? `${d} days ago` : d < 60 ? "a month ago" : `${Math.floor(d / 30)} months ago`;
  };
  const PERMS = [["mic", "microphone", "pour parler en tenant fn"], ["accessibility", "accessibility", "pour fn partout et pour lire l'app devant toi (URL, fichier, sélection)"],
    ["screen", "screen recording", "pour la capture que fn joint à ta question"]];
  function permItems(x) {
    return PERMS.map(([id, label, sub]) => {
      const st = x.perms[id];
      return { label, sub, check: { on: st === "allowed" },
        control: st === "allowed" ? { value: "allowed" } : { btn: { text: st === "denied" ? "open settings" : "allow", act: { ev: "ui_perm_ask", perm: id } } } };
    });
  }
  function accountItems(x) {
    const subs = x.accounts.filter((a) => a.kind === "subscription");
    const items = subs.map((a) => ({ label: a.label, sub: a.state === "signed_in" && a.who ? a.who : "sign in with your browser", check: { on: a.state === "signed_in" },
      control: a.state === "signed_in" ? { value: "signed in" } : a.state === "signing_in" ? { btn: { text: "sign in", state: "loading" } }
        : { btn: { text: a.state === "expired" ? "sign in again" : "sign in", act: { ev: "ui_acct_sign_in", id: a.id } } } }));
    const keys = x.accounts.filter((a) => a.kind === "key");
    const anyKey = keys.find((a) => a.state === "signed_in");
    items.push({ label: "an API key", sub: anyKey ? `${anyKey.label} · ${anyKey.who || "saved"}` : "Anthropic, OpenAI, Mistral…", check: { on: !!anyKey },
      control: anyKey ? { value: "added" } : { btn: { text: "add a key", act: { ev: "ui_key_edit", id: (keys[0] || { id: "anthropic" }).id } } } });
    return items;
  }

  function onboarding(x, s) {
    const at = STEPS[x.step];
    const base0 = { steps: STEPS.length, step: x.step, back: x.step > 0, skip: "skip for now" };
    if (at === "hello") return { ...base0, pearl: true, title: "salut. moi, c'est bise.",
      sub: "tiens fn et parle-moi, depuis n'importe quelle app. je m'occupe de tes projets avec une équipe d'agents, et je te demande seulement ce qui a besoin de toi.", cta: { text: "commencer", kind: "pri" } };
    if (at === "permissions") {
      const all = PERMS.every(([id]) => x.perms[id] === "allowed");
      return { ...base0, small: true, title: "trois permissions", sub: "rien ne part sans que tu tiennes fn. tu choisis ce que je lis dans réglages · confidentialité.",
        groups: [{ items: permItems(x) }], cta: { text: all ? "continue" : "continue for now", kind: all ? "pri" : "" } };
    }
    if (at === "model") {
      const ok = signedIn(x);
      return { ...base0, small: true, title: "avec quel modèle ?", sub: "ton abonnement suffit. tu pourras en changer par projet.",
        groups: [{ items: accountItems(x) }], key: x.keyFor ? { id: x.keyFor, text: x.keyText, ph: "paste your key, then ⏎" } : null,
        cta: { text: "continue", kind: "pri", state: ok ? "" : "disabled" }, help: ok ? "" : "sign in to one of them to go on" };
    }
    if (at === "projects") {
      const items = x.found.items.filter((i) => !i.known);
      const n = items.filter((i) => x.picks[i.path]).length;
      return { ...base0, small: true, title: "tes projets", sub: "j'ai trouvé ces repos dans ton dossier. chacun aura son main ; le tien les coordonne.",
        groups: [{ items: items.map((i) => ({ label: i.name, sub: i.path, check: { on: !!x.picks[i.path] }, control: { value: `git · ${ago(i.last_ms, s.now)}` }, act: { ev: "ui_onb_pick", path: i.path } })) }],
        extra: { text: "choose a folder…", act: { ev: "ui_add_choose" } }, loading: !x.found.dir,
        cta: { text: n ? `add ${n} project${n > 1 ? "s" : ""}` : "continue without a project", kind: "pri" } };
    }
    return { ...base0, small: false, pearl: true, title: "essaie : tiens fn", sub: "et dis par exemple « qu'est-ce qui a bougé dans storefront cette semaine ? »",
      fn: x.fn, hint: x.tried ? "c'est parti : bise te répond dans la capsule, en bas de l'écran." : "fn espace ouvre la spotlight · fn fn pour parler sans tenir",
      cta: { text: x.tried ? "open bise" : "open bise without trying", kind: x.tried ? "pri" : "" }, skip: "" };
  }

  // a toggle bound to a pref
  const tg = (x, key, label, sub, dflt = true) => {
    const v = get(x.prefs, key);
    const on = v == null ? dflt : !!v;
    return { label, sub, control: { toggle: { on, act: { ev: "ui_set_pref", key, value: !on } } } };
  };
  const val = (label, sub, value) => ({ label, sub, control: { value } });
  const KEYS = [["talk from anywhere, with a capture", "hold fn"], ["hands-free voice", "fn fn"], ["the spotlight", "fn space"], ["bise", "⌘0"], ["a project", "⌘1 … ⌘9"],
    ["the project's main / an agent", "⌥0 / ⌥1 … ⌥9"], ["find an agent by its name", "⌘K"], ["back / forward", "⌘[ / ⌘]"], ["the inbox above the composer", "⌘I, ctrl+1-9"],
    ["the agent's diff", "⌘D"], ["the artifacts", "⌘⇧A"], ["unfold / fold everything", "⌘E"], ["stop the agent's turn", "⌘."], ["send after its turn", "⌥⏎"], ["settings", "⌘,"]];

  function settings(x, s) {
    const nav = PAGES.map((p) => ({ kind: "ag", name: p, on: p === x.page, act: { ev: "ui_set_page", page: p } }));
    const page = x.page;
    let sub = "", groups = [];
    if (page === "general") {
      sub = "bise sur ton Mac.";
      const theme = get(x.prefs, "theme") || "system";
      groups = [{ items: [{ label: "appearance", sub: "light, dark, or as macOS", control: { seg: { items: ["system", "light", "dark"], on: ["system", "light", "dark"].indexOf(theme), act: { ev: "ui_set_pref", key: "theme", values: ["system", "light", "dark"] } } } },
        tg(x, "login", "open at login", "the pearl in the menu bar from the start"), tg(x, "menubar_count", "the count on the pearl", "what waits for you, in the menu bar")] }];
    } else if (page === "voice and fn") {
      sub = "comment tu parles à bise.";
      groups = [{ items: [tg(x, "voice.fn_hold", "hold fn to talk", "your words go when you let go"), tg(x, "voice.fn_twice", "fn fn: hands-free", "talk without holding; fn again stops"),
        val("language", "what bise hears", get(x.prefs, "voice.language") || "auto")] }];
    } else if (page === "context and privacy") {
      sub = "ce que fn joint à ta question. rien n'est lu sans fn tenu.";
      groups = [{ title: "when you hold fn", items: [tg(x, "context.shot", "a screenshot of the window in front", "jamais tout l'écran"),
        tg(x, "context.url", "the tab's URL and title", "Chrome, Safari, Arc"), tg(x, "context.file", "the open file and your selection", "VS Code, Cursor, Xcode, Zed"),
        tg(x, "context.window_text", "the text of the window", "les mails, les docs, les tickets : bise voit ce que tu vois")] },
      { title: "kept", items: [val("screenshots", "dans le fil, puis effacées", `${get(x.prefs, "shots_keep_days") || 7} days`),
        val("never sent to an agent", "les apps exclues", (get(x.prefs, "excluded_apps") || ["1Password", "Messages"]).join(", "))] }];
    } else if (page === "quiet moments") {
      sub = "quand les cartes attendent, et comment elles reviennent.";
      groups = [{ title: "cards wait", items: [tg(x, "quiet.call", "during a call", "Zoom, Meet, FaceTime : la perle rosit, rien ne s'affiche"),
        tg(x, "quiet.share", "while you share your screen", "jamais une carte pendant un partage"), tg(x, "quiet.fullscreen", "in full screen", "Keynote, un jeu, une vidéo"),
        tg(x, "quiet.focus", "in focus mode", "suit le mode concentration de macOS")] },
      { title: "then", items: [val("they come together", "« 2 questions · 1 min », une à la fois", "as a batch"),
        val("at most every", "pour regrouper le reste", `${get(x.prefs, "quiet.batch_min") || 30} min`), tg(x, "quiet.away_card", "while you were away", "une carte quand tu rouvres ton Mac")] }];
    } else if (page === "models") {
      sub = "ton abonnement suffit ; une clé d'API marche aussi. /models et /provider dans le terminal.";
      groups = [{ items: accountItems(x) }];
    } else if (page === "projects") {
      sub = "un main par projet ; le tien, bise, les coordonne. l'ordre est celui de ⌘1 … ⌘9.";
      const ps = s.projects.filter((p) => !p.home).sort((a, b) => (a.order || 0) - (b.order || 0));
      groups = [{ items: ps.map((p, i) => ({ label: p.name, sub: p.path, control: { btns: [
        ...(i > 0 ? [{ text: "↑", kind: "ghost", act: { ev: "ui_set_move", project: p.project, order: i } }] : []),
        { text: "remove", kind: "ghost danger", act: { ev: "ui_set_remove", project: p.project } }] }, key: i < 9 ? `⌘${i + 1}` : "" })) }];
    } else if (page === "keys") {
      sub = "chaque touche du terminal marche aussi ici ; ⌘ ajoute les gestes d'une app Mac. /help dans le terminal.";
      groups = [{ items: KEYS.map(([l, k]) => ({ label: l, control: { kbd: k } })) }];
    }
    return { nav, title: page, sub, groups, add: page === "projects" ? { text: "+ add a project", act: { ev: "ui_add_open" } } : null, key: page === "models" && x.keyFor ? { id: x.keyFor, text: x.keyText, ph: "paste your key, then ⏎" } : null };
  }

  function view(s) {
    const x = s.s11 || init();
    if (s.route.screen === "onboarding") return { kind: "onboarding", ...onboarding(x, s) };
    if (s.route.screen === "settings") return { kind: "settings", ...settings(x, s) };
    return null;
  }
  // the add-a-project sheet over the window
  function overlay(s) {
    const x = s.s11;
    if (!x || !x.sheet) return null;
    const sh = x.sheet;
    const known = new Set(s.projects.map((p) => p.path));
    const list = x.found.items.filter((i) => !i.known && !known.has(i.path)).slice(0, 5);
    return { title: "add a project", sub: "un dossier, un repo git. son main démarre tout de suite.",
      drop: sh.path ? `${sh.path}` : "drop a folder here, or choose one…", dropAct: { ev: "ui_add_choose" }, picked: !!sh.path,
      items: list.map((i) => ({ label: i.name, sub: i.path, check: { on: sh.path === i.path }, control: { value: `git · ${ago(i.last_ms, s.now)}` }, act: { ev: "ui_add_pick", path: i.path } })),
      choices: [{ label: "agents in their own worktree", sub: "ψ : chaque agent a sa copie du repo, rien ne se marche dessus", control: { toggle: { on: sh.worktrees, act: { ev: "ui_add_toggle", key: "worktrees" } } } },
        { label: "main may land on main", sub: sh.land ? "sb land après les tests, sans te demander" : "sinon une approbation à chaque fois", control: { toggle: { on: sh.land, act: { ev: "ui_add_toggle", key: "land" } } } }],
      cancel: { text: "cancel", act: { ev: "ui_add_close" } }, go: { text: sh.path ? `add ${base(sh.path)}` : "add", kind: "pri", state: sh.path ? "" : "disabled", act: { ev: "ui_add_go" } } };
  }

  root.AmbWinS11 = { init, owns, step, key, wantsKeys, enter, view, overlay, SCREENS, STEPS, PAGES };
})(typeof window !== "undefined" ? window : globalThis);
