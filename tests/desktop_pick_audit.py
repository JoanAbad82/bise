#!/usr/bin/env python3
"""The nightly audit of the desktop checks' selection (fast-try p2; architect m_29198 m_29411,
review-gates m_29412 #7). Run by the nightly right after the coverage map
(apps/desktop/tests/harness/coverage/covmap.mjs run), on the gate dir:

  - the coverage audit: every pick logged since the last audit (<gate dir>/desktop-pick.jsonl,
    from gate.sh land and the try: tests/desktop_pick_shadow.sh), replayed against the NEW map: a
    check that now runs (or imports) a file the pick's change touched, but was not picked, is a miss;
  - the red audit: a check red in tonight's map run, green the night before, that none of the
    day's picks chose (no ALL, not picked) is a miss: a red the selector didn't pick.

A miss is a red with an owner (try-select, like tests/known_reds.txt): one line in
<gate dir>/desktop-pick-misses.tsv, its files in <gate dir>/desktop-pick-all.txt (ALL until the next
map), the selection back in shadow mode (<gate dir>/desktop-pick.on removed), the streak at 0.
A night counts toward the streak only with 0 misses in both audits AND at least MIN_PICKS picks
that were not ALL (quiet nights prove nothing). <gate dir>/desktop-pick-audit.tsv, one line a night:
  <day> <map sha> <picks> <not ALL> <coverage misses> <red misses> <skip %> <streak> <note>
note: "never-skipped" when no pick of the night skipped a check (architect m_29411 #2: a map that
never skips is the whole-bundle failure in another form). Skipping turns on only by review-gates'
written go after STREAK nights (it writes desktop-pick.on); this never turns it on.

  python3 tests/desktop_pick_audit.py [--gate-dir <d>] [--day YYYY-MM-DD]   exit 1 on a miss
  python3 tests/desktop_pick_audit.py --self-test
"""
import json
import os
import re
import shutil
import sys
import tempfile
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import test_map  # noqa: E402  the one reader: the same rules as the picks

MIN_PICKS = 20
STREAK = 5
OWNER = "try-select"
APP_TESTS = "apps/desktop/tests/"


def load_jsonl(path):
    out = []
    try:
        with open(path) as fh:
            for line in fh:
                try:
                    out.append(json.loads(line))
                except ValueError:
                    continue
    except FileNotFoundError:
        pass
    return out


def coverage_misses(picks, cov):
    """[(check, files)] the new map says each pick should have run but it didn't pick."""
    files = cov["files"]
    covers = {}
    for c, e in cov["checks"].items():
        for i in e["covered"]:
            covers.setdefault(files[i], set()).add(APP_TESTS + c)
        for f in e["imports"]:
            covers.setdefault(f, set()).add(APP_TESTS + c)
    missed = {}
    for p in picks:
        if p.get("all") is not None:
            continue
        got = set(p.get("picked", []))
        for f in p.get("changed", []):
            for c in covers.get(f, ()):
                if c not in got:
                    missed.setdefault(c, set()).add(f)
    return sorted((c, sorted(fs)) for c, fs in missed.items())


def red_misses(picks, night, prev):
    """[(check, files)] newly red tonight (green the night before) that no pick of the day chose."""
    if prev is None:
        return []
    any_all = any(p.get("all") is not None for p in picks)
    if any_all:
        return []
    chosen = set()
    touched = set()
    for p in picks:
        chosen |= set(p.get("picked", []))
        touched |= set(p.get("changed", []))
    out = []
    for c, e in night["checks"].items():
        was = prev["checks"].get(c)
        if e.get("green") is False and was is not None and was.get("green") is True and APP_TESTS + c not in chosen:
            out.append((APP_TESTS + c, sorted(f for f in touched if f.startswith("apps/desktop/"))))
    return out


def skip_pct(picks, cov):
    """The checks the not-ALL picks skipped, in % of the map's checks (mean)."""
    n = len(cov["checks"]) or 1
    rows = [p for p in picks if p.get("all") is None]
    if not rows:
        return 0.0
    return 100.0 * sum(1 - len(p.get("picked", [])) / n for p in rows) / len(rows)


