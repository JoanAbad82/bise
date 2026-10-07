// The composer's / list in the window and how a command line runs (amb-core's C/A/B 40f14a12).
import { describe, expect, it } from 'vitest';
import type { PickCommand as CoreCommand } from '@/proto';
import { pickCommands, slashOf, windowCommands, windowRun } from './commands';

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
  it("keeps the core's order; a window command is ready when its screen exists, every hub one (its line goes as typed)", () => {
    const rows = pickCommands(core);
    expect(rows.slice(0, core.length).map((r) => r.name)).toEqual(core.map((c) => c.name));
    const ready = Object.fromEntries(rows.map((r) => [r.name, r.ready]));
    expect(ready).toMatchObject({ '/new': true, '/compact': true, '/inbox': true, '/scheduled': false, '/rename': true, '/agents': true, '/quit': false });
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
    expect(windowRun('/plugins', '', at)).toEqual({ go: { screen: 'settings', page: 'plugins' } });
    expect(windowRun('/welcome', '', at)).toEqual({ go: { screen: 'onboarding' } });
    expect(windowRun('/scheduled', '', at), 'no screen yet').toBeUndefined();
    expect(windowRun('/new', 'x', at)).toBeUndefined();
  });
  it("a line he typed that isn't a window screen goes to the hub as typed (architect m_11011), never parsed here", () => {
    const slash = (line: string) => ({ cmd: 'slash', project: P, agent: 'perf', line });
    expect(slashOf('/rename', 'perf p2', at), 'a typed /rename is a slash, not a typed rename').toEqual(slash('/rename perf p2'));
    expect(slashOf('/new', '-w --with-changes x: do it', at), 'C3').toEqual(slash('/new -w --with-changes x: do it'));
    expect(slashOf('/undo', '', at), 'C40').toEqual(slash('/undo'));
    expect(slashOf('/flow', 'pr', at), 'C42').toEqual(slash('/flow pr'));
    expect(slashOf('compact', '', at)).toEqual(slash('/compact'));
  });
  it('a window command with words of its own goes to the hub: /artifacts add <url> (C13), /plugins enable <x>', () => {
    expect(windowRun('/artifacts', '', at)).toEqual({ go: { screen: 'artifacts', project: P } });
    expect(windowRun('/artifacts', 'add https://x.test', at), 'C13: not the screen').toBeUndefined();
    expect(windowRun('/plugins', 'enable x', at)).toBeUndefined();
    expect(slashOf('/artifacts', 'add https://x.test', at)).toEqual({ cmd: 'slash', project: P, agent: 'perf', line: '/artifacts add https://x.test' });
  });
});
