// Settings as the shell mounts it (route settings[/<page>]): Settings fed
// by the store (the core's prefs, accounts, projects, found) and sending
// through it (store.command: the core's AppCmd). Owner: amb-home.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { JsonValue, Perm, ProjectRow } from '@/proto';
import { useAccounts, useApprovals, useComputerUse, useCoreEvent, useFound, useKeychain, useModels, usePlugins, usePrefs, useProjects, useRoles, useSigning, useStore, type Ev } from '@/store';
import type { KeyError } from './accounts';
import { holdForSetup, useHeld } from './hold';
import { useHeldSetup } from './setup-first';
import { useRouter } from '@/app/router';
import { useHelper } from '@/setup/helper';
import { useNotifyAuth } from '@/inbox';
import { Settings } from './Settings';
import { pageOf } from './pages';
import { pickerPort } from './picker';
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

/**
 * The agents the expired ChatGPT sign-in stopped (bar V14): the `waiting` of the hub's one signin
 * card (Card.waiting), whichever project shows it. Read across every project's cards.
 */
export function useSigninWaiting(projects: readonly ProjectRow[]): readonly string[] {
  const store = useStore();
  const ids = projects.map((p) => p.project).join('\n');
  const joined = useSyncExternalStore(
    (cb) => {
      const offs = ids === '' ? [] : ids.split('\n').map((p) => store.subscribe(`cards:${p}`, cb));
      return () => {
        for (const off of offs) off();
      };
    },
    // a string: the same names give the same snapshot (no new array each read)
    () => {
      for (const p of ids === '' ? [] : ids.split('\n')) {
        const card = store.cards(p).find((c) => c.kind === 'signin');
        if (card) return (card.waiting ?? []).join('\n');
      }
      return null;
    },
  );
  return joined === null || joined === '' ? NONE : joined.split('\n');
}

const NONE: readonly string[] = [];

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
  // a model waiting for its provider's setup goes once an account of that provider signs in (L5);
  // the core's held /model (R8) goes by itself, he goes back to its thread, and leaving drops it
  const held = useHeld();
  useHeldSetup(held, accounts);
  // approvals (V8): the home project's (the settings route names no project; the mode and the
  // checker are the machine's); a refusal of either command shows under the list
  const approvals = useApprovals(homeProject ?? '');
  const modeError = useCmdError('approvals');
  const ruleError = useCmdError('remove_rule');
  const approvalsError = (ruleError?.text ?? null) ?? (modeError?.text ?? null);
  const waiting = useSigninWaiting(projects);
  // the sign-in under way (V14): the link his browser opened, to copy
  const signing = useSigning();
  const router = useRouter();
  const prefs = prefsOf(usePrefs());
  const { perms } = useHelper();
  // no window.bise outside Electron (a component test): no helper
  const bise = window.bise as typeof window.bise | undefined;
  const helper = bise?.platform === 'darwin';
  // macOS's notifications permission (amb-mac's window.bise.notify): the general page's row
  const [notify, setNotify] = useNotifyAuth();
  const notifyApi = bise?.notify;
  return (
    <Settings
      page={page}
      prefs={prefs}
      accounts={accounts}
      projects={projects}
      roles={useRoles()}
      keychain={useKeychain()}
      models={models}
      roleError={roleError?.text ?? null}
      held={held}
      found={useFound()}
      plugins={usePlugins()}
      computerUse={useComputerUse()}
      perms={perms}
      keyError={keyError}
      approvals={approvals}
      approvalsError={approvalsError}
      signin={{ waiting, signing }}
      notify={notify}
      ports={{
        ...(notifyApi
          ? {
              notify: (act: 'ask' | 'open') => {
                if (act === 'ask') void notifyApi.ask().then(setNotify);
                else notifyApi.openSettings();
              },
            }
          : {}),
        send: (cmd) => {
          store.command(cmd);
        },
        approvals: (cmd) => {
          store.command(cmd);
        },
        // esc on the sign-in under way (V14): the core ends it (error {cmd: sign_in, '<id>: cancelled'} + accounts)
        // settings · add project's 'choose…' (the same bridge as the first launch's)
        ...pickerPort(),
        cancelSignIn: (id) => {
          store.command({ cmd: 'sign_in_cancel', id });
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
