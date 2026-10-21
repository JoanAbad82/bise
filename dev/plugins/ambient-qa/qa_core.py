"""ambient-qa: the bise to run, the throwaway hub and its fake accounts, launch and stop, the HTTP to its page server, his own state (never touched).
Moved out of qa.py as is (the 1,000-line cap, architect S1); qa.py re-exports every name."""

import glob
import json
import os
import re
import shutil
import signal
import socket
import subprocess
import sys
import tempfile
import time



# realpath: the plugin is linked into an agent's .agents/plugins; the repo is where it really lives
HERE = os.path.dirname(os.path.realpath(__file__))
# dev/plugins/ambient-qa: the repo's own dev plugin, never in the release's plugins/ (architect B1)
REPO = os.path.abspath(os.environ.get("AMBIENT_QA_REPO") or os.path.join(HERE, "..", "..", ".."))


def dev_dir():
    """<bise dev dir>: scripts/bins.sh's STATE (and Support.swift's defaultDevDir)."""
    if os.environ.get("BISE_HOME"):
        return os.path.join(os.environ["BISE_HOME"], "dev")
    home = os.path.expanduser("~")
    if os.path.exists(os.path.join(home, ".bise", "migrated.json")):
        return os.path.join(home, ".bise", "dev")
    return os.path.join(home, ".local", "state", "switchboard")


# one QA hub per agent: several agents can QA at the same time without sharing a hub
QA_DIR = os.environ.get("AMBIENT_QA_DIR") or os.path.join(dev_dir(), "qa", os.environ.get("SB_AGENT") or "me")
RUN = os.path.join(QA_DIR, "run.json")
HUB = os.path.join(QA_DIR, "hub.json")
OUT = os.environ.get("AMBIENT_QA_OUT") or os.path.join(QA_DIR, "out")


class QAError(Exception):
    pass


# ---------------------------------------------------------------- the bise

def _is_exe(p):
    return bool(p) and os.path.isfile(p) and os.access(p, os.X_OK)


def app_root_of(bise):
    """The source tree a debug bise runs from: it must hold a built repl-live
    (./run.sh), else the hub dies with 'repl-live not found' (a bise built
    in an outside CARGO_TARGET_DIR, like ambient-int/target, has none next
    to it). $AMBIENT_QA_APP_ROOT wins."""
    env = os.environ.get("AMBIENT_QA_APP_ROOT")
    if env:
        return env
    d = os.path.dirname(os.path.realpath(bise))
    for up in [d] + list(_ancestors(d, 4)):
        for root in (up, os.path.join(up, "harness")):
            if os.path.isfile(os.path.join(root, "rust", "Cargo.toml")) and os.path.exists(os.path.join(root, "repl-live")):
                return root
    return None


def _ancestors(d, n):
    for _ in range(n):
        d = os.path.dirname(d)
        yield d


def _git(root, *args):
    r = subprocess.run(["git", "-C", root] + list(args), capture_output=True, text=True)
    return r.stdout.strip() if r.returncode == 0 else ""


def behind(root, branch="ambient-app"):
    """How many of ambient-app's commits the tree's HEAD lacks (big when unknown)."""
    n = _git(root, "rev-list", "--count", "HEAD.." + branch)
    return int(n) if n.isdigit() else 10 ** 6


def tree_info(root):
    """The tree the app root comes from: its commit and what of ambient-app it lacks."""
    return {"head": _git(root, "log", "-1", "--format=%h %s")[:100], "behind_ambient_app": behind(root),
            "ambient_app": _git(root, "log", "-1", "--format=%h", "ambient-app")}


HELPERS = ("repl-live", "repl-scripted", "sb-core")


def ensure_helpers(root):
    """The app root's helper binaries, rebuilt from its own sources before
    any hub starts (ambient-lead m_5829): a stale sb-core dropped a timer's
    wake (amb-home bc1c143f). The tree's scripts/bins.sh copies the build
    of its sources (a cache hit ~0.3 s, a miss compiles). Returns each
    helper's source key, for the report."""
    bins = os.path.join(root, "scripts", "bins.sh")
    if not os.path.exists(bins):
        raise QAError("%s has no scripts/bins.sh: can't make sure its helpers are current" % root)
    p = subprocess.run([bins, "--src", root] + list(HELPERS), capture_output=True, text=True, cwd=root, timeout=900)
    if p.returncode != 0:
        raise QAError("scripts/bins.sh %s failed in %s: %s" % (" ".join(HELPERS), root, (p.stderr or p.stdout)[-1200:]))
    keys = {}
    for h in HELPERS:
        k = subprocess.run([bins, "key", "--src", root, h], capture_output=True, text=True, cwd=root, timeout=120)
        keys[h] = (k.stdout.strip() or "?")[:12]
    return {"from": _git(root, "log", "-1", "--format=%h"), "keys": keys}


