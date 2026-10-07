// The colors of live markdown in the composer (B9/W8, the TUI's mdlive.rs + syntax.rs, simpler):
// a ``` block's fences dim, its code colored (keywords, strings, numbers, comments, types), and in
// prose the list markers, headings and `inline code`. Pure: lines in, each line's runs out (text
// and a class, adjacent runs of one class merged); highlight.ts draws them as styled text nodes.
import { item, lineKinds } from './mdlive';

export type Cls = 'kw' | 'str' | 'num' | 'com' | 'type' | 'fence' | 'mark' | 'code' | 'head';

export interface Run {
  readonly text: string;
  readonly cls: Cls | null;
}

/** Keywords of the usual languages, together (a word of one is rarely a name in another). */
const KEYWORDS = new Set(
  (
    'as async await break case catch class const continue crate def default defer del do dyn elif else enum export extends extern false fn for from func function go if impl import in interface let loop match mod move mut new nil none None null of package pass pub raise ref return self Self static struct super switch then this throw trait true True False try type typeof undefined unsafe use var void where while with yield ' +
    'echo fi done esac local readonly select insert update delete create table and or not'
  ).split(' '),
);

const HASH_COMMENTS = new Set(['py', 'python', 'sh', 'bash', 'zsh', 'shell', 'yaml', 'yml', 'toml', 'rb', 'ruby', 'r', 'perl', 'make', 'makefile', 'dockerfile', 'conf', 'ini']);
const DASH_COMMENTS = new Set(['sql', 'lua', 'haskell', 'hs']);

function push(out: Run[], text: string, cls: Cls | null): void {
  if (text === '') return;
  const last = out[out.length - 1];
  if (last !== undefined && last.cls === cls) out[out.length - 1] = { text: last.text + text, cls };
  else out.push({ text, cls });
}

/** One line of code (no state across lines: a string or comment spanning lines colors per line). */
export function codeRuns(line: string, lang: string): Run[] {
  const out: Run[] = [];
  const comment = HASH_COMMENTS.has(lang) ? '#' : DASH_COMMENTS.has(lang) ? '--' : '//';
  let i = 0;
  while (i < line.length) {
    const rest = line.slice(i);
    if (rest.startsWith(comment) || (comment === '//' && rest.startsWith('/*'))) {
      push(out, rest, 'com');
      break;
    }
    const c = line.charAt(i);
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < line.length && line.charAt(j) !== c) j += line.charAt(j) === '\\' ? 2 : 1;
      const end = Math.min(line.length, j + 1);
      push(out, line.slice(i, end), 'str');
      i = end;
      continue;
    }
    const num = /^\d[\w.]*/u.exec(rest);
    if (num !== null && !/\w/u.test(line.charAt(i - 1))) {
      push(out, num[0], 'num');
      i += num[0].length;
      continue;
    }
    const word = /^[A-Za-z_][\w]*/u.exec(rest);
    if (word !== null) {
      const w = word[0];
      push(out, w, KEYWORDS.has(w) ? 'kw' : /^[A-Z][a-z]/u.test(w) ? 'type' : null);
      i += w.length;
      continue;
    }
    push(out, c, null);
    i += 1;
  }
  return out;
}

/** One line of prose: a heading, a list marker, `inline code`. */
export function proseRuns(line: string): Run[] {
  const out: Run[] = [];
  if (/^#{1,6} /u.test(line)) {
    push(out, line, 'head');
    return out;
  }
  let from = 0;
  const it = item(line);
  if (it !== null) {
    push(out, line.slice(0, it.indent), null);
    push(out, line.slice(it.indent, it.content), 'mark');
    from = it.content;
  } else if (/^\s*> /u.test(line)) {
    const m = /^\s*> /u.exec(line)?.[0] ?? '';
    push(out, m, 'mark');
    from = m.length;
  }
  const re = /`[^`\n]+`/gu;
  re.lastIndex = from;
  let at = from;
  for (let m = re.exec(line); m !== null; m = re.exec(line)) {
    push(out, line.slice(at, m.index), null);
    push(out, m[0], 'code');
    at = m.index + m[0].length;
  }
  push(out, line.slice(at), null);
  return out;
}

/** Every line's runs, for the whole text ('\n' between lines). */
export function colorLines(text: string): Run[][] {
  const lines = text.split('\n');
  const kinds = lineKinds(lines);
  return lines.map((line, k) => {
    const { kind, lang } = kinds[k] ?? { kind: 'prose', lang: '' };
    if (kind === 'open' || kind === 'close') return line === '' ? [] : [{ text: line, cls: 'fence' }];
    return kind === 'code' ? codeRuns(line, lang) : proseRuns(line);
  });
}

/** A class's look as an inline style, in the theme's tokens (highlight.ts's text nodes, pm/colors.ts's decorations). */
export const COLOR_STYLE: Record<Cls, string> = {
  kw: 'color: var(--c-accent)',
  str: 'color: var(--c-ok)',
  num: 'color: var(--c-err)',
  com: 'color: var(--c-text-3); font-style: italic',
  type: 'color: var(--c-text-2)',
  fence: 'color: var(--c-text-3)',
  mark: 'color: var(--c-accent)',
  code: 'color: var(--c-accent); font-family: var(--font-mono)',
  head: 'font-weight: 600',
};

