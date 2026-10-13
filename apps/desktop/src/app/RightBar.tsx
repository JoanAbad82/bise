// The right bar (designer's desktop-right-bar v5, ambient-lead m_20085/m_20087): what happens in the
// place shown, as the terminal's panel: four foldable sections in his order, AGENTS (start order,
// ⌥N = the TUI's), ARCHIVED, ARTIFACTS, SCHEDULED & WAITING. 320 px, it takes panel A's slots
// (docked from 1000 px, sliding over under it, ⌥⌘0). On bise's thread the same sections cover every
// project, the project's name in place of the role. A click opens the agent full in the centre (his
// pick), an artifact its view, a task the scheduled screen; 'all ›' the full list in the centre.
// Owner: amb-win. The rows' words are pure (barrows.ts).
import { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Act, Dot, Press } from '@/ds';
import type { Agent } from '@/proto';
import { useAllArtifacts } from '@/artifacts';
import { useAllScheduled } from '@/scheduled';
import { useComputerLive, useFeatures, useStore, type Store } from '@/store';
import { Tip } from '@/setup';
import { useTour } from '@/setup/useTour';
import { Hint, hintUsed, useHint } from './hints';
import { MAIN } from './route';
import { useNow } from './clock';
import { keep, useKeptScroll } from './keep';
import { useRoute, useRouter } from './router';
import { agentRows, archivedRows, artifactRows, capRows, scheduledRows, waitingRows, type BarRow, type ProjAgent } from './barrows';

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

/** ⌥ held: the agents' rows show ⌥1-⌥9 (designer: '⌥ tenu'). */
function useAltHeld(): boolean {
  const [held, setHeld] = useState(false);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      setHeld(e.altKey && !e.metaKey && !e.ctrlKey);
    };
    const off = () => {
      setHeld(false);
    };
    window.addEventListener('keydown', on);
    window.addEventListener('keyup', on);
    window.addEventListener('blur', off);
    return () => {
      window.removeEventListener('keydown', on);
      window.removeEventListener('keyup', on);
      window.removeEventListener('blur', off);
    };
  }, []);
  return held;
}

