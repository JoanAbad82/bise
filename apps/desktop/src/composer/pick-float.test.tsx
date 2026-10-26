// @vitest-environment happy-dom
// r2-hints item 2 (Gabriel m_44279): the / @ $ lists were cut by the composer's box (overflow
// hidden, the floating composer's too). They float on <body> now: nothing above them clips them
// (ds noClip), and pickPlace keeps the whole list inside a short window, docked or floating.
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { noClip } from '@/ds/noclip';
import type { ComposerActions } from './actions';
import type { Store } from './drafts';
import { NO_SOURCES } from './sources';
import { PmField } from './pm/PmField';
import { pickPlace } from './Picker';

afterEach(cleanup);

/** The list's box from its place, `h` its height (its max). */
function boxOf(p: ReturnType<typeof pickPlace>, win: { width: number; height: number }) {
  const s = p.style as { left: number; top?: number; bottom?: number };
  const top = s.top ?? win.height - (s.bottom ?? 0) - p.maxHeight;
  return { left: s.left, top, bottom: top + p.maxHeight, right: s.left + 240 };
}

describe('pickPlace', () => {
  const win = { width: 1100, height: 640 };
  const inside = (b: ReturnType<typeof boxOf>) => {
    expect(b.top).toBeGreaterThanOrEqual(24);
    expect(b.bottom).toBeLessThanOrEqual(win.height - 24);
    expect(b.left).toBeGreaterThanOrEqual(8);
    expect(b.right).toBeLessThanOrEqual(win.width - 8);
  };

  it('docked at the bottom of a 1100 x 640 window: above the box, 8 from it, the room less 24, inside the window', () => {
    const box = { top: 520, bottom: 616, left: 300 };
    const p = pickPlace(box, win);
    expect(p.up).toBe(true);
    expect(p.style).toMatchObject({ position: 'fixed', left: 300, bottom: win.height - box.top + 8 });
    expect(p.maxHeight).toBe(Math.min(320, 520 - 8 - 24));
    inside(boxOf(p, win));
  });

  it('floating open near the top (no room above): below the box, never past the window', () => {
    const box = { top: 40, bottom: 200, left: 230 };
    const p = pickPlace(box, win);
    expect(p.up).toBe(false);
    expect(p.style).toMatchObject({ top: 208 });
    expect(p.maxHeight).toBe(Math.min(320, 640 - 200 - 8 - 24));
    inside(boxOf(p, win));
  });

  it('floating at rest at the bottom right of a short window: the larger side, held inside on the right', () => {
    const box = { top: 572, bottom: 616, left: 1000 };
    const p = pickPlace(box, win);
    expect(p.up).toBe(true);
    inside(boxOf(p, win));
  });
});

const memStore = (): Store => {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};

describe('the / @ $ lists', () => {
  it.each([
    ['/', 'composer.pick.cmd'],
    ['@', 'composer.pick.agent'],
    ['$', 'composer.pick.skill'],
  ])("'%s' opens its list on <body>, outside the composer's box, and nothing above it clips it", async (key) => {
    const got: { a: ComposerActions | null } = { a: null };
    const sources = {
      ...NO_SOURCES,
      agents: [{ name: 'zqbench' }],
      commands: [{ name: 'model', desc: 'the model', args: false, ready: true }],
      skills: [{ name: 'bise-pages', desc: 'a page' }],
      files: () => Promise.resolve([]),
    };
    const { getByTestId, container } = render(
      // the composer's box clips (overflow hidden), as ds/css/composer.css's .box does
      <div className="box" style={{ overflow: 'hidden' }}>
        <PmField
          target="p/main"
          busy={false}
          sources={sources}
          store={memStore()}
          testId="composer"
          placeholder="write to bise"
          send={() => undefined}
          queue={() => undefined}
          editNewest={() => false}
          command={() => undefined}
          onCanSend={() => undefined}
          onStrip={() => undefined}
          onBar={() => undefined}
          onActions={(x) => (got.a = x)}
        />
      </div>,
    );
    await act(async () => {
      got.a?.insertText(key);
      await Promise.resolve();
    });
    const list = getByTestId('composer.pick');
    expect(container.contains(list), 'not inside the composer').toBe(false);
    noClip(list);
    expect((list.parentElement as HTMLElement).style.position).toBe('fixed');
  });
});
