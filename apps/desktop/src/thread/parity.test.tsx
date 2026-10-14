// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Agent } from '@/proto';
import type { CoreCmd, CorePort } from '@/shared/api';
import { Store, StoreProvider, replay, threadKey } from '@/store';
import { placesOf } from '@/review/EnvironmentsScreen';
import { Markdown, langOf } from './Markdown';
import { newAtEnd } from './ThreadList';
import { cardLine, EntryRow, foldOf, NOTICE_MARK, thoughtFor, toAgentName, type RowCtx } from './rows';
import { onOpenInbox } from '@/inbox/Block';
import { countsOf, ThreadScreen } from './ThreadScreen';
import { createRouter, RouterContext } from '@/app/router';

vi.mock('@/composer', () => ({
  Composer: () => <div data-testid="composer" />,
  useComposerSources: () => ({ agents: [], skills: [], commands: [], files: () => Promise.resolve([]), saveImage: () => Promise.resolve(null) }),
  useApprovalsFlash: () => false,
  flashWords: () => ({ word: '', rest: '' }),
}));

afterEach(cleanup);

const P = 'acme-1a2b3c4d';
const ag = (name: string, over: Partial<Agent> = {}): Agent => ({ name, dir: name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1, waits: 0, watching: [], ...over });

describe('thread parity rows (tui-parity M2 N11 M8 B15 B11 C47 W2 W5)', () => {
  it('N11: rows that came at the end while scrolled up, not an older page in front', () => {
    expect(newAtEnd('e:5', ['e:1', 'e:5', 'e:7', 'p:1'])).toBe(2);
    expect(newAtEnd('e:5', ['e:0', 'e:5'])).toBe(0);
    expect(newAtEnd(undefined, ['e:1'])).toBe(0);
  });

  it('B15 M8: a code block shows its language and copies its text as written', () => {
    const copy = vi.fn(() => Promise.resolve());
    (window as unknown as { bise: unknown }).bise = { copy };
    const v = render(<Markdown text={'```rust\nfn a() {\n    1\n}\n```'} />);
    expect(v.container.querySelector('.th-code-lang')?.textContent).toBe('rust');
    fireEvent.click(v.getByTestId('thread.code.copy'));
    expect(copy).toHaveBeenCalledWith('fn a() {\n    1\n}\n');
    expect(langOf(['language-ts'])).toBe('ts');
    expect(langOf(undefined)).toBeUndefined();
    delete (window as unknown as { bise?: unknown }).bise;
  });

  it('B11: a long message of his folds to its first lines and opens whole on click', () => {
    const long = Array.from({ length: 30 }, (_, i) => `line ${String(i + 1)}`).join('\n');
    expect(foldOf('short')).toBeUndefined();
    expect(foldOf(long)?.lines).toBe(30);
    const store = new Store(null);
    store.apply({ ev: 'entry', project: P, agent: 'perf', entry: { pos: 5, at_ms: 1, kind: 'you', text: long } });
    const ctx: RowCtx = { tkey: threadKey(P, 'perf'), project: P, agent: 'perf', bise: false, onLink: () => undefined, onArtifact: () => undefined };
    const v = render(
      <StoreProvider store={store}>
        <EntryRow ctx={ctx} pos={5} />
      </StoreProvider>,
    );
    expect(v.getByTestId('thread.entry.5').textContent).not.toContain('line 30');
    expect(v.getByTestId('thread.fold.5').textContent).toContain('show all · 30 lines');
    fireEvent.click(v.getByTestId('thread.fold.5'));
    expect(v.getByTestId('thread.entry.5').textContent).toContain('line 30');
  });

  it('C47: an archived agent has no composer, a way to restore it', () => {
    const cmds: CoreCmd[] = [];
    const port: CorePort = { send: (c) => cmds.push(c), onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
    const store = new Store(port);
    store.setCore('up');
    replay(store);
    act(() => {
      store.apply({ ev: 'agents', project: P, agents: [ag('main'), ag('old', { archived: true })] });
    });
    const v = render(
      <StoreProvider store={store}>
        <RouterContext value={createRouter({ screen: 'bise' })}><ThreadScreen project={P} agent="old" /></RouterContext>
      </StoreProvider>,
    );
    expect(v.queryByTestId('composer')).toBeNull();
    fireEvent.click(v.getByTestId('thread.restore'));
    expect(cmds.at(-1)).toEqual({ cmd: 'unarchive', project: P, agent: 'old' });
  });

  it("W2: a project main's counts", () => {
    expect(countsOf([ag('main', { waits: 1 }), ag('a', { status: 'working' }), ag('b', { waits: 1 }), ag('c', { archived: true })])).toBe('2 agents · 1 at work · 2 waiting for you');
    expect(countsOf([ag('main')])).toBe('');
  });

  it('W5: agents grouped by where they work, a shared worktree first, the shared folder last, servers under their agent', () => {
    const places = placesOf(
      [ag('main'), ag('a', { worktree: '/w/x', branch: 'sb/x' }), ag('b', { worktree: '/w/x', branch: 'sb/x' }), ag('c', { worktree: '/w/c', branch: 'sb/c' })],
      [{ path: '/w/x', branch: 'sb/x', ahead: 2, behind: 0, dirty: false }],
      [{ agent: 'c', cmd: 'pnpm dev', up: true, url: 'http://localhost:5173' }],
    );
    expect(places.map((p) => [p.title, p.agents.map((a) => a.name).join(','), p.servers.length])).toEqual([
      ['sb/x', 'a,b', 0],
      ['sb/c', 'c', 1],
      ['the shared folder', 'main', 0],
    ]);
  });
});

describe('file paths in answers (tui-parity M4, B14)', () => {
  it('names a file in inline code, with its line; not a version, a url or words', async () => {
    const { pathOf, absolute } = await import('./paths');
    expect(pathOf('src/app/App.tsx:42')).toEqual({ path: 'src/app/App.tsx', line: 42 });
    expect(pathOf('/etc/hosts')).toEqual({ path: '/etc/hosts' });
    expect(pathOf('Cargo.toml')).toEqual({ path: 'Cargo.toml' });
    expect(pathOf('rust/tui/src')).toEqual({ path: 'rust/tui/src' });
    expect(pathOf('1.2.3')).toBeUndefined();
    expect(pathOf('https://x.y/z')).toBeUndefined();
    expect(pathOf('npm install')).toBeUndefined();
    expect(pathOf('foo')).toBeUndefined();
    expect(absolute('src/a.ts', '/w/acme/')).toBe('/w/acme/src/a.ts');
    expect(absolute('../b.ts', '/w/acme')).toBe('/w/b.ts');
    expect(absolute('/x/y', '/w')).toBe('/x/y');
  });

  it('a path in an answer is a link that asks to open it at its line; a code block stays code', () => {
    const onPath = vi.fn();
    const v = render(<Markdown text={'see `src/app/App.tsx:42` and\n\n```\nsrc/x.ts\n```'} onPath={onPath} />);
    const links = v.getAllByTestId('thread.path');
    expect(links).toHaveLength(1);
    fireEvent.click(links[0] as HTMLElement);
    expect(onPath).toHaveBeenCalledWith('src/app/App.tsx', 42);
  });
});

describe('code colors (tui-parity B15)', () => {
  it('a known language is tokenized into colored spans; its text stays exact; an unknown one stays plain', () => {
    const v = render(<Markdown text={'```rust\nfn main() { let x = "hi"; }\n```\n\n```zzz\nplain words\n```'} />);
    const pres = v.container.querySelectorAll('pre');
    expect(pres[0]?.querySelectorAll('span.token').length ?? 0).toBeGreaterThan(3);
    expect(pres[0]?.textContent).toBe('fn main() { let x = "hi"; }\n');
    expect(pres[1]?.querySelectorAll('span.token').length).toBe(0);
    expect(pres[1]?.textContent).toBe('plain words\n');
  });

  it("A.3 S16: an agent's message to main is '→ main' with its words; its question waits for the reply; main's card for it answers from the thread", () => {
    expect(toAgentName('gift-ui', 'main', true)).toBe('✉ gift-ui → main');
    expect(toAgentName('gift-ui', 'main', false)).toBe('gift-ui → main');
    const cmds: CoreCmd[] = [];
    const port: CorePort = { send: (c) => cmds.push(c), onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
    const store = new Store(port);
    store.setCore('up');
    const ask = 'gift cards: show the balance on the cart page, or only at checkout?';
    store.apply({ ev: 'entry', project: P, agent: 'gift-ui', entry: { pos: 7, at_ms: 1, kind: 'to_agent', text: 'done: the balance label', to: 'main', asks: false, msg: 8 } });
    store.apply({ ev: 'entry', project: P, agent: 'gift-ui', entry: { pos: 8, at_ms: 2, kind: 'to_agent', text: ask, to: 'main', asks: true, msg: 9 } });
    store.apply({
      ev: 'entry',
      project: P,
      agent: 'gift-ui',
      entry: { pos: 9, at_ms: 3, kind: 'card', text: ask, card: { id: 2, question: ask, options: [{ n: 1, label: 'on the cart page' }, { n: 2, label: 'only at checkout' }], answered: false } },
    });
    const ctx: RowCtx = { tkey: threadKey(P, 'gift-ui'), project: P, agent: 'gift-ui', bise: false, onLink: () => undefined, onArtifact: () => undefined };
    const v = render(
      <StoreProvider store={store}>
        <EntryRow ctx={ctx} pos={7} />
        <EntryRow ctx={ctx} pos={8} />
        <EntryRow ctx={ctx} pos={9} />
      </StoreProvider>,
    );
    // designer's tiers (m_19387, tier 4): every message between agents is the ✉ chip 'sender → receiver'
    expect(v.getByTestId('thread.to.7').textContent).toContain('✉ gift-ui → bise');
    expect(v.getByTestId('thread.to.7').textContent).toContain('done: the balance label');
    expect(v.queryByTestId('thread.asks.7')).toBeNull();
    expect(v.getByTestId('thread.to.8').textContent).toContain('✉ gift-ui → bise');
    expect(v.getByTestId('thread.to.8').textContent).toContain(ask);
    // main's card follows its ask: one copy of the question (on the ask); with b the inbox block is the one
    // place to answer, so the card is one dim line pointing there, no options (designer m_15612)
    expect(v.queryByTestId('thread.asks.8')).toBeNull();
    expect(v.getByTestId('thread.card.2').textContent).toBe('? waits for you · in the inbox below');
    expect(v.queryByTestId('thread.card.2.opt.2')).toBeNull();
    const opened: unknown[] = [];
    const off = onOpenInbox((at) => opened.push(at));
    fireEvent.click(v.getByTestId('thread.card.2'));
    off();
    expect(opened).toEqual([{ project: P, card: 2 }]);
    expect(cmds.some((c) => c.cmd === 'answer'), 'a click opens it in the inbox, never answers').toBe(false);
    // answered: one line, no options
    act(() => {
      store.apply({
        ev: 'entry',
        project: P,
        agent: 'gift-ui',
        entry: { pos: 9, at_ms: 3, kind: 'card', text: ask, card: { id: 2, question: ask, options: [{ n: 1, label: 'on the cart page' }, { n: 2, label: 'only at checkout' }], answered: true } },
      });
    });
    expect(v.getByTestId('thread.card.2').textContent).toContain('✓ answered');
    expect(v.queryByTestId('thread.card.2.opt.1')).toBeNull();
  });
});


describe('who a question waits for (ambient m_10689)', () => {
  it("an ask with no card waits for main, dim; the digits that answer a card read '1 or 2', '1, 2 or 3'", () => {
    const store = new Store(null);
    store.apply({ ev: 'entry', project: P, agent: 'gift-ui', entry: { pos: 4, at_ms: 1, kind: 'to_agent', text: 'which label?', to: 'main', asks: true, msg: 3 } });
    const ctx: RowCtx = { tkey: threadKey(P, 'gift-ui'), project: P, agent: 'gift-ui', bise: false, onLink: () => undefined, onArtifact: () => undefined };
    const v = render(
      <StoreProvider store={store}>
        <EntryRow ctx={ctx} pos={4} />
      </StoreProvider>,
    );
    expect(v.getByTestId('thread.asks.4').textContent).toBe('waits for bise');
    expect(v.getByTestId('thread.asks.4').className).toContain('main');
  });

  it("b: an open card's line in the thread points at the inbox block, the one place to answer (designer m_15612)", () => {
    const multi = ['which branch first?', '1 checkout', '2 gift-ui'].join(String.fromCharCode(10));
    expect(cardLine('bise', multi, false)).toBe('? bise asks: which branch first? · in the inbox below');
    expect(cardLine('perf', '', false)).toBe('? perf asks · in the inbox below');
    expect(cardLine('perf', 'which bench?', true)).toBe('? waits for you · in the inbox below');
  });
});

describe("amb-feed's batch 2 rows (b8cb4b1e: thinking, compaction, notices, not delivered, usage)", () => {
  const ctx: RowCtx = { tkey: threadKey(P, 'perf'), project: P, agent: 'perf', bise: false, onLink: () => undefined, onArtifact: () => undefined };
  const rowOf = (store: Store, pos: number) =>
    render(
      <StoreProvider store={store}>
        <EntryRow ctx={ctx} pos={pos} />
      </StoreProvider>,
    );

  it("thinking: the TUI's head words, folded, open to what it thought; a reply's own thinking rides on it", () => {
    expect([0, 3200, 12_000, 75_000].map(thoughtFor)).toEqual(['thought', 'thought for 3.2s', 'thought for 12s', 'thought for 1m15s']);
    const store = new Store(null);
    store.apply({ ev: 'entry', project: P, agent: 'perf', entry: { pos: 21, at_ms: 1, kind: 'thinking', text: 'thought for 3.2s', thinking: { ms: 3200, text: 'the cold run is the slow one' } } });
    store.apply({ ev: 'entry', project: P, agent: 'perf', entry: { pos: 22, at_ms: 2, kind: 'agent', text: 'done.', thinking: { ms: 900, text: 'check it twice' } } });
    const v = rowOf(store, 21);
    expect(v.getByTestId('thread.think.21.head').textContent).toContain('thought for 3.2s');
    expect(v.getByTestId('thread.think.21').textContent).not.toContain('the cold run');
    fireEvent.click(v.getByTestId('thread.think.21.head'));
    expect(v.getByTestId('thread.think.21').textContent).toContain('the cold run is the slow one');
    cleanup();
    // a thought with words shows under 1 s too, as the TUI's '∴ thought for 0.9s ▸' (ambient-lead m_20357)
    const r = rowOf(store, 22);
    expect(r.getByTestId('thread.think.22.head').textContent).toContain('thought for 0.9s');
    expect(r.getByTestId('thread.entry.22').textContent).toContain('done.');
    cleanup();
    // under 1 s with no words nothing was thought (ambient m_11777 (c)): the reply alone, a lone row none
    store.apply({ ev: 'entry', project: P, agent: 'perf', entry: { pos: 25, at_ms: 5, kind: 'agent', text: 'done.', thinking: { ms: 900, text: '' } } });
    store.apply({ ev: 'entry', project: P, agent: 'perf', entry: { pos: 26, at_ms: 6, kind: 'thinking', text: 'thought for 0.0s', thinking: { ms: 40, text: 'weighing the p99 window' } } });
    expect(rowOf(store, 25).queryByTestId('thread.think.25.head')).toBeNull();
    cleanup();
    // a fast '[[think: …]]' on the real core (qa-flows' rows-batch2): its row, open to its words
    const f = rowOf(store, 26);
    expect(f.getByTestId('thread.think.26.head').textContent).toContain('thought for 0.0s');
    fireEvent.click(f.getByTestId('thread.think.26.head'));
    expect(f.getByTestId('thread.think.26').textContent).toContain('weighing the p99 window');
    cleanup();
    store.apply({ ev: 'entry', project: P, agent: 'perf', entry: { pos: 23, at_ms: 3, kind: 'agent', text: 'done.', thinking: { ms: 1200, text: 'check it twice' } } });
    store.apply({ ev: 'entry', project: P, agent: 'perf', entry: { pos: 24, at_ms: 4, kind: 'thinking', text: 'thought for 0.0s', thinking: { ms: 0, text: '' } } });
    expect(rowOf(store, 23).getByTestId('thread.think.23.head').textContent).toContain('thought for 1.2s');
    cleanup();
    expect(rowOf(store, 24).queryByTestId('thread.think.24')).toBeNull();
  });

  it('compaction: a line while it runs, then the summary folded', () => {
    const store = new Store(null);
    store.apply({ ev: 'entry', project: P, agent: 'perf', entry: { pos: 22, at_ms: 1, kind: 'compacting', text: 'compacting' } });
    store.apply({ ev: 'entry', project: P, agent: 'perf', entry: { pos: 23, at_ms: 2, kind: 'compacted', text: 'we profiled the hub' } });
    expect(rowOf(store, 22).getByTestId('thread.compacting.22').textContent).toContain('compacting');
    cleanup();
    const v = rowOf(store, 23);
    expect(v.getByTestId('thread.compacted.23').textContent).not.toContain('we profiled');
    fireEvent.click(v.getByTestId('thread.compacted.23.head'));
    expect(v.getByTestId('thread.compacted.23').textContent).toContain('we profiled the hub');
  });

  it('a notice says its level in a glyph, not by color alone; an unknown kind is its words, dim', () => {
    const store = new Store(null);
    const levels = ['info', 'warn', 'err'] as const;
    levels.forEach((level, i) => {
      store.apply({ ev: 'entry', project: P, agent: 'perf', entry: { pos: 30 + i, at_ms: 1, kind: 'notice', text: `t ${level}`, notice: { level, text: `${level} words` } } });
    });
    store.apply({ ev: 'entry', project: P, agent: 'perf', entry: { pos: 40, at_ms: 1, kind: 'unknown', text: 'from a newer hub' } });
    levels.forEach((level, i) => {
      const n = rowOf(store, 30 + i).getByTestId(`thread.notice.${String(30 + i)}`);
      expect(n.dataset.level).toBe(level);
      expect(n.textContent).toBe(`${NOTICE_MARK[level]}${level} words`);
      cleanup();
    });
    expect(NOTICE_MARK.warn).toBe('▲');
    expect(NOTICE_MARK.err).toBe('✗');
    expect(rowOf(store, 40).getByTestId('thread.unknown.40').textContent).toBe('from a newer hub');
  });

  it('a reply cut off mid-stream (R40 Entry.cut) stays as he read it, dim; a whole reply is not dim', () => {
    const store = new Store(null);
    store.apply({ ev: 'entry', project: P, agent: 'perf', entry: { pos: 50, at_ms: 1, kind: 'agent', text: 'the warm run reads the ca', cut: true } });
    store.apply({ ev: 'entry', project: P, agent: 'perf', entry: { pos: 51, at_ms: 2, kind: 'agent', text: 'the warm run reads the cache.' } });
    const cut = rowOf(store, 50).getByTestId('thread.cut.50');
    expect(cut.className).toBe('th-cut');
    expect(cut.textContent).toContain('the warm run reads the ca');
    cleanup();
    expect(rowOf(store, 51).queryByTestId('thread.cut.51')).toBeNull();
  });

  it("the turn's '▲ turn interrupted (by main)' is the TUI's dim line, not the error tone; another warning keeps it", () => {
    const store = new Store(null);
    const warn = (pos: number, text: string) =>
      store.apply({ ev: 'entry', project: P, agent: 'perf', entry: { pos, at_ms: 1, kind: 'notice', text, notice: { level: 'warn', text } } });
    warn(60, 'turn interrupted by main');
    warn(61, 'turn interrupted');
    warn(62, 'context nearly full');
    for (const [pos, words] of [
      [60, '▲turn interrupted by main'],
      [61, '▲turn interrupted'],
    ] as const) {
      const n = rowOf(store, pos).getByTestId(`thread.notice.${String(pos)}`);
      expect(n.className).toBe('th-notice warn interrupted');
      expect(n.textContent).toBe(words);
      cleanup();
    }
    expect(rowOf(store, 62).getByTestId('thread.notice.62').className).toBe('th-notice warn');
  });

  it('not delivered: send again sends his words to that agent; esc drops it from view', () => {
    const cmds: CoreCmd[] = [];
    const port: CorePort = { send: (c) => cmds.push(c), onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
    const store = new Store(port);
    store.setCore('up');
    store.apply({ ev: 'entry', project: P, agent: 'perf', entry: { pos: 26, at_ms: 1, kind: 'not_delivered', text: 'then the warm run', not_delivered: { to: 'alerts', text: 'then the warm run' } } });
    const v = rowOf(store, 26);
    expect(v.getByTestId('thread.notdelivered.26').textContent).toContain('not delivered to alerts');
    fireEvent.click(v.getByTestId('thread.notdelivered.26.again'));
    expect(cmds.at(-1)).toMatchObject({ cmd: 'send', project: P, agent: 'alerts', text: 'then the warm run' });
    expect(v.getByTestId('thread.notdelivered.26').textContent).toContain('sent again');
    cleanup();
    const w = rowOf(store, 26);
    fireEvent.keyDown(w.getByTestId('thread.notdelivered.26'), { key: 'Escape' });
    expect(w.queryByTestId('thread.notdelivered.26')).toBeNull();
  });

  it("usage: the hub's gauge words in the head, named (designer D7: 'context 42k · 17%')", () => {
    const store = new Store(null);
    act(() => {
      store.apply({ ev: 'agents', project: P, agents: [ag('main'), ag('perf', { usage: { model: 'm', context: 42310, window: 256000, words: '42k · 17%', short: '17%' } })] });
    });
    const v = render(
      <StoreProvider store={store}>
        <RouterContext value={createRouter({ screen: 'bise' })}><ThreadScreen project={P} agent="perf" /></RouterContext>
      </StoreProvider>,
    );
    expect(v.getByTestId('thread.usage').textContent).toBe('context 42k · 17%');
  });
});

describe("the first-run text in main's empty thread (bar L1 / M18, amb-kit 29c5eb93)", () => {
  const screen = (store: Store, agent = 'main') =>
    render(
      <StoreProvider store={store}>
        <RouterContext value={createRouter({ screen: 'bise' })}><ThreadScreen project={P} agent={agent} /></RouterContext>
      </StoreProvider>,
    );
  const thread = (store: Store, entries: { pos: number; kind: 'you' | 'agent'; text: string }[]) => {
    act(() => {
      store.apply({ ev: 'thread', project: P, agent: 'main', entries: entries.map((e) => ({ ...e, at_ms: 1 })), before: null, more: false });
    });
  };

  it("shows while he said nothing and main is the only agent; not in another agent's thread", () => {
    const store = new Store(null);
    act(() => {
      store.apply({ ev: 'agents', project: P, agents: [ag('main'), ag('old', { archived: true })] });
    });
    thread(store, [{ pos: 1, kind: 'agent', text: 'hi.' }]);
    expect(screen(store).getByTestId('setup.firstrun').textContent).toContain('show me what you can do');
    cleanup();
    expect(screen(store, 'old').queryByTestId('setup.firstrun')).toBeNull();
  });

  it('gone once he said something, or once another agent runs', () => {
    const said = new Store(null);
    act(() => {
      said.apply({ ev: 'agents', project: P, agents: [ag('main')] });
    });
    thread(said, [{ pos: 1, kind: 'you', text: 'hello' }]);
    expect(screen(said).queryByTestId('setup.firstrun')).toBeNull();
    cleanup();
    const busy = new Store(null);
    act(() => {
      busy.apply({ ev: 'agents', project: P, agents: [ag('main'), ag('perf')] });
    });
    thread(busy, []);
    expect(screen(busy).queryByTestId('setup.firstrun')).toBeNull();
  });
});
