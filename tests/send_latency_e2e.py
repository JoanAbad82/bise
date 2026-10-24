#!/usr/bin/env python3
"""send-fast: his send, steer or queued message reaches its echo fast, and
the agent's REPL, on a loaded hub.

Gabriel, 2026-10-20, at load ~50: « sending, steering or queuing a message
should feel super fast AND be actually fast to process by the main process,
even under load ». His sends showed 'sending…' for minutes; hub.log had
`hub loop busy 90 s on sb drop` and many 1-5 s holds (Tick, land,
`sb tasks`, `sb history`, spawn).

A throwaway hub on a temp app root whose `repl-live` is
tests/fake_repl_flood.py: main and TASKS tasks, each in a turn that never
ends, writing FLOOD_RATE activity lines a second, each logging what the hub
sends it (FLOOD_RECV_LOG). While they run, and while agents do the slow
things his agents do (`sb tasks`, `sb history`, `sb list`, a spawn and a
drop with a worktree of FILES files), a client (the desktop's door,
hub.sock) sends SENDS messages: steers to busy agents and queued ones.
For each, from his send:
  - resp: turn/send's response (the composer's 'sending…' ends);
  - echo: his entry in the thread (thread/entry), or for a queued one its
    row in hub/agents' queued list (the drawer);
  - repl: the agent's REPL has it (a steer in its file, a say on its socket).
Printed as p50/p99/max. In the gate (architect m_35024: a strict 300 ms
p99 under whatever load the gate machine has would flake) it asserts what
is stable: no hub.log hold of 1 s or more on a state push, a Tick's idle
check or his own send, and each p99 under LIMIT_S (1 s). The 300 ms target
is measured on a release build under the heavy lock (SEND_LIMIT_S=0.3,
CARGO_TARGET_DIR at that build) and reported with the change.

SEND_BURN=N: N extra CPU burners (nice 10, like a gate's jobs) for the
run, to measure at a given load; the gate runs it at the load it has.

Run: python3 -u tests/send_latency_e2e.py  (needs a built bise)"""
import json
import os
import socket
import subprocess
import sys
import threading
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import wait  # noqa: E402
import e2e  # noqa: E402
from e2e import Env, ROOT, check, seed_tasks  # noqa: E402

TASKS = int(os.environ.get("SEND_TASKS", "30"))
SENDS = int(os.environ.get("SEND_COUNT", "60"))
FILES = int(os.environ.get("SEND_FILES", "8000"))
BURN = int(os.environ.get("SEND_BURN", "0"))
LIMIT_S = float(os.environ.get("SEND_LIMIT_S", "1.0"))
# under load (main m_38608: 3 reds in 12 gate runs at load 50-83, each green alone): the 1 s p99 and
# the 1 s hold scale by tests/wait.py's load factor (load per core, 1 to 4), as every e2e wait does;
# an explicit SEND_LIMIT_S (the 300 ms release-build measure) is never scaled. What it guards stays:
# his 90 s holds and minutes of 'sending...' are far past 4 s.
SCALE = "SEND_LIMIT_S" not in os.environ
HELD_S = 1.0
# the whole run's cap (one gate run hung 14219 s): SEND_MAX_S (600) times the load factor
MAX_S = float(os.environ.get("SEND_MAX_S", "600"))
# what may never hold the hub's loop 1 s (hub.log's held/busy lines)
NEVER_HELD = ("on state push", "on input Tick: idle check", "on client line")
# SEND_OUT: a file for each send's times (default: sends.json in the
# test's folder, kept with SB_KEEP=1)
# activity lines a second, each REPL: his 30 agents wrote 1.3 lines a
# second in all (his transcripts, 2026-10-20 13:40, one hour): 31 a second
# here, ~25 times his
RATE = int(os.environ.get("SEND_RATE", "1"))
# his hub's pages and artifacts (137 and 741 on 2026-10-20): the state
# push read them all from disk, the cause of his slow sends
PAGES = int(os.environ.get("SEND_PAGES", "40"))
ARTIFACTS = int(os.environ.get("SEND_ARTIFACTS", "200"))
PAGE = '<section data-kit="prose" data-id="p1"><p>page %d: what the agent found.</p></section>\n'


