// @vitest-environment happy-dom
// A '$' call its agent left running in the background: '∿ <age>' at its end, its tip, a click opens
// its output on the running screen (designer's running-procs, m_38604).
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Agent, Proc } from '@/proto';
import { running } from '@/proto/words_running.gen';
import { RouterContext, type Router } from '@/app/router';
import { Store, StoreProvider, threadKey } from '@/store';
import { EntryRow, type RowCtx } from './rows';

afterEach(cleanup);

const P = 'acme-1a2b3c4d';
const now = Date.now();
const ag: Agent = { name: 'perf', dir: 'perf', main: false, status: 'idle', archived: false, title: '', purpose: '', since_ms: 1, waits: 0, watching: [] };
const call = {
  pos: 4,
  at_ms: now - 20_000,
  kind: 'tools' as const,
  text: '',
  tools: { count: 1, summary: 'ran 1 command', items: [{ pos: 2, at_ms: now - 20_000, name: 'bash', code: '{"command":"pnpm dev","run_in_background":true}', text: 'pnpm dev', kind: 'run' as const }] },
};
const dev: Proc = { id: 'bg3', agent: 'perf', kind: { is: 'bg', n: 3 }, cmd: 'pnpm dev', pid: 48211, started_ms: now - 14 * 60_000, ports: [5173], state: { is: 'running' }, cpu: 12, rss_mb: 340, procs: 3, out: 'bg' };

describe("a thread's backgrounded '$' call", () => {
  it("ends with '∿ 14 min', its tip says it opens its output, a click opens it on the running screen", () => {
    const store = new Store(null);
    store.apply({ ev: 'agents', project: P, agents: [ag] });
    store.apply({ ev: 'thread', project: P, agent: 'perf', entries: [call], before: null, more: false });
    store.apply({ ev: 'processes', project: P, items: [dev] });
    const went: unknown[] = [];
    const router = { go: (to: unknown) => went.push(to) } as unknown as Router;
    const ctx: RowCtx = { tkey: threadKey(P, 'perf'), project: P, agent: 'perf', bise: false, onLink: () => undefined, onArtifact: () => undefined };
    const v = render(
      <RouterContext.Provider value={router}>
        <StoreProvider store={store}>
          <EntryRow ctx={ctx} pos={4} />
        </StoreProvider>
      </RouterContext.Provider>,
    );
    const mark = v.getByTestId('thread.tool.2.bg');
    expect(mark.textContent).toBe('∿ 14 min');
    expect(mark.getAttribute('data-tip')).toBe(running.tip_thread_row);
    fireEvent.click(v.getByTestId('thread.tool.2'));
    expect(went).toEqual([{ screen: 'running', open: { project: P, agent: 'perf', id: 'bg3' } }]);
  });
});
