// R8 (docs/terminal-parity.md, the TUI's sb.rs /model with model_needs_key): his '/model <m>' typed
// in a thread, when that model's provider has no key or sign-in yet, is held by the core (it never
// reaches the hub) and the core says setup_first. The window opens that provider's setup on
// settings · models (the wait of hold.ts, its key field open); once an account of that provider
// shows signed in, the core sends the held line itself and he goes back to the thread he typed it
// in; leaving settings with the provider not ready drops it (setup_first_cancel), as the TUI's
// panel closed does. Owner: amb-home.
import { useCallback, useEffect, useRef } from 'react';
import type { Account } from '@/proto';
import type { CoreCmd } from '@/shared/api';
import { useCoreEvent, useStore, type Ev } from '@/store';
import { useRouter } from '@/app/router';
import type { Route } from '@/app/route';
import { heldOfSetupFirst, heldReady, holdForSetup, releaseHeld, type Held } from './hold';

/** Where setup_first takes him: the provider's setup on settings · models. */
export const SETUP_ROUTE: Route = { screen: 'settings', page: 'models' };

/** The app's listener: a setup_first holds its wait and opens settings · models. Mounted once, in App. */
export function useSetupFirstOpens(): void {
  const router = useRouter();
  const open = useCallback(
    (ev: Ev) => {
      if (ev.ev !== 'setup_first') return;
      holdForSetup(heldOfSetupFirst(ev));
      router.go(SETUP_ROUTE);
    },
    [router],
  );
  useCoreEvent(open);
}

/** What the settings screen does with a wait, now: send its command, go back to its thread, or nothing. */
export function onReady(held: Held | null, accounts: readonly Account[]): { send: CoreCmd | null; back: Route | null } | null {
  if (held === null || !heldReady(held, accounts)) return null;
  // the core sends a held /model by itself (R8); a window's own wait (L5) sends its command here
  const back: Route | null = held.from !== undefined ? { screen: 'thread', project: held.from.project, agent: held.from.agent } : null;
  return { send: held.cmd, back };
}

/** Leaving settings with the core's held /model not ready: it is dropped (the core's line too). */
export function onLeave(held: Held | null, accounts: readonly Account[]): CoreCmd | null {
  if (held === null || held.cmd !== null || heldReady(held, accounts)) return null;
  return { cmd: 'setup_first_cancel' };
}

/**
 * The settings screen's side: a ready wait goes (its command, or the core's own line) and lets go;
 * the core's held /model goes back to its thread; settings unmounted with it not ready cancels it.
 */
export function useHeldSetup(held: Held | null, accounts: readonly Account[]): void {
  const store = useStore();
  const router = useRouter();
  useEffect(() => {
    const r = onReady(held, accounts);
    if (r === null) return;
    if (r.send !== null) store.command(r.send);
    releaseHeld();
    if (r.back !== null) router.go(r.back);
  }, [held, accounts, store, router]);
  // the latest wait and accounts, for the leave (the cleanup must not run on each change)
  const now = useRef({ held, accounts });
  now.current = { held, accounts };
  useEffect(
    () => () => {
      const cmd = onLeave(now.current.held, now.current.accounts);
      if (cmd === null) return;
      store.command(cmd);
      releaseHeld();
    },
    [store],
  );
}
