// @vitest-environment happy-dom
// His pick shows picked for PICKED_MS before it goes: a card redrawn from scratch in that time (the
// inbox's rows change under it, as when a stopped hub comes back: inbox/answer-everywhere's 'its hub
// stopped') still sends it, once.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Store, StoreProvider } from '@/store';
import { InboxCard, PICKED_MS } from './InboxCard';
import type { InboxItem } from './listed';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const card: InboxItem = {
  refused: null,
  id: 1,
  project: 'telemetry',
  kind: 'question',
  agent: 'main',
  question: 'which window for the p99 alert?',
  options: [
    { n: 1, label: '5 min' },
    { n: 2, label: '15 min' },
  ],
  urgent: false,
  since_ms: 1791100000000,
  rank: 1,
};

function mount(pick: (n: number) => void) {
  return render(
    <StoreProvider store={new Store(null)}>
      <InboxCard card={card} acts={{ pick }} now={1791100060000} testId="c" />
    </StoreProvider>,
  );
}

describe('InboxCard pick', () => {
  it('goes after PICKED_MS, once', () => {
    vi.useFakeTimers();
    const pick = vi.fn();
    mount(pick);
    fireEvent.click(screen.getByTestId('c.opt.1'));
    expect(pick).not.toHaveBeenCalled();
    vi.advanceTimersByTime(PICKED_MS);
    expect(pick.mock.calls).toEqual([[1]]);
  });

  it('a card unmounted while its pick shows still sends it, once', () => {
    vi.useFakeTimers();
    const pick = vi.fn();
    const v = mount(pick);
    fireEvent.click(screen.getByTestId('c.opt.2'));
    v.unmount();
    expect(pick.mock.calls).toEqual([[2]]);
    vi.advanceTimersByTime(PICKED_MS * 2);
    expect(pick.mock.calls).toEqual([[2]]);
  });

  it('an unmount with no pick on its way sends nothing', () => {
    vi.useFakeTimers();
    const pick = vi.fn();
    mount(pick).unmount();
    vi.advanceTimersByTime(PICKED_MS);
    expect(pick).not.toHaveBeenCalled();
  });
});
