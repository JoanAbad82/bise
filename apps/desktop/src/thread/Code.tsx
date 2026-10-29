// A code block's text, highlighted (tui-parity B15; the TUI's syntax.rs):
// prism's tokens as React elements, never innerHTML, colored from the ds
// roles (so dark and light follow his theme). An unknown language is drawn
// as plain code; a block with no language at all (a bare fence), gray
// (--md-syn-bare). codeLines is the one rule: his bubble draws it here, his
// composer as decorations (composer/mdcolor.ts), so both show a block alike
// (code-fences). Owner: amb-win.
import { memo, type CSSProperties } from 'react';
import { normalizeTokens, Prism, type PrismTheme } from 'prism-react-renderer';
import { staggerOf } from './fade';

// prism-react-renderer bundles no shell grammar: a small one, so a bash call's box has the TUI's
// colours too (code.rs highlight_bash: comments, strings, variables, keywords, flags, operators)
if (!('bash' in Prism.languages)) {
  Prism.languages['bash'] = {
    comment: { pattern: /(^|\s)#.*/, lookbehind: true },
    string: { pattern: /"(?:\\.|[^"\\])*"|'[^']*'/, greedy: true },
    variable: /\$(?:\{[^}]*\}|\w+|[@*#?$!0-9])/,
    keyword: /\b(?:if|then|else|elif|fi|for|while|until|do|done|case|esac|in|function|return|export|local|set|cd|echo)\b/,
    property: /(^|\s)--?[\w-]+/,
    operator: /&&|\|\||[|;&<>]/,
    number: /\b\d+\b/,
  };
}

// The TUI's syntax.rs style(): its token kinds on the ds's markdown roles (src/ds/md-tokens.css,
// theme.rs syntax_*): keywords bold, comments italic, punctuation dim (amb-kit, lead m_11457).
export const THEME: PrismTheme = {
  plain: { color: 'var(--md-syn-plain)', backgroundColor: 'transparent' },
  styles: [
    { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: 'var(--md-syn-comment)', fontStyle: 'italic' } },
    { types: ['keyword', 'builtin', 'important', 'atrule'], style: { color: 'var(--md-syn-keyword)', fontWeight: '700' } },
    { types: ['string', 'char', 'attr-value', 'regex', 'url'], style: { color: 'var(--md-syn-string)' } },
    { types: ['number', 'boolean', 'constant', 'symbol'], style: { color: 'var(--md-syn-number)' } },
    { types: ['function', 'function-variable', 'method'], style: { color: 'var(--md-syn-call)' } },
    { types: ['class-name', 'tag', 'selector', 'namespace', 'type'], style: { color: 'var(--md-syn-type)' } },
    { types: ['punctuation', 'operator'], style: { color: 'var(--c-text-2)' } },
    { types: ['inserted'], style: { color: 'var(--c-ok)' } },
    { types: ['deleted'], style: { color: 'var(--c-err)', textDecorationLine: 'line-through' } },
    // ```md / ```markdown: a heading as a keyword (prism's alias), **bold** bold, *italic* italic,
    // ~~strike~~ struck, `code` and links as strings, the marks (- > ---) dim as punctuation
    { types: ['bold'], style: { fontWeight: '700' } },
    { types: ['italic'], style: { fontStyle: 'italic' } },
    { types: ['strike'], style: { textDecorationLine: 'line-through' } },
    { types: ['code-snippet', 'code-block'], style: { color: 'var(--md-syn-string)', fontWeight: 'normal' } },
  ],
};

/** A bare fence's words (``` with no language): gray, the text at ~90 % (his ask, code-fences). */
export const BARE: CSSProperties = { color: 'var(--md-syn-bare)' };

/** THEME by token type, each type's entries merged in order. */
const DICT: Record<string, CSSProperties> = {};
for (const e of THEME.styles) for (const t of e.types) DICT[t] = { ...DICT[t], ...(e.style as CSSProperties) };

/** prism aliases md's `code` as a keyword (purple, bold): its own type wins, the TUI's code is green. */
const WINS = ['code-snippet', 'code-block'];

