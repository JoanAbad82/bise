// The docx's parts as DOMs: parsed once, written back only when an edit
// touched them (a part never touched keeps its bytes), and the parts the
// module adds when missing (comments, numbering, styles), each with its
// content type and its relationship from word/document.xml.

import { OfficeError } from "../core/errors.ts";
import { rels, relsPath, resolve, type Rel } from "../core/opc.ts";
import { attr, children, NS, parseXml, writeXml, type Document, type Element } from "../core/xml.ts";
import type { Zip } from "../core/zip.ts";
import { MC, W, W14, XMLNS } from "./w.ts";

const RT = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

/** The parts the module knows: their relationship type and content type. */
export const KNOWN = {
  styles: { rel: `${RT}/styles`, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml", file: "styles.xml" },
  numbering: { rel: `${RT}/numbering`, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml", file: "numbering.xml" },
  comments: { rel: `${RT}/comments`, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml", file: "comments.xml" },
  commentsExtended: {
    rel: "http://schemas.microsoft.com/office/2011/relationships/commentsExtended",
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.commentsExtended+xml",
    file: "commentsExtended.xml",
  },
} as const;
export type KnownPart = keyof typeof KNOWN;

export class Parts {
  readonly zip: Zip;
  /** word/document.xml, or wherever the package points */
  readonly main: string;
  private doms = new Map<string, Document>();
  private dirty = new Set<string>();

  constructor(zip: Zip, main: string) {
    this.zip = zip;
    this.main = main;
  }

  /** A part's DOM, parsed once. */
  dom(path: string): Document {
    let d = this.doms.get(path);
    if (!d) {
      const text = this.zip.text(path);
      if (text === undefined) throw new OfficeError("no_part", `the docx has no ${path}`);
      d = parseXml(text, path);
      this.doms.set(path, d);
    }
    return d;
  }

  /** Mark a part as edited: save() writes it. */
  touch(path: string): void {
    this.dirty.add(path);
  }

  /** The main document's relationships. */
  rels(): Rel[] {
    return rels(this.zip, this.main);
  }

  /** Where a known part is (through the main part's relationship), or undefined. */
  find(kind: KnownPart): string | undefined {
    const r = this.rels().find((x) => x.type === KNOWN[kind].rel && !x.external);
    return r && this.zip.has(r.target) ? r.target : undefined;
  }

  /** A known part, made from `xml` with its content type and relationship when the file has none. */
  ensure(kind: KnownPart, xml: () => string): string {
    const have = this.find(kind);
    if (have) return have;
    const dir = this.main.slice(0, this.main.lastIndexOf("/") + 1);
    const path = `${dir}${KNOWN[kind].file}`;
    this.zip.set(path, xml());
    this.addOverride(path, KNOWN[kind].type);
    this.addRel(KNOWN[kind].rel, KNOWN[kind].file);
    return path;
  }

  /** A new relationship from the main part; returns its id. */
  addRel(type: string, target: string, external = false): string {
    const path = relsPath(this.main);
    if (!this.zip.has(path)) {
      this.zip.set(path, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="${NS.rel}"></Relationships>`);
    }
    const doc = this.dom(path);
    const root = doc.documentElement!;
    const taken = new Set(children(root, NS.rel, "Relationship").map((r) => attr(r, "Id")));
    let n = taken.size + 1;
    while (taken.has(`rId${n}`)) n++;
    const r = doc.createElementNS(NS.rel, "Relationship");
    r.setAttribute("Id", `rId${n}`);
    r.setAttribute("Type", type);
    r.setAttribute("Target", target);
    if (external) r.setAttribute("TargetMode", "External");
    root.appendChild(r);
    // written at once: rels() and find() read the zip
    this.zip.set(path, writeXml(doc));
    return `rId${n}`;
  }

  /** The target part of one of the main part's relationships. */
  target(rid: string): Rel | undefined {
    return this.rels().find((r) => r.id === rid);
  }

  addOverride(path: string, type: string): void {
    const ct = "[Content_Types].xml";
    const root = this.dom(ct).documentElement!;
    const name = `/${path.replace(/^\//, "")}`;
    if (children(root, NS.ct, "Override").some((o) => attr(o, "PartName") === name)) return;
    const o = this.dom(ct).createElementNS(NS.ct, "Override");
    o.setAttribute("PartName", name);
    o.setAttribute("ContentType", type);
    root.appendChild(o);
    this.touch(ct);
  }

  addDefault(ext: string, type: string): void {
    const ct = "[Content_Types].xml";
    const root = this.dom(ct).documentElement!;
    if (children(root, NS.ct, "Default").some((d) => (attr(d, "Extension") ?? "").toLowerCase() === ext)) return;
    const d = this.dom(ct).createElementNS(NS.ct, "Default");
    d.setAttribute("Extension", ext);
    d.setAttribute("ContentType", type);
    root.insertBefore(d, root.firstChild);
    this.touch(ct);
  }

  /** A free part path in the main part's folder: `media/image1.png`, ... */
  freePath(sub: string, stem: string, ext: string): string {
    const dir = this.main.slice(0, this.main.lastIndexOf("/") + 1);
    let n = 1;
    while (this.zip.has(`${dir}${sub}/${stem}${n}.${ext}`)) n++;
    return `${dir}${sub}/${stem}${n}.${ext}`;
  }

  /** The edited DOMs back into the zip. */
  flush(): void {
    for (const path of this.dirty) this.zip.set(path, writeXml(this.dom(path)));
    this.dirty.clear();
  }

  /** A path relative to the main part's folder, as a relationship target. */
  relTarget(path: string): string {
    const dir = this.main.slice(0, this.main.lastIndexOf("/") + 1);
    return path.startsWith(dir) ? path.slice(dir.length) : `/${path}`;
  }

  resolveFromMain(target: string): string {
    return resolve(this.main.slice(0, this.main.lastIndexOf("/") + 1), target);
  }
}

/**
 * The root may carry w14 attributes (paraId) only when it declares w14 and
 * lists it in mc:Ignorable: without that, Word says the file is corrupt.
 */
export function declareW14(root: Element): void {
  if (root.lookupNamespaceURI("w14") !== W14) root.setAttributeNS(XMLNS, "xmlns:w14", W14);
  if (root.lookupNamespaceURI("mc") !== MC) root.setAttributeNS(XMLNS, "xmlns:mc", MC);
  const ign = root.getAttributeNS(MC, "Ignorable") ?? "";
  const list = ign.split(/\s+/).filter(Boolean);
  if (!list.includes("w14")) root.setAttributeNS(MC, "mc:Ignorable", [...list, "w14"].join(" "));
  void W;
}
