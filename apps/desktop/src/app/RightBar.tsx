// The Overview tab's sections (bise fait mac, page native-mac mockup 1; designer's desktop-right-bar
// v5 before): what happens in the place shown, as the terminal's panel: foldable sections in his
// order, Agents (the hub's rank, ⌥N = the TUI's), Archived (folded until he opens it), Artifacts,
// Scheduled (an alarm: agent-waiting-states A), Processes. It lives in the tabbed panel's Overview
// tab (app/panel/Overview.tsx); the office moved to its own tab (app/panel/Office.tsx), the world
// floats on the right side. On bise's thread the same sections cover every
// project, the project's name in place of the role. A click opens the agent full in the centre (his
// pick), an artifact its view, a task the scheduled screen; 'all ›' the full list in the centre.
// ARTIFACTS and SCHEDULED & WATCHING follow the thread in view (barscope.ts): a sub-agent's shows
// only its own, its name on a line under the head ('for perf'). A head's parts never meet: the
// label gives way ('…') under '+ add' and 'all ›' (app/bar-heads). A long section opens 50 rows
// at a time past its cap ('show 50 more · N left', then 'show less' beside it), kept per
// section and per scope (his m_26894, barrows.ts pageRows).
// Owner: nm-panel (bise fait mac; amb-win before). The rows' words are pure (barrows.ts).
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppIcon, Button, Dot, IconButton, KindIcon, MoreButton, Press, Ring, Slide, iconKindOf, tipAttrs, type AppIconName, type DotState } from '@/ds';
import { markTip } from './tipwords';
import { common } from '@/proto/words_common.gen';
import { panel } from '@/proto/words_panel.gen';
import { useAllArtifacts } from '@/artifacts';
import { leaves } from '@/artifacts/leave';
import { AddDrop, useAddPlace } from '@/artifacts/Drops';
import { useModHeld } from './held';
import { useAllScheduled } from '@/scheduled';
import { barProcs, isRunning, keyOf, stateOf, urlWords, useAllProcesses } from '@/running';
import { running } from '@/proto/words_running.gen';
import { useCards, useComputerLive, usePlaces, useProjects, useStore, type Store } from '@/store';
import { numbersOf } from '@/agents/model';
import { Tip } from '@/setup';
import { useTour } from '@/setup/useTour';
import { Hint, hintUsed, useHint } from './hints';
import { MAIN } from './route';
import { useNowFor } from './clock';
import { pauseInSeconds } from '@/thread/wake';
import { keep, useKeptScroll } from './keep';
import { useRoute, useRouter } from './router';
import { useBarAgents } from './baragents';
import { agentRows, agentsMore, archivedRows, artifactRows, pageRows, procRoots, procRows, scheduledRows, watchRows, type BarRow, type MoreWords } from './barrows';
import { barScope, inScope, scopeCountTip, scopeWords, type ScopeWords } from './barscope';
import { FitWords } from './FitWords';
import { useMenuOf } from './panel/menu';
import { openTab } from './panel/tabs';
import { DoneSign } from './Marks';

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

type SectionId = 'agents' | 'running' | 'archived' | 'artifacts' | 'scheduled';

