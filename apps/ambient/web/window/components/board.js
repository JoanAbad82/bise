// bise desktop window · the task board (ds: components/board.html, board.css): board, job.
// Load core.js and prim.js first.
(function (root) {
  "use strict";
  const UI = root.BiseUI;
  const { h, st, act, define } = UI.core;

  // a job's card. {state: "wk" | "nd" | "ok" | "er" | "" (idle) | "sched" | "loading", name, key
  // ("⌥1"), psi (true: it runs in its own worktree, ψ), end ("12 min" | "?" | "10:40" | "▲" |
  // "idle"), what (one line), pct (a known end) or ind (no known end; only while it works), on (in
  // view), state hover via states, act}
  define("job", (d) => {
    const lead = d.state === "loading" ? UI.skel.render({}) : d.state === "sched" ? UI.kbd.render({ text: "◷" }) : UI.dot.render({ state: d.state });
    const cls = ["b-task", d.state === "nd" && "nd", d.state === "ok" && "done", d.state === "er" && "er", d.on && "on", ...st({ states: d.states })];
    const bar = d.state === "wk" ? (d.pct != null ? UI.bar.render({ pct: d.pct }) : d.ind ? UI.bar.render({ state: "ind" }) : null) : null;
    return act(h("div", cls,
      h("div", "a", lead, " ", h("b", null, d.name || ""), " ", d.key ? UI.kbd.render({ text: d.key }) : null, d.psi ? " ψ" : null, h("span", "end", d.end || "")),
      h("div", "w", d.what || ""),
      bar), d.act);
  });

  // {jobs: [job data]}
  define("board", (d) => h("div", "b-board", (d.jobs || []).map((j) => UI.job.render(j))));
})(typeof window !== "undefined" ? window : globalThis);
