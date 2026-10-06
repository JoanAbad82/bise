"""The typed client protocol on a real hub (bise desktop S3a, bise-proto,
rust/switchboard/src/daemon/proto.rs): a client of hub.sock says
{"cmd": "hello", "proto": 1} and gets welcome, agents, cards; subscribe
gives the thread, a live line gives typed entries; send now reaches the
agent like the TUI's input; every refused or unknown command gets an
error {cmd, text}, never silence. Every typed event carries the shape of
rust/proto/fixtures/hub_ev.jsonl (the same keys).

Run: python3 -u tests/proto_e2e.py (after scripts/bins.sh)
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
from e2e import EXE, check  # noqa: E402

TYPED = ("welcome", "agents", "cards", "thread", "entry", "typing", "error")
FIXTURES = os.path.join(e2e.ROOT, "rust", "proto", "fixtures", "hub_ev.jsonl")


def typed(c, ev=None):
    with c.lock:
        return [e for e in c.events if e.get("ev") in TYPED and (ev is None or e["ev"] == ev)]


def required_keys():
    """Each frozen event's keys as the fixtures show them, minus the
    optional ones (skipped when empty on the wire)."""
    optional = {"before", "project", "cmd"}
    keys = {}
    for line in open(FIXTURES):
        if line.strip():
            v = json.loads(line)
            k = set(v) - optional
            keys[v["ev"]] = keys.get(v["ev"], k) & k
    return keys


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: scripts/bins.sh")
    E = e2e.Env()
    ok = False
    try:
        c = E.start_hub()
        c.wait_status("main", "idle", 60)

        # a version this hub doesn't speak: an error, no welcome
        c.send({"cmd": "hello", "proto": 2})
        c.wait(lambda: typed(c, "error"), 20, "an error for proto 2")
        e = typed(c, "error")[0]
        check(e.get("cmd") == "hello" and "proto" in e["text"], "proto 2 refused: %r" % e)
        # a command before hello: an error
        c.send({"cmd": "subscribe", "project": "x", "agent": "main"})
        c.wait(lambda: len(typed(c, "error")) == 2, 20, "an error before hello")
        check(not typed(c, "welcome"), "no welcome before hello")

        c.send({"cmd": "hello", "proto": 1})
        c.wait(lambda: typed(c, "cards"), 20, "welcome, agents and cards")
        w = typed(c, "welcome")[0]
        project = w["project"]
        check(re.fullmatch(r"ws-[0-9a-f]{8}", project) and w["proto"] == 1 and w["name"] == "ws"
              and os.path.realpath(w["workspace"]) == os.path.realpath(E.ws), "welcome: %r" % w)
        agents = typed(c, "agents")[0]
        main_row = [a for a in agents["agents"] if a["name"] == "main"]
        check(agents["project"] == project and main_row and main_row[0]["main"], "agents: %r" % agents)
        check(typed(c, "cards")[0]["cards"] == [], "no cards yet")

        def errors():
            return typed(c, "error")[2:]

        refused = [
            ({"cmd": "fly", "project": project}, "fly"),
            ({"cmd": "send", "project": "other-00000000", "agent": "main", "text": "hi", "mode": "now"}, "send"),
            ({"cmd": "send", "project": project, "agent": "main", "text": "/archive main", "mode": "queued"}, "send"),
            ({"cmd": "send", "project": project, "agent": "main", "text": "hi", "mode": "now", "context": {"app": "Mail"}}, "send"),
            ({"cmd": "send", "project": project, "agent": "nobody", "text": "hi", "mode": "now"}, "send"),
            ({"cmd": "answer", "project": project, "card": 999, "reply": "1"}, "answer"),
            ({"cmd": "subscribe", "project": project}, "subscribe"),
        ]
        for i, (cmd, tag) in enumerate(refused):
            c.send(cmd)
            c.wait(lambda: len(errors()) > i, 20, "an error for %r" % cmd)
            check(errors()[i].get("cmd") == tag and errors()[i]["text"], "refused %r: %r" % (cmd, errors()[i]))

        # subscribe: the thread's page, then its entries live
        c.send({"cmd": "subscribe", "project": project, "agent": "main"})
        c.wait(lambda: typed(c, "thread"), 20, "main's thread")
        t = typed(c, "thread")[0]
        check(t["agent"] == "main" and t["project"] == project and isinstance(t["entries"], list), "thread: %r" % t)
        c.send({"cmd": "send", "project": project, "agent": "main", "text": "proto says hi", "mode": "now"})
        c.wait_line("main", "proto says hi", 30)

        def entries(kind):
            return [x["entry"] for x in typed(c, "entry") if x["agent"] == "main" and x["entry"]["kind"] == kind]

        c.wait(lambda: any("proto says hi" in x["text"] for x in entries("you")), 30, "his words as a typed entry")
        c.wait(lambda: entries("agent"), 90, "main's reply as a typed entry")
        c.wait_idle("main", timeout=90)
        you = [x for x in entries("you") if "proto says hi" in x["text"]][0]
        lines = [e for e in c.events if e.get("ev") == "line" and e["agent"] == "main" and "proto says hi" in e["line"]]
        check(you["pos"] == lines[0]["pos"], "an entry's pos is its first line's (sb inspect's #pos): %r %r" % (you, lines[0]))
        check(any(m["text"] for m in typed(c, "typing")) or True, "typing may come (a tool intent)")

        # a page before the live entry: older entries (or none), never an error
        n = len(typed(c, "thread"))
        c.send({"cmd": "page", "project": project, "agent": "main", "before": you["pos"]})
        c.wait(lambda: len(typed(c, "thread")) > n, 20, "a page")
        p = typed(c, "thread")[-1]
        check(all(x["pos"] < you["pos"] for x in p["entries"]), "the page is before it: %r" % p)

        # unsubscribe: no more entries for main
        c.send({"cmd": "unsubscribe", "project": project, "agent": "main"})
        c.send({"cmd": "page", "project": project, "agent": "main", "before": 1})
        c.wait(lambda: len(typed(c, "thread")) > n + 1, 20, "the page after unsubscribe")
        k = len(typed(c, "entry"))
        c.say("after the unsubscribe")
        c.wait_line("main", "after the unsubscribe", 30)
        c.wait_idle("main", timeout=90)
        check(len(typed(c, "entry")) == k, "no entry after unsubscribe")

        # a queued send: sb-core holds it until the turn ends (amb-hub
        # 7dcb56ab), then main gets it as his words
        c.send({"cmd": "send", "project": project, "agent": "main", "text": "queued from the window", "mode": "queued"})
        c.wait_line("main", "queued from the window", 60)
        c.wait_idle("main", timeout=90)

        # an answer is only an answer (architect m_8366): a reply with a
        # newline, a leading '/' and ' --force' reaches the card's agent
        # whole, never another command
        c.say('/new t3: {{bash: sb send main --expect-reply "v1 ou v2 ?"}}')
        c.wait(lambda: any(l.startswith("sb msg-in : t3 m_") and "v1 ou v2" in l for l in c.lines("main")), 120, "t3 asks main")
        c.wait_idle("main", "t3", timeout=120)
        msg_id = [l.split()[4] for l in c.lines("main") if l.startswith("sb msg-in : t3 m_") and "v1 ou v2" in l][0]
        c.say('[[bash: sb card --for %s "v1 ou v2 ?"]]' % msg_id)
        c.wait(lambda: any(x["kind"] == "question" for x in c.cards()), 60, "a question card")
        card = [x for x in c.cards() if x["kind"] == "question"][0]
        c.wait(lambda: any(r["id"] == card["id"] for x in typed(c, "cards") for r in x["cards"]), 30, "the card as a typed row")
        c.wait_idle("main")
        reply = "/archive t3 --force\nv2 --force"
        c.send({"cmd": "answer", "project": project, "card": card["id"], "reply": reply})
        c.wait(lambda: not c.cards(), 30, "the card closed by the answer")
        c.wait_line("t3", 'from="user"', 60)
        c.wait_idle("t3", timeout=90)
        tr = open(os.path.join(E.state, "agents", "t3", "transcript.log")).read()
        check("/archive t3 --force" in tr and "v2 --force" in tr, "t3 got the whole reply: %s" % tr[-800:])
        check(c.agent("t3")["status"] != "archived", "the reply archived nothing: %r" % c.agent("t3"))
        check(typed(c, "cards")[-1]["cards"] == [], "the typed cards are empty again")

        # stop and archive: reach the hub's own paths (an unknown agent: an error)
        c.send({"cmd": "stop", "project": project, "agent": "main"})
        c.send({"cmd": "archive", "project": project, "agent": "ghost", "force": False})
        c.wait(lambda: any(x.get("cmd") == "archive" for x in errors()), 20, "archive of an unknown agent refused")

        # every typed event has the frozen keys of the fixtures
        need = required_keys()
        for ev in typed(c):
            missing = need[ev["ev"]] - set(ev)
            check(not missing, "%s lacks %s: %r" % (ev["ev"], missing, ev))
        ok = True
        print("PASS proto_e2e", flush=True)
    finally:
        E.close()
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