function Section({
  id,
  title,
  rows,
  cap,
  summary,
  noFold = false,
  count,
  items = [],
  scope = null,
  pageScope,
  full,
  onAll,
  act,
  say,
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
  /** the rows of its full list, when it shows a part ('Show all' stays while the full list has some) */
  full?: number;
  onAll: () => void;
  /** a control in the head before its '…' (Artifacts' '+') */
  act?: ReactNode;
  /** more items of its '…' before 'Show all' (Artifacts' 'Add a file…') */
  items?: readonly { readonly id: string; readonly label: string; readonly run: () => void }[];
  /** the section's own 'show N more' words (AGENTS': agentsMore) */
  say?: (folded: readonly BarRow[], next: number) => MoreWords;
  children: (r: BarRow) => ReactNode;
}) {
  const [folded, toggle] = useFolded(id, id === 'archived');
  const [kept, setPages] = usePages(`frame.rb.more.${id}.${pageScope}`);
  const head = useRef<HTMLDivElement>(null);
  const shut = folded && !noFold;
  const { shown, pages, more, words, less } = pageRows(rows, cap, kept, say);
  const n = count ?? rows.length;
  // the head's '…': the section's own acts, then its full list (the 'all ›' link it replaces)
  const menu = useMenuOf([...items, ...((full ?? rows.length) > 0 ? [{ id: 'all', label: panel.ov_show_all, run: onAll }] : [])]);
  // a head that folds is a row: pointer, the rows' hover tint, a chevron ('▾' on hover while open,
  // '▸' always while folded); one that can't fold looks like a plain title (designer m_21633)
  return (
    <section className="app-rb-sec" data-testid={`app.right.${id}`} data-folded={shut || undefined}>
      <div className="app-rb-head" ref={head} data-folds={!noFold || undefined}>
        <Press look="app-rb-title" aria-expanded={!shut} onClick={noFold ? undefined : toggle} data-testid={`app.right.${id}.head`}>
          {/* folded, the scope line goes with the rows: the count's tip says the scope (designer m_26425) */}
          <span className="app-rb-label" {...tipAttrs(shut && scope !== null && (id === 'artifacts' || id === 'scheduled') ? scopeCountTip(id, n, scope) : panel.ov_label_tip({ label: title, n }))}>
            {title}
          </span>
          {shut && summary !== '' && (
            <span className="app-rb-sum" data-testid={`app.right.${id}.summary`}>
              {summary}
            </span>
          )}
        </Press>
        {act}
        {/* its '…' (the text links went to a menu, page native-mac §3 #5); nothing to list at 0: none */}
        {menu !== null && <MoreButton menu={menu} testId={`app.right.${id}.more-acts`} />}
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
                  {...tipAttrs(words?.tip)}
                >
                  {words === undefined
                    ? more
                    : words.parts.map((x, i) => (
                        <span key={i} className={`app-rb-more-${x.tone}`}>
                          {x.text}
                        </span>
                      ))}
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

/**
 * An agent's sign in the row's 14 icon slot (page native-mac §6, sidebar §3: a dot, never a glyph):
 * at work the breath, asking the accent dot, failed the error dot, done the ok one, the rest an
 * empty one; its words stay in the tip. Pure.
 */
export function agentDot(g: string, working: boolean): DotState {
  if (working) return 'wk';
  if (g === '?') return 'nd';
  if (g === '✗') return 'er';
  if (g === '✓') return 'ok';
  return 'off';
}

/** An archived agent's end in the icon slot: done, failed, stopped. Pure. */
export function archivedIcon(g: string): AppIconName {
  return g === '✓' ? 'check' : g === '✗' ? 'close' : 'stop';
}
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
      role="button"
      data-testid={`${r.testId}.mark`}
      data-tone={m.tone}
      aria-label={m.tip}
      {...tipAttrs(markTip(m, r.kind === 'orphan', HOME))}
      onClick={(e) => {
        e.stopPropagation();
        onOpenPr(r);
      }}
    >
      {head && m.pr !== undefined ? `#${String(m.pr)}` : m.g}
    </span>
  );
}

