// bise desktop window · the window (ds: components/window.html, window.css): win (frame), side
// (the sidebar: lights, rows, section heads, foot), row, sh, head. The 3-column layout and the
// scroll areas are amb-win's (win.css); this is the look. Load core.js and prim.js first.
(function (root) {
  "use strict";
  const UI = root.BiseUI;
  const { h, st, act, define } = UI.core;

  // {inactive, side: Element, main: Element, aside: Element}
  define("win", (d) => h("div", ["b-win", d.inactive && "is-inactive"], h("div", "cols", d.side, d.main, d.aside)));

  // a sidebar row. kind: "me" (bise, every project: pearl + name + sub), "pj" (a project), "ag" (an
  // agent under its project), "arch" (archived). {kind, name, sub, dot: {state, lg}, end, needs
  // (end in the accent: a count of what waits), on (the one in view), state, act}
  define("row", (d) => {
    const lead = d.kind === "me" ? UI.pearl.render({ size: 22 }) : d.dot ? UI.dot.render({ lg: d.kind === "pj", ...d.dot }) : null;
    const name = d.kind === "me" ? h("span", null, h("span", "nm", d.name), d.sub && h("span", "sub", d.sub)) : h("span", "nm", d.name);
    const end = d.end != null && d.end !== "" ? h("span", ["end", d.needs && "nd"], String(d.end)) : null;
    return act(h("div", ["b-row", d.kind, d.on && "on", ...st(d)], lead, name, end), d.act);
  });

  // {text}: a section head in the sidebar ("projects")
  define("sh", (d) => h("div", "b-sh", d.text));

  // {rows: [row data | {sh: text}], foot: {text, act}, lights: true}
  define("side", (d) => h("div", "b-side",
    d.lights !== false && h("div", "b-lights", h("i"), h("i"), h("i")),
    (d.rows || []).map((r) => (r.sh != null ? UI.sh.render({ text: r.sh }) : UI.row.render(r))),
    d.foot && act(h("div", "foot", d.foot.text), d.foot.act)));

  // the main column's head: {title, sub, pearl: size | dot: {state}, end: [Element]}
  define("head", (d) => h("div", "b-head",
    d.pearl ? UI.pearl.render({ size: d.pearl }) : d.dot ? UI.dot.render({ lg: true, ...d.dot }) : null,
    h("span", null, h("span", "t1", d.title), d.sub && h("span", "t2", d.sub)),
    d.end && d.end.length ? h("span", "end", d.end) : null));

  // {children: [Element]}: the main column (head, thread, composer go in it)
  define("main", (d) => h("div", "b-main", d.children));
})(typeof window !== "undefined" ? window : globalThis);
