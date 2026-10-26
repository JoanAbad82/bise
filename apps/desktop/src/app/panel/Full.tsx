// src/app/panel · the screen under the panel in full width (panel-full, his m_45439): gone, its
// thread rows and its docked composer with it, while the panel is full width; the floating composer
// over the panel writes there (composer/float), his draft and caret go across (composer/handoff.ts).
// App.tsx's Current wraps the screen in it. Owner: panel-full.
import type { ReactNode } from 'react';
import { usePanelFull } from './state';

/** Its children, unless the panel is full width now. */
export function UnlessFull({ children }: { children: ReactNode }) {
  return usePanelFull() ? null : children;
}
