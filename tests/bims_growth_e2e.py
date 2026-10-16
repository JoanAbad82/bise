"""Les bims' growth on a real hub (architect m_28018): `hub/growth`
(bise_proto rows::growth, the shell's cache daemon/proto/growth.rs) seen
by a typed JSON-RPC client.

- at initialize: hub/growth is a notification and in the hub's state,
  nothing done yet (main never counts);
- a task reports done, then is archived: jobs_done 1, and it stays 1
  (an archived row keeps its last report's kind);
- `sb artifact add`: one growth event with artifacts_made +1;
- an unchanged push sends nothing: a turn that changes no counter adds
  no growth event.

Run: python3 -u tests/bims_growth_e2e.py (after scripts/bins.sh)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
import wait  # noqa: E402
from e2e import EXE, check  # noqa: E402
from rpc_e2e import PROTO, Rpc  # noqa: E402


def growths(r):
    return [n["params"]["growth"] for n in r.notes("hub/growth")]


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: scripts/bins.sh")
    E = e2e.Env()
    ok = False
    try:
        c = E.start_hub()
        c.wait_status("main", "idle", 60)
        sock = os.path.join(E.state, "hub.sock")
        a = Rpc(sock)
        res = a.call("initialize", {"proto": PROTO, "client": {"name": "bims_growth", "version": "0"}})["result"]
        project = res["project"]
        check("hub/growth" in res["notifications"], "hub/growth is a notification: %r" % res["notifications"])
        st = [n for n in res["hub"]["state"] if n["method"] == "hub/growth"]
        check(len(st) == 1, "growth in the hub's state: %r" % [n["method"] for n in res["hub"]["state"]])
        g0 = st[0]["params"]["growth"]
        check(g0.get("jobs_done", 0) == 0 and g0.get("artifacts_made", 0) == 0, "nothing done yet (main never counts): %r" % g0)

        # a task that reports done (after a second: the fake provider is
        # so fast that its turn's start, read from the REPL's output, can
        # reach sb-core after the report and clear the done it declared)
        a.call("turn/send", {"project": project, "agent": "main", "mode": "now",
                             "text": '[[bash: sb spawn t1 --objective "{{bash: sleep 1 && sb report done shipped}}"]]'})
        wait.until(lambda: any(g.get("jobs_done") == 1 for g in growths(a)), 180, "jobs_done 1 after t1's done")
        c.wait_status("t1", ["idle", "done"], 120)
        c.wait_status("main", ["idle", "done"], 120)
        g1 = growths(a)[-1]
        check(g1.get("days_used") == 1 and g1.get("since_ms", 0) > 0, "t1 made today: %r" % g1)

        # archived, it still counts
        r = a.call("agent/archive", {"project": project, "agent": "t1", "force": True})
        check("error" not in r, "archive t1: %r" % r)
        c.wait_status("t1", "archived", 60)
        check(growths(a)[-1].get("jobs_done") == 1, "an archived done still counts: %r" % growths(a))

        # an artifact: one event, artifacts_made +1
        n = len(growths(a))
        a.call("turn/send", {"project": project, "agent": "main", "mode": "now",
                             "text": "[[bash: echo notes > notes.md && sb artifact add notes.md --title notes]]"})
        wait.until(lambda: any(g.get("artifacts_made") == 1 for g in growths(a)), 120, "artifacts_made 1")
        c.wait_status("main", ["idle", "done"], 120)
        new = growths(a)[n:]
        check(len(new) == 1 and new[0].get("artifacts_made") == 1 and new[0].get("jobs_done") == 1, "one growth event for the artifact: %r" % new)

        # a turn that changes no counter: agents pushes, no growth event
        n = len(growths(a))
        pushes = len(a.notes("hub/agents"))
        a.call("turn/send", {"project": project, "agent": "main", "mode": "now", "text": "[[bash: sleep 1]]"})
        wait.until(lambda: len(a.notes("hub/agents")) > pushes, 60, "the turn's agents pushes")
        c.wait_status("main", ["idle", "done"], 120)
        check(len(growths(a)) == n, "an unchanged push sends nothing: %r" % growths(a)[n:])
        ok = True
        print("PASS bims_growth_e2e")
    finally:
        if not ok:
            os.environ["SB_KEEP"] = "1"
        E.close()
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
