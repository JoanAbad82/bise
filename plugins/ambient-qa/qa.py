#!/usr/bin/env python3
"""ambient-qa: drive and inspect the real bise ambient.app without the user's hands.

The app, launched with `--qa fake|real`, opens a unix socket (0600) at
<bise dev dir>/qa/ambient/qa.sock (apps/ambient/mac/src/QA.swift). This
module launches it, talks to that socket, plays the SPEC §2 scenes and
makes contact sheets. server.py exposes it as MCP tools; this file is also
the one-line CLI:

  qa.py launch [--hub fake|real] [--workspace WS] [--bise EXE]
  qa.py scenes [--only id,id] [--backdrops dark,bright,busy] [--out DIR]
  qa.py say "dark mode for the settings page"      (hold fn, words, let go)
  qa.py snapshot [--what both|panel|screen|web] [--backdrop dark]
  qa.py state | events [N] | fn down|up|tap|double|cancel | key K
  qa.py inject '{"ev": "phase", "phase": "working"}'
  qa.py stop

Never: the mic (the voice is faked in the app), the speaker, a screenshot
of the user's screen (snapshots are the app's own web views on a synthetic
backdrop), the user's real main (the fake hub is a throwaway: tests/e2e.py's
scripted provider; `--hub real` is read-only: nothing is sent), a second
copy of the app (scripts/ambient.sh builds the one path), pkill by name
(only the QA app's own pid).
"""
import calendar
import datetime
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
import threading
import time

# realpath: the plugin is linked into an agent's .agents/plugins; the repo is where it really lives
HERE = os.path.dirname(os.path.realpath(__file__))
REPO = os.path.abspath(os.environ.get("AMBIENT_QA_REPO") or os.path.join(HERE, "..", ".."))
WEB = os.path.join(REPO, "apps", "ambient", "web")


def dev_dir():
    """<bise dev dir>: scripts/bins.sh's STATE (and Support.swift's defaultDevDir)."""
    if os.environ.get("BISE_HOME"):
        return os.path.join(os.environ["BISE_HOME"], "dev")
    home = os.path.expanduser("~")
    if os.path.exists(os.path.join(home, ".bise", "migrated.json")):
        return os.path.join(home, ".bise", "dev")
    return os.path.join(home, ".local", "state", "switchboard")


# one QA app, hub and socket per agent: ambient, ambient-pm and ambient-lead
# can QA at the same time without driving each other's app
QA_DIR = os.environ.get("AMBIENT_QA_DIR") or os.path.join(dev_dir(), "qa", os.environ.get("SB_AGENT") or "me")
APP_DIR = os.path.join(QA_DIR, "ambient")          # the QA app's own: app.pid, app.log, core.log, qa.sock
SOCK = os.path.join(APP_DIR, "qa.sock")
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
                        why = stale_bise(p, root)
                        if why:
                            skipped.append(why)
                        else:
                            found.append((os.path.getmtime(p), p, root))
    if found:
        # the tree closest to ambient-app's tip (fewest of its commits missing), then the newest build
        _, _, p, root = min((behind(root), -mt, p, root) for mt, p, root in found)
        return p, root
    if skipped:
        raise QAError("every bise found is older than its tree's Rust (an old hub with a fresh sb-core: main never shows): %s; "
                      "build one at ambient-app's tip (cargo build -p bend-harness, then scripts/bins.sh repl-live repl-scripted sb-core)"
                      % "; ".join(skipped))
    raise QAError("no bise with ambient-core next to a built repl-live: pass bise=<exe> (a debug build of the ambient-app branch, "
                  "its tree built with ./run.sh) or set AMBIENT_QA_BISE and AMBIENT_QA_APP_ROOT")


# ---------------------------------------------------------------- the socket

class Client:
    def __init__(self, path=SOCK, timeout=5.0):
        self.s = socket.socket(socket.AF_UNIX)
        self.s.settimeout(timeout)
        try:
            self.s.connect(path)
        except OSError as e:
            raise QAError("the QA app isn't running (%s): launch() first" % e)
        self.f = self.s.makefile("rb")
        self.n = 0

    def call(self, op, timeout=30.0, **kw):
        self.n += 1
        req = dict(kw, op=op, id=self.n)
        self.s.settimeout(timeout)
        self.s.sendall((json.dumps(req) + "\n").encode())
        while True:
            line = self.f.readline()
            if not line:
                raise QAError("the QA app closed the socket during %s" % op)
            r = json.loads(line)
            if r.get("id") == self.n:
                break
        if not r.get("ok"):
            raise QAError("%s: %s" % (op, r.get("error")))
        r.pop("id", None)
        r.pop("ok", None)
        return r

    def close(self):
        try:
            self.s.close()
        except OSError:
            pass


def call(op, timeout=30.0, **kw):
    c = Client()
    try:
        return c.call(op, timeout=timeout, **kw)
    finally:
        c.close()


def alive():
    try:
        return call("ping", timeout=3)
    except (QAError, OSError, ValueError):
        return None


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
    env["BISE_APP_ROOT"] = root    # e2e.Env passes it on to the hub: its repl-live
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


# ---------------------------------------------------------------- launch and stop

def _sh(args, **kw):
    # the one app path: scripts/ambient.sh resolves the dev dir itself (BISE_HOME,
    # ~/.bise/dev once migrated); an agent shell's SB_BUILD_DIR (another hub's
    # build dir) made it build a second copy, which the EDR deletes
    env = {k: v for k, v in os.environ.items() if k != "SB_BUILD_DIR"}
    return subprocess.run(args, capture_output=True, text=True, cwd=REPO, env=env, **kw)


def app_path(force_build=False):
    """The app to launch, built by scripts/ambient.sh when its sources changed. The build never
    stops his running app (amb-mac m_6527): while it runs, the new build waits in
    <build>/new/bise ambient.app and the script prints THAT path as its last line, which QA
    launches. force_build is kept for old callers and does nothing."""
    r = _sh(["scripts/ambient.sh", "build"])
    if r.returncode != 0:
        raise QAError("scripts/ambient.sh build failed: " + (r.stderr or r.stdout)[-800:])
    return r.stdout.strip().splitlines()[-1]


def launch(hub="fake", workspace=None, bise=None, web=None, backdrop="dark", force_build=False, restart=False, connectors=False, computer=False,
           real_accounts_approved_by_user="", no_app=False):
    """connectors and computer touch the user's real accounts (his Gmail,
    Slack, Linear, calendar, his browser and its logins): never, unless
    `real_accounts_approved_by_user` names the user's own message asking for
    this one run (the user's rule, main m_5200). Without it they are refused."""
    user_ask = (real_accounts_approved_by_user or "").strip()
    if (connectors or computer) and not user_ask:
        raise QAError("refused: real connectors and the computer plugin touch the user's real accounts. Only for a run the user "
                      "asked for himself: pass real_accounts_approved_by_user=<his message id>. QA uses the fake accounts.")
    if user_ask:
        print("ambient-qa: WARNING: this run uses the user's REAL accounts (%s), approved by the user in %s"
              % (", ".join(n for n, on in (("connectors", connectors), ("computer", computer)) if on) or "none", user_ask), file=sys.stderr)
    if hub not in ("fake", "model", "real"):
        raise QAError("hub: fake (a throwaway scripted hub), model (a throwaway hub with your real model and keys) or real (your workspace, read-only)")
    if no_app:
        # the hub, its page server and the fake accounts only: never builds or opens the app (ambient-lead m_5413)
        if hub == "real":
            raise QAError("no_app needs a throwaway hub (fake or model)")
        bise, root = find_bise(bise)
        require_commits(root)
        if alive():
            stop(keep_hub=True)
        info = _start_hub(bise, root, hub, connectors and hub == "model", computer, user_ask)
        port = None
        try:
            port = _wait(lambda: _port(info["state"]), 30, "the page server")
        except QAError:
            pass
        run = {"hub": hub, "no_app": True, "workspace": info["ws"], "bise": bise, "app_root": root, "tree": tree_info(root),
               "pages_url": "http://127.0.0.1:%d/" % port if port else None, "outbox": os.path.join(info["tmp"], "outbox.jsonl"), "out": OUT}
        with open(RUN, "w") as f:
            json.dump(run, f, indent=1)
        return run
    up = alive()
    if up and not restart:
        run = _read(RUN) or {}
        if run.get("hub") == hub:
            return dict(run, already=True, pid=up.get("pid"))
    if up:
        stop(keep_hub=(hub != "real"))
    bise, root = find_bise(bise)
    app = app_path(force_build)
    web = web or os.environ.get("BISE_AMBIENT_WEB") or WEB
    env = {"PATH": os.environ.get("PATH", "/usr/bin:/bin"), "BISE_APP_ROOT": root}
    if hub in ("fake", "model"):
        info = _start_hub(bise, root, hub, connectors and hub == "model", computer, user_ask)
        ws = info["ws"]
        env.update(info["env"])
    else:
        ws = os.path.abspath(workspace or REPO)
        if os.environ.get("BISE_HOME"):
            env["BISE_HOME"] = os.environ["BISE_HOME"]
    os.makedirs(APP_DIR, exist_ok=True)
    try:
        os.unlink(SOCK)
    except OSError:
        pass
    # the app's QA mode: real = read-only; fake and model hubs are throwaways it may write to
    args = ["open", "-n", "-a", app, "--args", "--qa", "real" if hub == "real" else "fake", "--workspace", ws, "--bise", bise,
            "--web", web, "--dev", QA_DIR]
    for k, v in env.items():
        args += ["--env", "%s=%s" % (k, v)]
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode != 0:
        raise QAError("open failed: " + r.stderr)
    t0 = time.time()
    ping = None
    while time.time() - t0 < 30:
        ping = alive()
        if ping and ping.get("ready"):
            break
        time.sleep(0.25)
    if not ping:
        raise QAError("the QA app didn't open its socket in 30 s: see %s" % os.path.join(APP_DIR, "app.log"))
    # the one app path, checked on the running process (open could pick another
    # registered copy of dev.bise.ambient): another path is stopped, loudly
    exe = subprocess.run(["ps", "-p", str(ping.get("pid")), "-o", "comm="], capture_output=True, text=True).stdout.strip()
    if exe and not os.path.realpath(exe).startswith(os.path.realpath(app) + "/"):
        try:
            call("quit", timeout=3)
        except (QAError, OSError):
            os.kill(ping["pid"], signal.SIGTERM)
        raise QAError("the QA app ran from %s, not the one app path %s: stopped. Delete that copy and launch again" % (exe, app))
    call("backdrop", kind=backdrop)
    hub_up = _wait_hub(30)
    run = {"hub": hub, "workspace": ws, "bise": bise, "app_root": root, "tree": tree_info(root), "web": web, "app": app, "pid": ping.get("pid"),
           "hub_up": hub_up, "socket": SOCK, "out": OUT, "logs": [os.path.join(APP_DIR, "app.log"), os.path.join(APP_DIR, "core.log")]}
    with open(RUN, "w") as f:
        json.dump(run, f, indent=1)
    return run


def _wait_hub(timeout):
    t0 = time.time()
    while time.time() - t0 < timeout:
        m = (state().get("model") or {})
        if (m.get("hub") or {}).get("up"):
            return True
        time.sleep(0.3)
    return False


def stop(keep_hub=False):
    """Quit the QA app (its own pid only) and the fake hub."""
    out = {"app": "not running", "hub": "kept" if keep_hub else "not running"}
    ping = alive()
    pid = (ping or {}).get("pid")
    if pid is None:
        try:
            pid = int(open(os.path.join(APP_DIR, "app.pid")).read().strip())
        except (OSError, ValueError):
            pid = None
    if ping:
        try:
            call("quit", timeout=3)
        except (QAError, OSError):
            pass
    if pid and _pid_alive(pid):
        t0 = time.time()
        while _pid_alive(pid) and time.time() - t0 < 5:
            time.sleep(0.1)
        if _pid_alive(pid):
            os.kill(pid, signal.SIGTERM)
        out["app"] = "stopped pid %d" % pid
    if not keep_hub and _stop_hub():
        out["hub"] = "stopped"
    return out


# ---------------------------------------------------------------- the driving ops

def inject(ev):
    if isinstance(ev, str):
        ev = json.loads(ev)
    return call("inject", ev=ev)


def fn(state, key="fn"):
    return call("fn", state=state, key=key)


def key(k):
    return call("key", k=k)


def click(selector, route="appkit", deactivate=True, settle_ms=400):
    """One real mouse click on the QA app's capsule (ambient-lead m_6481, ambient-pm's dogfood
    check): a CGEvent left down/up at the element's screen point, posted to the QA app's own pid,
    never the HID tap (his pointer never moves, no other app gets it), with bise not frontmost.
    Returns, layer by layer: window_at_point (the window server's top window there), the panel's
    mouse settings, hit_view (what the panel hit-tests there), appkit (the events AppKit saw), dom
    (pointerdown/mousedown/click the page got, and on what), clicked. route=window names the panel
    in the event (when 'point' fails, it tells routing from the view). It can't catch another app's
    window above the panel taking a real click (window_at_point says it), nor hover under a moving
    pointer."""
    return call("click", timeout=20, selector=selector, route=route, deactivate=deactivate, settle_ms=settle_ms)


CLICK_STATES = {
    # a question card from main with a page link (options 1..n, open the page), and a batch of
    # drafts (review, send all): the states pm's click check walks (ambient-pm m_6584)
    "card": {"ev": "state", "agents": [], "pages": [], "timers": [],
             "cards": [{"id": 901, "kind": "question", "agent": "main", "text": "which date works for the pricing review?",
                        "options": [{"n": 1, "label": "tuesday"}, {"n": 2, "label": "thursday"}],
                        "page": {"id": "mentions-qa", "block": "new", "item": "s-301", "url": "http://127.0.0.1:9/p/mentions-qa#s-301"}}]},
    "drafts": {"ev": "state", "agents": [], "pages": [], "timers": [],
               "cards": [{"id": 902, "agent": "inbox", "kind": "drafts", "text": "3 drafts ready: legal · Lucas · Marc",
                          "options": [{"n": 1, "label": "review"}, {"n": 2, "label": "send all 3"}],
                          "page": {"id": "inbox", "block": "r1", "item": "i1", "drafts": True, "url": "http://127.0.0.1:9/p/inbox#i1"},
                          "batch": {"count": 3, "title": "your inbox", "what": "replies", "names": ["legal", "Lucas", "Marc"]}}]},
}
CLICK_STATES["settings"] = {"ev": "state", "agents": [], "pages": [], "timers": [], "cards": []}
CLICK_STATES["question"] = CLICK_STATES["card"]
CLICK_OPEN = {"card": "i", "drafts": "i", "settings": ",", "question": None}   # question: the card pushed by itself
CLICK_DIRS = ("page>app", "app>core", "app>core(qa)", "app>open")


def _view_now():
    """The capsule's view without what moves by itself (the orb's pose, fps)."""
    v = dict(state().get("view") or {})
    for k in ("poseMs", "fps", "level", "t"):
        v.pop(k, None)
    return json.dumps(v, sort_keys=True)


def clicks(state="card", open_key="auto", selector=None, settle_s=1.0, then=None):
    """Every button the capsule shows in one state, clicked once each by the real mouse path
    (ambient-pm m_6584): before each click the state is set again from rest (the fake core's
    state event, then fn + open_key through the real key path), the element is found again by
    its place, and one click goes in with bise not frontmost. Per button: its label, whether the
    page got the click, and the commands that left the page/app after it (page>app, app>core):
    exactly one expected. state: a CLICK_STATES name or a state event (dict)."""
    ev = CLICK_STATES[state] if isinstance(state, str) else state
    if open_key == "auto":
        open_key = CLICK_OPEN.get(state, "i") if isinstance(state, str) else "i"
    if isinstance(state, str) and state not in CLICK_STATES:
        raise QAError("clicks: state %s (one of %s, or a state event)" % (state, ", ".join(sorted(CLICK_STATES))))

    n = [0]

    def setup():
        rest()
        # fresh card ids every time: a card the app has seen is never pushed again (ambient-pm
        # m_6611: --state question never showed), and the page re-renders on a new one
        e = json.loads(json.dumps(ev))
        n[0] += 1
        for cd in e.get("cards", []):
            cd["id"] = int(cd["id"]) * 1000 + n[0] if isinstance(cd["id"], int) else "%s-%d" % (cd["id"], n[0])
        inject(e)
        if open_key:
            code = KEYCODES[open_key]
            keyev("fn_down"); keyev("down", code, fn=True); keyev("up", code, fn=True); keyev("fn_up")
        # the view settled: the card comes in through the app's own show (~1 s); listed before,
        # a target was re-rendered away by the time it was clicked (ambient-pm m_6611)
        t, last = time.time(), None
        while time.time() - t < 4:
            time.sleep(0.3)
            v = _view_now()
            if v == last and time.time() - t > 0.9:
                break
            last = v
        items = listing()
        if then:
            # a view reached by a click first (ambient-pm m_6641: a card's own bar, from its row in
            # fn i: then='card-' clicks the first row whose data-qa starts with it)
            hit = next((x for x in items if (x.get("qa") or "").startswith(then)), None)
            if not hit:
                return []
            click('#amb [data-qa="%s"]' % hit["qa"])
            settled()
            items = listing()
        return items

    def settled():
        t, last = time.time(), None
        while time.time() - t < 4:
            time.sleep(0.3)
            v = _view_now()
            if v == last and time.time() - t > 0.9:
                break
            last = v

    def listing():
        # round 9's targets (amb-web 3d99a361: [data-qa] under #amb, the glass itself excluded),
        # else whatever looks clickable on an older page
        if selector:
            return call("clickables", selector=selector).get("items", [])
        return call("clickables", selector="#amb [data-qa]:not([data-qa=glass])").get("items", []) or call("clickables").get("items", [])

    first = setup()
    out = {"state": state if isinstance(state, str) else "custom", "items": [], "fails": []}
    if not first:
        out["fails"].append("no clickable thing shown in state %s" % out["state"])
    for it in first:
        items = setup()
        same = next((x for x in items if it.get("qa") and x.get("qa") == it["qa"]), None) \
            or next((x for x in items if x["i"] == it["i"] and x["label"] == it["label"]), None)
        r = {"i": it["i"], "label": it["label"], "cursor": it.get("cursor")}
        out["items"].append(r)
        if not same:
            out["fails"].append("%r: not shown again the same way" % it["label"])
            continue
        mark = _mark()
        v0 = _view_now()
        try:
            # its own data-qa when it has one (stable across re-renders), else its place
            c = click('#amb [data-qa="%s"]' % same["qa"] if same.get("qa") else '[data-qa-i="%d"]' % same["i"])
        except QAError as e:
            out["fails"].append("%r: %s" % (it["label"], e))
            continue
        time.sleep(settle_s)
        evs = [e for e in _new_events(mark) if e["dir"] in CLICK_DIRS]
        # each with its hop: one answer shows as page>app (the page to the app) then app>core (the
        # app to the core), one command on its way (ambient-pm m_6659)
        cmds = [dict(e["ev"], route=e["dir"]) for e in evs]
        changed = _view_now() != v0
        # the page took it: its click on the target, or its pointerdown there when the target was
        # re-rendered under the pointer before the click (the fn hints act on pointerdown)
        # judged by the act (ambient-pm m_6680: presses that act on release, amb-web 78e24cdf): a
        # command left or the view changed after a press on it counts, whatever the click event did
        pressed = c.get("clicked") or any(d.get("inside") for d in c.get("dom") or [])
        took = pressed or bool(cmds) or changed
        r.update(clicked=bool(took), window_at_point=c.get("window_at_point"), commands=cmds, view_changed=changed)
        if c.get("window_at_point") != "panel":
            # the window server has another window there: his real click would go to it, whatever
            # the app does with the event QA hands it (ambient-pm m_6641: the card body → Chrome)
            out["fails"].append("%r: at its point the window server has %s, not the panel: a real click goes there" % (it["label"], c.get("window_at_point")))
        if not took:
            out["fails"].append("%r: the page got no click (window %s, hit %s)" % (it["label"], c.get("window_at_point"), c.get("hit_view")))
        elif not cmds and not changed:
            # an in-page action (↑↓ moves the selection) changes the view without a command
            out["fails"].append("%r: clicked, but nothing happened (no command, the view unchanged)" % it["label"])
        else:
            # the same command twice on one hop (page>app, then app>core is one command on its way)
            keys_ = [e["dir"] + json.dumps(e["ev"], sort_keys=True) for e in evs if e["ev"].get("cmd") not in ("app_size", "app_ready", "app_content")]
            if len(keys_) != len(set(keys_)):
                out["fails"].append("%r: a command went twice: %s" % (it["label"], cmds))
        if it.get("cursor") == "text":
            out["fails"].append("%r: the text cursor on a button" % it["label"])
    rest()
    out["verdict"] = "pass" if not out["fails"] else "FAIL"
    return out


def hover(selector, ms=1000):
    """The pointer over an element without moving his pointer (ambient m_6592 (4)): mouseMoved
    events at its point into the QA app's queue for `ms`; over = the page saw the pointer on it.
    It can't drive the window server's tracking areas (cursor shape, enter/exit)."""
    return call("hover", timeout=10 + ms / 1000, selector=selector, ms=ms)


def eval_js(src, fn_held=False, settle_s=0.6):
    """One JS expression read on the capsule's page (amb-mac m_6655), its value back (JSON
    parsed when it is JSON). fn_held: read while fn is held through the real key path (talk
    open), then let go with a cancel so nothing reaches the core. Reads only: never act with it."""
    if fn_held:
        call("fn", state="down")
        time.sleep(settle_s)
    try:
        r = call("eval", js=src)
    finally:
        if fn_held:
            call("fn", state="cancel")
    v = r.get("value")
    if isinstance(v, str):
        try:
            r["value"] = json.loads(v)
        except ValueError:
            pass
    r["fn_held"] = fn_held
    return r


def alpha(name="alpha", pearl=None, glass=None, ring=6, outside=10, out=None):
    """The panel's own pixels with alpha (ScreenCaptureKit, this window alone, no shadow) and the
    verdicts ambient's gate wants: the pearl's 4 corners and a ring `ring` px outside its disc at
    alpha 0 (the pearl floats on the screen), and `outside` px outside the glass at alpha 0 or
    off the window (a click there reaches the app below)."""
    kw = {"name": name, "ring": ring, "outside": outside, "dir": out or os.path.join(OUT, "alpha")}
    if pearl:
        kw["pearl"] = pearl
    if glass:
        kw["glass"] = glass
    r = call("alpha", timeout=20, **kw)
    fails = []
    p = r.get("pearl")
    if not p:
        fails.append("no pearl on the page")
    else:
        if any(c for c in p.get("corners", []) if isinstance(c, int) and c > 0):
            fails.append("the pearl's corners aren't transparent: %s" % p["corners"])
        if p.get("ring_max", 0) > 0:
            fails.append("a ring %s px outside the pearl has alpha up to %d" % (p.get("ring_px"), p["ring_max"]))
    g = r.get("glass")
    if g:
        hot = {k: v for k, v in g.get("alpha_outside", {}).items() if isinstance(v, int) and v > 0}
        if hot:
            fails.append("%s px outside the glass the panel isn't transparent (a click there stays in bise): %s" % (g.get("outside_px"), hot))
    r["fails"], r["verdict"] = fails, ("pass" if not fails else "FAIL")
    return r


def keyev(kind, code=None, fn=False, words=None, per_word_ms=None):
    """A keyboard event through the app's real key path (Keys.qaEvent: KeyMachine, its hold
    threshold, App.key) on a QA app whose tap never starts: kind fn_down|fn_up|down|up."""
    kw = {"kind": kind}
    if code is not None:
        kw["code"] = code
    if fn:
        kw["fn"] = True
    if words:
        kw["words"] = words
    if per_word_ms:
        kw["per_word_ms"] = per_word_ms
    return call("keyev", **kw)


def rest():
    """The capsule back to rest (folded into the icon) and bise not the active app."""
    return call("rest", timeout=15)


KEY_SPACE, KEY_DOT = 49, 47

