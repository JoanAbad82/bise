// A workbook with what exceljs does not model, made here from our own XML
// on top of a file the SDK writes: a chart drawing on sheet "Q3", a pivot
// table on "Q3" with its cache, an external link, custom properties, a
// chartsheet between "Q3" and "Data", a defined name scoped to "Data", and
// a picture-only drawing on "Data" (that one exceljs models).

import { sheets, core } from "../../dist/office.js";

const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const PR = "http://schemas.openxmlformats.org/package/2006/relationships";
const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const S = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const XDR = "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing";
const A = "http://schemas.openxmlformats.org/drawingml/2006/main";
const C = "http://schemas.openxmlformats.org/drawingml/2006/chart";
const CT = "application/vnd.openxmlformats-officedocument";

// a 1x1 png
export const PNG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 13, 73, 68, 65, 84, 120, 156, 99, 248, 15, 4, 0, 9, 251, 3, 253, 227, 85, 242, 156, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);

const chart = (title) =>
  `${X}<c:chartSpace xmlns:c="${C}" xmlns:a="${A}" xmlns:r="${R}"><c:chart><c:title><c:tx><c:rich><a:bodyPr/><a:p><a:r><a:t>${title}</a:t></a:r></a:p></c:rich></c:tx></c:title><c:plotArea><c:layout/><c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:ser><c:idx val="0"/><c:order val="0"/><c:val><c:numRef><c:f>Q3!$B$2:$B$3</c:f></c:numRef></c:val></c:ser><c:axId val="1"/><c:axId val="2"/></c:barChart><c:catAx><c:axId val="1"/><c:scaling/><c:axPos val="b"/><c:crossAx val="2"/></c:catAx><c:valAx><c:axId val="2"/><c:scaling/><c:axPos val="l"/><c:crossAx val="1"/></c:valAx></c:plotArea></c:chart></c:chartSpace>`;

const chartDrawing = `${X}<xdr:wsDr xmlns:xdr="${XDR}" xmlns:a="${A}" xmlns:r="${R}" xmlns:c="${C}"><xdr:twoCellAnchor><xdr:from><xdr:col>3</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>1</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>9</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>15</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="2" name="Chart 1"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="${C}"><c:chart r:id="rId1"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor></xdr:wsDr>`;

const rels = (list) =>
  `${X}<Relationships xmlns="${PR}">${list.map(([id, type, target, ext]) => `<Relationship Id="${id}" Type="${type.startsWith("http") ? type : `${R}/${type}`}" Target="${target}"${ext ? ' TargetMode="External"' : ""}/>`).join("")}</Relationships>`;

function addRel(zip, part, id, type, target) {
  const path = core.relsPath(part);
  const text = zip.text(path) ?? rels([]);
  zip.set(path, text.replace("</Relationships>", `<Relationship Id="${id}" Type="${R}/${type}" Target="${target}"/></Relationships>`));
}

function override(zip, part, type) {
  zip.set("[Content_Types].xml", zip.text("[Content_Types].xml").replace("</Types>", `<Override PartName="/${part}" ContentType="${type}"/></Types>`));
}

