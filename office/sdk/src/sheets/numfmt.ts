// A cell's value as Excel shows it, for the outline's `text` and the
// viewer: the common number formats (General, 0.00, #,##0, %, currency,
// scientific, dates and times, sections `pos;neg;zero;text`, quoted text,
// [Red]). Pure. A format it does not know falls back to General: the
// value is still right, its look may differ from Excel's.

const DAY_MS = 86400000;
const EPOCH_1900 = Date.UTC(1899, 11, 30);
const EPOCH_1904 = Date.UTC(1904, 0, 1);
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Excel's built-in formats by numFmtId (the ones files use without writing them). */
export const BUILTIN: Record<number, string> = {
  0: "General", 1: "0", 2: "0.00", 3: "#,##0", 4: "#,##0.00", 9: "0%", 10: "0.00%", 11: "0.00E+00",
  14: "m/d/yyyy", 15: "d-mmm-yy", 16: "d-mmm", 17: "mmm-yy", 18: "h:mm AM/PM", 19: "h:mm:ss AM/PM",
  20: "h:mm", 21: "h:mm:ss", 22: "m/d/yyyy h:mm", 37: "#,##0 ;(#,##0)", 38: "#,##0 ;[Red](#,##0)",
  39: "#,##0.00;(#,##0.00)", 40: "#,##0.00;[Red](#,##0.00)", 45: "mm:ss", 46: "[h]:mm:ss", 47: "mmss.0", 48: "##0.0E+0", 49: "@",
};

/** A Date as Excel's serial number (days since its epoch). */
export function serial(d: Date, date1904 = false): number {
  return (d.getTime() - (date1904 ? EPOCH_1904 : EPOCH_1900)) / DAY_MS;
}

/** The text of a value under a format. */
export function formatValue(v: unknown, fmt: string | undefined, date1904 = false): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "string") return textSection(fmt, v);
  if (v instanceof Date) return formatNumber(serial(v, date1904), fmt && fmt !== "General" ? fmt : "yyyy-mm-dd");
  if (typeof v === "number") return formatNumber(v, fmt);
  return String(v);
}

function textSection(fmt: string | undefined, s: string): string {
  const parts = fmt ? split(fmt) : [];
  const t = parts[3] ?? (parts.length === 1 && parts[0].includes("@") ? parts[0] : undefined);
  return t ? literal(t).replace("@", s) : s;
}

/** A number under a format (General when absent or not understood). */
export function formatNumber(n: number, fmt: string | undefined): string {
  if (!Number.isFinite(n)) return "#NUM!";
  if (!fmt || /^general$/i.test(fmt)) return general(n);
  const parts = split(fmt);
  let sec = parts[0];
  let x = n;
  if (n < 0 && parts.length > 1) {
    sec = parts[1];
    x = -n;
  } else if (n === 0 && parts.length > 2) sec = parts[2];
  sec = sec.replace(/\[(Red|Black|Blue|Green|White|Yellow|Cyan|Magenta|Color\s*\d+)\]/gi, "").replace(/\[\$([^\]-]*)(-[^\]]*)?\]/g, '"$1"');
  if (/^general$/i.test(sec.trim())) return general(x);
  if (isDate(sec)) return date(x, sec);
  return number(x, sec, n < 0 && parts.length === 1);
}

function general(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1e11) return String(n);
  const a = Math.abs(n);
  if (a !== 0 && (a < 1e-9 || a >= 1e11)) return n.toExponential(5).replace(/\.?0+e/, "E").replace("E+", "E+").replace(/E([+-])(\d)$/, "E$10$2");
  return String(Number(n.toPrecision(11)));
}

/** Sections split on `;`, not inside quotes. */
function split(fmt: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < fmt.length; i++) {
    const c = fmt[i];
    if (c === '"') q = !q;
    if (c === "\\" && i + 1 < fmt.length) {
      cur += c + fmt[++i];
      continue;
    }
    if (c === ";" && !q) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

/** Quoted text and \x escapes as plain text; `_x` (a space the width of x) as one space; `*x` dropped. */
function literal(s: string): string {
  return s.replace(/"([^"]*)"|\\(.)|_(.)|\*(.)/g, (_m, q, e, u) => (q !== undefined ? q : e !== undefined ? e : u !== undefined ? " " : ""));
}

