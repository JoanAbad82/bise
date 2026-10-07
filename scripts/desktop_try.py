#!/usr/bin/env python3
"""desktop-try: the user's first try of bise desktop (the new app, apps/desktop), on a bise home of its own.

  bise-ambient --try [repo…] [--fresh] [--replace]   build, set up the try home, open the app on it
  bise-ambient --try --stop                          quit the try's app and stop its hubs (by pid)

(~/.local/bin/bise-ambient execs scripts/desktop-try.sh, which runs this.)

The build (under the heavy lock, nice 10): this checkout's bise into his build dir's target (cargo -p
bend-harness), its repl-live, repl-scripted and sb-core (scripts/bins.sh), the native helper
(apps/desktop/native/mac/build.sh), then the new app: pnpm install --frozen-lockfile, pnpm build,
pnpm dist (electron-builder --mac --dir) as its own bundle 'bise try' (dev.bise.desktop.try:
apps/desktop/dist/mac-arm64/bise try.app) with that bise packed inside it, so the app's core and
every hub it starts run the try build. Signed with the stable 'bise ambient dev' identity
(<build>/ambient/sign, or BISE_TRY_SIGN_DIR), else ad hoc.

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
- the app is opened as a new instance of the try's own bundle (open -n --env BISE_HOME=<try>…), its
  pid kept in <try>/dev/desktop/app.pid; his own bise (app, hub, ~/bise) is never touched, and an
  open try is reopened only with --replace. --stop quits that pid (checked against the try app's
  executable first) and the try home's hubs.

Decisions: ambient-lead m_9146/m_9174/m_11012, architect m_9176 (the four leaks), subs-auth
m_9175/m_9180. The pure parts (env, guard, config, repos, names, build script, app env) are tested
in tests/desktop_try_test.py.
"""
import json
import os
import re
import shlex
import shutil
import signal
import socket
import subprocess
import sys
import time

REPO = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
DESKTOP = os.path.join(REPO, "apps", "desktop")
# the try's own bundle (amb-mac bce89c8e, m_11023): its own userData (~/Library/Application
# Support/bise try) and TCC grants, never his app's; 'open -n -a <path>' opens that exact copy
APP_NAME = "bise try"
APP_ID = "dev.bise.desktop.try"
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
    if "PATH" in env:
        env["PATH"] = clean_path(env["PATH"], real, homes=(os.path.expanduser("~/.bise"),))
    return env


def clean_path(path, real, homes=()):
    """PATH without any bise state's hubs/ and run/ folders: an agent's shell has
    <his ~/.bise>/hubs/<hub>/bin first (its sb talks to HIS hub); the try's processes must never
    find that one. `homes` adds other bise homes to strip (the default ~/.bise when `real` is a
    stand-in, as in the try-proof)."""
    roots = [real, *homes]
    bad = [os.path.join(r, d) for r in roots for d in ("hubs", "run")]
    keep = [p for p in path.split(":") if p and not any(under(p, b) for b in bad)]
    return ":".join(keep)


def his_env(base):
    """His own environment for the build (his build dir comes from it): no BISE_HOME, no agent's or
    hub's variables."""
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


def build_dir(env):
    """His build dir, as scripts/bins.sh and ambient.sh pick it: BISE_HOME/dev, else ~/.bise/dev once
    migrated, else ~/.local/state/switchboard; /build. Pure but for the migrated check."""
    if env.get("SB_BUILD_DIR"):
        return env["SB_BUILD_DIR"]
    home = env.get("HOME") or os.path.expanduser("~")
    if env.get("BISE_HOME"):
        state = os.path.join(env["BISE_HOME"], "dev")
    elif os.path.exists(os.path.join(home, ".bise", "migrated.json")):
        state = os.path.join(home, ".bise", "dev")
    else:
        state = os.path.join(home, ".local", "state", "switchboard")
    return os.path.join(state, "build")


