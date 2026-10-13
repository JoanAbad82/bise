// bise's version switch (/reload, /restart, /version) on the window's one status line (designer's
// desktop-notices page (1), architect m_20576): the hub keeps where the switch is and says it at
// every hello and when it moves (the typed `switch` row, amb-feed 8e5ce0e4), so a window that
// reconnects mid-reload still reads it. The words are Rust's switch_line. 'reloading' runs;
// '✓ reloaded' shows dim 3 s from the row's at_ms (the hub's clock, so a stale row at hello never
// shows as new), then folds; '▲ couldn't reload' stays until his retry or ✕. Owner: amb-home.
import { useEffect, useState } from 'react';
import type { SwitchRow } from '@/proto';
import { Button, IconButton } from '@/ds';
import { useHubSwitch, useProjects, useStore } from '@/store';
import { slashOf } from '@/thread/commands';
import { RANK, type StatusPart } from './status';

/** How long '✓ reloaded' shows, from the row's at_ms. */
export const SHOW_DONE_MS = 3000;
/** Then how long it takes to fold. */
export const FOLD_MS = 220;

export type ReloadView = { text: string; tone: 'running' | 'done' | 'failed'; fold: boolean };

/** The line's words and tone at `now`, or none (no switch, an unknown phase, a done one past its fold). Pure. */
export function reloadView(r: SwitchRow | null, now: number): ReloadView | null {
  if (r === null) return null;
  switch (r.phase) {
    case 'reloading':
      return { text: `reloading bise on ${r.to}`, tone: 'running', fold: false };
    case 'up':
    case 'passed': {
      const age = now - r.at_ms;
      if (age >= SHOW_DONE_MS + FOLD_MS) return null;
      return { text: `✓ reloaded on ${r.to}`, tone: 'done', fold: age >= SHOW_DONE_MS };
    }
    case 'rolled_back':
      return { text: `▲ couldn't reload: ${r.reason ?? 'the new version failed'}`, tone: 'failed', fold: false };
    default:
      return null;
  }
}

/** The window's clock for a done row: it moves when the row comes, when it folds, when it goes. */
function useSwitchClock(r: SwitchRow | null): number {
  const [now, setNow] = useState(() => Date.now());
  const at = r?.at_ms;
  const done = r?.phase === 'up' || r?.phase === 'passed';
  useEffect(() => {
    if (at === undefined) return;
    const tick = () => {
      setNow(Date.now());
    };
    const age = Date.now() - at;
    const marks = [0, ...(done ? [SHOW_DONE_MS - age, SHOW_DONE_MS + FOLD_MS - age] : [])].filter((ms) => ms >= 0);
    const timers = marks.map((ms) => setTimeout(tick, ms));
    return () => {
      for (const t of timers) clearTimeout(t);
    };
  }, [at, done]);
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
  const cls = ['app-core', 'app-reload', failed && 'err', v.fold && 'fold'].filter(Boolean).join(' ');
  return {
    rank: failed ? RANK.failed : v.tone === 'running' ? RANK.running : RANK.done,
    node: (
      <div className={cls} role={failed ? 'alert' : 'status'} data-testid="app.reload" data-phase={row.phase}>
        <div className="app-core-head">
          <span data-testid="app.reload.text">{v.text}</span>
          {failed && (
            <>
              <Button size="sm" onClick={retry} testId="app.reload.retry">
                retry
              </Button>
              <IconButton label="close" size="row" onClick={() => { setClosed(row.at_ms); }} testId="app.reload.close">
                ✕
              </IconButton>
            </>
          )}
        </div>
      </div>
    ),
  };
}
