#!/usr/bin/env python3
"""scripts/nightly_gate.sh's start path, on fake data only.

A throwaway repo (branch main) with a copy of the script and a fake tests/gate.sh, a fake
heavy-run (NIGHTLY_HEAVY_RUN) that can do what a night does while the run waits for its
slot (remove the tree like the hub's start sweep did on 2026-10-13, land a commit on main,
fail), and a throwaway BISE_HOME. Checks: the tree is made in the slot at main's tip of
that moment (~/.bise/run/nightly/tree/<repo>, its owner file), a removed tree is made
again, a stale tree is checked out and cleaned, `last` and `red` for green, red and a gate
that did not start (an infra failure, not a test red); the desktop steps after the gate (a
check red under coverage is a red night naming it, the coverage map and its audit are owned
tools that never turn it red). Never his ~/.bise, no real gate.

  python3 -B tests/nightly_gate_test.py
"""
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FAILS = []

FAKE_GATE = """#!/usr/bin/env bash
echo "fake gate $(git rev-parse --short HEAD) in $PWD GATE_ALL=${GATE_ALL:-} args=$*"
[ "${FAKE_GATE_RC:-0}" = 0 ] && exit 0
echo "FAIL e2e_fake"; exit 1
"""

FAKE_HEAVY = """#!/usr/bin/env bash
# what happens while the run waits for its slot
echo "lockf: $HOME/.bise/run/heavy.lock: already locked"
[ -n "${FAKE_SWEEP:-}" ] && rm -rf "$FAKE_SWEEP"
[ -n "${FAKE_LAND:-}" ] && git -C "$FAKE_LAND" commit -q --allow-empty -m landed
[ -n "${FAKE_HEAVY_FAIL:-}" ] && { echo "heavy-run: $FAKE_HEAVY_FAIL"; exit 2; }
[ "${1:-}" = --alone ] && { echo "heavy-run: both slots"; shift; }
exec "$@"
"""


# the coverage step (apps/desktop/tests/harness/coverage/covmap.mjs): checks red or green, a
# tooling that never ran, a map refused (review-gates m_29723)
FAKE_COVMAP = """const [mode] = process.argv.slice(2);
const e = process.env;
if (mode === 'checks') {
  if (e.FAKE_COV_CHECKS === 'red') { console.log('FAIL keep-red'); process.exit(1); }
  if (e.FAKE_COV_CHECKS === 'nohook') { console.log('covmap checks: the coverage hook never took a coverage'); process.exit(2); }
  console.log('covmap checks: 3/3 green'); process.exit(0);
}
if (mode === 'map') {
  if (e.FAKE_COV_MAP === 'refuse') { console.error('covmap: no map written: bundles instead of source files'); process.exit(1); }
  console.log('covmap: map written'); process.exit(0);
}
process.exit(2);
"""
FAKE_AUDIT = """import os, sys
print("fake audit")
sys.exit(1 if os.environ.get("FAKE_AUDIT_MISS") else 0)
"""


def check(ok, what):
    if not ok:
        FAILS.append(what)


def git(repo, *args):
    return subprocess.run(["git", "-C", repo, *args], check=True, capture_output=True, text=True).stdout.strip()


