// src/composer · the caret across a composer swap (panel-full, his m_45439): when the panel goes full
// width the thread's composer unmounts and the floating one mounts for the same target in the same
// commit (and back). The draft goes through the drafts' file (drafts.ts: saved at once when a
// composer goes, read when one comes); his caret and focus go through here. Armed only by the swap
// (app/panel/state.ts setFull), for HANDOFF_MS: any other unmount keeps nothing, so a thread opened
// later starts with its caret at the end as always. One composer's leave, the next one's take.
// Owner: panel-full.

/** Where his caret was in the composer that left: ProseMirror positions, and whether it had the focus. */
export interface Caret {
  readonly from: number;
  readonly to: number;
  readonly focused: boolean;
}

/** How long after the swap is armed a composer may leave its caret, and the next take it. */
export const HANDOFF_MS = 1000;

let armedAt: number | null = null;
const left = new Map<string, Caret>();

const live = (now: number): boolean => armedAt !== null && now - armedAt < HANDOFF_MS;

/** The swap starts: the composers that go in the next moment leave their caret. */
export function armHandoff(now: number = Date.now()): void {
  armedAt = now;
  left.clear();
}

/** A composer of `key` (its draft key) goes: its caret is kept while the swap is armed. */
export function leaveCaret(key: string, caret: Caret, now: number = Date.now()): void {
  if (live(now)) left.set(key, caret);
}

/** A composer of `key` comes: the caret the one before it left, once; none past the swap. */
export function takeCaret(key: string, now: number = Date.now()): Caret | undefined {
  const c = live(now) ? left.get(key) : undefined;
  left.delete(key);
  return c;
}

/** Test seam: nothing armed, nothing kept. */
export function resetHandoff(): void {
  armedAt = null;
  left.clear();
}
