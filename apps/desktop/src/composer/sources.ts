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

/** What completes one argument of a command (the TUI's commands.rs `Arg`): fixed words, or a
 *  list the screen knows (live agents, archived ones, open cards, branches, models, efforts,
 *  plugins); `text` takes the rest of the line and completes nothing. */
export type ArgKind =
  | { readonly words: readonly Choice[] }
  | 'agent'
  | 'archived'
  | 'card'
  | 'branch'
  | 'model'
  | 'effort'
  | 'plugin'
  | 'text';

/** One value an argument can take, as its popup shows it. */
export interface Choice {
  readonly value: string;
  readonly desc: string;
}

export interface PickCommand {
  readonly name: string;
  readonly desc: string;
  /** It takes arguments: picking completes `/name `, ⏎ on the full line runs it. */
  readonly args: boolean;
  /** Its arguments in order, each with what completes it (none: nothing to offer). */
  readonly argKinds?: readonly ArgKind[];
  /** Its screen or core command exists; else the list shows it greyed, `not yet` (bar 2.1). */
  readonly ready: boolean;
}

/** Something an agent made for him (a page, a doc, a link): the `@` list offers it by name. */
export interface PickArtifact {
  readonly id: string;
  readonly title: string;
  readonly kind: string;
  readonly agent: string;
  readonly url: string;
  readonly atMs: number;
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
  /** The project's artifacts for the `@` list, after the agents (none: no rows). */
  readonly artifacts?: readonly PickArtifact[];
  /** The workspace's files for an `@` query, ranked by the core (files.rs's ranking). */
  readonly files: (query: string) => Promise<readonly PickFile[]>;
  /** A pasted or dropped image saved to a file the core can send; null when it can't be. */
  readonly saveImage: (file: File) => Promise<SavedImage | null>;
  /** The model in view reads no images (its name, for the refusal line); unset: it does or we
   *  don't know, and nothing is refused on a guess (attach.rs refused_images, K4). */
  readonly noVision?: string;
  /** The values of a listed argument kind matching `query` (the screen's lists); none: no popup. */
  readonly choices?: (kind: Exclude<ArgKind, 'text' | { readonly words: readonly Choice[] }>, query: string) => readonly Choice[];
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
