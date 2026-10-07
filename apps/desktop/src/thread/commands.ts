// The composer's / list in the window (bar 2.1, his bug 1, amb-core's C/A/B
// 40f14a12): the TUI's commands in its order, from the core (useCommands),
// each ready or greyed 'not yet', never a silent gap. How one runs:
// - runs 'window': it opens its screen here (the window owns readiness:
//   ready when the screen exists);
// - runs 'hub': his line as he typed it, HubCmd slash (the TUI's router and
//   handlers run it in the hub; architect m_11011).
// Owner: amb-win. Pure.
import type { ArgKind, PickCommand } from '@/composer';
import type { HubCmd, PickArg, PickCommand as CoreCommand } from '@/proto';
import { MAIN, type Route } from '@/app/route';

/** The window's own commands the TUI has no row for, after the core's. */
export const windowCommands: readonly PickCommand[] = [
  { name: 'agents', desc: 'the agents of this project', args: false, ready: true },
  { name: 'archived', desc: 'its archived agents', args: false, ready: true },
  { name: 'switch', desc: 'go to an agent', args: true, argKinds: ['agent'], ready: true },
  { name: 'diff', desc: "an agent's changes, or the project's", args: true, argKinds: ['agent'], ready: true },
  { name: 'prs', desc: 'its open pull requests', args: false, ready: true },
  { name: 'artifacts', desc: 'what its agents made', args: false, ready: true },
  { name: 'scheduled', desc: 'its timers', args: false, ready: false },
];

/** What a window command does here: a screen, or the key list over the window. */
export type WindowRun = { readonly go: Route } | { readonly help: true };

const at0 = (args: string): string => args.trim().split(/\s+/)[0] ?? '';

/** The screen a window command opens here; none: not one of the window's (or no screen yet). */
export function windowRun(name: string, args: string, at: { project: string; agent: string }): WindowRun | undefined {
  const arg = at0(args);
  const go = (r: Route): WindowRun => ({ go: r });
  switch (name.replace(/^\//, '')) {
    case 'agents':
    case 'archived':
      return go({ screen: 'agents', project: at.project });
    case 'switch':
      return go(arg === '' ? { screen: 'agents', project: at.project } : { screen: 'thread', project: at.project, agent: arg });
    case 'diff': {
      const who = arg === '' ? at.agent : arg;
      return go(who === MAIN ? { screen: 'changes', project: at.project } : { screen: 'review', project: at.project, agent: who });
    }
    case 'prs':
      return go({ screen: 'prs', project: at.project });
    // a window command with words of its own (/artifacts add <url>, /plugins enable <x>) is the hub's
    case 'artifacts':
      return arg === '' ? go({ screen: 'artifacts', project: at.project }) : undefined;
    case 'inbox':
      return go({ screen: 'inbox' });
    case 'help':
    case 'shortcuts':
      return { help: true };
    case 'voice':
      return go({ screen: 'settings', page: 'voice' });
    case 'models':
    case 'provider':
      return go({ screen: 'settings', page: 'models' });
    case 'theme':
      return go({ screen: 'settings', page: 'general' });
    case 'setup':
      return go({ screen: 'settings', page: 'setup' });
    case 'plugins':
      return arg === '' ? go({ screen: 'settings', page: 'plugins' }) : undefined;
    case 'computer-use':
      return go({ screen: 'settings', page: 'computer' });
    case 'welcome':
      return go({ screen: 'onboarding' });
    default:
      return undefined;
  }
}

/** The route a window command opens (the screens only). */
export function runWindowCommand(name: string, args: string, at: { project: string; agent: string }): Route | undefined {
  const r = windowRun(name, args, at);
  return r !== undefined && 'go' in r ? r.go : undefined;
}

/** A window command has its screen here (the key list counts). */
const hasScreen = (name: string): boolean => windowRun(name, '', { project: '', agent: MAIN }) !== undefined;

function argKind(a: PickArg): ArgKind {
  switch (a.kind) {
    case 'words':
      return { words: a.words };
    case 'note':
      return 'text';
    default:
      return a.kind;
  }
}

/**
 * The composer's / list: the core's commands in the TUI's order, ready when
 * the window can run them, then the window's own the TUI has no row for.
 * Before the core answers, the window's own alone.
 */
export function pickCommands(core: readonly CoreCommand[]): PickCommand[] {
  if (core.length === 0) return [...windowCommands];
  const rows = core.map(
    (c): PickCommand => ({
      name: c.name,
      desc: c.desc,
      args: c.args.length > 0,
      ...(c.args.length > 0 ? { argKinds: c.args.map(argKind) } : {}),
      // the hub runs every typed line of its own (slash); a window one needs its screen here
      ready: c.runs === 'window' ? hasScreen(c.name) : true,
    }),
  );
  const known = new Set(core.map((c) => c.name.replace(/^\//, '')));
  return [...rows, ...windowCommands.filter((w) => !known.has(w.name))];
}

/**
 * A line he typed that isn't one of the window's screens goes to the hub as
 * he typed it (architect m_11011, amb-feed's HubCmd slash cd021d67): the
 * TUI's router parses it and runs the TUI's handler; no parser here. The
 * typed HubCmds (new, rename, model...) stay for buttons, pickers and forms.
 */
export function slashOf(name: string, args: string, at: { project: string; agent: string }): Extract<HubCmd, { cmd: 'slash' }> {
  const word = name.startsWith('/') ? name : `/${name}`;
  const line = args.trim() === '' ? word : `${word} ${args.trim()}`;
  return { cmd: 'slash', project: at.project, agent: at.agent, line };
}
