// The settings window's content (route settings[/<page>], bise fait mac
// mockup 10): the glass sidebar of pages, the bar with the page's title,
// one page under it with its sentence as a lead line (no banner). Draws
// what the core sends (prefs, accounts, his projects, the repos found) and
// says what he changes through `send` (the core's AppCmd: prefs_set,
// sign_in, provider_use, project_*); reads nothing itself (the store-fed
// screen in screen.tsx gives it its props; window.tsx is the window).
// Owner: nm-settings.
//
// A switch flips at once: the value he set shows until the core's next
// prefs (which carries it, or not when the core refused it).
import { useState } from 'react';
import type { Account, AppCmd, Found, JsonValue, Model, Perm, ProjectRow, RoleRow } from '@/proto';
import type { Held } from './hold';
import type { ApprovalsCmd, ApprovalsEv } from './approvals';
import { AppIcon, ListRow, type AppIconName } from '@/ds';
import { settings } from '@/proto/words.gen';
import { putPref, type Prefs } from './prefs';
import { PAGES, PageBody, pageOf, type Page } from './pages';
import type { ComputerUse } from './computer';
import type { Perms } from './check';
import type { SignIn } from './accounts';
import type { ProviderCheck } from './keycheck';
import type { AppUpdate, NotifyAuth, UpdateInfo, UpdateState } from '@/shared/api';
import type { UpdatePorts } from './update';
import type { DistPorts } from './appupdate';
import './settings.css';

export interface SettingsData {
  prefs: Prefs | null;
  accounts: readonly Account[];
  projects: readonly ProjectRow[];
  /** the repos found_scan found in his folders (none yet: empty) */
  found: readonly Found[];
  /** computer use's state (none yet: null) */
  computerUse: ComputerUse | null;
  /** the helper's permissions (none: not known, or no helper) */
  perms: Perms;
  /** provider_use's last answer (provider_check), shown on the key field (bar S.2) */
  check?: ProviderCheck | null;
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
  /** his try app against the newest promoted build (window.bise.app.update; none: no update group) */
  appUpdate?: AppUpdate | null;
  /** a distributed app's own update (window.bise.update: its state and info; none: no updater, no group) */
  dist?: { readonly state: UpdateState; readonly info: UpdateInfo; readonly readAt: number } | null;
  /** N1: where his keys and sign-ins are kept and the last /keychain move (the core's keychain; none yet: null) */
  keychain?: KeychainState | null;
}

/** The core's keychain event, as settings · models reads it. */
export interface KeychainState {
  readonly store: string;
  readonly moving: boolean;
  readonly lines?: readonly string[];
  readonly failed?: boolean;
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
  /** the update group's acts: the swap, its log, the state read again (none: no act) */
  update?: UpdatePorts;
  /** a distributed app's update group: restart to update, go back */
  dist?: DistPorts;
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
  // the window (mockup 10): the glass sidebar under the lights, the bar with the page's title, the
  // page on the solid ground; no banner, the page's sentence as its lead line
  return (
    <section
      className="b-swin"
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
      <nav className="b-swin-side" aria-label={settings.nav_label} data-testid="settings.nav">
        {PAGES.map((p) => (
          <ListRow
            key={p.id}
            title={p.title}
            state={
              <span className="b-swin-tile">
                <AppIcon name={PAGE_ICON[p.id]} size={14} />
              </span>
            }
            on={p.id === at.id}
            onClick={() => {
              ports.go(p.id);
            }}
            testId={`settings.nav.${p.id}`}
          />
        ))}
      </nav>
      <header className="b-swin-bar" data-testid="settings.bar">
        <h1 className="b-swin-title">{at.title}</h1>
      </header>
      <div className="b-swin-page" data-testid={`settings.page.${at.id}`}>
        <p className="b-swin-lead">{at.sub}</p>
        <PageBody page={at.id} prefs={shown} setPref={setPref} data={{ ...data, prefs: shown }} ports={ports} />
      </div>
    </section>
  );
}

/** Each page's tile in the sidebar (mockup 10). */
const PAGE_ICON: Record<Page, AppIconName> = {
  general: 'settings',
  setup: 'check',
  voice: 'mic',
  privacy: 'eye',
  quiet: 'moon',
  models: 'cpu',
  approvals: 'shield',
  projects: 'folder',
  computer: 'cursor',
  keys: 'key',
};
