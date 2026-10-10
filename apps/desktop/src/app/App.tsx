// The app's shell: the window's layout (sidebar + the screen) and the
// routing between screens. Owner: amb-win; other chunks ask to add their
// screen here (one line in <ScreenOf>).
//
// The rule that keeps typing smooth (the reset's bug 1): the shell
// re-renders only when the route changes. Every list below reads the store
// through its own per-key hooks, so an event re-renders the rows it
// touches, never the shell, the sidebar or the composer.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createRouter, RouterContext, useRoute, useRouter } from './router';
import { bottomTarget, formatRoute, inboxAtOf, parseRoute, projectOf, shownOf, startRouteOf, type Route } from './route';
import { BottomBlock } from '@/thread/Bottom';
import { askInbox, useInboxAsks } from './inboxAsk';
import { keep } from './keep';
import { useMainRoutes, useMenuRouting } from './menu';
import { ComposerLab, PearlLab, SpotlightLab } from '@/composer/Lab';
import { ThreadScreen } from '@/thread/ThreadScreen';
import { useProjects, useStore } from '@/store';
import { useFnVoice } from '@/voicemode';
import { ConfirmBar, InboxScreen } from '@/inbox';
import { SettingsScreen } from '@/settings';
import { useSetupFirstOpens } from '@/settings/setup-first';
import { OnboardingScreen, useFirstLaunch } from '@/setup';
import { paletteOpen } from '@/setup/useTour';
import { AgentsScreen } from '@/agents/AgentsScreen';
import { ChangesScreen } from '@/review/ChangesScreen';
import { ReviewScreen } from '@/review/ReviewScreen';
import { FeatureScreen } from '@/review/FeatureScreen';
import { BranchScreen } from '@/review/BranchScreen';
import { PrsScreen } from '@/review/PrsScreen';
import { EnvironmentsScreen } from '@/review/EnvironmentsScreen';
import { Skel } from '@/ds';
import { Main, Win } from '@/ds';
import { Sidebar, useClosedFolders } from './Sidebar';
import { Over, Titlebar, useFrame } from './Frame';
import { Panel } from './Panel';
import { numbersOf } from '@/agents/model';
import { CoreLine } from './CoreLine';
import { HubUpdateLine, UpdateLine } from './UpdateLine';
import { HubMoments } from './HubMoments';
import { ReportScreen } from './ReportScreen';
import { Palette, usePaletteOpen } from './Palette';
import { Help } from '@/help/Help';
import { useTheme } from '@/theme';
import { HELP_EVENT, keyAction, typingIn, type FrameAction } from './keys';
import { emitAction, useMenuAction } from './menu';
import { TerminalPanel } from '@/terminal/Terminal';
import { isToggleKey, shellProject, shellTakes } from '@/terminal/model';
import { panel } from '@/terminal/panel';
import { ArtifactOpen, ArtifactsScreen } from '@/artifacts';
import { ScheduledScreen } from '@/scheduled';
import '@/ds/index.css';
import './app.css';

export function App() {
  const [router] = useState(() => createRouter(firstRoute()));
  // the window reopens where he left it, after a reload, an update swap or the next day (m_11763)
  useEffect(() => {
    const save = () => {
      keep.setView('route', formatRoute(router.get()));
    };
    // the start route counts too (a deeplink, a test's start route): no move may follow
    save();
    return router.subscribe(save);
  }, [router]);
  return (
    <RouterContext value={router}>
      <Shell />
    </RouterContext>
  );
}

/**
 * bise's thread, or in test mode the run's start route (`#route=…`, amb-tools
 * m_9577). The window opened on 'terminal' (View > Terminal with the window
 * closed, amb-mac 339d3e5e) is bise's thread with the panel shown.
 */
function firstRoute(): Route {
  if (TERMINAL.test(window.location.hash)) {
    panel.show();
    return { screen: 'bise' };
  }
  // the window opened by a notification's click ('inbox?card=…') or ⌘I: bise's view, the card
  // open in its inbox block (b1/b2: the inbox is a block, never a screen of its own)
  const m = /^#?route=(.*)$/u.exec(window.location.hash);
  let start = '';
  try {
    start = decodeURIComponent(m?.[1] ?? '');
  } catch {
    // a broken escape: not an inbox ask
  }
  const inbox = inboxAtOf(start);
  // a test run's plain '#route=inbox' still asks for the ⌘I screen itself (its checks)
  if (inbox !== undefined && (inbox.at !== undefined || !testMode())) {
    askInbox(inbox.at);
    return { screen: 'bise' };
  }
  return (testMode() ? startRouteOf(window.location.hash) : undefined) ?? keptRoute() ?? { screen: 'bise' };
}

