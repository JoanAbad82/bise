// The key bar under the composer (W9, the TUI's keybar.rs): the keys of the current mode, the key
// in the text color and what it does dim, and at rest a dim tip on the right that changes every 5
// minutes, never while he types. Pure: the composer reports its state on transitions (a list
// opens, text is selected, a chip comes, a turn starts), never per keystroke.

/** A key and what it does; an empty key is a plain dim label. */
export type Pair = readonly [key: string, label: string];

export type BarMode =
  /** voice: recording, then the clip being transcribed */
  | 'recording'
  | 'transcribing'
  /** the `@` list is open */
  | 'file'
  /** text selected in the thread: typing asks about it (the screen says so, quote.rs) */
  | 'quote'
  /** text selected in the field */
  | 'selection'
  /** images in the draft */
  | 'images'
  /** a turn runs */
  | 'steer'
  | 'rest';

export interface BarState {
  readonly voice: 'recording' | 'transcribing' | null;
  readonly fileList: boolean;
  readonly quoting: boolean;
  readonly selected: boolean;
  readonly images: boolean;
  readonly busy: boolean;
  /** the field holds text */
  readonly typing: boolean;
}

/** The mode for a state, in the TUI's order (keybar.rs mode()). */
export function barMode(s: BarState): BarMode {
  if (s.voice !== null) return s.voice;
  if (s.fileList) return 'file';
  if (s.quoting) return 'quote';
  if (s.selected) return 'selection';
  if (s.busy) return 'steer';
  if (s.images) return 'images';
  return 'rest';
}

/** At rest: the three characters that start something (BISE-303). */
const REST: readonly Pair[] = [
  ['@', 'file'],
  ['$', 'skills'],
  ['/', 'commands'],
];

/** The pairs of a mode; `typing` hides `tab queue` and `⏎ steer` on an empty field (designer). */
export function barPairs(mode: BarMode, typing: boolean): readonly Pair[] {
  switch (mode) {
    case 'recording':
      return [
        ['any key', 'stop'],
        ['esc', 'cancel'],
      ];
    case 'transcribing':
      return [['esc', 'cancel']];
    case 'file':
      return [
        ['⏎/tab', 'insert'],
        ['→', 'open a folder'],
        ['←', 'up'],
        ['↑↓', 'select'],
        ['esc', 'close'],
      ];
    case 'quote':
      return [
        ['type', 'to ask about it'],
        ['tab', 'quote'],
        ['⌘C', 'copy'],
        ['esc', 'drop'],
      ];
    case 'selection':
      return [
        ['type', 'to replace it'],
        ['⌘C', 'copy'],
        ['⌘X', 'cut'],
      ];
    case 'images':
      return [['⌘V', 'paste image'], ...REST];
    case 'steer':
      return typing
        ? [
            ['tab', 'queue'],
            ['⏎', 'steer'],
            ['⌃C', 'stop'],
          ]
        : [['⌃C', 'stop']];
    case 'rest':
      return REST;
  }
}

/** A modifier held alone (the app's held.ts): the bar lists its keys instead (the TUI's ctrlhint.rs). */
export type HeldMod = 'Control' | 'Alt' | 'Meta';

/** What the screen knows for the held keys (the composer adds its own: busy, typing, selected). */
export interface HeldCtx {
  /** ctrl+o's word: 'expand' (something folded), 'collapse' (all open), none: no fold */
  readonly fold: 'expand' | 'collapse' | null;
  /** the inbox block's items (ctrl+1-N) */
  readonly inbox: number;
  /** an inbox item is open (ctrl+n/p walk) */
  readonly itemOpen: boolean;
  /** a code block in the thread (ctrl+y) */
  readonly code: boolean;
  /** the agents ⌥1-9 reach */
  readonly agents: number;
}

export interface HeldState extends HeldCtx {
  readonly busy: boolean;
  readonly typing: boolean;
  readonly selected: boolean;
}

