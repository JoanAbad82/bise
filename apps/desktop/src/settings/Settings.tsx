// The settings screen (route settings[/<page>]): its nav and one page.
// Draws what the core sends (prefs, accounts, his projects, the repos
// found) and says what he changes through `send` (the core's AppCmd:
// prefs_set, sign_in, key_set, project_*); reads nothing itself (the
// store-fed screen in index.tsx gives it its props). Owner: amb-home.
//
// A switch flips at once: the value he set shows until the core's next
// prefs (which carries it, or not when the core refused it).
import { useState } from 'react';
import type { Account, AppCmd, Found, JsonValue, Model, Perm, Plugin, ProjectRow, RoleRow } from '@/proto';
import type { Held } from './hold';
import type { ApprovalsCmd, ApprovalsEv } from './approvals';
import { Row, Settings as Frame } from '@/ds';
import { putPref, type Prefs } from './prefs';
import { PAGES, PageBody, pageOf, type Page } from './pages';
import type { ComputerUse } from './computer';
import type { Perms } from './check';
import type { KeyError, SignIn } from './accounts';
import type { NotifyAuth } from '@/shared/api';
import './settings.css';

export interface SettingsData {
  prefs: Prefs | null;
  accounts: readonly Account[];
  projects: readonly ProjectRow[];
  /** the repos found_scan found in his folders (none yet: empty) */
  found: readonly Found[];
  /** bise's home's agent plugins (none yet: null, the page asks) */
  plugins: readonly Plugin[] | null;
  /** computer use's state (none yet: null) */
  computerUse: ComputerUse | null;
  /** the helper's permissions (none: not known, or no helper) */
  perms: Perms;
  /** the core's last refusal of a key (error {cmd: key_set}), shown on the key field (bar S.2) */
  keyError?: KeyError | null;
  /** which model does what (bar V17): the core's roles, and the home's models they pick from */
  roles?: readonly RoleRow[];
  models?: readonly Model[];
  /** the core's last refusal of a role_set, in its words */
  roleError?: string | null;
  /** a model waiting for its provider's setup (bar L5, hold.ts) */
  held?: Held | null;
  /** the hub's approvals: mode, checker, this repo's rules (bar V8, HubEv approvals) */
  approvals?: ApprovalsEv | null;
  /** the hub's last refusal of an approvals or remove_rule command, in its words */
  approvalsError?: string | null;
  /** the expired sign-in: the agents waiting (the signin card's), the sign-in under way (bar V14) */
  signin?: SignIn | null;
  /** his home folder, to say ~ */
  home?: string;
  /** macOS's notifications permission (window.bise.notify; none: no row on general) */
  notify?: NotifyAuth | null;
}

export interface SettingsPorts {
  send: (cmd: AppCmd) => void;
  /** esc: back where he was */
  back: () => void;
  /** a page of settings (the route's) */
  go: (page: Page) => void;
  /** a permission through the helper (none: no helper on this platform) */
  perm?: (perm: Perm, action: 'ask' | 'open') => void;
  /** the system's folder picker (window.bise, amb-mac): resolves to a path, or null */
  pickFolder?: () => Promise<string | null>;
  /** a model whose provider isn't set up waits here (bar L5): hold.ts's holdForSetup */
  hold?: (h: Held) => void;
  /** the approvals' commands (bar V8: HubCmd approvals / remove_rule) */
  approvals?: (c: ApprovalsCmd) => void;
  /** copy a text to his clipboard (the sign-in link, bar V14) */
  copy?: (text: string) => void;
  /** cancel the sign-in under way (bar V14: AppCmd sign_in_cancel) */
  cancelSignIn?: (id: string) => void;
  /** macOS's notifications: ask (notify.ask(), macOS's alert) or open System Settings › Notifications */
  notify?: (act: 'ask' | 'open') => void;
}

export interface SettingsProps extends SettingsData {
  page?: string | undefined;
  ports: SettingsPorts;
}

/** the prefs he set here since `base` came from the core */
interface Pending {
  base: Prefs | null;
  sets: readonly (readonly [string, JsonValue])[];
}

export function Settings({ page, ports, prefs, ...data }: SettingsProps) {
  const at = pageOf(page);
  const [pend, setPend] = useState<Pending>({ base: prefs, sets: [] });
  const sets = pend.base === prefs ? pend.sets : [];
  const shown = sets.reduce<Prefs | null>((p, [k, v]) => putPref(p, k, v), prefs);
  const setPref = (key: string, value: JsonValue) => {
    setPend({ base: prefs, sets: [...sets, [key, value]] });
    ports.send({ cmd: 'prefs_set', key, value });
  };
  return (
    <section
      className="settings"
      data-testid="settings.root"
      tabIndex={-1}
      onKeyDown={(e) => {
        // esc leaves settings unless a field or a menu inside took it
        if (e.key === 'Escape' && !e.defaultPrevented) {
          e.preventDefault();
          ports.back();
        }
      }}
    >
      <Frame
        testId={`settings.page.${at.id}`}
        title={at.title}
        sub={at.sub}
        nav={PAGES.map((p) => (
          <Row
            key={p.id}
            kind="ag"
            name={p.title}
            on={p.id === at.id}
            onClick={() => {
              ports.go(p.id);
            }}
            testId={`settings.nav.${p.id}`}
          />
        ))}
      >
        <PageBody page={at.id} prefs={shown} setPref={setPref} data={{ ...data, prefs: shown }} ports={ports} />
      </Frame>
    </section>
  );
}
