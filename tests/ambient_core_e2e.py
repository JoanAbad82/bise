"""bise ambient's core against a real hub (docs/ambient-app.md §3-§4).

A real hub (bise sbd, scripted model) on a throwaway repo, and
`bise ambient-core --workspace <ws>` as the app runs it: stdio JSON lines.
No mic, no speaker, no app: only the typed path (`send`), the task list,
a question card and its answer by digit, and stdin EOF.

Run: python3 -u tests/ambient_core_e2e.py
"""
import json
import os
import queue
import subprocess
import sys
import threading
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
from e2e import EXE, ROOT, check  # noqa: E402


class Core:
    """The core as the app sees it: commands in, events out."""

    def __init__(self, E):
        self.err = open(os.path.join(E.tmp, "core.stderr"), "a")
        self.p = subprocess.Popen([EXE, "ambient-core", "--workspace", E.ws], cwd=ROOT, env=E.env,
                                  stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=self.err, text=True)
        self.evs = []
        self.lock = threading.Lock()
        self.q = queue.Queue()
        threading.Thread(target=self._read, daemon=True).start()

    def _read(self):
        for line in self.p.stdout:
            try:
                v = json.loads(line)
            except ValueError:
                print("not JSON on stdout: %r" % line)
                continue
            with self.lock:
                self.evs.append(v)

    def cmd(self, **v):
        self.p.stdin.write(json.dumps(v) + "\n")
        self.p.stdin.flush()

    def last(self, ev):
        with self.lock:
            return next((e for e in reversed(self.evs) if e.get("ev") == ev), None)

    def seen(self, pred):
        with self.lock:
            return any(pred(e) for e in self.evs)

    def wait(self, pred, timeout=90, what="event"):
        t0 = time.time()
        while time.time() - t0 < timeout:
            if self.seen(pred):
                return
            time.sleep(0.05)
        with self.lock:
            tail = [e for e in self.evs if e.get("ev") != "level"][-12:]
        raise AssertionError("timeout waiting for %s; last events: %s" % (what, json.dumps(tail)))


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: cd rust && cargo build")
    E = e2e.Env()
    ok = True
    core = None
    try:
        c = E.start_hub()
        c.wait_status("main", "idle", 60)
        core = Core(E)
        core.wait(lambda e: e.get("ev") == "hub" and e.get("up") is True, 30, "hub up")
        core.wait(lambda e: e.get("ev") == "state", 30, "a state")
        st = core.last("state")
        check(all(a["name"] != "main" for a in st["agents"]), "main is not in the task list: %r" % st)
        check(st["cards"] == [], "no card yet: %r" % st)

        # typed: one input to main, then main's turn as phase/main events
        core.cmd(cmd="send", text="hello from the capsule")
        core.wait(lambda e: e.get("ev") == "sent", 30, "sent")
        sent = core.last("sent")
        check(sent["voice"] is False and sent["shot"] is False, "typed, no shot: %r" % sent)
        core.wait(lambda e: e.get("ev") == "main" and "hello from the capsule" in e.get("text", ""), 90, "main's answer")
        core.wait(lambda e: e.get("ev") == "phase" and e.get("phase") == "done", 90, "phase done")
        check(core.seen(lambda e: e.get("ev") == "phase" and e.get("phase") == "working"), "a working phase")
        check(any("hello from the capsule" in l for l in c.lines("main")), "the hub has the message in main's feed")
        check(not core.seen(lambda e: e.get("ev") == "phase" and e.get("phase") == "speaking"),
              "typed: main does not speak")

        # an agent: it shows in the task list
        c.wait_idle("main")
        with core.lock:
            mains_before = sum(1 for e in core.evs if e.get("ev") == "main")
        c.say('/new t1: {{bash: sb send main --expect-reply "keep the banner on mobile?"}}')
        core.wait(lambda e: e.get("ev") == "state" and any(a["name"] == "t1" for a in e["agents"]), 60, "t1 in the list")

        # a question card, answered by digit from the capsule
        msg = None
        t0 = time.time()
        while not msg and time.time() - t0 < 90:
            for l in c.lines("main"):
                if l.startswith("sb msg-in : t1 m_") and "banner" in l:
                    msg = l.split()[4]
            time.sleep(0.1)
        check(msg, "t1's question reached main")
        c.wait_idle("main", "t1")
        # main's turn on t1's message is not for the user: no words in the
        # capsule (ambient's review m_4672)
        with core.lock:
            mains_after = sum(1 for e in core.evs if e.get("ev") == "main")
        check(mains_after == mains_before, "an agent's message to main sends no main event (%d new)" % (mains_after - mains_before))
        c.say('[[bash: sb card --for %s "keep the banner on mobile?"]]' % msg)
        core.wait(lambda e: e.get("ev") == "state" and any(cd["kind"] == "question" for cd in e["cards"]), 60, "the card")
        card = [cd for cd in core.last("state")["cards"] if cd["kind"] == "question"][0]
        check(card["agent"] == "t1", "t1's card: %r" % card)
        c.wait_idle("main")
        core.cmd(cmd="answer", card=card["id"], reply="yes")
        core.wait(lambda e: e.get("ev") == "state" and not e["cards"], 60, "the card closed")
        c.wait_line("t1", 'from="user"', 60)

        # the app goes: the core exits on stdin EOF
        core.p.stdin.close()
        rc = core.p.wait(timeout=10)
        check(rc == 0, "exit 0 on stdin EOF: %r" % rc)
        core = None
    except AssertionError as e:
        print("FAIL", e)
        ok = False
    finally:
        if core:
            core.p.kill()
        E.close()
    print("ambient_core_e2e:", "ok" if ok else "FAILED")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
