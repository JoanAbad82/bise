// The composer's targets, in one place (qa-type).
// T: the new app's composer, mounted alone on fake data by amb-web's lab (test mode,
// '#route=lab/composer', amb-win d4ab66dd); its sends show in the lab's visible log (lab.sent.<n>),
// the effect a check reads. Every composer check was red first on the old Swift app's window (sets
// 1 and 2, d38f2df9 and 0f13bb20); that target went with the old apps (delete plan step 2).
import path from 'node:path';
import { launchDesktop, type Session } from '../../harness';

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
  /** the composer's one-line note in the strip ('no undo: …') */
  note: '[data-testid="composer.note"]',
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
  /** the key bar under the field, and the lab's switches for K4 and W9 (asked of amb-web m_10035) */
  keys: '[data-testid="composer.keys"]',
  vision: '[data-testid="lab.vision"]',
  voiceMode: '[data-testid="lab.voice"]',
  /** the mic in the key line (data-state off|recording|transcribing), its meter, the lab's 'mic busy' box */
  mic: '[data-testid="composer.mic"]',
  meter: '[data-testid="composer.meter"]',
  micBusy: '[data-testid="lab.micBusy"]',
  /** what the lab's fake mic says (Lab.tsx LAB_SAID), a word every 250 ms */
  labSaid: "on garde la file d'attente",
  /** a skill of the world (the lab's fake list) */
  skill: { query: 'plain', name: 'plain-language' },
  /** amb-mac's private clipboard (2aa0294d): ⌘C/⌘X/⌘V never reach his pasteboard */
  clipboardFenced: true,
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

/** The caret's offset in the field's text and the selected text (a textarea or a contenteditable). */
export const caretOf = (f: Element): { caret: number; selected: string } => {
  if (f instanceof HTMLTextAreaElement) return { caret: f.selectionEnd, selected: f.value.slice(f.selectionStart, f.selectionEnd) };
  const s = window.getSelection();
  if (!s || !s.rangeCount) return { caret: -1, selected: '' };
  const r = s.getRangeAt(0).cloneRange();
  r.selectNodeContents(f);
  r.setEnd(s.getRangeAt(0).endContainer, s.getRangeAt(0).endOffset);
  return { caret: r.toString().length, selected: s.toString() };
};

/** What the lab's log says left, one text per send. */
export const sentTexts = async (page: import('@playwright/test').Page): Promise<string[]> =>
  (await page.locator(T.sent).allInnerTexts()).map((t) => {
    try { return (JSON.parse(t) as { text?: string }).text ?? t; } catch { return t; }
  });

/**
 * A key at a person's pace: the browser reports a caret move (selectionchange) a task later, so a
 * key pressed the same millisecond would act on the old caret; no hand is that fast.
 */
export async function press(page: import('@playwright/test').Page, key: string, settleMs = 40): Promise<void> {
  await page.keyboard.press(key);
  await page.waitForTimeout(settleMs);
}