def try_paths(env):
    """Where the try build goes: the bise (cargo -p bend-harness into <build>/target, ambient.sh's
    try target), the native helper (one stable path: the EDR deletes fresh unsigned binaries) and
    the new app, packaged by `pnpm dist` in apps/desktop/dist."""
    build = build_dir(env)
    arch = "mac-arm64" if os.uname().machine == "arm64" else "mac"
    staged = os.path.join(build, "desktop-try", "staged")
    return {"target": os.path.join(build, "target"), "bise": os.path.join(build, "target", "debug", "bise"),
            "helper": os.path.join(build, "desktop-try", "bise-mac-helper"),
            "sign": os.path.join(build, "ambient", "sign"),
            "app": os.path.join(DESKTOP, "dist", arch, APP_NAME + ".app"),
            # while his try runs from "app", a build is packed here instead (never over a running bundle)
            "staged_dir": staged, "staged": os.path.join(staged, arch, APP_NAME + ".app")}


def build_script(paths, sign_dir=None, out=None, root=None):
    """The one build, run under the heavy lock: bise and its helpers for the try home (repl-live,
    repl-scripted, sb-core next to this checkout), the snapshot app root `root` (root_script), the
    native helper, then the new app (apps/desktop: pnpm install --frozen-lockfile, build, dist =
    electron-builder --mac --dir, the try's bise packed inside it), into apps/desktop/dist, or into
    `out` (BISE_PACK_OUT: the staging dir). Pure."""
    q = shlex.quote
    lines = ["set -euo pipefail",
             "export CARGO_TARGET_DIR=%s CARGO_INCREMENTAL=0" % q(paths["target"]),
             "cd %s/rust && cargo build -p bend-harness" % q(REPO),
             "cd %s && scripts/bins.sh repl-live repl-scripted sb-core" % q(REPO),
             "export MACOSX_DEPLOYMENT_TARGET=\"$(scripts/bins.sh macos-target)\"",
             "mkdir -p %s" % q(os.path.dirname(paths["helper"])),
             # ad hoc here; afterPack re-signs the whole app deep with the stable identity
             "apps/desktop/native/mac/build.sh %s" % q(paths["helper"]),
             "cd %s" % q(DESKTOP),
             "pnpm install --frozen-lockfile",
             "pnpm build",
             "BISE_PACK_NAME=%s BISE_PACK_APP_ID=%s BISE_PACK_BISE=%s BISE_PACK_HELPER=%s%s%s pnpm dist"
             % (q(APP_NAME), q(APP_ID), q(paths["bise"]), q(paths["helper"]), " BISE_PACK_SIGN_DIR=%s" % q(sign_dir) if sign_dir else "",
                " BISE_PACK_OUT=%s" % q(out) if out else "")]
    if out:
        # a fresh staging dir: a half-written bundle from a failed build never gets swapped in
        lines.insert(lines.index("cd %s" % q(DESKTOP)), "rm -rf %s" % q(out))
    if root:
        lines[lines.index("mkdir -p %s" % q(os.path.dirname(paths["helper"]))):0] = root_script(root)
    return "\n".join(lines) + "\n"


