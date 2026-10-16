// The right bar (designer's desktop-right-bar v5, ambient-lead m_20085/m_20087): what happens in the
// place shown, as the terminal's panel: four foldable sections in his order, AGENTS (start order,
// ⌥N = the TUI's), ARCHIVED (folded until he opens it), ARTIFACTS, SCHEDULED & WATCHING (an alarm: agent-waiting-states A). 320 px, it takes panel A's slots
// (docked from 1000 px, sliding over under it, ⌥⌘0). On bise's thread the same sections cover every
// project, the project's name in place of the role. A click opens the agent full in the centre (his
// pick), an artifact its view, a task the scheduled screen; 'all ›' the full list in the centre.
// ARTIFACTS and SCHEDULED & WATCHING follow the thread in view (barscope.ts): a sub-agent's shows
// only its own, its name on a line under the head ('for perf'). A head's parts never meet: the
// label gives way ('…') under '+ add' and 'all ›' (app/bar-heads). A long section opens 50 rows
// at a time past its cap ('show 50 more · N left', then 'show less' beside it), kept per
// section and per scope (his m_26894, barrows.ts pageRows).
// Owner: amb-win. The rows' words are pure (barrows.ts).
import { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Act, Dot, Press, Ring, Slide, tipAttrs } from '@/ds';
import { markTip } from './tipwords';
import type { Agent } from '@/proto';
import { common } from '@/proto/words_common.gen';
import { panel } from '@/proto/words_panel.gen';
import { useAllArtifacts } from '@/artifacts';
import { LEAVES, useGoArtifact } from '@/artifacts/leave';
import { AddButton, AddDrop, useAddPlace } from '@/artifacts/Drops';
import { useModHeld } from './held';
import { useAllScheduled } from '@/scheduled';
import { useCards, useComputerLive, useGrowth, usePlaces, useStore, type Store } from '@/store';
import { numbersOf } from '@/agents/model';
import { Tip } from '@/setup';
import { useTour } from '@/setup/useTour';
import { Hint, hintUsed, useHint } from './hints';
import { MAIN } from './route';
import { useNowFor } from './clock';
import { pauseInSeconds } from '@/thread/wake';
import { keep, useKeptScroll } from './keep';
import { useRoute, useRouter } from './router';
import { agentRows, archivedRows, artifactRows, pageRows, scheduledRows, watchRows, type BarRow, type ProjAgent } from './barrows';
import { barScope, inScope, scopeCountTip, scopeWords, type ScopeWords } from './barscope';
import { FitWords } from './FitWords';
import { DoneSign } from './Marks';
import { BimsSwitch, Office } from '@/bims/Office';
import { parts as bimsParts } from '@/bims/feed';
import { showsWide, useBimsView, wideMode } from '@/bims/view';

const lastAgents = new Map<string, { from: readonly (readonly Agent[])[]; items: readonly ProjAgent[] }>();

/** The agents of one project, or of every project ('' = bise's thread), with a stable snapshot. */
export function useBarAgents(project: string): readonly ProjAgent[] {
  const store = useStore();
  const ids = (s: Store) => (project === '' ? s.projects().map((p) => p.project) : [project]);
  return useSyncExternalStore(
    (cb) => {
      const offs = ids(store).map((p) => store.subscribe(`agents:${p}`, cb));
      offs.push(store.subscribe('projects', cb));
      return () => {
        for (const off of offs) off();
      };
    },
    () => {
      const list = ids(store);
      const names = list.map((p) => {
        const row = store.projects().find((x) => x.project === p);
        return row !== undefined && row.name !== '' ? row.name : p;
      });
      const from = list.map((p) => store.agents(p));
      const key = `${project}\u0000${names.join('\n')}`;
      const was = lastAgents.get(key);
      if (was !== undefined && was.from.length === from.length && was.from.every((x, i) => x === from[i])) return was.items;
      const items: ProjAgent[] = [];
      list.forEach((p, i) => {
        for (const a of from[i] ?? []) items.push({ project: p, projectName: names[i] ?? p, a });
      });
      lastAgents.set(key, { from, items });
      return items;
    },
  );
}