def app_root(tmp):
    """This tree's app root, its repl-live the flooding fake."""
    root = os.path.join(tmp, "app")
    os.makedirs(root)
    for name in os.listdir(ROOT):
        if name != "repl-live":
            os.symlink(os.path.join(ROOT, name), os.path.join(root, name))
    fake = os.path.join(root, "repl-live")
    with open(fake, "w") as f:
        f.write("#!/bin/sh\nexec %s -u %s\n" % (sys.executable, os.path.join(HERE, "fake_repl_flood.py")))
    os.chmod(fake, 0o755)
    return root


def started(state):
    d = os.path.join(state, "agents")
    return sum(1 for a in (os.listdir(d) if os.path.isdir(d) else [])
               if os.path.exists(os.path.join(d, a, "wire.log")) and os.path.getsize(os.path.join(d, a, "wire.log")) > 0)


class Door:
    """A hub.sock client that stamps each line it reads with its time."""

    def __init__(self, sock_path):
        self.s = socket.socket(socket.AF_UNIX)
        self.s.connect(sock_path)
        self.lock = threading.Lock()
        self.got = []  # (t, value)
        self.rid = 0
        threading.Thread(target=self._read, daemon=True).start()
        r = self.call("initialize", {"proto": e2e.PROTO, "client": {"name": "send_latency", "version": "0"}})
        self.project = r["result"]["project"]
        self.send({"jsonrpc": "2.0", "method": "initialized"})

    def _read(self):
        for line in self.s.makefile("r"):
            t = time.time()
            try:
                v = json.loads(line)
            except ValueError:
                continue
            with self.lock:
                self.got.append((t, v))

    def send(self, v):
        self.s.sendall((json.dumps(v) + "\n").encode())

    def request(self, method, params):
        self.rid += 1
        rid = "sl-%d" % self.rid
        self.send({"jsonrpc": "2.0", "id": rid, "method": method, "params": params})
        return rid

    def answered(self, rid):
        with self.lock:
            return next(((t, v) for t, v in self.got if v.get("id") == rid and "method" not in v), None)

    def call(self, method, params, timeout=60):
        rid = self.request(method, params)
        return wait.until(lambda: self.answered(rid), timeout, "the answer to %s" % method)[1]

    def first(self, pred):
        with self.lock:
            return next((t for t, v in self.got if pred(v)), None)


def entry_has(text):
    def pred(v):
        if v.get("method") != "thread/entry":
            return False
        e = (v.get("params") or {}).get("entry") or {}
        return e.get("kind") == "you" and text in (e.get("text") or "")
    return pred


def queued_has(agent, text):
    def pred(v):
        if v.get("method") != "hub/agents":
            return False
        for a in (v.get("params") or {}).get("agents", []):
            if a.get("name") == agent and any(text in (q.get("text") or "") for q in a.get("queued") or []):
                return True
        return False
    return pred


def held_s(line):
    """The seconds of a hub.log 'hub loop held|busy|free after N s on ...' line, or None. Pure."""
    import re
    m = re.search(r"hub loop (?:held|busy|free after) ([0-9.]+) s on ", line)
    return float(m.group(1)) if m else None


def bounds(lf, scale=True):
    """The p99 limit and the hold limit for load factor lf. Pure."""
    f = lf if scale else 1.0
    return LIMIT_S * f, HELD_S * f


def heard(log, text):
    """When the REPL's fake read `text` (FLOOD_RECV_LOG), in s."""
    try:
        for line in open(log, errors="replace"):
            ms, _, rest = line.partition("\t")
            if text in rest:
                return int(ms) / 1000.0
    except FileNotFoundError:
        pass
    return None


def sb(E, agent, *args, timeout=120):
    env = {**E.env, "SB_SOCKET": os.path.join(E.state, "agent.sock"), "SB_AGENT": agent}
    return subprocess.run([e2e.EXE, "sb", *args], env=env, cwd=E.ws, capture_output=True, text=True, timeout=timeout)


def seed_pages_and_artifacts(E, agent):
    """PAGES pages and ARTIFACTS artifacts, made the way an agent makes
    them (`sb page publish`, `sb artifact add`), a few at once."""
    from concurrent.futures import ThreadPoolExecutor
    out = os.path.join(E.ws, "out")
    os.makedirs(out, exist_ok=True)
    jobs = []
    for i in range(PAGES):
        f = os.path.join(E.tmp, "page-%d.html" % i)
        open(f, "w").write(PAGE % i)
        jobs.append(["page", "publish", f, "--id", "p%d" % i, "--title", "page %d" % i])
    for i in range(ARTIFACTS):
        open(os.path.join(out, "a%d.csv" % i), "w").write("n,%d\n" % i)
        jobs.append(["artifact", "add", "out/a%d.csv" % i, "--title", "artifact %d" % i])
    with ThreadPoolExecutor(6) as pool:
        done = list(pool.map(lambda a: sb(E, agent, *a), jobs))
    bad = [r.stdout + r.stderr for r in done if r.returncode != 0]
    check(not bad, "pages and artifacts made: %d failed, the first: %s" % (len(bad), bad[:1]))


