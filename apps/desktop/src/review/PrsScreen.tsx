// A project's open pull requests (bar A.7), as the TUI's /prs: '#412' with
// its branch, its agents, and its state in words (changes asked, checks
// failing and which ones, review); a click opens it in his browser. Empty,
// the hub's own words ('no open PR. in PR flow…'). Owner: amb-win.
import { useEffect } from 'react';
import { Dot, Head, Empty, Press, Skel } from '@/ds';
import { usePrs, useStore } from '@/store';
import type { Pr } from '@/proto';
import { agentsOf, toneOf, wordsOf, type PrTone } from './prs';
import './review.css';
import { useKeptScroll } from '@/app/keep';

const DOT: Record<PrTone, 'er' | 'nd' | 'wk' | 'ok' | undefined> = { err: 'er', nd: 'nd', wk: 'wk', ok: 'ok', rest: undefined };

export function PrsScreen({ project }: { project: string }) {
  useKeptScroll(`prs:${project}`, () => document.querySelector<HTMLElement>('[data-testid="prs.screen"] .rv-body'));
  const store = useStore();
  const list = usePrs(project);

  // a fresh list on open
  useEffect(() => {
    store.command({ cmd: 'prs', project });
  }, [store, project]);

  return (
    <section className="rv-screen" data-testid="prs.screen" data-project={project}>
      <Head title="pull requests" sub={list === null ? 'asking GitHub…' : list.head === '' ? 'none open' : list.head} />
      <div className="rv-body">
        {list === null && <Skel />}
        {list !== null && list.items.length === 0 && (
          <Empty title="no open PR">
            <span data-testid="prs.none">{list.none ?? ''}</span>
          </Empty>
        )}
        {list?.items.map((p) => <PrRow key={p.number} p={p} />)}
      </div>
    </section>
  );
}

function PrRow({ p }: { p: Pr }) {
  const tone = toneOf(p);
  const dot = DOT[tone];
  const open = () => {
    void (window as Partial<Window>).bise?.openExternal(p.url);
  };
  return (
    <Press look={`pr-row pr-${tone}`} data-testid={`prs.row.${String(p.number)}`} data-tone={tone} title={p.url} onClick={open}>
      <span className="pr-dot">{dot !== undefined ? <Dot state={dot} /> : <span className="pr-rest">○</span>}</span>
      <span className="pr-num">#{p.number}</span>
      <span className="pr-main">
        <span className="pr-branch">{p.branch}</span>
        <span className="pr-agents"> · {agentsOf(p)}</span>
      </span>
      <span className="pr-words" data-testid={`prs.words.${String(p.number)}`}>
        {wordsOf(p)}
      </span>
    </Press>
  );
}
