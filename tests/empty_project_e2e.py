"""An empty folder (no git yet) is a project that just works, in the desktop app and in the
terminal (new-project, his ~/lab/app-form).

His try app couldn't start the hub of a new empty folder: '▲ not sent: its hub didn't start:
nothing sent. try again in a moment.' The cause was not the folder: the app's core starts its
hubs from its runtime copy, <prefix>/versions/<id> (update::hub_root), and `bise update` had
pruned that dir overnight (prune spared only the dirs a ps line names; the core runs from the
.app). Its spawn hit a missing exe: an empty hub.err, no hub.log.

Here, on a throwaway home, a stand-in bundle's `bise ambient-core`, as the app runs it:
- its runtime dir is leased while the core runs (release::lease: prune skips it);
- that dir deleted under it (last night's prune), an empty non-git folder added
  (project_add) and a message sent: its hub starts from the runtime put back, its
  main answers;
- `bise` in an empty non-git folder (the terminal, tmux): its main answers.

Run: python3 -u tests/empty_project_e2e.py (after cd rust && cargo build)
"""
import fcntl
import json
import os
import shutil
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
import tui_tmux  # noqa: E402
import wait  # noqa: E402
from ambient_core_e2e import Core  # noqa: E402
from e2e import EXE, check  # noqa: E402
from hub_outside_app_e2e import RUNTIME, procs  # noqa: E402

ID = "empty-project-e2e"
COMMIT = "c3" * 20


def bundle(tmp):
    """A stand-in 'bise try.app' (Contents/Resources/bin: this tree's bise copied, its runtime
    linked, a VERSION with its own id)."""
    bin_dir = os.path.join(tmp, "bise try.app", "Contents", "Resources", "bin")
    os.makedirs(bin_dir)
    shutil.copy2(EXE, os.path.join(bin_dir, "bise"))
    for n in RUNTIME:
        src = os.path.join(e2e.ROOT, n)
        if os.path.exists(src):
            os.symlink(src, os.path.join(bin_dir, n))
    with open(os.path.join(bin_dir, "VERSION"), "w") as f:
        f.write("id=%s%scommit=%s%s" % (ID, chr(10), COMMIT, chr(10)))
    return bin_dir


def leased(d):
    """A process holds a shared flock on d/.in-use (release::in_use)."""
    try:
        f = open(os.path.join(d, ".in-use"))
    except FileNotFoundError:
        return False
    with f:
        try:
            fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
            return False
        except BlockingIOError:
            return True


def desktop():
    E = e2e.Env()
    home = tempfile.mkdtemp(prefix="ep-", dir=e2e.short_tmp())
    home_ws = os.path.realpath(os.path.join(E.tmp, "home-ws"))
    os.makedirs(home_ws)
    # each project its own hub dir, under this home
    E.env.pop("SB_STATE_DIR")
    E.env["BISE_HOME"] = os.path.join(home, "b")
    E.env["BISE_HOME_WORKSPACE"] = home_ws
    E.env.pop("BISE_APP_ROOT", None)
    bin_dir = bundle(E.tmp)
    runtime = os.path.join(E.env["HOME"], ".local", "share", "bise", "versions", ID)
    empty = os.path.realpath(os.path.join(E.tmp, "lab", "app-form"))
    os.makedirs(empty)
    core = None
    try:
        core = Core(E, exe=os.path.join(bin_dir, "bise"), cwd=E.tmp, env=E.env)
        core.wait(lambda e: e.get("ev") == "hub" and e.get("up") is True, 60, "the core's hub up")
        check(os.path.exists(os.path.join(runtime, "bise")), "the bundle's runtime placed at %s" % runtime)
        check(leased(runtime), "the core leases its runtime: bise update's prune skips it")

        # last night: a prune from before the lease deleted it under the running core
        shutil.rmtree(runtime)
        core.cmd(cmd="shown", projects=[])
        at = core.mark()
        core.cmd(cmd="project_add", path=empty)
        core.wait(lambda e: e.get("ev") == "projects" and any(os.path.realpath(r["path"]) == empty for r in e["projects"]),
                  60, "the empty folder is a project row", since=at)
        row = [r for r in core.last("projects")["projects"] if os.path.realpath(r["path"]) == empty][0]
        pid = row["project"]
        check(row["git"] is False, "not a git repo: %r" % row)
        core.cmd(cmd="shown", projects=[pid])
        core.cmd(cmd="subscribe", project=pid, agent="main")
        core.cmd(cmd="send", project=pid, agent="main", text="a Typeform-like app for Flora", mode="now")
        core.wait(lambda e: e.get("ev") == "entry" and e.get("project") == pid and e["entry"]["kind"] == "agent",
                  120, "app-form's main answers", since=at)
        with core.lock:
            errs = [e for e in core.evs[at:] if e.get("ev") == "error" and e.get("project") == pid]
        check(not errs, "no error for the empty folder's send: %r" % errs)
        hubs = [c for _, c in procs() if " sbd --workspace " in c and c.endswith(empty)]
        check(len(hubs) == 1 and hubs[0].startswith(os.path.join(runtime, "bise")),
              "its hub runs from the runtime put back: %r" % hubs)
        check(leased(runtime), "the runtime put back is leased again")
        print("PASS desktop: an empty folder's main answers, its runtime put back", flush=True)
    finally:
        if core:
            core.p.stdin.close()
            try:
                core.p.wait(timeout=10)
            except subprocess.TimeoutExpired:
                core.p.kill()
        hubs = os.path.join(E.env["BISE_HOME"], "hubs")
        for d in os.listdir(hubs) if os.path.isdir(hubs) else []:
            sock = os.path.join(hubs, d, "hub.sock")
            if os.path.exists(sock):
                e2e.stop_hub(sock)
        E.close()
        shutil.rmtree(home, ignore_errors=True)


def terminal():
    """`bise` in an empty non-git folder: its hub starts, main answers."""
    E = e2e.Env()
    empty = os.path.join(E.tmp, "empty")
    os.makedirs(empty)
    E.ws = empty
    with tui_tmux.tui_session(150, 42, E=E) as t:
        t.wait("main", 60)
        t.typed("hello from an empty folder")
        t.keys("Enter")
        t.wait("hello from an empty folder", 90)
        c = e2e.Client(os.path.join(E.state, "hub.sock"))
        c.wait(lambda: ((c.agent("main") or {}).get("turns") or 0) >= 1, 90, "main's turn done")
        with open(E.fake_log) as f:
            check("hello from an empty folder" in f.read(), "main's model got his words")
        check(not os.path.exists(os.path.join(empty, ".git")), "the folder stays as it was (no git made)")
    print("PASS terminal: bise in an empty folder, main answers", flush=True)


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: cd rust && cargo build")
    desktop()
    terminal()
    print(json.dumps({"empty_project_e2e": "ok"}))


if __name__ == "__main__":
    main()
