// The XML layer (@xmldom/xmldom): a part as a DOM, edited in place, written
// back with every element, attribute and namespace it did not touch.

import { DOMParser, XMLSerializer, type Document, type Element, type Node } from "@xmldom/xmldom";
import { OfficeError } from "./errors.ts";

export type { Document, Element, Node };

/** The namespaces the three formats share (the modules add their own). */
export const NS = {
  ct: "http://schemas.openxmlformats.org/package/2006/content-types",
  rel: "http://schemas.openxmlformats.org/package/2006/relationships",
  r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
  a: "http://schemas.openxmlformats.org/drawingml/2006/main",
  p: "http://schemas.openxmlformats.org/presentationml/2006/main",
  s: "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
  w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
  w14: "http://schemas.microsoft.com/office/word/2010/wordml",
} as const;

const DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

/** A part's text as a DOM; `part` names it in the error. */
export function parseXml(text: string, part: string): Document {
  let failed = "";
  let doc: Document | undefined;
  try {
    doc = new DOMParser({
      onError: (level, msg) => {
        if (level !== "warning" && !failed) failed = msg;
      },
    }).parseFromString(text, "application/xml");
  } catch (e) {
    // xmldom throws on a fatal error after it told onError
    failed ||= (e as Error).message;
  }
  if (failed || !doc?.documentElement) {
    throw new OfficeError("bad_xml", `${part} is not well-formed XML: ${failed || "no root element"}`);
  }
  return doc;
}

/** A DOM as a part's text, with the XML declaration Office writes. */
export function writeXml(doc: Document): string {
  const body = new XMLSerializer().serializeToString(doc).replace(/^<\?xml[^>]*\?>\s*/, "");
  return `${DECL}\n${body}`;
}

/** The element children of a node (no text, comments or PIs). */
export function children(node: Node, ns?: string, local?: string): Element[] {
  const out: Element[] = [];
  for (let c = node.firstChild; c; c = c.nextSibling) {
    if (c.nodeType !== 1) continue;
    const e = c as Element;
    if ((ns === undefined || e.namespaceURI === ns) && (local === undefined || e.localName === local)) out.push(e);
  }
  return out;
}

/** The first element child with that name, or undefined. */
export function child(node: Node, ns: string, local: string): Element | undefined {
  return children(node, ns, local)[0];
}

/** Every descendant element with that name, in document order. */
export function descendants(node: Node, ns: string, local: string): Element[] {
  const list = (node as Element | Document).getElementsByTagNameNS(ns, local);
  const out: Element[] = [];
  for (let i = 0; i < list.length; i++) out.push(list.item(i)!);
  return out;
}

/** An attribute in no namespace, or in `ns`; undefined when absent. */
export function attr(e: Element, name: string, ns?: string): string | undefined {
  const has = ns === undefined ? e.hasAttribute(name) : e.hasAttributeNS(ns, name);
  if (!has) return undefined;
  return ns === undefined ? e.getAttribute(name)! : e.getAttributeNS(ns, name)!;
}

/** The text of every descendant element named `local` in `ns` (a:t, w:t), joined. */
export function textOf(node: Node, ns: string, local = "t"): string {
  return descendants(node, ns, local)
    .map((t) => t.textContent ?? "")
    .join("");
}
