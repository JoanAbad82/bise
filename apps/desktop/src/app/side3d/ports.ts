// src/app/side3d · what the right side reads from the other chunks, in one place: the left width
// (rail + sidebar, nm-frame's frame-state), the tabbed panel's box (nm-panel's state), the panel's
// Overview at a section (nm-panel), a new agent (nm-frame's ⌘N), whose items it lists (side.ts
// panelProject, the Overview's scope). Owner: nm-side.
import { openOverview, openTab } from '@/app/panel/tabs';
import { usePanelBox } from '@/app/panel/state';
import { useLeftWidth } from '@/app/frame-state';
import { newAgent } from '@/app/newagent';
import { panelProject } from '@/app/side';

export { newAgent, openOverview, openTab, panelProject, useLeftWidth, usePanelBox };
