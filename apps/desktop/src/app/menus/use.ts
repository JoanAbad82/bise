// src/app/menus · useEntityMenu: a thing's native menu (bise fait mac, page native-mac mockup 9 and
// decision d4): the same menu on a right click and on its '…' (ds MoreButton), built from one pure
// action registry (registry.ts) and shown by macOS (window.bise.popupMenu, Electron's Menu.popup);
// a pick runs through run.ts. useAgentMenuBar keeps the menu bar's Agent menu on the agent in
// view (main/agentmenu.ts), with the same items. Every screen wires it in its own files:
// <ListRow onContextMenu={m.onContextMenu} end={<MoreButton menu={m} />} />. The facts are read
// from the store when the menu opens (no subscription per row). Owner: nm-menus.
import { useEffect, useMemo, type MouseEvent } from 'react';
import type { EntityMenu } from '@/ds';
import type { Agent, Artifact, Proc, ProjectRow, ScheduledTask } from '@/proto';
import { threadKey, useAgents, useStore, type Store } from '@/store';
import type { BiseApi, PopupAt } from '@/shared/api';
import { entityKey, type Entity } from '@/shared/entity';
import { closeOtherTabs, closeTab, moveTab, openTab, tabEntity, tabMoveable } from '../panel/tabs';
import { panelState } from '../panel/state';
import { closable } from '../panel/model';
import { isPinned, pin, pinsOf } from '../pins';
import type { Prefs } from '@/settings/prefs';
import { MAIN, type Route } from '../route';
import { useRoute, useRouter, type Router } from '../router';
import { emitAction } from '../menu';
import { askEntityAction } from './actions';
import { menuOf, type Act, type MenuFacts } from './registry';
import { runAct, type MenuFx } from './run';

/** What the facts are read from: the store's rows, and the app's own view state. */
export interface FactReads {
  readonly projects: () => readonly ProjectRow[];
  readonly agents: (project: string) => readonly Agent[];
  readonly artifacts: (project: string) => readonly Artifact[];
  readonly processes: (project: string) => readonly Proc[];
  readonly scheduled: (project: string) => readonly ScheduledTask[];
  readonly pinned: (project: string, agent: string) => boolean;
  readonly reply: (project: string, agent: string) => string | undefined;
  /** a panel tab's thing (none: Overview, New tab, a terminal), whether it moves, closes (Overview never), whether others are open */
  readonly tab: (id: string) => { readonly inner: Entity | undefined; readonly moveable: boolean; readonly closable: boolean; readonly others: boolean };
}

/** `e`'s facts now: its row by its ids (an agent by its name, 'main' by its flag). Pure but for the reads. */
export function factsOf(e: Entity, r: FactReads): MenuFacts {
  switch (e.kind) {
    case 'agent': {
      const row = r.agents(e.project).find((a) => (e.agent === MAIN ? a.main : a.name === e.agent));
      return { e, row, pinned: row !== undefined && r.pinned(e.project, row.name), reply: row !== undefined && r.reply(e.project, row.name) !== undefined };
    }
    case 'project':
      return { e, row: r.projects().find((p) => p.project === e.project) };
    case 'artifact':
      return { e, row: r.artifacts(e.project).find((a) => a.id === e.id) };
    case 'process':
      return { e, row: r.processes(e.project).find((p) => p.agent === e.agent && p.id === e.id) };
    case 'scheduled':
      return { e, row: r.scheduled(e.project).find((t) => t.id === e.id) };
    case 'tab': {
      const t = r.tab(e.id);
      return { e, inner: t.inner === undefined ? undefined : factsOf(t.inner, r), moveable: t.moveable, closable: t.closable, others: t.others };
    }
    default:
      return { e };
  }
}

/** The agent's newest answer this window holds (its thread is open or was), as text. */
export function lastReply(store: Store, project: string, agent: string): string | undefined {
  const key = threadKey(project, agent);
  const order = store.threadOrder(key).order;
  for (let i = order.length - 1; i >= 0; i--) {
    const pos = order[i];
    if (pos === undefined) continue;
    const en = store.entry(key, pos);
    if (en?.kind === 'agent' && en.text.trim() !== '') return en.text;
  }
  return undefined;
}

function readsOf(store: Store): FactReads {
  return {
    projects: () => store.projects(),
    agents: (p) => store.agents(p),
    artifacts: (p) => store.artifacts(p),
    processes: (p) => store.processes(p),
    scheduled: (p) => store.scheduled(p),
    pinned: (p, a) => isPinned(pinsOf(store.prefs() as Prefs | null), p, a),
    reply: (p, a) => lastReply(store, p, a),
    tab: (id) => ({ inner: tabEntity(id), moveable: tabMoveable(id), closable: closable(id), others: panelState.get().tabs.list.some((x) => x.id !== id && closable(x.id)) }),
  };
}

