"""A desktop app's hubs never run from inside its bundle (ambient-lead m_21726, architect m_21731).

His try refused its update twice: after the app quit, the hubs its core had started (and their
REPLs, plugin bridges and computer-use servers) still ran from 'bise try.app/Contents/Resources/bin/
bise', so the swap of the bundle had to wait for them. The core installs the bundle's runtime as
<prefix>/versions/<id> (update::hub_root) and now starts its hubs with that dir's bise
(update::hub_exe).

Here, on a throwaway home: a stand-in bundle (Contents/Resources/bin: this tree's bise, its runtime
and a VERSION), `bise ambient-core` run from it as the app runs it, its hub up and main's REPL
started by a message, then a NEW agent (t1). Then: the hub and both REPLs run from
versions/<id>/bise's dir, and once the core is gone no process of the hub's tree (sbd, repl-live,
plugins serve, computer-use) runs from the bundle. Last, app B with the same id and another commit
(every promoted candidate said id=root, ambient-lead m_21844): its new hub runs from
versions/<id>-<commit12>, B's own runtime, and A's dir is left as it was.

Run: python3 -u tests/hub_outside_app_e2e.py (after cd rust && cargo build)
"""
import os
import shutil
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
import wait  # noqa: E402
from ambient_core_e2e import Core  # noqa: E402
from e2e import EXE, ROOT, check  # noqa: E402

# the runtime the desktop pack puts next to bise (electron-builder.mjs, BISE_PACK_ROOT)
RUNTIME = ("repl-live", "repl-scripted", "sb-core", "prompts", "kit", "plugins", "computer-use")
ID = "app-hub-outside-%d" % os.getpid()
A, B = "a1" * 20, "b2" * 20


def bundle(tmp, name, commit):
    """A stand-in '<name>.app' with its runtime in Contents/Resources/bin: bise copied (its
    canonical path must be in the bundle), the runtime linked to this tree, a VERSION with that
    commit (every promoted candidate said id=root: ambient-lead m_21844, so the id is shared)."""
    app = os.path.join(tmp, name + ".app")
    bin_dir = os.path.join(app, "Contents", "Resources", "bin")
    os.makedirs(bin_dir)
    shutil.copy2(EXE, os.path.join(bin_dir, "bise"))
    for n in RUNTIME:
        src = os.path.join(ROOT, n)
        if os.path.exists(src):
            os.symlink(src, os.path.join(bin_dir, n))
    with open(os.path.join(bin_dir, "VERSION"), "w") as f:
        f.write("id=%s%scommit=%s%s" % (ID, chr(10), commit, chr(10)))
    return app, bin_dir


def procs():
    """Every process: (pid, command)."""
    out = subprocess.run(["ps", "-axww", "-o", "pid=,command="], capture_output=True, text=True).stdout
    rows = []
    for line in out.splitlines():
        pid, _, cmd = line.strip().partition(" ")
        if pid.isdigit():
            rows.append((int(pid), cmd))
    return rows


def turns(c, name):
    """`name`'s finished turns on the hub (0 while one runs or before its first)."""
    a = c.agent(name) or {}
    return (a.get("turns") or 0) if a.get("status") == "idle" else 0


