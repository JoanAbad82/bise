// WordprocessingML helpers: the namespaces, making `w:` elements, and
// setting a property child in the schema's order (Word refuses a file whose
// rPr or pPr children are out of order).

import { child, children, NS, type Document, type Element, type Node } from "../core/xml.ts";

export const W = NS.w;
export const W14 = NS.w14;
export const W15 = "http://schemas.microsoft.com/office/word/2012/wordml";
export const R = NS.r;
export const MC = "http://schemas.openxmlformats.org/markup-compatibility/2006";
export const XMLNS = "http://www.w3.org/2000/xmlns/";
export const XML = "http://www.w3.org/XML/1998/namespace";
export const WP = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing";
export const A = NS.a;
export const PIC = "http://schemas.openxmlformats.org/drawingml/2006/picture";

/** A `w:` element (or another namespace's, with its prefix). */
export function el(doc: Document, local: string, attrs: Record<string, string> = {}, ns: string = W, prefix = "w"): Element {
  const e = doc.createElementNS(ns, `${prefix}:${local}`);
  for (const [k, v] of Object.entries(attrs)) setW(e, k, v);
  return e;
}

/** A `w:` attribute, undefined when absent. */
export function getW(e: Element, local: string): string | undefined {
  return e.hasAttributeNS(W, local) ? e.getAttributeNS(W, local)! : undefined;
}

export function setW(e: Element, local: string, value: string): void {
  e.setAttributeNS(W, `w:${local}`, value);
}

export function isW(n: Node | null | undefined, local?: string): n is Element {
  return !!n && n.nodeType === 1 && (n as Element).namespaceURI === W && (local === undefined || (n as Element).localName === local);
}

export function wkids(node: Node, local?: string): Element[] {
  return children(node, W, local);
}

export function wkid(node: Node, local: string): Element | undefined {
  return child(node, W, local);
}

/** `w:t`-like text: xml:space="preserve" so Word keeps its spaces. */
export function textEl(doc: Document, local: "t" | "delText" | "instrText" | "delInstrText", text: string): Element {
  const t = el(doc, local);
  t.setAttributeNS(XML, "xml:space", "preserve");
  t.appendChild(doc.createTextNode(text));
  return t;
}

// the schema's order of a run's and a paragraph's property children
const RPR = "rStyle rFonts b bCs i iCs caps smallCaps strike dstrike outline shadow emboss imprint noProof snapToGrid vanish webHidden color spacing w kern position sz szCs highlight u effect bdr shd fitText vertAlign rtl cs em lang eastAsianLayout specVanish oMath ins del moveFrom moveTo rPrChange".split(" ");
const PPR = "pStyle keepNext keepLines pageBreakBefore framePr widowControl numPr suppressLineNumbers pBdr shd tabs suppressAutoHyphens kinsoku wordWrap overflowPunct topLinePunct autoSpaceDE autoSpaceDN bidi adjustRightInd snapToGrid spacing ind contextualSpacing mirrorIndents suppressOverlap jc textDirection textAlignment textboxTightWrap outlineLvl divId cnfStyle rPr sectPr pPrChange".split(" ");
const TRPR = "cnfStyle divId gridBefore gridAfter wBefore wAfter cantSplit trHeight tblHeader tblCellSpacing jc hidden ins del trPrChange".split(" ");
const ORDER: Record<string, string[]> = { rPr: RPR, pPr: PPR, trPr: TRPR };

/** Put `kid` in a property element (rPr, pPr, trPr), replacing one of the same name, in schema order. */
export function setProp(props: Element, kid: Element): Element {
  const order = ORDER[props.localName ?? ""] ?? [];
  const old = wkid(props, kid.localName ?? "");
  if (old) {
    props.replaceChild(kid, old);
    return kid;
  }
  const rank = order.indexOf(kid.localName ?? "");
  const after = wkids(props).find((c) => order.indexOf(c.localName ?? "") > rank);
  props.insertBefore(kid, after ?? null);
  return kid;
}

export function removeProp(props: Element, local: string): void {
  const old = wkid(props, local);
  if (old) props.removeChild(old);
}

/** The property element (`pPr` of a p, `rPr` of an r, `trPr` of a tr), made first child when missing. */
export function props(owner: Element, local: "pPr" | "rPr" | "trPr" | "tcPr" | "tblPr"): Element {
  const have = wkid(owner, local);
  if (have) return have;
  const made = el(owner.ownerDocument!, local);
  owner.insertBefore(made, owner.firstChild);
  return made;
}

/** Move a node's children before it, then remove it (accept an insertion, drop a hyperlink). */
export function unwrap(e: Element): void {
  const parent = e.parentNode!;
  while (e.firstChild) parent.insertBefore(e.firstChild, e);
  parent.removeChild(e);
}

export function remove(n: Node): void {
  n.parentNode?.removeChild(n);
}

export function insertAfter(n: Node, ref: Node): void {
  ref.parentNode!.insertBefore(n, ref.nextSibling);
}

/** A date as Word writes it in w:date (seconds, no milliseconds). */
export function wordDate(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}
