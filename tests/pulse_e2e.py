"""The project's pulse on a real hub (the H1 projects sidebar, brief
m_44811; rust/switchboard/src/pulse.rs, daemon/pulse.rs): one turn puts
busy time in the bucket of its time and sets last_ms; an artifact add
grows artifacts_at and makes it the news; a land on the trunk makes the
land the news; main's words count in said_at, his own don't; after the
hub stops, view.json carries the pulse. SB_PULSE_MS makes the minute's
check a fraction of a second.

Run: python3 -u tests/pulse_e2e.py (after scripts/bins.sh)
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
from e2e import EXE, check, sh  # noqa: E402
from proto_rpc import hub_now  # noqa: E402

BUCKET_MS = 8 * 3600 * 1000


def pulse(c):
    return (hub_now(c, "hub/pulse") or {}).get("pulse")


def wait_pulse(c, pred, what, timeout=60):
    return c.wait(lambda: (lambda p: p if p and pred(p) else None)(pulse(c)), timeout, what)


def bucket_of(p, ms):
    return (ms - p["from_ms"]) // BUCKET_MS


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: scripts/bins.sh")
    E = e2e.Env()
    E.env["SB_PULSE_MS"] = "300"
    sh(E.ws, "git branch -M main")
    ok_ = False
    try:
        c = E.start_hub()
        c.wait_status("main", "idle", 30)
        # initialize's state carries it, with its 21 buckets
        p = c.wait(lambda: pulse(c), 30, "hub/pulse in initialize's state")
        check(len(p["busy_ms"]) == 21, "21 buckets: %r" % p)
        # the fill: done soon on a fresh hub
        wait_pulse(c, lambda p: not p.get("counting"), "the week's fill done")

        # one turn: busy time in the bucket of its time, last_ms set
        c.say("hello there")
        c.wait_idle("main", timeout=60)
        p = wait_pulse(c, lambda p: sum(p["busy_ms"]) > 0 and p.get("last_ms"), "a turn's busy time")
        b = bucket_of(p, p["last_ms"])
        check(0 <= b < 21 and p["busy_ms"][b] > 0, "the turn's bucket %d holds it: %r" % (b, p))
        check(b == 20 or sum(p["busy_ms"][b + 1:]) == 0, "no time after the turn's bucket: %r" % p)
        # main's answer is for him: said_at; his own words are not
        p = wait_pulse(c, lambda p: len(p.get("said_at", [])) >= 1, "main's answer in said_at")
        said = len(p["said_at"])

        # an artifact add: artifacts_at grows, the news says it
        n = len(p.get("artifacts_at", []))
        c.say('[[bash: echo notes > "$TMPDIR/notes.md" && sb artifact add "$TMPDIR/notes.md" --title "Pulse notes"]]')
        c.wait_idle("main", timeout=60)
        p = wait_pulse(c, lambda p: len(p.get("artifacts_at", [])) > n and (p.get("news") or {}).get("what", {}).get("kind") == "artifact",
                       "artifacts_at grows and the news is the artifact")
        check(p["news"]["what"]["title"] == "Pulse notes", "the artifact's title: %r" % p["news"])
        check(len(p["said_at"]) >= said, "said_at never shrinks: %r" % p)

        # a land on the trunk: the news is the land
        c.say('[[bash: echo pulse > pulse.txt && sb land --here --add pulse.txt "chore: pulse e2e"]]')
        c.wait_idle("main", timeout=90)
        p = wait_pulse(c, lambda p: (p.get("news") or {}).get("what", {}).get("kind") == "landed", "the news is the land", timeout=90)
        what = p["news"]["what"]
        check(what["agent"] == "main" and what["target"] == "main" and what["sha"], "the land's news: %r" % what)
        tip = e2e.out(E.ws, "git rev-parse main")
        check(tip.startswith(what["sha"]), "the land's sha %s is main's tip %s" % (what["sha"], tip))

        # the hub stops: view.json keeps the pulse
        E.stop_hub()
        view = json.load(open(os.path.join(E.state, "view.json")))
        vp = view.get("pulse")
        check(vp and len(vp["busy_ms"]) == 21 and sum(vp["busy_ms"]) > 0 and vp.get("last_ms"), "view.json's pulse: %r" % vp)
        check((vp.get("news") or {}).get("what", {}).get("kind") == "landed", "view.json's news: %r" % vp)
        ok_ = True
        print("PASS pulse_e2e", flush=True)
    finally:
        E.close()
    sys.exit(0 if ok_ else 1)


if __name__ == "__main__":
    main()
