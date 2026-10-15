// bise kit · a plan an agent proposes (plan-ok, Gabriel's pick A): the plan block and its other ways.
// The plan: its parts in order (an optional one says so), one ink start (its data-do), which becomes
// 'starting…' from the click and '∿ lean-install is on 2 · started 11:42' once the agent marks it
// (data-started, data-done on its parts; '✓ done 12:10' once all are); never approve or skip per part (a change is typed). Its
// other ways (a compare data-for="<plan>"): 'other ways' above, 'start this one' each; once anything
// is started the other starts go.
//
// Two halves, like notes-fold.js: `BisePlan.core` is pure (node checks run it), `decorate` and
// `act` touch the DOM. It draws itself: at load and on each bise:swapped (kit.js's in-place swap),
// and its buttons carry data-plan-act (never kit.js's data-act: a start is no approve or skip). A
// start is a bise:start {block, item, text} event: notes.js sends it at once; the hub sends it to
// the plan's agent, read from the stored page (never from here). Loaded after kit.js.
(function (root) {
  "use strict";

  // ---- the words (designer's spec for pick A, m_26765)
  const PW = {
    startPlan: "start the plan",
    startWay: "start this one",
    starting: "starting…",
    otherWays: "other ways",
    optional: "optional",
  };
  // an agent's name as the page writes it (its kicker, its routing): the real name, hyphen kept; main is bise
  const said = (agent) => (agent === "main" ? "bise" : String(agent || ""));

  // the started line: '∿ <agent> is on 2 · started 11:42' (the working mark: a plan started is not
  // done), '✓ done 12:10' once every part is (the time: the last part's data-done="12:10", if any)
  function startedLine(at, agent, done) {
    const on = done.findIndex((d) => d == null);
    if (on < 0 && done.length) {
      const last = done[done.length - 1];
      return { mark: "✓", state: "done", line: last ? `done ${last}` : "done" };
    }
    return { mark: "∿", state: "working", line: `${said(agent)} is on ${on < 0 ? 1 : on + 1} · started ${at}` };
  }
  // what a plan's bar shows: its line once started, else its start (disabled while starting)
  function planBar(p) {
    if (p.started != null) return startedLine(p.started, p.agent, p.done);
    return { button: p.starting ? PW.starting : p.todo || PW.startPlan, disabled: !!p.starting };
  }
  // what an other way shows: its started line, its start, or nothing once another one started
  function wayBar(w, any, agent) {
    if (w.started != null) return { mark: "∿", state: "working", line: `${said(agent)} is on it · started ${w.started}` };
    if (w.starting) return { button: PW.starting, disabled: true };
    return any ? {} : { button: PW.startWay, disabled: false };
  }
  const core = { PW, said, startedLine, planBar, wayBar };

  // ---- the DOM
  const kids = (el) => Array.from(el.children || []);
  const ui = (el) => el.getAttribute && el.getAttribute("data-kit-ui") != null;
  const has = (el, a) => el.getAttribute(a) != null;
  const items = (block) => kids(block).filter((c) => /^(ol|ul)$/i.test(c.tagName)).flatMap(kids).filter((li) => has(li, "data-id"));
  function own(doc, el, attr, tag, first) {
    let x = kids(el).find((c) => ui(c) && has(c, attr));
    if (!x) {
      x = doc.createElement(tag);
      x.setAttribute("data-kit-ui", "");
      x.setAttribute(attr, "");
      if (first) el.insertBefore(x, kids(el)[0] || null); else el.append(x);
    }
    return x;
  }
  function fill(doc, bar, what, act) {
    for (const c of kids(bar)) bar.removeChild(c);
    if (what.line) {
      const s = doc.createElement("span");
      s.setAttribute("data-started-line", what.state);
      const m = doc.createElement("span");
      m.setAttribute("data-mark", "");
      m.textContent = what.mark;
      const w = doc.createElement("span");
      w.textContent = ` ${what.line}`;
      s.append(m, w);
      bar.append(s);
    } else if (what.button) {
      const b = doc.createElement("button");
      b.setAttribute("type", "button");
      b.setAttribute("data-plan-act", act);
      b.textContent = what.button;
      if (what.disabled) b.setAttribute("disabled", "");
      bar.append(b);
    }
  }
  function tag(doc, li, words) {
    let t = kids(li).find((c) => ui(c) && has(c, "data-when"));
    if (!words) { if (t) li.removeChild(t); return; }
    if (!t) { t = doc.createElement("span"); t.setAttribute("data-kit-ui", ""); t.setAttribute("data-when", ""); li.append(t); }
    t.textContent = words;
  }
  // the plan block, or a compare of its other ways (`plan`: that compare's plan block, if any)
  function decorate(doc, block, plan) {
    if (block.getAttribute("data-kit") === "plan") {
      for (const li of items(block)) tag(doc, li, has(li, "data-optional") ? PW.optional : "");
      fill(doc, own(doc, block, "data-plan-go", "p"), planBar({
        started: block.getAttribute("data-started"), starting: has(block, "data-starting"), agent: block.getAttribute("data-agent"),
        todo: block.getAttribute("data-do"), done: items(block).map((li) => li.getAttribute("data-done")),
      }), "start-plan");
      return;
    }
    if (block.getAttribute("data-kit") !== "compare" || !block.getAttribute("data-for")) return;
    own(doc, block, "data-ways", "p", true).textContent = PW.otherWays;
    const any = (plan && (has(plan, "data-started") || has(plan, "data-starting"))) || items(block).some((li) => has(li, "data-started") || has(li, "data-starting"));
    const agent = plan && plan.getAttribute("data-agent");
    for (const li of items(block)) {
      const what = wayBar({ started: li.getAttribute("data-started"), starting: has(li, "data-starting") }, any, agent);
      const go = own(doc, li, "data-way-go", "span");
      fill(doc, go, what, "start-way");
      // nothing left to show (another one started): no empty bar, the card shrinks to its text
      if (what.line || what.button) go.removeAttribute("hidden"); else go.setAttribute("hidden", "");
    }
  }
  // the page's plan blocks and their ways, drawn
  function draw(doc, main) {
    const blocks = kids(main).filter((b) => has(b, "data-kit") && has(b, "data-id"));
    const planOf = (id) => blocks.find((b) => b.getAttribute("data-kit") === "plan" && b.getAttribute("data-id") === id);
    for (const b of blocks) decorate(doc, b, planOf(b.getAttribute("data-for")));
  }
  // a start clicked: starting…, one bise:start, drawn again; false: not a start of ours
  function act(doc, main, btn) {
    const kind = btn.getAttribute("data-plan-act");
    const block = btn.closest("[data-kit][data-id]");
    if (!block || (kind !== "start-plan" && kind !== "start-way")) return false;
    const li = kind === "start-way" ? btn.closest("li[data-id]") : null;
    const at = li || block;
    if (has(at, "data-starting") || has(at, "data-started")) return true;
    at.setAttribute("data-starting", "");
    doc.dispatchEvent(new root.CustomEvent("bise:start", { detail: { block: block.getAttribute("data-id"), item: li ? li.getAttribute("data-id") : null, text: btn.textContent } }));
    draw(doc, main);
    return true;
  }

  root.BisePlan = { core, decorate, draw, act };

  // ---- the browser: draw at load and after each swap; our buttons' clicks
  const doc = root.document;
  if (!doc || !doc.addEventListener || !doc.getElementById) return;
  function start() {
    const main = doc.getElementById("bise-page");
    if (!main) return;
    draw(doc, main);
    doc.addEventListener("bise:swapped", () => draw(doc, main));
    main.addEventListener("click", (e) => {
      const btn = e.target.closest && e.target.closest("[data-plan-act]");
      if (btn && act(doc, main, btn)) e.preventDefault();
    });
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start); else start();
})(typeof window !== "undefined" ? window : globalThis);
