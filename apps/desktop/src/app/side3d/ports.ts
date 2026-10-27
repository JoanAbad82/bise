// src/app/side3d · what the right side reads from the other chunks, in one place: the left width
// (rail + sidebar, nm-frame's frame-state), the tabbed panel's box and the kind of the artifact in
// front of it (nm-panel's state: what the thread keeps beside it), the tab in front (a float's row
// that opened one closes the float), the panel's Overview at a
// section (nm-panel), a new agent (nm-frame's ⌘N), whose items it lists (side.ts panelProject, the
// Overview's scope). Owner: nm-side.
import { openTab } from '@/app/panel/tabs';
import { panelState, useFrontArtKind, usePanelBox } from '@/app/panel/state';
import { useLeftWidth } from '@/app/frame-state';
import { newAgent } from '@/app/newagent';
import { panelProject } from '@/app/side';

export { newAgent, openTab, panelProject, useFrontArtKind, useLeftWidth, usePanelBox };

/** The panel's tab in front when it is open, else null: a float's row that opens a tab moved it. */
export function panelFront(): string | null {
  const s = panelState.get();
  return s.open ? s.tabs.active : null;
}
