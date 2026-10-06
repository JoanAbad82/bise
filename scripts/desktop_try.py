#!/usr/bin/env python3
"""desktop-try: the user's first try of bise desktop, on a bise home of its own.

  bise-ambient --try [repo…] [--fresh] [--replace]   build, set up the try home, open the app on it
  bise-ambient --try --stop                          stop the try's app and hubs (by pid)

(~/.local/bin/bise-ambient execs scripts/desktop-try.sh, which runs this.)

The try home is ~/.bise/try/desktop (BISE_HOME): its own hubs, sockets, run dirs, journals,
projects.json and prefs, and its own home workspace (BISE_HOME_WORKSPACE=<try>/bise, never his
~/bise). HOME stays his (git config, his tools). Nothing is written under his ~/.bise outside
~/.bise/try/, nothing in his repos:

- his repos (his projects.json, read only, or the ones given) are plain local clones under
  <try>/repos (hardlinked objects, no alternates: a gc in his repo can't break them), their push
  URL set to fail, so nothing pushes into his real repo; re-run reuses them (a fetch from his repo),
  --fresh redoes everything;
- his model login is read, never copied: each API-key entry of his auth.json becomes a
  key_command in the try's config.toml that reads it at each call; a ChatGPT sign-in becomes a
  key_command that refreshes HIS grant under HIS lock (subs-auth m_9175/m_9180); his config.toml
  is copied without [pages] (its mirror would publish to his site);
- no connectors, the computer plugin disabled: his first try runs on his code only;
- one app at its one path (his build dir), opened with BISE_HOME=<try>; his own running app is
  quit only on his 'y' (or --replace), never silently (ambient-lead m_9174).

Decisions: ambient-lead m_9146/m_9174, architect m_9176 (the four leaks), subs-auth m_9175/m_9180.
The pure parts (env, guard, config, repos, names) are tested in tests/desktop_try_test.py.
"""
import json
import os
import re
import shutil
import signal
import socket
import subprocess
import sys
import time

REPO = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
sys.path.insert(0, os.path.join(REPO, "tests"))
from bise_env import NOT_INHERITED, OWN_PATHS  # noqa: E402  (the one list, never copied)

GATE = os.path.realpath(os.path.expanduser("~/.bise/gate"))


class TryError(Exception):
    pass


def say(*a):
    print("bise try:", *a, file=sys.stderr, flush=True)


# ---------------------------------------------------------------- where (pure)

def homes(env=None):
    """(his real ~/.bise, the try home). Tests point both under ~/.bise/gate."""
    env = os.environ if env is None else env
    real = os.path.realpath(os.path.expanduser(env.get("BISE_TRY_REAL") or "~/.bise"))
    tryh = os.path.realpath(os.path.expanduser(env.get("BISE_TRY_HOME") or os.path.join(real, "try", "desktop")))
    return real, tryh


def under(path, root):
    p, r = os.path.realpath(path), os.path.realpath(root)
    return p == r or p.startswith(r.rstrip("/") + "/")


def guard(real, tryh, paths=()):
    """The try home is under his ~/.bise/try (or a test's ~/.bise/gate), never his home itself;
    every path the try writes is under it."""
    if not (under(tryh, os.path.join(real, "try")) or under(tryh, GATE)) or os.path.realpath(tryh) == os.path.realpath(real):
        raise TryError("refused: the try home %s is not under %s/try" % (tryh, real))
    for p in paths:
        if not under(p, tryh):
            raise TryError("refused: %s is outside the try home %s" % (p, tryh))


def try_env(base, real, tryh, repo=REPO):
    """The environment of everything the try runs: his, minus every bise path override and
    internal variable (an agent's shell carries them; a value pointing at his ~/.bise would be
    kept, architect m_9176 (2)), plus the try home and its own home workspace."""
    drop = set(OWN_PATHS) | set(NOT_INHERITED) | {"BISE_HOME"}
    env = {k: v for k, v in base.items() if k not in drop and not k.startswith("SB_") and k != "BISE_ROLE"}
    env.update(BISE_HOME=tryh, BISE_HOME_WORKSPACE=os.path.join(tryh, "bise"), BISE_APP_ROOT=repo)
    return env


