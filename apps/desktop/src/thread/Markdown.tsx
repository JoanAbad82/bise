// An answer's words as markdown (bar ⛔4: the whole answer readable, code
// keeps its shape, links open, ⌘C copies). Owner: amb-win.
//
// React elements from react-markdown + remark-gfm (tables, task lists,
// autolinks, strikethrough), never innerHTML; raw HTML in an answer shows
// as text. Memo'd on its text: a row re-renders only when its entry's
// words change, never because another entry came.
//
// A link never navigates the window: a click goes to `onLink` (the thread
// hands it the shell's open-in-browser), and only http(s) and mailto links
// are links at all.
import { memo, type MouseEvent } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { pathOf } from './paths';
import { Code, known } from './Code';

/** A link he may open from an answer: http, https or mailto. */
export function openable(href: string | undefined): href is string {
  return href !== undefined && /^(https?:|mailto:)/i.test(href);
}

const plugins = [remarkGfm];

/** The bits of an mdast node the breaks plugin reads. */
interface MdNode {
  type: string;
  value?: string;
  children?: MdNode[];
}

/** Every newline in a text node becomes a line break (remark-breaks' rule): code is left as written. Pure. */
export function hardBreaks(node: MdNode): void {
  if (node.children === undefined) return;
  const out: MdNode[] = [];
  for (const c of node.children) {
    if (c.type === 'text' && c.value !== undefined && c.value.includes('\n')) {
      c.value.split('\n').forEach((part, i) => {
        if (i > 0) out.push({ type: 'break' });
        if (part !== '') out.push({ type: 'text', value: part });
      });
    } else {
      hardBreaks(c);
      out.push(c);
    }
  }
  node.children = out;
}

// his messages keep every line he typed (shift+enter), as the TUI shows them (qa-flows 68b4f1ea)
const withBreaks = [remarkGfm, () => hardBreaks];

/** A code block's language from its class ('language-rust'). Pure. */
export function langOf(className: unknown): string | undefined {
  const list = Array.isArray(className) ? className : typeof className === 'string' ? className.split(' ') : [];
  for (const c of list) if (typeof c === 'string' && c.startsWith('language-')) return c.slice(9);
  return undefined;
}

/** The text of a markdown tree node, as written. Pure. */
export function textOf(n: { type: string; value?: unknown; children?: readonly unknown[] }): string {
  if (n.type === 'text' && typeof n.value === 'string') return n.value;
  return (n.children ?? []).map((c) => textOf(c as { type: string })).join('');
}

export const Markdown = memo(function Markdown({
  text,
  onLink,
  onPath,
  breaks = false,
}: {
  text: string;
  onLink?: (url: string) => void;
  onPath?: (path: string, line?: number) => void;
  /** every line he typed stays a line (his own messages); answers stay standard markdown */
  breaks?: boolean;
}) {
  const components: Components = {
    // a file path in inline code opens in his editor (tui-parity M4, B14);
    // a block's code (it ends with a newline) stays code
    code({ className, children }) {
      const t = typeof children === 'string' ? children : '';
      const f = onPath === undefined || t.includes('\n') ? undefined : pathOf(t);
      if (f === undefined) return <code className={className}>{children}</code>;
      return (
        <code
          className="th-path"
          role="link"
          tabIndex={0}
          title={`open ${f.path} in your editor`}
          onClick={() => {
            onPath?.(f.path, f.line);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onPath?.(f.path, f.line);
          }}
          data-testid="thread.path"
        >
          {children}
        </code>
      );
    },
    a({ href, children }) {
      if (!openable(href)) return <span className="th-link-off">{children}</span>;
      const open = (e: MouseEvent) => {
        e.preventDefault();
        onLink?.(href);
      };
      return (
        <a href={href} onClick={open} title={href} rel="noreferrer" data-testid="thread.link">
          {children}
        </a>
      );
    },
    // a block keeps its shape: no wrapping, its own horizontal scroll; its
    // language on top, a copy button on hover (tui-parity B15, M8)
    pre({ node, children }) {
      const code = node?.children.find((c) => c.type === 'element' && c.tagName === 'code');
      const lang = code?.type === 'element' ? langOf(code.properties.className) : undefined;
      const text = code === undefined ? '' : textOf(code);
      return (
        <div className="th-code">
          <div className="th-code-head">
            <span className="th-code-lang">{lang ?? ''}</span>
            <button
              type="button"
              className="th-code-copy"
              onClick={() => {
                void (window as Partial<Window>).bise?.copy(text);
              }}
              data-testid="thread.code.copy"
            >
              copy
            </button>
          </div>
          <pre className="th-pre">{known(lang) ? <Code text={text} lang={lang} /> : children}</pre>
        </div>
      );
    },
    table({ children }) {
      return (
        <div className="th-table">
          <table>{children}</table>
        </div>
      );
    },
    img({ alt }) {
      // an answer's image link is not fetched here: its words stand in
      return <span className="th-img">{alt ?? 'image'}</span>;
    },
  };
  return (
    <div className="th-md">
      <ReactMarkdown remarkPlugins={breaks ? withBreaks : plugins} components={components} skipHtml>
        {text}
      </ReactMarkdown>
    </div>
  );
});