/** `⌃1`, `⌃1–2` … `⌃1–9` (ctrlhint.rs open_keys; ctrl as the Mac's ⌃, designer m_26044). Pure. */
export const openKeys = (n: number): string => (n <= 1 ? '⌃1' : `⌃1–${String(Math.min(n, 9))}`);

/** Every key of the held modifier that does something now, in the TUI's order (ctrlhint.rs
 *  ctrl_pairs, alt_pairs, cmd_pairs), for the keys the window has. ctrl+r and ctrl+r twice are on
 *  the mic and voice buttons beside the bar, never twice. Pure. */
export function heldPairs(mod: HeldMod, s: HeldState): readonly Pair[] {
  const p: Pair[] = [];
  switch (mod) {
    case 'Control':
      if (s.busy) p.push(['⌃C', 'stop']);
      if (s.fold !== null) p.push(['⌃O', s.fold]);
      if (s.inbox > 0) {
        p.push([openKeys(s.inbox), 'open an inbox item']);
        if (s.itemOpen && s.inbox > 1) p.push(['⌃N/⌃P', 'next item']);
      }
      if (s.code) p.push(['⌃Y', 'copy code']);
      p.push(['⌃`', 'terminal']);
      return p;
    case 'Alt':
      if (s.agents > 0) {
        p.push(['⌥0-9', 'go to an agent']);
        if (!s.typing) p.push(['⌥↑↓', 'select an agent']);
      }
      if (s.typing) p.push(['⌥←→', 'word'], ['⌥⌫', 'delete a word']);
      p.push(['⌥⏎', 'newline']);
      return p;
    case 'Meta':
      p.push(['⌘K', 'find agent'], ['⌘F', 'find']);
      if (s.busy) p.push(['⌘.', 'stop']);
      if (s.selected) p.push(['⌘C', 'copy'], ['⌘X', 'cut']);
      if (s.typing) p.push(['⌘A', 'select all'], ['⌘←→', 'line start/end'], ['⌘⌫', 'delete to line start']);
      p.push(['⌘V', 'paste']);
      return p;
  }
}

/** The desktop's tips (help.rs TIPS, the keys that work here), shown in order. */
export const TIPS: readonly string[] = [
  '$ calls a skill, tab completes',
  'esc puts your draft away, ↑ brings it back',
  '⇧⏎ adds a new line',
  'tab queues a message while the agent works',
  ':tada: puts 🎉, a : and two letters list them',
  '→ opens a folder in the @ list, ← goes up',
  'a ``` block keeps ⏎ for new lines until you close it',
  '/theme switches between light and dark',
];

/** How long a tip stays. */
export const TIP_EVERY_MS = 5 * 60_000;

export interface TipClock {
  readonly index: number;
  readonly since: number;
}

/** A session's first tip: the one after where the last one stopped (`saved`), else the first. */
export const startTip = (saved: number | null, now: number): TipClock => ({ index: saved === null ? 0 : (saved + 1) % TIPS.length, since: now });

/** The next tip once 5 minutes are up, never while he types; the same clock otherwise. */
export function tickTip(c: TipClock, now: number, typing: boolean): TipClock {
  if (typing || now - c.since < TIP_EVERY_MS) return c;
  return { index: (c.index + 1) % TIPS.length, since: now };
}

/** The tip shows only at rest with an empty field. */
export const tipShown = (mode: BarMode, typing: boolean): boolean => mode === 'rest' && !typing;

/** The days he used the composer (local 'YYYY-MM-DD'), kept until the tips retire (designer's
 *  desktop-delight tuck away: none after 7 days of use). */
export const TIP_DAYS = 7;

/** Today counted once: the days to keep, and whether the tips are retired (an 8th day of use). Pure. */
export function countDay(days: readonly string[], today: string): { days: readonly string[]; retired: boolean } {
  if (days.includes(today)) return { days, retired: false };
  if (days.length >= TIP_DAYS) return { days, retired: true };
  return { days: [...days, today], retired: false };
}
