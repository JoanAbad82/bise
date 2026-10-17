// src/settings: the settings screen (bar S.3, S.4, 3.5, the settings side
// of S.2 and 2.6). Owner: amb-home. Settings.tsx draws it from props (the
// core's prefs, accounts, projects, found) and sends AppCmds; pages.tsx,
// accounts.tsx and projects.tsx are its pages; prefs.ts reads his prefs;
// keys.ts is the app's key list. The screen the shell mounts (reading
// src/store) comes with the store.
export { Settings, type SettingsData, type SettingsPorts, type SettingsProps } from './Settings';
export { PAGES, KeyList, type Page } from './pages';
export { Accounts, signedIn } from './accounts';
export { keyField, failedWords, fromWords, retries, shortModel, type ProviderCheck, type Sent } from './keycheck';
export type { KeyError } from './screen';
export { onboarded, type Prefs } from './prefs';
export { KEY_SECTIONS } from './keys';
export { SettingsScreen, prefsOf, useCmdError } from './screen';
export { needsSetup, modelOrSetup, modelRow, holdForSetup, releaseHeld, useHeld, heldReady, type Held } from './hold';
export { Roles, roleSource, effortsOf, effortOf } from './roles';
