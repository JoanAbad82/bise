// The counts outside the app (bar T: W33/N10, the TUI's tab title
// "#2 ●3 · harness"): with the window in the back, the Dock's badge says how
// many cards wait for him, and the window's title says it with the agents at
// work. Pure: index.ts feeds it the core's events and draws what it returns.
//
// A project's open cards: its hub's own `cards` event once one came (the
// store's rule, src/store/store.ts), else its `projects` row's cards, else
// the row's `waits`. Working: the rows' `working`, summed. Plus bise's own notifications ask while
// the inbox lists it (the window says so, ask()): one inbox, one number (designer m_25690).

export interface Counts {
  readonly waiting: number;
  readonly working: number;
}

interface Row {
  readonly cards: number;
  readonly working: number;
}

export class CountKeeper {
  private rows = new Map<string, Row>();
  private readonly hubCards = new Map<string, number>();
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
        const cards = Array.isArray(o['cards']) ? o['cards'].length : num(o['waits']);
        rows.set(o['project'], { cards, working: num(o['working']) });
      }
      this.rows = rows;
    } else if (ev['ev'] === 'cards' && typeof ev['project'] === 'string' && Array.isArray(ev['cards'])) {
      // his cards and bise's own (`others`: a drop asking him...), as the inbox lists them
      this.hubCards.set(ev['project'], ev['cards'].length + (Array.isArray(ev['others']) ? ev['others'].length : 0));
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
    let waiting = 0;
    let working = 0;
    for (const [p, r] of this.rows) {
      waiting += this.hubCards.get(p) ?? r.cards;
      working += r.working;
    }
    // a hub's cards for a project the rows don't list yet (the home, early)
    for (const [p, n] of this.hubCards) if (!this.rows.has(p)) waiting += n;
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

/** The main window's title: 'bise', or 'bise · 2 waiting · 3 working'. */
export function titleOf(c: Counts): string {
  const parts = ['bise'];
  if (c.waiting > 0) parts.push(`${c.waiting} waiting`);
  if (c.working > 0) parts.push(`${c.working} working`);
  return parts.join(' · ');
}
