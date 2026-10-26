// @vitest-environment happy-dom
// An ask's option in the agents card (his m_45871: a long option spilled out of its 24 px button):
// the button grows with its words (no fixed height), its words clamp at 2 lines inside it, the full
// words go to its tip only when the clamp cuts them, 'answer…' stays on one line. Read on the real
// side3d.css's rules (happy-dom has no layout nor stylesheet styles: the cut is the label's measured box).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OptButton } from './FlyoutAgents';

// the css itself (a ?raw import of a .css comes back empty under vitest)
const SIDE_CSS = readFileSync(resolve(__dirname, 'side3d.css'), 'utf8');
const LONG = "ok, ça peut aller sur main après la signature de designer et la revue d'ui-review en clair et en sombre";

/** the declarations of one rule of side3d.css, by its exact selector (happy-dom computes no stylesheet styles) */
function rule(selector: string): Record<string, string> {
  const at = SIDE_CSS.indexOf(`\n${selector} {`);
  expect(at, selector).toBeGreaterThanOrEqual(0);
  const body = SIDE_CSS.slice(SIDE_CSS.indexOf('{', at) + 1, SIDE_CSS.indexOf('}', at));
  const out: Record<string, string> = {};
  for (const d of body.split(';')) {
    const [k = '', v = '', ...rest] = d.split(':').map((x) => x.trim());
    if (k !== '' && rest.length === 0) out[k] = v;
  }
  return out;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/** the label's measured box: `lines` lines of 16 px, shown up to 2 */
function measured(lines: number) {
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(16 * lines);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(16 * Math.min(lines, 2));
}

describe('an ask option in the agents card', () => {
  it('a long option stays inside its button: the button grows, its words clamp at 2 lines', () => {
    measured(4);
    const v = render(<OptButton label={LONG} onPick={() => undefined} testId="opt" />);
    const btn = v.getByTestId('opt');
    const b = rule('.s3-say-btn');
    expect(b.height).toBeUndefined();
    expect(b['min-height']).toBe('var(--h-seg-in)');
    expect(b['max-width']).toBe('100%');
    const w = btn.firstElementChild as HTMLElement;
    expect(w.className).toBe('s3-say-btn-w');
    expect(w.textContent).toBe(LONG);
    const c = rule('.s3-say-btn-w');
    expect([c['-webkit-line-clamp'], c['line-clamp'], c.overflow]).toEqual(['2', '2', 'hidden']);
    expect(btn.getAttribute('data-tip')).toBe(LONG);
  });

  it('a short option has no tip: its words are all there', () => {
    measured(1);
    const v = render(<OptButton label="yes" onPick={() => undefined} testId="opt" />);
    expect(v.getByTestId('opt').hasAttribute('data-tip')).toBe(false);
  });
});