def root_script(root):
    """The try's own app root, a snapshot (ambient-lead m_11624): what a hub reads from
    BISE_APP_ROOT, copied like scripts/versions.sh makes a version dir, so his running try never
    reads this checkout (a checkout moved or rebuilt would change the runtime under his hubs):
    repl-live and sb-core from bins.sh's cache (immutable, one per source hash), bend-jsrt (a hard
    link to its cache file), prompts/, plugins/, kit/, computer-use/extension, VERSION.
    Built in <root>.tmp, then one rename. Run from the checkout. Pure."""
    q = shlex.quote
    t = root + ".tmp"
    return ["rm -rf %s && mkdir -p %s/rust/jsrt/target/debug %s/computer-use" % (q(t), q(t), q(t)),
            "b=\"$(scripts/bins.sh path --src \"$PWD\" repl-live)\" && cp \"$b\" %s/repl-live" % q(t),
            "if [ -f bend/hub/main.bend ]; then b=\"$(scripts/bins.sh path --src \"$PWD\" sb-core)\" && cp \"$b\" %s/sb-core; fi" % q(t),
            "js=\"$(scripts/bins.sh path --src \"$PWD\" bend-jsrt)\" && { ln -f \"$js\" %s/bend-jsrt 2>/dev/null || cp -c \"$js\" %s/bend-jsrt 2>/dev/null || cp \"$js\" %s/bend-jsrt; }"
            % (q(t), q(t), q(t)),
            "ln -f %s/bend-jsrt %s/rust/jsrt/target/debug/bend-jsrt" % (q(t), q(t)),
            "cp -R prompts %s/prompts" % q(t),
            "if [ -d plugins ]; then cp -R plugins %s/plugins; fi" % q(t),
            "if [ -d kit ]; then cp -R kit %s/kit; fi" % q(t),
            "if [ -d computer-use/extension ]; then cp -R computer-use/extension %s/computer-use/extension && rm -rf %s/computer-use/extension/test; fi"
            % (q(t), q(t)),
            "printf 'id=%%s\\ncommit=%%s\\nrepo=%%s\\n' %s \"$(git rev-parse HEAD)\" \"$PWD\" > %s/VERSION" % (q(os.path.basename(root)), q(t)),
            "rm -rf %s && mv %s %s" % (q(root), q(t), q(root))]


def root_path(paths, stamp):
    """Where the snapshot of that build goes: <build>/desktop-try/root-<head8>[-<changes8>]-<recipe6>,
    one per source and recipe, so a staged build never writes the root a running try reads."""
    name = "root-%s%s-%s" % (stamp["head"][:8], "-" + stamp["changes"][:8] if stamp["changes"] else "", stamp["recipe"][:6])
    return os.path.join(os.path.dirname(paths["helper"]), name)


def stamp_path(paths):
    """The try build's stamp, next to its native helper in his build dir."""
    return os.path.join(os.path.dirname(paths["helper"]), "try.stamp")


def build_stamp(env, paths, sign):
    """What the try build was made from: this checkout's HEAD, a hash of its uncommitted changes
    (git status --porcelain, every untracked file listed, and git diff HEAD, so a second edit of a
    changed file counts) and a hash of the build recipe itself (build_script with these paths and
    this signing). Reads git only, never takes the lock (ambient-lead m_11206)."""
    import hashlib
    head = run(["git", "-C", REPO, "rev-parse", "HEAD"], env).stdout.strip()
    status = run(["git", "-C", REPO, "status", "--porcelain", "--untracked-files=all"], env).stdout
    diff = subprocess.run(["git", "-C", REPO, "diff", "HEAD", "--binary"], env=env, capture_output=True).stdout
    changes = hashlib.sha256(status.encode() + b"\0" + diff).hexdigest() if status.strip() else ""
    recipe = hashlib.sha256(build_script(paths, sign).encode()).hexdigest()
    return {"head": head, "changes": changes, "recipe": recipe}


def packed_bise(app):
    return os.path.join(app, "Contents", "Resources", "bin", "bise")


def outputs_there(paths, app, root):
    """Every output of a try build packed at `app` with its snapshot app root `root`: the bundle
    with its bise inside, the try bise, the native helper, the root's repl-live. A stamp from
    before the snapshot (no root) never counts: it builds once."""
    return bool(root) and all(os.path.exists(p) for p in (app, packed_bise(app), paths["bise"], paths["helper"],
                                                           os.path.join(root, "repl-live")))


def same_source(stamp, saved):
    """The saved stamp was made from this source and recipe (wherever it was packed)."""
    return bool(saved) and {k: v for k, v in saved.items() if k in ("head", "changes", "recipe")} == stamp


def up_to_date(stamp, saved, paths):
    """The build can be skipped: the saved stamp is this one, packed live, and every output is
    there (the packed 'bise try.app' with its bise inside, the try bise, the native helper)."""
    return same_source(stamp, saved) and saved.get("where", "live") == "live" and outputs_there(paths, paths["app"], saved.get("root"))