function Row({ r, onOpen, on, onOpenPr, onEnd, icon }: {
  r: BarRow;
  /** the row's 14 icon (a section's line icon, an artifact's kind); none: the agent's dot */
  icon?: ReactNode;
  onOpen: () => void;
  /** a click on its end alone (RUNNING's port): its own act */
  onEnd?: (() => void) | undefined;
  on?: boolean;
  onOpenPr?: OpenPr;
}) {
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
        <span className={`app-rb-ic ${r.tone}`} {...tipAttrs(head ? r.title : r.tips?.glyph)} data-testid={`${r.testId}.sign`}>
          {head ? (
            <AppIcon name="branch" size={14} />
          ) : r.glyph.startsWith('⌥') ? (
            // ⌥ held: the agent's number, the key he can press (held.ts)
            <span className="app-rb-key">{r.glyph}</span>
          ) : r.glyph === '✓' && r.agent !== undefined ? (
            // it just finished: the kiss, ':*' lifts and fades into its dot (desktop-delight touch 1)
            <>
              <DoneSign project={r.project} agent={r.agent} glyph="" testId={`${r.testId}.kiss`} />
              <Dot state="ok" tip={r.tips?.glyph} />
            </>
          ) : (
            <Dot state={agentDot(r.glyph, r.working === true)} tip={r.tips?.glyph} />
          )}
        </span>
        <span className={r.mono === true ? 'app-rb-name mono' : 'app-rb-name'}>{r.name}</span>
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
        // an artifact: its kind's icon and title in the pink chip (page native-mac §4: the artifact's
        // chip everywhere), cut with '…'; hover on the row lifts its tint
        <>
          <span className="app-rb-ic" />
          <span className="b-artchip app-rb-chip" data-testid={`${r.testId}.chip`}>
            {icon}
            <span className="app-rb-chip-t">{r.name}</span>
          </span>
        </>
      ) : (
        <>
          <span className={`app-rb-ic ${r.tone}`} {...tipAttrs(r.tips?.glyph)}>
            {icon ?? r.glyph}
          </span>
          {/* a command (PROCESSES): mono, it takes the room its row leaves (designer m_38897) */}
          <span className={r.mono === true ? 'app-rb-name mono' : 'app-rb-name'}>{r.name}</span>
        </>
      )}
      {r.leaves === true && (
        <span className="app-rb-out" {...tipAttrs(panel.opens_in_browser)} data-testid={`${r.testId}.leaves`}>
          <AppIcon name="open" size={14} />
        </span>
      )}
      {r.sub !== '' && r.mono === true ? (
        // a command's where: it goes whole before the command cuts (designer m_38942), never 'app…'
        <span className="app-rb-where">
          <span className="app-rb-cols-0" />
          <span className="app-rb-sub" data-testid={`${r.testId}.sub`}>
            {r.sub}
          </span>
        </span>
      ) : r.sub !== '' && (r.fit === true ? <FitWords className="app-rb-sub" text={r.sub} testId={`${r.testId}.sub`} /> : <span className="app-rb-sub">{r.sub}</span>)}
      {/* a new artifact: the signed 'new' chip (designer m_20132: 1 px line, r 9, ink, t-11) */}
      {r.end === panel.new_chip && r.id !== undefined ? (
        <span className="app-rb-end">
          <span className="app-rb-new" {...tipAttrs(r.tips?.end)} data-testid={`${r.testId}.new`}>
            {panel.new_chip}
          </span>
        </span>
      ) : onEnd !== undefined && r.end !== '' ? (
        // RUNNING's port: a plain link with the open icon (never underlined, no '↗' glyph: ui-review
        // m_42619), it opens the address, never the row (designer's running-procs)
        <span
          className={`app-rb-end app-rb-link ${r.endTone}`}
          role="link"
          data-testid={`${r.testId}.end`}
          onClick={(e) => {
            e.stopPropagation();
            onEnd();
          }}
        >
          {r.end.replace(/ ↗$/, '')}
          {r.end.endsWith(' ↗') && <AppIcon name="open" size={14} />}
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
        {/* ds buttons, never text links (native-mac §6: the Overview has no underlined words) */}
        <Button kind="ghost" size="sm" onClick={onAgent} testId={`${r.testId}.open`}>
          {common.open_agent({ agent: r.name })}
        </Button>
        <Button kind="ghost" size="sm" onClick={onStop} testId={`${r.testId}.stop`}>
          {common.stop_watching}
        </Button>
      </div>
    </div>
  );
}

/** Where a file he adds goes: the project's main, bise's home on bise's own (Drops.tsx useAddPlace). */
type AddPlace = NonNullable<ReturnType<typeof useAddPlace>>;

