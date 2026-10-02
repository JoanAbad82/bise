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
    if _is_exe(last.get("bise")) and last.get("app_root") and os.path.exists(os.path.join(last["app_root"], "repl-live")):
        return last["bise"], last["app_root"]
    own = os.path.join(REPO, "rust", "target", "debug", "bise")
    if _is_exe(own) and app_root_of(own):
        return own, app_root_of(own)
    found = []
    wt = os.path.dirname(os.path.dirname(REPO))     # .../worktrees/<hub>/<task>/harness -> .../worktrees/<hub>
    if os.path.basename(os.path.dirname(wt)) == "worktrees":
        for task in os.listdir(wt):
            for rel in ("target/debug/bise", "harness/rust/target/debug/bise"):
                p = os.path.join(wt, task, rel)
                if _is_exe(p) and os.path.isdir(os.path.join(wt, task, "harness", "rust", "tui", "src", "ambient")):
                    root = app_root_of(p)
                    if root:
                        found.append((os.path.getmtime(p), p, root))
    if found:
        # the tree closest to ambient-app's tip (fewest of its commits missing), then the newest build
        _, _, p, root = min((behind(root), -mt, p, root) for mt, p, root in found)
        return p, root
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


def hub_daemon(bise, kind="fake", connectors=False, computer=False, user_ask="", keep=False, reuse=None):
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
        empty = os.path.join(E.tmp, "no-user-plugins")
        os.makedirs(empty, exist_ok=True)
        E.env["BEND_PLUGINS_HOME"] = empty
        # the fake accounts in their place: canned Gmail, Slack, Linear and
        # calendar items as workspace plugins; their writes go to the outbox
        install_fake_accounts(E.ws)
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
        E.hub = subprocess.Popen([bise, "sbd", "--workspace", E.ws], cwd=e2e.ROOT, env=E.env,
                                 stdin=subprocess.DEVNULL, stdout=err, stderr=err)
        sock = os.path.join(E.state, "hub.sock")
        t0 = time.time()
        limit = 60 * e2e.load_factor()
        while not os.path.exists(sock):
            if E.hub.poll() is not None or time.time() - t0 > limit:
                tail = open(err_path, errors="replace").read()[-3000:]
                raise RuntimeError("the hub did not start in %.0f s (exit %s); its stderr:\n%s" % (limit, E.hub.poll(), tail))
            time.sleep(0.1)
        c = e2e.Client(sock)
        c.wait_status("main", "idle", 120)
        info = {"pid": os.getpid(), "kind": kind, "connectors": bool(connectors), "computer": bool(computer), "approved_by_user": user_ask or None, "tmp": E.tmp, "ws": E.ws, "state": E.state, "bise": bise,
                "sets": os.environ.get("AMBIENT_QA_SET") or "", "keep": bool(keep), "reused": bool(reuse),
                "env": {k: E.env[k] for k in ("SB_STATE_DIR",)}}
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
FAKE_SERVICES = ("gmail", "slack", "linear", "calendar", "github", "hn", "reddit", "x", "bluesky", "kit", "granola")
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


def install_fake_accounts(ws):
    """One workspace plugin per fake service in <ws>/.agents/plugins (out of
    the throwaway repo's git): tools.gmail.*, tools.slack.*, tools.linear.*,
    tools.calendar.*, tools.github.*, tools.hn.* over fake-accounts/fixtures.json."""
    root = os.path.join(ws, ".agents", "plugins")
    for svc in FAKE_SERVICES:
        d = os.path.join(root, svc)
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "plugin.json"), "w") as f:
            json.dump({"$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json", "name": svc, "version": "0.1.0",
                       "description": "%s for this workspace: a fake QA account with fixture data (Camille at acme); writes go to a QA outbox" % svc}, f, indent=1)
        with open(os.path.join(d, "mcp.json"), "w") as f:
            json.dump({"$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
                       "mcpServers": {FAKE_SERVER_NAMES.get(svc, svc): {"type": "stdio", "command": "python3", "args": ["-B", os.path.join(FAKE_ACCOUNTS, "fake_accounts.py"), svc]}}}, f, indent=1)
    ex = os.path.join(ws, ".git", "info", "exclude")
    if os.path.isdir(os.path.dirname(ex)):
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