def his_env(base):
    """His own environment for his own app and the build (ambient.sh picks his build dir from
    it): no BISE_HOME, no agent's or hub's variables."""
    drop = set(OWN_PATHS) | set(NOT_INHERITED) | {"BISE_HOME"}
    return {k: v for k, v in base.items() if k not in drop and not k.startswith("SB_") and k != "BISE_ROLE"}


# ---------------------------------------------------------------- what (pure)

def his_repos(projects_text):
    """The paths of his projects.json ({"v":1,"projects":[{path,name,order}]}), by order."""
    try:
        d = json.loads(projects_text)
    except ValueError:
        return []
    rows = sorted((p for p in d.get("projects", []) if isinstance(p, dict) and p.get("path")), key=lambda p: p.get("order", 0))
    return [p["path"] for p in rows]


def clone_names(paths):
    """A folder name per repo under <try>/repos: its basename, '-2', '-3' when taken."""
    out, taken = [], set()
    for p in paths:
        base = re.sub(r"[^A-Za-z0-9._-]", "-", os.path.basename(os.path.normpath(p))) or "repo"
        name, i = base, 2
        while name in taken:
            name, i = "%s-%d" % (base, i), i + 1
        taken.add(name)
        out.append(name)
    return out


def config_for_try(his_config, his_auth, real, bise):
    """The try's config.toml: his, minus the [pages] table (its mirror would publish to his
    site), plus a key_command per entry of his auth.json that reads it there at each call:
    an API key with jq (read only), a ChatGPT sign-in through HIS bise home (his grant, his lock).
    Never a key or a token in the text."""
    lines, skip = [], False
    for line in his_config.splitlines():
        head = re.match(r"\s*\[([^\]]+)\]\s*$", line)
        if head:
            skip = head.group(1).strip() == "pages" or head.group(1).strip().startswith("pages.")
        if not skip:
            lines.append(line)
    auth_file = os.path.join(real, "auth.json")
    for pid, entry in sorted((his_auth or {}).items()):
        if not isinstance(entry, dict) or not re.fullmatch(r"[A-Za-z0-9_-]+", pid):
            continue
        if entry.get("type") == "api" or "key" in entry:
            cmd = "jq -r .%s.key '%s'" % (pid, auth_file)
        elif pid == "chatgpt":
            cmd = "BISE_HOME='%s' '%s' auth token chatgpt" % (real, bise)
        else:
            continue
        if '"' in cmd or "\\" in cmd:
            raise TryError("a path with a quote or a backslash can't go in a key_command: %s" % cmd)
        table = "[providers.%s]" % pid
        idx = next((i for i, l in enumerate(lines) if l.strip() == table), None)
        kc = 'key_command = "%s"' % cmd
        if idx is None:
            lines += ["", table, kc]
        else:
            j = idx + 1
            while j < len(lines) and not lines[j].strip().startswith("["):
                if lines[j].strip().startswith("key_command"):
                    lines.pop(j)
                    continue
                j += 1
            lines.insert(idx + 1, kc)
    return "\n".join(lines).rstrip() + "\n"


# ---------------------------------------------------------------- doing

def run(cmd, env, cwd=None, check=True):
    r = subprocess.run(cmd, env=env, cwd=cwd, capture_output=True, text=True)
    if check and r.returncode != 0:
        raise TryError("%s: %s" % (" ".join(cmd), (r.stderr or r.stdout).strip()[-600:]))
    return r


def pid_alive(pid):
    try:
        os.kill(int(pid), 0)
        return True
    except (OSError, ValueError, TypeError):
        return False


def read_pid(path):
    try:
        return int(open(path).read().strip())
    except (OSError, ValueError):
        return None


def build(env):
    """ambient-app's bise + repl-live + sb-core and the app, his build dirs, under the heavy lock
    (scripts/ambient.sh try --build-only: a launchd job under a file-size cap)."""
    lock = os.path.expanduser("~/.bise/run/heavy.lock")
    os.makedirs(os.path.dirname(lock), exist_ok=True)
    say("building ambient-app %s (waits for other heavy jobs first)…" % run(["git", "-C", REPO, "rev-parse", "--short", "HEAD"], env).stdout.strip())
    r = subprocess.run(["/usr/bin/lockf", "-k", lock, "nice", "-n", "10", os.path.join(REPO, "scripts", "ambient.sh"), "try", "--build-only"],
                       env=dict(env, CARGO_INCREMENTAL="0"))
    if r.returncode != 0:
        raise TryError("the build failed (exit %d)" % r.returncode)