# macOS virtual key codes (Carbon kVK_*), US layout: what `keys` posts
KEYCODES = {"return": 36, "enter": 36, "tab": 48, "space": 49, "delete": 51, "backspace": 51, "esc": 53, "escape": 53,
            "left": 123, "right": 124, "down": 125, "up": 126, ".": 47, ",": 43, "/": 44,
            "1": 18, "2": 19, "3": 20, "4": 21, "5": 23, "6": 22, "7": 26, "8": 28, "9": 25, "0": 29,
            "a": 0, "s": 1, "d": 2, "f": 3, "h": 4, "g": 5, "z": 6, "x": 7, "c": 8, "v": 9, "b": 11, "q": 12, "w": 13,
            "e": 14, "r": 15, "y": 16, "t": 17, "o": 31, "u": 32, "i": 34, "p": 35, "l": 37, "j": 38, "k": 40,
            "n": 45, "m": 46}
MODS = {"cmd": "cmd", "command": "cmd", "⌘": "cmd", "shift": "shift", "alt": "alt", "option": "alt", "ctrl": "ctrl", "control": "ctrl"}


def key_seq(specs):
    """'cmd+return', 'up', 'cmd+1', 'esc', 'type:hello world' → the keys op's [{code, flags, text?}];
    'type:' text goes one character per key event (its unicode string, as typed)."""
    seq = []
    for s in specs:
        if s.startswith("type:"):
            for ch in s[5:]:
                seq.append({"code": KEYCODES.get(ch.lower(), KEYCODES["space"] if ch == " " else 0), "flags": [], "text": ch})
            continue
        parts = [p for p in s.replace("⌘", "cmd+").lower().split("+") if p]
        *mods, k = parts
        bad = [m for m in mods if m not in MODS]
        if bad or k not in KEYCODES:
            raise QAError("keys: unknown key %r (keys: %s; mods: cmd shift alt ctrl; text: type:<words>)" % (s, " ".join(sorted(KEYCODES))))
        seq.append({"code": KEYCODES[k], "flags": [MODS[m] for m in mods]})
    return seq


def keys(*specs, gap_ms=60):
    """Real keys into the QA app's panel (ambient-lead m_6514, round 9's bar): CGEvent key down/up
    posted to the QA app's own pid (never the HID tap, nothing reaches his front app), e.g.
    keys('type:what is going on', 'return'), keys('down', 'down', 'cmd+return'), keys('cmd+2'),
    keys('esc'). Returns the panel's key state, what AppKit saw and the page's keydown/input
    events. The panel only takes them when the app made it key, as for his keys."""
    return call("keys", timeout=30 + len(specs), seq=key_seq(specs), gap_ms=gap_ms)


def _new_events(mark):
    return [e for e in events(400, False).get("events", []) if e["t"] > mark]


def _mark():
    ev = events(1, True).get("events", [])
    return ev[-1]["t"] if ev else 0.0


def fn_hold_closed(variants=("launch", "fold", "hide"), words="what is on my plate today", per_word_ms=150,
                   within_ms=300, answer_s=20):
    """fn from rest (ambient-pm's dogfood check, ambient-lead m_6481): the capsule closed, bise not
    frontmost, fn held through the real key path; the pearl must listen within `within_ms`, the
    fake voice's words reach the core on release and main's line shows; a tap does nothing.
    Variants: launch (as the app is now: run it right after `launch`), fold (opened with fn + space,
    then left to fold by itself), hide (opened, then fn + . hid it). Never the real fn: the QA app
    has no tap, the events go through Keys.qaEvent."""
    out = {"variants": [], "fails": []}
    for v in variants:
        r = {"variant": v}
        out["variants"].append(r)
        rest()
        if v in ("fold", "hide"):
            keyev("fn_down"); keyev("down", KEY_SPACE, fn=True); keyev("up", KEY_SPACE, fn=True); keyev("fn_up")
            t = time.time()
            while time.time() - t < 3 and not state().get("app", {}).get("visible"):
                time.sleep(0.05)
            r["opened"] = bool(state().get("app", {}).get("visible"))
            if v == "hide":
                keyev("fn_down"); keyev("down", KEY_DOT, fn=True); keyev("up", KEY_DOT, fn=True); keyev("fn_up")
            t = time.time()
            while time.time() - t < 30 and state().get("app", {}).get("visible"):
                time.sleep(0.2)
            r["closed_after_s"] = round(time.time() - t, 1)
        st = state().get("app", {})
        r["rest"] = {"visible": st.get("visible"), "hidden": st.get("hidden")}
        if st.get("visible"):
            out["fails"].append("%s: the capsule is still on screen before fn" % v)
            continue
        mark = _mark()
        t0 = time.time()
        k = keyev("fn_down", words=words, per_word_ms=per_word_ms)
        r["fn_down_swallowed"] = k.get("swallowed")
        listen = None
        while time.time() - t0 < 2.0:
            a = state().get("app", {})
            if a.get("listening") and a.get("visible"):
                listen = round((time.time() - t0) * 1000)
                break
            time.sleep(0.02)
        r["listening_ms"] = listen
        if listen is None:
            out["fails"].append("%s: fn held from rest: the pearl didn't listen within 2 s" % v)
        elif listen > within_ms:
            out["fails"].append("%s: fn held from rest: the pearl listened after %d ms (%d expected)" % (v, listen, within_ms))
        time.sleep(len(words.split()) * per_word_ms / 1000 + 0.6)
        keyev("fn_up")
        sent = main = None
        t1 = time.time()
        while time.time() - t1 < answer_s and (sent is None or main is None):
            for e in _new_events(mark):
                ev = e["ev"]
                if sent is None and e["dir"].startswith("app>core") and ev.get("cmd") == "send":
                    sent = ev.get("text")
                if main is None and e["dir"] == "core>app" and ev.get("ev") == "main":
                    main = ev.get("text")
            time.sleep(0.2)
        r["sent"], r["main"] = sent, main
        if not sent:
            out["fails"].append("%s: the words never reached the core after fn up" % v)
        elif words.split()[0].lower() not in sent.lower():
            out["fails"].append("%s: the core got %r, not the words said" % (v, sent))
        if sent and not main:
            out["fails"].append("%s: no main line after the words" % v)
    # a tap from rest does nothing visible and starts no recording
    rest()
    mark = _mark()
    keyev("fn_down")
    time.sleep(0.08)
    keyev("fn_up")
    time.sleep(1.0)
    a = state().get("app", {})
    talk = [e for e in _new_events(mark) if e["ev"].get("cmd") == "talk_start"]
    out["tap"] = {"visible": a.get("visible"), "listening": a.get("listening"), "talk_start": len(talk)}
    if a.get("visible") or a.get("listening") or talk:
        out["fails"].append("a tap of fn from rest showed or started something: %s" % out["tap"])
    rest()
    out["verdict"] = "pass" if not out["fails"] else "FAIL"
    return out


def say(text, per_word_ms=240, wait_answer=True, timeout=90):
    """Hold fn, the words heard one by one (a fake level), let go: they go to
    main (the fake hub's main answers `ack: ...`); waits for main's answer
    and for its spoken end (phase done)."""
    before = len(events(2000, levels=False)["events"])
    r = call("say", text=text, per_word_ms=per_word_ms, timeout=timeout)
    if not wait_answer or not r.get("sent"):
        return r
    t0 = time.time()
    main = None
    while time.time() - t0 < timeout:
        evs = events(2000, levels=False)["events"][before:]
        for e in evs:
            if e["dir"] == "core>app" and e["ev"].get("ev") == "main":
                main = e["ev"].get("text")
        if main is not None and any(e["ev"].get("ev") == "phase" and e["ev"].get("phase") == "done" and e["dir"] == "qa>app" for e in evs):
            break
        time.sleep(0.3)
    r["main"] = main
    return r


def snapshot(what="both", backdrop=None, name=None, out=None):
    out = out or os.path.join(OUT, "shots")
    q = {"what": what, "dir": out}
    if backdrop:
        q["backdrop"] = backdrop
    if name:
        q["name"] = name
    return call("snapshot", **q)


MENUBAR_STATES = ("still", "work", "need", "away", "done", "fail", "listen")


def menubar(states=None, frames=1, count=2, out=None):
    """The menu-bar item (amb-mac's StatusItem) in each SPEC §0 state, put
    there through its own API: its button's composed image (the pearl's
    frame, ▲/☾, the rose count pill) at 1x and 2x, transparent and on a
    light and a dark menu-bar strip, plus one sheet of them all. `frames`:
    successive frames of the moving moods (work, done, listen)."""
    out = out or os.path.join(OUT, "menubar-%s" % time.strftime("%Y%m%d-%H%M%S"))
    q = {"dir": out, "frames": int(frames), "count": int(count)}
    if states:
        q["states"] = [s for s in states.split(",") if s] if isinstance(states, str) else list(states)
    r = call("menubar", timeout=120, **q)
    tiles = []
    for s in r["states"]:
        for strip in ("dark", "light"):
            f = [p for p in s["files"] if p.endswith(".%s@2x.png" % strip)]
            if f:
                tiles.append({"path": f[0], "label": "%s · %s%s" % (s["state"], strip, " · %d frames" % frames if frames > 1 else "")})
    if tiles:
        r["sheet"] = os.path.join(out, "sheet.menubar.png")
        # every tile at one scale, 8x of 1x (ambient m_5479): the strips share one width
        zoom = 8
        call("sheet", items=tiles, out=r["sheet"], cols=4, tile_w=zoom * float(r.get("strip_w") or 48),
             title="bise ambient · the menu-bar item at %dx (need = %d)" % (zoom, count), timeout=60)
    return r


def menu():
    """The menu-bar menu as its rows, in order (amb-mac a069b924: --qa has no
    menu-bar item): {kind: header|card|page|watch|stop|talk|toggle|settings|
    quit|separator, title, keys?, ref? (card id, page URL, timer id), enabled, indent?}."""
    return call("menu")


def menu_click(kind, ref=None):
    """A menu row clicked as the real one: stop -> the watch's timer stops
    (every_stop), page/watch -> the URL logged as opened (never his browser),
    card -> bise opens on that card (app_key i)."""
    if kind == "stop" and isinstance(ref, str) and ref.isdigit():
        ref = int(ref)
    return call("menu_click", kind=kind, ref=ref)


def pearl(out=None):
    """Every pearl frame amb-mac plays per mood (the bundle's <mood>-NN.png), at 1x and 2x."""
    return call("pearl", dir=out or os.path.join(OUT, "pearl"), timeout=120)


def state():
    return call("state")


def events(n=50, levels=False):
    return call("events", n=n, levels=levels)


def reset():
    return call("reset")


# ---------------------------------------------------------------- pages on the throwaway hub

KIT_EXAMPLE = os.path.join(REPO, "apps", "ambient", "kit", "examples", "weekly-update.html")


def _hub():
    info = _read(HUB)
    if not info or not _pid_alive(info.get("pid")):
        raise QAError("no throwaway hub: launch() (hub fake or model) first")
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


def page_publish(file=None, id="weekly-update", title="weekly update", done=None, answers=None, edit=None, timeout=120):
    """The throwaway hub's main publishes a page (`sb page publish` through
    the scripted provider's [[bash: ...]]): `file`, else amb-kit's
    weekly-update example; `edit` {old: new} changes the text first (a v2).
    `done` note ids, `answers` {note id: text}. Returns the page's url,
    version and the page server's port."""
    c, info = _hub()
    src = open(file or KIT_EXAMPLE).read()
    for a, b in (edit or {}).items():
        src = src.replace(a, b)
    before = {p["id"]: p.get("version", 0) for p in (_wait(lambda: c.state, 10, "the hub's state") or {}).get("pages", [])}
    path = os.path.join(info["tmp"], "qa-page-%s-%d.html" % (id, int(time.time() * 1000)))
    with open(path, "w") as f:
        f.write(src)
    cmd = 'sb page publish %s --id %s --title "%s"' % (path, id, title.replace('"', ""))
    if done:
        cmd += " --notes-done " + ",".join(done)
    for nid, text in (answers or {}).items():
        cmd += ' --note-answer %s="%s"' % (nid, text.replace('"', ""))
    if info.get("kind") == "model":
        raise QAError("page_publish scripts the fake main; on a model hub ask main yourself")
    c.say("[[bash: %s]]" % cmd)
    page = _wait(lambda: next((p for p in c.state.get("pages", []) if p["id"] == id and p.get("version", 0) > before.get(id, 0)), None),
                 timeout, "page %s published (main's lines: %s)" % (id, c.lines("main")[-3:]))
    port = _port(info["state"])
    return {"id": id, "version": page.get("version"), "url": page.get("url"), "port": port, "pages_url": "http://127.0.0.1:%d/" % port}


def page_notes(id, notes, send=False):
    """Draft notes on a page through its own API (the token from the page's
    shell, the server's origin), as notes.js would; `send` sends them to
    the page's agent. A note: {block, kind: note|keep|drop|unsure|edit|voice|pin,
    quote?, text?, before?, after?}."""
    _, info = _hub()
    port = _port(info["state"])
    st, body = _http(port, "GET", "/p/%s" % id)
    if st != 200:
        raise QAError("GET /p/%s: %d" % (id, st))
    token = body.split('<meta name="bise-token" content="')[1].split('"')[0]
    h = {"Origin": "http://127.0.0.1:%d" % port, "X-Bise-Token": token}
    st, saved = _http(port, "POST", "/api/p/%s/notes" % id, {"notes": notes}, h)
    if st != 200:
        raise QAError("POST notes: %d %s" % (st, saved))
    out = {"saved": json.loads(saved).get("notes", [])}
    if send:
        st, sent = _http(port, "POST", "/api/p/%s/send" % id, {}, h)
        if st != 200:
            raise QAError("POST send: %d %s" % (st, sent))
        out["sent"] = json.loads(sent)
    return out


def page_meta(id, tries=6):
    """A page's meta; a 404 is retried for a few seconds (ambient-pm m_5639:
    a watcher's republish made one GET miss, and the run stopped there)."""
    _, info = _hub()
    port = _port(info["state"])
    for k in range(tries):
        st, body = _http(port, "GET", "/p/%s/meta" % id)
        if st == 200:
            return json.loads(body)
        if st != 404 or k == tries - 1:
            break
        time.sleep(0.5 * (k + 1))
    raise QAError("GET /p/%s/meta: %d" % (id, st))


def page_drive(id=None, url=None, steps=None, schemes=("light",), name=None, out=None, width=1400, height=900, scale=2):
    """A page in a throwaway headless Chrome (pagedrive.mjs: its own profile,
    no logins, local URLs only), never the user's browser: the page `id` on
    the throwaway hub (or a local `url`), `steps` run in order (eval, key,
    mouse, type, wait, shot), once per color scheme. Returns each run's
    results (evals, shot files) and the page's console."""
    if not url:
        if not id:
            raise QAError("page_drive needs a page id (on the throwaway hub) or a local url")
        _, info = _hub()
        port = _port(info["state"])
        url = "http://127.0.0.1:%d/p/%s" % (port, id)
    if isinstance(schemes, str):
        schemes = [x for x in schemes.split(",") if x]
    out = out or os.path.join(OUT, "pages")
    os.makedirs(out, exist_ok=True)
    name = name or (id or "page")
    runs = []
    for sc in schemes:
        args = {"url": url, "out": os.path.join(out, "%s.%s" % (name, sc)), "steps": steps or [], "scheme": sc,
                "width": width, "height": height, "scale": scale}
        r = subprocess.run(["node", os.path.join(HERE, "pagedrive.mjs"), json.dumps(args)], capture_output=True, text=True, timeout=600)
        try:
            res = json.loads(r.stdout.strip().splitlines()[-1])
        except (ValueError, IndexError):
            raise QAError("pagedrive failed: " + (r.stderr or r.stdout)[-800:])
        if res.get("error"):
            raise QAError("pagedrive: %s" % res["error"])
        runs.append(dict(res, scheme=sc))
    return {"url": url, "runs": runs}


def page_fixture(id="weekly-update"):
    """ambient's fixture (m_4872): v1, three notes sent (a note, a voice
    note, an edit), then v2 answering them: one done, one answered, the
    edit kept as an open draft-free sent note; a fourth note on a block v2
    removes shows as moved. Returns the urls of v1 and v2 and the notes."""
    v1 = page_publish(id=id)
    notes = [
        {"block": "p1", "quote": "dark mode ships on the settings page monday", "kind": "note", "text": "say which monday"},
        {"block": "p2", "kind": "voice", "text": "can we add who owns the release"},
        {"block": "p1", "kind": "edit", "before": "half the size", "after": "a third of the size"},
        {"block": "c1", "kind": "unsure"},
    ]
    sent = page_notes(id, notes, send=True)
    ids = [n["id"] for n in sent["saved"]]
    # the notes made main take a turn: v2 goes after it (else it waits behind it)
    c, _ = _hub()
    c.wait_line("main", "you sent 4 notes", 120)
    c.wait_idle("main", timeout=180)
    v2 = page_publish(id=id, edit={"dark mode ships on the settings page monday": "dark mode ships on the settings page on monday 14",
                                   '<section data-kit="callout" data-id="c1">': '<section data-kit="callout" data-id="c1b">'},
                      done=ids[:1], answers={ids[1]: "release is owned by perf until the 20th"})
    return {"v1": v1, "v2": v2, "notes": page_meta(id).get("notes", [])}


# ---------------------------------------------------------------- scripted product runs

# ambient-lead m_5306: the same asks, notes and measures every time, on a
# model hub with the fake accounts only (never the user's accounts)
SCENARIOS = {
    "weekly-update": {"ask": "draft my weekly update from Slack and Linear", "no_send": False},
    "inbox": {"ask": "go through my mail, draft replies, don't send", "no_send": True},
    "offsite": {"ask": "plan the offsite: the venue we decided, the budget, and an agenda for the two days, from my mail and Slack", "no_send": False},
    # roadmap B (ambient-lead m_5447): a review page, republished after a tick
    # with the new comments, cards only for what needs an answer, nothing posted
    "launch-watch": {"ask": "watch the launch until tomorrow, tell me what needs an answer", "no_send": True, "no_writes": True,
                     "notes": False, "ticks": 1},
}


SCENARIOS.update({
    # roadmap A (ambient-lead m_5616): a Kit draft only after his word, the went line, no send
    "newsletter": {"ask": "write the newsletter for the launch from the release notes", "no_send": True, "notes": False, "flow": "newsletter"},
    # roadmap C: the feedback review, 'start an agent' on two items, agents with the item as brief, nothing leaves
    # no_send off: the flow checks nothing leaves before his send note, then exactly one Slack message
    "feedback": {"ask": "Benjamin's bug reports in #acme-feedback: handle them so adoption is easy", "no_send": False, "notes": False, "flow": "feedback",
                 "picks": {"q-language": 2}},
    # roadmap D (amb-core 527fa441): a step-by-step plan, bise ticks its own, a card per step of his when its turn comes
    # no_send off: a send is checked against his word on its draft card by the flow (ambient-pm m_5932)
    "checklist": {"ask": "check my mail and give me a step by step to buy the domain", "no_send": False, "notes": False, "flow": "checklist",
                  "note_texts": {"legal": "legal@acme.test"}},
    # roadmap E (amb-kit m_5643): a seeded night (a PR done, a question card, unsent replies,
    # his domain steps, the launch watch), then the morning page from it; nothing leaves
    "morning": {"ask": "make today's morning page", "no_send": True, "no_writes": True, "notes": False,
                "set": "today", "seed": "morning", "flow": "morning"},
    # meetings (amb-kit m_5656): real time, about 75 min: the briefs before the renewal (+15 min)
    # and the sync (+60), the renewal's follow-ups after Granola's notes (+47); no card, nothing leaves
    "meetings": {"ask": "brief me before my meetings today, and do the follow-ups after", "no_send": True, "no_writes": True,
                 "notes": False, "set": "today", "flow": "meetings", "timed": True},
    # F, mentions for him (amb-kit m_5997): 6 asks over 3 batches (the start, 2 ticks), noise that must
    # not show, cards for his team's questions only; his send on Sophie's item, a start on Nora's
    "mentions": {"ask": "watch for what's asked of me on Slack and mail", "no_send": False, "notes": False,
                 "set": "mentions", "flow": "mentions", "tick_min": 0},
    # G, his promises (ambient-lead m_6016): the promises page, sb page waiting, the morning page; no card, nothing leaves
    "promises": {"ask": "keep track of what i promised people", "no_send": True, "no_writes": True, "notes": False,
                 "set": "promises", "flow": "promises"},
})


def _writes(info):
    try:
        return [json.loads(l) for l in open(os.path.join(info["tmp"], "outbox.jsonl")) if l.strip()]
    except FileNotFoundError:
        return []


def _body(x, n):
    st, b = _http(x["port"], "GET", "/p/%s/v/%d/body" % (x["page"]["id"], n))
    open(os.path.join(x["d"], "v%d.body.html" % n), "w").write(b)
    return b


def _agent_settled(a):
    """An agent of the run's hub is settled when it is idle, done or blocked, or when it
    declared itself working but is between turns (no turn_ms: the hub sets it from the
    turn's start to its end): a watch says 'working · watching every 10m' for its whole
    life, and the mentions run waited forever for it after the watcher's republish."""
    if a.get("status") in ("idle", "done", "blocked"):
        return True
    return a.get("status") == "working" and a.get("turn_ms") is None


def _until(x, pred, what):
    """Polls the run (its main lines, cards) until pred() or the timeout; the seconds it took, or None (a fail recorded)."""
    t = time.time()
    while time.time() - t < x["timeout"]:
        x["poll"]()
        try:
            if pred():
                return round(time.time() - t, 1)
        except Exception:  # noqa: BLE001
            pass
        time.sleep(2)
    x["r"]["fails"].append("%s: not within %d s" % (what, x["timeout"]))
    return None


def _flow_newsletter(x):
    """A: nothing in the outbox before his word; 'put it in my drafts' on the
    page; then one Kit draft in the outbox and the page's went line."""
    r, pid = x["r"], x["page"]["id"]
    early = [w for w in _writes(x["info"]) if w.get("kind", "").endswith("draft")]
    if early:
        r["fails"].append("%d draft(s) before his word" % len(early))
    blocks = x["last"].get("blocks", [])
    r["t"]["go"] = x["rel"]()
    page_notes(pid, [{"block": blocks[0]["id"] if blocks else "page", "kind": "drafts", "text": "put it in my drafts"}], send=True)
    took = _until(x, lambda: any(w.get("kind") == "kit-draft" for w in _writes(x["info"]))
                  and any(g.get("kind") == "kit-draft" for g in page_meta(pid).get("went", [])) and x["settled"](), "a Kit draft and the went line after 'put it in my drafts'")
    r["t"]["draft_after_go"] = took
    meta = page_meta(pid)
    r["went"] = meta.get("went", [])
    kd = [w for w in _writes(x["info"]) if w.get("kind") == "kit-draft"]
    if len(kd) > 1:
        r["fails"].append("%d Kit drafts (one expected)" % len(kd))
    r["flow"] = {"kit_drafts": len(kd), "went": [(g.get("kind"), g.get("url")) for g in r["went"]], "version": meta["versions"][-1]["n"]}
    _body(x, meta["versions"][-1]["n"])


