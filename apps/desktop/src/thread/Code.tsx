// A code block's text, highlighted (tui-parity B15; the TUI's syntax.rs):
// prism-react-renderer's tokens as React elements, never innerHTML, colored
// from the ds roles (so dark and light follow his theme). An unknown
// language is drawn as plain code. Owner: amb-win.
import { memo } from 'react';
import { Highlight, Prism, type PrismTheme } from 'prism-react-renderer';

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

export const Code = memo(function Code({ text, lang }: { text: string; lang: string }) {
  return (
    <Highlight code={text.replace(/\n$/, '')} language={lang} theme={THEME}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <code className={`language-${lang}`}>
          {tokens.map((line, i) => (
            // a block's lines have no other key than their place
            <span key={i} {...getLineProps({ line })}>
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
