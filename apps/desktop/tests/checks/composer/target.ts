// The composer's target, in one place (qa-type). Today: the old window (apps/ambient/web/window on
// winfake.js), where his bugs 1 and 3 live, so every composer check is red first. When amb-web's
// composer lands, `launch` becomes launchDesktop() and the selectors the new app's data-testids
// (`<area>.<thing>[.<id>]`); the checks themselves don't change.
// Selectors that today's window has no element for are already the new app's test ids: on today's
// window they find nothing, which is the red.
import { launchOld, type Session } from '../../harness';

export const T = {
  launch: (): Promise<Session> => launchOld('window'),
  field: '[data-qa=composer]',
  composer: '.w-composer',
  /** the lists around the composer: none of their nodes may be replaced while he types */
  lists: ['.w-thread', '.w-side'],
  thread: '.w-thread',
  message: '.b-msg, [data-testid^="thread.msg"]',
  messageText: '.b-text, [data-testid^="thread.msg.text"]',
  // amb-web's ids (6187380a): composer.pick, its rows composer.pick.<cmd|file|skill|agent>.<name>,
  // the chips composer.chip.<n> with their kind in data-kind (asked of amb-web)
  picker: '[data-testid="composer.pick"]',
  pickerRow: '[data-testid^="composer.pick."]',
  chipImage: '[data-testid^="composer.chip."][data-kind="image"]',
  chipQuote: '[data-testid^="composer.chip."][data-kind="quote"]',
  chipPaste: '[data-testid^="composer.chip."][data-kind="paste"]',
  /** the voice key while the window is in front: the terminal's ctrl+r (amb-web may pick another) */
  dictateKey: ['Control', 'r'] as const,
};

/** The text in the field, whatever the field is (a textarea today, a Lexical editor tomorrow). */
export const fieldText = (e: Element): string =>
  (e instanceof HTMLTextAreaElement || e instanceof HTMLInputElement ? e.value : (e as HTMLElement).innerText).replace(/\r/g, '');

/** Runs `body` on a fresh launch of the target and always closes it (the close proves the run). */
export async function onTarget(body: (s: Session) => Promise<void>, launch: () => Promise<Session> = T.launch): Promise<void> {
  const s = await launch();
  try {
    await body(s);
  } finally {
    await s.close();
  }
}
