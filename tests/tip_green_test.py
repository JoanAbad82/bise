#!/usr/bin/env python3
"""scripts/tip_green.py: a sha of green-shas.tsv is green; another one is refused, naming the way
out; --not-tip-green "<why>" lets it through with its line. A throwaway repo and BISE_HOME."""
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import tip_green as G  # noqa: E402

FAILS = []


def check(ok, what):
    if not ok:
        FAILS.append(what)


def main():
    a, b = "a" * 40, "b" * 40
    check(G.verdict([a], a) == (True, "tip-green aaaaaaaaaaaa: main's tip gate passed it"), "green %s" % (G.verdict([a], a),))
    ok, line = G.verdict([a], b)
    check(not ok and "bbbbbbbbbbbb is not tip-green" in line and "--not-tip-green" in line, "refused %s" % line)
    check(G.verdict([a], b, "main: hotfix") == (True, "not-tip-green bbbbbbbbbbbb: main: hotfix"), "named")
    t = os.path.realpath(tempfile.mkdtemp(prefix="tip-green-test-", dir=os.environ.get("TMPDIR")))
    try:
        repo = os.path.join(t, "repo")
        subprocess.run(["git", "init", "-q", repo], check=True)
        subprocess.run(["git", "-C", repo, "-c", "user.name=t", "-c", "user.email=t@t", "-c", "commit.gpgsign=false",
                        "commit", "-q", "--allow-empty", "-m", "x"], check=True)
        sha = subprocess.run(["git", "-C", repo, "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip()
        env = dict(os.environ, BISE_HOME=os.path.join(t, "bh"))
        run = lambda *x: subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "tip_green.py"), "HEAD", "--repo", repo, *x],  # noqa: E731
                                        capture_output=True, text=True, env=env)
        r = run()
        check(r.returncode == 1 and "is not tip-green" in r.stdout, "cli refused: %s %s" % (r.returncode, r.stdout))
        r = run("--not-tip-green", "main: the hotfix")
        check(r.returncode == 0 and r.stdout.strip() == "not-tip-green %s: main: the hotfix" % sha[:12], "cli named: %s" % r.stdout)
        os.makedirs(os.path.join(t, "bh", "gate"))
        with open(os.path.join(t, "bh", "gate", "green-shas.tsv"), "w") as f:
            f.write("%s\t1\t1\ttip\tlog\n" % sha)
        r = run()
        check(r.returncode == 0 and r.stdout.startswith("tip-green %s" % sha[:12]), "cli green: %s" % r.stdout)
        check(run("--not-tip-green", "").returncode == 2, "an empty why is a usage error")
    finally:
        shutil.rmtree(t, ignore_errors=True)
    for f in FAILS:
        print("FAIL", f)
    print("tip_green_test: %s" % ("ok" if not FAILS else "%d failed" % len(FAILS)))
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(main())