def read_stamp(paths):
    try:
        return json.load(open(stamp_path(paths)))
    except (OSError, ValueError):
        return None


def write_stamp(paths, stamp):
    os.makedirs(os.path.dirname(stamp_path(paths)), exist_ok=True)
    with open(stamp_path(paths) + ".tmp", "w") as f:
        json.dump(stamp, f)
    os.replace(stamp_path(paths) + ".tmp", stamp_path(paths))


def bundle_pids(app):
    """Every process running from that bundle (the app, its Electron helpers, its packed bise and
    the hubs it started), by the bundle's path, any try home: read only, never killed here."""
    out = subprocess.run(["ps", "-axww", "-o", "pid=,command="], capture_output=True, text=True).stdout
    pre = app.rstrip("/") + "/Contents/"
    pids = []
    for l in out.splitlines():
        pid, _, cmd = l.strip().partition(" ")
        if pid.isdigit() and cmd.startswith(pre) and int(pid) != os.getpid():
            pids.append(int(pid))
    return pids


def build(env, paths):
    """The try build under the heavy lock (/usr/bin/lockf -k ~/.bise/run/heavy.lock nice -n 10),
    only when the stamp says something changed: an up-to-date build opens at once, without queueing
    behind other heavy jobs. While a 'bise try' runs from the live bundle (ambient-lead m_11607),
    the build is packed into the staging dir instead and the stamp says where: 'staged';
    swap_staged puts it live once nothing runs from it. Returns True when it built."""
    # the stable 'bise ambient dev' identity (amb-mac m_11023): the try's grants survive rebuilds; else ad hoc
    sign = os.environ.get("BISE_TRY_SIGN_DIR") or (paths["sign"] if os.path.isdir(paths["sign"]) else None)
    stamp = build_stamp(env, paths, sign)
    saved = read_stamp(paths)
    short = stamp["head"][:8] + (" + uncommitted changes" if stamp["changes"] else "")
    if up_to_date(stamp, saved, paths):
        say("up to date (%s), opening" % short)
        return False
    if same_source(stamp, saved) and saved.get("where") == "staged" and outputs_there(paths, paths["staged"], saved.get("root")):
        say("up to date (%s), staged: your try is open: quit it to get the new build" % short)
        return False
    busy = bundle_pids(paths["app"])
    lock = os.path.expanduser("~/.bise/run/heavy.lock")
    os.makedirs(os.path.dirname(lock), exist_ok=True)
    if busy:
        say("your try is open (pid %d): building %s into staging, never over it (waits for other heavy jobs first)…" % (busy[0], short))
    else:
        say("building %s for the try (waits for other heavy jobs first)…" % short)
    # the root the live bundle runs on, kept until a swap retires it with the bundle
    live_root = (saved or {}).get("root") if (saved or {}).get("where", "live") == "live" else (saved or {}).get("live_root")
    root = root_path(paths, stamp)
    if busy and live_root and os.path.realpath(root) == os.path.realpath(live_root):
        # the same source rebuilt under a running try (its outputs went missing): never its root
        root = "%s-%d" % (root, int(time.time()))
    script = build_script(paths, sign, out=paths["staged_dir"] if busy else None, root=root)
    r = subprocess.run(["/usr/bin/lockf", "-k", lock, "nice", "-n", "10", "/bin/bash", "-c", script], env=env)
    if r.returncode != 0:
        raise TryError("the build failed (exit %d)" % r.returncode)
    app = paths["staged"] if busy else paths["app"]
    for k, p in (("bise", paths["bise"]), ("app", app), ("app root", os.path.join(root, "repl-live"))):
        if not os.path.exists(p):
            raise TryError("no %s at %s after the build" % (k, p))
    new = dict(stamp, where="staged" if busy else "live", root=root)
    if busy and live_root and live_root != root:
        new["live_root"] = live_root
    write_stamp(paths, new)
    if busy:
        say("staged: your try is open: quit it to get the new build (the next bise-ambient --try swaps it in)")
    else:
        if os.path.isdir(paths["staged_dir"]):
            shutil.rmtree(paths["staged_dir"], ignore_errors=True)   # older than what is live now
        prune_roots(paths, keep={root})
    return True


