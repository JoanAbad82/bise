"""The terminal and the desktop app on two versions, one project (desktop-on-main, architect m_19472 (a)).

With two release cycles, his TUI (version A, `bise update`'s) and the desktop app's core (version B,
the runtime the app carries) meet on one project's hub as the normal case. The rule: one hub per
project, of whichever version started it; a client of another version attaches (initialize) and
never restarts or switches that hub. A TUI follows the hub's version by re-executing itself as the
hub's bise (its rule since BISE-131); the core attaches as it is.

Two version dirs, A and B, from this tree (bise copied, its runtime linked, VERSION ids that
differ), one throwaway project, both orders:

  1. the TUI from A starts the hub; the core from B attaches: the hub keeps its pid and runs A;
  2. the core from B starts the hub; the TUI from A attaches (and follows B): the hub keeps its
     pid and runs B; the core never says hub_refused or broken.

Run: python3 -u tests/version_skew_e2e.py (after scripts/bins.sh)
"""
import json
import os
import queue  # noqa: F401  (the core reader's, ambient_core_e2e)
import shlex
import shutil
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bise_env  # noqa: E402
import e2e  # noqa: E402
import wait  # noqa: E402
from ambient_core_e2e import Core  # noqa: E402
from e2e import check  # noqa: E402
from tui_tmux import MAIN_IDLE, Tui, pane_env, pane_unset, tmux  # noqa: E402

# what a version dir holds besides bise (versions.sh), from this tree
FROM_TREE = ("repl-live", "repl-scripted", "sb-core", "prompts", "kit", "plugins", "computer-use")


def version_dir(tmp, vid):
    """A version dir `<tmp>/versions/<vid>`: this tree's bise (a hard link
    or a copy, so its path is its own), VERSION id=<vid>, the runtime
    linked to this tree. Its root is found from the exe (no BISE_APP_ROOT)."""
    v = os.path.join(tmp, "versions", vid)
    os.makedirs(v)
    exe = os.path.join(v, "bise")
    try:
        os.link(e2e.EXE, exe)
    except OSError:
        shutil.copy2(e2e.EXE, exe)
    os.symlink("bise", os.path.join(v, "sb"))
    with open(os.path.join(v, "VERSION"), "w") as f:
        f.write("id=%s\ncommit=test\n" % vid)
    for name in FROM_TREE:
        src = os.path.join(e2e.ROOT, name)
        if os.path.exists(src):
            os.symlink(src, os.path.join(v, name))
    return v


def env_of(E):
    """E's env with no app root: each bise finds its own from its exe."""
    return {k: val for k, val in E.env.items() if k != "BISE_APP_ROOT"}


class CoreOf(Core):
    """ambient_core_e2e's Core, run as the version dir `v`'s bise."""

    def __init__(self, E, v):
        self.err = open(os.path.join(E.tmp, "core-%s.stderr" % os.path.basename(v)), "a")
        bise_env.refuse_real_home(E.env)
        self.p = subprocess.Popen([os.path.join(v, "bise"), "ambient-core", "--workspace", E.ws], cwd=v, env=env_of(E),
                                  stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=self.err, text=True)
        import threading
        self.evs = []
        self.lock = threading.Lock()
        threading.Thread(target=self._read, daemon=True).start()

    def stop(self):
        try:
            self.p.stdin.close()
            self.p.wait(timeout=10)
        except (OSError, subprocess.TimeoutExpired):
            self.p.kill()


def tui_from(E, v, session):
    """The TUI as version dir `v`'s bise, in its own tmux session."""
    bise_env.refuse_real_home(E.env)
    env = env_of(E)
    envs = " ".join("%s=%s" % (k, shlex.quote(val)) for k, val in pane_env(env).items())
    unset = " ".join("-u " + k for k in pane_unset(env) + ["BISE_APP_ROOT"])
    cmd = "cd %s && env %s %s %s switchboard --workspace %s; echo \"[switchboard exited: $?]\"; sleep 600" % (
        shlex.quote(e2e.ROOT), unset, envs, shlex.quote(os.path.join(v, "bise")), shlex.quote(E.ws))
    tmux("new-session", "-d", "-s", session, "-x", "120", "-y", "30", cmd)
    return Tui(E, session)


def hub_facts(E):
    """(the hub's pid, the root it runs), from its state dir."""
    pid = open(os.path.join(E.state, "hub.pid")).read().split()[0].strip()
    root = open(os.path.join(E.state, "hub.root")).read().strip()
    return pid, os.path.realpath(root)


def no_refusal(core):
    bad = [e for e in core.evs if e.get("ev") in ("hub_refused", "broken")]
    check(not bad, "the core attached without a refusal: %s" % json.dumps(bad))


def one_order(name, first_tui):
    E = e2e.Env()
    a, b = version_dir(E.tmp, "skew-a"), version_dir(E.tmp, "skew-b")
    sock = os.path.join(E.state, "hub.sock")
    session = "sbskew%s%d" % (name, os.getpid())
    core = None
    ok = False
    try:
        if first_tui:
            t = tui_from(E, a, session)
            wait.until(lambda: os.path.exists(sock), 30, "the TUI's hub socket", poll=0.05)
            t.wait_re(MAIN_IDLE, 90)
            pid, root = hub_facts(E)
            check(root == os.path.realpath(a), "the TUI from A started the hub on A: %s" % root)
            core = CoreOf(E, b)
            core.wait(lambda e: e.get("ev") == "hub" and e.get("up") is True, 30, "the core from B: hub up")
            core.wait(lambda e: e.get("ev") == "state", 30, "a state")
            want = a
        else:
            core = CoreOf(E, b)
            core.wait(lambda e: e.get("ev") == "hub" and e.get("up") is True, 60, "the core from B started the hub")
            core.wait(lambda e: e.get("ev") == "state", 30, "a state")
            pid, root = hub_facts(E)
            check(root == os.path.realpath(b), "the core from B started the hub on B: %s" % root)
            t = tui_from(E, a, session)
            t.wait_re(MAIN_IDLE, 90)
            want = b
        # both clients on it: the hub is the one that started, on its version
        core.cmd(cmd="send", text="skew ping")
        core.wait(lambda e: e.get("ev") == "sent", 30, "the core's send reached the hub")
        t.wait("skew ping", 60)
        pid2, root2 = hub_facts(E)
        check(pid2 == pid, "%s: the hub kept its pid (%s, now %s): never restarted by the other version" % (name, pid, pid2))
        check(root2 == os.path.realpath(want), "%s: the hub still runs %s, not %s" % (name, want, root2))
        no_refusal(core)
        check("[switchboard exited" not in t.screen(), "%s: the TUI from A is still up" % name)
        print("ok   %s: hub pid %s on %s, both versions attached" % (name, pid, os.path.basename(want)))
        ok = True
    finally:
        tmux("kill-session", "-t", session)
        if core:
            core.stop()
        if os.path.exists(sock):
            e2e.stop_hub(sock)
        if ok:
            E.close()
        else:
            print("kept: %s" % E.tmp)
    return ok


def main():
    if not os.path.exists(e2e.EXE):
        sys.exit("build first: cd rust && cargo build")
    ok = one_order("tui-then-core", True) and one_order("core-then-tui", False)
    print("version_skew_e2e: %s" % ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
