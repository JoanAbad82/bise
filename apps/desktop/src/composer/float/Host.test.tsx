// @vitest-environment happy-dom
// The floating composer (page native-mac §6, mockups 6-8): where it shows, its three states, the
// dock's jobs it took (^1-3 open the n-th waiting ask in it, with its answer buttons), and nothing
// clips its shadow.
import type { ReactNode } from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CoreCmd, CorePort } from '@/shared/api';
import { core_ev } from '@/proto/fixtures.gen';
import { replay, Store, StoreProvider } from '@/store';
import { createRouter, RouterContext } from '@/app/router';
import type { Route } from '@/app/route';
import { noClip } from '@/ds/noclip';
import { FloatHost } from './Host';

vi.mock('@/composer', () => ({
  // the field is the composer's own (its tests); here a focusable stand-in that says its placeholder
  Composer: ({ placeholder, testId }: { placeholder?: string; head?: ReactNode; testId?: string }) => (
    <div data-testid={testId}>
      <input data-testid="composer.field" placeholder={placeholder} />
    </div>
  ),
  useComposerSources: () => ({ agents: [], skills: [], commands: [], files: () => Promise.resolve([]), saveImage: () => Promise.resolve(null) }),
  useApprovalsFlash: () => false,
  flashWords: () => ({ word: '', rest: '' }),
}));

afterEach(cleanup);

const mount = (route: Route) => {
  const sent: CoreCmd[] = [];
  const port: CorePort = { send: (c) => sent.push(c), onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
  const store = new Store(port);
  replay(store, core_ev);
  const v = render(
    <StoreProvider store={store}>
      <RouterContext value={createRouter(route)}>
        <FloatHost />
      </RouterContext>
    </StoreProvider>,
  );
  return { ...v, sent };
};

const state = (v: ReturnType<typeof mount>) => v.getByTestId('composer.float').dataset['state'];

describe('FloatHost', () => {
  it("on a page that is no thread: a pill at rest writing to bise's main; none on a thread or bise's view", () => {
    const v = mount({ screen: 'inbox' });
    expect(state(v)).toBe('rest');
    expect(v.getByTestId('composer.float').dataset['agent']).toBe('main');
    expect(v.getByTestId('composer.field').getAttribute('placeholder')).toBe('write to bise, then ⏎');
    expect(v.queryByTestId('composer.float.head'), 'no head at rest').toBeNull();
    cleanup();
    expect(mount({ screen: 'thread', project: 'acme-1a2b3c4d', agent: 'perf' }).queryByTestId('composer.float')).toBeNull();
    cleanup();
    expect(mount({ screen: 'bise' }).queryByTestId('composer.float')).toBeNull();
  });

  it("its three states: focus brings the head ('to bise ⌄', ─, the grip), the grip opens the mini thread, esc and ─ fold it back", () => {
    const v = mount({ screen: 'scheduled' });
    fireEvent.focus(v.getByTestId('composer.field'));
    expect(state(v)).toBe('focus');
    expect(v.getByTestId('composer.float.to').textContent).toContain('to bise');
    fireEvent.click(v.getByTestId('composer.float.grip'));
    expect(state(v)).toBe('open');
    expect(v.getByTestId('composer.float.thread')).toBeTruthy();
    fireEvent.keyDown(v.getByTestId('composer.float.grip'), { key: 'Escape' });
    expect(state(v), 'esc on its controls folds it too').toBe('rest');
    fireEvent.focus(v.getByTestId('composer.field'));
    fireEvent.click(v.getByTestId('composer.float.fold'));
    expect(state(v)).toBe('rest');
    fireEvent.focus(v.getByTestId('composer.field'));
    fireEvent.pointerDown(document.body);
    expect(state(v), 'a press outside folds it').toBe('rest');
  });

  it("a project's page writes to its main", () => {
    const v = mount({ screen: 'agents', project: 'acme-1a2b3c4d' });
    expect(v.getByTestId('composer.float').dataset['project']).toBe('acme-1a2b3c4d');
    expect(v.getByTestId('composer.float').dataset['agent']).toBe('main');
  });

  it('^1 opens the first waiting ask in it, with its answer buttons, and unfolds it', () => {
    const v = mount({ screen: 'inbox' });
    act(() => {
      fireEvent.keyDown(window, { key: '1', code: 'Digit1', ctrlKey: true });
    });
    expect(state(v)).toBe('focus');
    expect(v.getByTestId('composer.float').querySelector('[data-testid="inbox.block"][data-open]')).not.toBeNull();
  });

  it('nothing above it clips its shadow (it is mounted at the root, fixed)', () => {
    const v = mount({ screen: 'inbox' });
    noClip(v.getByTestId('composer.float'));
  });
});
