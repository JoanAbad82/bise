import { describe, expect, it } from 'vitest';
import type { Part } from '@/proto';
import { partsGist, youView } from './parts';

// msg-parts (architect m_17621): his message drawn from its typed parts, never a tag; the TUI's
// said.rs view_of / gist are the rule
const quote = (from: string, text: string, at: Partial<{ file: string; new: string; old: string }> = {}): Part => ({ kind: 'quote', from, text, ...at });
const text = (t: string): Part => ({ kind: 'text', text: t });

describe('his message from its parts (msg-parts)', () => {
  it('quotes first, his words, a paste as its chip label in place, images and files apart', () => {
    const v = youView([
      quote('main', 'the cache is warm'),
      quote('t1 vs main', 'let x = 1;', { file: 'src/a.rs', new: '12-14' }),
      text('what does '),
      { kind: 'paste', n: 1, text: 'line 1\nline 2' },
      text(' mean? '),
      { kind: 'image', name: '[Image #2]', source: '/Users/me/shot.png', mime: 'image/png', b64_file: '/s/x.b64' },
      text(' and this'),
      { kind: 'file', path: '/Users/me/notes.md' },
    ]);
    expect(v.quotes).toEqual([
      { from: 'main', text: 'the cache is warm', file: '', new: '', old: '' },
      { from: 't1 vs main', text: 'let x = 1;', file: 'src/a.rs', new: '12-14', old: '' },
    ]);
    expect(v.words).toBe('what does ▤ 1 mean? and this');
    expect(v.pastes).toEqual([{ n: 1, text: 'line 1\nline 2' }]);
    expect(v.images).toEqual([{ name: '[Image #2]', path: '/Users/me/shot.png' }]);
    expect(v.files).toEqual(['/Users/me/notes.md']);
    // never a tag in what is drawn
    expect(JSON.stringify(v)).not.toMatch(/<selection|<pasted|<image/u);
  });

  it('plain words are his words; a part from a newer client draws nothing', () => {
    expect(youView([text('ship it')])).toEqual({ quotes: [], words: 'ship it', pastes: [], images: [], files: [] });
    expect(youView([text('a'), { kind: 'video', url: 'x' } as unknown as Part]).words).toBe('a');
  });

  it("a row's gist: each chip's glyph and label in place (the TUI's gist)", () => {
    expect(partsGist([quote('main', 'q'), text('both '), { kind: 'paste', n: 1, text: 'x' }, text(' and '), { kind: 'image', name: '[Image #2]', source: '/a/shot.png' }])).toBe('❝ main both ▤ 1 and ▣ [Image #2]');
    expect(partsGist([{ kind: 'image', name: 'shot.png', source: '/a/shot.png' }])).toBe('▣ shot.png');
  });
});
