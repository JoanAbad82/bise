// src/app/side3d · what the right side reads from the other chunks, in one place: the left width
// (rail + sidebar, nm-frame's frame-state), the tabbed panel's box (nm-panel's state), the panel's
// Overview at a section (nm-panel), a new agent (nm-frame's ⌘N). Owner: nm-side.
import { openTab } from '@/app/panel/tabs';
import { useLeftWidth } from '@/app/frame-state';

export { openTab, useLeftWidth };

/** The tabbed panel: open, and its width (0 folded), live. */
export function usePanelBox(): { readonly open: boolean; readonly width: number } {
  // PENDING(nm-panel): app/panel/state.ts usePanelBox
  return { open: false, width: 0 };
}

/** Opens (or brings to the front) the panel's Overview tab at a section. */
export const openOverview: (project: string, section: 'agents' | 'artifacts' | 'processes') => void = () => {
  // PENDING(nm-panel): app/panel/tabs.ts openOverview
};

/** A new agent in `project`: the sidebar's row and ⌘N's. */
export const newAgent: (project: string) => void = () => {
  // PENDING(nm-frame): app/newagent.ts newAgent
};
