// The order the cards' pictures are asked in (artifacts-in-folders brief, part 2: « visible cards
// first, the rest in the background one at a time »): the cards in view first (a few at once),
// then the mounted ones just out of view, then the background fill of every other card, which only
// makes the cached picture (want: false) and keeps nothing here. The answers asked for are kept in
// memory, the newest few hundred, so a card scrolled back shows at once with no fade. Pure over its
// `run` (window.bise.thumb). Owner: art-thumbs.
import type { ThumbAnswer, ThumbReq } from '@/shared/api';

/** How a card asks: in view, mounted just out of view, or the background fill. */
export type Rank = 'view' | 'near' | 'fill';

type Run = (req: ThumbReq, want: boolean) => Promise<ThumbAnswer | null>;

interface Job {
  readonly key: string;
  readonly req: ThumbReq;
  rank: Rank;
  readonly waiters: ((a: ThumbAnswer | null) => void)[];
}

/** A request's key: one per version and sig. Pure. */
export const reqKey = (r: ThumbReq): string => `${r.project}/${r.id}-v${String(r.v)}.${r.sig}`;

const ORDER: readonly Rank[] = ['view', 'near', 'fill'];
const UP: Record<Rank, number> = { view: 0, near: 1, fill: 2 };

export class ThumbQueue {
  private readonly answers = new Map<string, ThumbAnswer | null>();
  /** made in the background (the cache has it): a later ask is quick, never asked again by the fill */
  private readonly filled = new Set<string>();
  private readonly waiting = new Map<string, Job>();
  private running = { view: 0, near: 0, fill: 0 };

  constructor(
    private readonly run: Run,
    /** how many in-view asks run at once (a cached one answers in a few ms; main makes one at a time) */
    private readonly viewAtOnce = 3,
    /** the answers kept in memory */
    private readonly keep = 300,
  ) {}

  /** The answer already here (undefined: not asked yet). */
  known(key: string): ThumbAnswer | null | undefined {
    return this.answers.get(key);
  }

  /** A card's ask: its answer when it comes; asked again with a higher rank, it moves up. */
  get(req: ThumbReq, rank: Exclude<Rank, 'fill'>): Promise<ThumbAnswer | null> {
    const key = reqKey(req);
    const have = this.answers.get(key);
    if (have !== undefined) return Promise.resolve(have);
    return new Promise((res) => {
      const job = this.waiting.get(key);
      if (job !== undefined) {
        job.waiters.push(res);
        if (UP[rank] < UP[job.rank]) job.rank = rank;
      } else this.waiting.set(key, { key, req, rank, waiters: [res] });
      this.pump();
    });
  }

  /** A card left the view before its ask ran: it waits behind the ones in view. */
  lower(req: ThumbReq): void {
    const job = this.waiting.get(reqKey(req));
    if (job?.rank === 'view') job.rank = 'near';
  }

  /** The background fill: every one not asked yet, made one at a time once nothing else waits. */
  fill(reqs: readonly ThumbReq[]): void {
    for (const req of reqs) {
      const key = reqKey(req);
      if (this.answers.has(key) || this.filled.has(key) || this.waiting.has(key)) continue;
      this.waiting.set(key, { key, req, rank: 'fill', waiters: [] });
    }
    this.pump();
  }

  /** How many wait, by rank (tests, the dev overlay). */
  counts(): Record<Rank, number> {
    const c = { view: 0, near: 0, fill: 0 };
    for (const j of this.waiting.values()) c[j.rank]++;
    return c;
  }

  private next(): Job | null {
    const busy = this.running.view + this.running.near + this.running.fill;
    for (const rank of ORDER) {
      const may = rank === 'view' ? this.running.view < this.viewAtOnce : busy === 0;
      if (!may) continue;
      for (const j of this.waiting.values()) if (j.rank === rank) return j;
      // anything in view waits for a slot of its own: nothing lower starts meanwhile
      if (rank === 'view' && this.running.view > 0) return null;
    }
    return null;
  }

  private pump(): void {
    for (let job = this.next(); job !== null; job = this.next()) {
      const j = job;
      this.waiting.delete(j.key);
      const rank = j.rank;
      const want = j.waiters.length > 0;
      this.running[rank]++;
      void this.run(j.req, want)
        .catch(() => null)
        .then((a) => {
          this.running[rank]--;
          if (want) this.remember(j.key, a);
          else this.filled.add(j.key);
          // a card asked while the fill made it: it asks again (the cache answers at once)
          for (const w of j.waiters) w(a);
          this.pump();
        });
    }
  }

  private remember(key: string, a: ThumbAnswer | null): void {
    this.answers.delete(key);
    this.answers.set(key, a);
    while (this.answers.size > this.keep) {
      const old = this.answers.keys().next().value;
      if (old === undefined) break;
      this.answers.delete(old);
    }
  }
}
