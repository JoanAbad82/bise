// @vitest-environment happy-dom
// The skill tab (page skill-panel, pick A; designer m_43059): its frontmatter read pure (none, read,
// broken with its line), and the tab drawn from its rows and a fake reader, light and dark.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Plugin, PluginPart } from '@/proto';
import type { SkillRead } from '@/shared/api';
import { pages } from '@/proto/words_pages.gen';
import { folds, readFront } from './frontmatter';
import { midCut, skillOf, SkillView } from './SkillTab';

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-theme');
});

describe('a SKILL.md frontmatter, pure', () => {
  it('none: the whole file is the body', () => {
    expect(readFront('# Docs\nhow to')).toEqual({ kind: 'none', body: '# Docs\nhow to' });
  });

  it('read: one key a row, a list, a nested map, a block scalar, quotes off; the body after it', () => {
    const f = readFront(['---', 'name: docs', 'description: "make a docx, read one"', 'license: MIT', 'allowed-tools:', '  - Read', '  - Write', 'metadata:', '  version: 2', '  owner: plug', 'notes: |', '  line one', '  line two', '---', '', '# Docs'].join('\n'));
    if (f.kind !== 'ok') throw new Error(f.kind);
    expect(f.keys).toEqual([
      { key: 'name', value: 'docs' },
      { key: 'description', value: 'make a docx, read one' },
      { key: 'license', value: 'MIT' },
      { key: 'allowed-tools', value: 'Read\nWrite' },
      { key: 'metadata', value: 'version: 2\nowner: plug' },
      { key: 'notes', value: 'line one\nline two' },
    ]);
    expect(f.body).toBe('# Docs');
  });

  it('broken: the line it cannot read (the file\'s own number), or line 1 when it never closes', () => {
    expect(readFront('---\nname: docs\nthis is no key\n---\nbody')).toEqual({ kind: 'broken', line: 3, raw: 'name: docs\nthis is no key', body: 'body' });
    expect(readFront('---\nname: docs\n')).toMatchObject({ kind: 'broken', line: 1 });
  });

  it('a long value folds; a path is cut in its middle, home folded', () => {
    expect(folds('short')).toBe(false);
    expect(folds('a\nb\nc')).toBe(true);
    expect(folds('x'.repeat(200))).toBe(true);
    expect(midCut('/Users/g/.agents/plugins/docs/skills/docs/SKILL.md', '/Users/g', 24)).toBe('~/…/docs/SKILL.md');
    expect(midCut('/a/SKILL.md', undefined)).toBe('/a/SKILL.md');
    // a home under /Users that isn't the window's (a check run's test home) still folds
    expect(midCut('/Users/gabriel/bise/prompts/skills-all/bise-pages/SKILL.md', '/tmp/home', 24)).toBe('~/…/bise-pages/SKILL.md');
    expect(midCut('/opt/x/y/z/w/SKILL.md', undefined, 12)).toBe('/opt/…/w/SKILL.md');
  });
});

const part = (over: Partial<PluginPart> = {}): PluginPart => ({ id: 'docs#skill:docs', kind: 'skill', name: 'docs', what: 'make, read or edit a Word document, with comments and tracked changes', on: true, path: '/p/docs/skills/docs/SKILL.md', ...over });
const plugin = (over: Partial<Plugin> = {}): Plugin => ({ id: 'docs', name: 'docs', kind: 'plugin', scope: 'user', title: 'docs', state: 'loaded', on: true, parts: [part()], ...over });
const ok = (text: string): SkillRead => ({ text, cut: false, files: [{ name: 'guide.md', dir: false }, { name: 'scripts', dir: true }, { name: 'run.py', dir: false }], more: 0, folder: '/p/docs/skills/docs' });

describe.each(['light', 'dark'] as const)('the skill tab in %s', (theme) => {
  it('its head, its frontmatter rows, its SKILL.md read, its files; a .md opens in place', async () => {
    document.documentElement.setAttribute('data-theme', theme);
    const asked: (string | undefined)[] = [];
    const read = (_p: string, file?: string) => {
      asked.push(file);
      return Promise.resolve(file === 'guide.md' ? ok('# the guide') : ok('---\nname: docs\ndescription: make docs\n---\n# Docs\n\nhow to'));
    };
    render(<SkillView p={plugin()} s={part()} read={read} ports={{ setOn: () => undefined }} home="/p" />);
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByTestId('plugins.skill.name').textContent).toBe('docs');
    // the whole description as its lead, never cut
    expect(screen.getByTestId('plugins.skill.say').textContent).toBe(part().what);
    expect(screen.getByTestId('plugins.skill.facts').textContent).toBe(`docs · user · ${pages.skill_on} · ${pages.skill_used_when}`);
    expect(screen.getByTestId('plugins.skill.path').getAttribute('data-tip')).toBe('/p/docs/skills/docs/SKILL.md');
    expect(screen.getByTestId('plugins.skill.front.name').textContent).toContain('docs');
    expect(screen.getByTestId('plugins.skill.body').querySelector('h1')?.textContent).toBe('Docs');
    // sentence-case labels, never 'FILES · 11'
    expect(screen.getByTestId('plugins.skill.files.label').firstChild?.textContent).toBe(pages.skill_files);
    fireEvent.click(screen.getByTestId('plugins.skill.source'));
    expect(screen.getByTestId('plugins.skill.raw').textContent).toContain('name: docs');
    fireEvent.click(screen.getByTestId('plugins.skill.file.guide.md'));
    await act(async () => { await Promise.resolve(); });
    expect(asked).toEqual([undefined, 'guide.md']);
    expect(screen.getByTestId('plugins.skill.back')).toBeTruthy();
    expect(screen.queryByTestId('plugins.skill.front')).toBeNull();
  });
});

describe('the skill tab, its states', () => {
  it('no frontmatter: no block; broken: the ▲ line and the raw text; refused: one Empty', async () => {
    const one = render(<SkillView p={plugin()} s={part()} read={() => Promise.resolve(ok('# plain'))} ports={{ setOn: () => undefined }} />);
    await act(async () => { await Promise.resolve(); });
    expect(screen.queryByTestId('plugins.skill.front')).toBeNull();
    one.unmount();
    const two = render(<SkillView p={plugin()} s={part()} read={() => Promise.resolve(ok('---\nname: docs\noops\n---\nx'))} ports={{ setOn: () => undefined }} />);
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByTestId('plugins.skill.front.broken').textContent).toBe(pages.skill_front_broken({ line: 3 }));
    two.unmount();
    render(<SkillView p={plugin()} s={part()} read={() => Promise.resolve({ error: 'not_allowed' })} ports={{ setOn: () => undefined }} />);
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByTestId('plugins.skill.error').textContent).toBe(pages.skill_not_allowed);
  });

  it('a hub that sends no path: says so, reads nothing; the rows find a skill by plugin and name', () => {
    render(<SkillView p={plugin()} s={part({ path: null })} read={() => Promise.reject(new Error('read'))} ports={{ setOn: () => undefined }} />);
    expect(screen.getByTestId('plugins.skill.nopath').textContent).toBe(pages.skill_no_file);
    expect(skillOf([plugin()], 'docs', 'docs')?.s.id).toBe('docs#skill:docs');
    expect(skillOf([plugin()], 'docs', 'nope')).toBeUndefined();
  });
});
