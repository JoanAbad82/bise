// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { extOf, iconKindOf, KindIcon, PlayIcon, type IconKind } from './icons';

describe('iconKindOf', () => {
  const cases: [Parameters<typeof iconKindOf>[0], IconKind][] = [
    [{ kind: 'page', url: 'http://127.0.0.1:47438/p/x' }, 'page'],
    [{ kind: 'file', path: '/a/b/shot.PNG' }, 'image'],
    [{ kind: 'shots', path: '/a/b' }, 'image'],
    [{ kind: 'file', path: '/a/budget.xlsx' }, 'sheet'],
    [{ kind: 'file', path: '/a/pitch.pptx' }, 'deck'],
    [{ kind: 'file', path: '/a/notes.md' }, 'doc'],
    [{ kind: 'file', path: '/a/offre.pdf' }, 'doc'],
    [{ kind: 'file', path: '/a/poof.mp4' }, 'video'],
    [{ kind: 'file', path: '/a/voice.m4a' }, 'audio'],
    [{ kind: 'file', path: '/a/appart.glb' }, '3d'],
    [{ kind: 'file', path: '/a/bise.dmg' }, 'file'],
    [{ kind: 'file', path: '/a/dir/' }, 'file'],
    [{ kind: 'link', url: 'https://drive.google.com/x' }, 'link'],
    [{ kind: 'link', url: 'https://example.com/report.pdf' }, 'doc'],
    [{ kind: 'pr', url: 'https://github.com/a/b/pull/3' }, 'pr'],
    [{ kind: 'release', url: 'https://github.com/a/b/releases/tag/v1' }, 'release'],
    [{ kind: 'site', target: '/w/site/index.html' }, 'page'],
    [{ kind: 'whatever', url: 'https://x.dev' }, 'link'],
    [{ kind: 'whatever' }, 'file'],
  ];
  it.each(cases)('%j → %s', (a, want) => {
    expect(iconKindOf(a)).toBe(want);
  });
});

describe('extOf', () => {
  it('reads the path, then the target, then a url with a file', () => {
    expect(extOf({ kind: 'file', path: '/x/a.tar.GZ' })).toBe('gz');
    expect(extOf({ kind: 'file', target: '/x/a.md' })).toBe('md');
    expect(extOf({ kind: 'link', url: 'https://x.dev/a/b.pdf?dl=1' })).toBe('pdf');
    expect(extOf({ kind: 'link', url: 'https://drive.google.com/drive/folders/1' })).toBe('');
    expect(extOf({ kind: 'link', url: 'https://x.dev' })).toBe('');
  });
});

describe('KindIcon', () => {
  it('draws a 16 px line icon in currentColor, stroke 1.5, for every kind', () => {
    const kinds: IconKind[] = ['page', 'doc', 'sheet', 'deck', 'image', 'video', 'audio', '3d', 'file', 'link', 'pr', 'release'];
    for (const k of kinds) {
      const html = renderToStaticMarkup(<KindIcon kind={k} />);
      expect(html).toContain('width="16"');
      expect(html).toContain('stroke="currentColor"');
      expect(html).toContain('stroke-width="1.5"');
      expect(html).toContain(`data-kind="${k}"`);
    }
    expect(renderToStaticMarkup(<PlayIcon />)).toContain('fill="currentColor"');
  });
});
