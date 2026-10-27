// @vitest-environment happy-dom
// The outer card's section head with side3d.css, read back with getComputedStyle: happy-dom has no
// layout, so 'all ›' staying on one line is what the stylesheet gives it: no wrap and no shrink (his
// m_46681: 'all' over '›' beside a long title). Mutation:
// side3d.css's .s3-ohead-all without white-space: nowrap or flex: none turns this red.
import { cleanup, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { side } from '@/proto/words_side.gen';
import { OuterHead } from './OuterCard';

// the head's 3D picture needs WebGL: a picture that never draws
vi.mock('./Bubbles', () => ({ ThingPic: () => <span /> }));

beforeAll(() => {
  const style = document.createElement('style');
  style.textContent = ['../../ds/tokens.css', 'side3d.css'].map((f) => readFileSync(join(__dirname, f), 'utf8')).join(String.fromCharCode(10));
  document.head.append(style);
});
afterEach(cleanup);

describe('the outer card\'s head', () => {
  it('\'all ›\' stays on one line beside a full head: it never wraps nor shrinks', () => {
    const v = render(<OuterHead id="agents" name="Agents" count="1145" loud={side.head_waits({ n: 12 })} onAll={() => undefined} />);
    const all = v.getByTestId('app.outer.agents.all');
    expect(all.textContent).toBe(side.all_short);
    expect(getComputedStyle(all).whiteSpace).toBe('nowrap');
    expect(getComputedStyle(all).flexShrink).toBe('0');
  });
});

describe('an artifact chip in a side row (his m_47004)', () => {
  it('never wider than its line, padding included: its right radius shows, its title takes the ellipsis', () => {
    const v = render(<span className="s3-row-l1"><span data-testid="chip" className="b-artchip s3-chip"><span className="b-artchip-title">appartement 36 Monge</span></span></span>);
    const chip = getComputedStyle(v.getByTestId('chip'));
    expect(chip.boxSizing).toBe('border-box');
    expect(chip.maxWidth).toBe('100%');
  });
});
