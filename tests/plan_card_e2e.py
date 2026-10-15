"""A plan an agent proposes, against a real hub (plan-ok, Gabriel's pick A).

A real hub (bise sbd, scripted model) on a throwaway repo: main publishes a
page with a plan block run by lean-install and its other ways. One card,
asked by lean-install (sb-core's page_card), with pick A's words; his typed
words go to lean-install and the card stays; a new version replaces the
card; option 2 starts the other way: lean-install hears it, the card
closes once; a version marked started opens none. The page's button: a
start note on the plan sent from the page does the same. A plan whose
agent is gone is asked by the page's agent. No browser, no app.

Run: python3 -u tests/plan_card_e2e.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
import wait  # noqa: E402
from e2e import EXE, check  # noqa: E402
from ambient_pages_e2e import request, settle  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLAN = open(os.path.join(ROOT, "kit", "examples", "lean-plan.html")).read()
GIST = ("3 PRs, about −2.6 GB and −2 min 40 for each new worktree: pnpm installs lean by default, AGENTS.md says which "
        "install to run, and win32 leaves the platform binaries (that one goes through CI).")
WORDS = ("lean installs: start the plan lean-install recommends?\n" + GIST + "\n\n"
         "1. start the plan\n2. start it, but keep win32\n3. start all 3 and linux/arm64\n4. open the plan and its alternatives")


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: cd rust && cargo build")
    E = e2e.Env()
    ok = True
    try:
        c = E.start_hub()
        c.wait_status("main", "idle", 60)
        c.say("/new lean-install: {{bash: sleep 240}}")
        c.wait_status("lean-install", "working", 60)
        page = os.path.join(E.tmp, "lean.html")
        open(page, "w").write(PLAN)
        c.say('[[bash: sb page publish %s --id lean --title "lean installs"]]' % page)
        plan = lambda pid="lean": [x for x in c.cards() if x.get("kind") == "plan" and x.get("text", "").startswith("lean installs:") and (x.get("page") or {}).get("id") == pid]
        c.wait(plan, 90, "the plan's card")
        wait.stable(lambda: [x["id"] for x in plan()], 30, "the plan's cards", quiet=1)
        card = plan()[0]
        check(len(plan()) == 1, "one card: %r" % plan())
        check(card["agent"] == "lean-install", "asked by the plan's agent, not bise: %r" % card)
        check(card["text"] == WORDS, "pick A's words: %r" % card["text"])
        check(not [x for x in c.cards() if "drafts wait" in x.get("text", "") or "send these" in x.get("text", "")], "no batch card beside it: %r" % c.cards())
        check(card.get("page", {}).get("block") == "plan" and card["page"]["url"].endswith("/p/lean#plan"), "it links the plan: %r" % card.get("page"))
        acts = {o.get("n"): o.get("act") for o in card.get("options", [])}
        check((acts.get(4) or {}).get("artifact") == "lean" and not any(acts.get(n) for n in (1, 2, 3)),
              "its last option opens the page in the app, the others start: %r" % card.get("options"))
        settle(c)

        # his words go to lean-install, the card stays
        c.say("/answer %d ok, but keep win32: we need it" % card["id"])
        c.wait_line("lean-install", "ok, but keep win32: we need it", 60)
        wait.holds(lambda: [x["id"] for x in plan()] == [card["id"]], 3, lambda: "words leave the card open: %r" % plan())
        # 4 = open the page: nothing starts, the card stays
        c.say("/answer %d 4" % card["id"])
        wait.holds(lambda: [x["id"] for x in plan()] == [card["id"]], 3, lambda: "open leaves the card open: %r" % plan())
        settle(c)

        # its next version replaces the card (one card, its new words)
        open(page, "w").write(PLAN.replace("(that one goes through CI)", "(that one goes through CI; win32 stays)"))
        c.say('[[bash: sb page publish %s --id lean]]' % page)
        c.wait(lambda: plan() and plan()[0]["id"] != card["id"], 90, "a new card for v2")
        wait.stable(lambda: [x["id"] for x in plan()], 30, "the plan's cards", quiet=1)
        check(len(plan()) == 1 and "win32 stays" in plan()[0]["text"], "v2 replaced v1's card: %r" % plan())
        card = plan()[0]
        settle(c)

        # option 2: its other way starts, lean-install hears it, the card closes
        c.say("/answer %d 2" % card["id"])
        c.wait(lambda: not plan(), 30, "the card closes on a start")
        c.wait_line("lean-install", 'the user started the other way "1 and 2 only" (start it, but keep win32)', 60)
        port = int(open(os.path.join(E.state, "pages.port")).read().strip())
        notes = json.loads(request(port, "GET", "/p/lean/meta")[2])["notes"]
        starts = [n for n in notes if n["kind"] == "start"]
        check(len(starts) == 1 and starts[0]["block"] == "others" and starts[0].get("item") == "keep-win32" and starts[0].get("to") == "lean-install",
              "one start note, routed to lean-install: %r" % starts)
        check(not any("you asked for an agent on these items" in l for l in c.lines("main")), "never to main as an item start")
        settle(c)
        # the agent marks it started: no card for that version
        open(page, "w").write(PLAN.replace('data-id="keep-win32"', 'data-id="keep-win32" data-started="11:42"'))
        c.say('[[bash: sb page publish %s --id lean]]' % page)
        c.wait_line("main", "published lean v3", 60)
        wait.holds(lambda: not plan(), 5, lambda: "a started plan opens no card: %r" % plan())
        settle(c)

        # the page's button: a start note on the plan block, sent
        two = os.path.join(E.tmp, "lean2.html")
        open(two, "w").write(PLAN)
        c.say('[[bash: sb page publish %s --id lean2 --title "lean installs"]]' % two)
        c.wait(lambda: plan("lean2"), 90, "lean2's card")
        wait.stable(lambda: [x["id"] for x in plan("lean2")], 30, "lean2's cards", quiet=1)
        st, _, body = request(port, "GET", "/p/lean2")
        token = body.split('<meta name="bise-token" content="')[1].split('"')[0]
        origin = "http://127.0.0.1:%d" % port
        h = {"Origin": origin, "X-Bise-Token": token}
        st, _, _ = request(port, "POST", "/api/p/lean2/notes", {"notes": [{"block": "plan", "kind": "start", "text": "start the plan"}]}, h)
        check(st == 200, "the start note saved: %d" % st)
        st, _, _ = request(port, "POST", "/api/p/lean2/send", {}, h)
        check(st == 200, "sent: %d" % st)
        c.wait(lambda: not plan("lean2"), 30, "the page's start closes the card")
        c.wait_line("lean-install", 'the user started your plan "make installs lean by default"', 60)
        settle(c)

        # a plan whose agent is gone: the page's agent asks (main here)
        ghost = os.path.join(E.tmp, "ghost.html")
        open(ghost, "w").write(PLAN.replace('data-agent="lean-install"', 'data-agent="ghost"').replace("lean installs", "ghost plan"))
        c.say('[[bash: sb page publish %s --id ghost --title "ghost plan"]]' % ghost)
        g = lambda: [x for x in c.cards() if x.get("kind") == "plan" and x.get("text", "").startswith("ghost plan:")]
        c.wait(g, 90, "the ghost plan's card")
        check(g()[0]["agent"] == "main", "no live plan agent: the page's agent asks: %r" % g())
        settle(c)
    except AssertionError as e:
        print("FAIL", e)
        ok = False
        try:
            for a in ("main", "lean-install"):
                for l in c.lines(a)[-10:]:
                    print("  %s:" % a, l[:300])
            print(open(os.path.join(E.tmp, "hub.stderr")).read()[-1500:])
        except Exception:
            pass
    finally:
        E.close()
    print("plan_card_e2e:", "ok" if ok else "FAILED")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
