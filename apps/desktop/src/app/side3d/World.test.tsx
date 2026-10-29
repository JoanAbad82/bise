// @vitest-environment happy-dom
// The side tile's office asks the core for its project's plugins itself: the core sends a list only
// when asked, so the tile drew no plugin object until the Office tab asked (his m_49375: the
// Climbing gym's wing stood empty until he opened the office big and closed it).
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CorePort } from '@/shared/api';
import { Store, StoreProvider } from '@/store';
import type { PluginObject } from '@/bims/plugin-objects';
import { WorldOffice } from './World';

// the office's renderer needs WebGL: a stand-in that keeps the objects it was given
const drawn = vi.hoisted(() => ({ objects: [] as (readonly PluginObject[])[] }));
vi.mock('@/bims/Office', () => ({
  Office: ({ objects }: { objects: readonly PluginObject[] }) => {
    drawn.objects.push(objects);
    return <canvas data-testid="office" />;
  },
}));

afterEach(() => {
  cleanup();
  drawn.objects.length = 0;
});

const ACME = 'acme-1a2b3c4d';

describe('the side tile office', () => {
  it("asks for its project's plugins on mount, and draws their objects when they come", () => {
    const port: CorePort = { send: () => undefined, onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
    const store = new Store(port);
    store.setCore('up');
    const sent = vi.spyOn(store, 'command');
    render(
      <StoreProvider store={store}>
        <WorldOffice project={ACME} agents={[]} cards={[]} />
      </StoreProvider>,
    );
    expect(sent).toHaveBeenCalledWith({ cmd: 'plugins', project: ACME });
    expect(drawn.objects.at(-1)).toEqual([]);
  });
});
