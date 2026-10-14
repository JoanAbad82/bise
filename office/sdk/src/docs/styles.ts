// Styles and lists: what a paragraph's style means (a heading level, a
// list), and the built-in styles and list definitions the module adds to a
// file that lacks them. All written here, by us (no file from Word).

import { attr, children, parseXml, type Document, type Element } from "../core/xml.ts";
import type { Parts } from "./parts.ts";
import { getW, W, wkid, wkids } from "./w.ts";

export type StyleInfo = { id: string; name: string; type: string; basedOn?: string; outline?: number; numId?: string };

/** The styles of the file, by id ("Heading1", "Normal", ...). */
export function readStyles(parts: Parts): Map<string, StyleInfo> {
  const out = new Map<string, StyleInfo>();
  const path = parts.find("styles");
  if (!path) return out;
  for (const s of wkids(parts.dom(path).documentElement!, "style")) {
    const id = getW(s, "styleId") ?? "";
    const pPr = wkid(s, "pPr");
    const lvl = pPr && wkid(pPr, "outlineLvl");
    const num = pPr && wkid(pPr, "numPr");
    const numId = num && wkid(num, "numId");
    out.set(id, {
      id,
      name: (wkid(s, "name") && getW(wkid(s, "name")!, "val")) ?? id,
      type: getW(s, "type") ?? "paragraph",
      basedOn: (wkid(s, "basedOn") && getW(wkid(s, "basedOn")!, "val")) ?? undefined,
      outline: lvl ? Number(getW(lvl, "val")) : undefined,
      numId: numId ? getW(numId, "val") : undefined,
    });
  }
  return out;
}

/** A paragraph style's heading level: 1-9, 0 for Title, undefined for body text. */
export function headingLevel(styles: Map<string, StyleInfo>, styleId: string | undefined, own?: number): number | undefined {
  if (own !== undefined && own < 9) return own + 1;
  let id = styleId;
  for (let hop = 0; id && hop < 10; hop++) {
    const s = styles.get(id);
    const name = (s?.name ?? id).toLowerCase();
    if (name === "title" || id === "Title") return 0;
    const m = /^heading ?(\d)$/.exec(name) ?? /^heading(\d)$/i.exec(id);
    if (m) return Number(m[1]);
    if (s?.outline !== undefined && s.outline < 9) return s.outline + 1;
    id = s?.basedOn;
  }
  return undefined;
}

// ---- the built-in styles, as we write them

const HEADING_SIZES = [0, 32, 26, 24, 22, 22, 22];

function heading(n: number): string {
  return (
    `<w:style w:type="paragraph" w:styleId="Heading${n}"><w:name w:val="heading ${n}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="9"/><w:qFormat/>` +
    `<w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="${n === 1 ? 360 : 200}" w:after="80"/><w:outlineLvl w:val="${n - 1}"/></w:pPr>` +
    `<w:rPr><w:b/><w:sz w:val="${HEADING_SIZES[n]}"/><w:szCs w:val="${HEADING_SIZES[n]}"/></w:rPr></w:style>`
  );
}

/** The styles the module knows how to add, by id. */
export const BUILTIN: Record<string, string> = {
  Normal: `<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>`,
  Title:
    `<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="10"/><w:qFormat/>` +
    `<w:pPr><w:spacing w:after="160"/><w:contextualSpacing/></w:pPr><w:rPr><w:sz w:val="56"/><w:szCs w:val="56"/></w:rPr></w:style>`,
  Heading1: heading(1),
  Heading2: heading(2),
  Heading3: heading(3),
  Heading4: heading(4),
  Heading5: heading(5),
  Heading6: heading(6),
  ListParagraph:
    `<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:uiPriority w:val="34"/><w:qFormat/>` +
    `<w:pPr><w:ind w:left="720"/><w:contextualSpacing/></w:pPr></w:style>`,
  Quote:
    `<w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="29"/><w:qFormat/>` +
    `<w:pPr><w:ind w:left="720" w:right="720"/></w:pPr><w:rPr><w:i/><w:color w:val="404040"/></w:rPr></w:style>`,
  TableNormal:
    `<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:uiPriority w:val="99"/><w:semiHidden/><w:unhideWhenUsed/>` +
    `<w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>`,
  TableGrid:
    `<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:basedOn w:val="TableNormal"/><w:uiPriority w:val="39"/><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>` +
    `<w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tblBorders></w:tblPr></w:style>`,
  Hyperlink: `<w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:uiPriority w:val="99"/><w:unhideWhenUsed/><w:rPr><w:color w:val="0563C1"/><w:u w:val="single"/></w:rPr></w:style>`,
};

const DEFAULTS =
  `<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos" w:eastAsia="Aptos" w:cs="Aptos"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="en-US"/></w:rPr></w:rPrDefault>` +
  `<w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="259" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>`;

