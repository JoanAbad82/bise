// bise desktop window · menus and toasts (ds: components/menus.html, toasts.html; menus.css,
// toasts.css). Load core.js and prim.js first.
(function (root) {
  "use strict";
  const UI = root.BiseUI;
  const { h, act, define } = UI.core;

  // {items: [{text, key, on (the keyboard's), dis, danger, act} | {sep: true}]}
  define("menu", (d) => h("div", "b-menu", (d.items || []).map((m) => (m.sep
    ? h("div", "b-sep")
    : act(h("div", ["b-mi", m.on && "on", m.dis && "dis", m.danger && "danger"], h("span", null, m.text), h("span", "k", m.key || "")), m.dis ? null : m.act)))));

  // {text, err, dot: {state}, action: {text, act}}: a toast, its one action a ghost button
  define("toast", (d) => h("div", ["b-toast", d.err && "err"],
    d.err ? [h("span", "m", "▲"), " "] : d.dot ? [UI.dot.render(d.dot), " "] : null,
    d.text,
    d.action ? h("span", "end", act(h("span", "b-btn ghost", d.action.text), d.action.act)) : null));
})(typeof window !== "undefined" ? window : globalThis);
