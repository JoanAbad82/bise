// A project's agents (bise fait mac, page native-mac §6 and §9; routes agents and archived): under
// the window's bar its banner (ds PageBanner: 'Agents' or 'Archived', its sentence, how many work and
// wait on him, the page's signed vignette), its filter (Live / Archived, ds Filters: the two routes)
// and 'New agent' (app/newagent.tsx, the same sheet as ⌘N), then one ds ListRow per agent in the
// hub's order (main first): its state mark, its name and what it does, then where it is and its last
// report; its '…' and a right click are its menu (useEntityMenu: Rename…, Change Model…, Pin,
// Changes, Stop, Archive, Restore...). The menu's Rename… and Change Model… open the agent's sheet
// here (Tune.tsx AgentSheet, sheet.ts), on its own field. The list keys (app/listkeys.ts), space
// shows its feed in place. The floating composer's room at the foot (--float-room).
// Owner: nm-pages-b (amb-win's before).
import { memo, useState, type KeyboardEvent } from 'react';
import { Peek } from './Peek';
import { AppIcon, BannerWait, Button, Dot, Empty, FilterRow, Filters, ListRow, MoreButton, PageBanner, tipAttrs } from '@/ds';
import { hero } from '@/proto/words_hero.gen';
import { pages } from '@/proto/words_pages.gen';
import { panel } from '@/proto/words_panel.gen';
import { PageVignette, useBannerGutter } from '@/artifacts/hero/vignettes';
import { archivedFacts, liveFacts } from './hero';
import type { Agent } from '@/proto';
import { useAgents } from '@/store';
import { useRouter } from '@/app/router';
import { useNow } from '@/app/clock';
import { keep, useKeptScroll } from '@/app/keep';
import { useListKeys } from '@/app/listkeys';
import { useEntityMenu } from '@/app/menus/use';
import { useEntityAction } from '@/app/menus/actions';
import { newAgent } from '@/app/newagent';
import { archivedEnd, archivedOf, dotOf, endOf, lineOf, liveOf } from './model';
import { keepSheet, keptSheet, type SheetAsk } from './sheet';
import { AgentSheet } from './Tune';
import './agents.css';

/**
 * The row's keys beside the list keys (app/listkeys.ts: ↑↓ jk pgup pgdn home end, ⏎ opens; W6/K18):
 * space shows the selected agent's feed in place, space again closes it, esc closes it. The new
 * preview; null: not its key. Pure.
 */
export function peekKey(key: string, sel: string | null, peek: string | null): { peek: string | null } | null {
  if (key === ' ') return sel === null ? null : { peek: peek === sel ? null : sel };
  if (key === 'Escape') return peek === null ? null : { peek: null };
  return null;
}

/** What waits on him in a row: a card of its, or the hub's waiting_on him (the accent's only use). Pure. */
export function asksHim(a: Pick<Agent, 'archived' | 'waits' | 'waiting_on'>): boolean {
  return !a.archived && (a.waits > 0 || a.waiting_on?.who === 'you');
}

/**
 * As the TUI (his try on a43609b2): /agents lists the live agents only, /archived (`archived`)
 * only the archived ones; the filter goes from one to the other.
 */
