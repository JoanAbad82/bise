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


def stream(c, agent="main"):
    """The partial and entry events of `agent`, in arrival order."""
    with c.lock:
        return [e for e in c.events if e.get("ev") in ("partial", "entry") and "project" in e and e.get("agent") == agent]


def thread(c, agent="main"):
    with c.lock:
        return [e["entry"] for e in c.events if e.get("ev") == "entry" and "project" in e and e.get("agent") == agent]


def transcript(E):
    # transcript lines are "<ts>\t<line>"
    path = os.path.join(E.state, "agents", "main", "transcript.log")
    return [l.split("\t", 1)[-1] for l in open(path, encoding="utf-8").read().splitlines()]


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

        # 3. an attempt that breaks mid-stream keeps what he read, at its
        # place (designer m_13334, m_13562): the stream breaks, the hub
        # writes the text as an `sb kept` line right before the retry's
        # line and clears the partial; the retry fails for good (a final
        # 400): the notices go UNDER the kept text, in arrival order
        n = len(partials(c))
        ne = len(thread(c))
        c.send({"cmd": "send", "project": project, "agent": "main", "mode": "now",
                "text": "[[pieces: 40 0.05]] [[error: cut]] [[error: badname]] [[reply: %s]] fail it" % reply})
        c.wait(lambda: any(e.get("cut") for e in thread(c)[ne:]), 120, "the kept answer")
        c0.wait_idle("main", timeout=60)
        time.sleep(0.5)
        ps = partials(c)[n:]
        new_entries = thread(c)[ne:]
        ki = [i for i, e in enumerate(new_entries) if e.get("cut")][0]
        kept = new_entries[ki]
        check(kept["kind"] == "agent" and kept["text"] and text.startswith(kept["text"]),
              "a cut reply, a prefix of the answer: %r" % {x: kept.get(x) for x in ("kind", "cut", "text")})
        check(ps and [p["text"] for p in ps].count("") == 1 and ps[-1]["text"] == "",
              "cleared once, at the retry: %r" % [len(p["text"]) for p in ps])
        after = [e["kind"] for e in new_entries[ki + 1:]]
        # the failure's notices in arrival order, the failed turn's own
        # entry (main's turn_failed kind) last
        check(after and all(x == "notice" for x in after[:-1]) and after[-1] in ("notice", "turn_failed"),
              "the notices under the kept text, nothing above it but his message: %r"
              % [e["kind"] for e in new_entries])
        check([e["kind"] for e in new_entries[:ki]] == ["you"], "the kept text right under his message: %r"
              % [e["kind"] for e in new_entries[:ki]])
        tr = transcript(E)
        kis = [i for i, l in enumerate(tr) if l.startswith("sb kept : ")]
        check(kis, "an sb kept line in the transcript")
        check("provider_retry:" in tr[kis[-1] + 1], "the kept line right before the retry: %r" % tr[kis[-1]:kis[-1] + 2])

        # 4. text, a break, then a retry that answers with a tool call only
        # (architect m_13563 a): attempt 1's text is kept and cleared at the
        # retry, so nothing of it is live while the tool runs
        n = len(partials(c))
        ne = len(thread(c))
        c.send({"cmd": "send", "project": project, "agent": "main", "mode": "now",
                "text": "[[pieces: 40 0.05]] [[error: cut]] [[bash: sleep 2; echo ran]] [[reply: %s]] retry to a tool" % reply})
        c.wait(lambda: any(e["kind"] == "tools" for e in thread(c)[ne:]), 120, "the retry's tool call")
        c0.wait_idle("main", timeout=90)
        time.sleep(0.5)
        evs = stream(c)[ne + n:]
        ps = partials(c)[n:]
        first = next((p["call"] for p in ps if p["text"]), None)
        check(first, "attempt 1 streamed text: %r" % [len(p["text"]) for p in ps])
        clear_at = [i for i, e in enumerate(evs) if e.get("ev") == "partial" and e["call"] == first and e["text"] == ""]
        tool_at = [i for i, e in enumerate(evs) if e.get("ev") == "entry" and e["entry"]["kind"] == "tools"]
        check(clear_at and tool_at and clear_at[0] < tool_at[0], "attempt 1 cleared before the tool: %r %r" % (clear_at, tool_at))
        check(not any(e.get("ev") == "partial" and e["call"] == first and e["text"]
                      for e in evs[clear_at[0]:]), "nothing of attempt 1 after its clear")
        new_entries = thread(c)[ne:]
        check([e for e in new_entries if e.get("cut")], "attempt 1's text kept: %r" % [e["kind"] for e in new_entries])

        # 5. text then a tool call in ONE reply (architect m_13563 b): the
        # text is an assistant line before the tool lines, so it settles
        # into an agent entry and nothing is live while the tool runs
        n = len(partials(c))
        ne = len(thread(c))
        say = (WORDS * 3).strip()
        c.send({"cmd": "send", "project": project, "agent": "main", "mode": "now",
                "text": "[[pieces: 40 0.05]] [[say: %s]] [[bash: sleep 2; echo ran]] text then a tool" % say})
        # main is idle before the send is read: wait for the turn's own
        # entries first, or wait_idle returns at once
        c.wait(lambda: any(e["kind"] == "tools" for e in thread(c)[ne:]), 120, "the said reply's tool call")
        c0.wait_idle("main", timeout=90)
        time.sleep(0.5)
        evs = stream(c)[ne + n:]
        new_entries = thread(c)[ne:]
        kinds = [e["kind"] for e in new_entries]
        check("agent" in kinds and "tools" in kinds and kinds.index("agent") < kinds.index("tools")
              and new_entries[kinds.index("agent")]["text"].strip() == say and not new_entries[kinds.index("agent")].get("cut"),
              "the said text an agent entry before the tool: %r" % kinds)
        said = [p for p in partials(c)[n:] if p["text"] and say.startswith(p["text"])]
        check(said, "the said text streamed in first")
        call = said[0]["call"]
        clear_at = [i for i, e in enumerate(evs) if e.get("ev") == "partial" and e["call"] == call and e["text"] == ""]
        tool_at = [i for i, e in enumerate(evs) if e.get("ev") == "entry" and e["entry"]["kind"] == "tools"]
        check(clear_at and tool_at and clear_at[0] < tool_at[0], "cleared before the tool: %r %r" % (clear_at, tool_at))
        print("partial_e2e: ok (%d partials, late subscriber, stop, break kept at its place, retry to a tool, text then a tool)" % len(live))
        ok = True
    finally:
        E.close()
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
