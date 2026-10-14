// The inbox screen's view (designer's inbox-history pick A, m_24212 (2)-(6); route inbox/all,
// sidebar row '? inbox'): the head ('inbox', '3 waiting · 41 answered'), the filters (projects,
// agents, all / waiting / answered / withdrawn, '/' search), 'waiting for you · N' first (⏎ opens
// the item above this screen's composer, as ⌘I), then the past by day, two lines each, read-only:
// ⏎ or a click goes to his answer (the thread at it, or the page at its block), space opens the
// read-only detail (↑↓ the next one, o goes, esc back). The list keys are app/listkeys.ts's. At
// 800 the agents go into the projects menu, 'withdrawn' too, and the rows drop the project and
// the 'where', whole (past.css). From props: the store's wiring is InboxScreen
// (InboxScreen.tsx). Owner: inbox-screen.
import { useEffect, useState, type KeyboardEvent } from 'react';
import type { Card } from '@/proto';
import { useListKeys } from '@/app/listkeys';
import { Button, Field, Menu, MenuItem, Press } from '@/ds';
import { shownName } from '@/agents/model';
import { timeOf } from '@/artifacts/model';
import { ALL, askersOf, headWords, jumpOf, jumpWords, lineTwo, listsOf, saidWords, STATES, waitEnd, whenWhere, type Filter, type InboxRecord, type Jump, type PastRow, type WaitRow } from './past';
import './past.css';

export interface InboxPorts {
  /** ⏎ on a waiting item: it opens above the composer, as ⌘I (openInbox) */
  readonly answer: (project: string, card: number) => void;
  /** a past item: his answer in its thread (th-flash, a history step), or the page at its block */
  readonly jump: (j: Jump) => void;
}

export interface InboxViewProps {
  readonly cards: readonly Card[];
  readonly records: readonly InboxRecord[];
  /** the hubs' answered total for the head (none: the records given) */
  readonly answered?: number;
  /** older records wait in the hubs: called when he reaches the list's end */
  readonly onEnd?: () => void;
  /** project id → its name */
  readonly names: Readonly<Record<string, string>>;
  /** the projects, in the sidebar's order, for the menu */
  readonly projects: readonly { readonly project: string; readonly name: string }[];
  readonly ports: InboxPorts;
  /** the asker's first line after his answer, when its thread holds it (the detail's 'went on') */
  readonly nextOf?: (r: InboxRecord) => string | undefined;
  /** the record the detail shows (none: the list): the screen reads its thread meanwhile */
  readonly onDetail?: (r: InboxRecord | null) => void;
  /** now (a test or a shot pins it) */
  readonly now?: number;
}

