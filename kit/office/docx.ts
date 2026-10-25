// bise kit · the docx renderer of the office viewer (viewer.js; plan §4): docx-preview
// (office/dist/office-view.js, browser only) draws the pages; then each paragraph it drew in
// the body is tagged with its id from the docs module's outline (docs.open(bytes).inspect(),
// office-docs m_23801: the body's paragraphs in document order, a table's in cell order),
// so a note anchors on `{para, quote}`. Headers, footers, footnotes and text boxes are not in
// the outline: their paragraphs stay untagged. Without the docs module the pages still draw.
// Not drawn as Word does, said in the foot: fields show their saved text.
//
// Pure helper (exported for office/sdk/test/viewer.test.ts): matchParas.

import { renderDocx } from "/kit/office/office-view.js";
import { docs } from "/kit/office/office.js";
import type { OutlineNode } from "/kit/office/office.js";

const norm = (s: string | null | undefined) => String(s || "").replace(/\s+/g, " ").trim();

/** The outline's paragraphs in document order (tables' in cell order; comments and changes out). */
export function parasOf(nodes: OutlineNode[] | null | undefined, out: OutlineNode[] = []) {
  for (const n of nodes || []) {
    if (n.type === "para") out.push(n);
    else if (n.type === "table") parasOf(n.children, out);
  }
  return out;
}

/**
 * Pair drawn paragraphs (their texts, in order) with the outline's (in order): the n-th drawn
 * that has the outline's text, looking a few ahead (a drawn paragraph the outline skips, a
 * text box's, is passed over). Returns, for each drawn index, the outline index or -1.
 */
export function matchParas(drawn: (string | null | undefined)[], outline: (string | null | undefined)[], ahead = 6) {
  const out = drawn.map(() => -1);
  let d = 0;
  for (let o = 0; o < outline.length && d < drawn.length; o++) {
    const want = norm(outline[o]);
    for (let k = d; k < Math.min(drawn.length, d + ahead); k++) {
      if (norm(drawn[k]) === want) {
        out[k] = o;
        d = k + 1;
        break;
      }
    }
  }
  return out;
}

export async function draw(root: HTMLElement, bytes: Uint8Array): Promise<OfficeView> {
  root.classList.add("office-doc");
  const pages = document.createElement("div");
  pages.className = "office-pages";
  const styles = document.createElement("div");
  root.append(styles, pages);
  await renderDocx(bytes, pages, styles, {
    className: "docx",
    inWrapper: true,
    ignoreLastRenderedPageBreak: true,
    renderHeaders: true,
    renderFooters: true,
    renderFootnotes: true,
    renderEndnotes: true,
    renderComments: false,
    useBase64URL: true,
    experimental: false,
  });

  const notes: string[] = [];
  let tagged = 0;
  try {
    const outline = parasOf((await docs.open(bytes)).inspect().nodes);
    // the body only: docx-preview's <article> of each page (headers and footers are beside it)
    const drawn = [...pages.querySelectorAll<HTMLElement>("section.docx > article p")].filter((p) => !p.parentElement!.closest("p"));
    const pairs = matchParas(drawn.map((p) => p.textContent), outline.map((n) => n.text));
    pairs.forEach((o, i) => {
      if (o < 0) return;
      drawn[i].dataset.para = outline[o].id;
      tagged++;
    });
  } catch (err) {
    const e = err as { code?: string; message?: string } | null;
    // no docs module in this bise (not_built) or a file it refuses: the pages stay, untagged
    if (!e || e.code !== "not_built") notes.push(`paragraphs could not be named for notes: ${e && e.message}`);
  }
  if (pages.querySelector(".docx [class*='field'], .docx-field")) notes.push("fields show their saved text.");
  const count = pages.querySelectorAll("section.docx").length;
  root.dataset.pages = String(count);
  root.dataset.tagged = String(tagged);

  let selected: Anchor | null = null;
  pages.addEventListener("mouseup", () => {
    const s = window.getSelection();
    const p = s && s.anchorNode && (s.anchorNode.nodeType === 1 ? (s.anchorNode as Element) : s.anchorNode.parentElement)?.closest<HTMLElement>("[data-para]");
    // (a paragraph's id: a string, as the outline names it)
    selected = p ? { kind: "para", para: p.dataset.para as unknown as number, ...(norm(s.toString()) ? { quote: norm(s.toString()) } : {}) } : null;
  });

  return {
    notes,
    place: () => ({ top: root.parentElement ? root.parentElement.scrollTop : 0 }),
    restore: (p) => {
      if (root.parentElement) root.parentElement.scrollTop = (p.top as number) || 0;
    },
    selection: () => selected,
  };
}
