// What lint.test.ts found when the ds laws came in (designer m_18343): the work left in
// raw-controls.md section 2 (amb-win: app/, thread/, spotlight/, palette; amb-home: settings/,
// setup/, inbox/, the add sheet). It may only shrink: lower a count, drop a class, as each lands.

/** bare controls per file (path under src/) */
export const PENDING_RAW: Readonly<Record<string, number>> = {
};

/** classes a .tsx names that no .css has a rule for (some are test hooks: they become data-testid) */
export const PENDING_CLASSES: readonly string[] = [
  'ag-model-group',
  'ag-model-label',
  'app-hint',
  'art-day',
  'lab-sent',
  'pearl',
  'pr-branch',
  'pr-dot',
  'q-copy',
  'q-key',
  'th-answered',
  'th-link-off',
  'th-restored',
  'th-tool',
  'th-voice',
  'vm-said',
];

/** text under the floor (--t-11, 11.5 px) per stylesheet (lint.ts smallText; ui-review-app #7):
 *  files their owner is changing now, fixed after it lands. It may only shrink. */
export const PENDING_SMALL_TEXT: Readonly<Record<string, number>> = {
  'bims/office.css': 1,
  'thread/thread.css': 2,
};
