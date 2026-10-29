// What an agent must fix before it says a workbook is done: formula errors
// (#REF!, #DIV/0!, ...), formulas with no value (blank in our viewer and in
// Quick Look), formulas the evaluator left as they were after an edit, and
// what a save would lose (would_lose). Pure over the book; the package
// problems (broken rels, bad XML) come from core's checkPackage.

import type { Problem } from "../core/outline.ts";
import { refName } from "./addr.ts";
import { formulaOf, hasNoValue, scalarOf, VT } from "./cells.ts";
import type { Recalc } from "./calc.ts";
import type { Loss } from "./carry.ts";
import type { XBook } from "./io.ts";

/** At most this many problems of one code; then one line says how many more. */
const CAP = 50;

export function cellProblems(book: XBook, recalc: Recalc | undefined): Problem[] {
  const errors: Problem[] = [];
  const empty: Problem[] = [];
  const date1904 = !!book.properties?.date1904;
  const unsupported = new Map((recalc?.unsupported ?? []).map((u) => [u.ref, u.why]));
  book.eachSheet((ws) => {
    ws.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        if (cell.type === VT.Merge) return;
        const ref = refName(ws.name, cell.address);
        const at = { kind: "cell" as const, sheet: ws.name, range: cell.address };
        const f = formulaOf(cell);
        const v = scalarOf(cell, date1904);
        if (v && typeof v === "object") {
          errors.push({ code: "formula_error", severity: "error", at, message: `${ref} shows ${v.error}${f ? ` (=${f})` : ""}` });
        } else if (hasNoValue(cell)) {
          const why = unsupported.get(ref);
          empty.push({
            code: "no_value",
            severity: "warning",
            at,
            message: `${ref} has a formula with no value (=${f}): blank in the viewer and Quick Look until Excel computes it${why ? `; the SDK cannot: ${why}` : ""}`,
          });
        }
      });
    });
  });
  const stale: Problem[] = (recalc?.unsupported ?? [])
    .filter((u) => !empty.some((p) => p.message.startsWith(`${u.ref} `)))
    .map((u) => ({
      code: "not_recomputed",
      severity: "warning" as const,
      message: `${u.ref} keeps its old value after this edit (the SDK cannot compute ${u.why}); Excel recomputes it on open`,
    }));
  return [...cap(errors), ...cap(empty), ...cap(stale)];
}

export function lossProblems(losses: Loss[]): Problem[] {
  return losses.map((l) => ({
    code: "would_lose",
    severity: "error" as const,
    ...(l.sheet ? { at: { kind: "cell" as const, sheet: l.sheet, range: "A1" } } : {}),
    message: `${l.part}: save() would drop it (${l.why}); undo that change, or save({ drop: ["${l.part}"] })`,
  }));
}

function cap(list: Problem[]): Problem[] {
  if (list.length <= CAP) return list;
  const rest = list.length - CAP;
  return [...list.slice(0, CAP), { code: list[0].code, severity: list[0].severity, message: `and ${rest} more like these` }];
}
