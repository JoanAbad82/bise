#!/usr/bin/env python3
"""Reruns named desktop reds of a nightly desktop run on the candidate it built (fast-loop, his
« elle ne devrait pas mettre plus que 4min max »): no rebuild, no whole pass.

  scripts/desktop_rerun.py <nightly out dir> [<red name>...] [--prio] [--dry]

<nightly out dir>: a scripts/nightly_desktop.sh out dir (its summary.txt names the sha and the tree,
its reds.txt the reds). No red named: every red of reds.txt. A red is named as reds.txt says it:
  'as-he-does/quick: <row>'  that row again, in the quick pass's world, with only its row group
                             (seed included): cand.sh with AS_HE_DOES_ONLY=quick,
                             AS_HE_DOES_ROWS_FILE (the rows) and AS_HE_DOES_GROUPS (their groups).
                             The group of a row: the run's quick.json `group` field, else the
                             driver function whose source holds the row's words.
  '<spec>' (test:land's)     apps/desktop/tests/checks/**/<spec>.spec.ts with Playwright, in the
                             run's tree (its out/ build), at the same time as the rows.
  'as-he-does/full: …', 'desktop/<step>'
                             not rerun by name: said, with the command that reruns them.
The candidate: <build>/desktop-cand/<sha12>, kept by the nightly (scripts/nightly_desktop.sh);
gone: built again (desktop-try.sh --candidate, ~10 min, said). Each job runs through heavy-run,
--land rank (--prio: the user's release). Out: <run>/rerun-<stamp>/ (quick/, land.json,
summary.txt). Exit 0 every named red green, 1 a red left, 2 nothing to run or a usage error.
Tests: tests/desktop_rerun_test.py (the pure parts: names, groups, plan)."""
import glob
import json
import os
import re
import subprocess
import sys
import time

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DRIVER = os.path.join("dev", "plugins", "ambient-qa", "as-he-does")
QUICK, FULL = "as-he-does/quick: ", "as-he-does/full: "


def as_n(s):
    """digits as N, the way reds.txt names a step (a card's number changes each run)"""
    return re.sub(r"\d+", "N", s)


def run_facts(run):
    """(sha, tree) from summary.txt's first line: 'nightly desktop: <sha> in <tree>, <date>'"""
    first = open(os.path.join(run, "summary.txt")).readline()
    m = re.match(r"nightly desktop: ([0-9a-f]{40}) in (.+?), \w{3} \w{3} ", first)
    if not m:
        raise SystemExit("desktop_rerun: no 'nightly desktop: <sha> in <tree>' line in %s/summary.txt" % run)
    return m.group(1), m.group(2)


def split_reds(names):
    """{'quick': [row...], 'land': [spec...], 'other': [name...]}"""
    out = {"quick": [], "land": [], "other": []}
    for n in names:
        n = n.strip()
        if not n:
            continue
        if n.startswith(QUICK):
            out["quick"].append(n[len(QUICK):])
        elif n.startswith(FULL) or n.startswith("desktop/") or n.startswith("as-he-does/"):
            out["other"].append(n)
        else:
            out["land"].append(n)
    return out


def groups_from_json(rows, steps):
    """{row: group} for the rows whose step in a quick.json carries its group"""
    found = {}
    for s in steps:
        g, name = s.get("group"), s.get("name") or ""
        if not g:
            continue
        for r in rows:
            if as_n(name).startswith(as_n(r)) or as_n(r).startswith(as_n(name)):
                found.setdefault(r, g)
    return found


def groups_from_source(rows, src):
    """{row: group}: the `async function rowsX(` whose body holds the row's first words (up to its
    first N, at least 12 chars), for runs before quick.json had `group`"""
    src = src.replace("\\'", "'").replace('\\"', '"')  # a step's words as they show, not escaped
    heads = [(m.start(), m.group(1)) for m in re.finditer(r"^async function (\w+)\(", src, re.M)]
    found = {}
    for r in rows:
        key = re.split(r"N", r, maxsplit=1)[0]
        key = key[:60]
        if len(key) < 12:
            continue
        at = src.find(key)
        if at < 0:
            continue
        owner = [g for start, g in heads if start < at]
        if owner:
            found[r] = owner[-1]
    return found


