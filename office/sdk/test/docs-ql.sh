#!/usr/bin/env bash
# The docs module's off-screen check (architect m_23761): a docx made by
# docs.create() (every kind of block, a comment, a tracked change) and
# tiny.docx edited and saved pass checkPackage + check(), and Quick Look
# renders each to a thumbnail (qlmanage -t: no window, nothing on screen).
# macOS only; run it under the heavy lock:
#   ~/.bise/run/heavy-run --low office/sdk/test/docs-ql.sh [out-dir]
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
out="${1:-${TMPDIR:-/tmp}/docs-ql}"
rm -rf "$out" && mkdir -p "$out"
command -v qlmanage >/dev/null || { echo "FAIL docs-ql: no qlmanage (macOS only)"; exit 1; }

# a file, not a heredoc to node: its imports resolve by absolute path
cat > "$out/make.mjs" <<EOF
import { writeFileSync, readFileSync } from "node:fs";
import { docs, checkPackage, core } from "$here/../../dist/office.js";
import { sample } from "$here/docs-sample.mjs";
const out = process.argv[2];
const made = await sample();
const tiny = await docs.open(new Uint8Array(readFileSync("$here/../../fixtures/tiny.docx")));
tiny.at({ kind: "para", para: "10000002", quote: "4%" }).comment("Source?");
tiny.at({ kind: "para", para: "10000002" }).replace("4%", "5%", { track: true });
tiny.table({ kind: "para", para: "10000003" }).addRow(["South", "80"]);
let bad = 0;
for (const [name, doc] of [["created.docx", made], ["edited.docx", tiny]]) {
  const bytes = await doc.save();
  writeFileSync(out + "/" + name, bytes);
  const pkg = checkPackage(core.Zip.read(bytes));
  const problems = (await docs.open(bytes)).check().filter((p) => p.code !== "open_changes");
  console.log(name, bytes.length, "bytes;", "checkPackage:", pkg.length, "check:", problems.length);
  for (const p of [...pkg, ...problems]) console.log("  ", p.code, p.message);
  bad += pkg.length + problems.length;
}
process.exit(bad ? 1 : 0);
EOF
node "$out/make.mjs" "$out"

fail=0
for f in created edited; do
  qlmanage -t -s 1024 -o "$out" "$out/$f.docx" >"$out/$f.ql.log" 2>&1 || true
  png="$out/$f.docx.png"
  if [ -s "$png" ] && [ "$(wc -c <"$png")" -gt 2000 ]; then
    echo "ok   $f.docx: Quick Look rendered $png ($(wc -c <"$png" | tr -d ' ') bytes)"
  else
    echo "FAIL $f.docx: Quick Look made no thumbnail ($(tail -1 "$out/$f.ql.log"))"
    fail=1
  fi
done
exit $fail
