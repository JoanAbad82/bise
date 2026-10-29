#!/usr/bin/env python3
"""A peer that reads nothing never holds the hub (hub-stall).

On 2026-10-14 his harness hub answered no `sb` for 27 min (20:09:45 →
20:36:58): its loop sat in one blocking write to a peer that had stopped
reading (a macOS unix socket holds ~8 KB), and ran again the moment that
peer went. On his build (05eca05cc) this test's first part stalled at its
second round: no answer in 20 s.

A real hub, the scripted provider, main and two tasks with traffic:
  1. a hub.sock client says `initialize`, then reads nothing, ever;
  2. 30 rounds: his line to main (the clients get its state), then an
     agent's `sb list` and `sb status`, and a reading client's
     `hub/read`: each answers in under 2 s;
  3. hub.log says no `hub loop busy` (daemon/loop_watch.rs) and the
     reading client still gets main's answers.
"""
import json
import os
import socket
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import e2e  # noqa: E402
from e2e import Env, check  # noqa: E402

LIMIT = 2.0
ROUNDS = 30


def sb(E, agent, *args):
    env = {**E.env, "SB_SOCKET": os.path.join(E.state, "agent.sock"), "SB_AGENT": agent}
    t0 = time.time()
    r = subprocess.run([e2e.EXE, "sb", *args], env=env, cwd=E.ws, capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, "sb %s: %s %s" % (" ".join(args), r.stdout, r.stderr)
    return time.time() - t0


def deaf_client(sock):
    """A client that says `initialize` and reads nothing after."""
    s = socket.socket(socket.AF_UNIX)
    s.connect(sock)
    init = {"jsonrpc": "2.0", "id": 0, "method": "initialize", "params": {"proto": e2e.PROTO, "client": {"name": "reads-nothing"}}}
    s.sendall((json.dumps(init) + "\n").encode())
    s.sendall((json.dumps({"jsonrpc": "2.0", "method": "initialized"}) + "\n").encode())
    return s


def hub_log(E):
    try:
        return open(os.path.join(E.state, "hub.log")).read()
    except FileNotFoundError:
        return ""


def main():
    E = Env()
    try:
        c = E.start_hub()
        sb(E, "main", "spawn", "t1", "--objective", "a task for the traffic")
        sb(E, "main", "spawn", "t2", "--objective", "another task for the traffic")
        deaf = deaf_client(os.path.join(E.state, "hub.sock"))
        worst = 0.0
        for i in range(ROUNDS):
            c.say("round %d %s" % (i, "x" * 4000))
            took = [sb(E, "main", "list"), sb(E, "t1", "status", "working", "--note", "round %d" % i)]
            t0 = time.time()
            c.rpc("hub/read", {"project": c.project()}, timeout=20)
            took.append(time.time() - t0)
            worst = max([worst] + took)
            check(max(took) < LIMIT, "round %d: sb and hub/read answer in under %.0f s (%s)" % (i, LIMIT, ", ".join("%.2f" % t for t in took)))
        print("worst answer over %d rounds with a client that reads nothing: %.2f s" % (ROUNDS, worst))
        check("hub loop busy" not in hub_log(E), "hub.log: the loop never held 5 s")
        deaf.close()
    finally:
        E.close()
    print("OK hub_stall_e2e")


if __name__ == "__main__":
    main()
