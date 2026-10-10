// /log's words and rows (the TUI's rust/tui/src/logview.rs, designer m_17266): the
// role column's label and colour kind, a header's size, a fold's '▸ 34 lines · 2.1 KB',
// the rules, the pages kept oldest first, find and filter over the rows. Owner: amb-web. Pure.
import type { LogItem, LogRole } from "@/proto";

/** A body folds past this many lines (designer m_17266: past 6 lines). */
export const FOLD_LINES = 6;

/** The colour a row's label and rail take (logview.rs kind_color). */
export type Kind =
  | "you"
  | "agent"
  | "thinking"
  | "call"
  | "result"
  | "failed"
  | "message"
  | "injected"
  | "system"
  | "summary"
  | "error"
  | "event";

export function kindOf(it: LogItem): Kind {
  switch (it.role) {
    case "you":
      return "you";
    case "assistant":
      return "agent";
    case "thinking":
      return "thinking";
    case "call":
      return "call";
    case "result":
      return it.ok === false ? "failed" : "result";
    case "message":
      return "message";
    case "injected":
      return "injected";
    case "system":
    case "tools":
      return "system";
    case "summary":
      return "summary";
    case "error":
      return "error";
    case "event":
    case "unknown":
      return "event";
  }
}

/** The assistant's word: the agent's name when it fits (7 chars), else 'agent'. */
const agentWord = (name: string): string => (name.length <= 7 ? name : "agent");

const CALLS: Readonly<Record<string, string>> = {
  bash: "$ bash",
  run_typescript: "⌁ ts",
  edit: "± edit",
  write_file: "± write",
  apply_patch: "± patch",
  read_file: "⇄ read",
};

/** The role column's words (logview.rs role_label). */
export function labelOf(it: LogItem, agent: string): string {
  const role: LogRole = it.role;
  switch (role) {
    case "you":
      return "› you";
    case "assistant":
      return `● ${agentWord(agent)}`;
    case "thinking":
      return "∴ thinking";
    case "call":
      return CALLS[it.tool ?? ""] ?? it.tool ?? "call";
    case "result":
      return it.ok === false ? "✗ result" : "└ result";
    case "message":
      return "@ message";
    case "injected":
      return "⊕ bise";
    case "system":
      return "§ system";
    case "tools":
      return "§ tools";
    case "summary":
      return "≡ summary";
    case "error":
      return "■ error";
    case "event":
    case "unknown":
      return "· event";
  }
}

/** The TUI's short_bytes: '512 B', '2.1 KB', '1.4 MB'. */
export function shortBytes(n: number): string {
  if (n < 1024) return `${String(n)} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** UTF-8 bytes of a text, as the TUI counts them. */
export function bytesOf(text: string): number {
  let n = 0;
  for (const ch of text) {
    const c = ch.codePointAt(0) ?? 0;
    n += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
  }
  return n;
}

/** A header's right column: its body's size, none without a body. */
export function sizeOf(it: LogItem): string {
  const t = it.body?.text ?? "";
  return t === "" ? "" : shortBytes(bytesOf(t));
}

export const linesOf = (text: string): number =>
  Math.max(1, text.replace(/\n+$/u, "").split("\n").length);

/** Whether a body folds (past FOLD_LINES lines). */
export const folds = (it: LogItem): boolean =>
  it.body !== undefined && linesOf(it.body.text) > FOLD_LINES;

/** A fold's words (logview.rs entry_rows): '▸ 34 lines · 2.1 KB'. */
export function foldLabel(it: LogItem): string {
  const t = it.body?.text ?? "";
  return `▸ ${String(linesOf(t))} lines · ${shortBytes(bytesOf(t))}`;
}

/** A rule's kind: a compaction draws green, a turn faint. */
export const ruleKind = (rule: string): "compact" | "turn" =>
  rule.includes("compacted") ? "compact" : "turn";

/** A header's time: HH:MM:SS local, none without one. */
export function timeOf(atMs: number | undefined, tz?: string): string {
  if (atMs === undefined) return "";
  return new Date(atMs).toLocaleTimeString("en-GB", {
    hour12: false,
    ...(tz === undefined ? {} : { timeZone: tz }),
  });
}

/** Bodies drawn as the thread's prose (the rest in mono, in the code box). */
export const prose = (it: LogItem): boolean =>
  it.body?.kind === "md" &&
  (it.role === "you" ||
    it.role === "assistant" ||
    it.role === "thinking" ||
    it.role === "summary" ||
    it.role === "message" ||
    it.role === "injected");

/** A code body's text: JSON pretty, the rest as written. */
export function codeText(it: LogItem): { text: string; lang: string } {
  const b = it.body;
  if (b === undefined) return { text: "", lang: "text" };
  const looksJson =
    b.lang === "json" || (b.lang === undefined && /^\s*[[{]/u.test(b.text));
  if (looksJson && b.cut !== true) {
    try {
      return {
        text: JSON.stringify(JSON.parse(b.text), null, 2),
        lang: "json",
      };
    } catch {
      // not JSON after all: as written
    }
  }
  return { text: b.text, lang: b.lang ?? "text" };
}

/** The rows so far, oldest first: an older page goes before them (it holds seqs below theirs). */
export function withOlder(
  rows: readonly LogItem[],
  older: readonly LogItem[],
): LogItem[] {
  const first = rows[0]?.seq;
  return [
    ...(first === undefined ? older : older.filter((o) => o.seq <= first)),
    ...rows,
  ];
}

/** What a find looks in: the header, the body, the rule, the meta. */
const findText = (it: LogItem): string =>
  [it.head, it.rule ?? "", it.meta ?? "", it.body?.text ?? ""]
    .join("\n")
    .toLowerCase();

/** The rows (their places) a needle finds, oldest first; an empty needle finds none. */
export function findRows(rows: readonly LogItem[], needle: string): number[] {
  const n = needle.trim().toLowerCase();
  if (n === "") return [];
  return rows.flatMap((it, i) => (findText(it).includes(n) ? [i] : []));
}

/** The find's count at the key line's right: '3 of 12', 'no match'. */
export const findCount = (at: number, of: number): string =>
  of === 0 ? "no match" : `${String(at + 1)} of ${String(of)}`;

/** The filter's kinds, in the TUI's order. */
export const KINDS: readonly Kind[] = [
  "you",
  "agent",
  "thinking",
  "call",
  "result",
  "failed",
  "message",
  "injected",
  "system",
  "summary",
  "error",
  "event",
];

/** The kinds the rows hold, in KINDS' order (the filter offers these). */
export const kindsIn = (rows: readonly LogItem[]): Kind[] =>
  KINDS.filter((k) =>
    rows.some((r) => r.rule === undefined && kindOf(r) === k),
  );

/** A row shows under a filter (rules always show). */
export const shown = (it: LogItem, hidden: ReadonlySet<Kind>): boolean =>
  it.rule !== undefined || !hidden.has(kindOf(it));
