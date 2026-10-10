// One line at the top of the window while bise's core can't be reached (bar S.5, O.4; test id
// app.core). Owner: amb-win (designer's words on voice-window part 2, written in by amb-mac with its
// ok, m_16800). Main restarts the core by itself, so the line only says what happens: nothing for
// a spell under 2 s; then dim 'bise stopped. starting it again… nothing is lost.'; 'bise is
// back.' for 3 s once it is. Only when it doesn't come back by itself does it ask him: a crash
// whose restart failed, or 3 crashes in 10 min (main stopped trying), with 'start bise' and
// 'show the report' (the report main wrote, ~/.bise/reports; never sent anywhere).
import { useEffect, useState } from 'react';
import type { BiseApi, CoreExit, CoreState } from '@/shared/api';
import { useCoreState } from '@/store';
import { useRouter } from './router';

/** How long a first start may take before the line says so. */
export const QUIET_START_MS = 2000;


/** How long bise may be down before the window says so (designer: under 2 s, nothing at all). */
export const QUIET_DOWN_MS = 2000;
/** How long 'bise is back.' stays. */
export const BACK_MS = 3000;

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

/** What the line shows: its words, its tone, its actions ('start bise', 'show the report') and a dim note. */
export type CoreView = {
  readonly text: string;
  readonly tone: 'dim' | 'err';
  readonly start: boolean;
  readonly report: boolean;
  readonly note?: string;
};

/**
 * The line for the core's state (designer, voice-window part 2). Pure.
 * `exit`: how its last run ended; `crashed`: a crash in this down spell; `long`: down 2 s or more;
 * `back`: it came back after a long spell, less than 3 s ago.
 */
export function coreView(state: CoreState, o: { wasUp: boolean; slow: boolean; exit?: CoreExit | null; crashed?: boolean; long?: boolean; back?: boolean }): CoreView | undefined {
  const plain = (text: string): CoreView => ({ text, tone: 'dim', start: false, report: false });
  if (state === 'up') return o.back === true ? plain('bise is back.') : undefined;
  const e = o.exit ?? null;
  const reason = e === null ? '' : (e.reason ?? exitWords(e));
  const report = e?.report != null;
  // it stopped trying: 3 crashes in 10 min
  if (e?.stopped === true && state === 'down') {
    return { text: `▲ bise keeps crashing: ${String(e.crashes ?? 3)} times in 10 min, the last one: ${reason}.`, tone: 'err', start: true, report, note: 'it stopped trying' };
  }
  // it crashed and its restart failed
  if (e?.how === 'failed' && state === 'down') {
    return o.crashed === true
      ? { text: `▲ bise crashed and didn't start again: ${reason}.`, tone: 'err', start: true, report }
      : { text: `▲ bise didn't start: ${reason}.`, tone: 'err', start: true, report: false };
  }
  if (o.wasUp) return o.long === true ? plain('bise stopped. starting it again… nothing is lost.') : undefined;
  return o.slow ? plain('starting bise…') : undefined;
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
  const router = useRouter();
  const state = useCoreState();
  const exit = useCoreExit();
  const [wasUp, setWasUp] = useState(false);
  const [slow, setSlow] = useState(false);
  const [long, setLong] = useState(false);
  const [back, setBack] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [prev, setPrev] = useState(state);
  if (state === 'up' && !wasUp) setWasUp(true);
  if (exit?.crash === true && state !== 'up' && !crashed) setCrashed(true);
  if (prev !== state) {
    setPrev(state);
    if (state === 'up') {
      // back after a spell he saw: 'bise is back.' for 3 s; a short one said nothing
      setBack(long);
      setLong(false);
      setCrashed(false);
    } else if (prev === 'up') setBack(false);
  }
  // down 2 s or more (after it was up): then the line says so
  useEffect(() => {
    if (state === 'up' || !wasUp) return;
    const t = setTimeout(() => {
      setLong(true);
    }, QUIET_DOWN_MS);
    return () => {
      clearTimeout(t);
    };
  }, [state, wasUp]);
  useEffect(() => {
    if (!back) return;
    const t = setTimeout(() => {
      setBack(false);
    }, BACK_MS);
    return () => {
      clearTimeout(t);
    };
  }, [back]);
  useEffect(() => {
    if (state !== 'starting' || wasUp) return;
    const t = setTimeout(() => {
      setSlow(true);
    }, QUIET_START_MS);
    return () => {
      clearTimeout(t);
    };
  }, [state, wasUp]);
  const v = coreView(state, { wasUp, slow, exit, crashed, long, back });
  if (v === undefined) return null;
  const path = exit?.report ?? null;
  return (
    <div className={`app-core${v.tone === 'err' ? ' err' : ''}`} role="status" data-testid="app.core" data-state={state}>
      <div className="app-core-head">
        <span data-testid="app.core.text">{v.text}</span>
      </div>
      {/* designer m_16922: the actions on their own row under the words, as buttons, then the note */}
      {(v.start || (v.report && path !== null) || v.note !== undefined) && (
        <div className="app-core-row">
          {v.start && (
            <button type="button" className="app-core-btn" data-testid="app.core.start" onClick={() => bise()?.core.start?.()}>
              start bise
            </button>
          )}
          {v.report && path !== null && (
            <button type="button" className="app-core-btn" data-testid="app.core.report" onClick={() => { router.go({ screen: 'report' }); }}>
              show the report
            </button>
          )}
          {v.note !== undefined && (
            <span className="app-core-note" data-testid="app.core.note">
              {v.note}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
