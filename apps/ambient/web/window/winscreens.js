// bise desktop · draws the setup screens (winsetup.js's views) with amb-kit's components: the
// first launch (onb, group, check, fnkey, chip, btn), the settings (set, group, toggle, seg, menu)
// and the add-a-project sheet. It decides nothing: every click is a data-act winui.js feeds the
// model; the text fields (an API key, the sheet's path) report their words; a project's drag
// handle carries data-drag and its row data-order, winui.js turns a drop into ui_set_move.
(function (root) {
  "use strict";
  const doc = root.document;

  function make(UI) {
    const h = (...a) => UI.core.h(...a);
    const act = (el, a) => UI.core.act(el, a);
    // a button with its key as a tooltip (designer m_8408 8: esc / ⏎)
    const btn = (b) => { const el = UI.btn.render(b); if (b.tip) el.title = b.tip; return el; };

    // a menu button ('30 min ▾', '…') and, when open, the kit's menu under it with a backdrop
    // that closes it
    function menu(m) {
      const el = h("span", ["w-menu", m.open && "on"], act(UI.btn.render({ text: m.text, kind: "ghost" }), m.act));
      if (m.open) el.append(act(h("div", "w-menubg"), { ev: "ui_set_menu", id: null }), UI.menu.render({ items: m.items }));
      return el;
    }
    // a group's item's control: a state is a chip (✓ allowed, denied, ✓ signed in), a choice a
    // button, a menu or a segmented control; plus btns, kbd and a plain value
    function control(c) {
      if (!c) return null;
      // the seg's act carries its values; winui.js turns the part's index into the value
      if (c.seg) return UI.seg.render({ items: c.seg.items, on: c.seg.on, act: c.seg.act || null });
      if (c.menu) return menu(c.menu);
      if (c.chips) return h("span", "w-btns", c.chips.map(control));
      if (c.chip) return UI.chip.render(c.chip);
      if (c.btns) return h("span", "w-btns", c.btns.map(btn));
      if (c.kbd) return UI.kbd.render({ text: c.kbd });
      if (c.toggle) return UI.toggle.render(c.toggle);
      if (c.btn) return btn(c.btn);
      if (c.value != null) return h("span", "v", c.value);
      return null;
    }
    function handle(d) {
      const el = h("span", "w-drag", "⋮⋮");
      el.title = d.tip || "";
      el.setAttribute("draggable", "true");
      el.setAttribute("data-drag", JSON.stringify({ project: d.project }));
      return el;
    }
    function item(it) {
      const el = act(h("div", "b-gi",
        it.drag ? handle(it.drag) : null,
        it.check ? UI.check.render(it.check) : null,
        h("span", "l", it.label, it.sub ? h("span", null, it.sub) : null),
        it.key ? UI.kbd.render({ text: it.key }) : null,
        control(it.control)), it.act);
      if (it.drag) el.setAttribute("data-order", String(it.drag.order));
      return el;
    }
    const group = (g) => h("div", null, g.title ? h("div", "b-gt", g.title) : null, h("div", "b-group", (g.items || []).map(item)));
    // a text field with the DS field's look: the API key (password) or the sheet's path
    function field(cls, k, type) {
      const box = h("div", ["b-field", "is-focus", cls]);
      const input = doc.createElement("input");
      input.className = type === "password" ? "w-keyin" : "w-pathin";
      input.type = type;
      input.placeholder = k.ph;
      input.value = k.text || "";
      input.spellcheck = false;
      box.append(input);
      return box;
    }

    function onboarding(d) {
      const children = [
        ...(d.groups || []).map((g) => h("div", "w-onbgroup", group(g))),
        d.key ? field("w-keyfield", d.key, "password") : null,
        d.loading ? h("div", "w-onbgroup", UI.skel.render({}), UI.skel.render({})) : null,
        d.extra ? act(UI.btn.render({ text: d.extra.text, kind: "ghost" }), d.extra.act) : null,
        d.help ? UI.help.render({ text: d.help }) : null,
      ];
      const fn = d.fn ? act(UI.fnkey.render({ down: d.fn === "down" }), { ev: "ui_onb_fn" }) : null;
      // try fn: his words land under the key while he holds it, then stay once he let go
      const heard = d.fn ? h("div", ["w-heard", d.fn === "down" && "on"], d.heard || " ") : null;
      const el = UI.onb.render({ pearl: d.pearl, title: d.title, sub: d.sub, children: [children, fn, heard, d.hint ? h("div", ["w-hint", d.done && "ok"], d.hint) : null],
        cta: { ...d.cta, act: { ev: "ui_onb_next" } }, steps: d.steps, step: d.step });
      // the pearl's mood (listen while he holds fn, done after): winui's pearlsIn reads data-mood
      const p = el.querySelector && el.querySelector("[data-bise-pearl]");
      if (p && d.pearl && d.pearl !== true) p.setAttribute("data-mood", d.pearl);
      return h("div", "w-onb",
        h("div", "w-onbtop b-lights-pad",
          d.back ? act(UI.btn.render({ text: d.back, kind: "ghost" }), { ev: "ui_onb_back" }) : h("span"),
          d.skip ? act(h("span", "w-skip", d.skip), { ev: "ui_onb_skip" }) : h("span")),
        el);
    }

    function settings(d) {
      const nav = d.nav.map((r) => ({ ...r, dot: null }));
      const confirm = d.confirm ? h("div", "w-confirm", h("span", "l", d.confirm.text, h("span", null, d.confirm.keys)), btn(d.confirm.no), btn(d.confirm.yes)) : null;
      const children = [confirm, ...d.groups.map(group), d.key ? field("w-keyfield", d.key, "password") : null,
        d.add ? act(UI.btn.render({ text: d.add.text }), d.add.act) : null];
      const el = UI.set.render({ nav, title: d.title, sub: d.sub, children });
      const navEl = el.querySelector(".nav");
      navEl.prepend(h("div", "b-lights", h("i"), h("i"), h("i")), act(UI.btn.render({ text: d.back, kind: "ghost" }), { ev: "ui_back" }), h("div", "b-sh", d.navTitle));
      return h("div", "w-settings", el);
    }

    function sheet(d) {
      const path = h("div", "w-pathrow", field("w-pathfield", { text: d.path.text, ph: d.path.ph }, "text"), act(UI.btn.render({ text: d.path.choose.text }), d.path.choose.act));
      return h("div", "w-sheetbg", h("div", "w-sheet",
        h("div", "b-h", d.title), h("div", "b-sub", d.sub),
        path,
        d.items.length ? group({ title: d.foundTitle, items: d.items }) : null,
        group({ items: d.choices }),
        h("div", "w-btnrow", btn(d.cancel), btn(d.go))));
    }

    return { onboarding, settings, sheet };
  }

  root.AmbWinScreens = { make };
})(typeof window !== "undefined" ? window : globalThis);
