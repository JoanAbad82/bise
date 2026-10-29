// What an idle bim does on its map's own place (architect m_37970: one row per kind, so the timeline
// asks this table and a new map adds a row, not a branch): skating in California's park (skate.ts),
// climbing in the climbing gym (climb.ts). Each row picks who takes it up, the spot it goes to, what
// makes its segment the same stretch, and when a resting one's next line wakes the loop. A map has one
// place at most, so a bim has one pastime at most. Pure. Owner: bims-climb.
import type { Activity, BimFrame, FunIn, Office, Pastime, Spot } from './model';
import { pastimes as skaters, wakeIn as skateWake } from './skate';
import { climbWake, climbers } from './climb';

interface Row {
  pick(acts: ReadonlyMap<string, Activity>, o: Office, t: number, fun: FunIn | undefined): ReadonlyMap<string, Pastime>;
  spot(o: Office, p: Pastime): Spot | undefined;
  wake(frames: readonly BimFrame[], o: Office | null): number | null;
}

const ROWS: Readonly<Record<Pastime['kind'], Row>> = {
  skate: {
    pick: skaters,
    spot: (o, p) => o.park?.spots[p.slot],
    wake: (frames, o) => skateWake(frames, o?.park),
  },
  climb: {
    pick: climbers,
    spot: (o, p) => o.gym?.spots[p.slot],
    wake: climbWake,
  },
};

/** Who takes up a pastime now, by name (every row's; a map has one place at most). Pure. */
export function pastimesOf(acts: ReadonlyMap<string, Activity>, o: Office, t: number, fun: FunIn | undefined): ReadonlyMap<string, Pastime> {
  const out = new Map<string, Pastime>();
  for (const row of Object.values(ROWS)) for (const [name, p] of row.pick(acts, o, t, fun)) if (!out.has(name)) out.set(name, p);
  return out;
}

/** The spot a pastime goes to on this office (its park's, its gym's); undefined when the map has none. */
export const pastimeSpot = (o: Office, p: Pastime): Spot | undefined => ROWS[p.kind].spot(o, p);

/** What makes a pastime's segment the same stretch: its kind, its slot, what it reads (a skater's pool and 900), the stage. */
export function pastimeSig(p: Pastime): string {
  const extra = p.kind === 'skate' ? `${p.pool ? 'pool' : ''}|${p.nine ? '900' : ''}` : '';
  return `${p.kind}|${String(p.slot)}|${extra}|${String(p.stage)}`;
}

/** When the loop must wake for a resting one's next line (s from now), the soonest of every row's; null: none rests. */
export function pastimeWake(frames: readonly BimFrame[], o: Office | null): number | null {
  let soon: number | null = null;
  for (const row of Object.values(ROWS)) {
    const w = row.wake(frames, o);
    if (w !== null) soon = soon === null ? w : Math.min(soon, w);
  }
  return soon;
}
