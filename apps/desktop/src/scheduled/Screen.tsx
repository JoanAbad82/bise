// The scheduled screen (desktop-screens v6, designer m_11837; sidebar row '◷ scheduled', route
// scheduled): what wakes his agents, and when. The list (what it asks | wakes | how often | next
// run) and one task in a 400 px pane at the right (under 1000 px it replaces the list, with
// '‹ scheduled'). x stops one after asking in place. The keys are the shared list keys
// (app/listkeys.ts) plus the TUI's r, x, / and esc (tui-parity m_22176). Owner: amb-mac (amb-kit's before).
import { useState, type KeyboardEvent } from 'react';
import { Button, Field, PageHero } from '@/ds';
import { hero } from '@/proto/words_hero.gen';
import { useListKeys } from '@/app/listkeys';
import { useStore } from '@/store';
import { useKeptScroll } from '@/app/keep';
import { scheduled } from '@/proto/words_scheduled.gen';
import { useAllScheduled } from './hooks';
import { asks, bySoonest, heroFacts, matches, endsWords, howOften, keyOf, nextRunWords, nextWords, runsWords, wakes, type Task } from './model';
import './scheduled.css';

export interface ScheduledPorts {
  /** stop a task (HubCmd scheduled_stop {project, id}) */
  stop: (project: string, id: number) => void;
  /** run it now (none: the hub has no typed command for it yet, the button is hidden) */
  runNow?: (project: string, id: number) => void;
}

/** The screen as the shell mounts it: every project's live tasks, the hub's commands through the store. */
export function ScheduledScreen() {
  const store = useStore();
  const tasks = useAllScheduled();
  useKeptScroll('scheduled', () => document.querySelector<HTMLElement>('[data-testid="scheduled.list"]'));
  return (
    <ScheduledView
      tasks={tasks}
      ports={{
        stop: (project, id) => {
          store.command({ cmd: 'scheduled_stop', project, id } as never);
        },
      }}
    />
  );
}

