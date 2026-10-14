// The parts of a new deck (slides.create): written here by us, no file from
// Office or the web. One theme (Arial, Office's accent colors), one master
// with a title and a body placeholder and its text styles, and the six
// layouts an agent asks for by key: title, title-body, two-content,
// section, title-only, blank. No slide: the agent adds them.

import { emu, esc } from "./units.ts";

export type SlideSize = "16:9" | "4:3";

const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const NSP = `xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${R}" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"`;
const CT = "application/vnd.openxmlformats-officedocument";

/** The layouts of a new deck: key, PowerPoint's layout type, name. */
export const LAYOUTS = [
  { key: "title", type: "title", name: "Title Slide" },
  { key: "title-body", type: "obj", name: "Title and Content" },
  { key: "two-content", type: "twoObj", name: "Two Content" },
  { key: "section", type: "secHead", name: "Section Header" },
  { key: "title-only", type: "titleOnly", name: "Title Only" },
  { key: "blank", type: "blank", name: "Blank" },
] as const;

/** A layout key as PowerPoint's layout type: any deck's layouts carry it, ours and PowerPoint's. */
export const LAYOUT_TYPE: Record<string, string> = Object.fromEntries(LAYOUTS.map((l) => [l.key, l.type]));

function rels(list: [string, string, string][]): string {
  const rows = list.map(([id, type, target]) => `<Relationship Id="${id}" Type="${R}/${type}" Target="${target}"/>`).join("");
  return `${X}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rows}</Relationships>`;
}

const tree = (shapes: string) =>
  `<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${shapes}</p:spTree></p:cSld>`;

type Ph = { id: number; name: string; type?: string; idx?: number; box: [number, number, number, number]; anchor?: "t" | "ctr" | "b"; size?: number; align?: "ctr" };

/** A placeholder shape of a master or a layout, its box in points. */
function ph(p: Ph): string {
  const [x, y, w, h] = p.box;
  const attrs = `${p.type ? ` type="${p.type}"` : ""}${p.idx !== undefined ? ` idx="${p.idx}"` : ""}`;
  const lvl = p.size || p.align ? `<a:lstStyle><a:lvl1pPr${p.align ? ` algn="${p.align}"` : ""}>${p.size ? `<a:defRPr sz="${p.size * 100}"/>` : ""}</a:lvl1pPr></a:lstStyle>` : "<a:lstStyle/>";
  return (
    `<p:sp><p:nvSpPr><p:cNvPr id="${p.id}" name="${esc(p.name)}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph${attrs}/></p:nvPr></p:nvSpPr>` +
    `<p:spPr><a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm></p:spPr>` +
    `<p:txBody><a:bodyPr${p.anchor ? ` anchor="${p.anchor}"` : ""}><a:normAutofit/></a:bodyPr>${lvl}<a:p><a:endParaRPr lang="en-US"/></a:p></p:txBody></p:sp>`
  );
}

/** The placeholders of each layout, on a slide `w` points wide (540 high). */
function layoutShapes(type: string, w: number): string {
  const m = 48;
  const inner = w - 2 * m;
  const title: Ph = { id: 2, name: "Title 1", type: "title", box: [m, 30, inner, 70], anchor: "b" };
  const body = (id: number, idx: number, box: Ph["box"]): Ph => ({ id, name: `Content Placeholder ${id - 1}`, idx, box });
  switch (type) {
    case "title":
      return ph({ id: 2, name: "Title 1", type: "ctrTitle", box: [m * 2, 150, w - 4 * m, 130], anchor: "b", size: 48, align: "ctr" }) +
        ph({ id: 3, name: "Subtitle 2", type: "subTitle", idx: 1, box: [m * 2, 292, w - 4 * m, 90], size: 24, align: "ctr" });
    case "obj":
      return ph(title) + ph(body(3, 1, [m, 118, inner, 378]));
    case "twoObj": {
      const half = (inner - 24) / 2;
      return ph(title) + ph(body(3, 1, [m, 118, half, 378])) + ph(body(4, 2, [m + half + 24, 118, half, 378]));
    }
    case "secHead":
      return ph({ ...title, box: [m + 12, 170, inner - 24, 110], size: 40 }) +
        ph({ id: 3, name: "Text Placeholder 2", type: "body", idx: 1, box: [m + 12, 290, inner - 24, 60], size: 20 });
    case "titleOnly":
      return ph(title);
    default:
      return "";
  }
}

const level = (n: number, size: number, bullet: boolean) => {
  const indent = bullet ? ` marL="${emu(18 + 22 * (n - 1))}" indent="${emu(-18)}"` : "";
  const bu = bullet ? `<a:buFont typeface="Arial"/><a:buChar char="&#8226;"/>` : "<a:buNone/>";
  return `<a:lvl${n}pPr${indent} algn="l"><a:spcBef><a:spcPts val="${n === 1 ? 1000 : 500}"/></a:spcBef>${bu}<a:defRPr sz="${size * 100}"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/></a:defRPr></a:lvl${n}pPr>`;
};

