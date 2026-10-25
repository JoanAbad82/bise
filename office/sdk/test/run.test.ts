// run.read/run.write go through the host; no host is a clear refusal; the
// modules not built yet say so.

import { test } from "node:test";
import assert from "node:assert/strict";
import { run, setHost, sheets, slides, docs, OfficeError } from "../../dist/office.js";

test("no host: refused with what to do", async () => {
  setHost(undefined);
  await assert.rejects(() => run.read("a.xlsx"), (e) => e instanceof OfficeError && e.code === "no_host" && /bise office run/.test(e.message));
});

test("a host gets the reads and writes, with the options", async () => {
  const files = new Map<string, Uint8Array>([["in.docx", new Uint8Array([1, 2])]]);
  const seen: [string, unknown][] = [];
  setHost({
    read: async (p) => {
      const b = files.get(p);
      if (!b) throw new Error(`no file ${p}`);
      return b;
    },
    write: async (p, b, o) => {
      files.set(p, b);
      seen.push([p, o]);
    },
  });
  const b = await run.read("in.docx");
  await run.write("out.docx", b, { artifact: true });
  assert.deepEqual(files.get("out.docx"), new Uint8Array([1, 2]));
  assert.deepEqual(seen, [["out.docx", { artifact: true }]]);
  setHost(undefined);
});

test("the modules not built yet say so; a built one refuses bytes that are not a file", async () => {
  for (const m of [sheets, slides, docs]) await assert.rejects(() => m.open(new Uint8Array()), (e) => e instanceof OfficeError && (e.code === "not_built" || e.code === "not_a_zip"));
});
