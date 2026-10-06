// The first launch as the shell mounts it (route `onboarding`): Onboarding
// fed by the store (the core's accounts, found repos) and by the helper
// (bise-mac-helper through window.bise: its perms and fn events, a perm
// command), and the hook that sends a fresh home there once. Owner:
// amb-home.
import { useEffect, useRef, useState } from 'react';
import type { HelperEv } from '@/proto';
import { useAccounts, useFound, usePrefs, useStore } from '@/store';
import { useRouter } from '@/app/router';
import { onboarded, prefsOf } from '@/settings';
import { Onboarding } from './Onboarding';
import type { Perms } from './model';

/** The helper's last perms and fn act (none on a platform without the helper). */
function useHelper(): { perms: Perms; fn: { act: string; n: number } | null } {
  const [perms, setPerms] = useState<Perms>({});
  const [fn, setFn] = useState<{ act: string; n: number } | null>(null);
  useEffect(() => {
    const bise = typeof window === 'undefined' ? undefined : window.bise;
    if (bise === undefined) return;
    const on = (ev: HelperEv) => {
      if (ev.ev === 'perms') setPerms({ mic: ev.mic, accessibility: ev.accessibility, screen: ev.screen, calendar: ev.calendar });
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

export function OnboardingScreen() {
  const store = useStore();
  const router = useRouter();
  const { perms, fn } = useHelper();
  return (
    <Onboarding
      accounts={useAccounts()}
      found={useFound()}
      perms={perms}
      fn={fn}
      ports={{
        send: (cmd) => {
          store.command(cmd);
        },
        perm: (perm, action) => {
          window.bise.helper({ cmd: 'perm', perm, action: action === 'ask' ? 'ask' : 'open' });
        },
        done: () => {
          router.go({ screen: 'bise' });
        },
      }}
    />
  );
}

/**
 * The first prefs of a home not onboarded yet open the first launch, once,
 * wherever the window was (absent = a fresh home: the core says false).
 * The shell (amb-win's App.tsx) calls it once.
 */
export function useFirstLaunch(): void {
  const prefs = prefsOf(usePrefs());
  const router = useRouter();
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current || prefs === null) return;
    sent.current = true;
    if (!onboarded(prefs) && router.get().screen !== 'onboarding') router.go({ screen: 'onboarding' });
  }, [prefs, router]);
}
