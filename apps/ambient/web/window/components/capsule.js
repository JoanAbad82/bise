// bise desktop window · the fn capsule (ds: components/capsule.html, capsule.css): capsule, wave,
// shot, edge. Load core.js and prim.js first.
(function (root) {
  "use strict";
  const UI = root.BiseUI;
  const { h, define } = UI.core;

  // {off}: the voice's five bars
  define("wave", (d) => h("span", ["b-wave", d.off && "off"], h("i"), h("i"), h("i"), h("i"), h("i")));
  // {thumb (Element)}: a screen capture's thumb
  define("shot", (d) => h("span", "b-shot", d.thumb));

  // the capsule. {lead: "pearl" | "off" (no network: a dim dot), words: [part], typing (the cursor),
  // wave: "on" | "off", shot (true or an Element: the capture it attaches), chips: [chip data],
  // countdown (the route's drain bar), hint ("release fn to send   fn esc cancel")}. A words part is
  // a string, {lo: text} (quieter), {b: text} (a name) or {br: true} (a line break).
  define("capsule", (d) => {
    const words = h("div", "wd", (d.words || []).map((p) =>
      typeof p === "string" ? p : p.br ? h("br") : p.lo != null ? h("span", "lo", p.lo) : p.b != null ? h("b", null, p.b) : null), d.typing ? h("span", "cur") : null);
    const lead = d.lead === "off" ? UI.dot.render({ state: "off", lg: true }) : UI.pearl.render({ size: 56, mood: d.mood });
    const shot = d.shot ? UI.shot.render({ thumb: d.shot === true ? null : d.shot }) : null;
    const r2 = d.chips && d.chips.length ? h("div", "r2", d.shotBelow ? shot : null, d.chips.map((c) => UI.chip.render(c))) : null;
    return h("div", "b-capsule",
      h("div", "r1", lead, words, d.wave ? UI.wave.render({ off: d.wave === "off" }) : null, !d.shotBelow ? shot : null),
      r2,
      d.countdown ? h("div", "cd", h("i")) : null,
      d.hint ? h("div", "hint", d.hint) : null);
  });

  // {children: [Element]}: the screen's edge while fn listens
  define("edge", (d) => h("div", "b-edge", d.children));
})(typeof window !== "undefined" ? window : globalThis);
