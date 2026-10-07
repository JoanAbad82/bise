// The composer's / list in the window and how a command line runs (amb-core's C/A/B 40f14a12).
import { describe, expect, it } from 'vitest';
import type { PickCommand as CoreCommand } from '@/proto';
import { hubCmdOf, pickCommands, windowCommands, windowRun } from './commands';

const P = 'shop-1a2b3c4d';
const at = { project: P, agent: 'perf' };
const core: CoreCommand[] = [
  { name: '/new', desc: 'start an agent', args: [{ kind: 'words', words: [{ value: '-w', desc: 'in its own git worktree' }] }, { kind: 'text' }], runs: 'hub', runnable: true },
  { name: '/compact', desc: 'compact its context', args: [], runs: 'hub', runnable: false },
  { name: '/inbox', desc: 'what waits for you', args: [], runs: 'window', runnable: false },
  { name: '/scheduled', desc: 'its timers', args: [], runs: 'window', runnable: false },
  { name: '/rename', desc: 'rename an agent', args: [{ kind: 'agent' }, { kind: 'note' }], runs: 'hub', runnable: true },
  { name: '/agents', desc: 'the agents', args: [], runs: 'window', runnable: false },
  { name: '/quit', desc: 'quit', args: [], runs: 'window', runnable: false },
];

describe("the / list: the TUI's commands in its order, never a silent gap", () => {
  it("keeps the core's order; a window command is ready when its screen exists, a hub one when it runs typed", () => {
    const rows = pickCommands(core);
    expect(rows.slice(0, core.length).map((r) => r.name)).toEqual(core.map((c) => c.name));
    const ready = Object.fromEntries(rows.map((r) => [r.name, r.ready]));
    expect(ready).toMatchObject({ '/new': true, '/compact': false, '/inbox': true, '/scheduled': false, '/rename': true, '/agents': true, '/quit': false });
  });
  it("maps the arguments the composer completes (a note is free text) and adds the window's own the TUI lacks", () => {
    const rows = pickCommands(core);
    expect(rows.find((r) => r.name === '/rename')).toMatchObject({ args: true, argKinds: ['agent', 'text'] });
    expect(rows.find((r) => r.name === '/new')?.argKinds?.[0]).toEqual({ words: [{ value: '-w', desc: 'in its own git worktree' }] });
    expect(rows.find((r) => r.name === '/inbox')).toMatchObject({ args: false });
    const extra = rows.slice(core.length).map((r) => r.name);
    expect(extra).toContain('prs');
    expect(extra, 'one row per command').not.toContain('agents');
  });
  it("before the core answers: the window's own alone", () => {
    expect(pickCommands([])).toEqual(windowCommands);
  });
});

describe('a command line runs as the TUI runs it', () => {
  it('window commands open their screens, /help the key list', () => {
    expect(windowRun('/inbox', '', at)).toEqual({ go: { screen: 'inbox' } });
    expect(windowRun('/help', '', at)).toEqual({ help: true });
    expect(windowRun('/shortcuts', '', at)).toEqual({ help: true });
    expect(windowRun('/plugins', 'list', at)).toEqual({ go: { screen: 'settings', page: 'plugins' } });
    expect(windowRun('/welcome', '', at)).toEqual({ go: { screen: 'onboarding' } });
    expect(windowRun('/scheduled', '', at), 'no screen yet').toBeUndefined();
    expect(windowRun('/new', 'x', at)).toBeUndefined();
  });
  it('the runnable hub ones become their typed HubCmd, on the agent in view when the TUI says so', () => {
    expect(hubCmdOf('/new', 'fix the cart', at)).toEqual({ cmd: 'new', project: P, brief: 'fix the cart' });
    expect(hubCmdOf('/new', '-w cart: fix the cart total', at)).toEqual({ cmd: 'new', project: P, brief: 'fix the cart total', name: 'cart', worktree: true });
    expect(hubCmdOf('/rename', 'perf p2', at)).toEqual({ cmd: 'rename', project: P, agent: 'perf', to: 'p2' });
    expect(hubCmdOf('/answer', '2 cart page only', at)).toEqual({ cmd: 'answer', project: P, card: 2, reply: 'cart page only' });
    expect(hubCmdOf('/model', 'mistral/mistral-small-latest default', at)).toEqual({ cmd: 'model', project: P, agent: 'perf', model: 'mistral/mistral-small-latest', default: true });
    expect(hubCmdOf('/reasoning', 'high', at)).toEqual({ cmd: 'effort', project: P, agent: 'perf', effort: 'high' });
    expect(hubCmdOf('/archive', 'alerts', at)).toEqual({ cmd: 'archive', project: P, agent: 'alerts', force: false });
    expect(hubCmdOf('/restore', 'alerts', at)).toEqual({ cmd: 'unarchive', project: P, agent: 'alerts' });
    expect(hubCmdOf('/interrupt', '', at)).toEqual({ cmd: 'stop', project: P, agent: 'perf' });
    expect(hubCmdOf('/stop', 'alerts', at)).toEqual({ cmd: 'stop', project: P, agent: 'alerts' });
  });
  it('missing arguments send nothing; a hub command with no typed form sends nothing', () => {
    expect(hubCmdOf('/new', '', at)).toBeUndefined();
    expect(hubCmdOf('/rename', 'perf', at)).toBeUndefined();
    expect(hubCmdOf('/answer', 'two words', at)).toBeUndefined();
    expect(hubCmdOf('/model', '', at)).toBeUndefined();
    expect(hubCmdOf('/compact', '', at)).toBeUndefined();
  });
});
