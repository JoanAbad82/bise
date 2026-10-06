// The app's shell: the window's layout (sidebar + the screen) and the
// routing between screens. Owner: amb-win; other chunks ask to add their
// screen here (one line in <ScreenOf>).
//
// The rule that keeps typing smooth (the reset's bug 1): the shell
// re-renders only when the route changes. Every list below reads the store
// through its own per-key hooks, so an event re-renders the rows it
// touches, never the shell, the sidebar or the composer.
import { useEffect, useState } from 'react';
import { createRouter, RouterContext, useRoute, useRouter } from './router';
import { formatRoute, startRouteOf, type Route } from './route';
import { useMenuRouting } from './menu';
import { Main, Row, Side, Win } from '@/ds';
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
  const test = (window as Partial<Window>).bise?.test === true;
  return (test ? startRouteOf(window.location.hash) : undefined) ?? { screen: 'bise' };
}

function Shell() {
  useHistoryKeys();
  useMenuRouting(useRouter());
  return (
    <div className="app-shell" data-testid="app.root">
      <Win side={<Sidebar />} main={<Current />} />
    </div>
  );
}

/** The sidebar: bise, then his projects and their agents (the rows come from the store's projects next). */
function Sidebar() {
  const router = useRouter();
  const route = useRoute();
  return (
    <Side testId="app.sidebar">
      <Row
        kind="me"
        name="bise"
        sub="every project"
        on={route.screen === 'bise'}
        onClick={() => {
          router.go({ screen: 'bise' });
        }}
        testId="app.sidebar.bise"
      />
    </Side>
  );
}

function Current() {
  const route = useRoute();
  // a screen remounts when its route changes: no state of one thread
  // leaks into the next (the old window showed shop's thread under bise)
  return (
    <Main testId="app.main">
      <ScreenOf key={formatRoute(route)} route={route} />
    </Main>
  );
}

function ScreenOf({ route }: { route: Route }) {
  switch (route.screen) {
    case 'notfound':
      return <NotFound path={route.path} />;
    default:
      return <NotYet route={route} />;
  }
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
