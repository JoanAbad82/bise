// bise desktop window · the components' core (stream S5, apps/ambient/web/ds is the reference).
//
//   BiseUI.<name>(data, on) -> Element
//
// Every component is a pure render: plain JSON in (what amb-win's view returns, states included:
// on, picked, sel, state "hover" | "focus" | "active" | "disabled" | "loading" | "error"), one
// element out, with the design system's own class names and markup (ds.css, components/*.html).
// No component keeps state. A clickable part carries its data's `act` as data-act (JSON); the
// root's one listener calls on(act) with that object. Re-render to show a new state.
// No framework, no build: plain scripts, UMD like the capsule's (window.BiseUI, or module.exports
// for the node checks, which hand in a fake document with BiseUI.use(doc)).
(function (root) {
  "use strict";
  const UI = root.BiseUI || (root.BiseUI = {});
  let docRef = root.document || null;
  UI.use = (doc) => { docRef = doc; };
  const doc = () => docRef;

  // h(tag, cls, ...kids): an element; kids are nodes, strings, numbers or arrays; null/false skipped
  function h(tag, cls, ...kids) {
    const el = doc().createElement(tag);
    if (cls) el.className = Array.isArray(cls) ? cls.filter(Boolean).join(" ") : cls;
    add(el, kids);
    return el;
  }
  function add(el, kids) {
    for (const k of kids) {
      if (k == null || k === false || k === "") continue;
      if (Array.isArray(k)) add(el, k);
      else if (typeof k === "string" || typeof k === "number") el.append(doc().createTextNode(String(k)));
      else el.append(k);
    }
    return el;
  }
  // the state classes a part takes: state "hover" -> is-hover (the reference shows states without
  // a mouse), plus a list in `states`
  const STATES = ["hover", "focus", "active", "disabled", "loading", "error", "inactive", "streaming"];
  function st(d) {
    const out = [];
    for (const s of [d && d.state, ...((d && d.states) || [])]) if (s && STATES.includes(s)) out.push("is-" + s);
    return out;
  }
  // a clickable part: its act as data-act
  function act(el, a) {
    if (a != null) el.setAttribute("data-act", JSON.stringify(a));
    return el;
  }
  // the root's one listener: a click on a part with data-act (not disabled) calls on(act)
  function wire(el, on) {
    if (typeof on !== "function") return el;
    el.addEventListener("click", (e) => {
      let t = e.target;
      while (t && t !== el.parentNode) {
        if (t.getAttribute && t.getAttribute("data-act") != null) {
          const cls = String(t.className || "");
          if (cls.includes("is-disabled") || t.getAttribute("disabled") != null) return;
          on(JSON.parse(t.getAttribute("data-act")));
          return;
        }
        if (t === el) return;
        t = t.parentNode;
      }
    });
    return el;
  }
  // a component: render(data) wired to on
  function define(name, render) {
    UI[name] = (data, on) => wire(render(data || {}), on);
    UI[name].render = render;
    return UI[name];
  }
  // a width in the bar's steps of 5 (ds: .b-bar > i.w5 … w100)
  const step5 = (pct) => Math.max(0, Math.min(100, Math.round((Number(pct) || 0) / 5) * 5));

  UI.core = { h, add, st, act, wire, define, step5, doc };
  if (typeof module !== "undefined" && module.exports) module.exports = UI;
})(typeof window !== "undefined" ? window : globalThis);
