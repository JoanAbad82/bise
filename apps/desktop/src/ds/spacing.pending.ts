// The spacing law's ratchet (designer's page desktop-spacing, m_19568; ambient-lead m_19569): the
// lengths each stylesheet wrote by hand when the law came in (lint.ts looseSpacing; 811 in all).
// lint.test.ts fails only when a file's count goes up, so no land goes red for today's CSS; each
// screen's migration (after the a43609b2 cut, by its owner, with designer's shots) lowers its own
// line here in the same commit, and a file at 0 leaves the list.

/** hand-written spacing lengths per stylesheet (path under src/) */
export const PENDING_SPACING: Readonly<Record<string, number>> = {
  'ds/css/board.css': 14,
  'ds/css/live.css': 2,
  'ds/css/md.css': 1,
  'ds/css/sideviews.css': 5,
  'ds/gallery/gallery.css': 11,
  'help/help.css': 1,
  'quote/quote.css': 2,
  'terminal/terminal.css': 7,
  'thread/thread.css': 158,
  'voicemode/voicemode.css': 21,
};
