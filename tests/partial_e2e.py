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

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
import wait  # noqa: E402
from e2e import EXE, check  # noqa: E402

WORDS = ("the answer streams in, a piece at a time — déjà vu ✓, "
         "and the final entry replaces it without a jump. ")


EVS = {"thread/partial": "partial", "thread/entry": "entry"}


def stream(c, agent="main"):
    """The thread/partial and thread/entry notifications of `agent`, in
    arrival order, as their params with `ev` (partial, entry)."""
    with c.lock:
        return [dict(e["params"], ev=EVS[e["method"]]) for e in c.events
                if e.get("method") in EVS and "id" not in e and (e.get("params") or {}).get("agent") == agent]


def u16(s):
    """The length of s in UTF-16 code units: the unit of a partial's off
    (as JS indexes strings; architect m_17866)."""
    return len(s.encode("utf-16-le")) // 2


def fold(text, call, e):
    """One thread/partial onto the text so far (bise-proto's LiveText):
    `text` goes at `off` UTF-16 code units; off 0 starts again; a gap
    (past the end, inside a surrogate pair, another call) empties it."""
    off = e.get("off", 0)
    if off == 0:
        return e["text"], e["call"]
    if e["call"] != call or off > u16(text):
        return "", call
    try:
        head = text.encode("utf-16-le")[:off * 2].decode("utf-16-le")
    except UnicodeDecodeError:
        return "", call
    return head + e["text"], call


def partials(c, agent="main"):
    """The partials as the client folds them: each with `text` the whole
    text after it and `delta` what the event carried."""
    out, text, call = [], "", ""
    for e in stream(c, agent):
        if e["ev"] == "partial":
            text, call = fold(text, call, e)
            out.append(dict(e, text=text, delta=e["text"]))
    return out


def thread(c, agent="main"):
    return [e["entry"] for e in stream(c, agent) if e["ev"] == "entry"]


def entries(c, kind, agent="main"):
    return [e for e in thread(c, agent) if e["kind"] == kind]


def mark(c):
    """Where the thread is now: the newest entry's pos and the stream's
    length (a known pos comes again as a replace, so new entries are
    counted by pos, not by how many notifications came)."""
    return max((e["pos"] for e in thread(c)), default=-1), len(stream(c))


def entries_after(c, m):
    """The entries newer than mark `m`, each at its latest version, by pos."""
    by = {e["pos"]: e for e in thread(c) if e["pos"] > m[0]}
    return [by[p] for p in sorted(by)]


def stream_after(c, m):
    """The partials and the new entries' notifications since mark `m`."""
    return [e for e in stream(c)[m[1]:] if e["ev"] == "partial" or e["entry"]["pos"] > m[0]]


def transcript(E):
    # transcript lines are "<ts>\t<line>"
    path = os.path.join(E.state, "agents", "main", "transcript.log")
    return [l.split("\t", 1)[-1] for l in open(path, encoding="utf-8").read().splitlines()]


def subscribed(E, name):
    """A JSON-RPC client subscribed to main's thread (thread/subscribe):
    the client and its subscribe request's id."""
    c = e2e.Client(os.path.join(E.state, "hub.sock"), name)
    rid = c.call("thread/subscribe", {"project": c.project(), "agent": "main"})
    c.wait(lambda: c._response(rid), 20, "main's thread page")
    return c, rid


def send(c, text):
    r = c.rpc("turn/send", {"project": c.project(), "agent": "main", "text": text, "mode": "now"})
    # the result carries the id sb-core gave his message (f4c033f6) and why: made (96c7d4498)
    res = r.get("result") or {}
    check(set(res) == {"msg_id", "reason"} and isinstance(res["msg_id"], int) and res["reason"] == "made", "turn/send: %r" % r)


