// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { formatRoute, parseRoute } from '@/app/route';
import type { Proc } from '@/proto';
import type { ProcItem, RunningPorts } from './index';

// the terminal is xterm's (a canvas): here its props only
vi.mock('./Output', () => ({
  Output: ({ id, none, live }: { id: string; none: boolean; live: boolean }) => <div data-testid="running.out" data-id={id} data-none={none} data-live={live} />,
}));
const { RunningView } = await import('./Screen');

afterEach(cleanup);

const NOW = new Date(2026, 9, 23, 14, 6).getTime();
const MIN = 60_000;
const proc = (over: Partial<Proc> & Pick<Proc, 'id' | 'agent'>): Proc => ({
  kind: { is: 'bg', n: Number(/^bg(\d+)$/u.exec(over.id)?.[1] ?? 0) },
  cmd: 'pnpm dev',
  pid: 48211,
  started_ms: NOW - 14 * MIN,
  state: { is: 'running' },
  out: 'bg',
  cpu: 12,
  rss_mb: 340,
  procs: 1,
  ...over,
});
const at = (project: string, p: Proc): ProcItem => ({ project, projectName: project === 'shop' ? 'storefront' : project, p });

const dev = at('shop', proc({ id: 'bg3', agent: 'perf', ports: [5173] }));
const stripe = at('shop', proc({ id: 'bg1', agent: 'checkout', cmd: 'stripe listen', started_ms: NOW - 22 * MIN }));
const failed = at('shop', proc({ id: 'bg2', agent: 'checkout', cmd: 'pnpm test checkout', state: { is: 'exited', rc: 1 }, ended_ms: NOW - 3 * MIN }));
const nohup = at('tele', proc({ id: 'p9.1', agent: 'p99', kind: { is: 'detached' }, cmd: 'grafana-server', out: 'none' }));

function ports(): RunningPorts & { log: string[] } {
  const log: string[] = [];
  return {
    log,
    watch: (on) => log.push(`watch ${String(on)}`),
    stop: (x) => log.push(`stop ${x.project}/${x.p.agent}/${x.p.id}`),
    open: (u) => log.push(`open ${u}`),
  };
}
const rowIds = () => [...screen.getByTestId('running.list').querySelectorAll('[role=option]')].map((r) => r.getAttribute('data-row'));

describe('the running screen', () => {
  it("the route is 'running', or 'running/<project>/<agent>/<id>' for one's output", () => {
    expect(parseRoute('running')).toEqual({ screen: 'running' });
    expect(parseRoute('running/shop/perf/bg3')).toEqual({ screen: 'running', open: { project: 'shop', agent: 'perf', id: 'bg3' } });
    expect(formatRoute({ screen: 'running', open: { project: 'shop', agent: 'perf', id: 'bg3' } })).toBe('running/shop/perf/bg3');
    expect(parseRoute('running/shop').screen).toBe('notfound');
  });

  it('watches the hubs while shown, and stops when it goes', () => {
    const p = ports();
    const v = render(<RunningView items={[dev]} ports={p} now={NOW} />);
    expect(p.log).toEqual(['watch true']);
    v.unmount();
    expect(p.log).toEqual(['watch true', 'watch false']);
  });

  it("groups project › agent, running ones under 'running · N', ended ones under 'ended today · N'", () => {
    render(<RunningView items={[stripe, dev, failed, nohup]} ports={ports()} now={NOW} />);
    expect(screen.getByTestId('running.filter.running').textContent).toBe('running · 3');
    expect(screen.getByTestId('running.filter.ended').textContent).toBe('ended today · 1');
    expect(screen.getByTestId('running.sub').textContent).toBe('running in 2 projects · 1 listening');
    expect(rowIds()).toEqual(['shop/checkout/bg1', 'shop/perf/bg3', 'tele/p99/p9.1']);
    expect(screen.getByTestId('running.row.shop/perf/bg3.url').textContent).toBe('localhost:5173 ↗');
    expect(screen.getByTestId('running.row.shop/perf/bg3.end').textContent).toBe('14 min');
    fireEvent.click(screen.getByTestId('running.filter.ended'));
    expect(rowIds()).toEqual(['shop/checkout/bg2']);
    expect(screen.getByTestId('running.row.shop/checkout/bg2.end').textContent).toBe('ended 3 min ago · rc 1');
  });

  it("s stops the selected one at once: 'stopping…', then its hub's row says how; it stays in place", () => {
    const p = ports();
    const v = render(<RunningView items={[dev, stripe]} ports={p} now={NOW} />);
    fireEvent.click(screen.getByTestId('running.row.shop/perf/bg3'));
    fireEvent.keyDown(screen.getByTestId('running.screen'), { key: 's' });
    expect(p.log).toContain('stop shop/perf/bg3');
    expect(screen.getByTestId('running.row.shop/perf/bg3.end').textContent).toBe('stopping…');
    // a second s sends nothing more
    fireEvent.keyDown(screen.getByTestId('running.screen'), { key: 's' });
    expect(p.log.filter((l) => l.startsWith('stop'))).toHaveLength(1);
    const ended = at('shop', { ...dev.p, state: { is: 'stopped_by_you' }, ended_ms: new Date(2026, 9, 23, 14, 5).getTime() });
    expect(rowIds()).toEqual(['shop/perf/bg3', 'shop/checkout/bg1']);
    v.rerender(<RunningView items={[ended, stripe]} ports={p} now={NOW} />);
    expect(rowIds()).toEqual(['shop/perf/bg3', 'shop/checkout/bg1']);
    expect(screen.getByTestId('running.row.shop/perf/bg3.end').textContent).toBe('stopped by you · 14:05');
  });

  it('opens the output beside the list: head, meta, keys; o opens its address; no output kept: the dim line', () => {
    const p = ports();
    render(<RunningView items={[dev, nohup]} ports={p} now={NOW} opened="shop/perf/bg3" />);
    expect(screen.getByTestId('running.pane.cmd').textContent).toBe('pnpm dev');
    expect(screen.getByTestId('running.pane.meta').textContent).toContain('localhost:5173');
    expect(screen.getByTestId('running.out').getAttribute('data-live')).toBe('true');
    fireEvent.keyDown(screen.getByTestId('running.screen'), { key: 'o' });
    expect(p.log).toContain('open http://127.0.0.1:5173');
    fireEvent.click(screen.getByTestId('running.row.tele/p99/p9.1'));
    expect(screen.getByTestId('running.out').getAttribute('data-none')).toBe('true');
    expect(screen.queryByTestId('running.pane.open')).toBeNull();
    fireEvent.keyDown(screen.getByTestId('running.screen'), { key: 'Escape' });
    expect(screen.queryByTestId('running.pane')).toBeNull();
  });

  it("a route to an ended one opens it under 'ended today'", () => {
    render(<RunningView items={[dev, failed]} ports={ports()} now={NOW} opened="shop/checkout/bg2" />);
    expect(screen.getByTestId('running.filter.ended').getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('running.out').getAttribute('data-live')).toBe('false');
  });
});
