// An open deck: its slides in order (p:sldIdLst), their parts, and the
// slide-level edits (add from a layout, remove, move, duplicate). The
// shape-level edits are in ops.ts, the problems in check.ts, the outline
// in outline.ts. Every edit goes through the Store, so a part never
// touched is saved with the bytes it came with.

import { OfficeError } from "../core/errors.ts";
import { openPackage } from "../core/package.ts";
import { attr, child, children, descendants, type Element } from "../core/xml.ts";
import { Zip } from "../core/zip.ts";
import { brokenRels, rels as zipRels } from "../core/opc.ts";
import { esc } from "./units.ts";
import { chartWorkbook, type ChartInput } from "./chart.ts";
import { frag, insertBefore, int, path, PNS, REL } from "./dom.ts";
import { ctxOf, layoutPlaceholders, slideSize, type Ctx } from "./inherit.ts";
import { cNvPr } from "./read.ts";
import { Store } from "./store.ts";
import { LAYOUT_TYPE, LAYOUTS, newDeck, type SlideSize } from "./template.ts";

const { a: A, p: P, r: R } = PNS;
const CT_SLIDE = "application/vnd.openxmlformats-officedocument.presentationml.slide+xml";
const CT_CHART = "application/vnd.openxmlformats-officedocument.drawingml.chart+xml";

/** One slide of the deck, by its stable id. */
export type SlideRef = { sldId: number; rid: string; part: string; index: number };

/** A layout a slide can be added on. */
export type LayoutInfo = { name: string; type?: string; key?: string; part: string };

export class DeckCore {
  readonly store: Store;
  readonly pres: string;
  /** The embedded workbooks of new charts, written at save (by path: an empty placeholder until then). */
  readonly workbooks = new Map<string, ChartInput>();

  constructor(store: Store, pres: string) {
    this.store = store;
    this.pres = pres;
  }

  static open(bytes: Uint8Array): DeckCore {
    const pkg = openPackage(bytes);
    if (pkg.kind !== "pptx") throw new OfficeError("not_office", `this is a ${pkg.kind}, not a pptx: open it with the ${pkg.kind === "xlsx" ? "sheets" : "docs"} module`);
    return new DeckCore(new Store(pkg.zip), pkg.main);
  }

  static create(size: SlideSize): DeckCore {
    const zip = Zip.empty();
    for (const [p, xml] of newDeck(size)) zip.set(p, xml);
    return new DeckCore(new Store(zip), "ppt/presentation.xml");
  }

  /** The slide size in EMU. */
  size(): { w: number; h: number } {
    return slideSize(this.store, this.pres);
  }

  // ---- slides

  private idList(make = false): Element | undefined {
    const root = this.store.root(this.pres);
    const lst = child(root, P, "sldIdLst");
    if (lst || !make) return lst;
    const el = root.ownerDocument!.createElementNS(P, "p:sldIdLst");
    return insertBefore(root, el, [[P, "sldSz"], [P, "notesSz"], [P, "smartTags"], [P, "embeddedFontLst"], [P, "custShowLst"], [P, "photoAlbum"], [P, "custDataLst"], [P, "kinsoku"], [P, "defaultTextStyle"], [P, "modifyVerifier"], [P, "extLst"]]);
  }

  slides(): SlideRef[] {
    const lst = this.idList();
    if (!lst) return [];
    const out: SlideRef[] = [];
    for (const el of children(lst, P, "sldId")) {
      const rid = attr(el, "id", R) ?? "";
      const rel = this.store.rel(this.pres, rid);
      if (!rel || rel.external) continue;
      out.push({ sldId: int(el, "id") ?? 0, rid, part: rel.target, index: out.length + 1 });
    }
    return out;
  }

