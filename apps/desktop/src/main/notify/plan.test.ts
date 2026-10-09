import { describe, expect, it } from 'vitest';
import type { Card } from '../../proto';
import { Arrivals, effectOf, knocks, langOf, noteOf, titleOf } from './plan';

const card = (o: Partial<Card> = {}): Card => ({
  id: 7,
  project: 'acme-1',
  kind: 'question',
  agent: 'search',
  question: 'reindex tonight at 2:00, or now?',
  options: [
    { n: 1, label: 'tonight at 2:00' },
    { n: 2, label: 'now' },
  ],
  urgent: false,
  since_ms: 1,
  ...o,
});
const acme = { name: 'acme', home: false };

describe('notify plan: what one notification says (designer m_14211)', () => {
  it("title: '<agent> asks · <project>', main is bise, bise's home names no project, fr", () => {
    expect(titleOf(card(), acme, 'en')).toBe('search asks · acme');
    expect(titleOf(card({ agent: 'main' }), acme, 'en')).toBe('bise asks · acme');
    expect(titleOf(card(), { name: 'bise', home: true }, 'en')).toBe('search asks');
    expect(titleOf(card(), acme, 'fr')).toBe('search demande · acme');
  });

  it("a question: its choices then 'open in bise', a reply field; the body is the question as written", () => {
    const n = noteOf(card(), acme, 'en', false);
    expect(n.actions).toEqual(['tonight at 2:00', 'now', 'open in bise']);
    expect(n.picks).toEqual([1, 2, null]);
    expect(n.reply).toBe(true);
    expect(n.placeholder).toBe('your answer');
    expect(n.body).toBe('reindex tonight at 2:00, or now?');
    expect(n.group).toBe('acme-1');
    expect(noteOf(card(), acme, 'fr', false).actions.at(-1)).toBe('ouvrir dans bise');
  });

  it('more than 4 choices, or one over 40 characters: only open in bise (nothing cut), still a reply', () => {
    const six = card({ options: [1, 2, 3, 4, 5, 6].map((n) => ({ n, label: `layer ${n}` })) });
    expect(noteOf(six, acme, 'en', false).actions).toEqual(['open in bise']);
    const long = card({ options: [{ n: 1, label: 'x'.repeat(41) }, { n: 2, label: 'no' }] });
    expect(noteOf(long, acme, 'en', false).actions).toEqual(['open in bise']);
    expect(noteOf(long, acme, 'en', false).reply).toBe(true);
  });

  it('an approval: its two words as buttons, no reply, no open in bise', () => {
    const n = noteOf(card({ approval: true, options: [{ n: 1, label: 'merge' }, { n: 2, label: 'not yet' }] }), acme, 'en', false);
    expect(n.actions).toEqual(['merge', 'not yet']);
    expect(n.reply).toBe(false);
  });

  it('a quiet moment: silent', () => {
    expect(noteOf(card(), acme, 'en', true).silent).toBe(true);
    expect(noteOf(card(), acme, 'en', false).silent).toBe(false);
  });
});

describe('notify plan: what his gesture does (the same answer as the window)', () => {
  const n = noteOf(card(), acme, 'en', false);
  it('a choice answers with its option number', () => {
    expect(effectOf(n, { action: 1 })).toEqual({ t: 'answer', cmd: { cmd: 'answer', project: 'acme-1', card: 7, reply: '2' } });
  });
  it("'open in bise' and a click on the banner open that card in the inbox", () => {
    expect(effectOf(n, { action: 2 })).toEqual({ t: 'open', route: 'inbox?card=acme-1/7' });
    expect(effectOf(n, { click: true })).toEqual({ t: 'open', route: 'inbox?card=acme-1/7' });
  });
  it('a reply answers with his words; empty or on an approval, nothing', () => {
    expect(effectOf(n, { reply: '  now please ' })).toEqual({ t: 'answer', cmd: { cmd: 'answer', project: 'acme-1', card: 7, reply: 'now please' } });
    expect(effectOf(n, { reply: '  ' })).toEqual({ t: 'none' });
    const ap = noteOf(card({ approval: true }), acme, 'en', false);
    expect(effectOf(ap, { reply: 'merge it' })).toEqual({ t: 'none' });
    expect(effectOf(n, { action: 9 })).toEqual({ t: 'none' });
  });
});

describe('notify plan: arrivals and knocks', () => {
  it("a project's first list never knocks; a later card is fresh; a card that left is gone", () => {
    const a = new Arrivals();
    expect(a.apply('acme-1', [card()])).toEqual({ fresh: [], gone: [] });
    const c8 = card({ id: 8 });
    expect(a.apply('acme-1', [card(), c8])).toEqual({ fresh: [c8], gone: [] });
    expect(a.apply('acme-1', [c8])).toEqual({ fresh: [], gone: ['acme-1#7'] });
    expect(a.apply('docs-2', [card({ project: 'docs-2' })]).fresh).toEqual([]);
  });
  it('only when no bise window had the keys', () => {
    expect(knocks(false)).toBe(true);
    expect(knocks(true)).toBe(false);
  });
  it('fr when his first language is French', () => {
    expect(langOf(['fr-FR', 'en-US'])).toBe('fr');
    expect(langOf(['en-GB', 'fr'])).toBe('en');
    expect(langOf([])).toBe('en');
  });
});
