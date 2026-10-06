// bise desktop · draws the setup screens (winsetup.js's views) with amb-kit's components: the
// first launch (onb, group, check, fnkey, btn), the settings (set, group, toggle, seg) and the
// add-a-project sheet. It decides nothing: every click is a data-act winui.js feeds the model;
// the two text fields (an API key) report their words as ui_key_type.
(function (root) {
  "use strict";
  const doc = root.document;

  function make(UI) {
    const h = (...a) => UI.core.h(...a);
    const act = (el, a) => UI.core.act(el, a);

    // a group's item's control: the kit's (toggle, btn, chip, field, value) plus seg, btns and kbd,
    // drawn with the DS's own markup (b-group, b-gi)
    function control(c) {
      if (!c) return null;
      // the seg's act carries its values; winui.js turns the part's index into the value
      if (c.seg) return UI.seg.render({ items: c.seg.items, on: c.seg.on, act: c.seg.act || null });
      if (c.btns) return h("span", "w-btns", c.btns.map((b) => UI.btn.render(b)));
      if (c.kbd) return UI.kbd.render({ text: c.kbd });
      if (c.toggle) return UI.toggle.render(c.toggle);
      if (c.btn) return UI.btn.render(c.btn);
      if (c.value != null) return h("span", "v", c.value);
      return null;
    }
    const group = (g) => h("div", null,
      g.title ? h("div", "b-gt", g.title) : null,
      h("div", "b-group", (g.items || []).map((it) => act(h("div", "b-gi",
        it.check ? UI.check.render(it.check) : null,
        h("span", "l", it.label, it.sub ? h("span", null, it.sub) : null),
        it.key ? UI.kbd.render({ text: it.key }) : null,
        control(it.control)), it.act))));
    // an API key's field: a real input with the DS field's look
    function keyField(k) {
      const box = h("div", "b-field is-focus w-keyfield");
      const input = doc.createElement("input");
      input.className = "w-keyin";
      input.type = "password";
      input.placeholder = k.ph;
      input.value = k.text || "";
      input.setAttribute("data-type", "ui_key_type");
      box.append(input);
      return box;
    }

    function onboarding(d) {
      const children = [
        ...(d.groups || []).map((g) => h("div", "w-onbgroup", group(g))),
        d.key ? keyField(d.key) : null,
        d.loading ? h("div", "w-onbgroup", UI.skel.render({}), UI.skel.render({})) : null,
        d.extra ? act(UI.btn.render({ text: d.extra.text, kind: "ghost" }), d.extra.act) : null,
        d.help ? UI.help.render({ text: d.help }) : null,
      ];
      const fn = d.fn ? act(UI.fnkey.render({ down: d.fn === "down" }), { ev: "ui_onb_fn" }) : null;
      const el = UI.onb.render({ pearl: d.pearl, title: d.title, sub: d.sub, children: [children, fn, d.hint ? h("div", "w-hint", d.hint) : null],
        cta: { ...d.cta, act: { ev: "ui_onb_next" } }, steps: d.steps, step: d.step });
      return h("div", "w-onb",
        h("div", "w-onbtop b-lights-pad",
          d.back ? act(UI.btn.render({ text: "← back", kind: "ghost" }), { ev: "ui_onb_back" }) : h("span"),
          d.skip ? act(UI.btn.render({ text: d.skip, kind: "ghost" }), { ev: "ui_onb_skip" }) : h("span")),
        el);
    }

    function settings(d) {
      const nav = d.nav.map((r) => ({ ...r, dot: null }));
      const children = [...d.groups.map(group), d.key ? keyField(d.key) : null, d.add ? act(UI.btn.render({ text: d.add.text }), d.add.act) : null];
      const el = UI.set.render({ nav, title: d.title, sub: d.sub, children });
      const navEl = el.querySelector(".nav");
      navEl.prepend(h("div", "b-lights", h("i"), h("i"), h("i")), act(UI.btn.render({ text: "← back", kind: "ghost" }), { ev: "ui_back" }), h("div", "b-sh", "settings"));
      return h("div", "w-settings", el);
    }

    function sheet(d) {
      const drop = act(h("div", ["w-dz", d.picked && "on"], d.drop), d.dropAct);
      return h("div", "w-sheetbg", h("div", "w-sheet",
        h("div", "b-h", d.title), h("div", "b-sub", d.sub),
        drop,
        d.items.length ? group({ title: "found in your folder", items: d.items }) : null,
        group({ items: d.choices }),
        h("div", "w-btnrow", UI.btn.render(d.cancel), UI.btn.render(d.go))));
    }

    return { onboarding, settings, sheet };
  }

  root.AmbWinScreens = { make };
})(typeof window !== "undefined" ? window : globalThis);
