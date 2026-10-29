// The artifacts library in folders, in his words (artifacts-folders brief part 4): every project's
// artifacts in the same folders, the project filter's '14 of 74', unfiled, and what an edit of the
// folders (his, through the core; an agent's, through a hub) does to what the page shows.
import { describe, expect, it } from 'vitest';
import { artifact, artifacts, folder, libraryFolders, projects, row, withFolders } from './inputs';
import { feature } from './run';

const HOME = 'bise-home-00000000';
const H = 'harness-1a2b3c4d';
const AI = 'ai-docs-2b3c4d5e';
const desk = folder({ id: 'f-desk', name: 'desktop app' });
const view = folder({ id: 'f-view', name: 'agent view', parent: 'f-desk' });
const rue = folder({ id: 'f-rue', name: '36 rue de Montreuil', by: 'you', named_by_you: true });
const LIB = [desk, view, rue];
const rows = projects(row({ project: HOME, name: 'bise', home: true }), row({ project: H, name: 'harness' }), row({ project: AI, name: 'ai-docs' }));
const harness = withFolders(artifacts(H,
  artifact({ id: 'step2', folder: 'f-view', new: true, at_ms: 1_791_100_099_000 }),
  artifact({ id: 'fixes', folder: 'f-view' }),
  artifact({ id: 'plan', folder: 'f-rue' }),
  artifact({ id: 'loose' }),
), LIB);
const aiDocs = withFolders(artifacts(AI, artifact({ id: 'dpe', folder: 'f-rue' })), LIB);

describe('the artifacts library, in his words', () => {
  it('one library for every project: the same folders hold what each project made, the newest work first', () => {
    const w = feature().given(rows, harness, aiDocs);
    const lib = w.view.library();
    expect(lib.folders).toEqual([
      { path: 'desktop app', count: '2', fresh: 1 },
      { path: 'desktop app / agent view', count: '2', fresh: 1 },
      { path: '36 rue de Montreuil', count: '2', fresh: 0 },
    ]);
    expect(lib.unfiled).toBe('1');
    expect(lib.facts).toBe('5 from 2 projects, in 2 folders · 1 new · 1 unfiled');
  });

  it('a project filter keeps the folders and says how many of each are that project\'s', () => {
    const w = feature().given(rows, harness, aiDocs);
    const lib = w.view.library(AI, 'ai-docs');
    expect(lib.folders.find((f) => f.path === '36 rue de Montreuil')?.count).toBe('1 of 2');
    expect(lib.folders.find((f) => f.path === 'desktop app')?.count).toBe('0 of 2');
    // the hero's facts are that project's alone
    expect(lib.facts).toContain('ai-docs');
    expect(lib.facts).not.toBe(w.view.library().facts);
  });

  it('a folder he deletes leaves its artifacts unfiled, none rewritten', () => {
    const w = feature().given(rows, harness, aiDocs, libraryFolders([desk, view]));
    const lib = w.view.library();
    expect(lib.folders.map((f) => f.path)).toEqual(['desktop app', 'desktop app / agent view']);
    expect(lib.unfiled).toBe('3');
  });

  it('a rename from the core shows at once, whichever hub sent the folders before', () => {
    const w = feature().given(rows, harness, aiDocs, libraryFolders([desk, { ...view, name: 'agent head', named_by_you: true }, rue]));
    expect(w.view.library().folders.map((f) => f.path)).toContain('desktop app / agent head');
  });
});
