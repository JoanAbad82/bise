// The grid's API has two copies: this folder's sheet.ts (what office-sheet.js is built from)
// and kit/office/office-sheet.d.ts (what the viewer's sheet.ts reads, without Univer's and
// node's types). This file pins them equal, both ways, in office/sdk's typecheck (architect
// m_40971): a change to sheet.ts's Grid or GridPlace is red here until the copy follows.
// Types only: nothing imports it, the bundles never hold it.
import type { Grid as RealGrid, GridPlace as RealPlace } from "./sheet.ts";
import type { Grid as CopyGrid, GridPlace as CopyPlace } from "../../../../kit/office/office-sheet.d.ts";

/** true when A and B are assignable both ways. */
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Pin<T extends true> = T;

export type GridPinned = Pin<Same<RealGrid, CopyGrid>>;
export type GridPlacePinned = Pin<Same<RealPlace, CopyPlace>>;
