// The inbox screen's view (designer's inbox-history pick A, m_24212 (2)-(6); route inbox/all,
// sidebar row '? inbox'): the head ('inbox', '3 waiting · 41 answered'), the filters (projects,
// agents, all / waiting / answered / withdrawn, '/' search), 'waiting for you · N' first (⏎ opens
// the item above this screen's composer, as ⌘I), then the past by day, two lines each, read-only.
// A past row's first action (his ask, inbox-open): ⏎, space or a click opens the whole item in the
// pane beside the list (Pane: the question, every option with his pick marked or his words, where
// and when, the page he answered on); the pane follows the selection (↑↓), esc closes it. The
// second: ⌘⏎ (or the pane's button, or o) goes to his answer: the thread at that very entry,
// however old, or the page at its block. The list keys are app/listkeys.ts's. At 800 the agents go
// into the projects menu, 'withdrawn' too, the rows drop the project and the 'where', whole, and
// the pane takes the list's place (past.css). From props: the store's wiring is InboxScreen
// (InboxScreen.tsx). Owner: inbox-screen.
import { useEffect, useState, type KeyboardEvent } from 'react';
import type { Card } from '@/proto';
import { useListKeys } from '@/app/listkeys';
import { Dropdown, Field, Press } from '@/ds';
import { shownName } from '@/agents/model';
import { inbox } from '@/proto/words_inbox.gen';
import { timeOf } from '@/artifacts/model';
import { ALL, askersOf, closedMs, dayHead, headWords, jumpOf, jumpWords, lineTwo, listsOf, saidWords, STATES, waitEnd, whenWhere, type Filter, type StateFilter, type InboxRecord, type Jump, type PastRow, type WaitRow } from './past';
import './past.css';

/** A state filter's words. */
const STATE_WORDS: Readonly<Record<StateFilter, string>> = { all: inbox.state_all, waiting: inbox.state_waiting, answered: inbox.state_answered, withdrawn: inbox.state_withdrawn };

export interface InboxPorts {
  /** ⏎ on a waiting item: it opens above the composer, as ⌘I (openInbox) */
  readonly answer: (project: string, card: number) => void;
  /** a past item: his answer in its thread (th-flash, a history step), or the page at its block */
  readonly jump: (j: Jump) => void;
  /** the page he answered on, beside (notif-artifact's open act) */
  readonly openPage?: (project: string, page: string, block?: string) => void;
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
  /** the record the pane shows (none: closed): the screen reads its thread meanwhile */
  readonly onDetail?: (r: InboxRecord | null) => void;
  /** a page's title and version, for the pane's chip ('↗ <title> · page · v3'; none: its id) */
  readonly pageOf?: (project: string, page: string) => PageMeta | undefined;
  /** now (a test or a shot pins it) */
  readonly now?: number;
}

