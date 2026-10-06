// The window's routes: which screen shows, for which project and agent.
// Owner: amb-win. Pure: no React, no store, no Electron; the router
// (router.ts) holds the current one and the shell (App.tsx) draws it.
//
// A route has a string form, the one deep links, the core's `open` and the
// test ids use (`route:<string>`), kept from the old window so his links
// and amb-tools' scenarios carry over:
//   bise                       bise's own thread (the home project's main)
//   project/<p>                a project's main thread
//   agent/<p>/<a>              one agent's thread
//   agents/<p>                 a project's agents list
//   changes/<p>                a project's changes (branches, merged today)
//   review/<p>/<a>             an agent's change, to review and merge
//   commit/<p>/<sha>           one commit already on main, read-only
//   artifacts/<p>[/<id>]       a project's artifacts (one opened)
//   environments/<p>           its worktrees and dev servers
//   inbox | settings[/<page>] | onboarding    amb-home's screens
//   lab/<composer|spotlight|pearl>             amb-web's labs, test mode only
// Anything else parses to `notfound` with the string kept, never to bise:
// a wrong link says so.

export type Route =
  | { screen: 'bise' }
  | { screen: 'thread'; project: string; agent: string }
  | { screen: 'agents'; project: string }
  | { screen: 'changes'; project: string }
  | { screen: 'review'; project: string; agent: string }
  | { screen: 'commit'; project: string; sha: string }
  | { screen: 'artifacts'; project: string; id?: string }
  | { screen: 'environments'; project: string }
  | { screen: 'inbox' }
  | { screen: 'settings'; page?: string }
  | { screen: 'onboarding' }
  | { screen: 'lab'; lab: Lab }
  | { screen: 'notfound'; path: string };

/** amb-web's test-only labs (qa-type m_9587): drawn in test mode only. */
export const LABS = ['composer', 'spotlight', 'pearl'] as const;
export type Lab = (typeof LABS)[number];
const isLab = (x: string | undefined): x is Lab => LABS.some((l) => l === x);

export type Screen = Route['screen'];

/** The agent every project has: its main. */
export const MAIN = 'main';

const SHA = /^[0-9a-f]{4,40}$/;
// a project id or an agent name: no slash, no space, not empty
const NAME = /^[^/\s]+$/;

/** A route's string form (the inverse of `parseRoute`). */
export function formatRoute(r: Route): string {
  switch (r.screen) {
    case 'bise':
    case 'inbox':
    case 'onboarding':
      return r.screen;
    case 'thread':
      return r.agent === MAIN ? `project/${r.project}` : `agent/${r.project}/${r.agent}`;
    case 'agents':
    case 'changes':
    case 'environments':
      return `${r.screen}/${r.project}`;
    case 'review':
      return `review/${r.project}/${r.agent}`;
    case 'commit':
      return `commit/${r.project}/${r.sha}`;
    case 'artifacts':
      return r.id === undefined ? `artifacts/${r.project}` : `artifacts/${r.project}/${r.id}`;
    case 'settings':
      return r.page === undefined ? 'settings' : `settings/${r.page}`;
    case 'lab':
      return `lab/${r.lab}`;
    case 'notfound':
      return r.path;
  }
}

/** A route from its string form; an unknown or malformed one is `notfound`. */
export function parseRoute(path: string): Route {
  const parts = path.trim().replace(/^\/+|\/+$/g, '').split('/');
  const head = parts[0] ?? '';
  const args = parts.slice(1);
  const nf: Route = { screen: 'notfound', path };
  // the arguments, if there are exactly `n` and each is a name
  const take = (n: number): string[] | undefined => (args.length === n && args.every((x) => NAME.test(x)) ? args : undefined);
  const one = take(1)?.[0];
  const [a, b] = take(2) ?? [];
  switch (head) {
    case 'bise':
    case 'inbox':
    case 'onboarding':
      return args.length === 0 ? { screen: head } : nf;
    case 'project':
      return one !== undefined ? { screen: 'thread', project: one, agent: MAIN } : nf;
    case 'agent':
      return a !== undefined && b !== undefined ? { screen: 'thread', project: a, agent: b } : nf;
    case 'agents':
    case 'changes':
    case 'environments':
      return one !== undefined ? { screen: head, project: one } : nf;
    case 'review':
      return a !== undefined && b !== undefined ? { screen: 'review', project: a, agent: b } : nf;
    case 'commit':
      return a !== undefined && b !== undefined && SHA.test(b) ? { screen: 'commit', project: a, sha: b } : nf;
    case 'artifacts':
      if (one !== undefined) return { screen: 'artifacts', project: one };
      return a !== undefined && b !== undefined ? { screen: 'artifacts', project: a, id: b } : nf;
    case 'settings':
      if (args.length === 0) return { screen: 'settings' };
      return one !== undefined ? { screen: 'settings', page: one } : nf;
    case 'lab':
      return isLab(one) ? { screen: 'lab', lab: one } : nf;
    default:
      return nf;
  }
}

/** The project a route is about (none: bise's, the inbox, settings...). */
export function projectOf(r: Route): string | undefined {
  return 'project' in r ? r.project : undefined;
}

/** What the core's `open` asks for (a capsule's or a card's ⏎), as a route. */
export function routeOfOpen(o: { project: string; what: 'thread' | 'review' | 'artifact' | 'worktree'; agent?: string | null; id?: string | null }): Route {
  const agent = o.agent ?? MAIN;
  switch (o.what) {
    case 'thread':
      return { screen: 'thread', project: o.project, agent };
    case 'review':
      return { screen: 'review', project: o.project, agent };
    case 'artifact':
      return o.id == null ? { screen: 'artifacts', project: o.project } : { screen: 'artifacts', project: o.project, id: o.id };
    case 'worktree':
      return { screen: 'environments', project: o.project };
  }
}

/** Two routes show the same thing. */
export function sameRoute(a: Route, b: Route): boolean {
  return formatRoute(a) === formatRoute(b);
}

/**
 * The start route of a test run ("show me desktop <route>", a check that
 * opens a screen directly): `#route=<route string>` in the page's hash
 * (amb-mac's main sets it from BISE_DESKTOP_ROUTE in test mode). None
 * without it; a wrong one is notfound, as a link.
 */
export function startRouteOf(hash: string): Route | undefined {
  const m = /^#?route=(.*)$/.exec(hash);
  if (m === null) return undefined;
  let path = m[1] ?? '';
  try {
    path = decodeURIComponent(path);
  } catch {
    // a broken escape: the raw words, which parse to notfound
  }
  return parseRoute(path);
}