export function AgentsScreen({ project, archived: showArchived = false }: { project: string; archived?: boolean }) {
  useKeptScroll(`agents:${project}${showArchived ? ':archived' : ''}`, () => document.querySelector<HTMLElement>('[data-testid="agents.scroll"]'));
  const agents = useAgents(project);
  const live = liveOf(agents);
  const archived = archivedOf(agents);
  const router = useRouter();
  const gutter = useBannerGutter();
  const [peek, setPeek] = useState<string | null>(null);
  // the agent's sheet (Rename…, Change Model…): kept across a reload, asked by the menu from anywhere
  const [sheet, setSheetState] = useState<SheetAsk | null>(() => keptSheet(project));
  const setSheet = (s: SheetAsk | null) => {
    keepSheet(project, s);
    setSheetState(s);
  };
  const take = (field: SheetAsk['field']) => (e: Parameters<Parameters<typeof useEntityAction>[1]>[0]) => {
    if (e.kind !== 'agent' || e.project !== project || !agents.some((a) => a.name === e.agent)) return false;
    setSheet({ agent: e.agent, field });
    return true;
  };
  useEntityAction('rename', take('name'));
  useEntityAction('change-model', take('model'));
  const shown = showArchived ? archived : live;
  const now = useNow();
  const liveNow = liveFacts(live);
  // the row tint only on a row he picked (a key, a click, or kept from before a reload), never the
  // first row at load (ui-review's red on 7f2f936bf)
  const [picked, setPicked] = useState(() => keep.view(`agents.sel:${project}`) !== undefined);
  const { sel, setSel, ref: section, onKeyDown: listKeys } = useListKeys({
    order: shown.map((a) => a.name),
    keepAs: `agents.sel:${project}`,
    onOpen: (agent) => {
      router.go({ screen: 'thread', project, agent });
    },
    onKey: (e, at) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return false;
      const next = peekKey(e.key, at, peek);
      if (next === null) return false;
      setPeek(next.peek);
      return true;
    },
  });
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    listKeys(e);
    if (e.defaultPrevented) setPicked(true);
  };
  const sheetOf = sheet === null ? undefined : agents.find((a) => a.name === sheet.agent && !a.archived);
  return (
    <section ref={section} tabIndex={-1} onKeyDown={onKeyDown} className="ag-screen" data-testid="agents.screen" data-project={project} data-archived={showArchived ? 'true' : undefined}>
      {/* one scroller: the banner scrolls away with the list; its foot keeps the floating composer's room */}
      <div className="ag-scroll" data-testid="agents.scroll">
        {showArchived ? (
          <PageBanner title={hero.archived_title} sentence={hero.archived_say} facts={archivedFacts(archived, now)}
            visual={<PageVignette page="archived" />} icon="archive" gutter={gutter} testId="agents.lead" />
        ) : (
          <PageBanner title={hero.agents_title} sentence={hero.agents_say}
            facts={<>{liveNow.rest}{liveNow.wait !== undefined && <>{' · '}<BannerWait>{liveNow.wait}</BannerWait></>}</>}
            visual={<PageVignette page="agents" />} icon="thread" gutter={gutter} testId="agents.lead" />
        )}
        <div className="ag-col">
          <FilterRow testId="agents.filters">
            <Filters
              items={[
                { id: 'live', label: <>{pages.agents_live}<span className="ag-n">{live.length}</span></> },
                { id: 'archived', label: <>{pages.agents_archived}<span className="ag-n">{archived.length}</span></> },
              ]}
              on={showArchived ? 'archived' : 'live'}
              label={pages.agents_show}
              onPick={(id) => {
                router.go(id === 'archived' ? { screen: 'agents', project, archived: true } : { screen: 'agents', project });
              }}
              testId="agents.filter"
            />
            {!showArchived && (
              <span className="ag-new">
                <Button kind="ghost" onClick={() => { newAgent(project); }} testId="agents.new">
                  <AppIcon name="plus" size={14} />
                  {pages.new_agent}
                </Button>
              </span>
            )}
          </FilterRow>
          {shown.length === 0 ? (
            <Empty testId="agents.empty" title={showArchived ? panel.no_archived : panel.no_agents} />
          ) : (
            <div className="ag-list" data-testid="agents.list">
              {shown.map((a) => (
                <AgentItem key={a.name} project={project} a={a} sel={picked && sel === a.name} peek={peek === a.name} now={now}
                  onClick={() => {
                    setSel(a.name);
                    setPicked(true);
                    router.go({ screen: 'thread', project, agent: a.name });
                  }} />
              ))}
            </div>
          )}
        </div>
      </div>
      {sheetOf !== undefined && sheet !== null && (
        <AgentSheet key={sheetOf.name} project={project} a={sheetOf} field={sheet.field}
          onClose={() => {
            setSheet(null);
          }}
          onRenamed={() => {
            setSheet(null);
          }} />
      )}
    </section>
  );
}

/** A row's state mark: '?' in the accent when it asks him, a check when done, the sidebar's turning
 *  arc in text-3 while it works (app.css .app-s-ring, designer m_43568), else its status dot. */
export function StateMark({ a }: { a: Agent }) {
  if (asksHim(a)) return <span className="ag-ask" {...tipAttrs(pages.asks_you)}>?</span>;
  if (a.archived) return <span className="ag-mark" {...tipAttrs(a.status === 'done' ? pages.done : pages.stopped)}><AppIcon name={a.status === 'done' ? 'check' : 'stop'} size={14} /></span>;
  if (a.status === 'done' && a.waiting_on == null) return <span className="ag-mark" {...tipAttrs(pages.done)}><AppIcon name="check" size={14} /></span>;
  if (a.waiting_on?.who === 'agent') return <span className="ag-mark" {...tipAttrs(pages.waits_on_agent)}><AppIcon name="more" size={14} /></span>;
  if (a.status === 'working') return <span className="app-s-ring" role="img" aria-label={pages.working} {...tipAttrs(pages.working)} />;
  return <Dot state={dotOf(a.status)} />;
}

const AgentItem = memo(function AgentItem({ project, a, sel, peek, now, onClick }: { project: string; a: Agent; sel: boolean; peek: boolean; now: number; onClick: () => void }) {
  const menu = useEntityMenu({ kind: 'agent', project, agent: a.name });
  const end = a.archived ? archivedEnd(a, now) : endOf(a, now).text;
  const line = lineOf(a);
  const id = a.name;
  return (
    <div data-row={a.name} data-testid={`agents.row.${id}`} data-status={a.status}>
      <ListRow on={sel} onClick={onClick} onContextMenu={menu.onContextMenu} testId={`agents.open.${id}`}
        // the whole line and report in its tip: the row cuts them (his rule: every cut text has its tip)
        tip={[line, a.report == null ? '' : `${a.report.kind} · ${a.report.text}`].filter((x) => x !== '').join('\n') || undefined}
        state={<StateMark a={a} />}
        title={<><span className="ag-name">{a.main ? 'bise' : a.name}</span>{line !== '' && <span className="ag-what" data-testid={`agents.line.${id}`}>{line}</span>}</>}
        sub={<>
          <span className={asksHim(a) ? 'ag-end wait' : 'ag-end'} data-testid={`agents.end.${id}`}>{end}</span>
          {a.report != null && <span data-testid={`agents.report.${id}`}>{` · ${a.report.kind} · ${a.report.text}`}</span>}
        </>}
        end={<MoreButton menu={menu} testId={`agents.more.${id}`} />} />
      {peek && <Peek project={project} agent={a.name} />}
    </div>
  );
});
