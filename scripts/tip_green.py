#!/usr/bin/env python3
"""tip_green: a release is cut only from a sha main's tip gate found green (review-gates m_36198,
main m_36204: the other half of Gabriel's « merger et tester après sur main »: agents land
first, the tip gate tests main, a release takes only what it passed).

  scripts/tip_green.py <sha> [--not-tip-green "<why>"] [--repo <tree>]

Green: the sha is a line of <BISE_HOME>/gate/green-shas.tsv (gate.sh full and the tip gate write
it). Else refused (exit 1), naming the last green sha before it, unless main names it:
--not-tip-green "<why>" lets it through and prints 'not-tip-green <sha12>: <why>', the line the
release log keeps. desktop_tag.py and packaging/publish-release.sh call it before they tag.
Tests: tests/tip_green_test.py."""
import os
import subprocess
import sys


def green_shas(path):
    try:
        return [l.split("\t", 1)[0] for l in open(path).read().splitlines() if l.strip()]
    except OSError:
        return []


def verdict(shas, sha, why=None):
    """(ok, line): green, else let through by main's <why>, else refused"""
    if sha in shas:
        return True, "tip-green %s: main's tip gate passed it" % sha[:12]
    if why:
        return True, "not-tip-green %s: %s" % (sha[:12], why)
    return False, ("refused: %s is not tip-green (no line in green-shas.tsv): cut from a green sha, or main names "
                   "this one with --not-tip-green \"<why>\"" % sha[:12])


def main(argv):
    args, why, repo = list(argv), None, os.getcwd()
    for flag in ("--not-tip-green", "--repo"):
        if flag in args:
            i = args.index(flag)
            if i + 1 >= len(args) or not args[i + 1].strip():
                print("tip_green: %s wants a value" % flag)
                return 2
            if flag == "--repo":
                repo = args[i + 1]
            else:
                why = args[i + 1]
            del args[i:i + 2]
    if len(args) != 1:
        print(__doc__)
        return 2
    r = subprocess.run(["git", "-C", repo, "rev-parse", "--verify", "%s^{commit}" % args[0]], capture_output=True, text=True)
    if r.returncode != 0:
        print("tip_green: no commit %s in %s" % (args[0], repo))
        return 2
    bh = os.environ.get("BISE_HOME") or os.path.join(os.path.expanduser("~"), ".bise")
    ok, line = verdict(green_shas(os.path.join(bh, "gate", "green-shas.tsv")), r.stdout.strip(), why)
    print(line)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
