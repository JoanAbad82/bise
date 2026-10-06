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
            ['esc', 'stop'],
          ]
        : [['esc', 'stop']];
    case 'rest':
      return REST;
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