def require_commits(root, require=None):
    """A stale build must not read as a product fail (ambient-lead m_5358):
    the commits of `require` the tree lacks refuse the run; else a tree
    behind ambient-app prints a WARNING. Returns what it found."""
    req = [c for c in (require.split(",") if isinstance(require, str) else (require or [])) if c.strip()]
    missing = [c.strip() for c in req if subprocess.run(["git", "-C", root, "merge-base", "--is-ancestor", c.strip(), "HEAD"],
                                                         capture_output=True).returncode != 0]
    if missing:
        raise QAError("the bise tree %s lacks %s: build a tree that has them (or pass bise=<exe>)" % (root, ", ".join(missing)))
    b = behind(root)
    if b:
        print("ambient-qa: WARNING: the bise tree %s is %s commits behind ambient-app: a fail may be a stale build (--require <commit> refuses one)"
              % (root, b), file=sys.stderr)
    return {"required": req, "behind_ambient_app": b}


def stale_bise(bise, root, slack_s=1800):
    """Why this bise build is older than its tree's Rust (None when it isn't): a bise built before
    the tree's last rust/ commit (a merge brings one) talks to the tree's fresh sb-core with an old
    hub, and main never shows (ambient-lead m_7069: amb-mac's bise of Oct 3 05:05 in a tree at
    4aefdbac: 'main never appears'). slack_s: an agent builds a little before it commits."""
    try:
        built = os.path.getmtime(bise)
        last = int(_git(root, "log", "-1", "--format=%ct", "--", "rust/") or 0)
    except (OSError, ValueError):
        return None
    if last and built < last - slack_s:
        return "%s was built %s, before its tree's last rust/ commit (%s, %s)" % (
            bise, time.strftime("%m-%d %H:%M", time.localtime(built)), _git(root, "log", "-1", "--format=%h", "--", "rust/"),
            time.strftime("%m-%d %H:%M", time.localtime(last)))
    return None


OTHER_BRANCH = 100


def other_branch(bise, root, n=None):
    """Why this bise's tree is another branch's (None when it is ambient-app's or close to it): a tree
    missing more than OTHER_BRANCH of ambient-app's commits runs another hub and protocol (ambient-lead
    m_16321: every built bise was a client-protocol tree, 1286 behind; its hub never showed main to
    ambient-app's tests/e2e.py: 'waiting for main in [idle] (now None)'). n: behind(root), for tests."""
    n = behind(root) if n is None else n
    if n > OTHER_BRANCH:
        return "%s's tree lacks %s of ambient-app's commits (another branch: its hub never shows main to this e2e.py)" % (
            bise, n if n < 10 ** 6 else "all")
    return None


def find_bise(explicit=None):
    """A bise with `ambient-core` and its app root (a tree with a built
    repl-live): --bise, $AMBIENT_QA_BISE, the last launch's pair, the repo's
    own build, else the newest such build among this hub's worktrees.
    Returns (bise, app_root)."""
    last = _read(RUN) or {}
    tries = [explicit, os.environ.get("AMBIENT_QA_BISE")]
    for c in tries:
        if _is_exe(c):
            root = app_root_of(c)
            if not root:
                raise QAError("%s has no app root with a built repl-live: set AMBIENT_QA_APP_ROOT to a tree that has one (./run.sh builds it)" % c)
            return os.path.abspath(c), root
    # the last launch's pair only while its tree is still at ambient-app's tip (ambient m_6561:
    # a launch reused ambient-pm's tree 10 commits behind)
    if _is_exe(last.get("bise")) and last.get("app_root") and os.path.exists(os.path.join(last["app_root"], "repl-live")) \
            and behind(last["app_root"]) == 0 and not stale_bise(last["bise"], last["app_root"]):
        return last["bise"], last["app_root"]
    skipped = []
    own = os.path.join(REPO, "rust", "target", "debug", "bise")
    if _is_exe(own) and app_root_of(own):
        why = stale_bise(own, app_root_of(own))
        if not why:
            return own, app_root_of(own)
        skipped.append(why)
    found = []
    wt = os.path.dirname(os.path.dirname(REPO))     # .../worktrees/<hub>/<task>/harness -> .../worktrees/<hub>
    if os.path.basename(os.path.dirname(wt)) == "worktrees":
        for task in os.listdir(wt):
            for rel in ("target/debug/bise", "harness/rust/target/debug/bise"):
                p = os.path.join(wt, task, rel)
                if _is_exe(p) and os.path.isdir(os.path.join(wt, task, "harness", "rust", "tui", "src", "ambient")):
                    root = app_root_of(p)
                    if root:
                        why = stale_bise(p, root) or other_branch(p, root)
                        if why:
                            skipped.append(why)
                        else:
                            found.append((os.path.getmtime(p), p, root))
    if found:
        # the tree closest to ambient-app's tip (fewest of its commits missing), then the newest build
        _, _, p, root = min((behind(root), -mt, p, root) for mt, p, root in found)
        return p, root
    if skipped:
        raise QAError("no bise found fits: %s; "
                      "build one at ambient-app's tip (cargo build -p bend-harness, then scripts/bins.sh repl-live repl-scripted sb-core)"
                      % "; ".join(skipped))
    raise QAError("no bise with ambient-core next to a built repl-live: pass bise=<exe> (a debug build of the ambient-app branch, "
                  "its tree built with ./run.sh) or set AMBIENT_QA_BISE and AMBIENT_QA_APP_ROOT")