/** The screen from props (tests, shots). */
export function ScheduledView({ tasks, ports, now: pinned }: { tasks: readonly Task[]; ports: ScheduledPorts; now?: number }) {
  const [opened] = useState(() => Date.now());
  const now = pinned ?? opened;
  const list = bySoonest(tasks);
  const [q, setQ] = useState('');
  const shown = q === '' ? list : list.filter((x) => matches(x, q));
  const [open, setOpen] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const cur = list.find((x) => keyOf(x) === (open ?? '')) ?? null;
  const stop = (x: Task) => {
    ports.stop(x.project, x.t.id);
    setAsking(false);
    setOpen(null);
  };
  // the TUI's scheduled keys (scheduled_screen.rs on_key, tui-parity m_22176): r run, x stop (asks),
  // / search; esc closes the opened task, then clears the search
  const screenKey = (e: KeyboardEvent, k: string | null): boolean => {
    if (e.metaKey || e.ctrlKey || e.altKey) return false;
    const at = shown.find((x) => keyOf(x) === k);
    if (asking && cur) {
      if (e.key === 'Enter' || e.key === 'y') stop(cur);
      else if (e.key === 'Escape' || e.key === 'n') setAsking(false);
      return true;
    }
    const x = cur ?? at;
    if (e.key === 'Escape') {
      if (cur) setOpen(null);
      else if (q !== '') setQ('');
      else return false;
    } else if (e.key === 'x' && x) {
      setOpen(keyOf(x));
      setAsking(true);
    } else if (e.key === 'r' && ports.runNow && x) ports.runNow(x.project, x.t.id);
    else if (e.key === '/' && !cur) document.querySelector<HTMLInputElement>('[data-testid="scheduled.search"]')?.focus();
    else return false;
    return true;
  };
  const { sel: selKey, setSel, ref, onKeyDown, move } = useListKeys({
    order: shown.map(keyOf),
    keepAs: 'scheduled.sel',
    still: cur !== null,
    onOpen: setOpen,
    onKey: screenKey,
  });
  // the search has the keys: ⏎ gives them back, ↑↓ give them back and move, esc clears
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
  return (
    <section
      ref={ref}
      className={`sch-screen${cur ? ' has-pane' : ''}`}
      data-testid="scheduled.screen"
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      <div className="sch-main">
        <PageHero name={scheduled.heading} sentence={hero.scheduled_say} facts={heroFacts(list, now)} testId="scheduled.hero" />
        {list.length > 0 && (
          <span className="sch-search">
            <Field slash placeholder={scheduled.search_placeholder} value={q} onChange={(e) => { setQ(e.currentTarget.value); }} onKeyDown={searchKey} testId="scheduled.search" />
          </span>
        )}
        {list.length === 0 ? (
          <div className="sch-empty" data-testid="scheduled.empty">{scheduled.empty_desktop}</div>
        ) : shown.length === 0 ? (
          <div className="sch-empty" data-testid="scheduled.none">{scheduled.none_match_desktop}</div>
        ) : (
          <div className="sch-list" role="listbox" data-testid="scheduled.list">
            <div className="sch-row sch-cols" aria-hidden="true">
              <span>{scheduled.col_what}</span>
              <span>{scheduled.label_wakes}</span>
              <span>{scheduled.label_how_often}</span>
              <span>{scheduled.label_next_run}</span>
            </div>
            {shown.map((x) => (
              <div key={keyOf(x)} className={`sch-row${keyOf(x) === selKey ? ' on' : ''}${cur && keyOf(cur) === keyOf(x) ? ' open' : ''}`} role="option"
                aria-selected={keyOf(x) === selKey} data-row={keyOf(x)} data-testid={`scheduled.row.${String(x.t.id)}`}
                onClick={() => { setSel(keyOf(x)); setOpen(keyOf(x)); setAsking(false); }}>
                <span className="sch-asks" title={x.t.words}>{asks(x.t)}</span>
                <span className="sch-dim">{wakes(x)}</span>
                <span className="sch-dim">{howOften(x.t)}</span>
                <span className="sch-next">{nextWords(x.t, now)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="sch-keys" data-testid="scheduled.keys">
          <span><b>⏎</b> {scheduled.key_open}</span>
          {ports.runNow && <span><b>r</b> {scheduled.key_run_now}</span>}
          <span><b>x</b> {scheduled.key_stop}</span>
          <span><b>/</b> {scheduled.key_search}</span>
        </div>
      </div>
      {cur && (
        <aside className="sch-pane" data-testid="scheduled.pane">
          <Button kind="ghost" onClick={() => { setOpen(null); setAsking(false); }} testId="scheduled.back">{`‹ ${scheduled.heading}`}</Button>
          {/* the head, then its words once (designer m_12105: no title repeating the quote) */}
          {/* its name, never its id; who it wakes dim beside it, as the TUI's opened head (designer m_15929) */}
          <div className="sch-title" data-testid="scheduled.pane.title">
            {asks(cur.t)}
            <span className="sch-k3-sub">{wakes(cur)}</span>
          </div>
          <div className="sch-label">{scheduled.words_it_sends}</div>
          <blockquote className="sch-quote" data-testid="scheduled.pane.words">{cur.t.words}</blockquote>
          <dl className="sch-kv">
            <dt>{scheduled.label_wakes}</dt><dd>{wakes(cur)}</dd>
            <dt>{scheduled.label_set_by}</dt><dd>{cur.t.by}</dd>
            <dt>{scheduled.label_how_often}</dt><dd>{howOften(cur.t)}</dd>
            <dt>{scheduled.label_next_run}</dt><dd>{nextRunWords(cur.t, now)}</dd>
            <dt>{scheduled.label_it_ends}</dt><dd>{endsWords(cur.t, now)}</dd>
            {cur.t.page != null && cur.t.page !== '' && (<><dt>{scheduled.label_keeps_fresh}</dt><dd>{`↗ ${cur.t.page}`}</dd></>)}
          </dl>
          <div className="sch-label">{scheduled.its_runs}</div>
          <div className="sch-runs">{cur.t.done === 0 ? scheduled.none_yet : runsWords(cur.t)}</div>
          {asking ? (
            <div className="sch-ask" role="group" data-testid="scheduled.ask">
              <span>{scheduled.stop_ask_desktop({ agent: cur.t.agent })}</span>
              <span className="sch-acts">
                <Button kind="danger" onClick={() => { stop(cur); }} testId="scheduled.ask.stop">{`${scheduled.key_stop} ⏎`}</Button>
                <Button kind="ghost" onClick={() => { setAsking(false); }} testId="scheduled.ask.keep">{`${scheduled.key_keep} esc`}</Button>
              </span>
            </div>
          ) : (
            <div className="sch-acts">
              {/* the act, then its key dim, as the list foot's '⏎ open   x stop' (designer m_15929) */}
              {ports.runNow && <Button kind="pri" onClick={() => { ports.runNow?.(cur.project, cur.t.id); }} testId="scheduled.run">{scheduled.key_run_now} <span className="sch-key">r</span></Button>}
              <Button kind="danger" onClick={() => { setAsking(true); }} testId="scheduled.stop">{scheduled.key_stop} <span className="sch-key">x</span></Button>
            </div>
          )}
        </aside>
      )}
    </section>
  );
}