const biseOf = (): Partial<BiseApi> | undefined => (window as Partial<Window>).bise;

/** Is `route` the thread of `agent` (its screen takes ⌘.: it shows 'stopping'). Pure. */
export function inView(route: Route, project: string, agent: string, main: boolean): boolean {
  return route.screen === 'thread' && route.project === project && (route.agent === agent || (main && route.agent === MAIN));
}

/** The real effects, for this window. */
function fxOf(store: Store, router: Router): MenuFx {
  const bise = biseOf();
  return {
    command: (cmd) => {
      store.command(cmd);
    },
    stop: (project, agent) => {
      const main = store.agents(project).find((a) => a.name === agent)?.main === true;
      if (inView(router.get(), project, agent, main)) emitAction('stop');
      else store.stop(project, agent);
    },
    rename: (e) => {
      if (askEntityAction('rename', e)) return;
      // nobody shows it to rename in place: the page that can
      if (e.kind === 'agent') router.go({ screen: 'agents', project: e.project });
      else if (e.kind === 'project') router.go({ screen: 'settings', page: 'projects' });
    },
    openTab,
    openWindow: (to) => bise?.openWindow?.(to),
    copy: (text) => void bise?.copy?.(text),
    showInFinder: (path) => void bise?.showInFinder?.(path),
    openPath: (path) => void bise?.openPath?.(path),
    quickLook: (path) => void bise?.quickLook?.(path),
    openExternal: (url) => void bise?.openExternal?.(url),
    pin,
    reply: (p, a) => lastReply(store, p, a),
    closeTab,
    closeOtherTabs,
    moveTab,
  };
}

/** The '…' button's box when it has the focus (MoreButton's click), else none: at the pointer. */
function moreBox(): PopupAt | undefined {
  const el = document.activeElement;
  if (!(el instanceof HTMLElement) || !el.classList.contains('b-more')) return undefined;
  const b = el.getBoundingClientRect();
  return { x: b.left, y: b.top, width: b.width, height: b.height };
}

/** Opens `e`'s menu now (under `at`, else at the pointer) and runs his pick. */
async function show(e: Entity, store: Store, router: Router, at: PopupAt | undefined): Promise<void> {
  const popup = biseOf()?.popupMenu;
  if (popup === undefined) return;
  const facts = factsOf(e, readsOf(store));
  const items = menuOf(facts);
  if (items.length === 0) return;
  const id = await popup(items, at);
  if (id !== null) runAct(id as Act, factsOf(e, readsOf(store)), fxOf(store, router));
}

/** `e`'s menu: onContextMenu for a right click on its row or tab, open() for its '…'. */
export function useEntityMenu(e: Entity): EntityMenu {
  const store = useStore();
  const router = useRouter();
  // an Entity is a fresh object each render: its key is its identity
  const key = entityKey(e);
  return useMemo(
    () => ({
      onContextMenu: (ev: MouseEvent<HTMLElement>) => {
        ev.preventDefault();
        ev.stopPropagation();
        void show(e, store, router, undefined);
      },
      open: () => {
        void show(e, store, router, moreBox());
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, store, router],
  );
}

/** The agent a route shows, if any. Pure. */
export function agentInView(route: Route): Entity | undefined {
  return route.screen === 'thread' ? { kind: 'agent', project: route.project, agent: route.agent } : undefined;
}

/**
 * In the shell: the menu bar's Agent menu is the agent in view's (its items again on every change
 * of its row), hidden when none is; a pick there runs like the '…'s.
 */
export function useAgentMenuBar(): void {
  const store = useStore();
  const router = useRouter();
  const route = useRoute();
  const e = agentInView(route);
  const agents = useAgents(e?.kind === 'agent' ? e.project : '');
  const items = useMemo(() => (e === undefined ? null : menuOf(factsOf(e, readsOf(store)))), [e?.kind === 'agent' ? e.agent : '', agents, store]); // eslint-disable-line react-hooks/exhaustive-deps
  const json = JSON.stringify(items);
  useEffect(() => {
    biseOf()?.agentMenu?.(items);
    // its items' words, not their object: a new agents event with the same menu sends nothing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [json]);
  useEffect(() => {
    const on = biseOf()?.onAgentMenu;
    if (on === undefined) return;
    return on((id) => {
      const now = agentInView(router.get());
      if (now !== undefined) runAct(id as Act, factsOf(now, readsOf(store)), fxOf(store, router));
    });
  }, [store, router]);
}
