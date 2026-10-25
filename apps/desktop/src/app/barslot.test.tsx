// @vitest-environment happy-dom
// The page's room in the bar: what a page puts in <InBar> shows inside the bar's slot, never in
// the page; it leaves with the page; without a bar it draws nothing.
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BarSlot, InBar } from './barslot';

afterEach(cleanup);

function Shell({ page, bar = true }: { page: boolean; bar?: boolean }) {
  return (
    <div>
      <header data-testid="bar">{bar && <BarSlot />}</header>
      <main data-testid="page">
        {page && (
          <InBar>
            <input data-testid="page.search" />
          </InBar>
        )}
      </main>
    </div>
  );
}

describe('InBar', () => {
  it("draws the page's content in the bar's slot, not in the page", () => {
    const v = render(<Shell page />);
    const slot = v.getByTestId('app.bar.slot');
    expect(slot.contains(v.getByTestId('page.search'))).toBe(true);
    expect(v.getByTestId('page').querySelector('[data-testid="page.search"]')).toBeNull();
  });

  it('leaves the slot empty once the page unmounts', () => {
    const v = render(<Shell page />);
    v.rerender(<Shell page={false} />);
    expect(v.getByTestId('app.bar.slot').childElementCount).toBe(0);
  });

  it('draws nothing when no bar is mounted', () => {
    const v = render(<Shell page bar={false} />);
    expect(v.queryByTestId('page.search')).toBeNull();
  });
});
