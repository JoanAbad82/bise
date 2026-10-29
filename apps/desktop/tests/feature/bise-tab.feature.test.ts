// The rail's bise tab (his m_49841): from a page (settings, scheduled, artifacts, inbox, plugins)
// the ':*' button brings him back to the project or chat he was in, never a default screen; a
// relaunch keeps it; what is gone comes back as what is left (an agent dropped → its project's
// main, a project removed → bise's thread); nothing kept (the first launch) → bise's thread; from
// bise's tab itself the button is its root, bise's thread. Typed inputs in; the window's route out.
// Mutations: biseGo always RAIL_GO.bise, saw() never keeps, stillThere ignoring archived: each red.
import { describe, expect, it } from 'vitest';
import { ev, goTo, projects, rail, row } from './inputs';
import { feature } from './run';

const ACME = 'acme-1a2b3c4d';
const BIMS = 'bims-9f8e7d6c';
const home = row({ project: 'home-00000000', name: 'bise', home: true, order: 0 });
const acme = row({ project: ACME, name: 'acme', order: 1 });
const bims = row({ project: BIMS, name: 'bims', order: 2 });
const agent = (name: string, archived = false) => ({ name, dir: name, main: name === 'main', status: 'idle' as const, archived, title: '', purpose: '', since_ms: 1, waits: 0, watching: [] });
const acmeAgents = (designerArchived = false) => ev('agents', { project: ACME, agents: [agent('main'), agent('designer', designerArchived)] });
const designer = { screen: 'thread', project: ACME, agent: 'designer' } as const;
const BISE = { screen: 'bise' } as const;

describe("the rail's bise tab brings him back where he was", () => {
  it('a chat, then settings: bise lands on that chat', () => {
    const w = feature().given(projects(home, acme, bims), acmeAgents());
    w.does(goTo(designer), rail('settings'), rail('bise'));
    expect(w.view.route()).toEqual(designer);
  });

  it('from each page, and across several pages in a row: the last project or chat', () => {
    for (const page of ['inbox', 'scheduled', 'artifacts', 'plugins', 'settings'] as const) {
      const w = feature().given(projects(home, acme, bims), acmeAgents());
      w.does(goTo(designer), goTo({ screen: 'thread', project: BIMS, agent: 'main' }), rail(page), rail('inbox'), rail(page), rail('bise'));
      expect(w.view.route(), page).toEqual({ screen: 'thread', project: BIMS, agent: 'main' });
    }
  });

  it("a project's screen counts as his place too (its changes)", () => {
    const w = feature().given(projects(home, acme));
    w.does(goTo({ screen: 'changes', project: ACME }), rail('scheduled'), rail('bise'));
    expect(w.view.route()).toEqual({ screen: 'changes', project: ACME });
  });

  it('a relaunch on settings: bise still lands on his chat', () => {
    const w = feature().given(projects(home, acme), acmeAgents());
    w.does(goTo(designer), rail('settings'));
    w.reload().given(projects(home, acme), acmeAgents());
    w.does(rail('bise'));
    expect(w.view.route()).toEqual(designer);
  });

  it("first launch, no chat yet: bise's thread", () => {
    const w = feature().given(projects(home));
    w.does(rail('settings'), rail('bise'));
    expect(w.view.route()).toEqual(BISE);
  });

  it("his chat dropped: its project's main; his project removed: bise's thread", () => {
    const w = feature().given(projects(home, acme), acmeAgents());
    w.does(goTo(designer), rail('artifacts'));
    w.given(acmeAgents(true)).does(rail('bise'));
    expect(w.view.route(), 'archived').toEqual({ screen: 'thread', project: ACME, agent: 'main' });

    const gone = feature().given(projects(home, acme), acmeAgents());
    gone.does(goTo(designer), rail('artifacts'));
    gone.given(projects(home)).does(rail('bise'));
    expect(gone.view.route(), 'project removed').toEqual(BISE);
  });

  it("already in bise's tab: the button is its root, bise's thread", () => {
    const w = feature().given(projects(home, acme), acmeAgents());
    w.does(goTo(designer), rail('bise'));
    expect(w.view.route()).toEqual(BISE);
  });
});