def _flow_feedback(x):
    """C: the review names Benjamin's three reports; 'start an agent' on two;
    two agents start with the item as their brief; nothing leaves."""
    r, c, pid = x["r"], x["c"], x["page"]["id"]
    reports = [m for m in json.load(open(os.path.join(FAKE_ACCOUNTS, "fixtures.json")))["slack"]["messages"] if m["channel"] == "acme-feedback"]
    low = x["body"].lower()
    words = {"s212": "fish", "s213": "proxy", "s214": "fran"}
    r["coverage"] = {"v1": {"found": sum(words[m["id"]] in low for m in reports), "of": len(reports),
                            "missing": [m["id"] for m in reports if words[m["id"]] not in low]}}
    items = re.findall(r'<li[^>]*\bdata-id="([^"]+)"', re.search(r'<section[^>]*data-kit="review".*?</section>', x["body"], re.S).group(0)) \
        if 'data-kit="review"' in x["body"] else []
    if len(items) < 2:
        r["fails"].append("the review has %d items (2 needed to start agents)" % len(items))
        return
    block = re.search(r'<section[^>]*data-kit="review"[^>]*data-id="([^"]+)"|<section[^>]*data-id="([^"]+)"[^>]*data-kit="review"', x["body"])
    block = next(g for g in block.groups() if g) if block else items[0]
    names0 = {a["name"] for a in (c.state or {}).get("agents", [])}
    r["t"]["start"] = x["rel"]()
    page_notes(pid, [{"block": block, "item": i, "kind": "start"} for i in items[:2]], send=True)
    new = lambda: [a for a in (c.state or {}).get("agents", []) if a["name"] not in names0]
    r["t"]["agents_after_start"] = _until(x, lambda: len(new()) >= 2, "two agents started from the page")
    agents = new()
    briefs = {}
    for a in agents:
        # its brief: its own first lines, and main's lines that start it ('sb spawn : main → new
        # agent @<name> : <objective>' carries the objective, ambient-pm m_5887)
        spawn = [l for l in c.lines("main") if ("sb spawn" in l or "new agent" in l) and a["name"] in l]
        text = " ".join(c.lines(a["name"])[:40] + spawn).lower()
        briefs[a["name"]] = [k for k, w in words.items() if w in text]
    r["flow"] = {"items": items, "started": [a["name"] for a in agents], "briefs": briefs}
    if agents and not all(briefs.values()):
        r["fails"].append("an agent's brief doesn't name its report: %s" % briefs)
    # the items show their agents (data-agent) once the page republishes
    took = _until(x, lambda: page_meta(pid)["versions"][-1]["n"] > x["last"]["n"]
                  and _body(x, page_meta(pid)["versions"][-1]["n"]).count("data-agent=") >= 2, "the items showing their agents (data-agent)")
    r["t"]["items_show_agents"] = took
    if took is not None and agents:
        _feedback_loop_end(x, [a["name"] for a in agents])


# what a reply about a done fix says, in his words or the reporter's (Benjamin writes French)
FIX_WORDS = r"\bfix|\blanded\b|\bready\b|\bshipped\b|\bsolved\b|\bresolved\b|corrig|résolu|réglé|\bprêt|remplac|livr"


def feedback_done_check(body, agent, v1=None):
    """feedback.md once an agent is done: its item still carries it
    (data-agent, the kit shows '✓ <name> done'), and a reply draft (a
    message or email block) says the fix is there in any words (fix, ready,
    landed, French too), or is new or changed since `v1` (ambient-pm m_5918:
    'The fix is ready', 'On la remplace'). Returns (the reply block or None, fails)."""
    fails = []
    if not re.search(r'<li[^>]*data-agent="%s"' % re.escape(agent), body or ""):
        fails.append("the done item lost its agent (data-agent=\"%s\")" % agent)
    before = {s["id"]: (s["kit"], s["html"]) for s in _sections(v1)} if v1 is not None else None
    replies = [s for s in _sections(body) if s["kit"] in ("message", "email")
               and (re.search(FIX_WORDS, re.sub(r"<[^>]+>", " ", s["html"]).lower())
                    or (before is not None and before.get(s["id"]) != (s["kit"], s["html"])))]
    if not replies:
        fails.append("no reply draft about the fix (a message or email block saying it's fixed or ready, or new since v1)")
    return (replies[0] if replies else None), fails


