// A newer bise, in his words (update-dot, Gabriel m_46040, architect m_46059): every hub opens its
// own update card for the release; the window lists ONE, bise's own, with its changelog; his '1'
// answers that one hub only. Typed inputs in, what the inbox shows and the commands sent out.
import { describe, expect, it } from 'vitest';
import { card, pick, projects, row } from './inputs';
import { feature } from './run';

const BISE = 'bise-home-00000000';
const ACME = 'acme-1a2b3c4d';
const WEB = 'web-5e6f7a8b';
const release = { version: 'v2026.10.3', running: 'v2026.10.2', notes: '## Fixes\n- the inbox keeps your place' };
const update = (project: string, id: number) =>
  card({
    project,
    id,
    kind: 'update',
    agent: 'main',
    place: 'release:7e187ba',
    question: 'bise v2026.10.3 is ready',
    options: [
      { n: 1, label: 'update now · your agents keep running', mine: false },
      { n: 2, label: 'later', mine: false },
    ],
    approval: true,
    release,
    link: 'https://github.com/gvergnaud/bise/releases/tag/v2026.10.3',
  });
const which = card({ project: ACME, id: 9, agent: 'perf', question: 'which bench?' });
const ids = (cards: readonly { project: string; id: number }[]): string[] => cards.map((c) => `${c.project}-${String(c.id)}`);

describe('a newer bise, in his words', () => {
  it("every hub's card of the release lists as one, bise's own, with its changelog; other cards stay", () => {
    const w = feature().given(
      projects(row({ project: ACME, name: 'acme', cards: [update(ACME, 4), which] }), row({ project: BISE, name: 'bise', home: true, cards: [update(BISE, 12)] }), row({ project: WEB, name: 'web', cards: [update(WEB, 3)] })),
    );
    const list = w.view.inbox();
    expect(ids(list).sort()).toEqual([`${ACME}-9`, `${BISE}-12`].sort());
    expect(list.find((c) => c.kind === 'update')?.release).toEqual(release);
  });

  it("his '1' answers the one hub whose card he picked, never every hub", () => {
    const w = feature().given(projects(row({ project: ACME, name: 'acme', cards: [update(ACME, 4)] }), row({ project: WEB, name: 'web', cards: [update(WEB, 3)] })));
    expect(ids(w.view.inbox())).toEqual([`${ACME}-4`]);
    w.does(pick(ACME, 4, 1));
    const answers = w.sent().filter((c) => c.cmd === 'answer');
    expect(answers).toEqual([{ cmd: 'answer', project: ACME, card: 4, reply: '1' }]);
  });
});
