// The app's own update in one line at the top of the window (bar S.6, amb-mac's updater 7140f8e4,
// window.bise.update). 'ready': 'bise <version> is ready · restart', his click swaps the app and
// reopens it on the screen he is on (nothing installs without the click); 'went_bad': the new app
// didn't start right, 'go back' to the previous one. Downloading and failed say nothing to him
// (failed's why is for the log). HubUpdateLine: bise's own /update build (the hub's update event).
// Owner: amb-win.
import { useEffect, useState } from 'react';
import type { BiseApi, UpdateState } from '@/shared/api';
import type { UpdateEv } from '@/proto';
import { Button } from '@/ds';
import { useHubUpdate, useProjects } from '@/store';
import { useRoute } from './router';
import { formatRoute } from './route';
import { RANK, type StatusPart } from './status';

/** The line's words and its one action, or none. Pure. */
export function updateLine(s: UpdateState): { text: string; act: 'restart' | 'go back' } | null {
  switch (s.state) {
    case 'ready':
      return { text: `bise ${s.version} is ready`, act: 'restart' };
    case 'went_bad':
      return { text: "the new bise didn't start right", act: 'go back' };
    default:
      return null;
  }
}

const bise = (): BiseApi | undefined => (window as { bise?: BiseApi }).bise;

function useUpdate(): UpdateState {
  const [s, setS] = useState<UpdateState>({ state: 'none' });
  useEffect(() => {
    const u = bise()?.update;
    if (!u) return;
    let live = true;
    const off = u.onState((next) => {
      live = false;
      setS(next);
    });
    void u.now().then((now) => {
      if (live) setS(now);
    });
    return off;
  }, []);
  return s;
}

/** The window's one status line draws this (StatusLine.tsx, amb-home). */
export function UpdateLine() {
  return useUpdateLine()?.node ?? null;
}

/** The app update's candidate for the one status line: 'ready' stays until his click, went_bad is a failure. */
export function useUpdateLine(): StatusPart | null {
  const s = useUpdate();
  const route = useRoute();
  const [busy, setBusy] = useState(false);
  const line = updateLine(s);
  if (line === null) return null;
  const go = () => {
    const u = bise()?.update;
    if (!u || busy) return;
    setBusy(true);
    const done = line.act === 'restart' ? u.install(formatRoute(route)) : u.revert();
    void done.then((ok) => {
      if (!ok) setBusy(false);
    });
  };
  // designer's raw-controls call (m_18343, his real-home screenshot showed a native button): the
  // ds's small ghost Button; went_bad's words in the error tone with '▲', never pink
  const bad = s.state === 'went_bad';
  return { rank: bad ? RANK.failed : RANK.ready, node: (
    <div className={bad ? 'app-core app-update err' : 'app-core app-update'} role="status" data-testid="app.update" data-state={s.state}>
      <div className="app-core-head">
        <span data-testid="app.update.text">{bad ? `▲ ${line.text}` : line.text}</span>
        <Button size="sm" onClick={go} disabled={busy} testId={line.act === 'restart' ? 'app.update.restart' : 'app.update.back'}>
          {busy ? (line.act === 'restart' ? 'restarting…' : 'going back…') : line.act}
        </Button>
      </div>
    </div>
  ) };
}

/**
 * /update's build in bise's source tree (the hub's update, amb-feed m_16785), on bise's home: while
 * it builds 'updating bise · 1152b33 · 2 min'; failed: the hub's words with the build's last lines
 * dim under them; built: nothing here (the switch says the rest in main's thread). Pure.
 */
export function hubUpdateLine(u: UpdateEv | null): { text: string; tail: readonly string[]; failed: boolean } | null {
  if (u === null) return null;
  if (u.state === 'building') {
    const s = u.elapsed ?? 0;
    const took = s >= 60 ? ` · ${String(Math.floor(s / 60))} min` : s > 0 ? ` · ${String(s)} s` : '';
    return { text: `updating bise · ${u.rev}${took}`, tail: [], failed: false };
  }
  if (u.state === 'failed') return { text: `▲ ${u.text ?? `couldn't build ${u.rev}`}`, tail: (u.tail ?? []).slice(-3), failed: true };
  return null;
}

/** The window's one status line draws this (StatusLine.tsx, amb-home). */
export function HubUpdateLine() {
  return useHubUpdateLine()?.node ?? null;
}

/** /update's build as a candidate for the one status line: building runs, failed is a failure. */
export function useHubUpdateLine(): StatusPart | null {
  const home = useProjects().find((p) => p.home)?.project ?? '';
  const line = hubUpdateLine(useHubUpdate(home));
  if (line === null) return null;
  return { rank: line.failed ? RANK.failed : RANK.running, node: (
    <div className="app-core app-update" role="status" data-testid="app.hubupdate" data-state={line.failed ? 'failed' : 'building'}>
      <div className="app-core-head">
        <span>{line.text}</span>
      </div>
      {line.tail.length > 0 && (
        <div className="app-core-last" data-testid="app.hubupdate.tail">
          {line.tail.join('\n')}
        </div>
      )}
    </div>
  ) };
}
