// What the bundle gives exceljs for `require("uuid")` (build.ts REPLACED):
// exceljs names its conditional-formatting extensions with a v4 uuid. Ours
// counts from a seed reset on each save, so the same workbook saves to the
// same bytes, and needs no crypto.getRandomValues (bise office run has none).

let n = 0;

/** Called by io.ts at the start of each save. */
export function resetIds(): void {
  n = 0;
}

/** A uuid-shaped id, `{00000000-0000-4000-8000-00000000000n}` style, the next one. */
export function v4(): string {
  n += 1;
  const tail = n.toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${tail}`.toUpperCase();
}
