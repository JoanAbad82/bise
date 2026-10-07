// A code block's text, highlighted (tui-parity B15; the TUI's syntax.rs):
// prism-react-renderer's tokens as React elements, never innerHTML, colored
// from the ds roles (so dark and light follow his theme). An unknown
// language is drawn as plain code. Owner: amb-win.
import { memo, type CSSProperties } from 'react';
import { Highlight, Prism, type PrismTheme } from 'prism-react-renderer';
import { staggerOf } from './fade';

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
  ],
};

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
  return (
    <Highlight code={text.replace(/\n$/, '')} language={lang} theme={THEME}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <code className={`language-${lang}`}>
          {tokens.map((line, i) => (
            // a block's lines have no other key than their place
            <span key={i} {...getLineProps({ line, ...lineIn(fresh[i]) })}>
              {line.map((token, k) => {
                const props = getTokenProps({ token });
                // prism calls the built-in types keywords; the TUI draws them as types (gold, not bold)
                if (typeWord(token.types, token.content)) props.style = { ...props.style, color: 'var(--md-syn-type)', fontWeight: 'normal' };
                return <span key={k} {...props} />;
              })}
              {'\n'}
            </span>
          ))}
        </code>
      )}
    </Highlight>
  );
});
