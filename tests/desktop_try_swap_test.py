#!/usr/bin/env python3
"""scripts/desktop_try_swap.py (the app's swap to the staged gated build, ambient-lead m_22832), on
fake data only: the state's laws (swap_state, pure), the state read from a fake try build dir (its
stamp, a staged bundle with its Info.plist id and runtime VERSION), the swap refused with its words
and an rc 2 when nothing gated is staged (nothing moves), his_bise from the user database whatever
HOME says, and --real's open on a stand-in HOME never taken for his (real_app_env).

  python3 -B tests/desktop_try_swap_test.py
"""
import json
import os
import plistlib
import pwd
import shutil
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "scripts"))
import desktop_try as T  # noqa: E402
import desktop_try_env as E  # noqa: E402
import desktop_try_swap as S  # noqa: E402

FAILS = []
A, B = "a" * 40, "b" * 40


def check(ok, what):
    if not ok:
        FAILS.append(what)
        print("FAIL", what)


def laws():
    app = "/t/apps/desktop/dist/mac-arm64/bise try.app"
    staged = {"head": B, "where": "staged", "root": "/r", "promoted": B}
    st = lambda **k: S.swap_state(**dict(dict(bundle=app, app=app, saved=staged, staged_id=T.APP_ID, staged_ok=True, live=A, staged=B), **k))
    check(st() == {"state": "staged", "live": A, "staged": B, "why": None}, "a promoted, whole, try-id build: staged %s" % st())
    check(st(staged=None)["staged"] == B, "no VERSION in the staged bundle: the stamp's head")
    check(st(saved=dict(staged, where="live")) == {"state": "current", "live": A, "staged": None, "why": None}, "live stamp: current")
    r = st(bundle="/x/bise try.app")
    check(r["state"] == "none" and "not from the try's bundle" in r["why"] and r["live"] == A, "another bundle: none, live kept: %s" % r)
    check(st(saved=None)["why"] == "no try build here (no try.stamp)", "no stamp: none")
    r = st(saved={k: v for k, v in staged.items() if k != "promoted"})
    check(r["state"] == "none" and "isn't a gated one (no --promote)" in r["why"], "a plain --try build staged: never swapped from the app: %s" % r)
    r = st(staged_id=T.CAND_ID)
    check(r == {"state": "none", "live": A, "staged": None, "why": "the staged bundle is dev.bise.desktop.cand, not dev.bise.desktop.try"},
          "a candidate's id: refused in words: %s" % r)
    check(st(staged_id=None)["why"] == "the staged bundle is unreadable, not dev.bise.desktop.try", "no Info.plist: refused")
    r = st(staged_ok=False)
    check(r["state"] == "none" and "incomplete" in r["why"], "outputs missing: none (swap_staged would not swap)")


def bundle(path, app_id, commit):
    os.makedirs(os.path.join(path, "Contents", "Resources", "bin"), exist_ok=True)
    with open(os.path.join(path, "Contents", "Info.plist"), "wb") as f:
        plistlib.dump({"CFBundleIdentifier": app_id}, f)
    with open(os.path.join(path, "Contents", "Resources", "bin", "VERSION"), "w") as f:
        f.write("id=root-%s\ncommit=%s\nrepo=/x\n" % (commit[:12], commit))
    open(T.packed_bise(path), "w").close()


def on_disk():
    w = tempfile.mkdtemp(prefix="dtry-swap-")
    try:
        build = os.path.join(w, "build")
        sd = os.path.join(build, "desktop-try", "staged")
        paths = {"bise": os.path.join(build, "target", "debug", "bise"), "helper": os.path.join(build, "desktop-try", "bise-mac-helper"),
                 "app": os.path.join(w, "src", "apps", "desktop", "dist", "mac-arm64", "bise try.app"),
                 "staged_dir": sd, "staged": os.path.join(sd, "mac-arm64", "bise try.app")}
        root = os.path.join(build, "desktop-try", "root-b")
        for p in (paths["bise"], paths["helper"], os.path.join(root, "repl-live")):
            os.makedirs(os.path.dirname(p), exist_ok=True)
            open(p, "w").close()
        bundle(paths["app"], T.APP_ID, A)
        check(S.state(paths["app"], paths)["why"] == "no try build here (no try.stamp)", "no stamp yet")
        T.write_stamp(paths, {"head": A, "where": "live", "root": root})
        check(S.state(paths["app"], paths) == {"state": "current", "live": A, "staged": None, "why": None}, "live: current, live from the bundle")
        bundle(paths["staged"], T.APP_ID, B)
        T.write_stamp(paths, {"head": B, "where": "staged", "root": root, "promoted": B})
        check(S.state(paths["app"], paths) == {"state": "staged", "live": A, "staged": B, "why": None}, "promoted: staged %s" % S.state(paths["app"], paths))
        bundle(paths["staged"], T.CAND_ID, B)
        check("dev.bise.desktop.cand" in S.state(paths["app"], paths)["why"], "the plist's id is read")
        # a refused swap moves nothing and says why, rc 2
        said, real_say = [], T.say
        T.say = lambda *a: said.append(" ".join(a))
        try:
            rc = S.swap(paths["app"], 999999, paths)
        finally:
            T.say = real_say
        check(rc == 2 and any("no swap: the staged bundle is dev.bise.desktop.cand" in s for s in said), "refused: rc 2 and its words: %s" % said)
        check(E.live_build(paths["app"]).get("commit") == A and os.path.isdir(paths["staged"]) and T.read_stamp(paths)["where"] == "staged",
              "nothing moved")
        os.remove(T.stamp_path(paths))
        check(S.swap(paths["app"], 999999, paths) == 2, "no stamp: refused too")
    finally:
        shutil.rmtree(w, ignore_errors=True)


def his_home():
    his = os.path.join(pwd.getpwuid(os.getuid()).pw_dir, ".bise")
    stand = os.path.join(E.GATE, "amb-mac-swap", "h", ".bise")
    old = os.environ.get("HOME")
    os.environ["HOME"] = os.path.dirname(stand)
    try:
        check(E.his_bise() == his, "his_bise reads the user database, never HOME")
        check(E.GATE == os.path.realpath(os.path.join(his, "gate")), "the gate is his, never inside a stand-in's HOME")
        check(E.homes({})[0] == os.path.realpath(stand), "the stand-in's HOME: its .bise is the one --real opens on")
        extra = T.real_app_env({"BISE_DESKTOP_OFFSCREEN": "1"}, stand, E.his_bise())
        check(extra == ["HOME=%s" % os.path.dirname(stand), "BISE_HOME=%s" % stand, "BISE_DESKTOP_OFFSCREEN=1"],
              "a swap from a stand-in reopens on the stand-in, off-screen, never bare on his home: %s" % extra)
    finally:
        os.environ["HOME"] = old


if __name__ == "__main__":
    laws()
    on_disk()
    his_home()
    print("desktop-try-swap: %s" % ("all pass" if not FAILS else "%d FAIL" % len(FAILS)))
    sys.exit(1 if FAILS else 0)
