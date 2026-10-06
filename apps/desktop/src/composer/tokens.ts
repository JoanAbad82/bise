// The word the caret is in, when it opens a picker: `@` (agents, then files), `$` (skills),
// `/` (commands, only at the start of the message). Pure, no Lexical: the editor plugin passes
// the text of the caret's paragraph up to the caret. The rules are the terminal's
// (rust/tui/src/files.rs `token`, skills.rs `token`, commands.rs `popup_items`), so his habits
// carry over: a trigger opens a word (paragraph start or after a space) and the word has no
// space yet, except `@"` which opens a quoted path (a folder with a space) until a closing `"`.

export type TriggerKind = 'at' | 'skill' | 'slash';

export interface Trigger {
  readonly kind: TriggerKind;
  /** What he typed after the trigger (after `@"` for a quoted path). */
  readonly query: string;
  /** Index (UTF-16) in `before` of the trigger character. */
  readonly start: number;
  /** `@"`: the query is a quoted path, it may hold spaces. */
  readonly quoted: boolean;
}

const isSpace = (c: string): boolean => /\s/u.test(c);

/**
 * The trigger that ends at the caret, or null.
 * `before`: the caret's paragraph up to the caret. `messageStart`: that paragraph is the
 * message's first and nothing (no chip) precedes it, so `/` may open the command list.
 */
export function triggerAt(before: string, messageStart: boolean): Trigger | null {
  // `@"docs/my notes/` : an open quote right after an `@` that opens a word
  const q = before.lastIndexOf('"');
  if (q >= 1 && before[q - 1] === '@' && (q === 1 || isSpace(before.charAt(q - 2)))) {
    return { kind: 'at', query: before.slice(q + 1), start: q - 1, quoted: true };
  }
  let start = before.length;
  while (start > 0 && !isSpace(before.charAt(start - 1))) start -= 1;
  const word = before.slice(start);
  if (word.length === 0) return null;
  const head = word.charAt(0);
  const rest = word.slice(1);
  if (head === '@') return { kind: 'at', query: rest, start, quoted: false };
  if (head === '$') return { kind: 'skill', query: rest, start, quoted: false };
  if (head === '/' && start === 0 && messageStart && !rest.includes('/')) {
    return { kind: 'slash', query: rest, start, quoted: false };
  }
  return null;
}

/** What picking a file inserts: its bare relative path (no `@`), quoted when it has a space;
 *  a folder keeps browsing (`@path/` stays a trigger). docs/at-mentions.md. */
export function filePick(path: string, dir: boolean): { readonly text: string; readonly browse: boolean } {
  if (dir) {
    const p = path.endsWith('/') ? path : `${path}/`;
    return { text: /\s/u.test(p) ? `@"${p}` : `@${p}`, browse: true };
  }
  return { text: /\s/u.test(path) ? `"${path}" ` : `${path} `, browse: false };
}

/** What picking a skill inserts: `$name ` (the model reads the mention). */
export const skillPick = (name: string): string => `$${name} `;

/** What picking an agent in the `@` list inserts: `@name ` (routes the message, as in the TUI). */
export const agentPick = (name: string): string => `@${name} `;

/**
 * The list's items whose name matches `query`, case-insensitive: prefix matches first, then
 * substring matches, each group in input order (the TUI's `prefix_first`).
 */
export function prefixFirst<T>(items: readonly T[], query: string, name: (t: T) => string): T[] {
  const q = query.toLowerCase();
  if (q === '') return [...items];
  const pre: T[] = [];
  const sub: T[] = [];
  for (const it of items) {
    const n = name(it).toLowerCase();
    if (n.startsWith(q)) pre.push(it);
    else if (n.includes(q)) sub.push(it);
  }
  return [...pre, ...sub];
}
