# Docs recipes

Each block is a whole script for `bise office run`. Paths are examples.

## A memo from a brief

Write the headings first, as a list: they are the memo's outline. Then
fill each one in a few short paragraphs.

```ts
import { docs, run } from "@bise/office";

const doc = await docs.create({ title: "Q3 sales memo" });
doc.add({ kind: "title", text: "Q3: revenue up 4%, churn is the risk" });
doc.add({ kind: "para", text: "To the sales team, from Lea. October 14, 2026." });

doc.add({ kind: "heading", text: "What happened", level: 1 });
doc.add({ kind: "para", text: [
  { text: "Revenue reached " }, { text: "975 k€", bold: true },
  { text: ", 4% above Q2. The North signed two new accounts; the South and the West held." },
] });

doc.add({ kind: "heading", text: "The numbers", level: 1 });
doc.add({ kind: "table", rows: [
  ["Region", "Q2 (k€)", "Q3 (k€)", "Change"],
  ["North", "410", "447", "+9%"],
  ["South", "300", "301", "0%"],
  ["West", "220", "227", "+3%"],
], widths: [3, 2, 2, 2] });

doc.add({ kind: "heading", text: "What we do next", level: 1 });
doc.add({ kind: "numbered", text: "Renewal plan for Acme, Globex and Initech by November 4" });
doc.add({ kind: "numbered", text: "Weekly churn review from November 1" });

console.log(JSON.stringify(doc.check()));
console.log(await run.write("q3-memo.docx", await doc.save(), { artifact: true }));
```

## Edit his document, as tracked changes

His file: `cp` it into `$TMPDIR`, inspect it, then edit by id with
tracking on. He accepts or rejects each change in Word.

```ts
import { docs, run } from "@bise/office";

const path = "contract.docx";                       // run from $TMPDIR
const doc = await docs.open(await run.read(path), { author: "bise" });
doc.tracking = true;

for (const a of doc.find("30 days")) doc.at(a).replace("30 days", "45 days");
const [term] = doc.find(/terminate this agreement/);
doc.at(term).comment("45 days matches the notice period in section 2");
doc.add({ kind: "para", text: "Either party may ask for a review after twelve months." }, { after: term });

console.log(JSON.stringify(doc.changes.list().map((c) => [c.kind, c.text])));
console.log(JSON.stringify(doc.check()));                // open_changes is expected here: he reviews them
console.log(await run.write(path, await doc.save(), { artifact: true }));
```

Say in your reply that the changes are tracked and that `open_changes` is
on purpose.

## A section after a heading

```ts
import { docs, run } from "@bise/office";

const doc = await docs.open(await run.read("q3-memo.docx"));
const heading = doc.inspect().nodes.find((n) => n.text === "What happened")!;
const p = doc.add({ kind: "heading", text: "Risks", level: 1 }, { after: heading.anchor });
p.add({ kind: "para", text: "Three accounts renew in November; each is over 5% of revenue." });
console.log(JSON.stringify(doc.check()));
console.log(await run.write("q3-memo.docx", await doc.save()));
```

`add` after a heading puts the block right under it, before that
section's text. To add at the end of a section, anchor on its last
paragraph.

## A row in a table

```ts
import { docs, run } from "@bise/office";

const doc = await docs.open(await run.read("q3-memo.docx"));
const table = doc.inspect().nodes.find((n) => n.type === "table")!;
const t = doc.table(table.anchor);
t.addRow(["East", "0", "45", "new"]);
t.setCell(1, 2, "Q2 (k€, restated)");
console.log(JSON.stringify(t.rows));
console.log(await run.write("q3-memo.docx", await doc.save()));
```

## Answer his notes

Paste the `<artifact-notes>` list into the script as it is.

```ts
import { docs, run } from "@bise/office";

const notes = [
  { id: "n1", anchor: { kind: "para", para: "7A6F1A11", quote: "975 k€" }, text: "it was 978" },
  { id: "n2", anchor: { kind: "para", para: "03AD9EFC", quote: "Weekly churn review" }, text: "make this bold" },
  { id: "n3", anchor: { kind: "para", para: "2B11C0DE", quote: "renew in November" }, text: "cut this paragraph" },
];
const doc = await docs.open(await run.read("q3-memo.docx"));

doc.at(notes[0].anchor).replace("975 k€", "978 k€");
doc.at(notes[1].anchor).format({ bold: true });          // the quote only
doc.at(notes[2].anchor).remove();

console.log(JSON.stringify(doc.check()));
console.log(await run.write("q3-memo.docx", await doc.save()));
```

Then reply: `n1: 978 k€. n2: bold. n3: cut.` If a number you changed
moves others (a total, a share in the title), change them too and say
which.

If he wrote the document, keep his words: change what the note asks and
nothing around it, and track it (`doc.tracking = true`) unless he said
not to.

## One term, everywhere

```ts
import { docs, run } from "@bise/office";

const doc = await docs.open(await run.read("handbook.docx"));
const n = doc.replaceAll(/\bclient(s?)\b/g, "customer$1", { track: true });
console.log(`${n} replaced`);
console.log(await run.write("handbook.docx", await doc.save(), { artifact: true }));
```

Read a few hits first (`doc.find(...)`): a blind replace changes quotes,
names and titles too.
