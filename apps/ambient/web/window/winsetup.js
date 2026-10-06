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
      step: 0, picks: {}, fn: "up", tried: false, heard: "", keyFor: null, keyText: "", page: "general", sheet: null, adding: null, menu: null, confirm: null };
  }

  const CORE = ["prefs", "accounts", "found", "perms", "win_folder", "win_drop", "app_fn", "heard"];
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
      case "app_fn": return out({ ...x, fn: ev.state === "down" ? "down" : "up", heard: ev.state === "down" ? "" : x.heard, tried: x.tried || (ev.state === "up" && x.fn === "down") });
      // his words while he holds fn (the capsule's heard events, forwarded to the window)
      case "heard": return out(x.fn === "down" || x.tried ? { ...x, heard: ev.text } : x);
      case "win_folder": return ev.path ? out(x.sheet ? { ...x, sheet: { ...x.sheet, paths: x.sheet.paths.includes(ev.path) ? x.sheet.paths : [...x.sheet.paths, ev.path] } } : { ...x, picks: { ...x.picks, [ev.path]: true },
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
        return out({ ...x, prefs: put(x.prefs, ev.key, ev.value), menu: ev.close ? null : x.menu });
      }
      // remove asks once (ambient m_8411 18): ⏎ remove · esc keep
      case "ui_set_confirm": return out({ ...x, confirm: ev.project || null, menu: null });
      case "ui_set_remove": cmds.push({ cmd: "project_remove", project: ev.project }); return out({ ...x, confirm: null, menu: null });
      case "ui_set_menu": return out({ ...x, menu: ev.id || null });
      case "ui_set_open": cmds.push({ cmd: "open", project: ev.project, what: ev.what }); return out({ ...x, menu: null });
      case "ui_set_move": cmds.push({ cmd: "project_move", project: ev.project, order: ev.order }); return out(x);
      // the add-a-project sheet
      case "ui_add_open": {
        if (!x.found.items.length) cmds.push({ cmd: "found_scan", dir: "~" });
        return out({ ...x, sheet: sheet(ev.path || null) });
      }
      // a path typed in the sheet's field counts like a ticked one
      case "ui_add_type": return out(x.sheet ? { ...x, sheet: { ...x.sheet, typed: String(ev.text || "") } } : x);
      case "ui_add_pick": return out(x.sheet ? { ...x, sheet: { ...x.sheet, paths: toggleIn(x.sheet.paths, ev.path) } } : x);
      case "ui_add_choose": cmds.push({ cmd: "win_pick_folder" }); return out(x);
      case "ui_add_toggle": return out(x.sheet ? { ...x, sheet: set(x.sheet, ev.key, !x.sheet[ev.key]) } : x);
      case "ui_add_close": return out({ ...x, sheet: null });
      case "ui_add_go": {
        const paths = x.sheet ? goPaths(x.sheet) : [];
        if (!paths.length) return out(x);
        for (const path of paths) cmds.push({ cmd: "project_add", path, worktrees: x.sheet.worktrees, land: x.sheet.land });
        return out({ ...x, sheet: null, adding: paths[0] });
      }
    }
    return out(x);
  }
  const base = (p) => String(p || "").replace(/\/$/, "").split("/").pop();
  const sheet = (path) => ({ paths: path ? [path] : [], worktrees: true, land: false });
  // what 'add' adds: the ticked paths, plus the one typed in the field
  const goPaths = (sh) => { const t = String(sh.typed || "").trim(); return t && !sh.paths.includes(t) ? [...sh.paths, t] : sh.paths; };
  const toggleIn = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

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
      if (x.confirm && ev.key === "Enter") return { ...step(x, { ev: "ui_set_remove", project: x.confirm }, s), eat: true };
      if (x.confirm && ev.key === "Escape") return { s11: { ...x, confirm: null }, cmds, eat: true };
      if (x.menu && ev.key === "Escape") return { s11: { ...x, menu: null }, cmds, eat: true };
      if (x.keyFor && ev.key === "Enter") return { ...step(x, { ev: "ui_key_save" }, s), eat: true };
      if (ev.key === "Escape") return x.keyFor ? { s11: { ...x, keyFor: null }, cmds, eat: true } : { s11: x, cmds, back: true, eat: true };
      return ev.meta ? null : keep;
    }
    return null;
  }

  function enter(x, route) {
    const cmds = [];
    if (route.screen === "settings" && route.page) x = { ...x, page: route.page };
    if (route.screen === "settings") x = { ...x, menu: null, confirm: null };
    if (route.screen === "settings" && !x.found.items.length) cmds.push({ cmd: "found_scan", dir: "~" });
    return { s11: x, cmds };
  }

  // ---- views (every word from winwords.js: one language per screen)
  const T = (s, k, v) => (root.AmbWinWords ? root.AmbWinWords.t(s, k, v) : k);
  function ago(s, ms) {
    if (!ms) return "";
    const d = Math.floor((s.now - ms) / 86400000);
    return d < 1 ? T(s, "ago_today") : d < 2 ? T(s, "ago_yesterday") : d < 30 ? T(s, "ago_days", { n: d }) : d < 60 ? T(s, "ago_month") : T(s, "ago_months", { n: Math.floor(d / 30) });
  }
  // states are chips (✓ allowed, denied, ✓ signed in), choices are buttons; no checkbox for a state
  // (designer m_8408 3-4)
  const PERMS = [["mic", "mic"], ["accessibility", "ax"], ["screen", "screen"]];
  function permItems(x, s) {
    return PERMS.map(([id, w]) => {
      const st = x.perms[id];
      return { label: T(s, w), sub: st === "denied" ? T(s, `${w}_lost`) : T(s, `${w}_s`),
        control: st === "allowed" ? { chip: { text: T(s, "allowed"), tone: "ok" } }
          : st === "denied" ? { chips: [{ chip: { text: T(s, "denied"), tone: "err" } }, { btn: { text: T(s, "open_settings"), act: { ev: "ui_perm_ask", perm: id } } }] }
          : { btn: { text: T(s, "allow"), act: { ev: "ui_perm_ask", perm: id } } } };
    });
  }
  function accountItems(x, s) {
    const subs = x.accounts.filter((a) => a.kind === "subscription");
    const items = subs.map((a) => ({ label: a.label, sub: a.state === "signed_in" && a.who ? a.who : T(s, "sign_in_browser"), ok: a.state === "signed_in",
      control: a.state === "signed_in" ? { chip: { text: T(s, "signed_in"), tone: "ok" } } : a.state === "signing_in" ? { btn: { text: T(s, "sign_in"), state: "loading" } }
        : { btn: { text: a.state === "expired" ? T(s, "sign_in_again") : T(s, "sign_in"), act: { ev: "ui_acct_sign_in", id: a.id } } } }));
    const keys = x.accounts.filter((a) => a.kind === "key");
    const anyKey = keys.find((a) => a.state === "signed_in");
    items.push({ label: T(s, "api_key"), sub: anyKey ? `${anyKey.label} · ${anyKey.who || ""}` : T(s, "api_key_s"), ok: !!anyKey,
      control: anyKey ? { chip: { text: T(s, "key_added"), tone: "ok" } } : { btn: { text: T(s, "add_key"), act: { ev: "ui_key_edit", id: (keys[0] || { id: "anthropic" }).id } } } });
    return items;
  }

  function onboarding(x, s) {
    const at = STEPS[x.step];
    const base0 = { steps: STEPS.length, step: x.step, back: x.step > 0 ? T(s, "back") : "", skip: T(s, "skip") };
    if (at === "hello") return { ...base0, pearl: "rest", title: T(s, "hello_t"), sub: T(s, "hello_s"), cta: { text: T(s, "start"), kind: "pri" } };
    if (at === "permissions") {
      const all = PERMS.every(([id]) => x.perms[id] === "allowed");
      return { ...base0, title: T(s, "perms_t"), sub: T(s, "perms_s"), groups: [{ items: permItems(x, s) }],
        cta: { text: all ? T(s, "continue") : T(s, "continue_now"), kind: all ? "pri" : "" } };
    }
    if (at === "model") {
      const ok = signedIn(x);
      return { ...base0, title: T(s, "model_t"), sub: T(s, "model_s"), groups: [{ items: accountItems(x, s) }],
        key: x.keyFor ? { id: x.keyFor, text: x.keyText, ph: T(s, "key_ph") } : null,
        cta: { text: T(s, "continue"), kind: "pri", state: ok ? "" : "disabled" }, help: ok ? "" : T(s, "need_sign_in") };
    }
    if (at === "projects") {
      const items = x.found.items.filter((i) => !i.known);
      const n = items.filter((i) => x.picks[i.path]).length;
      return { ...base0, title: T(s, "projects_t"), sub: T(s, "projects_s"),
        groups: [{ items: items.map((i) => ({ label: i.name, sub: i.path, check: { on: !!x.picks[i.path] }, control: { value: T(s, "git_ago", { ago: ago(s, i.last_ms) }) }, act: { ev: "ui_onb_pick", path: i.path } })) }],
        extra: { text: T(s, "choose_folder"), act: { ev: "ui_add_choose" } }, loading: !x.found.dir,
        cta: { text: n ? T(s, "add_n", { n }) : T(s, "add_none"), kind: "pri" } };
    }
    // try fn: the pearl listens while he holds fn, his words land under it, then "✓ that's it"
    return { ...base0, pearl: x.fn === "down" ? "listen" : x.tried ? "done" : "rest", title: T(s, "fn_t"), sub: T(s, "fn_s"),
      fn: x.fn, heard: x.fn === "down" ? x.heard || T(s, "fn_listening") : x.tried ? x.heard || "" : "",
      hint: x.tried ? T(s, "fn_done") : T(s, "fn_hint"), done: x.tried,
      cta: { text: x.tried ? T(s, "open_bise") : T(s, "open_bise_skip"), kind: x.tried ? "pri" : "" }, skip: "" };
  }

  // a toggle bound to a pref
  function tg(x, s, key, w, dflt = true) {
    const v = get(x.prefs, key);
    const on = v == null ? dflt : !!v;
    return { label: T(s, w), sub: T(s, `${w}_s`), control: { toggle: { on, act: { ev: "ui_set_pref", key, value: !on } } } };
  }
  // a choice = the DS's menu button ('30 min ▾'); its menu opens under it (designer m_8408 6)
  function choice(x, s, id, w, now, opts) {
    const open = x.menu === id;
    return { label: T(s, w), sub: T(s, `${w}_s`), control: { menu: { id, text: `${now} ▾`, open, act: { ev: "ui_set_menu", id: open ? null : id },
      items: opts.map(([text, key, value, on]) => ({ text, on, act: { ev: "ui_set_pref", key, value, close: true } })) } } };
  }
  const KEYS = [["k_talk", "k_hold_fn"], ["k_free", "fn fn"], ["k_spot", "k_fn_space"], ["k_bise", "⌘0"], ["k_project", "⌘1 … ⌘9"], ["k_agent", "⌥0 / ⌥1 … ⌥9"],
    ["k_find", "⌘K"], ["k_back", "⌘[ / ⌘]"], ["k_inbox", "⌘I, ctrl+1-9"], ["k_diff", "⌘D"], ["k_arts", "⌘⇧A"], ["k_fold", "⌘E"], ["k_stop", "⌘."], ["k_queue", "⌥⏎"], ["k_settings", "⌘,"]];
  // the apps fn never reads, by bundle id (prefs.excluded_apps, bise_home Pref::ExcludedApps, amb-home
  // m_9073): the seed, the same table as bise_home::prefs::EXCLUDED_APPS_SEED; he toggles ids, he
  // reads names; an id outside the table shows its last part
  const APPS = [["com.agilebits.onepassword7", "1Password 7"], ["com.1password.1password", "1Password"], ["com.bitwarden.desktop", "Bitwarden"],
    ["com.dashlane.dashlanephone", "Dashlane"], ["com.apple.keychainaccess", "Keychain Access"], ["com.apple.Passwords", "Passwords"],
    ["com.apple.systempreferences", "System Settings"], ["com.apple.MobileSMS", "Messages"]];
  const appName = (id) => (APPS.find(([i]) => i === id) || [id, String(id).split(".").pop()])[1];

  function settings(x, s) {
    const nav = PAGES.map((p, i) => ({ kind: "ag", name: T(s, PAGE_W[i]), on: p === x.page, act: { ev: "ui_set_page", page: p } }));
    const page = x.page;
    let sub = "", groups = [];
    if (page === "general") {
      sub = T(s, "general_s");
      const theme = get(x.prefs, "theme") || "system", lang = get(x.prefs, "language") || "system";
      groups = [{ items: [
        { label: T(s, "appearance"), sub: T(s, "appearance_s"), control: { seg: { items: [T(s, "system"), T(s, "light"), T(s, "dark")], on: ["system", "light", "dark"].indexOf(theme), act: { ev: "ui_set_pref", key: "theme", values: ["system", "light", "dark"] } } } },
        { label: T(s, "language"), sub: T(s, "language_s"), control: { seg: { items: [T(s, "lang_system"), T(s, "lang_en"), T(s, "lang_fr")], on: ["system", "en", "fr"].indexOf(lang), act: { ev: "ui_set_pref", key: "language", values: ["system", "en", "fr"] } } } },
        tg(x, s, "login", "login"), tg(x, s, "menubar_count", "count")] }];
    } else if (page === "voice and fn") {
      sub = T(s, "voice_s");
      groups = [{ items: [tg(x, s, "voice.fn_hold", "fn_hold"), tg(x, s, "voice.fn_twice", "fn_twice"),
        choice(x, s, "voice.language", "hears", get(x.prefs, "voice.language") === "auto" || !get(x.prefs, "voice.language") ? T(s, "auto") : get(x.prefs, "voice.language"),
          [[T(s, "auto"), "voice.language", "auto"], ["English", "voice.language", "en"], ["Français", "voice.language", "fr"]])] }];
    } else if (page === "context and privacy") {
      sub = T(s, "privacy_s");
      const days = get(x.prefs, "shots_keep_days") || 7, apps = get(x.prefs, "excluded_apps") || APPS.map(([id]) => id);
      const known = [...APPS, ...apps.filter((id) => !APPS.some(([i]) => i === id)).map((id) => [id, appName(id)])];
      groups = [{ title: T(s, "when_fn"), items: [tg(x, s, "context.shot", "ctx_shot"), tg(x, s, "context.url", "ctx_url"), tg(x, s, "context.file", "ctx_file"), tg(x, s, "context.window_text", "ctx_text")] },
      { title: T(s, "kept"), items: [choice(x, s, "shots", "shots_kept", T(s, "days_n", { n: days }), [1, 7, 30].map((n) => [T(s, "days_n", { n }), "shots_keep_days", n, n === days])),
        { label: T(s, "excluded"), sub: `${T(s, "excluded_s")} · ${apps.map(appName).join(", ")}`, control: { menu: { id: "apps", text: T(s, "edit"), open: x.menu === "apps", act: { ev: "ui_set_menu", id: x.menu === "apps" ? null : "apps" },
          items: known.map(([id, name]) => ({ text: `${apps.includes(id) ? "✓ " : ""}${name}`, act: { ev: "ui_set_pref", key: "excluded_apps", value: apps.includes(id) ? apps.filter((z) => z !== id) : [...apps, id] } })) } } }] }];
    } else if (page === "quiet moments") {
      sub = T(s, "quiet_s");
      const batch = get(x.prefs, "quiet.batch") !== false, every = get(x.prefs, "quiet.batch_min") || 30;
      groups = [{ title: T(s, "cards_wait"), items: [tg(x, s, "quiet.call", "q_call"), tg(x, s, "quiet.share", "q_share"), tg(x, s, "quiet.fullscreen", "q_full"), tg(x, s, "quiet.focus", "q_focus")] },
      { title: T(s, "then"), items: [choice(x, s, "batch", "q_batch", batch ? T(s, "as_batch") : T(s, "one_by_one"), [[T(s, "as_batch"), "quiet.batch", true, batch], [T(s, "one_by_one"), "quiet.batch", false, !batch]]),
        choice(x, s, "every", "q_every", T(s, "min_n", { n: every }), [10, 30, 60].map((n) => [T(s, "min_n", { n }), "quiet.batch_min", n, n === every])),
        tg(x, s, "quiet.away_card", "q_away")] }];
    } else if (page === "models") {
      sub = T(s, "models_s");
      groups = [{ items: accountItems(x, s) }];
    } else if (page === "projects") {
      sub = T(s, "projects_page_s");
      const ps = s.projects.filter((p) => !p.home).sort((a, b) => (a.order || 0) - (b.order || 0));
      // a drag handle orders them (the order of ⌘1-9); '…' holds the rest, remove last, in red
      groups = [{ items: ps.map((p, i) => ({ label: p.name, sub: p.path, drag: { project: p.project, order: i + 1, tip: T(s, "drag") }, key: i < 9 ? `⌘${i + 1}` : "",
        control: { menu: { id: `p:${p.project}`, text: T(s, "more"), open: x.menu === `p:${p.project}`, act: { ev: "ui_set_menu", id: x.menu === `p:${p.project}` ? null : `p:${p.project}` },
          items: [{ text: T(s, "open_terminal"), act: { ev: "ui_set_open", project: p.project, what: "terminal" } }, { text: T(s, "open_editor"), act: { ev: "ui_set_open", project: p.project, what: "editor" } },
            { sep: true }, { text: T(s, "remove_from"), danger: true, act: { ev: "ui_set_confirm", project: p.project } }] } } })) }];
    } else if (page === "keys") {
      sub = T(s, "keys_s");
      groups = [{ items: KEYS.map(([l, k]) => ({ label: T(s, l), control: { kbd: T(s, k) } })) }];
    }
    const conf = x.confirm && s.projects.find((p) => p.project === x.confirm);
    return { nav, navTitle: T(s, "settings"), back: T(s, "back"), title: T(s, PAGE_W[PAGES.indexOf(page)]), sub, groups,
      add: page === "projects" ? { text: T(s, "add_project"), act: { ev: "ui_add_open" } } : null,
      confirm: conf ? { text: T(s, "remove_ask", { p: conf.name }), keys: T(s, "remove_keys"), yes: { text: T(s, "remove"), kind: "danger", act: { ev: "ui_set_remove", project: conf.project } }, no: { text: T(s, "keep"), act: { ev: "ui_set_confirm", project: null } } } : null,
      key: page === "models" && x.keyFor ? { id: x.keyFor, text: x.keyText, ph: T(s, "key_ph") } : null };
  }
  const PAGE_W = ["page_general", "page_voice", "page_privacy", "page_quiet", "page_models", "page_projects", "page_keys"];

  function view(s) {
    const x = s.s11 || init();
    if (s.route.screen === "onboarding") return { kind: "onboarding", ...onboarding(x, s) };
    if (s.route.screen === "settings") return { kind: "settings", ...settings(x, s) };
    return null;
  }
  // the add-a-project sheet over the window: the path as a field with 'choose…' at its end, his
  // repos with ticks, the button counting them (designer m_8408 8)
  function overlay(s) {
    const x = s.s11;
    if (!x || !x.sheet) return null;
    const sh = x.sheet;
    const known = new Set(s.projects.map((p) => p.path));
    const list = x.found.items.filter((i) => !i.known && !known.has(i.path)).slice(0, 5);
    const extra = sh.paths.filter((p) => !list.some((i) => i.path === p));
    const all = goPaths(sh);
    const n = all.length;
    return { title: T(s, "add_t"), sub: T(s, "add_s"),
      path: { text: sh.typed != null ? sh.typed : extra[extra.length - 1] || "", ph: T(s, "add_path"), choose: { text: T(s, "choose"), act: { ev: "ui_add_choose" } } },
      foundTitle: T(s, "found_in"),
      items: list.map((i) => ({ label: i.name, sub: i.path, check: { on: sh.paths.includes(i.path) }, control: { value: T(s, "git_ago", { ago: ago(s, i.last_ms) }) }, act: { ev: "ui_add_pick", path: i.path } })),
      choices: [{ label: T(s, "wt"), sub: T(s, "wt_s"), control: { toggle: { on: sh.worktrees, act: { ev: "ui_add_toggle", key: "worktrees" } } } },
        { label: T(s, "land"), sub: sh.land ? T(s, "land_on") : T(s, "land_off"), control: { toggle: { on: sh.land, act: { ev: "ui_add_toggle", key: "land" } } } }],
      cancel: { text: T(s, "cancel"), tip: T(s, "cancel_tip"), act: { ev: "ui_add_close" } },
      go: { text: n === 1 ? T(s, "add_one", { p: base(all[0]) }) : n ? T(s, "add_n", { n }) : T(s, "add"), tip: T(s, "add_tip"), kind: "pri", state: n ? "" : "disabled", act: { ev: "ui_add_go" } } };
  }

  root.AmbWinS11 = { init, owns, step, key, wantsKeys, enter, view, overlay, SCREENS, STEPS, PAGES };
})(typeof window !== "undefined" ? window : globalThis);
