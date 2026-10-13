// @vitest-environment happy-dom
// Bar S9: the call at work shows '∿' and its running time; finished ones keep their marks.
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Agent } from '@/proto';
import { Store, StoreProvider, threadKey } from '@/store';
import { EntryRow, liveTime, type RowCtx } from './rows';
import { stepWords } from './live-step';

afterEach(cleanup);

const P = 'acme-1a2b3c4d';
const ag = (status: Agent['status']): Agent => ({ name: 'perf', dir: 'perf', main: false, status, archived: false, title: '', purpose: '', since_ms: 1, waits: 0, watching: [] });
const now = Date.now();
const tools = {
  pos: 4,
  at_ms: now - 20_000,
  kind: 'tools' as const,
  text: '',
  tools: {
    count: 2,
    summary: 'ran 2 commands',
    items: [
      { pos: 1, at_ms: now - 20_000, text: 'pnpm test', kind: 'run' as const },
      { pos: 2, at_ms: now - 12_000, text: 'pnpm build', kind: 'run' as const },
    ],
  },
};

function row(status: Agent['status']) {
  const store = new Store(null);
  store.apply({ ev: 'agents', project: P, agents: [ag(status)] });
  store.apply({ ev: 'thread', project: P, agent: 'perf', entries: [tools], before: null, more: false });
  const ctx: RowCtx = { tkey: threadKey(P, 'perf'), project: P, agent: 'perf', bise: false, onLink: () => undefined };
  return render(
    <StoreProvider store={store}>
      <EntryRow ctx={ctx} pos={4} />
    </StoreProvider>,
  );
}

describe('the call at work (S9)', () => {
  it("its last call keeps its '$' and ends with '∿ 12 s' while the turn runs (designer's desktop-working v2 (4))", () => {
    const v = row('working');
    const live = v.getByTestId('thread.tool.2');
    expect(live.getAttribute('data-live')).toBe('true');
    expect(live.textContent).toMatch(/^\$ pnpm build/);
    expect(v.getByTestId('thread.tool.2.time').textContent).toMatch(/^∿ 1[12] s$/);
    // the one before is done: its mark and its length
    expect(v.getByTestId('thread.tool.1').textContent).toContain('$');
    expect(v.getByTestId('thread.tool.1').textContent).toContain('8 s');
  });
  it('a turn at rest has no call at work', () => {
    const v = row('idle');
    expect(v.getByTestId('thread.tool.2').getAttribute('data-live')).toBeNull();
    expect(v.getByTestId('thread.tool.2').textContent).toContain('$');
  });
  it("a call the model described is drawn once, by the step fold: no mono line while it runs, its line once done", () => {
    const store = new Store(null);
    const described = { ...tools, tools: { ...tools.tools, items: [tools.tools.items[0], { ...tools.tools.items[1], intent: 'lecture du PDF', text: 'lecture du PDF' }] } };
    store.apply({ ev: 'agents', project: P, agents: [ag('working')] });
    store.apply({ ev: 'thread', project: P, agent: 'perf', entries: [described], before: null, more: false });
    const ctx: RowCtx = { tkey: threadKey(P, 'perf'), project: P, agent: 'perf', bise: false, onLink: () => undefined };
    const v = render(
      <StoreProvider store={store}>
        <EntryRow ctx={ctx} pos={4} />
      </StoreProvider>,
    );
    expect(v.queryByTestId('thread.tool.2')).toBeNull();
    expect(v.getByTestId('thread.tool.1').textContent).toContain('$');
  });
  it('stepWords: the live call\'s intent, else the typing line; a plain command or rest: none', () => {
    const live = { entry: 4, pos: 2, at: 1, intent: 'lecture du PDF' };
    expect(stepWords(true, live, 'lecture du PDF')).toBe('lecture du PDF');
    expect(stepWords(true, { ...live, intent: '' }, 'old words')).toBe('');
    expect(stepWords(true, undefined, ' running the tests ')).toBe('running the tests');
    expect(stepWords(false, live, '')).toBe('');
    expect(stepWords(false, undefined, 'running the tests')).toBe('running the tests');
  });
  it('the time reads as the TUI says it', () => {
    expect([liveTime(400), liveTime(12_300), liveTime(64_000)]).toEqual(['0 s', '12 s', '1 m 4 s']);
  });
});