  /** The slide at `n` (from 1); throws not_found with the count. */
  slideAt(n: number): SlideRef {
    const all = this.slides();
    if (!Number.isInteger(n) || n < 1 || n > all.length) {
      throw new OfficeError("not_found", `there is no slide ${n}: the deck has ${all.length} slide${all.length === 1 ? "" : "s"}${all.length ? ` (1 to ${all.length})` : ""}`);
    }
    return all[n - 1];
  }

  /** The slide with that stable id; throws not_found when it was removed. */
  slideById(sldId: number): SlideRef {
    const s = this.slides().find((x) => x.sldId === sldId);
    if (!s) throw new OfficeError("not_found", `that slide is no longer in the deck (it was removed)`);
    return s;
  }

  ctx(s: SlideRef): Ctx {
    return ctxOf(this.store, this.pres, s.part);
  }

  /** The layouts of every master, in order. */
  layouts(): LayoutInfo[] {
    const out: LayoutInfo[] = [];
    const masters = children(child(this.store.root(this.pres), P, "sldMasterIdLst") ?? this.store.root(this.pres), P, "sldMasterId")
      .map((m) => this.store.rel(this.pres, attr(m, "id", R) ?? ""))
      .filter((r) => r && !r.external)
      .map((r) => r!.target);
    for (const m of masters) {
      const ids = children(child(this.store.root(m), P, "sldLayoutIdLst") ?? this.store.root(m), P, "sldLayoutId");
      for (const l of ids) {
        const rel = this.store.rel(m, attr(l, "id", R) ?? "");
        if (!rel || rel.external || !this.store.has(rel.target)) continue;
        const root = this.store.root(rel.target);
        const type = attr(root, "type");
        const name = attr(child(root, P, "cSld") ?? root, "name") ?? LAYOUTS.find((x) => x.type === type)?.name ?? rel.target;
        out.push({ name, type, key: LAYOUTS.find((x) => x.type === type)?.key, part: rel.target });
      }
    }
    return out;
  }

  /** A layout by key ("title-body"), by name ("Title and Content"), or by its number in layouts(). */
  layout(want: string | number | undefined): LayoutInfo {
    const all = this.layouts();
    if (!all.length) throw new OfficeError("no_part", "the deck has no slide layout to add a slide on");
    const list = () => all.map((l, i) => `${i + 1}. ${l.key ? `${l.key} ` : ""}"${l.name}"`).join(", ");
    if (want === undefined) return all.find((l) => l.type === "obj") ?? all.find((l) => l.type !== "title") ?? all[0];
    if (typeof want === "number") {
      if (all[want - 1]) return all[want - 1];
    } else {
      const w = want.toLowerCase();
      const hit = all.find((l) => l.key === w) ?? all.find((l) => l.type && l.type === LAYOUT_TYPE[w]) ?? all.find((l) => l.name.toLowerCase() === w);
      if (hit) return hit;
    }
    throw new OfficeError("not_found", `no layout ${JSON.stringify(want)} in this deck; it has: ${list()}`);
  }

