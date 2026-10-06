// The spotlight's targets, in one place (qa-type).
// S: the new app's spotlight, mounted alone on fake data by amb-web's lab (test mode,
// launchDesktop({ route: 'lab/spotlight' })). SO: today's capsule (apps/ambient/web on fakecore.js)
// in a scene page next to this file, where his bugs 6 and 7 live: every spotlight check was red
// there first (set 1, d38f2df9), and SO replays it.
import path from 'node:path';
import { launchDesktop, launchPage, type Session } from '../../harness';

const scene = (name: string) => (): Promise<Session> => launchPage(path.join(__dirname, `old-${name}.html`), { size: '1200x800' });

export type SpotTarget = {
  /** opens the spotlight with its rows listed */
  launchFind: () => Promise<Session>;
  /** opens the spotlight; whatever is asked gets a 20-line answer */
  launchLong: () => Promise<Session>;
  /** the scene page's own typing is over (today's capsule types 'perf' at 0.7 s) */
  settleMs: number;
  field: string;
  /** the field's line: none of its nodes may be replaced while he types */
  head: string;
  list: string;
  row: string;
  /** where the answer is drawn (the whole spotlight: it may grow, or open a panel) */
  answer: string;
  answerText: string;
};

export const S: SpotTarget = {
  launchFind: () => launchDesktop({ route: 'lab/spotlight' }),
  launchLong: () => launchDesktop({ route: 'lab/spotlight' }),
  settleMs: 0,
  field: '[data-testid="spot.input"]',
  head: '[data-testid="spot.frame"] :has(> [data-testid="spot.input"])',
  list: '[data-testid="spot"]',
  row: '[data-testid^="spot.row."]',
  answer: '[data-testid="spot"]',
  answerText: 'line 20 of 20',
};

export const SO: SpotTarget = {
  launchFind: scene('find-type'),
  launchLong: scene('long-answer'),
  settleMs: 1200,
  field: '#amb input.qin',
  head: '#amb .gin .head',
  list: '#amb .gin .body',
  row: '#amb .gin .body .row',
  answer: '#amb .glass',
  answerText: 'line 20 of 20',
};

export async function onScene(launch: () => Promise<Session>, body: (s: Session) => Promise<void>): Promise<void> {
  const s = await launch();
  try {
    await s.page.waitForLoadState('load');
    await body(s);
  } finally {
    await s.close();
  }
}
