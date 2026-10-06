// The capsule surface's root (window.bise.surface === 'capsule'; lead m_9618): fn from the helper
// and the window's state drive the view (machine.ts), the store gives the spotlight its data and
// bise's answer, and the effects go to the capsule window (show, hide, size) and the main window
// (openWindow). A pushed card shows only when nothing else is up (his action first).
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type JSX } from 'react';
import { InboxCard } from '@/inbox';
import type { Card, HelperEv } from '@/proto';
import { threadKey, useProjects, useStore } from '@/store';
import type { SpotFront, SpotItem } from '@/spotlight';
import '@/ds/index.css';
import { Capsule } from './Capsule';
import { useSpotData } from './data';
import { START, step, type CapEvent, type Fx, type State } from './machine';

interface Model {
  readonly state: State;
  readonly fx: readonly Fx[];
}

const reduce = (m: Model, e: CapEvent): Model => {
  const s = step(m.state, e);
  return { state: s.state, fx: s.fx };
};

/** Cards that come this soon after a project's cards first loaded are still its load (the row's
 *  view.json cards, then the hub's own, arrive one after the other), not a push. */
export const SETTLE_MS = 400;

export interface Loaded {
  readonly at: number;
  readonly ids: Set<string>;
}

/**
 * The cards bise pushes: a project's cards are its inbox until its slice has caught up with its row
 * (`waits`, the hub's count) and settled for SETTLE_MS; after that a card that wasn't there is a
 * push (qa-native: a 'seen' set taken at the first render made the load's last card look pushed and
 * then held the real push behind it).
 */
export function newCards(
  loaded: Map<string, Loaded>,
  projects: readonly { readonly project: string; readonly waits: number }[],
  cards: readonly { readonly id: string; readonly project: string }[],
  now: number,
): string[] {
  const out: string[] = [];
  for (const p of projects) {
    const ids = cards.filter((c) => c.project === p.project).map((c) => c.id);
    const l = loaded.get(p.project);
    if (l === undefined) {
      if (ids.length >= p.waits) loaded.set(p.project, { at: now, ids: new Set(ids) });
      continue;
    }
    const settling = now - l.at < SETTLE_MS;
    for (const id of ids) {
      if (l.ids.has(id)) continue;
      l.ids.add(id);
      if (!settling) out.push(id);
    }
  }
  return out;
}

/** The window route for a spotlight row (amb-win's route strings). */
export function routeOf(item: SpotItem): string | undefined {
  switch (item.kind) {
    case 'agent':
      return `agent/${item.project}/${item.name}`;
    case 'env':
      return `project/${item.project}`;
    case 'card':
      return 'inbox';
    default:
      return undefined;
  }
}

const frontOf = (ev: Extract<HelperEv, { ev: 'front' }>): SpotFront | null =>
  ev.app === null ? null : { app: ev.app, title: ev.title ?? undefined, url: ev.url ?? undefined, path: ev.path ?? undefined };

