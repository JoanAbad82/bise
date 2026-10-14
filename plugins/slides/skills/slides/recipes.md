# Slides recipes

Each block is a whole script for `bise office run`. Paths are examples.

## A short deck from a brief

Plan the slides first, one message each, as a list in the script; then
lay them out. The title of each slide says its point.

```ts
import { slides, run } from "@bise/office";

const deck = await slides.create();
const cover = deck.addSlide({ layout: "title" });
cover.placeholder("title")!.setText("Q3 review");
cover.placeholder("subTitle")!.setText("Sales team · October 2026");

const points = [
  { title: "Revenue rose 4% on Q2", bullets: ["North: +9%, two new accounts", "South: flat", "West: +3% after two flat quarters"] },
  { title: "Churn is the risk for Q4", bullets: ["Three accounts up for renewal in November", "Each one is over 5% of revenue"] },
];
for (const p of points) {
  const s = deck.addSlide({ layout: "title-body" });
  s.placeholder("title")!.setText(p.title);
  s.placeholder("body")!.setText(p.bullets);
}
const end = deck.addSlide({ layout: "title-only" });
end.placeholder("title")!.setText("Next: renewal plan by Nov 4");

console.log(JSON.stringify(deck.check()));
console.log(await run.write("q3-review.pptx", await deck.save(), { artifact: true }));
```

## A chart slide

The title says what the chart shows; the chart takes the room.

```ts
import { slides, run } from "@bise/office";

const deck = await slides.open(await run.read("q3-review.pptx"));
const s = deck.addSlide({ layout: "title-only", at: 3 });
s.placeholder("title")!.setText("North carried the quarter");
const { w, h } = deck.size;
s.addChart({
  type: "column",
  categories: ["North", "South", "West"],
  series: [
    { name: "Q2", values: [410, 300, 220], color: "#afb8c1" },
    { name: "Q3", values: [447, 301, 227], color: "#1f6feb" },
  ],
  legend: "top",
}, [48, 118, w - 96, h - 170]);
s.addText("k€, booked revenue. Source: finance export, Oct 3.", [48, h - 44, 600, 24], { size: 12, color: "#6e7781" });
console.log(JSON.stringify(deck.check()));
console.log(await run.write("q3-review.pptx", await deck.save()));
```

## A table slide

Tables of more than 6 rows or 5 columns do not read on a slide: split
them, or put the full table in a sheet and show the top rows.

```ts
import { slides, run } from "@bise/office";

const deck = await slides.open(await run.read("q3-review.pptx"));
const s = deck.addSlide({ layout: "title-only" });
s.placeholder("title")!.setText("Renewals in November");
s.addTable([
  ["Account", "Revenue share", "Renews", "Owner"],
  ["Acme", "7%", "Nov 4", "Lea"],
  ["Globex", "6%", "Nov 12", "Sam"],
  ["Initech", "5%", "Nov 20", "Lea"],
], [48, 130, 864, 200], { widths: [3, 2, 2, 2], size: 18 });
console.log(JSON.stringify(deck.check()));
console.log(await run.write("q3-review.pptx", await deck.save()));
```

## Edit his deck

Copy it into `$TMPDIR` first if it lives elsewhere, inspect it, then edit
by id. Keep his layouts, fonts and colors: add with the deck's own
placeholders, not with new text boxes in your own style.

```ts
import { slides, run } from "@bise/office";

const deck = await slides.open(await run.read("board.pptx"));
deck.slide(2).shape("Title 1").replace("Q2", "Q3");
deck.at({ kind: "shape", slide: 4, shape: "5" }).replace("4%", "5%");
const old = deck.slide(6);
old.duplicate().placeholder("title")!.setText("Hiring plan, revised");
old.remove();
console.log(JSON.stringify(deck.check()));
console.log(await run.write("board.pptx", await deck.save(), { artifact: true }));
```

## Answer his notes

Paste the `<artifact-notes>` list into the script as it is. A slide note
with a `rect` is about the shapes in that box: `under()` gives them.

```ts
import { slides, run } from "@bise/office";

const notes = [
  { id: "n1", anchor: { kind: "shape", slide: 2, shape: "2", quote: "Q2" }, text: "say Q3, not Q2" },
  { id: "n2", anchor: { kind: "slide", slide: 2, rect: { x: 5, y: 20, w: 45, h: 70 } }, text: "too much text here" },
];
const deck = await slides.open(await run.read("q3-review.pptx"));

deck.at(notes[0].anchor).replace("Q2", "Q3");

const [body] = deck.at(notes[1].anchor).under();     // the shape most under his box
const lines = body.text().split("\n");
body.setText(lines.slice(0, 2));                      // keep two bullets here
const more = deck.slide(2).duplicate();               // the rest on a new slide after it
more.placeholder("title")!.setText("The regions that held");
more.placeholder("body")!.setText(lines.slice(2));

console.log(JSON.stringify(deck.check()));
console.log(await run.write("q3-review.pptx", await deck.save()));
```

Then reply: `n1: slide 2 says Q3. n2: split, the West moved to slide 3.`

## Split a dense slide

`check()` says `overflow`: the text needs more room than its box. Cut
words first; split when every line is needed. Never shrink the font
under 18 pt for body text to make it fit.

```ts
import { slides, run } from "@bise/office";

const deck = await slides.open(await run.read("q3-review.pptx"));
const s = deck.slide(5);
const body = s.placeholder("body")!;
const lines = body.text().split("\n");
const half = Math.ceil(lines.length / 2);
body.setText(lines.slice(0, half));
const next = s.duplicate();
next.placeholder("title")!.setText(s.placeholder("title")!.text() + " (2/2)");
next.placeholder("body")!.setText(lines.slice(half));
console.log(JSON.stringify(deck.check()));
console.log(await run.write("q3-review.pptx", await deck.save()));
```
