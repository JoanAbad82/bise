// A new project's welcome in main's empty thread (page new-project-home, pick A; designer
// m_38070, m_38080): the project's office centred (440 px at most) with the lead at its desk, the
// empty desks dashed and its inbox tray, three pins over them; the legend under it, its 1, 2, 3
// stacked (his note n1: no room for 3 columns on a small screen); then the lead's first message,
// written by the app (no model call), and three ideas that fill the composer (never a send).
// The office can't draw (WebGL lost, renderer failed): B's three pictures instead. Shown while
// rule.ts says so; at his first message it docks into the right bar (dock.ts). Owner: project-home.
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { Press } from '@/ds';
import { reducedMotion } from '@/ds/hooks';
import type { ComposerActions } from '@/composer';
import { thread } from '@/proto/words_thread.gen';
import { composer as composerWords } from '@/proto/words_composer.gen';
import { useAgents, useCards, useGrowth, usePending, usePlaces, usePrefs, useProjects, useStore, useThreadOrder } from '@/store';
import { Office, type OfficeState } from '@/bims/Office';
import { parts as bimsParts } from '@/bims/feed';
import { withGhosts } from '@/bims/ghosts';
import { mapOf, mapPrefKey } from '@/bims/maps/ids';
import { bimsView } from '@/bims/view';
import { getPref, type Prefs } from '@/settings/prefs';
import { LiveBiseMark } from '@/app/Marks';
import { welcomeShows } from './rule';
import { welcoming } from './shown';
import { barTarget, fly } from './dock';
import { Pictures } from './Pictures';
import './welcome.css';

/** the welcome's office: the plan with its empty desks (bims/ghosts.ts) */
const welcomeParts = { ...bimsParts, layoutOf: withGhosts(bimsParts.layoutOf) };

/** the legend's three lines, in the pins' order */
const LEGEND = [
  [thread.welcome_lead_head, thread.welcome_lead_says],
  [thread.welcome_agents_head, thread.welcome_agents_says],
  [thread.welcome_inbox_head, thread.welcome_inbox_says],
] as const;

/** the ideas, put in the composer as the first run's demo is */
export const IDEAS = [thread.welcome_idea_tests, thread.welcome_idea_repo, composerWords.demo] as const;

/** The office's width over its height while it loads (its first frame sets its own). */
const MAP_RATIO = 1.4;

interface WelcomeProps {
  project: string;
  name: string;
  onIdea: (text: string) => void;
  /** the welcome's root and its office's holder, the office's snapshot: the dock reads them */
  rootRef?: RefObject<HTMLDivElement | null>;
  mapRef?: RefObject<HTMLDivElement | null>;
  snapRef?: { current: ((c: HTMLCanvasElement) => void) | null };
  /** its last render, as it docks: the bar's office opens now, under its copy */
  docking?: boolean;
}

export function Welcome({ project, name, onIdea, rootRef, mapRef, snapRef, docking = false }: WelcomeProps) {
  const agents = useAgents(project);
  const live = agents.filter((a) => !a.archived);
  const cards = useCards(project);
  const places = usePlaces(project);
  const growth = useGrowth(project);
  const map = mapOf(getPref(usePrefs() as Prefs | null, mapPrefKey(project)));
  const [state, setState] = useState<OfficeState>('loading');
  // the right bar's office stays closed while this one shows (welcome/shown.ts)
  useEffect(() => (docking ? undefined : welcoming.add(project)), [project, docking]);
  const drawn = state !== 'lost';
  return (
    <div className="welcome" ref={rootRef} data-testid="welcome" data-office={drawn ? state : 'lost'}>
      {drawn ? (
        <div className="welcome-map" ref={mapRef} data-dock="map" aria-label={thread.welcome_office} style={{ aspectRatio: state === 'loading' ? String(MAP_RATIO) : undefined }}>
          <Office
            project={project}
            agents={live}
            cards={cards}
            places={places}
            growth={growth}
            map={map}
            parts={welcomeParts}
            pins
            onState={setState}
            {...(snapRef === undefined ? {} : { snapRef })}
            // a click on the lead: its thread is this one
            onOpen={() => undefined}
          />
        </div>
      ) : (
        <Pictures />
      )}
      <ol className="welcome-legend" data-testid="welcome.legend">
        {LEGEND.map(([head, says], i) => (
          <li key={head} className="welcome-lg">
            <span className="welcome-n">{i + 1}</span>
            <b>{head}</b>
            <span className="welcome-says">{says}</span>
          </li>
        ))}
      </ol>
      <LeadHi name={name} testId="welcome.hi" />
      <div className="welcome-ideas">
        {IDEAS.map((idea, i) => (
          <Press
            key={idea}
            look="welcome-idea"
            // keep the composer's focus and selection: the click must not blur it first
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onClick={() => {
              onIdea(idea);
            }}
            data-testid={`welcome.idea.${String(i)}`}
          >
            {idea}
          </Press>
        ))}
      </div>
    </div>
  );
}

