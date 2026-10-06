// A code block's text, highlighted (tui-parity B15; the TUI's syntax.rs):
// prism-react-renderer's tokens as React elements, never innerHTML, colored
// from the ds roles (so dark and light follow his theme). An unknown
// language is drawn as plain code. Owner: amb-win.
import { memo } from 'react';
import { Highlight, Prism, type PrismTheme } from 'prism-react-renderer';

const THEME: PrismTheme = {
  plain: { color: 'var(--c-text)', backgroundColor: 'transparent' },
  styles: [
    { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: 'var(--c-text-2)', fontStyle: 'italic' } },
    { types: ['keyword', 'builtin', 'important', 'atrule'], style: { color: 'var(--c-accent)' } },
    { types: ['string', 'char', 'attr-value', 'regex', 'inserted'], style: { color: 'var(--c-ok)' } },
    { types: ['number', 'boolean', 'constant', 'symbol'], style: { color: 'var(--c-accent)', opacity: 0.85 } },
    { types: ['function', 'class-name', 'tag', 'selector'], style: { fontWeight: '600' } },
    { types: ['punctuation', 'operator'], style: { color: 'var(--c-text-2)' } },
    { types: ['deleted'], style: { textDecorationLine: 'line-through' } },
  ],
};

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
              {line.map((token, k) => (
                <span key={k} {...getTokenProps({ token })} />
              ))}
              {'\n'}
            </span>
          ))}
        </code>
      )}
    </Highlight>
  );
});
