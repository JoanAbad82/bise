// The window's minute clock: ages ("12 min") move once a minute, from one
// shared timer, never from a render reading Date.now(). Owner: amb-win.
import { useSyncExternalStore } from 'react';

const MINUTE = 60_000;
let now = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribe(l: () => void): () => void {
  listeners.add(l);
  if (timer === undefined) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      for (const x of [...listeners]) x();
    }, MINUTE);
  }
  return () => {
    listeners.delete(l);
    if (listeners.size === 0 && timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/** Today's local midnight: re-renders its reader only when the day changes (M14's hover times). */
export function useToday(): number {
  return useSyncExternalStore(subscribe, () => new Date(now).setHours(0, 0, 0, 0));
}

/** Now, to the minute: re-renders its reader once a minute. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, () => now);
}
