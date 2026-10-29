#!/usr/bin/env python3
"""tip_blame: who to tell when the tip gate (scripts/nightly_gate.sh --tip) is red on main
(review-gates m_36198, main m_36204, Gabriel's « merger et tester après sur main »).

  scripts/tip_blame.py --repo <tree> --tested <sha> --green <green-shas.tsv> --log <gate log>
                       [--journal <journal.jsonl>]... [--out <tip-red>]

The commits last-green..tested (last green: the newest sha of green-shas.tsv that is an ancestor of
the tested one), each with its subject and the agent that landed it: the hub journals'
'✓ <agent> landed <n> commit(s) on main (<sha>)' lines (sb land's own line, in the message that
ends the agent's land), <sha> and its n-1 parents being that agent's. Then the failing tests (the
log's FAIL lines). Out: the tip-red file, written whole (tmp + mv), main forwards it to its 'to:'
line's agents (main m_36219: main's watch on it, sb wake --on-file, deletes it once sent):
  to: <agent> <agent> main
  tip gate red on main <sha12> (<date>)
  commits since the last green <sha12>: ...
No --out: printed. Tests: tests/tip_blame_test.py."""
import argparse
import os
import re
import subprocess
import sys
import time

LANDED = re.compile(r"✓ ([A-Za-z0-9@._-]+) landed (\d+) commits? on main \(([0-9a-f]{7,40})\)")
JOURNAL_TAIL = 64 * 1024 * 1024


def git(repo, *args):
    r = subprocess.run(["git", "-C", repo, *args], capture_output=True, text=True)
    return r.stdout.strip() if r.returncode == 0 else None


def landed(texts):
    """[(agent, n, sha)] from the journals' text, in order (a later line wins for a sha)"""
    out = []
    for t in texts:
        for m in LANDED.finditer(t):
            out.append((m.group(1), int(m.group(2)), m.group(3)))
    return out


def owners(repo, lands):
    """{full sha: agent}: each land's sha and its n-1 first parents"""
    own = {}
    for agent, n, sha in lands:
        shas = git(repo, "rev-list", "--first-parent", "-n", str(max(n, 1)), sha)
        for s in (shas or "").split():
            own[s] = agent
    return own


def last_green(repo, green_tsv, tested):
    """the newest sha of green-shas.tsv that is an ancestor of `tested` (itself included), or None"""
    try:
        shas = [l.split("\t", 1)[0] for l in open(green_tsv).read().splitlines() if l.strip()]
    except OSError:
        return None
    for s in reversed(shas):
        if subprocess.run(["git", "-C", repo, "merge-base", "--is-ancestor", s, tested], capture_output=True).returncode == 0:
            return s
    return None


def fails(log_text):
    """the failing tests and steps: the log's FAIL lines, their names"""
    names = []
    for l in log_text.splitlines():
        if l.startswith("FAIL "):
            n = l[5:].split(":", 1)[0].strip()
            if n and n not in names:
                names.append(n)
    return names


def report(repo, tested, green_tsv, log, journals, now=None, what="tip gate"):
    """(agents, text): the tip-red file's content"""
    green = last_green(repo, green_tsv, tested)
    rng = "%s..%s" % (green, tested) if green else tested
    lines = git(repo, "log", "--first-parent", "--format=%H %s", rng, *([] if green else ["-n", "20"])) or ""
    texts = []
    for j in journals:
        try:
            with open(j, "rb") as f:
                f.seek(max(0, os.path.getsize(j) - JOURNAL_TAIL))
                texts.append(f.read().decode("utf-8", "replace"))
        except OSError:
            pass
    own = owners(repo, landed(texts))
    commits, agents = [], []
    for l in lines.splitlines():
        sha, _, subject = l.partition(" ")
        who = own.get(sha)
        commits.append("  %s %s (%s)" % (sha[:9], subject[:100], who or "no land line: main's or a hand commit"))
        if who and who not in agents:
            agents.append(who)
    try:
        log_text = open(log, errors="replace").read()
    except OSError:
        log_text = ""
    red = fails(log_text)
    when = time.strftime("%Y-%m-%d %H:%M", time.localtime(now or time.time()))
    text = "\n".join([
        "to: %s" % " ".join(agents + ["main"]),
        "%s red on main %s (%s): %s" % (what, tested[:9], when, " ".join(red) or "no FAIL line, see the log"),
        "commits since the last green %s:" % (green[:9] if green else "(none known: the last 20)"),
        *commits,
        "log: %s" % log,
        "your land in this range? revert it first if the red is yours, then fix (main m_36091)",
    ]) + "\n"
    return agents, text


def merged(old, new):
    """a report main has not forwarded yet (the file still there) and a new one: one 'to:' line, every
    agent of both (main last), then both bodies"""
    def split(t):
        lines = t.splitlines()
        to = lines[0][3:].split() if lines and lines[0].startswith("to:") else []
        return [w for w in to if w != "main"], lines[1:] if to or (lines and lines[0].startswith("to:")) else lines
    a, ab = split(old)
    b, bb = split(new)
    to = a + [w for w in b if w not in a] + ["main"]
    return "\n".join(["to: " + " ".join(to), *ab, "", *bb]) + "\n"


def main(argv):
    a = argparse.ArgumentParser()
    a.add_argument("--repo", required=True)
    a.add_argument("--tested", required=True)
    a.add_argument("--green", required=True)
    a.add_argument("--log", required=True)
    a.add_argument("--journal", action="append", default=[])
    a.add_argument("--out")
    a.add_argument("--what", default="tip gate")
    o = a.parse_args(argv)
    tested = git(o.repo, "rev-parse", o.tested) or o.tested
    _, text = report(o.repo, tested, o.green, o.log, o.journal, what=o.what)
    if o.out:
        text = merged(open(o.out).read(), text) if os.path.exists(o.out) else text
        with open(o.out + ".tmp", "w") as f:
            f.write(text)
        os.replace(o.out + ".tmp", o.out)
    else:
        sys.stdout.write(text)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
