#!/usr/bin/env python3
"""The office skills' scripts run (plugins/{sheets,slides,docs}, docs/office.md).

Every ```ts block of a skill that is a whole script (it starts with an
import, or with the `// $TMPDIR/…` line of a quick start) runs through the
real `bise office run`, in the order of SKILL.md, recipes.md, comments.md,
in one folder per plugin seeded with fake files (made by `bise office run`
too, below: no node). A block that throws is red: the skill teaches a
call the SDK no longer has, or a shape it no longer takes. So a change of
the SDK's API breaks this check, not an agent in front of the user.

No hub: SB_SOCKET is dropped, so run.write only writes.

  tests/office_skills_check.py          no bise or bend-jsrt built: says "skipped", exit 0
  tests/office_skills_check.py strict   the same: exit 1
gate.sh quick runs it when plugins/{sheets,slides,docs}, office/ or
rust/jsrt/ changed (architect m_23951), gate.sh full every time (strict).
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLUGINS = ("sheets", "slides", "docs")
FILES = ("SKILL.md", "recipes.md", "comments.md")

# the fake files the recipes open, by plugin (all fake data)
SEED = r'''
import { sheets, slides, docs, run, core } from "@bise/office";
const plugin = "__PLUGIN__";
if (plugin === "sheets") {
  const q3 = await sheets.create({ sheet: "Q3", rows: [["Item", "Amount"], ["a", 1000], ["b", 1200], ["c", 900], ["d", 700]] });
  await run.write("q3.xlsx", await q3.save());
  const rows = [["Budget"], ["Line", "", "Amount"]];
  for (let i = 3; i <= 11; i++) rows.push([`line ${i}`, "", i * 1000]);
  const plan = await sheets.create({ sheet: "Budget", rows });
  plan.range("Budget!C12").set(99999);
  await run.write("plan.xlsx", await plan.save());
  await run.write("orders.csv", core.encodeUtf8("Order,Customer,Amount\n1001,Acme,1200\n1002,Globex,850.5\n"));
}
if (plugin === "slides") {
  const d = await slides.create();
  for (let i = 1; i <= 7; i++) {
    const s = d.addSlide({ layout: "title-body" });
    s.placeholder("title")!.setText(i === 2 ? "Q2 results" : `Slide ${i}`);
    s.placeholder("body")!.setText(["one", "two"]);
    if (i === 4) {                       // shape 5 holds "4%" (recipes: Edit his deck)
      s.placeholder("body")!.remove();
      s.addText("left", [48, 120, 400, 60]);
      s.addText("right", [500, 120, 400, 60]);
      s.addText("Growth was 4% this year", [48, 200, 600, 60]);
    }
  }
  await run.write("board.pptx", await d.save());
}
if (plugin === "docs") {
  const c = await docs.create({ title: "contract", author: "Supplier" });
  c.add({ kind: "title", text: "Services agreement" });
  c.add({ kind: "para", text: "Payment is due within 30 days of the invoice." });
  c.add({ kind: "para", text: "Either party may terminate this agreement with 30 days notice." });
  await run.write("contract.docx", await c.save());
  const h = await docs.create({ title: "handbook" });
  h.add({ kind: "para", text: "Every client gets a reply within a day. Our clients come first." });
  await run.write("handbook.docx", await h.save());
}
'''


def bise_bin():
    target = os.environ.get("CARGO_TARGET_DIR") or os.path.join(ROOT, "rust", "target")
    p = os.path.join(target, "debug", "bise")
    return p if os.path.exists(p) else None


def jsrt_bin():
    """where `bise office` finds it in a dev tree (rust/harness/src/approot.rs jsrt_bin)"""
    for rel in ("rust/jsrt/target/debug/bend-jsrt", "rust/jsrt/target/release/bend-jsrt"):
        if os.path.exists(os.path.join(ROOT, rel)):
            return rel
    return os.environ.get("BEND_JSRT_BIN") or None


def blocks(plugin):
    """[(file, script)] of a plugin's skill, in reading order"""
    out = []
    for f in FILES:
        p = os.path.join(ROOT, "plugins", plugin, "skills", plugin, f)
        if os.path.exists(p):
            for b in re.findall(r"```ts\n(.*?)```", open(p).read(), re.S):
                if b.startswith("import ") or b.startswith("// $TMPDIR/"):
                    out.append((f, b))
    return out


def main():
    strict = sys.argv[1:] == ["strict"]
    exe, miss = bise_bin(), None
    if exe and not jsrt_bin() and strict:
        # a fresh gate tree has no rust/jsrt build: the engine of these
        # sources from bins.sh's cache (built on a miss, ~1 min warm)
        r = subprocess.run([os.path.join(ROOT, "scripts", "bins.sh"), "path", "bend-jsrt"], cwd=ROOT,
                           capture_output=True, text=True)
        path = r.stdout.strip().splitlines()[-1] if r.returncode == 0 and r.stdout.strip() else ""
        if path and os.path.exists(path):
            os.environ["BEND_JSRT_BIN"] = path
    if not exe:
        miss = "no bise built (cd rust && cargo build)"
    elif not jsrt_bin():
        miss = "no bend-jsrt built (cargo build --manifest-path rust/jsrt/Cargo.toml)"
    if miss:
        print(("FAIL" if strict else "skipped") + " office_skills: " + miss)
        return 1 if strict else 0
    env = {k: v for k, v in os.environ.items() if k not in ("SB_SOCKET", "SB_AGENT", "BEND_WORKDIR")}
    tmp = tempfile.mkdtemp(prefix="office-skills-")
    fails, n = [], 0
    try:
        for plugin in PLUGINS:
            d = os.path.join(tmp, plugin)
            os.makedirs(d)
            todo = [("seed", SEED.replace("__PLUGIN__", plugin))] + blocks(plugin)
            if len(todo) < 3:
                fails.append("%s: fewer than 2 scripts in its skill: did the files move?" % plugin)
            for i, (f, script) in enumerate(todo):
                path = os.path.join(d, "s%02d.ts" % i)
                open(path, "w").write(script)
                r = subprocess.run([exe, "office", "run", path], cwd=d, env=env, capture_output=True, text=True, timeout=300)
                n += 1
                first = script.splitlines()[1 if script.startswith("//") else 2][:70] if script.count("\n") > 2 else ""
                if r.returncode != 0:
                    fails.append("%s/%s script %d (%s): %s" % (plugin, f, i, first, (r.stderr or r.stdout).strip()[:500]))
                    print("FAIL %s/%s script %d" % (plugin, f, i), flush=True)
                else:
                    print("ok   %s/%s script %d" % (plugin, f, i), flush=True)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    for f in fails:
        print("FAIL", f)
    print("%d of %d skill scripts failed" % (len(fails), n) if fails else "PASS office_skills: %d scripts" % n)
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
