// bise office run is bend-jsrt: V8 and deno_core, no web APIs. The bundle
// must work with no TextEncoder/TextDecoder (fflate falls back to its own
// UTF-8): loaded fresh with them gone, a non-ASCII edit round trips.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

test("the bundle runs with no TextEncoder or TextDecoder", async () => {
  const saved = { TextEncoder: globalThis.TextEncoder, TextDecoder: globalThis.TextDecoder };
  delete globalThis.TextEncoder;
  delete globalThis.TextDecoder;
  try {
    const { core, openPackage } = await import(`../../dist/office.js?bare`);
    const bytes = new Uint8Array(readFileSync(join(here, "..", "..", "fixtures", "tiny.docx")));
    const { zip } = openPackage(bytes);
    const doc = core.parseXml(zip.text("word/document.xml"), "word/document.xml");
    core.descendants(doc, core.NS.w, "t")[0].textContent = "Revue T3 — été 🌞";
    zip.set("word/document.xml", core.writeXml(doc));
    const again = core.Zip.read(zip.write()).text("word/document.xml");
    assert.match(again, /Revue T3 — été 🌞/);
  } finally {
    Object.assign(globalThis, saved);
  }
});

test("the SDK's own UTF-8 matches the host's, past U+FFFF and on bad bytes", async () => {
  const { core } = await import("../../dist/office.js");
  for (const s of ["", "plain", "été — 🌞 𝄞 中文", "a\uD800b"]) {
    const want = new TextEncoder().encode(s);
    assert.deepEqual(core.encodeUtf8(s), want, s);
    assert.equal(core.decodeUtf8(want), new TextDecoder().decode(want), s);
  }
  for (const bad of [[0xff], [0xc3], [0xe2, 0x82], [0xed, 0xa0, 0x80], [0xef, 0xbb, 0xbf, 0x41]]) {
    const b = new Uint8Array(bad);
    assert.equal(core.decodeUtf8(b), new TextDecoder().decode(b), JSON.stringify(bad));
  }
});
