// src/app/side3d · what the right side reads from the other chunks, in one place: the left width
// (rail + sidebar, nm-frame's frame-state), the tabbed panel's box (nm-panel's state), the panel's
// Overview at a section (nm-panel), a new agent (nm-frame's ⌘N). Owner: nm-side.
import { openOverview, openTab } from '@/app/panel/tabs';
import { usePanelBox } from '@/app/panel/state';
import { useLeftWidth } from '@/app/frame-state';

export { openOverview, openTab, useLeftWidth, usePanelBox };

/** A new agent in `project`: the sidebar's row and ⌘N's. */
export const newAgent: (project: string) => void = () => {
  // PENDING(nm-frame): app/newagent.ts newAgent
};
