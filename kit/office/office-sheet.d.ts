// The types of office/dist/office-sheet.js (Univer's grid, office/sdk/src/view/sheet.ts), which
// ships no .d.ts: built apart (scripts/bins.sh office-sheet). Its source pulls Univer's and node's
// types in, so sheet.ts reads this copy of its API instead. office/sdk's typecheck pins the two
// equal (office/sdk/src/view/sheet.pin.ts): a change to view/sheet.ts's API is red until this follows.
// (UWorkbook by its path: this file is read by both programs, kit/office's and office/sdk's)
import type { UWorkbook } from "../../office/sdk/src/sheets/univer.ts";

export type GridPlace = { sheet: string; range: string | null };

export type Grid = {
  snapshot(): UWorkbook;
  onChange(fn: () => void): void;
  place(): GridPlace;
  restore(p: GridPlace): void;
  rect(sheet: string, range: string): DOMRect | null;
  text(): string;
  onMove(fn: () => void): void;
  dark(on: boolean): void;
  dispose(): void;
};

export function mountGrid(el: HTMLElement, data: UWorkbook, opts: { dark: boolean }): Grid;
