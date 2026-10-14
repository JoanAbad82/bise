"""A client from before client-protocol (v2026.10.2-30) gets a clear
refusal on a real hub (debt-t3; the older door of the released desktop
cores -28/-29 is gone, its window closed, architect m_23234): its `{"op":"hello"}` gets the hub's exe and reload id (what an
older terminal acts on: it re-executes as the hub's version), then the
connection closes. Nothing it sends after is read: a -28 core's typed
hello, its op lines (`input`) reach no agent. One hub.log line says so.
A JSON-RPC client's non-JSON-RPC line is refused (hub.log), and no
client ever gets an older event.

Run: python3 -u tests/older_door_e2e.py (after scripts/bins.sh)
"""
import json
import os
import re
import socket
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
import wait  # noqa: E402

EXE = e2e.EXE
# the older events a client of before client-protocol read
OLDER = ("state", "line", "history", "ready", "page")


def check(cond, what):
    if not cond:
        raise AssertionError(what)


def hub_log(E):
    p = os.path.join(E.state, "hub.log")
    return open(p).read() if os.path.exists(p) else ""


def older_client(sock_path, after):
    """An older client: its hello, then the lines `after` (a -28 core's
    typed hello, its op lines); every line the hub wrote, and whether the
    hub closed the connection within 5 s."""
    s = socket.socket(socket.AF_UNIX)
    s.settimeout(5)
    s.connect(sock_path)
    s.sendall((json.dumps({"op": "hello"}) + "\n").encode())
    out, closed = [], False
    f = s.makefile("r")
    try:
        first = f.readline()
        if first:
            out.append(json.loads(first))
        for v in after:
            try:
                s.sendall((json.dumps(v) + "\n").encode())
            except OSError:
                break
        for line in f:
            out.append(json.loads(line))
        closed = True
    except socket.timeout:
        pass
    s.close()
    return out, closed


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: scripts/bins.sh")
    E = e2e.Env()
    ok = False
    try:
        c = E.start_hub()
        c.wait_status("main", "idle", 60)
        sock = os.path.join(E.state, "hub.sock")
        project = c.project()

        # an older terminal: exe and reload, then the hub closes
        got, closed = older_client(sock, [])
        check(len(got) == 1 and set(got[0]) == {"ev", "exe", "reload"} and got[0]["ev"] == "hello" and got[0]["exe"], "the older hello's answer: %r" % got[:3])
        check(closed, "the hub kept an older client's connection open")

        # a -28/-29 core: its typed hello and an op line after the older
        # hello; nothing is read, his words reach no agent
        n = len(c.lines("main"))
        lines = [{"cmd": "hello", "proto": 1}, {"op": "input", "focus": "main", "text": "older core says hi"}]
        got, closed = older_client(sock, lines)
        check(len(got) == 1 and got[0].get("ev") == "hello", "the older core got more than exe and reload: %r" % got[1:3])
        check(closed, "the hub kept an older core's connection open")
        time.sleep(2)
        check(not any("older core says hi" in l for l in c.lines("main")[n:]), "an older core's input reached main")
        wait.until(lambda: hub_log(E).count("an older client said hello on hub.sock") >= 2, 10, "the older hellos in hub.log")

        # a JSON-RPC client's line that is not JSON-RPC: refused, logged
        c.send({"op": "input", "focus": "main", "text": "not rpc"})
        wait.until(lambda: "hub.sock refused a line that is not JSON-RPC: pid " in hub_log(E), 10, "the refusal in hub.log, naming the peer")
        # hub.log names the peer, never a line's body (architect m_23291)
        check("not rpc" not in hub_log(E) and "older core says hi" not in hub_log(E), "a line's body in hub.log")
        check(re.search(r"an older client said hello on hub\.sock \([^)]*\): pid \d+", hub_log(E)), "the older hello's peer in hub.log")

        # no older event to a JSON-RPC client
        with c.lock:
            check(not any(v.get("ev") in OLDER for v in c.events), "an older event on a JSON-RPC client: %r" % [v for v in c.events if v.get("ev") in OLDER][:2])

        # the hub still serves: main answers after all that
        c.say("still here")
        c.wait_line("main", "still here", 60)
        check(project == c.project(), "the project changed")

        ok = True
        print("older_door_e2e: ok")
    finally:
        E.close()
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
