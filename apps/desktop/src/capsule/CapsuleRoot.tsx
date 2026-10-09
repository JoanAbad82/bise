// The capsule surface's root (window.bise.surface === 'capsule'; lead m_9618): fn from the helper
// and the window's state drive the view (machine.ts), the store gives the spotlight its data and
// bise's answer, and the effects go to the capsule window (show, hide, size) and the main window
// (openWindow). It never pushes a card (the user's decision 2026-10-09, card #476): a question
// shows in the window's inbox block when the window is in front, as a native notification when it
// isn't; here a card opens only from the spotlight's 'waiting for you' rows.
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type JSX } from 'react';
import { newAgent } from '@/agents/actions';
import { InboxCard } from '@/inbox';
import { cardKeyOf } from '@/inbox/Strip';
import type { Card, HelperEv } from '@/proto';
import { threadKey, useHeard, useLevel, useProjects, useStore } from '@/store';
import { followPartial, type LivePartial } from '@/shared/partial';
import type { SpotAnswer, SpotFront, SpotItem, SpotRoute } from '@/spotlight';
import { W } from '@/spotlight/words';
import { useTheme } from '@/theme';
import '@/ds/index.css';
import { Capsule } from './Capsule';
import { useAgentPreview, useSpotData } from './data';
import { START, step, type CapEvent, type Fx, type State } from './machine';

interface Model {
  readonly state: State;
  readonly fx: readonly Fx[];
}

