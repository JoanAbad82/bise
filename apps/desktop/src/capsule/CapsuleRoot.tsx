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
import { NONE, step, type CapEvent, type Fx, type View } from './machine';

interface Model {
  readonly view: View;
  readonly fx: readonly Fx[];
}

const reduce = (m: Model, e: CapEvent): Model => {
  const s = step(m.view, e);
  return { view: s.view, fx: s.fx };
};

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
  const [m, dispatch] = useReducer(reduce, { view: NONE, fx: [] });
  const [front, setFront] = useState<SpotFront | null>(null);
  const spot = useSpotData(front);
  const projects = useProjects();
  const home = projects.find((p) => p.home)?.project ?? null;
  const still = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  // bise's answer: what main is writing now, kept once it stops until the next question
  const [last, setLast] = useState<{ text: string; done: boolean } | null>(null);
  useEffect(() => {
    if (home === null) return;
    const key = threadKey(home, 'main');
    let was = store.typing(key);
    return store.subscribe(`typing:${key}`, () => {
      const now = store.typing(key);
      if (now !== '') {
        if (was === '') dispatch({ ev: 'answer' });
        setLast({ text: now, done: false });
      } else if (was !== '') {
        setLast((l) => (l === null ? null : { text: l.text, done: true }));
      }
      was = now;
    });
  }, [store, home]);

  // the effects of each step, once
  useEffect(() => {
    for (const fx of m.fx) {
      if (fx.fx === 'show') bise?.capsule.show(fx.at, fx.keys);
      else if (fx.fx === 'hide') bise?.capsule.hide();
      else bise?.openWindow(fx.route);
    }
  }, [m.fx, bise]);

  useEffect(() => {
    if (bise === undefined) return;
    const offHelper = bise.onHelper((ev) => {
      if (ev.ev === 'fn') dispatch({ ev: 'fn', act: ev.act, key: ev.key });
      else if (ev.ev === 'front') setFront(frontOf(ev));
    });
    const offState = bise.capsule.onState((s) => {
      dispatch({ ev: 'window', shown: s.shown, why: s.why });
    });
    void bise.helperState().then((evs) => {
      for (const ev of evs) if (ev.ev === 'front') setFront(frontOf(ev));
    });
    return () => {
      offHelper();
      offState();
    };
  }, [bise]);

  // a new card bise pushes (one he hasn't seen in this run)
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    const ids = spot.cards.map((c) => c.id);
    if (seen.current === null) {
      seen.current = new Set(ids); // the cards already open at start are the inbox's, not a push
      return;
    }
    for (const id of ids) {
      if (!seen.current.has(id)) {
        seen.current.add(id);
        dispatch({ ev: 'card', id });
      }
    }
    if (m.view.kind === 'card' && !ids.includes(m.view.id)) dispatch({ ev: 'card_done', id: m.view.id });
  }, [spot.cards, m.view]);

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
      view={m.view}
      spot={spot}
      answer={last}
      heard=""
      level={0}
      still={still}
      card={cardOf}
      onAsk={(text) => {
        if (home !== null) store.send({ project: home, agent: 'main', text });
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
      onSize={(w, h) => {
        bise?.capsule.size(w, h);
      }}
    />
  );
}