/** Where he was when the window last closed (keep.ts), unless that was a test lab. */
function keptRoute(): Route | undefined {
  const s = keep.view('route');
  if (typeof s !== 'string' || s === '') return undefined;
  const r = parseRoute(s);
  return r.screen === 'notfound' || r.screen === 'lab' ? undefined : r;
}

const TERMINAL = /^#?route=terminal$/;

/** The app runs under the test harness (the preload's flag; false outside Electron). */
function testMode(): boolean {
  return (window as Partial<Window>).bise?.test === true;
}

/**
 * The working sign '∿' is still while the window is away (ambient m_11472, the TUI's
 * Motion::Still): unfocused or hidden sets <html data-still>, and the DS's css stops its
 * animation. The test harness never focuses its offscreen window, so there only hidden counts.
 */
function useStill(): void {
  useEffect(() => {
    const root = document.documentElement;
    const set = () => {
      const still = document.hidden || (!testMode() && !document.hasFocus());
      if (still) root.dataset.still = '';
      else delete root.dataset.still;
    };
    set();
    window.addEventListener('focus', set);
    window.addEventListener('blur', set);
    document.addEventListener('visibilitychange', set);
    return () => {
      window.removeEventListener('focus', set);
      window.removeEventListener('blur', set);
      document.removeEventListener('visibilitychange', set);
    };
  }, []);
}

function Shell() {
  useHistoryKeys();
  useStill();
  const [palette, setPalette] = usePaletteOpen();
  const [help, setHelp] = useState(false);
  // L25: the demo tour's 'end' goes when he opens the agent list
  useEffect(() => {
    paletteOpen(palette);
  }, [palette]);
  const frame = useFrame();
  const openPalette = useCallback(() => {
    setPalette(true);
  }, [setPalette]);
  useWindowKeys(
    openPalette,
    () => {
      setHelp(true);
    },
    frame.toggle,
  );
  // the composer's /help and /shortcuts open the same key list
  useEffect(() => {
    const open = () => {
      setHelp(true);
    };
    window.addEventListener(HELP_EVENT, open);
    return () => {
      window.removeEventListener(HELP_EVENT, open);
    };
  }, []);
  const router = useRouter();
  const route = useRoute();
  useMenuRouting(router);
  useMainRoutes(router);
  // fn fn with this window in front: voice mode with the thread in view, else bise's own (amb-web's src/voicemode/fn.ts)
  useFnVoice(router, useStore());
  // ⌘I / a notification's card: the inbox block opens it in place once the rows list it
  useInboxAsks();
  // View > Terminal (⌃`): the panel under the screen (the key's own echo is dropped)
  useMenuAction('terminal', () => {
    panel.toggleByMenu(Date.now());
  });
  // a home not onboarded opens on the onboarding once (amb-home c44c926d)
  useFirstLaunch();
  // R8: a /model the core holds for its provider opens that provider's setup (amb-home)
  useSetupFirstOpens();
  // his theme pref on <html data-theme> (amb-web's src/theme)
  useTheme();
  useShown();
  return (
    <div className={`app-shell b-ui w-${frame.width}${frame.side ? '' : ' no-side'}`} data-testid="app.root">
      {/* setup is the window itself, never a window drawn inside it (his try round 3) */}
      {route.screen === 'onboarding' ? (
        <div className="app-setup">
          <div className="app-drag" />
          <OnboardingScreen />
        </div>
      ) : (
        <>
          <Win
            side={frame.side ? <Sidebar onSearch={openPalette} /> : null}
            main={<Current top={<Titlebar frame={frame} />} />}
            aside={frame.panel?.docked === true ? <Panel project={frame.panel.project} name={frame.panel.name} /> : undefined}
          />
          {/* under 1000 px (or hidden by ⌘\) the sidebar slides over; the panel too under 1000 px */}
          {frame.over === 'side' && (
            <Over side="left" onClose={frame.close}>
              <Sidebar onSearch={openPalette} />
            </Over>
          )}
          {frame.over === 'panel' && frame.panel !== undefined && (
            <Over side="right" onClose={frame.close}>
              <Panel project={frame.panel.project} name={frame.panel.name} over />
            </Over>
          )}
        </>
      )}
      {palette && (
        <Palette
          onClose={() => {
            setPalette(false);
          }}
        />
      )}
      {help && (
        <Help
          onClose={() => {
            setHelp(false);
          }}
        />
      )}
    </div>
  );
}