def last_line(path):
    try:
        with open(path) as fh:
            lines = [l for l in fh.read().splitlines() if l.strip() and not l.startswith("#")]
        return lines[-1].split("\t") if lines else None
    except FileNotFoundError:
        return None


def audit(gdir, day, now):
    """One night's audit; returns (misses, line written)."""
    cov_path = os.path.join(gdir, test_map.COV_FILE)
    with open(cov_path) as fh:
        cov = json.load(fh)
    nd = os.path.join(gdir, "desktop-cov")
    nights = sorted((n for n in os.listdir(nd) if re.match(r"^\d{4}-\d\d-\d\d-[0-9a-f]+\.json$", n)), reverse=True) \
        if os.path.isdir(nd) else []

    def night(n):
        with open(os.path.join(nd, n)) as fh:
            return json.load(fh)
    tonight = night(nights[0]) if nights else {"checks": {}}
    prev = night(nights[1]) if len(nights) > 1 else None
    tsv = os.path.join(gdir, "desktop-pick-audit.tsv")
    last = last_line(tsv)
    since = int(last[9]) if last and len(last) > 9 and last[9].isdigit() else 0
    picks = [p for p in load_jsonl(os.path.join(gdir, "desktop-pick.jsonl")) if p.get("t", 0) > since]
    cm = coverage_misses(picks, cov)
    rm = red_misses(picks, tonight, prev)
    not_all = sum(1 for p in picks if p.get("all") is None)
    skip = skip_pct(picks, cov)
    streak = int(last[7]) if last and len(last) > 7 and last[7].isdigit() else 0
    if cm or rm:
        streak = 0
    elif not_all >= MIN_PICKS:
        streak += 1
    note = []
    if picks and not_all == 0:
        note.append("all-ALL")
    if not_all and skip == 0:
        note.append("never-skipped")
    if not_all < MIN_PICKS:
        note.append("under %d picks: the night doesn't count" % MIN_PICKS)
    if cm or rm:
        with open(os.path.join(gdir, "desktop-pick-misses.tsv"), "a") as fh:
            for kind, rows in (("coverage", cm), ("red", rm)):
                for c, fs in rows:
                    fh.write("\t".join([day, c, OWNER, kind, " ".join(fs) or "-"]) + "\n")
        with open(os.path.join(gdir, "desktop-pick-all.txt"), "a") as fh:
            fh.write("# %s: the nightly audit's misses, ALL until the next map\n" % day)
            for _, fs in cm + rm:
                for f in fs:
                    fh.write(f + "\n")
        # back to shadow: the selection never skips after a miss
        try:
            os.remove(os.path.join(gdir, "desktop-pick.on"))
        except FileNotFoundError:
            pass
    if not os.path.exists(tsv):
        with open(tsv, "w") as fh:
            fh.write("# day\tmap\tpicks\tnot_all\tcov_misses\tred_misses\tskip_pct\tstreak\tnote\tuntil\n")
    line = [day, cov.get("sha", "?")[:9], str(len(picks)), str(not_all), str(len(cm)), str(len(rm)),
            "%.0f" % skip, str(streak), "; ".join(note) or "-", str(int(now))]
    with open(tsv, "a") as fh:
        fh.write("\t".join(line) + "\n")
    return cm + rm, line


def main(argv):
    if argv[1:2] == ["--self-test"]:
        return self_test()
    gdir = argv[argv.index("--gate-dir") + 1] if "--gate-dir" in argv else test_map.gate_dir()
    day = argv[argv.index("--day") + 1] if "--day" in argv else time.strftime("%Y-%m-%d")
    misses, line = audit(gdir, day, time.time())
    print("desktop-pick audit %s: %s picks (%s not ALL), %s coverage misses, %s red misses, %s%% skipped, streak %s/%d%s"
          % (day, line[2], line[3], line[4], line[5], line[6], line[7], STREAK, "" if line[8] == "-" else " (%s)" % line[8]))
    for c, fs in misses:
        print("MISS %s (owner %s): %s" % (c, OWNER, " ".join(fs) or "-"))
    if misses:
        sys.exit(1)


