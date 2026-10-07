#!/usr/bin/env python3
"""desktop_app.py: build, open and stop his bise desktop app (scripts/desktop.sh). Owner: amb-mac.

  desktop.sh build --bise <exe>                     build when its sources changed; the .app path on stdout
  desktop.sh path                                   the .app path (built or not)
  desktop.sh key --bise <exe>                       what the build is keyed on
  desktop.sh open [--workspace <ws> | --home] --bise <exe>
                                                    build if needed, then open it on that workspace
  desktop.sh stop                                   quit it (its process, by the bundle's path, never by name)
  desktop.sh status                                 running or not, its pid, the built key

It replaces the Swift app's launcher script, and `bise ambient` runs `desktop.sh open`.

One app, one path: <build dir>/desktop/bise.app (<build dir> as bins.sh picks it), 'bise',
dev.bise.desktop, with this bise packed inside (Contents/Resources/bin/bise) and the native
helper next to its executable. Rebuilt only when its key changed: this checkout's apps/desktop
(HEAD's tree and the uncommitted changes), the bise's own hash and the build recipe. Signed with
the stable identity in <build dir>/ambient/sign (made there once by
apps/desktop/scripts/sign-identity.sh when missing, never touched otherwise), so his grants stay
across rebuilds; ad hoc when it can't be made.

The build runs under the heavy lock at low priority (/usr/bin/lockf -k ~/.bise/run/heavy.lock nice
-n 10), packs into <build dir>/desktop/staging, and the new bundle replaces the old one only when
the app isn't running (a running app is never written over: the next build or open swaps it in).
"""
import hashlib
import json
import os
import shlex
import signal
import subprocess
import sys

HERE = os.path.dirname(os.path.realpath(__file__))
sys.path.insert(0, HERE)
from desktop_try import DESKTOP, REPO, bundle_pids, build_dir  # noqa: E402  (one rule for both)

APP_NAME = "bise"
APP_ID = "dev.bise.desktop"
LOCK = os.path.expanduser("~/.bise/run/heavy.lock")


class AppError(Exception):
    pass


def say(*a):
    print("bise desktop:", *a, file=sys.stderr)


def app_paths(env):
    """Where his app and its build parts go: one folder, <build dir>/desktop. Pure."""
    d = os.path.join(build_dir(env), "desktop")
    arch = "mac-arm64" if os.uname().machine == "arm64" else "mac"
    staging = os.path.join(d, "staging")
    return {"dir": d, "app": os.path.join(d, APP_NAME + ".app"), "helper": os.path.join(d, "bise-mac-helper"),
            "staging": staging, "staged": os.path.join(staging, arch, APP_NAME + ".app"),
            "stamp": os.path.join(d, "app.stamp"), "sign": os.path.join(build_dir(env), "ambient", "sign")}


def build_script(paths, bise, sign_dir=None):
    """The build, run under the heavy lock from this checkout: the native helper, then the app
    (pnpm install --frozen-lockfile, build, dist = electron-builder --mac --dir) packed into the
    staging dir, a fresh one each time. Pure."""
    q = shlex.quote
    sign = " BISE_PACK_SIGN_DIR=%s" % q(sign_dir) if sign_dir else ""
    return "\n".join([
        "set -euo pipefail",
        "cd %s" % q(REPO),
        "export MACOSX_DEPLOYMENT_TARGET=\"$(scripts/bins.sh macos-target)\"",
        "mkdir -p %s" % q(paths["dir"]),
        # ad hoc here; afterPack signs the whole app deep with the stable identity
        "apps/desktop/native/mac/build.sh %s" % q(paths["helper"]),
        "cd %s" % q(DESKTOP),
        "pnpm install --frozen-lockfile",
        "pnpm build",
        "rm -rf %s" % q(paths["staging"]),
        "BISE_PACK_NAME=%s BISE_PACK_APP_ID=%s BISE_PACK_BISE=%s BISE_PACK_HELPER=%s%s BISE_PACK_OUT=%s pnpm dist"
        % (q(APP_NAME), q(APP_ID), q(bise), q(paths["helper"]), sign, q(paths["staging"])),
    ]) + "\n"