export function InboxView({ cards, records, answered, onEnd, names, projects, ports, nextOf, onDetail, now: pinned }: InboxViewProps) {
  const [opened] = useState(() => Date.now());
  const now = pinned ?? opened;
  const [f, setF] = useState<Filter>(ALL);
  const [menu, setMenu] = useState<'project' | 'agent' | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const lists = listsOf(cards, records, names, f, now);
  const pastBy = new Map(lists.days.flatMap((d) => d.rows.map((r) => [r.key, r] as const)));
  const waitBy = new Map(lists.waiting.map((w) => [w.key, w] as const));
  const open = (key: string) => {
    const w = waitBy.get(key);
    if (w) ports.answer(w.card.project, w.card.id);
    const p = pastBy.get(key);
    if (p) ports.jump(jumpOf(p.r));
  };
  const cur = detail === null ? undefined : pastBy.get(detail);
  const looked = cur?.r ?? null;
  useEffect(() => {
    onDetail?.(looked);
  }, [onDetail, looked]);
  const screenKey = (e: KeyboardEvent, k: string | null): boolean => {
    if (e.metaKey || e.ctrlKey || e.altKey) return false;
    if (cur) {
      if (e.key === 'Escape') setDetail(null);
      else if (e.key === 'o' || e.key === 'Enter') ports.jump(jumpOf(cur.r));
      else if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'ArrowUp' || e.key === 'k') {
        const past = lists.order.filter((x) => pastBy.has(x));
        const i = past.indexOf(cur.key) + (e.key === 'ArrowDown' || e.key === 'j' ? 1 : -1);
        const next = past[Math.max(0, Math.min(past.length - 1, i))];
        if (next !== undefined) {
          setDetail(next);
          setSel(next);
        }
      } else return false;
      return true;
    }
    if (e.key === ' ' && k !== null && pastBy.has(k)) setDetail(k);
    else if (e.key === '/') document.querySelector<HTMLInputElement>('[data-testid="inbox.search"]')?.focus();
    else if (e.key === 'Escape' && f.q !== '') setF({ ...f, q: '' });
    else return false;
    return true;
  };
  const { sel, setSel, ref, onKeyDown, move } = useListKeys({ order: lists.order, keepAs: 'inbox.sel', still: cur !== undefined, onOpen: open, onKey: screenKey });
  // the search has the keys: ⏎ gives them back, ↑↓ give them back and move, esc clears
  const searchKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const back = () => {
      e.preventDefault();
      ref.current?.focus({ preventScroll: true });
    };
    if (e.key === 'Escape') {
      setF({ ...f, q: '' });
      back();
    } else if (e.key === 'Enter') back();
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      back();
      move(e.key === 'ArrowDown' ? 1 : -1);
    }
  };
  const set = (g: Partial<Filter>) => {
    setF({ ...f, ...g });
    setMenu(null);
  };
  const empty = cards.length === 0 && records.length === 0;
  const none = lists.order.length === 0;
  return (
    <section ref={ref} tabIndex={-1} className="ip-screen" data-testid="inbox.screen" onKeyDown={onKeyDown}>
      <header className="ip-head">
        <div className="ip-h1">{cur ? <><Press look="ip-crumb" onClick={() => { setDetail(null); }} data-testid="inbox.detail.back">inbox</Press>{` › ${shownName(cur.r.asker)} · ${whenShort(cur.r, now)}`}</> : 'inbox'}</div>
        {!cur && <div className="ip-h2" data-testid="inbox.counts">{headWords(cards, records, answered)}</div>}
      </header>
      {!cur && (
        <div className="ip-filters">
          <span className="ip-drop">
            <Button kind="ghost" onClick={() => { setMenu(menu === 'project' ? null : 'project'); }} testId="inbox.projects">
              {f.project === '' ? 'all projects ⌄' : `${names[f.project] ?? f.project} ⌄`}
            </Button>
            {menu === 'project' && (
              <Menu testId="inbox.projects.menu">
                <MenuItem on={f.project === ''} onClick={() => { set({ project: '' }); }} testId="inbox.projects.all">all projects</MenuItem>
                {projects.map((p) => (
                  <MenuItem key={p.project} on={f.project === p.project} onClick={() => { set({ project: p.project }); }} testId={`inbox.projects.${p.project}`}>
                    {p.name !== '' ? p.name : p.project}
                  </MenuItem>
                ))}
                {/* 800: the agents and 'withdrawn' come in here (past.css shows them only narrow) */}
                <div className="ip-narrow-only">
                  <MenuItem on={f.agent === ''} onClick={() => { set({ agent: '' }); }} testId="inbox.projects.agents.all">all agents</MenuItem>
                  {askersOf(cards, records).map((a) => (
                    <MenuItem key={a} on={f.agent === a} onClick={() => { set({ agent: a }); }} testId={`inbox.projects.agent.${a}`}>{shownName(a)}</MenuItem>
                  ))}
                  <MenuItem on={f.state === 'withdrawn'} onClick={() => { set({ state: f.state === 'withdrawn' ? 'all' : 'withdrawn' }); }} testId="inbox.projects.withdrawn">withdrawn</MenuItem>
                </div>
              </Menu>
            )}
          </span>
          <span className="ip-drop ip-wide-only">
            <Button kind="ghost" onClick={() => { setMenu(menu === 'agent' ? null : 'agent'); }} testId="inbox.agents">
              {f.agent === '' ? 'all agents ⌄' : `${shownName(f.agent)} ⌄`}
            </Button>
            {menu === 'agent' && (
              <Menu testId="inbox.agents.menu">
                <MenuItem on={f.agent === ''} onClick={() => { set({ agent: '' }); }} testId="inbox.agents.all">all agents</MenuItem>
                {askersOf(cards, records).map((a) => (
                  <MenuItem key={a} on={f.agent === a} onClick={() => { set({ agent: a }); }} testId={`inbox.agents.${a}`}>{shownName(a)}</MenuItem>
                ))}
              </Menu>
            )}
          </span>
          <span className="ip-states">
            {STATES.map((s) => (
              <Press key={s} look={`ip-state${f.state === s ? ' on' : ''}${s === 'withdrawn' ? ' ip-wide-only' : ''}`} aria-pressed={f.state === s}
                onClick={() => { set({ state: s }); }} data-testid={`inbox.state.${s}`}>
                {s}
              </Press>
            ))}
          </span>
          <span className="ip-search">
            <Field slash placeholder="search" value={f.q} onChange={(e) => { setF({ ...f, q: e.currentTarget.value }); }} onKeyDown={searchKey} testId="inbox.search" />
          </span>
        </div>
      )}
      {cur ? (
        <Detail row={cur} now={now} names={names} next={nextOf?.(cur.r)} onJump={() => { ports.jump(jumpOf(cur.r)); }} />
      ) : empty ? (
        <div className="ip-empty" data-testid="inbox.empty">nothing yet. what your agents ask you waits here, and stays once you answer.</div>
      ) : none ? (
        <div className="ip-empty" data-testid="inbox.none">nothing matches. esc clears the search.</div>
      ) : (
        <div className="ip-list" role="listbox" data-testid="inbox.list"
          onScroll={onEnd === undefined ? undefined : (e) => {
            const el = e.currentTarget;
            if (el.scrollHeight - el.scrollTop - el.clientHeight < 240) onEnd();
          }}>
          {lists.waiting.length > 0 && (
            <>
              <div className="ip-day-h ip-wait-h" data-testid="inbox.waiting.head">{`waiting for you · ${String(lists.waiting.length)}`}</div>
              {lists.waiting.map((w) => (
                <WaitLine key={w.key} w={w} on={w.key === sel} end={waitEnd(w, names, now, false)} narrowEnd={waitEnd(w, names, now, true)}
                  onClick={() => { setSel(w.key); ports.answer(w.card.project, w.card.id); }} />
              ))}
            </>
          )}
          {lists.days.map((d) => (
            <div key={d.day} role="group" aria-label={d.title}>
              <div className="ip-day-h" data-testid={`inbox.day.${d.day}`}>{d.title}</div>
              {d.rows.map((p) => (
                <PastLine key={p.key} p={p} on={p.key === sel} project={names[p.r.project] ?? p.r.project}
                  onClick={() => { setSel(p.key); ports.jump(jumpOf(p.r)); }} />
              ))}
            </div>
          ))}
        </div>
      )}
      <div className="ip-keys" data-testid="inbox.keys">
        {cur ? (
          <>
            <span><b>↑↓</b> previous / next</span>
            <span><b>o</b> open in its thread</span>
            <span><b>esc</b> back to the list</span>
          </>
        ) : (
          <>
            <span><b>⏎</b> answer / go to it</span>
            <span className="ip-wide-only"><b>space</b> details</span>
            <span><b>/</b> search</span>
            <span><b>esc</b> back</span>
          </>
        )}
      </div>
    </section>
  );
}

