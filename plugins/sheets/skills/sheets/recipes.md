# Sheets recipes

Each block is a whole script for `bise office run`. Paths are examples.

## A table from data, with totals

```ts
import { sheets, run } from "@bise/office";

const rows = [
  ["North", 120, 135, 150],
  ["South", 80, 76, 91],
  ["West", 64, 70, 88],
];
const book = await sheets.create({ sheet: "Revenue", rows: [["Region", "Q1", "Q2", "Q3"], ...rows] });
const last = rows.length + 1;                       // the last data row
book.range(`Revenue!A${last + 1}`).set("Total");
for (const col of ["B", "C", "D"]) {
  book.range(`Revenue!${col}${last + 1}`).set(`=SUM(${col}2:${col}${last})`);
}
book.range("Revenue!A1:D1").style({ bold: true, fill: "#f2f2f2", border: "thin" });
book.range(`Revenue!A${last + 1}:D${last + 1}`).style({ bold: true });
book.range(`Revenue!B2:D${last + 1}`).style({ numFmt: "#,##0" });
book.range("Revenue!A1").width(14);
console.log(JSON.stringify(book.check()));
console.log(await run.write("revenue.xlsx", await book.save(), { artifact: true }));
```

## Change cells in a workbook he sent

His file is outside your folders: copy it first (`cp ~/Downloads/plan.xlsx
"$TMPDIR/"`), then inspect it (`bise office inspect "$TMPDIR/plan.xlsx"`) to
learn the sheet names and where the numbers are.

```ts
import { sheets, run } from "@bise/office";

const path = "plan.xlsx";                          // run from $TMPDIR
const book = await sheets.open(await run.read(path));
book.range("Budget!C7").set(42000);
book.range("Budget!C12").set("=SUM(C3:C11)");     // a total someone typed by hand
console.log(JSON.stringify(book.check()));
console.log(await run.write(path, await book.save(), { artifact: true }));
```

Tell him where the new file is: his own copy in Downloads is unchanged.

## A summary sheet that reads the others

```ts
import { sheets, run } from "@bise/office";

const book = await sheets.open(await run.read("revenue.xlsx"));
book.addSheet("Summary", {
  index: 0,
  rows: [
    ["", "Total"],
    ["Q1", "=Revenue!B5"],
    ["Q2", "=Revenue!C5"],
    ["Q3", "=Revenue!D5"],
    ["Growth Q1 to Q3", "=Revenue!D5/Revenue!B5-1"],
  ],
});
book.range("Summary!B2:B4").style({ numFmt: "#,##0" });
book.range("Summary!B5").style({ numFmt: "0.0%" });
book.range("Summary!A1:B1").style({ bold: true });
book.range("Summary!A1").width(18);
console.log(await run.write("revenue.xlsx", await book.save()));
```

## A CSV in

`run.read` gives bytes; `core.decodeUtf8` turns them into text (there is no
`TextDecoder` in the script runner).

```ts
import { sheets, run, core } from "@bise/office";

const text = core.decodeUtf8(await run.read("orders.csv"));
const lines = text.trim().split(/\r?\n/).map((l) => l.split(","));   // no quoted commas in this file
const rows = lines.map((cells, i) =>
  i === 0 ? cells : cells.map((c) => (c !== "" && !isNaN(Number(c)) ? Number(c) : c)),
);
const book = await sheets.create({ sheet: "Orders", rows });
book.range("Orders!A1:Z1").style({ bold: true });
console.log(await run.write("orders.xlsx", await book.save(), { artifact: true }));
```

Numbers go in as numbers (so sums and formats work), not as text. A CSV
with quoted fields needs a real parser: write a small one in the script.

## Answer his notes

The message carries `<artifact-notes artifact="revenue-xlsx" version="3">`
with `[{ "id": "n1", "anchor": {...}, "text": "..." }, ...]`. Paste the
list into the script as it is:

```ts
import { sheets, run } from "@bise/office";

const notes = [
  { id: "n1", anchor: { kind: "cell", sheet: "Revenue", range: "D3" }, text: "this was 95, not 91" },
  { id: "n2", anchor: { kind: "cell", sheet: "Revenue", range: "A1:D1" }, text: "make the header stand out" },
];
const book = await sheets.open(await run.read("revenue.xlsx"));
book.at(notes[0].anchor).set(95);
book.at(notes[1].anchor).style({ bold: true, fill: "#1f2328", color: "#ffffff" });
console.log(JSON.stringify(book.check()));
console.log(await run.write("revenue.xlsx", await book.save()));
```

Then reply: `n1: D3 is 95, the total moved to 312. n2: dark header.`

## Read a range to answer a question

```ts
import { sheets, run } from "@bise/office";

const book = await sheets.open(await run.read("revenue.xlsx"));
console.log(JSON.stringify(book.range("Revenue!A2:D4").values()));
```

No write, no new version. For a quick look at the whole file,
`bise office inspect` is enough.
