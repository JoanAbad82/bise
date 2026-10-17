// Where a far office's bims stand (page bims-maps v9: « les bims de loin sont des silhouettes sans
// animation »): each live agent's activity (activity.ts) at the spot its office keeps for it, still,
// and which desks' screens are lit. Office life (a snack trip) reads as the lounge, so a far office
// changes only when an agent's state does: the town redraws on change, never on a timer. Pure. Owner: maps-e.
import type { Activity, Office, Spot } from '../model';

export interface Stand {
  readonly name: string;
  readonly x: number;
  readonly z: number;
  readonly main: boolean;
}

/** what a far office shows of its agents: their still spots and the desks whose screen is on */
export interface Still {
  readonly stands: readonly Stand[];
  readonly lit: readonly string[];
}

const LIT = new Set<Activity['k']>(['work', 'hot', 'main', 'visit', 'report']);

/** Every live bim's still spot and the lit desks, from its activity. Pure. */
export function stillOf(o: Office, acts: ReadonlyMap<string, Activity>, mainName: string): Still {
  const used = new Map<string, number>();
  const shared = (list: readonly Spot[], key: string): Spot | undefined => {
    const i = used.get(key) ?? 0;
    used.set(key, i + 1);
    return list.length === 0 ? undefined : list[i % list.length];
  };
  const stands: Stand[] = [];
  const lit: string[] = [];
  for (const [name, a] of acts) {
    const main = name === mainName;
    const own = main ? o.mainDesk : (o.desks.get(name) ?? o.door);
    let at: Spot | undefined;
    switch (a.k === 'snack' ? 'lounge' : a.at) {
      case 'desk':
      case 'main':
        at = own;
        break;
      case 'lounge':
        at = shared(o.lounge, 'lounge') ?? own;
        break;
      case 'island':
        at = shared(o.islandSpots, 'island') ?? own;
        break;
      case 'board':
        at = shared(o.boardSpots, 'board') ?? own;
        break;
      case 'terrace':
        at = shared(o.terrace, 'terrace') ?? own;
        break;
      case 'queue':
        at = o.queue[Math.max(1, a.rank ?? 1) - 1] ?? o.queue.at(-1) ?? own;
        break;
      default:
        at = o.door;
    }
    stands.push({ name, x: at.x, z: at.z, main });
    if (LIT.has(a.k)) lit.push(name);
  }
  stands.sort((p, q) => p.name.localeCompare(q.name));
  lit.sort();
  return { stands, lit };
}

/** A still's signature: the town rebuilds a far office only when it changes. Pure. */
export function stillSig(s: Still): string {
  return `${s.stands.map((b) => `${b.name}@${b.x.toFixed(2)},${b.z.toFixed(2)}`).join(';')}|${s.lit.join(',')}`;
}
