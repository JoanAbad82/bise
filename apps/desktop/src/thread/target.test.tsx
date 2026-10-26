import type { ReactNode } from 'react';
// @vitest-environment happy-dom
// Whom his words go to, clear at a glance (his ask m_44704, as main's tab had it, designer m_28208):
// a thread of an agent that is not main says 'to perf' first in its composer's strip, in the
// accent; main's own thread says no name. The strip as ThreadScreen draws it (the field mocked).
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Agent } from '@/proto';
import { Store, StoreProvider } from '@/store';
import { createRouter, RouterContext } from '@/app/router';
import { ThreadScreen } from './ThreadScreen';
import { toAccent } from './ThreadComposer';

vi.mock('@/composer', () => ({
  Composer: ({ head }: { head?: ReactNode }) => <div data-testid="composer">{head}</div>,
  useComposerSources: () => ({ agents: [], skills: [], commands: [], files: () => Promise.resolve([]), saveImage: () => Promise.resolve(null) }),
  useApprovalsFlash: () => false,
  flashWords: () => ({ word: '', rest: '' }),
}));

afterEach(cleanup);

const P = 'acme-1a2b3c4d';
const ag = (name: string, over: Partial<Agent> = {}): Agent => ({ name, dir: name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1, waits: 0, watching: [], ...over });

function strip(agent: string, over: Partial<Agent> = {}) {
  const store = new Store(null);
  act(() => {
    store.apply({ ev: 'agents', project: P, agents: [ag('main', agent === 'main' ? over : {}), ag('native-lead', agent === 'main' ? {} : over)] });
  });
  return render(
    <StoreProvider store={store}>
      <RouterContext value={createRouter({ screen: 'thread', project: P, agent })}>
        <ThreadScreen project={P} agent={agent} />
      </RouterContext>
    </StoreProvider>,
  );
}

describe("the composer names an agent that is not main, in the accent (his ask m_44704)", () => {
  it("a sub-agent's thread: 'to native-lead' first in the strip, the accent's item", () => {
    const v = strip('native-lead');
    const to = v.getByTestId('composer.ctx.to');
    expect(to.textContent).toBe('to native-lead');
    // the accent is the `.it.to` item's (composer.css): its class, the strip's first item
    expect(to.classList.contains('to')).toBe(true);
    expect(v.getByTestId('composer.ctx').firstElementChild).toBe(to);
  });

  it("an open item his words close ('to perf · the approval waits for 1 or 2'): 'to perf' in the accent too, never main's, never over a question's own pink (designer m_44890)", () => {
    const item = { project: P, card: 10, asker: 'perf', free: 'deny' as const };
    expect(toAccent({ pink: false, quiet: false }, null, item)).toBe(true);
    expect(toAccent({ pink: false, quiet: false }, null, { ...item, asker: 'main' })).toBe(false);
    expect(toAccent({ pink: true, quiet: false }, null, { project: P, card: 9, asker: 'perf' })).toBe(false);
    expect(toAccent({ pink: true, quiet: true }, null, null)).toBe(true);
    expect(toAccent({ pink: true, quiet: true }, 'docs', null)).toBe(false);
    expect(toAccent({ pink: false, quiet: false }, null, null)).toBe(false);
  });

  it("main's own thread: no name in the strip, nothing in the accent", () => {
    const v = strip('main');
    expect(v.queryByTestId('composer.ctx.to')).toBeNull();
  });
});

describe("the strip says the addressee's state where 'local' was (his m_44719)", () => {
  it("running: main's breath (WorkingMark) and 'working · 3 min'", () => {
    const v = strip('native-lead', { status: 'working', turn_ms: 180_000 });
    const st = v.getByTestId('composer.ctx.state');
    expect(st.dataset['state']).toBe('working');
    expect(v.getByTestId('composer.ctx.state.mark').dataset['mark']).toBe('working');
    expect(st.querySelectorAll('.wk-sign').length).toBe(1);
    expect(st.textContent).toContain('working · 3 min');
  });

  it("something waits on him: the ask mark and 'waits for you', no breath", () => {
    const v = strip('main', { waits: 1, status: 'working', turn_ms: 1_000 });
    const st = v.getByTestId('composer.ctx.state');
    expect(st.dataset['state']).toBe('waits');
    expect(st.textContent).toContain('waits for you');
    expect(st.querySelector('.wk-sign')).toBeNull();
  });

  it("idle: nothing at all; and no 'local' place control anywhere in the composer", () => {
    for (const agent of ['main', 'native-lead']) {
      const v = strip(agent);
      expect(v.queryByTestId('composer.ctx.state')).toBeNull();
      expect(v.queryByTestId('composer.ctx.place')).toBeNull();
      expect(v.getByTestId('composer').textContent).not.toMatch(/\blocal\b/u);
      cleanup();
    }
  });
});
