// bise kit · a page's asks linked to their notifications (notif-artifact, designer m_26560).
// A question block or a drawn pick (`k-pick` in a ui block) whose notification waits in the inbox
// says `? waits in your inbox · 1–4 there, or pick here` above its options; a pick on the page then
// answers it through the hub's answer route, so the notification leaves the inbox. Answered, in the
// inbox or on the page, it says `✓ you picked A in the inbox · 11:42`, its option marked `your
// pick` (no more picks). One answer closes both.
//
// Two halves, like notes-fold.js: `BiseAsk.core` is pure (kit/ask.check.ts runs it), the rest is
// the DOM. Loaded before kit.js. The asks come from the page's meta (`asks`) at load and after each
// new version (kit.js's bise:swapped), then from the stream: kit.js relays its `asks` and
// `answered` events as bise:asks and bise:hub-answered. kit.js asks `takes()` before a pick on a
// drawn pick goes as a note.
(function (root: typeof globalThis) {
  "use strict";

  // ---- the words (designer m_26560)
  const AW = {
    waits: (n: number) => `? waits in your inbox · ${n === 1 ? "1" : n === 2 ? "1 2" : `1–${n}`} there, or pick here`,
    picked: (what: string, via: string | null | undefined, clock: string) => `✓ you picked ${what}${via === "inbox" ? " in the inbox" : ""}${clock ? ` · ${clock}` : ""}`,
    yours: "your pick",
  };

  // ---- pure: an ask is {block, open} while its notification waits in the inbox, else
  // {block, reply, n, key, via, at_ms}; the line it says (count: the options on its card, else the
// block's), or null
  const clockOf = (ms: number | undefined) => {
    if (!ms) return "";
    const d = new Date(ms);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };
  function line(a: Ask | null | undefined, count: number) {
    if (!a) return null;
    if (a.reply != null) return AW.picked(a.key ? String(a.key).toUpperCase() : String(a.reply), a.via, clockOf(a.at_ms));
    return a.open ? AW.waits(a.count || count) : null;
  }
  const core = { AW, clockOf, line };

  // ---- the DOM
  const listOf = (block: Element) => {
    const l = Array.from(block.children).find((c) => /^(ol|ul)$/i.test(c.tagName));
    return l ? Array.from(l.children).filter((c) => /^li$/i.test(c.tagName)) : [];
  };
  // its line above the options, the answer's option marked (a pick: `your pick`), answered blocks
  // take no more picks (data-answer); a question's own marks are kit.js's (BiseKit.answered)
  // (a is there whenever it says words: line() of nothing says none)
  function draw(doc: Document, block: Element, a: Ask | null | undefined) {
    for (const old of block.querySelectorAll(".k-ask[data-kit-ui], .k-mark[data-yours]")) old.remove();
    const pickEl = block.querySelector('[data-ui="pick"]');
    const opts = pickEl ? Array.from(pickEl.querySelectorAll("[data-pick]")) : listOf(block);
    const words = line(a, opts.length);
    if (a && a.open && a.reply == null) block.setAttribute("data-asks", ""); else block.removeAttribute("data-asks");
    if (!words) return;
    const p = doc.createElement("p");
    p.className = "k-ask";
    p.setAttribute("data-kit-ui", "");
    if (a!.reply != null) {
      // a decision taken: the done ✓ in the accent, its words in text-2
      p.setAttribute("data-done", "");
      const mark = doc.createElement("span");
      mark.className = "k-ask-mark";
      mark.textContent = "✓";
      p.append(mark, doc.createTextNode(words.replace(/^✓/, "")));
    } else p.textContent = words;
    if (pickEl) pickEl.parentNode!.insertBefore(p, pickEl);
    else block.insertBefore(p, block.firstChild);
    const ans = a!;
    if (ans.reply == null) return;
    if (!pickEl) {
      if (block.getAttribute("data-answer") == null && root.BiseKit) root.BiseKit.answered(doc, block, ans.reply);
      return;
    }
    block.setAttribute("data-answer", String(ans.reply));
    const hit = ans.key != null ? opts.find((o) => o.getAttribute("data-pick") === String(ans.key)) : opts[(ans.n || 0) - 1];
    for (const o of opts) {
      if (o === hit) o.setAttribute("data-verdict", "pick"); else o.removeAttribute("data-verdict");
      o.setAttribute("aria-pressed", String(o === hit));
    }
    if (!hit) return;
    const m = doc.createElement("span");
    m.className = "k-mark";
    m.setAttribute("data-kit-ui", "");
    m.setAttribute("data-yours", "");
    m.textContent = AW.yours;
    hit.insertBefore(m, hit.firstChild);
  }

  let page: { id: string; token: string; route: boolean } | null = null;
  // kit.js's pick on a drawn pick: true when this took it (answered: nothing; its notification
  // waits: the hub's answer route, a pick note when that fails), false: kit.js sends its note
  function takes(doc: Document, block: Element, opt: Element, note: () => AskNote) {
    if (block.getAttribute("data-answer") != null) return true;
    if (!page || !block.hasAttribute("data-asks")) return false;
    const n = Array.from(block.querySelectorAll("[data-pick]")).indexOf(opt) + 1;
    const d = note();
    const asNote = () => doc.dispatchEvent(new root.CustomEvent("bise:react", { detail: d }));
    if (!page.route || d.kind == null) { asNote(); return true; }
    root.fetch(`/api/p/${page.id}/answer`, { method: "POST", headers: { "Content-Type": "application/json", "X-Bise-Token": page.token }, body: JSON.stringify({ block: d.block, option: n }) })
      .then((r) => { if (r.status === 404) page!.route = false; if (!r.ok) asNote(); })
      .catch(asNote);
    return true;
  }

  function attach(doc: Document, main: HTMLElement) {
    const id = main.dataset.page;
    if (!id) return;
    page = { id, token: (doc.querySelector<HTMLMetaElement>('meta[name="bise-token"]') || { content: "" }).content, route: true };
    const asks = new Map<string | undefined, Ask>();
    const blocks = () => Array.from(main.children as HTMLCollectionOf<HTMLElement>).filter((b) => b.dataset && (b.dataset.kit === "question" || b.dataset.kit === "ui"));
    const paint = () => { for (const b of blocks()) if (asks.has(b.dataset.id)) draw(doc, b, asks.get(b.dataset.id)); };
    const take = (list: unknown) => {
      if (!Array.isArray(list)) return;
      asks.clear();
      for (const a of list as (Ask | null)[]) if (a && a.block) asks.set(String(a.block), a);
      paint();
    };
    const load = () => root.fetch(`/p/${id}/meta`, { cache: "no-store" }).then((r) => (r.ok ? r.json() as Promise<{ asks?: unknown } | null> : null)).then((m) => take(m && m.asks)).catch(() => {});
    load();
    doc.addEventListener("bise:swapped", load);
    doc.addEventListener("bise:asks", (e) => take(e.detail && e.detail.asks));
    doc.addEventListener("bise:hub-answered", (e) => {
      const d = e.detail || {};
      // an older hub's {block, reply} on a question: kit.js's own
      if (!d.block || d.reply == null || (d.via == null && !asks.has(String(d.block)))) return;
      asks.set(String(d.block), d);
      paint();
    });
  }

  function start() {
    const doc = root.document;
    const main = doc && doc.querySelector<HTMLElement>("main[data-page]");
    if (main && !main.closest("[data-static]")) attach(doc, main);
  }
  if (root.document && root.document.addEventListener) {
    if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", start); else start();
  }

  root.BiseAsk = { core, draw, takes };
})(typeof window !== "undefined" ? window : globalThis);
