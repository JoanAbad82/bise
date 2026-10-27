// The left sidebar after he opens an artifact (his m_46381, designer m_46382): from a
// notification's option, an inbox line's artifact name or any other way in, the artifact opens in
// a panel beside its maker's thread and the sidebar keeps his projects (his m_46395), never
// '← Projects' over an empty list. Only the library page shows the library, whole. Typed inputs in; the route the window went to and the sidebar's rows out.
import { describe, expect, it } from 'vitest';
import { artifact, artifacts, card, folder, goTo, libraryFolders, openArtifact, pick, projects, row } from './inputs';
import { feature } from './run';

const ACME = 'acme-1a2b3c4d';
const PAGE = 'http://127.0.0.1:47123/p/art-recent';
const ask = card({
  project: ACME,
  id: 77,
  agent: 'designer',
  question: 'about [artifacts · the 20 newest](artifact:art-recent): which size?',
  options: [
    { n: 1, label: 'open it', act: { act: 'open', url: PAGE, artifact: 'art-recent', at: null } },
    { n: 2, label: 'later' },
  ],
});
const acme = row({ project: ACME, name: 'acme', cards: [ask], waits: 1 });
const other = row({ project: 'bims-9f8e7d6c', name: 'bims', order: 2 });
const listed = artifacts(ACME, artifact({ id: 'art-recent', kind: 'page', title: 'artifacts · the 20 newest', agent: 'designer', url: PAGE }));

describe('the left sidebar after an artifact opens from the inbox', () => {
  it("a notification's option that opens an artifact: its view beside the thread, the sidebar keeps his projects", () => {
    const w = feature().given(projects(acme, other), listed);
    w.does(pick(ACME, 77, 1, 'inbox'));
    expect(w.view.route()).toEqual({ screen: 'artifacts', project: ACME, id: 'art-recent' });
    expect(w.view.sidebar()).toEqual({ shows: 'projects', rows: ['acme', 'bims'] });
  });

  it("an inbox item's artifact name: the same, the sidebar is never empty", () => {
    const w = feature().given(projects(acme, other), listed);
    w.does(openArtifact(ACME, 'art-recent'));
    expect(w.view.route()).toEqual({ screen: 'artifacts', project: ACME, id: 'art-recent' });
    expect(w.view.sidebar().rows.length).toBeGreaterThan(0);
    expect(w.view.sidebar().shows).toBe('projects');
  });

  it('any other way to an artifact by id (a link, ⌘K, back, a capsule): his projects too', () => {
    for (const to of [{ screen: 'artifacts', project: ACME, id: 'art-recent' }, { screen: 'artifacts', project: '', id: 'art-recent' }] as const) {
      const w = feature().given(projects(acme, other), listed);
      w.does(goTo(to));
      expect(w.view.sidebar()).toEqual({ shows: 'projects', rows: ['acme', 'bims'] });
    }
  });

  it('the library page still shows the library whole: All artifacts, Recent, Unfiled, its folders', () => {
    const w = feature().given(projects(acme), listed, libraryFolders([folder({ id: 'f1', name: 'desktop' })]));
    w.does(pick(ACME, 77, 1, 'inbox'), goTo({ screen: 'artifacts', project: '' }));
    expect(w.view.sidebar()).toEqual({ shows: 'library', rows: ['all', 'recent', 'unfiled', 'desktop'] });
  });
});
