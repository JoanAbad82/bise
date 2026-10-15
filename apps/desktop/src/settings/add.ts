// The add sheet's two waits in words (designer's S11 v2 shot 19, ambient-lead m_18490 after his
// real-home try: the scan spun forever and 'add' did nothing, with nothing on screen). The scan
// (found_scan) and the add (project_add) each end in one of: the core's answer, the core's refusal
// (error {cmd, text}), the core's broken state (CoreEv broken: no hub can start), or no answer in
// WAIT_MS; never a spinner with no end. Pure: the sheet (AddSheet.tsx) feeds it what it saw since
// it asked. Owner: amb-home.
import type { Found, ProjectRow } from '@/proto';
import { settings } from '@/proto/words.gen';

/** How long the sheet waits for the core before it says so. */
export const WAIT_MS = 20_000;

/** The words of CoreEv broken, as CoreLine says them. */
export function brokenLine(reason: string): string {
  return settings.add_broken({ reason: reason.replace(/\.$/, '') });
}

export type ScanSay =
  | { kind: 'looking'; text: string }
  | { kind: 'found'; text: string; n: number }
  | { kind: 'failed'; text: string };

/**
 * The scan's line, the head of the found group. `answered`: a found came since the sheet asked;
 * `n`: the repos it offers (not his yet); `error`: the core refused the scan since; `ms`: since
 * the ask. Broken wins (nothing can work), then the refusal, then the answer, then the wait.
 */
export function scanSay(s: { answered: boolean; n: number; error: string | null; broken: string | null; ms: number }): ScanSay {
  if (s.broken !== null) return { kind: 'failed', text: brokenLine(s.broken) };
  if (s.error !== null) return { kind: 'failed', text: settings.scan_failed({ why: s.error }) };
  if (s.answered) return { kind: 'found', n: s.n, text: s.n === 0 ? settings.scan_nothing : settings.scan_found({ n: s.n }) };
  if (s.ms >= WAIT_MS) return { kind: 'failed', text: settings.no_answer({ s: Math.round(WAIT_MS / 1000) }) };
  const secs = Math.floor(s.ms / 1000);
  return { kind: 'looking', text: secs < 1 ? settings.scan_looking : settings.scan_looking_s({ s: secs }) };
}

/** The last part of a path: what 'add shop' names. */
export function base(p: string): string {
  return p.replace(/\/+$/, '').split('/').pop() ?? p;
}

/** What the primary button says it will do. */
export function addLabel(paths: readonly string[]): string {
  if (paths.length === 0) return settings.add;
  if (paths.length === 1) return settings.add_one({ name: base(paths[0] ?? '') });
  return settings.add_many({ n: paths.length });
}

/**
 * The path's project once the core added it: the row with that path, or (the core keeps the
 * canonical path: '~', a symlink) a row that wasn't there before with the same folder name.
 */
export function addedRow(path: string, projects: readonly ProjectRow[], before: ReadonlySet<string>): ProjectRow | undefined {
  const t = path.replace(/\/+$/, '');
  return projects.find((p) => p.path === t) ?? projects.find((p) => !before.has(p.project) && base(p.path) === base(t));
}

export type AddSay = { kind: 'adding'; text: string } | { kind: 'added'; rows: ProjectRow[] } | { kind: 'failed'; text: string };

/**
 * Where an add is: every path's row is in the list (added), the core refused one or is broken
 * (failed, in its words), no answer in WAIT_MS (failed), else adding. `before`: the project ids
 * when he clicked.
 */
export function addSay(s: { paths: readonly string[]; projects: readonly ProjectRow[]; before: ReadonlySet<string>; error: string | null; broken: string | null; ms: number }): AddSay {
  const rows = s.paths.map((p) => addedRow(p, s.projects, s.before));
  if (rows.every((r) => r !== undefined)) return { kind: 'added', rows };
  if (s.broken !== null) return { kind: 'failed', text: brokenLine(s.broken) };
  const missing = s.paths.filter((_, i) => rows[i] === undefined).map(base);
  if (s.error !== null) return { kind: 'failed', text: settings.add_failed({ names: missing.join(', '), why: s.error }) };
  if (s.ms >= WAIT_MS) return { kind: 'failed', text: settings.add_no_answer({ s: Math.round(WAIT_MS / 1000), names: missing.join(', ') }) };
  return { kind: 'adding', text: s.paths.length === 1 ? settings.adding_one({ name: base(s.paths[0] ?? '') }) : settings.adding_many({ n: s.paths.length }) };
}

/** The found repos the sheet offers: not his yet, the most recent first, 8 at most. */
export function offers(found: readonly Found[], projects: readonly ProjectRow[]): Found[] {
  const known = new Set(projects.map((p) => p.path));
  return found.filter((f) => !f.known && !known.has(f.path)).sort((a, b) => b.last_ms - a.last_ms).slice(0, 8);
}

/** What "add" adds: the ticked paths, plus the one typed (once). */
export function addPaths(ticked: readonly string[], typed: string): string[] {
  const t = typed.trim();
  return t !== '' && !ticked.includes(t) ? [...ticked, t] : [...ticked];
}

/** A found repo's dim line in shot 19: its folder, then 'git · today' (or its day). */
export function foundSub(f: Found, now: number): string {
  const day = 86_400_000;
  const d = Math.floor(now / day) - Math.floor(f.last_ms / day);
  const when = d <= 0 ? settings.age_today : d === 1 ? settings.age_yesterday : d < 30 ? settings.age_days({ n: d }) : new Date(f.last_ms).toISOString().slice(0, 10);
  return f.git ? settings.found_sub_git({ path: f.path, when }) : settings.found_sub({ path: f.path, when });
}
