// ⌘K: one search over the window (designer's signed block s-k, desktop-screens v7; lead m_11844):
// every agent of every project, archived ones too, the artifacts and the scheduled tasks, grouped,
// keyboard first. The ranking is src/search's, the bar's spotlight finds with the same rules.
// No query: 'waiting for you', then 'recent'. tab / shift+tab cycle the scope (all · agents ·
// artifacts · scheduled), ↑↓ ctrl+n/p move, ⏎ opens (a waiting agent: answers in its thread),
// ⌘⏎ restores an archived agent then opens it, or sends the query to bise when nothing matches;
// esc closes. Its own field: the composer keeps its draft. Owner: amb-web (lead m_11864), in
// amb-win's shell.
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useCoreEvent, useProjects, useStore } from '@/store';
import type { Ev } from '@/store/store';
import { flatHits, marks, nextScope, SCOPES, searchList, type Hit, type Scope, type SearchList } from '@/search/rank';
import { searchDataOf } from '@/search/data';
import { useNow } from './clock';
import { MAIN } from './route';
import { useRouter } from './router';
import './palette.css';

export const PW = {
  ph: 'search agents, artifacts, scheduled tasks',
  none: (q: string): string => `nothing matches “${q}”. archived agents, artifacts and scheduled tasks were searched too.`,
  ask: (q: string): string => `ask bise “${q}”`,
  blank: 'nothing to search yet. your agents, what they make and their scheduled tasks show up here as you work.',
  keys: '↑↓ choose   ⏎ open   tab all · agents · artifacts · scheduled   esc close',
  keysArchived: (scope: Scope): string => `↑↓ choose   ⏎ open   ⌘⏎ restore   ${scope === 'all' ? 'tab agents only' : 'tab all · agents · artifacts · scheduled'}   esc close`,
  keysNone: '⌘⏎ ask bise   esc close',
  keysBlank: 'esc close',
  tabOnly: 'tab agents only',
  hint: (h: Hit): string => (h.archived ? '⏎ open   ⌘⏎ restore' : h.waiting ? '⏎ answer' : '⏎ open'),
} as const;

/** The key line for a list and its selected row. */
export function keyLine(l: SearchList, at: Hit | undefined, scope: Scope): string {
  if (l.mode === 'none') return PW.keysNone;
  if (l.mode === 'blank') return PW.keysBlank;
  return at?.archived === true ? PW.keysArchived(scope) : PW.keys;
}

/** The events that change what the search reads. */
const READS = new Set<Ev['ev']>(['agents', 'artifacts', 'cards', 'projects']);

/** A name with the query's matches bold and underlined. */
function Marked({ text, q }: { text: string; q: string }): ReactNode {
  const ms = marks(text, q);
  if (ms.length === 0) return text;
  const out: ReactNode[] = [];
  let i = 0;
  for (const [a, b] of ms) {
    if (a > i) out.push(text.slice(i, a));
    out.push(
      <span className="mt" key={a}>
        {text.slice(a, b)}
      </span>,
    );
    i = b;
  }
  if (i < text.length) out.push(text.slice(i));
  return out;
}

