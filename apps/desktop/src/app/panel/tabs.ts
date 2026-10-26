// src/app/panel · the tabbed panel's doors (bise fait mac, plan native-mac-plan v4 §1: the panel on
// the right, folded by default, one tab per thing). openTab is the one door every chunk uses to put
// a thing in a tab (a row's click, a bubble's card, a menu's 'Move to right pane'); the panel decides
// where it goes and what it draws. The tab menu's acts (nm-menus, Entity { kind: 'tab', id }) come
// from here too. The rules are model.ts's, the live state state.ts's. Owner: nm-panel.
import type { Entity } from '@/shared/entity';
import { panel } from '@/terminal/panel';
import { closeOthersId, closeTabId, openOverviewAt, openWhat, panelState, type OverviewSection } from './state';

/** Opens `e` in a tab of this window's panel (an open one comes to the front), unfolding the panel. */
export function openTab(e: Entity): void {
  openWhat({ kind: 'thing', e });
}

/** The Overview in front, scrolled to `section` (a card's ▯ 'pin as a tab', nm-side): of the view, as the card's. */
export function openOverview(section: OverviewSection): void {
  openOverviewAt(section);
}

/** A tab's menu: Close. */
export function closeTab(id: string): void {
  closeTabId(id);
}

/** A tab's menu: Close others. */
export function closeOtherTabs(id: string): void {
  closeOthersId(id);
}

/** The thing a tab shows, for its menu's own items (open in a new window...); undefined for Overview, New tab, a shell. */
export function tabEntity(id: string): Entity | undefined {
  const what = panelState.get().tabs.list.find((x) => x.id === id)?.what;
  return what?.kind === 'thing' ? what.e : undefined;
}

/** A tab that can move to the bottom: a shell (the terminal's 'move to bottom'). */
export function tabMoveable(id: string): boolean {
  return panelState.get().tabs.list.find((x) => x.id === id)?.what.kind === 'terminal';
}

/** A shell's tab to the bottom panel: the tab closes, the terminal shows under the screen, and stays there. */
export function moveTab(id: string, to: 'bottom'): void {
  const what = panelState.get().tabs.list.find((x) => x.id === id)?.what;
  if (what?.kind !== 'terminal') return;
  closeTabId(id);
  panel.setPlace(to);
  panel.show();
}

/** The bottom panel's terminal back to a tab on the right (his pref, the default). */
export function moveTerminal(to: 'right'): void {
  panel.hide();
  panel.setPlace(to);
}
