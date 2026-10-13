// The artifacts screen (desktop-screens v6, designer m_11837; sidebar row '↗ artifacts', route
// artifacts[/<p>]): what his agents made, across his projects. Title, the filters (projects,
// agents, kinds, words), the rows by day, the keys line. ⏎ opens one in the window
// (artifacts/<p>/<id>). The keys are the TUI's /artifacts (artifacts_screen.rs on_key, tui-parity
// m_22159): the list keys (app/listkeys.ts), the row's (List.tsx rowKey), / the search (⏎ back to
// the list keeping the words, ↑↓ back and move, esc clears it), a the archived ones, esc clears the
// search then leaves the archived ones. Owner: amb-mac (amb-kit's before).
import { useState, type KeyboardEvent } from 'react';
import { useListKeys } from '@/app/listkeys';
import { Button, Field, Menu, MenuItem, Press } from '@/ds';
import { useProjects } from '@/store';
import { useKeptScroll } from '@/app/keep';
import { useAllArtifacts } from './hooks';
import { ArtifactRows, rowKey, useLook } from './List';
import { usePutInMessage } from './Open';
import { useGoArtifact } from './leave';
import { agentsOf, ALL, filterItems, KIND_FILTERS, keyOf, splitArchived, type Filter, type Item, type KindFilter } from './model';
import './artifacts.css';

