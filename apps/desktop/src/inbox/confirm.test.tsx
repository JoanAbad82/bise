// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { CoreCmd } from '@/shared/api';
import { Store, StoreProvider } from '@/store';
import { ConfirmBar } from './confirm';

afterEach(cleanup);

const P = 'acme-1a2b3c4d';

function setup() {
  const sent: CoreCmd[] = [];
  const store = new Store({ send: (c) => sent.push(c) }, { now: () => 1000 });
  store.setCore('up');
  render(
    <StoreProvider store={store}>
      <ConfirmBar project={P} />
    </StoreProvider>,
  );
  const ask = (id: number) => {
    act(() => {
      store.apply({ ev: 'confirm', project: P, id, text: '@perf is working: archive it anyway? (y/n)' });
    });
  };
  return { sent, store, ask };
}

describe('ConfirmBar', () => {
  it('nothing asked: nothing shows', () => {
    setup();
    expect(screen.queryByTestId('confirm.bar')).toBeNull();
  });

  it('y answers yes, n answers no and shows the hub line, esc puts it off with nothing sent', () => {
    const { sent, store, ask } = setup();
    ask(3);
    const bar = screen.getByTestId('confirm.bar');
    expect(bar.textContent).toContain('archive it anyway?');
    expect(document.activeElement).toBe(bar);
    fireEvent.keyDown(bar, { key: 'y' });
    expect(sent.at(-1)).toEqual({ cmd: 'confirm', project: P, id: 3, yes: true });
    expect(screen.queryByTestId('confirm.bar')).toBeNull();

    ask(4);
    fireEvent.keyDown(screen.getByTestId('confirm.bar'), { key: 'n' });
    expect(sent.at(-1)).toEqual({ cmd: 'confirm', project: P, id: 4, yes: false });
    act(() => {
      store.apply({ ev: 'notice', project: P, cmd: 'confirm', text: 'drop of @perf cancelled' });
    });
    expect(screen.getByTestId('confirm.notice').textContent).toBe('drop of @perf cancelled');

    ask(5);
    const n = sent.length;
    fireEvent.keyDown(screen.getByTestId('confirm.bar'), { key: 'Escape' });
    expect(sent.length).toBe(n);
    expect(screen.queryByTestId('confirm.bar')).toBeNull();
  });

  it('the buttons do the same as the keys', () => {
    const { sent, ask } = setup();
    ask(6);
    fireEvent.click(screen.getByTestId('confirm.no'));
    expect(sent.at(-1)).toEqual({ cmd: 'confirm', project: P, id: 6, yes: false });
  });
});
