// macOS only, off-screen, not in `pnpm check` (the gate runs on Linux too):
// decks made by the slides module open in Quick Look, the Mac's own pptx
// reader. One deck per thing, so each is on its first slide (the one
// `qlmanage -t` draws): each layout of our template, a table, an image,
// each chart kind, and tiny.pptx edited. Each deck also passes checkPackage
// and check().
//
//   ~/.bise/run/heavy-run --low node --test office/sdk/test/slides.quicklook.mjs
//   OFFICE_QL_KEEP=<dir> keeps the decks and their thumbnails there.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { slides, checkPackage, core } from "../../dist/office.js";

const here = dirname(fileURLToPath(import.meta.url));

const PNG = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));
const hasQl = process.platform === "darwin" && existsSync("/usr/bin/qlmanage");

/** One deck per case: its first slide shows the thing. */
const CASES = {
  "layout-title": (d) => {
    const s = d.addSlide({ layout: "title" });
    s.placeholder("title").setText("Fake Co");
    s.placeholder("subTitle").setText("Quarterly review");
  },
  "layout-title-body": (d) => {
    const s = d.addSlide({ layout: "title-body" });
    s.placeholder("title").setText("Where we are");
    s.placeholder("body").setText([{ text: "Revenue up 4%" }, { text: "North leads", level: 2 }, { text: "Costs flat" }]);
  },
  "layout-two-content": (d) => {
    const s = d.addSlide({ layout: "two-content" });
    s.placeholder("title").setText("Two sides");
    const [, left, right] = s.shapes();
    left.setText("Left: what went well");
    right.setText("Right: what did not");
  },
  "layout-section": (d) => {
    const s = d.addSlide({ layout: "section" });
    s.placeholder("title").setText("Part two");
    s.placeholder("body").setText("The plan for Q4");
  },
  "layout-title-only": (d) => d.addSlide({ layout: "title-only" }).placeholder("title").setText("Only a title"),
  "layout-blank": (d) => d.addSlide({ layout: "blank" }).addShape("roundRect", [330, 220, 300, 100], { text: "Ship it", style: { size: 28, bold: true } }),
  table: (d) => {
    const s = d.addSlide({ layout: "title-only" });
    s.placeholder("title").setText("By region");
    s.addTable([["Region", "Revenue", "Change"], ["North", "120", "+6%"], ["South", "80", "-2%"], ["West", "64", "+1%"]], [48, 130, 864, 240]);
  },
  image: (d) => {
    const s = d.addSlide({ layout: "title-only" });
    s.placeholder("title").setText("A picture");
    s.addImage(PNG, [380, 140, 200, 200], { alt: "a one-pixel test image" });
  },
  ...Object.fromEntries(
    ["column", "bar", "line", "pie"].map((type) => [
      `chart-${type}`,
      (d) => {
        const s = d.addSlide({ layout: "title-only" });
        s.placeholder("title").setText(`A ${type} chart`);
        const series = type === "pie" ? [{ name: "Share", values: [50, 30, 20] }] : [{ name: "North", values: [40, 42, 45] }, { name: "South", values: [30, 28, 33] }];
        s.addChart({ type, title: `Revenue (${type})`, categories: ["Jul", "Aug", "Sep"], series }, [48, 120, 864, 390]);
      },
    ]),
  ),
};

test("decks made by the slides module open in Quick Look and pass check()", { skip: !hasQl && "needs macOS qlmanage" }, async () => {
  const dir = process.env.OFFICE_QL_KEEP || mkdtempSync(join(process.env.TMPDIR || tmpdir(), "office-ql-"));
  const files = [];
  const cases = { ...CASES, "edited-fixture": null };
  for (const [name, make] of Object.entries(cases)) {
    // the fixture edited: a word replaced, a chart added on its first slide
    const deck = make ? await slides.create() : await slides.open(new Uint8Array(readFileSync(join(here, "..", "..", "fixtures", "tiny.pptx"))));
    if (make) make(deck);
    else {
      deck.at({ kind: "shape", slide: 1, shape: "3" }).replace("4%", "5%").move({ w: 400 });
      deck.slide(1).addChart({ type: "column", categories: ["Q2", "Q3"], series: [{ name: "Revenue", values: [100, 105] }] }, [480, 144, 432, 288]);
    }
    assert.deepEqual(deck.check(), [], `${name}: check()`);
    const bytes = await deck.save();
    assert.deepEqual(checkPackage(core.Zip.read(bytes)), [], `${name}: checkPackage`);
    const file = join(dir, `${name}.pptx`);
    writeFileSync(file, bytes);
    files.push(file);
  }
  // -t: a thumbnail to a file, no window
  execFileSync("/usr/bin/qlmanage", ["-t", "-s", "800", "-o", dir, ...files], { stdio: "pipe", timeout: 120_000 });
  const thumbs = new Set(readdirSync(dir));
  for (const f of files) {
    const png = `${f.slice(dir.length + 1)}.png`;
    assert.ok(thumbs.has(png), `Quick Look made no thumbnail of ${png.replace(/\.png$/, "")}`);
    assert.ok(statSync(join(dir, png)).size > 2000, `${png} is too small to be a drawn slide`);
  }
});
