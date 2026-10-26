// The toolbar above the list (his m_44961: 'au dessus de la liste, c'est là où je m'attends qu'ils
// soient'; designer's spec D m_44968 and m_45148): one row, 32 high, 12 under the banner, 8 above
// the list, its edges the list rows' edges. Left the filters as they were in the bar (the kinds,
// ds Filters, then 'all projects ⌄'), 8 apart; right the cards/list switch, the search (200, 160
// under a 900 window; its '/' keycap until it has the focus or words, × to clear) and +. Sticky at
// the top of the page's scroller, a 1 px line under it only while stuck. Under 560 of its own width
// the filters fold into one 'filters ⌄' menu that says how many are on; the search stays. What the
// filters and the keys do stays the screen's (Screen.tsx). Owner: m-artifacts (nm-pages-a's page).
import { useLayoutEffect, useRef, useState, type ChangeEvent, type KeyboardEvent, type ReactNode, type Ref } from 'react';
import { AppIcon, BarSearch, Dropdown, Filters, Press, sentenceCase, tipAttrs } from '@/ds';
import { library } from '@/proto/words_library.gen';
import type { View } from './gridKeys';
import './toolbar.css';

/** Under this width of its own the filters fold into one menu. */
export const FOLD_FILTERS_PX = 560;

export interface KindOpt {
  readonly id: string;
  readonly word: string;
  readonly n: number;
}

export interface ToolbarProps {
  /** the kinds (all first, then each kind with its count); none: no kind filter (one kind, a stack) */
  readonly kinds: readonly KindOpt[] | null;
  readonly kind: string;
  readonly onKind: (id: string) => void;
  /** the project scope as drawn wide (Scope.tsx ProjectScope) */
  readonly scope: ReactNode;
  /** the projects for the folded menu, 'all projects' first */
  readonly projects: readonly { readonly project: string; readonly name: string; readonly n: number }[];
  readonly project: string;
  readonly onProject: (project: string) => void;
  readonly view: View;
  readonly onView: (v: View) => void;
  readonly q: string;
  readonly onQ: (e: ChangeEvent<HTMLInputElement>) => void;
  readonly onQKey: (e: KeyboardEvent<HTMLInputElement>) => void;
  readonly onClear: () => void;
  readonly searchRef: Ref<HTMLInputElement>;
  /** + add files (Drops.tsx AddButton) */
  readonly add: ReactNode;
  /** the page's one scroller: the row sticks to its top */
  readonly scroller: () => HTMLElement | null;
  readonly testId: string;
}

/** How many filters are on (the folded menu's count). Pure. */
export function filtersOn(kind: string, project: string): number {
  return (kind === 'all' ? 0 : 1) + (project === '' ? 0 : 1);
}

export function Toolbar({ kinds: kindOpts, kind, onKind, scope, projects, project, onProject, view, onView, q, onQ, onQKey, onClear, searchRef, add, scroller, testId }: ToolbarProps) {
  const box = useRef<HTMLDivElement>(null);
  const [folded, setFolded] = useState(false);
  const [stuck, setStuck] = useState(false);
  // its own width (the page column and the window's sidebar take theirs): fold under 560; an
  // unmeasured box (a first paint, a test's DOM) stays whole
  useLayoutEffect(() => {
    const el = box.current;
    if (el === null) return undefined;
    const measure = () => { const w = el.clientWidth; setFolded(w > 0 && w < FOLD_FILTERS_PX); };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => { ro.disconnect(); };
  }, []);
  // stuck: the page scrolled and the row sits at the scroller's top
  useLayoutEffect(() => {
    const el = box.current;
    const sc = scroller();
    if (el === null || sc === null) return undefined;
    const check = () => { setStuck(sc.scrollTop > 0 && el.getBoundingClientRect().top - sc.getBoundingClientRect().top < 1); };
    check();
    sc.addEventListener('scroll', check, { passive: true });
    return () => { sc.removeEventListener('scroll', check); };
  }, [scroller]);
  const kinds = kindOpts !== null && <KindFilters kinds={kindOpts} on={kind} onPick={onKind} />;
  const on = filtersOn(kind, project);
  return (
    <div ref={box} className="art-toolbar" data-stuck={stuck || undefined} data-folded={folded || undefined} data-testid={testId}>
      <span className="art-tb-l">
        {folded ? (
          <Dropdown testId={`${testId}.fold`}
            label={<>{sentenceCase(library.filters)}{on > 0 && <span className="art-n">{on}</span>}</>}
            groups={[
              ...(kindOpts === null ? [] : [{ id: 'kinds', head: library.kinds_label, rows: kindOpts.map((k) => ({ id: `k:${k.id}`, name: k.word, trailing: String(k.n), current: kind === k.id, testId: `${testId}.fold.k.${k.id}` })) }]),
              { id: 'projects', rows: projects.map((r) => ({ id: `p:${r.project}`, name: r.name, trailing: String(r.n), current: project === r.project, testId: `${testId}.fold.p.${r.project === '' ? 'all' : r.project}` })) },
            ]}
            onPick={(id) => { if (id.startsWith('k:')) onKind(id.slice(2)); else onProject(id.slice(2)); }} />
        ) : (
          <>
            {kinds}
            {scope}
          </>
        )}
      </span>
      <span className="art-tb-r">
        <span className="art-views">
          <Press look="art-view" aria-pressed={view === 'grid'} aria-label={library.tip_cards} onClick={() => { onView('grid'); }} data-testid="artifacts.view.grid" {...tipAttrs(library.tip_cards)}><AppIcon name="grid" size={16} /></Press>
          <Press look="art-view" aria-pressed={view === 'list'} aria-label={library.tip_list} onClick={() => { onView('list'); }} data-testid="artifacts.view.list" {...tipAttrs(library.tip_list)}><AppIcon name="list" size={16} /></Press>
        </span>
        <BarSearch ref={searchRef} value={q} placeholder={library.search_placeholder} onChange={onQ} onKeyDown={onQKey} onClear={onClear} testId="artifacts.search" />
        {add}
      </span>
    </div>
  );
}

/** The kinds as the bar had them (ds Filters): 'All 866', then each kind with its count. */
function KindFilters({ kinds, on, onPick }: { kinds: readonly KindOpt[]; on: string; onPick: (id: string) => void }) {
  return (
    <Filters label={library.kinds_label} on={on} testId="artifacts.kinds"
      items={kinds.map((k) => ({ id: k.id, label: <>{k.word}<span className="art-n">{k.n}</span></> }))}
      onPick={onPick} />
  );
}
