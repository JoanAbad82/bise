// The demo tour as the window keeps it (bar L25 / S37, amb-kit's pure tour.ts): one Tour per
// project for the window's life, fed from the store. Every screen that shows a tip (the sidebar's
// demo rows, a demo agent's thread, amb-home's inbox strip) calls useTour(project) and gets the
// same {tip, snap}; observe() runs once per new snapshot whoever saw it first, and his send goes
// through sent() (ThreadScreen's onSend). The palette's open flag comes from the shell
// (paletteOpen). Owner: amb-win (the holder); the tour's rules and words are amb-kit's.
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useAgents, useProjects } from '@/store';
import { useRoute } from '@/app/router';
import { MAIN, type Route } from '@/app/route';
import { numbersOf } from '@/agents/model';
import { sortCards } from '@/inbox/order';
import type { Agent, Card } from '@/proto';
import { TOUR, isDemo, observe, sent, tip as tipOf, type Member, type Snap, type Tip, type Tour } from './tour';

interface Held {
  tour: Tour;
  /** the snapshot observe() saw last (its key) */
  seen: string | null;
}

const held = new Map<string, Held>();
let palette = false;
let version = 0;
const subs = new Set<() => void>();

function bump(): void {
  version += 1;
  for (const f of subs) f();
}

function subscribe(f: () => void): () => void {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
}

const getVersion = (): number => version;

function heldOf(project: string): Held {
  let h = held.get(project);
  if (h === undefined) {
    h = { tour: TOUR, seen: null };
    held.set(project, h);
  }
  return h;
}

/** The shell tells the tour when the agent palette (⌘K) opens or closes. */
export function paletteOpen(open: boolean): void {
  if (palette === open) return;
  palette = open;
  bump();
}

/** The demo agents of a project in the hub's (start) order, with their ⌥ numbers. An archived
 *  row has no purpose (agents-light: its light row, architect m_37220): it is a demo one when the
 *  window saw it live as one (`known`, by its dir). Pure. */
export function membersOf(agents: readonly Agent[], nums: ReadonlyMap<string, number>, known: ReadonlySet<string> = new Set()): Member[] {
  return agents
    .filter((a) => !a.main && (isDemo(a.purpose) || (a.archived && known.has(a.dir))))
    .map((a) => ({ name: a.name, number: a.archived ? null : (nums.get(a.name) ?? null), archived: a.archived }));
}

/** Each project's demo agents the window saw live, by dir (membersOf's `known`). */
const demoDirs = new Map<string, Set<string>>();

/** `project`'s known demo dirs, with its live demo agents now added. */
export function knownDemos(project: string, agents: readonly Agent[]): ReadonlySet<string> {
  let known = demoDirs.get(project);
  if (known === undefined) {
    known = new Set();
    demoDirs.set(project, known);
  }
  for (const a of agents) if (!a.main && !a.archived && isDemo(a.purpose)) known.add(a.dir);
  return known;
}

/** The thread in view for this project: an agent's name, 'main' anywhere else. Pure. */
export function focusOf(route: Route, project: string): string {
  return route.screen === 'thread' && route.project === project ? route.agent : MAIN;
}

/** Who the card in front of him is about: the project's first card in the inbox's order. Pure. */
export function cardOf(cards: readonly Card[]): string | null {
  return sortCards(cards)[0]?.agent ?? null;
}

/** What the tour sees now. Pure. */
export function snapOf(agents: readonly Agent[], nums: ReadonlyMap<string, number>, route: Route, project: string, cards: readonly Card[], open: boolean, known: ReadonlySet<string> = new Set()): Snap {
  return { members: membersOf(agents, nums, known), focus: focusOf(route, project), card: cardOf(cards), palette: open };
}

/** A new snapshot of a project: observe() once, whichever screen saw it first. */
export function observeTour(project: string, snap: Snap): void {
  const h = heldOf(project);
  const key = JSON.stringify(snap);
  if (h.seen === key) return;
  h.seen = key;
  const next = observe(h.tour, snap);
  if (next === h.tour) return;
  h.tour = next;
  bump();
}

/** He sent a message in this project. */
export function sentTour(project: string, snap: Snap): void {
  const h = heldOf(project);
  h.tour = sent(h.tour, snap);
  bump();
}

/** The project's tip now. */
export function tipNow(project: string, snap: Snap): Tip | null {
  return tipOf(heldOf(project).tour, snap);
}

/** For the tests: forget every tour and the palette flag. */
export function resetTours(): void {
  held.clear();
  demoDirs.clear();
  palette = false;
  bump();
}

/** The demo tour of `project`: the tip to show now, the snapshot its words read, and his send. */
export function useTour(project: string): { tip: Tip | null; snap: Snap; sent: () => void } {
  const agents = useAgents(project);
  const rows = useProjects();
  const route = useRoute();
  useSyncExternalStore(subscribe, getVersion);
  const open = palette;
  const cards = useMemo(() => rows.find((r) => r.project === project)?.cards ?? [], [rows, project]);
  const snap = useMemo(() => snapOf(agents, numbersOf(project, agents), route, project, cards, open, knownDemos(project, agents)), [agents, project, route, cards, open]);
  useEffect(() => {
    observeTour(project, snap);
  }, [project, snap]);
  const onSent = useCallback(() => {
    sentTour(project, snap);
  }, [project, snap]);
  return { tip: tipNow(project, snap), snap, sent: onSent };
}
