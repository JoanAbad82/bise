// The fake library the artifacts-in-folders shots run on (page artifacts-gallery v7's mocks): 6
// projects sharing one folder list (4 themes, their task folders, one he made), ~60 artifacts with
// a stack (one agent, one turn), a PR link, a new page, an older day, his own adds, unfiled ones.
// A FakeCore world: prefs, projects, agents, and each project's artifacts event with the folders.
// art-folders' library.spec.ts and art-grid's tabs share it. Owner: art-folders.

export const HOME = 'bise-home-00000000';
export const P = {
  harness: 'harness-1a2b3c4d',
  ai: 'ai-docs-2b3c4d5e',
  paint: 'paint-canvas-3c4d5e6f',
  bise: 'bise-4d5e6f70',
  ts: 'ts-pattern-5e6f7081',
  form: 'app-form-6f708192',
} as const;
const MIN = 60_000;
const DAY = 24 * 60 * MIN;

/** The library's folders: themes, their task folders, one he made (named by him). */
export const FOLDERS = [
  { id: 'f-desktop00', name: 'desktop app', by: 'main', named_by_you: false },
  { id: 'f-agentview', name: 'agent view', parent: 'f-desktop00', by: 'main', named_by_you: false },
  { id: 'f-inbox0000', name: 'inbox', parent: 'f-desktop00', by: 'main', named_by_you: false },
  { id: 'f-heroes000', name: 'page heroes', parent: 'f-desktop00', by: 'main', named_by_you: false },
  { id: 'f-plugins00', name: 'plugins', parent: 'f-desktop00', by: 'main', named_by_you: false },
  { id: 'f-sidebar00', name: 'sidebar', parent: 'f-desktop00', by: 'main', named_by_you: false },
  { id: 'f-welcome00', name: 'welcome', parent: 'f-desktop00', by: 'main', named_by_you: false },
  { id: 'f-bims00000', name: 'bims', by: 'main', named_by_you: false },
  { id: 'f-poof00000', name: 'poof', parent: 'f-bims00000', by: 'main', named_by_you: false },
  { id: 'f-launch000', name: 'launch', by: 'main', named_by_you: false },
  { id: 'f-rue000000', name: '36 rue de Montreuil', by: 'you', named_by_you: true },
  { id: 'f-epargne00', name: 'épargne', by: 'main', named_by_you: false },
  { id: 'f-reports00', name: "main's reports", by: 'main', named_by_you: false },
  { id: 'f-offre0000', name: "offre d'achat", by: 'you', named_by_you: true },
];

interface Art {
  id: string;
  kind: string;
  title: string;
  agent: string;
  folder?: string;
  ago: number;
  path?: string;
  url?: string;
  new?: boolean;
  by?: string;
  turn?: number;
}

/** One project's artifacts, as its hub sends them. */
function artifacts(project: string, now: number, items: Art[]) {
  return {
    ev: 'artifacts',
    project,
    folders: FOLDERS,
    items: items.map((a) => ({
      id: a.id,
      kind: a.kind,
      title: a.title,
      agent: a.agent,
      version: 1,
      at_ms: now - a.ago,
      url: a.url ?? a.path ?? '',
      new: a.new ?? false,
      by: a.by ?? a.agent,
      created_ms: now - a.ago,
      ...(a.path === undefined ? {} : { path: a.path, target: a.path }),
      ...(a.folder === undefined ? {} : { folder: a.folder }),
      ...(a.turn === undefined ? {} : { turn: a.turn }),
    })),
  };
}

/**
 * Where the artifacts' files and pages are. Real (the spec's `files/` folder and its page server):
 * each card shows its picture, made by the app as for him (designer m_40850: the previews are the
 * look). Without it, paths that don't exist: every card keeps its kind's icon.
 */
