// A skill's SKILL.md and its folder, read for the window's skill tab (nm-pages-b; page skill-panel,
// Gabriel's pick A; architect m_43316, m_43797). The fence: the asked path, realpath'd, must be the
// realpath of a skill part's `path` in the latest `plugins` rows this app got (an allowlist: a skill
// folder can be a symlink outside its plugin's root). Then: the SKILL.md (or `file`, a name from
// that folder's own listing: one level, no '/', no '..', a .md, its realpath still inside the
// folder) read up to 256 KB, cut with a mark past it; the folder listed by names, one level, at most
// 200. Nothing else is read; a non-.md file goes to his editor (openPath), never through here.
// Answers are typed: {text, cut, files, more} or {error: gone | not_allowed}. Owner: nm-pages-b.
import { readdir, open, realpath } from 'node:fs/promises';
import { basename, dirname, join, sep } from 'node:path';
import type { SkillRead } from '../shared/api';

/** How much of a file the tab gets. */
export const SKILL_MAX = 256 * 1024;
/** How many names of the folder the tab gets. */
export const LIST_MAX = 200;

/** The skill paths of a `plugins` event's rows (the allowlist). Pure. */
export function skillPaths(ev: Record<string, unknown> | undefined): string[] {
  const items = ev?.['items'];
  if (!Array.isArray(items)) return [];
  const out: string[] = [];
  for (const row of items as unknown[]) {
    const parts = (row as { parts?: unknown } | null)?.parts;
    if (!Array.isArray(parts)) continue;
    for (const p of parts as unknown[]) {
      const x = p as { kind?: unknown; path?: unknown } | null;
      if (x?.kind === 'skill' && typeof x.path === 'string' && x.path !== '') out.push(x.path);
    }
  }
  return out;
}

/** A sibling's name as the tab may ask it: one level, no '/' nor '..', a .md. Pure. */
export function siblingOk(name: unknown): name is string {
  return typeof name === 'string' && name !== '' && !name.includes('/') && !name.includes('\\') && !name.includes('..') && name.toLowerCase().endsWith('.md');
}

const real = async (p: string): Promise<string | null> => {
  try {
    return await realpath(p);
  } catch {
    return null;
  }
};

/** Reads at most SKILL_MAX bytes of `p`: its text, and whether it was cut. */
async function readCut(p: string): Promise<{ text: string; cut: boolean }> {
  const f = await open(p, 'r');
  try {
    const buf = Buffer.alloc(SKILL_MAX + 1);
    const { bytesRead } = await f.read(buf, 0, SKILL_MAX + 1, 0);
    const cut = bytesRead > SKILL_MAX;
    return { text: buf.subarray(0, Math.min(bytesRead, SKILL_MAX)).toString('utf8'), cut };
  } finally {
    await f.close();
  }
}

/**
 * The skill at `raw` (a SKILL.md path from the rows), or its sibling `file`, if the fence lets it:
 * `allow` is the latest rows' skill paths.
 */
export async function readSkill(raw: unknown, file: unknown, allow: readonly string[]): Promise<SkillRead> {
  if (typeof raw !== 'string' || raw === '' || (file !== undefined && file !== null && !siblingOk(file))) return { error: 'not_allowed' };
  const asked = await real(raw);
  if (asked === null) return allow.includes(raw) ? { error: 'gone' } : { error: 'not_allowed' };
  const fenced = (await Promise.all(allow.map(real))).includes(asked);
  if (!fenced) return { error: 'not_allowed' };
  const dir = dirname(asked);
  let names: string[];
  try {
    names = (await readdir(dir, { withFileTypes: true })).map((d) => (d.isDirectory() ? `${d.name}/` : d.name));
  } catch {
    return { error: 'gone' };
  }
  names.sort((a, b) => a.localeCompare(b));
  let target = asked;
  if (typeof file === 'string') {
    if (!names.includes(file)) return { error: 'not_allowed' };
    const r = await real(join(dir, file));
    // a .md symlink pointing out of the folder is refused
    if (r === null) return { error: 'gone' };
    if (dirname(r) !== dir && !r.startsWith(dir + sep)) return { error: 'not_allowed' };
    target = r;
  }
  try {
    const { text, cut } = await readCut(target);
    const others = names.filter((n) => n !== basename(asked));
    return {
      text,
      cut,
      files: others.slice(0, LIST_MAX).map((n) => (n.endsWith('/') ? { name: n.slice(0, -1), dir: true } : { name: n, dir: false })),
      more: Math.max(0, others.length - LIST_MAX),
      folder: dir,
    };
  } catch {
    return { error: 'gone' };
  }
}
