// @vitest-environment happy-dom
// New tab, the launcher (r2-launcher, his m_44190/m_44192): Artifacts ⌘P turns the tab into the
// picker of the newest artifacts, Changes shows only for an agent with a diff, Browser opens a
// browser tab with its own field focused, Office opens the project's bims, no side thread; ↑/↓
// move the highlighted row, ⏎ opens it, esc clears, then leaves the picker, then closes the tab.
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { CorePort } from '@/shared/api';
import type { Agent } from '@/proto';
import { Store, StoreProvider } from '@/store';
import { artifact, artifacts, ev, projects, row } from '../../../tests/feature/inputs';
import { createRouter, RouterContext } from '@/app/router';
import { BarTabs } from './BarTabs';
import { PanelHost } from './Host';
import { openLauncher, panelState } from './state';
import { doPanelKey } from './keys';

afterEach(cleanup);
beforeEach(() => {
  panelState.reset();
  Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true });
});
const ACME = 'acme-1a2b3c4d';
const HOME = 'bise-home-00000000';

const agent = (name: string, files: number): Agent => ({ ...(ev('agents').agents[1] as Agent), name, main: false, changes: { add: 1, del: 0, files }, archived: false });

function shell(agentName = 'perf', files = 3) {
  const port: CorePort = { send: () => undefined, onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
  const notify = { listed: () => undefined, state: () => Promise.resolve('granted'), onState: () => () => undefined };
  const opened: string[] = [];
  (window as unknown as { bise: unknown }).bise = { notify, openExternal: (u: string) => { opened.push(u); return Promise.resolve(); } };
  const store = new Store(port);
  store.setCore('up');
  store.apply(projects(row({ project: HOME, name: 'bise', home: true }), row({ project: ACME, name: 'acme' })));
  store.apply(ev('agents', { project: ACME, agents: [agent(agentName, files)] }));
  const items = Array.from({ length: 12 }, (_, i) => artifact({ id: `a${String(i)}`, title: `Note ${String(i)}`, at_ms: 1_000 + i, agent: agentName }));
  store.apply(artifacts(ACME, ...items));
  const router = createRouter({ screen: 'thread', project: ACME, agent: agentName });
  const v = render(
    <StoreProvider store={store}>
      <RouterContext value={router}>
        <BarTabs />
        <PanelHost />
      </RouterContext>
    </StoreProvider>,
  );
  act(() => {
    openLauncher();
  });
  return { v, store, opened, ctx: { route: router.get(), home: HOME, agents: (p: string) => store.agents(p) } };
}

const ids = (v: ReturnType<typeof render>, prefix: string) => v.getAllByTestId(new RegExp(`^${prefix.replace(/[.]/g, '\\.')}`)).map((e) => e.getAttribute('data-testid') ?? '');

describe('New tab, the launcher (r2-launcher)', () => {
  it("Open: Artifacts ⌘P, Terminal, Changes, Browser, Office; no side thread; the field focused", () => {
    const { v } = shell();
    for (const k of ['artifacts', 'terminal', 'changes', 'browser', 'office']) expect(v.getByTestId(`app.panel.launcher.${k}`)).toBeTruthy();
    expect(v.queryByTestId('app.panel.launcher.side')).toBeNull();
    expect(v.queryByTestId('app.panel.launcher.files')).toBeNull();
    expect(v.getByTestId('app.panel.launcher.artifacts').textContent).toContain('⌘P');
    expect(document.activeElement).toBe(v.getByTestId('app.panel.launcher.search'));
  });
  it('Changes is hidden, and ⌥⌘D does nothing, when the agent in view has no diff', () => {
    const { v, ctx } = shell('perf', 0);
    expect(v.queryByTestId('app.panel.launcher.changes')).toBeNull();
    act(() => {
      doPanelKey('changes', ctx);
    });
    expect(v.queryByTestId(`app.panel.tab.diff:${ACME}/perf`)).toBeNull();
  });
  it('Artifacts: the picker of the 10 newest in this tab, newest first; the field filters; esc clears, then back to Open', () => {
    const { v } = shell();
    fireEvent.click(v.getByTestId('app.panel.launcher.artifacts'));
    expect(v.getByTestId('app.panel.tab.new:1').getAttribute('aria-selected')).toBe('true');
    const rows = ids(v, 'app.panel.launcher.found.');
    expect(rows).toHaveLength(10);
    expect(rows[0]).toBe(`app.panel.launcher.found.${ACME}/a11`);
    const field = v.getByTestId('app.panel.launcher.search');
    fireEvent.change(field, { target: { value: 'note 3' } });
    expect(ids(v, 'app.panel.launcher.found.')).toEqual([`app.panel.launcher.found.${ACME}/a3`]);
    fireEvent.keyDown(field, { key: 'Escape' });
    expect(ids(v, 'app.panel.launcher.found.')).toHaveLength(10);
    fireEvent.keyDown(v.getByTestId('app.panel.launcher.search'), { key: 'Escape' });
    expect(v.getByTestId('app.panel.launcher.artifacts')).toBeTruthy();
  });
  it('⌘P from anywhere opens the picker; ⏎ opens the highlighted one in its place', () => {
    const { v, ctx } = shell();
    act(() => {
      doPanelKey('files', ctx);
    });
    const field = v.getByTestId('app.panel.launcher.search');
    fireEvent.keyDown(field, { key: 'ArrowDown' });
    fireEvent.keyDown(field, { key: 'ArrowDown' });
    fireEvent.keyDown(field, { key: 'ArrowUp' });
    expect(v.getByTestId(`app.panel.launcher.found.${ACME}/a10`).getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(v.queryByTestId('app.panel.tab.new:1')).toBeNull();
    expect(v.getByTestId(`app.panel.tab.artifact:${ACME}/a10`).getAttribute('aria-selected')).toBe('true');
  });
  it('the search: the first row highlighted as he types, ↓ the next, ⏎ opens it; esc clears, then closes the tab', () => {
    const { v } = shell();
    const field = v.getByTestId('app.panel.launcher.search');
    fireEvent.change(field, { target: { value: 'note 1' } });
    const rows = ids(v, 'app.panel.launcher.found.');
    expect(v.getByTestId(rows[0] ?? '').getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(field, { key: 'ArrowDown' });
    expect(v.getByTestId(rows[1] ?? '').getAttribute('aria-selected')).toBe('true');
    expect(field.getAttribute('aria-activedescendant')).toBe(v.getByTestId(rows[1] ?? '').id);
    fireEvent.keyDown(field, { key: 'Escape' });
    expect((field as HTMLInputElement).value).toBe('');
    fireEvent.keyDown(field, { key: 'Escape' });
    expect(v.queryByTestId('app.panel.tab.new:1')).toBeNull();
  });
  it('Browser: a browser tab in its place, its own address field focused; ⏎ on an address goes to his browser', () => {
    const { v, opened } = shell();
    fireEvent.click(v.getByTestId('app.panel.launcher.browser'));
    expect(v.queryByTestId('app.panel.tab.new:1')).toBeNull();
    expect(v.getByTestId('app.panel.tab.web:1').getAttribute('aria-selected')).toBe('true');
    const field = v.getByTestId('app.panel.addr.field');
    expect(document.activeElement).toBe(field);
    fireEvent.change(field, { target: { value: 'bise.dev' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(opened).toEqual(['https://bise.dev']);
    fireEvent.change(field, { target: { value: 'note 7' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(v.getByTestId(`app.panel.tab.artifact:${ACME}/a7`).getAttribute('aria-selected')).toBe('true');
  });
  it("Office: the project's bims in a tab", () => {
    const { v } = shell();
    fireEvent.click(v.getByTestId('app.panel.launcher.office'));
    expect(v.getByTestId(`app.panel.tab.office:${ACME}`).getAttribute('aria-selected')).toBe('true');
  });
});
