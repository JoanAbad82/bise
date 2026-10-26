// The skill tab's fence (architect m_43316, m_43797): only a skill path of the latest plugins rows,
// by realpath; a sibling only by a .md name of that folder's own listing, its realpath inside it.
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { readSkill, siblingOk, skillPaths, SKILL_MAX } from './skillfile';

const root = mkdtempSync(join(tmpdir(), 'skillfile-'));
afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});
const at = (...p: string[]) => join(root, ...p);
// a plugin's skill, a folder linked from elsewhere (a symlinked skill), a file outside every skill
mkdirSync(at('plug/skills/docs/refs'), { recursive: true });
writeFileSync(at('plug/skills/docs/SKILL.md'), '---\nname: docs\n---\n# Docs\n');
writeFileSync(at('plug/skills/docs/guide.md'), '# the guide');
writeFileSync(at('plug/skills/docs/run.py'), 'print(1)');
mkdirSync(at('elsewhere/real-skill'), { recursive: true });
writeFileSync(at('elsewhere/real-skill/SKILL.md'), 'no frontmatter');
symlinkSync(at('elsewhere/real-skill'), at('plug/skills/linked'));
writeFileSync(at('secret.md'), 'not his skill');
symlinkSync(at('secret.md'), at('plug/skills/docs/out.md'));
mkdirSync(at('big'), { recursive: true });
writeFileSync(at('big/SKILL.md'), 'x'.repeat(SKILL_MAX + 10));

const allow = [at('plug/skills/docs/SKILL.md'), at('plug/skills/linked/SKILL.md'), at('big/SKILL.md')];

describe('the skill tab fence', () => {
  it("a listed skill: its SKILL.md and its folder's names (not itself), folders marked", async () => {
    const r = await readSkill(at('plug/skills/docs/SKILL.md'), undefined, allow);
    if ('error' in r) throw new Error(r.error);
    expect(r.text).toContain('# Docs');
    expect(r.cut).toBe(false);
    expect(r.files).toEqual([
      { name: 'guide.md', dir: false },
      { name: 'out.md', dir: false },
      { name: 'refs', dir: true },
      { name: 'run.py', dir: false },
    ]);
  });

  it('a symlinked skill folder is read through its realpath', async () => {
    const r = await readSkill(at('plug/skills/linked/SKILL.md'), undefined, allow);
    expect('text' in r && r.text).toBe('no frontmatter');
  });

  it('a path outside the rows, and a ../ path, are refused', async () => {
    expect(await readSkill(at('secret.md'), undefined, allow)).toEqual({ error: 'not_allowed' });
    expect(await readSkill(at('plug/skills/docs/../docs/../../../secret.md'), undefined, allow)).toEqual({ error: 'not_allowed' });
    expect(await readSkill(at('plug/skills/docs/guide.md'), undefined, allow)).toEqual({ error: 'not_allowed' });
    expect(await readSkill(42, undefined, allow)).toEqual({ error: 'not_allowed' });
  });

  it('a sibling .md is read; a .md symlink pointing out, a non-.md, a ../ name are refused', async () => {
    const md = at('plug/skills/docs/SKILL.md');
    const sib = await readSkill(md, 'guide.md', allow);
    expect('text' in sib && sib.text).toBe('# the guide');
    expect(await readSkill(md, 'out.md', allow)).toEqual({ error: 'not_allowed' });
    expect(await readSkill(md, 'run.py', allow)).toEqual({ error: 'not_allowed' });
    expect(await readSkill(md, '../../../secret.md', allow)).toEqual({ error: 'not_allowed' });
    expect(await readSkill(md, 'missing.md', allow)).toEqual({ error: 'not_allowed' });
    expect(siblingOk('a/b.md')).toBe(false);
  });

  it('cut at 256 KB; a listed path gone is gone', async () => {
    const r = await readSkill(at('big/SKILL.md'), undefined, allow);
    expect('cut' in r && r.cut).toBe(true);
    expect('text' in r && r.text.length).toBe(SKILL_MAX);
    expect(await readSkill(at('gone/SKILL.md'), undefined, [at('gone/SKILL.md')])).toEqual({ error: 'gone' });
  });

  it("the allowlist is the plugins rows' skill parts' paths", () => {
    expect(skillPaths({ ev: 'plugins', items: [{ parts: [{ kind: 'skill', path: '/a/SKILL.md' }, { kind: 'mcp', path: '/b' }, { kind: 'skill' }] }, { parts: null }] })).toEqual(['/a/SKILL.md']);
    expect(skillPaths(undefined)).toEqual([]);
  });
});