def app_and_bise(env):
    """His one app path and the try path's bise (ambient.sh's, from his env)."""
    app = run([os.path.join(REPO, "scripts", "ambient.sh"), "path"], env).stdout.strip().splitlines()[-1]
    bise = os.path.join(os.path.dirname(app), "target", "debug", "bise")
    return app, bise


def setup(real, tryh, repos, env, bise):
    """The try home: its config, his repos' clones, registered as its projects; the computer
    plugin off. Re-run: the same clones, fetched."""
    os.makedirs(os.path.join(tryh, "bise"), exist_ok=True)
    os.makedirs(os.path.join(tryh, "repos"), exist_ok=True)
    cfg = os.path.join(tryh, "config.toml")
    his_cfg = open(os.path.join(real, "config.toml")).read() if os.path.exists(os.path.join(real, "config.toml")) else ""
    try:
        his_auth = json.load(open(os.path.join(real, "auth.json")))
    except (OSError, ValueError):
        his_auth = {}
    if his_auth and not shutil.which("jq", path=env.get("PATH")):
        raise TryError("jq is needed to read your API key where it is (brew install jq)")
    guard(real, tryh, [cfg])
    with open(cfg + ".tmp", "w") as f:
        f.write(config_for_try(his_cfg, his_auth, real, bise))
    os.chmod(cfg + ".tmp", 0o600)
    os.replace(cfg + ".tmp", cfg)
    names = clone_names(repos)
    listed = []
    try:
        listed = [p.get("path") for p in json.load(open(os.path.join(tryh, "projects.json"))).get("projects", [])]
    except (OSError, ValueError):
        pass
    out = []
    for src, name in zip(repos, names):
        dest = os.path.join(tryh, "repos", name)
        guard(real, tryh, [dest])
        if os.path.isdir(os.path.join(dest, ".git")):
            run(["git", "-C", dest, "fetch", "-q", "origin"], env, check=False)
            state = "reused"
        else:
            # a plain local clone: hardlinked objects, no alternates (architect m_9176 (4))
            run(["git", "clone", "-q", src, dest], env)
            state = "cloned"
        # origin is his real repo: a push from the try must fail, never write into it
        run(["git", "-C", dest, "remote", "set-url", "--push", "origin", "DISABLED-in-try"], env)
        if os.path.realpath(dest) not in [os.path.realpath(p) for p in listed if p]:
            run([bise, "project", "add", dest], env)
        out.append({"repo": src, "clone": dest, "state": state})
    run([bise, "plugins", "disable", "computer"], env, check=False)
    return out


def his_app_pid(real):
    pid = read_pid(os.path.join(real, "dev", "ambient", "app.pid"))
    return pid if pid and pid_alive(pid) else None


def ask_quit(pid, replace, stdin=None):
    """His app runs: quit it on his 'y' (or --replace), else refuse (ambient-lead m_9174)."""
    q = "your bise ambient app is running (pid %d). quit it and open the try?" % pid
    if replace:
        return True
    stdin = stdin or sys.stdin
    if not stdin.isatty():
        raise TryError(q + " (no terminal to answer: run it again with --replace)")
    sys.stderr.write(q + " [y/N] ")
    sys.stderr.flush()
    return stdin.readline().strip().lower() in ("y", "yes")


def open_app(app, bise, tryh, env):
    """The one app path on the try home's bise, as a normal app (it's his run, not a test)."""
    args = ["--bise", bise, "--web", os.path.join(REPO, "apps", "ambient", "web"), "--dev", os.path.join(tryh, "dev"),
            "--env", "BISE_HOME=%s" % tryh, "--env", "BISE_HOME_WORKSPACE=%s" % os.path.join(tryh, "bise"),
            "--env", "BISE_APP_ROOT=%s" % REPO, "--env", "PATH=%s" % env.get("PATH", "/usr/bin:/bin")]
    os.makedirs(os.path.join(tryh, "dev", "ambient"), exist_ok=True)
    run(["open", "-a", app, "--args"] + args, env)


def hub_socks(tryh):
    hubs = os.path.join(tryh, "hubs")
    return [os.path.join(hubs, d, "hub.sock") for d in sorted(os.listdir(hubs))] if os.path.isdir(hubs) else []