def _pid_alive(pid):
    try:
        os.kill(pid, 0)
        return True
    except (OSError, TypeError):
        return False


def _read(path):
    try:
        with open(path) as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


# ---------------------------------------------------------------- the fake hub

# what a real model's hub must not take from the scripted one (hub "model")
SCRIPTED_VARS = ("BEND_PROVIDER_URL", "BEND_MODEL", "MISTRAL_API_KEY", "BISE_APPROVALS")


class _ReusedEnv:
    """e2e.Env's shape on an existing throwaway (its ws, st, outbox, clock):
    no scripted provider; close() stops the hub and deletes the throwaway."""

    def __init__(self, tmp, e2e):
        self.tmp, self.ws, self.state, self.hub, self.keep = tmp, os.path.join(tmp, "ws"), os.path.join(tmp, "st"), None, False
        self._e2e = e2e
        self.env = {**e2e.host_env(), "SB_STATE_DIR": self.state,
                    "BEND_MCP_INDEX": os.path.join(tmp, "mcp-index.txt"), "BEND_SKILLS_INDEX": os.path.join(tmp, "skills-index.txt"),
                    "BEND_BG_ROOT": os.path.join(tmp, "bg"), "BEND_SESSIONS_DIR": os.path.join(tmp, "bise", "sessions"),
                    "BEND_BG_AFTER": "30", "SB_ONBOARDING": "off"}

    def close(self):
        if self.hub:
            try:
                self._e2e.Client(os.path.join(self.state, "hub.sock")).send({"op": "stop_hub"})
                self.hub.wait(timeout=20)
            except Exception:  # noqa: BLE001
                self.hub.kill()
        if not self.keep:
            shutil.rmtree(self.tmp, ignore_errors=True)


