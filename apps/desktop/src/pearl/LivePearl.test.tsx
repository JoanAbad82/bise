// @vitest-environment happy-dom
// A small pearl (the sidebar's 14 px one) is the still CSS one, never the WebGL canvas: at that
// size the shader's dot grid drew nothing in the harness and a white square on his Mac
// (designer's try gate D3).
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LivePearl, SMALL } from './LivePearl';

afterEach(cleanup);

describe('a small pearl', () => {
  it('under SMALL px draws a CSS pearl, no canvas, ink at rest and pink when it calls him', () => {
    const rest = render(<LivePearl mood="rest" size={14} testId="p" />);
    const el = rest.getByTestId('p');
    expect(el.tagName).toBe('SPAN');
    expect(el.dataset.mood).toBe('rest');
    expect(el.dataset.tone).toBe('ink');
    expect(rest.container.querySelector('canvas')).toBeNull();
    cleanup();
    const need = render(<LivePearl mood="need" size={SMALL - 1} testId="p" />);
    expect(need.getByTestId('p').dataset.tone).toBe('pink');
  });
  it('at SMALL px and up stays the live canvas', () => {
    const ui = render(<LivePearl mood="rest" size={SMALL} testId="p" />);
    expect(ui.getByTestId('p').tagName).toBe('CANVAS');
  });
});
