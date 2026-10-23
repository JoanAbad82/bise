"""/running in a real terminal (tmux), on a throwaway hub with the fake
provider (running-procs, chunk C): main backgrounds a `python3 -m
http.server` (BEND_BG_AFTER 2 s); the agents panel's faint line counts
it with its port; /running lists it under main with localhost:<port>;
⏎ shows its output as it grows (process/output + process/follow from
the real .out), esc brings the list back; s stops it with no question
and the row says `stopped by you`. The KEEP: the hub's scan finds a real
process and its port, and its output follows a real file across the
socket; render and keys are running_screen_tests.rs's.

python3 -u tests/tui_running_tmux.py
"""
import os
import socket
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
from tui_tmux import tui_session, run, MAIN_IDLE  # noqa: E402
from words import w  # noqa: E402


def free_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


def main():
    E = e2e.Env()
    E.env["BEND_BG_AFTER"] = "2"
    port = free_port()
    cmd = "python3 -u -m http.server %d --bind 127.0.0.1" % port
    with tui_session(150, 40, E=E) as t:
        t.wait("bise :*")
        t.wait_re(MAIN_IDLE)
        c = e2e.Client(os.path.join(E.state, "hub.sock"))
        c.say("[[bash: %s]]" % cmd)
        c.wait_idle("main")
        # the panel's faint line under main once the scan sees it
        t.wait("%s · %s" % (w("running.count_running", n=1), w("running.port_short", port=port)), 60)
        t.typed("/running")
        t.keys("Enter")
        sc = t.wait_all([cmd, w("running.url", port=port).replace(" ↗", ""), w("running.keys_list")], 30)
        assert " › main" in sc, sc
        # ⏎: its output from the hub, the head and the keys of the view
        t.keys("Enter")
        t.wait_all(["Serving HTTP on 127.0.0.1 port %d" % port, w("running.keys_output")], 30)
        # a request it serves shows as it comes (follow)
        subprocess.run(["curl", "-s", "-o", "/dev/null", "http://127.0.0.1:%d/followed" % port])
        t.wait("GET /followed", 20)
        t.keys("Escape")
        t.wait_all([cmd, w("running.keys_list")], 30)
        # s: no question, then stopped by you
        t.keys("s")
        t.wait(w("running.stopped_by_you"), 30)
        t.keys("Escape")
        t.wait_re(MAIN_IDLE)


if __name__ == "__main__":
    run(main)
