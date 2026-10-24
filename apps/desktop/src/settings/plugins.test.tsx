// @vitest-environment happy-dom
// settings · plugins (bar P.1, min-tests for settings/plugins): the page lists the plugins the
// core sends (the TUI's /plugins rows), and a toggle sends plugin_set for that one; a shadowed or
// invalid one is not his to toggle. The TUI side of the same rows is rust/plugins' state tests.
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Plugin } from '@/proto';
import { Plugins } from './plugins';

afterEach(cleanup);

const items: Plugin[] = [
  { id: 'docs', name: 'docs', kind: 'plugin', title: 'docs', state: 'loaded', on: true, scope: 'built-in' },
  { id: 'sheets', name: 'sheets', kind: 'plugin', title: 'sheets', state: 'disabled', on: false, scope: 'user' },
  { id: 'old', name: 'old', kind: 'plugin', title: 'old', state: 'shadowed', on: false, scope: 'workspace' },
];

describe('the plugins page', () => {
  it('lists every plugin; a toggle turns that one off or on, a shadowed one has none', () => {
    const send = vi.fn();
    const { getByTestId, queryByTestId, container } = render(<Plugins items={items} project="acme" send={send} />);
    for (const p of items) expect(container.textContent).toContain(p.name);
    fireEvent.click(getByTestId('settings.plugin.docs'));
    expect(send).toHaveBeenLastCalledWith({ cmd: 'plugin_set', project: 'acme', name: 'docs', on: false });
    fireEvent.click(getByTestId('settings.plugin.sheets'));
    expect(send).toHaveBeenLastCalledWith({ cmd: 'plugin_set', project: 'acme', name: 'sheets', on: true });
    expect(queryByTestId('settings.plugin.old')).toBeNull();
    expect(send).toHaveBeenCalledTimes(2);
  });
});