function Current({ top }: { top: ReactNode }) {
  const route = useRoute();
  // a screen remounts when its route changes: no state of one thread
  // leaks into the next (the old window showed shop's thread under bise)
  return (
    <Main testId="app.main">
      {top}
      <CoreLine />
      <UpdateLine />
      <HubUpdateLine />
      <HubMoments />
      <div className="app-screen">
        <ScreenOf key={formatRoute(route)} route={route} />
      </div>
      <RouteConfirm route={route} />
      <RouteBottom route={route} />
      <RouteTerminal route={route} />
    </Main>
  );
}

/**
 * The hub's yes/no question for the project in view (bar I9/C46/S30,
 * amb-home's ConfirmBar): under the screen, wherever he clicked (agents,
 * thread, review…); nothing while no question is open.
 */
function RouteConfirm({ route }: { route: Route }) {
  const project = projectOf(route);
  return project === undefined ? null : <ConfirmBar project={project} />;
}

/**
 * b1: the one inbox + composer block at the bottom of a screen with no composer of its own,
 * writing to whom the route says (bottomTarget); kept across screens of the same target (no
 * route key), so his draft stays when he moves from an agent's review to its changes.
 */
function RouteBottom({ route }: { route: Route }) {
  const home = useProjects().find((p) => p.home)?.project;
  const t = bottomTarget(route, home);
  return t === null ? null : <BottomBlock key={`${t.project}/${t.agent}`} project={t.project} agent={t.agent} />;
}

/** The terminal panel of the project in view (bise's own on bise, the inbox, settings). */
function RouteTerminal({ route }: { route: Route }) {
  const home = useProjects().find((p) => p.home)?.project;
  return <TerminalPanel project={shellProject(projectOf(route), home)} />;
}

function ScreenOf({ route }: { route: Route }) {
  switch (route.screen) {
    case 'notfound':
      return <NotFound path={route.path} />;
    case 'bise':
      return <BiseThread />;
    case 'thread':
      return <ProjectThread project={route.project} agent={route.agent} />;
    case 'agents':
      return <Known project={route.project}>{(name) => <AgentsScreen project={route.project} projectName={name} />}</Known>;
    case 'changes':
      return <Known project={route.project}>{() => <ChangesScreen project={route.project} />}</Known>;
    case 'review':
      return <Known project={route.project}>{() => <ReviewScreen project={route.project} agent={route.agent} />}</Known>;
    case 'prs':
      return <Known project={route.project}>{() => <PrsScreen project={route.project} />}</Known>;
    case 'feature':
      return <Known project={route.project}>{() => <FeatureScreen project={route.project} name={route.name} />}</Known>;
    case 'commit':
      return <Known project={route.project}>{() => <ReviewScreen project={route.project} agent="main" commit={route.sha} />}</Known>;
    case 'branch':
      // a branch's diff by name ('/diff sb/x', amb-web's windowRun)
      return <Known project={route.project}>{() => <BranchScreen project={route.project} branch={route.branch} />}</Known>;
    case 'environments':
      return <Known project={route.project}>{() => <EnvironmentsScreen project={route.project} />}</Known>;
    case 'artifacts':
      // every project's (project ''), one project's, or one artifact open (amb-kit's src/artifacts)
      return route.id === undefined ? <ArtifactsScreen project={route.project} /> : <ArtifactOpen project={route.project} id={route.id} />;
    case 'scheduled':
      // every project's live scheduled tasks (amb-kit's src/scheduled)
      return <ScheduledScreen />;
    case 'report':
      // the last crash report (CoreLine's 'show the report')
      return <ReportScreen />;
    case 'inbox':
      return <InboxScreen />;
    case 'settings':
      return <SettingsScreen page={route.page} />;
    case 'onboarding':
      return <OnboardingScreen />;
    case 'lab':
      if (!testMode()) return <NotFound path={formatRoute(route)} />;
      return route.lab === 'composer' ? <ComposerLab /> : route.lab === 'spotlight' ? <SpotlightLab /> : <PearlLab />;
    default:
      return <NotYet route={route} />;
  }
}

/**
 * The projects this window shows, said to the core on load and on each
 * route change (store.shown sends only a changed set, and says it again to
 * a core that comes back up): bise's own (home) and the route's project.
 * The core holds those hubs, so subscribe, send and answer reach them
 * (qa-flows: without it a send on the real core did nothing, his bug 5).
 */
