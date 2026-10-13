// The app's key list (bar 3.5: ⌘/ and settings · keys): every key of the
// app in one table, with the meaning the TUI's key has (rust/tui/src/help.rs
// ROWS), ⌘ standing in for ctrl where a Mac app has its own gesture. Pure
// data. Owner: amb-home; a chunk that adds a key adds its row here (ask).

export interface KeyRow {
  /** the keys, as drawn ("⌘1 … ⌘9") */
  readonly keys: string;
  readonly action: string;
  /** the TUI's key for the same action, when it differs */
  readonly tui?: string;
}

export interface KeySection {
  readonly id: string;
  readonly title: string;
  readonly rows: readonly KeyRow[];
}

export const KEY_SECTIONS: readonly KeySection[] = [
  {
    id: 'anywhere',
    title: 'from any app',
    rows: [
      { keys: 'hold fn', action: 'talk to bise, with what is in front of you' },
      { keys: 'fn fn', action: 'hands-free voice; fn again stops' },
      { keys: 'fn space', action: 'the spotlight: find an agent, or ask bise' },
    ],
  },
  {
    id: 'window',
    title: 'the window',
    rows: [
      { keys: '⌘0', action: 'bise' },
      { keys: '⌘1 … ⌘9', action: 'a project, in the order of settings · projects' },
      { keys: '⌥0 / ⌥1 … ⌥9', action: "the project's main / an agent", tui: '⌥ + 0…9' },
      { keys: '⌘K', action: 'find an agent, a page or an artifact' },
      { keys: '⌘[ / ⌘]', action: 'back / forward' },
      { keys: '⌘I', action: 'the inbox: what waits for you, most blocking first', tui: '/inbox, ctrl+1-9' },
      { keys: '⌘F', action: 'find in the thread', tui: 'ctrl+f' },
      { keys: '⌘D', action: "the agent's changes", tui: '/diff' },
      { keys: '⌘⇧A', action: 'the artifacts', tui: '/artifacts' },
      { keys: '⌘E', action: 'unfold / fold everything', tui: 'ctrl+o' },
      { keys: '⌘,', action: 'settings' },
      { keys: '⌘/', action: 'this list', tui: '/shortcuts' },
    ],
  },
  {
    id: 'composer',
    title: 'the composer',
    rows: [
      { keys: '⏎', action: 'send; during a turn, steer it' },
      { keys: '⇧⏎', action: 'a new line' },
      { keys: 'tab', action: 'during a turn: queue it for the end of the turn' },
      { keys: '↑', action: 'in an empty composer: your queued or last message back' },
      { keys: 'ctrl+c', action: 'stop the turn', tui: 'ctrl+c' },
      { keys: 'esc', action: 'put the draft away; close what is open' },
      { keys: '⌘.', action: "stop the agent's turn" },
      { keys: '/', action: 'commands' },
      { keys: '@', action: 'a file' },
      { keys: '$', action: 'a skill' },
      { keys: '⌘V', action: 'paste text, an image, or a long text as a chip' },
      { keys: 'ctrl+r', action: 'dictation into the composer' },
    ],
  },
  {
    id: 'inbox',
    title: 'the inbox',
    rows: [
      { keys: '↑ ↓', action: 'the previous / next item' },
      { keys: 'ctrl+p / ctrl+n', action: 'the previous / next item, round from the last to the first' },
      { keys: 'ctrl+o', action: "open the item's folded lines" },
      { keys: '← →', action: "walk the item's options" },
      { keys: '1 … 9', action: 'pick that option' },
      { keys: '⏎', action: 'pick the option on, or send your typed answer' },
      { keys: '⌘⌫', action: 'close it without answering', tui: 'ctrl+x' },
      { keys: 'esc', action: 'back' },
    ],
  },
];
