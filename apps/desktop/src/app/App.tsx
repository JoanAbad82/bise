// The app's shell: the window's layout (sidebar + the screen) and the
// routing between screens. Owner: amb-win; other chunks ask to add their
// screen here (one line in <ScreenOf>).
//
// The rule that keeps typing smooth (the reset's bug 1): the shell
// re-renders only when the route changes. Every list below reads the store
// through its own per-key hooks, so an event re-renders the rows it
// touches, never the shell, the sidebar or the composer.
import { useEffect, useState, type ReactNode } from 'react';
import { createRouter, RouterContext, useRoute, useRouter } from './router';
import { formatRoute, startRouteOf, type Route } from './route';
import { useMainRoutes, useMenuRouting } from './menu';
import { ComposerLab, PearlLab, SpotlightLab } from '@/composer/Lab';
import { ThreadScreen } from '@/thread/ThreadScreen';
import { useProjects } from '@/store';
import { InboxScreen } from '@/inbox';
import { SettingsScreen } from '@/settings';
import { OnboardingScreen, useFirstLaunch } from '@/setup';
import { AgentsScreen } from '@/agents/AgentsScreen';
import { ChangesScreen } from '@/review/ChangesScreen';
import { ReviewScreen } from '@/review/ReviewScreen';
import { Skel } from '@/ds';
import { Main, Win } from '@/ds';
import { Sidebar } from './Sidebar';
import { CoreLine } from './CoreLine';
import '@/ds/index.css';
import './app.css';

export function App() {
  const [router] = useState(() => createRouter(firstRoute()));
  return (
    <RouterContext value={router}>
      <Shell />
    </RouterContext>
  );
}

/** bise's thread, or in test mode the run's start route (`#route=…`, amb-tools m_9577). */
function firstRoute(): Route {
  return (testMode() ? startRouteOf(window.location.hash) : undefined) ?? { screen: 'bise' };
}

/** The app runs under the test harness (the preload's flag; false outside Electron). */
function testMode(): boolean {
  return (window as Partial<Window>).bise?.test === true;
}

function Shell() {
  useHistoryKeys();
  const router = useRouter();
  useMenuRouting(router);
  useMainRoutes(router);
  // a home not onboarded opens on the onboarding once (amb-home c44c926d)
  useFirstLaunch();
  return (
    <div className="app-shell" data-testid="app.root">
      <Win side={<Sidebar />} main={<Current />} />
    </div>
  );
}

function Current() {
  const route = useRoute();
  // a screen remounts when its route changes: no state of one thread
  // leaks into the next (the old window showed shop's thread under bise)
  return (
    <Main testId="app.main">
      <CoreLine />
      <ScreenOf key={formatRoute(route)} route={route} />
    </Main>
  );
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
    case 'commit':
      return <Known project={route.project}>{() => <ReviewScreen project={route.project} agent="main" commit={route.sha} />}</Known>;
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
