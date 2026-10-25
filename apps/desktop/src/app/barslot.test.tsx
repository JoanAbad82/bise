// @vitest-environment happy-dom
// The page's room in the bar: what a page puts in <InBar> shows inside the bar's slot, never in
// the page; it leaves with the page; without a bar it draws nothing.
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BarSlot, InBar, InTitle, TitleSlot } from './barslot';

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

function Titled({ renaming }: { renaming: boolean }) {
  return (
    <div>
      <header>
        <TitleSlot text="perf" />
        <span data-testid="sub">profiling the hub</span>
      </header>
      <main data-testid="page">{renaming && <InTitle><input data-testid="rename" /></InTitle>}</main>
    </div>
  );
}

describe('InTitle', () => {
  it("replaces the title's text while mounted, the subtitle stays", () => {
    const v = render(<Titled renaming />);
    const t = v.getByTestId('app.bar.title.text');
    expect(t.contains(v.getByTestId('rename'))).toBe(true);
    expect(t.textContent).toBe('');
    expect(v.getByTestId('sub').textContent).toBe('profiling the hub');
  });

  it('gives the title its text back once it unmounts', () => {
    const v = render(<Titled renaming />);
    v.rerender(<Titled renaming={false} />);
    expect(v.getByTestId('app.bar.title.text').textContent).toBe('perf');
    expect(v.queryByTestId('rename')).toBeNull();
  });
});
