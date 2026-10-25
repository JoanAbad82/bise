// src/composer/talking.ts · 'talking to this project's main' (native-lead m_43215, designer
// m_43214, from Gabriel's ask): the project whose main he is talking to now, for nm-side's world
// camera (it holds the lead framing while set, plus its own 10 s). Set while a composer (the
// thread's or the floating one, both ThreadComposer) has the focus on a project's main, or while
// voice mode is on with a main (the store's voice_mode, read here, never moved). No UI.
// Read: useTalkingTo() in React; talkingNow(store) and subscribeTalking(store, fn) elsewhere.
// Pure: talkingTo. Owner: nm-composer.
import { useSyncExternalStore } from 'react';
import { MAIN } from '@/app/route';
import { useVoiceMode } from '@/store';
import type { Store } from '@/store';
import type { VoiceModeState } from '@/store/types';

/** A composer's addressee. */
export interface TalkAt {
  readonly project: string;
  readonly agent: string;
}

/** The project he talks to the main of: voice mode on with a main first, else the focused
 *  composer's when it writes to a main; null when neither. Pure. */
export function talkingTo(focused: TalkAt | null, voice: VoiceModeState | null): string | null {
  if (voice?.on === true && voice.agent === MAIN) return voice.project;
  if (focused !== null && focused.agent === MAIN) return focused.project;
  return null;
}

// the focused composer's addressee: one at a time (the focus is one element)
let focused: TalkAt | null = null;
const listeners = new Set<() => void>();
const tell = () => {
  for (const fn of listeners) fn();
};

/** A composer took the focus (its addressee) or lost it (null, only when it still holds it). */
export function noteComposerFocus(at: TalkAt | null, from?: TalkAt): void {
  if (at === null && from !== undefined && (focused === null || focused.project !== from.project || focused.agent !== from.agent)) return;
  if (at === focused || (at !== null && focused !== null && at.project === focused.project && at.agent === focused.agent)) return;
  focused = at;
  tell();
}

/** The focused composer's addressee now (tests, non-React readers). */
export const focusedComposer = (): TalkAt | null => focused;

const subscribeFocus = (fn: () => void): (() => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

/** The project whose main he is talking to now, or null (React). */
export function useTalkingTo(): string | null {
  const at = useSyncExternalStore(subscribeFocus, focusedComposer);
  return talkingTo(at, useVoiceMode());
}

/** The same, read once outside React. */
export const talkingNow = (store: Store): string | null => talkingTo(focused, store.voiceModeNow());

/** Calls fn whenever the answer may have changed (a composer's focus, voice mode's state). */
export function subscribeTalking(store: Store, fn: () => void): () => void {
  const offFocus = subscribeFocus(fn);
  const offVoice = store.subscribe('voice_mode', fn);
  return () => {
    offFocus();
    offVoice();
  };
}

/** The focus handlers for a composer writing to `at`: on its wrapper (focus bubbles in React). */
export function talkFocusHandlers(at: TalkAt): { onFocus: () => void; onBlur: (e: { currentTarget: Element; relatedTarget: Element | null }) => void } {
  return {
    onFocus: () => {
      noteComposerFocus(at);
    },
    onBlur: (e) => {
      // still inside the same composer (its field to its mic): no change
      if (e.relatedTarget !== null && e.currentTarget.contains(e.relatedTarget)) return;
      noteComposerFocus(null, at);
    },
  };
}
