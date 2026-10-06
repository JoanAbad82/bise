// The composer's targets, in one place (qa-type).
// T: the new app's composer, mounted alone on fake data by amb-web's lab (test mode,
// '#route=lab/composer', amb-win d4ab66dd); its sends show in the lab's visible log (lab.sent.<n>),
// the effect a check reads. Every composer check was red first on today's window (sets 1 and 2,
// d38f2df9 and 0f13bb20): TW keeps that target for the checks whose surface the lab lacks (a thread
// to quote from, the core's voice path), and to replay the red.
import path from 'node:path';
import { launchDesktop, launchOld, type Session } from '../../harness';

const FIXTURES = path.join(__dirname, '../fixtures');

const ids = {
  // amb-web's ids (6187380a, 601c9512): composer.pick and its rows composer.pick.<kind>.<name>,
  // the chips composer.chip.<n> with data-kind=image|paste|quote
  picker: '[data-testid="composer.pick"]',
  pickerRow: '[data-testid^="composer.pick."]',
  chipImage: '[data-testid^="composer.chip."][data-kind="image"]',
  chipQuote: '[data-testid^="composer.chip."][data-kind="quote"]',
  chipPaste: '[data-testid^="composer.chip."][data-kind="paste"]',
  /** the rows under the field, one per chip ('▤ 1 “first words…” · 240 lines') */
  strip: '[data-testid="composer.strip"]',
  /** the voice key while the window is in front: the terminal's ctrl+r (amb-web may pick another) */
  dictateKey: ['Control', 'r'] as const,
};

export const T = {
  ...ids,
  /** env: amb-mac's clipboard seeds (BISE_DESKTOP_TEST_CLIPBOARD[_FILE]), never his pasteboard */
  launch: (env: Record<string, string> = {}): Promise<Session> =>
    launchDesktop({ route: 'lab/composer', env: { BISE_DESKTOP_TEST_CLIPBOARD: path.join(FIXTURES, '200-lines.txt'), ...env } }),
  field: '[data-testid="composer.field"]',
  composer: '[data-testid="composer"]',
  /** the lists around the composer: none of their nodes may be replaced while he types */
  lists: ['[data-testid="lab.sent"]'],
  sent: '[data-testid^="lab.sent."]',
  /** the lab's 'a turn runs' box (a running turn: tab queues) and the queued messages */
  busy: '[data-testid="lab.busy"]',
  queued: '[data-testid^="composer.queued."]',
  /** a skill of the world (the lab's fake list) */
  skill: { query: 'plain', name: 'plain-language' },
  /** amb-mac's private clipboard (2aa0294d): ⌘C/⌘X/⌘V never reach his pasteboard */
  clipboardFenced: true,
};

/** today's old window (apps/ambient/web/window on winfake.js) */
export const TW = {
  ...ids,
  launch: (): Promise<Session> => launchOld('window'),
  field: '[data-qa=composer]',
  composer: '.w-composer',
  lists: ['.w-thread', '.w-side'],
  thread: '.w-thread',
  message: '.b-msg, [data-testid^="thread.msg"]',
  messageText: '.b-text, [data-testid^="thread.msg.text"]',
  skill: { query: 'bise-p', name: 'bise-pages' },
  /** no private clipboard: a check refuses ⌘C/⌘X/⌘V here */
  clipboardFenced: false,
};

/** The text in the field, whatever the field is (a textarea today, a Lexical editor tomorrow). */
export const fieldText = (e: Element): string =>
  (e instanceof HTMLTextAreaElement || e instanceof HTMLInputElement ? e.value : (e as HTMLElement).innerText).replace(/\r/g, '');

/** Runs `body` on a fresh launch of the target and always closes it (the close proves the run). */
export async function onTarget(body: (s: Session) => Promise<void>, launch: () => Promise<Session> = () => T.launch()): Promise<void> {
  const s = await launch();
  try {
    await body(s);
  } finally {
    await s.close();
  }
}
