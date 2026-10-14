// Makes the SDK's fixtures, from XML written here by us (no file from
// Office, a template or the web): tiny.xlsx, tiny.pptx, tiny.docx, each
// the smallest file Excel, PowerPoint or Word opens, plus one part the SDK
// does not know (a custom XML part with a relationship), so the tests
// prove edits keep it. Same bytes every run (fixed zip dates).
//
//   node office/fixtures/make.mjs     (after pnpm -C office/sdk build)

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { core } from "../dist/office.js";

const here = dirname(fileURLToPath(import.meta.url));
const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const PKG_R = "http://schemas.openxmlformats.org/package/2006/relationships";
const CT = "http://schemas.openxmlformats.org/package/2006/content-types";

function rels(list) {
  const rows = list.map(([id, type, target]) => `<Relationship Id="${id}" Type="${R}/${type}" Target="${target}"/>`).join("");
  return `${X}<Relationships xmlns="${PKG_R}">${rows}</Relationships>`;
}

function types(overrides) {
  const rows = overrides.map(([part, type]) => `<Override PartName="/${part}" ContentType="application/vnd.openxmlformats-officedocument.${type}"/>`).join("");
  return `${X}<Types xmlns="${CT}"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${rows}</Types>`;
}

// the part no module knows: a custom XML part, kept byte for byte
const CUSTOM = `${X}<bise:fixture xmlns:bise="urn:bise:fixture" made="by office/fixtures/make.mjs"><bise:keep>keep me</bise:keep></bise:fixture>`;

function write(name, parts) {
  const zip = core.Zip.empty();
  for (const [path, text] of parts) zip.set(path, text);
  writeFileSync(join(here, name), zip.write());
  console.log(`wrote office/fixtures/${name}`);
}

// ---- tiny.xlsx: one sheet "Q3", a header row, numbers, a formula with its cached value
write("tiny.xlsx", [
  ["[Content_Types].xml", types([
    ["xl/workbook.xml", "spreadsheetml.sheet.main+xml"],
    ["xl/worksheets/sheet1.xml", "spreadsheetml.worksheet+xml"],
    ["xl/styles.xml", "spreadsheetml.styles+xml"],
  ])],
  ["_rels/.rels", rels([["rId1", "officeDocument", "xl/workbook.xml"]])],
  ["xl/workbook.xml", `${X}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="${R}"><sheets><sheet name="Q3" sheetId="1" r:id="rId1"/></sheets></workbook>`],
  ["xl/_rels/workbook.xml.rels", rels([["rId1", "worksheet", "worksheets/sheet1.xml"], ["rId2", "styles", "styles.xml"], ["rId3", "customXml", "../customXml/item1.xml"]])],
  ["xl/styles.xml", `${X}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`],
  ["xl/worksheets/sheet1.xml", `${X}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>` +
    `<row r="1"><c r="A1" s="1" t="inlineStr"><is><t>Region</t></is></c><c r="B1" s="1" t="inlineStr"><is><t>Revenue</t></is></c></row>` +
    `<row r="2"><c r="A2" t="inlineStr"><is><t>North</t></is></c><c r="B2"><v>120</v></c></row>` +
    `<row r="3"><c r="A3" t="inlineStr"><is><t>South</t></is></c><c r="B3"><v>80</v></c></row>` +
    `<row r="4"><c r="A4" s="1" t="inlineStr"><is><t>Total</t></is></c><c r="B4" s="1"><f>SUM(B2:B3)</f><v>200</v></c></row>` +
    `</sheetData></worksheet>`],
  ["customXml/item1.xml", CUSTOM],
]);

// ---- tiny.pptx: 16:9, one master, one layout, one theme, two slides
const P = "http://schemas.openxmlformats.org/presentationml/2006/main";
const A = "http://schemas.openxmlformats.org/drawingml/2006/main";
const NSP = `xmlns:a="${A}" xmlns:r="${R}" xmlns:p="${P}"`;
const tree = (shapes) =>
  `<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${shapes}</p:spTree></p:cSld>`;
const box = (id, name, x, y, cx, cy, text) =>
  `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${name}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr wrap="square"/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="2400"/><a:t>${text}</a:t></a:r></a:p></p:txBody></p:sp>`;
