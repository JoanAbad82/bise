#!/usr/bin/env python3
"""The image store's retention (D14, docs/images.md "Retention").

A real hub (bise sbd, scripted model) on a throwaway home whose image store
holds old and new images:
  1. shots_keep_days = 30: the hub's first tick prunes; a 10-day-old image
     stays, a crashed write's leftover (2 days) goes, a file the store did
     not write stays;
  2. an agent's open message (sb send main --expect-reply) names another
     10-day-old image;
  3. shots_keep_days = 7 and the hub's stamps cleared (a day later): the
     next tick touches the named image (its mtime is fresh again) and
     prunes: the unnamed 10-day-old image and its .b64 go, the named one,
     the new one and the foreign file stay.

Run: python3 -u tests/images_prune_e2e.py
"""
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
from e2e import check  # noqa: E402

DAY = 86400
OLD = "%032x" % 0xA1
NAMED = "%032x" % 0xB2
NEW = "%032x" % 0xC3


def put(d, name, age_s):
    p = os.path.join(d, name)
    with open(p, "w") as f:
        f.write("x")
    t = time.time() - age_s
    os.utime(p, (t, t))
    return p


def main():
    E = e2e.Env()
    ok = True
    try:
        store = E.env["BEND_IMAGE_DIR"]
        os.makedirs(store, exist_ok=True)
        for h, age in [(OLD, 10 * DAY), (NAMED, 10 * DAY), (NEW, 60)]:
            put(store, h + ".png", age)
            put(store, h + ".b64", age)
        put(store, "tmp-%s.png" % NEW, 2 * DAY)
        put(store, "notes.txt", 100 * DAY)
        # the user's prefs.json (bise_home's prefs_file: <root>/prefs.json)
        root = os.path.join(E.env["HOME"], ".bend-harness")
        os.makedirs(root, exist_ok=True)
        prefs = os.path.join(root, "prefs.json")

        def keep(days):
            with open(prefs, "w") as f:
                json.dump({"shots_keep_days": days}, f)

        def left():
            return sorted(os.listdir(store))

        def log():
            p = os.path.join(E.state, "hub.log")
            return open(p).read() if os.path.exists(p) else ""

        keep(30)
        c = E.start_hub()
        c.wait(lambda: "images: pruned" in log(), 60, "the first prune in hub.log")
        c.wait(lambda: not os.path.exists(os.path.join(store, "tmp-%s.png" % NEW)), 30, "the leftover gone")
        check(left() == sorted([OLD + ".b64", OLD + ".png", NAMED + ".b64", NAMED + ".png", NEW + ".b64", NEW + ".png", "notes.txt"]),
              "at 30 days the 10-day-old images stay: %r" % left())

        # an agent's open message names NAMED
        c.wait_idle("main")
        c.say('/new t1: {{bash: sb send main --expect-reply "look at %s/%s.png"}}' % (store, NAMED))
        c.wait(lambda: any(r.get("from") == "t1" and NAMED in r.get("body", "") for r in c.feed("main", "msg-in")), 120,
               "t1's message in main's feed")

        # a day later, at 7 days
        keep(7)
        for s in ("images-touched", "images-pruned"):
            os.remove(os.path.join(E.state, s))
        c.wait(lambda: not os.path.exists(os.path.join(store, OLD + ".png")), 60, "the unnamed old image pruned")
        c.wait(lambda: log().count("images: pruned") >= 2, 30, "the second prune's line")
        check(left() == sorted([NAMED + ".b64", NAMED + ".png", NEW + ".b64", NEW + ".png", "notes.txt"]),
              "at 7 days: the old one and its .b64 go, the named, new and foreign stay: %r" % left())
        age = time.time() - os.path.getmtime(os.path.join(store, NAMED + ".png"))
        check(age < 600, "the named image was touched by its hub (age %.0f s)" % age)
        check("touched the 1 image(s) this hub names" in log(), "hub.log says what it touched")
    except AssertionError as e:
        print("FAIL", e)
        p = os.path.join(E.state, "hub.log")
        print("hub.log:", "\n".join((open(p).read().splitlines() if os.path.exists(p) else [])[-60:]))
        print("state:", sorted(os.listdir(E.state)), time.time())
        print("store:", sorted(os.listdir(E.env["BEND_IMAGE_DIR"])) if os.path.isdir(E.env["BEND_IMAGE_DIR"]) else None)
        ok = False
    finally:
        E.close()
    print("images_prune_e2e:", "ok" if ok else "FAILED")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
