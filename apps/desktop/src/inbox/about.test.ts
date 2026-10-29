import { describe, expect, it } from 'vitest';
import { aboutOf, aboutWords, openAct } from './about';

// card-links (architect m_27431): one link for any artifact; an older hub's page reads as one
describe('what a notification is about', () => {
  const page = { id: 'bims-office', url: 'http://h/p/bims-office#look', block: 'look', title: 'les bims', v: 3 };

  it('reads the hub artifact first, an older hub page as the same link', () => {
    const art = { id: 'les-bims-prototype', kind: 'site', title: 'les bims · prototype', v: 1, url: null, at: null };
    expect(aboutOf({ artifact: art, page })).toBe(art);
    expect(aboutOf({ page })).toEqual({ id: 'bims-office', kind: 'page', title: 'les bims', v: 3, url: 'http://h/p/bims-office#look', at: { kind: 'block', block: 'look' } });
    expect(aboutOf({ page: { id: 'w', url: '', item: 'hn-41', block: 'comments' } })).toEqual({ id: 'w', kind: 'page', title: 'w', v: null, url: null, at: { kind: 'block', block: 'hn-41' } });
    expect(aboutOf({})).toBeNull();
  });

  it('says its title and kind, and opens at its block', () => {
    const a = aboutOf({ page });
    expect(a && aboutWords(a)).toEqual({ title: 'les bims', meta: 'page · v3' });
    expect(a && openAct(a)).toEqual({ act: 'open', artifact: 'bims-office', at: 'look', url: 'http://h/p/bims-office#look' });
    expect(aboutWords({ id: 'x', kind: 'doc', title: '', v: null })).toEqual({ title: 'x', meta: 'doc' });
    // designer m_27435: the artifacts list's words; a link has no version
    expect(aboutWords({ id: 'd', kind: 'slides', title: 'the onboarding', v: 3 }).meta).toBe('deck · v3');
    expect(aboutWords({ id: 'l', kind: 'link', title: 'the docs', v: 1 }).meta).toBe('link');
    expect(aboutWords({ id: 'f', kind: '', title: 'f', v: 2 }).meta).toBe('file · v2');
  });
});