export function InboxView({ cards, records, answered, onEnd, names, projects, ports, nextOf, onDetail, pageOf, now: pinned }: InboxViewProps) {
  const [opened] = useState(() => Date.now());
  const now = pinned ?? opened;
  const [f, setF] = useState<Filter>(ALL);
  // the pane is open: it shows the selected row while that is a past one (it follows ↑↓)
  const [paned, setPaned] = useState(false);
  const lists = listsOf(cards, records, names, f, now);
  const pastBy = new Map(lists.days.flatMap((d) => d.rows.map((r) => [r.key, r] as const)));
  const waitBy = new Map(lists.waiting.map((w) => [w.key, w] as const));
  // ⏎ (the first action): a waiting item opens above the composer; a past one, whole, in the pane
  const open = (key: string) => {
    const w = waitBy.get(key);
    if (w) ports.answer(w.card.project, w.card.id);
    if (pastBy.has(key)) setPaned(true);
  };
  // ⌘⏎ (the second): to his answer, in its thread at that entry or on its page
  const go = (key: string | null) => {
    const p = key === null ? undefined : pastBy.get(key);
    if (p) ports.jump(jumpOf(p.r));
    return p !== undefined;
  };
  const screenKey = (e: KeyboardEvent, k: string | null): boolean => {
    if (e.key === 'Enter' && e.metaKey && !e.ctrlKey && !e.altKey) return go(k);
    if (e.metaKey || e.ctrlKey || e.altKey) return false;
    if (cur) {
      if (e.key === 'Escape') setPaned(false);
      else if (e.key === 'o') go(cur.key);
      else if (e.key === ' ') setPaned(false);
      else return false;
      return true;
    }
    if (e.key === ' ' && k !== null && pastBy.has(k)) setPaned(true);
    else if (e.key === '/') document.querySelector<HTMLInputElement>('[data-testid="inbox.search"]')?.focus();
    else if (e.key === 'Escape' && f.q !== '') setF({ ...f, q: '' });
    else return false;
    return true;
  };
  const { sel, setSel, ref, onKeyDown, move } = useListKeys({ order: lists.order, keepAs: 'inbox.sel', onOpen: open, onKey: screenKey });
  const cur = !paned || sel === null ? undefined : pastBy.get(sel);
  const looked = cur?.r ?? null;
  useEffect(() => {
    onDetail?.(looked);
  }, [onDetail, looked]);
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
  };
  const askers = askersOf(cards, records);
  const empty = cards.length === 0 && records.length === 0;
  const none = lists.order.length === 0;
  return (
    <section ref={ref} tabIndex={-1} className="ip-screen" data-testid="inbox.screen" onKeyDown={onKeyDown}>
      <header className="ip-head">
        <div className="ip-h1">{inbox.head}</div>
        <div className="ip-h2" data-testid="inbox.counts">{headWords(cards, records, answered)}</div>
      </header>
      {(
        <div className="ip-filters">
          <Dropdown label={f.project === '' ? inbox.all_projects : (names[f.project] ?? f.project)} testId="inbox.projects"
            groups={[
              // 800: each part under its head, two choices (designer m_26260); wide, no head
              { id: 'projects', head: inbox.filter_projects, look: 'ip-heads-narrow', rows: [
                { id: 'p:', name: inbox.all_projects, current: f.project === '', testId: 'inbox.projects.all' },
                ...projects.map((p) => ({ id: `p:${p.project}`, name: p.name !== '' ? p.name : p.project, current: f.project === p.project, testId: `inbox.projects.${p.project}` })),
              ] },
              // 800: the agents and 'withdrawn' come in here (past.css shows them only narrow)
              { id: 'agents', head: inbox.filter_agents, look: 'ip-narrow-only', rows: [
                { id: 'a:', name: inbox.all_agents, current: f.agent === '', testId: 'inbox.projects.agents.all' },
                ...askers.map((a) => ({ id: `a:${a}`, name: shownName(a), current: f.agent === a, testId: `inbox.projects.agent.${a}` })),
                { id: 'withdrawn', name: inbox.state_withdrawn, current: f.state === 'withdrawn', testId: 'inbox.projects.withdrawn' },
              ] },
            ]}
            onPick={(id) => {
              if (id === 'withdrawn') set({ state: f.state === 'withdrawn' ? 'all' : 'withdrawn' });
              else if (id.startsWith('a:')) set({ agent: id.slice(2) });
              else set({ project: id.slice(2) });
            }} />
          <Dropdown extra="ip-wide-only" label={f.agent === '' ? inbox.all_agents : shownName(f.agent)} testId="inbox.agents"
            groups={[{ id: 'agents', rows: [
              { id: 'a:', name: inbox.all_agents, current: f.agent === '', testId: 'inbox.agents.all' },
              ...askers.map((a) => ({ id: `a:${a}`, name: shownName(a), current: f.agent === a, testId: `inbox.agents.${a}` })),
            ] }]}
            onPick={(id) => { set({ agent: id.slice(2) }); }} />
          <span className="ip-states">
            {STATES.map((s) => (
              <Press key={s} look={`ip-state${f.state === s ? ' on' : ''}${s === 'withdrawn' ? ' ip-wide-only' : ''}`} aria-pressed={f.state === s}
                onClick={() => { set({ state: s }); }} data-testid={`inbox.state.${s}`}>
                {STATE_WORDS[s]}
              </Press>
            ))}
          </span>
          <span className="ip-search">
            <Field slash placeholder={inbox.search} value={f.q} onChange={(e) => { setF({ ...f, q: e.currentTarget.value }); }} onKeyDown={searchKey} testId="inbox.search" />
          </span>
        </div>
      )}
      <div className={`ip-body${cur ? ' paned' : ''}`}>
      {empty ? (
        <div className="ip-empty" data-testid="inbox.empty">{inbox.screen_empty}</div>
      ) : none ? (
        <div className="ip-empty" data-testid="inbox.none">{inbox.screen_none}</div>
      ) : (
        <div className="ip-list" role="listbox" data-testid="inbox.list"
          onScroll={onEnd === undefined ? undefined : (e) => {
            const el = e.currentTarget;
            if (el.scrollHeight - el.scrollTop - el.clientHeight < 240) onEnd();
          }}>
          {lists.waiting.length > 0 && (
            <>
              <div className="ip-day-h ip-wait-h" data-testid="inbox.waiting.head">{inbox.list_waiting({ n: lists.waiting.length })}</div>
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
                <PastLine key={p.key} p={p} on={p.key === sel} open={p.key === cur?.key} project={names[p.r.project] ?? p.r.project}
                  onClick={() => { setSel(p.key); setPaned(true); }} />
              ))}
            </div>
          ))}
        </div>
      )}
      {cur && (
        <Pane row={cur} now={now} names={names} next={nextOf?.(cur.r)} meta={pageOf}
          onJump={() => { ports.jump(jumpOf(cur.r)); }}
          onClose={() => { setPaned(false); ref.current?.focus({ preventScroll: true }); }}
          {...(ports.openPage === undefined ? {} : { onPage: ports.openPage })} />
      )}
      </div>
      <div className="ip-keys" data-testid="inbox.keys">
        {cur ? (
          <>
            <span><b>↑↓</b> {inbox.key_prev_next}</span>
            <span data-testid="inbox.keys.go"><b>⌘⏎</b> {inbox.key_go}</span>
            <span><b>esc</b> {inbox.key_close}</span>
          </>
        ) : sel !== null && pastBy.has(sel) ? (
          <>
            {/* what ⏎ and ⌘⏎ do on the selected row (designer m_25639; inbox-open) */}
            <span data-testid="inbox.keys.enter"><b>⏎</b> {inbox.key_open}</span>
            <span data-testid="inbox.keys.go"><b>⌘⏎</b> {inbox.key_go}</span>
            <span><b>/</b> {inbox.search}</span>
            <span><b>esc</b> {inbox.key_back}</span>
          </>
        ) : (
          <>
            <span data-testid="inbox.keys.enter"><b>⏎</b> {inbox.key_answer}</span>
            <span><b>/</b> {inbox.search}</span>
            <span><b>esc</b> {inbox.key_back}</span>
          </>
        )}
      </div>
    </section>
  );
}


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

