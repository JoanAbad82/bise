// Charts: a chart part read to data (its type, title, categories, series
// from the caches PowerPoint keeps), and a new chart part written from
// data, with its values cached in the chart and the small workbook
// PowerPoint embeds beside it (Quick Look draws no chart without one).
// v1 makes and replaces charts; it does not edit an existing chart's
// series (plan §Risks).

import { attr, child, children, descendants, type Element } from "../core/xml.ts";
import { OfficeError } from "../core/errors.ts";
import { Zip } from "../core/zip.ts";
import { int, ln, PNS } from "./dom.ts";
import { esc, hex } from "./units.ts";

const { a: A, c: C } = PNS;

export type ChartType = "column" | "bar" | "line" | "pie";

export type ChartData = {
  /** column, bar, line, pie, or what the part has (area, doughnut, scatter, ...) */
  type: string;
  title?: string;
  categories: string[];
  series: { name: string; values: (number | null)[]; color?: string }[];
};

export type ChartInput = {
  type: ChartType;
  title?: string;
  categories: string[];
  series: { name: string; values: number[]; color?: string }[];
  /** the legend: "bottom" (default), "right", "top", or false for none */
  legend?: "bottom" | "right" | "top" | false;
};

// ---- read

/** A chart part (c:chartSpace) as data; `color` resolves an a:solidFill's holder. */
export function readChart(root: Element, color: (holder: Element | undefined) => string | undefined): ChartData {
  const chart = child(root, C, "chart");
  const plot = chart && child(chart, C, "plotArea");
  const kind = plot ? children(plot, C).find((e) => ln(e).endsWith("Chart")) : undefined;
  let type = kind ? ln(kind).replace(/3D/, "").replace(/Chart$/, "") : "chart";
  if (type === "bar" && kind) type = attr(child(kind, C, "barDir") ?? kind, "val") === "bar" ? "bar" : "column";
  const titleEl = chart && child(chart, C, "title");
  const title = titleEl ? descendants(titleEl, A, "t").map((t) => t.textContent ?? "").join("") || cacheStrings(child(titleEl, C, "tx"))[0] : undefined;
  const sers = kind ? children(kind, C, "ser") : [];
  const categories = sers.length ? cacheStrings(child(sers[0], C, "cat") ?? child(sers[0], C, "xVal")) : [];
  const series = sers.map((s) => {
    const out: ChartData["series"][number] = {
      name: cacheStrings(child(s, C, "tx"))[0] ?? "",
      values: cacheNumbers(child(s, C, "val") ?? child(s, C, "yVal")),
    };
    const sp = child(s, C, "spPr");
    const c = sp && (color(child(sp, A, "solidFill")) ?? color(child(child(sp, A, "ln") ?? sp, A, "solidFill")));
    if (c) out.color = c;
    return out;
  });
  return { type, ...(title ? { title } : {}), categories, series };
}

/** The point values of a c:tx, c:cat, ... holder (strCache, numCache, strLit, numLit, a plain c:v). */
function points(holder: Element | undefined): (string | undefined)[] {
  if (!holder) return [];
  const direct = child(holder, C, "v");
  if (direct) return [direct.textContent ?? ""];
  const cache = descendants(holder, C, "strCache")[0] ?? descendants(holder, C, "numCache")[0] ?? child(holder, C, "strLit") ?? child(holder, C, "numLit") ?? descendants(holder, C, "lvl")[0];
  if (!cache) return [];
  const n = int(child(cache, C, "ptCount"), "val") ?? 0;
  const out: (string | undefined)[] = new Array(n).fill(undefined);
  for (const pt of children(cache, C, "pt")) {
    const i = int(pt, "idx") ?? 0;
    out[i] = child(pt, C, "v")?.textContent ?? "";
  }
  return out;
}

const cacheStrings = (h: Element | undefined) => points(h).map((v) => v ?? "");
const cacheNumbers = (h: Element | undefined) =>
  points(h).map((v) => {
    const n = v === undefined || v === "" ? NaN : Number(v);
    return Number.isFinite(n) ? n : null;
  });

