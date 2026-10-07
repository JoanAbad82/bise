// A model whose provider has no key or sign-in yet (bar L5, the TUI's sb.rs `/model` with
// model_needs_key, BISE-294): picking it opens that provider's setup on settings · models, and
// the model is set only once the provider is signed in, never saved blindly. Owner: amb-kit.
//
// The pick waits here (one at a time, the window's own; no core state): whoever picks a model
// (the roles on settings · models, amb-win's /model and agent tune) calls modelOrSetup(); the
// settings screen reads the wait (useHeld), draws the provider's setup, and sends the waiting
// command when an account of that provider shows signed in (heldReady), then lets it go.
import { useSyncExternalStore } from 'react';
import type { Account, Model } from '@/proto';
import type { CoreCmd } from '@/shared/api';

/** A model command waiting for its provider's setup. */
export interface Held {
  /** the catalog's provider id (Model.provider_id = Account.provider) */
  provider: string;
  /** the provider's name for him (Model.provider) */
  providerName: string;
  /** the model's name for him */
  model: string;
  /** what is sent once the provider is set up */
  cmd: CoreCmd;
}

/** The row of `model` (an id, a short name or an alias; an alias follows its target). */
export function modelRow(model: string, models: readonly Model[]): Model | undefined {
  const row = models.find((m) => m.id === model || m.short === model);
  if (row?.alias_of != null && row.alias_of !== '') return models.find((m) => m.id === row.alias_of) ?? row;
  return row;
}

/** The provider `model` needs set up first (its key_ready false), or null: it can be set now. */
export function needsSetup(model: string, models: readonly Model[]): string | null {
  const row = modelRow(model, models);
  if (row?.key_ready !== false) return null;
  return row.provider_id ?? null;
}

/** An account of the held provider is signed in: the held command can go. */
export function heldReady(held: Held | null, accounts: readonly Account[]): boolean {
  return held !== null && accounts.some((a) => (a.provider ?? a.id) === held.provider && a.state === 'signed_in');
}

let held: Held | null = null;
const subs = new Set<() => void>();
const emit = (): void => {
  for (const f of [...subs]) f();
};

/** Hold a model command until its provider is set up (the last pick wins). */
export function holdForSetup(h: Held): void {
  held = h;
  emit();
}

/** Let the held command go (sent, or he went another way). */
export function releaseHeld(): void {
  if (held === null) return;
  held = null;
  emit();
}

/** The held command, live. */
export function useHeld(): Held | null {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => {
        subs.delete(f);
      };
    },
    () => held,
  );
}

/**
 * Set a model, or set its provider up first: `cmd` goes at once when the model's provider is
 * ready; else it is held and `setup` opens settings · models (the caller's route), where the
 * provider's sign-in or key waits. Returns what happened.
 */
export function modelOrSetup(model: string, models: readonly Model[], cmd: CoreCmd, ports: { send: (c: CoreCmd) => void; setup: () => void }): 'sent' | 'setup' {
  const provider = needsSetup(model, models);
  if (provider === null) {
    ports.send(cmd);
    return 'sent';
  }
  const row = modelRow(model, models);
  holdForSetup({ provider, providerName: row?.provider ?? provider, model: row?.label ?? model, cmd });
  ports.setup();
  return 'setup';
}
