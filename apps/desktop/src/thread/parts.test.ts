import { describe, expect, it } from 'vitest';
import type { Part } from '@/proto';
import VIA_FN from '../../../../rust/proto/fixtures/via_fn.json';
import { anchorMeta, chipName, drawnParts, pageAnswer, pageOf, partsGist, viaFn, youView } from './parts';

describe('chipName (send-parts, designer m_25875)', () => {
  it('a short name stays whole', () => {
    expect(chipName('flame-graph.png')).toBe('flame-graph.png');
  });
  it('a long one drops its extension first', () => {
    expect(chipName('the-cold-start-flamegraph.png')).toBe('the-cold-start-flamegraph');
  });
  it('still too long: cut after a whole word with …', () => {
    expect(chipName('cold-start-flame-graph-of-the-night-batch.png')).toBe('cold-start-flame-graph-of…');
  });
  it('one long word: cut on the char', () => {
    expect(chipName('abcdefghijklmnopqrstuvwxyzabcdefgh')).toBe('abcdefghijklmnopqrstuvwxyza…');
  });
});

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

  it("a numbered quote (his m_22231): its label '❝ 1' at its place in his words, its line keeps the number", () => {
    const v = youView([text('regarding '), { kind: 'image', name: '[Image #1]', source: '/a.png' }, text(' and '), { kind: 'quote', from: 'main', text: 'q', n: 2 }, text(', which?')]);
    expect(v.words).toBe('regarding and ❝ 2, which?');
    expect(v.quotes).toEqual([{ from: 'main', text: 'q', file: '', new: '', old: '', n: 2 }]);
    expect(partsGist([text('see '), { kind: 'quote', from: 'main', text: 'q', n: 1 }, text(' and '), quote('perf', 'r')])).toBe('❝ perf see ❝ 1 and');
  });

  it("a part of an artifact (Part::Anchor): its number in his words, a quote line that says where (said.rs anchor_words)", () => {
    const cell: Part = { kind: 'anchor', artifact: 'q3-xlsx', version: 4, anchor: { kind: 'cell', sheet: 'Q3', range: 'B4:D9' }, quote: '1200 1350', n: 1 };
    const slide: Part = { kind: 'anchor', artifact: 'deck', version: 2, anchor: { kind: 'slide', slide: 5 } };
    const v = youView([text('why is '), cell, text(' so low?'), slide]);
    expect(v.words).toBe('why is ❝ 1 so low?');
    expect(v.quotes).toEqual([
      { from: '', text: '1200 1350', file: '', new: '', old: '', anchor: { artifact: 'q3-xlsx', version: 4, label: 'Q3!B4:D9' }, n: 1 },
      { from: '', text: 'slide 5', file: '', new: '', old: '', anchor: { artifact: 'deck', version: 2, label: 'slide 5' } },
    ]);
    // the bubble names it as his composer's row did (designer m_24208); an artifact gone: its id
    expect(anchorMeta({ artifact: 'q3-xlsx', version: 4, label: 'Q3!B4:D9' }, 'q3-forecast.xlsx')).toBe('Q3!B4:D9 · q3-forecast.xlsx · v4');
    expect(anchorMeta({ artifact: 'q3-xlsx', version: 4, label: 'Q3!B4:D9' }, undefined)).toBe('Q3!B4:D9 · q3-xlsx · v4');
    expect(drawnParts([cell])).not.toBeNull();
    expect(partsGist([text('why is '), cell, slide])).toBe('why is ❝ 1❝ slide 5 · deck v2');
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
    expect(pageAnswer(p)).toEqual({ head: 'you answered main', on: '', asked: "Est-ce que bise lit les listes dans l'API ?", words: "la table maintenant, la lecture de l'API juste après" });
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
    expect(p === null ? null : pageAnswer(p)).toEqual({ head: 'you sent main 4 notes on', on: 'efforts', asked: '', words: '"Revenue grew": shorter\n✓ done\n"Q2" → "Q3"\n♡ keep' });
    const start = pageOf([page([{ block: 'ideas', kind: 'start', text: 'go' }])]);
    expect(start === null ? '' : pageAnswer(start).head).toBe('you asked main for an agent on');
    const one = pageOf([page([{ block: 'p1', kind: 'note', text: 'shorter' }])]);
    expect(one === null ? '' : pageAnswer(one).head).toBe('you sent main a note on');
  });
  it('a part kind this window does not know: the entry draws from its text', () => {
    expect(drawnParts([text('a'), { kind: 'voice', secs: 3 } as unknown as Part])).toBeNull();
    expect(drawnParts([text('a')])).toEqual([text('a')]);
    expect(drawnParts([])).toBeNull();
  });
});

// ambient-lead m_22706, designer m_22714: the hub's hint (the capsule's line for the model) is never
// drawn, and 'from fn' follows bise_proto::parts::via_fn on the same cases (via_fn.json)
describe('the hub hint (m_22706)', () => {
  const hint: Part = { kind: 'hint', of: 'capsule', text: '\n\n[from the capsule: answer in one short line]' };
  it('is never in his words, his gist or his chips, and the window still draws the parts', () => {
    const parts = [text("what's running?"), hint];
    expect(drawnParts(parts)).toEqual(parts);
    const v = youView(parts);
    expect(v.words).toBe("what's running?");
    expect(partsGist(parts)).toBe("what's running?");
  });
  it('from fn: the shared cases', () => {
    const cases = VIA_FN as { why: string; said: boolean; via_fn: boolean; parts: Part[] }[];
    expect(cases.length).toBeGreaterThanOrEqual(5);
    for (const c of cases) expect(viaFn(c.parts, c.said), c.why).toBe(c.via_fn);
  });
});