def settled(c):
    """Every notification of the turn read: none for a while."""
    wait.stable(lambda: len(c.events), 20, "the notifications settled", quiet=0.5)


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: scripts/bins.sh")
    E = e2e.Env()
    ok = False
    try:
        c0 = E.start_hub()
        c0.wait_status("main", "idle", 60)
        c, _ = subscribed(E, "partial-e2e")

        # 1. a slow stream: partials, each a prefix of the final, then ""
        reply = os.path.join(E.tmp, "reply.txt")
        text = (WORDS * 14).strip()
        open(reply, "w", encoding="utf-8").write(text)
        send(c, "[[pieces: 40 0.05]] [[reply: %s]] stream it" % reply)
        c.wait(lambda: entries(c, "agent"), 120, "main's answer")
        final = entries(c, "agent")[-1]["text"]
        c.wait(lambda: partials(c) and partials(c)[-1]["text"] == "", 20, "the partial cleared")
        ps = partials(c)
        live = [p["text"] for p in ps if p["text"]]
        check(len(live) >= 2, "at least two partials before the entry: %d" % len(live))
        check(all(final.startswith(t) for t in live), "each partial a prefix of the final: %r" % [t[-30:] for t in live])
        check(all(len(a) < len(b) for a, b in zip(live, live[1:])), "each partial grows")
        # deltas, never the whole text again (architect m_17813): the
        # events carry the answer once
        sent = sum(u16(p["delta"]) for p in ps)
        check(sent == u16(live[-1]), "the deltas add up to the text once: %d units sent for %d" % (sent, u16(live[-1])))
        check(all(p["off"] == u16(a) for p, a in zip(ps[1:], live) if p["delta"]), "each delta at the end of the text so far")
        check(len({p["call"] for p in ps}) == 1, "one call: %r" % {p["call"] for p in ps})
        check([p["text"] for p in ps].count("") == 1, "cleared once: %r" % [len(p["text"]) for p in ps])
        # the "" comes at the entry: no partial after it is non-empty
        check(ps[-1]["text"] == "", "the last partial is the clear")
        tr = open(os.path.join(E.state, "agents", "main", "transcript.log"), encoding="utf-8").read()
        check("partial #" not in tr, "no partial line in the transcript")
        c0.wait_idle("main", timeout=90)

        # 2. a late subscriber gets the text so far right after its thread
        # page (thread/subscribe's result, then thread/partial); then a
        # stop clears it and nothing follows
        n = len(partials(c))
        send(c, "[[pieces: 24 0.15]] [[reply: %s]] stream it slowly" % reply)
        c.wait(lambda: any(p["text"] for p in partials(c)[n:]), 90, "a partial of the slow one")
        late, rid = subscribed(E, "partial-late")
        late.wait(lambda: partials(late), 20, "the late subscriber's partial")
        with late.lock:
            order = ["page" if e.get("id") == rid else "partial" for e in late.events
                     if e.get("id") == rid or (e.get("method") == "thread/partial" and "id" not in e)]
        check(order[:2] == ["page", "partial"] and partials(late)[0]["text"], "thread page then the text so far: %r" % order)
        check(final.startswith(partials(late)[0]["text"]), "the late text is a prefix")

        stopped = c.interrupt("main")
        check(stopped.get("result") == {}, "turn/interrupt: %r" % stopped)
        c.wait(lambda: partials(c)[-1]["text"] == "", 30, "the stop clears the partial")
        k = len(partials(c))
        c0.wait_idle("main", timeout=60)
        wait.holds(lambda: not any(p["text"] for p in partials(c)[k:]), 1.0, "nothing after the stop")
        # a known pos comes again as a replace (thread/entry): count the
        # answers by pos; the stopped one never got an entry
        answers = {e["pos"]: e["text"] for e in entries(c, "agent")}
        check(len(answers) == 1, "the stopped answer did not land: %r, tail %r"
              % ({p: len(t) for p, t in answers.items()}, transcript(E)[-8:]))

        # 3. an attempt that breaks mid-stream keeps what he read, at its
        # place (designer m_13334, m_13562): the stream breaks, the hub
        # writes the text as an `sb kept` line right before the retry's
        # line and clears the partial; the retry fails for good (a final
        # 400): the notices go UNDER the kept text, in arrival order
        n = len(partials(c))
        m = mark(c)
        send(c, "[[pieces: 40 0.05]] [[error: cut]] [[error: badname]] [[reply: %s]] fail it" % reply)
        c.wait(lambda: any(e.get("cut") for e in entries_after(c, m)), 120, "the kept answer")
        c0.wait_idle("main", timeout=60)
        settled(c)
        ps = partials(c)[n:]
        new_entries = entries_after(c, m)
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
        kis = [i for i, l in enumerate(tr) if (e2e.feed_rec(l) or ("",))[0] == "kept"]
        check(kis, "an sb kept line in the transcript")
        check("provider_retry:" in tr[kis[-1] + 1], "the kept line right before the retry: %r" % tr[kis[-1]:kis[-1] + 2])

        # 4. text, a break, then a retry that answers with a tool call only
        # (architect m_13563 a): attempt 1's text is kept and cleared at the
        # retry, so nothing of it is live while the tool runs
        n = len(partials(c))
        m = mark(c)
        send(c, "[[pieces: 40 0.05]] [[error: cut]] [[bash: sleep 2; echo ran]] [[reply: %s]] retry to a tool" % reply)
        c.wait(lambda: any(e["kind"] == "tools" for e in entries_after(c, m)), 120, "the retry's tool call")
        c0.wait_idle("main", timeout=90)
        settled(c)
        evs = stream_after(c, m)
        ps = partials(c)[n:]
        first = next((p["call"] for p in ps if p["text"]), None)
        check(first, "attempt 1 streamed text: %r" % [len(p["text"]) for p in ps])
        clear_at = [i for i, e in enumerate(evs) if e.get("ev") == "partial" and e["call"] == first and e["text"] == ""]
        tool_at = [i for i, e in enumerate(evs) if e.get("ev") == "entry" and e["entry"]["kind"] == "tools"]
        check(clear_at and tool_at and clear_at[0] < tool_at[0], "attempt 1 cleared before the tool: %r %r" % (clear_at, tool_at))
        check(not any(e.get("ev") == "partial" and e["call"] == first and e["text"]
                      for e in evs[clear_at[0]:]), "nothing of attempt 1 after its clear")
        new_entries = entries_after(c, m)
        check([e for e in new_entries if e.get("cut")], "attempt 1's text kept: %r" % [e["kind"] for e in new_entries])

        # 5. text then a tool call in ONE reply (architect m_13563 b): the
        # text is an assistant line before the tool lines, so it settles
        # into an agent entry and nothing is live while the tool runs
        n = len(partials(c))
        m = mark(c)
        say = (WORDS * 3).strip()
        send(c, "[[pieces: 40 0.05]] [[say: %s]] [[bash: sleep 2; echo ran]] text then a tool" % say)
        # main is idle before the send is read: wait for the turn's own
        # entries first, or wait_idle returns at once
        c.wait(lambda: any(e["kind"] == "tools" for e in entries_after(c, m)), 120, "the said reply's tool call")
        c0.wait_idle("main", timeout=90)
        settled(c)
        evs = stream_after(c, m)
        new_entries = entries_after(c, m)
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
