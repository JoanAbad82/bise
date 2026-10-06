// bise desktop window · the thread (ds: components/thread.html, thread.css): thread, msg, tool,
// fold, answered, marker, route, art, diff, quotepop. Load core.js and prim.js first.
(function (root) {
  "use strict";
  const UI = root.BiseUI;
  const { h, st, act, define } = UI.core;

  // a message's text: plain words, `code` between backticks; never HTML from data
  function text(s) {
    return String(s == null ? "" : s).split(/(`[^`]*`)/).map((p) => (p.length > 1 && p[0] === "`" && p[p.length - 1] === "`" ? h("code", null, p.slice(1, -1)) : p));
  }

  // {children: [Element]}: the thread column
  define("thread", (d) => h("div", "b-thread", d.children));

  // a message. {from: "you" | "bise" | "agent", name, time, via ("by voice, from Chrome"), text,
  // av ("G": your initial; bise gets the pearl, an agent its dot), dot: {state} (an agent's), in
  // (indented: an agent's message to another), chips: [chip data] (the context it came with), shot
  // (Element: a screenshot thumb), state: "streaming" | "error", children: [Element] (tool, route,
  // art, diff under the words)}
  define("msg", (d) => {
    const av = h("div", "b-av", d.from === "bise" ? UI.pearl.render({ size: 22 }) : d.dot ? UI.dot.render({ lg: true, ...d.dot }) : d.av || "");
    const who = h("div", "b-who", h("b", null, d.name || d.from), [d.time, d.via].filter(Boolean).join(" · "));
    const words = h("div", "b-text", d.state === "error" ? h("span", null, text(d.text)) : text(d.text));
    const ctx = (d.chips && d.chips.length) || d.shot ? h("div", "b-who", d.shot, (d.chips || []).map((c) => [" ", UI.chip.render(c)])) : null;
    return h("div", ["b-msg", d.from === "you" && "you", d.in && "in", ...st(d)], av, h("div", null, who, ctx, words, d.children));
  });

  // folded work: {text, state: "open" | "run" | "err", out (the output, shown when open), act}
  define("tool", (d) => {
    const head = act(h("div", ["b-tool", d.state], h("span", "chev", "▸"), h("span", d.state === "err" ? null : "lbl", d.state === "err" ? "▲ " + d.text : d.text)), d.act);
    if (d.state === "open" && d.out != null) return h("div", null, head, h("div", "b-out", d.out));
    if (d.state === "run") return h("div", null, head, UI.bar.render({ state: "ind" }));
    return head;
  });

  // {text, act}: "▸ 4 messages between 2 agents"
  define("fold", (d) => act(h("div", "b-fold", "▸ " + d.text), d.act));
  // {text, act}: what main answered for you
  define("answered", (d) => act(h("div", "b-answered", d.text), d.act));
  // {text}: "? search asked you · it waits above the composer"
  define("marker", (d) => h("div", "b-marker", d.text));

  // a delegation line: {state: "wk" | "ok" | "er", p1 ("telemetry · main → alerts"), p2 (what), p3
  // (when), pct (a known end: the bar), act}
  define("route", (d) => act(h("div", "b-route",
    UI.dot.render({ state: d.state }),
    h("span", null, h("span", "p1", d.p1), " ", h("span", "p2", d.p2)),
    h("span", "p3", d.p3),
    d.state === "wk" ? UI.bar.render(d.pct == null ? { state: "ind" } : { pct: d.pct }) : null), d.act));

  // an artifact: {title ("↗ flash sale replay"), meta ("stock · 10:40"), isNew, thumb (Element), state, act}
  define("art", (d) => act(h("div", ["b-art", ...st(d)],
    h("span", "th", d.thumb),
    h("span", null, h("span", "an", d.title), d.isNew ? [" ", UI.chip.render({ text: "new", tone: "acc" })] : null, h("span", "am", d.meta))), d.act));

  // a diff: {file, add, rm, lines: [{old, new, sign: "+" | "-" | "", text, sel, act}]}; a selected
  // line (sel) is the reference's picked line (.pk), the quote pop follows it ({pop: text})
  define("diff", (d) => h("div", "b-diff",
    h("div", "fh", d.file, d.add ? [" ", h("span", "ok", "+" + d.add)] : null, d.rm ? [" ", h("span", "er", "−" + d.rm)] : null),
    (d.lines || []).map((l) => act(h("div", ["b-dl", l.sign === "+" && "ad", l.sign === "-" && "rm", l.sel && "pk"],
      h("i", null, l.old == null ? "" : String(l.old)), h("i", null, l.new == null ? "" : String(l.new)), h("i", null, l.sign || ""), l.text), l.act)),
    d.pop ? h("div", "b-quotepop", d.pop) : null));
})(typeof window !== "undefined" ? window : globalThis);