export interface Real {
  /** the absolute path of tests/checks/artifacts/files */
  readonly dir: string;
  /** the page server's base, 'http://127.0.0.1:<port>' (it serves files/pages/<id>.html) */
  readonly pages: string;
}
// the files that exist in files/ (a glb, an mp4, a pptx, a dmg have no Quick Look picture: none)
const REAL_FILES = new Set(['delta-review.md', 'week4.md', 'week3.md', 'dpe.md', 'bourso.md', 'limits.md', 'projection.xlsx', 'offre.pdf']);
interface Where {
  file: (name: string) => string;
  page: (id: string) => string;
  png: (id: string, title: string, agent: string, folder: string | undefined, ago: number, extra?: Partial<Art>) => Art;
}
function whereOf(real: Real | undefined): Where {
  const file = (name: string) => (real !== undefined && REAL_FILES.has(name) ? `${real.dir}/${name}` : `/nowhere/${name}`);
  const page = (id: string) => (real === undefined ? `http://127.0.0.1:1/p/${id}` : `${real.pages}/${id}.html`);
  const png = (id: string, title: string, agent: string, folder: string | undefined, ago: number, extra: Partial<Art> = {}): Art =>
    ({ id, kind: 'file', title, agent, ago, path: real === undefined ? `/nowhere/shots/${id}.png` : `${real.dir}/${id}.png`, ...(folder === undefined ? {} : { folder }), ...extra });
  return { file, page, png };
}

/** The harness project's: the desktop app's tasks, a stack of 8 shots in one turn, bims, unfiled. */
function harness(now: number, { file, page, png }: Where): Art[] {
  const turn = now - 4 * 60 * MIN;
  const stack = ['dark · 1400 · perf', 'dark · 1400 · search', 'dark · 800 · perf', 'dark · 800 · search', 'light · 1400 · perf', 'light · 1400 · search', 'light · 800 · perf', 'light · 800 · search']
    .map((t, i) => png(`step2-${String(i)}`, `agent view step 2 · ${t}`, 'amb-home', 'f-agentview', 4 * 60 * MIN - i * 1000, { turn, new: true }));
  return [
    ...stack,
    png('fixes', 'agent view fixes', 'amb-home', 'f-agentview', 6 * 60 * MIN),
    png('head-sheet', 'agent view head sheet', 'amb-home', 'f-agentview', 8 * 60 * MIN),
    { id: 'target', kind: 'page', title: 'agent-target shots', agent: 'agent-target', folder: 'f-agentview', ago: 9 * 60 * MIN, url: page('agent-target') },
    png('folds-dark', 'open folds, dark', 'amb-win', 'f-agentview', 11 * DAY),
    png('folds-light', 'open folds, light', 'amb-win', 'f-agentview', 11 * DAY + MIN),
    { id: 'delta', kind: 'file', title: 'ambient-app delta review', agent: 'architect', folder: 'f-agentview', ago: 11 * DAY + 2 * MIN, path: file('delta-review.md') },
    { id: 'hero-shots', kind: 'page', title: 'ds-hero part 2: page hero shots', agent: 'ds-hero', folder: 'f-heroes000', ago: 80 * MIN, url: page('hero-shots'), new: true },
    png('hero-a', 'page hero, artifacts', 'ds-hero', 'f-heroes000', 3 * 60 * MIN),
    png('inbox-a', 'inbox step 1', 'amb-inbox', 'f-inbox0000', 2 * DAY),
    png('inbox-b', 'inbox, narrow', 'amb-inbox', 'f-inbox0000', 2 * DAY + MIN),
    { id: 'office-3d', kind: 'file', title: 'the office objects in 3D', agent: 'bims-objects', folder: 'f-plugins00', ago: 3 * 60 * MIN, path: file('office.glb') },
    png('side-a', 'sidebar rows', 'amb-side', 'f-sidebar00', 3 * DAY),
    png('welcome-fix', 'welcome-fix shots', 'amb-wel', 'f-welcome00', 7 * 60 * MIN),
    { id: 'poof', kind: 'file', title: 'bim poof variants', agent: 'bims', folder: 'f-poof00000', ago: 70 * MIN, path: file('poof.mp4'), new: true },
    { id: 'town', kind: 'page', title: 'town light: noon and dark', agent: 'hero-town', folder: 'f-bims00000', ago: 4 * DAY, url: page('town') },
    { id: 'pop', kind: 'file', title: 'bim pop, dark', agent: 'bim-pop', folder: 'f-bims00000', ago: 5 * DAY, path: file('pop.mp4') },
    { id: 'post', kind: 'page', title: 'launch post', agent: 'marketing', folder: 'f-launch000', ago: 3 * DAY, url: page('launch-post') },
    { id: 'pitch', kind: 'file', title: 'bise pitch investisseurs', agent: 'marketing', folder: 'f-launch000', ago: 5 * DAY, path: file('pitch.pptx') },
    { id: 'week4', kind: 'file', title: 'semaine 4: ce que main a fait seul', agent: 'team-lead', folder: 'f-reports00', ago: 2 * 60 * MIN, path: file('week4.md') },
    { id: 'week3', kind: 'file', title: 'semaine 3: trois choses à changer', agent: 'team-lead', folder: 'f-reports00', ago: 7 * DAY, path: file('week3.md') },
    // unfiled: his own adds, and from before folders
    { id: 'dmg', kind: 'file', title: 'bise desktop DMG 2026.10.2-35', agent: 'dmg-benjamin', ago: 8 * DAY, path: file('bise.dmg') },
    png('cart', 'cart before / after', 'you', undefined, 7 * DAY, { by: 'you' }),
  ];
}

