// The running screen (designer's running-procs; sidebar row '∿ running', route running): what
// his agents left running in every project, grouped project > agent, 'running · N' or 'ended
// today · N', and the selected one's output beside it (head: its command, agent · project,
// open ↗ / stop; meta: state and age, port, pid, cpu and memory, folder; a read-only terminal
// that follows its end). While shown the core asks every running hub for its list every 2 s
// (core cmd processes_all, architect m_38378). Stop asks nothing: 'stopping…', then its hub's
// row says how it ended. A row that ends while the screen is open stays where it was until he
// leaves or switches the filter (designer m_38389). Owner: procs-desktop.
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { nextHit, type Hit } from './find';
import type { Terminal as Xterm } from '@xterm/xterm';
import { Empty, Field, PageHero, Press, Seg, tipAttrs } from '@/ds';
import { Code } from '@/thread/Code';
import { hero } from '@/proto/words_hero.gen';
import { useListKeys } from '@/app/listkeys';
import { useKeptScroll } from '@/app/keep';
import { useProjects, useStore } from '@/store';
import { useBarAgents } from '@/app/baragents';
import { procRoots } from '@/app/barrows';
import { useRoute } from '@/app/router';
import { useAllProcesses } from './hooks';
import { countsOf, endWords, groupsOf, inScope, isRunning, keyOf, markOf, markTip, matches, metaOf, quietWords, paneWhere, rowCmd, stateOf, tipOf, urlWords, type Filter, type ProcItem, type Root } from './model';
import { Output } from './Output';
import { running } from '@/proto/words_running.gen';
import './running.css';

export interface RunningPorts {
  /** the list is shown: the core asks the running hubs (on), or stops (off) */
  watch: (on: boolean) => void;
  /** stop one (HubCmd proc_stop {project, agent, id}) */
  stop: (x: ProcItem) => void;
  /** open its address in his browser */
  open: (url: string) => void;
}

/** The screen as the shell mounts it: every project's processes, the hubs' commands through the store. */
export function RunningScreen() {
  const store = useStore();
  const items = useAllProcesses();
  useKeptScroll('running', () => document.querySelector<HTMLElement>('[data-testid="running.scroll"]'));
  const ports: RunningPorts = useMemo(
    () => ({
      watch: (on) => {
        store.command({ cmd: 'processes_all', on });
      },
      stop: (x) => {
        store.command({ cmd: 'proc_stop', project: x.project, agent: x.p.agent, id: x.p.id });
      },
      open: (url) => {
        void (window as Partial<Window>).bise?.openExternal(url);
      },
    }),
    [store],
  );
  const home = (window as { bise?: { home?: string } }).bise?.home || undefined;
  const route = useRoute();
  const o = route.screen === 'running' ? route.open : undefined;
  const opened = o === undefined ? undefined : `${o.project}/${o.agent}/${o.id}`;
  // the bar's 'all ›' keeps its scope: a project's, an agent's; none: every project's
  const scope = route.screen === 'running' ? route.scope : undefined;
  const shown = useMemo(() => inScope(items, scope), [items, scope]);
  const projects = useProjects();
  const agents = useBarAgents('');
  const roots = useMemo(() => procRoots(projects, agents), [projects, agents]);
  return <RunningView items={shown} ports={ports} home={home} roots={roots} opened={opened} scoped={scope !== undefined} />;
}

/** How often the shown screen says it again: the core lets its hold go 30 s after the last (LISTS_LEASE). */
export const RENEW_MS = 10_000;

const FILTERS: readonly Filter[] = ['running', 'ended'];