/** A token's style: its types' THEME entries, inner over outer (prism-react-renderer's rule). Pure. */
function styleOf(types: readonly string[], content: string): CSSProperties {
  const s = [...types, ...types.filter((t) => WINS.includes(t))].reduce<CSSProperties>((acc, t) => ({ ...acc, ...DICT[t] }), {});
  // prism calls the built-in types keywords; the TUI draws them as types (gold, not bold)
  return typeWord(types, content) ? { ...s, color: 'var(--md-syn-type)', fontWeight: 'normal' } : s;
}

/** A run of a code line: its text, its token types ('plain' for none) and its look. */
export interface CodeRun {
  readonly text: string;
  readonly types: readonly string[];
  readonly style: CSSProperties;
}

/**
 * A block's lines, each as runs with their look: the one highlighting rule of his bubble and his
 * composer. `lang` '' (a bare fence): every line gray; a language prism doesn't know: plain. Pure.
 */
export function codeLines(text: string, lang: string): CodeRun[][] {
  const code = text.replace(/\n$/, '');
  const bare = lang === '';
  if (bare || !known(lang)) {
    const style = bare ? BARE : {};
    return code.split('\n').map((l) => [{ text: l, types: ['plain'], style }]);
  }
  const grammar = Prism.languages[lang];
  if (grammar === undefined) return code.split('\n').map((l) => [{ text: l, types: ['plain'], style: {} }]);
  return normalizeTokens(Prism.tokenize(code, grammar)).map((line) =>
    line.filter((t) => t.content !== '' && !(t.empty === true)).map((t) => ({ text: t.content, types: t.types, style: styleOf(t.types, t.content) })),
  );
}

// the TUI's built-in type words (rust/tui/src/syntax.rs RUST_TYPES, PY_TYPES)
const TYPE_WORDS = new Set([
  'bool', 'char', 'str', 'u8', 'u16', 'u32', 'u64', 'u128', 'usize', 'i8', 'i16', 'i32', 'i64', 'i128', 'isize', 'f32', 'f64',
  'int', 'float', 'list', 'dict', 'set', 'tuple', 'bytes', 'object',
]);

/** A token prism calls a keyword or a builtin that the TUI draws as a type. Pure. */
export function typeWord(types: readonly string[], content: string): boolean {
  return (types.includes('keyword') || types.includes('builtin')) && TYPE_WORDS.has(content.trim());
}

/** Prism knows this language (its bundled grammars). Pure. */
export function known(lang: string | undefined): lang is string {
  return lang !== undefined && lang in Prism.languages;
}

/**
 * A streamed code block's new lines (text-appearing v2 (5)): from the
 * code's offset `from`, each whole line fades in, staggered as words are;
 * the lines before it are never redrawn. None without `from`. Pure.
 */
export function freshLines(text: string, from: number | undefined): (CSSProperties | null)[] {
  const lines = text.replace(/\n$/, '').split('\n');
  if (from === undefined) return lines.map(() => null);
  let at = 0;
  const starts = lines.map((l) => {
    const s = at;
    at += l.length + 1;
    return s;
  });
  const step = staggerOf(starts.filter((s) => s >= from).length);
  let k = 0;
  return starts.map((s) => (s >= from ? { animationDelay: `${String(Math.round(step * k++))}ms` } : null));
}

/** A streamed block's line: 'th-ln-in' with its delay when it is new. */
function lineIn(fresh: CSSProperties | null | undefined): { className?: string; style?: CSSProperties } {
  return fresh == null ? {} : { className: 'th-ln-in', style: fresh };
}

/** A code block in a language prism doesn't know, while it streams: its lines, new ones fading in. */
export function PlainCode({ text, from }: { text: string; from: number }) {
  const fresh = freshLines(text, from);
  return (
    <code>
      {text
        .replace(/\n$/, '')
        .split('\n')
        .map((l, i) => (
          <span key={i} {...lineIn(fresh[i])}>
            {l}
            {'\n'}
          </span>
        ))}
    </code>
  );
}

export const Code = memo(function Code({ text, lang, from }: { text: string; lang: string; from?: number | undefined }) {
  const fresh = freshLines(text, from);
  const bare = lang === '';
  return (
    <code className={bare ? undefined : `language-${lang}`}>
      {codeLines(text, lang).map((line, i) => (
        // a block's lines have no other key than their place
        <span key={i} {...lineIn(fresh[i])}>
          {line.map((r, k) => (
            <span key={k} style={r.style}>
              {r.text}
            </span>
          ))}
          {'\n'}
        </span>
      ))}
    </code>
  );
});
