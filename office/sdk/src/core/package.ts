// An Office file opened at the package level: what every module starts
// from (its zip, its kind, its main part) and the checks they share.

import { brokenRels, detect, type FileKind } from "./opc.ts";
import type { Problem } from "./outline.ts";
import { parseXml } from "./xml.ts";
import { Zip } from "./zip.ts";

export type Package = { kind: FileKind; main: string; zip: Zip };

/** The bytes as a package; throws OfficeError (not_a_zip, not_office, bad_xml). */
export function openPackage(bytes: Uint8Array): Package {
  const zip = Zip.read(bytes);
  return { ...detect(zip), zip };
}

/** Which file these bytes are: "xlsx", "pptx", "docx", or null for anything else. */
export function kindOf(bytes: Uint8Array): FileKind | null {
  try {
    return openPackage(bytes).kind;
  } catch {
    return null;
  }
}

/** The problems of any package: a relationship to a missing part, an XML part that does not parse. */
export function checkPackage(zip: Zip): Problem[] {
  const out: Problem[] = [];
  for (const path of zip.list()) {
    if (!/\.(xml|rels)$/i.test(path)) continue;
    try {
      parseXml(zip.text(path) ?? "", path);
    } catch (e) {
      out.push({ code: "bad_xml", severity: "error", message: (e as Error).message });
    }
  }
  for (const { from, rel } of brokenRels(zip)) {
    out.push({ code: "broken_rel", severity: "error", message: `${from || "the package"} points at ${rel.target} (${rel.id}), which is not in the file` });
  }
  return out;
}
