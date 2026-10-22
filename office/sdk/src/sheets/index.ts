// The sheets module (xlsx), on exceljs's model and xforms (docs/office.md,
// office-artifacts plan §8): open or create a workbook, inspect it, edit
// it by cell reference or note anchor, check it, save it. What exceljs
// does not model (charts, pivots, external links, ...) is carried through
// a save unchanged, or the save refuses (carry.ts).
//
//   const book = await sheets.open(await run.read("q3.xlsx"));
//   book.range("Q3!B4").set(1200);
//   book.at(note.anchor).style({ bold: true });
//   const problems = book.check();
//   await run.write("q3.xlsx", await book.save());

import Workbook from "exceljs/lib/doc/workbook.js";
import { OfficeError } from "../core/errors.ts";
import { openPackage } from "../core/package.ts";
import { Book } from "./book.ts";
import { load, type XBook } from "./io.ts";

export { Book };
export type { CellInput, RangeOps, RangeSel, SaveOptions, Style } from "./book.ts";
export type { InspectOptions } from "./inspect.ts";
export type { Recalc } from "./calc.ts";
export { editsBetween, widthChars, heightPt, type Edit, type UWorkbook, type USheet, type UCell, type UStyle } from "./univer.ts";
export type { Scalar, ErrorValue } from "./formula.ts";

export type CreateOptions = {
  /** the first sheet's name (default "Sheet1") */
  sheet?: string;
  /** rows for the first sheet, from A1 */
  rows?: import("./book.ts").CellInput[][];
  /** the file's created/modified date (default now): the same date gives the same bytes */
  date?: Date;
};

export const sheets = {
  /** An xlsx's bytes as a workbook; throws OfficeError (not_a_zip, not_office, bad_xml). */
  async open(bytes: Uint8Array): Promise<Book> {
    const pkg = openPackage(bytes);
    if (pkg.kind !== "xlsx") throw new OfficeError("not_office", `this is a ${pkg.kind}, not an xlsx: open it with ${pkg.kind === "pptx" ? "slides" : "docs"}.open`);
    const { book, origin } = await load(pkg.zip);
    return new Book(book, origin, bytes);
  },

  /** A new workbook with one sheet. */
  async create(opts: CreateOptions = {}): Promise<Book> {
    const x = new Workbook() as XBook;
    const date = opts.date ?? new Date();
    x.created = date;
    x.modified = date;
    x.creator = "bise";
    x.lastModifiedBy = "bise";
    const book = new Book(x);
    book.addSheet(opts.sheet ?? "Sheet1", { rows: opts.rows });
    return book;
  },
};
