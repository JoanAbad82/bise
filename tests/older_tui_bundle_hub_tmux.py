"""A TUI of before the bundle layout (v2026.10.2-30) on a hub that runs
from a version's signed bundle (scripts/versions.sh: <v>/bise ->
bise.app/Contents/MacOS/bise, docs/issues/15). The older TUI follows the
hub's exe (<v>/bise.app/Contents/MacOS/bise, canonical) and, since its
approot::of_exe knows no bundle, re-execs it with BISE_APP_ROOT set to the
exe's own folder, bise.app/Contents/MacOS. That bise must read the folder
as its version dir: before the fix it exited at once with
'BISE_APP_ROOT=<v>/bise.app/Contents/MacOS has no repl-live' (the user's
plain `bise` quit every time on his 40d2f179 hub).

By default the test runs that handoff itself (the exec the older TUI
makes); BISE_OLDER_CLIENT=<a released bise> runs that release's TUI
first, which connects, follows the hub's exe and re-execs.

python3 -u tests/older_tui_bundle_hub_tmux.py (after scripts/bins.sh)
"""
import os
import re
import shlex
import shutil
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bise_env  # noqa: E402
import e2e  # noqa: E402
import wait  # noqa: E402
from tui_tmux import Tui, tmux, pane_env, pane_unset, run, MAIN_IDLE  # noqa: E402

# what a version dir holds besides bise (versions.sh), from this tree
FROM_TREE = ("repl-live", "repl-scripted", "sb-core", "prompts", "kit", "plugins", "computer-use")


def bundle_version(tmp):
    """A version dir in the bundle layout: bise -> bise.app/Contents/MacOS/bise
    (this tree's binary, a hard link or a copy: never a symlink, the
    executable's canonical path must be in the bundle), VERSION, the rest
    linked to this tree."""
    v = os.path.join(tmp, "versions", "v1")
    macos = os.path.join(v, "bise.app", "Contents", "MacOS")
    os.makedirs(macos)
    exe = os.path.join(macos, "bise")
    try:
        os.link(e2e.EXE, exe)
    except OSError:
        shutil.copy2(e2e.EXE, exe)
    os.symlink("bise.app/Contents/MacOS/bise", os.path.join(v, "bise"))
    os.symlink("bise", os.path.join(v, "sb"))
    with open(os.path.join(v, "VERSION"), "w") as f:
        f.write("id=v1\ncommit=test\n")
    for name in FROM_TREE:
        src = os.path.join(e2e.ROOT, name)
        if os.path.exists(src):
            os.symlink(src, os.path.join(v, name))
    return v, macos


def main():
    E = e2e.Env()
    t = Tui(E, "sbolder%d" % os.getpid())
    ok = False
    hub = None
    try:
        v, macos = bundle_version(E.tmp)
        # the hub runs from the bundle, its root found from its exe (no
        # BISE_APP_ROOT: a switched hub's)
        bise_env.refuse_real_home(E.env)
        env = {k: val for k, val in E.env.items() if k != "BISE_APP_ROOT"}
        err = open(os.path.join(E.tmp, "hub.stderr"), "a")
        hub = subprocess.Popen([os.path.join(v, "bise"), "sbd", "--workspace", E.ws], cwd=v, env=env,
                               stdin=subprocess.DEVNULL, stdout=err, stderr=err)
        sock = os.path.join(E.state, "hub.sock")
        wait.until(lambda: os.path.exists(sock), 20, "the bundle hub's socket %s" % sock, poll=0.05)
        root = open(os.path.join(E.state, "hub.root")).read().strip()
        assert os.path.realpath(root) == os.path.realpath(v), (root, v)

        older = os.environ.get("BISE_OLDER_CLIENT")
        if older:
            # a released TUI: its own root, it follows the hub's exe
            exe, extra = older, {"BISE_APP_ROOT": os.path.dirname(os.path.realpath(older))}
            cwd = e2e.ROOT
        else:
            # what that TUI execs: the hub's exe, its folder as the root
            exe, extra = os.path.join(macos, "bise"), {"BISE_APP_ROOT": macos}
            cwd = macos
        envs = " ".join("%s=%s" % (k, shlex.quote(val)) for k, val in {**pane_env(E.env), **extra}.items())
        unset = " ".join("-u " + k for k in pane_unset(E.env))
        cmd = "cd %s && env %s %s %s switchboard --workspace %s; echo \"[switchboard exited: $?]\"; sleep 600" % (
            shlex.quote(cwd), unset, envs, shlex.quote(exe), shlex.quote(E.ws))
        tmux("new-session", "-d", "-s", t.name, "-x", "120", "-y", "30", cmd)

        i, sc = t.wait_any(["bise :*", "[switchboard exited"])
        assert i == 0, "the TUI quit:\n" + sc
        # the TUI that runs becomes the bundle's bise: the older one
        # re-executes once no key came for reload_wait's QUIET (3 s), so
        # no key before it
        pid = tmux("display-message", "-p", "-t", t.name, "#{pane_pid}").strip()
        # (the hub's exe as the hub says it: <v>/bise or the bundle's)
        bundle_tuis = [os.path.join(d, "bise") + " switchboard" for d in (v, macos)]

        def tui_cmds():
            return subprocess.run(["ps", "-o", "command=", "-g", pid], capture_output=True, text=True).stdout

        def bundle_tui():
            return any(b in tui_cmds() for b in bundle_tuis)
        wait.until(lambda: bundle_tui() or "[switchboard exited" in t.screen(), 30,
                   lambda: "the bundle's TUI: %s" % tui_cmds(), poll=0.2)
        i, sc = t.wait_any([re.compile(MAIN_IDLE, re.M), "[switchboard exited"])
        assert i == 0, "the TUI quit after its re-exec:\n" + sc
        t.typed("still-here")
        t.keys("Enter")
        sc = t.wait("ack: still-here")
        assert "[switchboard exited" not in sc and "has no repl-live" not in sc, sc
        assert bundle_tui(), tui_cmds()
        ok = True
    finally:
        tmux("kill-session", "-t", t.name)
        if hub:
            try:
                e2e.stop_hub(os.path.join(E.state, "hub.sock"))
                hub.wait(timeout=20)
            except Exception:
                hub.kill()
        if not ok:
            os.environ["SB_KEEP"] = "1"
        E.close()


if __name__ == "__main__":
    run(main)
