// bise desktop window · settings and onboarding (ds: components/settings.html, onboarding.html;
// settings.css, onboarding.css): group, set (the settings page frame), check, onb, fnkey. Load
// core.js and prim.js first.
(function (root) {
  "use strict";
  const UI = root.BiseUI;
  const { h, act, define } = UI.core;

  // a group's item's control: {toggle: toggle data} | {btn: btn data} | {chip: chip data} |
  // {field: field data} | {value: text}
  const control = (c) => (!c ? null : c.toggle ? UI.toggle.render(c.toggle) : c.btn ? UI.btn.render(c.btn) : c.chip ? UI.chip.render(c.chip)
    : c.field ? UI.field.render(c.field) : c.value != null ? h("span", "v", c.value) : null);

  // {title (the small head above it), items: [{label, sub, check: {on} (a checkbox before the label),
  // control, act}], help: help data (under the group)}
  define("group", (d) => h("div", null,
    d.title ? h("div", "b-gt", d.title) : null,
    h("div", "b-group", (d.items || []).map((it) => act(h("div", "b-gi",
      h("span", "l", it.check ? [UI.check.render(it.check), " "] : null, it.label, it.sub ? h("span", null, it.sub) : null),
      control(it.control)), it.act))),
    d.help ? UI.help.render(d.help) : null));

  // {on, act}: a checkbox
  define("check", (d) => act(h("span", ["b-check", d.on && "on"], d.on ? "✓" : ""), d.act));

  // the settings page: {nav: [row data], title, sub, children: [Element] (its groups)}
  define("set", (d) => h("div", "b-set",
    h("div", "nav", (d.nav || []).map((r) => UI.row.render(r))),
    h("div", "pg", h("div", "b-h", d.title), d.sub ? h("div", "b-sub", d.sub) : null, d.children)));

  // an onboarding step: {pearl (true, or {mood}: the 120 px pearl), title, sub, children: [Element],
  // cta: btn data, fn: "up" | "down" (the fn key), steps: n, step: i}
  define("onb", (d) => h("div", "b-onb",
    d.pearl ? UI.pearl.render({ size: 120, mood: typeof d.pearl === "object" ? d.pearl.mood : undefined }) : null,
    h("div", "t", d.title),
    d.sub ? h("div", "s", d.sub) : null,
    d.children,
    d.fn ? UI.fnkey.render({ down: d.fn === "down" }) : null,
    d.cta ? UI.btn.render(d.cta) : null,
    d.steps ? h("div", "steps", Array.from({ length: d.steps }, (_, i) => h("i", i === d.step ? "on" : null))) : null));

  // {down}: the fn key drawn as a key
  define("fnkey", (d) => h("span", ["b-fn", d.down && "down"], "fn"));
})(typeof window !== "undefined" ? window : globalThis);
