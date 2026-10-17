// A feature test's runner (fast-try p5, architect m_29407): plumbing only. given() feeds the core's
// and the hubs' events (and main's window-local answers) to the window, does() his gestures,
// sent() the commands that left, view.<screen>() what that screen shows, read through the app's
// own function for it (app.ts), never a derivation of ours. reload() is a new window on the same
// keep, given main's kept state events again (src/shared/latest.ts), as a real reload is.
//
// Today the window is the Store: its port is an outbox (a sink: it answers nothing and holds no
// state; the hub's answers come in through given()). When state-machine's step lands (fast-try
// p4), the outbox becomes step's outputs and only this file changes, never a test.
import { inboxCards, Latest, Store, type AnswerFrom, type Card } from './app';
import type { Cmd, Gesture, Here, Input } from './inputs';

export interface Feature {
  /** The core, a hub or main said these, in order. */
  given(...inputs: Input[]): Feature;
  /** He did these, in order. */
  does(...gestures: Gesture[]): Feature;
  /** Time passes (the window's clock; nothing comes in). */
  later(ms: number): Feature;
  /** He reloads the window: a new one on the same keep, main's kept state events replayed. */
  reload(): Feature;
  /** Every command that left the window, oldest first (since the start, across reloads). */
  sent(): readonly Cmd[];
  /** Each screen's "what I show". */
  readonly view: {
    /** The inbox: every open item he hasn't acted on, in its order (inbox/Block.tsx inboxCards). */
    inbox(): readonly Card[];
  };
}

/** Where an answer was made, as the window's views pass it to the store. */
const fromOf = (here: Here): AnswerFrom => (here === 'inbox' ? { at: null, inbox: true } : { at: here });

/** A new window, its core up, nothing given yet. `now`: the clock's start (ms). */
export function feature(now = 1_791_100_000_000): Feature {
  const outbox: Cmd[] = [];
  const kept = new Map<string, unknown>();
  const latest = new Latest();
  let clock = now;
  const open = (): Store => {
    const s = new Store(
      { send: (cmd) => { outbox.push(cmd); } },
      { now: () => clock, asides: { read: (k) => kept.get(k), write: (k, v) => { kept.set(k, v); } } },
    );
    s.setCore('up');
    return s;
  };
  let store = open();

  const doOne = (g: Gesture): void => {
    switch (g.g) {
      case 'answer':
        store.answer(g.project, g.card, g.reply, undefined, undefined, g.from === undefined ? undefined : fromOf(g.from));
        return;
      case 'close':
        store.close(g.project, g.card);
        return;
      case 'retry':
        store.retryCard(g.project, g.card);
        return;
      case 'send':
        store.send({ project: g.project, agent: g.agent, text: g.text });
        return;
      case 'open':
        // the app's switch: the projects shown (App.tsx) and the thread followed (ThreadScreen.tsx)
        store.shown([g.project]);
        store.subscribeThread(g.project, g.agent);
        return;
    }
  };

  const f: Feature = {
    given(...inputs) {
      for (const i of inputs) {
        latest.keep(i as unknown as Record<string, unknown>);
        store.apply(i);
      }
      return f;
    },
    does(...gestures) {
      for (const g of gestures) doOne(g);
      return f;
    },
    later(ms) {
      clock += ms;
      return f;
    },
    reload() {
      store = open();
      for (const e of latest.snapshot()) store.apply(e);
      return f;
    },
    sent: () => [...outbox],
    view: {
      inbox: () => inboxCards(store.projects(), store.acted()),
    },
  };
  return f;
}
