import type { ReactNode } from 'react';
// @vitest-environment happy-dom
// Files dragged over a thread (his m_44892): ONE zone over the rows AND the composer, not the rows
// alone. A drag over the composer shows it; a drop gives each file to the agent once and goes on
// to the window once, where the composer makes the chips (paste.ts useDropAnywhere: over the zone
// the field never takes it). The screen as ThreadScreen draws it, the composer's field mocked.
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Agent } from '@/proto';
import { Store, StoreProvider } from '@/store';
import { createRouter, RouterContext } from '@/app/router';
import { ThreadScreen } from './ThreadScreen';

vi.mock('@/composer', () => ({
  Composer: ({ head }: { head?: ReactNode }) => <div data-testid="composer">{head}</div>,
  useComposerSources: () => ({ agents: [], skills: [], commands: [], files: () => Promise.resolve([]), saveImage: () => Promise.resolve(null) }),
  useApprovalsFlash: () => false,
  flashWords: () => ({ word: '', rest: '' }),
}));

afterEach(() => {
  cleanup();
  delete (globalThis as { bise?: unknown }).bise;
});

const P = 'acme-1a2b3c4d';
const ag = (name: string): Agent => ({ name, dir: name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1, waits: 0, watching: [] });
const files = (names: string[]) => ({ types: ['Files'], files: names.map((n) => ({ name: n })), items: names.map(() => ({ kind: 'file' })), dropEffect: 'none' });

function screen() {
  (globalThis as { bise?: unknown }).bise = { filePath: (f: { name: string }) => `/u/me/${f.name}` };
  const store = new Store(null);
  act(() => {
    store.apply({ ev: 'agents', project: P, agents: [ag('main'), ag('perf')] });
  });
  const added: string[] = [];
  vi.spyOn(store, 'addArtifact').mockImplementation((_p, _a, path) => {
    added.push(path);
  });
  const v = render(
    <StoreProvider store={store}>
      <RouterContext value={createRouter({ screen: 'thread', project: P, agent: 'perf' })}>
        <ThreadScreen project={P} agent="perf" />
      </RouterContext>
    </StoreProvider>,
  );
  return { v, added };
}

describe('one drop zone over the thread and its composer (his m_44892)', () => {
  it('a drag over the composer shows the zone, and it covers the composer as well as the rows', () => {
    const { v } = screen();
    expect(v.queryByTestId('thread.give')).toBeNull();
    act(() => {
      fireEvent.dragEnter(v.getByTestId('composer'), { dataTransfer: files(['q3.png']) });
    });
    const zone = v.getByTestId('thread.give');
    // the zone is the screen's, over both: its box is the section that holds the rows and the composer
    expect(zone.parentElement).toBe(v.getByTestId('thread.screen'));
    expect(zone.parentElement?.contains(v.getByTestId('composer'))).toBe(true);
    expect(zone.closest('.th-main')).toBeNull();
  });

  it('a drop on it (over the composer or the rows): each file to the agent once, and on to the window once (the chips)', () => {
    const { v, added } = screen();
    const onWindow = vi.fn();
    window.addEventListener('drop', onWindow);
    act(() => {
      fireEvent.dragEnter(window, { dataTransfer: files(['q3.png', 'deck.pdf']) });
    });
    fireEvent.drop(v.getByTestId('thread.give'), { dataTransfer: files(['q3.png', 'deck.pdf']) });
    expect(added).toEqual(['/u/me/q3.png', '/u/me/deck.pdf']);
    expect(onWindow).toHaveBeenCalledTimes(1);
    expect(v.queryByTestId('thread.give')).toBeNull();
    window.removeEventListener('drop', onWindow);
  });
});
