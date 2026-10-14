// The parts of an open deck as DOMs: parsed when first read, written back
// to the zip only when an edit touched them (a part never touched keeps
// its bytes). Relationships and content types are edited here, through
// the same cache, so what an edit reads is what it wrote.

import { resolve, relsPath } from "../core/opc.ts";
import { attr, children, NS, parseXml, writeXml, type Document, type Element } from "../core/xml.ts";
import type { Zip } from "../core/zip.ts";
import { OfficeError } from "../core/errors.ts";

export type Rel = { id: string; type: string; target: string; external: boolean; el: Element };

const RELS_EMPTY = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>';

export class Store {
  readonly zip: Zip;
  private docs = new Map<string, Document>();
  private dirty = new Set<string>();

  constructor(zip: Zip) {
    this.zip = zip;
  }

  has(path: string): boolean {
    return this.docs.has(path) || this.zip.has(path);
  }

  /** A part as a DOM; throws no_part when it is not in the file. */
  doc(path: string): Document {
    let d = this.docs.get(path);
    if (!d) {
      const text = this.zip.text(path);
      if (text === undefined) throw new OfficeError("no_part", `the deck has no ${path}`);
      d = parseXml(text, path);
      this.docs.set(path, d);
    }
    return d;
  }

  root(path: string): Element {
    return this.doc(path).documentElement!;
  }

  /** Mark a part changed: it is written on flush. */
  touch(path: string): void {
    this.dirty.add(path);
  }

  /** A new part from its XML text. */
  put(path: string, xml: string): void {
    this.docs.set(path, parseXml(xml, path));
    this.dirty.add(path);
  }

  /** A new binary part (an image). */
  putBytes(path: string, bytes: Uint8Array): void {
    this.docs.delete(path);
    this.dirty.delete(path);
    this.zip.set(path, bytes);
  }

  drop(path: string): void {
    this.docs.delete(path);
    this.dirty.delete(path);
    this.zip.remove(path);
  }

  /** Write every changed part into the zip. */
  flush(): void {
    for (const p of this.dirty) this.zip.set(p, writeXml(this.docs.get(p)!));
    this.dirty.clear();
  }

  // ---- relationships

  private relsDoc(part: string, make: boolean): Document | undefined {
    const p = relsPath(part);
    if (!this.has(p)) {
      if (!make) return undefined;
      this.put(p, RELS_EMPTY);
    }
    return this.doc(p);
  }

  /** The relationships of a part, targets resolved to part paths. */
  rels(part: string): Rel[] {
    const d = this.relsDoc(part, false);
    if (!d) return [];
    const base = part.slice(0, part.lastIndexOf("/") + 1);
    return children(d.documentElement!, NS.rel, "Relationship").map((el) => {
      const external = attr(el, "TargetMode") === "External";
      const raw = attr(el, "Target") ?? "";
      return { id: attr(el, "Id") ?? "", type: attr(el, "Type") ?? "", target: external ? raw : resolve(base, raw), external, el };
    });
  }

  rel(part: string, id: string): Rel | undefined {
    return this.rels(part).find((r) => r.id === id);
  }

  /** The first relationship of that type, its target part. */
  relTarget(part: string, type: string): string | undefined {
    return this.rels(part).find((r) => r.type === type && !r.external)?.target;
  }

  /** Add a relationship from `part` to the part `target` (both package paths); its new id. */
  addRel(part: string, type: string, target: string): string {
    const d = this.relsDoc(part, true)!;
    const root = d.documentElement!;
    const used = new Set(children(root, NS.rel, "Relationship").map((r) => attr(r, "Id")));
    let n = 1;
    while (used.has(`rId${n}`)) n++;
    const el = d.createElementNS(NS.rel, "Relationship");
    el.setAttribute("Id", `rId${n}`);
    el.setAttribute("Type", type);
    el.setAttribute("Target", relative(part, target));
    root.appendChild(el);
    this.touch(relsPath(part));
    return `rId${n}`;
  }

  removeRel(part: string, id: string): void {
    const r = this.rel(part, id);
    if (!r) return;
    r.el.parentNode!.removeChild(r.el);
    this.touch(relsPath(part));
  }

  // ---- content types

  /** Declare a part's content type (an override), or an extension's (a default). */
  contentType(opts: { part: string; type: string } | { ext: string; type: string }): void {
    const path = "[Content_Types].xml";
    const root = this.root(path);
    const ct = "http://schemas.openxmlformats.org/package/2006/content-types";
    if ("part" in opts) {
      const name = `/${opts.part}`;
      if (children(root, ct, "Override").some((o) => attr(o, "PartName") === name)) return;
      const el = root.ownerDocument!.createElementNS(ct, "Override");
      el.setAttribute("PartName", name);
      el.setAttribute("ContentType", opts.type);
      root.appendChild(el);
    } else {
      const ext = opts.ext.toLowerCase();
      if (children(root, ct, "Default").some((o) => (attr(o, "Extension") ?? "").toLowerCase() === ext)) return;
      const el = root.ownerDocument!.createElementNS(ct, "Default");
      el.setAttribute("Extension", ext);
      el.setAttribute("ContentType", opts.type);
      const first = children(root, ct, "Override")[0];
      if (first) root.insertBefore(el, first);
      else root.appendChild(el);
    }
    this.touch(path);
  }

  /** Forget a part's override (the part is gone). */
  dropContentType(part: string): void {
    const path = "[Content_Types].xml";
    const root = this.root(path);
    const ct = "http://schemas.openxmlformats.org/package/2006/content-types";
    for (const o of children(root, ct, "Override")) {
      if (attr(o, "PartName") === `/${part}`) {
        root.removeChild(o);
        this.touch(path);
      }
    }
  }

  /** The first free `<dir><stem>N.<ext>` path, N from 1. */
  freePath(dir: string, stem: string, ext: string): string {
    for (let n = 1; ; n++) {
      const p = `${dir}${stem}${n}.${ext}`;
      if (!this.has(p)) return p;
    }
  }
}

/** A relationship target: `target` relative to the folder of `from`. */
export function relative(from: string, target: string): string {
  const a = from.split("/").slice(0, -1);
  const b = target.split("/");
  let i = 0;
  while (i < a.length && i < b.length - 1 && a[i] === b[i]) i++;
  return [...a.slice(i).map(() => ".."), ...b.slice(i)].join("/");
}
