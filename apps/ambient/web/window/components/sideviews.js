// bise desktop window · side views (ds: components/sideviews.html, sideviews.css): a panel on the
// window's right with a head and its body (a diff's files, an artifact's versions). Load core.js,
// prim.js, window.js and thread.js first.
(function (root) {
  "use strict";
  const UI = root.BiseUI;
  const { h, act, define } = UI.core;

  // {title, actions: [{text, act}] (ghost buttons), chip: chip data, files: [{name, end, on, act}],
  // children: [Element] (a diff, an artifact's pane), empty: {title, text}, loading}
  define("sideview", (d) => h("div", "b-sideview",
    h("div", "sh2", d.title, h("span", "end",
      d.chip ? UI.chip.render(d.chip) : null,
      (d.actions || []).map((a) => act(h("span", "b-btn ghost", a.text), a.act)))),
    h("div", "b-files",
      d.loading ? [UI.skel.render({}), h("br"), UI.skel.render({}), h("br"), UI.skel.render({})] : null,
      d.empty ? UI.empty.render(d.empty) : null,
      (d.files || []).map((f) => act(h("div", ["b-row", f.on && "on"], h("span", "nm", f.name), f.end ? h("span", "end", f.end) : null), f.act)),
      d.children)));
})(typeof window !== "undefined" ? window : globalThis);
