"""ambient-qa: a fake computer-use world for the real-core checks (amb-core's L19 plan, the QA seam;
ambient-lead m_16678, qa-flows' thread/computer-use). No browser, no broker, no helper, never his
computer use: two things under the world's own run dir (<world home>/.bise/run, what the world's
hubs, the app's real core and the TUI all read through bise_computer_use::paths::Paths::from_env):

  - state.json (<run>/computer-use/state.json), in the broker's shape (state::render: {v: 2,
    agents: {<key>: {driving, where, since_ms, paused, stopped, was?, stopped_by?, name, hub}},
    browsers, apps}), rewritten whole through a tmp file and a rename, under a flock on
    state.json.lock (the lock bise_computer_use::state::update takes on main since 71ae8540);
  - the commands' socket (<run>/computer-use-ctl.sock, or its short path under /tmp/bise-<uid>
    when that is too long: bise_home::socket), served by a small daemon that answers the ctl ops
    the core sends for the window's acts as the broker does (broker/ctl.rs): pause (take the
    wheel; not_found when it drives nothing), resume (hand back: clears paused and stopped), stop
    (was = what it drove, stopped_by = you), peek (a canned 320x200 PNG still: a page with a tab
    bar, a title, a picture and a button). Each op changes state.json as the broker would, so the
    window's line moves only when the rows do. Every call goes to fake-ctl.jsonl.

  qa.py world computer <project> <agent> driving|paused|stopped|none [place]
      one agent's row ('Chrome · amazon.fr': drives Chrome on amazon.fr; 'Notes': the app Notes);
      starts the daemon if it isn't up. Returns {key, agent: the row or null}.
  qa.py world computer-log
      every ctl call so far, JSON: [{act, agent, key, args, ok}] (agent = the name, as the hub's).

An agent's key is the broker's: <hub id>.<agent dir> (bise_peer::tags::agent_key), the hub id
being FNV-1a of the project's hub socket path as clients reach it (bise_peer::tags::hub_id of
bise_home::socket::socket_path(<hub dir>/hub.sock): the core's peer_hub, the hub's proc_hub), so
the core gives the row that project and that agent, and the TUI on that hub shows it. `world down`
stops the daemon. The pure parts (fnv1a, socket_path, agent_key, row, step) are tested in
tests/ambient_qa_test.py; the daemon only runs them.
"""
import fcntl
import json
import os
import signal
import socket
import socketserver
import subprocess
import sys
import threading
import time

SOCKET_PATH_MAX = 103   # macOS sun_path is 104 bytes, NUL included (bise_home::socket)
STATES = ("driving", "paused", "stopped", "none")

STILL = {
    "mime": "image/png", "width": 320, "height": 200,
    "data": (
        "iVBORw0KGgoAAAANSUhEUgAAAUAAAADICAIAAAAWZq/8AAACtklEQVR42u3aMQ2AMBRF0cpBRGfkMKOkM3JQgIYOKGBiY25CSPrpuXkK2pztp1"
        "pPMwu65AnMADYzgM0MYDOAzQxgMwPYzAA2A9jMADYzgM0ANjOAzQxgMwPYDGAzA9jMADYzgM0ANjOAzQxgM4DNLBTgS1LYAJYAlgSwJIAlgCUB"
        "LAlgSQBLAEsCWBLAEsCSAJYEsCSAJYBby3k2e4YWwAawADaAAQbYAAbYABbABrAANoABBtgABtgAFsAGMMAAG8AAG8AC2AAWwAYwwAAbwAAbwO"
        "oLsCSAJQEsASwJYEkASwJYAlgSwJIAlgCWBLAkgCUBLAEsCWBJ/QI+1mwf7c2/lLJZhwMYYIABBhhgAxhggA1gAxhggAEGGGCAATaADWADGGAJ"
        "YIAFMMAAC2ADWAADLIABBlgAG8AC2AAWwAALYIABFsDmlHKc80aADWCAAQYYYIABBhhggA1ggAEGGGCAAQbYAAYYYIABNoccAhhgAQwwwALYAB"
        "bABrAABlgAAwywADaABTDAEsAAC2CAARbABrAABlgAAwywADaABTDAEsAAC2CAARbABrAABlgAAwywACYNYAFsAAtggAUwwAALYANYAAMsAQyw"
        "AAYYYAFsAAtggAUwwAALYANYABvAAhhgAQwwwALYABbAAEsAAyyAAQZYABvAAhhgAQzwvwBPyz7UAAYYYIABNoABBtgABhhggAEGGGCAAQbYAA"
        "YYYIABBhhggAEGGGCAAQbYAAYYYIABBhhggAEG2AAGGGCAAQYYYIABBhhggAEG2AAGGGCAAQYYYIABHhuwJIAlASwBLAlgSQBLAlgCWBLAkgCW"
        "AJYEsCSAJQEsASwJYEkASwJYAlgSwJIAlgCWBLAkgCUBLAEsCWBJAEsCWAJYEsCSAJYAlgSwJIAlASwBLAlgSQBLAEsK2g0R4xKcXP8QJwAAAA"
        "BJRU5ErkJggg=="),
}