def prune_roots(paths, keep):
    """Removes the try's snapshot roots other than `keep`, only when nothing runs from the live
    bundle (a running try's hubs read theirs)."""
    if bundle_pids(paths["app"]):
        return
    d = os.path.dirname(paths["helper"])
    for n in os.listdir(d) if os.path.isdir(d) else []:
        p = os.path.join(d, n)
        if n.startswith("root-") and p not in keep and os.path.isdir(p):
            shutil.rmtree(p, ignore_errors=True)


def try_root(paths):
    """The app root the try app is launched with: its build's snapshot (the stamp's root), never
    this checkout (ambient-lead m_11624). None when the build has none yet."""
    saved = read_stamp(paths) or {}
    root = saved.get("root") if saved.get("where", "live") == "live" else saved.get("live_root")
    return root if root and os.path.exists(os.path.join(root, "repl-live")) else None


def swap_staged(paths):
    """A staged build goes live when nothing runs from the live bundle: live -> <app>.old, staged ->
    live (renames), the stamp then says 'live'. Returns the .old path to remove once the new app's
    core answers (finish_swap), or None when there is nothing to swap or the try is open (then
    untouched: 'your try is open: quit it to get the new build')."""
    saved = read_stamp(paths)
    if not saved or saved.get("where") != "staged" or not outputs_there(paths, paths["staged"], saved.get("root")):
        return None
    if bundle_pids(paths["app"]):
        say("your try is open: quit it to get the new build")
        return None
    app, old = paths["app"], paths["app"] + ".old"
    if os.path.exists(old):
        shutil.rmtree(old)
    os.makedirs(os.path.dirname(app), exist_ok=True)
    if os.path.exists(app):
        os.rename(app, old)
    try:
        os.rename(paths["staged"], app)
    except OSError:
        # another volume: copy next to it, then one rename
        shutil.rmtree(app + ".new", ignore_errors=True)
        shutil.copytree(paths["staged"], app + ".new", symlinks=True)
        os.rename(app + ".new", app)
        shutil.rmtree(paths["staged_dir"], ignore_errors=True)
    # the staged build's snapshot root goes live with it; the old one is retired with .old
    live = {k: v for k, v in saved.items() if k != "live_root"}
    live["where"] = "live"
    if saved.get("live_root") and saved["live_root"] != saved.get("root"):
        live["old_root"] = saved["live_root"]
    write_stamp(paths, live)
    say("swapped in the staged build (%s)" % saved.get("head", "")[:8])
    return old if os.path.exists(old) else None


def core_up(app):
    """The new app's core runs: its packed bise has a process (the app starts it at launch)."""
    return any(True for _ in [p for p in bundle_pids(app)
                              if subprocess.run(["ps", "-o", "command=", "-p", str(p)], capture_output=True, text=True)
                              .stdout.startswith(packed_bise(app))])


def finish_swap(old, app, timeout=60, paths=None):
    """Removes the previous bundle (<app>.old), and with it its snapshot root (the stamp's
    old_root), once the swapped-in app's core answers; both kept (for a rollback by hand) if it
    doesn't within the timeout."""
    t0 = time.time()
    while time.time() - t0 < timeout:
        if core_up(app):
            shutil.rmtree(old, ignore_errors=True)
            saved = read_stamp(paths) if paths else None
            if saved and saved.get("old_root"):
                if saved["old_root"] != saved.get("root"):
                    shutil.rmtree(saved["old_root"], ignore_errors=True)
                write_stamp(paths, {k: v for k, v in saved.items() if k != "old_root"})
            return True
        time.sleep(0.5)
    say("the new try's core didn't start within %d s: the previous build stays at %s" % (timeout, old))
    return False


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