const theme = `${X}<a:theme xmlns:a="${A}" name="bise"><a:themeElements><a:clrScheme name="bise"><a:dk1><a:srgbClr val="000000"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="1F2328"/></a:dk2><a:lt2><a:srgbClr val="F6F8FA"/></a:lt2><a:accent1><a:srgbClr val="4472C4"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="bise"><a:majorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="bise"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`;
const clrMap = `<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>`;
write("tiny.pptx", [
  ["[Content_Types].xml", types([
    ["ppt/presentation.xml", "presentationml.presentation.main+xml"],
    ["ppt/slideMasters/slideMaster1.xml", "presentationml.slideMaster+xml"],
    ["ppt/slideLayouts/slideLayout1.xml", "presentationml.slideLayout+xml"],
    ["ppt/slides/slide1.xml", "presentationml.slide+xml"],
    ["ppt/slides/slide2.xml", "presentationml.slide+xml"],
    ["ppt/theme/theme1.xml", "theme+xml"],
  ])],
  ["_rels/.rels", rels([["rId1", "officeDocument", "ppt/presentation.xml"]])],
  ["ppt/presentation.xml", `${X}<p:presentation ${NSP}><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst><p:sldId id="256" r:id="rId2"/><p:sldId id="257" r:id="rId3"/></p:sldIdLst><p:sldSz cx="12192000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`],
  ["ppt/_rels/presentation.xml.rels", rels([["rId1", "slideMaster", "slideMasters/slideMaster1.xml"], ["rId2", "slide", "slides/slide1.xml"], ["rId3", "slide", "slides/slide2.xml"], ["rId4", "theme", "theme/theme1.xml"], ["rId5", "customXml", "../customXml/item1.xml"]])],
  ["ppt/slideMasters/slideMaster1.xml", `${X}<p:sldMaster ${NSP}>${tree("")}${clrMap}<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst></p:sldMaster>`],
  ["ppt/slideMasters/_rels/slideMaster1.xml.rels", rels([["rId1", "slideLayout", "../slideLayouts/slideLayout1.xml"], ["rId2", "theme", "../theme/theme1.xml"]])],
  ["ppt/slideLayouts/slideLayout1.xml", `${X}<p:sldLayout ${NSP} type="blank">${tree("")}<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`],
  ["ppt/slideLayouts/_rels/slideLayout1.xml.rels", rels([["rId1", "slideMaster", "../slideMasters/slideMaster1.xml"]])],
  ["ppt/theme/theme1.xml", theme],
  ["ppt/slides/slide1.xml", `${X}<p:sld ${NSP}>${tree(box(2, "Title", 609600, 457200, 10972800, 1143000, "Q3 review") + box(3, "Body", 609600, 1828800, 10972800, 3657600, "Revenue up 4%"))}<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`],
  ["ppt/slides/_rels/slide1.xml.rels", rels([["rId1", "slideLayout", "../slideLayouts/slideLayout1.xml"]])],
  ["ppt/slides/slide2.xml", `${X}<p:sld ${NSP}>${tree(box(2, "Title", 609600, 457200, 10972800, 1143000, "Next steps"))}<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`],
  ["ppt/slides/_rels/slide2.xml.rels", rels([["rId1", "slideLayout", "../slideLayouts/slideLayout1.xml"]])],
  ["customXml/item1.xml", CUSTOM],
]);

// ---- tiny.docx: a heading, two paragraphs with paraIds, a table
const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const W14 = "http://schemas.microsoft.com/office/word/2010/wordml";
const para = (id, text, style) =>
  `<w:p w14:paraId="${id}" w14:textId="77777777">${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ""}<w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
const cell = (id, text) => `<w:tc><w:tcPr><w:tcW w:w="4500" w:type="dxa"/></w:tcPr>${para(id, text)}</w:tc>`;
write("tiny.docx", [
  ["[Content_Types].xml", types([
    ["word/document.xml", "wordprocessingml.document.main+xml"],
    ["word/styles.xml", "wordprocessingml.styles+xml"],
  ])],
  ["_rels/.rels", rels([["rId1", "officeDocument", "word/document.xml"]])],
  ["word/document.xml", `${X}<w:document xmlns:w="${W}" xmlns:w14="${W14}" xmlns:r="${R}" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="w14"><w:body>` +
    para("10000001", "Q3 review", "Heading1") +
    para("10000002", "Net revenue grew 4% on the quarter.") +
    `<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/></w:tblPr><w:tblGrid><w:gridCol w:w="4500"/><w:gridCol w:w="4500"/></w:tblGrid>` +
    `<w:tr>${cell("10000003", "Region")}${cell("10000004", "Revenue")}</w:tr><w:tr>${cell("10000005", "North")}${cell("10000006", "120")}</w:tr></w:tbl>` +
    para("10000007", "Next: the pricing page.") +
    `<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`],
  ["word/_rels/document.xml.rels", rels([["rId1", "styles", "styles.xml"], ["rId2", "customXml", "../customXml/item1.xml"]])],
  ["word/styles.xml", `${X}<w:styles xmlns:w="${W}"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style></w:styles>`],
  ["customXml/item1.xml", CUSTOM],
]);