def _start_hub(bise, root, kind="fake", connectors=False, computer=False, user_ask="", keep=False, reuse=None, sets=""):
    old = _read(HUB)
    if old and _pid_alive(old.get("pid")):
        same = (old.get("kind", "fake"), old.get("bise"), bool(old.get("connectors")), bool(old.get("computer")), old.get("sets", "")) == (kind, bise, bool(connectors), bool(computer), sets)
        if same and not keep and not reuse:
            return old
        _stop_hub()
    os.makedirs(QA_DIR, exist_ok=True)
    log = open(os.path.join(QA_DIR, "hub.log"), "a")
    # never the calling agent's hub identity (e2e.host_env drops it for the hub; the daemon too)
    env = {k: v for k, v in os.environ.items() if not k.startswith("SB_") and k not in ("BISE_ROLE", "BISE_EXPORTS_FOR")}
    env["BISE_APP_ROOT"] = root    # e2e.Env passes it on to the hub: its repl-live
    env["AMBIENT_QA_DIR"] = QA_DIR  # without SB_AGENT the daemon would pick another QA dir
    env["AMBIENT_QA_SET"] = sets
    p = subprocess.Popen([sys.executable, "-u", os.path.realpath(__file__), "_hub", "--bise", bise, "--kind", kind]
                         + (["--keep"] if keep else []) + (["--reuse", reuse] if reuse else [])
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


def _stop_hub():
    info = _read(HUB)
    if not info or not _pid_alive(info.get("pid")):
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
    """The one app path, built by scripts/ambient.sh when its sources changed
    (which stops the user's running app: refused unless force_build)."""
    st = _sh(["scripts/ambient.sh", "status"]).stdout
    running = st.startswith("running")
    keys = st.split("built key ", 1)[-1].strip().split(", sources key ")
    stale = len(keys) != 2 or keys[0] != keys[1]
    if running and stale and not force_build:
        raise QAError("the app's sources changed and your ambient app is running: building stops it. "
                      "launch(force_build=true) to rebuild anyway (ask the user first)")
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
            port = int(_wait(lambda: open(os.path.join(info["state"], "pages.port")).read().strip(), 30, "the page server"))
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
    c = e2e.Client(os.path.join(info["state"], "hub.sock"))
    return c, info


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
    port = int(open(os.path.join(info["state"], "pages.port")).read().strip())
    return {"id": id, "version": page.get("version"), "url": page.get("url"), "port": port, "pages_url": "http://127.0.0.1:%d/" % port}


def page_notes(id, notes, send=False):
    """Draft notes on a page through its own API (the token from the page's
    shell, the server's origin), as notes.js would; `send` sends them to
    the page's agent. A note: {block, kind: note|keep|drop|unsure|edit|voice|pin,
    quote?, text?, before?, after?}."""
    _, info = _hub()
    port = int(open(os.path.join(info["state"], "pages.port")).read().strip())
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
    port = int(open(os.path.join(info["state"], "pages.port")).read().strip())
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
        port = int(open(os.path.join(info["state"], "pages.port")).read().strip())
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
    "feedback": {"ask": "Benjamin's bug reports in #acme-feedback: handle them so adoption is easy", "no_send": True, "notes": False, "flow": "feedback"},
    # roadmap D (amb-core 527fa441): a step-by-step plan, bise ticks its own, a card per step of his when its turn comes
    "checklist": {"ask": "check my mail and give me a step by step to buy the domain", "no_send": True, "notes": False, "flow": "checklist"},
    # roadmap E (amb-kit m_5643): a seeded night (a PR done, a question card, unsent replies,
    # his domain steps, the launch watch), then the morning page from it; nothing leaves
    "morning": {"ask": "make today's morning page", "no_send": True, "no_writes": True, "notes": False,
                "set": "today", "seed": "morning", "flow": "morning"},
    # meetings (amb-kit m_5656): real time, about 75 min: the briefs before the renewal (+15 min)
    # and the sync (+60), the renewal's follow-ups after Granola's notes (+47); no card, nothing leaves
    "meetings": {"ask": "brief me before my meetings today, and do the follow-ups after", "no_send": True, "no_writes": True,
                 "notes": False, "set": "today", "flow": "meetings", "timed": True},
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
        text = " ".join(c.lines(a["name"])[:40]).lower()
        briefs[a["name"]] = [k for k, w in words.items() if w in text]
    r["flow"] = {"items": items, "started": [a["name"] for a in agents], "briefs": briefs}
    if agents and not all(briefs.values()):
        r["fails"].append("an agent's brief doesn't name its report: %s" % briefs)
    # the items show their agents (data-agent) once the page republishes
    took = _until(x, lambda: page_meta(pid)["versions"][-1]["n"] > x["last"]["n"]
                  and _body(x, page_meta(pid)["versions"][-1]["n"]).count("data-agent=") >= 2, "the items showing their agents (data-agent)")
    r["t"]["items_show_agents"] = took


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
    for k in range(len(yours)):
        took = _until(x, lambda: step_card() is not None, "the card for his step %d" % (k + 1))
        if took is None:
            return
        cd = step_card()
        item, block = cd["page"]["item"], cd["page"]["block"]
        r["flow"]["cards"].append({"item": item, "text": cd.get("text"), "after": took})
        if k % 2 == 0:
            page_notes(pid, [{"block": block, "item": item, "kind": "tick"}], send=False)   # a tick on the page, even a draft
            r["flow"]["closed_by"].append("tick note")
        else:
            x["core"].p.stdin.write(json.dumps({"cmd": "answer", "card": cd["id"], "reply": "1"}) + "\n")
            x["core"].p.stdin.flush()
            r["flow"]["closed_by"].append("card answer")
        if _until(x, lambda: all((d.get("page") or {}).get("item") != item for d in c.cards()), "the card of %s closing" % item) is None:
            return
    _until(x, lambda: x["settled"]() and not step_card(), "no step card left")
    meta = page_meta(pid)
    ticks = {(n["block"], n.get("item")) for n in meta.get("notes", []) if n.get("kind") == "tick"}
    final = _rows(_body(x, meta["versions"][-1]["n"]))
    left = [w["item"] for w in final if not w["done"] and (w["block"], w["item"]) not in ticks]
    r["flow"]["left"] = left
    if left:
        r["fails"].append("steps neither done nor ticked: %s" % ", ".join(left))


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
        out.append({"kit": k.group(1) if k else "", "id": i.group(1) if i else "", "html": s.group(2)})
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


def meeting_brief_check(body, page_id):
    """meetings.md's brief (v1): its id, who (Hélène from people.md), last
    time linked, what is open as a checklist, three questions. (facts, fails)"""
    fails, secs = [], _sections(body)
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
    if not any(w["yours"] for w in rows):
        fails.append("%s v2: no row of his (data-who=\"yours\") in who does what" % page_id)
    drafts = [s["kit"] for s in secs if s["kit"] in ("email", "message")]
    if not drafts:
        fails.append("%s v2: no follow-up draft (an email or message block)" % page_id)
    said = {"3-year": ("3-year", "3 year", "three-year", "three year", "36 month"), "SSO": ("sso",), "45 seats": ("45",)}
    missing = [k for k, ws in said.items() if not any(w in low for w in ws)]
    if missing:
        fails.append("%s v2: Granola's decisions missing: %s" % (page_id, ", ".join(missing)))
    return {"rows": len(rows), "yours": sum(w["yours"] for w in rows), "drafts": drafts, "decided": "decided" in low}, fails


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
    x["port"] = int(open(os.path.join(x["info"]["state"], "pages.port")).read().strip())
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
                b = _body(dict(x, page=p), m["v1_n"])
                m["brief"], fails = meeting_brief_check(b, p["id"])
                r["fails"].extend(fails)
                pages_seen[e] = p["id"]
            if e == "e401" and "v1_n" in m and "v2_at" not in m:
                meta = page_meta(m["id"])
                n = meta["versions"][-1]["n"]
                if n > m["v1_n"] and time.time() > when[e][1] and x["settled"]():
                    m.update(v2_at=round(time.time() - when[e][1]), v2_n=n)
                    m["followups"], fails = meeting_followup_check(_body(dict(x, page={"id": m["id"]}), n), m["id"])
                    r["fails"].extend(fails)
        done = all("v1_at" in r["flow"]["meetings"].get(e, {}) for e in MEETINGS_RUN) and "v2_at" in r["flow"]["meetings"]["e401"]
        if done:
            break
        time.sleep(5)
    for e in MEETINGS_RUN:
        m = r["flow"]["meetings"].get(e, {})
        if "v1_at" not in m:
            r["fails"].append("%s: no brief page by %s" % (e, time.strftime("%H:%M", time.localtime(when[e][0]))))
        elif m["v1_at"] > 0:
            r["fails"].append("%s: the brief came %d s after the start" % (e, m["v1_at"]))
    if "v1_at" in r["flow"]["meetings"].get("e401", {}) and "v2_at" not in r["flow"]["meetings"]["e401"]:
        r["fails"].append("e401: no follow-ups (v2) within 30 min of its end")
    about = [cd for cd in x["cards"].values() if any(w in json.dumps(cd).lower() for ws in MEETINGS_RUN.values() for w in ws + ("meeting", "brief"))]
    if about:
        r["fails"].append("%d card(s) about the meetings (the page is enough)" % len(about))


FLOWS = {"newsletter": _flow_newsletter, "feedback": _flow_feedback, "checklist": _flow_checklist, "morning": _flow_morning,
         "meetings": _flow_meetings}


def _covered(body, items):
    """Which comments a page body names (its id, as in amb-kit's data-id, or its author)."""
    low = (body or "").lower()
    hit = [c for c in items if str(c["id"]).lower() in low or c["author"].lower() in low]
    return {"found": len(hit), "of": len(items), "missing": ["%s on %s" % (c["author"], c["place"]) for c in items if c not in hit]}


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


def run_report(r):
    """One screen of text from a run's JSON."""
    s = lambda v: "-" if v is None else "%.1f s" % v
    L = ["%s  (%s, model hub, fake accounts)  %s" % (r["scenario"], "headless" if r["headless"] else "app", r["at"]),
         "ask: %s" % r["ask"]]
    tr = r.get("tree") or {}
    if tr:
        L.append("build: %s%s%s" % (tr.get("head", "")[:60], ", %s behind ambient-app (STALE: a fail may be the build)" % tr["behind_ambient_app"] if tr.get("behind_ambient_app") else ", at ambient-app's tip",
                                   ", has %s" % ",".join(tr["required"]) if tr.get("required") else ""))
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
    else:
        L.append("page: none in %s" % s(r["t"].get("end")))
    ob = r["outbox"]
    L.append("outbox: %d writes (%s), %d sends" % (len(ob["writes"]), ", ".join(sorted({w["service"] + "." + w["action"] for w in ob["writes"]})) or "none",
                                                   len(ob["sends"])))
    if r["cards"]:
        L.append("cards: " + "; ".join("#%s %s" % (c.get("id"), (c.get("text") or "")[:60]) for c in r["cards"]))
    L.append("verdict: " + ("pass" if not r["fails"] else "FAIL: " + "; ".join(r["fails"])))
    L.append("files: %s" % r["dir"])
    return "\n".join(L)


def run(scenario, headless=False, timeout=900, keep=False, out=None, require=None):
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
         "seeded": seeded}
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
                cards.setdefault(cd.get("id"), dict(cd, at=rel()))
            pages = [p for p in (c.state or {}).get("pages", []) if p["id"] not in before]
            return pages[0] if pages else None

        def settled():
            return all(a.get("status") in ("idle", "done", "blocked") for a in (c.state or {}).get("agents", []))

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
            port = int(open(os.path.join(info["state"], "pages.port")).read().strip())
            st, body = _http(port, "GET", "/p/%s/v/%d/body" % (page["id"], last["n"]))
            open(os.path.join(d, "v%d.body.html" % last["n"]), "w").write(body)
            if sc.get("flow") in FLOWS:
                # roadmap A, C, D: what the user does after v1, and what must follow
                FLOWS[sc["flow"]](dict(r=r, c=c, page=page, port=port, last=last, body=body, d=d, poll=poll, settled=settled, rel=rel,
                                       timeout=timeout, info=info, core=core, cards=cards))
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
            off = [cd for cd in r["cards"] if not _card_about(cd, need)]
            r["cards_off_ask"] = off
            if off:
                r["fails"].append("%d card(s) not about a comment that needs an answer" % len(off))
        if r["main_lines"] and r["main_lines"][0]["len"] > 120:
            r["fails"].append("main's capsule line is %d chars (one short line)" % r["main_lines"][0]["len"])
        if not keep:
            r["stopped"] = _stop_hub() if headless else stop()
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
                    times = list(range(int(a), int(b) + 1, max(30, int(every))))
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
    with open(os.path.join(run, "index.json"), "w") as f:
        json.dump(result, f, indent=1)
    return result


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