/** A styles part with the defaults and these built-in styles. */
export function stylesXml(ids: string[] = Object.keys(BUILTIN)): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:styles xmlns:w="${W}">${DEFAULTS}${ids.map((id) => BUILTIN[id]).join("")}</w:styles>`;
}

/** Add a built-in style (and what it is based on) when the file has no style of that id. */
export function ensureStyle(parts: Parts, id: string): boolean {
  if (!BUILTIN[id]) return readStyles(parts).has(id);
  const path = parts.ensure("styles", () => stylesXml(["Normal", "TableNormal"]));
  const doc = parts.dom(path);
  const root = doc.documentElement!;
  const have = new Set(wkids(root, "style").map((s) => getW(s, "styleId")));
  if (have.has(id)) return true;
  const frag = parseXml(`<x xmlns:w="${W}">${BUILTIN[id]}</x>`, "style");
  const made = frag.documentElement!.firstChild as Element;
  root.appendChild(doc.importNode(made, true));
  parts.touch(path);
  const based = /w:basedOn w:val="([^"]+)"/.exec(BUILTIN[id])?.[1];
  if (based) ensureStyle(parts, based);
  return true;
}

// ---- lists: one bullet and one numbered definition, added once

const BULLETS = ["•", "◦", "▪", "•", "◦", "▪", "•", "◦", "▪"];
const NUMBERS = ["decimal", "lowerLetter", "lowerRoman", "decimal", "lowerLetter", "lowerRoman", "decimal", "lowerLetter", "lowerRoman"];

function abstractNum(id: number, ordered: boolean): string {
  const lvls = Array.from({ length: 9 }, (_, i) => {
    const fmt = ordered ? NUMBERS[i] : "bullet";
    const text = ordered ? `%${i + 1}.` : BULLETS[i];
    return `<w:lvl w:ilvl="${i}"><w:start w:val="1"/><w:numFmt w:val="${fmt}"/><w:lvlText w:val="${text}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${720 * (i + 1)}" w:hanging="360"/></w:pPr></w:lvl>`;
  }).join("");
  return `<w:abstractNum w:abstractNumId="${id}"><w:multiLevelType w:val="hybridMultilevel"/><w:name w:val="bise ${ordered ? "numbered" : "bullets"}"/>${lvls}</w:abstractNum>`;
}

/** The numId of our bullet (or numbered) list, made in numbering.xml when missing. */
export function listNumId(parts: Parts, ordered: boolean): string {
  const path = parts.ensure("numbering", () => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:numbering xmlns:w="${W}"></w:numbering>`);
  const doc = parts.dom(path);
  const root = doc.documentElement!;
  const name = `bise ${ordered ? "numbered" : "bullets"}`;
  const abs = wkids(root, "abstractNum");
  const nums = wkids(root, "num");
  const mine = abs.find((a) => wkid(a, "name") && getW(wkid(a, "name")!, "val") === name);
  if (mine) {
    const aid = getW(mine, "abstractNumId");
    const num = nums.find((n) => wkid(n, "abstractNumId") && getW(wkid(n, "abstractNumId")!, "val") === aid);
    if (num) return getW(num, "numId")!;
  }
  const aid = Math.max(-1, ...abs.map((a) => Number(getW(a, "abstractNumId") ?? -1))) + 1;
  const nid = Math.max(0, ...nums.map((n) => Number(getW(n, "numId") ?? 0))) + 1;
  const frag = parseXml(`<x xmlns:w="${W}">${abstractNum(aid, ordered)}<w:num w:numId="${nid}"><w:abstractNumId w:val="${aid}"/></w:num></x>`, "numbering");
  const [a, n] = children(frag.documentElement!, W) as Element[];
  // every abstractNum comes before every num (the schema's order)
  root.insertBefore(doc.importNode(a!, true), nums[0] ?? null);
  root.appendChild(doc.importNode(n!, true));
  parts.touch(path);
  return String(nid);
}

/** Whether a list (numId, level) is numbered or bullets; undefined when numbering.xml does not say. */
export function listOrdered(parts: Parts, numId: string, level: number): boolean | undefined {
  const path = parts.find("numbering");
  if (!path) return undefined;
  const root: Element = (parts.dom(path) as Document).documentElement!;
  const num = wkids(root, "num").find((n) => getW(n, "numId") === numId);
  const aidEl = num && wkid(num, "abstractNumId");
  if (!aidEl) return undefined;
  const aid = getW(aidEl, "val");
  const abs = wkids(root, "abstractNum").find((a) => getW(a, "abstractNumId") === aid);
  const lvl = abs && wkids(abs, "lvl").find((l) => getW(l, "ilvl") === String(level));
  const fmt = lvl && wkid(lvl, "numFmt");
  return fmt ? getW(fmt, "val") !== "bullet" && getW(fmt, "val") !== "none" : undefined;
}

/** The numIds numbering.xml defines. */
export function numIds(parts: Parts): Set<string> {
  const path = parts.find("numbering");
  if (!path) return new Set();
  return new Set(wkids(parts.dom(path).documentElement!, "num").map((n) => getW(n, "numId") ?? ""));
}

void attr;
