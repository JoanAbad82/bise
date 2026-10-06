// bise desktop · S7's screens in the window: review, artifacts, environments (amb-web). One
// extension object for amb-win's model and drawing (m_8307); each screen is its own module
// (winenv.js, then winarts.js, winreview.js) with init/owns/step/view/draw, composed here.
// Load after the screens' modules, before winmodel.js.
//
//   AmbWinS7.init() -> s7                       the screens' state (s.s7)
//   AmbWinS7.owns(ev) -> bool                   core events and ui_* events a screen handles
//   AmbWinS7.enter(s7, route, s) -> {s7, cmds}  a screen's route opens (subscribe what it needs)
//   AmbWinS7.step(s7, ev, s) -> {s7, cmds, route?, eat?}
//   AmbWinS7.view(s) -> d                       the screen of s.route (d.head: amb-win's header)
//   AmbWinS7.tab(s, project, 'changes'|'artifacts') -> d | null
//   AmbWinS7.draw(d, UI) -> Element             drawn in the main column, above the composer
//
// Routes (amb-win's): {screen:'review', project, agent}, {screen:'artifacts'|'environments',
// project:'home', agent:'main'}. Every core cmd carries project (check-win's law).
(function (root) {
  "use strict";
  // screen name -> its module, and the key of its state in s7
  const parts = () => ({ environments: [root.AmbWinEnv, "env"] });

  function init() {
    const s7 = {};
    for (const [m, k] of Object.values(parts())) if (m) s7[k] = m.init();
    return s7;
  }
  const owns = (ev) => Object.values(parts()).some(([m]) => m && m.owns(ev));

  function enter(s7, route, s) {
    const p = parts()[route && route.screen];
    if (!p || !p[0] || !p[0].enter) return { s7, cmds: [] };
    const r = p[0].enter(s7[p[1]], route, s);
    return { s7: { ...s7, [p[1]]: r.e }, cmds: r.cmds || [] };
  }

  function step(s7, ev, s) {
    let cmds = [], route, eat;
    for (const [m, k] of Object.values(parts())) {
      if (!m || !m.owns(ev)) continue;
      const r = m.step(s7[k], ev, s);
      s7 = { ...s7, [k]: r.e };
      cmds = cmds.concat(r.cmds || []);
      if (r.route) route = r.route;
      if (r.eat) eat = true;
    }
    return { s7, cmds, ...(route ? { route } : {}), ...(eat ? { eat } : {}) };
  }

  function view(s) {
    const p = parts()[s.route && s.route.screen];
    return p && p[0] ? p[0].view(s) : null;
  }
  // a project's changes / artifacts tab: null keeps amb-win's simple lists until those screens land
  const tab = () => null;

  function draw(d, UI) {
    const p = d && parts()[d.screen];
    return p && p[0] ? p[0].draw(d, UI) : null;
  }

  root.AmbWinS7 = { init, owns, enter, step, view, tab, draw };
})(typeof window !== "undefined" ? window : globalThis);