def app_env(tryh, env, root):
    """What the new app is opened with (open --env): the try home, its own home workspace, the
    build's snapshot app root for the hubs' repl-live, sb-core and runtime files (never this
    checkout: ambient-lead m_11624), the try's PATH. Pure."""
    return ["BISE_HOME=%s" % tryh, "BISE_HOME_WORKSPACE=%s" % os.path.join(tryh, "bise"), "BISE_APP_ROOT=%s" % root,
            "PATH=%s" % env.get("PATH", "/usr/bin:/bin")]


def app_pid_file(tryh):
    return os.path.join(tryh, "dev", "desktop", "app.pid")


def app_exe(app):
    return os.path.join(app, "Contents", "MacOS", os.path.basename(app)[:-len(".app")])


def find_app_pid(app, tryh):
    """The try's app among the running processes: its executable is the try app's and its own
    environment says BISE_HOME=<try> (ps -E; nothing else of it is read). Never by name."""
    out = subprocess.run(["ps", "-axwwE", "-o", "pid=,command="], capture_output=True, text=True).stdout
    exe = app_exe(app)
    for l in out.splitlines():
        pid, _, rest = l.strip().partition(" ")
        if pid.isdigit() and rest.startswith(exe) and (" BISE_HOME=%s " % tryh) in rest + " ":
            return int(pid)
    return None


def app_running(app, tryh):
    """The try app's pid when it runs: its pid file, checked against what that pid runs now."""
    pid = read_pid(app_pid_file(tryh))
    if pid and pid_alive(pid):
        cmd = subprocess.run(["ps", "-o", "command=", "-p", str(pid)], capture_output=True, text=True).stdout.strip()
        if cmd.startswith(app_exe(app)):
            return pid
    return None


def open_app(app, tryh, env, root):
    """The new app on the try home, as a normal app (his run, not a test): a new instance (-n) of the
    try's own bundle, so his own app, if any runs, is left alone. BISE_TRY_OPEN (tests, gate only):
    that command gets the app and its env instead; the app it starts is found and kept the same way,
    so --stop finds it (qa-native m_11066)."""
    os.makedirs(os.path.dirname(app_pid_file(tryh)), exist_ok=True)
    hook = os.environ.get("BISE_TRY_OPEN")
    if hook:
        run([hook, app] + app_env(tryh, env, root), env)
    else:
        cmd = ["open", "-n", "-a", app]
        for e in app_env(tryh, env, root):
            cmd += ["--env", e]
        run(cmd, env)
    return keep_app_pid(app, tryh)


def keep_app_pid(app, tryh, timeout=20):
    """Waits for the try's app to show up (find_app_pid) and keeps its pid in <try>/dev/desktop/app.pid,
    which app_running and --stop read. None when it never shows up."""
    t0, pid = time.time(), None
    while pid is None and time.time() - t0 < timeout:
        pid = find_app_pid(app, tryh)
        if pid is None:
            time.sleep(0.3)
    if pid:
        os.makedirs(os.path.dirname(app_pid_file(tryh)), exist_ok=True)
        with open(app_pid_file(tryh), "w") as f:
            f.write("%d\n" % pid)
    return pid


def quit_app(app, tryh, timeout=10):
    """The try's app quits (SIGTERM: Electron quits as on ⌘Q), by its checked pid. Returns it."""
    pid = app_running(app, tryh)
    if not pid:
        return None
    # an Apple Event quit (app.quit: will-quit stops its core and shells, the helper quits), by the
    # try's own bundle id; SIGTERM to the checked pid if it doesn't go, never pkill by name
    subprocess.run(["osascript", "-e", 'tell application id "%s" to quit' % APP_ID], capture_output=True, timeout=15)
    t0 = time.time()
    while pid_alive(pid) and time.time() - t0 < timeout:
        time.sleep(0.2)
    if pid_alive(pid):
        os.kill(pid, signal.SIGTERM)
    t0 = time.time()
    while pid_alive(pid) and time.time() - t0 < timeout:
        time.sleep(0.2)
    if pid_alive(pid):
        os.kill(pid, signal.SIGKILL)
    return pid


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