def hub_daemon(bise, kind="fake", connectors=False, computer=False, user_ask="", keep=False, reuse=None, home=None):
    """Runs detached (`qa.py _hub`): a throwaway hub on a fresh git repo,
    until SIGTERM. fake: tests/e2e.py's scripted provider, main answers
    "ack: <your words>" (`[[bash: ...]]` in what you say scripts it more).
    model: the same throwaway hub and workspace, but your configured model
    and keys and your approvals mode (it costs credits; never the real main)."""
    sys.path.insert(0, os.path.join(REPO, "tests"))
    tmp = os.path.join(QA_DIR, "h")                 # short: the hub's sockets live under it
    os.makedirs(tmp, exist_ok=True)
    tempfile.tempdir = tmp
    import e2e  # noqa: E402
    e2e.EXE = bise
    if reuse:
        # a seeded hub's state, now on another provider (run morning: seeded
        # scripted, asked on the model): the same workspace, state and outbox
        E = _ReusedEnv(reuse, e2e)
        for f in ("hub.sock", "pages.port"):   # the seeded hub's, gone with it: wait for the new ones
            try:
                os.unlink(os.path.join(E.state, f))
            except OSError:
                pass
    else:
        E = e2e.Env()
    if keep:
        # kept for the next hub (run morning reuses it): e2e.Env reads SB_KEEP at close
        # (this daemon's own environment; E.env, the hub's, is already built without it)
        E.keep = True
        os.environ["SB_KEEP"] = "1"
    # the app root's own sb-core (e2e's host_env drops the caller's SB_CORE_BIN):
    # the same tree as repl-live (ambient-lead m_4915)
    root = os.environ.get("BISE_APP_ROOT")
    if root and os.path.exists(os.path.join(root, "sb-core")):
        E.env["SB_CORE_BIN"] = os.path.join(root, "sb-core")
    # e2e.Env drops the caller's BISE_APP_ROOT (bise_env.INTERNAL): the hub gets this tree's,
    # never the source path baked in its build (world.hub_env, 2026-10-20's nightly)
    if root:
        E.env["BISE_APP_ROOT"] = root
    if kind == "model":
        for k in SCRIPTED_VARS:
            E.env.pop(k, None)
    # The user's rule (main m_5200): no test, QA or demo touches his real accounts.
    # A QA hub never has a real connector: e2e's empty BEND_MCP_INDEX and
    # BEND_SKILLS_INDEX stay, no plugin from his ~/.agents/plugins (an empty
    # user root), no opt-in plugin, the computer plugin off (his browser, his
    # logins). The only way in is `user_ask`: the user's own words asking for
    # this one run, recorded in hub.json and run.json.
    if user_ask and connectors:
        for k in ("BEND_MCP_INDEX", "BEND_SKILLS_INDEX"):
            E.env.pop(k, None)
    else:
        connectors = False
        # the hub's own user plugin root: none of his, only the fake accounts
        # (canned Gmail, Slack, Linear, calendar...; their writes go to the outbox).
        # There and not only in <ws>/.agents (out of git): an agent in its own
        # worktree has no .agents of the repo's, so it had no Slack (ambient-lead m_5865)
        plugins_home = os.path.join(E.tmp, "qa-user-plugins")
        os.makedirs(plugins_home, exist_ok=True)
        E.env["BEND_PLUGINS_HOME"] = plugins_home
        install_fake_accounts(E.ws)
        install_fake_accounts(root=plugins_home)
        if not reuse:
            # acme's code, where Benjamin's reports live (ambient-lead m_5865, roadmap C)
            seed_repo(E.ws)
        E.env["FAKE_ACCOUNTS_OUTBOX"] = os.path.join(E.tmp, "outbox.jsonl")
        # the launch's clock: batch 0 now, then `qa.py tick` or every AMBIENT_QA_TICK_MIN minutes (0: ticks only)
        clock = os.path.join(E.tmp, "fake-clock.json")
        if not os.path.exists(clock):   # a reused throwaway keeps its clock
            with open(clock, "w") as f:
                json.dump({"start": time.time(), "ticks": [], "every_min": float(os.environ.get("AMBIENT_QA_TICK_MIN") or 30)}, f)
        E.env["FAKE_ACCOUNTS_CLOCK"] = clock
        # a run's own data (fixtures' sets: today = the meetings around now, Granola's notes, people.md)
        sets = os.environ.get("AMBIENT_QA_SET") or ""
        if sets:
            E.env["FAKE_ACCOUNTS_SET"] = sets
    # the hub's ~/bise (taste.md, people.md) is the throwaway's, never the user's (amb-home m_5668)
    home_ws = os.path.join(E.tmp, "bise")
    os.makedirs(home_ws, exist_ok=True)
    E.env["BISE_HOME_WORKSPACE"] = home_ws
    fx = json.load(open(os.path.join(FAKE_ACCOUNTS, "fixtures.json")))
    people = [l for s in (os.environ.get("AMBIENT_QA_SET") or "").split(",") if s for l in fx.get("sets", {}).get(s, {}).get("people", [])]
    if people:
        with open(os.path.join(home_ws, "people.md"), "w") as f:
            f.write("# people\n\n" + "\n".join(people) + "\n")
    if not user_ask:
        computer = False
    E.env["BEND_PLUGINS_STATE"] = hub_plugins_state(E.tmp, computer, keep_user=bool(user_ask and connectors))
    stop = {"now": False}

    def term(*_):
        stop["now"] = True
    signal.signal(signal.SIGTERM, term)
    signal.signal(signal.SIGINT, term)
    try:
        # e2e's start_hub waits 20 s: a loaded machine (5 agents building) needs more
        err_path = os.path.join(E.tmp, "hub.stderr")
        err = open(err_path, "a")
        if home:
            # harness A (qa.py real): the hub where his own rules put it for this HOME
            # (<HOME>/.bise/hubs/<name>-<hash>, migrated.json present like on his Mac), never
            # told by SB_STATE_DIR, so the app and its core find it the way they find his
            real_home_env(E.env, home)
        E.hub = subprocess.Popen([bise, "sbd", "--workspace", E.ws], cwd=e2e.ROOT, env=E.env,
                                 stdin=subprocess.DEVNULL, stdout=err, stderr=err)

        def hub_sock():
            if not home:
                return os.path.join(E.state, "hub.sock")
            found = sorted(glob.glob(os.path.join(home, ".bise", "hubs", "*", "hub.sock")))
            return found[0] if found else os.path.join(home, ".bise", "hubs", "(none yet)", "hub.sock")
        sock = hub_sock()
        t0 = time.time()
        # load_factor moved from e2e.py to tests/wait.py (1d0021ee); an older tree still has it in e2e
        try:
            from wait import load_factor
        except ImportError:
            load_factor = getattr(e2e, "load_factor", lambda: 1.0)
        limit = 60 * load_factor()
        while not os.path.exists(sock):
            sock = hub_sock()
            if E.hub.poll() is not None or time.time() - t0 > limit:
                tail = open(err_path, errors="replace").read()[-3000:]
                raise RuntimeError("the hub did not start in %.0f s (exit %s); its stderr:\n%s" % (limit, E.hub.poll(), tail))
            time.sleep(0.1)
        E.state = os.path.dirname(sock)
        c = e2e.Client(sock)
        try:
            c.wait_status("main", "idle", 120)
        except AssertionError:
            # say why, from the hub's own state: no agent at all is an old hub (bise) with a
            # fresh sb-core (ambient-lead m_7069), else main's own last lines
            names = [(a.get("name"), a.get("status")) for a in (c.state or {}).get("agents", [])]
            repl = os.path.join(E.state, "agents", "main", "repl.log")
            tail = open(repl, errors="replace").read()[-800:] if os.path.exists(repl) else "(no repl.log)"
            hint = ("the hub lists no agent at all: its bise (%s) and the sb-core it runs don't match; build both at ambient-app's tip"
                    % bise) if not names else "agents: %s" % names
            raise RuntimeError("main never went idle in 120 s: %s; main's repl.log ends:\n%s" % (hint, tail))
        info = {"pid": os.getpid(), "kind": kind, "connectors": bool(connectors), "computer": bool(computer), "approved_by_user": user_ask or None, "tmp": E.tmp, "ws": E.ws, "state": E.state, "bise": bise,
                "sets": os.environ.get("AMBIENT_QA_SET") or "", "keep": bool(keep), "reused": bool(reuse),
                "env": {k: E.env[k] for k in ("SB_STATE_DIR",) if k in E.env}, "home": home}
        with open(HUB + ".tmp", "w") as f:
            json.dump(info, f)
        os.replace(HUB + ".tmp", HUB)
        while not stop["now"]:
            time.sleep(0.3)
    finally:
        try:
            os.unlink(HUB)
        except OSError:
            pass
        E.close()


