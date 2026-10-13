// What the composer needs from the rest of the app, as one seam: the lists behind `@`, `$` and `/`
// and the few effects (save a pasted image, run a command). The screen that mounts a composer
// (the thread, amb-win; the spotlight) fills it from the store, whose shapes are generated from
// bise-proto (amb-core's step 4: files, skills, commands); this file never names a protocol
// message, so the composer doesn't change when the protocol does.

import { DOC_EXTS, IMAGE_EXTS } from '@/proto/chips.gen';

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
  /** He picked this file in the `@` list (never a folder he browsed): the core remembers it per
   *  project and ranks it first in its tier on the next `files` answer (B8/R14, files::picked). */
  readonly filePicked?: (path: string) => void;
  /** The workspace's absolute path: an `@` pick of a document becomes a file chip by its
   *  absolute path (file-chips); none: the pick stays its `@path` text. */
  readonly root?: string;
  /** A pasted or dropped image saved to a file the core can send; null when it can't be. */
  readonly saveImage: (file: File) => Promise<SavedImage | null>;
  /** The model in view reads no images (its name, for the refusal line); unset: it does or we
   *  don't know, and nothing is refused on a guess (attach.rs refused_images, K4). */
  readonly noVision?: string;
  /** Dictation into the field (bar I / 2.6): the mic and its words; none: no mic control. */
  readonly dictate?: DictatePort;
  /** Voice mode with the agent in view (ctrl+r twice, the TUI's DOUBLE_CTRL_R; amb-home's
   *  src/voicemode); none: a second ctrl+r only stops the dictation. */
  readonly voice?: () => void;
  /** The values of a listed argument kind matching `query` (the screen's lists); none: no popup. */
  readonly choices?: (kind: Exclude<ArgKind, 'text' | { readonly words: readonly Choice[] }>, query: string) => readonly Choice[];
}

/** One dictation's words so far: `text` is the WHOLE text (it replaces the dictated part, never
 *  appended); one `final` ends it (stopped, fn's talk, the time limit, cancelled, an error). */
export interface DictateState {
  readonly text: string;
  readonly final: boolean;
  readonly cancelled: boolean;
  /** what went wrong ('the mic is busy.', no mic, no voice model); its words so far are kept */
  readonly error: string | null;
  /** a final with no words or an error whose take the core kept: `retry` transcribes it again */
  readonly kept?: boolean;
}

/** The mic, as the composer sees it (the store's dictateStart/Stop/Cancel and its dictation slice). */
export interface DictatePort {
  /** The mic on: a new dictation's id. */
  readonly start: () => string;
  /** The mic off: the final words follow. */
  readonly stop: (id: string) => void;
  readonly cancel: (id: string) => void;
  /** A kept take (its final `kept`): transcribed once more, one more final for that id. */
  readonly retry?: (id: string) => void;
  /** A kept take he let go: the core drops it. */
  readonly drop?: (id: string) => void;
  readonly read: (id: string) => DictateState | null;
  /** Called on each change of that dictation; returns the unsubscribe. */
  readonly subscribe: (id: string, fn: () => void) => () => void;
  /** His voice level (0-1) while the mic is on: called now and on each change; returns the unsubscribe. */
  readonly level?: (fn: (v: number) => void) => () => void;
}

/** No lists, no effects: a composer that only types and sends (the spotlight's first step, tests). */
export const NO_SOURCES: ComposerSources = {
  agents: [],
  skills: [],
  commands: [],
  files: () => Promise.resolve([]),
  saveImage: () => Promise.resolve(null),
};

/** A path's extension, lower case ('' none; a dot file has none): bise_proto::parts ext_of. */
const extOf = (path: string): string => {
  const name = path.split('/').at(-1) ?? path;
  const dot = name.lastIndexOf('.');
  return dot <= 0 ? '' : name.slice(dot + 1).toLowerCase();
};

/** A file's path is an image the model can read (docs/images.md; bise_proto::parts' one table). */
export const isImagePath = (path: string): boolean => (IMAGE_EXTS as readonly string[]).includes(extOf(path));

/** An `@` pick of this path is a file chip (a document, not code: bise_proto::parts pick_kind). */
export const isDocPath = (path: string): boolean => (DOC_EXTS as readonly string[]).includes(extOf(path));
