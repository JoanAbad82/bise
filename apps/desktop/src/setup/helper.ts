// bise-mac-helper as the setup screens read it (window.bise): its last
// permissions (helperState at mount, then each perms event) and its fn
// acts, with a counter so the same act twice counts. None on a platform
// without the helper. Owner: amb-home (the first launch, settings' check
// again).
import { useEffect, useState } from 'react';
import type { HelperEv } from '@/proto';
import type { Perms } from './model';

/** The helper's last perms and fn act (none on a platform without the helper). */
export function useHelper(): { perms: Perms; fn: { act: string; n: number } | null } {
  const [perms, setPerms] = useState<Perms>({});
  const [fn, setFn] = useState<{ act: string; n: number } | null>(null);
  useEffect(() => {
    const bise = typeof window === 'undefined' ? undefined : window.bise;
    if (bise === undefined) return;
    const on = (ev: HelperEv) => {
      if (ev.ev === 'perms') setPerms({ mic: ev.mic, accessibility: ev.accessibility, screen: ev.screen });
      else if (ev.ev === 'fn') setFn((f) => ({ act: ev.act, n: (f?.n ?? 0) + 1 }));
    };
    let live = true;
    void bise.helperState().then((evs) => {
      if (live) for (const ev of evs) if (ev.ev === 'perms') on(ev);
    });
    const off = bise.onHelper(on);
    return () => {
      live = false;
      off();
    };
  }, []);
  return { perms, fn };
}

