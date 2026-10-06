// bise desktop window · primitives (ds: components/prim.html, prim.css): btn, chip, kbd, seg,
// toggle, field, help, dot, pearl, bar, skel, empty, err. Load core.js first.
(function (root) {
  "use strict";
  const UI = root.BiseUI;
  const { h, st, act, define, step5 } = UI.core;

  // {text, kind: "pri" | "ghost" | "danger", state, act}
  define("btn", (d) => {
    const b = act(h("button", ["b-btn", d.kind, ...st(d)], d.text), d.act);
    if (d.state === "disabled") b.setAttribute("disabled", "");
    return b;
  });
  // {text, tone: "acc" | "err" | "ok"}
  define("chip", (d) => act(h("span", ["b-chip", d.tone], d.text), d.act));
  // {text}
  define("kbd", (d) => h("span", "b-kbd", d.text));
  // {items: [text], on: index, act}: each part's act is {...act, i}
  define("seg", (d) => h("span", "b-seg", (d.items || []).map((t, i) => act(h("span", i === d.on ? "on" : null, t), d.act ? { ...d.act, i } : null))));
  // {on, state, act}
  define("toggle", (d) => act(h("span", ["b-toggle", d.on && "on", ...st(d)], h("i")), d.act));
  // {value, placeholder, state: "focus" | "error", icon}
  define("field", (d) => h("div", ["b-field", ...st(d)], d.icon, d.value ? d.value : h("span", "ph", d.placeholder || "")));
  // {text, err}
  define("help", (d) => h("div", ["b-help", d.err && "err"], d.text));
  // {state: "wk" | "nd" | "ok" | "er" | "off", lg}
  define("dot", (d) => h("i", ["b-dot", d.state, d.lg && "lg"]));
  // {size: 22 | 40 | 56 | 120, mood}: bise's pearl (pearl-mount.js draws the live one into it)
  define("pearl", (d) => {
    const n = [22, 40, 56, 120].includes(d.size) ? d.size : 22;
    const p = h("span", ["b-pearl", "s" + n], ":*");
    p.setAttribute("data-bise-pearl", String(n));
    if (d.mood) p.setAttribute("data-mood", d.mood);
    return p;
  });
  // {pct, state: "ind" | "err" | "done"}: a known end shows its width in steps of 5
  define("bar", (d) => {
    const w = d.state === "ind" || d.pct == null ? null : "w" + step5(d.pct);
    return h("div", ["b-bar", d.state], h("i", w));
  });
  define("skel", () => h("span", "b-skel"));
  // {title, text}
  define("empty", (d) => h("div", "b-empty", h("b", null, d.title), d.text && h("span", null, d.text)));
  // {text}: an error line (▲ + what happened)
  define("err", (d) => h("div", "b-err", h("span", "m", "▲"), h("span", null, d.text)));
})(typeof window !== "undefined" ? window : globalThis);
