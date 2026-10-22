// @vitest-environment happy-dom
// about-chip (his « du markdown pas rendu correctement quand j'envoie un message avec un artifact
// xlsx ouvert »): his bubble draws an open artifact's 'about' lead as its chip, for every kind.
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Artifact, Part } from '@/proto';
import type { CorePort } from '@/shared/api';
import { Store, StoreProvider, replay, threadKey } from '@/store';
import { slotMark } from './Markdown';
import { aboutChipMd, aboutParts, aboutText } from './about';
import { EntryRow, type RowCtx } from './rows';

afterEach(cleanup);

const P = 'docs-1a2b3c4d';
const HUB = '/Users/me/.bise/hubs/docs-1a2b3c4d/artifacts';
const art = (id: string, kind: string, title: string, url: string, more: Partial<Artifact> = {}): Artifact => ({ id, kind, title, agent: 'office', version: 2, at_ms: 1791100000000, url, new: false, ...more });
// an xlsx (a copy whose path has spaces), a bise page (a link), an html file and an image
const XLSX = art('projection', 'sheet', 'projection achat ou location', `${HUB}/projection/v3/projection achat ou location.xlsx`, {
  versions: [
    { v: 2, at_ms: 1, copy: `${HUB}/projection/v2/projection achat ou location.xlsx` },
    { v: 3, at_ms: 2, copy: `${HUB}/projection/v3/projection achat ou location.xlsx` },
  ],
});
const PAGE = art('q3-notes', 'page', 'Q3 notes', 'http://127.0.0.1:47438/p/q3-notes');
const HTML = art('mock', 'site', 'the mock (v2)', `${HUB}/mock/v2/index.html`);
const IMAGE = art('shot', 'image', 'login shot', `${HUB}/shot/v2/login shot.png`);
const ARTS = [XLSX, PAGE, HTML, IMAGE];

describe('aboutChipMd: the lead is the artifact chip, never its link or path', () => {
  it('each kind: its url (a v2 copy after a v3 came too) names the artifact', () => {
    expect(aboutChipMd(aboutText({ title: XLSX.title, url: XLSX.versions?.[0]?.copy ?? '' }, 'En fait 3200'), ARTS)).toBe('about [projection achat ou location](artifact:projection): En fait 3200');
    expect(aboutChipMd(aboutText(PAGE, 'why?'), ARTS)).toBe('about [Q3 notes](artifact:q3-notes): why?');
    expect(aboutChipMd(aboutText(HTML, 'ok'), ARTS)).toBe('about [the mock (v2)](artifact:mock): ok');
    expect(aboutChipMd(aboutText(IMAGE, ''), ARTS)).toBe('about [login shot](artifact:shot): ');
  });
  it('after the chips of his quotes; an artifact the project lost: its title alone; other words as written', () => {
    expect(aboutChipMd(`${slotMark(0)} ${aboutText(PAGE, 'see')}`, ARTS)).toBe(`${slotMark(0)} about [Q3 notes](artifact:q3-notes): see`);
    expect(aboutChipMd(aboutText({ title: 'old *deck*', url: '/x/y z.pdf' }, 'hm'), ARTS)).toBe('about old \\*deck\\*: hm');
    expect(aboutChipMd('about [a](http://x): later', [])).toBe('about a: later');
    expect(aboutChipMd('tell me about [a](http://x): ok', ARTS)).toBe('tell me about [a](http://x): ok');
  });
});

describe('his bubble about an open artifact (about-chip)', () => {
  it("draws the artifact's chip and his words, never the link or its path; a click opens it", () => {
    const opened: string[] = [];
    const port: CorePort = { send: () => undefined, onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
    const store = new Store(port);
    store.setCore('up');
    replay(store);
    const ctx: RowCtx = { tkey: threadKey(P, 'office'), project: P, agent: 'office', bise: false, onLink: () => undefined, onArtifact: (id) => opened.push(id) };
    const parts: Part[] = aboutParts({ title: XLSX.title, url: XLSX.versions?.[0]?.copy ?? '' }, [{ kind: 'text', text: 'En fait je pense que louer cet appartement ce serait environs 3200-3500 euros par mois' }]);
    act(() => {
      store.apply({ ev: 'artifacts', project: P, items: ARTS });
      store.apply({ ev: 'entry', project: P, agent: 'office', entry: { pos: 7, at_ms: Date.now(), kind: 'you', text: parts.map((p) => (p.kind === 'text' ? p.text : '')).join(''), parts } });
    });
    const v = render(
      <StoreProvider store={store}>
        <EntryRow ctx={ctx} pos={7} />
      </StoreProvider>,
    );
    const bubble = v.container.querySelector('.th-bubble')?.textContent ?? '';
    expect(bubble).toBe('about projection achat ou location: En fait je pense que louer cet appartement ce serait environs 3200-3500 euros par mois');
    const chip = v.getByTestId('thread.artname');
    expect(chip.textContent).toBe('projection achat ou location');
    fireEvent.click(chip);
    expect(opened).toEqual(['projection']);
  });
});
