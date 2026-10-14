// The composer's tab (designer's composer-strip A, m_23965): the label ('to perf' + its working
// gust after the first part), 'ψ sb/perf' or 'shared folder', the project where the crumb lacks
// it, and on the right the context, or the screen's own words ('esc write to search', the approvals
// flash, 'tab back to voice'). The items that don't fit go whole (tab.ts tabFit): measured here,
// on a resize or new words, never per keystroke (the composer above it is memoised). Owner: amb-win.
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { placeWords, tabFit, wordCut, type TabFit, type TabWords } from './tab';

/** The tab's words as one object while they hold (a memoised composer never draws again for an
 *  unrelated render of its screen). */
export function useTabWords(label: string, branch: string | undefined, context: string): TabWords {
  return useMemo(() => ({ label, branch, context }), [label, branch, context]);
}

const ALL: TabFit = { branch: true, project: true, context: true };

/** A string's width in a font, by a canvas (null: no canvas, as in unit tests: the css clip then). */
function widthIn(font: string): ((s: string) => number) | null {
  const ctx = document.createElement('canvas').getContext('2d');
  if (ctx === null) return null;
  ctx.font = font;
  return (s) => Math.ceil(ctx.measureText(s).width);
}

/** The label with its mark after the first part: 'to bise' ∿, 'answering perf' ∿ ' · the question'. */
function MarkedLabel({ label, mark }: { label: string; mark: ReactNode }) {
  if (mark == null) return <>{label}</>;
  const cut = label.indexOf(' · ');
  return cut < 0 ? (
    <>
      {label}
      {mark}
    </>
  ) : (
    <>
      {label.slice(0, cut)}
      {mark}
      {label.slice(cut)}
    </>
  );
}

export function ComposerTab({ words, mark, end, testId }: { words: TabWords; mark?: ReactNode; end?: ReactNode; testId: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [fit, setFit] = useState<TabFit>(ALL);
  // the label cut after a whole word when even alone it doesn't fit (designer m_24325); null: whole
  const [cut, setCut] = useState<string | null>(null);
  const context = words.context ?? '';
  const ctxNum = context.replace(/^context\s*/u, '');
  const key = `${words.label}|${words.branch ?? '-'}|${words.project ?? ''}|${context}|${end === undefined ? '' : 'end'}`;
  useLayoutEffect(() => {
    const host = ref.current?.parentElement;
    if (host == null) return;
    const measure = () => {
      const q = (sel: string) => host.querySelector<HTMLElement>(sel);
      const nat = (e: HTMLElement | null) => (e === null ? 0 : Math.ceil(e.scrollWidth));
      const cs = getComputedStyle(host);
      const gap = parseFloat(cs.columnGap) || 0;
      const fixedEnd = q(':scope > [data-item="end"]');
      const avail = host.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - (fixedEnd === null ? 0 : nat(fixedEnd) + gap);
      const lbl = q(':scope > .lbl');
      const markEl = lbl?.querySelector<HTMLElement>('[data-testid="thread.mark"]') ?? null;
      const markW = markEl === null ? 0 : Math.ceil(markEl.getBoundingClientRect().width + (parseFloat(getComputedStyle(markEl).marginLeft) || 0));
      const width = lbl === null ? null : widthIn(getComputedStyle(lbl).font);
      const labelW = width === null ? nat(lbl) : width(words.label) + markW;
      const w = { branch: nat(q(':scope > [data-item="place"]')), project: nat(q(':scope > [data-item="project"]')), context: nat(q(':scope > [data-item="context"]')) };
      const next = tabFit({ avail, gap, label: labelW, ...w });
      setFit((f) => (f.branch === next.branch && f.project === next.project && f.context === next.context ? f : next));
      // what the label has once the items that fit took theirs
      const room = avail - (next.branch && w.branch > 0 ? w.branch + gap : 0) - (next.project && w.project > 0 ? w.project + gap : 0) - (next.context && w.context > 0 ? w.context + gap : 0) - markW;
      const label = width === null ? words.label : wordCut(words.label, room, width);
      const nextCut = label === words.label ? null : label;
      setCut((c) => (c === nextCut ? c : nextCut));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => {
      ro.disconnect();
    };
  }, [key, words.label]);
  return (
    <>
      <span ref={ref} className="lbl" data-testid={`${testId}.to`}>
        <MarkedLabel label={cut ?? words.label} mark={mark} />
      </span>
      {words.branch !== undefined && (
        <span className={fit.branch ? 'it' : 'it gone'} data-item="place" data-testid={`${testId}.place`} aria-hidden={!fit.branch || undefined}>
          {/* ψ is a worktree's sign (wt-sign): his own checkout reads 'shared folder' alone (designer m_24325) */}
          {words.branch !== '' && <span className="g">ψ</span>}
          <span className={words.branch === '' ? undefined : 'mono'}>{placeWords(words.branch)}</span>
        </span>
      )}
      {words.project !== undefined && words.project !== '' && (
        <span className={fit.project ? 'it' : 'it gone'} data-item="project" data-testid={`${testId}.project`} aria-hidden={!fit.project || undefined}>
          <span className="g">▤</span>
          {words.project}
        </span>
      )}
      {end !== undefined ? (
        <span className="end" data-item="end" data-testid={`${testId}.end`}>
          {end}
        </span>
      ) : (
        ctxNum !== '' && (
          <span className={fit.context ? 'end' : 'end gone'} data-item="context" data-testid={`${testId}.context`} aria-hidden={!fit.context || undefined}>
            context <span className="mono">{ctxNum}</span>
          </span>
        )
      )}
    </>
  );
}
