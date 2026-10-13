import { describe, expect, it } from 'vitest';
import type { Part } from '@/proto';
import { drawnParts, pageAnswer, pageOf, partsGist, youView } from './parts';

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
    expect(v.images).toEqual([{ name: '[Image #2]', path: '/Users/me/shot.png', caption: '' }]);
    // the talk's still: its caption is a fact about the image, never his words (architect m_22000)
    const still = youView([{ kind: 'image', name: '[Image #1]', source: '/h/images/ab.png', caption: 'Safari · cold bench' }, text('why is it slow?')]);
    expect([still.words, still.images[0]?.caption]).toEqual(['why is it slow?', 'Safari · cold bench']);
    expect(v.files).toEqual([{ name: '', path: '/Users/me/notes.md', missing: false }]);
    // never a tag in what is drawn
    expect(JSON.stringify(v)).not.toMatch(/<selection|<pasted|<image/u);
  });

  it('plain words are his words; a part from a newer client draws nothing', () => {
    expect(youView([text('ship it')])).toEqual({ quotes: [], words: 'ship it', pastes: [], images: [], files: [] });
    expect(youView([text('a'), { kind: 'video', url: 'x' } as unknown as Part]).words).toBe('a');
  });

  it("a row's gist: each chip's glyph and label in place (the TUI's gist)", () => {
    expect(partsGist([quote('main', 'q'), text('both '), { kind: 'paste', n: 1, text: 'x' }, text(' and '), { kind: 'image', name: '[Image #2]', source: '/a/shot.png' }])).toBe('❝ bise both ▤ 1 and ▣ [Image #2]');
    expect(partsGist([{ kind: 'image', name: 'shot.png', source: '/a/shot.png' }])).toBe('▣ shot.png');
  });
});

// page-answer-row (architect m_20833): what he did on a page draws from its page part, bise-proto's
// words::page_answer word for word, never the hub's template; a part this window doesn't know draws
// the entry from its text (never an empty bubble)
describe('his answer on a page (page part)', () => {
  const page = (notes: object[], to = 'main'): Part =>
    ({ kind: 'page', text: 'you sent 1 note on your page … answer with: sb page publish <file>', to, page: 'effort-lists', title: 'efforts', version: 4, notes }) as Part;
  it('one pick on a card reads as the card answer, his words alone', () => {
    const p = pageOf([page([{ block: 'q-live', kind: 'pick', text: "la table maintenant, la lecture de l'API juste après", card: 516, asked: "Est-ce que bise lit les listes dans l'API ?" }])]);
    expect(p).not.toBeNull();
    if (p === null) return;
    expect(pageAnswer(p)).toEqual({ head: 'you answered main', asked: "Est-ce que bise lit les listes dans l'API ?", words: "la table maintenant, la lecture de l'API juste après" });
    const short = pageOf([page([{ block: 'q', kind: 'pick', text: 'xhigh', card: 514, asked: 'le nom ?' }])]);
    expect(short === null ? '' : pageAnswer(short).head).toBe('you answered main: xhigh');
  });
  it('notes, a tick, an edit: the page named, his words one per line', () => {
    const p = pageOf([
      page([
        { block: 'p1', kind: 'note', text: 'shorter', quote: 'Revenue grew' },
        { block: 'r', kind: 'tick', text: 'done' },
        { block: 'p2', kind: 'edit', text: 'Q3', quote: 'Q2' },
        { block: 'k', kind: 'keep' },
      ]),
    ]);
    expect(p === null ? null : pageAnswer(p)).toEqual({ head: 'you sent main 4 notes on ↗ efforts', asked: '', words: '"Revenue grew": shorter\n✓ done\n"Q2" → "Q3"\n♡ keep' });
    const start = pageOf([page([{ block: 'ideas', kind: 'start', text: 'go' }])]);
    expect(start === null ? '' : pageAnswer(start).head).toBe('you asked main for an agent on ↗ efforts');
    const one = pageOf([page([{ block: 'p1', kind: 'note', text: 'shorter' }])]);
    expect(one === null ? '' : pageAnswer(one).head).toBe('you sent main a note on ↗ efforts');
  });
  it('a part kind this window does not know: the entry draws from its text', () => {
    expect(drawnParts([text('a'), { kind: 'voice', secs: 3 } as unknown as Part])).toBeNull();
    expect(drawnParts([text('a')])).toEqual([text('a')]);
    expect(drawnParts([])).toBeNull();
  });
});