/** A section folded or not, kept per window (designer: 'L'état replié est gardé par fenêtre'). */
function useFolded(key: string): readonly [boolean, () => void] {
  const [v, set] = useState<boolean>(() => keep.view(`frame.rb.${key}`) === true);
  return [
    v,
    () => {
      keep.setView(`frame.rb.${key}`, !v);
      set(!v);
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
  onAll,
  children,
}: {
  id: SectionId;
  title: string;
  rows: readonly BarRow[];
  cap: number;
  summary: string;
  noFold?: boolean;
  onAll: () => void;
  children: (r: BarRow) => ReactNode;
}) {
  const [folded, toggle] = useFolded(id);
  const [more, setMore] = useState(false);
  const head = useRef<HTMLDivElement>(null);
  const shut = folded && !noFold;
  const { shown, hidden } = capRows(rows, more ? Number.POSITIVE_INFINITY : cap);
  const capped = capRows(rows, cap).hidden > 0;
  // a head that folds is a row: pointer, the rows' hover tint, a chevron ('▾' on hover while open,
  // '▸' always while folded); one that can't fold looks like a plain title (designer m_21633)
  return (
    <section className="app-rb-sec" data-testid={`app.right.${id}`} data-folded={shut || undefined}>
      <div className="app-rb-head" ref={head} data-folds={!noFold || undefined}>
        <Press look="app-rb-title" aria-expanded={!shut} onClick={noFold ? undefined : toggle} data-testid={`app.right.${id}.head`}>
          <span className="app-rb-label">
            {title} · {String(rows.length)}
          </span>
          {shut && summary !== '' && (
            <span className="app-rb-sum" data-testid={`app.right.${id}.summary`}>
              {summary}
            </span>
          )}
        </Press>
        {/* nothing to open at 0: the head stays, 'all ›' goes (designer m_20272 (4)) */}
        {rows.length > 0 && (
          <Act onClick={onAll} testId={`app.right.${id}.all`}>
            all ›
          </Act>
        )}
      </div>
      {!shut && rows.length > 0 && (
        <div className="app-rb-rows">
          {shown.map(children)}
          {hidden > 0 && (
            <Press
              look="app-rb-row app-rb-more"
              onClick={() => {
                setMore(true);
              }}
              data-testid={`app.right.${id}.more`}
            >
              + {String(hidden)} more
            </Press>
          )}
          {/* opened: 'show less' in the very row '+ N more' used, back to the cap, the head in view */}
          {more && capped && (
            <Press
              look="app-rb-row app-rb-more"
              onClick={() => {
                setMore(false);
                requestAnimationFrame(() => {
                  head.current?.scrollIntoView({ block: 'nearest' });
                });
              }}
              data-testid={`app.right.${id}.less`}
            >
              show less
            </Press>
          )}
        </div>
      )}
    </section>
  );
}

function Row({ r, onOpen, on }: { r: BarRow; onOpen: () => void; on?: boolean }) {
  return (
    <Press look="app-rb-row" aria-current={on === true || undefined} title={r.title} onClick={onOpen} data-testid={r.testId}>
      {/* at work: the DS's breeze '∿' (it pulses on the open row, murmurs on the others, still with reduced motion) */}
      <span className={`app-rb-g ${r.tone}`}>{r.working === true ? <Dot state="wk" /> : r.glyph}</span>
      <span className="app-rb-name">{r.name}</span>
      {r.cu !== undefined && (
        <span className={`app-cu ${r.cu.tone}`} title={r.cu.title} data-testid={`${r.testId}.computer`}>
          {r.cu.g}
        </span>
      )}
      {r.gauge !== undefined && (
        <span className="app-gauge" data-testid={`${r.testId}.gauge`}>
          {r.gauge}
        </span>
      )}
      {r.sub !== '' && <span className="app-rb-sub">{r.sub}</span>}
      {/* a new artifact: the signed 'new' chip (designer m_20132: 1 px line, r 9, ink, t-11) */}
      {r.end === 'new' && r.id !== undefined ? (
        <span className="app-rb-end">
          <span className="app-rb-new" data-testid={`${r.testId}.new`}>
            new
          </span>
        </span>
      ) : (
        <span className={`app-rb-end ${r.endTone}`}>{r.end}</span>
      )}
    </Press>
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

export function RightBar({ project, name, over }: { project: string; name: string; over?: boolean }) {
  const router = useRouter();
  const route = useRoute();
  const now = useNow();
  const alt = useAltHeld();
  const all = project === '';
  // back from an artifact (‹, esc, ✕): the bar as he left it, its scroll too (designer's desktop-history)
  useKeptScroll(`rb:${project}`, () => document.querySelector<HTMLElement>('[data-testid="app.panel"] .app-rb-body'));
  const agents = useBarAgents(project);
  const artifacts = useAllArtifacts(all ? undefined : project);
  const tasks = useAllScheduled(all ? undefined : project);
  const features = useFeatures(project);
  const computer = useComputerLive();
  const wakes = useMemo(() => wakesOf(tasks), [tasks]);
  const live = agentRows(agents, now, all, alt, { wakes, features, computer });
  const tipOf = useAgentTip(project, live, route);
  const archived = archivedRows(agents, now, all);
  const made = artifactRows(artifacts, now);
  const later = [...scheduledRows(tasks, now), ...waitingRows(agents, now, all)];
  const working = agents.filter((x) => !x.a.archived && !x.a.main && x.a.status === 'working').length;
  const waits = live.some((r) => r.waits);
  const openAgent = (p: string, agent: string) => {
    router.go({ screen: 'thread', project: p, agent });
  };
  const here = (p: string, agent: string) => route.screen === 'thread' && route.project === p && route.agent === agent;
  return (
    <aside className={over === true ? 'app-panel app-rb over' : 'app-panel app-rb'} data-testid="app.panel" aria-label={`what happens in ${name}`}>
      <div className="app-rb-top" data-testid="app.right.top">
        <b>{name}</b>
        {working > 0 && <span className="app-rb-dim">{String(working)} working</span>}
        <kbd className="app-rb-key">⌥⌘0</kbd>
      </div>
      <div className="app-rb-body">
        <Section
          id="agents"
          title="AGENTS"
          rows={live}
          cap={8}
          summary={live.length === 0 ? '' : `${String(working)} working`}
          noFold={waits}
          onAll={() => {
            router.go(all ? { screen: 'bise' } : { screen: 'agents', project });
          }}
        >
          {(r) =>
            r.feature !== undefined ? (
              <Row
                key={r.key}
                r={r}
                on={route.screen === 'feature' && route.project === r.project && route.name === r.feature}
                onOpen={() => { router.go({ screen: 'feature', project: r.project, name: r.feature ?? '' }); }}
              />
            ) : (
              <Fragment key={r.key}>
                <Row r={r} on={here(r.project, r.agent ?? '')} onOpen={() => { openAgent(r.project, r.agent ?? ''); }} />
                {tipOf(r.agent ?? '')}
              </Fragment>
            )
          }
        </Section>
        <Section
          id="archived"
          title="ARCHIVED"
          rows={archived}
          cap={5}
          summary={archived[0] === undefined ? '' : `${archived[0].glyph} ${archived[0].name}`}
          onAll={() => {
            if (!all) router.go({ screen: 'agents', project, archived: true });
          }}
        >
          {(r) => <Row key={r.key} r={r} onOpen={() => { openAgent(r.project, r.agent ?? ''); }} />}
        </Section>
        <Section
          id="artifacts"
          title="ARTIFACTS"
          rows={made}
          cap={5}
          summary={made.some((r) => r.end === 'new') ? `${String(made.filter((r) => r.end === 'new').length)} new` : ''}
          onAll={() => {
            router.go({ screen: 'artifacts', project });
          }}
        >
          {(r) => <Row key={r.key} r={r} onOpen={() => { router.go({ screen: 'artifacts', project: r.project, id: r.id ?? '' }); }} />}
        </Section>
        <Section
          id="scheduled"
          title="SCHEDULED & WAITING"
          rows={later}
          cap={5}
          summary={later[0] === undefined ? '' : `${later[0].glyph} ${later[0].end}`}
          onAll={() => {
            router.go({ screen: 'scheduled' });
          }}
        >
          {(r) => (
            <Row
              key={r.key}
              r={r}
              onOpen={() => {
                if (r.agent !== undefined) openAgent(r.project, r.agent);
                else router.go({ screen: 'scheduled' });
              }}
            />
          )}
        </Section>
      </div>
    </aside>
  );
}
