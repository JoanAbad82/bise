// A small formula evaluator, pure: so a sheet an agent writes has values
// in our viewer and in Quick Look before Excel opens it (exceljs writes
// formulas without results; plan risks). Arithmetic, comparison, `&`,
// cell and range references (same sheet or `Sheet!A1`, `'My sheet'!A1:B2`),
// and the functions in FUNCS, each pinned by rows of the table test
// (test/sheets-formula.test.mjs). A wrong cached value is worse than none
// (architect m_23850): a function we cannot pin to Excel's rules stays out.
// Anything else is `Unsupported`: the caller keeps the cell's old result,
// check() names it, Excel recomputes on open (fullCalcOnLoad).

import { readBox, readCell, splitRef } from "./addr.ts";

export type ErrorValue = { error: string };
export type Scalar = number | string | boolean | null | ErrorValue;
type Range = { range: Scalar[][] };
type Value = Scalar | Range;

/** Thrown for what the evaluator does not know (a function, a syntax). */
export class Unsupported extends Error {}

/** Where references read: a cell's value (computing it when it is a formula). */
export type Lookup = (sheet: string, row: number, col: number) => Scalar;

const err = (e: string): ErrorValue => ({ error: e });
export const isError = (v: unknown): v is ErrorValue => !!v && typeof v === "object" && "error" in (v as object);

// ---- tokens and parse ----

type Tok = { t: "num" | "str" | "ref" | "name" | "op" | "(" | ")" | "," | "bool" | "err"; v: string };

function tokens(src: string): Tok[] {
  const out: Tok[] = [];
  const re = /\s+|(\d+\.?\d*(?:[Ee][+-]?\d+)?|\.\d+)|("(?:[^"]|"")*")|((?:'(?:[^']|'')+'|[A-Za-z_][\w.]*)!\$?[A-Za-z]{1,3}\$?\d+(?::\$?[A-Za-z]{1,3}\$?\d+)?|\$?[A-Za-z]{1,3}\$?\d+(?::\$?[A-Za-z]{1,3}\$?\d+)?(?![\w(]))|(TRUE|FALSE)(?![\w(])|(#(?:DIV\/0!|N\/A|NAME\?|NULL!|NUM!|REF!|VALUE!))|([A-Za-z_][\w.]*)|(<=|>=|<>|[-+*/^&=<>%])|([(),])/giy;
  let m: RegExpExecArray | null;
  let i = 0;
  while (i < src.length) {
    re.lastIndex = i;
    m = re.exec(src);
    if (!m || m[0].length === 0) throw new Unsupported(`cannot read the formula at "${src.slice(i, i + 10)}"`);
    i = re.lastIndex;
    if (m[1]) out.push({ t: "num", v: m[1] });
    else if (m[2]) out.push({ t: "str", v: m[2].slice(1, -1).replace(/""/g, '"') });
    else if (m[3]) out.push({ t: "ref", v: m[3] });
    else if (m[4]) out.push({ t: "bool", v: m[4].toUpperCase() });
    else if (m[5]) out.push({ t: "err", v: m[5].toUpperCase() });
    else if (m[6]) out.push({ t: "name", v: m[6].toUpperCase() });
    else if (m[7]) out.push({ t: "op", v: m[7] });
    else if (m[8]) out.push({ t: m[8] as "(" | ")" | ",", v: m[8] });
  }
  return out;
}

type Node =
  | { k: "lit"; v: Scalar }
  | { k: "ref"; v: string }
  | { k: "un"; op: string; a: Node }
  | { k: "bin"; op: string; a: Node; b: Node }
  | { k: "call"; name: string; args: Node[] };

const BIN: Record<string, number> = { "=": 1, "<>": 1, "<": 1, ">": 1, "<=": 1, ">=": 1, "&": 2, "+": 3, "-": 3, "*": 4, "/": 4, "^": 5 };

