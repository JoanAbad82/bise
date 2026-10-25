// @vitest-environment happy-dom
// The empty home (mockup 5, designer's pick (c)): over main's empty thread, the question in bise's
// voice with its project a picker, the line of what goes on, the ideas that fill the composer.
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { replay, Store, StoreProvider, threadKey } from '@/store';
import { core_ev } from '@/proto/fixtures.gen';
import { createRouter, RouterContext } from '@/app/router';
import { Home, useHomeShows } from './Home';

afterEach(cleanup);

const P = 'acme-1a2b3c4d';

const mount = (project: string | null) => {
  const store = new Store(null);
  replay(store, core_ev);
  const router = createRouter({ screen: 'thread', project: P, agent: 'main' });
  const idea = vi.fn();
  const v = render(
    <StoreProvider store={store}>
      <RouterContext value={router}>
        <Home project={project} onIdea={idea} />
      </RouterContext>
    </StoreProvider>,
  );
  return { v, router, idea, store };
};

describe('the empty home', () => {
  it("a project's main asks what to build in it, its name a picker; the line says who works and what waits", () => {
    const { v } = mount(P);
    expect(v.getByTestId('composer.home.question').textContent).toBe('what should we build in acme?');
    expect(v.getByTestId('composer.home.project').textContent).toBe('acme');
    // what waits: the inbox block's own count and words, its number in the accent (designer m_43577)
    expect(v.getByTestId('composer.home.line').textContent).toBe('1 agent working · 2 waiting for you');
    expect(v.getByTestId('composer.home.waits').querySelector('.cmp-home-n')?.textContent).toBe('2');
  });

  it("bise's own main asks what to work on; an idea fills the composer, never a send", () => {
    const { v, idea } = mount(null);
    expect(v.getByTestId('composer.home.question').textContent).toBe('what should we work on?');
    fireEvent.click(v.getByTestId('composer.home.idea.2'));
    expect(idea).toHaveBeenCalledWith('show me what you can do');
  });

  it('shows on an empty main thread only, and goes at his first words', () => {
    const store = new Store(null);
    const seen: boolean[] = [];
    function Probe() {
      seen.push(useHomeShows(threadKey(P, 'main'), 'main'));
      return null;
    }
    render(<StoreProvider store={store}><Probe /></StoreProvider>);
    act(() => {
      store.apply({ ev: 'thread', project: P, agent: 'main', entries: [], before: null, more: false });
    });
    expect(seen.at(-1)).toBe(true);
    act(() => {
      store.apply({ ev: 'thread', project: P, agent: 'main', entries: [{ pos: 1, kind: 'you', text: 'hello', at_ms: 1 }], before: null, more: false });
    });
    expect(seen.at(-1)).toBe(false);
  });
});

