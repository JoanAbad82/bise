// The application menu's actions for this window (⌘, ⌘I ⌘F: amb-mac's
// src/main/menu.ts sends them through window.bise.onMenu), and its Agent menu kept on the agent in
// view (app/menus/use.ts useAgentMenuBar; its ⌘. Stop asks the thread with emitAction('stop')).
// Owner: nm-menus.
//
// One subscription to the preload for the whole window (useMenuRouting,
// in the shell); 'settings' is a route, 'inbox' opens the block in place, anything else goes to
// the screens that listen for it (useMenuAction: the thread's ⌘F).
import { useEffect, useRef } from 'react';
import type { MenuAction } from '@/shared/api';
import type { Router } from './router';
import { inboxAtOf, parseRoute } from './route';
import { askInbox } from './inboxAsk';
import type { ScreenAction } from './keys';
import { panel } from '@/terminal/panel';
import { useAgentMenuBar } from './menus/use';

/** What a screen may be asked: a menu item's ('find') or a window key's ('fold-all', 'stop'...). */
export type AppAction = MenuAction | ScreenAction;

type Listener = (action: AppAction) => void;
const listeners = new Set<Listener>();

/** Ask the shown screens (the shell's keys call it). */
export function emitAction(action: AppAction): void {
  for (const l of [...listeners]) l(action);
}

/** The route a menu action opens, if it is one. Pure. */
export function routeOfMenu(action: MenuAction): 'settings' | undefined {
  return action === 'settings' ? action : undefined;
}

/** In the shell: the menu's routes go to the router, the rest to the screens. */
export function useMenuRouting(router: Router) {
  // the menu bar's Agent menu follows the agent in view (bise fait mac, d4)
  useAgentMenuBar();
  useEffect(() => {
    // the page outside Electron (a component test) has no preload
    const bise = (window as Partial<Window>).bise;
    if (bise === undefined) return;
    return bise.onMenu((action) => {
      // b1/b2: ⌘I opens the inbox block in place, on the screen he is on (never a route)
      if (action === 'inbox') {
        askInbox();
        return;
      }
      const screen = routeOfMenu(action);
      if (screen !== undefined) router.go({ screen });
      else emitAction(action);
    });
  }, [router]);
}

/**
 * In the shell: a route main sends this live window (the capsule's
 * openWindow(route) while the window is open, amb-mac b9f1fc04) goes to the
 * router; a wrong one shows notfound, as a link.
 */
export function useMainRoutes(router: Router) {
  useEffect(() => {
    const bise = (window as Partial<Window>).bise;
    if (bise === undefined) return;
    return bise.onRoute((route) => {
      // View > Terminal while another window had the keys: the terminal here, where it lives
      if (route === 'terminal') {
        panel.reveal();
        return;
      }
      // b1/b2: 'inbox' / a notification's 'inbox?card=<project>/<id>' open the block in place
      const inbox = inboxAtOf(route);
      if (inbox !== undefined) askInbox(inbox.at);
      else router.go(parseRoute(route));
    });
  }, [router]);
}

/** In a screen: `handler` runs on that menu action while the screen is shown. */
export function useMenuAction(action: AppAction, handler: () => void) {
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });
  useEffect(() => {
    const l: Listener = (a) => {
      if (a === action) latest.current();
    };
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, [action]);
}
