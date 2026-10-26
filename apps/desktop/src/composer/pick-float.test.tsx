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
import { composer as words } from '../proto/words_composer.gen';

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

  // ui-review m_44570: on the floating composer the list ran over its head ('to bise', ─)
  it('in a frame marked data-pick-anchor (the floating glass) it floats from that frame, above its head', async () => {
    const got: { a: ComposerActions | null } = { a: null };
    const { getByTestId, container } = render(
      <div data-pick-anchor>
        <div className="box">
          <PmField target="p/main" busy={false} sources={{ ...NO_SOURCES, commands: [{ name: 'model', desc: 'the model', args: false, ready: true }] }} store={memStore()} testId="composer"
            placeholder="write to bise" send={() => undefined} queue={() => undefined} editNewest={() => false} command={() => undefined}
            onCanSend={() => undefined} onStrip={() => undefined} onBar={() => undefined} onActions={(x) => (got.a = x)} />
        </div>
      </div>,
    );
    const rect = (top: number, bottom: number) => () => ({ top, bottom, left: 230, right: 870, width: 640, height: bottom - top, x: 230, y: top, toJSON: () => ({}) }) as DOMRect;
    (container.querySelector('[data-pick-anchor]') as HTMLElement).getBoundingClientRect = rect(528, 616);
    (container.querySelector('.box') as HTMLElement).getBoundingClientRect = rect(568, 616);
    await act(async () => {
      got.a?.insertText('/');
      await Promise.resolve();
    });
    const pop = getByTestId('composer.pick').parentElement as HTMLElement;
    expect(pop.style.bottom).toBe(`${String(window.innerHeight - 528 + 8)}px`);
  });

  // designer m_44585: a key that opens nothing reads as broken
  it.each([
    ['@', words.pick_none_at],
    ['$', words.pick_none_skill],
  ])("a bare '%s' with nothing to offer shows one text-3 line, no row; the next key closes it, the character stays text", async (key, line) => {
    const got: { a: ComposerActions | null } = { a: null };
    const { getByTestId, queryByTestId } = render(
      <div className="box">
        <PmField target="p/main" busy={false} sources={{ ...NO_SOURCES, files: () => Promise.resolve([]) }} store={memStore()} testId="composer"
          placeholder="write to bise" send={() => undefined} queue={() => undefined} editNewest={() => false} command={() => undefined}
          onCanSend={() => undefined} onStrip={() => undefined} onBar={() => undefined} onActions={(x) => (got.a = x)} />
      </div>,
    );
    await act(async () => {
      got.a?.insertText(key);
      await Promise.resolve();
      await Promise.resolve();
    });
    const list = getByTestId('composer.pick');
    expect(list.textContent).toBe(line);
    expect(list.querySelectorAll('[role="menuitem"]').length).toBe(0);
    await act(async () => {
      got.a?.insertText('x');
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(queryByTestId('composer.pick')).toBeNull();
    expect(getByTestId('composer.field').textContent).toBe(`${key}x`);
  });
});
