// @vitest-environment happy-dom
// The empty composer's placeholder sits on the field's own line, where his first typed word goes
// (his m_47114: on the Artifacts pages the floating pill's 'write to bise, then ⏎' sat 3 px under
// the line's middle). The cause: composer.css put it (28 - 1lh) / 2 down, as if the field were a
// 28 px control, while the field is one 22 px line with no padding: the placeholder dropped 3 px
// under the typed text in every size, docked and floating (rest, focus, open). The real Composer
// (PmField's placeholder) in the real stylesheets, read back with getComputedStyle (happy-dom lays
// nothing out: the box is what the cascade gives it). Mutations: composer.css's `.b-field-ph`
// back to `inset: calc((var(--h-control-sm) - 1lh) / 2) 0 auto 0` turns this red, and so does
// `top: 3px`.
import { act, cleanup, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { Composer } from '../Composer';
import type { Store } from '../drafts';

const css = ['../../ds/tokens.css', '../../ds/css/composer.css', '../../ds/css/controls.css', '../composer.css', '../float/float.css'];

beforeAll(() => {
  const style = document.createElement('style');
  style.textContent = css.map((f) => readFileSync(join(__dirname, f), 'utf8')).join(String.fromCharCode(10));
  document.head.append(style);
});
afterEach(cleanup);

const memStore = (): Store => {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};

const field = <Composer target="p/main" store={memStore()} onSend={() => undefined} placeholder="write to bise, then ⏎" />;

describe("the empty composer's placeholder", () => {
  for (const [name, ui] of [
    ['docked', field],
    ['floating at rest', <div className="cmp-float" data-state="rest">{field}</div>],
    ['floating, focused', <div className="cmp-float" data-state="focus">{field}</div>],
    ['floating, open', <div className="cmp-float" data-state="open">{field}</div>],
  ] as const) {
    it(`sits on the field's line, ${name}`, async () => {
      const v = render(ui);
      await act(async () => {
        await Promise.resolve();
      });
      const ph = v.container.querySelector<HTMLElement>('.b-field-ph');
      expect(ph?.textContent).toBe('write to bise, then ⏎');
      const f = getComputedStyle(v.getByTestId('composer.field'));
      // the field's first line starts at its top: no padding, no border of its own
      expect({ padding: f.paddingTop, border: f.borderTopWidth || '0px' }).toEqual({ padding: '0px', border: '0px' });
      // so the placeholder starts there too, absolute at the top of the field's column
      const s = getComputedStyle(ph as HTMLElement);
      expect({ position: s.position, top: s.top }).toEqual({ position: 'absolute', top: '0px' });
    });
  }
});
