// src/settings: the settings window (bar S.3, S.4, 3.5, the settings side
// of S.2 and 2.6; bise fait mac mockup 10). Owner: nm-settings. window.tsx
// is the window App.tsx renders when it is settings' own (where.ts sends
// settings routes there from the main window, and the rest back);
// Settings.tsx draws its sidebar, bar and page from props (the core's
// prefs, accounts, projects, found) and sends AppCmds; pages.tsx,
// accounts.tsx and projects.tsx are its pages; prefs.ts reads his prefs;
// keys.ts is the app's key list; screen.tsx feeds it from src/store.
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
