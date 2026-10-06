// Settings as the shell mounts it (route settings[/<page>]): Settings fed
// by the store (the core's prefs, accounts, projects, found) and sending
// through it (store.command: the core's AppCmd). Owner: amb-home.
import type { JsonValue } from '@/proto';
import { useAccounts, useFound, usePlugins, usePrefs, useProjects, useStore } from '@/store';
import { useRouter } from '@/app/router';
import { Settings } from './Settings';
import type { Prefs } from './prefs';

/** The prefs event's value as an object (anything else: none yet). */
export function prefsOf(v: JsonValue | null): Prefs | null {
  return v !== null && typeof v === 'object' && !Array.isArray(v) ? v : null;
}

export function SettingsScreen({ page }: { page?: string | undefined }) {
  const store = useStore();
  const router = useRouter();
  const prefs = prefsOf(usePrefs());
  return (
    <Settings
      page={page}
      prefs={prefs}
      accounts={useAccounts()}
      projects={useProjects()}
      found={useFound()}
      plugins={usePlugins()}
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
      }}
    />
  );
}
