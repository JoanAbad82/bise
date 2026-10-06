// One line at the top of the window while bise's core can't be reached
// (bar S.5; qa-native's setup/offline, test id app.core). Owner: amb-win.
//
// The core is Electron main's child (amb-core's src/main/core): main
// starts it again by itself, so the line only says what happens; it goes
// once the core is up. A first start says nothing for its first 2 s (a
// normal launch never flashes it).
import { useEffect, useState } from 'react';
import type { CoreState } from '@/shared/api';
import { useCoreState } from '@/store';

/** How long a first start may take before the line says so. */
export const QUIET_START_MS = 2000;

/** The line's words for a core state; none when nothing is to be said. Pure. */
export function coreLine(state: CoreState, o: { wasUp: boolean; slow: boolean }): string | undefined {
  switch (state) {
    case 'up':
      return undefined;
    case 'down':
      return "bise isn't running · starting it again…";
    case 'starting':
      if (o.wasUp) return 'starting bise again…';
      return o.slow ? 'starting bise…' : undefined;
  }
}

export function CoreLine() {
  const state = useCoreState();
  const [wasUp, setWasUp] = useState(false);
  const [slow, setSlow] = useState(false);
  if (state === 'up' && !wasUp) setWasUp(true);
  useEffect(() => {
    if (state !== 'starting' || wasUp) return;
    const t = setTimeout(() => {
      setSlow(true);
    }, QUIET_START_MS);
    return () => {
      clearTimeout(t);
    };
  }, [state, wasUp]);
  const text = coreLine(state, { wasUp, slow });
  if (text === undefined) return null;
  return (
    <div className="app-core" role="status" data-testid="app.core" data-state={state}>
      {text}
    </div>
  );
}
