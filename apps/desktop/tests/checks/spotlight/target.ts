// The spotlight's targets, in one place (qa-type).
// S: the new app's spotlight, mounted alone on fake data by amb-web's lab (test mode,
// launchDesktop({ route: 'lab/spotlight' })). Every spotlight check was red first on the old Swift
// app's capsule, where his bugs 6 and 7 live (set 1, d38f2df9); that target went with the old apps
// (delete plan step 2).
import { launchDesktop, type Session } from '../../harness';

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

export async function onScene(launch: () => Promise<Session>, body: (s: Session) => Promise<void>): Promise<void> {
  const s = await launch();
  try {
    await s.page.waitForLoadState('load');
    await body(s);
  } finally {
    await s.close();
  }
}
