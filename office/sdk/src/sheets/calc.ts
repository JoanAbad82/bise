// Recompute the workbook's formulas with formula.ts and store the results
// in the cells (exceljs writes them as the cached values). A formula the
// evaluator does not know keeps its old result and is listed.

import type { Cell as XCell, Worksheet } from "exceljs";
import { refName } from "./addr.ts";
import { formulaOf, scalarOf, VT } from "./cells.ts";
import { evaluate, isError, sig15, Unsupported, type Scalar } from "./formula.ts";
import type { XBook } from "./io.ts";

export type Recalc = {
  /** formulas computed now */
  computed: number;
  /** formulas left as they were: "Q3!B4: the function XLOOKUP" */
  unsupported: { ref: string; why: string }[];
};

/** Every formula of the book, computed where the evaluator can. */
export function recalc(book: XBook): Recalc {
  const date1904 = !!book.properties?.date1904;
  const memo = new Map<string, Scalar>();
  const busy = new Set<string>();
  const failed = new Map<string, string>();
  let computed = 0;

  const sheetOf = new Map<string, Worksheet>();
  book.eachSheet((ws) => sheetOf.set(ws.name.toLowerCase(), ws));

  const valueAt = (sheet: string, row: number, col: number): Scalar => {
    const ws = sheetOf.get(sheet.toLowerCase());
    if (!ws) return { error: "#REF!" };
    const cell = ws.findCell(row, col) as XCell | undefined;
    if (!cell || cell.type !== VT.Formula) return scalarOf(cell, date1904);
    return compute(ws, cell);
  };

  const compute = (ws: Worksheet, cell: XCell): Scalar => {
    const key = `${ws.name}!${cell.address}`;
    if (memo.has(key)) return memo.get(key)!;
    if (failed.has(key)) return scalarOf(cell, date1904);
    const f = formulaOf(cell);
    const v = cell.value as { formulaType?: number; shareType?: string };
    if (!f || (cell as unknown as { formulaType: number }).formulaType === 2 || v.shareType === "array") {
      failed.set(key, "an array formula");
      return scalarOf(cell, date1904);
    }
    if (busy.has(key)) throw new Unsupported("a circular reference");
    busy.add(key);
    try {
      const out = evaluate(f, ws.name, valueAt);
      memo.set(key, out);
      return out;
    } catch (e) {
      if (!(e instanceof Unsupported)) throw e;
      failed.set(key, e.message);
      return scalarOf(cell, date1904);
    } finally {
      busy.delete(key);
    }
  };

  book.eachSheet((ws) => {
    ws.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        if (cell.type !== VT.Formula) return;
        const out = compute(ws, cell);
        if (failed.has(`${ws.name}!${cell.address}`)) return;
        const result = isError(out) ? { error: out.error } : out === null ? 0 : typeof out === "number" ? sig15(out) : out;
        // the FormulaValue's setter: through `cell.value` a falsy result would be dropped
        (cell as unknown as { _value: { result: unknown } })._value.result = result;
        computed++;
      });
    });
  });

  const unsupported = [...failed].map(([key, why]) => {
    const bang = key.lastIndexOf("!");
    return { ref: refName(key.slice(0, bang), key.slice(bang + 1)), why };
  });
  return { computed, unsupported };
}
