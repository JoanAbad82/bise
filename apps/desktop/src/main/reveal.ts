// window.bise.quickLook / showInFinder's fence (lead m_11947, amb-kit's
// artifacts screen): only a path under his home or one of his project folders
// (the core's projects rows), resolved first (no '..' escape, no relative
// path). Pure, plus the project roots main keeps from the core's events.
import { isAbsolute, resolve } from 'node:path';
import { inside } from './testhome';

/** `raw` resolved when it is an absolute path inside one of `roots`, else null. */
export function allowedPath(raw: unknown, roots: readonly string[]): string | null {
  if (typeof raw !== 'string' || raw === '' || raw.includes('\0') || !isAbsolute(raw)) return null;
  const p = resolve(raw);
  return roots.some((r) => r !== '' && isAbsolute(r) && inside(p, r)) ? p : null;
}

/** The project folders of a core `projects` event (its rows' paths), [] for anything else. */
export function projectRoots(ev: Record<string, unknown>): string[] | null {
  if (ev['ev'] !== 'projects' || !Array.isArray(ev['projects'])) return null;
  return (ev['projects'] as unknown[]).flatMap((r) => {
    const p = typeof r === 'object' && r !== null ? (r as Record<string, unknown>)['path'] : undefined;
    return typeof p === 'string' && isAbsolute(p) ? [p] : [];
  });
}
