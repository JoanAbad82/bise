#!/usr/bin/env python3
"""scripts/tip_blame.py on a fake repo: the last green is the newest green-shas.tsv sha that is an
ancestor of the tested one; each commit since it gets the agent of its '✓ <agent> landed <n>
commits on main (<sha>)' line (the land's sha and its n-1 parents), a hand commit none; the
failing tests from the log's FAIL lines; tip-red written whole with its 'to:' line (the agents,
then main). Never the real journal or repo."""
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import tip_blame as B  # noqa: E402

FAILS = []
GIT_ENV = {"GIT_AUTHOR_NAME": "t", "GIT_AUTHOR_EMAIL": "t@t", "GIT_COMMITTER_NAME": "t", "GIT_COMMITTER_EMAIL": "t@t"}


def check(ok, what):
    if not ok:
        FAILS.append(what)


def main():
    t = os.path.realpath(tempfile.mkdtemp(prefix="tip-blame-test-", dir=os.environ.get("TMPDIR")))
    try:
        repo = os.path.join(t, "repo")
        env = dict(os.environ, **GIT_ENV)
        g = lambda *a: subprocess.run(["git", "-C", repo, *a], env=env, check=True, capture_output=True, text=True).stdout.strip()  # noqa: E731
        subprocess.run(["git", "init", "-q", "-b", "main", repo], check=True)
        sha = {}
        for n in ("base", "a1", "a2", "hand", "b1"):
            g("-c", "commit.gpgsign=false", "commit", "-q", "--allow-empty", "-m", "feat: %s" % n)
            sha[n] = g("rev-parse", "HEAD")
        green = os.path.join(t, "green-shas.tsv")
        with open(green, "w") as f:
            f.write("%s\t1\t1\tx\tlog\n" % sha["base"])
            f.write("%s\t2\t1\tside\tlog\n" % ("f" * 40))  # not an ancestor: skipped
        journal = os.path.join(t, "journal.jsonl")
        with open(journal, "w") as f:
            f.write('{"msg":{"text":"rc=0\\n✓ alpha landed 2 commits on main (%s) · pushed"}}\n' % sha["a2"][:9])
            f.write('{"msg":{"text":"✓ beta landed 1 commit on main (%s)"}}\n' % sha["b1"][:9])
        log = os.path.join(t, "tip.log")
        with open(log, "w") as f:
            f.write("START x\nFAIL partial_e2e: timed out\nFAIL desktop-checks\nFAIL partial_e2e\n")

        check(B.last_green(repo, green, sha["b1"]) == sha["base"], "last green: base")
        check(B.fails(open(log).read()) == ["partial_e2e", "desktop-checks"], "fails %s" % B.fails(open(log).read()))
        agents, text = B.report(repo, sha["b1"], green, log, [journal], now=0)
        check(agents == ["beta", "alpha"], "agents newest first %s" % agents)
        lines = text.splitlines()
        check(lines[0] == "to: beta alpha main", "to line %r" % lines[0])
        check("partial_e2e desktop-checks" in lines[1] and sha["b1"][:9] in lines[1], "head %r" % lines[1])
        body = "\n".join(lines)
        check("%s feat: a1 (alpha)" % sha["a1"][:9] in body and "%s feat: a2 (alpha)" % sha["a2"][:9] in body,
              "a land of 2 commits: both alpha's\n" + body)
        check("%s feat: hand (no land line" % sha["hand"][:9] in body, "a hand commit: no agent\n" + body)
        check(sha["base"][:9] + " feat: base" not in body, "the last green itself is out\n" + body)

        out = os.path.join(t, "tip-red")
        r = subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "tip_blame.py"), "--repo", repo, "--tested", "main",
                            "--green", green, "--log", log, "--journal", journal, "--out", out], capture_output=True, text=True)
        check(r.returncode == 0 and open(out).read().startswith("to: beta alpha main\n") and not os.path.exists(out + ".tmp"),
              "the file: rc %s %s" % (r.returncode, r.stderr))
        # a second red before main forwarded the first: one file, one 'to:' line, both reports
        r = subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "tip_blame.py"), "--repo", repo, "--tested", sha["a2"],
                            "--green", green, "--log", log, "--journal", journal, "--out", out, "--what", "nightly"], capture_output=True, text=True)
        both = open(out).read()
        check(r.returncode == 0 and both.startswith("to: beta alpha main\n") and both.count("to:") == 1
              and "tip gate red on main %s" % sha["b1"][:9] in both and "nightly red on main %s" % sha["a2"][:9] in both,
              "merged\n" + both)
        # no green known: the last 20 commits, said so
        _, text = B.report(repo, sha["b1"], os.path.join(t, "none.tsv"), log, [journal], now=0)
        check("(none known: the last 20)" in text and "feat: base" in text, "no green\n" + text)
    finally:
        shutil.rmtree(t, ignore_errors=True)
    for f in FAILS:
        print("FAIL", f)
    print("tip_blame_test: %s" % ("ok" if not FAILS else "%d failed" % len(FAILS)))
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(main())
