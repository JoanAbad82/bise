"""A task's worktree in the e2e/tmux tests, once the hub made it: `sb spawn
--place new` answers before it exists, its worktree is made off the hub's loop
(hub-loop 41c5c6666)."""
import subprocess

import wait


def placed_worktree(ws, name, timeout=60):
    """(path, branch) of task `name`'s worktree of the repo at `ws`, once the
    hub made it: `sb spawn --place new` answers before it exists, its
    worktree is made off the hub's loop (hub-loop 41c5c6666), on sb/<name>."""
    want = "refs/heads/sb/%s" % name

    def made():
        out = subprocess.run(["git", "-C", ws, "worktree", "list", "--porcelain"],
                             capture_output=True, text=True).stdout
        for block in out.split("\n\n"):
            lines = dict(l.split(" ", 1) for l in block.splitlines() if " " in l)
            if lines.get("branch") == want and checked_out(lines["worktree"]):
                return lines["worktree"], want[len("refs/heads/"):]
        return None
    return wait.until(made, timeout, "%s's worktree (%s)" % (name, want))


def checked_out(wt):
    """git lists a worktree before its checkout ends: a file a test writes
    then can be overwritten by the checkout (tui_artifacts_tmux's README,
    its diff '1 file' under load). Done = a clean status."""
    r = subprocess.run(["git", "-C", wt, "status", "--porcelain"], capture_output=True, text=True)
    return r.returncode == 0 and not r.stdout.strip()
    return wait.until(made, timeout, "%s's worktree (%s)" % (name, want))