function useShown() {
  const store = useStore();
  const route = useRoute();
  const rows = useProjects();
  const home = rows.find((p) => p.home)?.project;
  // the sidebar's open folders (open by default, R26) show their agents: their hubs that already
  // run are shown too (never started for this: a stopped hub stays stopped, battery)
  const closed = useClosedFolders();
  const open = rows.filter((p) => !p.home && p.running && !closed.has(p.project)).map((p) => p.project);
  const set = shownOf(home, route, open);
  const key = set.join('\n');
  // said even empty: the core sends the projects rows (bise's home among
  // them) only after a first shown, so waiting for home would wait forever
  useEffect(() => {
    store.shown(key === '' ? [] : key.split('\n'));
  }, [store, key]);
}

/** bise's own thread: the home project's main, once the core said which it is. */
function BiseThread() {
  const home = useProjects().find((p) => p.home);
  if (home === undefined) return <Skel />;
  return <ThreadScreen project={home.project} agent="main" bise />;
}

/** A project's thread: its name from the core's rows; an unknown project says so. */
function ProjectThread({ project, agent }: { project: string; agent: string }) {
  const projects = useProjects();
  const row = projects.find((p) => p.project === project);
  if (row === undefined) return projects.length === 0 ? <Skel /> : <NotFound path={formatRoute({ screen: 'thread', project, agent })} />;
  return <ThreadScreen project={project} agent={agent} bise={row.home && agent === 'main'} projectName={row.name} />;
}

/** A project's screen once the core's rows know it; an unknown project is notfound, never bise. */
function Known({ project, children }: { project: string; children: (name: string) => ReactNode }) {
  const route = useRoute();
  const projects = useProjects();
  const row = projects.find((p) => p.project === project);
  if (row === undefined) return projects.length === 0 ? <Skel /> : <NotFound path={formatRoute(route)} />;
  return <>{children(row.name)}</>;
}

/** A screen not built yet says so, never a blank or a silent gap. */
function NotYet({ route }: { route: Route }) {
  return (
    <section className="app-notyet" data-testid={`app.notyet.${route.screen}`} data-route={formatRoute(route)}>
      <p>not yet</p>
    </section>
  );
}

function NotFound({ path }: { path: string }) {
  return (
    <section className="app-notfound" data-testid="app.notfound" data-route={path}>
      <p>not found</p>
      <p className="app-dim">nothing here at {path}</p>
    </section>
  );
}

/**
 * The window's own keys (app/keys.ts decides): a route goes to the router,
 * ⌘K opens the palette, the rest go to the shown screens. Capture phase, by
 * key code: the composer never types ⌥1's '¡'.
 */
function useWindowKeys(openPalette: () => void, openHelp: () => void, onFrame: (what: FrameAction) => void) {
  const router = useRouter();
  const store = useStore();
  // the frame's toggle reads this render's width and choices: the listener stays, the target moves
  const frameRef = useRef(onFrame);
  useEffect(() => {
    frameRef.current = onFrame;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      // ⌃`: the terminal panel, wherever the focus is (xterm leaves it unhandled)
      if (isToggleKey(e)) {
        e.preventDefault();
        e.stopPropagation();
        panel.toggleByKey(Date.now());
        return;
      }
      if (e.defaultPrevented) return;
      // the shell has the focus: every key but ⌘ ones is its own (⌥1, ctrl+y, End...)
      if (inTerminal(document.activeElement) && shellTakes(e)) return;
      const act = keyAction(e, {
        route: router.get(),
        projects: store.projects(),
        agents: (p) => store.agents(p),
        typing: typingIn(document.activeElement),
        numbers: (p) => numbersOf(p, store.agents(p)),
      });
      if (act === undefined) return;
      e.preventDefault();
      e.stopPropagation();
      if ('go' in act) router.go(act.go);
      else if ('palette' in act) openPalette();
      else if ('help' in act) openHelp();
      else if ('frame' in act) frameRef.current(act.frame);
      else emitAction(act.screen);
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
    };
  }, [router, store, openPalette, openHelp]);
}

function inTerminal(el: Element | null): boolean {
  return el?.closest('[data-testid="terminal.panel"]') != null;
}

/** ⌘[ back, ⌘] forward (the menu items are amb-mac's; the keys work without them). */
function useHistoryKeys() {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return;
      if (e.key === '[') router.back();
      else if (e.key === ']') router.forward();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [router]);
}
