// bims/tags · the office's tags never pile up (bims m_31439, m_31446; main m_31447, m_31449): a
// crowded loft, 12 and 20 bims, half at work and half idle, then the halves swap, so most of the
// office walks across at once with its names over its heads, some with a '?' or '✗' pill. Off
// screen, on FakeCore rows, at the 320 bar and wide, light and dark. Passes when, every few
// hundred ms through the walk, no two shown tags (names, lines, pills) overlap and none leaves the
// office. Shots for bims (.harness-cache/bims-shots): the crowd mid-walk. Owner: town-signs.
import { test, expect } from '../../harness';
import { agent, card, mainAgent, snap } from '../../../src/bims/fixtures';
import { P, cardsOf, open, rowsOf, settle, shotOf, showOffice, sleep, writeIndex, type Shot } from './world';
import type { Session } from '../../harness';

const shots: Shot[] = [];
test.describe.configure({ timeout: 180_000 });
test.afterAll(() => {
  if (shots.length > 0) writeIndex(shots);
});

const NAMES = ['ada', 'bob', 'cy', 'dee', 'eli', 'fay', 'gus', 'hal', 'ivy', 'jo', 'kit', 'lou', 'max', 'ned', 'oli', 'pat', 'quin', 'rex', 'sam', 'tom'];

/** n bims: the first half at work (`flip`: the second), every 4th with a question, every 7th failed */
function crowd(n: number, flip: boolean) {
  const names = NAMES.slice(0, n);
  const half = new Set(names.slice(0, Math.ceil(n / 2)));
  const agents = [mainAgent({ status: 'working' }), ...names.map((m, i) => agent(m, { status: half.has(m) !== flip ? 'working' : i % 7 === 3 ? 'failed' : 'idle' }))];
  const cards = names.filter((_, i) => i % 4 === 1).map((m, i) => card(200 + i, m, { project: P }));
  return snap(agents, cards);
}

/** the shown tags now that meet another, or leave the office: one line each */
const tagFaults = (s: Session, where: string): Promise<string[]> =>
  s.page.evaluate((at) => {
    const office = document.querySelector('[data-testid="app.right.bims"]')?.getBoundingClientRect();
    const shown = (e: HTMLElement): boolean => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && e.checkVisibility({ opacityProperty: true, visibilityProperty: true }) && Number(getComputedStyle(e).opacity) > 0.05;
    };
    const marks = Array.from(document.querySelectorAll<HTMLElement>('[data-testid^="app.right.bims.label."], [data-testid^="app.right.bims.pill."]'))
      .filter(shown)
      .map((e) => ({ e, id: (e.getAttribute('data-testid') ?? '').slice('app.right.bims.'.length), r: e.getBoundingClientRect() }));
    const out: string[] = [];
    const meet = (a: DOMRect, b: DOMRect): boolean => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
    for (const m of marks) {
      if (office !== undefined && (m.r.left < office.left - 0.5 || m.r.right > office.right + 0.5 || m.r.top < office.top - 0.5 || m.r.bottom > office.bottom + 0.5)) out.push(`${at}: ${m.id} out of the office`);
    }
    marks.forEach((a, i) => {
      for (const b of marks.slice(i + 1)) {
        // a card holds its own parts: never two marks
        if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
        if (meet(a.r, b.r)) out.push(`${at}: ${a.id} over ${b.id}`);
      }
    });
    return out;
  }, where);

const SIZES = [
  { tag: '320', win: 1400, wide: false },
  { tag: 'wide', win: 1600, wide: true },
] as const;

for (const n of [12, 20]) {
  for (const theme of ['light', 'dark'] as const) {
    for (const { tag, win, wide } of SIZES) {
      test(`(tags) ${String(n)} bims walking, ${tag}, ${theme}: no tag over another`, async () => {
        const { s, core } = await open(crowd(n, false), { theme, width: win });
        try {
          await showOffice(s);
          if (wide) await s.page.getByTestId('app.right.agents.width.wide').click();
          await core.send(cardsOf(crowd(n, false)) as never);
          await settle(s, 1200, 15_000);
          const faults = await tagFaults(s, 'still');
          // the halves swap twice: the office walks across, names over the walkers' heads
          let most = 0;
          for (const flip of [true, false]) {
            await core.send(rowsOf(crowd(n, flip)) as never);
            for (let k = 0; k < 20; k++) {
              await sleep(300);
              faults.push(...(await tagFaults(s, `${flip ? 'swap' : 'back'} +${String((k + 1) * 300)} ms`)));
              const shown = await s.page.evaluate(() => document.querySelectorAll('[data-testid^="app.right.bims.label."]').length);
              if (flip && k === 6) {
                await shotOf(s.cdp, s.page, (await s.page.getByTestId('app.right.bims').boundingBox()) ?? { x: 0, y: 0, width: 1, height: 1 }, `tags-${String(n)}-${tag}-${theme}.png`);
                shots.push({ file: `tags-${String(n)}-${tag}-${theme}.png`, title: `office tags, ${String(n)} bims walking, ${tag}, ${theme}`, says: "no name, line or pill over another: a walker's name yields first, a '?' / '✗' never moves" });
              }
              most = Math.max(most, shown);
            }
          }
          console.log(`tags ${String(n)} ${tag} ${theme}: up to ${String(most)} labels shown, ${String(faults.length)} faults`);
          expect(faults.slice(0, 30), 'no tag over another, none out of the office').toEqual([]);
        } finally {
          await s.close();
        }
      });
    }
  }
}
