// /debug completion's charts, the pure part (designer debug-viz v5, architect m_41684): the hub's
// classifier (bise_session::completion::groups) gives each row its parts (role, kind, names,
// tokens); here they are only summed by level, binned and filtered, never parsed again.
// A part's path: its role, then its kind ('k:' + the kind) or, for a tool, its name ('n:' + name),
// then its names ('n:' + name), at most 3 levels. A level shows its 7 biggest children and the rest
// as one 'other' node (the same path, the shown keys excluded). Owner: debug-viz.
import type { CompPart, CompRow } from "@/proto";

/** A group: the parts whose path starts with `path`, but those whose next key is in `exclude`. */
export type Sel = { path: readonly string[]; exclude?: readonly string[] };

/** A bar of one level. `rest`: the 'other' node of a level (its path is the parent's). */
export type Node = Sel & { key: string; tokens: number; count: number; deeper: boolean; rest: boolean };

/** The list's filter: a group, a size range (tokens of one part, from inclusive, to exclusive). */
export type Filter = { sel?: Sel; size?: { from: number; to: number } };

export const SHOWN = 7;
const MAX_DEPTH = 3;

export function pathOf(p: CompPart): string[] {
  const out: string[] = [p.role];
  if (p.kind !== "tool") out.push(`k:${p.kind}`);
  for (const n of p.names ?? []) out.push(`n:${n}`);
  return out.slice(0, MAX_DEPTH);
}

export function inSel(p: CompPart, s: Sel | undefined): boolean {
  if (s === undefined) return true;
  const path = pathOf(p);
  if (s.path.some((k, i) => path[i] !== k)) return false;
  if (s.exclude === undefined) return true;
  const next = path[s.path.length];
  return next === undefined || !s.exclude.includes(next);
}

function inSize(p: CompPart, size: Filter["size"]): boolean {
  return size === undefined || (p.tokens >= size.from && p.tokens < size.to);
}

export function partsOf(rows: readonly CompRow[]): CompPart[] {
  return rows.flatMap((r) => r.parts ?? []);
}

export function sameSel(a: Sel | undefined, b: Sel | undefined): boolean {
  if (a === undefined || b === undefined) return a === b;
  const ex = (s: Sel) => (s.exclude ?? []).join("\u0000");
  return a.path.join("\u0000") === b.path.join("\u0000") && (a.exclude === undefined) === (b.exclude === undefined) && ex(a) === ex(b);
}

/** The children of `path`, biggest first: 7 and one 'other' node for the rest. */
export function level(rows: readonly CompRow[], path: readonly string[]): Node[] {
  const by = new Map<string, { tokens: number; count: number; deeper: boolean }>();
  let loose = { tokens: 0, count: 0 };
  for (const p of partsOf(rows)) {
    if (!inSel(p, { path })) continue;
    const full = pathOf(p);
    const key = full[path.length];
    if (key === undefined) {
      loose = { tokens: loose.tokens + p.tokens, count: loose.count + 1 };
      continue;
    }
    const b = by.get(key) ?? { tokens: 0, count: 0, deeper: false };
    by.set(key, { tokens: b.tokens + p.tokens, count: b.count + 1, deeper: b.deeper || full.length > path.length + 1 });
  }
  const sorted = [...by.entries()].sort((a, b) => b[1].tokens - a[1].tokens || a[0].localeCompare(b[0]));
  const many = sorted.length > SHOWN + 1;
  const shown = many ? sorted.slice(0, SHOWN) : sorted;
  const out: Node[] = shown.map(([key, b]) => ({ key, path: [...path, key], tokens: b.tokens, count: b.count, deeper: b.deeper, rest: false }));
  const rest = (many ? sorted.slice(SHOWN) : []).reduce((a, [, b]) => ({ tokens: a.tokens + b.tokens, count: a.count + b.count }), loose);
  if (rest.count > 0 && out.length > 0) {
    out.push({ key: "other", path: [...path], exclude: shown.map(([k]) => k), tokens: rest.tokens, count: rest.count, deeper: false, rest: true });
  }
  return out;
}

/** The rows the filter keeps: a row with one part in the group and the size range. */
export function filterRows(rows: readonly CompRow[], f: Filter): CompRow[] {
  if (f.sel === undefined && f.size === undefined) return [...rows];
  return rows.filter((r) => (r.parts ?? []).some((p) => inSel(p, f.sel) && inSize(p, f.size)));
}

export function total(rows: readonly CompRow[], s?: Sel): number {
  return partsOf(rows).reduce((n, p) => n + (inSel(p, s) ? p.tokens : 0), 0);
}

/** The value at quantile q of sorted values (nearest rank). */
export function quantile(sorted: readonly number[], q: number): number {
  if (sorted.length === 0) return 0;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1));
  return sorted[i] ?? 0;
}

export type Bin = { from: number; to: number; count: number };
export type Hist = { bins: Bin[]; n: number; median: number; p99: number; over: number };

/** The group's part sizes in `count` bins from 0 to its p99; what is over the p99 counted apart. */
export function histogram(rows: readonly CompRow[], s: Sel | undefined, count = 24): Hist {
  const v = partsOf(rows).filter((p) => inSel(p, s)).map((p) => p.tokens).sort((a, b) => a - b);
  const p99 = quantile(v, 0.99);
  const width = Math.max(1, Math.ceil((p99 + 1) / count));
  const bins: Bin[] = Array.from({ length: count }, (_, i) => ({ from: i * width, to: (i + 1) * width, count: 0 }));
  let over = 0;
  for (const t of v) {
    if (t > p99) over += 1;
    else {
      const b = bins[Math.min(count - 1, Math.floor(t / width))];
      if (b !== undefined) b.count += 1;
    }
  }
  return { bins, n: v.length, median: quantile(v, 0.5), p99, over };
}

/** One bar per message (row 1 on): its tokens, and the group's share of them. */
export type Bar = { n: number; tokens: number; picked: number };

export function series(rows: readonly CompRow[], s: Sel | undefined): Bar[] {
  return rows
    .filter((r) => r.n > 0)
    .map((r) => ({ n: r.n, tokens: r.tokens, picked: (r.parts ?? []).reduce((a, p) => a + (inSel(p, s) ? p.tokens : 0), 0) }));
}

/** The k tallest bars by the group's share (all of it with no group), tallest first. */
export function peaks(bars: readonly Bar[], k = 3): Bar[] {
  return [...bars].filter((b) => b.picked > 0).sort((a, b) => b.picked - a.picked || a.n - b.n).slice(0, k);
}

/** A row's biggest part in the group: what a peak's label names. */
export function topPart(row: CompRow, s: Sel | undefined): CompPart | undefined {
  return (row.parts ?? []).filter((p) => inSel(p, s)).sort((a, b) => b.tokens - a.tokens)[0];
}

/** A token count in the charts: 940, 9.1k, 1.2M. */
export function kTokens(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

/** The share as a whole percent, '<1%' when small but there. */
export function share(part: number, whole: number): string {
  if (whole <= 0) return "0%";
  const p = (100 * part) / whole;
  return p > 0 && p < 1 ? "<1%" : `${String(Math.round(p))}%`;
}