/** Files he picks, into the project's artifacts (the same store intent as a drop, artifacts/Drops.tsx). */
function addFiles(store: Store, place: AddPlace): void {
  const pick = (window as Partial<Window>).bise?.pickFiles;
  if (pick === undefined) return;
  void pick().then((paths) => {
    for (const p of paths) store.addArtifact(place.project, place.agent, p);
  });
}

/** Artifacts' '+' (28, its tip the menu's words): his files into the project's artifacts. */
function AddFile({ place }: { place: AddPlace | null }) {
  const store = useStore();
  if (place === null) return null;
  return (
    <IconButton label={panel.ov_add_file} size="bar" onClick={() => { addFiles(store, place); }} testId="app.right.artifacts.add">
      <AppIcon name="plus" size={16} />
    </IconButton>
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
  // the first task's row, never main's (first in AGENTS too)
  const first = rows.find((r) => r.agent !== undefined && r.main !== true)?.agent;
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

/** An artifact row's click: a browser-only one in his browser, else in a panel tab; the route stays. */
function useArtifactTab(): (project: string, id: string) => void {
  const store = useStore();
  return (project, id) => {
    const a = store.artifacts(project).find((x) => x.id === id);
    const out = (window as Partial<Window>).bise?.openExternal;
    if (a !== undefined && leaves(a) && out !== undefined) void out(a.url);
    else openTab({ kind: 'artifact', project, id });
  };
}

export function RightBar({ project, name }: { project: string; name: string }) {
  const router = useRouter();
  // a browser-only artifact (a PR, a link) opens his browser, the bar stays (leave.ts); any other
  // opens in a tab, the route kept: the bar still names the thread beside (ui-review m_42619 #1)
  const goArtifact = useArtifactTab();
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
  // RUNNING: the project's processes, asked once here; its hub sends them again when a count changes
  const procItems = useAllProcesses(all ? undefined : project);
  const askStore = useStore();
  useEffect(() => {
    if (!all) askStore.command({ cmd: 'processes', project });
  }, [askStore, all, project]);
  const places = usePlaces(project);
  const cards = useCards(project);
  const computer = useComputerLive();
  const wakes = useMemo(() => wakesOf(tasks), [tasks]);
  // the hub's rank as ⌥ numbers, held while ⌥ is (agents/model numbersOf): the rows' order and ⌥N (a project's only; bise's thread keeps start order)
  const numbers = all ? undefined : numbersOf(project, agents.map((x) => x.a), alt);
  // bise's home: on bise's thread, its main is AGENTS' first row
  const home = useProjects().find((p) => p.home)?.project;
  const live = agentRows(agents, now, all, alt, { wakes, places, cards, computer, ...(numbers === undefined ? {} : { numbers }), ...(home === undefined ? {} : { home }) });
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
  // PROCESSES follows the bar's scope: an agent's thread, what it started; a project's main, the
  // project's; bise's thread, every project's (designer m_38642); its 'all ›' keeps that scope
  const runningAgent = scope.level === 'agent' ? scope.agent : null;
  const projects = useProjects();
  const roots = useMemo(() => procRoots(projects, agents), [projects, agents]);
  const runs = procRows(all ? procItems.filter((x) => isRunning(x.p)) : barProcs(procItems, project, runningAgent), all ? 'all' : runningAgent !== null ? 'agent' : 'project', roots);
  const procScope = all ? undefined : runningAgent === null ? { project } : { project, agent: runningAgent };
  const store = useStore();
  // the alarm whose detail is open (one at a time; a click on its row again closes it)
  const [watchOpen, setWatchOpen] = useState<string | null>(null);
  const working = agents.filter((x) => !x.a.archived && !x.a.main && x.a.status === 'working').length;
  const waits = live.some((r) => r.waits);
  // 'AGENTS · N' counts the tasks: main's row is not one of them
  const agentCount = live.filter((r) => (r.kind === undefined || r.kind === 'agent') && r.main !== true).length;
  const openAgent = (p: string, agent: string) => {
    router.go({ screen: 'thread', project: p, agent });
  };
  const here = (p: string, agent: string) => route.screen === 'thread' && route.project === p && route.agent === agent;
  // main's row: on bise's thread, bise's own view (the row in view there)
  const openRow = (r: BarRow) => {
    if (all && r.main === true) router.go({ screen: 'bise' });
    else openAgent(r.project, r.agent ?? '');
  };
  const rowHere = (r: BarRow) => (all && r.main === true ? route.screen === 'bise' : here(r.project, r.agent ?? ''));
  return (
    // ⌥ held: every agent row shows its context ring (and its %), else only the hovered one (app.css)
    <section
      className="app-rb"
      data-testid="app.right"
      data-held={alt ? 'alt' : undefined}
      aria-label={panel.bar_label({ name: name === '' ? panel.tab_overview : name })}
    >
      <div className="app-rb-body">
        <Section
          id="agents"
          title={panel.bar_agents}
          rows={live}
          count={agentCount}
          // 8 rows, main's among them: a 9th overflows the bar at 1000 px tall (bar-overflow)
          cap={8}
          say={agentsMore}
          pageScope={project}
          summary={live.length === 0 ? '' : panel.count_working({ n: working })}
          noFold={waits}
          onAll={() => {
            router.go(all ? { screen: 'bise' } : { screen: 'agents', project });
          }}
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
                <Row
                  r={r}
                  on={rowHere(r)}
                  onOpenPr={openPr}
                  onOpen={() => { openRow(r); }}
                />
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
          summary={archived[0] === undefined ? '' : archived[0].name}
          onAll={() => {
            if (!all) router.go({ screen: 'agents', project, archived: true });
          }}
        >
          {(r) => <Row key={r.key} r={r} icon={<AppIcon name={archivedIcon(r.glyph)} size={14} />} onOpen={() => { openAgent(r.project, r.agent ?? ''); }} />}
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
            act={<AddFile place={addHere} />}
            items={addHere === null ? [] : [{ id: 'add', label: panel.ov_add_file, run: () => { addFiles(store, addHere); } }]}
          >
            {(r) => {
              const a = artifacts.find((x) => x.project === r.project && x.a.id === r.id)?.a;
              return <Row key={r.key} r={r} icon={a === undefined ? null : <KindIcon kind={iconKindOf(a)} size={14} />} onOpen={() => { goArtifact(r.project, r.id ?? ''); }} />;
            }}
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
                  icon={<AppIcon name="scheduled" size={14} />}
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
                icon={<AppIcon name="scheduled" size={14} />}
                onOpen={() => {
                  if (r.agent !== undefined) openAgent(r.project, r.agent);
                  else router.go({ screen: 'scheduled' });
                }}
              />
            )
          }
        </Section>
        {/* PROCESSES: what the scope left running, last, under ARTIFACTS and SCHEDULED & WATCHING
            (Gabriel, procs-bar): a row opens its output on the processes screen, a web page's
            address its browser tab (a port that isn't one is plain); nothing at 0 */}
        {runs.length > 0 && (
          <Section
            id="running"
            title={running.bar}
            rows={runs}
            cap={5}
            pageScope={inView}
            scope={runningAgent === null ? null : { words: running.by({ agent: runningAgent }), tip: running.by({ agent: runningAgent }), empty: '' }}
            summary={runs[0] === undefined ? '' : runs[0].name}
            onAll={() => {
              router.go(procScope === undefined ? { screen: 'running' } : { screen: 'running', scope: procScope });
            }}
          >
            {(r) => {
              const x = procItems.find((y) => `p:${keyOf(y)}` === r.key);
              const u = x === undefined ? null : urlWords(x.p, stateOf(x.p));
              return (
                <Row
                  key={r.key}
                  r={r}
                  icon={<AppIcon name="terminal" size={14} />}
                  onOpen={() => {
                    if (x !== undefined) router.go({ screen: 'running', open: { project: x.project, agent: x.p.agent, id: x.p.id } });
                  }}
                  onEnd={
                    u === null
                      ? undefined
                      : () => {
                          void (window as Partial<Window>).bise?.openExternal(u.url);
                        }
                  }
                />
              );
            }}
          </Section>
        )}
      </div>
    </section>
  );
}