FAKE_ACCOUNTS = os.path.join(HERE, "fake-accounts")
FAKE_SERVICES = ("gmail", "slack", "linear", "calendar", "github", "hn", "reddit", "x", "bluesky", "kit", "granola", "registry")
# the tools' namespace as the real connector names it (tools.Granola.*)
FAKE_SERVER_NAMES = {"granola": "Granola"}


def _clock_path(clock=None):
    if clock:
        return clock
    info = _read(HUB)
    if not info or not _pid_alive(info.get("pid")):
        raise QAError("no throwaway hub: launch() first")
    return os.path.join(info["tmp"], "fake-clock.json")


def tick(n=1, clock=None):
    """The launch's next comment batch(es) come in now (roadmap B: the
    fake HN/Reddit/X/Bluesky comments grow, the numbers move)."""
    path = _clock_path(clock)
    try:
        c = json.load(open(path))
    except (OSError, ValueError):
        c = {"start": time.time(), "ticks": [], "every_min": 0}
    now = time.time()
    c.setdefault("ticks", []).extend([now] * int(n))
    with open(path + ".tmp", "w") as f:
        json.dump(c, f)
    os.replace(path + ".tmp", path)
    return {"ticks": len(c["ticks"]), "clock": path}


def launch_truth(batches=1):
    """What a launch watcher should find after `batches` batches: the
    comments that need an answer (questions, bugs), all and the newest batch's."""
    L = json.load(open(os.path.join(FAKE_ACCOUNTS, "fixtures.json")))["launch"]
    seen = [c for c in L["comments"] if c["batch"] < batches]
    need = [c for c in seen if c["needs_answer"]]
    return {"seen": len(seen), "needs_answer": len(need),
            "new_needs_answer": [{"id": c["id"], "place": c["place"], "author": c["author"], "text": c["text"]} for c in need if c["batch"] == batches - 1],
            "new": [c for c in seen if c["batch"] == batches - 1]}


FAKE_REPO = os.path.join(FAKE_ACCOUNTS, "repo")


def seed_repo(ws):
    """The QA hub's workspace gets acme's CLI (fake-accounts/repo: invented
    code), committed: the install script that skips fish, the HTTP client
    that ignores HTTPS_PROXY, the assistant that always answers in English,
    so an agent on Benjamin's reports can decide on a code fix."""
    ws = os.path.abspath(ws)
    for dirpath, _, files in os.walk(FAKE_REPO):
        rel = os.path.relpath(dirpath, FAKE_REPO)
        for n in files:
            if n.endswith(".pyc") or n == ".DS_Store":
                continue
            dst = os.path.normpath(os.path.join(ws, rel, n))
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(os.path.join(dirpath, n), dst)
    # committed for real, never left staged (ambient-pm m_5918: install.sh and assistant.py stayed
    # staged and the first fix commit swept them in): the files by name, then a check of HEAD
    names = sorted(os.path.relpath(os.path.join(dp, n), FAKE_REPO) for dp, _, fs in os.walk(FAKE_REPO)
                   for n in fs if not n.endswith(".pyc") and n != ".DS_Store")
    env = dict(os.environ, GIT_AUTHOR_NAME="qa", GIT_AUTHOR_EMAIL="qa@acme.test", GIT_COMMITTER_NAME="qa", GIT_COMMITTER_EMAIL="qa@acme.test")
    subprocess.run(["git", "add", "--"] + names, cwd=ws, capture_output=True, env=env)
    c = subprocess.run(["git", "-c", "commit.gpgsign=false", "commit", "-q", "--no-verify", "-m", "acme CLI", "--"] + names,
                       cwd=ws, capture_output=True, text=True, env=env)
    tracked = set(subprocess.run(["git", "ls-tree", "-r", "--name-only", "HEAD"], cwd=ws, capture_output=True, text=True).stdout.split())
    missing = [n for n in names if n not in tracked]
    if missing:
        raise RuntimeError("seed_repo: not committed in %s: %s (git: %s)" % (ws, ", ".join(missing), (c.stderr or c.stdout).strip()[-300:]))