const reduce = (m: Model, e: CapEvent): Model => {
  const s = step(m.state, e);
  return { state: s.state, fx: s.fx };
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
  useTheme();
  const store = useStore();
  const bise = (window as Partial<Window>).bise;
  const [m, dispatch] = useReducer(reduce, { state: START, fx: [] });
  const view = m.state.view;
  const [front, setFront] = useState<SpotFront | null>(null);
  const spot = useSpotData(front);
  const projects = useProjects();
  const home = projects.find((p) => p.home)?.project ?? null;
  // R07-a: the agent row the spotlight's keyboard is on shows its last actions (main's thread
  // stays followed for his asks: never unsubscribed from here)
  const [selAgent, setSelAgent] = useState<{ id: string; project: string; name: string } | null>(null);
  const preview = useAgentPreview(view.kind === 'spot' ? selAgent : null, home === null ? null : threadKey(home, 'main'));
  const still = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  // bise's answer to what he asked: main's thread, subscribed in this window too (qa-flows: the
  // capsule's store never had it), streamed (typing) or arriving whole (a new agent entry after
  // his question)
  const [last, setLast] = useState<SpotAnswer | null>(null);
  // rebase: his ask follows main's thread again (R18: another window's unsubscribe used to drop
  // this one's follow, and the answer never came); until that fresh page lands, an entry already
  // in it is never his answer, so `after` moves past the page first
  const asked = useRef<{ after: number; started: boolean; rebase: boolean } | null>(null);
  const followAsk = useCallback(
    (h: string): void => {
      const order = store.threadOrder(threadKey(h, 'main')).order;
      // (the answer view opens with its first reply, which replaces the last answer then)
      asked.current = { after: order.length === 0 ? -1 : Math.max(...order), started: false, rebase: true };
      store.subscribeThread(h, 'main', 20);
    },
    [store],
  );
  // main's reply while it is written (the hub's partial, 250 ms at most; shared/partial.ts,
  // followed in the effect below): it shows from its first words, and the entry that lands after
  // it takes its place (same text: no change; LiveText fades only what is new)
  const liveRef = useRef<LivePartial | null>(null);
  useEffect(() => {
    if (home === null) return;
    const key = threadKey(home, 'main');
    store.subscribeThread(home, 'main', 20);
    const read = (): void => {
      const a = asked.current;
      if (a === null) return;
      const typing = store.typing(key);
      const reply = a.rebase
        ? undefined
        : store
        .threadOrder(key)
        .order.filter((pos) => pos > a.after)
        .map((pos) => store.entry(key, pos))
        .filter((e) => e?.kind === 'agent')
        .at(-1);
      const partial = liveRef.current;
      const next = partial !== null ? { text: partial.text, done: false } : typing !== '' ? { text: typing, done: false } : reply !== undefined ? { text: reply.text, done: true } : null;
      if (next === null) return;
      if (!a.started) {
        a.started = true;
        dispatch({ ev: 'answer' });
      }
      setLast(next);
    };
    const offs = [
      store.subscribe(`typing:${key}`, read),
      store.subscribe(`order:${key}`, read),
      // the ask's follow is live again: its fresh page (always before the ask's own entries, one
      // connection, in order) moves `after` past what it holds; a live entry first (no page: a
      // core that never dropped the follow) just ends the wait
      store.onEvent((ev) => {
        const a = asked.current;
        if (a === null || !a.rebase || (ev.ev !== 'thread' && ev.ev !== 'entry') || ev.project !== home || ev.agent !== 'main') return;
        a.rebase = false;
        if (ev.ev === 'thread') a.after = Math.max(a.after, ...ev.entries.map((e) => e.pos));
        else read();
      }),
    ];
    const port = bise?.core;
    if (port !== undefined) {
      offs.push(
        followPartial(port, home, 'main', (live) => {
          liveRef.current = live;
          if (live !== null) {
            read();
            return;
          }
          // cleared (its entry landed, a stop, an error): no more '∿'; an entry, if one comes, replaces it
          if (asked.current?.started === true) setLast((l) => (l !== null && !l.done ? { ...l, done: true } : l));
        }),
      );
    }
    return () => {
      offs.forEach((off) => {
        off();
      });
      store.unsubscribeThread(home, 'main');
    };
  }, [store, home, bise]);

  // the routing hold on his send (bar ⛔3, lead m_9855): shown from the hub's route event at once,
  // gone on its route_done; esc (or fn esc) keeps it with bise, another project corrects it
  const [route, setRoute] = useState<(SpotRoute & { readonly project: string }) | null>(null);
  const routeRef = useRef(route);
  useEffect(() => {
    routeRef.current = route;
  });
  useEffect(
    () =>
      store.onEvent((ev) => {
        if (ev.ev === 'route') setRoute({ project: ev.project, rid: ev.rid, to: ev.to, name: ev.name, until: ev.correct_until_ms });
        else if (ev.ev === 'route_done') {
          setRoute((r) => (r !== null && r.rid === ev.rid && r.project === ev.project ? null : r));
          // his ask went to another project's main: its answer is in that thread, never here
          // (R18: the spot must say where it went, not wait on bise's own thread)
          const a = asked.current;
          if (a !== null && !a.started && ev.state === 'sent' && ev.to !== ev.project) {
            asked.current = null;
            const name = store.projects().find((p) => p.project === ev.to)?.name ?? ev.to;
            setLast({ text: W.wentTo(name), done: true, note: true });
          }
        }
      }),
    [store],
  );
  const keepWithBise = useCallback((): void => {
    const r = routeRef.current;
    if (r === null) return;
    store.command({ cmd: 'route_cancel', project: r.project, rid: r.rid });
    setRoute(null);
  }, [store]);
  const routeTo = (to: string): void => {
    const r = routeRef.current;
    if (r === null) return;
    store.command({ cmd: 'route_correct', project: r.project, rid: r.rid, to });
    const name = store.projects().find((p) => p.project === to)?.name ?? to;
    setRoute({ ...r, to, name });
  };

  // the effects of each step, once
  useEffect(() => {
    for (const fx of m.fx) {
      if (fx.fx === 'show') bise?.capsule.show(fx.at, fx.keys, fx.fit);
      else if (fx.fx === 'hide') bise?.capsule.hide();
      else if (fx.fx === 'mic') bise?.helper({ cmd: 'own_mic', open: fx.open });
      else if (fx.fx === 'talk') {
        store.command({ cmd: fx.cmd });
        // what he said goes to bise's main through the core: its reply is the answer view's,
        // as a typed ask's is (without this the talk never reached its answer)
        if (fx.cmd === 'talk_end' && home !== null) followAsk(home);
      } else bise?.openWindow(fx.route);
    }
  }, [m.fx, bise, store, home, followAsk]);

  useEffect(() => {
    if (bise === undefined) return;
    const offHelper = bise.onHelper((ev) => {
      if (ev.ev === 'fn' && ev.act === 'esc' && routeRef.current !== null) keepWithBise();
      else if (ev.ev === 'fn') dispatch({ ev: 'fn', act: ev.act, key: ev.key });
      else if (ev.ev === 'front') setFront(frontOf(ev));
    });
    const offState = bise.capsule.onState((s) => {
      dispatch({ ev: 'window', shown: s.shown, why: s.why });
    });
    void bise.helperState().then((evs) => {
      for (const ev of evs) {
        if (ev.ev === 'front') setFront(frontOf(ev));
      }
    });
    return () => {
      offHelper();
      offState();
    };
  }, [bise, keepWithBise]);

  // a card opened from the spotlight's waiting row has the keyboard (the spotlight had it): its
  // digits pick, esc goes back to the list, ⏎ opens it in bise, ⌘⌫ closes it (the strip's keys)
  const fromSpot = view.kind === 'card' ? view.id : null;
  useEffect(() => {
    if (fromSpot === null) return;
    const [project = '', n = ''] = fromSpot.split(/\.(?=[^.]+$)/u);
    const onKey = (e: KeyboardEvent): void => {
      // the ⏎ that opened the card is still bubbling here (React runs this effect inside its
      // dispatch): the spotlight handled it, so it never opens the inbox and closes again
      if (e.defaultPrevented || e.isComposing) return;
      const c = store.cards(project).find((x) => String(x.id) === n);
      if (c === undefined) return;
      if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        bise?.openWindow('inbox');
        dispatch({ ev: 'close' });
        return;
      }
      const k = cardKeyOf(e, c, null);
      if (k === null) return;
      e.preventDefault();
      if (k.t === 'later') dispatch({ ev: 'later' });
      else if (k.t === 'close') dispatch({ ev: 'card_done', id: fromSpot });
      else if (k.t === 'pick') store.answer(project, c.id, String(k.n));
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [fromSpot, store, bise]);

  // the projects this window shows: all of them (the spotlight lists every project's agents and
  // cards); the core sends their rows, agents and cards only after a
  // 'shown' (amb-core 932b7186), the store dedupes and re-says it to a core that comes back
  const shownKey = projects.map((p) => p.project).join('|');
  useEffect(() => {
    store.shown(shownKey === '' ? [] : shownKey.split('|'));
  }, [store, shownKey]);

  // the open card was answered or went away (here, in the window, or in the TUI): back to the list
  useEffect(() => {
    if (view.kind === 'card' && !spot.cards.some((c) => c.id === view.id)) dispatch({ ev: 'card_done', id: view.id });
  }, [spot.cards, view]);

  const cardOf = useCallback(
    (id: string) => {
      const [project = '', n = ''] = id.split(/\.(?=[^.]+$)/u);
      const c: Card | undefined = store.cards(project).find((x) => String(x.id) === n);
      if (c === undefined) return null;
      // amb-home's card v2 (98ac9ea7): the inbox's option rows on the capsule's glass; with
      // acts.open its footer says '1–3 pick   ⏎ open in bise   esc later' by itself
      return (
        <InboxCard
          card={c}
          project={store.projects().find((p) => p.project === project)?.name}
          now={Date.now()}
          surface="glass"
          acts={{
            later: () => {
              dispatch({ ev: 'later' });
            },
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

  // fn's talk: the words the core heard so far and the mic's level (the talk view grows with them,
  // up to its 320 px cap, then scrolls; amb-mac's place.ts pin keeps the top-left)
  const heard = useHeard();
  const level = useLevel('you');

  return (
    <Capsule
      view={view}
      spot={spot}
      answer={last}
      heard={heard?.text ?? ''}
      level={level}
      still={still}
      card={cardOf}
      route={route}
      onRouteKeep={keepWithBise}
      onRouteTo={routeTo}
      onAsk={(text, files) => {
        if (home === null) return;
        followAsk(home);
        // R41: the images and files he pasted or dropped ride the send; the hub renders them once,
        // an image as a block the model sees
        store.send({ project: home, agent: 'main', text, ...(files === undefined ? {} : { files }) });
        // asked: the spot says so at once (∿), its first words take the line's place (R18)
        setLast({ text: '', done: false });
      }}
      onNew={(brief) => {
        // amb-win's newAgent (the TUI's /new): bise's home names it from the brief; it shows in 'at work'
        if (home !== null) newAgent(store, home, { brief });
      }}
      preview={preview}
      onSelect={(item) => {
        setSelAgent((prev) => (item?.kind !== 'agent' ? null : prev?.id === item.id ? prev : { id: item.id, project: item.project, name: item.name }));
      }}
      onOpen={(item) => {
        // a waiting row answers in place: the card's options and keys, esc back (qa-native R03:
        // it opened the inbox and closed the capsule to nothing)
        if (item.kind === 'card') {
          dispatch({ ev: 'open_card', id: item.id.replace(/^card\./u, '') });
          return;
        }
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
