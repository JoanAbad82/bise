// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { Proc } from '@/proto';
import { stateOf, type ProcItem } from './model';
import type { Sample } from './procview';

// the terminal is xterm's (a canvas): here what it shows when nothing is kept, else while nothing printed
vi.mock('./Output', () => ({
  Output: ({ none, live, quiet, empty, openOnError }: { none: boolean; live: boolean; quiet: ReactNode; empty?: ReactNode; openOnError?: unknown }) => (
    <div data-testid="running.out" data-live={live} data-error={openOnError !== undefined}>{none ? empty : quiet}</div>
  ),
}));
const { ProcView } = await import('./Panel');
afterEach(cleanup);

const NOW = new Date(2026, 9, 27, 14, 6).getTime();
const MIN = 60_000;
const proc = (over: Partial<Proc>): Proc => ({
  id: 'bg3', agent: 'perf', kind: { is: 'bg', n: 3 }, cmd: 'pnpm --filter web dev --port 5173', name: 'dev server', cwd: '/Users/me/acme/.worktrees/perf/web',
  pid: 21304, started_ms: NOW - 4 * MIN, state: { is: 'running' }, out: 'bg', cpu: 12, rss_mb: 412, procs: 3,
  ports: [5173], url: 'http://127.0.0.1:5173', ...over,
});
const samples: Sample[] = Array.from({ length: 20 }, (_, i) => ({ at: NOW - (20 - i) * 2000, cpu: i === 10 ? 64 : 12, mb: 400 + i }));

function draw(p: Proc, s: readonly Sample[] = samples) {
  const log: string[] = [];
  const x: ProcItem = { project: 'acme', projectName: 'acme', p };
  render(
    <ProcView x={x} st={stateOf(p)} now={NOW} where="acme › perf" cwd="~/acme/.worktrees/perf/web" samples={s}
      onAgent={() => log.push('agent')} onOpen={(u) => log.push(`open ${u}`)} onStop={() => log.push('stop')} onCopy={(t) => log.push(`copy ${t}`)} />,
  );
  return log;
}

describe('the process panel', () => {
  it('running: its name, its pill, who started it, its whole command, its curves and its port, its output followed', () => {
    const log = draw(proc({}));
    expect(screen.getByTestId('proc.title').textContent).toBe('dev server');
    expect(screen.getByTestId('proc.pill').textContent).toBe('∿running · 4 min');
    expect(screen.getByTestId('proc.meta').textContent).toContain('started by perf in acme › perf');
    expect(screen.getByTestId('proc.meta').textContent).toContain('pid 21304 · 3 processes');
    expect(screen.getByTestId('proc.cmd').textContent).toContain('pnpm --filter web dev --port 5173');
    expect(screen.getByTestId('proc.cpu').textContent).toContain('12 % · peak 64 %');
    expect(screen.getByTestId('proc.mem').textContent).toContain('419 MB · peak 419 MB');
    expect(screen.getByTestId('proc.listening').textContent).toContain(':5173');
    expect(screen.getByTestId('proc.output.sub').textContent).toBe('follows the end');
    expect(screen.getByTestId('running.out').getAttribute('data-live')).toBe('true');
    fireEvent.click(screen.getByTestId('proc.agent'));
    fireEvent.click(screen.getByTestId('proc.open'));
    fireEvent.click(screen.getByTestId('proc.stop'));
    expect(screen.getByTestId('proc.stop').textContent).toBe('Stop it?');
    fireEvent.click(screen.getByTestId('proc.stop'));
    expect(log).toEqual(['agent', 'open http://127.0.0.1:5173', 'stop']);
  });

  it('succeeded: exit 0 and how long it ran, its curves at half "while it ran", no actions', () => {
    draw(proc({ state: { is: 'exited', rc: 0 }, ended_ms: NOW - MIN, url: null, ports: [] }));
    expect(screen.getByTestId('proc.pill').textContent).toBe('✓exit 0 · ran 3 min');
    expect(screen.getByTestId('proc.resources').className).toContain('ended');
    expect(screen.getByTestId('proc.resources').textContent).toContain('while it ran');
    expect(screen.getByTestId('proc.cpu').textContent).toContain('peak 64 %');
    expect(screen.queryByTestId('proc.stop')).toBeNull();
    expect(screen.queryByTestId('proc.open')).toBeNull();
  });

  it('failed: exit 1 in red, its output opened on its first error; never measured: no resources at all', () => {
    draw(proc({ state: { is: 'exited', rc: 1 }, ended_ms: NOW - 3 * MIN }), []);
    expect(screen.getByTestId('proc.pill').className).toContain('err');
    expect(screen.getByTestId('proc.pill').textContent).toBe('✗exit 1 · after 1 min');
    expect(screen.getByTestId('running.out').getAttribute('data-error')).toBe('true');
    expect(screen.queryByTestId('proc.resources')).toBeNull();
    // one sample only: no curve to draw, so no empty plot either (designer m_47812)
    cleanup();
    draw(proc({ state: { is: 'exited', rc: 1 }, ended_ms: NOW - 3 * MIN }), samples.slice(0, 1));
    expect(screen.queryByTestId('proc.resources')).toBeNull();
  });

  it('no output kept: says why and what to do, with the command to copy', () => {
    const log = draw(proc({ kind: { is: 'detached' }, name: null, cmd: "tmux new-session -d -s docs 'mdbook serve -p 3000'", out: 'none', fd1: 'null' }));
    expect(screen.getByTestId('proc.title').textContent).toBe('mdbook serve');
    expect(screen.getByTestId('proc.empty.tmux').textContent).toContain('No output kept: it writes to a tmux session, not to a file bise can read.');
    expect(screen.getByTestId('proc.empty.tmux').textContent).toContain('tmux attach -t docs');
    fireEvent.click(screen.getByTestId('proc.empty.copy'));
    expect(log).toEqual(['copy tmux attach -t docs']);
    cleanup();
    draw(proc({ kind: { is: 'detached' }, out: 'none', fd1: 'tty', cmd: '/bin/sh /Users/me/run.sh' }));
    expect(screen.getByTestId('proc.empty.tty').textContent).toBe('No output kept: it writes to a terminal, not to a file bise can read.');
  });

  it('stopped: by you at its time, how long it ran', () => {
    draw(proc({ state: { is: 'stopped_by_you' }, started_ms: NOW - 27 * MIN, ended_ms: new Date(2026, 9, 27, 14, 2).getTime() }));
    expect(screen.getByTestId('proc.pill').textContent).toBe('–stopped by you · 14:02');
    expect(screen.getByTestId('proc.meta').textContent).toContain('ran 23 min');
  });
});
