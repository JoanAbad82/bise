#!/usr/bin/env python3
"""desktop_try_swap: the app swaps itself to the staged gated build, from inside (ambient-lead m_22832).

  desktop_try_swap.py state <bundle>         one JSON line {state, live, staged, why, none, failed, log} for the
                                             app at <bundle>
  desktop_try_swap.py swap <bundle> <pid>    the swap: refused (rc 2, the why in the log) unless the state is
                                             'staged'; else waits for the app <pid> to quit (it saved its keeps,
                                             window frame and route first), then the --real path of
                                             desktop_try (open_real: the bundle quits by pid, swap_staged, the
                                             open, finish_swap); his hubs keep running. Its words go to
                                             <build>/desktop-try/restart.log, its end to restart.json
                                             {rc, from, to}. A swap that didn't reach the staged build
                                             reopens the bundle it left (reopen), so the app that comes
                                             back says it failed (state's 'failed').

The app (apps/desktop/src/main/update/tryswap.ts) runs this file from its own try checkout (the
bundle is <checkout>/apps/desktop/dist/<arch>/bise try.app), so the stamp, the staged dir and the swap
are desktop_try's own, read the way --real reads them: the build dir and the home from HOME (his, or
a stand-in's under ~/.bise/gate, never his then: his_bise).

'staged' only when the swap would really happen: the stamp says 'staged', a --promote put it there
(the stamp's 'promoted' names its head; a plain --try build staged while the try ran is not gated,
and an older stamp without the mark waits for the next promote), the staged
bundle's id is dev.bise.desktop.try (never a candidate's dev.bise.desktop.cand) and every output of
the build is there (swap_staged's own check). 'current': nothing staged. 'none': no swap from here,
`none` says which ('not_try': this app is not the try's bundle or there is no try stamp;
'not_gated': what is staged isn't a promoted, whole try build) and the why in words. live is this
bundle's build (its runtime's VERSION commit), staged the staged one's. failed: the staged build
the last swap from here didn't reach (restart.json), while it is still the one staged and this app
still isn't on it; else null. log: restart.log's path, the app's 'show the log'. Tested in
tests/desktop_try_swap_test.py.
"""
import json
import os
import sys
import time

import desktop_try as T
from desktop_try_env import TryError, his_bise, his_env, homes, live_build  # noqa: F401 (TryError: reopen's)


def swap_state(bundle, app, saved, staged_id, staged_ok, live, staged, last=None):
    """What the app's update row shows (pure): `bundle` the running app's, `app` the try's live
    bundle path, `saved` the try stamp (or None), `staged_id` the staged bundle's id, `staged_ok`
    every output of the staged build there, `live`/`staged` the two bundles' commits, `last` the
    last swap's restart.json (or None)."""
    def out(state, why=None, staged_commit=None, none=None):
        return {"state": state, "live": live or None, "staged": staged_commit, "why": why, "none": none, "failed": None}
    if os.path.realpath(bundle) != os.path.realpath(app):
        return out("none", "this app runs from %s, not from the try's bundle %s" % (bundle, app), none="not_try")
    if not saved:
        return out("none", "no try build here (no try.stamp)", none="not_try")
    if saved.get("where") != "staged":
        return out("current")
    head = (staged or saved.get("head") or "")[:8]
    if not saved.get("promoted"):
        return out("none", "the staged build %s isn't a gated one (no --promote): it goes live at the next bise-ambient --try" % head, none="not_gated")
    if saved.get("promoted") != saved.get("head"):
        return out("none", "the staged build %s isn't the promoted %s: it goes live at the next bise-ambient --try" % (head, saved["promoted"][:8]), none="not_gated")
    if staged_id != T.APP_ID:
        return out("none", "the staged bundle is %s, not %s" % (staged_id or "unreadable", T.APP_ID), none="not_gated")
    if not staged_ok:
        return out("none", "the staged build %s is incomplete: nothing to swap to" % head, none="not_gated")
    r = out("staged", None, staged or saved.get("head"))
    to = (last or {}).get("to")
    if (last or {}).get("rc") not in (0, None) and to and to == r["staged"] and to != live:
        r["failed"] = to
    return r


