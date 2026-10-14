// The XML of new shapes, written the way PowerPoint writes them: a text
// box, a preset shape (rect, ellipse, ...), a picture, a table, a chart's
// graphic frame. Pure: strings in, string out; the deck puts them in the
// slide and makes their parts and relationships.

import { OfficeError } from "../core/errors.ts";
import { esc, hex, type Emu } from "./units.ts";

/** The preset geometries an agent asks for most (any of PowerPoint's ~180 prst names works too). */
export const GEOMETRIES = ["rect", "roundRect", "ellipse", "triangle", "rightArrow", "leftArrow", "upArrow", "downArrow", "chevron", "homePlate", "diamond", "hexagon", "star5", "line"] as const;

export type ShapeLook = {
  /** "#rrggbb", or "none" */
  fill?: string;
  /** the outline: "#rrggbb", or "none" */
  line?: string;
  /** the outline's width, points */
  lineWidth?: number;
  /** vertical place of the text: top (default for a text box), middle (default for a shape), bottom */
  valign?: "top" | "middle" | "bottom";
};

const xfrm = (b: Emu) => `<a:xfrm><a:off x="${b.x}" y="${b.y}"/><a:ext cx="${b.w}" cy="${b.h}"/></a:xfrm>`;
const nv = (tag: string, id: number, name: string, inner: string, alt?: string) =>
  `<p:nv${tag}Pr><p:cNvPr id="${id}" name="${esc(name)}"${alt ? ` descr="${esc(alt)}"` : ""}/>${inner}<p:nvPr/></p:nv${tag}Pr>`;
const color = (c: string) => (c === "none" ? "<a:noFill/>" : `<a:solidFill><a:srgbClr val="${hex(c)}"/></a:solidFill>`);
const ANCHOR = { top: "t", middle: "ctr", bottom: "b" } as const;

function checkLook(l: ShapeLook): void {
  if (l.lineWidth !== undefined && !(typeof l.lineWidth === "number" && l.lineWidth >= 0 && l.lineWidth <= 100)) {
    throw new OfficeError("bad_arg", `lineWidth is in points, 0 to 100, got ${JSON.stringify(l.lineWidth)}`);
  }
  if (l.valign !== undefined && !ANCHOR[l.valign]) throw new OfficeError("bad_arg", `valign is top, middle or bottom, got ${JSON.stringify(l.valign)}`);
}

/** A text box: no fill, no outline, text from the top, no autofit (check() says when the text does not fit). */
export function textBoxXml(id: number, name: string, box: Emu, look: ShapeLook = {}): string {
  checkLook(look);
  const fill = look.fill ? color(look.fill) : "<a:noFill/>";
  const line = look.line ? `<a:ln${look.lineWidth !== undefined ? ` w="${Math.round(look.lineWidth * 12700)}"` : ""}>${color(look.line)}</a:ln>` : "";
  return (
    `<p:sp>${nv("Sp", id, name, '<p:cNvSpPr txBox="1"/>')}<p:spPr>${xfrm(box)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>${fill}${line}</p:spPr>` +
    `<p:txBody><a:bodyPr wrap="square" rtlCol="0" anchor="${ANCHOR[look.valign ?? "top"]}"><a:noAutofit/></a:bodyPr><a:lstStyle/><a:p><a:endParaRPr lang="en-US"/></a:p></p:txBody></p:sp>`
  );
}

/** A preset shape, filled with the theme's first accent unless told, its text centered. */
export function shapeXml(id: number, name: string, geometry: string, box: Emu, look: ShapeLook = {}): string {
  checkLook(look);
  if (typeof geometry !== "string" || !/^[a-zA-Z0-9]+$/.test(geometry)) {
    throw new OfficeError("bad_arg", `a shape's geometry is a preset name (${GEOMETRIES.join(", ")}, ...), got ${JSON.stringify(geometry)}`);
  }
  const fill = look.fill ? color(look.fill) : '<a:solidFill><a:schemeClr val="accent1"/></a:solidFill>';
  const w = look.lineWidth !== undefined ? ` w="${Math.round(look.lineWidth * 12700)}"` : "";
  const line = look.line ? `<a:ln${w}>${color(look.line)}</a:ln>` : `<a:ln${w}><a:noFill/></a:ln>`;
  return (
    `<p:sp>${nv("Sp", id, name, "<p:cNvSpPr/>")}<p:spPr>${xfrm(box)}<a:prstGeom prst="${geometry}"><a:avLst/></a:prstGeom>${fill}${line}</p:spPr>` +
    `<p:txBody><a:bodyPr wrap="square" rtlCol="0" anchor="${ANCHOR[look.valign ?? "middle"]}"><a:noAutofit/></a:bodyPr><a:lstStyle/><a:p><a:pPr algn="ctr"/><a:endParaRPr lang="en-US"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:endParaRPr></a:p></p:txBody></p:sp>`
  );
}

