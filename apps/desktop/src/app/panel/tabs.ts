// src/app/panel · the tabbed panel's tabs (bise fait mac, plan native-mac-plan v4 §1: the panel on
// the right, folded by default, one tab per thing). openTab is the one door every chunk uses to
// put a thing in a tab (a row's click, a bubble's card, a menu's 'Move to right pane'); the panel
// decides where it goes and what it draws. The contract nm-ds set for the wave; nm-panel fills it.
// Owner: nm-panel.
import type { Entity } from '@/shared/entity';

/** Opens `e` in a tab of this window's panel (an open one comes to the front), unfolding the panel. */
export const openTab: (e: Entity) => void = () => {
  // STUB(native-mac): nm-panel
};
