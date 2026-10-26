// src/plugins · a SKILL.md's frontmatter, read for the skill tab (page skill-panel, pick A; designer
// m_43059): the YAML block between its first two '---' lines, as key rows (name, description,
// license, allowed-tools, metadata…), then the markdown after it. Only the shapes a SKILL.md uses:
// `key: value`, a value carried on indented lines, a block scalar (`|`, `>`), a list (`- x`), a
// nested map (`metadata:` then `  k: v`), each shown as its text. No frontmatter: none. A line it
// can't read (no `key:`, a closing '---' missing): broken, with that line's number (1-based, in the
// file) and the raw text. Pure. Owner: nm-pages-b.

/** One key of the frontmatter and its value as text (a list or a map: one item per line). */
export interface FrontKey {
  readonly key: string;
  readonly value: string;
}

/** What a SKILL.md's head is. */
export type Front =
  /** no frontmatter: the whole file is the body */
  | { readonly kind: 'none'; readonly body: string }
  /** read: its keys in order, the body after it */
  | { readonly kind: 'ok'; readonly keys: readonly FrontKey[]; readonly body: string }
  /** a line it can't read: its number in the file, the raw frontmatter text, the body after it (or the whole file) */
  | { readonly kind: 'broken'; readonly line: number; readonly raw: string; readonly body: string };

const KEY = /^([A-Za-z0-9_][A-Za-z0-9_.-]*)\s*:(?:\s+(.*)|\s*)$/u;

/** A value's quotes off, its plain text ('"a b"' → 'a b'). Pure. */
function unquote(v: string): string {
  const t = v.trim();
  if (t.length >= 2 && ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))) return t.slice(1, -1);
  return t;
}

/** The value of a key from its own line's rest and its indented lines. Pure. */
function valueOf(rest: string, more: readonly string[]): string {
  const lines = more.map((l) => l.replace(/^\s+/u, ''));
  const r = rest.trim();
  // a block scalar: '|' keeps the lines, '>' folds them into one
  if (/^[|>][+-]?$/u.test(r)) return r.startsWith('|') ? lines.join('\n').trimEnd() : lines.filter((l) => l !== '').join(' ');
  // a list or a map under the key: one item per line ('- a', 'k: v')
  if (r === '') return lines.filter((l) => l !== '').map((l) => (l.startsWith('- ') ? unquote(l.slice(2)) : l)).join('\n');
  // a plain value carried on: folded into one line
  return [unquote(r), ...lines].filter((l) => l !== '').join(' ');
}

/** Reads a SKILL.md's frontmatter. Pure. */
export function readFront(text: string): Front {
  const all = text.replace(/^\uFEFF/u, '').split(/\r?\n/u);
  if (all[0]?.trim() !== '---') return { kind: 'none', body: text };
  const end = all.findIndex((l, i) => i > 0 && l.trim() === '---');
  if (end < 0) return { kind: 'broken', line: 1, raw: all.slice(1).join('\n'), body: '' };
  const head = all.slice(1, end);
  const raw = head.join('\n');
  const body = all.slice(end + 1).join('\n').replace(/^\n+/u, '');
  const keys: FrontKey[] = [];
  let i = 0;
  while (i < head.length) {
    const l = head[i] ?? '';
    if (l.trim() === '' || l.trimStart().startsWith('#')) {
      i++;
      continue;
    }
    const m = /^\s/u.test(l) ? null : KEY.exec(l);
    // the file's line: the opening '---' is line 1, the head starts at 2
    if (m === null) return { kind: 'broken', line: i + 2, raw, body };
    const more: string[] = [];
    let j = i + 1;
    while (j < head.length && (/^\s/u.test(head[j] ?? '') || (head[j] ?? '').trim() === '' || (head[j] ?? '').startsWith('- '))) {
      more.push(head[j] ?? '');
      j++;
    }
    while (more.length > 0 && (more.at(-1) ?? '').trim() === '') more.pop();
    keys.push({ key: m[1] ?? '', value: valueOf(m[2] ?? '', more) });
    i = j;
  }
  return { kind: 'ok', keys, body };
}

/** A value too long for one row folds (▸) at first: over 2 lines or 160 characters. Pure. */
export function folds(v: string): boolean {
  return v.length > 160 || v.split('\n').length > 2;
}
