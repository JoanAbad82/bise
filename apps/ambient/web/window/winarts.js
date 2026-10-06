// bise desktop · the artifacts screen (S7, desktop-app v9 "les artefacts", ⌘⇧A): everything the
// agents made, as thumbnails, every project or one; "new" on what came since he last looked.
// Pure step + view; draw() builds it from amb-kit's components. wins7.js wires it (AmbWinS7).
//
// Reads amb-win's s.arts (project -> S3a artifacts items {id, kind, title, agent, version, at_ms,
// url, new}); never owns the artifacts event (bise's 'made today' reads it too).
// Seen: opening the screen sends {cmd:'artifacts_seen', project} for each project with new items
// (S3a draft, the core owns 'new'); the chips stay for this visit (the ids new on entering).
// A click opens the artifact's url in his browser ({cmd:'app_open_url', project, url}).
(function (root) {
  "use strict";
  const HOME = "home";

  const init = () => ({ filter: null, fresh: [] });
  const EVS = new Set(["ui_art_filter", "ui_art_open"]);
  const owns = (ev) => EVS.has(ev.ev);

  const projectsOf = (s) => s.projects.filter((p) => !p.home && p.project !== HOME).sort((a, b) => (a.order || 0) - (b.order || 0));
  const all = (s) => Object.entries(s.arts || {}).flatMap(([project, items]) => (items || []).map((a) => ({ ...a, project })));

  // entering: what is new now stays marked for this visit; the core hears he looked
  function enter(e, route, s) {
    const fresh = all(s).filter((a) => a.new);
    const projects = [...new Set(fresh.map((a) => a.project))];
    return { e: { ...e, fresh: fresh.map((a) => `${a.project}/${a.id}`) }, cmds: projects.map((project) => ({ cmd: "artifacts_seen", project })) };
  }

  function step(e, ev, s) {
    switch (ev.ev) {
      case "ui_art_filter": {
        // the seg's part i: 0 = every project, then the projects in order (or a project by id)
        const p = ev.project !== undefined ? ev.project : ev.i ? (projectsOf(s)[ev.i - 1] || {}).project || null : null;
        return { e: { ...e, filter: p }, cmds: [] };
      }
      case "ui_art_open": return { e, cmds: ev.url ? [{ cmd: "app_open_url", project: ev.project, url: ev.url }] : [] };
    }
    return { e, cmds: [] };
  }

  // ---- time: hh:mm today, "yesterday", else "Tue 29 Sep" (his timezone, s.tz)
  function when(s, ms) {
    const day = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: s.tz });
    const d = day.format(new Date(ms));
    if (d === day.format(new Date(s.now))) return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: s.tz }).format(new Date(ms));
    if (d === day.format(new Date(s.now - 86400000))) return "yesterday";
    return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: s.tz }).format(new Date(ms));
  }

  function view(s) {
    const e = s.s7.arts;
    const projects = projectsOf(s);
    const name = (id) => (s.projects.find((p) => p.project === id) || { name: id }).name;
    const fresh = new Set(e.fresh);
    const isNew = (a) => !!a.new || fresh.has(`${a.project}/${a.id}`);
    const every = all(s).sort((a, b) => b.at_ms - a.at_ms);
    const shown = e.filter ? every.filter((a) => a.project === e.filter) : every;
    const nNew = shown.filter(isNew).length;
    const items = shown.map((a) => ({ id: a.id, project: a.project, kind: a.kind, title: a.title, new: isNew(a),
      meta: `${name(a.project)} · ${a.agent} · ${when(s, a.at_ms)}`, ...(a.version > 1 ? { version: `v${a.version}` } : {}),
      act: a.url ? { ev: "ui_art_open", project: a.project, url: a.url } : null }));
    const on = e.filter ? projects.findIndex((p) => p.project === e.filter) + 1 : 0;
    return { screen: "artifacts",
      head: { t1: "artifacts", t2: [e.filter ? name(e.filter) : "every project", String(shown.length), ...(nNew ? [`${nNew} new since you looked`] : [])], acc: nNew ? 2 : -1 },
      filter: { items: ["all", ...projects.map((p) => p.name)], on, act: { ev: "ui_art_filter" } },
      items,
      empty: items.length ? null : e.filter ? { title: `nothing from ${name(e.filter)} yet`, text: "what its agents make shows here" }
        : { title: "nothing made yet", text: "pages, charts and reports your agents make show here" } };
  }

  // ---- draw: the filter, then the thumbnails' grid (amb-win's svg thumbnails when it has them)
  function draw(d, UI) {
    const { h, act } = UI.core;
    const W = root.AmbWinUI;
    const thumb = (k) => (W && W.thumb ? W.thumb(k) : h("div", "ph"));
    return h("div", "w7 w7-arts",
      h("div", "w7-filter", UI.seg.render(d.filter)),
      d.empty ? UI.empty.render(d.empty) : h("div", "w7-grid", d.items.map((a) => act(h("div", ["b-tn", "w7-tile", !a.act && "is-static"],
        thumb(a.kind),
        h("div", "w7-tt", h("b", null, a.title), a.new ? UI.chip.render({ text: "new", tone: "acc" }) : null),
        h("div", "w7-tm", a.meta, a.version ? ` · ${a.version}` : "")), a.act))));
  }

  root.AmbWinArts = { init, owns, enter, step, view, draw };
})(typeof window !== "undefined" ? window : globalThis);