def stop(real, tryh, app=None):
    """The try's app (its checked pid), then each hub (stop_hub on its socket, then SIGTERM by pid)."""
    guard(real, tryh)
    out = {"app": None, "hubs": [], "killed": []}
    if app:
        out["app"] = quit_app(app, tryh)
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
        raise TryError("unknown option %s (--try [repo…] [--fresh|--replace], --try --stop)" % ", ".join(sorted(bad)))
    real, tryh = homes()
    guard(real, tryh)
    mine = his_env(os.environ)
    paths = try_paths(mine)
    if "--stop" in flags:
        r = stop(real, tryh, paths["app"])
        say("stopped the try (app %s, %d hubs). your own bise wasn't touched" % (r["app"] or "not running", len(r["hubs"])))
        return 0
    env = try_env(os.environ, real, tryh)
    # tests only (a try home under ~/.bise/gate): BISE_TRY_BISE names the bise (no build), BISE_TRY_OPEN
    # a command that gets the app and its env instead of 'open' (never on his screen)
    hooks = [k for k in ("BISE_TRY_BISE", "BISE_TRY_OPEN") if os.environ.get(k)]
    if hooks and not under(tryh, GATE):
        raise TryError("%s: for tests on a try home under ~/.bise/gate only" % ", ".join(hooks))
    if os.environ.get("BISE_TRY_BISE"):
        if "--no-open" not in flags and not os.environ.get("BISE_TRY_OPEN"):
            raise TryError("BISE_TRY_BISE is for tests: with --no-open or BISE_TRY_OPEN only")
        paths = dict(paths, bise=os.environ["BISE_TRY_BISE"])
    # one try app at a time: an open one is reopened only with --replace; his own app is never touched
    running = app_running(paths["app"], tryh)
    if running and "--replace" not in flags and "--no-open" not in flags:
        raise TryError("your try is open (pid %d): quit it to get the new build. bise-ambient --try --replace reopens it, "
                       "--stop closes it" % running)
    # a build staged while the try was open goes live now if nothing runs from the live bundle
    # (never over a running one: swap_staged checks every process of the bundle, not just the pid file)
    swap_staged(paths)
    if "--no-build" not in flags:
        build(his_env(os.environ), paths)
    bise = paths["bise"]
    if not os.access(bise, os.X_OK):
        raise TryError("no bise at %s: build first" % bise)
    # the app root of everything the try starts: the build's snapshot, never this checkout
    # (BISE_TRY_BISE, a gate test with no build: this checkout, test only)
    root = try_root(paths) or (REPO if os.environ.get("BISE_TRY_BISE") else None)
    if not root:
        raise TryError("no snapshot app root for the try build: build first (without --no-build)")
    env["BISE_APP_ROOT"] = root
    if "--fresh" in flags and os.path.isdir(tryh):
        stop(real, tryh, paths["app"])
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
    if running:
        quit_app(paths["app"], tryh)
        if swap_staged(paths):      # --replace: the build staged while it ran, with its own root
            root = try_root(paths) or root
            env["BISE_APP_ROOT"] = root
    if not os.environ.get("BISE_TRY_OPEN") and not os.path.isdir(paths["app"]):
        raise TryError("no app at %s: build first (without --no-build)" % paths["app"])
    pid = open_app(paths["app"], tryh, env, root)
    if os.path.exists(paths["app"] + ".old"):
        # the previous bundle and its snapshot root, once the new core answers
        finish_swap(paths["app"] + ".old", paths["app"], paths=paths)
    say("bise desktop is open on the try home %s (%d projects%s). stop it: bise-ambient --try --stop"
        % (tryh, len(done), ", pid %d" % pid if pid else ""))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv[1:]))
    except TryError as e:
        say(str(e))
        sys.exit(1)
