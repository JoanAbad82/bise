// The composer's / list in the window (bar 2.1, his bug 1, amb-core's C/A/B
// 40f14a12): the TUI's commands in its order, from the core (useCommands),
// each ready or greyed 'not yet', never a silent gap. How one runs:
// - runs 'window': it opens its screen here (the window owns readiness:
//   ready when the screen exists);
// - runs 'hub' and runnable: the typed HubCmd the TUI's handler takes today
//   (/new /archive /restore /rename /answer /model /reasoning /interrupt
//   /stop), through the same functions as the window's screens; the others
//   wait for the hub to take his typed line (amb-feed's HubCmd slash).
// Owner: amb-win. Pure.
import type { ArgKind, PickCommand } from '@/composer';
import type { HubCmd, PickArg, PickCommand as CoreCommand } from '@/proto';
import { newCmd } from '@/agents/actions';
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
    case 'artifacts':
      return go({ screen: 'artifacts', project: at.project });
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
      return go({ screen: 'settings', page: 'plugins' });
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
      ready: c.runs === 'window' ? hasScreen(c.name) : c.runnable,
    }),
  );
  const known = new Set(core.map((c) => c.name.replace(/^\//, '')));
  return [...rows, ...windowCommands.filter((w) => !known.has(w.name))];
}

/** /new's line as the TUI reads it: `[-w] [name:] objective`. */
function newOf(project: string, args: string): HubCmd | undefined {
  let rest = args.trim();
  let worktree = false;
  if (/^-w(\s|$)/.test(rest)) {
    worktree = true;
    rest = rest.slice(2).trim();
  }
  const m = /^([A-Za-z0-9][\w-]*):\s+(.*)$/s.exec(rest);
  const name = m?.[1];
  const brief = m?.[2] ?? rest;
  return newCmd(project, { brief, ...(name === undefined ? {} : { name }), worktree });
}

/**
 * The typed HubCmd for a runnable hub command line (the TUI's handler runs
 * it); none: not runnable here, or its arguments are missing.
 */
export function hubCmdOf(name: string, args: string, at: { project: string; agent: string }): HubCmd | undefined {
  const words = args.trim() === '' ? [] : args.trim().split(/\s+/);
  const [a, b] = words;
  const rest = (n: number): string => words.slice(n).join(' ');
  const { project, agent } = at;
  switch (name.replace(/^\//, '')) {
    case 'new':
      return newOf(project, args);
    case 'archive':
      return a === undefined ? undefined : { cmd: 'archive', project, agent: a, force: false };
    case 'restore':
      return a === undefined ? undefined : { cmd: 'unarchive', project, agent: a };
    case 'rename':
      return a === undefined || b === undefined ? undefined : { cmd: 'rename', project, agent: a, to: b };
    case 'answer': {
      const card = Number(a);
      return a === undefined || !Number.isInteger(card) || rest(1) === '' ? undefined : { cmd: 'answer', project, card, reply: rest(1) };
    }
    case 'model':
      return a === undefined ? undefined : { cmd: 'model', project, agent, model: a, ...(b === 'default' ? { default: true } : {}) };
    case 'reasoning':
      return a === undefined ? undefined : { cmd: 'effort', project, agent, effort: a };
    case 'interrupt':
      return { cmd: 'stop', project, agent };
    case 'stop':
      return { cmd: 'stop', project, agent: a ?? agent };
    default:
      return undefined;
  }
}
