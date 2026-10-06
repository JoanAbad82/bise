// Fixture replay: the events of rust/proto/fixtures (typed constants in
// src/proto/fixtures.gen.ts) fed into a store, for unit tests, component
// tests and a fake core's first state. The fixtures are the one source.
import { core_ev, hub_ev } from '@/proto/fixtures.gen';
import type { Ev, Store } from './store';

/** Every fixture event the store applies: the core's, then the hubs'. */
export function allFixtureEvents(): readonly Ev[] {
  return [...core_ev, ...hub_ev];
}

/** Applies `events` in order; returns how many the store took (unknown tags are skipped). */
export function replay(store: Store, events: readonly unknown[] = allFixtureEvents()): number {
  let n = 0;
  for (const ev of events) if (store.apply(ev)) n += 1;
  return n;
}
