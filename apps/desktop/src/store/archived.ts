// agents-light (issue 36, architect m_37220): a hub's agents event carries its live agents in
// full and, when it changed, the archived ones as light rows (name, aliases, dir, status,
// since_ms, about). The store keeps the last list per project and merges both into the one
// agents slice every view reads, so the sidebar, search and ⌘K read archived rows as before.
// The same rule as bise_proto's rows::Archived::merge (Rust), pinned by one fixture
// (rust/proto/fixtures/archived_merge.json, read by both tests). Pure.

import type { Agent, ArchivedAgent } from '@/proto';

/** An archived agent's row from its light row: those fields, the rest at their defaults
 *  (never invented; agent/get gives the full row). `about` is its title. */
export function ofArchived(a: ArchivedAgent): Agent {
  return {
    name: a.name,
    main: false,
    status: a.status,
    archived: true,
    title: a.about ?? '',
    purpose: '',
    since_ms: a.since_ms,
    waits: 0,
    dir: a.dir,
    ...(a.aliases !== undefined && a.aliases.length > 0 ? { aliases: a.aliases } : {}),
    watching: [],
  };
}

/** An agents event's rows given the list kept so far: the list it carries replaces the kept
 *  one (none: kept), then the live rows and each archived one. An older hub's archived rows
 *  inside `agents` stay as they are. */
export function mergeArchived(
  agents: readonly Agent[],
  archived: readonly ArchivedAgent[] | undefined | null,
  kept: readonly ArchivedAgent[],
): { rows: Agent[]; kept: readonly ArchivedAgent[] } {
  const list = archived ?? kept;
  return { rows: [...agents, ...list.map(ofArchived)], kept: list };
}
