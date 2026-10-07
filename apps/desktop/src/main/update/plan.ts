// The app's own updates (bar S.6), the pure part. The core says when a newer
// app is on bise's release channel (app_update, from bise_home::release: the
// manifest's one reader and the one version rule, architect m_11169); main
// downloads it, checks it, and swaps itself on his click only (run.ts). Here:
// the running app's build (its VERSION), its bundle, the signature's
// requirement, what a start finds after a swap, and the files to clean.

/** The running app's build, from Contents/Resources/VERSION (`key=value` lines). */
export interface AppBuild {
  readonly id: string;
  /** UTC RFC 3339 with a Z; none in a dev build (never offered an update) */
  readonly built?: string;
}

/** VERSION's `id` and `built`, or null without an id. */
export function readVersion(text: string): AppBuild | null {
  const kv = new Map<string, string>();
  for (const line of text.split('\n')) {
    const i = line.indexOf('=');
    if (i > 0) kv.set(line.slice(0, i).trim(), line.slice(i + 1).trim());
  }
  const id = kv.get('id') ?? '';
  if (id === '') return null;
  const built = kv.get('built') ?? '';
  return built === '' ? { id } : { id, built };
}

/** The .app around an executable (`/A/bise.app/Contents/MacOS/bise` → `/A/bise.app`), or null. */
export function bundleOf(execPath: string): string | null {
  const m = /^(.*\.app)\/Contents\/MacOS\/[^/]+$/.exec(execPath);
  return m?.[1] ?? null;
}

/**
 * The designated requirement in `codesign -d -r-`'s output
 * (`designated => identifier "x" and anchor ...`), or null (unsigned, ad-hoc
 * without one): no requirement, no update (fail closed).
 */
export function designated(out: string): string | null {
  for (const line of out.split('\n')) {
    const i = line.indexOf('designated => ');
    if (i >= 0) {
      const req = line.slice(i + 'designated => '.length).trim();
      return req === '' ? null : req;
    }
  }
  return null;
}

/** What a swap leaves for the next start (`<userData>/updates/swap.json`). */
export interface SwapRecord {
  /** the version swapped in */
  readonly version: string;
  /** the starts of the new app so far */
  readonly attempts: number;
  /** the new app wrote it started fine */
  readonly ok: boolean;
}

/** A swap record from its JSON, or null. */
export function readSwap(text: string): SwapRecord | null {
  try {
    const v = JSON.parse(text) as Partial<SwapRecord>;
    if (typeof v.version !== 'string' || typeof v.attempts !== 'number' || typeof v.ok !== 'boolean') return null;
    return { version: v.version, attempts: v.attempts, ok: v.ok };
  } catch {
    return null;
  }
}

/**
 * What a start does about the last swap (architect m_11169: keep
 * `<name>.app.old` until the new app started and wrote its 'started ok'):
 * - `none`: no swap;
 * - `forget`: a record but no .old (he removed it): drop the record;
 * - `first`: the new app's first start: count it, and confirm once it runs;
 * - `confirmed`: it said it started fine: remove .old and the record;
 * - `went_bad`: it was started before and never said so (or the record is
 *   gone): offer to go back to .old, on his click, never by itself.
 */
export type Startup = 'none' | 'forget' | 'first' | 'confirmed' | 'went_bad';

export function startup(oldExists: boolean, rec: SwapRecord | null): Startup {
  if (!oldExists) return rec === null ? 'none' : 'forget';
  if (rec === null) return 'went_bad';
  if (rec.ok) return 'confirmed';
  return rec.attempts === 0 ? 'first' : 'went_bad';
}

/** The leftovers in the updates folder a start removes: partial downloads and unpacked copies (one download at a time). */
export function leftovers(names: readonly string[]): string[] {
  return names.filter((n) => n.endsWith('.part') || n.startsWith('unpack-'));
}

/** A download URL a test run may read: only the local feed (file:// or this Mac), never a real one. */
export function localFeed(url: string): boolean {
  return /^file:\/\//.test(url) || /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(url);
}

/** The zip's name in the updates folder (a version is a file name once its odd characters are gone). */
export function zipName(version: string): string {
  return `bise-${version.replace(/[^A-Za-z0-9._-]/g, '_')}.zip`;
}