def agents_work(E, names, stop):
    """What his agents do meanwhile: reads that cost the hub (`sb tasks`,
    `sb history`, `sb list`), each agent in turn."""
    i = 0
    while not stop.is_set():
        a = names[i % len(names)]
        for args in (["tasks"], ["history", "flood"], ["list"]):
            if stop.is_set():
                break
            sb(E, a, *args)
        i += 1


def stats(xs):
    xs = sorted(xs)
    if not xs:
        return "none"
    return "p50 %.0f ms, p99 %.0f ms, max %.0f ms (n=%d)" % (
        xs[len(xs) // 2] * 1000, xs[min(len(xs) - 1, int(len(xs) * 0.99))] * 1000, xs[-1] * 1000, len(xs))


def p99(xs):
    xs = sorted(xs)
    return xs[min(len(xs) - 1, int(len(xs) * 0.99))] if xs else float("inf")


def main():
    import signal

    def hung(*_):
        raise AssertionError("send_latency_e2e ran past %.0f s (SEND_MAX_S x the load factor): a hang" % (MAX_S * wait.load_factor()))
    signal.signal(signal.SIGALRM, hung)
    signal.alarm(int(MAX_S * wait.load_factor()))
    E = Env()
    burners = []
    stop = threading.Event()
    try:
        names = ["t%d" % i for i in range(TASKS)]
        seed_tasks(E.state, E.ws, names)
        # a workspace his size, a little: a drop's worktree costs
        e2e.sh(E.ws, "mkdir -p src && for i in $(seq 1 %d); do echo $i > src/f$i.txt; done && git add -A && git commit -qm files" % FILES)
        E.env["BISE_APP_ROOT"] = app_root(E.tmp)
        E.env["FLOOD_RATE"] = str(RATE)
        E.env["FLOOD_SECS"] = "900"
        recv = os.path.join(E.tmp, "recv")
        os.makedirs(recv)
        # one log per REPL: the fake reads its own name from its wire log's dir
        E.env["FLOOD_RECV_DIR"] = recv
        go = os.path.join(E.tmp, "flood-go")
        E.env["FLOOD_GO"] = go
        c = E.start_hub()
        wait.until(lambda: started(E.state) >= TASKS + 1, 180, "main and %d tasks started" % TASKS, poll=0.2)
        open(go, "w").close()
        for _ in range(BURN):
            burners.append(subprocess.Popen(["nice", "-n", "10", sys.executable, "-c", "while True: pass"]))
        if BURN:
            # the 1-min load average catches up before he sends
            time.sleep(float(os.environ.get("SEND_WARM_S", "60")))
        seed_pages_and_artifacts(E, names[-1])
        door = Door(os.path.join(E.state, "hub.sock"))
        for a in ["main"] + names[:3]:
            door.call("thread/subscribe", {"project": door.project, "agent": a})
        # a task with its own worktree, to drop while he sends
        r = sb(E, "main", "spawn", "wt", "--objective", "a worktree to drop", "--worktree")
        check(r.returncode == 0, "spawn wt: %s %s" % (r.stdout, r.stderr))
        work = threading.Thread(target=agents_work, args=(E, names[3:9], stop), daemon=True)
        work.start()
        if os.environ.get("SEND_SAMPLE"):
            # where the hub's time goes while he sends (macOS sample)
            subprocess.Popen(["/usr/bin/sample", str(E.hub.pid), "10", "1", "-file", os.environ["SEND_SAMPLE"]],
                             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        dropper = None
        sends = []
        for i in range(SENDS):
            if i == SENDS // 3:
                dropper = threading.Thread(target=sb, args=(E, "main", "drop", "wt"), daemon=True)
                dropper.start()
            to = ["main", "t0", "t1", "t2"][i % 4]
            queued = i % 3 == 2
            text = "his send %d to %s %s" % (i, to, "queued" if queued else "steer")
            t0 = time.time()
            rid = door.request("turn/send", {"project": door.project, "agent": to, "text": text,
                                             "mode": "queued" if queued else "now"})
            sends.append((t0, rid, to, queued, text))
            time.sleep(0.25)
        stop.set()
        # every send's three times (a send's answer, its echo, its REPL)
        def times(rid, to, queued, text):
            a = door.answered(rid)
            e = door.first(queued_has(to, text) if queued else entry_has(text))
            h = None if queued else heard(os.path.join(recv, to + ".log"), text)
            return a, e, h

        def all_in():
            return all((lambda a, e, h: a and e and (q or h))(*times(r, to, q, x)) for _, r, to, q, x in sends)
        try:
            wait.until(all_in, 60, "every send answered, echoed and at its REPL", poll=0.1)
        except AssertionError:
            pass  # said below, send by send
        resp, echo, repl, late, rows = [], [], [], [], []
        for t0, rid, to, queued, text in sends:
            a, e, h = times(rid, to, queued, text)
            if not a or not e or (not queued and not h):
                late.append((text, bool(a), bool(e), bool(h)))
                continue
            resp.append(a[0] - t0)
            echo.append(e - t0)
            if h:
                repl.append(h - t0)
            rows.append({"text": text, "t0": t0, "resp": a[0] - t0, "echo": e - t0, "repl": h and h - t0})
        # each send's times, for a look after (SB_KEEP=1 keeps the folder)
        with open(os.environ.get("SEND_OUT") or os.path.join(E.tmp, "sends.json"), "w") as f:
            json.dump({"load": os.getloadavg()[0], "sends": rows}, f)
        load = os.getloadavg()[0]
        print("load %.0f, %d tasks at %d lines/s each, %d pages, %d artifacts, %d sends (a drop at #%d)" % (load, TASKS, RATE, PAGES, ARTIFACTS, SENDS, SENDS // 3))
        print("send -> response: " + stats(resp))
        print("send -> echo:     " + stats(echo))
        print("send -> REPL:     " + stats(repl))
        busy = [l.strip() for l in open(os.path.join(E.state, "hub.log"), errors="replace") if "hub loop" in l]
        for l in busy[-12:]:
            print("  hub.log: " + l[:200])
        check(not late, "every send answered and echoed in 60 s: %r" % late[:5])
        lf = wait.load_factor()
        lim, hold = bounds(lf, SCALE)
        # the measured numbers on every run, green too (review-gates m_38613: with bounds up to 4x
        # looser on a loaded tip, a drift from 0.3 s to 2 s would pass silently; the audit reads this)
        never = [held_s(l) or 0 for l in busy if any(w in l for w in NEVER_HELD)]
        print("send_latency: load factor %.1f; p99 response %.3f s, echo %.3f s, REPL %.3f s (limit %.3f s); "
              "longest NEVER_HELD hold %.1f s (limit %.1f s)" % (lf, p99(resp), p99(echo), p99(repl), lim, max(never or [0]), hold))
        held = [l for l in busy if any(w in l for w in NEVER_HELD) and (held_s(l) or 0) >= hold]
        check(not held, "no state push, idle check or send of his held the loop %.1f s: %s" % (hold, held[:3]))
        check(p99(resp) < lim, "send -> response p99 under %.0f ms: %s" % (lim * 1000, stats(resp)))
        check(p99(echo) < lim, "send -> echo p99 under %.0f ms: %s" % (lim * 1000, stats(echo)))
        check(p99(repl) < lim, "send -> REPL p99 under %.0f ms: %s" % (lim * 1000, stats(repl)))
    finally:
        signal.alarm(0)
        stop.set()
        for b in burners:
            b.kill()
        E.close()


def self_test():
    """The pure parts, offline: held_s and bounds."""
    assert held_s("hub loop held 1.5 s on repl line t1 (shell 0.1 s)") == 1.5
    assert held_s("hub loop busy 90 s on sb drop (x)") == 90.0 and held_s("hub loop free after 3 s on client line 3 (y)") == 3.0
    assert held_s("hub started") is None
    assert bounds(1.0) == (LIMIT_S, 1.0) and bounds(3.0) == (LIMIT_S * 3, 3.0) and bounds(3.0, scale=False) == (LIMIT_S, 1.0)
    print("send_latency self-test ok")


if __name__ == "__main__":
    if sys.argv[1:] == ["--self-test"]:
        self_test()
        sys.exit(0)
    main()
    print("PASS send_latency_e2e")
