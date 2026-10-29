// The counts outside the app (bar T: W33/N10, the TUI's tab title
// "#2 ●3 · harness"): with the window in the back, the Dock's badge says how
// many cards wait for him, and the menu bar's ':*' says it with the agents at
// work (the window's title is what he looks at since bise fait mac: app/title.ts).
// Pure: index.ts feeds it the core's events and draws what it returns.
//
// A project's open cards: its hub's own `cards` event once one came (the
// store's rule, src/store/store.ts), else its `projects` row's cards, else
// the row's `waits`. Working: the rows' `working`, summed. Plus bise's own notifications ask while
// the inbox lists it (the window says so, ask()): one inbox, one number (designer m_25690). A
// newer bise is one card for the machine (update-dot): every hub's update card of a release counts
// once between them (shared/update.ts countOnce).
import { countOnce } from '../shared/update';

export interface Counts {
  readonly waiting: number;
  readonly working: number;
}

interface Row {
  /** its open cards (the row's), or null: only its `waits` count is known */
  readonly cards: readonly unknown[] | null;
  readonly waits: number;
  readonly working: number;
}

export class CountKeeper {
  private rows = new Map<string, Row>();
  private readonly hubCards = new Map<string, readonly unknown[]>();
  private last: Counts = { waiting: 0, working: 0 };
  private asks = false;

  /** The window lists bise's notifications ask (or no more); the new counts when they changed, else null. */
  ask(on: boolean): Counts | null {
    this.asks = on;
    return this.next();
  }

  /** One core event; the new counts when they changed, else null. */
  apply(ev: Record<string, unknown>): Counts | null {
    if (ev['ev'] === 'projects' && Array.isArray(ev['projects'])) {
      const rows = new Map<string, Row>();
      for (const r of ev['projects'] as unknown[]) {
        if (typeof r !== 'object' || r === null) continue;
        const o = r as Record<string, unknown>;
        if (typeof o['project'] !== 'string') continue;
        rows.set(o['project'], { cards: Array.isArray(o['cards']) ? (o['cards'] as unknown[]) : null, waits: num(o['waits']), working: num(o['working']) });
      }
      this.rows = rows;
    } else if (ev['ev'] === 'cards' && typeof ev['project'] === 'string' && Array.isArray(ev['cards'])) {
      // his cards and bise's own (`others`: a drop asking him...), as the inbox lists them
      this.hubCards.set(ev['project'], [...(ev['cards'] as unknown[]), ...(Array.isArray(ev['others']) ? (ev['others'] as unknown[]) : [])]);
    } else {
      return null;
    }
    return this.next();
  }

  private next(): Counts | null {
    const now = this.count();
    if (now.waiting === this.last.waiting && now.working === this.last.working) return null;
    this.last = now;
    return now;
  }

  get counts(): Counts {
    return this.last;
  }

  private count(): Counts {
    let waits = 0;
    let working = 0;
    const lists: (readonly unknown[])[] = [];
    for (const [p, r] of this.rows) {
      const cards = this.hubCards.get(p) ?? r.cards;
      if (cards === null) waits += r.waits;
      else lists.push(cards);
      working += r.working;
    }
    // a hub's cards for a project the rows don't list yet (the home, early)
    for (const [p, cards] of this.hubCards) if (!this.rows.has(p)) lists.push(cards);
    let waiting = waits + countOnce(lists);
    if (this.asks) waiting += 1;
    return { waiting, working };
  }
}

function num(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
}

/** The Dock's badge: the waiting cards, '' for none (no badge). */
export function badgeOf(c: Counts): string {
  if (c.waiting <= 0) return '';
  return c.waiting > 99 ? '99+' : String(c.waiting);
}
