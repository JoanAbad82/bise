// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CoreCmd, CorePort } from '@/shared/api';
import { Store, StoreProvider, replay, threadKey } from '@/store';
import { approvalParts, cutWords, EntryRow, type RowCtx, withoutImageMarks } from './rows';
import { ThreadScreen } from './ThreadScreen';
import { createRouter, RouterContext } from '@/app/router';

// the composer is amb-web's: here a stand-in that counts its renders
const composer = vi.hoisted(() => ({ renders: 0, props: null as null | { busy?: boolean; onSend: (o: { text: string; files: string[] }) => void } }));
vi.mock('@/composer', () => ({
  Composer: (props: { busy?: boolean; onSend: (o: { text: string; files: string[] }) => void }) => {
    composer.renders += 1;
    composer.props = props;
    return <div data-testid="composer" />;
  },
  useComposerSources: () => ({ agents: [], skills: [], commands: [], files: () => Promise.resolve([]), saveImage: () => Promise.resolve(null) }),
}));

const P = 'acme-1a2b3c4d';
const K = threadKey(P, 'perf');

function setup() {
  const cmds: CoreCmd[] = [];
  const port: CorePort = {
    send: (c) => cmds.push(c),
    onEvent: () => () => undefined,
    onState: () => () => undefined,
    state: () => Promise.resolve('up'),
  };
  const store = new Store(port);
  store.setCore('up');
  replay(store);
  return { store, cmds };
}

const ctx: RowCtx = { tkey: K, project: P, agent: 'perf', bise: false, onLink: () => undefined };

afterEach(() => {
  cleanup();
  composer.renders = 0;
});