def restart_dir(paths):
    return os.path.dirname(T.stamp_path(paths))


def read_last(paths):
    """The last swap's restart.json, or None (none yet, or unreadable)."""
    try:
        with open(os.path.join(restart_dir(paths), "restart.json")) as f:
            v = json.load(f)
        return v if isinstance(v, dict) else None
    except (OSError, ValueError):
        return None


def write_last(paths, rec):
    d = restart_dir(paths)
    with open(os.path.join(d, "restart.json.tmp"), "w") as f:
        json.dump(rec, f)
    os.replace(os.path.join(d, "restart.json.tmp"), os.path.join(d, "restart.json"))


def state(bundle, paths):
    saved = T.read_stamp(paths)
    staged_ok = bool(saved) and T.outputs_there(paths, paths["staged"], saved.get("root"))
    r = swap_state(bundle, paths["app"], saved, T.bundle_id(paths["staged"]), staged_ok,
                   live_build(bundle).get("commit"), live_build(paths["staged"]).get("commit"), read_last(paths))
    r["log"] = os.path.join(restart_dir(paths), "restart.log")
    return r


def wait_gone(pid, timeout=15):
    """The app quits by itself once it saved (it spawned us first); open_real's quit_bundle takes what is left."""
    t0 = time.time()
    while T.pid_alive(pid) and time.time() - t0 < timeout:
        time.sleep(0.2)


def reopen(paths):
    """A swap that didn't reach the staged build: the app quit for nothing, so the bundle it left
    (the try's live one, the old build) opens again on the same home, as --real opens it, unless an
    app of that bundle already runs. Its update row then says the swap failed (state's 'failed')."""
    app = paths["app"]
    if not os.path.isdir(app) or T.bundle_apps(app):
        return
    real, _ = homes()
    try:
        T.open_bundle(real, app, T.real_app_env(os.environ, real, his_bise()), os.environ)
        T.say("reopened %s (%s)" % (app, live_build(app).get("commit", "")[:8] or "unknown build"))
    except (TryError, OSError) as e:
        T.say("couldn't reopen %s: %s" % (app, e))


def swap(bundle, pid, paths):
    """The swap, as --real does it. Returns (rc, its target or None): 0 live on the staged build,
    2 refused, 1 failed, 3 the open happened on the old build (open_real said NOT UPDATED). The app
    quits whatever the answer (it spawned us first), so every rc but 0 reopens what it left."""
    st = state(bundle, paths)
    if st["state"] != "staged":
        T.say("no swap: %s" % (st["why"] or "nothing is staged"))
        wait_gone(pid)
        reopen(paths)
        return 2, None
    T.say("the app asked for the swap to %s (it was %s)" % (st["staged"][:8], (st["live"] or "?")[:8]))
    wait_gone(pid)
    real, tryh = homes()
    try:
        T.open_real(real, tryh, paths)
    except Exception as e:  # noqa: BLE001 - any failure (a TryError, an open that exited non-zero): the app must come back
        T.say(str(e) or type(e).__name__)
        reopen(paths)
        return 1, st["staged"]
    if live_build(paths["app"]).get("commit") == st["staged"]:
        return 0, st["staged"]
    reopen(paths)
    return 3, st["staged"]


def main(argv):
    paths = T.try_paths(his_env(os.environ))
    if len(argv) == 2 and argv[0] == "state":
        print(json.dumps(state(argv[1], paths)))
        return 0
    if len(argv) == 3 and argv[0] == "swap" and argv[2].isdigit():
        d = restart_dir(paths)
        os.makedirs(d, exist_ok=True)
        log = os.open(os.path.join(d, "restart.log"), os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
        os.dup2(log, 1)
        os.dup2(log, 2)
        T.say("--- %s" % time.strftime("%Y-%m-%d %H:%M:%S"))
        live = live_build(argv[1]).get("commit")
        rc, to = swap(argv[1], int(argv[2]), paths)
        write_last(paths, {"rc": rc, "from": live, "to": to, "at": int(time.time())})
        return rc
    T.say("usage: desktop_try_swap.py state <bundle> | swap <bundle> <pid>")
    return 64


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