/** The lead's first message: in the welcome, then the thread's first row once he wrote (IntroRow). */
export function LeadHi({ name, testId }: { name: string; testId: string }) {
  return (
    <div className="welcome-hi" data-testid={testId}>
      <div className="welcome-who">
        <LiveBiseMark />
        <b>bise</b>
        <span className="welcome-role">{thread.welcome_role}</span>
      </div>
      <p>{thread.welcome_hi({ project: name })}</p>
    </div>
  );
}

/**
 * The lead's intro as main's first row (designer m_38190 (4)): once he wrote, it stays above his
 * first message; only the office, the legend and the ideas went. Shown where the thread's start is
 * in the window (rule.ts introShows).
 */
export function IntroRow({ project }: { project: string }) {
  const name = useProjects().find((p) => p.project === project)?.name ?? project;
  return (
    <div className="th-row welcome-intro">
      <LeadHi name={name} testId="welcome.intro" />
    </div>
  );
}

/**
 * The welcome in main's thread of a project (not bise's own): while rule.ts says so, and for its
 * dock once his first message leaves (the bar's office turns on, as the cube does).
 */
export function WelcomeSlot({ tkey, project, composer }: { tkey: string; project: string; composer: RefObject<ComposerActions | null> }) {
  const store = useStore();
  const view = useThreadOrder(tkey);
  const pending = usePending(tkey);
  const name = useProjects().find((p) => p.project === project)?.name ?? project;
  const hasYou = view.order.some((pos) => store.entry(tkey, pos)?.kind === 'you');
  const shows = welcomeShows(view, hasYou, pending.length);
  const root = useRef<HTMLDivElement>(null);
  const map = useRef<HTMLDivElement>(null);
  const snap = useRef<((c: HTMLCanvasElement) => void) | null>(null);
  // his first send: one more render with the welcome, so its copy can leave from where it was
  const [was, setWas] = useState(shows);
  const [leaving, setLeaving] = useState(false);
  if (was !== shows) {
    setWas(shows);
    if (was && pending.length > 0) setLeaving(true);
  }
  useLayoutEffect(() => {
    if (!leaving) return;
    const el = root.current;
    if (el !== null) {
      bimsView.setView('bims');
      const ratio = (map.current?.clientWidth ?? 0) / Math.max(1, map.current?.clientHeight ?? 0);
      fly(el, map.current, snap.current, () => barTarget(document, ratio), reducedMotion());
    }
    // its copy flies now: the welcome itself goes at the next frame, the thread takes the centre
    const raf = requestAnimationFrame(() => {
      setLeaving(false);
    });
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [leaving]);
  if (!shows && !leaving) return null;
  const centred = view.order.length === 0;
  return (
    <div className={centred ? 'th-first th-welcome' : 'th-first th-welcome after'} data-testid="thread.first">
      <Welcome
        project={project}
        name={name}
        rootRef={root}
        mapRef={map}
        snapRef={snap}
        docking={leaving}
        onIdea={(text) => {
          composer.current?.fill(text);
        }}
      />
    </div>
  );
}
