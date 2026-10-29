// check(): what an agent must fix before it says a docx is done. The
// package's problems (core), then the document's: comments that point at
// nothing, a style or a list that does not exist, a heading that skips a
// level, placeholder text, tracked changes left open; and, as info, a
// paraId open() found twice and renamed (architect m_23826).

import { checkPackage } from "../core/package.ts";
import type { Problem } from "../core/outline.ts";
import { listChanges } from "./changes.ts";
import { commentIds } from "./comments.ts";
import { cellsOfRow, rowsOf, type Model } from "./model.ts";
import { paraAnchor, paraProps } from "./outline.ts";
import { numIds, readStyles } from "./styles.ts";
import { scan } from "./text.ts";
import { getW, wkid, wkids } from "./w.ts";

const PLACEHOLDER = /lorem ipsum|\bTODO\b|\bTBD\b|\bXXX\b|\[(?:insert|add|your|name|date|placeholder)[^\]]*\]|<(?:insert|placeholder)[^>]*>/i;

export function check(m: Model): Problem[] {
  m.parts.flush();
  const out: Problem[] = checkPackage(m.parts.zip);
  const styles = readStyles(m.parts);
  const nums = numIds(m.parts);
  let prevLevel = 0;
  let any = false;
  for (const p of m.paras()) {
    const id = m.paraId(p);
    const at = paraAnchor(id);
    const text = scan(p).text;
    if (text.trim()) any = true;
    const props = paraProps({ m, styles }, p);
    const style = props.style as string | undefined;
    if (style && styles.size && !styles.has(style)) {
      out.push({ code: "missing_style", severity: "warning", at, message: `paragraph ${id} uses style "${style}", which styles.xml does not define: Word shows it as Normal` });
    }
    const pPr = wkid(p, "pPr");
    const numPr = pPr && wkid(pPr, "numPr");
    const numId = numPr && wkid(numPr, "numId") && getW(wkid(numPr, "numId")!, "val");
    if (numId && numId !== "0" && !nums.has(numId)) {
      out.push({ code: "missing_list", severity: "warning", at, message: `paragraph ${id} is in list ${numId}, which numbering.xml does not define: it shows no bullet or number` });
    }
    const level = props.level as number | undefined;
    if (level !== undefined && level > 0) {
      if (!text.trim()) out.push({ code: "empty_heading", severity: "warning", at, message: `heading ${id} has no text` });
      if (level > prevLevel + 1) {
        out.push({ code: "heading_skip", severity: "warning", at, message: `heading "${text.slice(0, 40)}" is level ${level} after level ${prevLevel}: a level is skipped` });
      }
      prevLevel = level;
    }
    const ph = PLACEHOLDER.exec(text);
    if (ph) out.push({ code: "placeholder", severity: "warning", at: paraAnchor(id, ph[0]), message: `paragraph ${id} still says "${ph[0]}"` });
  }
  for (const r of m.renamed) {
    out.push({
      code: "para_id_renamed",
      severity: "info",
      at: paraAnchor(r.to),
      message: `two paragraphs had the id ${r.from}: the second is now ${r.to} (a note on ${r.from} finds its paragraph by its quote)`,
    });
  }
  const { used, defined } = commentIds(m);
  for (const id of used) {
    if (!defined.has(id)) out.push({ code: "dangling_comment", severity: "error", message: `the text marks comment ${id}, which comments.xml does not have: Word may refuse the file` });
  }
  for (const id of defined) {
    if (!used.has(id)) out.push({ code: "orphan_comment", severity: "warning", message: `comment ${id} is on no text: Word does not show it` });
  }
  out.push(...tableProblems(m));
  const changes = listChanges(m);
  if (changes.length) {
    out.push({
      code: "open_changes",
      severity: "warning",
      message: `${changes.length} tracked change${changes.length === 1 ? "" : "s"} still open: accept or reject them (doc.changes) unless the user wants to review them`,
    });
  }
  if (!any) out.push({ code: "empty", severity: "warning", message: "the document has no text" });
  return out;
}

/** A row with more or fewer cells than the table's grid (gridSpan counted). */
function tableProblems(m: Model): Problem[] {
  const out: Problem[] = [];
  const list = m.body.getElementsByTagNameNS(m.body.namespaceURI!, "tbl");
  for (let i = 0; i < list.length; i++) {
    const tbl = list.item(i)!;
    const grid = wkid(tbl, "tblGrid");
    const cols = grid ? wkids(grid, "gridCol").length : 0;
    if (!cols) continue;
    rowsOf(tbl).forEach((tr, r) => {
      let span = 0;
      for (const tc of cellsOfRow(tr)) {
        const tcPr = wkid(tc, "tcPr");
        const gs = tcPr && wkid(tcPr, "gridSpan");
        span += gs ? Number(getW(gs, "val") ?? 1) : 1;
      }
      const tr0 = wkid(tr, "trPr");
      for (const k of ["gridBefore", "gridAfter"]) {
        const g = tr0 && wkid(tr0, k);
        if (g) span += Number(getW(g, "val") ?? 0);
      }
      if (span !== cols) {
        const first = tr.getElementsByTagNameNS(m.body.namespaceURI!, "p").item(0);
        out.push({
          code: "table_shape",
          severity: "warning",
          at: first ? paraAnchor(m.paraId(first)) : undefined,
          message: `table row ${r + 1} spans ${span} columns, its table has ${cols}`,
        });
      }
    });
  }
  return out;
}
