// Settings as the shell mounts it (route settings[/<page>]): Settings fed
// by the store (the core's prefs, accounts, projects, found) and sending
// through it (store.command: the core's AppCmd). Owner: amb-home.
import { useCallback, useState } from 'react';
import type { JsonValue, Perm } from '@/proto';
import { useAccounts, useComputerUse, useCoreEvent, useFound, usePlugins, usePrefs, useProjects, useStore, type Ev } from '@/store';
import type { KeyError } from './accounts';
import { useRouter } from '@/app/router';
import { useHelper } from '@/setup/helper';
import { Settings } from './Settings';
import type { Prefs } from './prefs';

/** The prefs event's value as an object (anything else: none yet). */
export function prefsOf(v: JsonValue | null): Prefs | null {
  return v !== null && typeof v === 'object' && !Array.isArray(v) ? v : null;
}

/**
 * The core's refusals of a key (error {cmd: key_set, text}, bar S.2), counted: the key field shows
 * the one newer than its send. The store keeps no slice for them (a one-shot event).
 */
export function useKeyError(): KeyError | null {
  const [err, setErr] = useState<KeyError | null>(null);
  const on = useCallback((ev: Ev) => {
    if (ev.ev === 'error' && ev.cmd === 'key_set') setErr((e) => ({ n: (e?.n ?? 0) + 1, text: ev.text }));
  }, []);
  useCoreEvent(on);
  return err;
}

export function SettingsScreen({ page }: { page?: string | undefined }) {
  const store = useStore();
  const keyError = useKeyError();
  const router = useRouter();
  const prefs = prefsOf(usePrefs());
  const { perms } = useHelper();
  // no window.bise outside Electron (a component test): no helper
  const bise = window.bise as typeof window.bise | undefined;
  const helper = bise?.platform === 'darwin';
  return (
    <Settings
      page={page}
      prefs={prefs}
      accounts={useAccounts()}
      projects={useProjects()}
      found={useFound()}
      plugins={usePlugins()}
      computerUse={useComputerUse()}
      perms={perms}
      keyError={keyError}
      ports={{
        send: (cmd) => {
          store.command(cmd);
        },
        back: () => {
          router.back();
        },
        go: (p) => {
          router.go({ screen: 'settings', page: p });
        },
        ...(helper
          ? {
              perm: (perm: Perm, action: 'ask' | 'open') => {
                window.bise.helper({ cmd: 'perm', perm, action });
              },
            }
          : {}),
      }}
    />
  );
}
