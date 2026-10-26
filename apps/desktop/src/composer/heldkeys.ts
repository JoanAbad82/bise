// A modifier held alone (app/held.ts) lists bise's own keys of that modifier in the composer's
// bottom row (designer m_44287, his ask m_44255: the hints the old key bar showed, be5d467aa took
// them with it). Only bise's keys, never what every Mac text field does (⌘C, ⌘V, ⌥←→…); the order
// is the drop order: what doesn't fit leaves from the end, whole. Pure: the screen gives the facts.
// Owner: r2-hints (the composer's, nm-composer's before).
import { composer } from '../proto/words.gen';

export type HeldMod = 'Control' | 'Alt' | 'Meta';

/** One pair: its keycaps (one per key), how two caps read ('…' a range, ' ' two keys), its word. */
export interface HeldPair {
  readonly caps: readonly string[];
  readonly sep: '…' | ' ';
  readonly word: string;
}

/** What the window knows when the hold starts (thread/foldHint.tsx useComposerHeld reads it). */
export interface HeldCtx {
  /** ctrl+o's word: 'expand' (something folded), 'collapse' (all open), none: no fold */
  readonly fold: 'expand' | 'collapse' | null;
  /** the inbox block's items (⌃1-N) */
  readonly inbox: number;
  /** an inbox item is open (⌃N ⌃P walk) */
  readonly itemOpen: boolean;
  /** a code block in the thread (⌃Y) */
  readonly code: boolean;
  /** the agents ⌥0-9 reach */
  readonly agents: number;
  /** a thread in view (⌘F finds in it) */
  readonly thread: boolean;
}

/** The composer's own facts. */
export interface HeldState extends HeldCtx {
  readonly busy: boolean;
  readonly typing: boolean;
  /** voice mode (⌃R ⌃R) with the agent in view */
  readonly voice: boolean;
}

const one = (cap: string, word: string): HeldPair => ({ caps: [cap], sep: ' ', word });

/** ⌃1 alone, else ⌃1 … ⌃N (9 at most). */
const range = (mod: string, from: number, n: number, word: string): HeldPair =>
  n <= from ? one(`${mod}${String(from)}`, word) : { caps: [`${mod}${String(from)}`, `${mod}${String(Math.min(n, 9))}`], sep: '…', word };

/** Every key of the held modifier that does something now, in designer m_44287's order. Pure. */
export function heldPairs(mod: HeldMod, s: HeldState): readonly HeldPair[] {
  const p: HeldPair[] = [];
  switch (mod) {
    case 'Control':
      if (s.busy) p.push(one('⌃C', composer.bar_stop));
      if (s.inbox > 0) {
        p.push(range('⌃', 1, s.inbox, composer.held_open_item));
        if (s.itemOpen && s.inbox > 1) p.push({ caps: ['⌃N', '⌃P'], sep: ' ', word: composer.held_next_item });
      }
      if (s.fold !== null) p.push(one('⌃O', s.fold === 'expand' ? composer.bar_expand : composer.bar_collapse));
      if (s.code) p.push(one('⌃Y', composer.bar_copy_code));
      // ⌃R dictate is the mic's own keycap while ⌃ is held: never a key twice (designer m_44571)
      if (s.voice) p.push({ caps: ['⌃R', '⌃R'], sep: ' ', word: composer.bar_voice_mode });
      p.push(one('⌃`', composer.bar_terminal));
      return p;
    case 'Alt':
      if (s.agents > 0) {
        p.push({ caps: ['⌥0', `⌥${String(Math.min(s.agents, 9))}`], sep: '…', word: composer.bar_go_to_agent });
        if (!s.typing) p.push({ caps: ['⌥↑', '⌥↓'], sep: ' ', word: composer.held_next_agent });
      }
      p.push(one('⌥⏎', composer.bar_newline));
      return p;
    case 'Meta':
      p.push(one('⌘K', composer.bar_find));
      if (s.thread) p.push(one('⌘F', composer.held_find_thread));
      if (s.busy) p.push(one('⌘.', composer.bar_stop));
      p.push(one('⌘N', composer.held_new_project));
      return p;
  }
}
