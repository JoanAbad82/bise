// The settings screen (route settings[/<page>]): its nav and one page.
// Draws what the core sends (prefs, accounts, his projects, the repos
// found) and says what he changes through `send` (the core's AppCmd:
// prefs_set, sign_in, key_set, project_*); reads nothing itself (the
// store-fed screen in index.tsx gives it its props). Owner: amb-home.
//
// A switch flips at once: the value he set shows until the core's next
// prefs (which carries it, or not when the core refused it).
import { useState } from 'react';
import type { Account, AppCmd, Found, JsonValue, Perm, Plugin, ProjectRow } from '@/proto';
import { Row, Settings as Frame } from '@/ds';
import { putPref, type Prefs } from './prefs';
import { PAGES, PageBody, pageOf, type Page } from './pages';
import type { ComputerUse } from './computer';
import type { Perms } from './check';
import type { KeyError } from './accounts';
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
