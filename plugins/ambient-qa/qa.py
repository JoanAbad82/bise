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
import shutil
import signal
import socket
import subprocess
import sys
import tempfile
import time

HERE = os.path.dirname(os.path.abspath(__file__))
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


QA_DIR = os.environ.get("AMBIENT_QA_DIR") or os.path.join(dev_dir(), "qa")
APP_DIR = os.path.join(QA_DIR, "ambient")          # the QA app's own: app.pid, app.log, core.log, qa.sock
SOCK = os.path.join(APP_DIR, "qa.sock")
RUN = os.path.join(QA_DIR, "run.json")
HUB = os.path.join(QA_DIR, "hub.json")
OUT = os.environ.get("AMBIENT_QA_OUT") or os.path.join(QA_DIR, "out")


class QAError(Exception):
    pass


# ---------------------------------------------------------------- the bise

def find_bise(explicit=None):
    """A bise with `ambient-core`: --bise, $AMBIENT_QA_BISE, the repo's own
    debug build, else the newest debug build among this hub's worktrees."""
    for c in (explicit, os.environ.get("AMBIENT_QA_BISE"), os.path.join(REPO, "rust", "target", "debug", "bise")):
        if c and os.path.isfile(c) and os.access(c, os.X_OK):
            return os.path.abspath(c)
    roots = set()
    wt = os.path.dirname(os.path.dirname(REPO))     # .../worktrees/<hub>/<task>/harness -> .../worktrees/<hub>
    if os.path.basename(os.path.dirname(wt)) == "worktrees":
        roots.add(wt)
    found = []
    for r in roots:
        for task in os.listdir(r):
            for rel in ("target/debug/bise", "harness/rust/target/debug/bise"):
                p = os.path.join(r, task, rel)
                if os.path.isfile(p) and os.path.isdir(os.path.join(r, task, "harness", "rust", "tui", "src", "ambient")):
                    found.append((os.path.getmtime(p), p))
    if found:
        return max(found)[1]
    raise QAError("no bise with ambient-core: pass bise=<exe> (a debug build of the ambient-app branch) or set AMBIENT_QA_BISE")


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

