"""Running processes on a real hub (docs/processes.md): what an agent left
running is listed with its port, its output reads, his stop ends it, the
agent hears it, the ended row stays.

A throwaway hub (bise sbd, scripted model). t1 runs `python3 -m
http.server` in the background (BEND_BG_AFTER 2 s: its bg job) and a
nohup'd one whose stdout is a file (a detached tree). processes/list lists
both with their ports; t1's agents row carries procs 2 and its lowest
port; process/output reads the bg job's output and the nohup'd one's file;
process/follow sends what comes next; process/stop ends the bg job (its
.out gets bise's line, the port closes, the row says stopped_by_you, t1
gets bise's queued message); process/stop all ends the other; both ended
rows stay in the list.

Run: python3 -u tests/processes_e2e.py
"""
import base64
import os
import socket
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
import wait  # noqa: E402
from e2e import EXE, check  # noqa: E402
from rpc_e2e import PROTO, Rpc  # noqa: E402


def listens(port):
    s = socket.socket()
    s.settimeout(1)
    try:
        s.connect(("127.0.0.1", port))
        return True
    except OSError:
        return False
    finally:
        s.close()


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: scripts/bins.sh")
    E = e2e.Env()
    E.env["BEND_BG_AFTER"] = "2"
    ok = False
    try:
        c = E.start_hub()
        c.wait_status("main", "idle", 60)
        c.say("/new t1: stay around")
        c.wait_status("t1", "idle", 90)
        r = Rpc(os.path.join(E.state, "hub.sock"))
        init = r.call("initialize", {"proto": PROTO, "client": {"name": "processes_e2e", "version": "0"}})
        project = init["result"]["project"]
        check("hub/processes" in init["result"]["notifications"], "hub/processes is a notification")

        c.say("[[bash: python3 -u -m http.server 0 --bind 127.0.0.1]]", focus="t1")
        c.wait(lambda: any(l.startswith("bg_handoff : ") for l in c.lines("t1")), 60, "the bg job handed off")
        c.wait_idle("t1")
        nohup_out = os.path.join(E.tmp, "nohup.out")
        c.say("[[bash: nohup python3 -u -m http.server 0 --bind 127.0.0.1 > %s 2>&1 & echo started]]" % nohup_out, focus="t1")
        c.wait(lambda: any(l.strip() == "started" for l in c.lines("t1")), 60, "the nohup'd server started")
        c.wait_idle("t1")

        def listed():
            items = r.call("processes/list", {"project": project, "watch": True})["result"]["items"]
            mine = [p for p in items if p["agent"] == "t1" and p["state"] == {"is": "running"} and p.get("ports")]
            return mine if len(mine) == 2 else None
        rows = wait.until(listed, 60, "t1's two servers listed with their ports")
        bg = [p for p in rows if p["kind"]["is"] == "bg"][0]
        det = [p for p in rows if p["kind"]["is"] == "detached"][0]
        check(bg["id"].startswith("bg") and bg["out"] == "bg" and bg["name"] == "http server"
              and bg["url"] == "http://127.0.0.1:%d" % bg["ports"][0] and bg["procs"] >= 1, "the bg job's row: %r" % bg)
        check(det["id"].startswith("p%d." % det["pid"]) and det["out"] == "file" and det["cwd"], "the nohup'd row: %r" % det)
        check(all(listens(p["ports"][0]) for p in rows), "both listen")

        def t1_row():
            for n in reversed(r.notes("hub/agents")):
                for a in n["params"]["agents"]:
                    if a["name"] == "t1":
                        return a
            return None
        wait.until(lambda: (t1_row() or {}).get("procs") == 2, 30, "t1's row counts 2 running")
        check(t1_row().get("procs_port") == min(bg["ports"][0], det["ports"][0]), "its lowest port: %r" % t1_row())

        def out_of(p, frm=None):
            params = {"project": project, "agent": "t1", "id": p["id"]}
            if frm is not None:
                params["from"] = frm
            res = r.call("process/output", params)["result"]
            return res, base64.b64decode(res["data"]).decode(errors="replace")
        wait.until(lambda: "Serving HTTP" in out_of(bg)[1], 30, "the bg job's output")
        wait.until(lambda: "Serving HTTP" in out_of(det)[1], 30, "the nohup'd one's file")
        res, _ = out_of(bg)
        check(res["at"] + len(base64.b64decode(res["data"])) == res["end"], "the last chunk ends at the end: %r" % res)
        unknown = r.call("process/output", {"project": project, "agent": "t1", "id": "bg99.1"})
        check("error" in unknown, "an unknown process: %r" % unknown)

        # follow: a request to the server lands in its log, then in a notification
        r.call("process/follow", {"project": project, "agent": "t1", "id": bg["id"], "on": True})
        import urllib.request
        urllib.request.urlopen(bg["url"] + "/followed-path", timeout=5).read()
        wait.until(lambda: any("followed-path" in base64.b64decode(n["params"]["data"]).decode(errors="replace")
                               for n in r.notes("process/output")), 20, "the followed output")
        r.call("process/follow", {"project": project, "agent": "t1", "id": bg["id"], "on": False})

        # his stop: the bg job
        bad = r.call("process/stop", {"project": project, "agent": "t1"})
        check("error" in bad, "a stop with neither id nor all: %r" % bad)
        check("error" not in r.call("process/stop", {"project": project, "agent": "t1", "id": bg["id"]}), "process/stop")

        def ended(p, state):
            items = r.call("processes/list", {"project": project})["result"]["items"]
            return any(x["agent"] == "t1" and x["id"] == p["id"] and x["state"] == state and x.get("ended_ms") for x in items)
        wait.until(lambda: ended(bg, {"is": "stopped_by_you"}), 30, "the bg job stopped by you")
        check(not listens(bg["ports"][0]), "its port closed")
        _, kept = out_of(bg)
        check("[bise: stopped by you from the processes list]" in kept and "Serving HTTP" in kept, "its kept output: %r" % kept[-300:])
        # bise's queued message: t1 hears it at its next turn at the latest
        c.say("[[bash: echo next-turn]]", focus="t1")
        c.wait(lambda: any("he stopped" in l and bg["id"] in l for l in c.lines("t1")), 60, "bise's message to t1")

        # all of t1's: the nohup'd one
        check("error" not in r.call("process/stop", {"project": project, "agent": "t1", "all": True}), "process/stop all")
        wait.until(lambda: ended(det, {"is": "stopped_by_you"}), 30, "the nohup'd one stopped by you")
        check(not listens(det["ports"][0]), "its port closed")
        wait.until(lambda: not (t1_row() or {}).get("procs"), 30, "t1's row counts none running")
        check(ended(bg, {"is": "stopped_by_you"}), "the first ended row stays")
        ok = True
        print("PASS processes_e2e", flush=True)
    except Exception as e:
        print("FAIL processes_e2e: %s" % e, flush=True)
        os.environ["SB_KEEP"] = "1"
    finally:
        E.close()
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
