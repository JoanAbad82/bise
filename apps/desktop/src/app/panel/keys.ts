// src/app/panel · the panel's keys (page native-mac §4 #2, native-mac-qa §7 and §12): ⌘T New tab,
// ⌘W closes the tab in front (only while the panel is open: else the window's), ⌘⇧] and ⌘⇧[ the
// next and previous tab, and the launcher's rows: ⌘P Files, ⌥⌘S Side thread, ⌥⌘D Changes, ⌘L
// Browser. ⌥⌘0 (the panel) and ⌃` (the terminal) keep their arms in app/keys.ts and
// terminal/model.ts. panelKeyOf decides, pure (app/keys.ts's one arm calls it); doPanelKey acts.
// Owner: nm-panel.
import type { KeyLike } from '@/app/keys';
import { MAIN, projectOf, type Route } from '@/app/route';
import { closeActive, openLauncher, openShell, openWhat, stepTab } from './state';

/** The keys the panel's tips and the launcher's rows name. */
export const PANEL_KEYS = {
  toggle: '⌥⌘0',
  close: '⌘W',
  add: '⌘T',
  files: '⌘P',
  terminal: '⌃`',
  side: '⌥⌘S',
  changes: '⌥⌘D',
  browser: '⌘L',
} as const;

/** What a panel key does. */
export type PanelKey = 'new-tab' | 'close-tab' | 'next-tab' | 'prev-tab' | 'files' | 'side' | 'changes' | 'browser';

/** The panel's key for `e`, if it is one; ⌘W, ⌘⇧[ and ⌘⇧] only while the panel is open. Pure. */
export function panelKeyOf(e: KeyLike, open: boolean): PanelKey | undefined {
  const meta = e.metaKey && !e.ctrlKey;
  if (!meta) return undefined;
  if (!e.altKey && !e.shiftKey) {
    if (e.code === 'KeyT') return 'new-tab';
    if (e.code === 'KeyW') return open ? 'close-tab' : undefined;
    if (e.code === 'KeyP') return 'files';
    if (e.code === 'KeyL') return 'browser';
    return undefined;
  }
  if (e.shiftKey && !e.altKey) {
    if (e.code === 'BracketRight') return open ? 'next-tab' : undefined;
    if (e.code === 'BracketLeft') return open ? 'prev-tab' : undefined;
    return undefined;
  }
  if (e.altKey && !e.shiftKey) {
    if (e.code === 'KeyS') return 'side';
    if (e.code === 'KeyD') return 'changes';
  }
  return undefined;
}

/** The agent in view: a thread's, else none (bise's own, a page). Pure. */
export function agentInView(route: Route): { project: string; agent: string } | undefined {
  return route.screen === 'thread' ? { project: route.project, agent: route.agent } : route.screen === 'review' ? { project: route.project, agent: route.agent } : undefined;
}

/** A window event the launcher listens to: focus its field (⌘L Browser, ⌘P Files with no folder). */
export const LAUNCH_FOCUS = 'bise:launch-focus';

export interface PanelCtx {
  readonly route: Route;
  /** bise's own project (the home hub), for a page with no project */
  readonly home: string | undefined;
  /** his project's folder in Finder (window.bise.openPath) */
  readonly openFolder: (project: string) => void;
}

/**
 * Acts on a panel key (or a launcher row, which does the same), in the context of the route in
 * view. `instead`: the launcher tab the pick came from (it becomes what it opened).
 */
export function doPanelKey(k: PanelKey | 'terminal', c: PanelCtx, instead?: string): void {
  const project = projectOf(c.route) ?? c.home;
  switch (k) {
    case 'new-tab':
      openLauncher();
      return;
    case 'close-tab':
      closeActive();
      return;
    case 'next-tab':
      stepTab(1);
      return;
    case 'prev-tab':
      stepTab(-1);
      return;
    case 'terminal':
      if (project !== undefined) openShell(project, instead);
      return;
    case 'files':
      if (project !== undefined) c.openFolder(project);
      return;
    case 'side': {
      // the lead's thread beside the one in view; on the lead's own, bise's
      if (project === undefined) return;
      const a = agentInView(c.route);
      const side = a !== undefined && a.agent !== MAIN ? { project: a.project, agent: MAIN } : c.home !== undefined && c.home !== project ? { project: c.home, agent: MAIN } : undefined;
      if (side !== undefined) openWhat({ kind: 'thing', e: { kind: 'agent', ...side } }, instead);
      return;
    }
    case 'changes': {
      const a = agentInView(c.route);
      if (a !== undefined) openWhat({ kind: 'thing', e: { kind: 'diff', project: a.project, agent: a.agent } }, instead);
      return;
    }
    case 'browser':
      // the launcher's field takes the address: a New tab in front, its field focused
      if (instead === undefined) openLauncher();
      window.dispatchEvent(new Event(LAUNCH_FOCUS));
      return;
  }
}
