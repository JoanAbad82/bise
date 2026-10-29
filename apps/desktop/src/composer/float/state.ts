// src/composer/float · the floating composer's three states (page native-mac §6, mockups 6-8): at
// rest a 560 × 44 pill; focused 640 wide, its head (─, 'to bise ⌄', the grip) over a 48 field; open
// 640 × 560 (70% of the window's height at most), the mini thread over the field. Pure: what each
// of his gestures does from each state. Owner: nm-composer.

/** Where the floating composer is. */
export type FloatState = 'rest' | 'focus' | 'open';

/** What he did: the field took the focus, an inbox item opened in it (^1-3, ⌘I), esc no list
 *  took, the ─ button, a press outside it, a send, the grip. */
export type FloatEvent = 'focus' | 'item' | 'esc' | 'fold' | 'outside' | 'sent' | 'grip';

/**
 * The state after `ev`. Esc, ─ and a press outside fold it to rest (his draft stays: the composer
 * keeps it); a focus or an opened item brings it to focus; a send opens the mini thread (his words
 * and the reply); the grip opens and closes the mini thread. Pure.
 */
export function floatNext(s: FloatState, ev: FloatEvent): FloatState {
  switch (ev) {
    case 'esc':
    case 'fold':
    case 'outside':
      return 'rest';
    case 'focus':
    case 'item':
      return s === 'rest' ? 'focus' : s;
    case 'sent':
      return 'open';
    case 'grip':
      return s === 'open' ? 'focus' : 'open';
  }
}