export function pictureXml(id: number, name: string, rid: string, box: Emu, alt?: string): string {
  return (
    `<p:pic>${nv("Pic", id, name, '<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>', alt)}` +
    `<p:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>` +
    `<p:spPr>${xfrm(box)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`
  );
}

export type TableOpts = {
  /** the first row as a header (bold, the style's dark band); default true */
  header?: boolean;
  /** points, every cell; default 14 */
  size?: number;
  /** each column's share of the width (any numbers, scaled to the box); default equal */
  widths?: number[];
};

/** A table in PowerPoint's "Medium Style 2 - Accent 1", one row per entry of `rows`. */
export function tableXml(id: number, name: string, rows: string[][], box: Emu, opts: TableOpts = {}): string {
  if (!Array.isArray(rows) || !rows.length || !rows.every((r) => Array.isArray(r) && r.length)) {
    throw new OfficeError("bad_arg", 'a table is rows of cells: [["Region", "Revenue"], ["North", "120"]]');
  }
  const cols = Math.max(...rows.map((r) => r.length));
  const shares = opts.widths ?? new Array(cols).fill(1);
  if (shares.length !== cols || !shares.every((w) => typeof w === "number" && w > 0)) {
    throw new OfficeError("bad_arg", `widths has one positive number per column (${cols}), got ${JSON.stringify(opts.widths)}`);
  }
  const size = opts.size ?? 14;
  if (!(typeof size === "number" && size >= 1 && size <= 400)) throw new OfficeError("bad_arg", `a table's size is in points, got ${JSON.stringify(size)}`);
  const total = shares.reduce((a, b) => a + b, 0);
  const widths = shares.map((s) => Math.round((box.w * s) / total));
  const rowH = Math.round(box.h / rows.length);
  const cell = (t: string) => {
    const paras = String(t ?? "")
      .split("\n")
      .map((line) => `<a:p>${line ? `<a:r><a:rPr lang="en-US" sz="${size * 100}" dirty="0"/><a:t>${esc(line)}</a:t></a:r>` : ""}<a:endParaRPr lang="en-US" sz="${size * 100}"/></a:p>`)
      .join("");
    return `<a:tc><a:txBody><a:bodyPr/><a:lstStyle/>${paras}</a:txBody><a:tcPr/></a:tc>`;
  };
  const body = rows.map((r) => `<a:tr h="${rowH}">${Array.from({ length: cols }, (_, i) => cell(r[i] ?? "")).join("")}</a:tr>`).join("");
  return (
    `<p:graphicFrame>${nv("GraphicFrame", id, name, '<p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr>')}` +
    `<p:xfrm><a:off x="${box.x}" y="${box.y}"/><a:ext cx="${box.w}" cy="${box.h}"/></p:xfrm>` +
    `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl>` +
    `<a:tblPr firstRow="${opts.header === false ? 0 : 1}" bandRow="1"><a:tableStyleId>{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}</a:tableStyleId></a:tblPr>` +
    `<a:tblGrid>${widths.map((w) => `<a:gridCol w="${w}"/>`).join("")}</a:tblGrid>${body}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`
  );
}

export function chartFrameXml(id: number, name: string, rid: string, box: Emu): string {
  return (
    `<p:graphicFrame>${nv("GraphicFrame", id, name, "<p:cNvGraphicFramePr/>")}` +
    `<p:xfrm><a:off x="${box.x}" y="${box.y}"/><a:ext cx="${box.w}" cy="${box.h}"/></p:xfrm>` +
    `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart r:id="${rid}"/></a:graphicData></a:graphic></p:graphicFrame>`
  );
}

/** An image's type and size in pixels from its bytes (png, jpeg, gif); throws bad_arg for anything else. */
export function imageInfo(b: Uint8Array): { ext: "png" | "jpeg" | "gif"; mime: string; w?: number; h?: number } {
  if (!(b instanceof Uint8Array)) throw new OfficeError("bad_arg", "an image is its bytes (a Uint8Array, from run.read)");
  const u32 = (i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
  if (b.length > 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return { ext: "png", mime: "image/png", w: u32(16), h: u32(20) };
  }
  if (b.length > 10 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) {
    return { ext: "gif", mime: "image/gif", w: b[6] | (b[7] << 8), h: b[8] | (b[9] << 8) };
  }
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) break;
      const marker = b[i + 1];
      const len = (b[i + 2] << 8) | b[i + 3];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { ext: "jpeg", mime: "image/jpeg", h: (b[i + 5] << 8) | b[i + 6], w: (b[i + 7] << 8) | b[i + 8] };
      }
      i += 2 + len;
    }
    return { ext: "jpeg", mime: "image/jpeg" };
  }
  throw new OfficeError("bad_arg", "an image is a PNG, JPEG or GIF (these bytes are none of them)");
}
