// src/composer/float · FloatHost: the floating composer on a page that is no thread (page
// native-mac §6: at rest 560 × 44, focused 640 × 88, open 640 × 560, 24 from the bottom, centred
// on the content; every page keeps --float-room free at its bottom). Mounted at the shell's root
// by App.tsx, position fixed, outside .app-main and .app-screen, so nothing clips its shadow (plan
// §2; ds/noclip.ts checks it). Empty until nm-composer fills it. Owner: nm-composer.

/** The floating composer over the page's bottom. */
export function FloatHost() {
  // STUB(native-mac): nm-composer
  return null;
}
