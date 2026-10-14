"""shared-guard (docs/issues/28-shared-folder-stays-clean.md), end to end.

A real hub (bise sbd, scripted model) on a throwaway repo in trunk flow:
- `sb spawn` with no place: the task gets its own worktree; `--place
  shared`: the shared folder;
- a task in the shared folder writes 8 files with its file tool and
  commits none: the hub counts them (the board's `shared_wip`), the task
  gets one `[bise]` nudge and main one line;
- `sb move <task> new --with-changes`: its 8 files are in its new
  worktree, gone from the shared folder; the user's own edit there stays.
The age path (20 minutes) is proved by the laws (wip_age_nudges) and the
shared_wip unit tests, not waited for here.

Run: python3 -u tests/shared_guard_e2e.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
from e2e import EXE, check, out, sh  # noqa: E402

FILES = ["wip/f%d.txt" % i for i in range(8)]


def spawn(c, name, flags):
    c.say('[[bash: sb spawn %s %s --objective "{{bash: echo ready}}"]]' % (name, flags))
    c.wait(lambda: c.agent(name) is not None, 60, name)
    c.wait_idle(name, "main")
    return c.agent(name)


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: cd rust && cargo build")
    E = e2e.Env()
    os.makedirs(os.path.join(E.ws, ".switchboard"))
    open(os.path.join(E.ws, ".switchboard", "config.toml"), "w").write('[flow]\nmode = "trunk"\n')
    sh(E.ws, "git branch -M main && echo .switchboard/ > .gitignore && git add .gitignore && git commit -qm ignore")
    ok = True
    try:
        c = E.start_hub()
        c.wait_status("main", "idle", 60)

        a = spawn(c, "coder", "")
        check(a["mode"] == "worktree", "no place named: its own worktree: %r" % a)
        same = lambda p, q: os.path.realpath(p) == os.path.realpath(q)  # noqa: E731 (/tmp is /private/tmp)
        check(not same(a["path"], E.ws), "not the shared folder")
        s = spawn(c, "sharer", "--place shared")
        check(s["mode"] == "shared" and same(s["path"], E.ws), "--place shared: the shared folder: %r" % s)

        # his own edit in the shared folder: never the task's
        sh(E.ws, "echo his >> README")
        writes = " ".join('[[write_file: %s]]' % json.dumps({"file_path": f, "content": "wip %d\n" % i})
                          for i, f in enumerate(FILES))
        c.say(writes, focus="sharer")
        c.wait(lambda: all(os.path.exists(os.path.join(E.ws, f)) for f in FILES), 90, "the 8 files")
        c.wait_idle("sharer")

        # the count (about once a minute; the first one at once), then one nudge
        c.wait(lambda: (c.agent("sharer") or {}).get("shared_wip") == 8, 90, "the board's 8 unlanded")
        c.wait_line("sharer", "You have 8 uncommitted files in the shared folder", 90)
        # main's line: a note (sb-core's main_note), read with its next turn
        journal = os.path.join(E.state, "journal.jsonl")
        notes = lambda: [l for l in open(journal) if '"main_note"' in l and "shared folder: @sharer has 8 uncommitted files" in l]  # noqa: E731
        c.wait(lambda: notes(), 30, "main's note")
        check(len(notes()) == 1, "one note for main: %r" % notes())
        # the message as delivered (`sb you :: …`), not the fake model's echo of it
        nudges = [l for l in c.lines("sharer") if l.startswith("sb ") and "[bise] You have" in l]
        check(len(nudges) == 1, "one nudge: %r" % nudges)
        check(not any("@coder" in l and "shared folder:" in l for l in c.lines("main")), "the worktree task is not counted")
        c.wait_idle("sharer")

        # its work moves to its own worktree; the shared folder ends clean
        c.say("[[bash: sb move sharer new --with-changes]]")
        c.wait(lambda: (c.agent("sharer") or {}).get("mode") == "worktree", 90, "sharer in a worktree")
        c.wait_idle("main")
        wt = c.agent("sharer")["path"]
        for i, f in enumerate(FILES):
            check(open(os.path.join(wt, f)).read() == "wip %d\n" % i, "%s in the new worktree" % f)
            check(not os.path.exists(os.path.join(E.ws, f)), "%s gone from the shared folder" % f)
        check(out(E.ws, "git status --porcelain") == "M README", "only his edit is left: %r" % out(E.ws, "git status --porcelain"))
        check(open(os.path.join(wt, "README")).read() == "base\n", "his edit did not move")
        c.wait(lambda: not (c.agent("sharer") or {}).get("shared_wip"), 90, "the board's count back to 0")
        print("PASS shared_guard_e2e", flush=True)
    except Exception as e:
        ok = False
        print("FAIL shared_guard_e2e: %s" % e, flush=True)
        os.environ["SB_KEEP"] = "1"
    finally:
        E.close()
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
