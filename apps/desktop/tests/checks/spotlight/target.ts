// The spotlight's target, in one place (qa-type). Today: the old capsule (apps/ambient/web on
// fakecore.js) in a scene page next to this file, where his bugs 6 and 7 live, so the checks are
// red first. When amb-web's spotlight lands, `launch` opens the new app's spotlight and the
// selectors become its data-testids; the checks don't change.
import path from 'node:path';
import { launchPage, type Session } from '../../harness';

const scene = (name: string) => (): Promise<Session> => launchPage(path.join(__dirname, `old-${name}.html`), { size: '1200x800' });

export const S = {
  /** fn + space, then the fake roster ('perf' already typed by the scene at 0.7 s) */
  launchFind: scene('find-type'),
  /** fn + space; the fake core answers any send with 20 lines */
  launchLong: scene('long-answer'),
  field: '#amb input.qin',
  head: '#amb .gin .head',
  list: '#amb .gin .body',
  row: '#amb .gin .body .row',
  /** where the answer is drawn: the whole glass (the answer may grow it or open a panel) */
  answer: '#amb .glass',
  answerText: 'line 20 of 20',
};

export async function onScene(launch: () => Promise<Session>, body: (s: Session) => Promise<void>): Promise<void> {
  const s = await launch();
  try {
    await s.page.waitForURL(/dev\.html|long-answer/);
    await s.page.waitForLoadState('load');
    await body(s);
  } finally {
    await s.close();
  }
}