def hub_exe(E):
    hubs = [(p, c) for p, c in procs() if " sbd --workspace " in c and c.endswith(E.ws)]
    check(len(hubs) == 1, "one hub for the workspace: %r" % hubs)
    return hubs[0][1].split(" sbd --workspace ")[0] if hubs else ""


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: cd rust && cargo build")
    E = e2e.Env()
    core = None
    app, bin_dir = bundle(E.tmp, "bise a", A)
    inside = os.path.join(app, "Contents") + "/"
    app_b, bin_b = bundle(E.tmp, "bise b", B)
    try:
        core = Core(E, exe=os.path.join(bin_dir, "bise"), cwd=E.tmp, env=E.env)
        core.wait(lambda e: e.get("ev") == "hub" and e.get("up") is True, 60, "hub up")
        core.wait(lambda e: e.get("ev") == "state", 30, "a state")
        # main's REPL (and its plugin bridge) starts with a message, sent on the hub's socket: the
        # core's own send goes to its focused project, the home one here, not this workspace
        c = e2e.Client(os.path.join(E.state, "hub.sock"))
        c.say("hello")
        c.wait(lambda: turns(c, "main") >= 1, 120, "main's turn done")
        # a NEW agent: the hub starts a REPL from its own dir (ambient-lead m_21839: a dir without
        # repl-live kept old REPLs but could start none)
        c.say("/new t1: say hi")
        c.wait_status("t1", ["idle", "done", "blocked"], 120)

        exe = hub_exe(E)
        dir_a = os.path.dirname(exe)
        check(exe.endswith(os.path.join("versions", ID, "bise")), "the hub runs from the installed runtime: %s" % exe)
        check(not exe.startswith(inside), "never from inside the bundle: %s" % exe)
        repls = [c for _, c in procs() if c.startswith(dir_a + "/repl-live")]
        check(len(repls) >= 2, "main's and t1's REPLs run from %s: %r" % (dir_a, repls))
        mine = [(p, c) for p, c in procs() if ID in c or c.startswith(inside)]
        check(all(not c.startswith(inside) for _, c in mine if "ambient-core" not in c),
              "only the core runs from the bundle: %r" % [m for m in mine if m[1].startswith(inside)])

        # the app quits: its core goes; the hub's tree stays, none of it in the bundle
        core.p.stdin.close()
        core.p.wait(timeout=20)
        core = None
        left = [(p, c) for p, c in procs() if c.startswith(inside)]
        check(left == [], "after the app quit nothing runs from the bundle: %r" % left)
        check(any(" sbd --workspace " in c and c.endswith(E.ws) for _, c in procs()), "its hub lives on")

        # app B, same id, another build: its new hub runs B's runtime, never A's dir
        e2e.stop_hub(os.path.join(E.state, "hub.sock"), False)
        wait.until(lambda: not any(" sbd --workspace " in c and c.endswith(E.ws) for _, c in procs()), 30, "A's hub gone")
        core = Core(E, exe=os.path.join(bin_b, "bise"), cwd=E.tmp, env=E.env, err="core-b.stderr")
        core.wait(lambda e: e.get("ev") == "hub" and e.get("up") is True, 60, "B's hub up")
        exe_b = hub_exe(E)
        check(exe_b.endswith(os.path.join("versions", "%s-%s" % (ID, B[:12]), "bise")), "B's hub runs B's own dir: %s" % exe_b)
        ver = open(os.path.join(os.path.dirname(exe_b), "VERSION")).read()
        check("commit=" + B in ver, "that dir is B's build: %r" % ver)
        check("commit=" + A in open(os.path.join(dir_a, "VERSION")).read(), "A's dir untouched")
        # a new hub counts its turns from 0 (the agents row's turns: this run's)
        c = e2e.Client(os.path.join(E.state, "hub.sock"))
        c.wait(lambda: c.agent("main") is not None, 30, "main on B's hub")
        check(turns(c, "main") == 0, "B's hub: no turn of main yet: %r" % c.agent("main"))
        c.say("hello again")
        c.wait(lambda: turns(c, "main") >= 1, 120, "main's turn on B")
        repls = [c for _, c in procs() if c.startswith(os.path.dirname(exe_b) + "/repl-live")]
        check(len(repls) >= 1, "main's REPL runs from B's dir: %r" % repls)
    finally:
        if core is not None:
            core.p.kill()
        e2e.stop_hub(os.path.join(E.state, "hub.sock"), False)
        wait.until(lambda: not any(c.startswith(E.tmp) or ID in c for _, c in procs()), 30,
                   "the hub's tree gone", poll=0.2)
        E.close()
    print("hub_outside_app_e2e: ok")


if __name__ == "__main__":
    main()
