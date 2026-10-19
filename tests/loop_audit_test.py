#!/usr/bin/env python3
"""scripts/loop_audit.py reads every place a gate run's output lives, on a fake bise home.

A night like 2026-10-14's: tasks ran their gates and were dropped (their tmp gone), so
their runs live only in gate.sh's own logs (<gate dir>/logs, with the agent in the
header); a live task keeps a copy in its tmp (one run, read once); the nightly writes
run/nightly/<date>.log, a release run/<name>.log; run_all.sh's timings.tsv has every
e2e/tmux test's wall, CPU and rc. Checks: the audit counts each run once, by agent, and
its slowest and failing tests come from timings.tsv (the logs' lines for the others);
gate.sh itself writes that log (a throwaway repo with a copy of gate.sh: no real gate,
a fake `sb`). Never his ~/.bise.

  python3 -B tests/loop_audit_test.py
"""
import importlib.util
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FAILS = []
NL = chr(10)


def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


def load_audit():
    spec = importlib.util.spec_from_file_location("loop_audit", os.path.join(ROOT, "scripts", "loop_audit.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def write(path, text, mtime=None):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as fh:
        fh.write(text)
    if mtime is not None:
        os.utime(path, (mtime, mtime))


QUICK = NL.join(["ok   test-build (15s)", "ok   clippy (10s)", "ok   PROOF (40s)", "GATE quick GREEN (35s): 2 crates"]) + NL
FULL_T2 = NL.join(["e2e/tmux tests: all (--all)", "got the gate after 120s",
                   "== E2E (real hub, REPLs, git; scripted provider)",
                   "ok   e2e (49s, cpu 20s)", "ok   every_e2e (93s, cpu 8s)", "GATE full GREEN (640s)"]) + NL
NIGHTLY = NL.join(["QUEUED Wed Oct 14 04:40:03 CEST 2026: waiting for a heavy slot", "START 0aefecd2",
                   "== E2E (real hub, REPLs, git; scripted provider)",
                   "ok   e2e (51s, cpu 21s)", "FAIL partial_e2e (95s)", "GATE full FAILED", "END rc=1"]) + NL
RELEASE = NL.join(["== E2E (real hub, REPLs, git; scripted provider)", "ok   e2e (47s, cpu 19s)",
                   "GATE full GREEN (700s)"]) + NL


def fake_home(h, now):
    hub = "harness-test"
    # two wakes ran to --max: t7's job never ran (dead), t8's sat in heavy-run's queue past it
    wk = lambda i, a, s, e: (json.dumps({"type": "wake_set", "watch": {"id": i, "agent": a, "set_at": s * 1000,
                                                                       "spec": {"kind": "file"}}}) + NL
                             + json.dumps({"type": "wake_end", "id": i, "at": e * 1000, "why": "max"}) + NL)
    write(os.path.join(h, "hubs", hub, "journal.jsonl"), wk(1, "t7", now - 9000, now - 5400) + wk(2, "t8", now - 9000, now - 5400))
    write(os.path.join(h, "run", "heavy.log"),
          "%d\t%d\t%d\t1\t0\t/w/t8/harness\ttests/gate.sh quick%s" % (now - 8990, now - 5000, now - 4700, NL))
    def own(mode, agent, start, body, end):
        write(os.path.join(h, "gate", "logs", "%s-%d-%d.log" % (mode, start, start % 1000)),
              "# gate %s agent=%s sha=abc1234 start=%d root=/x%s%s" % (mode, agent, start, NL, body), end)
    # before gate.sh kept its logs: the nightly's (run/nightly/) and a release's (run/) count
    write(os.path.join(h, "run", "nightly", "2026-10-14.log"), NIGHTLY, now - 20000)
    write(os.path.join(h, "run", "release-33-gate.log"), RELEASE, now - 15000)
    # tasks dropped since: their runs live in gate.sh's own logs (<gate dir>/logs)
    own("quick", "debt-t1", now - 3600, QUICK + "# gate end rc=0 secs=36" + NL, now - 3500)
    own("quick", "debt-t3", now - 1800, "FAIL clippy" + NL + "GATE quick FAILED" + NL + "# gate end rc=1 secs=20" + NL, now - 1790)
    # another task's red, the same lines minutes later: a run of its own
    own("quick", "debt-t5", now - 1600, "FAIL clippy" + NL + "GATE quick FAILED" + NL + "# gate end rc=1 secs=20" + NL, now - 1590)
    # red before its GATE line (sb-core did not build): its rc line ends it
    own("quick", "debt-t6", now - 1400, "FAIL sb-core build" + NL + "# gate end rc=1 secs=12" + NL, now - 1390)
    own("full", "debt-t4", now - 2400, FULL_T2 + "# gate end rc=0 secs=641" + NL, now - 1700)
    # quick's vitest-related selection: a full at this repo's HEAD with src/x.test.ts red; two green
    # quicks before it, at HEAD~1: one ran it (fine), one did not (a suspect miss)
    head = subprocess.run(["git", "-C", ROOT, "rev-parse", "HEAD", "HEAD~1"], capture_output=True, text=True).stdout.split()
    write(os.path.join(h, "gate", "logs", "full-%d-2.log" % (now - 1500)),
          "# gate full agent=t9 sha=%s start=%d root=/x%s FAIL  src/x.test.ts > a law%sFAIL desktop_check%s"
          "GATE full FAILED%s# gate end rc=1 secs=900%s" % (head[0], now - 1500, NL, NL, NL, NL, NL), now - 600)
    write(os.path.join(h, "gate", "vitest-related.jsonl"), "".join(json.dumps(
        {"t": now - 3000, "agent": a, "sha": head[1], "changed": ["src/x.ts"], "ran": ran, "rc": 0}) + NL
        for a, ran in (("t10", ["src/x.test.ts"]), ("t11", ["src/y.test.ts"]))))
    # a full gate on an agent's scratch tree (bend-check's newer Bend): an experiment, left out
    write(os.path.join(h, "gate", "logs", "full-%d-1.log" % (now - 2000)),
          "# gate full agent=bend-check sha=abc1234 start=%d root=%s/hubs/%s/agents/bend-check/tmp/wt%s"
          "GATE FAILED: no bend for bend/VERSION%s# gate end rc=1 secs=38%s" % (now - 2000, h, hub, NL, NL, NL), now - 1960)
    # a release's log since then: its gate.sh run has its own log already
    write(os.path.join(h, "run", "release-34-gate.log"), RELEASE, now - 1000)
    own("full", "release-34", now - 1700, RELEASE + "# gate end rc=0 secs=701" + NL, now - 1001)
    # run_all.sh's history: <t> <rev> <test> <rc> <wall> <cpu> <load>
    rows = [(now - 9000, "e2e", 0, 50, 21), (now - 9000, "partial_e2e", 1, 95, 3),
            (now - 5000, "e2e", 0, 48, 20), (now - 5000, "partial_e2e", 0, 91, 3),
            (now - 1800, "e2e", 0, 49, 20), (now - 1800, "every_e2e", 0, 93, 8),
            (now - 300000, "ancient_e2e", 0, 999, 9)]
    write(os.path.join(h, "gate", "timings.tsv"),
          "".join("%d\tabc1234\t%s\t%d\t%d\t%d\t3.1%s" % (t, n, rc, w, c, NL) for t, n, rc, w, c in rows)
          # since gate-reds, an 8th field says who ran it: an agent's own loop (adhoc) is left out
          + "%d\tabc1234\tevery_e2e\t0\t90\t8\t3.1\tgate-full%s" % (now - 1200, NL)
          + "".join("%d\tabc1234\trpc_e2e\t1\t1\t0\t3.1\tadhoc%s" % (now - 1000 + i, NL) for i in range(5)))
    return hub


def test_audit():
    la = load_audit()
    with tempfile.TemporaryDirectory(prefix="loop-audit-") as h:
        now = int(time.time())
        hub = fake_home(h, now)
        since = now - 86400
        runs, start = la.gate_logs(h, since)
        by = sorted((a, r["mode"], r["green"]) for a, _, _, r in runs)
        check(by == [("bend-check", "full", False), ("debt-t1", "quick", True), ("debt-t3", "quick", False), ("debt-t4", "full", True),
                     ("debt-t5", "quick", False), ("debt-t6", "quick", False), ("nightly", "full", False),
                     ("release", "full", True), ("release-34", "full", True), ("t9", "full", False)],
              "one source per run: gate/logs by its agent, run/ only before they start (%s)" % by)
        check(start == now - 3500, "the gate logs start at the oldest one (%s)" % start)
        rep = la.audit(h, hub, since)
        q, f = rep["gates"]["quick"], rep["gates"]["full"]
        check((q["runs"], q["green"], q["secs_p50"]) == (4, 1, 35), "quick: 4 runs, 1 green, p50 35 s (%s)" % q)
        check((f["runs"], f["green"], f["queue_max"]) == (5, 3, 120), "full: 5 runs, 3 green, queue max 120 s (%s)" % f)
        check(q["steps_p50"].get("clippy") == 10, "quick's steps from its log (%s)" % q["steps_p50"])
        check(q["reds"] == {"clippy": 2, "sb-core": 1} and f["reds"] == {"partial_e2e": 1, "desktop_check": 1},
              "each mode's red runs by what was red (%s, %s)" % (q["reds"], f["reds"]))
        rm = rep["related_misses"]
        check(len(rm) == 1 and rm[0]["test"] == "src/x.test.ts" and [q.split("@")[0] for q in rm[0]["quicks"]] == ["t11"],
              "a vitest file red in a full that a green related quick before it did not run: a suspect miss (%s)" % rm)
        wa = rep["waits"]
        check([x["agent"] for x in wa["ended_at_max"]] == ["t7"] and [x["agent"] for x in wa["queued_at_max"]] == ["t8"],
              "a --max wake whose job was still queued is not a dead job (%s)" % wa)
        check(rep["scratch_runs"] == 1, "a run on an agent's scratch tree is left out (%s)" % rep["scratch_runs"])
        t = rep["tests"]
        check(t.get("partial_e2e", {}).get("runs") == 2 and t["partial_e2e"]["fails"] == 1
              and t["partial_e2e"]["wall_p50"] == 93,
              "a timed test: its runs, fails and wall from timings.tsv, not the logs too (%s)" % t.get("partial_e2e"))
        check(t.get("e2e", {}).get("runs") == 3 and t["e2e"]["cpu_p50"] == 20, "e2e: 3 timed runs (%s)" % t.get("e2e"))
        check(t.get("PROOF", {}).get("wall_p50") == 40, "an untimed test from the gate logs (%s)" % t.get("PROOF"))
        check("ancient_e2e" not in t, "timings out of the window left out")
        check(rep["reds"] == {"partial_e2e": 1}, "failing tests (%s)" % rep["reds"])
        check(rep["adhoc"] == {"runs": 5, "fails": 5} and "rpc_e2e" not in t and t["every_e2e"]["runs"] == 2,
              "an agent's own loop is left out, a gate's tagged run counts (%s, %s)" % (rep["adhoc"], t.get("every_e2e")))
        out = subprocess.run([sys.executable, "-B", os.path.join(ROOT, "scripts", "loop_audit.py"), "--since", "24h",
                              "--hub", hub], env=dict(os.environ, BISE_HOME=h), capture_output=True, text=True)
        check(out.returncode == 0 and "- full: 5 runs, 3 green" in out.stdout and "vitest-related misses" in out.stdout and "partial_e2e" in out.stdout
              and "- gate logs start " in out.stdout,
              "the report shows them (rc %d)%s" % (out.returncode, "" if out.returncode == 0 else NL + out.stderr[-800:]))


FAKE_SB = "#!/bin/sh\nexit 0\n"


def test_gate_log():
    """gate.sh keeps each run's output in <gate dir>/logs, its agent in the header."""
    with tempfile.TemporaryDirectory(prefix="gate-log-") as d:
        repo, home, fbin = os.path.join(d, "repo"), os.path.join(d, "home"), os.path.join(d, "bin")
        os.makedirs(os.path.join(repo, "tests"))
        os.makedirs(home)
        os.makedirs(fbin)
        shutil.copy(os.path.join(ROOT, "tests", "gate.sh"), os.path.join(repo, "tests", "gate.sh"))
        write(os.path.join(fbin, "sb"), FAKE_SB)
        os.chmod(os.path.join(fbin, "sb"), 0o755)
        subprocess.run(["git", "init", "-q", "-b", "main", repo], check=True)
        env = dict(os.environ, BISE_HOME=home, SB_AGENT="fake-task", PATH=fbin + os.pathsep + os.environ["PATH"])
        env.pop("CARGO_TARGET_DIR", None)
        # no scripts/bins.sh nor tests/*.py here: the quick gate goes red at once
        p = subprocess.run(["bash", "tests/gate.sh", "quick"], cwd=repo, env=env, capture_output=True, text=True, timeout=60)
        logs = os.path.join(home, "gate", "logs")
        files = sorted(os.listdir(logs)) if os.path.isdir(logs) else []
        check(p.returncode != 0 and len(files) == 1 and files[0].startswith("quick-"),
              "a red quick run leaves one log in <gate dir>/logs (rc %d, %s)" % (p.returncode, files))
        if files:
            text = open(os.path.join(logs, files[0])).read()
            head = text.splitlines()[0]
            check(head.startswith("# gate quick agent=fake-task sha=none start=") and " root=" in head,
                  "its header: mode, agent, sha, start (%r)" % head)
            last = [ln for ln in p.stdout.splitlines() if ln.strip()][-1:]
            check(bool(last) and last[0] in text, "it has the run's output up to its last line (%s)" % last)
            check(text.rstrip().splitlines()[-1].startswith("# gate end rc=%d secs=" % p.returncode),
                  "its last line is the run's rc (%r)" % text.rstrip().splitlines()[-1])
            agent, run = load_audit().own_log_run(text)
            check(agent == "fake-task" and run and run["mode"] == "quick" and not run["green"] and run["ended"],
                  "the audit reads it as a red quick run of fake-task (%s)" % run)


def main():
    test_audit()
    test_gate_log()
    if FAILS:
        print("loop_audit_test: %d failed" % len(FAILS))
        sys.exit(1)
    print("loop_audit_test: ok")


if __name__ == "__main__":
    main()
