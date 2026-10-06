// The window's own /commands (bar 2.1's 'opens a screen' half, amb-win's
// screens): the composer's / list shows them, and running one opens its
// screen here, as the TUI's command opens its view. The core's commands
// (/new, /archive, /model…) come from amb-home's lists. Owner: amb-win. Pure.
import type { PickCommand } from '@/composer';
import { MAIN, type Route } from '@/app/route';

export const windowCommands: readonly PickCommand[] = [
  { name: 'agents', desc: 'the agents of this project', args: false, ready: true },
  { name: 'archived', desc: 'its archived agents', args: false, ready: true },
  { name: 'switch', desc: 'go to an agent', args: true, argKinds: ['agent'], ready: true },
  { name: 'diff', desc: "an agent's changes, or the project's", args: true, argKinds: ['agent'], ready: true },
  { name: 'artifacts', desc: 'what its agents made', args: false, ready: false },
  { name: 'scheduled', desc: 'its timers', args: false, ready: false },
];

/** The screen a window command opens here; none: not one of the window's. */
export function runWindowCommand(name: string, args: string, at: { project: string; agent: string }): Route | undefined {
  const arg = args.trim().split(/\s+/)[0] ?? '';
  // the composer names a command with its slash ('/agents')
  switch (name.replace(/^\//, '')) {
    case 'agents':
    case 'archived':
      return { screen: 'agents', project: at.project };
    case 'switch':
      return arg === '' ? { screen: 'agents', project: at.project } : { screen: 'thread', project: at.project, agent: arg };
    case 'diff': {
      const who = arg === '' ? at.agent : arg;
      return who === MAIN ? { screen: 'changes', project: at.project } : { screen: 'review', project: at.project, agent: who };
    }
    case 'artifacts':
      return { screen: 'artifacts', project: at.project };
    default:
      return undefined;
  }
}
