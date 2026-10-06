// The helper's config from his prefs (pure): the core's {ev:'prefs'} object
// -> {cmd:'config'}. excluded_apps is bise_home's (the seed already resolved
// by the core when unset); right option as the fn fallback and quiet during
// meetings have no pref yet: their defaults until they do (right option on,
// meetings off: the calendar is a new permission, asked only when he turns
// it on).
import type { HelperCmd } from '../../proto';

export type HelperConfig = Extract<HelperCmd, { cmd: 'config' }>;

export const DEFAULT_CONFIG: HelperConfig = { cmd: 'config', exclude: [], right_option: true, meetings: false };

function obj(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

export function configOfPrefs(prefs: unknown): HelperConfig {
  const p = obj(prefs);
  if (p === null) return DEFAULT_CONFIG;
  const apps = p['excluded_apps'];
  const exclude = Array.isArray(apps) ? apps.filter((a): a is string => typeof a === 'string') : [];
  const ro = p['right_option'];
  const meetings = obj(p['quiet'])?.['meetings'];
  return {
    cmd: 'config',
    exclude,
    right_option: typeof ro === 'boolean' ? ro : DEFAULT_CONFIG.right_option,
    meetings: typeof meetings === 'boolean' ? meetings : DEFAULT_CONFIG.meetings,
  };
}