/** The rich workbook's bytes, and where things are in it. */
export async function richWorkbook() {
  const book = await sheets.create({
    sheet: "Q3",
    rows: [["Item", "Amount"], ["a", 1200], ["b", 300], ["Total", "=SUM(B2:B3)"]],
    date: new Date(Date.UTC(2026, 0, 1)),
  });
  book.addSheet("Data", { rows: [["k", "v"], ["x", 1]] });
  const x = book.exceljs;
  const img = x.addImage({ buffer: PNG, extension: "png" });
  x.getWorksheet("Data").addImage(img, "C3:D5");
  x.definedNames.add("Data!$A$1:$B$2", "DataBlock");
  const zip = core.Zip.read(await book.save());

  const sheetOf = (name) => {
    const wb = zip.text("xl/workbook.xml");
    const rid = new RegExp(`<sheet [^>]*name="${name}"[^>]*r:id="(rId\\d+)"`).exec(wb)[1];
    return core.rels(zip, "xl/workbook.xml").find((r) => r.id === rid).target;
  };
  const q3 = sheetOf("Q3");

  // chart drawing on Q3
  zip.set("xl/drawings/drawing9.xml", chartDrawing);
  zip.set("xl/drawings/_rels/drawing9.xml.rels", rels([["rId1", "chart", "../charts/chart1.xml"]]));
  zip.set("xl/charts/chart1.xml", chart("Revenue by item"));
  override(zip, "xl/drawings/drawing9.xml", `${CT}.drawing+xml`);
  override(zip, "xl/charts/chart1.xml", `${CT}.drawingml.chart+xml`);
  addRel(zip, q3, "rId90", "drawing", "../drawings/drawing9.xml");
  addRel(zip, q3, "rId91", "pivotTable", "../pivotTables/pivotTable1.xml");
  zip.set(q3, zip.text(q3).replace("</worksheet>", `<drawing r:id="rId90"/></worksheet>`));

  // pivot table + cache
  zip.set("xl/pivotTables/pivotTable1.xml", `${X}<pivotTableDefinition xmlns="${S}" name="P1" cacheId="1" dataCaption="Values"><location ref="F2:G4" firstHeaderRow="1" firstDataRow="1" firstDataCol="1"/></pivotTableDefinition>`);
  zip.set("xl/pivotTables/_rels/pivotTable1.xml.rels", rels([["rId1", "pivotCacheDefinition", "../pivotCache/pivotCacheDefinition1.xml"]]));
  zip.set("xl/pivotCache/pivotCacheDefinition1.xml", `${X}<pivotCacheDefinition xmlns="${S}" xmlns:r="${R}" r:id="rId1"><cacheSource type="worksheet"><worksheetSource ref="A1:B3" sheet="Q3"/></cacheSource></pivotCacheDefinition>`);
  zip.set("xl/pivotCache/_rels/pivotCacheDefinition1.xml.rels", rels([["rId1", "pivotCacheRecords", "pivotCacheRecords1.xml"]]));
  zip.set("xl/pivotCache/pivotCacheRecords1.xml", `${X}<pivotCacheRecords xmlns="${S}" count="0"/>`);
  override(zip, "xl/pivotTables/pivotTable1.xml", `${CT}.spreadsheetml.pivotTable+xml`);
  override(zip, "xl/pivotCache/pivotCacheDefinition1.xml", `${CT}.spreadsheetml.pivotCacheDefinition+xml`);
  override(zip, "xl/pivotCache/pivotCacheRecords1.xml", `${CT}.spreadsheetml.pivotCacheRecords+xml`);
  addRel(zip, "xl/workbook.xml", "rId80", "pivotCacheDefinition", "pivotCache/pivotCacheDefinition1.xml");

  // external link
  zip.set("xl/externalLinks/externalLink1.xml", `${X}<externalLink xmlns="${S}" xmlns:r="${R}"><externalBook r:id="rId1"/></externalLink>`);
  zip.set("xl/externalLinks/_rels/externalLink1.xml.rels", rels([["rId1", "externalLinkPath", "budget.xlsx", true]]));
  override(zip, "xl/externalLinks/externalLink1.xml", `${CT}.spreadsheetml.externalLink+xml`);
  addRel(zip, "xl/workbook.xml", "rId81", "externalLink", "externalLinks/externalLink1.xml");

  // chartsheet between Q3 and Data
  zip.set("xl/chartsheets/sheet1.xml", `${X}<chartsheet xmlns="${S}" xmlns:r="${R}"><sheetViews><sheetView workbookViewId="0"/></sheetViews><drawing r:id="rId1"/></chartsheet>`);
  zip.set("xl/chartsheets/_rels/sheet1.xml.rels", rels([["rId1", "drawing", "../drawings/drawing8.xml"]]));
  zip.set("xl/drawings/drawing8.xml", chartDrawing.replace("Chart 1", "Chart 2"));
  zip.set("xl/drawings/_rels/drawing8.xml.rels", rels([["rId1", "chart", "../charts/chart2.xml"]]));
  zip.set("xl/charts/chart2.xml", chart("Totals"));
  override(zip, "xl/chartsheets/sheet1.xml", `${CT}.spreadsheetml.chartsheet+xml`);
  override(zip, "xl/drawings/drawing8.xml", `${CT}.drawing+xml`);
  override(zip, "xl/charts/chart2.xml", `${CT}.drawingml.chart+xml`);
  addRel(zip, "xl/workbook.xml", "rId82", "chartsheet", "chartsheets/sheet1.xml");

  let wb = zip.text("xl/workbook.xml");
  wb = wb.replace(/(<sheet [^>]*name="Q3"[^>]*\/>)/, `$1<sheet name="Totals chart" sheetId="9" r:id="rId82"/>`);
  wb = wb.replace("<definedNames>", `<externalReferences><externalReference r:id="rId81"/></externalReferences><definedNames>`);
  wb = wb.replace(/<definedName name="DataBlock"([^>]*)>/, '<definedName name="DataBlock" localSheetId="2"$1>');
  wb = wb.replace("</workbook>", `<pivotCaches><pivotCache cacheId="1" r:id="rId80"/></pivotCaches></workbook>`);
  zip.set("xl/workbook.xml", wb);

  // custom properties (package level)
  zip.set("docProps/custom.xml", `${X}<Properties xmlns="${CT}.custom-properties" xmlns:vt="${CT}.docPropsVTypes"><property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="2" name="Owner"><vt:lpwstr>finance</vt:lpwstr></property></Properties>`);
  override(zip, "docProps/custom.xml", `${CT}.custom-properties+xml`);
  zip.set("_rels/.rels", zip.text("_rels/.rels").replace("</Relationships>", `<Relationship Id="rId9" Type="${R}/custom-properties" Target="docProps/custom.xml"/></Relationships>`));

  return { bytes: zip.write(), q3 };
}