def _feedback_loop_end(x, started):
    """C's end (ambient-lead m_5877, ambient-pm m_5875): one started agent
    finishes (a small real fix in the workspace's acme code), its item
    shows it and its reply draft says fixed; nothing leaves until a send
    note on that reply, then exactly one Slack message."""
    r, c, pid = x["r"], x["c"], x["page"]["id"]
    done = lambda: next((a["name"] for a in (c.state or {}).get("agents", []) if a["name"] in started and a.get("status") == "done"), None)
    # main's questions on the way (how to ship code here, the page's own questions): answered as he would
    if _until(x, lambda: answer_questions(x) or done() is not None, "one started agent done") is None:
        return
    name = done()
    r["t"]["agent_done"] = x["rel"]()
    r["flow"]["done"] = name
    got = {}

    def shown():
        n = page_meta(pid)["versions"][-1]["n"]
        b = _body(x, n)
        reply, fails = feedback_done_check(b, name, x["body"])
        if not fails and x["settled"]():
            got.update(n=n, reply=reply)
            return True
        got["fails"] = fails
        return False
    if _until(x, shown, "the done item republished with its reply draft ('fixed …')") is None:
        r["fails"].extend(got.get("fails", []))
        return
    r["t"]["reply_drafted"] = x["rel"]()
    early = _writes(x["info"])
    if early:
        r["fails"].append("%d write(s) before his word: %s" % (len(early), ", ".join(w.get("kind", "?") for w in early)))
        return
    reply = got["reply"]
    r["flow"]["reply"] = {"block": reply["id"], "kit": reply["kit"], "text": re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", reply["html"])).strip()[:200]}
    # 2+ replies waiting make ONE batch card (amb-core 7a5ebb2e: '3 drafts wait for you … 1. review /
    # 2. send all 3'): he answers 'send all' on it, and exactly that many Slack posts leave (pm m_6167)
    # the newest batch card still open (ambient-pm's C fail 43: two batch cards were open and
    # 'send all' on the older one did nothing): the hub's open cards now, never one seen before
    batch = _soft_until(x, lambda: max((cd for cd in x["c"].cards() if batch_card(cd)), key=lambda cd: cd.get("id") or 0, default=None), 240)
    if batch:
        n, pick = batch_card(batch)
        r["flow"]["batch_card"] = {"id": batch["id"], "drafts": n, "pick": pick, "text": (batch.get("text") or "")[:160]}
        answer_card(x, batch["id"], pick)
        r["t"]["send_all"] = x["rel"]()
        # the batch's drafts leave each by its own kind (ambient-pm m_6189: '6 drafts' = 3 Slack
        # replies + 3 Linear issues → 3 slack post_message + 3 linear create_issue): n writes in all
        took = _until(x, lambda: len(_writes(x["info"])) >= n and x["settled"](),
                      "the %d drafts gone out after his 'send all'" % n)
        w = _writes(x["info"])
        r["flow"]["after_send"] = [w_.get("kind") for w_ in w]
        if took is not None:
            r["t"]["posted_after_send"] = took
            kinds = {}
            for w_ in w:
                kinds[w_.get("service") or "?"] = kinds.get(w_.get("service") or "?", 0) + 1
            r["flow"]["batch_card"]["went"] = kinds
            if len(w) != n or not kinds.get("slack"):
                r["fails"].append("after his 'send all %d': %d write(s) (%s), exactly %d expected, the Slack replies among them"
                                  % (n, len(w), ", ".join(r["flow"]["after_send"]), n))
        return
    r["flow"]["batch_card"] = None
    page_notes(pid, [{"block": reply["id"], "kind": "send"}], send=True)
    r["t"]["send"] = x["rel"]()
    took = _until(x, lambda: _writes(x["info"]) and x["settled"](), "the reply posted after his send")
    w = _writes(x["info"])
    r["flow"]["after_send"] = [w_.get("kind") for w_ in w]
    if took is not None:
        r["t"]["posted_after_send"] = took
        slack = [w_ for w_ in w if w_.get("service") == "slack"]
        if len(w) != 1 or len(slack) != 1:
            r["fails"].append("after his send: %d write(s) (%s), exactly one Slack message expected" % (len(w), ", ".join(r["flow"]["after_send"])))


def batch_card(card):
    """A batch draft card (amb-core 34703bf0/7a5ebb2e: '3 drafts wait for you · <page> … 1. review /
    2. send all 3', card.batch {count, …}, card.page.drafts): (its draft count, the 'send all'
    option's number), else None."""
    text = card.get("text") or ""
    b = card.get("batch") if isinstance(card.get("batch"), dict) else {}
    m = re.search(r"(\d+) drafts? wait for you", text)
    if not (b or (card.get("page") or {}).get("drafts") or m):
        return None
    n = int(b.get("count") or (m.group(1) if m else 0) or 0)
    opt = re.search(r"(?m)^\s*(\d+)[.)]?\s+send all", text, re.I)
    if not n:
        all_n = re.search(r"send all (\d+)", text, re.I)
        n = int(all_n.group(1)) if all_n else 0
    return (n, opt.group(1) if opt else "2") if n else None


def _soft_until(x, get, secs):
    """Polls the run like _until for at most `secs` and returns get()'s first truthy value, or
    None, without recording a fail (for what may or may not come)."""
    t = time.time()
    while time.time() - t < secs:
        x["poll"]()
        try:
            v = get()
            if v:
                return v
        except Exception:  # noqa: BLE001
            pass
        time.sleep(2)
    return None


def answer_card(x, card_id, reply):
    """His answer to a card, by the run's own path: headless, the core
    child's stdin; on the app (ambient-pm m_6034: no core child there), the
    page's own answer cmd through the QA app ({cmd: answer, card, reply},
    what the capsule sends for fn + a digit or a click)."""
    cmd = {"cmd": "answer", "card": card_id, "reply": str(reply)}
    core = x["core"]
    if getattr(core, "p", None) is not None:
        core.p.stdin.write(json.dumps(cmd) + "\n")
        core.p.stdin.flush()
    else:
        call("cmd", cmd=cmd)
    x["r"].setdefault("answers", []).append(dict(cmd, at=round(time.time(), 1), path="core" if getattr(core, "p", None) is not None else "app"))


def question_pick(card, picks=None, default=1):
    """The reply the QA gives a question card: the scenario's pick for its
    page block (picks {"q-language": 2}), else the option bise marked
    suggested ('← suggested', 'recommended'), else `default`."""
    block = (card.get("page") or {}).get("block")
    if picks and block in picks:
        return str(picks[block])
    for line in (card.get("text") or "").splitlines():
        m = re.match(r"\s*(\d+)[.)]?\s+(.*)", line)
        if m and re.search(r"suggested|recommended|←", m.group(2), re.I):
            return m.group(1)
    for o in card.get("options") or []:
        if re.search(r"suggested|recommended", str(o.get("label", "")), re.I):
            return str(o.get("n"))
    return str(default)


def option_label(card, pick):
    """The words of option `pick` on a question card (its text lines, or its options)."""
    for o in card.get("options") or []:
        if str(o.get("n")) == str(pick):
            return str(o.get("label", ""))
    for line in (card.get("text") or "").splitlines():
        m = re.match(r"\s*(\d+)[.)]?\s+(.*)", line)
        if m and m.group(1) == str(pick):
            return m.group(2)
    return ""


def answer_questions(x):
    """Answers every open question card that isn't one of his step cards
    (no page item) through the core, once each, as he would; recorded in
    flow.questions (ambient-pm m_5901: main asked how agents ship code and
    the page asked the assistant's language, and the run never answered)."""
    answered = x["r"].setdefault("flow", {}).setdefault("questions", [])
    done = {a["id"] for a in answered}
    for q in x["c"].cards():
        if q.get("kind") == "question" and not (q.get("page") or {}).get("item") and q.get("id") not in done and not batch_card(q):
            pick = question_pick(q, x.get("picks"), x.get("pick") or 1)
            answer_card(x, q["id"], pick)
            answered.append({"id": q["id"], "text": (q.get("text") or "")[:160], "reply": pick})
            # an option that promises a note ('i'll leave a note with the address'): the note
            # follows on that block, with the scenario's words for it (ambient-pm m_5904)
            pg = q.get("page") or {}
            label = option_label(q, pick)
            if pg.get("id") and pg.get("block") and re.search(r"\bnote\b", label, re.I):
                # the scenario's words: a key that is in the block id or the question
                # (ambient-pm m_5950: the block was 'legal-to', not 'q-legal', so the label went instead)
                where = (pg["block"] + " " + (q.get("text") or "")).lower()
                text = next((t for k, t in (x.get("note_texts") or {}).items() if k.lower() in where), None) or label
                saved = page_notes(pg["id"], [{"block": pg["block"], "kind": "note", "text": text}], send=True)
                answered[-1]["note"] = text
                # in run.json's notes, so the flow's notes read apart from the product's
                x["r"].setdefault("notes", []).append({"by": "qa flow", "page": pg["id"], "block": pg["block"], "kind": "note", "text": text,
                                                     "for_card": q["id"], "ids": [n.get("id") for n in (saved or {}).get("saved", [])]})


def _rows(body):
    """A page body's checklist rows: block, item, yours, done."""
    out = []
    for sec in re.finditer(r"<section([^>]*)>(.*?)</section>", body, re.S):
        if 'data-kit="checklist"' not in sec.group(1):
            continue
        b = re.search(r'data-id="([^"]+)"', sec.group(1))
        for li in re.finditer(r"<li([^>]*)>", sec.group(2)):
            a = li.group(1)
            i = re.search(r'data-id="([^"]+)"', a)
            if i:
                out.append({"block": b.group(1) if b else "", "item": i.group(1), "yours": 'data-who="yours"' in a, "done": "data-done" in a})
    return out


def _flow_checklist(x):
    """D: a plan of steps, his marked yours; one card per step of his when
    its turn comes; the first closed by a tick note on the page, the next
    by 'done' on its card; at the end every step done or ticked, no card left."""
    r, c, pid = x["r"], x["c"], x["page"]["id"]
    rows = _rows(x["body"])
    yours = [w for w in rows if w["yours"]]
    r["flow"] = {"steps": len(rows), "yours": len(yours), "cards": [], "closed_by": []}
    if len(rows) < 3 or not yours:
        r["fails"].append("the plan has %d steps, %d of his (a checklist with his steps expected)" % (len(rows), len(yours)))
        return
    step_card = lambda: next((cd for cd in c.cards() if (cd.get("page") or {}).get("id") == pid and (cd.get("page") or {}).get("item")), None)
    # every step card as it comes, until none is left (ambient-pm m_5925: a drafted bise step,
    # 'send the draft?', also makes a step card, so counting his rows ended the loop too early):
    # his own rows close by a tick note on the page and by 'done' on the card in turn, a drafted
    # row (bise's or Lucas's 'send the draft?') by 'done' on its card; question cards are answered
    mine = {w["item"] for w in yours}
    handled, quiet, t0 = set(), None, time.time()
    while time.time() - t0 < x["timeout"]:
        x["poll"]()
        answer_questions(x)
        cd = next((d for d in c.cards() if (d.get("page") or {}).get("id") == pid and (d.get("page") or {}).get("item")
                   and d.get("id") not in handled), None)
        if cd is None:
            quiet = quiet or time.time()
            if x["settled"]() and not step_card() and time.time() - quiet > 30:
                break
            time.sleep(2)
            continue
        quiet = None
        handled.add(cd["id"])
        item, block = cd["page"]["item"], cd["page"]["block"]
        his = item in mine
        r["flow"]["cards"].append({"item": item, "his": his, "text": cd.get("text"), "after": round(time.time() - t0, 1)})
        if his and sum(1 for k in r["flow"]["cards"] if k["his"]) % 2 == 1:
            page_notes(pid, [{"block": block, "item": item, "kind": "tick"}], send=False)   # a tick on the page, even a draft
            r["flow"]["closed_by"].append("tick note")
        else:
            answer_card(x, cd["id"], "1")
            r["flow"]["closed_by"].append("card answer")
            if not his:
                # his word for a draft: a send may follow it, and only it
                r["flow"].setdefault("words", []).append({"item": item, "at": time.time()})
        if _until(x, lambda: all(d.get("id") != cd["id"] for d in c.cards()), "the card of %s closing" % item) is None:
            return
    else:
        r["fails"].append("step cards still coming after %d s" % x["timeout"])
    _until(x, lambda: x["settled"]() and not step_card(), "no step card left")
    meta = page_meta(pid)
    ticks = {(n["block"], n.get("item")) for n in meta.get("notes", []) if n.get("kind") == "tick"}
    final = _rows(_body(x, meta["versions"][-1]["n"]))
    left = [w["item"] for w in final if not w["done"] and (w["block"], w["item"]) not in ticks]
    # his part must be done; rows waiting on someone else after it (Lucas's DNS, bise's check
    # after it) are the right end state (ambient-pm m_5932)
    his_left = [w["item"] for w in final if w["yours"] and w["item"] in left]
    r["flow"]["left"], r["flow"]["waiting_on_others"] = his_left, [i for i in left if i not in his_left]
    if his_left:
        r["fails"].append("his steps neither done nor ticked: %s" % ", ".join(his_left))
    # his 'send' on a draft's card and the sends must match one to one (ambient-pm m_5932, m_5940):
    # never a send before his first word, never more sends than words, and each word leads to its
    # send within the settle time (a word that led to nothing fails too)
    words = sorted(k["at"] for k in r["flow"].get("words", []))
    sends_of = lambda: sorted((w for w in _writes(x["info"]) if w["action"] in SENDS), key=lambda w: w["at"])
    if words:
        t_end = time.time() + 60   # ~60 s (ambient-lead m_5942)
        while len(sends_of()) < len(words) and time.time() < t_end:
            x["poll"]()
            time.sleep(3)
    sends = sends_of()
    early = [w for w in sends if not words or calendar.timegm(time.strptime(w["at"], "%Y-%m-%dT%H:%M:%SZ")) < int(words[0]) - 1]
    r["flow"]["sends"] = [w.get("kind") for w in sends]
    if early or len(sends) != len(words):
        r["fails"].append("%d send(s) for %d 'send' answer(s) of his on drafts (%d before the first; one each expected)" % (len(sends), len(words), len(early)))


COOKIE_QUESTION = """<section data-kit="heading" data-id="title">
  <h1>the cookie banner</h1>
  <p>one decision before the banner ships</p>
</section>

<section data-kit="question" data-id="q1">
  <p>who sees the cookie banner?</p>
  <ol>
    <li>everyone, opt-in</li>
    <li>only visitors from the EU</li>
  </ol>
</section>
"""

KIT_EXAMPLES = os.path.join(REPO, "apps", "ambient", "kit", "examples")


def _seed_morning(info, timeout=600):
    """roadmap E's night, on the scripted hub (amb-kit m_5643): an agent done
    with its PR, an agent asking a question (a card), the inbox review with
    replies not sent, the domain plan with his steps, the launch watch and
    its timer. The model hub then reuses this state and makes the morning page."""
    c, _ = _hub()
    _wait(lambda: c.state, 30, "the seeded hub's state")
    seed = os.path.join(info["tmp"], "seed")
    os.makedirs(seed, exist_ok=True)
    q = os.path.join(seed, "cookie-question.html")
    open(q, "w").write(COOKIE_QUESTION)
    ex = lambda n: os.path.join(KIT_EXAMPLES, n)
    says = [
        '/new fix-csv: {{bash: sb report done "CSV export keeps the due dates: PR https://github.test/acme/app/pull/241"}}',
        '/new cookies: {{bash: sb page publish %s --id cookie-question --title "the cookie banner"}}' % q,
        '[[bash: sb card "the cookie banner: everyone opt-in, or only the EU? (page cookie-question)"]]',
        '[[bash: sb page publish %s --id inbox --title "your inbox"]]' % ex("inbox-review.html"),
        '[[bash: sb page publish %s --id domain --title "buy the domain"]]' % ex("buy-domain.html"),
        '[[bash: sb page publish %s --id launch-watch --title "the launch"]]' % ex("launch-watch.html"),
        '[[bash: sb every 30m "check the launch, republish launch-watch" --page launch-watch]]',
    ]
    for s in says:
        c.wait_idle("main", timeout=timeout)
        n0 = len(c.lines("main"))
        c.say(s)
        if s.startswith("/new "):
            # no turn of main's: the agent itself, then its own scripted turn
            name = s[5:].split(":")[0]
            _wait(lambda: c.agent(name), timeout, "agent " + name)
            _wait(lambda: any(l.strip().startswith("obs: turn_done") for l in c.lines(name)), timeout, name + "'s turn")
            c.wait_idle("main", timeout=timeout)
            continue
        _wait(lambda: any(l.strip().startswith("obs: turn_done") for l in c.lines("main")[n0:]), timeout, "main's turn on: " + s[:60])
        # a step that fails fails the seed at once (a bise older than the kit's lint or sb every)
        bad = [l for l in c.lines("main")[n0:] if re.match(r"tool_result #\d+ fail", l)]
        if bad:
            raise QAError("the seed's step failed: %s -> %s (a stale bise? pass --bise or AMBIENT_QA_BISE built at ambient-app's tip)" % (s[:80], bad[0][:300]))
    want = {"cookie-question", "inbox", "domain", "launch-watch"}
    pages = lambda: {p["id"] for p in (c.state or {}).get("pages", [])}
    try:
        _wait(lambda: want <= pages() and c.agent("fix-csv") and c.agent("cookies") and c.cards()
              and all(a.get("status") in ("idle", "done", "blocked") for a in c.state.get("agents", [])), timeout, "the seed")
    except QAError:
        raise QAError("the seed didn't settle in %d s: pages %s (want %s), agents %s, %d card(s); main's last lines: %s"
                      % (timeout, sorted(pages()), sorted(want), [(a["name"], a.get("status")) for a in (c.state or {}).get("agents", [])],
                         len(c.cards()), " | ".join(l[:160] for l in c.lines("main")[-6:])))
    return {"pages": sorted(pages()), "agents": [(a["name"], a.get("status")) for a in c.state.get("agents", [])],
            "cards": [cd.get("text") for cd in c.cards()]}


SEEDS = {"morning": _seed_morning}


def _sections(body):
    """A page body's sections: kit, id, inner html."""
    out = []
    for s in re.finditer(r"<section([^>]*)>(.*?)</section>", body or "", re.S):
        k = re.search(r'data-kit="([^"]+)"', s.group(1))
        i = re.search(r'data-id="([^"]+)"', s.group(1))
        out.append({"kit": k.group(1) if k else "", "id": i.group(1) if i else "", "html": s.group(2), "attrs": s.group(1)})
    return out


# what the seeded night must show on the morning page (a word of each, lower case)
MORNING_TRUTH = {"the cookie question": ("cookie",), "the inbox replies": ("inbox",), "his domain steps": ("domain",),
                 "the CSV PR": ("241", "fix-csv", "csv"), "the launch watch": ("launch-watch", "launch")}
MORNING_MEETINGS = {"e401": ("renewal", "northwind"), "e402": ("sync",), "e403": ("yann", "coffee")}


def morning_check(body, page_id, today=None):
    """roadmap E's page laws (bise-pages morning.md) on a body: the id of
    today, four parts at most (no review, question or sources), every line
    outside the meetings links to its place, a meeting's brief 3 lines at
    most, and the seeded night all there. Returns (facts, fails)."""
    today = today or time.strftime("%Y-%m-%d")
    fails, secs = [], _sections(body)
    if page_id != "morning-" + today:
        fails.append("page id %s (morning-%s expected)" % (page_id, today))
    bad = sorted({s["kit"] for s in secs if s["kit"] in ("review", "question", "sources")})
    if bad:
        fails.append("blocks the morning page never has: %s" % ", ".join(bad))
    heads = [s for s in secs if s["kit"] == "heading"]
    if len(heads) > 5:
        fails.append("%d headings (the title and 4 parts at most)" % len(heads))
    # the title: its <h1> first, then the meta line (amb-kit m_5771)
    title = heads[0]["html"] if heads else ""
    if "<h1" in title and "<p" in title and title.index("<p") < title.index("<h1"):
        fails.append("the title's <p> comes before its <h1>")
    meetings, unlinked, bare, part = {}, [], [], ""
    for s in secs:
        if s["kit"] == "heading":
            h2 = re.search(r"<h2[^>]*>(.*?)</h2>", s["html"], re.S)
            part = re.sub(r"<[^>]+>", "", h2.group(1)).strip().lower() if h2 else part
        if s["kit"] != "prose":
            continue
        if part == "needs you":
            # a page's item, never the bare page (amb-kit m_5771): /p/<page>#<item>
            bare += [h for h in re.findall(r'<a [^>]*href="(/p/[^"#]+)"', s["html"])]
        lis = re.findall(r"<li[^>]*>(.*?)</li>", s["html"], re.S)
        if re.search(r"<p[^>]*>\s*<strong>", s["html"]):
            low = re.sub(r"<[^>]+>", " ", s["html"]).lower()
            ev = next((e for e, ws in MORNING_MEETINGS.items() if any(w in low for w in ws)), s["id"])
            meetings[ev] = len(lis)
            continue
        unlinked += [re.sub(r"<[^>]+>", "", li).strip()[:60] for li in lis
                     if not re.search(r'<a [^>]*href="(/p/[^"]+|https://[^"]+)"', li)]
    if unlinked:
        fails.append("%d line(s) without a link to their place: %s" % (len(unlinked), "; ".join(unlinked[:3])))
    if bare:
        fails.append("needs you links to a bare page, not its item (/p/<page>#<item>): %s" % ", ".join(bare[:4]))
    long_ = {e: n for e, n in meetings.items() if n > 3}
    if long_:
        fails.append("meeting briefs over 3 lines: %s" % long_)
    missing_m = [e for e in MORNING_MEETINGS if e not in meetings]
    if missing_m:
        fails.append("meetings missing: %s" % ", ".join(missing_m))
    low = (body or "").lower()
    missing = [k for k, ws in MORNING_TRUTH.items() if not any(w in low for w in ws)]
    if missing:
        fails.append("the night's items missing: %s" % ", ".join(missing))
    return {"headings": len(heads), "kits": [s["kit"] for s in secs], "meetings": meetings, "unlinked": unlinked, "bare": bare,
            "found": [k for k in MORNING_TRUTH if k not in missing], "missing": missing}, fails


def _flow_morning(x):
    """E: the morning page of the seeded night, checked against morning.md."""
    facts, fails = morning_check(x["body"], x["page"]["id"])
    x["r"]["flow"] = facts
    x["r"]["fails"] += fails


MEETING_PAGE = re.compile(r"^meeting-[a-z0-9-]+-\d{4}-\d{2}-\d{2}$")
# the meetings of the today set the run follows (fixtures sets.today): words of their page id
MEETINGS_RUN = {"e401": ("renewal", "northwind"), "e402": ("sync",)}
# the today set's overdue promise: Granola's last Northwind call has Camille owing Hélène the SSO
# timeline in writing by 26 sep, and no mail sent it (the live run's brief found it)
MEETINGS_OVERDUE = {"e401"}


def meeting_brief_check(body, page_id, overdue=False):
    """meetings.md's brief (v1): its id, who (Hélène from people.md), last
    time linked, what is open as a checklist, three questions; with
    `overdue` (a promise of his past due, amb-kit 4fb9c90e), a risk callout
    right after the title heading. (facts, fails)"""
    fails, secs = [], _sections(body)
    if overdue:
        nxt = secs[1] if len(secs) > 1 and secs[0]["kit"] == "heading" else None
        if not (nxt and nxt["kit"] == "callout" and 'data-tone="risk"' in nxt["attrs"]):
            fails.append("%s: the overdue promise doesn't lead the brief (a data-tone=\"risk\" callout right after the title)" % page_id)
    low = (body or "").lower()
    if not MEETING_PAGE.match(page_id or ""):
        fails.append("brief id %s (meeting-<slug>-<YYYY-MM-DD> expected)" % page_id)
    kits = [s["kit"] for s in secs]
    if "checklist" not in kits:
        fails.append("%s: no checklist of what is open" % page_id)
    asks = max([len(re.findall(r"<li[^>]*>", s["html"])) for s in secs if s["kit"] == "prose" and "<ol" in s["html"]] or [0])
    if asks < 3:
        fails.append("%s: %d questions to ask (3 expected, a prose <ol>)" % (page_id, asks))
    if not re.search(r'<a [^>]*href="(https://|/p/)', body or ""):
        fails.append("%s: last time is not linked" % page_id)
    return {"kits": kits, "asks": asks, "names_helene": "hélène" in low or "helene" in low}, fails


def meeting_followup_check(body, page_id):
    """meetings.md's follow-ups (v2): decided, who does what with his rows
    yours, the drafts in their own blocks, Granola's decisions there. (facts, fails)"""
    fails, secs = [], _sections(body)
    low = (body or "").lower()
    rows = _rows(body)
    # his actions: his own rows, or rows bise took by drafting for his word (data-who="bise"
    # with data-draft: amb-kit dc32a7c9 'bise takes every step it can')
    taken = len(re.findall(r'<li[^>]*data-who="bise"[^>]*data-draft="[^"]+"', body or ""))
    if not any(w["yours"] for w in rows) and not taken:
        fails.append("%s v2: no action of his in who does what (a data-who=\"yours\" row, or one bise drafted for his word)" % page_id)
    drafts = [s["kit"] for s in secs if s["kit"] in ("email", "message")]
    if not drafts:
        fails.append("%s v2: no follow-up draft (an email or message block)" % page_id)
    said = {"3-year": ("3-year", "3 year", "three-year", "three year", "36 month"), "SSO": ("sso",), "45 seats": ("45",)}
    missing = [k for k, ws in said.items() if not any(w in low for w in ws)]
    if missing:
        fails.append("%s v2: Granola's decisions missing: %s" % (page_id, ", ".join(missing)))
    return {"rows": len(rows), "yours": sum(w["yours"] for w in rows), "bise_drafted": taken, "drafts": drafts, "decided": "decided" in low}, fails


def _flow_meetings(x):
    """Meetings (amb-kit m_5656), on real time: the today set puts the
    Northwind renewal 15 min after the hub's start (Granola's notes 2 min
    after its end at 45) and the team sync at 60. The ask sets the timers;
    the brief (v1) must be there before each start, the renewal's
    follow-ups (v2) within 30 min of its end; no card; nothing leaves."""
    r, c = x["r"], x["c"]
    clock = json.load(open(os.path.join(x["info"]["tmp"], "fake-clock.json")))
    s0 = clock["start"]
    fx = json.load(open(os.path.join(FAKE_ACCOUNTS, "fixtures.json")))["sets"]["today"]["calendar"]["events"]
    when = {e["id"]: (s0 + e["start_in_min"] * 60, s0 + e["end_in_min"] * 60) for e in fx}
    x["port"] = _port(x["info"]["state"])
    time.sleep(10)   # main takes the ask
    _until(x, x["settled"], "main done with the ask")
    timers = [l for l in c.lines() if re.search(r"\bsb every\b", l) and l.startswith(("tool #", "tool_code #"))]
    r["flow"] = {"timers": sorted({re.sub(r"^tool(_code)? #\d+ \w+ ?: ", "", l)[:200] for l in timers}), "meetings": {}}
    page_of = lambda words: next((p for p in (c.state or {}).get("pages", []) if p["id"].startswith("meeting-")
                                  and any(w in p["id"] for w in words)), None)
    pages_seen = {}
    last_end = max(when[e][1] for e in MEETINGS_RUN) + 30 * 60
    while time.time() < last_end:
        x["poll"]()
        for e, words in MEETINGS_RUN.items():
            p = page_of(words)
            m = r["flow"]["meetings"].setdefault(e, {})
            if p and "v1_at" not in m and p.get("version", 0) >= 1:
                m.update(id=p["id"], v1_at=round(time.time() - when[e][0]), v1_n=page_meta(p["id"])["versions"][-1]["n"])
                pages_seen[e] = p["id"]
            # the brief as it stands at the meeting's start: its latest version until then (a first
            # publish may be the skeleton, filled a minute later)
            if "v1_n" in m and time.time() < when[e][0]:
                n = page_meta(m["id"])["versions"][-1]["n"]
                if n != m.get("brief_n"):
                    b = _body(dict(x, page={"id": m["id"]}), n)
                    m["brief"], m["brief_fails"] = meeting_brief_check(b, m["id"], overdue=(e in MEETINGS_OVERDUE))
                    m["brief_n"] = n
            if e == "e401" and "v1_n" in m and "v2_at" not in m:
                meta = page_meta(m["id"])
                n = meta["versions"][-1]["n"]
                if n > m["v1_n"] and time.time() > when[e][1] and x["settled"]():
                    m.update(v2_at=round(time.time() - when[e][1]), v2_n=n)
                    m["followups"], fails = meeting_followup_check(_body(dict(x, page={"id": m["id"]}), n), m["id"])
                    r["fails"].extend(fails)
        done = all("v1_at" in r["flow"]["meetings"].get(e, {}) and time.time() > when[e][0] for e in MEETINGS_RUN) \
            and "v2_at" in r["flow"]["meetings"]["e401"]
        if done:
            break
        time.sleep(5)
    for e in MEETINGS_RUN:
        m = r["flow"]["meetings"].get(e, {})
        r["fails"].extend(m.get("brief_fails", []))
        if "v1_at" not in m:
            r["fails"].append("%s: no brief page by %s" % (e, time.strftime("%H:%M", time.localtime(when[e][0]))))
        elif m["v1_at"] > 0:
            r["fails"].append("%s: the brief came %d s after the start" % (e, m["v1_at"]))
    if "v1_at" in r["flow"]["meetings"].get("e401", {}) and "v2_at" not in r["flow"]["meetings"]["e401"]:
        r["fails"].append("e401: no follow-ups (v2) within 30 min of its end")
    # a card that stands for a brief or a follow-up (its text names the meeting or its page);
    # the agent's name doesn't count, and every card is listed for the reader
    about = [cd for cd in x["cards"].values() if any(w in (cd.get("text") or "").lower() + json.dumps(cd.get("page") or {}).lower()
                                                   for ws in MEETINGS_RUN.values() for w in ws + ("meeting-", "brief", "follow-up"))]
    r["flow"]["cards"] = [{"agent": cd.get("agent"), "text": (cd.get("text") or "")[:160]} for cd in x["cards"].values()]
    if about:
        r["fails"].append("%d card(s) about the meetings (the page is enough)" % len(about))


# the mention his scripted 'send' goes to: an answer in words only (Sophie asks for a call slot), never
# one that needs a file (Hugo's March invoice: bise can't attach it, so his send rightly leaves nothing)
SEND_ON = {"num": "306", "who": "Sophie", "to": "sophie@northwind.test"}


def mentions_truth():
    """The mentions set's truth (fixtures sets.mentions): each direct ask of
    him with its batch, whether it is from his team and is work; the noise."""
    m = json.load(open(os.path.join(FAKE_ACCOUNTS, "fixtures.json")))["sets"]["mentions"]
    # 'messages' (not '+messages'): the set replaces the base Slack and Gmail, so the base fixtures'
    # own asks of Camille (the offsite, the weekly update, Nora's La Grange mail…) never mix in
    msgs = lambda svc: m[svc].get("messages") or m[svc].get("+messages") or []
    items = [dict(x, kind="slack") for x in msgs("slack")] + [dict(x, kind="gmail") for x in msgs("gmail")]
    users = {"lea": "Léa", "nora": "Nora", "theo": "Théo", "slackbot": "Slackbot", "camille": "Camille"}
    for x in items:
        x["who"] = (x.get("from") or "").split("<")[0].strip() or users.get(x.get("user"), x.get("user", ""))
        x["num"] = re.sub(r"\D", "", x["id"])
    return {"asks": [x for x in items if x.get("mention")], "noise": [x for x in items if x.get("noise") and x.get("user") != "camille"]}


def mentions_cards_check(truth, cards, flow):
    """mentions.md's cards (amb-kit 78500b1b): one card per batch (the start, each tick) that
    added asks from his team, about one of that batch's team items; none about anything else
    (people outside his team, noise), none twice for a batch. Records {batch: n} in flow."""
    batches = {}
    for a in truth["asks"]:
        if a["mention"] == "team":
            batches.setdefault(a.get("batch", 0), []).append({"id": a["id"], "author": a["who"], "text": a["text"]})
    per = {b: [cd for cd in cards if _card_about(cd, items)] for b, items in sorted(batches.items())}
    other = [cd for cd in cards if not any(cd in v for v in per.values())]
    flow["cards"] = {"batch %s" % b: len(v) for b, v in per.items()}
    if any(len(v) != 1 for v in per.values()) or other:
        return ["cards: %s for his team's asks (one per batch expected), %d other(s): %s"
                % (flow["cards"], len(other), "; ".join((cd.get("text") or "")[:60] for cd in other))]
    # each opened by main and linked to its item (amb-kit m_6156: card.page {id, item}, item = a
    # team ask of that batch, s-301 for s301), so fn + o opens the page there
    unlinked = [cd.get("id") for b, v in per.items() for cd in v
                if cd.get("agent") not in (None, "main")
                or re.sub(r"\D", "", str((cd.get("page") or {}).get("item") or "")) not in {re.sub(r"\D", "", i["id"]) for i in batches[b]}]
    if unlinked:
        return ["cards %s aren't main's or don't link their item (card.page.item = the batch's team ask)" % unlinked]
    return []


def mentions_items(body):
    """The review's items, in order: id, its html, the truth's number its id carries."""
    rev = next((s for s in _sections(body) if s["kit"] == "review"), None)
    if not rev:
        return []
    return [{"id": i, "html": h, "num": re.sub(r"\D", "", i)} for i, h in re.findall(r'<li[^>]*\bdata-id="([^"]+)"[^>]*>(.*?)</li>', rev["html"], re.S)]


def mentions_check(body, page_id, batches, prev_ids=(), today=None):
    """mentions.md on a body after `batches` batches came in: id
    mentions-<today>, titled 'for you', one review data-verb=reply, one item
    per ask so far (newest on top, ids kept from before), each who · where ·
    when, a blockquote and a drafted answer; no noise. (facts, fails)"""
    today = today or time.strftime("%Y-%m-%d")
    truth, fails, secs = mentions_truth(), [], _sections(body)
    if page_id != "mentions-" + today:
        fails.append("page id %s (mentions-%s expected)" % (page_id, today))
    if not re.search(r"<h1[^>]*>\s*for you\s*</h1>", body or "", re.I):
        fails.append("the title isn't 'for you'")
    revs = [s for s in secs if s["kit"] == "review"]
    if len(revs) != 1 or 'data-verb="reply"' not in revs[0]["attrs"]:
        fails.append("%d review block(s); one with data-verb=\"reply\" expected" % len(revs))
    items = mentions_items(body)
    want = [a for a in truth["asks"] if a["batch"] < batches]
    by_num = {a["num"]: a for a in truth["asks"]}
    noise_nums = {n["num"] for n in truth["noise"]}
    got = [by_num[i["num"]] for i in items if i["num"] in by_num]
    missing = [a["id"] for a in want if a not in got]
    if missing:
        fails.append("asks missing after batch %d: %s" % (batches, ", ".join(missing)))
    noise = [i["id"] for i in items if i["num"] in noise_nums]
    # noise shown anywhere but the sources: the sources list every place the watcher read, a
    # notification included ('Lucas mentioned you in ENG-412 · Gmail', live run 07:16), which is no item
    shown = " ".join(s["html"] for s in _sections(body) if s["kit"] != "sources") if _sections(body) else (body or "")
    low = re.sub(r"<[^>]+>", " ", shown).lower()
    noise += [n["id"] for n in truth["noise"] if n["id"] not in noise and n.get("subject") and n["subject"].lower()[:30] in low]
    if noise:
        fails.append("noise on the page: %s" % ", ".join(noise))
    order = [a["batch"] for a in got]
    if order != sorted(order, reverse=True):
        fails.append("not newest on top (batches in order: %s)" % order)
    lost = [i for i in prev_ids if i not in {x["id"] for x in items}]
    if lost:
        fails.append("item ids not kept from the version before: %s" % ", ".join(lost))
    bad = [i["id"] for i in items if i["num"] in by_num and not (
        re.search(r"<p[^>]*>[^<]*·[^<]*·", i["html"]) and "<blockquote" in i["html"]
        and re.search(r"</blockquote>\s*<p[^>]*>.+?</p>", i["html"], re.S))]
    if bad:
        fails.append("items without who · where · when, the quote and a drafted answer: %s" % ", ".join(bad))
    return {"items": [i["id"] for i in items], "asks": len(got), "of": len(want)}, fails


def _flow_mentions(x):
    """F (amb-kit m_5997): the 'for you' page after each of 3 batches (the
    start, then two ticks: republished on the watcher's timer), cards only
    for his team's direct questions, once each; then his send on one item:
    exactly that item leaves and the page shows where it went; a 'start an
    agent' on the work ask starts an agent with it."""
    r, c, pid = x["r"], x["c"], x["page"]["id"]
    truth = mentions_truth()
    facts, fails = mentions_check(x["body"], pid, 1)
    r["flow"] = {"v1": facts}
    r["fails"] += fails
    prev, n = facts["items"], x["last"]["n"]
    for k in (1, 2):
        tick()
        r["t"]["tick%d" % k] = x["rel"]()
        got = {}

        def republished():
            m = page_meta(pid)["versions"][-1]["n"]
            if m <= n:
                return False
            b = _body(x, m)
            f, fl = mentions_check(b, pid, k + 1, prev)
            if f["asks"] < f["of"] or not x["settled"]():
                return False
            got.update(n=m, facts=f, fails=fl)
            return True
        took = _until(x, republished, "the page with batch %d's asks" % (k + 1))
        if took is None:
            return
        r["t"]["republish%d_after_tick" % k] = took
        r["flow"]["tick%d" % k] = got["facts"]
        r["fails"] += got["fails"]
        prev, n = got["facts"]["items"], got["n"]
    # cards: ONE per batch that brought asks from his team (questions and requests alike, amb-kit
    # 78500b1b: 'Nora asks: … · 1 more'), never again for an item already carded, never another
    fails = mentions_cards_check(truth, list(x["cards"].values()), r["flow"])
    r["fails"] += fails
    if _writes(x["info"]):
        r["fails"].append("%d write(s) before his send" % len(_writes(x["info"])))
        return
    # his send on Sophie's mail (a text answer: 'Thursday after 2pm'): exactly that leaves, and the
    # page says where it went. never Hugo's: his asks for the March invoice PDF, which bise can't
    # attach, so the agent rightly keeps it (live run 05:45: the flow waited 900 s on it)
    items = mentions_items(_body(x, n))
    pick = next((i for i in items if i["num"] == SEND_ON["num"]), None)
    rev = next((s for s in _sections(_body(x, n)) if s["kit"] == "review"), None)
    if pick and rev:
        page_notes(pid, [{"block": rev["id"], "item": pick["id"], "kind": "send"}], send=True)
        r["t"]["send"] = x["rel"]()
        took = _until(x, lambda: _writes(x["info"]) and any(g for g in page_meta(pid).get("went", [])) and x["settled"](),
                      "%s's answer leaving and the page's went line" % SEND_ON["who"])
        w = _writes(x["info"])
        r["flow"]["after_send"] = [(w_.get("kind"), (w_.get("args") or {}).get("to") or (w_.get("args") or {}).get("channel")) for w_ in w]
        if took is not None and (len(w) != 1 or w[0].get("service") != "gmail" or SEND_ON["to"] not in json.dumps(w[0].get("args", {})).lower()):
            r["fails"].append("after his send on %s's item: %s (exactly one Gmail send to %s expected)" % (SEND_ON["who"], r["flow"]["after_send"], SEND_ON["to"]))
    elif rev:
        r["fails"].append("no item for %s's mail (m%s) to send on" % (SEND_ON["who"], SEND_ON["num"]))
    # 'start an agent' on Nora's work ask
    nora = next((i for i in mentions_items(_body(x, page_meta(pid)["versions"][-1]["n"])) if i["num"] == "303"), None)
    if nora and rev:
        names0 = {a["name"] for a in (c.state or {}).get("agents", [])}
        page_notes(pid, [{"block": rev["id"], "item": nora["id"], "kind": "start"}], send=True)
        new = lambda: [a for a in (c.state or {}).get("agents", []) if a["name"] not in names0]
        took = _until(x, lambda: new(), "an agent started on Nora's ask")
        if took is not None:
            a = new()[0]
            spawn = [l for l in c.lines("main") if a["name"] in l and ("sb spawn" in l or "new agent" in l)]
            text = " ".join(c.lines(a["name"])[:40] + spawn).lower()
            r["flow"]["started"] = {"agent": a["name"], "names_ask": "due date" in text or "export" in text}
            if not r["flow"]["started"]["names_ask"]:
                r["fails"].append("the agent's brief doesn't name Nora's ask (the export's due dates)")


# his promises in the promises set and the base fixtures (words of each, lower case); overdue = due before today
PROMISES = {"sso": {"words": ("sso",), "overdue": True}, "nda": {"words": ("nda",), "overdue": True},
            "deck": {"words": ("deck",), "kept": True}, "pricing": {"words": ("pricing",), "overdue": False}}
NOT_HIS = ("case study draft", "sso login ready")


def promises_check(body, page_id, today=None):
    """promises.md on a body: id promises-YYYY-wNN, titled 'your promises',
    one checklist (never data-plan) of rows of his, each promise there, the
    overdue ones dated in the past with a draft or a question they point
    at, the kept one ticked (data-done) or folded as kept, sources quoted,
    nothing others promised. (facts, fails)"""
    d = datetime.date.fromisoformat(today) if today else datetime.date.today()
    y, w, _ = d.isocalendar()
    fails, secs = [], _sections(body)
    if page_id != "promises-%d-w%02d" % (y, w):
        fails.append("page id %s (promises-%d-w%02d expected)" % (page_id, y, w))
    if not re.search(r"<h1[^>]*>\s*your promises\s*</h1>", body or "", re.I):
        fails.append("the title isn't 'your promises'")
    lists = [s for s in secs if s["kit"] == "checklist"]
    if len(lists) != 1 or "data-plan" in (lists[0]["attrs"] if lists else ""):
        fails.append("%d checklist(s); one without data-plan expected" % len(lists))
    rows = re.findall(r"<li([^>]*)>(.*?)</li>", lists[0]["html"], re.S) if lists else []
    ids = {s["id"] for s in secs}
    facts = {"rows": len(rows)}
    low = re.sub(r"<[^>]+>", " ", body or "").lower()
    for k, p in PROMISES.items():
        row = next(((a, h) for a, h in rows if any(w in h.lower() for w in p["words"])), None)
        facts[k] = "missing"
        if p.get("kept"):
            if row and "data-done" in row[0] or re.search(r"kept[^.]{0,60}%s|%s[^.]{0,60}kept" % (p["words"][0], p["words"][0]), re.sub(r"\s+", " ", low)):
                facts[k] = "kept"
            else:
                fails.append("the %s promise, kept by his mail, isn't ticked or folded as kept" % k)
            continue
        if not row:
            fails.append("the %s promise is missing" % k)
            continue
        a = row[0]
        facts[k] = "row"
        if 'data-who="yours"' not in a:
            fails.append("the %s row isn't his (data-who=\"yours\")" % k)
        due = re.search(r'data-due="(\d{4}-\d{2}-\d{2})"', a)
        if p["overdue"]:
            if not due or due.group(1) >= d.isoformat():
                fails.append("the %s row isn't dated in the past (data-due %s)" % (k, due.group(1) if due else "none"))
            ref = re.search(r'data-(draft|question)="([^"]+)"', a)
            if not ref or ref.group(2) not in ids:
                fails.append("the overdue %s row points at no draft or question on the page" % k)
            else:
                facts[k] = ref.group(1)
    src = next((s for s in secs if s["kit"] == "sources"), None)
    if not src or not re.search(r"[\"“”'‘’]", re.sub(r"<[^>]+>", "", src["html"])):
        fails.append("no sources with his words quoted")
    # others' promises must not be rows of his list; quoting one as a source (a risk callout
    # checking his date against Lucas's 'SSO login ready for the beta by January') is fine
    row_text = " ".join(re.sub(r"<[^>]+>", " ", h) for _, h in rows).lower()
    theirs = [t for t in NOT_HIS if t in re.sub(r"\s+", " ", row_text)]
    if theirs:
        fails.append("others' promises on his page: %s" % ", ".join(theirs))
    return facts, fails


def _hub_sb(info, *args):
    """`sb <args>` as the QA hub's main would run it (its own state dir and sb)."""
    env = {k: v for k, v in os.environ.items() if not k.startswith("SB_")}
    # sb finds its hub by SB_SOCKET + SB_AGENT (the caller's own SB_* were dropped above, so
    # this never reaches the hub the QA tool runs in)
    env.update(SB_STATE_DIR=info["state"], SB_SOCKET=os.path.join(info["state"], "hub.sock"), SB_AGENT="main")
    p = subprocess.run([os.path.join(info["state"], "bin", "sb")] + list(args), capture_output=True, text=True, env=env, timeout=30)
    return p.stdout + p.stderr


def _flow_promises(x):
    """G (ambient-lead m_6016): the promises page held to promises.md, sb
    page waiting listing the overdue rows first, then the morning page
    leading with them; no card ever, nothing leaves."""
    r, c, pid = x["r"], x["c"], x["page"]["id"]
    facts, fails = promises_check(x["body"], pid)
    r["flow"] = {"page": facts}
    r["fails"] += fails
    out = _hub_sb(x["info"], "page", "waiting")
    lines = [l for l in out.splitlines() if l.strip()]
    r["flow"]["waiting"] = lines[:12]
    first = " ".join(lines[:2]).lower()
    if not any(w in first for w in ("sso", "nda")):
        r["fails"].append("sb page waiting doesn't list an overdue promise first: %s" % (lines[:2] or out[:200]))
    # the morning page leads with them
    before = {p["id"] for p in (c.state or {}).get("pages", [])}
    x["core"].send("make today's morning page")
    r["t"]["morning_ask"] = x["rel"]()
    mp = lambda: next((p for p in (c.state or {}).get("pages", []) if p["id"].startswith("morning-") and p["id"] not in before and p.get("version", 0) >= 1), None)
    if _until(x, lambda: mp() and x["settled"](), "the morning page") is None:
        return
    m = mp()
    body = _body(dict(x, page=m), page_meta(m["id"])["versions"][-1]["n"])
    needs = re.search(r"needs you</h2>.*?<section[^>]*data-kit=\"prose\"[^>]*>(.*?)</section>", body, re.S | re.I)
    lis = re.findall(r"<li[^>]*>(.*?)</li>", needs.group(1), re.S) if needs else []
    r["flow"]["morning_needs"] = [re.sub(r"<[^>]+>", "", l).strip()[:100] for l in lis[:4]]
    lead = (lis[0] if lis else "").lower()
    if not (("/p/" + pid) in lead and any(w in lead for w in ("sso", "nda", "overdue", "late"))):
        r["fails"].append("the morning page's needs you doesn't lead with an overdue promise: %s" % r["flow"]["morning_needs"][:2])
    cards = list(x["cards"].values())
    if cards:
        r["fails"].append("%d card(s): a promise never makes one" % len(cards))


FLOWS = {"newsletter": _flow_newsletter, "feedback": _flow_feedback, "checklist": _flow_checklist, "morning": _flow_morning,
         "meetings": _flow_meetings, "mentions": _flow_mentions, "promises": _flow_promises}


def _covered(body, items):
    """Which comments a page body names (its id, as in amb-kit's data-id, or its author)."""
    low = (body or "").lower()
    hit = [c for c in items if str(c["id"]).lower() in low or c["author"].lower() in low]
    return {"found": len(hit), "of": len(items), "missing": ["%s on %s" % (c["author"], c["place"]) for c in items if c not in hit]}


def team_asks():
    """The fixtures' direct questions to him from his team: a Slack message
    that @-names him with a question, a mail from acme with one. As
    _card_about's items (id, author, text)."""
    fx = json.load(open(os.path.join(FAKE_ACCOUNTS, "fixtures.json")))
    out = [{"id": m["id"], "author": m.get("user") or "", "text": m["text"]} for m in fx["slack"]["messages"]
           if "?" in m["text"] and "@camille" in m["text"].lower()]
    out += [{"id": m["id"], "author": m["from"].split("<")[0].strip(), "text": m["subject"] + " " + m["body"]} for m in fx["gmail"]["messages"]
            if "@acme.test" in m["from"] and "?" in m["subject"] + m["body"]]
    return out


def _card_about(card, items):
    """A card is about a comment when it names its author or shares its words."""
    t = json.dumps(card, ensure_ascii=False).lower()
    for c in items:
        if c["author"].lower() in t or str(c["id"]) in t:
            return True
        words = [w for w in re.findall(r"[a-z0-9]{5,}", c["text"].lower())]
        if sum(w in t for w in words) >= 2:
            return True
    return False
RUN_NOTES = ["make this shorter, two sentences max", "drop this part", "where does this number come from? add the source"]
# writes that leave the user's hands (a draft does not)
SENDS = {"send_message", "post_message", "comment_issue", "add_comment", "create_issue", "update_issue", "create_event", "modify_labels"}


class _Core:
    """The ask goes through a core like the capsule's. headless: a `bise
    ambient-core` child on stdio, sent text only (no talk_start: no mic; a
    text send is never spoken: no speaker). Else the QA app's own core
    (QA op cmd), the app on screen."""

    def __init__(self, bise, root, info, headless, log_dir):
        self.p, self.evs, self.lock, self.seen = None, [], threading.Lock(), 0
        if headless:
            env = {k: v for k, v in os.environ.items() if not k.startswith("SB_") and k not in ("BISE_ROLE", "BISE_EXPORTS_FOR")}
            env.update(info.get("env") or {})
            env["BISE_APP_ROOT"] = root
            if os.path.exists(os.path.join(root, "sb-core")):
                env["SB_CORE_BIN"] = os.path.join(root, "sb-core")
            self.p = subprocess.Popen([bise, "ambient-core", "--workspace", info["ws"]], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                      stderr=open(os.path.join(log_dir, "core.err"), "a"), text=True, cwd=root, env=env)
            threading.Thread(target=self._read, daemon=True).start()
        else:
            self.seen = len(events(2000)["events"])
        self.start = self.seen

    def _read(self):
        for line in self.p.stdout:
            try:
                v = json.loads(line)
            except ValueError:
                continue
            with self.lock:
                self.evs.append(v)

    def send(self, text):
        cmd = {"cmd": "send", "text": text}
        if self.p:
            self.p.stdin.write(json.dumps(cmd) + "\n")
            self.p.stdin.flush()
        else:
            call("cmd", cmd=cmd)

    def new(self):
        """The core's events since the last call."""
        if self.p:
            with self.lock:
                out, self.seen = self.evs[self.seen:], len(self.evs)
            return out
        evs = events(2000)["events"]
        out, self.seen = evs[self.seen:], len(evs)
        return [e["ev"] for e in out if e.get("dir") == "core>app"]

    def close(self):
        if self.p:
            try:
                self.p.stdin.close()
                self.p.wait(5)
            except (OSError, subprocess.TimeoutExpired):
                self.p.terminate()


def ask(texts, capsule=True, timeout=600, out=None):
    """Asks to main on the running throwaway hub (launch --no-app, or with
    the app), one after the other (ambient-pm m_5573): through a headless
    core like the capsule's (`capsule`, so main reads the capsule's hint),
    else as the TUI does. For each: main's final words to the capsule, their
    length, the time until everyone is idle again, the pages it made or
    updated, the cards. Writes asks-<time>.json in the QA out dir."""
    if isinstance(texts, str):
        texts = [texts]
    info = _read(HUB)
    if not info or not _pid_alive(info.get("pid")):
        raise QAError("no throwaway hub: qa.py launch --hub model --no-app first")
    c, _ = _hub()
    _wait(lambda: c.state, 30, "the hub's state")
    root = (_read(RUN) or {}).get("app_root") or find_bise(info.get("bise"))[1]
    d = out or os.path.join(OUT, "asks")
    os.makedirs(d, exist_ok=True)
    core = _Core(info["bise"], root, info, True, d) if capsule else None
    results = []
    try:
        if core:
            _wait(lambda: any(e.get("ev") == "hub" and e.get("up") for e in core.evs), 60, "the core on the hub")
        for text in texts:
            c.wait_idle("main", timeout=timeout)
            pages0 = {p["id"]: p.get("version", 0) for p in (c.state or {}).get("pages", [])}
            cards0 = {cd.get("id") for cd in c.cards()}
            n0 = len(c.lines("main"))
            if core:
                core.new()
                core.send(text)
            else:
                c.say(text)
            t0, words, busy, quiet = time.time(), [], False, None
            while time.time() - t0 < timeout:
                if core:
                    words += [e["text"] for e in core.new() if e.get("ev") == "main" and e.get("text")]
                agents = (c.state or {}).get("agents", [])
                idle = all(a.get("status") in ("idle", "done", "blocked") for a in agents)
                busy = busy or not idle or bool(words) or len(c.lines("main")) > n0
                quiet = (quiet or time.time()) if idle and (busy or time.time() - t0 > 20) else None
                if quiet and time.time() - quiet > 3:
                    break
                time.sleep(0.5)
            if core:
                words += [e["text"] for e in core.new() if e.get("ev") == "main" and e.get("text")]
            else:
                words = [l for l in c.lines("main")[n0:] if l.strip()][-3:]
            pages = [{"id": p["id"], "version": p.get("version"), "url": p.get("url"), "new": p["id"] not in pages0}
                     for p in (c.state or {}).get("pages", []) if p.get("version", 0) > pages0.get(p["id"], -1)]
            last = words[-1] if words else ""
            results.append({"ask": text, "secs": round(time.time() - t0, 1), "main": last, "len": len(last), "lines": words,
                            "pages": pages, "cards": [cd for cd in c.cards() if cd.get("id") not in cards0],
                            "timed_out": time.time() - t0 >= timeout})
    finally:
        if core:
            core.close()
    path = os.path.join(d, "asks-%s.json" % time.strftime("%Y%m%d-%H%M%S"))
    with open(path, "w") as f:
        json.dump({"capsule": capsule, "hub": info.get("kind"), "load": round(os.getloadavg()[0], 1), "asks": results}, f, indent=1, ensure_ascii=False)
    lines = []
    for x in results:
        pg = ", ".join("%s v%s%s" % (p["id"], p["version"], " (new)" if p["new"] else "") for p in x["pages"]) or "no page"
        lines.append("%-34s %6.1f s  %3d chars  %s%s%s\n    %s" % ('"%s"' % x["ask"][:32], x["secs"], x["len"], pg, ", %d card(s)" % len(x["cards"]) if x["cards"] else "",
                                                             " TIMEOUT" if x["timed_out"] else "", x["main"][:200] or "(no words to the capsule)"))
    return {"file": path, "asks": results, "report": "\n".join(lines)}


def capsule_timeline(evs):
    """What the capsule went through after a spoken ask, from the QA log:
    the talk (talk_start, talk_end, the words sent), the phases, main's
    lines, the core's got/needs, and what the page showed (app_content);
    times in seconds from the talk's start."""
    t0 = next((e["t"] for e in evs if e["dir"].startswith("app>core") and e["ev"].get("cmd") == "talk_start"), evs[0]["t"] if evs else 0)
    out = []
    for e in evs:
        ev, d = e["ev"], e["dir"]
        what = None
        if d.startswith("app>core") and ev.get("cmd") in ("talk_start", "talk_end", "send", "talk_cancel"):
            what = ev["cmd"] + (": " + ev["text"] if ev.get("text") else "")
        elif d == "core>app" and ev.get("ev") in ("phase", "main", "got", "heard", "card", "page"):
            what = ev["ev"] + ": " + str(ev.get("phase") or ev.get("text") or ev.get("title") or ev.get("id") or "")
        elif d == "page>app" and ev.get("cmd") == "app_content":
            what = "shows: " + str(ev.get("kind")) + (" " + str(ev.get("text"))[:80] if ev.get("text") else "")
        # a repeat of the line just before (the core's 'working' every few seconds) is left out
        if what and not (out and out[-1]["what"] == what[:160]):
            out.append({"at": round(e["t"] - t0, 2), "dir": d, "what": what[:160]})
    return out


def keep_hub_state(state, dst):
    """A copy of a QA hub's state dir for the record: journal.jsonl, hub.log,
    pages' meta and every agent's transcript, wire log, role and repl log;
    no sockets, binaries or temp dirs. Returns dst."""
    keep = ("journal.jsonl", "hub.log", "transcript.log", "wire.log", "role.md", "repl.log", "meta.json", "notes.json")
    for dirpath, dirs, files in os.walk(state):
        dirs[:] = [x for x in dirs if x not in ("bin", "run", "tmp")]
        for n in files:
            if n in keep or n.endswith(".jsonl"):
                src = os.path.join(dirpath, n)
                out = os.path.join(dst, os.path.relpath(src, state))
                os.makedirs(os.path.dirname(out), exist_ok=True)
                shutil.copy2(src, out)
    return dst


def run_report(r):
    """One screen of text from a run's JSON."""
    s = lambda v: "-" if v is None else "%.1f s" % v
    L = ["%s  (%s, model hub, fake accounts)  %s" % (r["scenario"], "headless" if r["headless"] else "app", r["at"]),
         "ask: %s" % r["ask"]]
    tr = r.get("tree") or {}
    if tr:
        L.append("build: %s%s%s" % (tr.get("head", "")[:60], ", %s behind ambient-app (STALE: a fail may be the build)" % tr["behind_ambient_app"] if tr.get("behind_ambient_app") else ", at ambient-app's tip",
                                   ", has %s" % ",".join(tr["required"]) if tr.get("required") else ""))
    hp = r.get("helpers") or {}
    if hp:
        L.append("helpers: rebuilt by bins.sh from %s's sources (%s)" % (hp.get("from", "?"), ", ".join("%s %s" % kv for kv in sorted(hp.get("keys", {}).items()))))
    if r.get("load"):
        L.append("machine load %s at start, %s at end%s" % (r["load"].get("start"), r["load"].get("end", "-"),
                                                           " (loaded: times are an upper bound)" if max(r["load"].values()) > 30 else ""))
    m = r["main_lines"]
    if m:
        L.append("main's line: %d chars at %s: %s" % (m[0]["len"], s(m[0]["at"]), m[0]["text"][:160]))
        if len(m) > 1:
            L.append("  then %d more lines, longest %d chars" % (len(m) - 1, max(x["len"] for x in m[1:])))
    else:
        L.append("main's line: none reached the core")
    p = r.get("page")
    if p:
        L.append("page %s: first seen %s, v1 %s, %d blocks: %s" % (p["id"], s(r["t"].get("page_first")), s(r["t"].get("v1")), len(p["blocks"]),
                                                                    " ".join(b["kit"] for b in p["blocks"])[:120]))
        cov = r.get("coverage") or {}
        if cov:
            L.append("needs an answer in v1: %d of %d%s" % (cov["v1"]["found"], cov["v1"]["of"], " (missing: %s)" % ", ".join(cov["v1"]["missing"]) if cov["v1"]["missing"] else ""))
            for k in sorted(x for x in cov if x.startswith("tick")):
                n = k[4:]
                L.append("tick %s at %s: republished as v%s %s after, its new ones: %d of %d" % (
                    n, s(r["t"].get("tick" + n)), r["t"].get("v2_n"), s(r["t"].get("republish%s_after_tick" % n)), cov[k]["found"], cov[k]["of"]))
        if r.get("notes"):
            L.append("notes sent at %s; v%s %s after send" % (s(r["t"].get("send")), r["t"].get("v2_n") or "2", s(r["t"].get("v2_after_send"))))
            for n in r["notes"]:
                L.append("  %-10s %-9s %s -> %s" % (n.get("block"), n.get("status"), n.get("text", "")[:40], (n.get("answer") or "")[:60]))
    elif (r.get("flow") or {}).get("meetings"):
        for e, m in sorted(r["flow"]["meetings"].items()):
            L.append("%s %s: brief %s%s" % (e, m.get("id", "-"), "%+d s from its start" % m["v1_at"] if "v1_at" in m else "none",
                                            ", follow-ups %+d s after its end" % m["v2_at"] if "v2_at" in m else ""))
    else:
        L.append("page: none in %s" % s(r["t"].get("end")))
    ob = r["outbox"]
    L.append("outbox: %d writes (%s), %d sends" % (len(ob["writes"]), ", ".join(sorted({w["service"] + "." + w["action"] for w in ob["writes"]})) or "none",
                                                   len(ob["sends"])))
    if r["cards"]:
        L.append("cards: " + "; ".join("#%s %s" % (c.get("id"), (c.get("text") or "")[:60]) for c in r["cards"]))
    L.append("verdict: " + ("pass" if not r["fails"] else "FAIL: " + "; ".join(r["fails"])))
    if r.get("capsule"):
        L.append("capsule (spoken ask, s from fn held):")
        for k in r["capsule"][:14]:
            L.append("  %6s  %s" % (k.get("at", ""), k.get("what") or k.get("error")))
    if r.get("hub_state"):
        L.append("hub state kept: %s" % r["hub_state"])
    L.append("files: %s" % r["dir"])
    return "\n".join(L)


def run(scenario, headless=False, timeout=900, keep=False, out=None, require=None, voice=False):
    """A scripted product run (ambient-lead m_5306): a model hub (the user's
    model and keys, throwaway state) with the fake accounts only; the
    scenario's ask through the core like the capsule's; times the page's
    first appearance (sb page start), v1, then 3 scripted notes over the
    page API, send, v2 and the notes' outcomes; the outbox (no send for a
    'don't send' ask); main's capsule line length. Writes run.json and
    report.txt in its folder; stops what it started unless `keep`."""
    if scenario not in SCENARIOS:
        raise QAError("scenario: %s" % ", ".join(SCENARIOS))
    sc = SCENARIOS[scenario]
    raise_file_limit()   # a launchd shell's 256 files ran out mid-run (ambient-pm m_5837)
    # one run at a time per QA dir: two runs shared one throwaway hub (ambient-pm m_5841)
    lock = os.path.join(QA_DIR, "run.lock")
    held = _read(lock)
    if held and held.get("pid") != os.getpid() and _pid_alive(held.get("pid")):
        raise QAError("a run is live in %s (%s, pid %s, since %s): one at a time, or another AMBIENT_QA_DIR"
                      % (QA_DIR, held.get("scenario"), held.get("pid"), held.get("at")))
    os.makedirs(QA_DIR, exist_ok=True)
    with open(lock, "w") as f:
        json.dump({"pid": os.getpid(), "scenario": scenario, "at": time.strftime("%H:%M:%S")}, f)
    # a TERM (kill <pid>) stops the run the way ^C does: the finally clauses stop its hub. before,
    # a TERM ended the process on the spot and left its throwaway hub running (05:58, amb-tools-m)
    signal.signal(signal.SIGTERM, _term_to_interrupt)
    try:
        return _run(scenario, sc, headless, timeout, keep, out, require, voice)
    finally:
        if (_read(lock) or {}).get("pid") == os.getpid():
            os.unlink(lock)


def _term_to_interrupt(*_):
    raise KeyboardInterrupt("SIGTERM")


def _run(scenario, sc, headless, timeout, keep, out, require, voice=False):
    if "tick_min" in sc:
        # the fake clock's batches only on qa.py tick (0), never on their own mid-run
        os.environ["AMBIENT_QA_TICK_MIN"] = str(sc["tick_min"])
    if voice and headless:
        raise QAError("--voice drives the app's fn and the fake voice: run with --app, not --headless")
    bise, root = find_bise()
    build = require_commits(root, require)
    seeded = None
    if sc.get("seed") and not headless:
        raise QAError("run %s seeds a scripted hub first: --headless only" % scenario)
    if headless:
        if alive():
            raise QAError("a QA app is running: stop it first (qa.py stop), or run without --headless")
        if sc.get("seed"):
            # the night on a scripted hub (no credits), kept; then the model hub on its state
            s_info = _start_hub(bise, root, "fake", keep=True, sets=sc.get("set", ""))
            try:
                seeded = SEEDS[sc["seed"]](s_info)
            finally:
                _stop_hub()
            info = _start_hub(bise, root, "model", reuse=s_info["tmp"], sets=sc.get("set", ""))
        else:
            info = _start_hub(bise, root, "model", sets=sc.get("set", ""))
    else:
        launch(hub="model", restart=True)
        info = _read(HUB)
    d = out or os.path.join(OUT, "runs", "%s-%s" % (scenario, time.strftime("%Y%m%d-%H%M%S")))
    os.makedirs(d, exist_ok=True)
    r = {"scenario": scenario, "ask": sc["ask"], "headless": headless, "at": time.strftime("%Y-%m-%d %H:%M"), "dir": d, "tree": dict(tree_info(root), required=build["required"]),
         "t": {}, "main_lines": [], "cards": [], "page": None, "notes": [], "fails": [], "load": {"start": round(os.getloadavg()[0], 1)},
         "seeded": seeded, "helpers": _read(os.path.join(QA_DIR, "helpers.json"))}
    c, _ = _hub()
    core = None
    try:
        _wait(lambda: c.state, 30, "the hub's state")
        c.wait_idle("main", timeout=300)
        core = _Core(bise, root, info, headless, d)
        if headless:
            _wait(lambda: any(e.get("ev") == "hub" and e.get("up") for e in core.evs), 60, "the core on the hub")
        before = {p["id"] for p in c.state.get("pages", [])}
        t0 = time.time()
        rel = lambda: round(time.time() - t0, 1)
        cards = {}

        def poll():
            for e in core.new():
                if e.get("ev") == "main" and e.get("text"):
                    r["main_lines"].append({"at": rel(), "text": e["text"], "len": len(e["text"])})
            for cd in c.cards():
                # the latest view of each card, kept fields it no longer shows (its page link once
                # closed: ambient-pm m_5904), first seen time
                old = cards.get(cd.get("id")) or {}
                cards[cd.get("id")] = dict(old, **{k: v for k, v in cd.items() if v is not None}, at=old.get("at", rel()))
            pages = [p for p in (c.state or {}).get("pages", []) if p["id"] not in before]
            return pages[0] if pages else None

        def settled():
            return all(_agent_settled(a) for a in (c.state or {}).get("agents", []))

        if voice:
            # spoken, as he would (ambient-lead m_5978): fn held, the fake mic says the ask, let go;
            # the capsule's lines are recorded with their times next to the page's
            r["voice"] = True
            call("say", text=sc["ask"], per_word_ms=240, timeout=120)
            r["t"]["said"] = rel()
        else:
            core.send(sc["ask"])
        page, quiet = None, None
        if sc.get("timed"):
            # pages that come later, on the hub's timers (the meetings): the flow waits for them itself
            FLOWS[sc["flow"]](dict(r=r, c=c, page=None, body="", d=d, poll=poll, settled=settled, rel=rel, timeout=timeout,
                                   info=info, core=core, cards=cards, before=before))
        while not sc.get("timed") and time.time() - t0 < timeout:
            page = poll()
            if page and "page_first" not in r["t"]:
                r["t"]["page_first"] = rel()
            if page and page.get("version", 0) >= 1 and "v1" not in r["t"]:
                r["t"]["v1"] = rel()
            # done: v1 out and everyone idle for 3 s; no page: everyone idle for 60 s
            quiet = (quiet or time.time()) if settled() and rel() > 5 else None
            if quiet and time.time() - quiet > (3 if "v1" in r["t"] else 60):
                break
            time.sleep(0.5)
        r["t"]["end"] = rel()
        if sc.get("timed"):
            pass
        elif not page or "v1" not in r["t"]:
            r["fails"].append("no page v1 in %.0f s" % r["t"]["end"])
        else:
            meta = page_meta(page["id"])
            last = meta["versions"][-1]
            r["page"] = {"id": page["id"], "url": page.get("url"), "title": page.get("title"), "v1_n": last["n"],
                         "blocks": [{"id": b["id"], "kit": b["kit"]} for b in last.get("blocks", [])]}
            port = _port(info["state"])
            st, body = _http(port, "GET", "/p/%s/v/%d/body" % (page["id"], last["n"]))
            open(os.path.join(d, "v%d.body.html" % last["n"]), "w").write(body)
            if sc.get("flow") in FLOWS:
                # roadmap A, C, D: what the user does after v1, and what must follow
                FLOWS[sc["flow"]](dict(r=r, c=c, page=page, port=port, last=last, body=body, d=d, poll=poll, settled=settled, rel=rel,
                                       timeout=timeout, info=info, core=core, cards=cards, pick=sc.get("pick"), picks=sc.get("picks"), note_texts=sc.get("note_texts")))
            elif not sc.get("notes", True):
                # launch watch (roadmap B): v1 holds batch 0's needs-an-answer items;
                # after a tick the page republishes with the new batch's
                truth0 = launch_truth(1)
                r["coverage"] = {"v1": _covered(body, [c for c in launch_truth(1)["new"] if c["needs_answer"]])}
                for k in range(int(sc.get("ticks", 1))):
                    tick()
                    r["t"]["tick%d" % (k + 1)] = rel()
                    t_tick = time.time()
                    want = launch_truth(k + 2)["new_needs_answer"]
                    nv, found = last["n"], None
                    while time.time() - t_tick < timeout:
                        poll()
                        m = page_meta(page["id"])
                        n = m["versions"][-1]["n"]
                        if n > nv:
                            st, b2 = _http(port, "GET", "/p/%s/v/%d/body" % (page["id"], n))
                            if _covered(b2, want)["found"] and settled():
                                found = (n, b2)
                                break
                        time.sleep(3)
                    if found:
                        r["t"]["republish%d_after_tick" % (k + 1)] = round(time.time() - t_tick, 1)
                        r["t"]["v2_n"] = found[0]
                        open(os.path.join(d, "v%d.body.html" % found[0]), "w").write(found[1])
                        r["coverage"]["tick%d" % (k + 1)] = _covered(found[1], want)
                        last = {"n": found[0]}
                    else:
                        r["fails"].append("no republish with tick %d's new comments in %d s" % (k + 1, timeout))
                        break
                r["truth"] = {"needs_answer_v1": truth0["needs_answer"], "batches": int(sc.get("ticks", 1)) + 1}
                blocks = []
            else:
                blocks = last.get("blocks", [])
        if page and "v1" in r["t"] and sc.get("notes", True):
            blocks = last.get("blocks", [])
            prose = [b for b in blocks if b["kit"] in ("prose", "callout", "table", "heading")]
            picks = (prose + [b for b in blocks if b not in prose])[:3]
            notes = [{"block": b["id"], "kind": "note", "text": t} for b, t in zip(picks, RUN_NOTES)]
            r["t"]["send"] = rel()
            sent = page_notes(page["id"], notes, send=True)
            ids = [n["id"] for n in sent["saved"]]
            t_send = time.time()
            v2 = None
            while time.time() - t_send < timeout:
                poll()
                m = page_meta(page["id"])
                mine = [n for n in m.get("notes", []) if n["id"] in ids]
                if m["versions"][-1]["n"] > last["n"] and mine and all(n["status"] not in ("draft", "sent", "open") for n in mine) and settled():
                    v2 = m
                    break
                time.sleep(2)
            if v2:
                r["t"]["v2_after_send"] = round(time.time() - t_send, 1)
                r["t"]["v2_n"] = v2["versions"][-1]["n"]
                st, body = _http(port, "GET", "/p/%s/v/%d/body" % (page["id"], r["t"]["v2_n"]))
                open(os.path.join(d, "v%d.body.html" % r["t"]["v2_n"]), "w").write(body)
            else:
                r["fails"].append("no v2 with the 3 notes handled in %d s" % timeout)
            m = page_meta(page["id"])
            r["notes"] = [{"id": n["id"], "block": n.get("block"), "text": n.get("text"), "status": n.get("status"), "answer": n.get("answer")}
                          for n in m.get("notes", []) if n["id"] in ids]
        r["cards"] = list(cards.values())
        r["main_tail"] = c.lines("main")[-40:]
    except Exception as e:  # noqa: BLE001
        # a run that breaks is a FAIL in its own report, never a silent pass (ambient-pm m_5639)
        import traceback
        r["fails"].append("the run stopped: %s" % e)
        r["error"] = traceback.format_exc()[-3000:]
        try:
            r["main_tail"] = c.lines("main")[-40:]
        except Exception:  # noqa: BLE001
            pass
    finally:
        r["load"]["end"] = round(os.getloadavg()[0], 1)
        if voice and core:
            try:
                r["capsule"] = capsule_timeline(events(2000)["events"][core.start:])
            except Exception as e:  # noqa: BLE001
                r["capsule"] = [{"error": str(e)}]
        if core:
            core.close()
        try:
            writes = [json.loads(l) for l in open(os.path.join(info["tmp"], "outbox.jsonl")) if l.strip()]
        except FileNotFoundError:
            writes = []
        r["outbox"] = {"writes": writes, "sends": [w for w in writes if w["action"] in SENDS]}
        if sc["no_send"] and r["outbox"]["sends"]:
            r["fails"].append("sent %d items on a 'don't send' ask" % len(r["outbox"]["sends"]))
        if sc.get("no_writes") and r["outbox"]["writes"]:
            r["fails"].append("%d writes on a read-only ask (outbox must stay empty)" % len(r["outbox"]["writes"]))
        if sc.get("ticks"):
            # a card only for what he asked to be told: a comment that needs an answer
            need = [c for b in range(1, int(sc["ticks"]) + 2) for c in launch_truth(b)["new"] if c["needs_answer"]]
            # or a teammate's direct question to him (Marc in #launch: 'can the weekly update carry
            # these numbers?'): it needs his answer too (ambient-pm m_5855); plain comments and news don't
            asks = team_asks()
            off = [cd for cd in r["cards"] if not _card_about(cd, need) and not _card_about(cd, asks)]
            r["cards_off_ask"] = off
            if off:
                r["fails"].append("%d card(s) not about a comment that needs an answer or a teammate's question to him" % len(off))
        if r["main_lines"] and r["main_lines"][0]["len"] > 120:
            r["fails"].append("main's capsule line is %d chars (one short line)" % r["main_lines"][0]["len"])
        if r["fails"]:
            # a failed run keeps the hub's state (journal, hub.log, the agents' transcripts and
            # wire logs) in its folder, so its owner sees whether the notes reached the agent (ambient-lead m_5942)
            try:
                r["hub_state"] = keep_hub_state(info["state"], os.path.join(d, "hub-state"))
            except Exception as e:  # noqa: BLE001
                r["hub_state"] = "not kept: %s" % e
        if not keep:
            # only the hub this run started: an older run ending late stopped a newer run's hub
            r["stopped"] = _stop_hub(only_pid=info.get("pid")) if headless else stop()
        with open(os.path.join(d, "run.json"), "w") as f:
            json.dump(r, f, indent=1, ensure_ascii=False)
        r["report"] = run_report(r)
        with open(os.path.join(d, "report.txt"), "w") as f:
            f.write(r["report"] + "\n")
    return r


# ---------------------------------------------------------------- the scenes

def fake_scenes():
    """amb-web's own scenes (apps/ambient/web/fakecore.js), built by node:
    one source of truth for what each SPEC §2 state looks like in events."""
    js = r"""
      require(%s); require(%s);
      const F = globalThis.AmbFake;
      const resp = {};
      for (const c of [{cmd: "answer"}, {cmd: "send", text: "$text"}, {cmd: "hush"}, {cmd: "cut_in"}, {cmd: "talk_cancel"}])
        resp[c.cmd] = F.respond(c);
      console.log(JSON.stringify({
        scenes: F.SCENES.map((s) => ({id: s.id, spec: s.spec, label: s.label, events: s.build()})),
        respond: resp, agents: F.AGENTS, card: F.CARD,
      }));
    """ % (json.dumps(os.path.join(WEB, "words.js")), json.dumps(os.path.join(WEB, "fakecore.js")))
    r = subprocess.run(["node", "-e", js], capture_output=True, text=True)
    if r.returncode != 0:
        raise QAError("node couldn't build fakecore.js's scenes: " + r.stderr[-600:])
    return json.loads(r.stdout)


def extra_scenes(agents, card):
    """The states ambient asked for that fakecore.js doesn't play (m_4768)."""
    hub = [0, {"ev": "hub", "up": True, "workspace": "~/acme"}]

    def st(a, cards=()):
        return {"ev": "state", "agents": a, "cards": list(cards)}

    def many(n):
        notes = ["profiling signup", "settings page first", "the banner, half the size", "waits for the others",
                 "it's always unicode", "the flaky login test", "docs for the CLI", "bump the deps"]
        return [{"name": "agent-%02d" % (i + 1), "status": ["working", "idle", "done", "working", "blocked"][i % 5],
                 "note": notes[i % len(notes)], "report": "", "working": i % 5 in (0, 3), "turn_ms": 60000 * (i + 1)}
                for i in range(n)]
    nopt = dict(card, id="c9", options=[], text="which date works for the offsite?")
    card2 = {"id": "c2", "kind": "confirm", "agent": "perf", "text": "run the migration on the shared staging db?",
             "options": [{"n": 1, "label": "allow"}, {"n": 3, "label": "no"}]}
    one = [dict(agents[0])]
    out = [
        {"id": "idle-0", "spec": ["idle"], "label": "idle, no agent", "events": [hub, [0, st([])]]},
        {"id": "idle-1", "spec": ["idle"], "label": "idle, 1 agent working", "events": [hub, [0, st(one)]]},
        {"id": "needs-noopt", "spec": ["needs you"], "label": "needs you, no options", "events": [hub, [0, st(agents)], [600, st(agents, [nopt])]]},
        {"id": "needs-2", "spec": ["needs you"], "label": "needs you, 2 waiting", "events": [hub, [0, st(agents)], [600, st(agents, [card, card2])]]},
        {"id": "spot-text", "spec": ["spotlight"], "label": "spotlight with text", "events": [hub, [0, st(agents)], [400, {"ev": "app_key", "key": "space"}],
                                                                                        [900, {"ev": "ui_spot_type", "text": "what's perf doing?"}]]},
        {"id": "agents-5", "spec": ["agents"], "label": "fn + 0: 5 agents", "events": [hub, [0, st(many(5))], [500, {"ev": "app_key", "key": "0"}]]},
        {"id": "agents-15", "spec": ["agents"], "label": "fn + 0: 15 agents", "events": [hub, [0, st(many(15))], [500, {"ev": "app_key", "key": "0"}]]},
    ]
    # pages (docs/ambient-pages.md §2.3, ambient-pm m_4888): the core's page event and state.pages
    url = "http://127.0.0.1:47123/p/weekly-update"
    page = {"id": "weekly-update", "title": "weekly update", "agent": "main", "version": 1, "url": url, "at_ms": 1790000000000, "state": "ready", "open_notes": 0}
    older = dict(page, id="offsite-venues", title="offsite venues", url=url.replace("weekly-update", "offsite-venues"), at_ms=1789990000000, version=2)
    pev = dict(page, ev="page")
    out += [
        {"id": "page-ready", "spec": ["pages"], "label": "a page is ready · fn + o", "events": [hub, [0, st(agents)], [600, pev]]},
        {"id": "page-updating", "spec": ["pages"], "label": "a page updating (notes sent)", "events": [hub, [0, dict(st(agents), pages=[page])], [600, dict(pev, state="updating")]]},
        {"id": "page-fn-o", "spec": ["pages"], "label": "fn + o opens the newest page (logged, not opened)", "events": [hub, [0, st(agents)], [600, pev], [2200, {"ev": "app_key", "key": "o"}]]},
        {"id": "page-front", "spec": ["pages"], "label": "a page you wait for opens in front (logged)", "events": [hub, [0, st(agents)], [600, dict(pev, front=True)]]},
        {"id": "for-you", "spec": ["pages", "agents"], "label": "fn + 0 with 'for you' pages", "events": [hub, [0, dict(st(agents), pages=[page, older])], [500, {"ev": "app_key", "key": "0"}]]},
    ]
    for p in ("mic", "screen"):
        for s in ("ask", "denied"):
            out.append({"id": "perm-%s-%s" % (p, s), "spec": ["permissions"], "label": "%s: %s" % (p, s),
                        "events": [hub, [0, st(agents)], [500, {"ev": "app_perm", "perm": p, "state": s}]]})
    return out


# the events after which the capsule shows something new: a shot ~0.6 s later
MOMENTS = {"phase", "app_fn", "app_key", "app_perm", "hub", "error", "main", "sent", "ui_spot_send", "ui_spot_type", "app_shot", "app_hidden"}


def shot_times(events, settle=600, gap=900, cap=8):
    """When to shoot a scene: after each moment (and each change of the cards
    or the agents), merged when closer than `gap`, plus the end."""
    times = []
    last_state = None
    for ms, ev in events:
        k = ev.get("ev")
        if k == "state":
            sig = json.dumps([[a.get("name"), a.get("status")] for a in ev.get("agents", [])] + [c.get("id") for c in ev.get("cards", [])])
            if sig != last_state:
                last_state = sig
                times.append(ms + settle)
        elif k in MOMENTS:
            times.append(ms + settle)
    times.sort()
    merged = []
    for t in times:
        if merged and t - merged[-1] < gap:
            merged[-1] = t      # the later one: the capsule has settled
        else:
            merged.append(t)
    # the end, once everything settled (its own shot unless right after the last)
    end = max((ms for ms, _ in events), default=0) + 1200
    if merged and end - merged[-1] < 400:
        merged[-1] = end
    else:
        merged.append(end)
    if len(merged) > cap:   # keep the first, the last, and an even spread
        step = (len(merged) - 1) / (cap - 1)
        merged = [merged[round(i * step)] for i in range(cap)]
    return merged


def all_scenes():
    f = fake_scenes()
    return f["scenes"] + extra_scenes(f["agents"], f["card"]), f["respond"]


def tokens_css(path):
    """A tokens file as CSS for the capsule: .css as is; .json {name: value}
    (or {"tokens": {...}}) as :root custom properties (--name: value)."""
    if not path:
        return ""
    txt = open(os.path.expanduser(path)).read()
    if path.endswith(".json"):
        t = json.loads(txt)
        t = t.get("tokens", t)
        return ":root{%s}" % ";".join("--%s:%s" % (k.lstrip("-"), v) for k, v in t.items())
    return txt


def look(tokens=None, reduce=None):
    """The app's look for the next shots: a tokens file (None: the app's
    own), reduced motion on or off (None: leave it)."""
    out = {}
    if tokens is not None:
        out["css"] = call("css", css=tokens_css(tokens))
    if reduce is not None:
        inject({"ev": "app_reduce_motion", "on": bool(reduce)})
        out["reduce_motion"] = bool(reduce)
    return out


def scenes(only=None, backdrops=("dark",), out=None, at=None, what="both", cols=4, reduce=False, tokens=None,
           screen_h=300, frames=None, every=80, span=None):
    """Play every scene (or `only`) in the real app, shoot each state, and
    make a contact sheet per backdrop (the panels) plus one of the screens.
    reduce: reduced motion on for every scene; tokens: a tokens file (.css or
    .json) on the capsule; screen_h: the screen shots' top in points (0: all);
    frames: a scene id: a strip of frames every `every` ms over `span`
    [from, to] ms (default the whole scene), for the motion."""
    if not alive():
        raise QAError("the QA app isn't running: launch() first")
    if isinstance(only, str):
        only = [s for s in only.split(",") if s]
    if isinstance(backdrops, str):
        backdrops = [b for b in backdrops.split(",") if b]
    sc, respond = all_scenes()
    if frames:
        only = [frames]
    if only:
        missing = set(only) - {s["id"] for s in sc}
        if missing:
            raise QAError("no scene %s; there are: %s" % (", ".join(sorted(missing)), ", ".join(s["id"] for s in sc)))
        sc = [s for s in sc if s["id"] in only]
    tag = "".join(["-reduce" if reduce else "", "-tokens" if tokens else "", "-frames" if frames else ""])
    run = out or os.path.join(OUT, time.strftime("scenes-%Y%m%d-%H%M%S") + tag)
    os.makedirs(run, exist_ok=True)
    result = {"dir": run, "scenes": [], "sheets": [], "reduce": bool(reduce), "tokens": tokens}
    if tokens:
        look(tokens=tokens)
    try:
        for bd in backdrops:
            tiles, screens = [], []
            for s in sc:
                events = s["events"]
                if reduce:
                    events = [[0, {"ev": "app_reduce_motion", "on": True}]] + events
                if frames:
                    end = max((ms for ms, _ in events), default=0) + 1200
                    a, b = (span or [0, end])[:2]
                    times = list(range(int(a), int(b) + 1, max(16, int(every))))   # 16: ambient m_6592 (each shot's at_ms/taken_ms say when it really came)
                    w = "panel"
                else:
                    times = at or shot_times(events)
                    w = what
                shots = [{"at": t, "what": w} for t in times]
                prefix = "%s.%s%s" % (s["id"], bd, tag)
                r = call("play", timeout=300, events=events, shots=shots, respond=respond, dir=os.path.join(run, bd),
                         prefix=prefix, backdrop=bd, tail_ms=300, screen_h=screen_h)
                for sh in r.get("shots", []):
                    label = "%s · %s @%.2fs" % (s["id"], s["label"], sh["at_ms"] / 1000) if not frames else "%s %.0f ms" % (s["id"], sh["at_ms"])
                    if sh.get("panel"):
                        tiles.append({"path": sh["panel"], "label": label})
                    if sh.get("screen"):
                        screens.append({"path": sh["screen"], "label": label})
                for sh in r.get("shots", []):
                    g = sh.get("glass") or {}
                    sh["shown"], sh["app_glass"] = g.get("panel_visible"), g.get("app")
                    if ghost_glass(g):
                        result.setdefault("ghosts", []).append({"scene": s["id"], "backdrop": bd, "at_ms": sh.get("at_ms"), "glass": g})
                result["scenes"].append({"id": s["id"], "spec": s["spec"], "label": s["label"], "backdrop": bd, "shots": r.get("shots", [])})
                if reduce:
                    inject({"ev": "app_reduce_motion", "on": False})
            look_s = " · reduced motion" if reduce else ""
            look_s += " · tokens %s" % os.path.basename(tokens) if tokens else ""
            if tiles:
                p = os.path.join(run, "sheet.%s.png" % bd)
                title = ("bise ambient · %s frames every %d ms" % (frames, every)) if frames else "bise ambient · SPEC §2 states"
                call("sheet", items=tiles, out=p, cols=(8 if frames else cols), tile_w=(320 if frames else 560),
                     title="%s · %s backdrop%s · panel" % (title, bd, look_s), timeout=180)
                result["sheets"].append(p)
            if screens:
                p = os.path.join(run, "sheet.%s.screen.png" % bd)
                call("sheet", items=screens, out=p, cols=cols, tile_w=420, title="bise ambient · %s backdrop%s · screen" % (bd, look_s), timeout=180)
                result["sheets"].append(p)
    finally:
        if tokens:
            look(tokens="")
        reset()
    ghosts = result.get("ghosts", [])
    result["fails"] = ["a ghost glass (the app blurs %s with no glass drawn) in %s @%s ms (%s)" % (g["glass"].get("app"), g["scene"], g["at_ms"], g["backdrop"])
                       for g in ghosts]
    with open(os.path.join(run, "index.json"), "w") as f:
        json.dump(result, f, indent=1)
    return result


def ghost_glass(g):
    """A shot's glass record (QA.glassNow) shows a ghost glass (ambient m_6683): the panel shown and
    the app blurring its glass rect while the page draws no glass there (none, or opacity under
    0.05): blur with no content."""
    if not g or not g.get("panel_visible") or not g.get("app"):
        return False
    return not g.get("rect") or (g.get("opacity") is not None and g["opacity"] < 0.05)


QA_DEFAULTS = "dev.bise.ambient.qa"   # the QA app's own defaults (App.swift: UserDefaults(suiteName:)), never the user's


def _qa_defaults(*args):
    return subprocess.run(["defaults"] + list(args), capture_output=True, text=True)


def hello(every=300, span=3000, reduce=False, backdrop="dark", out=None):
    """The hello, once ever (amb-mac f3d076aa, amb-web 439320e9), as the app
    really says it: the QA defaults forget 'saidHello' and ask for a first
    run (qa.firstRun: the app says hello only then in QA), the app restarts
    on the same hub, Accessibility is granted through the page's own
    app_perm 'continue' (App's fake prompt: granted -> helloSoon, 0.6 s),
    then a frame every `every` ms from app_hello for `span` ms, and a sheet.
    After: qa.firstRun cleared and the app restarted with every permission
    on, so the other scenes never meet the hello. Needs a launched app."""
    if not alive():
        raise QAError("no QA app: launch() first")
    hub = (_read(RUN) or {}).get("hub", "fake")
    out = out or os.path.join(OUT, "hello-%s" % time.strftime("%Y%m%d-%H%M%S"))
    os.makedirs(out, exist_ok=True)
    stop(keep_hub=True)
    _qa_defaults("write", QA_DEFAULTS, "qa.firstRun", "-bool", "true")
    for k in ["saidHello"] + ["%s.%s" % (w, p) for w in ("asked", "told") for p in ("accessibility", "mic", "screen")]:
        _qa_defaults("delete", QA_DEFAULTS, k)
    r = {"dir": out, "frames": [], "reduce": bool(reduce)}
    try:
        launch(hub=hub, backdrop=backdrop, restart=True)
        if reduce:
            look(reduce=True)
        n0 = len(events(2000)["events"])
        call("cmd", cmd={"cmd": "app_perm", "perm": "accessibility", "do": "continue"})
        t_hello = None
        t0 = time.time()
        while time.time() - t0 < 10 and t_hello is None:
            # App posts app_hello to the page directly (not in the QA log); the page's
            # app_content 'hello' is the first thing logged once it shows
            if any(e["ev"].get("ev") == "app_hello" or (e["ev"].get("cmd") == "app_content" and e["ev"].get("kind") == "hello")
                   for e in events(2000)["events"][n0:]):
                t_hello = time.time()
            time.sleep(0.03)
        if t_hello is None:
            raise QAError("no app_hello within 10 s of Accessibility granted: is the app built at f3d076aa or later? (events: %s)"
                          % [e["ev"].get("ev") or e["ev"].get("cmd") for e in events(2000)["events"][n0:]][-12:])
        r["hello_after_grant_ms"] = int((t_hello - t0) * 1000)
        for k in range(int(span // every) + 1):
            wait = t_hello + k * every / 1000.0 - time.time()
            if wait > 0:
                time.sleep(wait)
            at = int((time.time() - t_hello) * 1000)
            s = snapshot("panel", name="hello-%02d-%04dms" % (k, at), out=out)
            r["frames"].append({"at_ms": at, "path": s.get("panel") or s.get("path")})
        evs = events(2000)["events"][n0:]
        r["content"] = [(e["ev"].get("kind")) for e in evs if e["ev"].get("cmd") == "app_content"]
        tiles = [{"path": f["path"], "label": "%d ms" % f["at_ms"]} for f in r["frames"] if f["path"]]
        if tiles:
            r["sheet"] = os.path.join(out, "hello-sheet.png")
            call("sheet", items=tiles, out=r["sheet"], cols=6, tile_w=320,
                 title="bise ambient · the hello · every %d ms%s" % (every, " · reduced motion" if reduce else ""), timeout=120)
    finally:
        _qa_defaults("delete", QA_DEFAULTS, "qa.firstRun")
        stop(keep_hub=True)
        launch(hub=hub, backdrop=backdrop, restart=True)
    return r


def play(events, shots=(), name="play", backdrop=None, out=None, mute_core=True):
    """A custom timeline: [[ms, ev], ...], shots [{at, what}] (ms)."""
    out = out or os.path.join(OUT, "play")
    q = dict(events=events, shots=list(shots), dir=out, prefix=name, mute_core=mute_core, tail_ms=200)
    if backdrop:
        q["backdrop"] = backdrop
    _, respond = all_scenes()
    q["respond"] = respond
    return call("play", timeout=180, **q)


# ---------------------------------------------------------------- the CLI

# ---------------------------------------------------------------- harness A: the real app

# `qa.py real` (ambient-lead m_7961): his REAL app build (no --qa), its normal path (core spawn
# with --bise and the env launchd gives, focus logic, main menu), on an isolated HOME with a
# throwaway fake-provider hub found by his own rules, its panels on an off-screen virtual
# display, driven through amb-mac's test input socket (NSEvents into the app's own queue,
# never HID). The app side honors the socket only when BISE_HOME is set and isn't ~/.bise.

def _short_agent():
    return re.sub(r"[^a-z0-9]", "", (os.environ.get("SB_AGENT") or "me").lower())[:10] or "me"


REAL_DIR = os.environ.get("AMBIENT_REAL_DIR") or os.path.join(os.path.expanduser("~/.bise/gate"), "ra-" + _short_agent())
REAL_HOME = os.path.join(REAL_DIR, "h")         # the isolated HOME: short, the hub's socket lives under it
REAL_APP_DIR = os.path.join(REAL_DIR, "app")    # AMBIENT_HARNESS: the app's test.sock and its output
REAL_SOCK = os.path.join(REAL_APP_DIR, "test.sock")
REAL_RUN = os.path.join(REAL_DIR, "run.json")
REAL_APP = os.path.expanduser("~/.bise/dev/build/ambient/harness/bise ambient.app")
HIS_BISE = os.path.expanduser("~/.bise/dev/build/ambient/target/debug/bise")
LAUNCHD_PATH = "/usr/bin:/bin:/usr/sbin:/sbin"   # what launchd gives an app opened from the Finder or a login item


WINS_JS = os.path.join(HERE, "wins.js")
# his own state: a harness path must never point there (ambient-lead m_8004)
HIS_STATE = [os.path.expanduser(p) for p in ("~/.bise/hubs", "~/.bise/run", "~/.bise/dev/ambient", "~/.bise/sessions",
                                              "~/.local/state/switchboard", "~/bise")]


def real_windows(pid):
    """The pid's windows and the online screens, from the window server (wins.js: bounds only)."""
    r = subprocess.run(["osascript", "-l", "JavaScript", WINS_JS, str(pid)], capture_output=True, text=True, timeout=10)
    if r.returncode != 0:
        raise QAError("wins.js: %s" % r.stderr.strip()[-300:])
    return json.loads(r.stdout)


def _touches(w, screens):
    """Does a window's rect share any area with a screen's (global top-left coords)?"""
    return [s["id"] for s in screens
            if w["x"] < s["x"] + s["w"] and s["x"] < w["x"] + w["w"] and w["y"] < s["y"] + s["h"] and s["y"] < w["y"] + w["h"]
            and w["w"] > 0 and w["h"] > 0]


def _app_type(pid):
    """lsappinfo's ApplicationType for a pid: Foreground (Dock icon), UIElement (accessory), BackgroundOnly."""
    r = subprocess.run(["lsappinfo", "info", "-only", "applicationtype", str(pid)], capture_output=True, text=True)
    m = re.search(r'"ApplicationType"="([^"]+)"', r.stdout)
    return m.group(1) if m else None


def _front():
    """The frontmost app: name and pid (lsappinfo, no permission)."""
    asn = subprocess.run(["lsappinfo", "front"], capture_output=True, text=True).stdout.strip()
    r = subprocess.run(["lsappinfo", "info", "-only", "name", "-only", "pid", asn], capture_output=True, text=True).stdout
    name = re.search(r'"LSDisplayName"="([^"]*)"', r)
    pid = re.search(r'"pid"\s*=\s*(\d+)', r)
    return {"name": name.group(1) if name else None, "pid": int(pid.group(1)) if pid else None}


def real_violations(pid):
    """What breaks 'nothing in his face' right now: a window of the app touching a screen, the
    app with a Dock icon, the app in front."""
    v = []
    try:
        ws = real_windows(pid)
    except (QAError, subprocess.TimeoutExpired, ValueError) as e:
        return ["can't read the windows: %s" % e]
    for w in ws["wins"]:
        hit = _touches(w, ws["screens"])
        if hit:
            v.append("window %s at (%d,%d %dx%d) touches screen %s (onscreen %s, alpha %s, layer %s)"
                     % (w["n"], w["x"], w["y"], w["w"], w["h"], hit, w.get("onscreen"), w.get("alpha"), w.get("layer")))
    t = _app_type(pid)
    if t == "Foreground":
        v.append("the app has a Dock icon (ApplicationType Foreground)")
    if _front().get("pid") == pid:
        v.append("the app is frontmost")
    return v


def _exe_pid(exe):
    """The pid running exactly this executable (the harness bundle's own path), or None."""
    # ps, not pgrep: the path has spaces, and pgrep's regex missed it in proof run #2 (the watchdog
    # never attached; amb-mac's own guard did the job)
    # and both the path as given and its real path: ~/.bise/dev/build links into
    # ~/.local/state/switchboard/build, and a process started by launchd shows the real one
    # (proof run #3: the watchdog never attached)
    r = subprocess.run(["ps", "-axww", "-o", "pid=,args="], capture_output=True, text=True)
    names = {exe, os.path.realpath(exe)}
    for line in r.stdout.splitlines():
        pid, _, args = line.strip().partition(" ")
        if any(args == n or args.startswith(n + " ") for n in names):
            return int(pid)
    return None


def real_watch(pid, every=0.25):
    """The independent guard (`qa.py _real_watch`, detached at launch): while the harness app
    lives, every `every` s, a window touching a screen, a Dock icon or the app in front kills
    it at once (SIGKILL) and writes why to <app dir>/watch.log."""
    log = open(os.path.join(REAL_APP_DIR, "watch.log"), "a")
    if isinstance(pid, str) and pid.startswith("exe:"):
        exe, t0, pid = pid[4:], time.time(), None
        while pid is None and time.time() - t0 < 60:
            pid = _exe_pid(exe)
            time.sleep(0.02)
        if pid is None:
            log.write("%s no process of %s in 60 s\n" % (time.strftime("%T"), exe))
            return []
    log.write("%s watching pid %d\n" % (time.strftime("%T"), pid))
    log.flush()
    while _pid_alive(pid):
        v = real_violations(pid)
        if v and not v[0].startswith("can't read"):
            try:
                os.kill(pid, signal.SIGKILL)
            except OSError:
                pass
            log.write("%s KILLED pid %d: %s\n" % (time.strftime("%T"), pid, "; ".join(v)))
            log.flush()
            return v
        time.sleep(every)
    log.write("%s pid %d gone\n" % (time.strftime("%T"), pid))
    return []


def _real_guard(argv, env):
    """Refuse a launch whose paths reach his own state (his hubs, his app's socket and pid, his
    sessions, his home workspace): the harness has its own HOME, BISE_HOME, state and hub."""
    gate = os.path.realpath(os.path.expanduser("~/.bise/gate")) + "/"
    if not os.path.realpath(REAL_HOME).startswith(gate):
        raise QAError("refused: the harness HOME %s is not under ~/.bise/gate" % REAL_HOME)
    refuse_his_state(list(argv[1:]) + list(env.values()))


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


def _bundle_exe(app):
    plist = os.path.join(app, "Contents", "Info.plist")
    name = None
    if os.path.exists(plist):
        r = subprocess.run(["/usr/libexec/PlistBuddy", "-c", "Print :CFBundleExecutable", plist], capture_output=True, text=True)
        name = r.stdout.strip() or None
    exe = os.path.join(app, "Contents", "MacOS", name or os.path.splitext(os.path.basename(app))[0])
    if not _is_exe(exe):
        raise QAError("no app at %s (amb-mac's harness build: ~/.bise/dev/build/ambient/harness/; or pass app=)" % exe)
    return exe


def his_app_path():
    """The PATH his running app hands its core (--env PATH=..., from ps), else this shell's."""
    r = subprocess.run(["ps", "-axww", "-o", "args="], capture_output=True, text=True)
    for line in r.stdout.splitlines():
        if "/Contents/MacOS/bise ambient" in line and "--env PATH=" in line and REAL_DIR not in line:
            m = re.search(r"--env PATH=(\S+)", line)
            if m:
                return m.group(1)
    # his app isn't running: his login shell's PATH from a clean env (what the app's launcher
    # hands it, amb-mac m_7974), never this agent's PATH (it carries the hub's bin)
    sh = os.environ.get("SHELL", "/bin/zsh")
    r = subprocess.run(["/usr/bin/env", "-i", "HOME=%s" % os.path.expanduser("~"), "USER=%s" % os.environ.get("USER", ""),
                        "LOGNAME=%s" % os.environ.get("USER", ""), "SHELL=%s" % sh, "TERM=dumb", sh, "-l", "-c", 'printf %s "$PATH"'],
                       capture_output=True, text=True, timeout=20, stdin=subprocess.DEVNULL)
    return r.stdout.strip().splitlines()[-1] if r.returncode == 0 and r.stdout.strip() else LAUNCHD_PATH


def _user_tmp():
    r = subprocess.run(["getconf", "DARWIN_USER_TEMP_DIR"], capture_output=True, text=True)
    return r.stdout.strip() or "/tmp/"


def real_call(op, timeout=30.0, **kw):
    try:
        c = Client(REAL_SOCK)
    except QAError:
        raise QAError("the harness app isn't running (no %s): qa.py real launch first" % REAL_SOCK)
    try:
        return c.call(op, timeout=timeout, **kw)
    finally:
        c.close()


def real_alive():
    try:
        return real_call("ping", timeout=3)
    except (QAError, OSError, ValueError):
        return None


def real_launch(app=None, bise=None, root=None, args=None, timeout=40, web=None, path=None, session_env=None, world=False):
    """His real app (no --qa) on an isolated HOME and a throwaway fake-provider hub, as launchd
    would start it: PATH=/usr/bin:/bin:/usr/sbin:/sbin, HOME, his args (--workspace, --bise).
    bise: his (~/.bise/dev/build/ambient/target/debug/bise) unless given; root: the tree whose
    repl-live and sb-core the hub runs (bins.sh makes them current), default this tree.
    world: on the running `qa.py world` instead (its HOME, bise's home workspace, its hubs and
    registered projects: bise desktop's multi-project runs); no hub of its own then.
    One harness at a time: a QA app of this agent and an older harness are stopped first."""
    app = os.path.abspath(app or os.environ.get("AMBIENT_REAL_APP") or REAL_APP)
    exe = _bundle_exe(app)
    bise = os.path.abspath(bise or os.environ.get("AMBIENT_QA_BISE") or HIS_BISE)
    if not _is_exe(bise):
        raise QAError("no bise at %s: pass bise=" % bise)
    root = root or os.environ.get("AMBIENT_QA_APP_ROOT") or app_root_of(bise) or REPO
    if alive():
        stop()
    real_stop()
    home = REAL_HOME
    if world:
        import world as world_mod
        w = world_mod.state()
        home = w["home"]
        info = {"ws": os.path.join(home, world_mod.HOME_NAME), "state": [h["sock"] for h in w["hubs"] if h["home"]][0], "tmp": w["world"]}
    elif os.path.isdir(REAL_HOME):
        if not os.path.realpath(REAL_HOME).startswith(os.path.realpath(os.path.expanduser("~/.bise/gate")) + "/"):
            raise QAError("refusing to clear %s: not under ~/.bise/gate" % REAL_HOME)
        shutil.rmtree(REAL_HOME, ignore_errors=True)
    _prepare_home(home)
    os.makedirs(REAL_APP_DIR, exist_ok=True)
    try:
        os.unlink(REAL_SOCK)
    except OSError:
        pass
    path = path or his_app_path()
    _real_guard(["x", "--bise", bise, "--env", "PATH=%s" % path, "--env", "BISE_APP_ROOT=%s" % root], {"HOME": home})
    if not world:
        info = _start_hub(bise, root, "fake", home=REAL_HOME)
    env = {"HOME": home, "BISE_HOME": os.path.join(home, ".bise"), "PATH": LAUNCHD_PATH, "TMPDIR": _user_tmp(),
           "USER": os.environ.get("USER", ""), "LOGNAME": os.environ.get("LOGNAME", os.environ.get("USER", "")),
           "SHELL": os.environ.get("SHELL", "/bin/zsh"), "LANG": os.environ.get("LANG", "en_US.UTF-8"),
           "AMBIENT_HARNESS": REAL_APP_DIR, "BISE_AMBIENT_TEST_INPUT": REAL_SOCK}
    # a bise session's vars as his shell would carry them (bug 2's case, ambient-lead m_8076):
    # only ever pointing at ANOTHER throwaway hub under ~/.bise/gate, never his
    session_env = dict(session_env or {})
    gate = os.path.realpath(os.path.expanduser("~/.bise/gate")) + "/"
    for k, v in session_env.items():
        if str(v).startswith("/") and not os.path.realpath(v).startswith(gate):
            raise QAError("refused: session_env %s=%s is not under ~/.bise/gate" % (k, v))
    env.update(session_env)
    # his own launch's args (amb-mac m_7974, from ps on his running app): --bise --web --workspace
    # and --env BISE_APP_ROOT / PATH (what the core spawn gets); never --dev (his ~/.bise/dev):
    # without it the app's dev dir is <BISE_HOME>/dev
    web = web or os.path.join(root, "apps", "ambient", "web")
    argv = [exe] + (list(args) if args is not None else
                    ["--bise", bise, "--web", web, "--workspace", info["ws"],
                     "--env", "BISE_APP_ROOT=%s" % root, "--env", "PATH=%s" % path])
    _real_guard(argv, env)
    out = open(os.path.join(REAL_APP_DIR, "app.out"), "a")
    out.write("\n--- %s %s\n" % (time.strftime("%F %T"), " ".join(argv)))
    out.flush()
    # the independent guard first, watching for the harness executable's process: a window on his
    # screens, a Dock icon or the app in front kills it (amb-mac's own guard quits it too)
    subprocess.Popen([sys.executable, "-B", os.path.realpath(__file__), "_real_watch", "exe:" + exe], cwd=REPO,
                     stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True,
                     env=dict(os.environ, AMBIENT_REAL_DIR=REAL_DIR))
    # launched by launchd through open (-g: never to the front; -n: a new instance), so the app is
    # its own responsible process: a TCC check is never attributed to the agent's terminal
    # (the first proof: Ghostty), and its env is launchd's plus ours, like his own app's
    out.close()
    cmd = ["open", "-g", "-n", "-a", app, "--stdout", os.path.join(REAL_APP_DIR, "app.out"), "--stderr", os.path.join(REAL_APP_DIR, "app.out")]
    for k, v in env.items():
        cmd += ["--env", "%s=%s" % (k, v)]
    cmd += ["--args"] + argv[1:]
    # open hands the app the CALLER's environment plus --env: from an agent shell that was the
    # agent's whole env (SB_SOCKET = the real hub's socket, SB_AGENT, BISE_ROLE...; the bug 2/4
    # run's core had them). So open runs with a clean env: the app gets only this and our --env.
    clean = {"PATH": LAUNCHD_PATH, "HOME": os.path.expanduser("~"), "USER": os.environ.get("USER", ""),
             "LOGNAME": os.environ.get("USER", ""), "TMPDIR": _user_tmp(), "LANG": os.environ.get("LANG", "en_US.UTF-8")}
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=30, env=clean)
    if r.returncode != 0:
        raise QAError("open failed: %s" % (r.stderr or r.stdout)[-500:])
    t0, ping, pid = time.time(), None, None
    while time.time() - t0 < timeout:
        pid = pid or _exe_pid(exe)
        if pid and not _pid_alive(pid):
            break
        ping = real_alive()
        if ping:
            pid = ping.get("pid") or pid
            break
        time.sleep(0.25)
    if pid:
        with open(os.path.join(REAL_APP_DIR, "app.pid"), "w") as f:
            f.write(str(pid))
    run = {"app": app, "exe": exe, "pid": pid, "argv": argv, "env": env, "bise": bise, "root": root, "tree": tree_info(root),
           "home": REAL_HOME, "hub": {"state": info["state"], "ws": info["ws"], "tmp": info["tmp"]}, "socket": REAL_SOCK,
           "ping": ping, "logs": real_logs()}
    with open(REAL_RUN, "w") as f:
        json.dump(run, f, indent=1)
    if ping:
        # first: the independent watchdog is attached to this pid, else nothing runs (ambient-lead m_8061)
        t1, attached = time.time(), False
        while time.time() - t1 < 5 and not attached:
            try:
                attached = ("watching pid %d" % pid) in open(os.path.join(REAL_APP_DIR, "watch.log")).read()
            except OSError:
                pass
            time.sleep(0.1)
        if not attached:
            real_stop()
            raise QAError("stopped: the watchdog did not attach to pid %s in 5 s (watch.log)" % pid)
        # the app and its core carry nothing of the agent's or the real hub's (SB_SOCKET, SB_AGENT...)
        leaked = [k for k in real_env_leaks(pid) if k not in session_env]
        if leaked:
            real_stop()
            raise QAError("stopped: the harness app carries the agent's env: %s" % leaked)
        # it reached only its own: its core's workspace is the throwaway one, its hub under the harness HOME
        core_ws = ((real_call("state").get("core") or {}).get("workspace"))
        hub = info["state"] if world else (real_feed().get("hub") or "")
        if core_ws and os.path.realpath(core_ws) != os.path.realpath(info["ws"]) or not os.path.realpath(hub).startswith(os.path.realpath(home) + "/"):
            real_stop()
            raise QAError("refused after launch: the core's workspace %s or the hub %s is not the harness's own" % (core_ws, hub))
    if not ping:
        tail = open(os.path.join(REAL_APP_DIR, "app.out"), errors="replace").read()[-1500:]
        alive_now = bool(pid and _pid_alive(pid))
        real_stop()
        try:
            watch = open(os.path.join(REAL_APP_DIR, "watch.log")).read().splitlines()[-2:]
        except OSError:
            watch = []
        raise QAError("the harness app %s its test socket in %d s; watch.log: %s; its output ends:\n%s"
                      % ("didn't open" if alive_now else "quit before opening", timeout, watch, tail))
    return run


def real_logs():
    """Where each layer of harness A writes: the app's output, its own logs under the isolated
    HOME (<HOME>/.bise/ambient/*.log: app.log, core.log), the hub's dir."""
    logs = [os.path.join(REAL_APP_DIR, "app.out")]
    logs += sorted(glob.glob(os.path.join(REAL_HOME, ".bise", "ambient", "*.log")))
    logs += sorted(glob.glob(os.path.join(REAL_HOME, ".bise", "dev", "ambient", "*.log")))
    logs += sorted(glob.glob(os.path.join(REAL_HOME, ".bise", "hubs", "*", "hub.log")))
    return logs


def real_tail(n=40):
    """The last n lines of every log of harness A, by file."""
    out = {}
    for p in real_logs():
        try:
            out[p] = open(p, errors="replace").read().splitlines()[-n:]
        except OSError:
            pass
    return out


def real_feed(agent="main", count=40):
    """What the harness hub holds for an agent (main: did his words arrive, what did it answer):
    the last lines of its transcript.log in the hub's own folder under the harness HOME (the
    hub's {op:history} answered nothing for a 'before' past the end)."""
    hubs = sorted(glob.glob(os.path.join(REAL_HOME, ".bise", "hubs", "*")))
    if not hubs:
        raise QAError("no harness hub under %s" % REAL_HOME)
    t = os.path.join(hubs[0], "agents", agent, "transcript.log")
    lines = open(t, errors="replace").read().splitlines() if os.path.exists(t) else []
    keep = [l for l in lines if "\tsb you : " in l or "obs: assistant: " in l or "\tsb card : " in l]
    return {"agent": agent, "lines": keep[-count:], "hub": os.path.join(hubs[0], "hub.sock")}


def real_env_leaks(pid):
    """The agent-only or real-hub variables in a process's env (ps eww): any is a leak."""
    envl = subprocess.run(["ps", "eww", "-o", "command=", "-p", str(pid)], capture_output=True, text=True).stdout
    bad = ("SB_SOCKET", "SB_AGENT", "SB_TASK", "SB_STATE_DIR", "BISE_ROLE", "BEND_STDIN", "GHOSTTY_RESOURCES_DIR")
    return [k for k in bad if re.search(r"\s%s=" % k, envl)]


def real_hub_send(text, focus="main"):
    """Words into the harness hub as its user would type them in the TUI (the throwaway hub only):
    the fake main runs the [[bash: ...]] in them, e.g. [[bash: sb card "which date?"]] raises a card."""
    socks = sorted(glob.glob(os.path.join(REAL_HOME, ".bise", "hubs", "*", "hub.sock")))
    if not socks:
        raise QAError("no harness hub under %s" % REAL_HOME)
    s = socket.socket(socket.AF_UNIX)
    s.settimeout(5)
    s.connect(socks[0])
    try:
        s.sendall(b'{"op":"hello"}\n')
        s.sendall((json.dumps({"op": "input", "focus": focus, "text": text}) + "\n").encode())
        time.sleep(0.3)
    finally:
        s.close()
    return {"sent": text, "hub": socks[0]}


def real_stop():
    """Quit the harness app (its own pid only: a normal terminate, then SIGTERM) and its hub."""
    out = {"app": "not running", "hub": "not running"}
    pid = None
    try:
        pid = int(open(os.path.join(REAL_APP_DIR, "app.pid")).read().strip())
    except (OSError, ValueError):
        pass
    if real_alive():
        try:
            real_call("quit", timeout=3)
        except (QAError, OSError):
            pass
    if pid and _pid_alive(pid):
        t0 = time.time()
        while _pid_alive(pid) and time.time() - t0 < 5:
            time.sleep(0.1)
        if _pid_alive(pid):
            os.kill(pid, signal.SIGTERM)
        out["app"] = "stopped pid %d" % pid
    info = _read(HUB)
    if info and info.get("home") and _stop_hub():
        out["hub"] = "stopped"
    return out


# the harness app's web views: the capsule's bar, the side panel, and bise desktop's window
# (S4, amb-mac m_8218: window:'win' on mouse/key/type/eval, shot what:'win', win_open/close/restore, deeplink)
WINDOWS = ("bar", "win")      # the side panel is gone since S8 (amb-mac m_8516, harness app 79a14b8c)


def real_win(do, route=None, open=None):
    """bise desktop's window, off-screen like the panels: open (a route, none = the last one),
    close, restore (close then open: the route and frame come back), or a deep link exactly as a
    capsule/card/spotlight ⏎ hands it ({open: {project?, agent?}} or {route}). The reply plus
    the window's state after it (state.win: frame, visible, test_key, route, appearance)."""
    if do == "open":
        r = real_op("win_open", **({"route": route} if route else {}))
    elif do in ("close", "restore"):
        r = real_op("win_" + do)
    elif do == "deeplink":
        if not (route or open):
            raise QAError("deeplink: a route or open {project?, agent?}")
        r = real_op("deeplink", **({"open": open} if open else {"route": route}))
    else:
        raise QAError("win: open, close, restore or deeplink")
    st = real_op("state")
    return {"reply": r, "win": st.get("win"), "win_model": st.get("win_model")}


def real_op(op, **kw):
    """One op on the harness app's test socket (amb-mac's: ping state click key type fn shot
    eval events quit), checked against the ops its ping lists."""
    ping = real_alive()
    if not ping:
        raise QAError("the harness app isn't running: qa.py real launch first")
    if op == "shot" and kw.get("what", kw.get("window")) not in WINDOWS:
        raise QAError("shot: window bar or win only (the web view's own snapshot); never a display (ambient-lead m_8004)")
    ops = ping.get("ops")
    if ops and op not in ops and op != "ping":
        raise QAError("the harness app has no op %r (it has: %s)" % (op, ", ".join(ops)))
    timeout = 30 + float(kw.get("ms", 0) or 0) / 1000
    return real_call(op, timeout=timeout, **kw)


def real_click(selector, window="bar"):
    """A click on a page element of a harness panel: its rect from the page (eval), then mouse
    at its center in that window's own points from its top-left (the page's CSS px; amb-mac
    m_8006), so AppKit's own hit test, ignoresMouseEvents and first-click rules apply."""
    sel = json.dumps(selector)
    r = real_op("eval", window=window, js="(() => { const e = document.querySelector(%s); if (!e) return null; const b = e.getBoundingClientRect(); "
                "return JSON.stringify({x: b.left, y: b.top, w: b.width, h: b.height}); })()" % sel)
    v = r.get("value")
    rect = json.loads(v) if isinstance(v, str) else v
    if not rect:
        raise QAError("click: no %s in the %s page" % (selector, window))
    x, y = rect["x"] + rect["w"] / 2, rect["y"] + rect["h"] / 2
    out = real_op("mouse", window=window, x=x, y=y)
    out["at"] = {"x": x, "y": y, "element": rect}
    return out


def real_keys(*specs, window=None):
    """Key presses into the harness app ('up', 'esc', 'return', 'cmd+w', 'type:hello'), one key
    op each in the app's format {key, mods} (amb-mac's: left right up down esc enter tab space
    delete <char>), delivered the way NSApp would to the window that has the keys."""
    names = {"return": "enter", "escape": "esc", "backspace": "delete"}
    out = []
    for spec in specs:
        if spec.startswith("type:"):
            out.append(real_op("type", text=spec[5:]))
            continue
        parts = [p for p in spec.replace("⌘", "cmd+").lower().split("+") if p]
        *mods, k = parts
        bad = [m for m in mods if m not in MODS]
        if bad:
            raise QAError("keys: unknown modifier in %r (cmd shift alt ctrl)" % spec)
        kw = {"key": names.get(k, k), "mods": [MODS[m] for m in mods]}
        if window:
            kw["window"] = window
        r = real_op("key", **kw)
        r["spec"] = spec
        out.append(r)
    return out[0] if len(out) == 1 else {"keys": out}


def real_proof(seconds=8.0):
    """ONE short run that proves harness A stays out of his face (ambient-lead m_8004): sampled
    every 0.5 s from launch to stop, at rest and while the bar shows (fn tap, fn hold, esc):
    every window of the app vs every screen (none may touch one), the app never active and never
    frontmost, his front app the same before, during and after, no Dock icon (ApplicationType),
    no audio device or mic opened by the app's pid (coreaudiod's and TCC's logs over the run)."""
    since = time.strftime("%Y-%m-%d %H:%M:%S")
    out = {"front_before": _front(), "samples": 0, "violations": [], "windows_seen": {}, "screens": None,
           "app_types": [], "app_active": [], "fronts": [], "steps": []}
    pid = None
    try:
        run = real_launch()
        pid = run["pid"]
        out["pid"] = pid

        def sample():
            out["samples"] += 1
            for v in real_violations(pid):
                if v not in out["violations"]:
                    out["violations"].append(v)
            ws = real_windows(pid)
            out["screens"] = ws["screens"]
            for w in ws["wins"]:
                out["windows_seen"][str(w["n"])] = {k: w[k] for k in ("x", "y", "w", "h", "onscreen")}
            t = _app_type(pid)
            if t not in out["app_types"]:
                out["app_types"].append(t)
            ping = real_alive() or {}
            out["app_says"] = {k: ping.get(k) for k in ("offscreen", "screens", "windows", "front_app", "status_item")}
            if ping.get("app_active") not in out["app_active"]:
                out["app_active"].append(ping.get("app_active"))
            f = _front().get("name")
            if f not in out["fronts"]:
                out["fronts"].append(f)

        steps = [("rest", None), ("fn tap", lambda: real_op("fn", kind="tap")), ("esc", lambda: real_keys("esc")),
                 ("fn hold 1 s", lambda: real_op("fn", kind="hold", ms=1000)), ("esc", lambda: real_keys("esc"))]
        per = max(1.0, seconds / len(steps))
        for name, act in steps:
            if not _pid_alive(pid):
                out["steps"].append({"name": name, "error": "the app is gone (a guard quit it?)"})
                break
            r = {"name": name}
            try:
                if act:
                    act()
            except QAError as e:
                r["error"] = str(e)[:300]
            t1 = time.time() + per
            while time.time() < t1 and _pid_alive(pid):
                sample()
                time.sleep(0.5)
            out["steps"].append(r)
    finally:
        out["stop"] = real_stop()
        out["front_after"] = _front()
    if pid:
        lg = subprocess.run(["log", "show", "--style", "compact", "--start", since, "--predicate",
                             'process == "coreaudiod" OR subsystem == "com.apple.TCC"'], capture_output=True, text=True, timeout=120).stdout
        mine = [l for l in lg.splitlines() if re.search(r"\b%d\b" % pid, l)]
        # coreaudiod lines about the pid = an audio device used; TCC: which services it asked and how
        # (preflight=yes is a silent check; a real request could prompt, attributed to whoever launched it)
        out["audio_lines"] = [l[:240] for l in mine if "coreaudiod" in l][:10]
        msgs = {}
        for l in lg.splitlines():
            m = re.search(r"msgID=(%d\.\d+), function=\S+, service=(\w+), preflight=(\w+)" % pid, l)
            if m:
                msgs[m.group(1)] = {"service": m.group(2), "preflight": m.group(3)}
            r = re.search(r"AUTHREQ_ATTRIBUTION: msgID=(%d\.\d+).*?identifier=([\w.]+)" % pid, l)
            if r and r.group(1) in msgs:
                msgs[r.group(1)]["responsible"] = r.group(2)
        out["tcc"] = list(msgs.values())
        try:
            out["watch_log"] = open(os.path.join(REAL_APP_DIR, "watch.log")).read().splitlines()[-4:]
        except OSError:
            pass
    fails = list(out["violations"])
    if True in out["app_active"]:
        fails.append("the app said it was active")
    if out["front_before"].get("name") != out["front_after"].get("name") or len(out["fronts"]) > 1:
        fails.append("his front app changed: %s -> %s -> %s" % (out["front_before"].get("name"), out["fronts"], out["front_after"].get("name")))
    if "Foreground" in out["app_types"]:
        fails.append("a Dock icon")
    if out.get("audio_lines"):
        fails.append("coreaudiod logged the app's pid: an audio device (see audio_lines)")
    asked = [t for t in out.get("tcc", []) if t.get("preflight") != "yes"]
    if asked:
        fails.append("a TCC request that may prompt: %s" % asked)
    if not out["samples"]:
        fails.append("no sample taken")
    out["fails"] = fails
    out["verdict"] = "pass" if not fails else "FAIL"
    return out


def _real_cli(a):
    c = a.rcmd
    if c == "launch":
        return real_launch(a.app, a.bise, a.root)
    if c == "stop":
        return real_stop()
    if c in ("ping", "state"):
        return real_op(c)
    if c == "op":
        return real_op(a.name, **json.loads(a.args))
    if c == "keys":
        return real_keys(*a.specs, window=a.window)
    if c == "click":
        if a.at:
            x, y = (float(v) for v in a.at.split(","))
            return real_op("mouse", window=a.window, x=x, y=y)
        if a.selector:
            return real_click(a.selector, a.window)
        raise QAError("click: a selector or --at x,y (points from the window's top-left)")
    if c == "type":
        return real_op("type", text=a.text)
    if c == "fn":
        kw = {"kind": a.kind}
        if a.ms:
            kw["ms"] = a.ms
        if a.words:
            kw["words"] = a.words
        return real_op("fn", **kw)
    if c == "shot":
        return real_op("shot", what=a.window)
    if c == "win":
        return real_win(a.do, a.route, json.loads(a.open) if a.open else None)
    if c == "eval":
        return real_op("eval", window=a.window, js=a.js)
    if c == "events":
        return real_op("events", **({"since": a.since} if a.since else {}))
    if c == "feed":
        return real_feed(a.agent, a.count)
    if c == "logs":
        return real_tail(a.n)
    if c == "proof":
        return real_proof(a.seconds)
    raise QAError("real: unknown %s" % c)


def _cli(argv):
    import argparse
    ap = argparse.ArgumentParser(prog="qa.py", description=__doc__.split("\n\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("launch"); p.add_argument("--hub", default="fake"); p.add_argument("--no-app", action="store_true", help="the throwaway hub, its page server and the fake accounts only: never builds or opens the app"); p.add_argument("--connectors", action="store_true", help="hub model: the user's REAL connectors (needs --real-accounts-approved-by-user)"); p.add_argument("--computer", action="store_true", help="the QA hub may load the computer plugin: the user's browser (needs --real-accounts-approved-by-user)"); p.add_argument("--real-accounts-approved-by-user", default="", metavar="MESSAGE_ID", help="the user's own message asking for this one run"); p.add_argument("--workspace"); p.add_argument("--bise")
    p.add_argument("--web"); p.add_argument("--backdrop", default="dark"); p.add_argument("--force-build", action="store_true"); p.add_argument("--restart", action="store_true")
    p = sub.add_parser("stop"); p.add_argument("--keep-hub", action="store_true")
    p = sub.add_parser("_real_watch"); p.add_argument("pid")
    p = sub.add_parser("real", help="harness A: his real app (no --qa) on an isolated HOME, a throwaway hub and an off-screen display, driven by its test socket")
    rs = p.add_subparsers(dest="rcmd", required=True)
    q = rs.add_parser("launch"); q.add_argument("--app"); q.add_argument("--bise"); q.add_argument("--root")
    for n in ("stop", "ping", "state"):
        rs.add_parser(n)
    q = rs.add_parser("op", help="any op of the test socket: op <name> '<json args>'"); q.add_argument("name"); q.add_argument("args", nargs="?", default="{}")
    q = rs.add_parser("keys", help="up esc return cmd+w type:<text> ..."); q.add_argument("specs", nargs="+"); q.add_argument("--window", choices=WINDOWS)
    q = rs.add_parser("click", help="a click on a selector, or --at x,y (points from the window's top-left)"); q.add_argument("selector", nargs="?"); q.add_argument("--at"); q.add_argument("--window", default="bar", choices=WINDOWS)
    q = rs.add_parser("win", help="bise desktop's window (off-screen): open [--route r], close, restore, deeplink --route r | --open '{\"project\":..,\"agent\":..}'")
    q.add_argument("do", choices=["open", "close", "restore", "deeplink"]); q.add_argument("--route"); q.add_argument("--open")
    q = rs.add_parser("type"); q.add_argument("text")
    q = rs.add_parser("fn"); q.add_argument("kind", choices=["down", "up", "tap", "hold"]); q.add_argument("--ms", type=int); q.add_argument("--words")
    q = rs.add_parser("shot"); q.add_argument("--window", default="bar", choices=WINDOWS)
    q = rs.add_parser("proof", help="one short run: no window on his screens, never active, his front app unchanged, no Dock icon, no audio"); q.add_argument("--seconds", type=float, default=8)
    q = rs.add_parser("eval"); q.add_argument("js"); q.add_argument("--window", default="bar", choices=WINDOWS)
    q = rs.add_parser("events"); q.add_argument("--since")
    q = rs.add_parser("feed", help="the hub's last lines of an agent: did his words reach main?"); q.add_argument("--agent", default="main"); q.add_argument("--count", type=int, default=40)
    q = rs.add_parser("logs"); q.add_argument("--n", type=int, default=40)
    p = sub.add_parser("scenes"); p.add_argument("--only"); p.add_argument("--backdrops", default="dark"); p.add_argument("--out"); p.add_argument("--what", default="both")
    p.add_argument("--reduce-motion", action="store_true"); p.add_argument("--tokens"); p.add_argument("--screen-h", type=int, default=300)
    p.add_argument("--frames", help="a scene id: a strip of frames"); p.add_argument("--every", type=int, default=80)
    p.add_argument("--span", help="from,to in ms (frames)"); p.add_argument("--at", help="ms,ms,... instead of the automatic moments")
    p = sub.add_parser("look"); p.add_argument("--tokens", help="a .css or .json tokens file ('' = the app's own)"); p.add_argument("--reduce-motion", choices=["on", "off"])
    p = sub.add_parser("page", help="pages on the throwaway hub")
    p.add_argument("action", choices=["publish", "notes", "meta", "fixture", "drive"]); p.add_argument("--url"); p.add_argument("--steps", help="a JSON file of steps (drive)"); p.add_argument("--schemes", default="light,dark"); p.add_argument("--id", default="weekly-update"); p.add_argument("--file")
    p.add_argument("--title", default="weekly update"); p.add_argument("--notes", help="JSON list of notes"); p.add_argument("--send", action="store_true")
    p.add_argument("--done", help="n1,n2"); p.add_argument("--edit", help='JSON {"old": "new"} applied to the file first')
    p = sub.add_parser("list")
    p = sub.add_parser("run", help="a scripted product run on a model hub with the fake accounts")
    p.add_argument("scenario", choices=sorted(SCENARIOS)); p.add_argument("--headless", action="store_true", help="no app: a bise ambient-core child")
    p.add_argument("--timeout", type=int, default=900); p.add_argument("--keep", action="store_true", help="leave the hub (and app) running"); p.add_argument("--out")
    p.add_argument("--json", action="store_true", help="print run.json instead of the report")
    p.add_argument("--require", help="commits the bise tree must have (comma-separated): refused otherwise")
    p.add_argument("--app", action="store_true", help="on the QA app (the default without --headless)")
    p.add_argument("--voice", action="store_true", help="the ask spoken: the app's fn held, the fake voice says it; records the capsule's lines (with --app)")
    p = sub.add_parser("say"); p.add_argument("text"); p.add_argument("--no-wait", action="store_true")
    p = sub.add_parser("snapshot"); p.add_argument("--what", default="both"); p.add_argument("--backdrop"); p.add_argument("--name"); p.add_argument("--out")
    p.add_argument("--menubar", action="store_true", help="the menu-bar item in each state (still, work, need, away, done, fail, listen) at 1x and 2x, and a sheet")
    p.add_argument("--states", help="menubar: a subset, comma-separated"); p.add_argument("--frames", type=int, default=1, help="menubar: successive frames of a moving mood")
    p.add_argument("--count", type=int, default=2, help="menubar: the need state's count")
    p = sub.add_parser("pearl", help="every pearl frame amb-mac plays, per mood, at 1x and 2x"); p.add_argument("--out")
    p = sub.add_parser("hello", help="the hello as the app says it (first run, Accessibility granted): frames from app_hello, a sheet")
    p.add_argument("--every", type=int, default=300); p.add_argument("--span", type=int, default=3000); p.add_argument("--reduce-motion", action="store_true")
    p.add_argument("--backdrop", default="dark"); p.add_argument("--out")
    sub.add_parser("state"); sub.add_parser("reset"); sub.add_parser("ping"); sub.add_parser("outbox")
    p = sub.add_parser("ask", help="asks to main on the running throwaway hub, one after the other: its words, length, time, pages")
    p.add_argument("texts", nargs="*"); p.add_argument("--file", help="one ask per line"); p.add_argument("--no-capsule", action="store_true", help="as the TUI, not through a core")
    p.add_argument("--timeout", type=int, default=600); p.add_argument("--json", action="store_true")
    p = sub.add_parser("tick", help="the launch's next batch of fake comments comes in now (numbers move)"); p.add_argument("--n", type=int, default=1)
    p = sub.add_parser("events"); p.add_argument("n", nargs="?", type=int, default=40); p.add_argument("--levels", action="store_true")
    p = sub.add_parser("fn"); p.add_argument("state"); p.add_argument("--key", default="fn")
    p = sub.add_parser("key"); p.add_argument("k")
    p = sub.add_parser("click", help="one real mouse click (a CGEvent posted to the QA app's pid, never the HID tap) on a capsule element: what the window server, AppKit and the page each saw")
    p.add_argument("selector"); p.add_argument("--route", choices=["appkit", "point", "window"], default="appkit"); p.add_argument("--frontmost", action="store_true", help="leave bise active (default: not frontmost)")
    p = sub.add_parser("fn-hold-closed", help="fn held from rest through the real key path (no tap): pearl listening within 300 ms, words to the core, main's line; a tap does nothing")
    p.add_argument("--variants", default="launch,fold,hide"); p.add_argument("--words", default="what is on my plate today"); p.add_argument("--within-ms", type=int, default=300)
    sub.add_parser("rest", help="the capsule back to rest and bise not the active app")
    p = sub.add_parser("eval", help="read one JS expression on the capsule's page (its value back; reads only)"); p.add_argument("js"); p.add_argument("--fn-held", action="store_true", help="read while fn is held (talk open), then cancel")
    p = sub.add_parser("hover", help="the pointer over an element (mouseMoved into the QA app's queue, his pointer never moves)"); p.add_argument("selector"); p.add_argument("--ms", type=int, default=1000)
    p = sub.add_parser("alpha", help="the panel's pixels with alpha: the pearl's corners and a ring outside it, and around the glass, must be transparent")
    p.add_argument("--name", default="alpha"); p.add_argument("--ring", type=float, default=6); p.add_argument("--outside", type=float, default=10)
    p = sub.add_parser("clicks", help="every button the capsule shows in one state, one real click each (state set again before each): the page got it, one command left")
    p.add_argument("--state", default="card", help="card, drafts, or a JSON file with a core state event"); p.add_argument("--open", default="auto", help="fn + this key opens the view (auto: i for cards, , for settings; none: no key)")
    p.add_argument("--selector"); p.add_argument("--then", help="click the first target whose data-qa starts with this before listing (card- : a card's own bar from fn i)")
    p = sub.add_parser("keys", help="real keys into the QA app's panel (CGEvent to its pid, never the HID tap): up down return tab esc cmd+return cmd+1 type:<words>")
    p.add_argument("specs", nargs="+"); p.add_argument("--gap-ms", type=int, default=60)
    sub.add_parser("menu", help="the menu-bar menu's rows, in order (kind, title, keys, ref, enabled)")
    p = sub.add_parser("menu-click", help="click a menu row as the real one: stop <timer id>, page|watch <url>, card <id>")
    p.add_argument("kind", choices=["stop", "page", "watch", "card"]); p.add_argument("ref")
    p = sub.add_parser("inject"); p.add_argument("ev")
    p = sub.add_parser("_hub"); p.add_argument("--bise", required=True); p.add_argument("--kind", default="fake"); p.add_argument("--connectors", action="store_true"); p.add_argument("--computer", action="store_true")
    p.add_argument("--real-accounts-approved-by-user", default=""); p.add_argument("--keep", action="store_true"); p.add_argument("--reuse"); p.add_argument("--home")
    p = sub.add_parser("world", help="bise desktop: one throwaway HOME, bise's home hub + 2-3 seeded projects (world.py)")
    ws = p.add_subparsers(dest="wcmd", required=True)
    q = ws.add_parser("up"); q.add_argument("--projects", type=int, default=3); q.add_argument("--bise"); q.add_argument("--root")
    ws.add_parser("down"); ws.add_parser("state")
    q = ws.add_parser("say"); q.add_argument("project"); q.add_argument("text")
    p = sub.add_parser("_world"); p.add_argument("--bise", required=True); p.add_argument("--root", required=True); p.add_argument("--projects", type=int, default=3)
    a = ap.parse_args(argv)
    if a.cmd in ("world", "_world"):
        import world
        if a.cmd == "_world":
            return world.daemon(a.bise, a.root, a.projects)
        r = {"up": lambda: world.up(a.projects, a.bise, a.root), "down": world.down, "state": world.state,
             "say": lambda: world.say(a.project, a.text)}[a.wcmd]()
        print(json.dumps(r, indent=1, ensure_ascii=False))
        return
    if a.cmd == "_hub":
        return hub_daemon(a.bise, a.kind, a.connectors, a.computer, a.real_accounts_approved_by_user, a.keep, a.reuse, a.home)
    if a.cmd == "_real_watch":
        return real_watch(a.pid if a.pid.startswith("exe:") else int(a.pid))
    if a.cmd == "real":
        print(json.dumps(_real_cli(a), indent=1, ensure_ascii=False))
        return
    if a.cmd == "launch":
        r = launch(a.hub, a.workspace, a.bise, a.web, a.backdrop, a.force_build, a.restart, a.connectors, a.computer, a.real_accounts_approved_by_user, a.no_app)
    elif a.cmd == "stop":
        r = stop(a.keep_hub)
    elif a.cmd == "scenes":
        nums = lambda v: [float(x) for x in v.split(",")] if v else None
        r = scenes(a.only, a.backdrops, a.out, at=nums(a.at), what=a.what, reduce=a.reduce_motion, tokens=a.tokens,
                   screen_h=a.screen_h, frames=a.frames, every=a.every, span=nums(a.span))
        r = {"dir": r["dir"], "sheets": r["sheets"], "scenes": len(r["scenes"])}
    elif a.cmd == "look":
        r = look(a.tokens, None if a.reduce_motion is None else a.reduce_motion == "on")
    elif a.cmd == "page":
        if a.action == "publish":
            r = page_publish(a.file, a.id, a.title, a.done.split(",") if a.done else None, None, json.loads(a.edit) if a.edit else None)
        elif a.action == "notes":
            r = page_notes(a.id, json.loads(a.notes or "[]"), a.send)
        elif a.action == "meta":
            r = page_meta(a.id)
        elif a.action == "drive":
            r = page_drive(None if a.url else a.id, a.url, json.load(open(a.steps)) if a.steps else None, a.schemes)
        else:
            r = page_fixture(a.id)
    elif a.cmd == "list":
        sc, _ = all_scenes()
        r = [{"id": s["id"], "spec": s["spec"], "label": s["label"]} for s in sc]
    elif a.cmd == "run":
        r = run(a.scenario, a.headless, a.timeout, a.keep, a.out, a.require, a.voice)
        if not a.json:
            print(r["report"])
            return
    elif a.cmd == "say":
        r = say(a.text, wait_answer=not a.no_wait)
    elif a.cmd == "pearl":
        r = pearl(a.out)
    elif a.cmd == "hello":
        r = hello(a.every, a.span, a.reduce_motion, a.backdrop, a.out)
    elif a.cmd == "snapshot" and a.menubar:
        r = menubar(a.states, a.frames, a.count, a.out)
    elif a.cmd == "snapshot":
        r = snapshot(a.what, a.backdrop, a.name, a.out)
    elif a.cmd == "state":
        r = state()
    elif a.cmd == "ask":
        texts = list(a.texts) + ([l.strip() for l in open(a.file) if l.strip()] if a.file else [])
        if not texts:
            raise QAError("ask: give the asks (or --file)")
        r = ask(texts, not a.no_capsule, a.timeout)
        if not a.json:
            print(r["report"] + "\n" + r["file"])
            return
    elif a.cmd == "tick":
        r = tick(a.n)
    elif a.cmd == "outbox":
        r = outbox()
    elif a.cmd == "reset":
        r = reset()
    elif a.cmd == "ping":
        r = alive() or {"running": False}
    elif a.cmd == "events":
        r = events(a.n, a.levels)
    elif a.cmd == "fn":
        r = fn(a.state, a.key)
    elif a.cmd == "key":
        r = key(a.k)
    elif a.cmd == "click":
        r = click(a.selector, a.route, not a.frontmost)
    elif a.cmd == "fn-hold-closed":
        r = fn_hold_closed(tuple(v for v in a.variants.split(",") if v), a.words, within_ms=a.within_ms)
    elif a.cmd == "rest":
        r = rest()
    elif a.cmd == "eval":
        r = eval_js(a.js, fn_held=a.fn_held)
    elif a.cmd == "hover":
        r = hover(a.selector, a.ms)
    elif a.cmd == "alpha":
        r = alpha(a.name, ring=a.ring, outside=a.outside)
    elif a.cmd == "clicks":
        st = a.state if a.state in CLICK_STATES else json.load(open(a.state))
        r = clicks(st, None if a.open == "none" else a.open, a.selector, then=a.then)
    elif a.cmd == "keys":
        r = keys(*a.specs, gap_ms=a.gap_ms)
    elif a.cmd == "menu":
        r = menu()
    elif a.cmd == "menu-click":
        r = menu_click(a.kind, a.ref)
    elif a.cmd == "inject":
        r = inject(a.ev)
    print(json.dumps(r, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    try:
        _cli(sys.argv[1:])
    except QAError as e:
        print("ambient-qa: %s" % e, file=sys.stderr)
        sys.exit(1)
