// @vitest-environment happy-dom
// His pick shows picked for PICKED_MS before it goes: a card redrawn from scratch in that time (the
// inbox's rows change under it, as when a stopped hub comes back: inbox/answer-everywhere's 'its hub
// stopped') still sends it, once.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Store, StoreProvider } from '@/store';
import { age, chipTip, idTip, InboxCard, PICKED_MS } from './InboxCard';
import { inbox } from '@/proto/words_inbox.gen';
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

describe("the card head: one mark, no id (designer m_45259, m_45255)", () => {
  const head = (c: InboxItem) =>
    render(
      <StoreProvider store={new Store(null)}>
        <InboxCard card={c} acts={{ pick: () => undefined }} now={1791100060000} testId="h" />
      </StoreProvider>,
    );

  const mark = () => screen.getByTestId('h.g').querySelector('.b-rowmark');

  it("an approval reads the circled ? icon in the accent, the rows' own form, never '!' (designer m_45334)", () => {
    head({ ...card, kind: 'confirm', approval: true });
    expect(mark()?.getAttribute('data-icon')).toBe('ask');
    expect(mark()?.getAttribute('data-tone')).toBe('accent');
    expect(screen.getByTestId('h.g').textContent).toBe('');
  });

  it('a failure that asks nothing reads ✗ in err', () => {
    head({ ...card, kind: 'failed', options: [] });
    expect(mark()?.getAttribute('data-icon')).toBe('close');
    expect(mark()?.getAttribute('data-tone')).toBe('err');
  });

  it("the age alone, the hub's number in its tip only", () => {
    head({ ...card, id: 10 });
    const ageEl = screen.getByTestId('h.age');
    expect(ageEl.textContent).toBe(age(60_000));
    expect(ageEl.getAttribute('data-tip')).toBe(idTip(10));
    expect(screen.getByTestId('h').querySelector('.ic-h')?.textContent).not.toContain(inbox.card_id({ id: 10 }));
    cleanup();
    // bise's own items have no hub number: no tip
    head({ ...card, id: -1 });
    expect(screen.getByTestId('h.age').getAttribute('data-tip')).toBeNull();
  });
});

describe("the chip's row (designer m_47764)", () => {
  it("'⌘O open beside' is one whole hint, its key also in the chip's tip; a card that doesn't open has neither", () => {
    const about: InboxItem = { ...card, artifact: { id: 'commode', kind: 'image', title: "commode cannée sous l'escalier", v: 1 } };
    render(
      <StoreProvider store={new Store(null)}>
        <InboxCard card={about} acts={{ pick: () => undefined, openPage: () => undefined }} now={1791100060000} testId="c" />
      </StoreProvider>,
    );
    // whole: one act, the key and its words together, the row's last child (it wraps away whole, inbox.css)
    const hint = screen.getByTestId('c.page.open');
    expect(hint.textContent).toBe(`⌘O${inbox.key_open_beside}`);
    expect(screen.getByTestId('c.page').lastElementChild).toBe(hint);
    expect(screen.getByTestId('c.page.chip').getAttribute('data-tip')).toBe(chipTip("commode cannée sous l'escalier", true));
    expect(chipTip('plan', true)).toBe(`plan · ⌘O ${inbox.key_open_beside}`);
    cleanup();
    render(
      <StoreProvider store={new Store(null)}>
        <InboxCard card={about} acts={{ pick: () => undefined }} now={1791100060000} testId="c" />
      </StoreProvider>,
    );
    expect(screen.queryByTestId('c.page.open')).toBeNull();
    expect(screen.getByTestId('c.page.chip').getAttribute('data-tip')).toBe("commode cannée sous l'escalier");
  });
});
