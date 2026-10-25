// inboxOf reads every project's open cards from the core's projects rows (a
// held hub's own cards, else its view.json's). (The thread's inbox strip it
// fed, ThreadInbox, went with the dock in bise fait mac, nm-composer.)
// Owner: amb-home.
import type { ProjectRow } from '@/proto';
import { withConfirmOptions } from './model';

/** Every project's cards, and each project's name, from the projects rows. */
export function inboxOf(rows: readonly ProjectRow[]) {
  return {
    // a gated call's options are the TUI's (the hub sends none): withConfirmOptions
    cards: rows.flatMap((r) => (r.cards ?? []).map(withConfirmOptions)),
    names: Object.fromEntries(rows.map((r) => [r.project, r.name])),
    homes: new Set(rows.filter((r) => r.home).map((r) => r.project)),
  };
}
