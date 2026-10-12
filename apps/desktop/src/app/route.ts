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
//   agents/<p>                 a project's agents list (its live ones)
//   agents/<p>/archived        its archived agents (/archived)
//   changes/<p>                a project's changes (branches, merged today)
//   review/<p>/<a>             an agent's change, to review and merge
//   log/<p>/<a>                an agent's raw session, read-only (/log, amb-web's src/log)
//   feature/<p>/<name>         a feature: its branch, agents, try / merge / drop
//   prs/<p>                    its open pull requests (the TUI's /prs)
//   commit/<p>/<sha>           one commit already on main, read-only
//   branch/<p>/<branch>        a branch's diff by its name ('/diff sb/x'; the branch keeps its slashes)
//   artifacts/<p>[/<id>]       a project's artifacts (one opened)
//   environments/<p>           its worktrees and dev servers
//   settings[/<page>] | onboarding    amb-home's screens
//   (no 'inbox' screen: one inbox, the block at the bottom of every view; 'inbox' and
//   'inbox?card=<p>/<id>' are asks to open it in place, read by inboxAtOf, never routes)
//   lab/<composer|spotlight|pearl>             amb-web's labs, test mode only
// Anything else parses to `notfound` with the string kept, never to bise:
// a wrong link says so.

export type Route =
  | { screen: 'bise' }
  | { screen: 'thread'; project: string; agent: string }
  /** its live agents (/agents); `archived`: only its archived ones (/archived, as the TUI) */
  | { screen: 'agents'; project: string; archived?: true }
  | { screen: 'changes'; project: string }
  | { screen: 'prs'; project: string }
  | { screen: 'review'; project: string; agent: string }
  /** an agent's raw session log (/log, the TUI's logview.rs) */
  | { screen: 'log'; project: string; agent: string }
  | { screen: 'feature'; project: string; name: string }
  | { screen: 'commit'; project: string; sha: string }
  | { screen: 'branch'; project: string; branch: string }
  | { screen: 'artifacts'; project: string; id?: string }
  | { screen: 'environments'; project: string }
  | { screen: 'scheduled' }
  /** the last crash report, opened in the window (designer's voice-window part 2) */
  | { screen: 'report' }
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
    case 'scheduled':
    case 'report':
    case 'onboarding':
      return r.screen;
    case 'thread':
      return r.agent === MAIN ? `project/${r.project}` : `agent/${r.project}/${r.agent}`;
    case 'agents':
      return r.archived === true ? `agents/${r.project}/archived` : `agents/${r.project}`;
    case 'changes':
    case 'prs':
    case 'environments':
      return `${r.screen}/${r.project}`;
    case 'review':
      return `review/${r.project}/${r.agent}`;
    case 'log':
      return `log/${r.project}/${r.agent}`;
    case 'feature':
      return `feature/${r.project}/${r.name}`;
    case 'commit':
      return `commit/${r.project}/${r.sha}`;
    case 'branch':
      return `branch/${r.project}/${r.branch}`;
    case 'artifacts':
      // project '': every project's (the sidebar's '↗ artifacts', amb-kit)
      if (r.project === '') return 'artifacts';
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
    case 'scheduled':
    case 'report':
    case 'onboarding':
      return args.length === 0 ? { screen: head } : nf;
    case 'project':
      return one !== undefined ? { screen: 'thread', project: one, agent: MAIN } : nf;
    case 'agent':
      return a !== undefined && b !== undefined ? { screen: 'thread', project: a, agent: b } : nf;
    case 'agents':
      if (a !== undefined && b === 'archived') return { screen: 'agents', project: a, archived: true };
      return one !== undefined ? { screen: 'agents', project: one } : nf;
    case 'changes':
    case 'prs':
    case 'environments':
      return one !== undefined ? { screen: head, project: one } : nf;
    case 'review':
    case 'log':
      return a !== undefined && b !== undefined ? { screen: head, project: a, agent: b } : nf;
    case 'feature':
      return a !== undefined && b !== undefined ? { screen: 'feature', project: a, name: b } : nf;
    case 'commit':
      return a !== undefined && b !== undefined && SHA.test(b) ? { screen: 'commit', project: a, sha: b } : nf;
    case 'branch': {
      // everything after the project is the branch, slashes kept ('sb/x')
      const [p, ...rest] = args;
      const branch = rest.join('/');
      return p !== undefined && NAME.test(p) && rest.length > 0 && rest.every((x) => NAME.test(x)) ? { screen: 'branch', project: p, branch } : nf;
    }
    case 'artifacts':
      if (args.length === 0) return { screen: 'artifacts', project: '' };
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

