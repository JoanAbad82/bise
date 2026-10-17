// The review (bar A.6): an agent's change, or one commit already on main,
// file by file. Owner: amb-win. The old window's S7 rules, kept: a merged
// change or a commit from 'merged today' is read-only ('merged · e0f3df5
// · 14:05', no merge, no ask for changes); a merge happens only by his
// click on the agent's open merge card (the hub's one /answer path).
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { copyText, QuotePop } from '@/quote/QuotePop';
import { flatRows, handQuotes, quotesOf, range, type RowAt, type Sel } from './quote';
import { Button, Diff, Empty, Head } from '@/ds';
import { useCards, useDiff, useMerged, useStore } from '@/store';
import { clock } from '@/thread/entry';
import { useRouter } from '@/app/router';
import { useKeptScroll } from '@/app/keep';
import { MAIN } from '@/app/route';
import { fileHead, headLine, linesOf, mergeCardOf, mergedSha, totals } from './model';
import './review.css';

export function ReviewScreen({ project, agent, commit }: { project: string; agent: string; commit?: string }) {
  useKeptScroll(`review:${project}/${agent}/${commit ?? ''}`, () => document.querySelector<HTMLElement>('[data-testid="review.files"]'));
  const store = useStore();
  const router = useRouter();
  const diff = useDiff(project, agent, commit);
  const merged = useMerged(project);
  const cards = useCards(project);

  // the diff once on open (the hub answers `diff`), the merged list fresh
  useEffect(() => {
    store.command(commit === undefined ? { cmd: 'diff', project, agent } : { cmd: 'diff', project, agent, commit });
    store.command({ cmd: 'merged', project });
  }, [store, project, agent, commit]);

  // the diff panel's keys (tui-parity V6): tab / shift+tab next / previous
  // file, j k ↑ ↓ scroll, esc back where he came from
  const body = useRef<HTMLDivElement>(null);
  const at = useRef(-1);
  useEffect(() => {
    body.current?.focus();
  }, []);
  // V7 / L11: drag or shift+↑↓ select whole lines, a typed key quotes them in the thread
  const fileLines = useMemo(() => diff?.files.map(linesOf) ?? [], [diff]);
  const paths = useMemo(() => diff?.files.map((f) => f.path) ?? [], [diff]);
  const rows = useMemo(() => flatRows(fileLines), [fileLines]);
  const starts = useMemo(() => fileLines.reduce<number[]>((acc, _ls, i) => [...acc, i === 0 ? 0 : (acc[i - 1] ?? 0) + (fileLines[i - 1]?.length ?? 0)], []), [fileLines]);
  const [sel, setSel] = useState<Sel | null>(null);
  const [dragging, setDragging] = useState(false);
  const target = commit === undefined ? agent : MAIN;
  const from = commit === undefined ? `${agent} vs main` : `commit ${commit.slice(0, 7)}`;
  const rowOf = (el: EventTarget | null): number | undefined => {
    const id = el instanceof Element ? el.closest('.b-dl')?.getAttribute('data-testid') : null;
    const m = id == null ? null : /^review\.file\.(\d+)\.(\d+)$/u.exec(id);
    if (m === null) return undefined;
    const s = starts[Number(m[1])];
    return s === undefined ? undefined : s + Number(m[2]);
  };
  const onMouseDown = (e: MouseEvent) => {
    const i = rowOf(e.target);
    if (i === undefined || e.button !== 0) return;
    e.preventDefault();
    body.current?.focus();
    setSel({ anchor: i, head: i });
    setDragging(true);
  };
  const onMouseOver = (e: MouseEvent) => {
    if (!dragging) return;
    const i = rowOf(e.target);
    if (i !== undefined) setSel((s) => (s === null ? s : { ...s, head: i }));
  };
  useEffect(() => {
    if (!dragging) return;
    const up = () => {
      setDragging(false);
    };
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mouseup', up);
    };
  }, [dragging]);
  const quoteKey = (e: KeyboardEvent): boolean => {
    if (sel === null) return false;
    if (e.key === 'Escape' || ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !e.shiftKey)) {
      setSel(null);
      if (e.key === 'Escape') e.preventDefault();
      return e.key === 'Escape';
    }
    const qs = quotesOf(paths, fileLines, rows, sel);
    if (e.key === 'c' && e.metaKey) {
      e.preventDefault();
      void (window as Partial<Window>).bise?.copy(qs.map((q) => q.text).join('\n'));
      return true;
    }
    // tab: the quote alone, nothing typed (the TUI's key, main m_12004)
    const tab = e.key === 'Tab' && !e.shiftKey;
    if ((!tab && e.key.length !== 1) || e.metaKey || e.ctrlKey || e.altKey || qs.length === 0) return false;
    e.preventDefault();
    handQuotes({ project, agent: target, from, quotes: qs, key: tab ? '' : e.key });
    router.go({ screen: 'thread', project, agent: target });
    return true;
  };
  // the pop's parts (lead m_11968): the ask words quote with nothing typed, '⌘C copy' copies
  const askClick = () => {
    if (sel === null) return;
    const qs = quotesOf(paths, fileLines, rows, sel);
    if (qs.length === 0) return;
    handQuotes({ project, agent: target, from, quotes: qs, key: '' });
    router.go({ screen: 'thread', project, agent: target });
  };
  const copyClick = () => {
    if (sel !== null) copyText(quotesOf(paths, fileLines, rows, sel).map((q) => q.text).join('\n'));
  };
  const onKey = (e: KeyboardEvent) => {
    if (quoteKey(e)) return;
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && e.shiftKey && rows.length > 0) {
      e.preventDefault();
      const d = e.key === 'ArrowDown' ? 1 : -1;
      setSel((s) => {
        if (s === null) {
          const i = (starts[Math.max(0, at.current)] ?? 0) + 1;
          return { anchor: Math.min(i, rows.length - 1), head: Math.min(i, rows.length - 1) };
        }
        return { ...s, head: Math.max(0, Math.min(rows.length - 1, s.head + d)) };
      });
      return;
    }
    const files = body.current?.querySelectorAll<HTMLElement>('.rv-file') ?? [];
    if (e.key === 'Tab' && files.length > 0) {
      e.preventDefault();
      at.current = (at.current + (e.shiftKey ? -1 : 1) + files.length) % files.length;
      files[at.current]?.scrollIntoView({ block: 'start' });
    } else if ((e.key === 'j' || e.key === 'k') && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      body.current?.scrollBy({ top: e.key === 'j' ? 60 : -60 });
    } else if (e.key === 'Escape') {
      e.preventDefault();
      router.back();
    }
  };

  const done = mergedSha(diff, commit) !== undefined;
  const card = done ? undefined : mergeCardOf(cards, agent);
  const title = commit === undefined ? agent : `commit ${commit.slice(0, 7)}`;
  const line = headLine(diff, { commit, merged, clock });

  return (
    <section className="rv-screen" data-testid="review.screen" data-project={project} data-agent={agent}>
      <Head
        title={title}
        sub={[line, diff && diff.files.length > 0 ? totals(diff) : ''].filter(Boolean).join(' · ')}
        dot={done ? 'ok' : undefined}
        end={
          <>
            {card !== undefined && (
              <Button
                kind="pri"
                onClick={() => {
                  store.do({ i: 'answer', project, card: card.id, reply: '1' });
                }}
                testId="review.merge"
              >
                merge into main
              </Button>
            )}
            <Button
              kind="ghost"
              onClick={() => {
                router.go({ screen: 'thread', project, agent: commit === undefined ? agent : MAIN });
              }}
              testId="review.thread"
            >
              thread
            </Button>
          </>
        }
      />
      <div className="rv-body" data-testid="review.files" tabIndex={-1} ref={body} onKeyDown={onKey} onMouseDown={onMouseDown} onMouseOver={onMouseOver} data-selecting={sel !== null || undefined}>
        {/* never a bare grey bar (designer m_15244): say what it waits for, or that nothing differs */}
        {diff === null ? (
          <p className="rv-wait" data-testid="review.loading">{loadingWords(agent, commit)}</p>
        ) : diff.files.length === 0 ? (
          <Empty title={commit === undefined ? 'no changes against main' : 'no changes in this commit'}>{diff.note ?? undefined}</Empty>
        ) : (
          diff.files.map((f, i) => (
            <div key={f.path} className="rv-file">
              {f.note != null && f.note !== '' && <p className="rv-note">{f.note}</p>}
              <Diff
                file={fileHead(f)}
                add={f.add}
                rm={f.del}
                lines={(fileLines[i] ?? []).map((l, li) => (inSel(sel, (starts[i] ?? 0) + li) ? { ...l, sel: true } : l))}
                pop={sel !== null && !dragging && lastFileOf(sel, rows) === i ? <QuotePop to={target} testId="review.quote.pop" onAsk={askClick} onCopy={copyClick} /> : undefined}
                testId={`review.file.${i}`}
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
}

/** What the review says while its diff comes: 'loading perf's changes…' (main is bise), a commit's. Pure. */
export function loadingWords(agent: string, commit: string | undefined): string {
  if (commit !== undefined) return `loading commit ${commit.slice(0, 7)}…`;
  return `loading ${agent === MAIN ? 'bise' : agent}'s changes…`;
}

/** Row `i` of the flat list is in the selection. */
function inSel(s: Sel | null, i: number): boolean {
  if (s === null) return false;
  const [a, b] = range(s);
  return i >= a && i <= b;
}

/** The file the selection ends in (its pop goes under it). */
function lastFileOf(s: Sel, rows: readonly RowAt[]): number | undefined {
  return rows[range(s)[1]]?.f;
}
