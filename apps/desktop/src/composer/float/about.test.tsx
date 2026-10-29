// @vitest-environment happy-dom
// float-about (his m_47259): the floating composer over an artifact in front of the full-width
// panel behaves as the docked composer beside an open artifact (artifacts/maker.ts aboutWords):
// it writes to the artifact's maker (the project's main when archived), his words go as
// 'about [title](url): …', and the pink follows the addressee.
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Agent, Artifact } from '@/proto';
import type { CoreCmd, CorePort } from '@/shared/api';
import { core_ev } from '@/proto/fixtures.gen';
import { replay, Store, StoreProvider } from '@/store';
import { createRouter, RouterContext } from '@/app/router';
import { FOLDED } from '@/app/panel/model';
import { EMPTY_REC, putView, switchTo } from '@/app/panel/scope';
import { panelState } from '@/app/panel/state';
import { aboutText } from '@/thread/about';
import { FloatHost } from './Host';

/** what the field was given last: its placeholder, its pink, its notice line and its send */
let field: { placeholder?: string; answering?: boolean; line?: unknown; onSend?: (out: { text: string }) => void } = {};

vi.mock('@/composer', () => ({
  // the field is the composer's own (its tests); here a stand-in that keeps its props
  Composer: (p: { placeholder?: string; answering?: boolean; line?: unknown; onSend?: (out: { text: string }) => void; testId?: string }) => {
    Object.assign(field, { placeholder: p.placeholder, answering: p.answering, line: p.line, onSend: p.onSend });
    return <div data-testid={p.testId} />;
  },
  useComposerSources: () => ({ agents: [], skills: [], commands: [], files: () => Promise.resolve([]), saveImage: () => Promise.resolve(null) }),
  useApprovalsFlash: () => false,
  flashWords: () => ({ word: '', rest: '' }),
}));

const P = 'acme-1a2b3c4d';
const HOME = 'bise-home-00000000';
const PAGE: Artifact = { id: 'rates', kind: 'page', title: 'taux et prêts', agent: 'taux-immo', version: 5, at_ms: 1791100000000, url: 'http://127.0.0.1:7841/p/rates', new: false };
const agent = (name: string, archived = false): Agent => ({ name, dir: name, main: name === 'main', status: 'idle', archived, title: '', purpose: '', since_ms: 1, waits: 0, watching: [] });

beforeEach(() => {
  // wide enough for a full-width panel (under 1100 it is a sheet, never full)
  Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true });
  localStorage.clear();
  const tab = { id: `artifact:${P}:${PAGE.id}`, what: { kind: 'thing' as const, e: { kind: 'artifact' as const, project: P, id: PAGE.id } } };
  panelState.reset(putView(switchTo(EMPTY_REC, HOME), { ...FOLDED, open: true, full: true, tabs: { list: [tab], active: tab.id } }));
  field = {};
});
afterEach(cleanup);

function mount(archived = false) {
  const sent: CoreCmd[] = [];
  const port: CorePort = { send: (c) => sent.push(c), onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
  const store = new Store(port);
  store.setCore('up');
  replay(store, core_ev);
  store.apply({ ev: 'artifacts', project: P, items: [PAGE] });
  store.apply({ ev: 'agents', project: P, agents: [agent('main'), agent('taux-immo', archived)] });
  // bise's own view behind the panel (his screenshot): the float wrote to bise
  const v = render(
    <StoreProvider store={store}>
      <RouterContext value={createRouter({ screen: 'bise' })}>
        <FloatHost />
      </RouterContext>
    </StoreProvider>,
  );
  return { ...v, sent, store };
}

const send = (text: string) => {
  act(() => {
    field.onSend?.({ text });
  });
};

describe('the float over an artifact in front of the full-width panel', () => {
  it("writes to its maker, about it, pink: the docked composer's rule", () => {
    const v = mount();
    const float = v.getByTestId('composer.float');
    expect([float.dataset['project'], float.dataset['agent']]).toEqual([P, 'taux-immo']);
    expect(field.answering, "a live sub-agent: the composer's pink").toBe(true);
    expect(field.placeholder).toContain('taux-immo');
    send('make a simpler version');
    expect(v.sent).toContainEqual(expect.objectContaining({ project: P, agent: 'taux-immo', text: aboutText(PAGE, 'make a simpler version') }));
  });

  it("an archived maker: the project's main, plain, still about it (as the docked composer)", () => {
    const v = mount(true);
    expect(v.getByTestId('composer.float').dataset['agent']).toBe('main');
    expect(field.answering).toBeFalsy();
    send('who made this?');
    expect(v.sent).toContainEqual(expect.objectContaining({ project: P, agent: 'main', text: aboutText(PAGE, 'who made this?') }));
  });

  it("the hub's plain line (a flow hint) stays the thread's: not on the float over an artifact; a refusal still shows (designer m_47289)", () => {
    const v = mount();
    act(() => {
      v.store.apply({ ev: 'notice', project: P, text: 'flow: lands on main · straight to main, tested commits' });
    });
    expect(field.line ?? null).toBeNull();
    act(() => {
      v.store.apply({ ev: 'error', project: P, cmd: 'slash', text: 'no such command' });
    });
    expect(field.line).toEqual(expect.objectContaining({ level: 'err' }));
  });
});