def file_hash(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def git(*args):
    return subprocess.run(["git", "-C", REPO, *args], capture_output=True).stdout


def build_key(paths, bise, sign_dir):
    """What a build is made from: apps/desktop at HEAD, its uncommitted changes, the bise packed
    inside and the recipe. Reads git and the bise file only, never takes the lock."""
    tree = git("rev-parse", "HEAD:apps/desktop").decode().strip()
    changes = git("status", "--porcelain", "--", "apps/desktop") + b"\0" + git("diff", "HEAD", "--", "apps/desktop")
    parts = {"tree": tree, "changes": hashlib.sha256(changes).hexdigest()[:16] if changes.strip(b"\0") else "",
             "bise": file_hash(bise)[:16],
             "recipe": hashlib.sha256(build_script(paths, bise, sign_dir).encode()).hexdigest()[:16]}
    return parts


def key_text(parts):
    return "-".join(v[:12] for v in (parts["tree"], parts["changes"], parts["bise"], parts["recipe"]) if v)


def read_stamp(paths):
    try:
        return json.load(open(paths["stamp"]))
    except (OSError, ValueError):
        return None


def write_stamp(paths, parts):
    t = paths["stamp"] + ".tmp"
    with open(t, "w") as f:
        json.dump(parts, f)
    os.replace(t, paths["stamp"])


def sign_dir_for(paths):
    """The stable identity's folder: made when missing (sign-identity.sh), used as is when there;
    None (ad hoc) when it can't be made or is half there."""
    script = os.path.join(DESKTOP, "scripts", "sign-identity.sh")
    r = subprocess.run([script, paths["sign"]], capture_output=True, text=True)
    if r.returncode != 0:
        say("no stable signing identity (%s): ad hoc, his grants won't survive a rebuild" % (r.stderr.strip() or r.returncode))
        return None
    return paths["sign"]


def app_pid(paths):
    """The app's own process (its executable inside the bundle), by the bundle's path: None when it
    isn't running. Never by name."""
    exe = os.path.join(paths["app"], "Contents", "MacOS", APP_NAME)
    out = subprocess.run(["ps", "-axww", "-o", "pid=,command="], capture_output=True, text=True).stdout
    for l in out.splitlines():
        pid, _, cmd = l.strip().partition(" ")
        if pid.isdigit() and (cmd == exe or cmd.startswith(exe + " ")):
            return int(pid)
    return None


def swap_in(paths):
    """The staged bundle replaces the app (only when the app isn't running). True when swapped."""
    if not os.path.isdir(paths["staged"]) or bundle_pids(paths["app"]):
        return False
    old = paths["app"] + ".old"
    subprocess.run(["rm", "-rf", old])
    if os.path.exists(paths["app"]):
        os.rename(paths["app"], old)
    os.rename(paths["staged"], paths["app"])
    subprocess.run(["rm", "-rf", old, paths["staging"]])
    return True


def build(env, bise):
    """Build when the key changed; the app's path. A running app is never written over."""
    if not (bise and os.path.isabs(bise) and os.path.isfile(bise)):
        raise AppError("--bise must be the path of a built bise (got %r)" % (bise,))
    paths = app_paths(env)
    os.makedirs(paths["dir"], exist_ok=True)
    sign = sign_dir_for(paths)
    parts = build_key(paths, bise, sign)
    saved = read_stamp(paths)
    if saved == parts and os.path.isdir(paths["app"]):
        return paths["app"]
    if saved == parts and swap_in(paths):
        return paths["app"]
    say("building %s (waits for other heavy jobs first)…" % key_text(parts))
    os.makedirs(os.path.dirname(LOCK), exist_ok=True)
    r = subprocess.run(["/usr/bin/lockf", "-k", LOCK, "nice", "-n", "10", "/bin/bash", "-c", build_script(paths, bise, sign)], env=env)
    if r.returncode != 0:
        raise AppError("the build failed (exit %d)" % r.returncode)
    write_stamp(paths, parts)
    if not swap_in(paths):
        say("bise is open: quit it to get the new build (the next open swaps it in)")
    return paths["app"]


def open_command(app, workspace, app_root):
    """`open` for his app on that workspace ('' = his home workspace): a new instance of that exact
    bundle with the core's workspace and app root in its env. Pure."""
    return ["open", "-n", "-a", app, "--env", "BISE_DESKTOP_WORKSPACE=" + workspace, "--env", "BISE_APP_ROOT=" + app_root]


def open_app(env, workspace, bise):
    app = build(env, bise)
    paths = app_paths(env)
    if app_pid(paths) is not None:
        # one bise at a time: bring it in front (its window lists every project)
        subprocess.run(["open", "-a", app])
        say("bise was already open: brought it in front")
        return 0
    return subprocess.run(open_command(app, workspace, REPO)).returncode


def stop(env):
    pid = app_pid(app_paths(env))
    if pid is None:
        say("not running")
        return 0
    os.kill(pid, signal.SIGTERM)
    say("asked bise (pid %d) to quit" % pid)
    return 0


def parse(argv):
    """`<cmd> [--workspace <ws> | --home] [--bise <exe>]`. Pure."""
    if not argv:
        raise AppError("usage: desktop.sh build|path|key|open|stop|status [--workspace <ws> | --home] [--bise <exe>]")
    cmd, rest, o = argv[0], argv[1:], {"workspace": "", "bise": ""}
    while rest:
        a = rest.pop(0)
        if a in ("--workspace", "--bise") and rest:
            o[a[2:]] = rest.pop(0)
        elif a == "--home":
            o["workspace"] = ""
        else:
            raise AppError("unknown argument %r" % a)
    if o["workspace"]:
        o["workspace"] = os.path.realpath(o["workspace"])
    return cmd, o


def main(argv):
    env = dict(os.environ)
    try:
        cmd, o = parse(argv)
        if cmd == "build":
            print(build(env, o["bise"]))
        elif cmd == "path":
            print(app_paths(env)["app"])
        elif cmd == "key":
            paths = app_paths(env)
            print(key_text(build_key(paths, o["bise"], paths["sign"] if os.path.isdir(paths["sign"]) else None)))
        elif cmd == "open":
            return open_app(env, o["workspace"], o["bise"])
        elif cmd == "stop":
            return stop(env)
        elif cmd == "status":
            paths = app_paths(env)
            pid, st = app_pid(paths), read_stamp(paths)
            print("running (pid %d)" % pid if pid else "not running")
            print("built: %s" % (key_text(st) if st else "never"))
        else:
            raise AppError("unknown command %r" % cmd)
        return 0
    except AppError as e:
        say(str(e))
        return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
