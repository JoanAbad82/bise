// An artifact opened by id that the project's list doesn't have (ui-review m_46410 (b), designer
// m_46415): the centre shows the project's main, never a blank; the panel says it isn't in the list
// any more, with 'show archived ›' when the project has archived artifacts, else 'open the
// library ›'. Before the project's list came, both wait. Typed inputs in; what the window shows out.
import { describe, expect, it } from 'vitest';
import { artifact, artifacts, card, goTo, pick, projects, row } from './inputs';
import { feature } from './run';

const ACME = 'acme-1a2b3c4d';
const PAGE = 'http://127.0.0.1:47123/p/perf-notes';
const ask = card({
  project: ACME,
  id: 77,
  agent: 'perf',
  question: 'about [Perf notes](artifact:perf-note): which size?',
  options: [{ n: 1, label: 'open it', act: { act: 'open', url: PAGE, artifact: 'perf-note', at: null } }],
});
const acme = row({ project: ACME, name: 'acme', cards: [ask], waits: 1 });
const notes = artifact({ id: 'perf-notes', kind: 'page', title: 'Perf notes', agent: 'perf', url: PAGE });

describe('an artifact the list does not have', () => {
  it('its maker is in the centre when it is listed', () => {
    const w = feature().given(projects(acme), artifacts(ACME, notes));
    expect(w.view.artifact(ACME, 'perf-notes')).toEqual({ centre: { c: 'maker', agent: 'perf' }, panel: 'view' });
  });

  it("gone (a link, back, an old artifact name): the project's main in the centre, the panel's link to the library", () => {
    const w = feature().given(projects(acme), artifacts(ACME, notes));
    // an inbox option that names it opens its url in his browser instead (inbox-acts): never this route
    w.does(pick(ACME, 77, 1, 'inbox'));
    expect(w.view.route()).toEqual({ screen: 'inbox' });
    w.does(goTo({ screen: 'artifacts', project: ACME, id: 'perf-note' }));
    expect(w.view.artifact(ACME, 'perf-note')).toEqual({ centre: { c: 'main' }, panel: { gone: 'library', to: { screen: 'artifacts', project: ACME } } });
  });

  it('gone, the project has archived ones: the link shows the archived list', () => {
    const w = feature().given(projects(acme), artifacts(ACME, notes, artifact({ id: 'old', agent: 'perf', archived_at: 1_791_000_000_000 })));
    expect(w.view.artifact(ACME, 'perf-note')).toEqual({ centre: { c: 'main' }, panel: { gone: 'archived', to: { screen: 'artifacts', project: ACME, at: 'archived' } } });
  });

  it("before the project's list came: both wait, nothing is said yet", () => {
    const w = feature().given(projects(acme));
    expect(w.view.artifact(ACME, 'perf-notes')).toEqual({ centre: { c: 'wait' }, panel: 'wait' });
  });
});