export function Palette({ onClose }: { onClose: () => void }) {
  const store = useStore();
  const router = useRouter();
  const projects = useProjects();
  const now = useNow();
  const [q, setQ] = useState('');
  const [scope, setScope] = useState<Scope>('all');
  const [at, setAt] = useState(0);
  const [version, setVersion] = useState(0);
  const field = useRef<HTMLInputElement>(null);
  useCoreEvent(
    useCallback((ev: Ev) => {
      if (READS.has(ev.ev)) setVersion((v) => v + 1);
    }, []),
  );
  const data = useMemo(
    () => searchDataOf({ projects, agents: (p) => store.agents(p), artifacts: (p) => store.artifacts(p), cards: (p) => store.cards(p) }),
    // version: a held project's agents, cards or artifacts changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projects, store, version],
  );
  const list = useMemo(() => searchList(data, q, scope, now), [data, q, scope, now]);
  const hits = useMemo(() => flatHits(list), [list]);
  const cur = Math.min(at, Math.max(0, hits.length - 1));
  const sel = hits[cur];
  const home = projects.find((p) => p.home)?.project;

  useEffect(() => {
    field.current?.focus();
  }, []);
  useEffect(() => {
    document.querySelector(`[data-testid="app.palette.item.${String(cur)}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [cur]);

  const open = (h: Hit | undefined, restore = false) => {
    if (h === undefined) return;
    onClose();
    if (h.open.to === 'artifact') {
      router.go({ screen: 'artifacts', project: h.open.project, id: h.open.id });
      return;
    }
    if (restore && h.archived) store.command({ cmd: 'unarchive', project: h.open.project, agent: h.open.agent });
    const agent = h.open.agent;
    const main = store.agents(h.open.project).find((a) => a.name === agent)?.main === true;
    router.go({ screen: 'thread', project: h.open.project, agent: main ? MAIN : agent });
  };
  const ask = () => {
    const text = q.trim();
    if (text === '' || home === undefined) return;
    onClose();
    store.send({ project: home, agent: 'main', text });
    router.go({ screen: 'thread', project: home, agent: MAIN });
  };

  const onKey = (e: KeyboardEvent) => {
    const down = e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n');
    const up = e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p');
    if (down || up) {
      e.preventDefault();
      setAt(Math.max(0, Math.min(hits.length - 1, cur + (down ? 1 : -1))));
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setScope((s) => nextScope(s, e.shiftKey));
      setAt(0);
    } else if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      if (list.mode === 'none') ask();
      else if (sel?.archived === true) open(sel, true);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      open(sel);
    } else if (e.key === 'Escape' || (e.ctrlKey && e.key === 'c')) {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  };

  let k = 0;
  return (
    <div
      className="app-palette"
      data-testid="app.palette"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="app-k" onKeyDown={onKey} role="dialog" aria-label="search">
        <label className="app-k-field">
          <span aria-hidden>⌕</span>
          <input
            ref={field}
            value={q}
            placeholder={PW.ph}
            aria-label={PW.ph}
            spellCheck={false}
            onChange={(e) => {
              setQ(e.currentTarget.value);
              setAt(0);
            }}
            data-testid="app.palette.field"
          />
        </label>
        <div className="app-k-scopes" role="tablist">
          {SCOPES.map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={s === scope}
              className={s === scope ? 'on' : undefined}
              tabIndex={-1}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={() => {
                setScope(s);
                setAt(0);
              }}
              data-testid={`app.palette.scope.${s}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="app-k-body" role="listbox" aria-label="results">
          {list.mode === 'blank' && (
            <div className="app-k-empty" data-testid="app.palette.blank">
              <p>{PW.blank}</p>
            </div>
          )}
          {list.mode === 'none' && (
            <div className="app-k-empty" data-testid="app.palette.none">
              <span className="big" aria-hidden>
                ⌕
              </span>
              <p>{PW.none(q.trim())}</p>
              <button type="button" className="app-k-ask" onClick={ask} data-testid="app.palette.ask">
                {PW.ask(q.trim())} <kbd>⌘⏎</kbd>
              </button>
            </div>
          )}
          {list.groups.map((g) => (
            <div key={g.id} role="group" aria-label={g.label} data-testid={`app.palette.group.${g.id}`}>
              <div className="app-k-head">
                <span>{g.label}</span>
                {g.id !== 'recent' && <span className="x">&nbsp;· {g.hits.length}</span>}
                <span className="sp" />
                <span className="x">{scope === 'all' && g.id === 'agents' && sel !== undefined && g.hits.includes(sel) ? PW.tabOnly : ''}</span>
              </div>
              {g.hits.map((h) => {
                const n = k++;
                const on = n === cur;
                return (
                  <div
                    key={h.id}
                    role="option"
                    aria-selected={on}
                    className={['app-k-row', on ? 'on' : '', h.archived ? 'arch' : ''].filter((c) => c !== '').join(' ')}
                    data-kind={h.kind}
                    data-archived={h.archived || undefined}
                    onMouseMove={() => {
                      if (!on) setAt(n);
                    }}
                    onClick={() => {
                      open(h);
                    }}
                    data-testid={`app.palette.item.${String(n)}`}
                  >
                    <span className={`g ${h.tone}`} aria-hidden>
                      {h.tone === 'pearl' ? <i className="app-k-pearl" /> : h.glyph}
                    </span>
                    <span className="nm">
                      <Marked text={h.name} q={q} />
                      {h.detail !== '' && <span className="d">{h.detail}</span>}
                    </span>
                    <span className="rt">
                      {h.where !== '' && <span className="pj">{h.where}</span>}
                      {h.when !== '' && <span>{h.when}</span>}
                      {on && <span className="hint">{PW.hint(h)}</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="app-k-keys" data-testid="app.palette.keys">
          {keyLine(list, sel, scope)}
        </div>
      </div>
    </div>
  );
}
