// src/composer/float · useFloatNow: publishes the floating composer's live height on the document's
// root as --float-now (px), every frame it changes (a ResizeObserver: focus, open, a fold mid-way,
// his field growing), and takes it away when the float goes. What floats over a page's foot sits
// over it (artifacts/folders.css: the selection bar and the undo toast 16 above the pill, designer
// m_48326); unset, they read --float-h, the pill at rest. Owner: selbar-float.
import { useLayoutEffect, type RefObject } from 'react';

export const FLOAT_NOW = '--float-now';

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
