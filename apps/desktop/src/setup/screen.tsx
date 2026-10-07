// The first launch as the shell mounts it (route `onboarding`): Onboarding
// fed by the store (the core's accounts, found repos) and by the helper
// (bise-mac-helper through window.bise: its perms and fn events, a perm
// command), and the hook that sends a fresh home there once. Owner:
// amb-home.
import { useEffect, useRef } from 'react';
import { useAccounts, useFound, usePrefs, useStore } from '@/store';
import { useRouter } from '@/app/router';
import { onboarded, prefsOf, useKeyError } from '@/settings';
import { Onboarding } from './Onboarding';
import { useHelper } from './helper';

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
      keyError={useKeyError()}
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