export function CapsuleRoot(): JSX.Element {
  const store = useStore();
  const bise = (window as Partial<Window>).bise;
  const [m, dispatch] = useReducer(reduce, { state: START, fx: [] });
  const view = m.state.view;
  const [front, setFront] = useState<SpotFront | null>(null);
  const spot = useSpotData(front);
  const projects = useProjects();
  const home = projects.find((p) => p.home)?.project ?? null;
  const still = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  // bise's answer to what he asked: main's thread, subscribed in this window too (qa-flows: the
  // capsule's store never had it), streamed (typing) or arriving whole (a new agent entry after
  // his question)
  const [last, setLast] = useState<{ text: string; done: boolean } | null>(null);
  const asked = useRef<{ after: number; started: boolean } | null>(null);
  useEffect(() => {
    if (home === null) return;
    const key = threadKey(home, 'main');
    store.subscribeThread(home, 'main', 20);
    const read = (): void => {
      const a = asked.current;
      if (a === null) return;
      const typing = store.typing(key);
      const reply = store
        .threadOrder(key)
        .order.filter((pos) => pos > a.after)
        .map((pos) => store.entry(key, pos))
        .filter((e) => e?.kind === 'agent')
        .at(-1);
      const next = typing !== '' ? { text: typing, done: false } : reply !== undefined ? { text: reply.text, done: true } : null;
      if (next === null) return;
      if (!a.started) {
        a.started = true;
        dispatch({ ev: 'answer' });
      }
      setLast(next);
    };
    const offs = [store.subscribe(`typing:${key}`, read), store.subscribe(`order:${key}`, read)];
    return () => {
      offs.forEach((off) => {
        off();
      });
      store.unsubscribeThread(home, 'main');
    };
  }, [store, home]);

  // the effects of each step, once
  useEffect(() => {
    for (const fx of m.fx) {
      if (fx.fx === 'show') bise?.capsule.show(fx.at, fx.keys);
      else if (fx.fx === 'hide') bise?.capsule.hide();
      else if (fx.fx === 'mic') bise?.helper({ cmd: 'own_mic', open: fx.open });
      else if (fx.fx === 'talk') store.command({ cmd: fx.cmd });
      else bise?.openWindow(fx.route);
    }
  }, [m.fx, bise, store]);

  useEffect(() => {
    if (bise === undefined) return;
    const offHelper = bise.onHelper((ev) => {
      if (ev.ev === 'fn') dispatch({ ev: 'fn', act: ev.act, key: ev.key });
      else if (ev.ev === 'front') setFront(frontOf(ev));
      else if (ev.ev === 'quiet') dispatch({ ev: 'quiet', on: ev.on });
    });
    const offState = bise.capsule.onState((s) => {
      dispatch({ ev: 'window', shown: s.shown, why: s.why });
    });
    void bise.helperState().then((evs) => {
      for (const ev of evs) {
        if (ev.ev === 'front') setFront(frontOf(ev));
        else if (ev.ev === 'quiet') dispatch({ ev: 'quiet', on: ev.on });
      }
    });
    return () => {
      offHelper();
      offState();
    };
  }, [bise]);

  // the projects this window shows: all of them (the spotlight lists every project's agents and
  // cards, a push may come from any); the core sends their rows, agents and cards only after a
  // 'shown' (amb-core 932b7186), the store dedupes and re-says it to a core that comes back
  const shownKey = projects.map((p) => p.project).join('|');
  useEffect(() => {
    store.shown(shownKey === '' ? [] : shownKey.split('|'));
  }, [store, shownKey]);

  // a card bise pushes: new in a project whose cards had loaded (newCards)
  const loaded = useRef(new Map<string, Loaded>());
  useEffect(() => {
    for (const id of newCards(loaded.current, projects, spot.cards, performance.now())) dispatch({ ev: 'card', id });
    if (view.kind === 'card' && !spot.cards.some((c) => c.id === view.id)) dispatch({ ev: 'card_done', id: view.id });
  }, [spot.cards, projects, view]);

  const cardOf = useCallback(
    (id: string) => {
      const [project = '', n = ''] = id.split(/\.(?=[^.]+$)/u);
      const c: Card | undefined = store.cards(project).find((x) => String(x.id) === n);
      if (c === undefined) return null;
      // amb-home's card (ff4c4013): no state, no keys; the capsule owns them
      return (
        <InboxCard
          card={c}
          project={store.projects().find((p) => p.project === project)?.name}
          now={Date.now()}
          keys="1 2 pick   esc later"
          acts={{
            pick: (n) => {
              store.answer(project, c.id, String(n));
            },
            close: () => {
              dispatch({ ev: 'card_done', id });
            },
            open: () => {
              bise?.openWindow('inbox');
              dispatch({ ev: 'close' });
            },
          }}
          testId="capsule.card.view"
        />
      );
    },
    [store, bise],
  );

  return (
    <Capsule
      view={view}
      spot={spot}
      answer={last}
      heard=""
      level={0}
      still={still}
      card={cardOf}
      onAsk={(text) => {
        if (home === null) return;
        const order = store.threadOrder(threadKey(home, 'main')).order;
        asked.current = { after: order.length === 0 ? -1 : Math.max(...order), started: false };
        store.send({ project: home, agent: 'main', text });
        setLast(null);
      }}
      onOpen={(item) => {
        bise?.openWindow(routeOf(item));
        dispatch({ ev: 'close' });
      }}
      onOpenWindow={(route) => {
        bise?.openWindow(route);
        dispatch({ ev: 'close' });
      }}
      onClose={() => {
        dispatch({ ev: 'close' });
      }}
      onQuit={
        bise === undefined
          ? null
          : () => {
              bise.quit();
            }
      }
      onSize={(w, h, glass) => {
        bise?.capsule.size(w, h, glass);
      }}
    />
  );
}