def row_names(rows, src):
    """{red: the name of the driver's `row('<name>', …)` that holds its step}: AS_HE_DOES_ROWS_FILE
    picks rows by that name, not the step's words (70f939beb's first rerun ran the seed of rows233B
    and none of its 3 reds: their steps sit inside row('agents bar', …)). A step in no row (a group
    with no row gate, rows25's) runs with its group."""
    src = src.replace("\\'", "'").replace('\\"', '"')
    heads = [m.start() for m in re.finditer(r"^async function (\w+)\(", src, re.M)]
    calls = [(m.start(), m.group(2)) for m in re.finditer(r"await row\((['\"`])(.*?)\1", src)]
    found = {}
    for r in rows:
        key = re.split(r"N", r, maxsplit=1)[0][:60]
        at = src.find(key) if len(key) >= 12 else -1
        if at < 0:
            continue
        top = max([h for h in heads if h < at] or [0])
        mine = [n for c, n in calls if top < c < at]
        if mine:
            found[r] = mine[-1]
    return found


def spec_files(tree, names):
    """{name: path} for test:land names (basename of a checks/**/<name>.spec.ts)"""
    found = {}
    for n in names:
        hits = glob.glob(os.path.join(tree, "apps", "desktop", "tests", "checks", "**", n + ".spec.ts"), recursive=True)
        if hits:
            found[n] = os.path.relpath(hits[0], os.path.join(tree, "apps", "desktop"))
    return found


def candidate_app(sha, home):
    """the kept candidate's app for `sha`, or None"""
    d = os.path.join(home, ".bise", "dev", "build", "desktop-cand", sha[:12])
    try:
        j = json.load(open(os.path.join(d, "cand.json")))
    except (OSError, ValueError):
        return None
    return j.get("app") if j.get("app") and os.path.isdir(j["app"]) else None


