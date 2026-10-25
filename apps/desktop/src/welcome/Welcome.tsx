// A new project's welcome in main's empty thread (page new-project-home, pick A; designer
// m_38070, m_38080): the project's office centred (440 px at most) with the lead at its desk, the
// empty desks dashed and its inbox tray, three pins over them; the legend under it, its 1, 2, 3
// stacked (his note n1: no room for 3 columns on a small screen); then the lead's first message,
// written by the app (no model call), and three ideas that fill the composer (never a send).
// The office can't draw (WebGL lost, renderer failed): B's three pictures instead. Shown while
// rule.ts says so; at his first message it docks into the right bar (dock.ts). Since bise fait mac
// the empty home (composer/home, designer's pick (c)) sits on it: the question and the ideas are
// the home's, the office the picture under them, with no call to action of its own. Owner:
// nm-composer (native-lead m_42546).
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { reducedMotion } from '@/ds/hooks';
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
import { officeRoom } from './room';
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

/** the ideas, put in the composer as the first run's demo is (the empty home's, composer/home) */
export const IDEAS = [thread.welcome_idea_tests, thread.welcome_idea_repo, composerWords.demo] as const;

/** The office's width over its height while it loads (its first frame sets its own). */
const MAP_RATIO = 1.4;
/** the office's width at most */
const OFFICE_MAX_W = 440;

interface WelcomeProps {
  project: string;
  name: string;
  /** over the office: the empty home (composer/home), none: the office first */
  head?: ReactNode;
  /** the welcome's root and its office's holder, the office's snapshot: the dock reads them */
  rootRef?: RefObject<HTMLDivElement | null>;
  mapRef?: RefObject<HTMLDivElement | null>;
  snapRef?: { current: ((c: HTMLCanvasElement) => void) | null };
  /** its last render, as it docks: the bar's office opens now, under its copy */
  docking?: boolean;
  /** over an empty thread (the slot's own height), else under main's lines */
  centred?: boolean;
}

export function Welcome({ project, name, head, rootRef, mapRef, snapRef, docking = false, centred = true }: WelcomeProps) {
  const agents = useAgents(project);
  const live = agents.filter((a) => !a.archived);
  const cards = useCards(project);
  const places = usePlaces(project);
  const growth = useGrowth(project);
  const map = mapOf(getPref(usePrefs() as Prefs | null, mapPrefKey(project)));
  const [state, setState] = useState<OfficeState>('loading');
  // the right bar's office stays closed while this one shows (welcome/shown.ts)
  useEffect(() => (docking ? undefined : welcoming.add(project)), [project, docking]);
  const ownRoot = useRef<HTMLDivElement>(null);
  const root = rootRef ?? ownRoot;
  const words = useRef<HTMLDivElement>(null);
  const ownMap = useRef<HTMLDivElement>(null);
  const mapBox = mapRef ?? ownMap;
  const { room, ratio } = useOfficeRoom(root, words, mapBox, centred, state);
  const drawn = state !== 'lost';
  // the office's width: its height is the room left (room.ts), 440 px wide at most
  const width = room === null ? 0 : Math.min(OFFICE_MAX_W, Math.floor(room * ratio));
  return (
    <div className="welcome" ref={root} data-testid="welcome" data-office={drawn ? state : 'lost'} data-room={room === null ? 'none' : undefined}>
      {head}
      {drawn ? (
        room !== null && (
        <div className="welcome-map" ref={mapBox} data-dock="map" aria-label={thread.welcome_office} style={{ maxWidth: `${String(width)}px`, aspectRatio: state === 'loading' ? String(MAP_RATIO) : undefined }}>
          <Office
            project={project}
            agents={live}
            cards={cards}
            places={places}
            growth={growth}
            map={map}
            parts={welcomeParts}
            pins
            transparent
            onState={setState}
            {...(snapRef === undefined ? {} : { snapRef })}
            // a click on the lead: its thread is this one
            onOpen={() => undefined}
          />
        </div>
        )
      ) : (
        <Pictures />
      )}
      <div className="welcome-words" ref={words}>
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
      </div>
    </div>
  );
}

/**
 * The room the welcome's office has (room.ts), measured: the height the welcome may take in its
 * slot (centred: the slot's own, inside its padding; under main's lines: the list's place less its
 * rows), less its words and the gap over them; and the office's own width over its height.
 */
function useOfficeRoom(root: RefObject<HTMLDivElement | null>, words: RefObject<HTMLDivElement | null>, map: RefObject<HTMLDivElement | null>, centred: boolean, state: OfficeState): { room: number | null; ratio: number } {
  const [room, setRoom] = useState<number | null>(null);
  const [ratio, setRatio] = useState(MAP_RATIO);
  useLayoutEffect(() => {
    const el = root.current;
    const slot = el?.parentElement;
    const place = slot?.parentElement;
    const said = words.current;
    if (el == null || slot == null || place == null || said === null) return;
    const list = place.querySelector<HTMLElement>('.th-list');
    const measure = () => {
      const s = getComputedStyle(slot);
      const height = centred
        ? slot.clientHeight - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom)
        : place.clientHeight - (list?.querySelector<HTMLElement>('[data-virtuoso-scroller]')?.scrollHeight ?? list?.scrollHeight ?? 0) - parseFloat(s.marginBottom);
      const next = officeRoom(height, said.offsetHeight, parseFloat(getComputedStyle(el).rowGap) || 0);
      setRoom((was) => (was === next ? was : next));
    };
    measure();
    const seen = new ResizeObserver(measure);
    seen.observe(place);
    seen.observe(said);
    if (list !== null) seen.observe(list);
    return () => {
      seen.disconnect();
    };
  }, [root, words, centred]);
  // the drawn office's shape (the renderer sets its height at its width)
  const shown = room !== null;
  useLayoutEffect(() => {
    const office = map.current?.querySelector<HTMLElement>('.bims-office');
    if (state !== 'on' || !shown || office == null) return;
    const seen = new ResizeObserver(() => {
      if (office.clientHeight === 0) return;
      const r = office.clientWidth / office.clientHeight;
      setRatio((was) => (Math.abs(was - r) < 0.01 ? was : r));
    });
    seen.observe(office);
    return () => {
      seen.disconnect();
    };
  }, [map, state, shown]);
  return { room, ratio };
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
export function WelcomeSlot({ tkey, project, head }: { tkey: string; project: string; head?: ReactNode }) {
  const store = useStore();
  const view = useThreadOrder(tkey);
  const pending = usePending(tkey);
  const name = useProjects().find((p) => p.project === project)?.name ?? project;
  const hasYou = view.order.some((pos) => store.entry(tkey, pos)?.kind === 'you');
  const others = useAgents(project).filter((a) => !a.main && !a.archived).length;
  const shows = welcomeShows(view, hasYou, pending.length, others);
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
  // no welcome (main has agents already): the home alone, in the slot's centre
  if (!shows && !leaving) return head == null ? null : <div className="th-first th-home" data-testid="thread.first">{head}</div>;
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
        centred={centred}
        head={head}
      />
    </div>
  );
}
