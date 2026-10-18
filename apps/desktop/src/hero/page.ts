// The shop's page in the hero film (bims-film v13, designer m_31640/m_31728): kiln-app's real little
// shop (kiln/, its own lazy chunk) rising from main's crate on localhost:5173: a flat window, at most
// PAGE_W_MAX of the town's box, centred at ~58% across, never under the feed, 16 px up and faded in
// over RISE_S; its own script runs from PAGE.at (kiln.at); then, at the fold, it falls apart into
// cubes from its edge to its middle with the town. The visitor can click it for real ('touch': he
// takes the camera). Layout and timing are pure (pageBox, foldOf); makePage draws. Owner: hero-town.
import { FILM_S, PAGE } from './cast';
import type { Kiln, KilnSize } from './kiln/kiln';

/** kiln's chunk, loaded by the entry (hero.ts): the film never imports it itself, so the entry stays whole */
export type KilnLoader = () => Promise<typeof import('./kiln/kiln')>;

/** the page's share of the town box's width at most, its centre across and down (designer m_31640) */
export const PAGE_W_MAX = 0.55;
const CENTRE = { x: 0.58, y: 0.46 } as const;
/** under this width the shop's compact layout (designer m_31728) */
const FULL_MIN_W = 520;
/** its rise: 16 px and a fade over 0.4 s */
const RISE_PX = 16;
const RISE_S = 0.4;
/** the fold's cubes: columns, rows */
const COLS = 8;
const ROWS = 5;

const SIZES: Readonly<Record<KilnSize, { readonly w: number; readonly h: number }>> = { full: { w: 600, h: 400 }, compact: { w: 400, h: 300 } };

/** Where the page sits in a box w × h css px: its size, its scale from its design size, its top left. Pure. */
export function pageBox(w: number, h: number): { size: KilnSize; scale: number; left: number; top: number; width: number; height: number } {
  const want = Math.min(w * PAGE_W_MAX, SIZES.full.w);
  const size: KilnSize = want >= FULL_MIN_W ? 'full' : 'compact';
  const d = SIZES[size];
  const scale = Math.min(want / d.w, (h * 0.7) / d.h);
  const width = d.w * scale;
  const height = d.h * scale;
  return { size, scale, width, height, left: w * CENTRE.x - width / 2, top: h * CENTRE.y - height / 2 };
}

/** A cube's fold at film time T: 0 there, 1 gone; the edge's first, the middle's last (the wave backwards). Pure. */
export function foldOf(T: number, col: number, row: number): number {
  const span = FILM_S - PAGE.fold;
  if (T < PAGE.fold) return 0;
  const dx = Math.abs((col + 0.5) / COLS - 0.5) * 2;
  const dy = Math.abs((row + 0.5) / ROWS - 0.5) * 2;
  const edge = Math.max(dx, dy);
  const start = PAGE.fold + (1 - edge) * span * 0.55;
  return Math.min(1, Math.max(0, (T - start) / (span * 0.45)));
}

export interface PageView {
  draw(T: number): void;
  setTheme(t: 'light' | 'dark'): void;
  dispose(): void;
}

/** The page, its shop loaded a while before it rises (no loader: no page); `touch`: he clicked it. */
export function makePage(root: HTMLElement, theme: 'light' | 'dark', loader: KilnLoader | null, touch: () => void): PageView {
  const el = document.createElement('div');
  el.className = 'bh-page';
  el.style.visibility = 'hidden';
  root.append(el);
  let kiln: Kiln | null = null;
  let loading = false;
  let shown = false;
  let cubes: HTMLDivElement[] | null = null;
  let dark = theme === 'dark';

  const load = (): void => {
    if (loading || loader === null) return;
    loading = true;
    void loader().then(({ makeKiln }) => {
      const k = makeKiln({ theme: dark ? 'dark' : 'light' });
      k.on('touch', touch);
      el.append(k.el);
      kiln = k;
    });
  };

  const unfold = (): void => {
    for (const c of cubes ?? []) c.remove();
    cubes = null;
    if (kiln) kiln.el.style.visibility = '';
  };

  return {
    draw(T) {
      // its chunk loads 5 s before it rises
      if (T >= PAGE.at - 5) load();
      const on = T >= PAGE.at && T < FILM_S;
      if (!on || kiln === null) {
        if (shown) {
          el.style.visibility = 'hidden';
          unfold();
          shown = false;
        }
        return;
      }
      const w = root.clientWidth;
      const b = pageBox(w, root.clientHeight);
      kiln.setSize(b.size);
      kiln.at(T - PAGE.at);
      const r = Math.min(1, (T - PAGE.at) / RISE_S);
      const ease = 1 - (1 - r) ** 3;
      el.style.visibility = '';
      el.style.opacity = String(ease);
      el.style.transform = `translate(${b.left.toFixed(1)}px, ${(b.top + RISE_PX * (1 - ease)).toFixed(1)}px) scale(${b.scale.toFixed(4)})`;
      shown = true;
      if (T < PAGE.fold) {
        if (cubes) unfold();
        return;
      }
      // the fold: the page cut into cubes (copies of it, each showing its own piece), the live one hidden
      if (cubes === null) {
        const d = SIZES[b.size];
        cubes = [];
        for (let row = 0; row < ROWS; row++) {
          for (let col = 0; col < COLS; col++) {
            const c = document.createElement('div');
            c.className = 'bh-page-cube';
            const cw = d.w / COLS;
            const ch = d.h / ROWS;
            c.style.cssText = `left:${(col * cw).toFixed(2)}px;top:${(row * ch).toFixed(2)}px;width:${cw.toFixed(2)}px;height:${ch.toFixed(2)}px`;
            const copy = kiln.el.cloneNode(true) as HTMLElement;
            copy.style.position = 'absolute';
            copy.style.left = `${(-col * cw).toFixed(2)}px`;
            copy.style.top = `${(-row * ch).toFixed(2)}px`;
            c.append(copy);
            c.dataset.col = String(col);
            c.dataset.row = String(row);
            el.append(c);
            cubes.push(c);
          }
        }
        kiln.el.style.visibility = 'hidden';
      }
      for (const c of cubes) {
        const f = foldOf(T, Number(c.dataset.col), Number(c.dataset.row));
        c.style.transform = `translateY(${(f * 18).toFixed(1)}px) scale(${(1 - f).toFixed(3)})`;
        c.style.opacity = String(1 - f);
      }
    },
    setTheme(t) {
      dark = t === 'dark';
      kiln?.setTheme(t);
    },
    dispose() {
      kiln?.destroy();
      el.remove();
    },
  };
}
