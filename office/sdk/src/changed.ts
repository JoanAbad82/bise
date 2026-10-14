// changedAnchors(prev, next): what a save changed, from the two files' bytes
// (core/changed.ts says the rules). `bise office run`'s run.write calls it
// with the file as it was on disk and the bytes it writes.

import type { Anchor } from "./anchor.gen.ts";
import { changedOf, CHANGED_CAP } from "./core/changed.ts";
import { kindOf } from "./core/package.ts";
import type { Outline } from "./core/outline.ts";
import { docs } from "./docs/index.ts";
import { sheets } from "./sheets/index.ts";
import { slides } from "./slides/index.ts";

async function outline(bytes: Uint8Array): Promise<Outline | null> {
  switch (kindOf(bytes)) {
    case "pptx":
      return (await slides.open(bytes)).inspect();
    case "xlsx":
      return (await sheets.open(bytes)).inspect();
    case "docx":
      return (await docs.open(bytes)).inspect();
    default:
      return null;
  }
}

/**
 * The anchors of what changed from `prev` to `next` (at most `cap`), or
 * null when it can't say: not the same kind of office file, or one does
 * not open. Never throws: a list is a nicety, the write goes on without.
 */
export async function changedAnchors(prev: Uint8Array, next: Uint8Array, cap = CHANGED_CAP): Promise<Anchor[] | null> {
  try {
    if (kindOf(prev) === null || kindOf(prev) !== kindOf(next)) return null;
    const [a, b] = await Promise.all([outline(prev), outline(next)]);
    return a && b ? changedOf(a, b, cap) : null;
  } catch {
    return null;
  }
}
