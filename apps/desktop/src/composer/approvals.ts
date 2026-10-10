// TP-R6, ⇧⇥ in the composer (approvals-design.md §8.1, the TUI's input.rs + keybar.rs): it
// switches the hub's approvals mode yolo ↔ auto, and for 3 s after a switch the composer's label
// line says it, the mode word in accent then its sentence (the TUI's key bar flash). The hub
// marks a switch with `flash: true` on its `approvals` event.
import { useEffect, useRef, useState } from 'react';
import type { HubEv } from '@/proto';

export type ApprovalsEv = Extract<HubEv, { ev: 'approvals' }>;

/** How long the label line says a switch (keybar.rs FLASH). */
export const FLASH_MS = 3000;

/** The flash of a switch (keybar.rs flash_words): the mode word, then its sentence. Pure. */
export function flashWords(mode: string, checker: string, env: boolean): { word: string; rest: string } {
  const word = mode === '' ? 'yolo' : mode;
  const what = word === 'auto' ? (checker === 'off' ? 'edits run, commands ask you' : 'safe calls run, risky ones ask you') : 'everything runs, nothing asks';
  return { word, rest: ` · ${what}${env ? ' (this session only: BISE_APPROVALS)' : ''}` };
}

/**
 * True for 3 s after the hub said a switch (an `approvals` event with `flash`) while this screen
 * was up; the event it had when it mounted never flashes again (it came before him).
 */
export function useApprovalsFlash(ev: ApprovalsEv | null): boolean {
  const first = useRef(ev);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (ev === null || ev === first.current || ev.flash !== true) return;
    const start = window.setTimeout(() => {
      setOn(true);
    }, 0);
    const end = window.setTimeout(() => {
      setOn(false);
    }, FLASH_MS);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(end);
    };
  }, [ev]);
  return on;
}
