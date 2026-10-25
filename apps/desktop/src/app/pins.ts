// The agents he pinned to the top of the sidebar (bise fait mac, decision d5, architect m_42051):
// desktop view state that lasts across windows and restarts, kept in the app's prefs through
// prefs_set, one key per project as bims.objects is: `pins.<project hub id>` = the pinned agents'
// names, in the order he pinned them. This module is its one writer (`pin`, nm-menus' Pin calls it)
// and its reader (`usePinned`, the sidebar's Pinned section). An agent is keyed by its name: a pin
// whose agent left the rows (renamed, archived away) is not shown (`livePins`), and the next pin
// or unpin of that project writes the list without it. Owner: nm-frame.
import { useMemo } from 'react';
import type { Agent, JsonValue } from '@/proto';
import { getAppStore, usePrefs } from '@/store';
import { getPref, type Prefs } from '@/settings/prefs';

/** One pinned agent: its project's hub id and its name. */
export interface Pin {
  readonly project: string;
  readonly agent: string;
}

/** The prefs key of a project's pins. */
export const pinsKey = (project: string): string => `pins.${project}`;

/** A project's pinned names from its prefs value: strings only, each once. Pure. */
export function namesOf(v: JsonValue | undefined): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const x of v) if (typeof x === 'string' && x !== '' && !out.includes(x)) out.push(x);
  return out;
}

/** Every pin in the prefs, project by project (the prefs' key order), each project's in pin order. Pure. */
export function pinsOf(prefs: Prefs | null): Pin[] {
  const all = getPref(prefs, 'pins');
  if (all === null || all === undefined || typeof all !== 'object' || Array.isArray(all)) return [];
  return Object.entries(all).flatMap(([project, v]) => namesOf(v).map((agent) => ({ project, agent })));
}

/** The names after a pin (`on`) or an unpin, dropping names no longer in `live` (a rename's old key). Pure. */
export function pinned(names: readonly string[], agent: string, on: boolean, live?: readonly string[]): string[] {
  const kept = names.filter((n) => n !== agent && (live === undefined || live.includes(n)));
  return on ? [...kept, agent] : kept;
}

/** The pins whose agent is still in its project's rows (the sidebar never shows a dead pin). Pure. */
export function livePins(pins: readonly Pin[], agents: (project: string) => readonly Agent[]): Pin[] {
  return pins.filter((p) => agents(p.project).some((a) => a.name === p.agent));
}

/** Whether `agent` of `project` is pinned in `pins`. Pure. */
export const isPinned = (pins: readonly Pin[], project: string, agent: string): boolean =>
  pins.some((p) => p.project === project && p.agent === agent);

/** Every pin now, re-read when the prefs change. */
export function usePinned(): readonly Pin[] {
  const prefs = usePrefs() as Prefs | null;
  return useMemo(() => pinsOf(prefs), [prefs]);
}

/** Pins (`on`) or unpins an agent: one prefs_set of its project's list. */
export function pin(project: string, agent: string, on: boolean): void {
  const store = getAppStore();
  const names = namesOf(getPref(store.prefs() as Prefs | null, pinsKey(project)));
  const live = store.agents(project).map((a) => a.name);
  store.command({ cmd: 'prefs_set', key: pinsKey(project), value: pinned(names, agent, on, live.length === 0 ? undefined : live) });
}
