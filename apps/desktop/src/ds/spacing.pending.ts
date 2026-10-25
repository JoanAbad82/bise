// The spacing law's ratchet (designer's page desktop-spacing, m_19568; ambient-lead m_19569): the
// lengths each stylesheet wrote by hand when the law came in (lint.ts looseSpacing; 811 in all).
// lint.test.ts fails only when a file's count goes up, so no land goes red for today's CSS; each
// screen's migration (after the a43609b2 cut, by its owner, with designer's shots) lowers its own
// line here in the same commit, and a file at 0 leaves the list.

/** hand-written spacing lengths per stylesheet (path under src/) */
export const PENDING_SPACING: Readonly<Record<string, number>> = {
};

// bise fait mac (page native-mac §1 and §6, plan native-mac-plan v4): three more ratchets, the same
// rule (a count only goes down; the screen's owner lowers its line in the commit that moves it, and
// a file at 0 leaves the list). What each stylesheet had when nm-ds landed:

/** cursor:pointer on something not a link (lint.ts handRules): macOS draws the arrow on a control */
export const PENDING_HAND: Readonly<Record<string, number>> = {
  "agents/agents.css": 2,
  "app/app.css": 1,
  "bims/office.css": 10,
  "capsule/capsule.css": 1,
  "composer/composer.css": 1,
  "ds/css/thread.css": 4,
  "log/log.css": 3,
  "plugins/plugins.css": 2,
  "quote/quote.css": 1,
  "review/review.css": 2,
  "setup/setup.css": 1,
  "terminal/terminal.css": 2,
  "thread/thread.css": 19,
};

/** text sizes off the 7 of native-mac §6 (lint.ts offScaleText): 30, 15, 14, 13, 12, 11.5 kbd, 12 mono */
export const PENDING_TYPE: Readonly<Record<string, number>> = {
  "app/app.css": 1,
  "artifacts/thumbs/thumbs.css": 1,
  "bims/office.css": 1,
  "capsule/capsule.css": 2,
  "ds/css/capsule.css": 1,
  "ds/css/controls.css": 1,
  "ds/css/onboarding.css": 2,
  "ds/css/pagehero.css": 2,
  "ds/css/settings.css": 1,
  "ds/css/spotlight.css": 1,
  "ds/css/window.css": 1,
  "inbox/inbox.css": 1,
  "log/log.css": 1,
  "plugins/plugins.css": 2,
  "thread/thread.css": 1,
  "welcome/welcome.css": 1,
};

/** scrollbars a stylesheet draws itself (lint.ts drawnScrollbars): macOS's overlay ones go classic */
export const PENDING_SCROLLBAR: Readonly<Record<string, number>> = {
  "capsule/capsule.css": 8,
  "spotlight/spotlight.css": 4,
  "thread/thread.css": 2,
};
