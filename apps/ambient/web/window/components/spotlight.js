// bise desktop window · spotlight (ds: components/spotlight.html, spotlight.css). Load core.js and
// prim.js first.
(function (root) {
  "use strict";
  const UI = root.BiseUI;
  const { h, act, define } = UI.core;

  // {text (what he typed), placeholder, to ("to bise"), groups: [{title, rows: [row]}], rows (no
  // group head), keys}. A row: {lead: "bise" (the pearl) | dot state, name, where, what, key, on, act}
  define("spot", (d) => {
    const row = (r) => act(h("div", ["r", r.on && "on"],
      r.lead === "bise" ? UI.pearl.render({ size: 22 }) : UI.dot.render({ state: r.lead }),
      h("b", null, r.name), h("span", "pp", r.where || ""), h("span", "dm", r.what || ""), h("span", "ky", r.key || "")), r.act);
    const typed = d.text ? d.text : [h("span", "lo", d.placeholder || ""), h("span", "b-composer", h("span", "in", h("span", "cur")))];
    return h("div", "b-spot",
      h("div", "in", UI.pearl.render({ size: 40 }), h("span", "tx", typed), h("span", "to", d.to || "to bise")),
      (d.rows || []).map(row),
      (d.groups || []).map((g) => [h("div", "g", g.title), g.rows.map(row)]),
      d.keys ? h("div", "keys", d.keys) : null);
  });
})(typeof window !== "undefined" ? window : globalThis);