// ---- write

const col = (n: number) => {
  let s = "";
  for (let i = n + 1; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
  return s;
};

/** Checks a chart's data; throws bad_arg with what is wrong. */
export function checkChart(d: ChartInput): void {
  const bad = (why: string) => new OfficeError("bad_arg", `a chart ${why}: { type: "column" | "bar" | "line" | "pie", categories: ["Q1", ...], series: [{ name, values: [n, ...] }] }`);
  if (!["column", "bar", "line", "pie"].includes(d?.type)) throw bad(`type is column, bar, line or pie, not ${JSON.stringify(d?.type)}`);
  if (!Array.isArray(d.categories) || !d.categories.length) throw bad("needs categories");
  if (!Array.isArray(d.series) || !d.series.length) throw bad("needs at least one series");
  for (const s of d.series) {
    if (!Array.isArray(s.values) || s.values.length !== d.categories.length || !s.values.every((v) => typeof v === "number" && Number.isFinite(v))) {
      throw bad(`series ${JSON.stringify(s.name)} needs ${d.categories.length} numbers (one per category)`);
    }
  }
  if (d.type === "pie" && d.series.length !== 1) throw bad("of type pie has one series");
}

const strCache = (vals: string[]) => `<c:strCache><c:ptCount val="${vals.length}"/>${vals.map((v, i) => `<c:pt idx="${i}"><c:v>${esc(v)}</c:v></c:pt>`).join("")}</c:strCache>`;
const numCache = (vals: number[]) => `<c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${vals.length}"/>${vals.map((v, i) => `<c:pt idx="${i}"><c:v>${v}</c:v></c:pt>`).join("")}</c:numCache>`;
const fill = (s: { color?: string }, i: number) => (s.color ? `<a:srgbClr val="${hex(s.color)}"/>` : `<a:schemeClr val="accent${(i % 6) + 1}"/>`);

/** A new chart part's XML (c:chartSpace); `workbookRid` is its relationship to the embedded workbook. */
export function writeChart(d: ChartInput, workbookRid: string): string {
  checkChart(d);
  const n = d.categories.length;
  const cat = `<c:cat><c:strRef><c:f>Sheet1!$A$2:$A$${n + 1}</c:f>${strCache(d.categories.map(String))}</c:strRef></c:cat>`;
  const ser = d.series
    .map((s, i) => {
      const c = col(i + 1);
      const head = `<c:idx val="${i}"/><c:order val="${i}"/><c:tx><c:strRef><c:f>Sheet1!$${c}$1</c:f>${strCache([String(s.name ?? "")])}</c:strRef></c:tx>`;
      const val = `<c:val><c:numRef><c:f>Sheet1!$${c}$2:$${c}$${n + 1}</c:f>${numCache(s.values)}</c:numRef></c:val>`;
      if (d.type === "line") {
        return `<c:ser>${head}<c:spPr><a:ln w="28575" cap="rnd"><a:solidFill>${fill(s, i)}</a:solidFill><a:round/></a:ln></c:spPr><c:marker><c:symbol val="none"/></c:marker>${cat}${val}<c:smooth val="0"/></c:ser>`;
      }
      if (d.type === "pie") {
        // one color per slice, written out: Quick Look ignores varyColors
        const dpt = d.categories.map((_, k) => `<c:dPt><c:idx val="${k}"/><c:bubble3D val="0"/><c:spPr><a:solidFill>${fill({}, k)}</a:solidFill></c:spPr></c:dPt>`).join("");
        return `<c:ser>${head}${dpt}${cat}${val}</c:ser>`;
      }
      return `<c:ser>${head}<c:spPr><a:solidFill>${fill(s, i)}</a:solidFill></c:spPr><c:invertIfNegative val="0"/>${cat}${val}</c:ser>`;
    })
    .join("");
  const axes = `<c:axId val="50010"/><c:axId val="50020"/>`;
  const catPos = d.type === "bar" ? "l" : "b";
  const valPos = d.type === "bar" ? "b" : "l";
  const axisXml =
    `<c:catAx><c:axId val="50010"/><c:scaling><c:orientation val="${d.type === "bar" ? "maxMin" : "minMax"}"/></c:scaling><c:delete val="0"/><c:axPos val="${catPos}"/><c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="50020"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>` +
    `<c:valAx><c:axId val="50020"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="${valPos}"/><c:majorGridlines><c:spPr><a:ln w="6350"><a:solidFill><a:srgbClr val="D9D9D9"/></a:solidFill></a:ln></c:spPr></c:majorGridlines><c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="50010"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx>`;
  let plot: string;
  if (d.type === "pie") plot = `<c:pieChart><c:varyColors val="1"/>${ser}<c:firstSliceAng val="0"/></c:pieChart>`;
  else if (d.type === "line") plot = `<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>${ser}<c:marker val="1"/>${axes}</c:lineChart>${axisXml}`;
  else plot = `<c:barChart><c:barDir val="${d.type === "bar" ? "bar" : "col"}"/><c:grouping val="clustered"/><c:varyColors val="0"/>${ser}<c:gapWidth val="80"/>${axes}</c:barChart>${axisXml}`;
  const title = d.title
    ? `<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1400" b="1"/></a:pPr><a:r><a:rPr lang="en-US" sz="1400" b="1"/><a:t>${esc(d.title)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/>`
    : `<c:autoTitleDeleted val="1"/>`;
  const pos = { bottom: "b", right: "r", top: "t" }[d.legend === undefined ? "bottom" : d.legend || "bottom"];
  const legend = d.legend === false ? "" : `<c:legend><c:legendPos val="${pos}"/><c:overlay val="0"/></c:legend>`;
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<c:chartSpace xmlns:c="${C}" xmlns:a="${A}" xmlns:r="${PNS.r}"><c:roundedCorners val="0"/>` +
    `<c:chart>${title}<c:plotArea><c:layout/>${plot}</c:plotArea>${legend}<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart>` +
    `<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1200"/></a:pPr><a:endParaRPr lang="en-US"/></a:p></c:txPr>` +
    `<c:externalData r:id="${workbookRid}"><c:autoUpdate val="0"/></c:externalData></c:chartSpace>`
  );
}

