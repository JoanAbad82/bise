// The spacing law's ratchet (designer's page desktop-spacing, m_19568; ambient-lead m_19569): the
// lengths each stylesheet wrote by hand when the law came in (lint.ts looseSpacing; 811 in all).
// lint.test.ts fails only when a file's count goes up, so no land goes red for today's CSS; each
// screen's migration (after the a43609b2 cut, by its owner, with designer's shots) lowers its own
// line here in the same commit, and a file at 0 leaves the list.

/** hand-written spacing lengths per stylesheet (path under src/) */
export const PENDING_SPACING: Readonly<Record<string, number>> = {
  'agents/agents.css': 41,
  'app/palette.css': 32,
  'artifacts/artifacts.css': 42,
  'capsule/capsule.css': 11,
  'ds/css/board.css': 14,
  'ds/css/capsule.css': 15,
  'ds/css/cards.css': 7,
  'ds/css/controls.css': 19,
  'ds/css/live.css': 2,
  'ds/css/md.css': 1,
  'ds/css/menus.css': 6,
  'ds/css/onboarding.css': 7,
  'ds/css/prim.css': 29,
  'ds/css/settings.css': 13,
  'ds/css/sideviews.css': 5,
  'ds/css/spotlight.css': 13,
  'ds/css/toasts.css': 6,
  'ds/gallery/gallery.css': 11,
  'help/help.css': 1,
  'log/log.css': 33,
  'quote/quote.css': 2,
  'review/review.css': 17,
  'scheduled/scheduled.css': 42,
  'setup/setup.css': 5,
  'spotlight/spotlight.css': 27,
  'terminal/terminal.css': 7,
  'thread/thread.css': 158,
  'voicemode/voicemode.css': 21,
};
