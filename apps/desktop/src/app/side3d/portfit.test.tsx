// @vitest-environment happy-dom
// A process row's port gives way to its command (designer m_46894): ':5242' at rest, its tip the
// whole address; 'localhost:5242 ↗' on the row's hover only when the command keeps 12 characters
// beside it. happy-dom has no layout: the widths the hook measures are given (clientWidth of the
// command's line, scrollWidth of the command). Mutation: portFits always true turns the narrow
// case red; the short form back to the label turns the rest case red.
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Proc } from '@/proto';
import type { CorePort } from '@/shared/api';
import { Store, StoreProvider } from '@/store';
import { ProcRow } from './FlyoutLists';
import { CMD_KEEP, FULL_ICON_PX, fullGrows, portFits } from './portfit';

afterEach(cleanup);

describe('portFits', () => {
  it('a long command keeps 12 of its characters: the line at least 12 widths wide', () => {
    // 40 characters 7 px each: 84 px for 12
    expect(portFits(84, 280, 40)).toBe(true);
    expect(portFits(83, 280, 40)).toBe(false);
    expect(CMD_KEEP).toBe(12);
  });

  it('a short command keeps all of it', () => {
    expect(portFits(35, 35, 5)).toBe(true);
    expect(portFits(34, 35, 5)).toBe(false);
  });

  it('the full form grows by its extra characters at the short one\'s width, and the ↗', () => {
    // ':5242' 35 px -> 'localhost:5242': 9 more at 7
    expect(fullGrows(35, 5, 14)).toBe(63 + FULL_ICON_PX);
    expect(fullGrows(0, 0, 14)).toBe(FULL_ICON_PX);
  });
});

const PROC: Proc = {
  id: 'bg1', agent: 'perf', kind: { is: 'bg', n: 1 }, cmd: 'pnpm --filter web dev --port 5242 --host', pid: 42, started_ms: 0,
  ports: [5242], url: 'http://localhost:5242/', state: { is: 'running' }, cpu: 0, rss_mb: 10, procs: 1, out: 'bg',
};

function row(lineW: number) {
  const core: CorePort = { send: () => undefined, onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
  const store = new Store(core);
  const v = render(
    <StoreProvider store={store}>
      <ProcRow x={{ project: 'acme', projectName: 'acme', p: PROC }} now={60_000} />
    </StoreProvider>,
  );
  const box = v.getByTestId('app.flyout.processes.acme.perf.bg1');
  const line = box.querySelector('.s3-row-l1') as HTMLElement;
  const cmd = box.querySelector('.s3-cmd') as HTMLElement;
  Object.defineProperty(line, 'clientWidth', { value: lineW, configurable: true });
  // mono, 7 px a character
  Object.defineProperty(cmd, 'scrollWidth', { value: 7 * cmd.textContent.length, configurable: true });
  const port = v.getByTestId('app.flyout.processes.acme.perf.bg1.port');
  Object.defineProperty(port, 'scrollWidth', { value: 7 * port.textContent.length, configurable: true });
  return { v, box, port };
}

describe('a process row\'s port', () => {
  it('at rest: the short form, text-3, its tip and its name the whole address', () => {
    const { port } = row(200);
    expect(port.textContent).toBe(':5242');
    expect(port.hasAttribute('data-short')).toBe(true);
    expect(port.getAttribute('aria-label')).toBe('localhost:5242 ↗');
  });

  // the full form takes 7 x 9 more characters + the ↗ (18) = 81 off the line; 12 of the command need 84
  it('hovered with room for 12 characters of the command: the full form; left: short again', () => {
    const { box, port } = row(165);
    act(() => {
      fireEvent.pointerEnter(box);
    });
    expect(port.textContent).toBe('localhost:5242');
    expect(port.hasAttribute('data-short')).toBe(false);
    act(() => {
      fireEvent.pointerLeave(box);
    });
    expect(port.textContent).toBe(':5242');
  });

  it('hovered with no room: the short form stays', () => {
    const { box, port } = row(164);
    act(() => {
      fireEvent.pointerEnter(box);
    });
    expect(port.textContent).toBe(':5242');
  });
});
