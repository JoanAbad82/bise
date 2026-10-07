// The first launch as the shell mounts it (route `onboarding`): Onboarding
// fed by the store (the core's accounts, found repos) and by the helper
// (bise-mac-helper through window.bise: its perms and fn events, a perm
// command), and the hook that sends a fresh home there once. Owner:
// amb-home.
import { useEffect, useRef } from 'react';
import type { Artifact } from '@/proto';
import { useAccounts, useArtifacts, useFound, usePrefs, useProjects, useStore } from '@/store';
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
  // this window saw a fresh home: after hello, the start-here page opens once (bar S.9)
  const fresh = useRef(false);
  const opened = useRef(false);
  useEffect(() => {
    if (sent.current || prefs === null) return;
    sent.current = true;
    if (!onboarded(prefs)) {
      fresh.current = true;
      if (router.get().screen !== 'onboarding') router.go({ screen: 'onboarding' });
    }
  }, [prefs, router]);
  // the hub publishes start-here once on the home's first run (first_run.rs), as main: it comes as
  // one of the home's artifacts with its url; it opens in his browser, like the old app's and like a
  // PR link (window.bise.openExternal; test mode prints 'bise-desktop: external <url>')
  const home = useProjects().find((p) => p.home);
  const url = startHereUrl(useArtifacts(home?.project ?? ''));
  const done = prefs !== null && onboarded(prefs);
  useEffect(() => {
    if (!fresh.current || opened.current || !done || url === null) return;
    opened.current = true;
    const bise = window.bise as typeof window.bise | undefined;
    void bise?.openExternal(url);
  }, [done, url]);
}

/** The hub's start-here page among the home's artifacts (first_run.rs PAGE_ID), its url; none: null. */
export function startHereUrl(artifacts: readonly Artifact[]): string | null {
  const a = artifacts.find((x) => x.id === START_HERE && x.kind === 'page');
  return a?.url != null && a.url !== '' ? a.url : null;
}

/** first_run.rs's PAGE_ID */
export const START_HERE = 'start-here';
