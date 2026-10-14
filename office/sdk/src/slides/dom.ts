// DOM helpers of the slides module, on the core's XML layer: the
// namespaces of PresentationML and DrawingML charts, new elements made from
// a fragment of XML text (so the XML a shape is written with reads like
// the file), and the small walks every part of the module needs.

import { child, children, NS, parseXml, type Document, type Element } from "../core/xml.ts";

export const PNS = {
  ...NS,
  c: "http://schemas.openxmlformats.org/drawingml/2006/chart",
  pic: "http://schemas.openxmlformats.org/drawingml/2006/picture",
  dgm: "http://schemas.openxmlformats.org/drawingml/2006/diagram",
  mc: "http://schemas.openxmlformats.org/markup-compatibility/2006",
} as const;

export const REL = {
  slide: `${NS.r}/slide`,
  slideLayout: `${NS.r}/slideLayout`,
  slideMaster: `${NS.r}/slideMaster`,
  theme: `${NS.r}/theme`,
  image: `${NS.r}/image`,
  chart: `${NS.r}/chart`,
  notesSlide: `${NS.r}/notesSlide`,
  package: `${NS.r}/package`,
} as const;

const DECLS = `xmlns:a="${PNS.a}" xmlns:p="${PNS.p}" xmlns:r="${PNS.r}" xmlns:c="${PNS.c}" xmlns:pic="${PNS.pic}"`;

/** One element, from XML text with the a:, p:, r:, c: and pic: prefixes, owned by `doc`. */
export function frag(doc: Document, xml: string): Element {
  const wrap = parseXml(`<w ${DECLS}>${xml}</w>`, "a new element");
  const el = children(wrap.documentElement!)[0];
  if (!el) throw new Error(`frag: no element in ${xml.slice(0, 60)}`);
  return doc.importNode(el, true);
}

/** The first element at the end of a path of (namespace, local name) steps. */
export function path(el: Element | undefined, ...steps: [string, string][]): Element | undefined {
  let cur = el;
  for (const [ns, local] of steps) {
    if (!cur) return undefined;
    cur = child(cur, ns, local);
  }
  return cur;
}

/** An integer attribute, or undefined. */
export function int(el: Element | undefined, name: string): number | undefined {
  if (!el || !el.hasAttribute(name)) return undefined;
  const n = Number.parseInt(el.getAttribute(name)!, 10);
  return Number.isFinite(n) ? n : undefined;
}

/** Insert `el` as `parent`'s child before its first child named in `before` (ns, local), else at the end. */
export function insertBefore(parent: Element, el: Element, before: [string, string][]): Element {
  for (let c = parent.firstChild; c; c = c.nextSibling) {
    if (c.nodeType !== 1) continue;
    const e = c as Element;
    if (before.some(([ns, l]) => e.namespaceURI === ns && e.localName === l)) {
      parent.insertBefore(el, e);
      return el;
    }
  }
  parent.appendChild(el);
  return el;
}

/** `parent`'s child (ns, local), made (before the names in `before`) when missing. */
export function ensure(parent: Element, ns: string, qname: string, before: [string, string][] = []): Element {
  const local = qname.slice(qname.indexOf(":") + 1);
  return child(parent, ns, local) ?? insertBefore(parent, parent.ownerDocument!.createElementNS(ns, qname), before);
}

/** An element's local name ("" for none: xmldom types it nullable). */
export const ln = (e: Element): string => e.localName ?? "";

export function remove(el: Element | undefined): void {
  el?.parentNode?.removeChild(el);
}
