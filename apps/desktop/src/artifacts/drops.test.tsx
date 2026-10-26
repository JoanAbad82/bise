// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Store, StoreProvider } from '@/store';
import { AddButton, AddDrop, ThreadDrop, useAddPlace } from './Drops';
import { LiveStrip } from './Open';
import { giveWords } from './give';

afterEach(() => {
  cleanup();
  delete (globalThis as { bise?: unknown }).bise;
});

function world() {
  const store = new Store(null);
  store.apply({ ev: 'projects', projects: [{ project: 'home-1', name: 'home', path: '/x/home', home: true }, { project: 'shop-1', name: 'storefront', path: '/x/shop' }] });
  const added: string[][] = [];
  vi.spyOn(store, 'addArtifact').mockImplementation((p, a, path) => {
    added.push([p, a, path]);
  });
  return { store, added };
}

const files = (names: string[]) => ({ types: ['Files'], files: names.map((n) => ({ name: n })), items: names.map(() => ({ kind: 'file' })), dropEffect: 'none' });
const paths: Record<string, string> = { 'q3.xlsx': '/u/me/q3.xlsx', 'deck.pptx': '/u/me/deck.pptx' };
const bridge = (pick: string[] = []) => {
  (globalThis as { bise?: unknown }).bise = { filePath: (f: { name: string }) => paths[f.name] ?? '', pickFiles: () => Promise.resolve(pick) };
};

function Listed({ project }: { project: string }) {
  const place = useAddPlace(project);
  return (
    <>
      <AddButton place={place} testId="t.add" />
      <AddDrop place={place} testId="t.drop">
        <div data-testid="t.rows" />
      </AddDrop>
    </>
  );
}

describe('giving files (designer m_23868, m_23898)', () => {
  it("a drop on a thread's rows: the zone only while he drags files, each file an artifact of that agent, and the drop goes on to the composer", () => {
    bridge();
    const { store, added } = world();
    const onWindow = vi.fn();
    window.addEventListener('drop', onWindow);
    render(<StoreProvider store={store}><div data-testid="rows"><ThreadDrop project="shop-1" agent="perf" to="perf" /></div></StoreProvider>);
    expect(screen.queryByTestId('thread.give')).toBeNull();
    act(() => {
      fireEvent.dragEnter(window, { dataTransfer: files(['q3.xlsx', 'deck.pptx']) });
    });
    expect(screen.getByTestId('thread.give').textContent).toBe(giveWords(2, 'perf'));
    fireEvent.drop(screen.getByTestId('thread.give'), { dataTransfer: files(['q3.xlsx', 'deck.pptx']) });
    expect(added).toEqual([['shop-1', 'perf', '/u/me/q3.xlsx'], ['shop-1', 'perf', '/u/me/deck.pptx']]);
    // not stopped: the composer's window drop makes the same files its chips
    expect(onWindow).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('thread.give')).toBeNull();
    window.removeEventListener('drop', onWindow);
  });

  it("screenshots dragged: the zone says 'these 2 images'; one pdf among them, files (designer m_45234)", () => {
    bridge();
    const { store } = world();
    render(<StoreProvider store={store}><ThreadDrop project="shop-1" agent="perf" to="perf" /></StoreProvider>);
    const typed = (types: string[]) => ({ types: ['Files'], files: [], items: types.map((type) => ({ kind: 'file', type })), dropEffect: 'none' });
    act(() => {
      fireEvent.dragEnter(window, { dataTransfer: typed(['image/png', 'image/png']) });
    });
    expect(screen.getByTestId('thread.give').textContent).toBe(giveWords(2, 'perf', undefined, true));
    act(() => {
      fireEvent.dragEnter(window, { dataTransfer: typed(['image/png', 'application/pdf']) });
    });
    expect(screen.getByTestId('thread.give').textContent).toBe(giveWords(2, 'perf'));
  });

  it('a drag of words, not files, shows no zone', () => {
    bridge();
    const { store } = world();
    render(<StoreProvider store={store}><ThreadDrop project="shop-1" agent="perf" to="perf" /></StoreProvider>);
    act(() => {
      fireEvent.dragEnter(window, { dataTransfer: { types: ['text/plain'], items: [] } });
    });
    expect(screen.queryByTestId('thread.give')).toBeNull();
  });

  it("'+ add' picks files and adds them to the picked project's main; a drop on the list too, and never reaches the composer", async () => {
    bridge(['/u/me/q3.xlsx']);
    const { store, added } = world();
    const onWindow = vi.fn();
    window.addEventListener('drop', onWindow);
    render(<StoreProvider store={store}><Listed project="shop-1" /></StoreProvider>);
    const add = screen.getByTestId('t.add');
    expect(add.getAttribute('data-tip')).toBe('add a file to storefront');
    await act(async () => {
      fireEvent.click(add);
      await Promise.resolve();
    });
    expect(added).toEqual([['shop-1', 'main', '/u/me/q3.xlsx']]);
    act(() => {
      fireEvent.dragEnter(window, { dataTransfer: files(['deck.pptx']) });
    });
    expect(screen.getByTestId('t.drop.zone').textContent).toBe('drop to add it to storefront');
    fireEvent.drop(screen.getByTestId('t.rows'), { dataTransfer: files(['deck.pptx']) });
    expect(added.at(-1)).toEqual(['shop-1', 'main', '/u/me/deck.pptx']);
    expect(onWindow).not.toHaveBeenCalled();
    window.removeEventListener('drop', onWindow);
  });

  it("with 'all projects' the list adds to bise's own home", () => {
    bridge();
    const { store } = world();
    render(<StoreProvider store={store}><Listed project="" /></StoreProvider>);
    expect(screen.getByTestId('t.add').getAttribute('data-tip')).toBe('add a file to bise');
  });

  it('no picker in the bridge (a plain browser): no + add', () => {
    const { store } = world();
    render(<StoreProvider store={store}><Listed project="shop-1" /></StoreProvider>);
    expect(screen.queryByTestId('t.add')).toBeNull();
  });
});

describe("the hub's live words under the head (art-live)", () => {
  it('draws the strip while the maker works, then the line and its back link; the line goes once he moved away', () => {
    const backs: number[][] = [];
    const { rerender } = render(<LiveStrip live={{ strip: '∿ analyst is updating · Summary' }} gone={null} onBack={() => undefined} />);
    expect(screen.getByTestId('artifact.live').textContent).toBe('∿ analyst is updating · Summary');
    const live = { line: 'v5 · 3 cells changed', back: { text: '← v4', v: 4 } };
    rerender(<LiveStrip live={live} gone={null} onBack={(v, line) => { backs.push([v, line.length]); }} />);
    expect(screen.getByTestId('artifact.live').textContent).toBe('v5 · 3 cells changed← v4');
    fireEvent.click(screen.getByTestId('artifact.live.back'));
    expect(backs).toEqual([[4, live.line.length]]);
    rerender(<LiveStrip live={live} gone={live.line} onBack={() => undefined} />);
    expect(screen.queryByTestId('artifact.live')).toBeNull();
    rerender(<LiveStrip live={null} gone={null} onBack={() => undefined} />);
    expect(screen.queryByTestId('artifact.live')).toBeNull();
  });
});
