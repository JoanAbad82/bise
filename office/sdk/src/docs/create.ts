// A new, empty docx, from XML written here by us (no file from Word or a
// library): the smallest package Word, Pages and Quick Look open, with our
// built-in styles. Content goes in through the same edits as an open file.

import { Zip } from "../core/zip.ts";
import { stylesXml } from "./styles.ts";
import { MC, W, W14 } from "./w.ts";

export type CreateOptions = {
  /** the document's title (docProps/core.xml) */
  title?: string;
  /** "A4" (default) or "letter" */
  size?: "A4" | "letter";
  /** who it is by, and who tracked changes and comments are by (default "bise") */
  author?: string;
  /** the clock for dates (tests set it) */
  now?: () => Date;
};

const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const PKG = "http://schemas.openxmlformats.org/package/2006/relationships";
const OD = "application/vnd.openxmlformats-officedocument";

function esc(s: string): string {
  return s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);
}

export function blank(opts: CreateOptions = {}): Uint8Array {
  const [w, h] = opts.size === "letter" ? [12240, 15840] : [11906, 16838];
  const when = (opts.now ?? (() => new Date()))().toISOString().replace(/\.\d{3}Z$/, "Z");
  const zip = Zip.empty();
  zip.set(
    "[Content_Types].xml",
    `${X}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>` +
      `<Override PartName="/word/document.xml" ContentType="${OD}.wordprocessingml.document.main+xml"/>` +
      `<Override PartName="/word/styles.xml" ContentType="${OD}.wordprocessingml.styles+xml"/>` +
      `<Override PartName="/word/settings.xml" ContentType="${OD}.wordprocessingml.settings+xml"/>` +
      `<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>` +
      `<Override PartName="/docProps/app.xml" ContentType="${OD}.extended-properties+xml"/></Types>`,
  );
  zip.set(
    "_rels/.rels",
    `${X}<Relationships xmlns="${PKG}"><Relationship Id="rId1" Type="${R}/officeDocument" Target="word/document.xml"/>` +
      `<Relationship Id="rId2" Type="${PKG}/metadata/core-properties" Target="docProps/core.xml"/>` +
      `<Relationship Id="rId3" Type="${R}/extended-properties" Target="docProps/app.xml"/></Relationships>`,
  );
  zip.set(
    "word/document.xml",
    `${X}<w:document xmlns:w="${W}" xmlns:r="${R}" xmlns:w14="${W14}" xmlns:mc="${MC}" mc:Ignorable="w14"><w:body>` +
      `<w:sectPr><w:pgSz w:w="${w}" w:h="${h}"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/><w:cols w:space="708"/></w:sectPr>` +
      `</w:body></w:document>`,
  );
  zip.set(
    "word/_rels/document.xml.rels",
    `${X}<Relationships xmlns="${PKG}"><Relationship Id="rId1" Type="${R}/styles" Target="styles.xml"/><Relationship Id="rId2" Type="${R}/settings" Target="settings.xml"/></Relationships>`,
  );
  zip.set("word/styles.xml", stylesXml());
  zip.set(
    "word/settings.xml",
    `${X}<w:settings xmlns:w="${W}"><w:defaultTabStop w:val="720"/><w:characterSpacingControl w:val="doNotCompress"/>` +
      `<w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`,
  );
  const author = esc(opts.author ?? "bise");
  zip.set(
    "docProps/core.xml",
    `${X}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">` +
      (opts.title ? `<dc:title>${esc(opts.title)}</dc:title>` : "") +
      `<dc:creator>${author}</dc:creator><cp:lastModifiedBy>${author}</cp:lastModifiedBy>` +
      `<dcterms:created xsi:type="dcterms:W3CDTF">${when}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${when}</dcterms:modified></cp:coreProperties>`,
  );
  zip.set(
    "docProps/app.xml",
    `${X}<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>bise</Application></Properties>`,
  );
  return zip.write();
}
