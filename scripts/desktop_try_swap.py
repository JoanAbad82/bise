#!/usr/bin/env python3
"""desktop_try_swap: the app swaps itself to the staged gated build, from inside (ambient-lead m_22832).

  desktop_try_swap.py state <bundle>         one JSON line {state, live, staged, why} for the app at <bundle>
  desktop_try_swap.py swap <bundle> <pid>    the swap: refused (rc 2, the why in the log) unless the state is
                                             'staged'; else waits for the app <pid> to quit (it saved its keeps,
                                             window frame and route first), then the --real path of
                                             desktop_try (open_real: the bundle quits by pid, swap_staged, the
                                             open, finish_swap); his hubs keep running. Its words go to
                                             <build>/desktop-try/restart.log, its rc to restart.rc.

The app (apps/desktop/src/main/update/tryswap.ts) runs this file from its own try checkout (the
bundle is <checkout>/apps/desktop/dist/<arch>/bise try.app), so the stamp, the staged dir and the swap
are desktop_try's own, read the way --real reads them: the build dir and the home from HOME (his, or
a stand-in's under ~/.bise/gate, never his then: his_bise).

'staged' only when the swap would really happen: the stamp says 'staged', a --promote put it there
(the stamp's 'promoted'; a plain --try build staged while the try ran is not gated), the staged
bundle's id is dev.bise.desktop.try (never a candidate's dev.bise.desktop.cand) and every output of
the build is there (swap_staged's own check). 'current': nothing staged. 'none': no swap from here
(this app is not the try's bundle, no try stamp), the why says it. live is this bundle's build
(its runtime's VERSION commit), staged the staged one's. Tested in tests/desktop_try_swap_test.py.
"""
import json
import os
import sys
import time

import desktop_try as T
from desktop_try_env import TryError, his_env, homes, live_build


def swap_state(bundle, app, saved, staged_id, staged_ok, live, staged):
    """What the app's update row shows (pure): `bundle` the running app's, `app` the try's live
    bundle path, `saved` the try stamp (or None), `staged_id` the staged bundle's id, `staged_ok`
    every output of the staged build there, `live`/`staged` the two bundles' commits."""
    def out(state, why=None, staged_commit=None):
        return {"state": state, "live": live or None, "staged": staged_commit, "why": why}
    if os.path.realpath(bundle) != os.path.realpath(app):
        return out("none", "this app runs from %s, not from the try's bundle %s" % (bundle, app))
    if not saved:
        return out("none", "no try build here (no try.stamp)")
    if saved.get("where") != "staged":
        return out("current")
    head = (staged or saved.get("head") or "")[:8]
    if not saved.get("promoted"):
        return out("none", "the staged build %s isn't a gated one (no --promote): it goes live at the next bise-ambient --try" % head)
    if staged_id != T.APP_ID:
        return out("none", "the staged bundle is %s, not %s" % (staged_id or "unreadable", T.APP_ID))
    if not staged_ok:
        return out("none", "the staged build %s is incomplete: nothing to swap to" % head)
    return out("staged", None, staged or saved.get("head"))


def state(bundle, paths):
    saved = T.read_stamp(paths)
    staged_ok = bool(saved) and T.outputs_there(paths, paths["staged"], saved.get("root"))
    return swap_state(bundle, paths["app"], saved, T.bundle_id(paths["staged"]), staged_ok,
                      live_build(bundle).get("commit"), live_build(paths["staged"]).get("commit"))


def wait_gone(pid, timeout=15):
    """The app quits by itself once it saved (it spawned us first); open_real's quit_bundle takes what is left."""
    t0 = time.time()
    while T.pid_alive(pid) and time.time() - t0 < timeout:
        time.sleep(0.2)


def swap(bundle, pid, paths):
    """The swap, as --real does it. Returns its rc: 0 live on the staged build, 2 refused, 1 failed,
    3 the open happened on the old build (open_real said NOT UPDATED)."""
    st = state(bundle, paths)
    if st["state"] != "staged":
        T.say("no swap: %s" % (st["why"] or "nothing is staged"))
        return 2
    T.say("the app asked for the swap to %s (it was %s)" % (st["staged"][:8], (st["live"] or "?")[:8]))
    wait_gone(pid)
    real, tryh = homes()
    try:
        T.open_real(real, tryh, paths)
    except TryError as e:
        T.say(str(e))
        return 1
    return 0 if live_build(paths["app"]).get("commit") == st["staged"] else 3


def main(argv):
    paths = T.try_paths(his_env(os.environ))
    if len(argv) == 2 and argv[0] == "state":
        print(json.dumps(state(argv[1], paths)))
        return 0
    if len(argv) == 3 and argv[0] == "swap" and argv[2].isdigit():
        d = os.path.dirname(T.stamp_path(paths))
        os.makedirs(d, exist_ok=True)
        log = os.open(os.path.join(d, "restart.log"), os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
        os.dup2(log, 1)
        os.dup2(log, 2)
        T.say("--- %s" % time.strftime("%Y-%m-%d %H:%M:%S"))
        rc = swap(argv[1], int(argv[2]), paths)
        with open(os.path.join(d, "restart.rc.tmp"), "w") as f:
            f.write("%d\n" % rc)
        os.replace(os.path.join(d, "restart.rc.tmp"), os.path.join(d, "restart.rc"))
        return rc
    T.say("usage: desktop_try_swap.py state <bundle> | swap <bundle> <pid>")
    return 64


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