def stop_hub(sock, timeout=2.0):
    try:
        s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        s.settimeout(timeout)
        s.connect(sock)
        s.sendall(b'{"op":"hello"}\n{"op":"stop_hub"}\n')
        s.close()
        return True
    except OSError:
        return False


def try_pids(tryh):
    """Every process of the try home: its args name a path under it (its hubs' sbd --workspace,
    the app's core), found by pid, never by name."""
    out = subprocess.run(["ps", "-axww", "-o", "pid=,args="], capture_output=True, text=True).stdout
    me = os.getpid()
    pids = []
    for l in out.splitlines():
        pid, _, args = l.strip().partition(" ")
        if pid.isdigit() and int(pid) != me and (tryh + "/") in args and "desktop_try" not in args:
            pids.append(int(pid))
    return pids


def stop(real, tryh):
    """The try's app (its pid file), then each hub (stop_hub on its socket, then SIGTERM by pid)."""
    guard(real, tryh)
    out = {"app": None, "hubs": [], "killed": []}
    app = read_pid(os.path.join(tryh, "dev", "ambient", "app.pid"))
    if app and pid_alive(app):
        os.kill(app, signal.SIGTERM)
        t0 = time.time()
        while pid_alive(app) and time.time() - t0 < 10:
            time.sleep(0.2)
        out["app"] = app
    for sock in hub_socks(tryh):
        if os.path.exists(sock) and stop_hub(sock):
            out["hubs"].append(sock)
    t0 = time.time()
    while try_pids(tryh) and time.time() - t0 < 15:
        time.sleep(0.3)
    for pid in try_pids(tryh):
        try:
            os.kill(pid, signal.SIGTERM)
            out["killed"].append(pid)
        except OSError:
            pass
    return out


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    flags = {a for a in argv if a.startswith("--")}
    bad = flags - {"--try", "--stop", "--fresh", "--replace", "--no-build", "--no-open"}
    if bad:
        raise TryError("unknown option %s (--try [repo…] [--fresh] [--replace], --try --stop)" % ", ".join(sorted(bad)))
    real, tryh = homes()
    guard(real, tryh)
    if "--stop" in flags:
        r = stop(real, tryh)
        say("stopped the try (app %s, %d hubs)" % (r["app"] or "not running", len(r["hubs"])))
        say("your own app stays closed: bise-ambient to reopen it")
        return 0
    mine = his_env(os.environ)
    env = try_env(os.environ, real, tryh)
    pid = his_app_pid(real)
    if pid and not ask_quit(pid, "--replace" in flags):
        raise TryError("your bise ambient app is running (pid %d): the try didn't open" % pid)
    if "--no-build" not in flags:
        build(mine)
    # a test names its bise and never opens an app (ambient.sh path would build one)
    app, bise = (None, os.environ["BISE_TRY_BISE"]) if os.environ.get("BISE_TRY_BISE") else app_and_bise(mine)
    if app is None and "--no-open" not in flags:
        raise TryError("BISE_TRY_BISE is for tests: with --no-open only")
    if not os.access(bise, os.X_OK):
        raise TryError("no bise at %s: build first" % bise)
    if "--fresh" in flags and os.path.isdir(tryh):
        stop(real, tryh)
        guard(real, tryh, [tryh])
        shutil.rmtree(tryh)
    repos = [os.path.realpath(r) for r in args] or his_repos(open(os.path.join(real, "projects.json")).read()
                                                            if os.path.exists(os.path.join(real, "projects.json")) else "")
    for r in repos:
        if not os.path.isdir(os.path.join(r, ".git")) and not os.path.isfile(os.path.join(r, ".git")):
            raise TryError("%s is not a git repo" % r)
    done = setup(real, tryh, repos, env, bise)
    for d in done:
        say("%s %s -> %s" % (d["state"], d["repo"], d["clone"]))
    if "--no-open" in flags:
        say("set up (not opened): %s" % tryh)
        return 0
    if pid:
        subprocess.run([os.path.join(REPO, "scripts", "ambient.sh"), "stop"], env=mine)
        t0 = time.time()
        while pid_alive(pid) and time.time() - t0 < 10:
            time.sleep(0.2)
    open_app(app, bise, tryh, env)
    say("bise is open on the try home %s (%d projects). stop it: bise-ambient --try --stop" % (tryh, len(done)))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv[1:]))
    except TryError as e:
        say(str(e))
        sys.exit(1)
