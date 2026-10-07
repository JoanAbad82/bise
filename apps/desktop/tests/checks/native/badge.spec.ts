// native/badge · bar W33/N10 (amb-mac 4ded46e1): with the window in the back he sees what waits, as
// the TUI's tab title did. Passes when the Dock's badge is the number of open cards (none at 0) and
// the window's title says it ('bise · 2 waiting'), and both follow the core: a new card counts at
// once, answered ones drop out. The window is never focused in a test run, so it is always 'in the
// back'. Test mode has no Dock icon: main prints the badge as BADGE_LINE on stdout; the title is the
// main window's (BrowserWindow.getTitle, what the window server shows and Mission Control lists).
// The Dock icon itself is the VM pass's.
import { FakeCore, test, expect } from '../../harness';
import type { CoreEv, HubEv } from '../../../src/proto';
import { core_ev, hub_ev } from '../../../src/proto/fixtures.gen';
import { onWorld, type World } from './world';

const BADGE = 'bise-desktop: badge';

type Cards = Extract<HubEv, { ev: 'cards' }>;

/** the fixture world with acme's cards cut to `n` (the projects line says the same) */
function world(n: number): { start: (CoreEv | HubEv)[]; cards: Cards } {
  const cards = hub_ev.find((e): e is Cards => e.ev === 'cards');
  if (!cards) throw new Error('no cards in the fixtures');
  const two: Cards = { ...cards, cards: cards.cards.slice(0, n) };
  const start: (CoreEv | HubEv)[] = [
    ...core_ev.map((e) =>
      e.ev === 'projects' ? { ...e, projects: e.projects.map((p) => (p.project === two.project ? { ...p, cards: two.cards, waits: n } : p)) } : e,
    ),
    ...hub_ev.map((e) => (e.ev === 'cards' ? two : e)),
  ];
  return { start, cards: two };
}

const title = (w: World): Promise<string> =>
  w.s.app.evaluate(({ BrowserWindow }) => {
    const all = BrowserWindow.getAllWindows().filter((b) => !b.webContents.getURL().includes('surface=capsule'));
    return all[0]?.getTitle() ?? '';
  });

const badge = (w: World): string => {
  const all = w.out.of(BADGE);
  const last = all[all.length - 1];
  return last === undefined ? '(none said)' : (JSON.parse(last) as string);
};

test('native/badge: the Dock badge and the window title count what waits, and follow the core', async () => {
  const { start, cards } = world(2);
  await onWorld(async (w) => {
    // the start world's badge line goes out before the check reads main's stdout: the title says
    // the start, the badge is read on each change after
    await expect.poll(() => title(w), { message: "the title says '2 waiting'", timeout: 3000 }).toMatch(/^bise · 2 waiting/);
    const first = cards.cards[0];
    if (!first) throw new Error('no card');
    await w.core.send({ ...cards, cards: [...cards.cards, { ...first, id: 97, question: 'merge it?' }] });
    await expect.poll(() => badge(w), { message: 'a new card counts at once', timeout: 2000 }).toBe('3');
    await expect.poll(() => title(w), { timeout: 2000 }).toMatch(/^bise · 3 waiting/);
    await w.core.send({ ...cards, cards: [] });
    await expect.poll(() => badge(w), { message: 'none open: no badge', timeout: 2000 }).toBe('');
    await expect.poll(() => title(w), { message: "none open: the title is 'bise' (and what works)", timeout: 2000 }).toMatch(/^bise( · \d+ working)?$/);
  }, { core: new FakeCore(start) });
});