export function ArtifactsScreen({ project = '' }: { project?: string }) {
  const all = useAllArtifacts();
  const projects = useProjects();
  // back from an open artifact (esc, ‹): the list where he left it (designer's desktop-history)
  useKeptScroll(`artifacts:${project}`, () => document.querySelector<HTMLElement>('[data-testid="artifacts.list"]'));
  const [f, setF] = useState<Filter>({ ...ALL, project });
  const [menu, setMenu] = useState<'project' | 'agent' | null>(null);
  const [now] = useState(() => Date.now());
  // the archived ones leave the list behind a faint 'N archived' row; a (or a click) shows them
  // alone, esc goes back (the TUI's artifacts screen)
  const [archivedOn, setArchivedOn] = useState(false);
  const kept = filterItems(all, f);
  const { live, archived } = splitArchived(kept);
  const items = archivedOn ? archived : live;
  const projectName = projects.find((p) => p.project === f.project)?.name ?? f.project;
  // a browser-only one (a PR, a link) opens his browser, the list keeps its selection (leave.ts)
  const goArtifact = useGoArtifact();
  const open = (it: Item) => {
    goArtifact(it.project, it.a.id, it.a);
  };
  const look = useLook(open);
  const put = usePutInMessage();
  const toggleKind = (k: KindFilter) => {
    setF({ ...f, kinds: f.kinds.includes(k) ? f.kinds.filter((x) => x !== k) : [...f.kinds, k] });
  };
  const byKey = new Map(items.map((it) => [keyOf(it), it]));
  const putIt = (it: Item) => {
    put(it.project, it.a);
  };
  const showArchived = (on: boolean) => {
    setArchivedOn(on);
    setSel(null);
  };
  // the screen's own keys, beside the list's and the row's
  const screenKey = (e: KeyboardEvent): boolean => {
    if (e.metaKey || e.ctrlKey || e.altKey) return false;
    if (e.key === '/') {
      document.querySelector<HTMLInputElement>('[data-testid="artifacts.search"]')?.focus();
      return true;
    }
    if (e.key === 'a') {
      showArchived(!archivedOn);
      return true;
    }
    if (e.key !== 'Escape') return false;
    if (f.q !== '') setF({ ...f, q: '' });
    else if (archivedOn) showArchived(false);
    else return false;
    return true;
  };
  const { sel, setSel, ref, onKeyDown, move } = useListKeys({
    order: items.map(keyOf),
    keepAs: `artifacts.sel:${project}`,
    onOpen: (k) => {
      const it = byKey.get(k);
      if (it) open(it);
    },
    onKey: (e, k) => rowKey(e, k === null ? undefined : byKey.get(k), { onOpen: open, onLook: look, onPut: putIt }) || screenKey(e),
  });
  // the search has the keys (the TUI's typing mode): ⏎ gives them back, ↑↓ give them back and move, esc clears
  const searchKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const back = () => {
      e.preventDefault();
      ref.current?.focus({ preventScroll: true });
    };
    if (e.key === 'Escape') {
      setF({ ...f, q: '' });
      back();
    } else if (e.key === 'Enter') {
      back();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      back();
      move(e.key === 'ArrowDown' ? 1 : -1);
    }
  };
  return (
    <section ref={ref} tabIndex={-1} className="art-screen" data-testid="artifacts.screen" data-archived={archivedOn || undefined} onKeyDown={onKeyDown}>
      <header className="art-head">
        <div className="art-h1">{archivedOn ? 'artifacts · archived' : 'artifacts'}</div>
        <div className="art-h2">{archivedOn ? 'what you or your agents put away' : 'what your agents made'}</div>
      </header>
      <div className="art-filters">
        <span className="art-drop">
          <Button kind="ghost" onClick={() => { setMenu(menu === 'project' ? null : 'project'); }} testId="artifacts.projects">
            {f.project === '' ? 'all projects ⌄' : `${projectName} ⌄`}
          </Button>
          {menu === 'project' && (
            <Menu testId="artifacts.projects.menu">
              <MenuItem on={f.project === ''} onClick={() => { setF({ ...f, project: '' }); setMenu(null); }} testId="artifacts.projects.all">all projects</MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.project} on={f.project === p.project} onClick={() => { setF({ ...f, project: p.project }); setMenu(null); }} testId={`artifacts.projects.${p.project}`}>
                  {p.name !== '' ? p.name : p.project}
                </MenuItem>
              ))}
            </Menu>
          )}
        </span>
        <span className="art-drop">
          <Button kind="ghost" onClick={() => { setMenu(menu === 'agent' ? null : 'agent'); }} testId="artifacts.agents">
            {f.agent === '' ? 'all agents ⌄' : `${f.agent} ⌄`}
          </Button>
          {menu === 'agent' && (
            <Menu testId="artifacts.agents.menu">
              <MenuItem on={f.agent === ''} onClick={() => { setF({ ...f, agent: '' }); setMenu(null); }} testId="artifacts.agents.all">all agents</MenuItem>
              {agentsOf(all).map((a) => (
                <MenuItem key={a} on={f.agent === a} onClick={() => { setF({ ...f, agent: a }); setMenu(null); }} testId={`artifacts.agents.${a}`}>{a}</MenuItem>
              ))}
            </Menu>
          )}
        </span>
        <span className="art-kinds">
          {KIND_FILTERS.map((k) => (
            <Press key={k.id} look={`art-kind${f.kinds.includes(k.id) ? ' on' : ''}`} aria-pressed={f.kinds.includes(k.id)}
              onClick={() => { toggleKind(k.id); }} data-testid={`artifacts.kind.${k.id}`}>
              {k.label}
            </Press>
          ))}
        </span>
        <span className="art-search">
          <Field placeholder="search" value={f.q} onChange={(e) => { setF({ ...f, q: e.currentTarget.value }); }} onKeyDown={searchKey} testId="artifacts.search" />
        </span>
      </div>
      {archivedOn && items.length === 0 ? (
        <div className="art-empty" data-testid="artifacts.none">nothing archived. esc goes back.</div>
      ) : all.length === 0 || (live.length === 0 && archived.length > 0 && f.q === '' && f.kinds.length === 0 && f.agent === '') ? (
        <div className="art-empty" data-testid="artifacts.empty">nothing yet. when an agent makes a page, a doc or a file for you, it lands here.</div>
      ) : items.length === 0 ? (
        <div className="art-empty" data-testid="artifacts.none">nothing matches. clear a filter to see more.</div>
      ) : (
        <ArtifactRows items={items} now={now} sel={sel} onSel={setSel} onOpen={open} onLook={look} onPut={putIt} form="screen" testId="artifacts.list" />
      )}
      {!archivedOn && archived.length > 0 && (
        <Press look="art-archived" onClick={() => { showArchived(true); }} data-testid="artifacts.archived">
          {archived.length} archived
        </Press>
      )}
      <div className="art-keys" data-testid="artifacts.keys">
        <span><b>⏎</b> open</span>
        <span><b>space</b> quick look</span>
        <span><b>v</b> versions</span>
        <span><b>@</b> put it in a message</span>
        <span><b>⌘C</b> copy</span>
        {archivedOn ? (
          <span><b>esc</b> back to the list</span>
        ) : (
          archived.length > 0 && <span><b>a</b> archived</span>
        )}
      </div>
    </section>
  );
}
