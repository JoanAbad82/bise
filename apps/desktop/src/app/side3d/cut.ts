// src/app/side3d · the hair swatch's camera (settings › general › Your bim, me.tsx; page bim-pick,
// bim-pick-center): main's head at the coin's size, its drawn box centred in the square. The coin's
// picture cropped by CSS put the head 5 px low and up to 2 px aside in the 32 box (its bust sits on
// the square's bottom, the head's hair and pigtails make it lopsided), so the selection ring was off
// its content. Pure: render.ts cutPng draws the head alone once, reads its drawn box, then draws
// the whole bim through this fit. Owner: bim-pick.
import type { Fit } from '@/bims/render/camera';
import type { PxBox } from './bubble3d';

/** the coin's picture size against the cut's: the cut shows the coin's head at 1.5x its px (the 48 picture in the 32 box, designer m_46749) */
export const CUT_K = 1.5;

/**
 * The square camera, `size` px, at the scale of `coin` (a fit `coin.widthPx` square), whose centre
 * is the centre of `head`: the head's drawn box in `coin`'s pixels (y down). Pure.
 */
export function cutFit(coin: Fit, head: PxBox, size: number): Fit {
  const u = (coin.right - coin.left) / coin.widthPx;
  const cx = coin.left + ((head.x0 + head.x1) / 2) * u;
  const cy = coin.top - ((head.y0 + head.y1) / 2) * u;
  const half = (size * u) / 2;
  return { target: coin.target, left: cx - half, right: cx + half, top: cy + half, bottom: cy - half, scale: u, widthPx: size, heightPx: size };
}
