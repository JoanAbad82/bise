// The shapes every module returns: one outline, one problem list, one
// selection, so an agent learns them once (docs/office.md).

import type { Anchor } from "../anchor.gen.ts";
import type { FileKind } from "./opc.ts";

/**
 * One thing of a file an agent can name: a sheet, a cell range, a slide, a
 * shape, a paragraph, a table. `id` is stable across saves (a shape's
 * `p:cNvPr/@id`, a paragraph's `w14:paraId`, a cell's `Sheet!B4`), and
 * unique in its outline.
 */
export type OutlineNode = {
  id: string;
  /** what it is: "sheet", "range", "cell", "slide", "shape", "table", "para", ... */
  type: string;
  /** where a note on it sits: `at(node.anchor)` finds it again */
  anchor: Anchor;
  /** a short name when it has one (a sheet's, a shape's) */
  name?: string;
  /** its text, whole (a cell's value as shown, a shape's, a paragraph's) */
  text?: string;
  /** what a module wants to say more (a formula, a box, a style): plain JSON */
  props?: Record<string, unknown>;
  children?: OutlineNode[];
};

/** A file as `inspect()` returns it. */
export type Outline = { kind: FileKind; nodes: OutlineNode[] };

/** One problem `check()` finds, what an agent must fix before it says done. */
export type Problem = {
  /** stable, for code: "overflow", "off_slide", "formula_error", "broken_rel", "empty_placeholder", ... */
  code: string;
  severity: "error" | "warning";
  /** where it is, when it is somewhere */
  at?: Anchor;
  /** the words, for the agent and the user */
  message: string;
};

/** What `at(anchor)` returns: the node, and what a module can do on it. */
export type Selection<Ops = Record<string, never>> = { node: OutlineNode } & Ops;

/**
 * An open file. Each module (sheets, slides, docs) returns one with its own
 * edit methods on top; these four are the same for the three.
 */
export interface OfficeFile<K extends FileKind = FileKind, Ops = Record<string, never>> {
  readonly kind: K;
  /** the outline, with ids and anchors */
  inspect(): Outline;
  /** the node under an anchor (a note's, or an outline node's); throws OfficeError when it is not there */
  at(anchor: Anchor): Selection<Ops>;
  /** the problems to fix, [] when none */
  check(): Problem[];
  /** the file's bytes, every part it did not change kept */
  save(): Promise<Uint8Array>;
}