def install_fake_accounts(ws=None, root=None):
    """One plugin per fake service in <ws>/.agents/plugins (out of the
    throwaway repo's git), or in `root` (the QA hub's user plugin root, which
    every agent of the hub reads): tools.gmail.*, tools.slack.*, tools.linear.*,
    tools.calendar.*, tools.github.*, tools.hn.* over fake-accounts/fixtures.json."""
    root = root or os.path.join(ws, ".agents", "plugins")
    for svc in FAKE_SERVICES:
        d = os.path.join(root, svc)
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "plugin.json"), "w") as f:
            json.dump({"$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json", "name": svc, "version": "0.1.0",
                       "description": "%s for this workspace: a fake QA account with fixture data (Camille at acme); writes go to a QA outbox" % svc}, f, indent=1)
        with open(os.path.join(d, "mcp.json"), "w") as f:
            json.dump({"$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
                       "mcpServers": {FAKE_SERVER_NAMES.get(svc, svc): {"type": "stdio", "command": "python3", "args": ["-B", os.path.join(FAKE_ACCOUNTS, "fake_accounts.py"), svc]}}}, f, indent=1)
    ex = os.path.join(ws or "", ".git", "info", "exclude")
    if ws and os.path.isdir(os.path.dirname(ex)):
        with open(ex, "a") as f:
            f.write("/.agents/\n")
    return root


def outbox():
    """What the QA hub's main wrote to the fake accounts (drafts, sends, posts, issues, events)."""
    info = _read(HUB)
    if not info:
        raise QAError("no throwaway hub: launch() first")
    try:
        return {"writes": [json.loads(l) for l in open(os.path.join(info["tmp"], "outbox.jsonl")) if l.strip()]}
    except FileNotFoundError:
        return {"writes": []}


def user_plugins_state():
    """The user's plugin enable state: $BEND_PLUGINS_STATE, else his bise home's plugins.json."""
    if os.environ.get("BEND_PLUGINS_STATE"):
        return os.environ["BEND_PLUGINS_STATE"]
    home = os.environ.get("BISE_HOME") or os.path.join(os.path.expanduser("~"), ".bise")
    return os.path.join(home, "plugins.json")


def hub_plugins_state(dir_, computer=False, keep_user=False):
    """A QA hub's own enable state (the user's file is never written): no
    opt-in plugin and the computer plugin off; with `keep_user` (a run the
    user asked for with his connectors) his own enabled list, computer only
    when `computer`. Returns the file's path."""
    st = _read(user_plugins_state()) or {}
    mine = st.get("enabled", []) if keep_user else []
    enabled = [n for n in mine if n != "computer"] + (["computer"] if computer else [])
    disabled = [n for n in st.get("disabled", []) if n != "computer"] + ([] if computer else ["computer"])
    st = dict(st, enabled=enabled, disabled=disabled)
    path = os.path.join(dir_, "plugins.json")
    with open(path, "w") as f:
        json.dump(st, f, indent=1)
    return path


def _start_hub(bise, root, kind="fake", connectors=False, computer=False, user_ask="", keep=False, reuse=None, sets="", home=None):
    old = _read(HUB)
    if old and _pid_alive(old.get("pid")):
        same = (old.get("kind", "fake"), old.get("bise"), bool(old.get("connectors")), bool(old.get("computer")), old.get("sets", "")) == (kind, bise, bool(connectors), bool(computer), sets)
        if same and not keep and not reuse and not home and not old.get("home"):
            return old
        _stop_hub()
    # never a hub on stale helpers: the tree's own bins.sh first (ambient-lead m_5829)
    helpers = ensure_helpers(root)
    os.makedirs(QA_DIR, exist_ok=True)
    with open(os.path.join(QA_DIR, "helpers.json"), "w") as f:
        json.dump(dict(helpers, root=root), f)
    log = open(os.path.join(QA_DIR, "hub.log"), "a")
    # never the calling agent's hub identity (e2e.host_env drops it for the hub; the daemon too)
    env = {k: v for k, v in os.environ.items() if not k.startswith("SB_") and k not in ("BISE_ROLE", "BISE_EXPORTS_FOR")}
    env["BISE_APP_ROOT"] = root    # the daemon's; it hands it to the hub (e2e.Env alone drops it)
    env["AMBIENT_QA_DIR"] = QA_DIR  # without SB_AGENT the daemon would pick another QA dir
    env["AMBIENT_QA_SET"] = sets
    p = subprocess.Popen([sys.executable, "-u", os.path.realpath(__file__), "_hub", "--bise", bise, "--kind", kind]
                         + (["--keep"] if keep else []) + (["--reuse", reuse] if reuse else []) + (["--home", home] if home else [])
                         + (["--connectors"] if connectors else []) + (["--computer"] if computer else [])
                         + (["--real-accounts-approved-by-user", user_ask] if user_ask else []),
                         stdin=subprocess.DEVNULL, stdout=log, stderr=log, start_new_session=True, cwd=REPO, env=env)
    t0 = time.time()
    # the daemon gives the hub 60 s and main 120 s, each times the load (up to 4): wait for all of it
    while time.time() - t0 < 900:
        info = _read(HUB)
        if info and info.get("pid") == p.pid:
            return info
        if p.poll() is not None:
            raise QAError("the %s hub exited (%s): %s" % (kind, p.returncode, open(os.path.join(QA_DIR, "hub.log"), errors="replace").read()[-1500:]))
        time.sleep(0.2)
    p.terminate()
    raise QAError("the %s hub didn't come up in 900 s: see %s" % (kind, os.path.join(QA_DIR, "hub.log")))


