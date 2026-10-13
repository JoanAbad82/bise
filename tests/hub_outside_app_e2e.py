"""A desktop app's hubs never run from inside its bundle (ambient-lead m_21726, architect m_21731).

His try refused its update twice: after the app quit, the hubs its core had started (and their
REPLs, plugin bridges and computer-use servers) still ran from 'bise try.app/Contents/Resources/bin/
bise', so the swap of the bundle had to wait for them. The core installs the bundle's runtime as
<prefix>/versions/<id> (update::hub_root) and now starts its hubs with that dir's bise
(update::hub_exe).

Here, on a throwaway home: a stand-in bundle (Contents/Resources/bin: this tree's bise, its runtime
and a VERSION), `bise ambient-core` run from it as the app runs it, its hub up and main's REPL
started by a message. Then: the hub runs from versions/<id>/bise, and once the core is gone,
no process of the hub's tree (sbd, repl-live, plugins serve, computer-use) runs from the bundle.

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


def bundle(tmp):
    """A stand-in 'bise test.app' with its runtime in Contents/Resources/bin: bise copied (its
    canonical path must be in the bundle), the runtime linked to this tree, a VERSION."""
    app = os.path.join(tmp, "bise test.app")
    bin_dir = os.path.join(app, "Contents", "Resources", "bin")
    os.makedirs(bin_dir)
    shutil.copy2(EXE, os.path.join(bin_dir, "bise"))
    for name in RUNTIME:
        src = os.path.join(ROOT, name)
        if os.path.exists(src):
            os.symlink(src, os.path.join(bin_dir, name))
    with open(os.path.join(bin_dir, "VERSION"), "w") as f:
        f.write("id=%s%scommit=test%s" % (ID, chr(10), chr(10)))
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


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: cd rust && cargo build")
    E = e2e.Env()
    core = None
    app, bin_dir = bundle(E.tmp)
    inside = os.path.join(app, "Contents") + "/"
    try:
        core = Core(E, exe=os.path.join(bin_dir, "bise"), cwd=E.tmp, env=E.env)
        core.wait(lambda e: e.get("ev") == "hub" and e.get("up") is True, 60, "hub up")
        core.wait(lambda e: e.get("ev") == "state", 30, "a state")
        # main's REPL (and its plugin bridge) starts with a message
        core.cmd(cmd="send", text="hello")
        core.wait(lambda e: e.get("ev") == "agents" and any(
            a.get("name") == "main" and a.get("status") == "idle" and (a.get("turns") or 0) >= 1
            for a in e.get("agents") or []), 120, "main's turn done")

        hubs = [(p, c) for p, c in procs() if " sbd --workspace " in c and c.endswith(E.ws)]
        check(len(hubs) == 1, "one hub for the workspace: %r" % hubs)
        exe = hubs[0][1].split(" sbd --workspace ")[0] if hubs else ""
        check(exe.endswith(os.path.join("versions", ID, "bise")), "the hub runs from the installed runtime: %s" % exe)
        check(not exe.startswith(inside), "never from inside the bundle: %s" % exe)
        mine = [(p, c) for p, c in procs() if ID in c or c.startswith(inside)]
        check(any("repl-live" in c for _, c in mine), "main's REPL runs (from versions/%s): %r" % (ID, mine))
        check(all(not c.startswith(inside) for _, c in mine if "ambient-core" not in c),
              "only the core runs from the bundle: %r" % [m for m in mine if m[1].startswith(inside)])

        # the app quits: its core goes; the hub's tree stays, none of it in the bundle
        core.p.stdin.close()
        core.p.wait(timeout=20)
        core = None
        left = [(p, c) for p, c in procs() if c.startswith(inside)]
        check(left == [], "after the app quit nothing runs from the bundle: %r" % left)
        check(any(" sbd --workspace " in c and c.endswith(E.ws) for _, c in procs()), "its hub lives on")
    finally:
        if core is not None:
            core.p.kill()
        e2e.stop_hub(os.path.join(E.state, "hub.sock"), False)
        wait.until(lambda: not any(c.startswith(inside) or ID in c for _, c in procs()), 30,
                   "the hub's tree gone", poll=0.2)
        E.close()
    print("hub_outside_app_e2e: ok")


if __name__ == "__main__":
    main()
