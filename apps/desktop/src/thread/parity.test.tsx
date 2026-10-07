// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Agent } from '@/proto';
import type { CoreCmd, CorePort } from '@/shared/api';
import { Store, StoreProvider, replay, threadKey } from '@/store';
import { placesOf } from '@/review/EnvironmentsScreen';
import { Markdown, langOf } from './Markdown';
import { newAtEnd } from './ThreadList';
import { EntryRow, foldOf, toAgentName, type RowCtx } from './rows';
import { countsOf, ThreadScreen } from './ThreadScreen';
import { createRouter, RouterContext } from '@/app/router';

vi.mock('@/composer', () => ({
  Composer: () => <div data-testid="composer" />,
  useComposerSources: () => ({ agents: [], skills: [], commands: [], files: () => Promise.resolve([]), saveImage: () => Promise.resolve(null) }),
}));

afterEach(cleanup);

const P = 'acme-1a2b3c4d';
const ag = (name: string, over: Partial<Agent> = {}): Agent => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1, waits: 0, ...over });

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
    const ctx: RowCtx = { tkey: threadKey(P, 'perf'), project: P, agent: 'perf', bise: false, onLink: () => undefined };
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
    expect(countsOf([ag('main', { waits: 1 }), ag('a', { status: 'working' }), ag('b', { waits: 1 }), ag('c', { archived: true })])).toBe('2 agents · 1 at work · 2 waiting');
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
    const ctx: RowCtx = { tkey: threadKey(P, 'gift-ui'), project: P, agent: 'gift-ui', bise: false, onLink: () => undefined };
    const v = render(
      <StoreProvider store={store}>
        <EntryRow ctx={ctx} pos={7} />
        <EntryRow ctx={ctx} pos={8} />
        <EntryRow ctx={ctx} pos={9} />
      </StoreProvider>,
    );
    expect(v.getByTestId('thread.to.7').textContent).toContain('gift-ui → main');
    expect(v.getByTestId('thread.to.7').textContent).not.toContain('✉');
    expect(v.queryByTestId('thread.asks.7')).toBeNull();
    expect(v.getByTestId('thread.to.8').textContent).toContain('✉ gift-ui → main');
    expect(v.getByTestId('thread.to.8').textContent).toContain(ask);
    expect(v.getByTestId('thread.asks.8').textContent).toBe('waits for the reply');
    expect(v.getByTestId('thread.card.2').textContent).toContain(ask);
    fireEvent.click(v.getByTestId('thread.card.2.opt.2'));
    expect(cmds).toContainEqual(expect.objectContaining({ cmd: 'answer', project: P, card: 2, reply: '2' }));
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

