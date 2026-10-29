// bise's version switch (/reload, /restart, /version) in the window's one status pill (designer's
// desktop-notices page v2, architect m_20576): the hub keeps where the switch is and says it at
// every hello and when it moves (the typed `switch` row, amb-feed 8e5ce0e4), so a window that
// reconnects mid-reload still reads it. The words are Rust's switch_line. 'reloading' runs;
// '✓ reloaded' shows 3 s from the row's at_ms (the hub's clock, so a stale row at hello never
// shows as new), then folds; '▲ couldn't reload' stays until his retry or ✕. Owner: amb-home.
import { useEffect, useState } from 'react';
import type { SwitchRow } from '@/proto';
import { thread } from '@/proto/words.gen';
import { useHubSwitch, useProjects, useStore } from '@/store';
import { slashOf } from '@/thread/commands';
import { turnAge } from '@/working/gust';
import { RANK, type StatusPart } from './status';

/** How long '✓ reloaded' shows, from the row's at_ms. */
export const SHOW_DONE_MS = 3000;
/** Then how long it takes to fold. */
export const FOLD_MS = 220;

export type ReloadView = {
  text: string;
  tone: 'running' | 'done' | 'failed';
  fold: boolean;
  /** the machine text in `text` (the versions' shas), drawn mono; the rest is sans (designer m_20853 (2)) */
  shas: readonly string[];
  /** running: how long since the switch began ('12 s', text-3 at the line's right end) */
  elapsed?: string;
};

/** The core's probation reason, in his words (designer m_20853 (3)); other reasons pass through. */
export function reasonWords(r: Pick<SwitchRow, 'reason' | 'from'>): string {
  if (r.reason === 'the hub died during its probation')
    return thread.reload_died({ from: r.from ?? thread.reload_before });
  return r.reason ?? thread.reload_failed_why;
}

/** The line's words and tone at `now`, or none (no switch, an unknown phase, a done one past its fold). Pure. */
export function reloadView(r: SwitchRow | null, now: number): ReloadView | null {
  if (r === null) return null;
  switch (r.phase) {
    case 'reloading':
      return { text: thread.reloading({ to: r.to }), tone: 'running', fold: false, shas: [r.to], elapsed: turnAge(now - r.at_ms) };
    case 'up':
    case 'passed': {
      const age = now - r.at_ms;
      if (age >= SHOW_DONE_MS + FOLD_MS) return null;
      return { text: thread.reloaded({ to: r.to }), tone: 'done', fold: age >= SHOW_DONE_MS, shas: [r.to] };
    }
    case 'rolled_back': {
      const why = reasonWords(r);
      return { text: thread.reload_failed({ why }), tone: 'failed', fold: false, shas: [r.to, r.from].filter((s): s is string => s !== undefined && why.includes(s)) };
    }
    default:
      return null;
  }
}

/** `text` with its shas in mono (designer: shas are machine text). */
export function ShaWords({ text, shas }: { text: string; shas: readonly string[] }) {
  const live = shas.filter((s) => s !== '');
  if (live.length === 0) return <>{text}</>;
  const esc = live.map((s) => s.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'));
  const parts = text.split(new RegExp(`(${esc.join('|')})`, 'u'));
  return (
    <>
      {parts.map((p, i) =>
        live.includes(p) ? (
          <span key={i} className="app-reload-sha">
            {p}
          </span>
        ) : (
          p
        ),
      )}
    </>
  );
}

/**
 * The window's clock for the row: a done one moves when it comes, when it folds, when it goes; a
 * running one ticks each second for its elapsed time.
 */
function useSwitchClock(r: SwitchRow | null): number {
  const [now, setNow] = useState(() => Date.now());
  const at = r?.at_ms;
  const done = r?.phase === 'up' || r?.phase === 'passed';
  const running = r?.phase === 'reloading';
  useEffect(() => {
    if (at === undefined) return;
    const tick = () => {
      setNow(Date.now());
    };
    const age = Date.now() - at;
    const marks = [0, ...(done ? [SHOW_DONE_MS - age, SHOW_DONE_MS + FOLD_MS - age] : [])].filter((ms) => ms >= 0);
    const timers = marks.map((ms) => setTimeout(tick, ms));
    const every = running ? setInterval(tick, 1000) : undefined;
    return () => {
      for (const t of timers) clearTimeout(t);
      if (every !== undefined) clearInterval(every);
    };
  }, [at, done, running]);
  return now;
}

/** The switch's candidate for the one status line, read on bise's home hub (the switch is bise's, every hub says the same). */
export function useReloadLine(): StatusPart | null {
  const store = useStore();
  const projects = useProjects();
  const home = (projects.find((p) => p.home) ?? projects[0])?.project ?? '';
  const row = useHubSwitch(home);
  const now = useSwitchClock(row);
  // his ✕ on a failure: that switch (its at_ms) says nothing more; the next one shows
  const [closed, setClosed] = useState<number | null>(null);
  const v = reloadView(row, now);
  if (v === null || row === null || closed === row.at_ms) return null;
  const failed = v.tone === 'failed';
  const retry = () => {
    store.command(slashOf('version', row.to, { project: home, agent: 'main' }));
  };
  return {
    rank: failed ? RANK.failed : v.tone === 'running' ? RANK.running : RANK.done,
    testId: 'app.reload',
    state: row.phase,
    tone: v.tone === 'failed' ? 'err' : v.tone,
    words: <ShaWords text={v.text} shas={v.shas} />,
    short: shortWords(v.tone),
    ...(v.elapsed !== undefined ? { age: v.elapsed } : {}),
    fold: v.fold,
    ...(failed
      ? {
          acts: [{ id: 'retry', text: thread.reload_retry, onClick: retry }],
          close: () => {
            setClosed(row.at_ms);
          },
        }
      : {}),
  };
}

/** Under 160 px of room: the sign and short words (designer m_21067). Pure. */
export function shortWords(tone: ReloadView['tone']): string {
  return tone === 'running' ? thread.reload_short_running : tone === 'done' ? thread.reload_short_done : thread.reload_short_failed;
}
