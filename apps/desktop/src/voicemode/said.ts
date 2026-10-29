// His voice turns in this window (designer's voice-window page (1)): once sent, his words land in
// the thread as his normal right bubble with 'said · 0:06' under it. The core sends his turn as a
// typed `send` (core/voice_mode.rs) and the hub's entry doesn't say it was spoken, so the window
// keeps, per thread, the words it saw go and how long he talked (ThreadVoice notes them on the
// hearing -> sending step); YouRow asks with its words. In memory only, never stored or logged.
// Owner: amb-home (amb-web wrote it).
import { useSyncExternalStore } from 'react';

interface Said {
  readonly words: string;
  readonly ms: number;
}

/** At most this many turns per thread are kept (older ones read as typed). */
const KEEP = 50;

const turns = new Map<string, Said[]>();
const listeners = new Set<() => void>();
let version = 0;

/** Words compared without their spaces' shape (the core joins the heard words with one space). */
export const sameWords = (s: string): string => s.trim().replace(/\s+/gu, ' ').toLowerCase();

const keyOf = (project: string, agent: string): string => `${project}/${agent}`;

/** A turn he said to `agent`: its words and how long he talked. */
export function noteSaid(project: string, agent: string, words: string, ms: number): void {
  const w = sameWords(words);
  if (w === '') return;
  const k = keyOf(project, agent);
  const list = [...(turns.get(k) ?? []), { words: w, ms }].slice(-KEEP);
  turns.set(k, list);
  version += 1;
  for (const l of listeners) l();
}

/** How long he talked for these words to `agent` (the newest match), or null: typed. */
export function saidMs(project: string, agent: string, words: string): number | null {
  const w = sameWords(words);
  const list = turns.get(keyOf(project, agent)) ?? [];
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const t = list[i];
    if (t !== undefined && t.words === w) return t.ms;
  }
  return null;
}

const subscribe = (cb: () => void): (() => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

/** The row's 'said' time: how long he talked for these words, or null (a typed message). */
export function useSaidMs(project: string, agent: string, words: string): number | null {
  useSyncExternalStore(subscribe, () => version);
  return saidMs(project, agent, words);
}

/** Tests: forget every turn. */
export function forgetSaid(): void {
  turns.clear();
  version += 1;
  for (const l of listeners) l();
}