def hub_daemon(bise):
    """Runs detached (`qa.py _hub`): a throwaway hub with tests/e2e.py's
    scripted provider on a fresh git repo, until SIGTERM. Main answers
    "ack: <your words>"; `[[bash: ...]]` in what you say scripts it more."""
    sys.path.insert(0, os.path.join(REPO, "tests"))
    tmp = os.path.join(QA_DIR, "h")                 # short: the hub's sockets live under it
    os.makedirs(tmp, exist_ok=True)
    tempfile.tempdir = tmp
    import e2e  # noqa: E402
    e2e.EXE = bise
    E = e2e.Env()
    stop = {"now": False}

    def term(*_):
        stop["now"] = True
    signal.signal(signal.SIGTERM, term)
    signal.signal(signal.SIGINT, term)
    try:
        c = E.start_hub()
        c.wait_status("main", "idle", 90)
        info = {"pid": os.getpid(), "tmp": E.tmp, "ws": E.ws, "state": E.state, "bise": bise,
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


def _start_hub(bise):
    old = _read(HUB)
    if old and _pid_alive(old.get("pid")):
        return old
    os.makedirs(QA_DIR, exist_ok=True)
    log = open(os.path.join(QA_DIR, "hub.log"), "a")
    p = subprocess.Popen([sys.executable, "-u", os.path.abspath(__file__), "_hub", "--bise", bise],
                         stdin=subprocess.DEVNULL, stdout=log, stderr=log, start_new_session=True, cwd=REPO)
    t0 = time.time()
    while time.time() - t0 < 120:
        info = _read(HUB)
        if info and info.get("pid") == p.pid:
            return info
        if p.poll() is not None:
            raise QAError("the fake hub exited (%s): see %s" % (p.returncode, os.path.join(QA_DIR, "hub.log")))
        time.sleep(0.2)
    p.terminate()
    raise QAError("the fake hub didn't come up in 120 s: see %s" % os.path.join(QA_DIR, "hub.log"))


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
    return subprocess.run(args, capture_output=True, text=True, cwd=REPO, **kw)


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


def launch(hub="fake", workspace=None, bise=None, web=None, backdrop="dark", force_build=False, restart=False):
    if hub not in ("fake", "real"):
        raise QAError("hub: fake (a throwaway scripted hub) or real (your workspace, read-only)")
    up = alive()
    if up and not restart:
        run = _read(RUN) or {}
        if run.get("hub") == hub:
            return dict(run, already=True, pid=up.get("pid"))
    if up:
        stop(keep_hub=(hub == "fake"))
    bise = find_bise(bise)
    app = app_path(force_build)
    web = web or os.environ.get("BISE_AMBIENT_WEB") or WEB
    env = {"PATH": os.environ.get("PATH", "/usr/bin:/bin")}
    if hub == "fake":
        info = _start_hub(bise)
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
    args = ["open", "-n", "-a", app, "--args", "--qa", hub, "--workspace", ws, "--bise", bise,
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
    call("backdrop", kind=backdrop)
    hub_up = _wait_hub(30)
    run = {"hub": hub, "workspace": ws, "bise": bise, "web": web, "app": app, "pid": ping.get("pid"),
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


def state():
    return call("state")


def events(n=50, levels=False):
    return call("events", n=n, levels=levels)


def reset():
    return call("reset")


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


def scenes(only=None, backdrops=("dark",), out=None, at=None, what="both", cols=4):
    """Play every scene (or `only`) in the real app, shoot each state, and
    make a contact sheet per backdrop (the panels) plus one of the screens."""
    if not alive():
        raise QAError("the QA app isn't running: launch() first")
    if isinstance(only, str):
        only = [s for s in only.split(",") if s]
    if isinstance(backdrops, str):
        backdrops = [b for b in backdrops.split(",") if b]
    sc, respond = all_scenes()
    if only:
        missing = set(only) - {s["id"] for s in sc}
        if missing:
            raise QAError("no scene %s; there are: %s" % (", ".join(sorted(missing)), ", ".join(s["id"] for s in sc)))
        sc = [s for s in sc if s["id"] in only]
    run = out or os.path.join(OUT, time.strftime("scenes-%Y%m%d-%H%M%S"))
    os.makedirs(run, exist_ok=True)
    result = {"dir": run, "scenes": [], "sheets": []}
    for bd in backdrops:
        tiles, screens = [], []
        for s in sc:
            times = at or shot_times(s["events"])
            shots = [{"at": t, "what": what, "label": "%s @%.1fs" % (s["id"], t / 1000)} for t in times]
            prefix = "%s.%s" % (s["id"], bd)
            r = call("play", timeout=120, events=s["events"], shots=shots, respond=respond, dir=os.path.join(run, bd),
                     prefix=prefix, backdrop=bd, tail_ms=300)
            for sh in r.get("shots", []):
                label = "%s · %s @%.1fs" % (s["id"], s["label"], sh["at_ms"] / 1000)
                if sh.get("panel"):
                    tiles.append({"path": sh["panel"], "label": label})
                if sh.get("screen"):
                    screens.append({"path": sh["screen"], "label": label})
            result["scenes"].append({"id": s["id"], "spec": s["spec"], "label": s["label"], "backdrop": bd, "shots": r.get("shots", [])})
        if tiles:
            p = os.path.join(run, "sheet.%s.png" % bd)
            call("sheet", items=tiles, out=p, cols=cols, title="bise ambient · SPEC §2 states · %s backdrop · panel" % bd, timeout=120)
            result["sheets"].append(p)
        if screens:
            p = os.path.join(run, "sheet.%s.screen.png" % bd)
            call("sheet", items=screens, out=p, cols=cols, tile_w=420, title="bise ambient · %s backdrop · screen" % bd, timeout=120)
            result["sheets"].append(p)
    reset()
    with open(os.path.join(run, "index.json"), "w") as f:
        json.dump(result, f, indent=1)
    return result


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
    p = sub.add_parser("launch"); p.add_argument("--hub", default="fake"); p.add_argument("--workspace"); p.add_argument("--bise")
    p.add_argument("--web"); p.add_argument("--backdrop", default="dark"); p.add_argument("--force-build", action="store_true"); p.add_argument("--restart", action="store_true")
    p = sub.add_parser("stop"); p.add_argument("--keep-hub", action="store_true")
    p = sub.add_parser("scenes"); p.add_argument("--only"); p.add_argument("--backdrops", default="dark"); p.add_argument("--out"); p.add_argument("--what", default="both")
    p = sub.add_parser("list")
    p = sub.add_parser("say"); p.add_argument("text"); p.add_argument("--no-wait", action="store_true")
    p = sub.add_parser("snapshot"); p.add_argument("--what", default="both"); p.add_argument("--backdrop"); p.add_argument("--name"); p.add_argument("--out")
    sub.add_parser("state"); sub.add_parser("reset"); sub.add_parser("ping")
    p = sub.add_parser("events"); p.add_argument("n", nargs="?", type=int, default=40); p.add_argument("--levels", action="store_true")
    p = sub.add_parser("fn"); p.add_argument("state"); p.add_argument("--key", default="fn")
    p = sub.add_parser("key"); p.add_argument("k")
    p = sub.add_parser("inject"); p.add_argument("ev")
    p = sub.add_parser("_hub"); p.add_argument("--bise", required=True)
    a = ap.parse_args(argv)
    if a.cmd == "_hub":
        return hub_daemon(a.bise)
    if a.cmd == "launch":
        r = launch(a.hub, a.workspace, a.bise, a.web, a.backdrop, a.force_build, a.restart)
    elif a.cmd == "stop":
        r = stop(a.keep_hub)
    elif a.cmd == "scenes":
        r = scenes(a.only, a.backdrops, a.out, what=a.what)
        r = {"dir": r["dir"], "sheets": r["sheets"], "scenes": len(r["scenes"])}
    elif a.cmd == "list":
        sc, _ = all_scenes()
        r = [{"id": s["id"], "spec": s["spec"], "label": s["label"]} for s in sc]
    elif a.cmd == "say":
        r = say(a.text, wait_answer=not a.no_wait)
    elif a.cmd == "snapshot":
        r = snapshot(a.what, a.backdrop, a.name, a.out)
    elif a.cmd == "state":
        r = state()
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