function PastLine({ p, on, open, project, onClick }: { p: PastRow; on: boolean; open: boolean; project: string; onClick: () => void }) {
  const r = p.r;
  const short = lineTwo(r, true);
  return (
    <div className={`ip-row ip-past${on ? ' on' : ''}${open ? ' open' : ''}${r.state !== 'answered' ? ' gone' : ''}`} role="option" aria-selected={on} data-row={p.key}
      data-testid={`inbox.row.${p.key}`} onClick={onClick}>
      <span className="ip-g">{p.glyph}</span>
      <span className="ip-one">
        <span className="ip-who">{shownName(r.asker)}</span>
        <span className="ip-q">{r.question}</span>
      </span>
      <span className="ip-end"><span className="ip-proj">{`${project} · `}</span>{closedMs(r) > 0 ? timeOf(closedMs(r)) : ''}</span>
      <span className="ip-two" data-testid={`inbox.row.${p.key}.said`}>
        {/* the 'where' in its own span, which 800 drops whole (past.css) */}
        {short}{short !== r.line2 && <span className="ip-where">{r.line2.slice(short.length)}</span>}
      </span>
    </div>
  );
}

/**
 * One past item, whole, in the pane beside the list (his ask, inbox-open): who asked where and
 * when, the question whole, every option with the one he picked marked (or his words as his
 * bubble), where and when he answered, the page he answered on, what the agent did next, and the
 * way to his answer (⌘⏎).
 */
