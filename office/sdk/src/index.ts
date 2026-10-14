// @bise/office: read, create and edit xlsx, pptx and docx (docs/office.md).
// Bytes in, bytes out, no node imports: the same bundle (office/dist/office.js)
// runs in `bise office run`, in the side panel's viewer and in the tests.

export { sheets } from "./sheets/index.ts";
export { slides } from "./slides/index.ts";
export { docs } from "./docs/index.ts";
export { run, setHost, type Host, type WriteOptions } from "./run.ts";

export { OfficeError, type OfficeErrorCode } from "./core/errors.ts";
export { ANCHOR_KINDS, KINDS_OF, readAnchor, anchorFor, type Anchor, type AnchorKind, type Rect } from "./core/anchor.ts";
export type { Outline, OutlineNode, Problem, Selection, OfficeFile } from "./core/outline.ts";
export { diff, flatten, type OutlineDiff, type Change } from "./core/diff.ts";
export { openPackage, kindOf, checkPackage, type Package } from "./core/package.ts";

// the core the modules build on, for an agent that needs a raw part
export * as core from "./core/raw.ts";