# ---------------------------------------------------------------- pure

def fnv1a(s):
    """FNV-1a 64 over the string's UTF-8 bytes, as 16 hex (bise_home::socket, bise_peer::tags::hub_id). Pure."""
    h = 0xcbf29ce484222325
    for b in s.encode("utf-8"):
        h = ((h ^ b) * 0x100000001b3) & 0xffffffffffffffff
    return "%016x" % h


def socket_path(natural, uid=None):
    """Where a socket whose natural place is `natural` is bound and reached (bise_home::socket::socket_path). Pure."""
    if len(natural.encode("utf-8")) <= SOCKET_PATH_MAX:
        return natural
    uid = os.getuid() if uid is None else uid
    return os.path.join("/tmp/bise-%d" % uid, fnv1a(os.path.dirname(natural)), os.path.basename(natural))


def hub_id(hub_dir, uid=None):
    """A project's hub id in the agents' tags: FNV-1a of its hub socket as clients reach it. Pure."""
    return fnv1a(socket_path(os.path.join(hub_dir, "hub.sock"), uid))


def agent_key(hub, d):
    """bise_peer::tags::agent_key: <hub>.<dir>, the dir kept to [A-Za-z0-9_-]. Pure."""
    return "%s.%s" % (hub, "".join(c if (c.isascii() and c.isalnum()) or c in "-_" else "_" for c in d))


def name_of(key):
    """An agent key's name (bise_computer_use::who::split): the dir after a 16-hex hub. Pure."""
    hub, _, d = key.partition(".")
    return d if len(hub) == 16 and d and all(c in "0123456789abcdefABCDEF" for c in hub) else key


def row(key, state, place, now_ms):
    """state.json's row for that agent in that state (None: holds nothing, no row), in the broker's
    shape (state::Agent::json + name/hub). `place` 'Chrome · amazon.fr' = drives Chrome on
    amazon.fr; 'Notes' = the app Notes (its own place). Pure."""
    if state not in STATES:
        raise ValueError("state is one of %s, not %r" % ("|".join(STATES), state))
    if state == "none":
        return None
    app, _, where = (place or "Chrome · example.com").partition(" · ")
    where = where or app
    hub, name = key.partition(".")[0], name_of(key)
    out = {"driving": app, "where": where, "since_ms": now_ms, "paused": state == "paused", "stopped": False,
           "name": name, "hub": hub if name != key else None}
    if state == "stopped":
        out.update(driving=None, since_ms=None, stopped=True, was=app, stopped_by="you")
    return out


def render(agents):
    """The whole file for these rows (state::render). Pure."""
    return {"v": 2, "agents": dict(agents), "browsers": [], "apps": {}}


