"""wake-deliver: what reaches an agent that waits on a watch or a timer.

The user's rule: his message and his card answer always wake the agent at
once, whatever it waits on (its watches and timers stay live and fire
later); a watch or a timer that fires while the agent is mid-turn reaches
it in that turn, steered, like `sb send`'s default --mode steer; a page
question answered on its page reaches the page's agent (the pick) and
the card's asker, main, in one message (main's card #513: he answered on
the page, main never heard it).

A real hub (bise sbd, scripted model), a throwaway home:
1. t1 has a live file watch and a 10 min timer and asked main a question
   (a card for the user): his card answer, then his direct message, each
   start a turn of t1 at once; the watch is still live and fires later;
   the timer is still live;
2. a watch that fires while t1 is mid-turn (a `sleep 8`): its wake is in
   that turn (steered, before its turn_done), not after it;
3. a timer due while t1 is mid-turn: its fire is in that turn too;
4. t1's page asks a question (the hub opens the card as main): his
   answer goes to t1 as the pick, and main gets ONE message with it.

Run: python3 -u tests/wake_deliver_e2e.py
"""
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
import wait  # noqa: E402
from e2e import EXE, check  # noqa: E402

AT_ONCE = 8  # a turn starts within seconds (the fake model answers at once)
PAGE = ('<section data-kit="question" data-id="q1"><p>ship it today?</p>'
        '<ol><li>ship today</li><li>wait for monday</li></ol></section>\n')


def journal(E, kind):
    return [json.loads(l) for l in open(os.path.join(E.state, "journal.jsonl")) if '"%s"' % kind in l]


def live_watches(E, agent):
    ended = {j["id"] for j in journal(E, "wake_end")}
    return [j["watch"]["id"] for j in journal(E, "wake_set") if j["watch"]["agent"] == agent and j["watch"]["id"] not in ended]


def live_timers(E, agent):
    stopped = {j["id"] for j in journal(E, "every_stop")}
    return [j["id"] for j in journal(E, "every_set") if j["agent"] == agent and j["id"] not in stopped]


def turn_of(lines, k):
    """The turn line `k` falls in: (its turn_started, its turn_done), or None."""
    start = max((i for i in range(k) if lines[i].strip() == "obs: turn_started"), default=None)
    done = next((i for i in range(k, len(lines)) if lines[i].strip().startswith("obs: turn_done")), None)
    if start is None or done is None:
        return None
    if any(lines[i] == "--- idle" for i in range(start, k)):
        return None
    return start, done