def self_test():
    d = tempfile.mkdtemp(prefix="pick-audit-")
    try:
        keep, menus = "checks/app/keep.spec.ts", "checks/app/menus.spec.ts"
        a, b = "apps/desktop/src/app/a.tsx", "apps/desktop/src/app/b.tsx"
        cov = {"sha": "m" * 40, "files": [a, b], "checks": {keep: {"covered": [0], "imports": []},
                                                            menus: {"covered": [1], "imports": []}}}
        # the coverage audit: a pick of a.tsx that left keep out is a miss; ALL picks never miss
        ok = {"t": 1, "all": None, "picked": [APP_TESTS + keep], "changed": [a]}
        bad = {"t": 2, "all": None, "picked": [APP_TESTS + menus], "changed": [a, b]}
        every = {"t": 3, "all": "no coverage map", "picked": [], "changed": [a]}
        assert coverage_misses([ok, every], cov) == []
        assert coverage_misses([bad], cov) == [(APP_TESTS + keep, [a])], coverage_misses([bad], cov)
        # the red audit: newly red and chosen by no pick
        tonight = {"checks": {keep: {"green": False}, menus: {"green": True}}}
        before = {"checks": {keep: {"green": True}, menus: {"green": True}}}
        assert red_misses([bad], tonight, before) == [(APP_TESTS + keep, [a, b])]
        assert red_misses([ok], tonight, before) == []
        assert red_misses([bad, every], tonight, before) == []
        assert red_misses([bad], tonight, None) == []
        assert red_misses([bad], {"checks": {keep: {"green": False}}}, {"checks": {keep: {"green": False}}}) == []
        # a whole night: files, streak, shadow back on a miss
        gd = os.path.join(d, "gate")
        os.makedirs(os.path.join(gd, "desktop-cov"))

        def put(name, obj):
            with open(os.path.join(gd, name), "w") as fh:
                json.dump(obj, fh)
        put("desktop-cov.json", cov)
        put("desktop-cov/2026-10-16-aaaaaaaaa.json", before)
        put("desktop-cov/2026-10-17-bbbbbbbbb.json", {"checks": {keep: {"green": True}, menus: {"green": True}}})
        with open(os.path.join(gd, "desktop-pick.jsonl"), "w") as fh:
            for i in range(MIN_PICKS):
                fh.write(json.dumps({**ok, "t": 10 + i}) + "\n")
        open(os.path.join(gd, "desktop-pick.on"), "w").close()
        misses, line = audit(gd, "2026-10-17", 100)
        assert misses == [] and line[7] == "1" and line[3] == str(MIN_PICKS), line
        assert os.path.exists(os.path.join(gd, "desktop-pick.on"))
        # the next night: few picks, no miss: the streak holds, the night doesn't count
        with open(os.path.join(gd, "desktop-pick.jsonl"), "a") as fh:
            fh.write(json.dumps({**ok, "t": 200}) + "\n")
        misses, line = audit(gd, "2026-10-18", 300)
        assert misses == [] and line[7] == "1" and "doesn't count" in line[8] and line[2] == "1", line
        # a miss: written, ALL until the next map, back to shadow, streak 0
        with open(os.path.join(gd, "desktop-pick.jsonl"), "a") as fh:
            fh.write(json.dumps({**bad, "t": 400}) + "\n")
        misses, line = audit(gd, "2026-10-19", 500)
        assert misses and line[7] == "0", line
        with open(os.path.join(gd, "desktop-pick-all.txt")) as fh:
            assert a in fh.read()
        with open(os.path.join(gd, "desktop-pick-misses.tsv")) as fh:
            assert "\t%s\tcoverage\t" % OWNER in fh.read()
        assert not os.path.exists(os.path.join(gd, "desktop-pick.on"))
        # a night of ALL only: said
        with open(os.path.join(gd, "desktop-pick.jsonl"), "a") as fh:
            fh.write(json.dumps({**every, "t": 600}) + "\n")
        _, line = audit(gd, "2026-10-20", 700)
        assert "all-ALL" in line[8], line
        # a pick that skipped nothing: never-skipped
        assert skip_pct([{"all": None, "picked": [1, 2]}], cov) == 0
        print("desktop_pick_audit self-test: ok")
    finally:
        shutil.rmtree(d, ignore_errors=True)


if __name__ == "__main__":
    main(sys.argv)
