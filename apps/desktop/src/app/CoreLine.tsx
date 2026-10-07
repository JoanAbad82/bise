// One line at the top of the window while bise's core can't be reached
// (bar S.5; qa-native's setup/offline, test id app.core). Owner: amb-win.
//
// The core is Electron main's child (amb-core's src/main/core): main
// starts it again by itself, so the line only says what happens; it goes
// once the core is up. A first start says nothing for its first 2 s (a
// normal launch never flashes it). When the core ended (amb-mac's CoreExit,
// e9b26d21), the line says how, its last stderr line goes dim under it, and
// a crash (bar O.4) offers its report: shown in Finder, or its path copied.
import { useEffect, useState } from 'react';
import type { BiseApi, CoreExit, CoreState } from '@/shared/api';
import { useCoreState } from '@/store';

/** How long a first start may take before the line says so. */
export const QUIET_START_MS = 2000;

/** How the core's last run ended, in words. Pure. */
export function exitWords(exit: CoreExit): string {
  if (exit.crash) return 'bise crashed';
  switch (exit.how) {
    case 'clean':
      return 'bise stopped';
    case 'code':
      return `bise stopped (exit ${String(exit.code ?? '?')})`;
    case 'signal':
      return `bise stopped (${exit.signal ?? 'killed'})`;
    case 'failed':
      return "bise couldn't start";
  }
}

/** The line's words for a core state; none when nothing is to be said. Pure. */
export function coreLine(state: CoreState, o: { wasUp: boolean; slow: boolean; exit?: CoreExit | null }): string | undefined {
  if (state === 'up') return undefined;
  if (o.exit) return `${exitWords(o.exit)} · starting it again…`;
  switch (state) {
    case 'down':
      return "bise isn't running · starting it again…";
    case 'starting':
      if (o.wasUp) return 'starting bise again…';
      return o.slow ? 'starting bise…' : undefined;
  }
}

/** window.bise, or none (a unit test's DOM). */
const bise = (): BiseApi | undefined => (window as { bise?: BiseApi }).bise;

/** How the core's last run ended: asked once, then from each state change. */
function useCoreExit(): CoreExit | null {
  const [exit, setExit] = useState<CoreExit | null>(null);
  useEffect(() => {
    const core = bise()?.core;
    if (!core) return;
    let live = true;
    const off = core.onState((_s, e) => {
      live = false;
      setExit(e);
    });
    void core.lastExit?.().then((e) => {
      if (live) setExit(e);
    });
    return off;
  }, []);
  return exit;
}

export function CoreLine() {
  const state = useCoreState();
  const exit = useCoreExit();
  const [wasUp, setWasUp] = useState(false);
  const [slow, setSlow] = useState(false);
  const [copied, setCopied] = useState(false);
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
  const text = coreLine(state, { wasUp, slow, exit });
  if (text === undefined) return null;
  const log = exit?.crash ? exit.log : null;
  return (
    <div className="app-core" role="status" data-testid="app.core" data-state={state}>
      <div className="app-core-head">
        <span data-testid="app.core.text">{text}</span>
        {log !== null && (
          <>
            <button type="button" className="app-core-act" data-testid="app.core.report" onClick={() => bise()?.core.revealLog?.()}>
              show the report
            </button>
            <button
              type="button"
              className="app-core-act"
              data-testid="app.core.copy"
              onClick={() => {
                void bise()?.copy(log).then(() => {
                  setCopied(true);
                });
              }}
            >
              {copied ? 'copied' : 'copy its path'}
            </button>
          </>
        )}
      </div>
      {exit && exit.last !== '' && (
        <div className="app-core-last" data-testid="app.core.last">
          {exit.last}
        </div>
      )}
    </div>
  );
}
