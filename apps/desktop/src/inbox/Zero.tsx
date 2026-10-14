// Inbox zero (designer's desktop-delight m_24404, TOUCH 3): his answer to the last waiting item folds
// the block, and ':* nothing waits for you' (':*' accent mono, the words text-2) stands in its place
// for 2 s, then fades. Reduced motion: shown, no fade. Only his own answer or close brings it (the
// store's acted set grew as the list emptied): a list that empties without him, or a block mounted
// on an empty list, stays quiet. It takes the block's box (inbox-strip: the thread's column) without
// its look, so ':*' sits on the content edge, where the rows' text and the composer's label start
// (designer m_24516). Owner: inbox-screen (in amb-home's block).
import { useEffect, useState } from 'react';

/** How long the line stays before it fades, and the fade. */
export const ZERO_MS = 2000;
export const ZERO_FADE_MS = 400;

/**
 * Whether this change of the list is his inbox zero: items were waiting, none is now, and he acted
 * (an answer or a close) since the last look. Pure.
 */
export function reachedZero(before: { count: number; acted: number }, now: { count: number; acted: number }): boolean {
  return before.count > 0 && now.count === 0 && now.acted > before.acted;
}

/** True for the 2 s (+ the fade) after he reached inbox zero. */
export function useInboxZero(count: number, acted: number): boolean {
  // the last look, kept in state and compared while rendering (React's 'a value from the last render')
  const [last, setLast] = useState({ count, acted });
  // each inbox zero is a new token; `done` is the last one whose time is up
  const [token, setToken] = useState(0);
  const [done, setDone] = useState(0);
  if (last.count !== count || last.acted !== acted) {
    setLast({ count, acted });
    if (reachedZero(last, { count, acted })) setToken((t) => t + 1);
  }
  useEffect(() => {
    if (token === 0) return;
    const t = setTimeout(() => {
      setDone(token);
    }, ZERO_MS + ZERO_FADE_MS);
    return () => {
      clearTimeout(t);
    };
  }, [token]);
  return count === 0 && token !== 0 && token !== done;
}

/** The line in the block's place. */
export function InboxZero() {
  return (
    <div className="inbox-strip inbox-zero" role="status" data-testid="inbox.zero">
      <span className="inbox-zero-mark" aria-hidden="true">:*</span>
      <span className="inbox-zero-words">nothing waits for you</span>
    </div>
  );
}