def main():
    t = tempfile.mkdtemp(prefix="nightly-test-", dir=os.environ.get("TMPDIR"))
    t = os.path.realpath(t)
    try:
        repo, home = os.path.join(t, "harness"), os.path.join(t, "home")
        os.makedirs(os.path.join(repo, "scripts"))
        os.makedirs(os.path.join(repo, "tests"))
        shutil.copy(os.path.join(ROOT, "scripts", "nightly_gate.sh"), os.path.join(repo, "scripts"))
        with open(os.path.join(repo, "tests", "gate.sh"), "w") as f:
            f.write(FAKE_GATE)
        cov = os.path.join(repo, "apps", "desktop", "tests", "harness", "coverage")
        os.makedirs(cov)
        with open(os.path.join(cov, "covmap.mjs"), "w") as f:
            f.write(FAKE_COVMAP)
        with open(os.path.join(repo, "tests", "desktop_pick_audit.py"), "w") as f:
            f.write(FAKE_AUDIT)
        heavy = os.path.join(t, "heavy-run")
        with open(heavy, "w") as f:
            f.write(FAKE_HEAVY)
        os.chmod(heavy, 0o755)
        subprocess.run(["git", "init", "-q", "-b", "main", repo], check=True)
        git(repo, "config", "user.email", "t@example.invalid")
        git(repo, "config", "user.name", "t")
        git(repo, "config", "commit.gpgsign", "false")
        git(repo, "config", "core.hooksPath", "/dev/null")
        git(repo, "add", "-A")
        git(repo, "commit", "-q", "-m", "init")

        out = os.path.join(home, "run", "nightly")
        tree = os.path.join(out, "tree")
        wt = os.path.join(tree, "harness")
        env0 = {k: v for k, v in os.environ.items() if not k.startswith("GIT_") and not k.startswith("FAKE_")}
        env0.update(BISE_HOME=home, NIGHTLY_HEAVY_RUN=heavy)

        def night(**fake):
            env = dict(env0, **fake)
            p = subprocess.run(["bash", os.path.join(repo, "scripts", "nightly_gate.sh")], env=env,
                               capture_output=True, text=True, timeout=60)
            logs = sorted(f for f in os.listdir(out) if f.endswith(".log"))
            log = open(os.path.join(out, logs[-1])).read() if logs else ""
            last = open(os.path.join(out, "last")).read().strip() if os.path.exists(os.path.join(out, "last")) else ""
            red = open(os.path.join(out, "red")).read() if os.path.exists(os.path.join(out, "red")) else None
            return p.returncode, log, last, red

        def short():
            return git(repo, "rev-parse", "--short", "main")

        # 1. the first night: the tree made in the slot, the gate run in it with --all
        rc, log, last, red = night()
        check(rc == 0, "first night green: rc %s, log %r" % (rc, log))
        check(os.path.exists(os.path.join(wt, ".git")) and os.path.exists(os.path.join(tree, "owner")),
              "first night: the tree %s and its owner file" % wt)
        check("fake gate %s in %s GATE_ALL=1 args=full --all" % (short(), wt) in log, "first night: the gate ran in the tree: %r" % log)
        check(log.startswith("QUEUED ") and "\nSTART " in log, "first night: QUEUED then START: %r" % log)
        check("heavy-run: both slots" in log, "first night: heavy-run --alone, never beside an agent's job: %r" % log)
        check(last.split()[1:3] == [short(), "green"], "first night: last %r" % last)
        check(red is None, "first night: no red")

        # 2. the tree removed while the run waits (the hub's sweep), and a land on main
        rc, log, last, red = night(FAKE_SWEEP=tree, FAKE_LAND=repo)
        tip = short()
        check(rc == 0, "swept night green: rc %s, log %r" % (rc, log))
        check("fake gate %s in %s" % (tip, wt) in log, "swept night: the gate ran on main's new tip %s: %r" % (tip, log))
        check(last.split()[1:3] == [tip, "green"], "swept night: last %r" % last)
        check(wt in git(repo, "worktree", "list"), "swept night: the tree is a worktree again")

        # 3. a red night names the failing tests
        rc, log, last, red = night(FAKE_GATE_RC="1")
        check(rc != 0 and last.split()[2] == "red", "red night: rc %s, last %r" % (rc, last))
        check(red is not None and "e2e_fake" in red and "did not start" not in red, "red night: red %r" % red)

        # 4. a stale tree (an old commit, a stray file) is checked out at the tip and cleaned
        git(wt, "checkout", "-q", "--detach", "main~1")
        open(os.path.join(wt, "stray"), "w").write("x")
        rc, log, last, red = night()
        check(rc == 0 and last.split()[1:3] == [short(), "green"], "stale tree: rc %s, last %r" % (rc, last))
        check(not os.path.exists(os.path.join(wt, "stray")), "stale tree: the stray file is cleaned")
        check(red is None, "green night after red: red removed")

        # 5. heavy-run fails before the gate: an infra red, not a test red
        rc, log, last, red = night(FAKE_HEAVY_FAIL="boom")
        check(rc != 0 and last.split()[1:3] == ["?", "infra"] and "heavy-run: boom" in last, "heavy fails: rc %s, last %r" % (rc, last))
        check(red is not None and "did not start" in red and "infra" in red and "heavy-run: boom" in red, "heavy fails: red %r" % red)

        # the desktop steps after the gate (review-gates m_29723): a check red under coverage is a
        # product red named in red; the map and its audit are try-select's tools, never a red night
        rc, log, last, red = night()
        check(rc == 0 and "STEP desktop-checks: green" in log and "STEP desktop-map: green" in log
              and "STEP desktop-pick-audit: green" in log, "desktop steps green: rc %s, log %r" % (rc, log))
        rc, log, last, red = night(FAKE_COV_CHECKS="red")
        check(rc != 0 and last.split()[2] == "red" and red is not None and "keep-red" in red,
              "a check red under coverage: a red night naming it: rc %s, last %r, red %r" % (rc, last, red))
        check("STEP desktop-map: green" in log, "a red check: the map is still made: %r" % log)
        rc, log, last, red = night(FAKE_COV_MAP="refuse")
        check(rc == 0 and last.split()[2] == "green" and red is None
              and "STEP desktop-map: red (owner try-select; not a product red)" in log
              and "desktop-pick-audit" not in log.split("STEP desktop-map: red")[1],
              "covmap refuses: the gate's verdict, owned, no audit: rc %s, last %r, log %r" % (rc, last, log))
        rc, log, last, red = night(FAKE_AUDIT_MISS="1")
        check(rc == 0 and red is None and "STEP desktop-pick-audit: red (owner try-select" in log,
              "an audit miss: owned, the night green: rc %s, log %r" % (rc, log))
        rc, log, last, red = night(FAKE_COV_CHECKS="nohook")
        check(rc == 0 and red is None and "STEP desktop-checks: no result (exit 2)" in log,
              "the hook never ran: no verdict, not red: rc %s, log %r" % (rc, log))
        rc, log, last, red = night(FAKE_GATE_RC="1", FAKE_COV_MAP="refuse")
        check(rc != 0 and red is not None and "e2e_fake" in red, "a red gate stays red whatever the map: %r" % red)

        # --tip: main's tip in a quiet slot, once per sha, never on a green one or a busy machine
        def tip_run(**fake):
            env = dict(env0, **dict({"TIP_GATE_MAX_LOAD": "100000"}, **fake))
            before = set(f for f in os.listdir(out) if f.startswith("tip-") and f.endswith(".log"))
            p = subprocess.run(["bash", os.path.join(repo, "scripts", "nightly_gate.sh"), "--tip"], env=env,
                               capture_output=True, text=True, timeout=60)
            new = sorted(set(f for f in os.listdir(out) if f.startswith("tip-") and f.endswith(".log")) - before)
            log = open(os.path.join(out, new[-1])).read() if new else ""
            lastf = os.path.join(out, "tip-last")
            return p.returncode, log, open(lastf).read().split() if os.path.exists(lastf) else []

        full = git(repo, "rev-parse", "main")
        gate_dir = os.path.join(home, "gate")
        os.makedirs(gate_dir, exist_ok=True)
        green = os.path.join(gate_dir, "green-shas.tsv")
        # 7. the tip already green: nothing runs
        with open(green, "w") as f:
            f.write("%s\t1\t600\tx\tlog\n" % full)
        rc, log, last = tip_run()
        check(rc == 0 and log == "", "tip green: no run (rc %s, log %r)" % (rc, log))
        os.remove(green)
        # 8. another full gate holds the lock (a live pid): nothing runs
        lock = os.path.join(gate_dir, "full-%d.lock" % os.getuid())
        os.makedirs(lock)
        with open(os.path.join(lock, "owner"), "w") as f:
            f.write("%d x agent root\n" % os.getpid())
        rc, log, last = tip_run()
        check(rc == 0 and log == "", "tip with a full gate running: no run (rc %s, log %r)" % (rc, log))
        shutil.rmtree(lock)
        # 9. a busy machine (load over the limit): nothing runs
        rc, log, last = tip_run(TIP_GATE_MAX_LOAD="0")
        check(rc == 0 and log == "", "tip on a busy machine: no run (rc %s, log %r)" % (rc, log))
        # 10. quiet: the gate runs in the tree with --all in one slot, tip-last says green
        rc, log, last = tip_run()
        check(rc == 0 and "fake gate %s in %s GATE_ALL=1 args=full --all" % (short(), wt) in log, "tip quiet: the gate ran: rc %s, %r" % (rc, log))
        check("heavy-run: both slots" not in log, "tip quiet: one heavy slot, not --alone: %r" % log)
        check(last[:2] == [full, "green"], "tip quiet: tip-last %r" % last)
        # 11. the same sha again (tried): nothing runs; a red one is not retried either
        rc, log, last = tip_run()
        check(rc == 0 and log == "", "tip tried: no second run (rc %s, log %r)" % (rc, log))
        git(repo, "commit", "-q", "--allow-empty", "-m", "moved")
        rc, log, last = tip_run(FAKE_GATE_RC="1")
        check(rc != 0 and last[:2] == [git(repo, "rev-parse", "main"), "red"], "tip red: rc %s, tip-last %r" % (rc, last))
        rc, log, last = tip_run()
        check(log == "", "tip red: not retried on the same sha (%r)" % log)

        # 6. main's tip has no tests/gate.sh: NOSTART, an infra red
        git(repo, "rm", "-q", "tests/gate.sh")
        git(repo, "commit", "-q", "-m", "no gate")
        rc, log, last, red = night()
        check(rc != 0 and last.split()[1:3] == ["?", "infra"] and "no tests/gate.sh" in last, "no gate: rc %s, last %r" % (rc, last))
        check(red is not None and "did not start" in red, "no gate: red %r" % red)
    finally:
        subprocess.run(["git", "-C", os.path.join(t, "harness"), "worktree", "prune"], capture_output=True)
        shutil.rmtree(t, ignore_errors=True)
    if FAILS:
        print("nightly_gate_test: FAIL\n  " + "\n  ".join(FAILS))
        return 1
    print("nightly_gate_test: ok (6 nights, 5 tip runs)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
