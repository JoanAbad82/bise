// The sheets module where bise office run puts it: V8 alone. The bundle
// runs in a fresh vm context that has only JavaScript's own globals (no
// setTimeout, setImmediate, Buffer, process, TextEncoder/TextDecoder,
// crypto): create, save, open, edit a workbook with charts and pivots, save
// again. Every module build.ts stubs throws when used, so a run that ends
// well proves the open and save paths never touch one (architect m_23798);
// the second test shows each stub does throw, with its words.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { transformSync } from "esbuild";
import { sheets } from "../../dist/office.js";
import { richWorkbook } from "./sheets-rich.ts";

const here = dirname(fileURLToPath(import.meta.url));
const bundle = readFileSync(join(here, "..", "..", "dist", "office.js"), "utf8");

function bareContext() {
  const { code } = transformSync(bundle, { format: "iife", globalName: "office", target: "es2022" });
  const ctx = vm.createContext({});
  const missing = vm.runInContext(
    `["setTimeout","setImmediate","setInterval","queueMicrotask","Buffer","process","TextEncoder","TextDecoder","crypto","global","atob"].filter((n) => n in globalThis)`,
    ctx,
  );
  assert.deepEqual(Array.from(missing), [], "the context must have no host globals");
  vm.runInContext(code, ctx);
  return ctx;
}

test("in V8 alone: create, save, open a workbook with charts and pivots, edit, save, reopen", async () => {
  const { bytes } = await richWorkbook();
  const ctx = bareContext();
  ctx.input = bytes;
  const out = await vm.runInContext(
    `(async () => {
      const { sheets, core } = office;
      const made = await sheets.create({ sheet: "Été 🌞", rows: [["a", 1], ["b", 2], ["sum", "=SUM(B1:B2)"]], date: new Date(0) });
      made.range("A1:B1").style({ bold: true, fill: "#ffeeaa", numFmt: "0.00" });
      made.exceljs.getWorksheet(1).addConditionalFormatting({ ref: "B1:B2", rules: [{ type: "dataBar", cfvo: [{ type: "min" }, { type: "max" }], color: { argb: "FF638EC6" } }] });
      const first = await made.save();
      const back = await sheets.open(first);
      const rich = await sheets.open(new Uint8Array(input));
      rich.range("Q3!B2").set(999);
      rich.addSheet("New", { rows: [["=Q3!B2*2"]] });
      const saved = await rich.save();
      const again = await sheets.open(saved);
      return {
        sum: back.range("'Été 🌞'!B3").values()[0][0],
        bold: back.inspect().nodes[0].children[0].props.bold,
        doubled: again.range("New!A1").values()[0][0],
        charts: again.inspect().nodes.find((n) => n.name === "Q3").props.charts.length,
        kept: core.Zip.read(saved).has("xl/pivotTables/pivotTable1.xml"),
        problems: again.check().length,
      };
    })()`,
    ctx,
  );
  assert.deepEqual({ ...out }, { sum: 3, bold: true, doubled: 1998, charts: 1, kept: true, problems: 0 });
});

test("each stubbed module throws its own words when something uses it", async () => {
  const words = [...bundle.matchAll(/"office: ([^ ]+) is not available \(/g)].map((m) => m[1]);
  assert.deepEqual(words.sort(), ["../csv/csv", "../utils/encryptor", "../xlsx/xlsx", "fs", "readable-stream"].sort());
  const book = await sheets.create();
  const x = book.exceljs;
  assert.throws(() => x.xlsx.writeBuffer(), /office: \.\.\/xlsx\/xlsx is not available/);
  assert.throws(() => x.csv.writeBuffer(), /office: \.\.\/csv\/csv is not available/);
  await assert.rejects(async () => x.getWorksheet(1)?.protect("secret", {}), /office: \.\.\/utils\/encryptor is not available/);
});
