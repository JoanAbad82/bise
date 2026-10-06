// The application menu's actions for this window (⌘, ⌘I ⌘F: amb-mac's
// src/main/menu.ts sends them through window.bise.onMenu). Owner: amb-win.
//
// One subscription to the preload for the whole window (useMenuRouting,
// in the shell); 'inbox' and 'settings' are routes, anything else goes to
// the screens that listen for it (useMenuAction: the thread's ⌘F).
import { useEffect, useRef } from 'react';
import type { MenuAction } from '@/shared/api';
import type { Router } from './router';

type Listener = (action: MenuAction) => void;
const listeners = new Set<Listener>();

/** The route a menu action opens, if it is one. Pure. */
export function routeOfMenu(action: MenuAction): 'inbox' | 'settings' | undefined {
  return action === 'inbox' || action === 'settings' ? action : undefined;
}

/** In the shell: the menu's routes go to the router, the rest to the screens. */
export function useMenuRouting(router: Router) {
  useEffect(() => {
    // the page outside Electron (a component test) has no preload
    const bise = (window as Partial<Window>).bise;
    if (bise === undefined) return;
    return bise.onMenu((action) => {
      const screen = routeOfMenu(action);
      if (screen !== undefined) router.go({ screen });
      else for (const l of [...listeners]) l(action);
    });
  }, [router]);
}

/** In a screen: `handler` runs on that menu action while the screen is shown. */
export function useMenuAction(action: MenuAction, handler: () => void) {
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
