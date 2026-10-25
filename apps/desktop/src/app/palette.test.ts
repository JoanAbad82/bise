// ⌘K's rows draw nm-ds's line icons, never a text glyph (native-mac §6, ui-review m_42540): each
// sign search gives a hit maps to its icon.
import { describe, expect, it } from 'vitest';
import { artifactGlyph } from '@/search/rank';
import { iconOf } from './Palette';

const hit = (kind: 'agent' | 'page' | 'artifact' | 'scheduled', glyph: string, over: { tone?: '' | 'acc' | 'err' | 'ink' | 'pearl' | 'bise'; archived?: boolean; detail?: string } = {}) => ({
  kind,
  glyph,
  tone: over.tone ?? '',
  archived: over.archived ?? false,
  detail: over.detail ?? '',
});

describe("⌘K's row icons", () => {
  it('an agent: waiting the inbox, done a check, failed a cross, archived the archive box, else its thread', () => {
    expect(iconOf(hit('agent', '?', { tone: 'acc' }))).toBe('inbox');
    expect(iconOf(hit('agent', '✓'))).toBe('check');
    expect(iconOf(hit('agent', '✗', { tone: 'err' }))).toBe('close');
    expect(iconOf(hit('agent', '–', { archived: true }))).toBe('archive');
    expect(iconOf(hit('agent', '∿', { tone: 'ink' }))).toBe('thread');
  });

  it("an artifact by its kind's sign: a PR the branch, images the grid, a file or a page the file, a link the globe", () => {
    expect(iconOf(hit('artifact', artifactGlyph('pr')))).toBe('branch');
    expect(iconOf(hit('artifact', artifactGlyph('images')))).toBe('grid');
    expect(iconOf(hit('artifact', artifactGlyph('csv')))).toBe('file');
    expect(iconOf(hit('artifact', artifactGlyph('page'), { detail: 'page · v2' }))).toBe('file');
    expect(iconOf(hit('artifact', artifactGlyph('link'), { detail: '↗' }))).toBe('browser');
  });

  it('a project (its pearl) the folder; a scheduled task the clock; a page its place', () => {
    expect(iconOf(hit('agent', '', { tone: 'pearl' }))).toBe('folder');
    expect(iconOf(hit('agent', '', { tone: 'bise' }))).toBe('folder');
    expect(iconOf(hit('scheduled', '◷'))).toBe('scheduled');
    expect(iconOf(hit('page', '⚙'))).toBe('settings');
    expect(iconOf(hit('page', '⊞'))).toBe('plugins');
  });
});
