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

/** A link he may open from an answer: http, https or mailto. */
export function openable(href: string | undefined): href is string {
  return href !== undefined && /^(https?:|mailto:)/i.test(href);
}

const plugins = [remarkGfm];

export const Markdown = memo(function Markdown({ text, onLink }: { text: string; onLink?: (url: string) => void }) {
  const components: Components = {
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
    // a block keeps its shape: no wrapping, its own horizontal scroll
    pre({ children }) {
      return <pre className="th-pre">{children}</pre>;
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
      <ReactMarkdown remarkPlugins={plugins} components={components} skipHtml>
        {text}
      </ReactMarkdown>
    </div>
  );
});
