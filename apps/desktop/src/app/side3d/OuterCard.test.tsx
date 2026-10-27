// @vitest-environment happy-dom
// The outer card's section head with side3d.css, read back with getComputedStyle: happy-dom has no
// layout, so 'all ›' staying on one line is what the stylesheet gives it: no wrap and no shrink, the
// summary before it takes the cut (his m_46681: 'all' over '›' beside a long title). Mutation:
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
  it('\'all ›\' stays on one line beside a long summary: it never wraps nor shrinks, the summary takes the ellipsis', () => {
    const v = render(<OuterHead id="artifacts" name="Artifacts" count="1145" sum={'tes artifacts, rangés par dossier et par projet '.repeat(3)} onAll={() => undefined} />);
    const all = v.getByTestId('app.outer.artifacts.all');
    expect(all.textContent).toBe(side.all_short);
    expect(getComputedStyle(all).whiteSpace).toBe('nowrap');
    expect(getComputedStyle(all).flexShrink).toBe('0');
    const sum = getComputedStyle(v.getByTestId('app.outer.artifacts.sum'));
    expect(sum.textOverflow).toBe('ellipsis');
    expect(sum.minWidth).toMatch(/^0(px)?$/);
  });
});