def in_turn(c, agent, needle, marker):
    """The wake holding `needle` came inside the turn that ran `marker`
    (a tool call's command): steered, before that turn's end."""
    ls = c.lines(agent)
    k = next(i for i, l in enumerate(ls) if l.startswith("sb msg-in") and needle in l)
    m = max(i for i, l in enumerate(ls) if l.startswith("tool #") and marker in l)
    t = turn_of(ls, m)
    check(t is not None, "the turn of %r" % marker)
    check(t[0] < k < t[1], "%r arrived in the busy turn (msg-in #%d, turn #%d..#%d)" % (needle, k, t[0], t[1]))
    check(any(l.startswith("sb steer-rx") for l in ls[k:t[1]]), "%r was steered in (a steer-rx before the turn's end)" % needle)


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: cd rust && cargo build")
    E = e2e.Env()
    E.env["SB_EVERY_MIN_MS"] = "1000"
    ok = True
    c = None
    try:
        c = E.start_hub()
        c.wait_status("main", "idle", 60)
        rc = os.path.join(E.tmp, "rc")

        # 1. t1 waits on a watch and a timer, with a question card open
        c.say('/new t1: {{bash: sb wake --on-file %s --note FILE-NOTE}} {{bash: sb every 10m "TIMER-TICK"}} '
              '{{bash: sb send main --expect-reply "v1 or v2?"}}' % rc)
        c.wait(lambda: any(r.get("from") == "t1" and "v1 or v2" in r.get("body", "") for r in c.feed("main", "msg-in")), 120, "t1's question")
        c.wait_idle("main", "t1")
        mid = next("m_%d" % r["id"] for r in c.feed("main", "msg-in") if r.get("from") == "t1" and r.get("id"))
        c.say('[[bash: sb card --for %s "v1 or v2?"]]' % mid)
        c.wait(lambda: any(cd["kind"] == "question" for cd in c.cards()), 60, "the question card")
        card = [cd for cd in c.cards() if cd["kind"] == "question"][0]
        c.wait_idle("main", "t1")
        check(live_watches(E, "t1") and live_timers(E, "t1"), "t1 waits on a watch and a timer")
        check((c.agent("t1") or {}).get("watching"), "t1's row says what it watches: %r" % c.agent("t1"))

        # his card answer wakes t1 at once
        n = len(c.lines("t1"))
        t0 = time.time()
        c.say("/answer %d v2-ANSWER" % card["id"])
        c.wait(lambda: any("ack: " in l and "v2-ANSWER" in l for l in c.lines("t1")[n:]), AT_ONCE, "t1's turn on his card answer")
        print("card answer: t1's turn after %.2f s" % (time.time() - t0))
        c.wait_idle("t1")

        # his direct message wakes t1 at once
        n = len(c.lines("t1"))
        t0 = time.time()
        c.say("DIRECT-HELLO", focus="t1")
        c.wait(lambda: any("ack: DIRECT-HELLO" in l for l in c.lines("t1")[n:]), AT_ONCE, "t1's turn on his message")
        print("direct message: t1's turn after %.2f s" % (time.time() - t0))
        c.wait_idle("t1")

        # the watch and the timer are still live: the watch fires later
        check(live_watches(E, "t1") and live_timers(E, "t1"), "the watch and the timer outlive both turns")
        open(rc, "w").write("0\n")
        c.wait(lambda: any(l.startswith("sb msg-in") and "FILE-NOTE" in l for l in c.lines("t1")), 30, "the watch's wake, later")
        c.wait_idle("t1")

        # 2. a watch fires mid-turn: steered into that turn
        rc2 = os.path.join(E.tmp, "rc2")
        c.say("[[bash: sb wake --on-file %s --note MID-NOTE]] [[bash: sleep 8]] [[bash: echo AFTER-SLEEP]]" % rc2, focus="t1")
        c.wait(lambda: any(l.startswith("tool #") and "sleep 8" in l for l in c.lines("t1")), 60, "t1 mid-turn (sleep 8)")
        open(rc2, "w").write("0\n")
        c.wait(lambda: any(l.startswith("sb msg-in") and "MID-NOTE" in l for l in c.lines("t1")), 30, "the mid-turn wake")
        c.wait_idle("t1")
        in_turn(c, "t1", "MID-NOTE", "sleep 8")

        # 3. a timer due mid-turn: its fire in that turn
        c.say('[[bash: sb every 3s "TICK-MID" --times 1]] [[bash: sleep 9]] [[bash: echo AFTER-TICK]]', focus="t1")
        c.wait(lambda: any(l.startswith("sb msg-in") and "TICK-MID" in l for l in c.lines("t1")), 40, "the mid-turn timer fire")
        c.wait_idle("t1")
        in_turn(c, "t1", "TICK-MID", "sleep 9")

        # 4. a page question answered: the pick to t1, one message to main
        page = os.path.join(E.tmp, "page.html")
        open(page, "w").write(PAGE)
        c.say("[[bash: sb page publish %s --id t1-plan --title \"t1 plan\"]]" % page, focus="t1")
        c.wait(lambda: any((x.get("page") or {}).get("block") == "q1" for x in c.cards()), 60, "the page's question card")
        q1 = next(x for x in c.cards() if (x.get("page") or {}).get("block") == "q1")
        check(q1["agent"] == "main", "the hub asks as main: %r" % q1)
        c.wait_idle("t1", "main")
        nm = len(c.lines("main"))
        nt = len(c.lines("t1"))
        c.say("/answer %d 1" % q1["id"])
        c.wait(lambda: not any(x["id"] == q1["id"] for x in c.cards()), 30, "the card closed")
        c.wait(lambda: any("ship today" in l for l in c.lines("t1")[nt:]), AT_ONCE * 2, "t1 gets the pick")
        told = "the user answered notification #%d on the page t1-plan" % q1["id"]
        c.wait(lambda: any(l.startswith("sb msg-in") and told in l for l in c.lines("main")[nm:]), AT_ONCE * 2, "main told")
        c.wait_idle("t1", "main")
        ms = [m for m in journal(E, "message_sent") if told in m["msg"]["text"]]
        check(len(ms) == 1 and ms[0]["msg"]["to"] == "main" and "ship today" in ms[0]["msg"]["text"], "one message to main: %r" % ms)
    except AssertionError as e:
        print("FAIL", e)
        if c:
            print("\n".join(c.lines("t1")[-80:]))
        ok = False
    finally:
        E.close()
    print("wake_deliver_e2e:", "ok" if ok else "FAILED")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