def _stop_hub(only_pid=None):
    """Stops the QA dir's hub; with `only_pid`, only when it is still that
    hub (a run stops the hub it started, never a later run's)."""
    info = _read(HUB)
    if not info or not _pid_alive(info.get("pid")):
        return False
    if only_pid is not None and info.get("pid") != only_pid:
        return False
    os.kill(info["pid"], signal.SIGTERM)
    t0 = time.time()
    while _pid_alive(info["pid"]) and time.time() - t0 < 25:
        time.sleep(0.2)
    return True


# ---------------------------------------------------------------- the throwaway hub, up and down

def launch(hub="fake", bise=None, connectors=False, computer=False, real_accounts_approved_by_user=""):
    """A throwaway hub, its page server and the fake accounts (no app: the Swift app is gone,
    the desktop app's checks live in apps/desktop/tests). hub fake: tests/e2e.py's scripted
    provider; model: the user's model and keys on fake accounts. connectors and computer touch
    the user's real accounts (his Gmail, Slack, Linear, calendar, his browser and its logins):
    never, unless `real_accounts_approved_by_user` names the user's own message asking for this
    one run (the user's rule, main m_5200). The real workspace is refused: it needs a client the
    user started (docs/issues/16)."""
    user_ask = (real_accounts_approved_by_user or "").strip()
    if (connectors or computer) and not user_ask:
        raise QAError("refused: real connectors and the computer plugin touch the user's real accounts. Only for a run the user "
                      "asked for himself: pass real_accounts_approved_by_user=<his message id>. QA uses the fake accounts.")
    if user_ask:
        print("ambient-qa: WARNING: this run uses the user's REAL accounts (%s), approved by the user in %s"
              % (", ".join(n for n, on in (("connectors", connectors), ("computer", computer)) if on) or "none", user_ask), file=sys.stderr)
    if hub == "real":
        raise QAError("refused: the real workspace needs a client the user started (an agent's process is refused "
                      "on its hub.sock by design). QA runs on throwaway hubs: hub fake or model")
    if hub not in ("fake", "model"):
        raise QAError("hub: fake (a throwaway scripted hub) or model (a throwaway hub with your real model and keys)")
    bise, root = find_bise(bise)
    require_commits(root)
    info = _start_hub(bise, root, hub, connectors and hub == "model", computer, user_ask)
    port = None
    try:
        port = _wait(lambda: _port(info["state"]), 30, "the page server")
    except QAError:
        pass
    run = {"hub": hub, "workspace": info["ws"], "bise": bise, "app_root": root, "tree": tree_info(root),
           "pages_url": "http://127.0.0.1:%d/" % port if port else None, "outbox": os.path.join(info["tmp"], "outbox.jsonl"), "out": OUT}
    with open(RUN, "w") as f:
        json.dump(run, f, indent=1)
    return run


def stop():
    """Stops the throwaway hub (its own pids only)."""
    return {"hub": "stopped" if _stop_hub() else "not running"}


def _hub():
    info = _read(HUB)
    if not info or not _pid_alive(info.get("pid")):
        raise QAError("no throwaway hub: qa.py launch (hub fake or model) first")
    sys.path.insert(0, os.path.join(REPO, "tests"))
    import e2e  # noqa: E402
    # one client per hub socket: page_meta and the polls called this every few
    # seconds and each call left a socket and its reader open (ambient-pm m_5837:
    # Errno 24 under a 256-file limit)
    sock = os.path.join(info["state"], "hub.sock")
    c = _CLIENTS.get(sock)
    if c is None or getattr(c, "_dead", False):
        c = _CLIENTS[sock] = e2e.Client(sock)
    return c, info


_CLIENTS = {}


def _port(state):
    with open(os.path.join(state, "pages.port")) as f:
        return int(f.read().strip())


def raise_file_limit(want=10240):
    """The soft open-files limit up to `want` (a launchd shell starts at 256),
    as amb-mac did for the hub; the hard limit caps it."""
    import resource
    soft, hard = resource.getrlimit(resource.RLIMIT_NOFILE)
    new = want if hard == resource.RLIM_INFINITY else min(want, hard)
    if soft < new:
        resource.setrlimit(resource.RLIMIT_NOFILE, (new, hard))
    return resource.getrlimit(resource.RLIMIT_NOFILE)[0]


