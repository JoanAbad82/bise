"""The answer as it streams in, on a real hub (runtime/live-pure.bend's
`partial` lines, bise-proto's lines::Partial, daemon/lines.rs): the fake
provider streams a reply in slow pieces ([[pieces: N S]]), the REPL
writes deltas, the hub keeps the whole text in memory and sends it whole
to the connections subscribed to that agent (HubEv::Partial).

Checked:
- partials come before the agent's entry, each a prefix of the final
  text and longer than the one before; then one "" (cleared once);
- no partial line in the transcript or the feed (memory only);
- a client that subscribes mid-stream gets the text so far right after
  the thread page;
- a stop mid-stream clears it ("") and nothing non-empty follows.

Run: python3 -u tests/partial_e2e.py (after scripts/bins.sh)
"""
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
from e2e import EXE, check  # noqa: E402

WORDS = ("the answer streams in, a piece at a time — déjà vu ✓, "
         "and the final entry replaces it without a jump. ")


def partials(c, agent="main"):
    with c.lock:
        return [e for e in c.events if e.get("ev") == "partial" and "project" in e and e.get("agent") == agent]


def entries(c, kind, agent="main"):
    with c.lock:
        return [e["entry"] for e in c.events if e.get("ev") == "entry" and "project" in e
                and e.get("agent") == agent and e["entry"]["kind"] == kind]


def hello(E):
    c = e2e.Client(os.path.join(E.state, "hub.sock"))
    c.send({"cmd": "hello", "proto": 1})
    c.wait(lambda: any(e.get("ev") == "welcome" for e in c.events), 20, "welcome")
    project = [e for e in c.events if e.get("ev") == "welcome"][0]["project"]
    return c, project


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: scripts/bins.sh")
    E = e2e.Env()
    ok = False
    try:
        c0 = E.start_hub()
        c0.wait_status("main", "idle", 60)
        c, project = hello(E)
        c.send({"cmd": "subscribe", "project": project, "agent": "main"})
        c.wait(lambda: any(e.get("ev") == "thread" for e in c.events), 20, "main's thread")

        # 1. a slow stream: partials, each a prefix of the final, then ""
        reply = os.path.join(E.tmp, "reply.txt")
        text = (WORDS * 14).strip()
        open(reply, "w", encoding="utf-8").write(text)
        c.send({"cmd": "send", "project": project, "agent": "main", "mode": "now",
                "text": "[[pieces: 40 0.05]] [[reply: %s]] stream it" % reply})
        c.wait(lambda: entries(c, "agent"), 120, "main's answer")
        final = entries(c, "agent")[-1]["text"]
        c.wait(lambda: partials(c) and partials(c)[-1]["text"] == "", 20, "the partial cleared")
        ps = partials(c)
        live = [p["text"] for p in ps if p["text"]]
        check(len(live) >= 2, "at least two partials before the entry: %d" % len(live))
        check(all(final.startswith(t) for t in live), "each partial a prefix of the final: %r" % [t[-30:] for t in live])
        check(all(len(a) < len(b) for a, b in zip(live, live[1:])), "each partial grows")
        check(len({p["call"] for p in ps}) == 1, "one call: %r" % {p["call"] for p in ps})
        check([p["text"] for p in ps].count("") == 1, "cleared once: %r" % [len(p["text"]) for p in ps])
        # the "" comes at the entry: no partial after it is non-empty
        check(ps[-1]["text"] == "", "the last partial is the clear")
        tr = open(os.path.join(E.state, "agents", "main", "transcript.log"), encoding="utf-8").read()
        check("partial #" not in tr, "no partial line in the transcript")
        check(not any(l.startswith("partial #") for l in c0.lines("main")), "no partial line in the feed")
        c0.wait_idle("main", timeout=90)

        # 2. a late subscriber gets the text so far right after the thread
        # page; then a stop clears it and nothing follows
        n = len(partials(c))
        c.send({"cmd": "send", "project": project, "agent": "main", "mode": "now",
                "text": "[[pieces: 24 0.15]] [[reply: %s]] stream it slowly" % reply})
        c.wait(lambda: any(p["text"] for p in partials(c)[n:]), 90, "a partial of the slow one")
        late, _ = hello(E)
        late.send({"cmd": "subscribe", "project": project, "agent": "main"})
        late.wait(lambda: partials(late), 20, "the late subscriber's partial")
        with late.lock:
            kinds = [e["ev"] for e in late.events if e.get("ev") in ("thread", "partial") and "project" in e]
        check(kinds[:2] == ["thread", "partial"] and partials(late)[0]["text"], "thread page then the text so far: %r" % kinds)
        check(final.startswith(partials(late)[0]["text"]), "the late text is a prefix")

        c.send({"cmd": "stop", "project": project, "agent": "main"})
        c.wait(lambda: partials(c)[-1]["text"] == "", 30, "the stop clears the partial")
        k = len(partials(c))
        c0.wait_idle("main", timeout=60)
        time.sleep(1.0)
        check(not any(p["text"] for p in partials(c)[k:]), "nothing after the stop: %r" % partials(c)[k:])
        check(not entries(c, "agent")[-1]["text"] == final or len(entries(c, "agent")) == 1,
              "the stopped answer did not land whole")
        print("partial_e2e: ok (%d partials, late subscriber, stop)" % len(live))
        ok = True
    finally:
        E.close()
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
