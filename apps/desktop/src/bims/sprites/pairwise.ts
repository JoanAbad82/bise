// The bims review's covering arrays (bim-review, Gabriel m_48073 « toutes les combinaisons »): the
// product of every dimension of a bim (its head, skin, hair colour, hat colour, outfit, pose, frame,
// camera, light) is far too big to render, so each run draws a pairwise set: rows in which every
// pair of values of two dimensions shows up at least once, when a valid row can hold it. A greedy
// AETG-like build, seeded, so a run's rows are the same every time; the full product is walked
// lazily by `product` (the background sweep). Pure, no three. Owner: bim-review.

/** one dimension: its name and its values (strings: a row is a record of them) */
export interface Dim {
  readonly name: string;
  readonly values: readonly string[];
}

/** a row, or a partial one while it is built: dimension name -> value */
export type Row = Readonly<Record<string, string>>;

/**
 * Whether a row may exist. It is called on partial rows too: it must answer false only when the
 * values already set can never be part of a valid row (a missing key is "not chosen yet").
 */
export type Valid = (r: Row) => boolean;

/** mulberry32, seeded: the build's tie-breaks */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const key = (i: number, a: string, j: number, b: string): string => `${String(i)}\u0001${a}\u0002${String(j)}\u0001${b}`;

/** every pair two dimensions' values make that a valid row may hold, as keys */
function pairsOf(dims: readonly Dim[], valid: Valid): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i < dims.length; i++) {
    const di = dims[i] as Dim;
    for (let j = i + 1; j < dims.length; j++) {
      const dj = dims[j] as Dim;
      for (const a of di.values) for (const b of dj.values) if (valid({ [di.name]: a, [dj.name]: b })) out.add(key(i, a, j, b));
    }
  }
  return out;
}

/** the pairs a full row covers, as keys */
function pairsIn(dims: readonly Dim[], r: Row): string[] {
  const out: string[] = [];
  for (let i = 0; i < dims.length; i++) {
    for (let j = i + 1; j < dims.length; j++) {
      const a = r[(dims[i] as Dim).name];
      const b = r[(dims[j] as Dim).name];
      if (a !== undefined && b !== undefined) out.push(key(i, a, j, b));
    }
  }
  return out;
}

export interface Pairwise {
  readonly rows: readonly Row[];
  /** the pairs no valid row could hold once its other values were picked (the valid predicate's corners), as `dim=value & dim=value` */
  readonly unreachable: readonly string[];
}

/**
 * Rows covering every valid pair of values. Each row starts from the first pair still uncovered,
 * then fills the other dimensions one by one (in a seeded order) with the value that covers the
 * most new pairs and keeps the row valid. Pure, deterministic for a seed.
 */
export function pairwise(dims: readonly Dim[], valid: Valid, seed = 1): Pairwise {
  const rand = rng(seed);
  const left = pairsOf(dims, valid);
  const rows: Row[] = [];
  const unreachable: string[] = [];
  const index = new Map(dims.map((d, i) => [d.name, i]));
  while (left.size > 0) {
    const first = left.values().next().value as string;
    const [ia, a, ib, b] = first.split(/[\u0001\u0002]/) as [string, string, string, string];
    const di = dims[Number(ia)] as Dim;
    const dj = dims[Number(ib)] as Dim;
    const row: Record<string, string> = { [di.name]: a, [dj.name]: b };
    const rest = dims.filter((d) => d !== di && d !== dj).map((d) => ({ d, r: rand() })).sort((x, y) => x.r - y.r).map((x) => x.d);
    let ok = true;
    for (const d of rest) {
      const k = index.get(d.name) as number;
      let best: string | null = null;
      let bestGain = -1;
      let bestTie = 0;
      for (const v of d.values) {
        const cand = { ...row, [d.name]: v };
        if (!valid(cand)) continue;
        let gain = 0;
        for (const [n, w] of Object.entries(row)) {
          const o = index.get(n) as number;
          const pk = o < k ? key(o, w, k, v) : key(k, v, o, w);
          if (left.has(pk)) gain++;
        }
        const tie = rand();
        if (gain > bestGain || (gain === bestGain && tie < bestTie)) {
          best = v;
          bestGain = gain;
          bestTie = tie;
        }
      }
      if (best === null) {
        ok = false;
        break;
      }
      row[d.name] = best;
    }
    if (!ok || !valid(row)) {
      left.delete(first);
      unreachable.push(`${di.name}=${a} & ${dj.name}=${b}`);
      continue;
    }
    for (const p of pairsIn(dims, row)) left.delete(p);
    rows.push(row);
  }
  return { rows, unreachable };
}

/** whether `rows` hold every pair of `dims` that a valid row may hold, but the ones named unreachable: the missing ones */
export function missingPairs(dims: readonly Dim[], valid: Valid, rows: readonly Row[], unreachable: readonly string[] = []): string[] {
  const want = pairsOf(dims, valid);
  for (const r of rows) for (const p of pairsIn(dims, r)) want.delete(p);
  const skip = new Set(unreachable);
  const out: string[] = [];
  for (const p of want) {
    const [ia, a, ib, b] = p.split(/[\u0001\u0002]/) as [string, string, string, string];
    const s = `${(dims[Number(ia)] as Dim).name}=${a} & ${(dims[Number(ib)] as Dim).name}=${b}`;
    if (!skip.has(s)) out.push(s);
  }
  return out;
}

/** the full product's valid rows, one by one (the background sweep walks it in shards) */
export function* product(dims: readonly Dim[], valid: Valid): Generator<Row> {
  const walk = function* (i: number, row: Record<string, string>): Generator<Row> {
    if (i === dims.length) {
      yield { ...row };
      return;
    }
    const d = dims[i] as Dim;
    for (const v of d.values) {
      row[d.name] = v;
      if (valid(row)) yield* walk(i + 1, row);
      delete row[d.name];
    }
  };
  yield* walk(0, {});
}