function isDate(sec: string): boolean {
  const bare = sec.replace(/"[^"]*"|\\./g, "");
  return /[ymdhs]/i.test(bare) && !/[0#?]/.test(bare.replace(/s+\.0+/i, ""));
}

function number(x: number, sec: string, neg: boolean): string {
  // the pattern: the run of 0 # ? , . % E around which the literals sit
  const m = /^(.*?)([#0?,]*(?:\.[#0?]*)?(?:[Ee][+-][0#]+)?)([^#0?]*)$/.exec(sec.replace(/"[^"]*"|\\./g, (t) => "\u0000".repeat(t.length)));
  if (!m || !m[2]) return literal(sec);
  const pre = literal(sec.slice(0, m[1].length));
  const post = literal(sec.slice(m[1].length + m[2].length));
  let pat = m[2];
  let v = x;
  const pct = (sec.replace(/"[^"]*"/g, "").match(/%/g) ?? []).length;
  v *= 100 ** pct;
  // trailing commas scale by 1000
  while (/,$/.test(pat)) {
    pat = pat.slice(0, -1);
    v /= 1000;
  }
  let body: string;
  const e = /[Ee]([+-])([0#]+)$/.exec(pat);
  if (e) {
    const mant = pat.slice(0, e.index);
    const dec = (mant.split(".")[1] ?? "").length;
    let exp = v === 0 ? 0 : Math.floor(Math.log10(Math.abs(v)));
    let mv = v / 10 ** exp;
    if (Number(mv.toFixed(dec)) >= 10) {
      exp++;
      mv /= 10;
    }
    const es = String(Math.abs(exp)).padStart(e[2].length, "0");
    body = `${mv.toFixed(dec)}E${exp < 0 ? "-" : e[1] === "+" ? "+" : ""}${es}`;
  } else {
    const [ip, dp = ""] = pat.split(".");
    const dec = dp.length;
    const fixed = Math.abs(v).toFixed(dec);
    let [int, frac = ""] = fixed.split(".");
    const minInt = (ip.replace(/,/g, "").match(/0/g) ?? []).length;
    if (int === "0" && minInt === 0) int = "";
    int = int.padStart(minInt, "0");
    if (ip.includes(",")) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const minDec = (dp.match(/0/g) ?? []).length;
    while (frac.length > minDec && frac.endsWith("0")) frac = frac.slice(0, -1);
    body = frac ? `${int}.${frac}` : dp.length && minDec === 0 && pat.endsWith(".") ? `${int}.` : int;
    if (!body) body = "0";
  }
  return `${neg && x !== 0 ? "-" : ""}${pre}${body}${post}`;
}

function date(x: number, sec: string): string {
  const ms = Math.round(x * DAY_MS);
  const d = new Date(EPOCH_1900 + ms);
  const ampm = /AM\/PM|A\/P/i.test(sec);
  const tokens = sec.match(/"[^"]*"|\\.|\[h+\]|\[m+\]|\[s+\]|yyyy|yy|m{1,5}|d{1,4}|h{1,2}|s{1,2}(?:\.0+)?|AM\/PM|A\/P|./gi) ?? [];
  const out: string[] = [];
  tokens.forEach((t, i) => {
    const lower = t.toLowerCase();
    // m after h or before s is minutes
    const prev = tokens.slice(0, i).reverse().find((p) => /^[hs]|^\[/i.test(p) || /^[dy]/i.test(p));
    const next = tokens.slice(i + 1).find((p) => /^[a-z[]/i.test(p));
    const minute = /^m{1,2}$/.test(lower) && ((prev && /^\[?h/i.test(prev)) || (next && /^s/i.test(next)));
    if (t.startsWith('"')) out.push(t.slice(1, -1));
    else if (t.startsWith("\\")) out.push(t.slice(1));
    else if (lower === "yyyy") out.push(String(d.getUTCFullYear()));
    else if (lower === "yy") out.push(String(d.getUTCFullYear() % 100).padStart(2, "0"));
    else if (minute) out.push(String(d.getUTCMinutes()).padStart(lower.length, "0"));
    else if (lower === "mmmmm") out.push(MONTHS[d.getUTCMonth()][0]);
    else if (lower === "mmmm") out.push(MONTHS[d.getUTCMonth()]);
    else if (lower === "mmm") out.push(MONTHS[d.getUTCMonth()].slice(0, 3));
    else if (/^m{1,2}$/.test(lower)) out.push(String(d.getUTCMonth() + 1).padStart(lower.length, "0"));
    else if (lower === "dddd") out.push(DAYS[d.getUTCDay()]);
    else if (lower === "ddd") out.push(DAYS[d.getUTCDay()].slice(0, 3));
    else if (/^d{1,2}$/.test(lower)) out.push(String(d.getUTCDate()).padStart(lower.length, "0"));
    else if (/^\[h+\]$/.test(lower)) out.push(String(Math.floor(ms / 3600000)));
    else if (/^\[m+\]$/.test(lower)) out.push(String(Math.floor(ms / 60000)));
    else if (/^\[s+\]$/.test(lower)) out.push(String(Math.floor(ms / 1000)));
    else if (/^h{1,2}$/.test(lower)) {
      let h = d.getUTCHours();
      if (ampm) h = h % 12 || 12;
      out.push(String(h).padStart(lower.length, "0"));
    } else if (/^s{1,2}/.test(lower)) {
      const [, frac] = lower.split(".");
      out.push(String(d.getUTCSeconds()).padStart(2, "0").slice(-Math.max(lower.split(".")[0].length, 1)));
      if (frac) out.push(`.${String(d.getUTCMilliseconds()).padStart(3, "0").slice(0, frac.length)}`);
    } else if (lower === "am/pm") out.push(d.getUTCHours() < 12 ? "AM" : "PM");
    else if (lower === "a/p") out.push(d.getUTCHours() < 12 ? "A" : "P");
    else if (t === "_" || t === "*") out.push("");
    else out.push(t);
  });
  return out.join("");
}