/**
 * The chart's data as the small workbook PowerPoint embeds with a chart
 * (Sheet1: categories in A, one series per column from B, names in row 1):
 * the cells the chart's c:f formulas point at. Quick Look draws no chart
 * without it, and PowerPoint's "Edit Data" opens it.
 */
export function chartWorkbook(d: ChartInput): Uint8Array {
  checkChart(d);
  const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const S = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const PR = "http://schemas.openxmlformats.org/package/2006/relationships";
  const str = (ref: string, v: string) => `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
  const num = (ref: string, v: number) => `<c r="${ref}"><v>${v}</v></c>`;
  const head = `<row r="1">${d.series.map((s, i) => str(`${col(i + 1)}1`, String(s.name ?? ""))).join("")}</row>`;
  const body = d.categories
    .map((c, r) => `<row r="${r + 2}">${str(`A${r + 2}`, String(c))}${d.series.map((s, i) => num(`${col(i + 1)}${r + 2}`, s.values[r])).join("")}</row>`)
    .join("");
  const zip = Zip.empty();
  zip.set(
    "[Content_Types].xml",
    `${X}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>` +
      `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
  );
  zip.set("_rels/.rels", `${X}<Relationships xmlns="${PR}"><Relationship Id="rId1" Type="${R}/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  zip.set("xl/workbook.xml", `${X}<workbook xmlns="${S}" xmlns:r="${R}"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>`);
  zip.set("xl/_rels/workbook.xml.rels", `${X}<Relationships xmlns="${PR}"><Relationship Id="rId1" Type="${R}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`);
  zip.set("xl/worksheets/sheet1.xml", `${X}<worksheet xmlns="${S}"><sheetData>${head}${body}</sheetData></worksheet>`);
  return zip.write();
}
