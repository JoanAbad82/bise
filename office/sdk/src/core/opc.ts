// The OPC layer the three formats share: which file this is, its content
// types, and the relationships between its parts.

import { OfficeError } from "./errors.ts";
import { attr, children, NS, parseXml } from "./xml.ts";
import type { Zip } from "./zip.ts";

/** The file types the SDK reads. */
export type FileKind = "xlsx" | "pptx" | "docx";

const MAIN: Record<FileKind, string[]> = {
  xlsx: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml",
    "application/vnd.ms-excel.sheet.macroEnabled.main+xml",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml",
  ],
  pptx: [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml",
    "application/vnd.ms-powerpoint.presentation.macroEnabled.main+xml",
    "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml",
  ],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
    "application/vnd.ms-word.document.macroEnabled.main+xml",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml",
  ],
};

/** `[Content_Types].xml`: a part's type by override, else by its extension. */
export type ContentTypes = { defaults: Map<string, string>; overrides: Map<string, string> };

export function contentTypes(zip: Zip): ContentTypes {
  const text = zip.text("[Content_Types].xml");
  if (text === undefined) throw new OfficeError("not_office", "a zip with no [Content_Types].xml: not an xlsx, pptx or docx");
  const root = parseXml(text, "[Content_Types].xml").documentElement!;
  const defaults = new Map<string, string>();
  const overrides = new Map<string, string>();
  for (const d of children(root, NS.ct, "Default")) defaults.set((attr(d, "Extension") ?? "").toLowerCase(), attr(d, "ContentType") ?? "");
  for (const o of children(root, NS.ct, "Override")) overrides.set((attr(o, "PartName") ?? "").replace(/^\//, ""), attr(o, "ContentType") ?? "");
  return { defaults, overrides };
}

export function typeOf(ct: ContentTypes, part: string): string | undefined {
  const p = part.replace(/^\//, "");
  const ext = p.slice(p.lastIndexOf(".") + 1).toLowerCase();
  return ct.overrides.get(p) ?? ct.defaults.get(ext);
}

/** Which file this zip is, and its main part (`xl/workbook.xml`, ...). */
export function detect(zip: Zip): { kind: FileKind; main: string } {
  const ct = contentTypes(zip);
  const officeDoc = rels(zip, "").find((r) => r.type.endsWith("/officeDocument") && !r.external);
  const candidates = officeDoc ? [officeDoc.target] : [...ct.overrides.keys()];
  for (const part of candidates) {
    const t = typeOf(ct, part);
    for (const kind of Object.keys(MAIN) as FileKind[]) {
      if (t && MAIN[kind].includes(t)) return { kind, main: part };
    }
  }
  throw new OfficeError("not_office", "a zip, but not an xlsx, pptx or docx (no workbook, presentation or document part)");
}

/** One relationship of a part, its target resolved to a part path. */
export type Rel = { id: string; type: string; target: string; external: boolean };

/** The `_rels/<name>.rels` part of `part` (`""`: the package's own). */
export function relsPath(part: string): string {
  const p = part.replace(/^\//, "");
  const slash = p.lastIndexOf("/");
  return `${p.slice(0, slash + 1)}_rels/${p.slice(slash + 1)}.rels`;
}

/** The relationships of a part, targets as part paths (externals as they are). */
export function rels(zip: Zip, part: string): Rel[] {
  const path = relsPath(part);
  const text = zip.text(path);
  if (text === undefined) return [];
  const root = parseXml(text, path).documentElement!;
  const base = part.replace(/^\//, "").slice(0, part.lastIndexOf("/") + 1);
  return children(root, NS.rel, "Relationship").map((r) => {
    const external = attr(r, "TargetMode") === "External";
    const raw = attr(r, "Target") ?? "";
    return { id: attr(r, "Id") ?? "", type: attr(r, "Type") ?? "", target: external ? raw : resolve(base, raw), external };
  });
}

/** A relationship target against the folder of its source part. */
export function resolve(base: string, target: string): string {
  if (target.startsWith("/")) return target.slice(1);
  const out = base.split("/").filter(Boolean);
  for (const seg of target.split("/")) {
    if (seg === "..") out.pop();
    else if (seg !== "." && seg !== "") out.push(seg);
  }
  return out.join("/");
}

/** The relationships whose internal target is not a part of the zip. */
export function brokenRels(zip: Zip): { from: string; rel: Rel }[] {
  const out: { from: string; rel: Rel }[] = [];
  for (const path of zip.list()) {
    const m = /^(.*?)_rels\/([^/]*)\.rels$/.exec(path);
    if (!m) continue;
    const from = `${m[1]}${m[2]}`;
    for (const rel of rels(zip, from)) {
      if (!rel.external && !zip.has(rel.target)) out.push({ from, rel });
    }
  }
  return out;
}