export function parseFormula(src: string): Node {
  const ts = tokens(src.replace(/^=/, ""));
  let p = 0;
  const peek = () => ts[p];
  const expr = (min: number): Node => {
    let a = unary();
    for (;;) {
      const t = peek();
      if (t?.t === "op" && t.v === "%") {
        p++;
        a = { k: "bin", op: "/", a, b: { k: "lit", v: 100 } };
        continue;
      }
      if (!t || t.t !== "op" || !(t.v in BIN) || BIN[t.v] < min) return a;
      p++;
      const prec = BIN[t.v];
      // every Excel operator is left-associative, ^ too: 2^3^2 is 64
      a = { k: "bin", op: t.v, a, b: expr(prec + 1) };
    }
  };
  const unary = (): Node => {
    const t = peek();
    if (t?.t === "op" && (t.v === "-" || t.v === "+")) {
      p++;
      return { k: "un", op: t.v, a: unary() };
    }
    return atom();
  };
  const atom = (): Node => {
    const t = ts[p++];
    if (!t) throw new Unsupported("the formula ends too soon");
    if (t.t === "num") return { k: "lit", v: Number(t.v) };
    if (t.t === "str") return { k: "lit", v: t.v };
    if (t.t === "bool") return { k: "lit", v: t.v === "TRUE" };
    if (t.t === "err") return { k: "lit", v: err(t.v) };
    if (t.t === "ref") return { k: "ref", v: t.v };
    if (t.t === "(") {
      const e = expr(0);
      if (ts[p++]?.t !== ")") throw new Unsupported("a ( without its )");
      return e;
    }
    if (t.t === "name" && peek()?.t === "(") {
      p++;
      const args: Node[] = [];
      if (peek()?.t === ")") p++;
      else
        for (;;) {
          args.push(expr(0));
          const s = ts[p++];
          if (s?.t === ")") break;
          if (s?.t !== ",") throw new Unsupported("a function call without its )");
        }
      return { k: "call", name: t.v.replace(/^_XLFN\./, ""), args };
    }
    throw new Unsupported(`"${t.v}" (a defined name or a syntax this evaluator does not know)`);
  };
  const e = expr(0);
  if (p !== ts.length) throw new Unsupported(`unexpected "${ts[p].v}"`);
  return e;
}

// ---- evaluate ----

/** The value of a formula on `sheet`; throws Unsupported. */
export function evaluate(src: string, sheet: string, lookup: Lookup): Scalar {
  const v = ev(parseFormula(src), sheet, lookup);
  return isRange(v) ? (v.range[0]?.[0] ?? null) : v;
}

const isRange = (v: Value): v is Range => !!v && typeof v === "object" && "range" in v;

function ev(n: Node, sheet: string, look: Lookup): Value {
  switch (n.k) {
    case "lit":
      return n.v;
    case "ref": {
      const { sheet: s = sheet, range } = splitRef(n.v);
      // a reference is a range, one cell too: SUM(A1) skips text in A1 as SUM(A1:A2) does
      const c = readCell(range);
      if (c) return { range: [[look(s, c.row, c.col) ?? null]] };
      const b = readBox(range);
      if ((b.bottom - b.top + 1) * (b.right - b.left + 1) > 1_000_000) throw new Unsupported("a range over a million cells");
      const rows: Scalar[][] = [];
      for (let r = b.top; r <= b.bottom; r++) {
        const row: Scalar[] = [];
        for (let col = b.left; col <= b.right; col++) row.push(look(s, r, col) ?? null);
        rows.push(row);
      }
      return { range: rows };
    }
    case "un": {
      const a = num(scalar(ev(n.a, sheet, look)));
      return isError(a) ? a : n.op === "-" ? -a : a;
    }
    case "bin":
      return binary(n.op, scalar(ev(n.a, sheet, look)), scalar(ev(n.b, sheet, look)));
    case "call": {
      if (n.name === "IF") {
        const c = bool(scalar(ev(n.args[0], sheet, look)));
        if (isError(c)) return c;
        const branch = c ? n.args[1] : n.args[2];
        return branch ? ev(branch, sheet, look) : c ? true : false;
      }
      if (n.name === "IFERROR") {
        const v = scalar(ev(n.args[0], sheet, look));
        return isError(v) ? ev(n.args[1], sheet, look) : v;
      }
      const f = FUNCS[n.name];
      if (!f) throw new Unsupported(`the function ${n.name}`);
      return f(n.args.map((a) => ev(a, sheet, look)));
    }
  }
}

function scalar(v: Value): Scalar {
  return isRange(v) ? (v.range.length === 1 && v.range[0].length === 1 ? v.range[0][0] : err("#VALUE!")) : v;
}

function num(v: Scalar): number | ErrorValue {
  if (isError(v)) return v;
  if (v === null || v === "") return 0;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) && v.trim() !== "" ? n : err("#VALUE!");
}