def _http(port, method, path, body=None, headers=None, tries=7):   # 7 tries: ~10 s (ambient-pm m_5763)
    """One request to the hub's page server; a GET whose connection drops
    (reset, refused, closed: the server under a republish and a timer's
    wake, ambient-pm m_5709) is tried again a few times, never a POST."""
    import http.client
    for k in range(tries if method == "GET" else 1):
        try:
            return _http_once(port, method, path, body, headers)
        except (ConnectionError, http.client.RemoteDisconnected, http.client.BadStatusLine, socket.timeout):
            if method != "GET" or k == tries - 1:
                raise
            time.sleep(0.5 * (k + 1))


def _http_once(port, method, path, body=None, headers=None):
    import http.client
    c = http.client.HTTPConnection("127.0.0.1", port, timeout=15)
    h = {"Host": "127.0.0.1:%d" % port}
    h.update(headers or {})
    data = json.dumps(body).encode() if body is not None else None
    if data is not None:
        h["Content-Type"] = "application/json"
    c.request(method, path, body=data, headers=h)
    r = c.getresponse()
    out = (r.status, r.read().decode())
    c.close()
    return out


def _wait(pred, timeout, what):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            v = pred()
            if v:
                return v
        except Exception:  # noqa: BLE001
            pass
        time.sleep(0.2)
    raise QAError("timeout waiting for %s" % what)




def _short_agent():
    return re.sub(r"[^a-z0-9]", "", (os.environ.get("SB_AGENT") or "me").lower())[:10] or "me"


# his own state: a harness path must never point there (ambient-lead m_8004)
HIS_STATE = [os.path.expanduser(p) for p in ("~/.bise/hubs", "~/.bise/run", "~/.bise/dev/ambient", "~/.bise/sessions",
                                              "~/.local/state/switchboard", "~/bise")]
# the gate's own checkout (scripts/nightly_gate.sh: the nightly's and the tip gate's tree), under
# ~/.bise/run but code, never his state: the real-core world's hubs run its repl-live
# (BISE_APP_ROOT, QA_BISE; tip 156b45461: 32 real-core checks 'no world up' on this refusal)
GATE_TREE = os.path.expanduser("~/.bise/run/nightly/tree")




def refuse_his_state(vals):
    """Refuse any value (an arg, an env value, a PATH-like list) whose path reaches his own state;
    programs are fine (his bise binary links into ~/.local/state/switchboard/build)."""
    for v in vals:
        for part in re.split(r"[:=]", str(v)):
            his = reaches_his_state(part)
            if his:
                raise QAError("refused: %r reaches his own state (%s)" % (v, his))


def reaches_his_state(path):
    """The part of his state this path is in (None: not his, or a program, or not a path)."""
    if not path.startswith("/"):
        return None
    rp = os.path.realpath(path)
    if os.path.isfile(rp) and os.access(rp, os.X_OK) and not rp.endswith((".sock", ".pid")):
        return None   # a program (his bise: ~/.bise/dev/build links into ~/.local/state/switchboard/build), never state
    gt = os.path.realpath(GATE_TREE)
    if rp == gt or rp.startswith(gt + "/"):
        return None   # the gate's own tree
    for his in HIS_STATE:
        if rp == os.path.realpath(his) or rp.startswith(os.path.realpath(his) + "/"):
            return his
    return None


def own_path(path):
    """A PATH without the folders in his state: an agent's PATH starts with its real hub's bin
    (~/.bise/hubs/<hub>/bin: that hub's sb), which a throwaway hub must never find."""
    return ":".join(p for p in (path or "").split(":") if p and not reaches_his_state(p))


def _prepare_home(home):
    """The isolated HOME laid out like his Mac: ~/.bise with migrated.json, so a process that
    gets no BISE_HOME (the env registry strips BISE_*/SB_* from children, 2eab3e15) still
    resolves <HOME>/.bise, as his core does."""
    b = os.path.join(home, ".bise")
    os.makedirs(b, exist_ok=True)
    m = os.path.join(b, "migrated.json")
    if not os.path.exists(m):
        with open(m, "w") as f:
            json.dump({"first": False, "copied": [], "moved": [], "by": "ambient-qa real"}, f)
    os.makedirs(os.path.join(home, "Library", "Logs"), exist_ok=True)


def real_home_env(env, home):
    """A hub's env for harness A: HOME = the isolated one, and none of the overrides that would
    tell the hub (or anyone it starts) where its state is: his rules find it."""
    env["HOME"] = home
    for k in ("SB_STATE_DIR", "BEND_SESSIONS_DIR", "BISE_HOME", "BISE_EXPORTS_FOR", "BEND_STDIN"):
        env.pop(k, None)
    # the caller's own run and temp folders (clean_env keeps them: BEND_RUN_DIR is his ~/.bise/run,
    # the plugins' per-session side channels; TMPDIR an agent's tmp) become the isolated HOME's
    env["BEND_RUN_DIR"] = os.path.join(home, ".bise", "run")
    tmp = os.path.join(home, "tmp")
    os.makedirs(tmp, exist_ok=True)
    for k in ("TMPDIR", "TMP", "TEMP", "TMUX_TMPDIR"):
        env[k] = tmp
    env["PATH"] = own_path(env.get("PATH"))
    _prepare_home(home)
    return env
