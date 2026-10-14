// What a save changed, as a short list of anchors (office-artifacts plan §9b,
// architect m_23911): `bise office run`'s run.write sends it with the new
// version, the viewer marks those parts, the hub says "2 slides changed".
// Which node is which anchor is the SDK's knowledge, next to inspect/at/diff.
//
// - added and changed nodes: their own anchor;
// - a removed shape: its slide (still there, now without it); a removed
//   cell: the cell (its place is still in the grid); a removed slide,
//   sheet or paragraph: nothing to point at;
// - a container (a sheet, a slide, a table) whose own fields changed only
//   because its children did (a sheet's used range) is left out when one
//   of its children is in the list;
// - past `cap`: cells become one range per sheet (the box around them),
//   shapes become their slides, then the list is cut at `cap`.

import type { Anchor } from "../anchor.gen.ts";
import { diff, stable } from "./diff.ts";
import type { Outline, OutlineNode } from "./outline.ts";

/** The default cap: the hub keeps at most this many (artifacts_turns::CHANGED_CAP). */
export const CHANGED_CAP = 24;

/** Each node's id → its parent node (top-level nodes have none). */
function parents(outline: Outline): Map<string, OutlineNode> {
  const out = new Map<string, OutlineNode>();
  const walk = (nodes: OutlineNode[], parent?: OutlineNode) => {
    for (const n of nodes) {
      if (parent) out.set(n.id, parent);
      if (n.children) walk(n.children, n);
    }
  };
  walk(outline.nodes);
  return out;
}

const CONTAINERS = new Set(["sheet", "slide", "table"]);

/** The anchors of what changed from `before` to `after`, deduped, at most `cap`. */
export function changedOf(before: Outline, after: Outline, cap = CHANGED_CAP): Anchor[] {
  const d = diff(before, after);
  const up = parents(after);
  const upBefore = parents(before);
  const listed: OutlineNode[] = [...d.added, ...d.changed.map((c) => c.after)];
  const childOf = new Set(listed.map((n) => up.get(n.id)?.id).filter((x): x is string => !!x));
  const out: Anchor[] = [];
  for (const n of listed) {
    if (CONTAINERS.has(n.type) && childOf.has(n.id) && !d.added.some((a) => a.id === n.id)) continue;
    out.push(n.anchor);
  }
  for (const n of d.removed) {
    if (n.anchor.kind === "cell" && n.type === "cell") out.push(n.anchor);
    else if (n.anchor.kind === "shape") {
      // its slide in the new outline (slides may have moved)
      const was = upBefore.get(n.id);
      const now = was && flatFind(after, was.id);
      if (now) out.push(now.anchor);
    }
  }
  return coarsen(dedupe(out), cap);
}

function flatFind(o: Outline, id: string): OutlineNode | undefined {
  const walk = (nodes: OutlineNode[]): OutlineNode | undefined => {
    for (const n of nodes) {
      if (n.id === id) return n;
      const c = n.children && walk(n.children);
      if (c) return c;
    }
    return undefined;
  };
  return walk(o.nodes);
}

function dedupe(xs: Anchor[]): Anchor[] {
  const seen = new Set<string>();
  return xs.filter((a) => {
    const k = stable(a);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** `B4` → [col 2, row 4]; `B4:D9` → the two corners. */
function corners(range: string): [number, number, number, number] | null {
  const m = /^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/.exec(range.replace(/\$/g, "").toUpperCase());
  if (!m) return null;
  const c1 = colNum(m[1]);
  const r1 = Number(m[2]);
  const c2 = m[3] ? colNum(m[3]) : c1;
  const r2 = m[4] ? Number(m[4]) : r1;
  return [Math.min(c1, c2), Math.min(r1, r2), Math.max(c1, c2), Math.max(r1, r2)];
}

function colNum(s: string): number {
  let n = 0;
  for (const ch of s) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

function colName(n: number): string {
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** Past the cap: one box per sheet, slides for shapes, then cut. */
function coarsen(xs: Anchor[], cap: number): Anchor[] {
  if (xs.length <= cap) return xs;
  const boxes = new Map<string, [number, number, number, number]>();
  const out: Anchor[] = [];
  for (const a of xs) {
    if (a.kind === "cell") {
      const c = corners(a.range);
      if (!c) continue;
      const b = boxes.get(a.sheet);
      if (!b) {
        boxes.set(a.sheet, c);
        out.push(a); // its place in the list; the range is set below
      } else {
        boxes.set(a.sheet, [Math.min(b[0], c[0]), Math.min(b[1], c[1]), Math.max(b[2], c[2]), Math.max(b[3], c[3])]);
      }
    } else if (a.kind === "shape") {
      out.push({ kind: "slide", slide: a.slide });
    } else {
      out.push(a);
    }
  }
  const boxed = out.map((a): Anchor => {
    if (a.kind !== "cell") return a;
    const [c1, r1, c2, r2] = boxes.get(a.sheet)!;
    const range = c1 === c2 && r1 === r2 ? `${colName(c1)}${r1}` : `${colName(c1)}${r1}:${colName(c2)}${r2}`;
    return { kind: "cell", sheet: a.sheet, range };
  });
  return dedupe(boxed).slice(0, cap);
}