function bool(v: Scalar): boolean | ErrorValue {
  if (isError(v)) return v;
  if (typeof v === "string") {
    const u = v.toUpperCase();
    return u === "TRUE" ? true : u === "FALSE" ? false : err("#VALUE!");
  }
  return !!v;
}

function text(v: Scalar): string | ErrorValue {
  if (isError(v)) return v;
  if (v === null) return "";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "number") {
    const t = String(sig15(v));
    // Excel's text of 1e21 or 1e-7 depends on a General width we do not model
    if (t.includes("e")) throw new Unsupported("the text of a number this large or small");
    return t;
  }
  return v;
}

/** A number at Excel's precision: 15 significant digits. */
export function sig15(x: number): number {
  return x === 0 ? 0 : Number(x.toPrecision(15));
}

/** x^y as Excel: 0 to a negative power is #DIV/0!, an overflow or a complex root #NUM!. */
function power(x: number, y: number): Scalar {
  if (x === 0 && y < 0) return err("#DIV/0!");
  if (x === 0 && y === 0) return err("#NUM!");
  const r = x ** y;
  return Number.isFinite(r) ? r : err("#NUM!");
}

function binary(op: string, a: Scalar, b: Scalar): Scalar {
  if (isError(a)) return a;
  if (isError(b)) return b;
  if (op === "&") return `${text(a)}${text(b)}`;
  if (["=", "<>", "<", ">", "<=", ">="].includes(op)) {
    const c = compare(a, b);
    return { "=": c === 0, "<>": c !== 0, "<": c < 0, ">": c > 0, "<=": c <= 0, ">=": c >= 0 }[op]!;
  }
  const x = num(a);
  const y = num(b);
  if (isError(x)) return x;
  if (isError(y)) return y;
  switch (op) {
    case "+": return x + y;
    case "-": return x - y;
    case "*": return x * y;
    case "/": return y === 0 ? err("#DIV/0!") : x / y;
    case "^": return power(x, y);
  }
  throw new Unsupported(`the operator ${op}`);
}

/** Excel's order: numbers < text < booleans; text compares without case. */
function compare(a: Scalar, b: Scalar): number {
  const rank = (v: Scalar) => (typeof v === "number" || v === null ? 0 : typeof v === "string" ? 1 : 2);
  const ra = rank(a);
  const rb = rank(b);
  if (a === null && typeof b === "string") return "".localeCompare(b.toLowerCase());
  if (ra !== rb) return ra - rb;
  if (ra === 0) return ((a as number) ?? 0) - ((b as number) ?? 0);
  if (ra === 1) {
    const x = (a as string).toLowerCase();
    const y = (b as string).toLowerCase();
    return x < y ? -1 : x > y ? 1 : 0;
  }
  return Number(a) - Number(b);
}

/** Every scalar of the args, ranges flattened; `fromRange` says which came from a range. */
function flat(args: Value[]): { v: Scalar; fromRange: boolean }[] {
  const out: { v: Scalar; fromRange: boolean }[] = [];
  for (const a of args) {
    if (isRange(a)) for (const row of a.range) for (const v of row) out.push({ v, fromRange: true });
    else out.push({ v: a, fromRange: false });
  }
  return out;
}

/** The numbers of the args as SUM sees them: in ranges only numbers count; direct args are converted. */
function numbers(args: Value[]): number[] | ErrorValue {
  const out: number[] = [];
  for (const { v, fromRange } of flat(args)) {
    if (isError(v)) return v;
    if (fromRange) {
      if (typeof v === "number") out.push(v);
    } else {
      const n = num(v);
      if (isError(n)) return n;
      out.push(n);
    }
  }
  return out;
}

const withNums = (f: (ns: number[]) => Scalar) => (args: Value[]): Scalar => {
  const ns = numbers(args);
  return isError(ns) ? ns : f(ns);
};

const one = (f: (x: number, y: number) => Scalar) => (args: Value[]): Scalar => {
  const x = num(scalar(args[0] ?? null));
  const y = num(scalar(args[1] ?? 0));
  if (isError(x)) return x;
  if (isError(y)) return y;
  return f(x, y);
};

const str = (f: (s: string, args: Value[]) => Scalar) => (args: Value[]): Scalar => {
  const s = text(scalar(args[0] ?? null));
  return isError(s) ? s : f(s, args);
};