const txStyles =
  `<p:txStyles><p:titleStyle><a:lvl1pPr algn="l"><a:lnSpc><a:spcPct val="90000"/></a:lnSpc><a:buNone/><a:defRPr sz="3600" b="1"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mj-lt"/></a:defRPr></a:lvl1pPr></p:titleStyle>` +
  `<p:bodyStyle>${[24, 20, 18, 16, 16, 16, 16, 16, 16].map((s, i) => level(i + 1, s, true)).join("")}</p:bodyStyle>` +
  `<p:otherStyle>${[18, 18, 18, 18, 18, 18, 18, 18, 18].map((s, i) => level(i + 1, s, false)).join("")}</p:otherStyle></p:txStyles>`;

const clrMap = `<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>`;

const solid = (c: string) => `<a:solidFill><a:schemeClr val="${c}"/></a:solidFill>`;
const theme =
  `${X}<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="bise"><a:themeElements>` +
  `<a:clrScheme name="bise"><a:dk1><a:srgbClr val="1F2328"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2>` +
  ["4472C4", "ED7D31", "A5A5A5", "FFC000", "5B9BD5", "70AD47"].map((c, i) => `<a:accent${i + 1}><a:srgbClr val="${c}"/></a:accent${i + 1}>`).join("") +
  `<a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme>` +
  `<a:fontScheme name="bise"><a:majorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme>` +
  `<a:fmtScheme name="bise"><a:fillStyleLst>${solid("phClr").repeat(3)}</a:fillStyleLst>` +
  `<a:lnStyleLst>${[6350, 12700, 19050].map((w) => `<a:ln w="${w}">${solid("phClr")}</a:ln>`).join("")}</a:lnStyleLst>` +
  `<a:effectStyleLst>${"<a:effectStyle><a:effectLst/></a:effectStyle>".repeat(3)}</a:effectStyleLst><a:bgFillStyleLst>${solid("phClr").repeat(3)}</a:bgFillStyleLst></a:fmtScheme>` +
  `</a:themeElements></a:theme>`;

/** Every part of a new, empty deck, by path. */
export function newDeck(size: SlideSize = "16:9"): [string, string][] {
  const w = size === "4:3" ? 720 : 960;
  const types = [
    ["ppt/presentation.xml", "presentationml.presentation.main+xml"],
    ["ppt/slideMasters/slideMaster1.xml", "presentationml.slideMaster+xml"],
    ...LAYOUTS.map((_, i) => [`ppt/slideLayouts/slideLayout${i + 1}.xml`, "presentationml.slideLayout+xml"]),
    ["ppt/theme/theme1.xml", "theme+xml"],
  ];
  const ct =
    `${X}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>` +
    types.map(([p, t]) => `<Override PartName="/${p}" ContentType="${CT}.${t}"/>`).join("") +
    `</Types>`;
  const masterShapes =
    ph({ id: 2, name: "Title Placeholder 1", type: "title", box: [48, 30, w - 96, 70], anchor: "b" }) +
    ph({ id: 3, name: "Text Placeholder 2", type: "body", idx: 1, box: [48, 118, w - 96, 378] });
  const parts: [string, string][] = [
    ["[Content_Types].xml", ct],
    ["_rels/.rels", rels([["rId1", "officeDocument", "ppt/presentation.xml"]])],
    [
      "ppt/presentation.xml",
      `${X}<p:presentation ${NSP} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldSz cx="${emu(w)}" cy="${emu(540)}"${size === "4:3" ? ' type="screen4x3"' : ""}/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`,
    ],
    ["ppt/_rels/presentation.xml.rels", rels([["rId1", "slideMaster", "slideMasters/slideMaster1.xml"], ["rId2", "theme", "theme/theme1.xml"]])],
    [
      "ppt/slideMasters/slideMaster1.xml",
      `${X}<p:sldMaster ${NSP}>${tree(masterShapes).replace("<p:cSld>", `<p:cSld><p:bg><p:bgPr>${solid("bg1")}<a:effectLst/></p:bgPr></p:bg>`)}${clrMap}` +
        `<p:sldLayoutIdLst>${LAYOUTS.map((_, i) => `<p:sldLayoutId id="${2147483649 + i}" r:id="rId${i + 1}"/>`).join("")}</p:sldLayoutIdLst>${txStyles}</p:sldMaster>`,
    ],
    [
      "ppt/slideMasters/_rels/slideMaster1.xml.rels",
      rels([...LAYOUTS.map((_, i): [string, string, string] => [`rId${i + 1}`, "slideLayout", `../slideLayouts/slideLayout${i + 1}.xml`]), [`rId${LAYOUTS.length + 1}`, "theme", "../theme/theme1.xml"]]),
    ],
    ["ppt/theme/theme1.xml", theme],
  ];
  LAYOUTS.forEach((l, i) => {
    parts.push([
      `ppt/slideLayouts/slideLayout${i + 1}.xml`,
      `${X}<p:sldLayout ${NSP} type="${l.type}" preserve="1">${tree(layoutShapes(l.type, w)).replace("<p:cSld>", `<p:cSld name="${l.name}">`)}<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`,
    ]);
    parts.push([`ppt/slideLayouts/_rels/slideLayout${i + 1}.xml.rels`, rels([["rId1", "slideMaster", "../slideMasters/slideMaster1.xml"]])]);
  });
  return parts;
}
