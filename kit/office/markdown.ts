// bise kit · the markdown renderer of the office viewer (viewer.js; md-artifact, architect
// m_38679): a .md artifact drawn as a document (headings, tables, quotes, lists, code, links) in
// bise's look, the same in the side panel, full screen and a browser. The parser is micromark
// with GFM (office/dist/office-md.js), what the desktop thread's react-markdown +
// remark-gfm run on: a file reads as an answer does. Raw HTML in the file shows as text.
//
// A 'source' toggle in the corner shows the file as written (mono, wrapped) and back. Each block
// (a heading, a paragraph, a table, a quote, a list item, a code block) gets `data-block="b<n>"`
// in document order: a note anchors on `{kind: block, block, quote}`, found again by its words
// when the blocks moved (view.where, select.js).
//
// Pure helpers (exported for office/sdk/test/viewer.test.ts): textOf, outUrl.

import { markdownHtml } from "/kit/office/office-md.js";

const W = { source: "source", sourceTip: "show the markdown as written", docTip: "show it as a document" };
const BLOCKS = "h1, h2, h3, h4, h5, h6, p, blockquote, pre, table, li, hr";
const norm = (s: string | null | undefined) => String(s || "").replace(/\s+/g, " ").trim();

/** The file's text: utf-8, a BOM dropped, CRLF as LF. */
export function textOf(bytes: Uint8Array) {
  return new TextDecoder("utf-8").decode(bytes).replace(/\r\n?/g, "\n");
}

/** Where a link or an image in the file points, from the copy's url `file` (`/a/<id>/<v>/x.md`):
 * a relative path beside the copy (where the hub keeps the files it links), anything else as is;
 * `out`: true for a link that leaves (http, https, mailto: a new tab, the app's guard opens his browser). */
export function outUrl(href: string | null, file: string, base: string) {
  if (!href || href.startsWith("#")) return { href, out: false };
  if (/^(https?:|mailto:)/i.test(href)) return { href, out: true };
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("/")) return { href, out: false };
  try {
    return { href: new URL(href, new URL(file, base)).pathname, out: false };
  } catch {
    return { href, out: false };
  }
}

export async function draw(root: HTMLElement, bytes: Uint8Array, info: OfficeInfo): Promise<OfficeView> {
  root.classList.add("office-md");
  const text = textOf(bytes);

  const doc = document.createElement("article");
  doc.className = "md-doc";
  // micromark escapes raw HTML and drops a url of an unsafe protocol (office-md.js)
  doc.innerHTML = markdownHtml(text);
  for (const a of doc.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    const u = outUrl(a.getAttribute("href"), info.file, location.href);
    a.setAttribute("href", u.href as string);
    if (u.out) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
  }
  for (const img of doc.querySelectorAll("img[src]")) img.setAttribute("src", outUrl(img.getAttribute("src"), info.file, location.href).href as string);
  // a block inside a list item or a quote is its container's: only the outermost of each kind
  // but list items (a nested item is its own block)
  let n = 0;
  for (const b of doc.querySelectorAll<HTMLElement>(BLOCKS)) {
    if (b.tagName !== "LI" && b.parentElement !== doc && b.parentElement!.closest("li, blockquote, table")) continue;
    b.dataset.block = `b${++n}`;
  }

  const src = document.createElement("pre");
  src.className = "md-source";
  src.textContent = text;
  src.hidden = true;

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "md-toggle";
  toggle.dataset.ours = "1";
  toggle.textContent = W.source;
  toggle.title = W.sourceTip;
  toggle.setAttribute("aria-pressed", "false");
  const page = document.createElement("div");
  page.className = "md-page";
  page.append(doc, src);
  root.append(toggle, page);
  const showSource = (on: boolean) => {
    src.hidden = !on;
    doc.hidden = on;
    toggle.setAttribute("aria-pressed", String(on));
    // designer m_38797: pressed, the tip says where it goes back to
    toggle.title = on ? W.docTip : W.sourceTip;
    root.dataset.source = on ? "1" : "";
  };
  toggle.addEventListener("click", () => showSource(src.hidden));

  let selected: Anchor | null = null;
  doc.addEventListener("mouseup", () => {
    const s = window.getSelection();
    const node = s && s.anchorNode && (s.anchorNode.nodeType === 1 ? (s.anchorNode as Element) : s.anchorNode.parentElement);
    const b = node && node.closest && node.closest<HTMLElement>("[data-block]");
    const quote = norm(s && s.toString());
    selected = b && quote ? { kind: "block", block: b.dataset.block, quote } : null;
  });

  return {
    notes: [],
    place: () => ({ top: page.scrollTop, source: !src.hidden }),
    restore: (p) => {
      showSource(!!p.source);
      page.scrollTop = (p.top as number) || 0;
    },
    selection: () => selected,
    // a note's block: by its id while its words are still there, else the first block that has them
    where(a) {
      if (!a || a.kind !== "block") return null;
      const q = norm(a.quote);
      const byId = doc.querySelector(`[data-block="${CSS.escape(String(a.block))}"]`);
      const has = (e: Element) => !q || norm(e.textContent).includes(q);
      const el = byId && has(byId) ? byId : q ? [...doc.querySelectorAll("[data-block]")].find(has) : null;
      return { els: el ? [el] : [], found: !!el };
    },
  };
}
