// What changed between two outlines of a file (two versions of an
// artifact): the viewer marks it, an agent says it. By id, so a moved
// shape is "changed", not removed and added.

import type { Outline, OutlineNode } from "./outline.ts";

export type Change = { before: OutlineNode; after: OutlineNode; fields: string[] };

export type OutlineDiff = {
  added: OutlineNode[];
  removed: OutlineNode[];
  changed: Change[];
};

/** Every node of an outline, depth first, without its children. */
export function flatten(outline: Outline): OutlineNode[] {
  const out: OutlineNode[] = [];
  const walk = (nodes: OutlineNode[]) => {
    for (const n of nodes) {
      const { children, ...own } = n;
      out.push(own);
      if (children) walk(children);
    }
  };
  walk(outline.nodes);
  return out;
}

/** The nodes added, removed and changed (own fields only: a slide whose shape changed is not itself changed). */
export function diff(before: Outline, after: Outline): OutlineDiff {
  const was = new Map(flatten(before).map((n) => [n.id, n]));
  const now = new Map(flatten(after).map((n) => [n.id, n]));
  const added: OutlineNode[] = [];
  const removed: OutlineNode[] = [];
  const changed: Change[] = [];
  for (const [id, n] of now) {
    const w = was.get(id);
    if (!w) {
      added.push(n);
      continue;
    }
    const fields = changedFields(w, n);
    if (fields.length) changed.push({ before: w, after: n, fields });
  }
  for (const [id, w] of was) if (!now.has(id)) removed.push(w);
  return { added, removed, changed };
}

function changedFields(a: OutlineNode, b: OutlineNode): string[] {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out: string[] = [];
  for (const k of [...keys].sort()) {
    if (stable((a as Record<string, unknown>)[k]) !== stable((b as Record<string, unknown>)[k])) out.push(k);
  }
  return out;
}

/** JSON with sorted keys: the same value, the same text. */
export function stable(v: unknown): string {
  if (v === undefined) return "";
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o)
    .filter((k) => o[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stable(o[k])}`)
    .join(",")}}`;
}
