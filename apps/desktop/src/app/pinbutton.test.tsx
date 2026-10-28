// @vitest-environment happy-dom
// The pin's state at a glance and its click's feedback (artifact-pin, his m_49499, designer
// m_49505): pinned is the filled pin, the outline only the offer; a click flips the glyph and the
// tip at once, before the hub's echo; a refused prefs_set flips it back with 'Couldn't pin'; the
// list keeps its order under the pointer until it leaves the card (pinhold.ts).
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { CoreCmd, CorePort } from '@/shared/api';
import { Store, StoreProvider } from '@/store';
import { menus } from '@/proto/words_menus.gen';
import { PinButton, PinMark, pinTip, shownOn } from './pinbutton';
import { usePins, pinnedIn } from './pins';
import { heldSet, resetHolds, slidesOf, usePinOrder } from './pinhold';

const P = 'acme-1a2b3c4d';

function setup(pins: readonly string[] = []) {
  const cmds: CoreCmd[] = [];
  const port: CorePort = { send: (c) => cmds.push(c), onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
  const store = new Store(port);
  store.setCore('up');
  store.apply({ ev: 'prefs', prefs: { pins_art: { [P]: pins } } });
  return { store, cmds };
}

/** a row as the side's: its pin from the prefs, the order its list keeps */
function Row({ id }: { id: string }) {
  const on = pinnedIn(usePins('artifact'), P, id);
  const order = pinnedIn(usePinOrder('artifact'), P, id);
  return (
    <div className="s3-card">
      <div className="s3-row" data-leads={order || undefined} data-testid="row">
        <PinButton pin={{ kind: 'artifact', project: P, id, on }} testId="pin" />
      </div>
    </div>
  );
}

const icon = (el: HTMLElement) => el.querySelector('svg')?.getAttribute('data-icon');

afterEach(() => {
  cleanup();
  resetHolds();
});

describe('the pin at a glance', () => {
  it('pinned is the filled pin with the tip Unpin; unpinned the outline with Pin; never a pressed square', () => {
    const { store } = setup(['changelog']);
    const { getByTestId } = render(<StoreProvider store={store}><Row id="changelog" /></StoreProvider>);
    expect(icon(getByTestId('pin'))).toBe('pin-on');
    expect(getByTestId('pin').getAttribute('aria-label')).toBe(menus.unpin);
    cleanup();
    const off = setup([]);
    const r = render(<StoreProvider store={off.store}><Row id="changelog" /></StoreProvider>);
    expect(icon(r.getByTestId('pin'))).toBe('pin');
    expect(r.getByTestId('pin').getAttribute('aria-label')).toBe(menus.pin);
  });

  it('a pinned row’s mark at rest is the filled pin', () => {
    const { getByTestId } = render(<PinMark testId="mark" />);
    expect(icon(getByTestId('mark'))).toBe('pin-on');
  });
});

describe('the click’s feedback', () => {
  it('flips the glyph and the tip at once, before the hub’s echo, and sends one prefs_set', () => {
    const { store, cmds } = setup([]);
    const { getByTestId } = render(<StoreProvider store={store}><Row id="changelog" /></StoreProvider>);
    fireEvent.click(getByTestId('pin'), { detail: 1 });
    expect(icon(getByTestId('pin'))).toBe('pin-on');
    expect(getByTestId('pin').getAttribute('aria-label')).toBe(menus.unpin);
    expect(cmds).toEqual([{ cmd: 'prefs_set', key: `pins_art.${P}`, value: ['changelog'] }]);
    // the echo agrees: it stays pinned
    act(() => {
      store.apply({ ev: 'prefs', prefs: { pins_art: { [P]: ['changelog'] } } });
    });
    expect(icon(getByTestId('pin'))).toBe('pin-on');
  });

  it('a refused prefs_set flips it back, its tip says it couldn’t pin', () => {
    const { store } = setup([]);
    const { getByTestId } = render(<StoreProvider store={store}><Row id="changelog" /></StoreProvider>);
    fireEvent.click(getByTestId('pin'), { detail: 1 });
    act(() => {
      store.apply({ ev: 'error', cmd: 'prefs_set', text: 'prefs.json is read-only' });
    });
    expect(icon(getByTestId('pin'))).toBe('pin');
    expect(getByTestId('pin').getAttribute('aria-label')).toBe(menus.pin_failed);
  });

  it('keeps the list’s order under the pointer, and lets it go when the pointer leaves the card', () => {
    const { store } = setup([]);
    const { getByTestId, container } = render(<StoreProvider store={store}><Row id="changelog" /></StoreProvider>);
    fireEvent.click(getByTestId('pin'), { detail: 1 });
    act(() => {
      store.apply({ ev: 'prefs', prefs: { pins_art: { [P]: ['changelog'] } } });
    });
    // pinned, shown so, but its list does not lead with it yet
    expect(icon(getByTestId('pin'))).toBe('pin-on');
    expect(getByTestId('row').hasAttribute('data-leads')).toBe(false);
    act(() => {
      container.querySelector('.s3-card')?.dispatchEvent(new PointerEvent('pointerleave'));
    });
    expect(getByTestId('row').hasAttribute('data-leads')).toBe(true);
  });

  it('a keyboard click holds nothing: the list re-sorts at its echo', () => {
    const { store } = setup([]);
    const { getByTestId } = render(<StoreProvider store={store}><Row id="changelog" /></StoreProvider>);
    fireEvent.click(getByTestId('pin'), { detail: 0 });
    act(() => {
      store.apply({ ev: 'prefs', prefs: { pins_art: { [P]: ['changelog'] } } });
    });
    expect(getByTestId('row').hasAttribute('data-leads')).toBe(true);
  });
});

describe('pure parts', () => {
  it('shownOn: his click until the prefs move off what it came from', () => {
    expect(shownOn(false, null)).toBe(false);
    expect(shownOn(false, { on: true, was: false })).toBe(true);
    expect(shownOn(true, { on: true, was: false })).toBe(true);
    // another window unpinned it again after the echo: the prefs win
    expect(shownOn(false, { on: false, was: true })).toBe(false);
  });

  it('pinTip: what a click does, or what failed', () => {
    expect([pinTip(false, null), pinTip(true, null), pinTip(false, true), pinTip(true, false)]).toEqual([menus.pin, menus.unpin, menus.pin_failed, menus.unpin_failed]);
  });

  it('heldSet: a held pin is ordered as before his click, a held unpin back in its place', () => {
    const set = new Map([[P, ['a', 'b']]]);
    expect(heldSet(set, [{ kind: 'artifact', project: P, id: 'b', was: false }], 'artifact')).toEqual(new Map([[P, ['a']]]));
    expect(heldSet(new Map([[P, ['a']]]), [{ kind: 'artifact', project: P, id: 'b', was: true }], 'artifact')).toEqual(new Map([[P, ['a', 'b']]]));
    expect(heldSet(set, [{ kind: 'artifact', project: P, id: 'a', was: false }, { kind: 'artifact', project: P, id: 'b', was: false }], 'artifact')).toEqual(new Map());
    // another kind's hold changes nothing; no hold is the set itself
    expect(heldSet(set, [{ kind: 'process', project: P, id: 'a', was: false }], 'artifact')).toBe(set);
  });

  it('slidesOf: each row that moved, from its old top', () => {
    expect(slidesOf(new Map([['a', 0], ['b', 48]]), new Map([['a', 48], ['b', 0], ['c', 96]]))).toEqual(new Map([['a', -48], ['b', 48]]));
  });
});
