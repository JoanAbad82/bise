// The app's own update in one line at the top of the window (bar S.6, amb-mac's updater 7140f8e4,
// window.bise.update). 'ready': 'bise <version> is ready · restart', his click swaps the app and
// reopens it on the screen he is on (nothing installs without the click); 'went_bad': the new app
// didn't start right, 'go back' to the previous one. Downloading and failed say nothing to him
// (failed's why is for the log). Owner: amb-win.
import { useEffect, useState } from 'react';
import type { BiseApi, UpdateState } from '@/shared/api';
import { useRoute } from './router';
import { formatRoute } from './route';

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

export function UpdateLine() {
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
  return (
    <div className="app-core app-update" role="status" data-testid="app.update" data-state={s.state}>
      <div className="app-core-head">
        <span>{line.text}</span>
        <button type="button" className="app-core-act" onClick={go} disabled={busy} data-testid={line.act === 'restart' ? 'app.update.restart' : 'app.update.back'}>
          {busy ? (line.act === 'restart' ? 'restarting…' : 'going back…') : line.act}
        </button>
      </div>
    </div>
  );
}