export interface PageMeta {
  readonly title: string;
  readonly version: number;
}

/** The pane's page chip: '↗ size chips · page · v3' (notif-artifact's chip), its id when unknown. Pure. */
export function pageChip(page: string, meta: PageMeta | undefined): string {
  return meta === undefined ? inbox.page_chip({ page }) : inbox.page_chip_v({ title: meta.title !== '' ? meta.title : page, v: meta.version });
}

function Pane({ row, now, names, next, meta, onJump, onClose, onPage }: {
  row: PastRow; now: number; names: Readonly<Record<string, string>>; next: string | undefined;
  meta: ((project: string, page: string) => PageMeta | undefined) | undefined;
  onJump: () => void; onClose: () => void; onPage?: (project: string, page: string, block?: string) => void;
}) {
  const r = row.r;
  const j = jumpOf(r);
  const said = saidWords(r);
  const picked = pickedOf(r);
  const page = r.where?.kind === 'page' ? r.where : null;
  return (
    <aside className="ip-pane" aria-label={inbox.detail_label({ agent: shownName(r.asker) })} data-testid="inbox.detail">
      <div className="ip-p-head">
        <Press look="ip-crumb" onClick={onClose} data-testid="inbox.detail.back">{`‹ ${inbox.head}`}</Press>
        <span className="ip-d-k">{inbox.detail_asked({ agent: shownName(r.asker), project: names[r.project] ?? r.project, when: whenOf(r.asked_ms, now) })}</span>
        <Press look="ip-p-close" onClick={onClose} aria-label={inbox.detail_close_label} title={inbox.detail_close_tip} data-testid="inbox.detail.close">×</Press>
      </div>
      <div className="ip-p-body">
        <div className="ip-d-q" data-testid="inbox.detail.question">{r.question}</div>
        {r.options.length > 0 && (
          <ol className="ip-d-opts" data-testid="inbox.detail.options">
            {r.options.map((o, i) => (
              <li key={`${String(i)}:${o}`} className={picked === i ? 'on' : undefined} data-testid={`inbox.detail.option.${String(i + 1)}`} aria-current={picked === i ? 'true' : undefined}>
                <span className="ip-d-n">{picked === i ? '✓' : i + 1}</span>{o}
              </li>
            ))}
          </ol>
        )}
        {r.state === 'answered'
          ? picked === null && said !== '' && <div className="ip-d-said" data-testid="inbox.detail.said">{said}</div>
          : <div className="ip-d-gone">{r.line2}</div>}
        <div className="ip-d-k" data-testid="inbox.detail.where">{whenWhere(r, now)}</div>
        {page !== null && (
          <Press look="ip-d-chip" onClick={() => { onPage?.(r.project, page.page, page.block); }} data-testid="inbox.detail.page">
            {pageChip(page.page, meta?.(r.project, page.page))}
          </Press>
        )}
        {next !== undefined && next !== '' && <div className="ip-d-next">{inbox.detail_next({ agent: shownName(j.kind === 'thread' ? j.agent : r.asker), next })}</div>}
        <Press look="ip-d-go" onClick={onJump} data-testid="inbox.detail.go">{jumpWords(j, r.state === 'answered')}<kbd>⌘⏎</kbd></Press>
      </div>
    </aside>
  );
}

/** The option he picked: its number, else the option his words are; null for his own words. Pure. */
export function pickedOf(r: InboxRecord): number | null {
  if (r.state !== 'answered') return null;
  if (r.pick_n != null && r.pick_n >= 1 && r.pick_n <= r.options.length) return r.pick_n - 1;
  const said = saidWords(r);
  const i = r.options.indexOf(said);
  return i < 0 ? null : i;
}

/** 'today 14:02' → '14:02', else 'oct 12 14:02'. */
function whenOf(ms: number, now: number): string {
  const day = dayHead(ms, now);
  return ms <= 0 ? day : day === inbox.day_today ? timeOf(ms) : `${day} ${timeOf(ms)}`;
}
