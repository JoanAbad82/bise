// The window's clock: ages ("12 min") move once a minute, from one shared
// timer, never from a render reading Date.now(). A reader that shows
// seconds ('continues when search answers · 12 s') takes the second
// clock while it does (useNowFor): on the minute one its `now` lagged up
// to a minute behind the hub's instants and read '0 s' (reply-clock).
// One `now` for both. Owner: amb-win.
import { useSyncExternalStore } from 'react';

const MINUTE = 60_000;
const SECOND = 1000;
let now = Date.now();

/** A clock of one period: its listeners, its timer while it has some. */
function clock(period: number): (l: () => void) => () => void {
  const listeners = new Set<() => void>();
  let timer: ReturnType<typeof setInterval> | undefined;
  return (l) => {
    listeners.add(l);
    if (timer === undefined) {
      now = Date.now();
      timer = setInterval(() => {
        now = Date.now();
        for (const x of [...listeners]) x();
      }, period);
    }
    return () => {
      listeners.delete(l);
      if (listeners.size === 0 && timer !== undefined) {
        clearInterval(timer);
        timer = undefined;
      }
    };
  };
}

const subscribe = clock(MINUTE);
const subscribeSeconds = clock(SECOND);

/** Today's local midnight: re-renders its reader only when the day changes (M14's hover times). */
export function useToday(): number {
  return useSyncExternalStore(subscribe, () => new Date(now).setHours(0, 0, 0, 0));
}

/** Now, to the minute: re-renders its reader once a minute. */
export function useNow(seconds = false): number {
  return useSyncExternalStore(seconds ? subscribeSeconds : subscribe, () => now);
}

/**
 * Now, to the second while `fine(now)` says the reader shows seconds (a
 * pause under a minute), else to the minute. Its first read is the minute
 * clock's (maybe behind: `fine` then sees a duration clamped to 0 s, so
 * it asks for seconds), the second clock takes over until `fine` says no.
 */
export function useNowFor(fine: (now: number) => boolean): number {
  const coarse = useNow();
  return useNow(fine(coarse));
}
