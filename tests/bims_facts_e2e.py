"""Les bims' hub facts on a real hub (architect m_27581): an agent's
`doing` on its hub/agents row (switchboard doing.rs), and `hub/activity`
(activity.rs), seen by typed JSON-RPC clients.

- main's turn runs two bash calls (a plain one, then a build: `gate.sh`
  in its command, bise_proto::rows::DoingKind::of_call), then spawns t1,
  which reports done: the rows say think, tool, build while the turn
  runs, and no `doing` once it ended;
- hub/activity: his message to main (from {who: you}, steer, its id the
  one turn/send answered), main's to t1, t1's report (done), and no body,
  no report text, no command in any of them;
- a client that initializes after all that gets none of it replayed,
  then gets the next one live.

Run: python3 -u tests/bims_facts_e2e.py (after scripts/bins.sh)
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
import wait  # noqa: E402
from e2e import EXE, check  # noqa: E402
from rpc_e2e import PROTO, Rpc  # noqa: E402

SECRET = "zq-report-words"


def init(sock, name):
    r = Rpc(sock)
    res = r.call("initialize", {"proto": PROTO, "client": {"name": name, "version": "0"}})["result"]
    check("hub/activity" in res["notifications"], "hub/activity is a notification: %r" % res["notifications"])
    check(not any(n["method"] == "hub/activity" for n in res["hub"]["state"]), "no activity in the hub's state")
    return r, res["project"]


def kinds_of(r, agent):
    """The `doing` kinds `agent`'s rows said, in order, repeats dropped."""
    out = []
    for n in r.notes("hub/agents"):
        for a in n["params"]["agents"]:
            if a["name"] == agent:
                k = (a.get("doing") or {}).get("kind")
                if not out or out[-1] != k:
                    out.append(k)
    return out


def last_row(r, agent):
    for n in reversed(r.notes("hub/agents")):
        for a in n["params"]["agents"]:
            if a["name"] == agent:
                return a
    return None


def items(r):
    return [n["params"]["item"] for n in r.notes("hub/activity")]


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: scripts/bins.sh")
    E = e2e.Env()
    ok = False
    try:
        c = E.start_hub()
        c.wait_status("main", "idle", 60)
        sock = os.path.join(E.state, "hub.sock")
        a, project = init(sock, "bims_facts_a")
        check(items(a) == [], "no activity before any: %r" % items(a))

        text = ('[[bash: sleep 2]] [[bash: sleep 2 && echo gate.sh]] '
                '[[bash: sb spawn t1 --objective "{{bash: sb report done %s}}"]]' % SECRET)
        resp = a.call("turn/send", {"project": project, "agent": "main", "text": text, "mode": "now"})
        msg_id = resp["result"]["msg_id"]
        a_wait = lambda pred, what, t=120: wait.until(pred, t, what)  # noqa: E731
        a_wait(lambda: any(i["kind"] == "report" and i["agent"] == "t1" for i in items(a)), "t1's report as activity", 180)
        c.wait_status("main", ["idle", "done"], 120)
        c.wait_status("t1", ["idle", "done"], 120)

        # doing: think, then the plain bash call, then the build, while
        # the turn ran; none once it ended
        ks = kinds_of(a, "main")
        check("tool" in ks and "build" in ks and ks.index("tool") < ks.index("build"), "main's doing kinds: %r" % ks)
        check("think" in ks, "main thought: %r" % ks)
        a_wait(lambda: last_row(a, "main") is not None and "doing" not in last_row(a, "main"), "main's doing gone after its turn")
        a_wait(lambda: last_row(a, "t1") is not None and "doing" not in last_row(a, "t1"), "t1's doing gone after its turn")

        # activity: his message, main's to t1, t1's report; typed ends
        its = items(a)
        his = [i for i in its if i["kind"] == "message" and i["id"] == msg_id]
        check(len(his) == 1, "his message once: %r" % its)
        check(his[0]["from"] == {"who": "you"} and his[0]["to"] == {"who": "agent", "name": "main"}
              and his[0]["mode"] == "steer" and his[0]["expects_reply"] is False and his[0]["at_ms"] > 0, "his message: %r" % his[0])
        to_t1 = [i for i in its if i["kind"] == "message" and i["to"] == {"who": "agent", "name": "t1"}]
        check(to_t1 and to_t1[0]["from"] == {"who": "agent", "name": "main"}, "main's message to t1: %r" % its)
        reps = [i for i in its if i["kind"] == "report"]
        check(len(reps) == 1 and reps[0]["report"] == "done" and reps[0]["agent"] == "t1", "t1's report once: %r" % reps)
        # nothing of a body, a report's text or a command leaves
        raw = json.dumps(a.notes("hub/activity")) + json.dumps([n["params"]["agents"] for n in a.notes("hub/agents")])
        for word in (SECRET, "sleep 2", "gate.sh", "sb spawn"):
            check(word not in json.dumps(a.notes("hub/activity")), "%r in an activity event" % word)
        check("sleep 2" not in raw and "gate.sh" not in raw, "a command in the rows' doing")

        # a client that initializes now gets no old activity...
        b, _ = init(sock, "bims_facts_b")
        n_a = len(items(a))
        resp2 = a.call("turn/send", {"project": project, "agent": "main", "text": "one more", "mode": "queued"})
        id2 = resp2["result"]["msg_id"]
        # ...but the next one, live (a and b alike)
        a_wait(lambda: any(i.get("id") == id2 for i in items(b)), "b gets the next message live")
        check(items(b)[0]["id"] == id2, "b got nothing older first: %r" % items(b))
        check(any(i.get("id") == id2 and i["mode"] == "queued" for i in items(a)[n_a:]), "a gets it too, queued: %r" % items(a)[n_a:])
        c.wait_status("main", ["idle", "done"], 120)
        ok = True
        print("PASS bims_facts_e2e")
    finally:
        if not ok:
            os.environ["SB_KEEP"] = "1"
        E.close()
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
