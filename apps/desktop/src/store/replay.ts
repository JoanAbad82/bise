// Fixture replay: the events of rust/proto/fixtures (typed constants in
// src/proto/fixtures.gen.ts) fed into a store, for unit tests, component
// tests and a fake core's first state. The fixtures are the one source.
import { core_ev, hub_ev } from '@/proto/fixtures.gen';
import type { Ev, Store } from './store';

/** A terminal's `/diff` answer (client-protocol's DiffView: it carries the `req` it answers); the window never asks one. */
const terminalDiff = (ev: Ev): boolean => ev.ev === 'diff' && ev.req != null;

/** Every fixture event the store applies: the core's, then the hubs' (the terminal's `/diff` answers left out: on the same agent they would stand in for the review's diff). */
export function allFixtureEvents(): readonly Ev[] {
  return [...core_ev, ...hub_ev.filter((ev) => !terminalDiff(ev))];
}

/** Applies `events` in order; returns how many the store took (unknown tags are skipped). */
export function replay(store: Store, events: readonly unknown[] = allFixtureEvents()): number {
  let n = 0;
  for (const ev of events) if (store.apply(ev)) n += 1;
  return n;
}