/** A section folded or not, kept per window (designer: 'L'état replié est gardé par fenêtre');
 *  `byDefault` until he changes it (ARCHIVED starts folded: his ask, main m_23467). */
function useFolded(key: string, byDefault: boolean): readonly [boolean, () => void] {
  const [v, set] = useState<boolean>(() => {
    const kept = keep.view(`frame.rb.${key}`);
    return typeof kept === 'boolean' ? kept : byDefault;
  });
  return [
    v,
    () => {
      keep.setView(`frame.rb.${key}`, !v);
      set(!v);
    },
  ];
}

/** The pages a section opened past its cap (pageRows), kept per window under `key` until 'show less'. */
function usePages(key: string): readonly [number, (n: number) => void] {
  const [, bump] = useState(0);
  const kept = keep.view(key);
  return [
    typeof kept === 'number' && kept > 0 ? kept : 0,
    (n) => {
      keep.setView(key, n > 0 ? n : undefined);
      bump((x) => x + 1);
    },
  ];
}

type SectionId = 'agents' | 'archived' | 'artifacts' | 'scheduled';

function Section({
  id,
  title,
  rows,
  cap,
  summary,
  noFold = false,
  count,
  scope = null,
  pageScope,
  full,
  onAll,
  act,
  office,
  children,
}: {
  id: SectionId;
  title: string;
  rows: readonly BarRow[];
  cap: number;
  /** what the head counts when it isn't every row ('AGENTS · N': the agents, no head, no PR) */
  count?: number;
  summary: string;
  noFold?: boolean;
  /** its scope's words on a line under the head ('by perf': a sub-agent's thread, barscope.ts), their tip, its line at 0 */
  scope?: ScopeWords | null;
  /** whose list it shows ('<project>' or '<project>/<agent>', '' bise's thread): the pages he opened are kept per section and per scope */
  pageScope: string;
  /** the rows of its full list, when it shows a part ('all ›' stays while the full list has some) */
  full?: number;
  onAll: () => void;
  /** a control in the head before 'all ›' (ARTIFACTS' '+ add') */
  act?: ReactNode;
  /** AGENTS with bims on: the office, above the rows */
  office?: ReactNode;
  children: (r: BarRow) => ReactNode;
}) {
  const [folded, toggle] = useFolded(id, id === 'archived');
  const [kept, setPages] = usePages(`frame.rb.more.${id}.${pageScope}`);
  const head = useRef<HTMLDivElement>(null);
  const shut = folded && !noFold;
  const { shown, pages, more, less } = pageRows(rows, cap, kept);
  // a head that folds is a row: pointer, the rows' hover tint, a chevron ('▾' on hover while open,
  // '▸' always while folded); one that can't fold looks like a plain title (designer m_21633)
  return (
    <section className="app-rb-sec" data-testid={`app.right.${id}`} data-folded={shut || undefined}>
      <div className="app-rb-head" ref={head} data-folds={!noFold || undefined}>
        <Press look="app-rb-title" aria-expanded={!shut} onClick={noFold ? undefined : toggle} data-testid={`app.right.${id}.head`}>
          {/* folded, the scope line goes with the rows: the count's tip says the scope (designer m_26425) */}
          <span className="app-rb-label" {...tipAttrs(shut && scope !== null && (id === 'artifacts' || id === 'scheduled') ? scopeCountTip(id, count ?? rows.length, scope) : undefined)}>
            {`${title} · ${String(count ?? rows.length)}`}
          </span>
          {shut && summary !== '' && (
            <span className="app-rb-sum" data-testid={`app.right.${id}.summary`}>
              {summary}
            </span>
          )}
        </Press>
        {act}
        {/* nothing to open at 0: the head stays, 'all ›' goes (designer m_20272 (4)) */}
        {(full ?? rows.length) > 0 && (
          <Act onClick={onAll} testId={`app.right.${id}.all`}>
            {panel.all}
          </Act>
        )}
      </div>
      {/* the scope's words, a line of their own under the head: on its line they ran under 'all ›'
          with a long agent name (his bug, main m_26417); a long name ends in '…'; folded, it goes */}
      {!shut && scope !== null && (
        <div className="app-rb-scope" {...tipAttrs(scope.tip)} data-testid={`app.right.${id}.scope`}>
          {scope.words}
        </div>
      )}
      {/* a scoped head at 0 rows: one text-3 line ('perf made nothing yet', designer m_25031) */}
      {!shut && rows.length === 0 && scope !== null && (
        <div className="app-rb-rows">
          <div className="app-rb-row app-rb-more app-rb-none" {...tipAttrs(scope.empty)} data-testid={`app.right.${id}.none`}>
            {scope.empty}
          </div>
        </div>
      )}
      {!shut && rows.length > 0 && office}
      {!shut && rows.length > 0 && (
        <div className="app-rb-rows">
          {shown.map(children)}
          {/* 'show 50 more · N left' opens the next 50, not all (his m_26894, designer m_27020); past the
              cap 'show less' joins it at the right of the same row: back to the cap, the head in view */}
          {(more !== '' || less) && (
            <div className="app-rb-pager">
              {more !== '' && (
                <Press
                  look="app-rb-row app-rb-more"
                  onClick={() => {
                    setPages(pages + 1);
                  }}
                  data-testid={`app.right.${id}.more`}
                >
                  {more}
                </Press>
              )}
              {less && (
                <Press
                  look="app-rb-row app-rb-more app-rb-less"
                  onClick={() => {
                    setPages(0);
                    requestAnimationFrame(() => {
                      head.current?.scrollIntoView({ block: 'nearest' });
                    });
                  }}
                  data-testid={`app.right.${id}.less`}
                >
                  {panel.show_less}
                </Press>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/** An artifact row's chip: art-chips' look, 8 px sides. */
const CHIP = { className: 'b-artchip app-rb-chip', pad: 16 };
/** His home folder (the preload's), for the tip's '~'. */
const HOME = (globalThis as { bise?: { home?: string } }).bise?.home;

/** Where a worktree's mark, an orphan PR or a head opens: its agent's review, else its branch. */
type OpenPr = (r: BarRow) => void;

/**
 * A row's last column (desktop-agents-bar §3): its worktree's mark, tinted; a head's carries its
 * PR's number ('↑ #418'). Hover: the ds tip, its words and where its click goes; a click opens
 * the PR in the review screen (an orphan's: its branch), not the row.
 */
function MarkCell({ r, onOpenPr, head = false }: { r: BarRow; onOpenPr: OpenPr; head?: boolean }) {
  const m = r.mark;
  if (m === undefined) return <span className="app-rb-mark" />;
  return (
    <span
      className={`app-rb-mark ${m.tone}${head ? ' head' : ''}`}
      data-testid={`${r.testId}.mark`}
      data-tone={m.tone}
      aria-label={m.tip}
      {...tipAttrs(markTip(m, r.kind === 'orphan', HOME))}
      onClick={(e) => {
        e.stopPropagation();
        onOpenPr(r);
      }}
    >
      {head && m.pr !== undefined ? `${m.g} #${String(m.pr)}` : m.g}
    </span>
  );
}

function Row({ r, onOpen, on, onOpenPr }: { r: BarRow; onOpen: () => void; on?: boolean; onOpenPr?: OpenPr }) {
  const openPr = onOpenPr ?? (() => undefined);
  // an agent's row, an orphan PR, a worktree's head: the TUI's columns (desktop-agents-bar §2-§4)
  if (r.kind !== undefined) {
    const head = r.kind === 'group';
    return (
      <Press
        look={`app-rb-row app-rb-arow${head ? ' app-rb-ghead' : ''}${r.kind === 'orphan' ? ' app-rb-orphan' : ''}`}
        aria-current={on === true || undefined}
        aria-label={r.title}
        onClick={onOpen}
        data-testid={r.testId}
        data-group={r.group}
        data-slide-row
      >
        {/* each mark says itself in the ds tip (tipwords.ts); the row has none, its words are there */}
        <span className={`app-rb-g ${r.tone}`} {...tipAttrs(head ? r.title : r.tips?.glyph)} data-testid={`${r.testId}.sign`}>
          {r.working === true ? (
            <Dot state="wk" tip={r.tips?.glyph} />
          ) : r.glyph === '✓' && r.agent !== undefined ? (
            // it just finished: the kiss, ':*' lifts and fades into its '✓' (desktop-delight touch 1)
            <DoneSign project={r.project} agent={r.agent} glyph={r.glyph} testId={`${r.testId}.kiss`} />
          ) : (
            r.glyph
          )}
        </span>
        <span className="app-rb-name">{r.name}</span>
        {r.cu !== undefined && (
          <span className={`app-cu ${r.cu.tone}`} {...tipAttrs(r.cu.title)} data-testid={`${r.testId}.computer`}>
            {r.cu.g}
          </span>
        )}
        {/* the now line takes all that is left up to the filled columns, cut first, after a whole word;
            the row's hover slides it to show the rest (ds Slide, his ask m_26200) */}
        <Slide className="app-rb-role" text={r.sub} testId={`${r.testId}.role`} />
        {!head && (
          // time 40 px, the ring 12 px (with its % from 70 %: 40 px on every row then), right-aligned;
          // short on room the % wraps away first, then the time
          <span className="app-rb-cols">
            <span className="app-rb-cols-0" />
            <span className="app-rb-time" {...tipAttrs(r.tips?.time)} data-testid={`${r.testId}.time`}>
              {r.time ?? ''}
            </span>
            {/* its context: the composer's ring (his m_26205), its words in the tip; from 70 % the number too */}
            <span className="app-rb-pct" {...tipAttrs(r.tips?.pct)} data-testid={`${r.testId}.pct`} data-loud={r.pct !== undefined && r.pct !== '' ? true : undefined}>
              {r.pct ?? ''}
              {r.ctx !== undefined && <Ring pct={r.ctx} testId={`${r.testId}.ring`} />}
            </span>
          </span>
        )}
        <MarkCell r={r} onOpenPr={openPr} head={head} />
      </Press>
    );
  }
  // the other sections: the row's whole words in the tip (a cut title, an alarm's who and when), its marks their own
  return (
    <Press look="app-rb-row" aria-current={on === true || undefined} {...tipAttrs(r.title)} onClick={onOpen} data-testid={r.testId}>
      {r.id !== undefined ? (
        // an artifact: its kind's glyph and title in the pink chip (desktop-agents-bar §5, art-chips'
        // .b-artchip), cut after a whole word with '…'; hover on the row lifts its tint to 16 %
        <FitWords className="app-rb-chipbox" text={`${r.glyph} ${r.name}`} testId={`${r.testId}.chip`} chip={CHIP} />
      ) : (
        <>
          <span className={`app-rb-g ${r.tone}`} {...tipAttrs(r.tips?.glyph)}>
            {r.glyph}
          </span>
          <span className="app-rb-name">{r.name}</span>
        </>
      )}
      {r.leaves === true && (
        <span className="app-rb-out" {...tipAttrs(panel.opens_in_browser)} data-testid={`${r.testId}.leaves`}>
          {LEAVES}
        </span>
      )}
      {r.sub !== '' && (r.fit === true ? <FitWords className="app-rb-sub" text={r.sub} testId={`${r.testId}.sub`} /> : <span className="app-rb-sub">{r.sub}</span>)}
      {/* a new artifact: the signed 'new' chip (designer m_20132: 1 px line, r 9, ink, t-11) */}
      {r.end === panel.new_chip && r.id !== undefined ? (
        <span className="app-rb-end">
          <span className="app-rb-new" {...tipAttrs(r.tips?.end)} data-testid={`${r.testId}.new`}>
            {panel.new_chip}
          </span>
        </span>
      ) : (
        <span className={`app-rb-end ${r.endTone}`} {...tipAttrs(r.tips?.end)} data-testid={`${r.testId}.end`}>
          {r.end}
        </span>
      )}
    </Press>
  );
}

/**
 * An alarm's detail, under its row (agent-waiting-states A): the hover's words one a line ('bise
 * wakes main if the nightly gate goes red', 'set yesterday 08:07', 'stops watching at 08:07'), its
 * agent's name opens it, and 'stop watching' (HubCmd wake_stop: the same as sb wake --stop).
 */
function WatchDetail({ r, onStop, onAgent }: { r: BarRow; onStop: () => void; onAgent: () => void }) {
  const [head = '', ...rest] = r.title.split(' · ');
  return (
    <div className="app-rb-detail" data-testid={`${r.testId}.detail`}>
      <div className="app-rb-detail-words">
        <span>{head}</span>
        {rest.map((x) => (
          <span key={x}>{x}</span>
        ))}
      </div>
      <div className="app-rb-detail-acts">
        <Act onClick={onAgent} testId={`${r.testId}.open`}>
          {common.open_agent({ agent: r.name })}
        </Act>
        <Act onClick={onStop} testId={`${r.testId}.stop`}>
          {common.stop_watching}
        </Act>
      </div>
    </div>
  );
}

/** Each agent's next wake (its scheduled tasks' soonest run), '<project>/<agent>' -> ms. Pure. */
export function wakesOf(tasks: readonly { project: string; t: { agent: string; next_ms?: number | null } }[]): Map<string, number> {
  const soonest = new Map<string, number>();
  for (const x of tasks) {
    if (x.t.next_ms == null) continue;
    const k = `${x.project}/${x.t.agent}`;
    const was = soonest.get(k);
    if (was === undefined || x.t.next_ms < was) soonest.set(k, x.t.next_ms);
  }
  return soonest;
}

/**
 * The tip under an agent's row: the demo tour's (L25: 'start' under the first demo agent, 'steer'
 * under the one that waits for him), else the first agent's one-time hint (S36). They lived under
 * the sidebar's agent rows; the agents are here now.
 */
function useAgentTip(project: string, rows: readonly BarRow[], route: ReturnType<typeof useRoute>): (agent: string) => ReactNode {
  const tour = useTour(project);
  const liveDemo = tour.snap.members.filter((m) => !m.archived);
  const tipAt = tour.tip === 'start' ? liveDemo[0]?.name : tour.tip === 'steer' ? liveDemo.at(-1)?.name : undefined;
  const first = rows.find((r) => r.agent !== undefined)?.agent;
  const hint = useHint('first_agent', first !== undefined && tour.tip === null);
  const inAgent = route.screen === 'thread' && route.project === project && route.agent !== MAIN;
  useEffect(() => {
    if (inAgent) hintUsed('first_agent');
  }, [inAgent]);
  return (agent) => {
    if (tipAt === agent && tour.tip !== null)
      return (
        <div className="app-tip">
          <Tip tip={tour.tip} snap={tour.snap} />
        </div>
      );
    if (hint && first === agent)
      return (
        <div className="app-tip">
          <Hint name="first_agent" />
        </div>
      );
    return null;
  };
}

export function RightBar({ project, name, over, column }: { project: string; name: string; over?: boolean; column?: number }) {
  const router = useRouter();
  // a browser-only artifact (a PR, a link) opens his browser, the bar stays (leave.ts)
  const goArtifact = useGoArtifact();
  const route = useRoute();
  // ⌥ held alone for HINT_HOLD_MS: the agents' rows show ⌥1-⌥9 (designer: '⌥ tenu'; held.ts)
  const alt = useModHeld('Alt');
  const all = project === '';
  // back from an artifact (‹, esc, ✕): the bar as he left it, its scroll too (designer's desktop-history)
  useKeptScroll(`rb:${project}`, () => document.querySelector<HTMLElement>('[data-testid="app.panel"] .app-rb-body'));
  const agents = useBarAgents(project);
  // a live row's pause under a minute ends on seconds: the second clock while one does
  const now = useNowFor((t) => agents.some((x) => !x.a.archived && pauseInSeconds(x.a, t)));
  const artifacts = useAllArtifacts(all ? undefined : project);
  // where '+ add' and a drop on ARTIFACTS put a file: this project's main, bise's home on bise's own
  const addHere = useAddPlace(project);
  const tasks = useAllScheduled(all ? undefined : project);
  const places = usePlaces(project);
  const cards = useCards(project);
  const growth = useGrowth(project);
  const computer = useComputerLive();
  const wakes = useMemo(() => wakesOf(tasks), [tasks]);
  // the TUI's ⌥ numbers: the rows' order and ⌥N (a project's only; bise's thread keeps start order)
  const numbers = all ? undefined : numbersOf(project, agents.map((x) => x.a));
  const live = agentRows(agents, now, all, alt, { wakes, places, cards, computer, ...(numbers === undefined ? {} : { numbers }) });
  // a mark, an orphan PR, a head: the PR in the review screen (its agent's), an orphan its branch
  const openPr: OpenPr = (r) => {
    if (r.kind === 'orphan' && r.branch !== undefined) router.go({ screen: 'branch', project: r.project, branch: r.branch });
    else if (r.agent !== undefined) router.go({ screen: 'review', project: r.project, agent: r.agent });
  };
  const tipOf = useAgentTip(project, live, route);
  const archived = archivedRows(agents, now, all);
  // ARTIFACTS and SCHEDULED & WATCHING follow the thread in view: a sub-agent's, only its own (barscope.ts)
  const scope = barScope(route, project);
  // whose list ARTIFACTS and SCHEDULED show: the pages he opened past a cap are kept per scope
  const inView = scope.level === 'agent' ? `${project}/${scope.agent}` : project;
  const allMade = artifactRows(artifacts, now);
  const allLater = [...scheduledRows(tasks, now), ...watchRows(agents, now, all)];
  const made = scope.level === 'agent' ? artifactRows(artifacts.filter((it) => inScope(scope, it.a.agent)), now) : allMade;
  const later =
    scope.level === 'agent'
      ? [...scheduledRows(tasks.filter((x) => inScope(scope, x.t.agent)), now), ...watchRows(agents.filter((x) => inScope(scope, x.a.name)), now, all)]
      : allLater;
  const store = useStore();
  // the alarm whose detail is open (one at a time; a click on its row again closes it)
  const [watchOpen, setWatchOpen] = useState<string | null>(null);
  const working = agents.filter((x) => !x.a.archived && !x.a.main && x.a.status === 'working').length;
  const waits = live.some((r) => r.waits);
  const agentCount = live.filter((r) => r.kind === undefined || r.kind === 'agent').length;
  const openAgent = (p: string, agent: string) => {
    router.go({ screen: 'thread', project: p, agent });
  };
  const here = (p: string, agent: string) => route.screen === 'thread' && route.project === p && route.agent === agent;
  // the office above the AGENTS rows (les bims): a project's bar only, bise's thread keeps the list in v1
  const bims = useBimsView();
  const office = !all && bims.view === 'bims';
  const officeAgents = useMemo(() => agents.filter((x) => !x.a.archived).map((x) => x.a), [agents]);
  return (
    // ⌥ held: every agent row shows its context ring (and its %), else only the hovered one (app.css)
    <aside
      className={over === true ? 'app-panel app-rb over' : 'app-panel app-rb'}
      data-testid="app.panel"
      data-held={alt ? 'alt' : undefined}
      data-wide={showsWide(bims, project) ? wideMode(over === true, column) : undefined}
      aria-label={panel.bar_label({ name })}
    >
      <div className="app-rb-top" data-testid="app.right.top">
        <b>{name}</b>
        {working > 0 && <span className="app-rb-dim">{panel.count_working({ n: working })}</span>}
        <kbd className="app-rb-key">⌥⌘0</kbd>
      </div>
      <div className="app-rb-body">
        <Section
          id="agents"
          title={panel.bar_agents}
          rows={live}
          count={agentCount}
          cap={8}
          pageScope={project}
          summary={live.length === 0 ? '' : panel.count_working({ n: working })}
          noFold={waits}
          onAll={() => {
            router.go(all ? { screen: 'bise' } : { screen: 'agents', project });
          }}
          act={all ? undefined : <BimsSwitch view={bims} />}
          office={
            office ? (
              <Office
                project={project}
                agents={officeAgents}
                cards={cards}
                places={places}
                growth={growth}
                parts={bimsParts}
                onOpen={(agent) => {
                  openAgent(project, agent);
                }}
              />
            ) : undefined
          }
        >
          {(r) =>
            r.kind === 'group' || r.kind === 'orphan' ? (
              <Row
                key={r.key}
                r={r}
                on={r.feature !== undefined && route.screen === 'feature' && route.project === r.project && route.name === r.feature}
                onOpenPr={openPr}
                onOpen={() => {
                  if (r.feature !== undefined) router.go({ screen: 'feature', project: r.project, name: r.feature });
                  else openPr(r);
                }}
              />
            ) : (
              <Fragment key={r.key}>
                <Row r={r} on={here(r.project, r.agent ?? '')} onOpenPr={openPr} onOpen={() => { openAgent(r.project, r.agent ?? ''); }} />
                {tipOf(r.agent ?? '')}
              </Fragment>
            )
          }
        </Section>
        <Section
          id="archived"
          title={panel.bar_archived}
          rows={archived}
          cap={5}
          pageScope={project}
          summary={archived[0] === undefined ? '' : `${archived[0].glyph} ${archived[0].name}`}
          onAll={() => {
            if (!all) router.go({ screen: 'agents', project, archived: true });
          }}
        >
          {(r) => <Row key={r.key} r={r} onOpen={() => { openAgent(r.project, r.agent ?? ''); }} />}
        </Section>
        {/* a drop on the section adds a file there, '+ add' in its head (designer's office-artifacts pick 4) */}
        <AddDrop place={addHere} testId="app.right.artifacts.drop">
          <Section
            id="artifacts"
            title={panel.bar_artifacts}
            rows={made}
            full={allMade.length}
            scope={scopeWords(scope, 'artifacts', name)}
            cap={5}
            pageScope={inView}
            summary={made.some((r) => r.end === panel.new_chip) ? panel.count_new({ n: made.filter((r) => r.end === panel.new_chip).length }) : ''}
            onAll={() => {
              router.go({ screen: 'artifacts', project });
            }}
            act={<AddButton place={addHere} testId="app.right.artifacts.add" />}
          >
            {(r) => <Row key={r.key} r={r} onOpen={() => { goArtifact(r.project, r.id ?? ''); }} />}
          </Section>
        </AddDrop>
        <Section
          id="scheduled"
          title={panel.bar_scheduled}
          rows={later}
          full={allLater.length}
          scope={scopeWords(scope, 'scheduled', name)}
          cap={5}
            pageScope={inView}
          summary={later[0] === undefined ? '' : `${later[0].glyph} ${later[0].end}`}
          onAll={() => {
            router.go({ screen: 'scheduled' });
          }}
        >
          {(r) =>
            r.watch !== undefined ? (
              <Fragment key={r.key}>
                <Row
                  r={r}
                  on={watchOpen === r.key}
                  onOpen={() => {
                    setWatchOpen((k) => (k === r.key ? null : r.key));
                  }}
                />
                {watchOpen === r.key && (
                  <WatchDetail
                    r={r}
                    onStop={() => {
                      store.command({ cmd: 'wake_stop', project: r.project, id: r.watch } as never);
                      setWatchOpen(null);
                    }}
                    onAgent={() => {
                      openAgent(r.project, r.agent ?? '');
                    }}
                  />
                )}
              </Fragment>
            ) : (
              <Row
                key={r.key}
                r={r}
                onOpen={() => {
                  if (r.agent !== undefined) openAgent(r.project, r.agent);
                  else router.go({ screen: 'scheduled' });
                }}
              />
            )
          }
        </Section>
      </div>
    </aside>
  );
}