describe('the thread screen', () => {
  it('subscribes its thread while shown, and only then', () => {
    const { store, cmds } = setup();
    const v = render(
      <StoreProvider store={store}>
        <RouterContext value={createRouter({ screen: 'bise' })}><ThreadScreen project={P} agent="perf" /></RouterContext>
      </StoreProvider>,
    );
    expect(cmds).toContainEqual({ cmd: 'subscribe', project: P, agent: 'perf' });
    const before = cmds.length;
    v.unmount();
    // (the inbox strip in the thread says its card_in_view too)
    expect(cmds.slice(before)).toContainEqual({ cmd: 'unsubscribe', project: P, agent: 'perf' });
  });

  it("voice mode on this agent adds 'voice mode' after the head's chip, gone when it ends or is another agent's (amb-home m_11684)", () => {
    const { store } = setup();
    const v = render(
      <StoreProvider store={store}>
        <RouterContext value={createRouter({ screen: 'bise' })}><ThreadScreen project={P} agent="perf" /></RouterContext>
      </StoreProvider>,
    );
    expect(v.queryByTestId('thread.voice')).toBeNull();
    act(() => {
      store.apply({ ev: 'voice_mode', project: P, agent: 'perf', on: true, state: 'listening' });
    });
    expect(v.getByTestId('thread.voice').textContent).toBe('voice mode');
    act(() => {
      store.apply({ ev: 'voice_mode', project: P, agent: 'perf', on: true, state: 'typing' });
    });
    expect(v.getByTestId('thread.voice')).toBeTruthy();
    act(() => {
      store.apply({ ev: 'voice_mode', project: P, agent: 'main', on: true, state: 'listening' });
    });
    expect(v.queryByTestId('thread.voice')).toBeNull();
    act(() => {
      store.apply({ ev: 'voice_mode', project: P, agent: 'perf', on: false, state: 'listening' });
    });
    expect(v.queryByTestId('thread.voice')).toBeNull();
  });

  it("batch 3b: a scheduled entry is '◷ main scheduled perf · …' (designer N2: no number, no chevron), its words open on a click; an ended one doesn't open", () => {
    const { store } = setup();
    // fixtures pos 33-34 (6e9d68f8): set with words, then ended without
    const v = render(
      <StoreProvider store={store}>
        <EntryRow ctx={ctx} pos={33} />
        <EntryRow ctx={ctx} pos={34} />
      </StoreProvider>,
    );
    const set = v.getByTestId('thread.scheduled.33');
    expect(set.textContent).toContain('◷');
    expect(set.textContent).toBe('◷main scheduled perf · every 2m · 6 times · next 14:22');
    expect(set.dataset.id).toBe('48');
    expect(v.queryByTestId('thread.scheduled.33.words')).toBeNull();
    fireEvent.click(v.getByTestId('thread.scheduled.33.head'));
    expect(v.getByTestId('thread.scheduled.33.words').textContent).toBe('check the build');
    const ended = v.getByTestId('thread.scheduled.34');
    // never the internal number: in perf's thread it names perf (designer m_14246)
    expect(ended.textContent).toBe('◷scheduled perf ended · stopped by you');
    expect(v.queryByTestId('thread.scheduled.34.head')).toBeNull();
  });

  it('⛔3: a send shows at once as his row, before any event; a failed one says so and retries', () => {
    const { store, cmds } = setup();
    const row = render(
      <StoreProvider store={store}>
        <RouterContext value={createRouter({ screen: 'bise' })}><ThreadScreen project={P} agent="perf" /></RouterContext>
      </StoreProvider>,
    );
    act(() => {
      composer.props?.onSend({ text: 'hi there', files: [] });
    });
    expect(cmds.at(-1)).toMatchObject({ cmd: 'send', project: P, agent: 'perf', text: 'hi there', mode: 'now' });
    act(() => {
      composer.props?.onSend({ text: 'look', files: ['/tmp/shot.png'] });
    });
    expect(cmds.at(-1)).toMatchObject({ cmd: 'send', project: P, agent: 'perf', text: 'look', files: ['/tmp/shot.png'] });
    const [p] = store.pending(K);
    if (p === undefined) throw new Error('no pending send');
    // drawn by the screen itself, in the same render as the send (outside the virtual list)
    expect(row.getByTestId(`thread.pending.${p.cid}`).dataset.state).toBe('sending');
    expect(row.getByTestId(`thread.pending.${p.cid}`).textContent).toContain('hi there');
    act(() => {
      store.apply({ ev: 'error', project: P, cmd: 'send', text: 'no agent perf' });
    });
    expect(row.getByTestId(`thread.pending.${p.cid}`).dataset.state).toBe('failed');
    expect(row.getByTestId(`thread.pending.${p.cid}`).textContent).toContain('▲ not sent: no agent perf');
    expect(row.getByTestId(`thread.retry.${p.cid}`).textContent).toBe('try again');
    fireEvent.click(row.getByTestId(`thread.retry.${p.cid}`));
    expect(cmds.at(-1)).toMatchObject({ cmd: 'send', project: P, agent: 'perf', text: 'hi there', mode: 'now' });
  });

  it('⛔6: esc while its turn runs sends stop, and the stop shows; at rest esc sends nothing', () => {
    const { store, cmds } = setup();
    const v = render(
      <StoreProvider store={store}>
        <RouterContext value={createRouter({ screen: 'bise' })}><ThreadScreen project={P} agent="perf" /></RouterContext>
      </StoreProvider>,
    );
    act(() => {
      store.apply({ ev: 'typing', project: P, agent: 'perf', text: 'running the tests' });
    });
    expect(v.getByTestId('thread.typing').textContent).toContain('running the tests');
    fireEvent.keyDown(v.getByTestId('thread.screen'), { key: 'Escape' });
    expect(cmds.at(-1)).toEqual({ cmd: 'stop', project: P, agent: 'perf' });
    expect(v.getByTestId('thread.screen').textContent).toContain('stopping perf');
    act(() => {
      store.apply({ ev: 'typing', project: P, agent: 'perf', text: '' });
      store.apply({ ev: 'agents', project: P, agents: store.agents(P).map((a) => ({ ...a, status: 'idle' as const })) });
    });
    const n = cmds.length;
    fireEvent.keyDown(v.getByTestId('thread.screen'), { key: 'Escape' });
    expect(cmds.length).toBe(n);
    expect(v.getByTestId('thread.screen').textContent).not.toContain('stopping perf');
  });

  it("⛔6: the hub's stopped entry shows in the thread", () => {
    const { store } = setup();
    act(() => {
      store.apply({ ev: 'entry', project: P, agent: 'perf', entry: { pos: 950, at_ms: Date.UTC(2026, 0, 1, 14, 5), kind: 'stopped', text: 'stopped' } });
    });
    const v = render(
      <StoreProvider store={store}>
        <EntryRow ctx={ctx} pos={950} />
      </StoreProvider>,
    );
    expect(v.getByTestId('thread.entry.950').dataset.kind).toBe('stopped');
    expect(v.getByTestId('thread.entry.950').textContent).toContain('■ stopped');
  });

  it('a new entry never re-renders the composer', () => {
    const { store } = setup();
    render(
      <StoreProvider store={store}>
        <RouterContext value={createRouter({ screen: 'bise' })}><ThreadScreen project={P} agent="perf" /></RouterContext>
      </StoreProvider>,
    );
    const before = composer.renders;
    act(() => {
      store.apply({ ev: 'entry', project: P, agent: 'perf', entry: { pos: 900, at_ms: 1, kind: 'agent', text: 'new words' } });
      store.apply({ ev: 'entry', project: P, agent: 'perf', entry: { pos: 900, at_ms: 1, kind: 'agent', text: 'new words, more' } });
    });
    expect(composer.renders).toBe(before);
  });

  it('⛔4: an entry row draws its words as markdown', () => {
    const { store } = setup();
    act(() => {
      store.apply({ ev: 'entry', project: P, agent: 'perf', entry: { pos: 901, at_ms: 1, kind: 'agent', text: '**done**\n\n```\na  b\n```' } });
    });
    const v = render(
      <StoreProvider store={store}>
        <EntryRow ctx={ctx} pos={901} />
      </StoreProvider>,
    );
    const row = v.getByTestId('thread.entry.901');
    expect(row.querySelector('strong')?.textContent).toBe('done');
    expect(row.querySelector('pre')?.textContent).toBe('a  b\n');
  });
});

describe('his answer with images', () => {
  it("the chips are the images: '[Image #n]' leaves his words (designer m_15891)", () => {
    expect(withoutImageMarks('you answered main: [Image #1] this one')).toBe('you answered main: this one');
    expect(withoutImageMarks('[Image #1] [Image #2]')).toBe('');
    expect(withoutImageMarks('this one [Image #2], not that')).toBe('this one, not that');
  });
});

describe('a cut tool output', () => {
  it("says how much shows when the hub knows the whole size, else only that it was cut (amb-feed a928ab09)", () => {
    expect(cutWords('x'.repeat(4096), 18 * 1024)).toBe('… 4 KB of 18 KB shown');
    expect(cutWords('é'.repeat(2048), 9000)).toBe('… 4 KB of 9 KB shown');
    expect(cutWords('x'.repeat(4096))).toBe('… cut after 4 KB');
  });
});

describe('his answer to a card, on his side', () => {
  it("the hub's text splits into the dim head and his words in the bubble", () => {
    expect(approvalParts('you answered main: this one')).toEqual({ head: 'you answered main', words: 'this one' });
    expect(approvalParts('you answered gift-ui')).toEqual({ head: 'you answered gift-ui', words: '' });
    expect(approvalParts('you answered perf: 1 · merge')).toEqual({ head: 'you answered perf', words: '1 · merge' });
  });
});
