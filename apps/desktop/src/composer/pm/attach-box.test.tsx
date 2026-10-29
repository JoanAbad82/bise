// @vitest-environment happy-dom
// The attachment row's ✕ is the ds's row icon button, inside its 28 px row (his m_46712: on hover its
// tint was a square that ran out under the row, and its glyph sat off the row's line). The cause: the
// composer bar's rule `.b-composer .box .row` (ds/css/composer.css: 40 high, padding 0 8 4, a flex
// row) also hit IconButton size="row", whose class is `row` too. The real frame (ComposerFrame) and
// list (AttachList) with the real stylesheets, read back with getComputedStyle (happy-dom lays
// nothing out: the box is what the cascade gives it). Mutation: ds/css/composer.css's
// `.box>.row` back to `.box .row` turns this red (height 40px, padding-bottom 4px).
// The image row's 16 px thumbnail stays in the row's flow (ui-review m_46777: it sat 34 px up, over
// row 1's number): its class was `th`, and artifacts/thumbs/thumbs.css's global `.th` puts a box
// absolute, inset 0. Mutation: AttachList's `sg thumb` back to `sg th` turns it red (absolute).
import { cleanup, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ComposerFrame } from '@/ds';
import type { Chip } from '../message';
import { AttachList } from './AttachList';

const css = ['../../ds/tokens.css', '../../ds/css/composer.css', '../../ds/css/controls.css', '../composer.css', '../../app/zen.css', '../../artifacts/thumbs/thumbs.css'];

beforeAll(() => {
  const style = document.createElement('style');
  style.textContent = css.map((f) => readFileSync(join(__dirname, f), 'utf8')).join(String.fromCharCode(10));
  document.head.append(style);
});
afterEach(cleanup);

const img: Chip = { kind: 'image', n: 1, path: '/Users/g/Desktop/logo.png', name: '[Image #1]', w: 1200, h: 630, bytes: 84_000, thumb: 'data:image/png;base64,iVBORw0KGgo=' };
const file: Chip = { kind: 'file', n: 2, path: '/Users/g/Desktop/notes.txt', bytes: 2_900 };

describe("an attachment row's ✕ in the composer's box", () => {
  it('keeps the ds row icon button: 24 square, r-1, no padding, inside the 28 px row', () => {
    const v = render(
      <div className="app-shell">
        <ComposerFrame send="off" testId="composer">
          <AttachList chips={[img, file]} lit={1} onLit={() => undefined} onRemove={() => undefined} onOpen={() => undefined} home="/Users/g" testId="composer" />
        </ComposerFrame>
      </div>,
    );
    const row = getComputedStyle(v.getByTestId('composer.attach.1'));
    for (const n of [1, 2]) {
      const x = getComputedStyle(v.getByTestId(`composer.attach.${String(n)}.remove`));
      expect({ height: x.height, width: x.width, padding: x.padding, radius: x.borderRadius, display: x.display }, `✕ of row ${String(n)}`)
        .toEqual({ height: '24px', width: '24px', padding: '0px', radius: '6px', display: 'inline-flex' });
      expect(Number.parseFloat(x.height)).toBeLessThan(Number.parseFloat(row.height));
    }
    // lit alone (the caret next to its chip, right after a drop) never shows the ✕: hover or focus
    // only (designer m_46780). Mutation: composer.css's '.b-attach-row.lit .x' back turns it red.
    expect(v.getByTestId('composer.attach.1').classList.contains('lit')).toBe(true);
    // hidden by its opacity, never its visibility: a hidden button takes no focus, and Tab must reach
    // it (ui-review m_46814, designer m_46812). Mutation: '.x' back to 'visibility: hidden' turns it red.
    for (const n of [1, 2]) {
      const box = v.getByTestId(`composer.attach.${String(n)}.remove`).parentElement as HTMLElement;
      const s = getComputedStyle(box);
      expect({ opacity: s.opacity, visibility: s.visibility || 'visible' }, `✕ of row ${String(n)} at rest`).toEqual({ opacity: '0', visibility: 'visible' });
    }
    // the composer's own bar keeps its 40 px row
    expect(getComputedStyle(v.getByTestId('composer.row')).height).toBe('40px');
    // the image's thumbnail: a 16 px box in the row's flow, never placed over the list
    const pic = v.getByTestId('composer.attach.1').querySelector('img');
    expect(pic).not.toBeNull();
    const t = getComputedStyle(pic as HTMLImageElement);
    // (happy-dom gives '' for a position no rule sets: static)
    expect({ position: t.position || 'static', width: t.width, height: t.height }).toEqual({ position: 'static', width: '16px', height: '16px' });
  });
});
