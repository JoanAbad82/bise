// A selection in the thread's list becomes a quote in the composer (his bug 3, parity M6/B7): the
// selection pop and the keys that turn it into a quote chip. Split out of ThreadScreen.tsx (the
// file cap). Owner: amb-win.
import { useCallback, useEffect, useState, type RefObject } from 'react';
import type { ComposerActions } from '@/composer';
import { quoteFrom, quoteKey, quoteText } from './quote';
import { copyText } from '@/quote/QuotePop';

/**
 * Text selected in this thread's list: quoting while there is some (the
 * composer's key bar says typing asks about it) and the selection pop under it
 * (src/quote); a printable key (Space too) then puts it in the composer as a
 * quote chip at the caret followed by that key, ⌘' as the chip alone
 * (quote.ts), a click on the pop's ask words as the chip alone. Capture phase
 * on the window, before the window's own keys.
 */
export function useThreadQuote(section: RefObject<HTMLElement | null>, composer: RefObject<ComposerActions | null>, agent: string): ThreadQuote {
  const [quoting, setQuoting] = useState(false);
  const [pop, setPop] = useState<PopAt | null>(null);
  const inList = useCallback((): Selection | undefined => {
    const sel = document.getSelection();
    if (sel === null || sel.isCollapsed || sel.rangeCount === 0) return undefined;
    const box = section.current?.querySelector('[data-testid="thread.list"]');
    return box != null && box.contains(sel.getRangeAt(0).commonAncestorContainer) ? sel : undefined;
  }, [section]);
  /** The selection into the composer as a quote chip at its caret; true when it went in. */
  const take = useCallback((): boolean => {
    const sel = inList();
    const acts = composer.current;
    if (sel === undefined || acts === null) return false;
    const text = quoteText(String(sel));
    if (text === '') return false;
    const at = sel.anchorNode instanceof Element ? sel.anchorNode : (sel.anchorNode?.parentElement ?? null);
    const row = at?.closest('.th-row');
    const from = quoteFrom(row?.getAttribute('data-kind'), row?.getAttribute('data-from'), agent);
    // the thread's selection goes first: cleared after, it would take the field's caret with it
    sel.removeAllRanges();
    setQuoting(false);
    setPop(null);
    acts.quote(text, from);
    return true;
  }, [inList, composer, agent]);
  useEffect(() => {
    const place = () => {
      const sel = inList();
      setQuoting(sel !== undefined && quoteText(String(sel)) !== '');
      setPop(sel === undefined ? null : popAt(sel.getRangeAt(0), section.current?.querySelector('[data-testid="thread.list"]') ?? null));
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;
      const k = quoteKey(e);
      if (k === undefined || inList() === undefined) return;
      e.preventDefault();
      e.stopPropagation();
      // a letter, a digit, Space: the quote, then that key (lead m_11968: Space starts it too)
      if (take() && k === 'type') composer.current?.insertText(e.key);
    };
    document.addEventListener('selectionchange', place);
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('selectionchange', place);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [section, composer, inList, take]);
  const copy = useCallback(() => {
    const sel = inList();
    if (sel !== undefined) copyText(quoteText(String(sel)));
  }, [inList]);
  return { quoting, pop, ask: take, copy };
}

interface PopAt {
  readonly x: number;
  readonly y: number;
}

interface ThreadQuote {
  readonly quoting: boolean;
  /** where the selection pop sits (fixed, the window's coordinates), or null: none */
  readonly pop: PopAt | null;
  readonly ask: () => boolean;
  readonly copy: () => void;
}

/** Height of the pop with its gap to the text (12 px words, 3 px padding). */
const POP_H = 30;

/**
 * Under the selection's last line, at its left; over its first line when the list has no room
 * under it (the thread opens at its end); kept inside the list; null when the selection is out
 * of view.
 */
function popAt(r: Range, list: Element | null): PopAt | null {
  const rects = Array.from(r.getClientRects()).filter((x) => x.width > 0 && x.height > 0);
  const first = rects[0];
  const last = rects.at(-1);
  const box = list?.getBoundingClientRect();
  if (first === undefined || last === undefined || box === undefined) return null;
  if (last.bottom < box.top || first.top > box.bottom) return null;
  const under = last.bottom + 6;
  const y = under + POP_H <= box.bottom ? under : Math.max(box.top + 4, first.top - POP_H);
  const line = under + POP_H <= box.bottom ? last : first;
  const left = Math.min(...rects.filter((x) => Math.abs(x.bottom - line.bottom) < 2).map((x) => x.left));
  return { x: Math.max(box.left + 8, Math.min(left, box.right - 280)), y };
}