/**
 * b1/b2: a route main sends that asks to open the inbox IN PLACE, never a screen: 'inbox' (⌘I with
 * another window in front) opens its first item, 'inbox?card=<project>/<id>' (a notification's
 * click, amb-mac 97a5939a) that card. Anything else: undefined. Pure.
 */
export function inboxAtOf(path: string): { at?: { project: string; card: number } } | undefined {
  const m = /^\/?inbox(?:\?card=([^/\s]+)\/(\d+))?\/?$/u.exec(path.trim());
  if (m === null) return undefined;
  const [, project, id] = m;
  return project === undefined || id === undefined ? {} : { at: { project: decodeURIComponent(project), card: Number(id) } };
}

/** The project a route is about (none: bise's, the inbox, settings...). */
export function projectOf(r: Route): string | undefined {
  return 'project' in r ? r.project : undefined;
}

/**
 * b1 (his card #476: one inbox and one composer at the bottom of every view, like the terminal):
 * whom the shell's bottom block writes to on a screen with no composer of its own. A thread (and
 * bise's) has its own; the first launch and the labs none. An agent's review writes to that agent;
 * a project's screen (agents, changes, a feature, its artifacts…) to its main; a screen of no
 * project (settings, scheduled, every project's artifacts, not found) to bise's main. Pure.
 */
export function bottomTarget(r: Route, home: string | undefined): { project: string; agent: string } | null {
  switch (r.screen) {
    case 'thread':
    case 'bise':
    case 'onboarding':
    case 'lab':
      return null;
    case 'review':
      return { project: r.project, agent: r.agent };
    default: {
      const p = projectOf(r);
      if (p !== undefined && p !== '') return { project: p, agent: MAIN };
      return home === undefined ? null : { project: home, agent: MAIN };
    }
  }
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
 * Where esc goes up from `r` (designer's desktop-history, the esc list; esc-up.ts asks): an
 * agent opened large → its project's main, a project's main → bise, a list or a tool screen
 * (agents, archived, artifacts, scheduled, settings, changes, /log, the report…) → 'back',
 * the place before (as ‹; with nothing behind, the project's main or bise). bise, the first
 * run and the labs: null, esc does nothing. An open artifact is its view's own esc. Pure.
 */
export function upOf(r: Route): Route | 'back' | null {
  switch (r.screen) {
    case 'thread':
      return r.agent === MAIN ? { screen: 'bise' } : { screen: 'thread', project: r.project, agent: MAIN };
    case 'bise':
    case 'onboarding':
    case 'lab':
      return null;
    default:
      return 'back';
  }
}

/** Where 'back' lands with nothing behind: the route's project's main, else bise. Pure. */
export function homeOf(r: Route): Route {
  const p = projectOf(r);
  return p === undefined || p === '' ? { screen: 'bise' } : { screen: 'thread', project: p, agent: MAIN };
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

/** The shown set: home first, then the route's project, deduped (empty before the first rows). Pure. */
export function shownOf(home: string | undefined, route: Route, open: readonly string[] = []): string[] {
  const out: string[] = [];
  for (const p of [home, projectOf(route), ...open]) if (p !== undefined && !out.includes(p)) out.push(p);
  return out;
}
