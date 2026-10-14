// macOS only, off-screen, not in `pnpm check` (the gate runs on Linux too):
// workbooks the sheets module writes open in Quick Look, the Mac's own
// xlsx reader: one made from scratch (styles, number formats, formulas
// with their values, a merge), the rich workbook (charts, pivot, external
// link, chartsheet) after an edit, and tiny.xlsx after an edit. Each also
// passes checkPackage and check().
//
//   ~/.bise/run/heavy-run --low node --test office/sdk/test/sheets.quicklook.mjs
//   OFFICE_QL_KEEP=<dir> keeps the workbooks and their thumbnails there.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sheets, checkPackage, core } from "../../dist/office.js";
import { richWorkbook } from "./sheets-rich.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const hasQl = process.platform === "darwin" && existsSync("/usr/bin/qlmanage");

const CASES = {
  made: async () => {
    const book = await sheets.create({
      sheet: "Q3 revenue",
      rows: [["Region", "Jul", "Aug", "Sep", "Total"], ["North", 120, 126, 131, "=SUM(B2:D2)"], ["South", 80, 78, 83, "=SUM(B3:D3)"], ["West", 64, 66, 70, "=SUM(B4:D4)"], ["All", "=SUM(B2:B4)", "=SUM(C2:C4)", "=SUM(D2:D4)", "=SUM(E2:E4)"]],
    });
    book.range("A1:E1").style({ bold: true, fill: "#1f6feb", color: "#ffffff", align: "center" });
    book.range("B2:E5").style({ numFmt: '"$"#,##0' });
    book.range("A5:E5").style({ bold: true, border: "thin" });
    book.range("A7:E7").merge().set("Fake numbers, made by the sheets module test").style({ italic: true });
    book.range("A1").width(14);
    return book;
  },
  "rich-edited": async () => {
    const book = await sheets.open((await richWorkbook()).bytes);
    book.range("Q3!B2").set(1300);
    book.range("Q3!A1:B1").style({ bold: true });
    return book;
  },
  "tiny-edited": async () => {
    const book = await sheets.open(new Uint8Array(readFileSync(join(here, "..", "..", "fixtures", "tiny.xlsx"))));
    book.range(`${book.sheetNames[0]}!A3:B3`).set([["added by the SDK", 42]]);
    return book;
  },
};

test("workbooks written by the sheets module open in Quick Look and pass check()", { skip: !hasQl && "needs macOS qlmanage" }, async () => {
  const dir = process.env.OFFICE_QL_KEEP || mkdtempSync(join(process.env.TMPDIR || tmpdir(), "office-ql-"));
  const files = [];
  for (const [name, make] of Object.entries(CASES)) {
    const book = await make();
    assert.deepEqual(book.check(), [], `${name}: check()`);
    const bytes = await book.save();
    assert.deepEqual(checkPackage(core.Zip.read(bytes)), [], `${name}: checkPackage`);
    const file = join(dir, `${name}.xlsx`);
    writeFileSync(file, bytes);
    files.push(file);
  }
  // -t: a thumbnail to a file, no window
  execFileSync("/usr/bin/qlmanage", ["-t", "-s", "800", "-o", dir, ...files], { stdio: "pipe", timeout: 120_000 });
  const thumbs = new Set(readdirSync(dir));
  for (const f of files) {
    const png = `${f.slice(dir.length + 1)}.png`;
    assert.ok(thumbs.has(png), `Quick Look made no thumbnail of ${png.replace(/\.png$/, "")}`);
    assert.ok(statSync(join(dir, png)).size > 2000, `${png} is too small to be a drawn sheet`);
  }
});
