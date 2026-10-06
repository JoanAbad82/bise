// bise desktop window · the composer and the dock above it (ds: components/composer.html,
// composer.css): composer, quote, dock, opts, tabs. The text input itself is the screen's (amb-win):
// it hands its element in as `input`; without one the composer shows the reference's words.
// Load core.js and prim.js first.
(function (root) {
  "use strict";
  const UI = root.BiseUI;
  const { h, st, act, define } = UI.core;

  // {text}: a quote from selected lines, "❝ 1 “workers: [Worker; 4],”  decode_pool.rs:13-14 · 2 lines"
  define("quote", (d) => act(h("div", "b-quote", "❝ " + d.text), d.act));

  // the options: [{n, text, on (the keyboard's), picked, state, act}], typeHint ("or type your answer below")
  define("opts", (d) => h("div", "b-opts",
    (d.items || []).map((o) => act(h("span", ["b-opt", o.on && "on", o.picked && "picked", ...st(o)], h("b", null, String(o.n)), o.text), o.act)),
    d.typeHint ? h("span", "b-opt ty", d.typeHint) : null));

  // what waits above the composer, one at a time: {kind: "" | "plain" | "err", head ("? search needs
  // you"), keys ("1 of 3   ← →   esc back"), q (the question), opts: [option], typeHint}
  define("dock", (d) => h("div", ["b-dock", d.kind],
    h("div", "h", d.head, d.keys ? h("span", "k", d.keys) : null),
    h("div", "q", d.q),
    d.opts && d.opts.length ? UI.opts.render({ items: d.opts, typeHint: d.typeHint }) : null));

  // the inbox's tabs above the dock: {items: [{text, dot: {state}, on, act}]}
  define("tabs", (d) => h("div", "b-tabs", (d.items || []).map((t) => act(h("span", t.on ? "on" : null, t.dot ? [UI.dot.render(t.dot), " "] : null, t.text), t.act))));

  // the composer: {to ("you → bise · opus · high"), text, placeholder, focus, send: "on" | "off" |
  // "stop", sendAct, disabled, keys ("@ file   $ skills   / commands   ⌘I inbox"), quote: {text},
  // dock: dock data, tabs: tabs data, input (Element: the screen's own editable)}
  define("composer", (d) => {
    const typed = d.input ? d.input : [d.text ? d.text : h("span", "ph", d.placeholder || ""), d.focus ? h("span", "cur") : null];
    const send = act(h("span", ["send", d.send === "stop" ? "stop" : d.send === "on" ? null : "off"], d.send === "stop" ? "■" : "↑"), d.sendAct);
    return h("div", ["b-composer", d.disabled && "is-disabled"],
      d.tabs ? UI.tabs.render(d.tabs) : null,
      d.dock ? UI.dock.render(d.dock) : null,
      d.quote ? UI.quote.render(d.quote) : null,
      h("div", "div", d.to),
      h("div", ["box", d.focus && "is-focus"], h("div", "in", typed), send),
      d.keys ? h("div", "keys", d.keys) : null);
  });
})(typeof window !== "undefined" ? window : globalThis);