def step(agents, op, args, now_ms):
    """The broker's answer to one ctl op on these rows, and the rows after it (broker/ctl.rs:
    pause_agent, resume_agent, stop_agent, peek). Returns (reply, rows): reply is
    {"ok": True, "result": ...} or {"ok": False, "error": {code, message}}. Pure."""
    rows = {k: dict(v) for k, v in agents.items()}
    key = args.get("agent") if isinstance(args.get("agent"), str) else ""

    def err(code, message):
        return {"ok": False, "error": {"code": code, "message": message}}, rows
    if op in ("stop", "resume", "pause", "peek") and not key:
        return err("bad_args", "name an agent")
    a = rows.get(key)
    driving = bool(a and a.get("driving"))
    if op == "pause":
        if not driving:
            return err("not_found", "%s drives nothing now" % name_of(key))
        a["paused"] = True
        return {"ok": True, "result": {"paused": key, "driving": a["driving"]}}, rows
    if op == "resume":
        if a:
            a.update(paused=False, stopped=False)
            a.pop("was", None)
            a.pop("stopped_by", None)
            if not a.get("driving"):
                del rows[key]     # holds nothing now: dropped from the file (Agent::idle)
        return {"ok": True, "result": {"resumed": key}}, rows
    if op == "stop":
        was = (a or {}).get("driving") or (a or {}).get("was")
        b = a or {"where": None, "paused": False, "name": name_of(key), "hub": key.partition(".")[0] if name_of(key) != key else None}
        b.update(driving=None, since_ms=None, stopped=True, stopped_by="you")
        if was:
            b["was"] = was
        rows[key] = b
        return {"ok": True, "result": {"stopped": [key]}}, rows
    if op == "peek":
        if not driving:
            return err("not_found", "%s drives nothing now" % name_of(key))
        res = dict(STILL, target="tab:1", at_ms=now_ms)
        if a.get("where") and a["where"] != a["driving"]:
            res["url"] = "https://%s/" % a["where"]
        return {"ok": True, "result": res}, rows
    if op == "status":
        return {"ok": True, "result": render(rows)}, rows
    return err("bad_args", "unknown command")


# ---------------------------------------------------------------- files

def files(run):
    d = os.path.join(run, "computer-use")
    return {"dir": d, "state": os.path.join(d, "state.json"), "lock": os.path.join(d, "state.json.lock"),
            "log": os.path.join(d, "fake-ctl.jsonl"), "pid": os.path.join(d, "fake-ctl.pid"),
            "sock": socket_path(os.path.join(run, "computer-use-ctl.sock"))}


def update(run, f):
    """Read the rows, f(rows) -> (out, rows), write them, under the state.json flock. Returns out."""
    F = files(run)
    os.makedirs(F["dir"], mode=0o700, exist_ok=True)
    with open(F["lock"], "a") as lk:
        fcntl.flock(lk, fcntl.LOCK_EX)
        try:
            with open(F["state"]) as fh:
                rows = (json.load(fh) or {}).get("agents") or {}
        except (OSError, ValueError):
            rows = {}
        out, rows = f(rows)
        tmp = "%s.tmp-%d-%d" % (F["state"], os.getpid(), threading.get_ident())
        with open(tmp, "w") as fh:
            json.dump(render(rows), fh)
        os.replace(tmp, F["state"])
        return out


def answers(sock):
    s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    s.settimeout(1)
    try:
        s.connect(sock)
        return True
    except OSError:
        return False
    finally:
        s.close()


def _prepare(run):
    """The short link to the run dir when the natural socket path does not fit (prepare_socket)."""
    natural = os.path.join(run, "computer-use-ctl.sock")
    at = socket_path(natural)
    if at != natural:
        link = os.path.dirname(at)
        os.makedirs(os.path.dirname(link), mode=0o700, exist_ok=True)
        if not (os.path.islink(link) and os.readlink(link) == run):
            if os.path.lexists(link):
                os.unlink(link)
            os.symlink(run, link)
    return at


# ---------------------------------------------------------------- the daemon

