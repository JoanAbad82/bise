#!/usr/bin/env python3
"""scripts/desktop_rerun.py's pure parts and its --dry plan, on a fake nightly run dir: reds.txt's
names split (quick rows, test:land specs, the rest said), a row's group from the run's quick.json
or else from the driver's source (escaped quotes, digits as N), the specs found in the run's tree,
no candidate said as gone. Never a real candidate, app or slot."""
import json
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import desktop_rerun as R  # noqa: E402

FAILS = []


def check(ok, what):
    if not ok:
        FAILS.append(what)


SRC = """
async function rowsAAA(harness, say) {
  step('a pinch on the hub\\'s viewer: zooms (±1 px), a % chip', true);
}
async function rowsBBB(harness, say) {
  step("the bar's signs: ✓ done (zqfin), no state word", true);
  step(`marks: ψ text-${n} on a worktree`, true);
}
"""


def main():
    s = R.split_reds(["as-he-does/quick: the bar's signs: ✓ done (zqfin), no state word", "row-slide",
                      "as-he-does/full: cut: x", "desktop/dmg", "", "as-he-does/quick: gate breach"])
    check(s["quick"] == ["the bar's signs: ✓ done (zqfin), no state word", "gate breach"], "split quick %s" % s)
    check(s["land"] == ["row-slide"], "split land %s" % s)
    check(s["other"] == ["as-he-does/full: cut: x", "desktop/dmg"], "split other %s" % s)

    rows = ["a pinch on the hub's viewer: zooms (±N px), a % chip", "the bar's signs: ✓ done (zqfin), no state word",
            "marks: ψ text-N on a worktree", "never in the source"]
    g = R.groups_from_source(rows, SRC)
    check(g == {rows[0]: "rowsAAA", rows[1]: "rowsBBB", rows[2]: "rowsBBB"}, "source groups %s" % g)
    steps = [{"name": "a pinch on the hub's viewer: zooms (±3 px), a % chip", "ok": False, "group": "rowsAAA"},
             {"name": "the bar's signs: ✓ done (zqfin), no state word", "ok": True}]
    check(R.groups_from_json(rows, steps) == {rows[0]: "rowsAAA"}, "json groups %s" % R.groups_from_json(rows, steps))

    t = os.path.realpath(tempfile.mkdtemp(prefix="desktop-rerun-test-", dir=os.environ.get("TMPDIR")))
    try:
        run, tree, home = os.path.join(t, "run"), os.path.join(t, "tree"), os.path.join(t, "home")
        os.makedirs(os.path.join(run, "quick"))
        os.makedirs(os.path.join(tree, "apps", "desktop", "tests", "checks", "app"))
        open(os.path.join(tree, "apps", "desktop", "tests", "checks", "app", "row-slide.spec.ts"), "w").write("")
        sha = "ab" * 20
        open(os.path.join(run, "summary.txt"), "w").write("nightly desktop: %s in %s, Tue Oct 20 18:26:33 CEST 2026\n" % (sha, tree))
        open(os.path.join(run, "reds.txt"), "w").write(
            "as-he-does/quick: a pinch on the hub's viewer: zooms (±N px), a % chip\nrow-slide\nno-such-spec\ndesktop/dmg\n")
        json.dump({"steps": steps}, open(os.path.join(run, "quick", "quick.json"), "w"))
        check(R.run_facts(run) == (sha, tree), "run facts %s" % (R.run_facts(run),))
        r = subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "desktop_rerun.py"), run, "--dry"],
                           capture_output=True, text=True, env=dict(os.environ, HOME=home))
        o = r.stdout + r.stderr
        plan = json.loads(o[o.index("{"):o.index("\n", o.index("{"))])
        check(r.returncode == 0, "dry: rc %s\n%s" % (r.returncode, o))
        check(plan["groups"] == ["rowsAAA"] and plan["specs"] == ["tests/checks/app/row-slide.spec.ts"] and plan["app"] is None,
              "dry: plan %s" % plan)
        check("no spec no-such-spec.spec.ts" in o and "not rerun by name: desktop/dmg" in o, "dry: said\n" + o)
        r = subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "desktop_rerun.py"), run, "desktop/dmg", "--dry"],
                           capture_output=True, text=True, env=dict(os.environ, HOME=home))
        check(r.returncode == 2 and "nothing to rerun" in r.stdout, "nothing: rc %s %s" % (r.returncode, r.stdout))
    finally:
        shutil.rmtree(t, ignore_errors=True)
    for f in FAILS:
        print("FAIL", f)
    print("desktop_rerun_test: %s" % ("ok" if not FAILS else "%d failed" % len(FAILS)))
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(main())