def _cli(argv):
    import argparse
    ap = argparse.ArgumentParser(prog="qa.py", description=__doc__.split("\n\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("launch"); p.add_argument("--hub", default="fake"); p.add_argument("--no-app", action="store_true", help="the throwaway hub, its page server and the fake accounts only: never builds or opens the app"); p.add_argument("--connectors", action="store_true", help="hub model: the user's REAL connectors (needs --real-accounts-approved-by-user)"); p.add_argument("--computer", action="store_true", help="the QA hub may load the computer plugin: the user's browser (needs --real-accounts-approved-by-user)"); p.add_argument("--real-accounts-approved-by-user", default="", metavar="MESSAGE_ID", help="the user's own message asking for this one run"); p.add_argument("--workspace"); p.add_argument("--bise")
    p.add_argument("--web"); p.add_argument("--backdrop", default="dark"); p.add_argument("--force-build", action="store_true"); p.add_argument("--restart", action="store_true")
    p = sub.add_parser("stop"); p.add_argument("--keep-hub", action="store_true")
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
    p = sub.add_parser("inject"); p.add_argument("ev")
    p = sub.add_parser("_hub"); p.add_argument("--bise", required=True); p.add_argument("--kind", default="fake"); p.add_argument("--connectors", action="store_true"); p.add_argument("--computer", action="store_true")
    p.add_argument("--real-accounts-approved-by-user", default=""); p.add_argument("--keep", action="store_true"); p.add_argument("--reuse")
    a = ap.parse_args(argv)
    if a.cmd == "_hub":
        return hub_daemon(a.bise, a.kind, a.connectors, a.computer, a.real_accounts_approved_by_user, a.keep, a.reuse)
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
        r = run(a.scenario, a.headless, a.timeout, a.keep, a.out, a.require)
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
    elif a.cmd == "inject":
        r = inject(a.ev)
    print(json.dumps(r, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    try:
        _cli(sys.argv[1:])
    except QAError as e:
        print("ambient-qa: %s" % e, file=sys.stderr)
        sys.exit(1)
