"""`sb feature retire <name>` end to end (feature-retire, architect m_20561).

A real hub (bise sbd, scripted model) on a throwaway repo in trunk flow:
a feature `fr` with three agents (fr-a, fr-b land a commit each on it,
fr-c holds a commit whose check is slow and fails). Refused while fr has
commits main lacks (the number said), and refused to a task. Then fr is
merged into main by hand (a merge commit, like ambient-app's), and main
retires it while fr-c's land holds fr's line and fr-b's next land waits
behind the retire: every agent stays live, fr-b's queued land goes to
main, the branch is renamed fr-retired, fr leaves the registry, one line
in main's feed, each agent its note. fr-a's next land goes to main; a
retire run again says there is nothing left.

Run: python3 -u tests/feature_retire_e2e.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
from e2e import EXE, check, out, sh  # noqa: E402

# the check sleeps then fails only where SLOW is (fr-c's worktree): a
# land that holds its line for 4 s and moves nothing
CHECK = "if [ -f SLOW ]; then sleep 8; exit 1; fi"


def land_cmd(name, f):
    return "echo %s > %s && git add %s && git commit -qm %s && sb land" % (name, f, f, name)


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: cd rust && cargo build")
    E = e2e.Env()
    os.makedirs(os.path.join(E.ws, ".switchboard"))
    open(os.path.join(E.ws, ".switchboard", "config.toml"), "w").write('[flow]\nmode = "trunk"\ncheck = "%s"\n' % CHECK)
    sh(E.ws, "echo .switchboard/ > .gitignore && git add .gitignore && git commit -qm ignore")
    ok = True
    try:
        c = E.start_hub()
        c.wait_status("main", "idle", 60)
        c.say("[[bash: sb feature new fr]]")
        c.wait_line("main", "fr is a feature: a local branch from main's tip", 60)
        c.wait_idle("main")

        # fr-c first: its worktree from fr's first tip, a commit, no land yet
        c.say('[[bash: sb spawn fr-c --feature fr --objective "{{bash: echo x > SLOW && git add SLOW && git commit -qm slow}}"]]')
        c.wait(lambda: c.agent("fr-c") is not None, 60, "fr-c")
        c.wait_idle("fr-c", "main")
        for n, f in (("fr-a", "a.txt"), ("fr-b", "b.txt")):
            c.say('[[bash: sb spawn %s --feature fr --objective "{{bash: %s}}"]]' % (n, land_cmd(n, f)))
            c.wait(lambda: c.agent(n) is not None, 60, n)
            c.wait_line("main", "%s landed 1 commit on fr" % n, 90)
            c.wait_idle(n, "main")
        check(c.agent("fr-a")["place_id"] == "feature:fr", "fr-a in the feature's place: %r" % c.agent("fr-a"))

        # refused: fr has 2 commits main lacks; nothing changes
        c.say("[[bash: sb feature retire fr; echo rc=$?]]")
        c.wait_line("main", "fr has 2 commits not in main", 60)
        check(out(E.ws, "git branch --list fr").strip() != "", "fr is still there")
        c.wait_idle("main")
        # refused to a task (an agent's script: {{bash}}, inside main's [[bash]])
        c.say("[[bash: sb send fr-a '{{bash: sb feature retire fr; echo rc=$?}}']]")
        c.wait_line("fr-a", "sb feature retire is main's", 60)
        c.wait_idle("fr-a", "main")

        # merged into main by hand: fr's tip is inside main now
        sh(E.ws, "git merge -q --no-ff fr -m 'Merge fr'")
        main_before = out(E.ws, "git rev-parse main")
        fr_tip = out(E.ws, "git rev-parse fr")

        # fr-c's land holds fr's line (its check sleeps then fails), the
        # retire waits behind it, fr-b's next land behind the retire (fr-b
        # writes when it asks, to show it asked before the retire's step)
        frb_at = os.path.join(E.tmp, "frb_at")
        frb = os.path.join(E.tmp, "frb.sh")
        open(frb, "w").write("sleep 2 && echo fr-b2 > b2.txt && git add b2.txt && git commit -qm fr-b2 && "
                             "python3 -c 'import time; print(int(time.time() * 1000))' > %s && sb land\n" % frb_at)
        c.say("[[bash: sb send fr-c '{{bash: sb land}}' && sleep 2 && "
              "sb send fr-b '{{bash: sh %s}}' && sb feature retire fr]]" % frb)
        c.wait_line("main", "fr retired: @fr-c, @fr-a, @fr-b land on main now, the branch renamed fr-retired, off the feature list.", 90)
        c.wait_line("main", "fr retired: its tip is in main · @fr-c, @fr-a, @fr-b land on main now · the branch kept as fr-retired", 30)
        c.wait_line("main", "@fr-c can't land", 30)
        c.wait_line("main", "fr-b landed 1 commit on main", 90)
        # the transcript's own timestamps ("<ts ms>\t<line>"; c.lines drops them)
        with open(os.path.join(c.agents_dir, "main", "transcript.log"), encoding="utf-8") as f:
            retired_at = next(int(l.split("\t", 1)[0]) for l in f if "fr retired: its tip is in main" in l)
        asked_at = int(open(frb_at).read().strip())
        check(asked_at < retired_at, "fr-b asked to land (%d) before the retire's step (%d): it waited behind it" % (asked_at, retired_at))
        check(out(E.ws, "git log -1 --format=%s main") == "fr-b2", "fr-b's queued land is on main: " + out(E.ws, "git log -3 --format=%s main"))
        check(out(E.ws, "git merge-base --is-ancestor %s main && echo in" % main_before) == "in", "main moved forward")
        check(out(E.ws, "git branch --list fr").strip() == "", "the branch fr is gone")
        check(out(E.ws, "git rev-parse fr-retired") == fr_tip, "kept as fr-retired, its tip unchanged")
        reg = json.load(open(os.path.join(E.state, "features.json")))
        check(all(f["name"] != "fr" for f in reg["features"]), "fr left the registry: %r" % reg)
        for n in ("fr-a", "fr-b", "fr-c"):
            a = c.agent(n)
            check(a["status"] != "archived", "%s stays live: %r" % (n, a))
            check(a["mode"] == "worktree" and a["branch"] == "sb/%s" % n, "%s keeps its worktree and branch: %r" % (n, a))
            check(a["place_id"] != "feature:fr", "%s is no longer in the feature's place: %r" % (n, a["place_id"]))
            c.wait_line(n, "The feature `fr` is retired", 60)
        c.wait_idle("fr-a", "fr-b", "fr-c", "main")

        # fr-a's next land goes to main
        c.say("[[bash: sb send fr-a '{{bash: %s}}']]" % land_cmd("fr-a2", "a2.txt"))
        c.wait_line("main", "fr-a landed 1 commit on main", 90)
        check(out(E.ws, "git log -1 --format=%s main") == "fr-a2", "fr-a2 on main")
        c.wait_idle("fr-a", "main")

        # run again: nothing left
        c.say("[[bash: sb feature retire fr]]")
        c.wait_line("main", "fr is retired already (its branch is fr-retired): nothing left to do.", 60)
        print("PASS feature_retire_e2e", flush=True)
    except Exception as e:
        ok = False
        print("FAIL feature_retire_e2e: %s" % e, flush=True)
        os.environ["SB_KEEP"] = "1"
    finally:
        E.close()
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