def say(*a):
    print("desktop_rerun:", *a, flush=True)


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    prio, dry = "--prio" in argv, "--dry" in argv
    if not args:
        print(__doc__)
        return 2
    run = os.path.abspath(args[0])
    sha, tree = run_facts(run)
    names = args[1:] or open(os.path.join(run, "reds.txt")).read().splitlines()
    reds = split_reds(names)
    home = os.path.expanduser("~")
    t0 = time.time()
    out = os.path.join(run, "rerun-" + time.strftime("%Y%m%d-%H%M%S"))
    heavy = [os.path.join(home, ".bise", "run", "heavy-run"), "--prio" if prio else "--land"]
    for o in reds["other"]:
        say("not rerun by name: %s (a whole pass: scripts/nightly_desktop.sh <out> %s)" % (o, sha[:12]))

    # the rows' groups: the run's quick.json, else the driver's source
    rows, groups = reds["quick"], {}
    if rows:
        try:
            groups = groups_from_json(rows, json.load(open(os.path.join(run, "quick", "quick.json")))["steps"])
        except (OSError, ValueError, KeyError):
            groups = {}
        driver_dir = os.path.join(REPO, DRIVER)
        left = [r for r in rows if r not in groups]
        if left:
            groups.update(groups_from_source(left, open(os.path.join(driver_dir, "driver.ts")).read()))
        if any(r not in groups for r in rows):
            say("no group found for %s: every group runs (slower)" % [r for r in rows if r not in groups])
            groups = {}
    specs = spec_files(tree, reds["land"])
    for n in reds["land"]:
        if n not in specs:
            say("no spec %s.spec.ts in %s: skipped" % (n, tree))
    if not rows and not specs:
        say("nothing to rerun")
        return 2

    app = candidate_app(sha, home) if rows else None
    plan = {"sha": sha, "tree": tree, "rows": rows, "groups": sorted(set(groups.values())), "specs": sorted(specs.values()),
            "app": app, "out": out}
    say(json.dumps(plan))
    if dry:
        return 0
    os.makedirs(out, exist_ok=True)
    jobs = []
    if rows:
        if not app:
            say("candidate %s is gone: building it again (~10 min)" % sha[:8])
            r = subprocess.run(["bash", os.path.join(REPO, "scripts", "desktop-try.sh"), "--candidate", sha], capture_output=True, text=True)
            app = candidate_app(sha, home)
            if not app:
                say("the candidate build failed: %s" % r.stdout[-400:])
                return 1
        # the rows file: each red's step words and the row() that holds it (the driver's gate)
        named = row_names(rows, open(os.path.join(REPO, DRIVER, "driver.ts")).read())
        with open(os.path.join(out, "rows.txt"), "w") as f:
            f.write("".join(r + "\n" for r in rows) + "".join(n + "\n" for n in sorted(set(named.values()))))
        env = dict(os.environ, AS_HE_DOES_ONLY="quick", AS_HE_DOES_ROWS_FILE=os.path.join(out, "rows.txt"),
                   PW_FROM=os.path.join(tree, "apps", "desktop"))
        if groups:
            env["AS_HE_DOES_GROUPS"] = ",".join(sorted(set(groups.values())))
        log = open(os.path.join(out, "quick.log"), "w")
        jobs.append(("quick", subprocess.Popen(heavy + ["bash", os.path.join(REPO, DRIVER, "cand.sh"), os.path.join(out, "quick"), app],
                                               env=env, stdout=log, stderr=subprocess.STDOUT)))
    if specs:
        desk = os.path.join(tree, "apps", "desktop")
        env = dict(os.environ, PLAYWRIGHT_JSON_OUTPUT_NAME=os.path.join(out, "land.json"))
        log = open(os.path.join(out, "land.log"), "w")
        jobs.append(("land", subprocess.Popen(heavy + [os.path.join(desk, "node_modules", ".bin", "playwright"), "test", "-c",
                                                       os.path.join(desk, "tests", "harness", "playwright.config.ts"),
                                                       "--reporter=list,json"] + sorted(specs.values()),
                                              cwd=desk, env=env, stdout=log, stderr=subprocess.STDOUT)))
    rcs = {n: p.wait() for n, p in jobs}

    # each named red: green or red again
    verdict, lines = 0, []
    if rows:
        try:
            steps = json.load(open(os.path.join(out, "quick", "quick.json")))["steps"]
        except (OSError, ValueError, KeyError):
            steps = []
        for r in rows:
            mine = [s for s in steps if as_n(s.get("name", "")).startswith(as_n(r)) or as_n(r).startswith(as_n(s.get("name", "")))]
            ok = bool(mine) and all(s.get("ok") for s in mine)
            verdict |= not ok
            lines.append("%s %s%s" % ("green" if ok else "RED", QUICK, r[:120] + ("" if mine else " (did not run)")))
        if rcs.get("quick") not in (0, 1):
            verdict = 1
            lines.append("RED as-he-does/quick: cand.sh exit %s (%s/quick.log)" % (rcs.get("quick"), out))
    if specs:
        red = set()
        try:
            data = json.load(open(os.path.join(out, "land.json")))

            def walk(suite):
                for spec in suite.get("specs", []):
                    if any(t.get("status") not in ("expected", "skipped", "flaky") for t in spec.get("tests", [])):
                        red.add(os.path.basename(spec.get("file") or suite.get("file") or "").replace(".spec.ts", ""))
                for s in suite.get("suites", []):
                    walk(s)
            for s in data.get("suites", []):
                walk(s)
        except (OSError, ValueError):
            red = set(specs) if rcs.get("land") else set()
        for n in sorted(specs):
            verdict |= n in red
            lines.append("%s %s" % ("RED" if n in red else "green", n))
    if rows:
        lines.append("groups run: %s (a group alone can differ from the whole pass when a row leans on an earlier group's state)"
                     % (", ".join(sorted(set(groups.values()))) or "all"))
    lines.append("a rerun green is evidence of a flake, not a fix: the night's red stays until its owner or known_reds says so")
    lines.append("rerun: %s in %d s (%s)" % ("green" if not verdict else "RED", time.time() - t0, out))
    with open(os.path.join(out, "summary.txt"), "w") as f:
        f.write("\n".join(lines) + "\n")
    print("\n".join(lines))
    return 1 if verdict else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
