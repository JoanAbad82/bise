// bise desktop window · cards (ds: components/cards.html, cards.css): what bise asks or tells him
// outside the window. Load core.js, prim.js, thread.js and composer.js first (art, opts).
(function (root) {
  "use strict";
  const UI = root.BiseUI;
  const { h, define } = UI.core;

  // {plain (no accent ring: a report, not a question), lead: "bise" | dot state, who ("telemetry ·
  // alerts"), rest (" needs you"), k (when, "1 of 2"), q, opts: [option], art: art data, keys,
  // stacked (more cards behind it)}
  define("card", (d) => {
    const lead = !d.lead || d.lead === "bise" ? UI.pearl.render({ size: 22 }) : UI.dot.render({ state: d.lead, lg: true });
    const card = h("div", ["b-card", d.plain && "plain"],
      h("div", "h", lead, h("b", null, d.who), d.rest || "", d.k ? h("span", "k", d.k) : null),
      h("div", "q", d.q),
      d.opts && d.opts.length ? UI.opts.render({ items: d.opts }) : null,
      d.art ? UI.art.render(d.art) : null,
      d.keys ? h("div", "keys", d.keys) : null);
    return d.stacked ? h("div", null, card, h("div", "b-stackback")) : card;
  });
})(typeof window !== "undefined" ? window : globalThis);
