// A modifier held alone shows its keys where they act (his ask, main m_21494; designer m_21507,
// m_21510): ⌥ held numbers the right bar's agents ⌥1-9, ⌘ held numbers the left bar's places
// (bise ⌘0, the projects ⌘1-9 in keys.ts's order) and puts ⌘[ ⌘] beside ‹ ›, ⌘I on the inbox's
// head. ONE delay for both, so a quick ⌘K or ⌥1 never flashes them; release, any other key or the
// window losing focus hides them all at once, no fade. Owner: amb-win.
import { useEffect, useState } from 'react';

/** How long the modifier is held alone before its keys show: the terminal app's delay for its ctrl
 *  hints (rust/tui/src/ctrlhint.rs:43, DELAY 150 ms; his ask main m_22199), one for ⌘, ⌥ and ctrl. */
export const HINT_HOLD_MS = 150;

export type Mod = 'Alt' | 'Meta';

/** What a key event does to the hint of `mod`: arm its timer, hide it, or nothing. Pure. */
export function heldStep(mod: Mod, e: { type: string; key: string; altKey: boolean; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean }): 'arm' | 'hide' | 'none' {
  if (e.type === 'keyup') return e.key === mod ? 'hide' : 'none';
  if (e.key !== mod) return 'hide';
  const alone = mod === 'Alt' ? !e.metaKey && !e.ctrlKey && !e.shiftKey : !e.altKey && !e.ctrlKey && !e.shiftKey;
  return alone ? 'arm' : 'hide';
}

/** True while `mod` has been held alone for HINT_HOLD_MS. */
export function useModHeld(mod: Mod, ms: number = HINT_HOLD_MS): boolean {
  const [held, setHeld] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const hide = () => {
      clearTimeout(timer);
      timer = undefined;
      setHeld(false);
    };
    const onKey = (e: KeyboardEvent) => {
      const step = heldStep(mod, e);
      if (step === 'hide') hide();
      else if (step === 'arm' && timer === undefined && !e.repeat) {
        timer = setTimeout(() => {
          setHeld(true);
        }, ms);
      }
    };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', onKey, true);
    window.addEventListener('blur', hide);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('keyup', onKey, true);
      window.removeEventListener('blur', hide);
    };
  }, [mod, ms]);
  return held;
}
