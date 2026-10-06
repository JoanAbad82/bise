// What the composer needs from the rest of the app, as one seam: the lists behind `@`, `$` and `/`
// and the few effects (save a pasted image, run a command). The screen that mounts a composer
// (the thread, amb-win; the spotlight) fills it from the store, whose shapes are generated from
// bise-proto (amb-core's step 4: files, skills, commands); this file never names a protocol
// message, so the composer doesn't change when the protocol does.

export interface PickAgent {
  readonly name: string;
  readonly desc?: string;
}

export interface PickSkill {
  readonly name: string;
  readonly desc: string;
}

export interface PickCommand {
  readonly name: string;
  readonly desc: string;
  /** It takes arguments: picking completes `/name `, ⏎ on the full line runs it. */
  readonly args: boolean;
  /** Its screen or core command exists; else the list shows it greyed, `not yet` (bar 2.1). */
  readonly ready: boolean;
}

export interface PickFile {
  /** Relative to the workspace, `/`-separated. */
  readonly path: string;
  readonly dir: boolean;
}

/** An image saved where the core can read it: its absolute path and the name the chip shows. */
export interface SavedImage {
  readonly path: string;
  readonly name: string;
}

export interface ComposerSources {
  /** The live agents for the `@` list (routes the message, as in the TUI). */
  readonly agents: readonly PickAgent[];
  readonly skills: readonly PickSkill[];
  readonly commands: readonly PickCommand[];
  /** The workspace's files for an `@` query, ranked by the core (files.rs's ranking). */
  files(query: string): Promise<readonly PickFile[]>;
  /** A pasted or dropped image saved to a file the core can send; null when it can't be. */
  saveImage(file: File): Promise<SavedImage | null>;
}

/** No lists, no effects: a composer that only types and sends (the spotlight's first step, tests). */
export const NO_SOURCES: ComposerSources = {
  agents: [],
  skills: [],
  commands: [],
  files: () => Promise.resolve([]),
  saveImage: () => Promise.resolve(null),
};

/** A file's path is an image the model can read (docs/images.md). */
export const isImagePath = (path: string): boolean => /\.(png|jpe?g|gif|webp)$/iu.test(path);