const whenShort = (r: InboxRecord, now: number): string => whenWhere(r, now).split(' · ').pop() ?? timeOf(r.at_ms);

function WaitLine({ w, on, end, narrowEnd, onClick }: { w: WaitRow; on: boolean; end: string; narrowEnd: string; onClick: () => void }) {
  return (
    <div className={`ip-row ip-wait${on ? ' on' : ''}`} role="option" aria-selected={on} data-row={w.key} data-testid={`inbox.row.${w.key}`} onClick={onClick}>
      <span className="ip-g">{w.glyph}</span>
      <span className="ip-one">
        <span className="ip-who">{w.title}</span>
        <span className="ip-q">{w.question}</span>
      </span>
      <span className="ip-end"><span className="ip-wide-only">{end}</span><span className="ip-narrow-only">{narrowEnd}</span></span>
    </div>
  );
}

function PastLine({ p, on, project, onClick }: { p: PastRow; on: boolean; project: string; onClick: () => void }) {
  const r = p.r;
  const short = lineTwo(r, true);
  return (
    <div className={`ip-row ip-past${on ? ' on' : ''}${r.state !== 'answered' ? ' gone' : ''}`} role="option" aria-selected={on} data-row={p.key}
      data-testid={`inbox.row.${p.key}`} onClick={onClick}>
      <span className="ip-g">{p.glyph}</span>
      <span className="ip-one">
        <span className="ip-who">{shownName(r.asker)}</span>
        <span className="ip-q">{r.question}</span>
      </span>
      <span className="ip-end"><span className="ip-proj">{`${project} · `}</span>{timeOf(r.at_ms)}</span>
      <span className="ip-two" data-testid={`inbox.row.${p.key}.said`}>
        {/* the 'where' in its own span, which 800 drops whole (past.css) */}
        {short}{short !== r.line2 && <span className="ip-where">{r.line2.slice(short.length)}</span>}
      </span>
    </div>
  );
}

/** One past item, read-only (space): the question whole and its options, his answer as his bubble, where and when, what the agent did next, the way to it. */
function Detail({ row, now, names, next, onJump }: { row: PastRow; now: number; names: Readonly<Record<string, string>>; next: string | undefined; onJump: () => void }) {
  const r = row.r;
  const j = jumpOf(r);
  const said = saidWords(r);
  return (
    <div className="ip-detail" data-testid="inbox.detail">
      <div className="ip-d-k">{`${shownName(r.asker)} asked in ${names[r.project] ?? r.project} · ${timeOf(r.asked_ms)}`}</div>
      <div className="ip-d-q" data-testid="inbox.detail.question">{r.question}</div>
      {r.options.length > 0 && (
        <ol className="ip-d-opts">
          {r.options.map((o, i) => (
            <li key={o} className={o === said || r.pick_n === i + 1 ? 'on' : undefined}><span className="ip-d-n">{i + 1}</span>{o}</li>
          ))}
        </ol>
      )}
      {r.state === 'answered' ? <div className="ip-d-said" data-testid="inbox.detail.said">{said}</div> : <div className="ip-d-gone">{r.line2}</div>}
      <div className="ip-d-k" data-testid="inbox.detail.where">{whenWhere(r, now)}</div>
      {next !== undefined && next !== '' && <div className="ip-d-next">{`${shownName(j.kind === 'thread' ? j.agent : r.asker)} went on: ${next}`}</div>}
      <Press look="ip-d-go" onClick={onJump} data-testid="inbox.detail.go">{jumpWords(j)}</Press>
    </div>
  );
}
