// bise kit v0 · kit.js (docs/ambient-pages.md §2.5, §2.7): the frame, the components' behavior, the
// one SSE client of the page, the in-place swap of a new version by data-id (scroll kept, then a
// `bise:swapped` event), and "what changed" from the blocks' hashes in meta. notes.js (amb-web) is
// the note layer on top; the two talk through document events only:
//   bise:swapped {version, changed, removed}   a new version is in (changed = new or different ids)
//   bise:notes   {notes}                       the SSE notes event (all notes of the page)
//   bise:state   {state}                       the SSE state event ("ready" | "updating")
//   bise:pick    {block, option, text}         a question's option picked as a note (null: taken
//                                              back), when the server has no /answer route (slice 1)
//   bise:answered {block, reply}               the question's card was answered (SSE answered)
//   bise:voice   {phase, text}                 a voice note at the mouse (SSE voice, slice 2)
//   (a message block's `copy` puts its Slack markup on the clipboard; no event)
//   bise:react   {block, item, kind, text}     approve / skip (review item, email: item null),
//                                              keep / drop / pick (compare), tick (checklist);
//                                              kind null: taken back
// The kit's own controls inside blocks carry data-kit-ui (never part of a quote or anchor).
// notes.js marks a review item the user edited with data-edited: "approve N" leaves it out.
// and the frame's [data-bise-notes-count] and [data-bise-send] (notes.js writes and binds them).
// No style= anywhere: looks hang on data- attributes kit.css reads. The pure half (BiseKit.*) runs
// in node for the laws (apps/ambient/kit/check.mjs) with a fake DOM.
(function (root) {
  "use strict";

  // an agent's id as people read it (vision §3): hyphens become spaces, the id itself never changes
  const said = (agent) => String(agent || "").replace(/-/g, " ");

  // ---- the words (ambient's) ----
  const W = {
    by: (agent) => `by ${said(agent)}`,
    updating: (agent) => `${said(agent)} is updating this page…`,
    writing: (agent) => `${said(agent)} is writing this page…`,
    stopped: (agent) => `${said(agent)} stopped before writing anything here.`,
    // the writing state (ambient m_5095)
    writingFrame: "writing",
    asked: (ask) => `you asked: “${ask}”`,
    onIt: "on it.",
    earlier: (n) => `+${n} earlier`,
    failed: (reason) => (reason ? `▲ couldn't finish: ${reason}. main is on it.` : "▲ couldn't finish. main is on it."),
    tabWriting: (title) => `${title} · writing`,
    changed: "what changed",
    send: "send",
    latest: "see the latest",
    older: (n, latest) => `v${n} of ${latest}`,
    forYou: "for you",
    approve: "approve",
    skip: "skip",
    approveAll: (n) => `approve ${n}`,
    keep: "♡",
    drop: "✗",
    pick: "pick",
    tick: "done",
    copy: "copy",
    copied: "copied",
    replyOn: (site) => `reply on ${site}`,
    copyOpen: (site) => `copy + open ${site}`,
  };

  // ---- the writing state: the agent's intents, newest at the bottom, the last 5 shown ----
  // `list`: the progress lines so far; `working`: the agent is still at it (the last one is
  // current). Returns {earlier: how many fold into "+N earlier", lines: [{text, current}]}.
  function intentLines(list, working, max = 5) {
    const all = (list || []).filter((t) => String(t).trim() !== "");
    const shown = all.slice(-max);
    return {
      earlier: all.length - shown.length,
      lines: shown.map((text, i) => ({ text: String(text), current: !!working && i === shown.length - 1 })),
    };
  }
  // the time since the page started, counting up: "12 s", "3 min"
  function since(startMs, nowMs) {
    const s = Math.max(0, Math.floor((nowMs - startMs) / 1000));
    return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min`;
  }

  // ---- time ----
  function ago(atMs, nowMs) {
    const s = Math.max(0, Math.round((nowMs - atMs) / 1000));
    if (s < 45) return "just now";
    const m = Math.round(s / 60);
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} h ago`;
    const d = Math.round(h / 24);
    return d === 1 ? "yesterday" : `${d} days ago`;
  }

  // ---- what changed: blocks of version n whose hash differs from version n-1 (new ones too) ----
  function versionOf(meta, n) {
    return ((meta && meta.versions) || []).find((v) => v.n === n) || null;
  }
  function diffBlocks(prev, next) {
    const before = new Map((prev || []).map((b) => [b.id, b.hash]));
    const after = new Set((next || []).map((b) => b.id));
    return {
      changed: (next || []).filter((b) => before.get(b.id) !== b.hash).map((b) => b.id),
      removed: (prev || []).filter((b) => !after.has(b.id)).map((b) => b.id),
    };
  }
  // ids changed in version n against n-1; [] for v1 or when meta lacks either
  function changedIn(meta, n) {
    const cur = versionOf(meta, n), prev = versionOf(meta, n - 1);
    if (!cur || !prev) return [];
    return diffBlocks(prev.blocks, cur.blocks).changed;
  }

  // ---- numbers in tables ----
  const NUM = /^[\s(]*[+\-−–~≈]?\s*[$€£¥]?\s*\d[\d\s.,' ]*(?:[.,]\d+)?\s*(?:%|‰|[a-zA-Zµ°$€£]{1,4}\.?)?\s*(?:→\s*[$€£]?\d[\d\s.,]*\s*(?:%|[a-zA-Zµ]{1,4})?)?[\s)]*$/;
  const isNumeric = (text) => NUM.test(String(text).trim());
  // the columns (0-based) whose non-empty body cells are all numbers; rows: arrays of cell texts
  function numericColumns(rows) {
    const cols = new Map();
    for (const row of rows) row.forEach((t, i) => {
      if (String(t).trim() === "") return;
      cols.set(i, (cols.get(i) ?? true) && isNumeric(t));
    });
    return [...cols].filter(([, ok]) => ok).map(([i]) => i).sort((a, b) => a - b);
  }

  // ---- DOM helpers that work on the browser's DOM and on the laws' fake one ----
  const kids = (el) => Array.from(el.children || []);
  const isBlock = (el) => !!el.getAttribute && el.getAttribute("data-kit") != null && el.getAttribute("data-id") != null;
  const idOf = (el) => el.getAttribute("data-id");
  const norm = (html) => String(html).replace(/\s+/g, " ").replace(/> </g, "><").trim();

  // The source each block came with, before notes.js decorated it: the fallback to compare
  // blocks when meta has no hashes.
  const sources = new WeakMap();
  function remember(el) { if (el && el.outerHTML != null) sources.set(el, norm(el.outerHTML)); }

  // Swap the blocks of `main` for `incoming` (the new version's block elements, in order), in
  // place: a block whose id is kept and that did not change stays the same node (notes.js keeps
  // its pins and edits there); a changed or new one comes in; a gone one goes; the order follows
  // the new version. `changed`: the ids that differ (from the hashes), or null to compare sources.
  // `view` (optional): {anchor(): {id, top} | null, topOf(id), scrollBy(dy)} keeps the reading
  // position: the first block on screen stays where it was. Returns {changed, removed}.
  function swap(main, incoming, changed, view) {
    const old = new Map(kids(main).filter(isBlock).map((el) => [idOf(el), el]));
    const anchor = view && view.anchor ? view.anchor() : null;
    const differs = changed
      ? (() => { const s = new Set(changed); return (el) => s.has(idOf(el)); })()
      : (el) => { const o = old.get(idOf(el)); return !o || sources.get(o) !== norm(el.outerHTML); };
    const out = [], diff = [];
    for (const nb of incoming) {
      const id = idOf(nb), ob = old.get(id);
      if (ob && !differs(nb)) { out.push(ob); continue; }
      diff.push(id);
      nb.setAttribute("data-arrived", "");
      out.push(nb);
    }
    const keep = new Set(out);
    const removed = [];
    for (const [id, el] of old) if (!keep.has(el)) { main.removeChild(el); if (!incoming.some((n) => idOf(n) === id)) removed.push(id); }
    // place in order, moving only what is out of place
    let ref = kids(main).find(isBlock) || null;
    for (const el of out) {
      if (el === ref) { ref = nextBlock(main, el); continue; }
      main.insertBefore(el, ref);
    }
    for (const el of out) if (!old.has(idOf(el)) || old.get(idOf(el)) !== el) remember(el);
    if (anchor && view.topOf) {
      // the anchor block, or the first kept block after it, back where it was on screen
      const ids = out.map(idOf);
      let at = ids.indexOf(anchor.id);
      if (at < 0) at = 0;
      const top = view.topOf(ids[at]);
      if (top != null && top !== anchor.top) view.scrollBy(top - anchor.top);
    }
    return { changed: diff, removed };
  }
  function nextBlock(main, el) {
    const list = kids(main);
    for (let i = list.indexOf(el) + 1; i < list.length; i++) if (isBlock(list[i])) return list[i];
    return null;
  }

  // ---- the components ----
  function cellTexts(tr) { return kids(tr).filter((c) => /^(td|th)$/i.test(c.tagName)).map((c) => c.textContent); }
  function decorateTable(block) {
    for (const table of block.querySelectorAll("table")) {
      const trs = Array.from(table.querySelectorAll("tr"));
      const body = trs.filter((tr) => kids(tr).some((c) => /^td$/i.test(c.tagName)));
      const cols = new Set(numericColumns(body.map(cellTexts)));
      for (const tr of trs) kids(tr).forEach((c, i) => {
        if (cols.has(i)) c.setAttribute("data-num", ""); else c.removeAttribute("data-num");
      });
    }
  }
  function decorateQuestion(block, agent) {
    if (agent) block.setAttribute("data-by", said(agent));
    const answer = block.getAttribute("data-answer");
    const opts = options(block);
    if (answer != null) {
      const n = parseInt(answer, 10);
      opts.forEach((li, i) => {
        const hit = n ? i + 1 === n : norm(li.textContent).toLowerCase() === norm(answer).toLowerCase();
        if (hit) li.setAttribute("data-picked", ""); else li.removeAttribute("data-picked");
      });
    }
  }
  const options = (block) => {
    const list = kids(block).find((c) => /^(ol|ul)$/i.test(c.tagName));
    return list ? kids(list).filter((c) => /^li$/i.test(c.tagName)) : [];
  };
  // pick (or take back) option n (1-based) of a question: marks it and says what was picked
  // ({block, option, text}; option null: taken back), or null when there is nothing to pick
  function pick(block, n) {
    if (block.getAttribute("data-answer") != null) return null;
    const opts = options(block);
    const li = opts[n - 1];
    if (!li) return null;
    const again = li.hasAttribute("data-picked");
    opts.forEach((o) => o.removeAttribute("data-picked"));
    if (!again) li.setAttribute("data-picked", "");
    return { block: idOf(block), option: again ? null : n, text: again ? null : norm(li.textContent) };
  }
  // The answer reached the page (SSE `answered`, from the page, the capsule or the TUI): the
  // question shows it, and notes.js drops any draft pick on that block.
  function answered(doc, block, reply) {
    block.setAttribute("data-answer", String(reply));
    decorateQuestion(block, block.getAttribute("data-by"));
    doc.dispatchEvent(new root.CustomEvent("bise:answered", { detail: { block: idOf(block), reply: String(reply) } }));
  }
  // ---- review and email (§4.3): approve / skip, as notes through notes.js ----
  // The kit's own controls inside a block carry data-kit-ui: not the agent's content (notes.js
  // leaves them out of quotes and anchors; the swap compares the agent's source, not them).
  const items = (block) => options(block).filter((li) => li.getAttribute("data-id") != null);
  const ui = (el) => el.getAttribute && el.getAttribute("data-kit-ui") != null;
  function button(doc, act, text) {
    const b = doc.createElement("button");
    b.setAttribute("type", "button");
    b.setAttribute("data-act", act);
    b.textContent = text;
    return b;
  }
  function acts(doc, kinds) {
    const bar = doc.createElement("span");
    bar.setAttribute("data-kit-ui", "");
    for (const k of kinds) bar.append(button(doc, k, W[k]));
    return bar;
  }
  // an item's words as one line: block elements apart, inline ones as written, the kit's controls out
  const BLOCKY = /^(p|li|ul|ol|h1|h2|h3|blockquote|pre|table|tr|td|th|caption)$/i;
  function textOf(el) {
    const walk = (e) => nodesOf(e).map((n) => {
      if (isText(n)) return n.textContent;
      if (ui(n)) return "";
      return BLOCKY.test(n.tagName) ? ` ${walk(n)} ` : walk(n);
    }).join("");
    return walk(el).replace(/\s+/g, " ").trim();
  }
  // ---- reply items (slice B, 'watch for me'): a comment somewhere and the drafted answer ----
  // bise never posts: approving opens the thread, with the reply prefilled where the site has an
  // intent URL for it (X), else the reply is copied first ('copy + open').
  const SITES = [[/(^|\.)news\.ycombinator\.com$/, "Hacker News"], [/(^|\.)reddit\.com$/, "Reddit"], [/(^|\.)(x|twitter)\.com$/, "X"], [/(^|\.)bsky\.app$/, "Bluesky"]];
  function replyTarget(thread, text) {
    const m = /^https:\/\/([^/?#]+)([^?#]*)/i.exec(String(thread || ""));
    if (!m) return null;
    const host = m[1].toLowerCase();
    const site = (SITES.find(([re]) => re.test(host)) || [null, host])[1];
    const tweet = site === "X" && /\/status\/(\d+)/.exec(m[2]);
    if (tweet) return { site, open: `https://x.com/intent/post?in_reply_to=${tweet[1]}&text=${encodeURIComponent(text)}`, copy: false };
    return { site, open: thread, copy: true };
  }
  // the drafted reply: the <p>s after the quoted comment (or the last <p>)
  function replyText(li) {
    const cs = kids(li).filter((c) => !ui(c));
    const q = cs.findIndex((c) => /^blockquote$/i.test(c.tagName));
    const ps = (q >= 0 ? cs.slice(q + 1) : cs.slice(-1)).filter((c) => /^p$/i.test(c.tagName));
    return ps.map((p) => textOf(p)).join("\n\n");
  }

  // ---- checklist who and when (slice D): data-who, data-due (YYYY-MM-DD) in words ----
  const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const MONTHS = ["jan", "feb", "march", "april", "may", "june", "july", "aug", "sept", "oct", "nov", "dec"];
  // {text, late}: "today", "tomorrow", "friday" (this week), "20 may", "late · 3 days"
  function dueWords(due, nowMs) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(due || ""));
    if (!m) return null;
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    const now = new Date(nowMs);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const days = Math.round((d - today) / 86400000);
    if (days < 0) return { text: `late · ${-days === 1 ? "1 day" : `${-days} days`}`, late: true };
    if (days === 0) return { text: "today", late: false };
    if (days === 1) return { text: "tomorrow", late: false };
    if (days < 7) return { text: DAYS[d.getDay()], late: false };
    return { text: `${d.getDate()} ${MONTHS[d.getMonth()]}`, late: false };
  }
  function decorateWho(doc, li, nowMs) {
    const who = li.getAttribute("data-who"), due = dueWords(li.getAttribute("data-due"), nowMs);
    let tag = kids(li).find((c) => ui(c) && c.getAttribute("data-when") != null);
    if (!who && !due) { if (tag) li.removeChild(tag); return; }
    if (!tag) { tag = doc.createElement("span"); tag.setAttribute("data-kit-ui", ""); tag.setAttribute("data-when", ""); li.append(tag); }
    tag.textContent = [who, due && due.text].filter(Boolean).join(" · ");
    if (due && due.late && li.getAttribute("data-done") == null && li.getAttribute("data-verdict") !== "tick") li.setAttribute("data-late", ""); else li.removeAttribute("data-late");
  }

  // ---- an item's agent (slice C): data-agent, live from SSE 'agent' {name, status, note?} ----
  // Before any event the item shows the name alone (the agent may not exist yet, or the stream is
  // not up): "∿ fix login"; then "∿ fix login · working · reading the Safari logs".
  const STATUS = { working: "working", idle: "waiting", done: "done", blocked: "needs you", failed: "▲ failed" };
  const agents = new Map();
  function agentLine(name, st) {
    const parts = [`∿ ${said(name)}`];
    if (st && STATUS[st.status]) parts.push(STATUS[st.status]);
    if (st && st.note) parts.push(String(st.note));
    return parts.join(" · ");
  }
  function decorateAgent(doc, li) {
    const name = li.getAttribute("data-agent");
    let tag = kids(li).find((c) => ui(c) && c.getAttribute("data-agent-line") != null);
    if (!name) { if (tag) li.removeChild(tag); return; }
    if (!tag) { tag = doc.createElement("span"); tag.setAttribute("data-kit-ui", ""); tag.setAttribute("data-agent-line", ""); li.append(tag); }
    const st = agents.get(name);
    tag.textContent = agentLine(name, st);
    if (st && STATUS[st.status]) tag.setAttribute("data-status", st.status); else tag.removeAttribute("data-status");
  }

  // the items "approve N" approves: no verdict yet, and not edited by the user (those go with send)
  const pending = (block) => items(block).filter((li) => li.getAttribute("data-verdict") == null && li.getAttribute("data-edited") == null);
  // the buttons each item kind gets (review: approve / skip; compare: ♡ ✗ pick; checklist: a tick)
  const ITEM_ACTS = { review: ["approve", "skip"], compare: ["keep", "drop", "pick"], checklist: ["tick"] };
  function decorateItems(doc, block, kit) {
    for (const li of items(block)) {
      if (!kids(li).some(ui)) {
        const bar = acts(doc, ITEM_ACTS[kit]);
        // a checklist's tick goes first, like a box; an item the agent marked done is ticked
        if (kit === "checklist") li.insertBefore(bar, li.firstChild || (li.nodes && li.nodes[0]) || null);
        else li.append(bar);
      }
      if (kit === "checklist" && li.getAttribute("data-done") != null && li.getAttribute("data-verdict") == null) li.setAttribute("data-verdict", "tick");
      if (kit === "checklist") decorateWho(doc, li, Date.now());
      decorateAgent(doc, li);
      // a reply item: its approve says what it does ('reply on X', or 'copy + open' on Hacker News)
      const t = kit === "review" && replyTarget(li.getAttribute("data-reply"), "");
      if (t) {
        const ok = kids(li).filter(ui).flatMap((b) => kids(b)).find((b) => b.getAttribute("data-act") === "approve");
        if (ok) ok.textContent = t.copy ? W.copyOpen(t.site) : W.replyOn(t.site);
      }
    }
  }
  function decorateReview(doc, block) {
    decorateItems(doc, block, "review");
    let all = kids(block).find(ui);
    if (!all) { all = doc.createElement("p"); all.setAttribute("data-kit-ui", ""); all.append(button(doc, "approve-all", "")); block.append(all); }
    const n = pending(block).length;
    const b = kids(all)[0];
    b.textContent = W.approveAll(n);
    if (n) b.removeAttribute("disabled"); else b.setAttribute("disabled", "");
  }
  function decorateEmail(doc, block) {
    if (!kids(block).some(ui)) block.append(acts(doc, ["approve", "skip"]));
  }
  // react to an item (review approve/skip, compare keep/drop/pick, checklist tick) or a whole
  // email (item null); the same again takes it back; a pick is one per block (the last wins).
  // Returns {block, item, kind (null: taken back), text}, or null.
  function react(block, item, kind) {
    const target = item == null ? block : items(block).find((li) => li.getAttribute("data-id") === item);
    if (!target) return null;
    const again = target.getAttribute("data-verdict") === kind;
    if (kind === "pick" && !again) for (const li of items(block)) if (li.getAttribute("data-verdict") === "pick") li.removeAttribute("data-verdict");
    if (again) target.removeAttribute("data-verdict"); else target.setAttribute("data-verdict", kind);
    const text = textOf(target);
    return { block: idOf(block), item: item == null ? null : item, kind: again ? null : kind, text };
  }
  // "approve N": every pending item, one reaction each
  function approveAll(block) {
    return pending(block).map((li) => react(block, li.getAttribute("data-id"), "approve"));
  }

  // ---- message (slice A): a draft that leaves through a channel; `copy` gives its markup ----
  const nodesOf = (e) => Array.from(e.childNodes || e.nodes || []);
  const isText = (n) => n.nodeType === 3 || (n.tagName == null && n.textContent != null);
  // The block as Slack mrkdwn, from what the page shows now (the user's edits included):
  // strong *x*, em _x_, del ~x~, code `x`, links <url|text>, list items "• ", paragraphs apart.
  function toSlack(block) {
    const inline = (e) => nodesOf(e).map((n) => {
      if (isText(n)) return n.textContent.replace(/\s+/g, " ");
      if (ui(n)) return "";
      const t = n.tagName.toLowerCase(), x = inline(n);
      if (t === "strong" || t === "b") return `*${x.trim()}*`;
      if (t === "em" || t === "i") return `_${x.trim()}_`;
      if (t === "del" || t === "s") return `~${x.trim()}~`;
      if (t === "code" || t === "kbd") return "`" + x + "`";
      if (t === "a") { const h = n.getAttribute("href") || ""; return /^(https?:|mailto:)/.test(h) ? `<${h}|${x.trim()}>` : x; }
      if (t === "br") return "\n";
      return x;
    }).join("");
    const out = [];
    for (const c of kids(block)) {
      if (ui(c)) continue;
      const t = c.tagName.toLowerCase();
      if (t === "ul" || t === "ol") out.push(kids(c).map((li, i) => `${t === "ol" ? `${i + 1}.` : "•"} ${inline(li).trim()}`).join("\n"));
      else if (t === "pre") out.push("```\n" + c.textContent.replace(/\n$/, "") + "\n```");
      else if (t === "blockquote") out.push(inline(c).trim().split("\n").map((l) => `> ${l}`).join("\n"));
      else out.push(inline(c).trim());
    }
    return out.filter(Boolean).join("\n\n");
  }
  function decorateMessage(doc, block) {
    if (!kids(block).some(ui)) block.append(acts(doc, ["copy"]));
  }

  function decorate(blocks, agent, doc) {
    for (const b of blocks) {
      const kit = b.getAttribute("data-kit");
      if (kit === "table") decorateTable(b);
      else if (kit === "question") decorateQuestion(b, agent);
      else if (kit === "review" && doc) decorateReview(doc, b);
      else if (kit === "email" && doc) decorateEmail(doc, b);
      else if (kit === "message" && doc) decorateMessage(doc, b);
      else if ((kit === "compare" || kit === "checklist") && doc) decorateItems(doc, b, kit);
    }
  }

  // A new version on screen: swap its blocks in (by the hashes in meta when it has both versions),
  // decorate them, mark what changed against the version before, and tell notes.js. Returns the
  // swap's {changed, removed}.
  function applyVersion(doc, main, incoming, meta, from, to, opts) {
    const o = opts || {};
    const cur = versionOf(meta, to), was = versionOf(meta, from);
    const res = swap(main, incoming, cur && was ? diffBlocks(was.blocks, cur.blocks).changed : null, o.view);
    main.setAttribute("data-version", String(to));
    main.setAttribute("data-latest", String(to));
    const blocks = kids(main).filter(isBlock);
    decorate(blocks, o.agent, doc);
    const marked = new Set(cur && versionOf(meta, to - 1) ? changedIn(meta, to) : res.changed);
    for (const b of blocks) if (marked.has(idOf(b))) b.setAttribute("data-changed", ""); else b.removeAttribute("data-changed");
    doc.dispatchEvent(new root.CustomEvent("bise:swapped", { detail: { version: to, changed: res.changed, removed: res.removed } }));
    return { ...res, marked: [...marked] };
  }

  const BiseKit = { W, said, intentLines, since, ago, versionOf, diffBlocks, changedIn, isNumeric, numericColumns, swap, applyVersion, remember, decorate, pick, answered, react, approveAll, toSlack, replyTarget, replyText, dueWords, agentLine, agents, options, norm };
  root.BiseKit = BiseKit;

  // ---- the browser: the frame, the stream, the keys ----
  const doc = root.document;
  if (!doc || !doc.addEventListener || !doc.createElement || !doc.body && doc.readyState !== "loading") return;

  function start() {
    const page = doc.getElementById("bise-page");
    const home = doc.getElementById("bise-home");
    if (page) startPage(page);
    else if (home) startHome(home);
  }

  function el(tag, attrs, text) {
    const e = doc.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) if (v != null) e.setAttribute(k, v);
    if (text != null) e.textContent = text;
    return e;
  }

  function frame(title) {
    const f = el("header", { class: "bise-frame", role: "banner" });
    // the pearl at 36 px (SPEC §1, round 8): amb-web draws its shader into [data-bise-pearl]; the
    // ':*' stays as the fallback until it does
    f.append(el("span", { class: "k", "aria-hidden": "true", "data-bise-pearl": "36" }, ":*"), el("span", { class: "t" }, title));
    doc.body.prepend(f);
    return f;
  }

  function startPage(main) {
    const d = main.dataset;
    const id = d.page, agent = d.agent || "", title = d.title || id;
    // version 0: a page started with `sb page start`, nothing published yet (state writing)
    const num = (x, dflt) => { const v = parseInt(x, 10); return Number.isNaN(v) ? dflt : v; };
    let shown = num(d.version, 1);
    const latestAtLoad = num(d.latest, shown);
    const follow = shown === latestAtLoad; // an older version stays put
    let meta = null;

    const f = frame(title);
    f.setAttribute("data-state", d.state || "ready");
    const m = el("span", { class: "m" });
    const st = el("span", { class: "st" });
    const stWords = el("span", {}, W.updating(agent));
    const stProgress = el("span", { class: "p" });
    st.append(stWords, stProgress);
    // the page before its first version (ambient m_5095): its title, what you asked, then what the
    // agent is doing, live (SSE progress), newest at the bottom; a failure says so
    const placeholder = el("div", { "data-kit-ui": "", class: "bise-writing" });
    const phTitle = el("h1", {}, title);
    const phAsk = el("p", { class: "ask" }, d.ask ? W.asked(d.ask) : null);
    if (!d.ask) phAsk.hidden = true;
    const phMore = el("p", { class: "more", hidden: "" });
    const phList = el("ol", { class: "intents" });
    const phFail = el("p", { class: "fail", hidden: "" });
    placeholder.append(phTitle, phAsk, phMore, phList, phFail);
    let intents = [];
    let failure = null;
    function drawIntents() {
      const working = main.dataset.state !== "ready";
      const { earlier, lines } = intentLines(intents, working);
      phMore.hidden = earlier === 0;
      phMore.textContent = W.earlier(earlier);
      const items = lines.length ? lines : working ? [{ text: W.onIt, current: true }] : [];
      phList.replaceChildren(...items.map((x) => el("li", { "data-current": x.current ? "" : null }, x.text)));
      phFail.hidden = working;
      phFail.textContent = W.failed(failure);
    }
    const startedMs = num(d.started, Date.now());
    const sp = el("span", { class: "sp" });
    const wc = el("button", { type: "button", disabled: "" }, W.changed);
    // the version: "v3 ▾" opens the list of versions (ambient m_4918), older ones read-only
    const vbox = el("span", { class: "v" });
    const vb = el("button", { type: "button", "aria-haspopup": "true", "aria-expanded": "false" }, `v${shown}`);
    const menu = el("span", { class: "vmenu", role: "menu", hidden: "" });
    vbox.append(vb, menu);
    const latest = el("a", { class: "b", href: `/p/${id}`, hidden: "" }, W.latest);
    const n = el("span", { class: "n", "data-bise-notes-count": "" });
    const send = el("button", { type: "button", class: "send", "data-bise-send": "", disabled: "" }, W.send);
    f.append(m, st, sp, wc, vbox, latest, n, send);
    const openMenu = (on) => { menu.hidden = !on; vb.setAttribute("aria-expanded", String(on)); };
    vb.addEventListener("click", (e) => { e.stopPropagation(); if (!vb.disabled) openMenu(menu.hidden); });
    doc.addEventListener("click", (e) => { if (!menu.hidden && !vbox.contains(e.target)) openMenu(false); });
    doc.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) openMenu(false); });

    const blocks = () => Array.from(main.querySelectorAll(":scope > [data-kit][data-id]"));
    blocks().forEach(remember);
    decorate(blocks(), agent, doc);

    function drawMeta() {
      const v = versionOf(meta, shown);
      const latestN = meta && meta.versions.length ? Math.max(...meta.versions.map((x) => x.n)) : latestAtLoad;
      const parts = [W.by(agent)];
      if (main.dataset.state === "writing") {
        // "by launch recap · writing · 12 s", counting up
        const t0 = meta && meta.created_ms ? meta.created_ms : startedMs;
        parts.push(W.writingFrame, since(t0, Date.now()));
      } else if (v && v.at_ms) parts.push(ago(v.at_ms, Date.now()));
      m.textContent = parts.join(" · ");
      doc.title = main.dataset.state === "writing" ? W.tabWriting(title) : title;
      latest.hidden = shown >= latestN;
      vb.textContent = (shown < latestN ? W.older(shown, latestN) : `v${shown}`) + (latestN > 1 ? " ▾" : "");
      if (latestN > 1) vb.removeAttribute("disabled"); else vb.setAttribute("disabled", "");
      const vs = meta ? meta.versions.slice().sort((a, b) => b.n - a.n) : [];
      menu.replaceChildren(...vs.map((x) => {
        const a = el("a", { role: "menuitem", href: x.n === latestN ? `/p/${id}` : `/p/${id}/v/${x.n}` }, `v${x.n}` + (x.at_ms ? ` · ${ago(x.at_ms, Date.now())}` : ""));
        if (x.n === shown) a.setAttribute("aria-current", "page");
        return a;
      }));
    }
    function markChanged(ids) {
      const set = new Set(ids);
      for (const b of blocks()) if (set.has(b.dataset.id)) b.setAttribute("data-changed", ""); else b.removeAttribute("data-changed");
      if (ids.length) wc.removeAttribute("disabled"); else { wc.setAttribute("disabled", ""); wc.classList.remove("on"); doc.body.classList.remove("bise-changes"); }
    }
    wc.addEventListener("click", () => { wc.classList.toggle("on"); doc.body.classList.toggle("bise-changes"); });

    async function loadMeta() {
      try { const r = await fetch(`/p/${id}/meta`, { cache: "no-store" }); if (r.ok) meta = await r.json(); } catch (_) { /* offline: the page still reads */ }
      return meta;
    }
    loadMeta().then(() => { drawMeta(); markChanged(changedIn(meta, shown)); });
    // the meta line every 30 s; every second while writing (the time counts up)
    let tick = 0;
    setInterval(() => { tick++; if (main.dataset.state === "writing" || tick % 30 === 0) drawMeta(); }, 1000);

    // the reading position: the first block whose bottom is under the frame
    const view = {
      anchor() {
        const fb = f.getBoundingClientRect().bottom;
        for (const b of blocks()) { const r = b.getBoundingClientRect(); if (r.bottom > fb) return { id: b.dataset.id, top: r.top }; }
        return null;
      },
      topOf(bid) { const b = main.querySelector(`:scope > [data-id="${CSS.escape(bid)}"]`); return b ? b.getBoundingClientRect().top : null; },
      scrollBy(dy) { root.scrollBy(0, dy); },
    };

    let swapping = Promise.resolve();
    async function goTo(v) {
      if (!follow || v <= shown) return;
      const r = await fetch(`/p/${id}/v/${v}/body`, { cache: "no-store" });
      if (!r.ok) return;
      const t = doc.createElement("template");
      t.innerHTML = await r.text();
      const incoming = Array.from(t.content.children).filter(isBlock);
      await loadMeta();
      const res = applyVersion(doc, main, incoming, meta, shown, v, { view, agent });
      if (placeholder.parentNode && blocks().length) placeholder.remove();
      shown = v;
      drawMeta();
      markChanged(res.marked);
    }

    // the frame and the placeholder follow the state: writing (no version yet), updating (notes
    // sent), ready; a page still at version 0 when it is ready again: its agent stopped
    function setState(s, reason) {
      f.setAttribute("data-state", s);
      main.dataset.state = s;
      stWords.textContent = W.updating(agent);
      if (s === "ready") stProgress.textContent = "";
      if (reason) failure = reason;
      const empty = blocks().length === 0;
      // nothing published yet: no send, no count, no versions in the frame, whatever the state
      if (empty) f.setAttribute("data-empty", ""); else f.removeAttribute("data-empty");
      if (empty && !placeholder.parentNode) main.append(placeholder);
      if (!empty && placeholder.parentNode) placeholder.remove();
      placeholder.setAttribute("data-state", s);
      drawIntents();
      drawMeta();
      doc.dispatchEvent(new root.CustomEvent("bise:state", { detail: { state: s } }));
    }
    function progress(text) {
      if (main.dataset.state === "ready" || !text) return;
      stProgress.textContent = ` · ${text}`;
      if (intents[intents.length - 1] !== text) intents.push(text);
      drawIntents();
    }
    if (blocks().length === 0) setState(d.state || "writing");

    if (typeof root.EventSource !== "undefined") {
      const es = new root.EventSource(`/p/${id}/events`);
      const data = (e) => { try { return JSON.parse(e.data); } catch (_) { return {}; } };
      es.addEventListener("version", (e) => { const v = data(e).n; swapping = swapping.then(() => goTo(v)).catch(() => {}); });
      es.addEventListener("state", (e) => { const x = data(e); setState(x.state || "ready", x.reason); });
      es.addEventListener("progress", (e) => progress(String(data(e).text || "")));
      const relay = (ev, name) => es.addEventListener(ev, (e) => doc.dispatchEvent(new root.CustomEvent(name, { detail: data(e) })));
      es.addEventListener("notes", (e) => doc.dispatchEvent(new root.CustomEvent("bise:notes", { detail: { notes: data(e).notes || [] } })));
      relay("voice", "bise:voice"); // slice 2 (§4.1): {phase, text}, notes.js pins it
      // slice C: an agent's live status {name, status, note?} redraws the items it works on
      es.addEventListener("agent", (e) => {
        const x = data(e);
        if (!x.name) return;
        agents.set(String(x.name), x);
        for (const b of blocks()) for (const li of items(b)) if (li.getAttribute("data-agent") === String(x.name)) decorateAgent(doc, li);
      });
      es.addEventListener("answered", (e) => {
        const d = data(e);
        const q = blocks().find((b) => b.dataset.id === d.block && b.dataset.kit === "question");
        if (q && d.reply != null) answered(doc, q, d.reply);
      });
    }

    // A pick answers the question's card (§4.2: POST /answer, one card, one answer). Until the
    // server has that route (404), or when it fails, the pick goes to notes.js as a pick note.
    let answerRoute = true;
    const token = (doc.querySelector('meta[name="bise-token"]') || { content: "" }).content;
    function onPick(q, n) {
      const d = pick(q, n);
      if (!d) return false;
      const asNote = () => doc.dispatchEvent(new root.CustomEvent("bise:pick", { detail: d }));
      if (d.option == null || !answerRoute) { asNote(); return true; }
      fetch(`/api/p/${id}/answer`, { method: "POST", headers: { "Content-Type": "application/json", "X-Bise-Token": token }, body: JSON.stringify({ block: d.block, option: d.option }) })
        .then((r) => { if (r.status === 404) answerRoute = false; if (!r.ok) asNote(); })
        .catch(asNote);
      return true;
    }

    // questions: click an option, or its digit when nothing is being typed
    main.addEventListener("click", (e) => {
      const act = e.target.closest && e.target.closest("[data-kit-ui] [data-act]");
      if (act) { onAct(act); return; }
      const li = e.target.closest && e.target.closest('[data-kit="question"] li');
      if (li) { const q = li.closest('[data-kit="question"]'); onPick(q, options(q).indexOf(li) + 1); return; }
      const sup = e.target.closest && e.target.closest("sup");
      if (sup) showSource(parseInt(sup.textContent, 10));
    });
    doc.addEventListener("keydown", (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || !/^[1-9]$/.test(e.key)) return;
      const t = e.target;
      if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return;
      const q = blocks().find((b) => b.dataset.kit === "question" && !b.hasAttribute("data-answer"));
      if (q && onPick(q, parseInt(e.key, 10))) e.preventDefault();
    });
    // review and email: approve / skip (again: take it back), "approve N"; each one goes to
    // notes.js as bise:react {block, item, kind, text} (a note of kind approve or skip)
    function onAct(btn) {
      const block = btn.closest("[data-kit][data-id]");
      const kind = btn.getAttribute("data-act");
      if (kind === "copy") {
        const done = () => { btn.textContent = W.copied; setTimeout(() => { btn.textContent = W.copy; }, 1600); };
        if (root.navigator && root.navigator.clipboard) root.navigator.clipboard.writeText(toSlack(block)).then(done, () => {});
        return;
      }
      const li = btn.closest("li[data-id]");
      const out = kind === "approve-all" ? approveAll(block) : [react(block, block.dataset.kit !== "email" && li ? li.dataset.id : null, kind)];
      for (const d of out) if (d) doc.dispatchEvent(new root.CustomEvent("bise:react", { detail: d }));
      // a reply item approved (not taken back): open its thread, the reply prefilled or copied
      const d0 = out[0];
      if (kind === "approve" && li && d0 && d0.kind === "approve" && li.dataset.reply) {
        const text = replyText(li);
        const t = replyTarget(li.dataset.reply, text);
        if (t) {
          if (t.copy && root.navigator && root.navigator.clipboard) root.navigator.clipboard.writeText(text).catch(() => {});
          root.open(t.open, "_blank", "noopener");
        }
      }
      decorate([block], agent, doc);
    }
    function showSource(k) {
      const src = blocks().find((b) => b.dataset.kit === "sources");
      const li = src && options(src)[k - 1];
      if (!li) return;
      li.scrollIntoView({ behavior: "smooth", block: "center" });
      li.setAttribute("data-lit", "");
      setTimeout(() => li.removeAttribute("data-lit"), 1600);
    }
  }

  // "for you": the server's list; the kit adds each page's line and follows the list live
  function startHome(main) {
    frame(W.forYou);
    const list = () => main.querySelector('[data-kit="pages"] > ul');
    function line(li) {
      li.querySelectorAll(".bise-meta, .bise-kicker").forEach((x) => x.remove());
      const s = li.dataset;
      // what the page is for: its heading's meta line (the server's data-kicker)
      if (s.kicker) li.append(el("span", { class: "bise-kicker" }, s.kicker));
      const parts = [said(s.agent), `v${s.version}`];
      if (s.state === "updating") parts.push(W.updating(s.agent).replace(" this page…", "…"));
      else if (s.at) parts.push(ago(parseInt(s.at, 10), Date.now()));
      li.append(el("span", { class: "bise-meta" }, parts.join(" · ")));
    }
    const draw = () => { const ul = list(); if (ul) Array.from(ul.children).forEach(line); };
    draw();
    setInterval(draw, 30000);
    if (typeof root.EventSource !== "undefined") {
      const es = new root.EventSource("/events");
      es.addEventListener("pages", (e) => {
        let pages = [];
        try { pages = JSON.parse(e.data).pages || []; } catch (_) { return; }
        const ul = list();
        if (!ul) return;
        ul.replaceChildren(...pages.map((p) => {
          const li = el("li", { "data-page": p.id, "data-agent": p.agent, "data-version": p.version, "data-state": p.state, "data-at": p.at_ms, "data-kicker": p.kicker || null, "data-asking": p.asking ? "" : null });
          li.append(el("a", { href: `/p/${p.id}` }, p.title || p.id));
          return li;
        }));
        draw();
      });
    }
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start); else start();
})(typeof window !== "undefined" ? window : globalThis);
