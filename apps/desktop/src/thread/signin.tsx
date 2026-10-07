// R15, the expired ChatGPT sign-in in the thread (the TUI's resign.rs, designer m_7456): after ⏎
// on the stopped agent's empty composer (K2, head.ts emptyEnter) the core opens his browser on
// the sign-in (V14, the store's `signing`), and the thread says so above the composer:
// 'waiting for you to sign in to ChatGPT in your browser…   c copy the link   esc cancel'
// ('c copied' for 2 s). c on the empty composer copies the link, esc cancels (AppCmd
// sign_in_cancel). Signed in: the hub closes the item and the agents go on, nothing more here.
// Owner: amb-home.
import { useCallback, useEffect, useState } from 'react';
import { useSigning, useStore } from '@/store';

/** The TUI's waiting words (resign.rs WAITING). */
export const WAITING = 'waiting for you to sign in to ChatGPT in your browser…';

/** How long 'c copied' shows (resign.rs COPIED_FOR). */
export const COPIED_MS = 2000;

/** The line's keys: 'c copy the link   esc cancel', or 'c copied' just after a copy. Pure. */
export function signInKeys(copied: boolean): string {
  return copied ? 'c copied   esc cancel' : 'c copy the link   esc cancel';
}

/** The sign-in under way for this thread (its agent waits on the item), its copy and cancel. */
export function useThreadSignIn(waits: boolean): {
  readonly on: boolean;
  readonly copied: boolean;
  readonly copy: () => void;
  readonly cancel: () => void;
} {
  const store = useStore();
  const signing = useSigning();
  const [copiedAt, setCopiedAt] = useState<number | null>(null);
  const on = waits && signing !== null;
  useEffect(() => {
    if (copiedAt === null) return;
    const t = setTimeout(() => {
      setCopiedAt(null);
    }, COPIED_MS);
    return () => {
      clearTimeout(t);
    };
  }, [copiedAt]);
  const copy = useCallback(() => {
    if (signing === null) return;
    void (window as Partial<Window>).bise?.copy(signing.url);
    setCopiedAt(Date.now());
  }, [signing]);
  const cancel = useCallback(() => {
    if (signing !== null) store.command({ cmd: 'sign_in_cancel', id: signing.id });
  }, [signing, store]);
  return { on, copied: copiedAt !== null, copy, cancel };
}

/** The line above the composer while he signs in. */
export function SignInLine({ copied }: { copied: boolean }) {
  return (
    <div className="th-signin" data-testid="thread.signin" aria-live="polite">
      <span>{WAITING}</span>
      <span className="th-signin-keys" data-testid="thread.signin.keys">
        {signInKeys(copied)}
      </span>
    </div>
  );
}
