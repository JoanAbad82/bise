// src/ds · a banner's bled box (ds/css/banner.css data-bleed: a live scene's canvas past the
// visual box to the banner's edges): how far it reaches past the visual box, so the scene rests
// fitted in that box (bims/render/camera.ts bleed). Owner: banner-entrance.

/** css px a bled box reaches past the banner's visual box it sits in, on each side; none outside a banner */
export function bleedOf(box: HTMLElement): { l: number; t: number; r: number; b: number } {
  const vis = box.parentElement;
  if (vis === null || !vis.classList.contains('vis')) return { l: 0, t: 0, r: 0, b: 0 };
  const a = box.getBoundingClientRect();
  const v = vis.getBoundingClientRect();
  const px = (n: number): number => Math.max(0, Math.round(n));
  return { l: px(v.left - a.left), t: px(v.top - a.top), r: px(a.right - v.right), b: px(a.bottom - v.bottom) };
}
