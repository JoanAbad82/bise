// Settings as the shell mounts it (route settings[/<page>]): Settings fed
// by the store (the core's prefs, accounts, projects, found) and sending
// through it (store.command: the core's AppCmd). Owner: amb-home.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { JsonValue, Perm } from '@/proto';
import { useAccounts, useComputerUse, useCoreEvent, useFound, useModels, usePlugins, usePrefs, useProjects, useRoles, useStore, type Ev } from '@/store';
import type { KeyError } from './accounts';
import { heldReady, holdForSetup, releaseHeld, useHeld } from './hold';
import { useRouter } from '@/app/router';
import { useHelper } from '@/setup/helper';
import { Settings } from './Settings';
import { pageOf } from './pages';
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
  return useCmdError('key_set');
}

/** The core's last refusal of `cmd` (error {cmd, text}), counted so the same words twice count. */
export function useCmdError(cmd: string): KeyError | null {
  const [err, setErr] = useState<KeyError | null>(null);
  const on = useCallback(
    (ev: Ev) => {
      if (ev.ev === 'error' && ev.cmd === cmd) setErr((e) => ({ n: (e?.n ?? 0) + 1, text: ev.text }));
    },
    [cmd],
  );
  useCoreEvent(on);
  return err;
}

export function SettingsScreen({ page }: { page?: string | undefined }) {
  const store = useStore();
  const keyError = useKeyError();
  const roleError = useCmdError('role_set');
  const accounts = useAccounts();
  const projects = useProjects();
  // the roles pick from the home's models (bise's own catalog)
  const home = projects.find((p) => p.home);
  const models = useModels(home?.project ?? '');
  // the home's models come on request (the hub sends a project's models on {cmd: models}): once,
  // and only when the models page is shown (the roles pick from them), never when settings mount
  const asked = useRef(false);
  const homeProject = home?.project;
  const onModels = pageOf(page).id === 'models';
  useEffect(() => {
    if (!onModels || asked.current || homeProject === undefined || models.length > 0) return;
    asked.current = true;
    store.command({ cmd: 'models', project: homeProject });
  }, [onModels, homeProject, models.length, store]);
  // a model waiting for its provider's setup goes once an account of that provider signs in (L5)
  const held = useHeld();
  useEffect(() => {
    if (held === null || !heldReady(held, accounts)) return;
    store.command(held.cmd);
    releaseHeld();
  }, [held, accounts, store]);
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
      accounts={accounts}
      projects={projects}
      roles={useRoles()}
      models={models}
      roleError={roleError?.text ?? null}
      held={held}
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
        hold: (h) => {
          holdForSetup(h);
        },
        // the sign-in link (V14 c): the window's clipboard (test mode: its private buffer)
        ...(bise ? { copy: (text: string) => void bise.copy(text) } : {}),
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
