// The hub's one-connection moments the shell acts on (amb-feed m_16785): `focused` (the hub moved
// this connection's focus: the agent it was on is archived or gone, so back to main) switches the
// open thread of that project to it when that agent is indeed no longer live;
// `card_open` (this connection's /update found a new release) opens that card in the inbox block,
// in place, like a notification's click. Draws nothing. Owner: amb-win.
import { useCallback } from 'react';
import { useCoreEvent, useStore, type Ev } from '@/store';
import type { Agent } from '@/proto';
import type { Route } from './route';
import { useRouter } from './router';
import { askInbox, type InboxAt } from './inboxAsk';

/**
 * What a moment asks of the shell, from the route he is on and that project's agents. Pure.
 * focused follows only when the agent he has open is gone or archived (the hub's reason to move
 * the focus): a focused that comes again (a world said again after a reload or a core restart)
 * never takes him off a live agent.
 */
export function momentOf(ev: Ev, route: Route, agents: readonly Pick<Agent, 'name' | 'archived'>[] = []): { go: Route } | { inbox: InboxAt } | null {
  if (ev.ev === 'focused') {
    // only the thread he has open in that project follows (another screen stays where it is)
    if (route.screen !== 'thread' || route.project !== ev.project || route.agent === ev.focus || ev.focus === '') return null;
    if (agents.some((a) => a.name === route.agent && !a.archived)) return null;
    return { go: { screen: 'thread', project: ev.project, agent: ev.focus } };
  }
  if (ev.ev === 'card_open') return { inbox: { project: ev.project, card: ev.id } };
  return null;
}

export function HubMoments() {
  const router = useRouter();
  const store = useStore();
  const on = useCallback(
    (ev: Ev) => {
      const route = router.get();
      // read at the moment, never subscribed: the shell does not re-render on agents
      const m = momentOf(ev, route, route.screen === 'thread' ? store.agents(route.project) : []);
      if (m === null) return;
      if ('go' in m) router.go(m.go);
      else askInbox(m.inbox);
    },
    [router, store],
  );
  useCoreEvent(on);
  return null;
}
