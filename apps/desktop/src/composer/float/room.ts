// src/composer/float · useFloatNow: publishes the floating composer's live height on the document's
// root as --float-now (px), every frame it changes (a ResizeObserver: focus, open, a fold mid-way,
// his field growing), and its axis as --float-x (the window's x of its centre, useFloatX), and takes
// them away when the float goes. What floats over a page's foot sits over it, on its axis
// (artifacts/folders.css: the selection bar and the undo toast 16 above the pill, centred on its
// column, designer m_48326, m_48460); unset, they read --float-h, the pill at rest, and the
// window's centre. Owner: selbar-float.
import { useLayoutEffect, type RefObject } from 'react';

export const FLOAT_NOW = '--float-now';
export const FLOAT_X = '--float-x';

/** Keep --float-x on <html> to the float's centre (its inline left, px from the window's left). */
export function useFloatX(x: number): void {
  useLayoutEffect(() => {
    const doc = document.documentElement;
    doc.style.setProperty(FLOAT_X, `${x}px`);
  }, [x]);
  useLayoutEffect(
    () => () => {
      document.documentElement.style.removeProperty(FLOAT_X);
    },
    [],
  );
}

/** Keep --float-now on <html> to the float's border-box height while it is mounted. */
export function useFloatNow(root: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const el = root.current;
    if (el === null) return;
    const doc = el.ownerDocument.documentElement;
    const put = (): void => {
      doc.style.setProperty(FLOAT_NOW, `${el.offsetHeight}px`);
    };
    put();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(put);
    ro?.observe(el);
    return () => {
      ro?.disconnect();
      doc.style.removeProperty(FLOAT_NOW);
    };
  }, [root]);
}