/** The screen from props (tests, shots). */
export function RunningView({
  items,
  ports,
  now: pinned,
  home,
  roots,
  opened,
  scoped = false,
}: {
  items: readonly ProcItem[];
  ports: RunningPorts;
  now?: number;
  home?: string | undefined;
  /** where each project's processes run (procRoots): the pane says a folder past its worktree */
  roots?: ReadonlyMap<string, readonly Root[]> | undefined;
  /** the bar's scope ('all ›' from a project's or an agent's thread): its head names no projects */
  scoped?: boolean;
  /** the process the route opens ('project/agent/id': the bar's row, a thread's backgrounded call) */
  opened?: string | undefined;
}) {
  const now = useNow(pinned);
  // shown: the core asks every running hub, said again within its lease; gone: off
  useEffect(() => {
    ports.watch(true);
    const t = setInterval(() => {
      ports.watch(true);
    }, RENEW_MS);
    return () => {
      clearInterval(t);
      ports.watch(false);
    };
  }, [ports]);
  // an ended one the route opens is under 'ended today'
  const endedOne = (k: string | undefined): boolean => {
    const x = k === undefined ? undefined : items.find((y) => keyOf(y) === k);
    return x !== undefined && !isRunning(x.p);
  };
  const [filter, setFilter] = useState<Filter>(() => (endedOne(opened) ? 'ended' : 'running'));
  const [q, setQ] = useState('');
  // what he stopped from here, until its hub says it ended
  const [stopping, setStopping] = useState<ReadonlySet<string>>(new Set());
  // the rows seen running while 'running' is shown: one that ends stays in place (designer m_38389)
  const [kept, setKept] = useState<ReadonlySet<string>>(() => new Set());
  const fresh = filter === 'running' ? items.filter((x) => isRunning(x.p) && !kept.has(keyOf(x))).map(keyOf) : [];
  if (fresh.length > 0) setKept(new Set([...kept, ...fresh]));
  const [open, setOpen] = useState<string | null>(opened ?? null);
  // the route opens another one: its output, and its filter; a row that ends later stays where it is
  const [routed, setRouted] = useState(opened);
  if (opened !== routed) {
    setRouted(opened);
    if (opened !== undefined) {
      setOpen(opened);
      if (endedOne(opened) && !kept.has(opened)) setFilter('ended');
    }
  }
  const counts = countsOf(items, now);
  const groups = groupsOf(items.filter((x) => matches(x, q)), filter, now, kept);
  const order = groups.flatMap((g) => g.items.map(keyOf));
  const term = useRef<Xterm | null>(null);
  const onTerm = useCallback((t: Xterm | null) => {
    term.current = t;
  }, []);
  // ⌘F: the find field over the output
  const [finding, setFinding] = useState(false);

  const byKey = new Map(items.map((x) => [keyOf(x), x]));
  const stop = (x: ProcItem) => {
    if (!isRunning(x.p) || stopping.has(keyOf(x))) return;
    setStopping((s) => new Set([...s, keyOf(x)]));
    ports.stop(x);
  };
  const openUrl = (x: ProcItem) => {
    const u = urlWords(x.p, stateOf(x.p));
    if (u !== null) ports.open(u.url);
  };
  const pick = (f: Filter) => {
    setKept(new Set());
    setFilter(f);
  };
  // the TUI's /running keys: s stop, o open, / search; esc closes the output, then clears the search
  const screenKey = (e: KeyboardEvent, k: string | null): boolean => {
    if (e.metaKey && e.key === 'f' && open !== null) {
      setFinding(true);
      return true;
    }
    if (e.metaKey && e.key === 'c') {
      const sel = term.current?.getSelection() ?? '';
      if (sel === '') return false;
      void navigator.clipboard.writeText(sel);
      return true;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return false;
    const x = byKey.get(open ?? k ?? '');
    if (e.key === 'Escape') {
      if (open !== null) setOpen(null);
      else if (q !== '') setQ('');
      else return false;
    } else if (e.key === 's' && x) stop(x);
    else if (e.key === 'o' && x) openUrl(x);
    else if (e.key === '/') document.querySelector<HTMLInputElement>('[data-testid="running.search"]')?.focus();
    else return false;
    return true;
  };
  const { sel, setSel, ref, onKeyDown, move } = useListKeys({ order, keepAs: 'running.sel', onOpen: setOpen, onKey: screenKey });
  const searchKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const back = () => {
      e.preventDefault();
      ref.current?.focus({ preventScroll: true });
    };
    if (e.key === 'Escape') {
      setQ('');
      back();
    } else if (e.key === 'Enter') back();
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      back();
      move(e.key === 'ArrowDown' ? 1 : -1);
    }
  };
  const cur = open === null ? null : (byKey.get(open) ?? null);
  return (
    <section ref={ref} className={`run-screen${cur ? ' has-pane' : ''}`} data-testid="running.screen" tabIndex={-1} onKeyDown={onKeyDown}>
      <div className="run-main">
        {/* one scroller: the hero scrolls away with the list (designer m_39330) */}
        <div className="run-scroll" data-testid="running.scroll">
        <PageHero
          name={running.heading}
          sentence={hero.processes_say}
          // 'in N projects' only on every project's list: a scoped one is one place (designer m_38700)
          facts={<span data-testid="running.sub">{`${scoped ? running.count_running({ n: counts.running }) : running.running_in({ count: counts.running, n: counts.projects })} · ${running.count_listening({ n: counts.listening })}`}</span>}
          testId="running.hero"
        />
        <div className="run-bar">
          {/* the plugins place's tabs: text, the chosen one underlined, its count in text-3 (designer m_41694 #3) */}
          <Seg
            items={FILTERS.map((f) => (
              <span key={f} data-testid={`running.filter.${f}`} aria-selected={filter === f}>
                {f === 'running' ? running.state_running : running.ended_today} <span className="run-n">{f === 'running' ? counts.running : counts.ended}</span>
              </span>
            ))}
            on={FILTERS.indexOf(filter)}
            onPick={(i) => { pick(FILTERS[i] ?? 'running'); }}
            testId="running.filters"
          />
          <span className="run-search">
            <Field slash placeholder={running.search} value={q} onChange={(e) => { setQ(e.currentTarget.value); }} onKeyDown={searchKey} testId="running.search" />
          </span>
        </div>
        {order.length === 0 ? (
          <div className="run-empty" data-testid="running.empty">
            {q !== '' ? running.none_match : filter === 'running' ? running.empty : running.empty_ended}
          </div>
        ) : (
          <div className="run-list" role="listbox" data-testid="running.list">
            {groups.map((g) => (
              <div key={g.key} className="run-group" data-testid={`running.group.${g.key}`}>
                {/* one head per project; none with one project: the hero says it (designer m_41694 #2) */}
                {groups.length > 1 && <div className="run-ghead">{g.projectName}</div>}
                {g.items.map((x) => {
                  const k = keyOf(x);
                  const s = stateOf(x.p, stopping.has(k));
                  const m = markOf(s);
                  const u = urlWords(x.p, s);
                  const c = rowCmd(x.p.cmd, x.p.cwd);
                  return (
                    <div
                      key={k}
                      className={`run-row${k === sel ? ' on' : ''}${k === open ? ' open' : ''}`}
                      role="option"
                      aria-selected={k === sel}
                      data-row={k}
                      data-state={s.k}
                      data-testid={`running.row.${k}`}
                      onClick={() => {
                        setSel(k);
                        setOpen(k);
                      }}
                    >
                      <span className={`run-mark ${m.tone}`} data-testid={`running.row.${k}.mark`} {...tipAttrs(markTip(x.p, s, now))}>{m.glyph}</span>
                      {/* its program by name, its arguments dimmer; the whole command in its tip (designer m_41694 #1) */}
                      <span className="run-cmd" data-testid={`running.row.${k}.cmd`} {...tipAttrs(`${x.p.cmd}\n${tipOf(x.p, home)}`)}>
                        <span className="run-prog">{c.prog}</span>
                        {c.args !== '' && <span className="run-args">{` ${c.args}`}</span>}
                      </span>
                      <span className="run-agent">{x.p.agent}</span>
                      {u !== null ? (
                        <a
                          className="run-url"
                          href={u.url}
                          data-testid={`running.row.${k}.url`}
                          {...tipAttrs(u.tip)}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            ports.open(u.url);
                          }}
                        >
                          {u.row}
                        </a>
                      ) : (
                        <span />
                      )}
                      <span className="run-end" data-testid={`running.row.${k}.end`}>
                        {endWords(x.p, s, now)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
      {cur ? (
        <Pane
          key={keyOf(cur)}
          x={cur}
          st={stateOf(cur.p, stopping.has(keyOf(cur)))}
          now={now}
          where={paneWhere(cur, roots?.get(cur.project) ?? [], home)}
          onTerm={onTerm}
          onBack={() => { setOpen(null); }}
          onStop={() => { stop(cur); }}
          onOpen={() => { openUrl(cur); }}
          find={finding ? <Find term={term} onDone={() => { setFinding(false); ref.current?.focus({ preventScroll: true }); }} /> : null}
        />
      ) : (
        // none picked: the pane says what it is for, never a blank (designer m_41694 #12)
        <aside className="run-pane none" data-testid="running.pane.none">
          <Empty title={running.pick_one} />
        </aside>
      )}
    </section>
  );
}

/** ⌘F's field over the output: ⏎ the next match (selected, its line in view), esc closes. */
function Find({ term, onDone }: { term: { readonly current: Xterm | null }; onDone: () => void }) {
  const [q, setQ] = useState('');
  const last = useRef<Hit | null>(null);
  const [none, setNone] = useState(false);
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      term.current?.clearSelection();
      onDone();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const t = term.current;
      if (t === null) return;
      const buf = t.buffer.active;
      const lines = Array.from({ length: buf.length }, (_, i) => buf.getLine(i)?.translateToString(true) ?? '');
      const hit = nextHit(lines, q, last.current);
      last.current = hit;
      setNone(hit === null);
      if (hit === null) return;
      t.select(hit.col, hit.row, hit.len);
      t.scrollToLine(Math.max(0, hit.row - Math.floor(t.rows / 2)));
    }
  };
  return (
    <span className="run-find">
      <Field autoFocus placeholder={running.key_find} value={q} onChange={(e) => { setQ(e.currentTarget.value); last.current = null; setNone(false); }} onKeyDown={onKey} testId="running.find" />
      {none && <span className="run-find-none" data-testid="running.find.none">{running.none_match}</span>}
    </span>
  );
}

function Pane({ x, st, now, where, onTerm, onBack, onStop, onOpen, find }: { x: ProcItem; st: ReturnType<typeof stateOf>; now: number; where: string; onTerm: (t: Xterm | null) => void; onBack: () => void; onStop: () => void; onOpen: () => void; find: ReactNode }) {
  const u = urlWords(x.p, st);
  const live = st.k === 'running' || st.k === 'stopping';
  // stop is the only danger: a first click asks, the second stops (designer m_41694 #8)
  const [asking, setAsking] = useState(false);
  const cwd = x.p.cwd ?? '';
  return (
    <aside className="run-pane" data-testid="running.pane">
      <div className="run-phead">
        <Press look="run-back" onClick={onBack} data-testid="running.back">{`‹ ${running.heading}`}</Press>
        <div className="run-meta" data-testid="running.pane.meta">
          {metaOf(x, st, now, where).map((m) => (
            <span key={m.k} className={`run-m-${m.k}`} {...tipAttrs(m.k === 'where' ? cwd : undefined)}>{m.w}</span>
          ))}
        </div>
        <span className="run-pacts">
          {u !== null && (
            <Press look="run-act" onClick={onOpen} data-testid="running.pane.open" {...tipAttrs(u.tip)}>{running.open}</Press>
          )}
          {st.k === 'running' && (
            <Press
              look={`run-act${asking ? ' ask' : ''}`}
              onClick={() => {
                if (asking) onStop();
                else setAsking(true);
              }}
              onBlur={() => { setAsking(false); }}
              data-testid="running.pane.stop"
            >
              {asking ? running.stop_confirm : running.stop}
            </Press>
          )}
        </span>
      </div>
      {/* the whole command, wrapped, highlighted as the thread's '$' rows are (Gabriel's ask) */}
      <pre className="run-pcmd" data-testid="running.pane.cmd">
        <Code text={x.p.cmd} lang="bash" />
      </pre>
      {find}
      <Output project={x.project} agent={x.p.agent} id={x.p.id} none={x.p.out === 'none' || x.p.out === 'unknown'} live={live} quiet={quietWords(x.p, st, now)} onTerm={onTerm} />
      <div className="run-keys" data-testid="running.keys">
        <span><b>↓</b> {running.key_follow}</span>
        <span className="run-k-find"><b>⌘F</b> {running.key_find}</span>
        <span className="run-k-copy"><b>⌘C</b> {running.key_copy}</span>
        {live && <span><b>s</b> {running.key_stop}</span>}
        {u !== null && <span><b>o</b> {running.key_open}</span>}
        <span><b>esc</b> {running.key_back}</span>
      </div>
    </aside>
  );
}

/** The clock for the ages: pinned in tests and shots, else ticking every 2 s (the hubs' refresh). */
function useNow(pinned?: number): number {
  const [now, setNow] = useState(() => pinned ?? Date.now());
  useEffect(() => {
    if (pinned !== undefined) return;
    const t = setInterval(() => {
      setNow(Date.now());
    }, 2_000);
    return () => {
      clearInterval(t);
    };
  }, [pinned]);
  return pinned ?? now;
}