  /** Add a slide on a layout, with the layout's placeholders (empty) on it, at position `at` (default: last). */
  addSlide(opts: { layout?: string | number; at?: number } = {}): SlideRef {
    const layout = this.layout(opts.layout);
    const count = this.slides().length;
    const at = opts.at ?? count + 1;
    if (!Number.isInteger(at) || at < 1 || at > count + 1) throw new OfficeError("bad_arg", `at is a slide position from 1 to ${count + 1}, got ${JSON.stringify(opts.at)}`);
    const part = this.store.freePath("ppt/slides/", "slide", "xml");
    let id = 1;
    const phs = layoutPlaceholders(this.store, layout.part)
      .map((el) => {
        const ph = path(el, [P, "nvSpPr"], [P, "nvPr"], [P, "ph"]);
        if (!ph) return "";
        const attrs = ["type", "orient", "sz", "idx", "hasCustomPrompt"]
          .filter((n) => ph.hasAttribute(n) && n !== "hasCustomPrompt")
          .map((n) => ` ${n}="${esc(ph.getAttribute(n)!)}"`)
          .join("");
        const name = attr(cNvPr(el) ?? el, "name") ?? "Placeholder";
        id++;
        return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${esc(name)}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph${attrs}/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="en-US"/></a:p></p:txBody></p:sp>`;
      })
      .join("");
    this.store.put(
      part,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:sld xmlns:a="${A}" xmlns:r="${R}" xmlns:p="${P}"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${phs}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`,
    );
    this.store.addRel(part, REL.slideLayout, layout.part);
    this.store.contentType({ part, type: CT_SLIDE });
    return this.insertSlide(part, at);
  }

  /** Put a slide part in the deck's list at `at`. */
  private insertSlide(part: string, at: number): SlideRef {
    const rid = this.store.addRel(this.pres, REL.slide, part);
    const lst = this.idList(true)!;
    const used = children(lst, P, "sldId").map((e) => int(e, "id") ?? 0);
    const sldId = Math.max(255, ...used) + 1;
    const el = frag(this.store.doc(this.pres), `<p:sldId id="${sldId}" r:id="${rid}"/>`);
    const before = children(lst, P, "sldId")[at - 1];
    if (before) lst.insertBefore(el, before);
    else lst.appendChild(el);
    this.store.touch(this.pres);
    return this.slideById(sldId);
  }

  removeSlide(s: SlideRef): void {
    const lst = this.idList()!;
    const el = children(lst, P, "sldId").find((e) => int(e, "id") === s.sldId);
    if (el) lst.removeChild(el);
    this.store.removeRel(this.pres, s.rid);
    this.store.touch(this.pres);
    const notes = this.store.relTarget(s.part, REL.notesSlide);
    for (const p of [s.part, notes].filter((x): x is string => !!x)) this.dropPart(p);
  }

  /** Move a slide to position `to` (from 1). */
  moveSlide(s: SlideRef, to: number): SlideRef {
    const lst = this.idList()!;
    const els = children(lst, P, "sldId");
    if (!Number.isInteger(to) || to < 1 || to > els.length) throw new OfficeError("bad_arg", `a slide moves to a position from 1 to ${els.length}, got ${JSON.stringify(to)}`);
    const el = els.find((e) => int(e, "id") === s.sldId)!;
    lst.removeChild(el);
    const rest = children(lst, P, "sldId");
    if (rest[to - 1]) lst.insertBefore(el, rest[to - 1]);
    else lst.appendChild(el);
    this.store.touch(this.pres);
    return this.slideById(s.sldId);
  }

  /** A copy of a slide right after it: its shapes, images (shared) and charts (copied); not its notes. */
  duplicateSlide(s: SlideRef): SlideRef {
    this.store.flush();
    const part = this.store.freePath("ppt/slides/", "slide", "xml");
    this.store.put(part, this.store.zip.text(s.part)!);
    const doc = this.store.doc(part);
    const remap = new Map<string, string>();
    for (const rel of this.store.rels(s.part)) {
      if (rel.type === REL.notesSlide) continue;
      if (rel.external) {
        remap.set(rel.id, this.addExternalRel(part, rel.type, rel.target));
        continue;
      }
      let target = rel.target;
      if (rel.type === REL.chart && this.store.has(rel.target)) {
        target = this.store.freePath("ppt/charts/", "chart", "xml");
        this.store.put(target, this.store.zip.text(rel.target)!);
        this.store.contentType({ part: target, type: CT_CHART });
        // the chart's own relationships (its workbook: copied too, so the two charts' data stay apart)
        const chartDoc = this.store.doc(target);
        const ids = new Map<string, string>();
        for (const cr of this.store.rels(rel.target)) {
          if (cr.external) ids.set(cr.id, this.addExternalRel(target, cr.type, cr.target));
          else if (cr.type === REL.package && this.store.has(cr.target)) {
            const ext = cr.target.slice(cr.target.lastIndexOf(".") + 1);
            const copy = this.store.freePath("ppt/embeddings/", "Microsoft_Excel_Worksheet", ext);
            this.store.putBytes(copy, this.store.zip.bytes(cr.target)!);
            const waiting = this.workbooks.get(cr.target);
            if (waiting) this.workbooks.set(copy, waiting);
            ids.set(cr.id, this.store.addRel(target, cr.type, copy));
          } else ids.set(cr.id, this.store.addRel(target, cr.type, cr.target));
        }
        remapRels(chartDoc.documentElement!, ids);
        this.store.touch(target);
      }
      remap.set(rel.id, this.store.addRel(part, rel.type, target));
    }
    // the copy's relationship ids may differ: point its r:* attributes at them
    remapRels(doc.documentElement!, remap);
    this.store.contentType({ part, type: CT_SLIDE });
    return this.insertSlide(part, s.index + 1);
  }

  private addExternalRel(part: string, type: string, target: string): string {
    const id = this.store.addRel(part, type, "x");
    const rel = this.store.rel(part, id)!;
    rel.el.setAttribute("Target", target);
    rel.el.setAttribute("TargetMode", "External");
    return id;
  }

  /** Remove a part with its relationships part and content type. */
  dropPart(part: string): void {
    const relsPart = part.replace(/([^/]*)$/, "_rels/$1.rels");
    this.store.drop(part);
    this.store.drop(relsPart);
    this.store.dropContentType(part);
  }

  /** Media, charts and their workbooks that nothing points at any more (after a slide or a shape went). */
  private collect(): void {
    for (;;) {
      this.store.flush();
      const zip = this.store.zip;
      const targeted = new Set<string>();
      for (const p of zip.list()) {
        const m = /^(.*?)_rels\/([^/]*)\.rels$/.exec(p);
        if (!m) continue;
        for (const r of zipRels(zip, `${m[1]}${m[2]}`)) if (!r.external) targeted.add(r.target);
      }
      const orphans = zip.list().filter((p) => /^ppt\/(media|charts|embeddings|notesSlides)\/[^/]+$/.test(p) && !targeted.has(p));
      if (!orphans.length) return;
      for (const p of orphans) this.dropPart(p);
    }
  }

  /** The deck's bytes, with the workbooks of the charts added since the last save. */
  async save(): Promise<Uint8Array> {
    this.collect();
    for (const [path, data] of this.workbooks) {
      if (this.store.zip.has(path)) this.store.putBytes(path, await chartWorkbook(data));
    }
    this.workbooks.clear();
    this.store.flush();
    return this.store.zip.write();
  }

  /** The relationships that point at a missing part (after a flush). */
  broken(): { from: string; target: string; id: string }[] {
    this.store.flush();
    return brokenRels(this.store.zip).map(({ from, rel }) => ({ from, target: rel.target, id: rel.id }));
  }

  /** The highest shape id on a slide, + 1. */
  nextId(s: SlideRef): number {
    let max = 1;
    for (const el of descendants(this.store.doc(s.part), P, "cNvPr")) max = Math.max(max, int(el, "id") ?? 0);
    return max + 1;
  }

  /** The shape element with that id on the slide (in groups too). */
  shapeEl(s: SlideRef, id: string): Element | undefined {
    for (const el of descendants(this.store.doc(s.part), P, "cNvPr")) {
      if (attr(el, "id") !== id) continue;
      const shape = el.parentNode?.parentNode as Element | undefined;
      // the tree's own nvGrpSpPr (id 1) is not a shape
      if (shape && shape.localName !== "spTree") return shape;
    }
    return undefined;
  }
}

/** Point every r:* attribute under `root` at its new relationship id. */
function remapRels(root: Element, ids: Map<string, string>): void {
  for (const el of [root, ...descendants(root, "*", "*")]) {
    for (let i = 0; i < el.attributes.length; i++) {
      const a = el.attributes.item(i)!;
      if (a.namespaceURI === R && ids.has(a.value)) a.value = ids.get(a.value)!;
    }
  }
}