def serve(run):
    """The fake broker's commands' socket, until SIGTERM (`qa.py _cu --run <run>`)."""
    F = files(run)
    os.makedirs(F["dir"], mode=0o700, exist_ok=True)
    sock = _prepare(run)
    if answers(sock):
        raise SystemExit("a computer-use broker already answers on %s" % sock)
    if os.path.lexists(sock):
        os.unlink(sock)
    log_lock = threading.Lock()

    class H(socketserver.StreamRequestHandler):
        def handle(self):
            hello = None
            for raw in self.rfile:
                try:
                    req = json.loads(raw)
                except ValueError:
                    continue
                if hello is None:
                    hello = req.get("op") == "hello" and req.get("role") == "ctl"
                    if not hello:
                        self.wfile.write((json.dumps({"ok": False, "error": {"code": "refused", "message": "this socket takes commands only"}}) + "\n").encode())
                        return
                    continue
                op = req.get("op") or ""
                args = req.get("args") if isinstance(req.get("args"), dict) else {}
                reply = update(run, lambda rows: step(rows, op, args, int(time.time() * 1000)))
                key = args.get("agent") or ""
                with log_lock, open(F["log"], "a") as fh:
                    fh.write(json.dumps({"act": op, "agent": name_of(key), "key": key, "args": args, "ok": reply["ok"],
                                         "at_ms": int(time.time() * 1000)}) + "\n")
                self.wfile.write((json.dumps(dict(reply, id=req.get("id"))) + "\n").encode())
                self.wfile.flush()

    class S(socketserver.ThreadingMixIn, socketserver.UnixStreamServer):
        daemon_threads = True

    srv = S(sock, H)
    with open(F["pid"], "w") as fh:
        fh.write(str(os.getpid()))

    def bye(*_):
        threading.Thread(target=srv.shutdown, daemon=True).start()
    signal.signal(signal.SIGTERM, bye)
    try:
        srv.serve_forever()
    finally:
        srv.server_close()
        for p in (sock, F["pid"]):
            try:
                os.unlink(p)
            except OSError:
                pass


def ensure(run, qa_py, timeout=10):
    """The daemon up on that run dir (started detached when its socket doesn't answer)."""
    F = files(run)
    if answers(F["sock"]):
        return
    os.makedirs(F["dir"], mode=0o700, exist_ok=True)
    with open(os.path.join(F["dir"], "fake-ctl.out"), "a") as out:
        subprocess.Popen([sys.executable, "-B", qa_py, "_cu", "--run", run], stdin=subprocess.DEVNULL, stdout=out, stderr=out,
                         start_new_session=True, close_fds=True)
    t0 = time.time()
    while not answers(F["sock"]):
        if time.time() - t0 > timeout:
            raise RuntimeError("the fake computer-use daemon didn't come up on %s (see %s/fake-ctl.out)" % (F["sock"], F["dir"]))
        time.sleep(0.05)


def stop(run):
    """The daemon down (world down); its socket, pid and state.json gone. Returns its pid or None."""
    F = files(run)
    try:
        pid = int(open(F["pid"]).read().strip())
    except (OSError, ValueError):
        pid = None
    if pid:
        try:
            os.kill(pid, signal.SIGTERM)
        except OSError:
            pass
        t0 = time.time()
        while time.time() - t0 < 5:
            try:
                os.waitpid(pid, os.WNOHANG)   # reaped when this process started it (a test), else ECHILD
            except ChildProcessError:
                pass
            try:
                os.kill(pid, 0)
            except OSError:
                break
            time.sleep(0.05)
    for p in (F["sock"], F["pid"], F["state"]):
        try:
            os.unlink(p)
        except OSError:
            pass
    return pid


def set_agent(run, key, state, place):
    """One agent's row in state.json (None: no row). Returns the row."""
    r = row(key, state, place, int(time.time() * 1000))

    def f(rows):
        rows = dict(rows)
        if r is None:
            rows.pop(key, None)
        else:
            rows[key] = r
        return r, rows
    return update(run, f)


def calls(run):
    """Every ctl call so far, in order."""
    try:
        with open(files(run)["log"]) as fh:
            return [json.loads(l) for l in fh if l.strip()]
    except OSError:
        return []