function roundTo(x: number, d: number, mode: "near" | "up" | "down"): number {
  const m = 10 ** d;
  const v = Math.abs(x) * m;
  const r = mode === "near" ? Math.round(Number(v.toPrecision(15))) : mode === "up" ? Math.ceil(Number(v.toPrecision(15))) : Math.floor(Number(v.toPrecision(15)));
  return (Math.sign(x) * r) / m;
}

/** AND/OR: booleans and numbers count; text and blanks in ranges are skipped; nothing left is #VALUE!. */
function logical(args: Value[], f: (bs: boolean[]) => boolean): Scalar {
  const bs: boolean[] = [];
  for (const { v, fromRange } of flat(args)) {
    if (isError(v)) return v;
    if (v === null || (fromRange && typeof v === "string")) continue;
    const b = bool(v);
    if (isError(b)) return b;
    bs.push(b);
  }
  return bs.length ? f(bs) : err("#VALUE!");
}

/** A character count argument (LEFT, RIGHT, MID): a whole number from 0, else #VALUE!. */
function count(a: Value | undefined, dflt: number): number | ErrorValue {
  if (a === undefined) return dflt;
  const n = num(scalar(a));
  if (isError(n)) return n;
  return n < 0 ? err("#VALUE!") : Math.floor(n);
}

const FUNCS: Record<string, (args: Value[]) => Scalar> = {
  SUM: withNums((ns) => ns.reduce((a, b) => a + b, 0)),
  PRODUCT: withNums((ns) => (ns.length ? ns.reduce((a, b) => a * b, 1) : 0)),
  AVERAGE: withNums((ns) => (ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : err("#DIV/0!"))),
  MIN: withNums((ns) => (ns.length ? Math.min(...ns) : 0)),
  MAX: withNums((ns) => (ns.length ? Math.max(...ns) : 0)),
  MEDIAN: withNums((ns) => {
    if (!ns.length) return err("#NUM!");
    const s = [...ns].sort((a, b) => a - b);
    const h = s.length >> 1;
    return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
  }),
  COUNT: (args) => flat(args).filter(({ v, fromRange }) => typeof v === "number" || (!fromRange && !isError(num(v)) && v !== null)).length,
  COUNTA: (args) => flat(args).filter(({ v }) => v !== null).length,
  COUNTBLANK: (args) => flat(args).filter(({ v }) => v === null || v === "").length,
  ROUND: one((x, d) => roundTo(x, d, "near")),
  ROUNDUP: one((x, d) => roundTo(x, d, "up")),
  ROUNDDOWN: one((x, d) => roundTo(x, d, "down")),
  INT: one((x) => Math.floor(x)),
  ABS: one((x) => Math.abs(x)),
  SQRT: one((x) => (x < 0 ? err("#NUM!") : Math.sqrt(x))),
  POWER: one(power),
  MOD: one((x, y) => (y === 0 ? err("#DIV/0!") : x - y * Math.floor(x / y))),
  AND: (args) => logical(args, (bs) => bs.every(Boolean)),
  OR: (args) => logical(args, (bs) => bs.some(Boolean)),
  NOT: (args) => {
    const b = bool(scalar(args[0] ?? null));
    return isError(b) ? b : !b;
  },
  CONCAT: (args) => {
    let s = "";
    for (const { v } of flat(args)) {
      const t = text(v);
      if (isError(t)) return t;
      s += t;
    }
    return s;
  },
  LEN: str((s) => s.length),
  UPPER: str((s) => s.toUpperCase()),
  LOWER: str((s) => s.toLowerCase()),
  TRIM: str((s) => s.trim().replace(/ +/g, " ")),
  LEFT: str((s, a) => {
    const n = count(a[1], 1);
    return isError(n) ? n : s.slice(0, n);
  }),
  RIGHT: str((s, a) => {
    const n = count(a[1], 1);
    return isError(n) ? n : n === 0 ? "" : s.slice(-n);
  }),
  MID: str((s, a) => {
    const start = count(a[1], 1);
    const n = count(a[2], 0);
    if (isError(start)) return start;
    if (isError(n)) return n;
    return start < 1 ? err("#VALUE!") : s.slice(start - 1, start - 1 + n);
  }),
};
FUNCS.CONCATENATE = FUNCS.CONCAT;