/** The world: dark or light, every project, its agents and artifacts (empty: a first run). */
export function libraryWorld(theme: 'light' | 'dark', now: number, empty = false, real?: Real) {
  const where = whereOf(real);
  const { file, page } = where;
  // with real files, the harness project's folder is files/: main reads a card's file only in his
  // home (the run's throwaway one) or a project's folder (reveal.ts realLookable)
  const folderOf = (name: string) => (real !== undefined && name === 'harness' ? real.dir : `/nowhere/${name}`);
  const project = (id: string, name: string, order: number, home = false) => ({ project: id, name, path: folderOf(name), git: !home, home, order, agents: 1, working: 0, waits: 0, running: true });
  const agent = (name: string) => ({ name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: `${name}'s job`, since_ms: now - 14 * MIN, waits: 0, watching: [] });
  const projects = [project(HOME, 'bise', 0, true), project(P.harness, 'harness', 1), project(P.ai, 'ai-docs', 2), project(P.paint, 'paint-canvas', 3), project(P.ts, 'ts-pattern', 4), project(P.form, 'app-form', 5)];
  const all = empty ? [] : [
    artifacts(P.harness, now, harness(now, where)),
    artifacts(P.ai, now, [
      { id: 'dpe', kind: 'file', title: 'DPE 36 rue de Montreuil', agent: 'appart-web', folder: 'f-rue000000', ago: 2 * DAY, path: file('dpe.md') },
      { id: 'bourso', kind: 'file', title: 'Message BoursoBank : corrections', agent: 'appart-web', folder: 'f-rue000000', ago: 2 * DAY + MIN, path: file('bourso.md') },
      { id: 'projection', kind: 'file', title: 'projection achat ou location', agent: 'epargne-offre', folder: 'f-epargne00', ago: 2 * DAY + 2 * MIN, path: file('projection.xlsx'), new: true },
      { id: 'budget', kind: 'page', title: 'budget famille (app)', agent: 'epargne-offre', folder: 'f-epargne00', ago: 4 * DAY, url: page('budget') },
      { id: 'drive', kind: 'link', title: 'Dossier Drive 36 rue de Montreuil/Offre', agent: 'epargne-offre', ago: 6 * DAY, url: 'https://drive.google.com/drive/folders/1' },
    ]),
    artifacts(P.paint, now, [
      { id: 'appart-3d', kind: 'file', title: 'modèle 3D (glb)', agent: 'appart-3d', folder: 'f-rue000000', ago: 4 * DAY, path: file('appart.glb') },
      { id: 'offre', kind: 'file', title: "Offre d'achat signée", agent: 'you', by: 'you', ago: 2 * DAY + 3 * MIN, path: file('offre.pdf') },
    ]),
    artifacts(P.ts, now, [{ id: 'pr-384', kind: 'pr', title: 'Pattern<…> in type errors', agent: 'ts-fix', folder: 'f-launch000', ago: 2 * DAY, url: 'https://github.com/gvergnaud/ts-pattern/pull/384' }]),
    artifacts(HOME, now, [{ id: 'limits', kind: 'file', title: 'limits harness 10-22', agent: 'main', folder: 'f-reports00', ago: 2 * DAY, path: file('limits.md') }]),
    artifacts(P.form, now, []),
  ];
  return [
    { ev: 'prefs', prefs: { onboarded: true, theme } },
    { ev: 'projects', projects },
    ...projects.map((p) => ({ ev: 'welcome', project: p.project, proto: 1, workspace: p.path, name: p.name })),
    ...projects.map((p) => ({ ev: 'agents', project: p.project, agents: [agent('main')] })),
    ...all,
  ];
}
