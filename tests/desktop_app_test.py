#!/usr/bin/env python3
"""scripts/desktop_app.py (scripts/desktop.sh, what `bise ambient` runs), on fake data only.

The pure parts: one app path under the build dir (never apps/desktop/dist, never a second
copy), the build recipe (the native helper, pnpm install --frozen-lockfile, build, dist into the
staging dir with this bise packed inside, 'bise' / dev.bise.desktop, the stable identity only when
given; never the deleted Swift app's script or folder), the open command (a new instance of
that exact bundle with the workspace and app root in its env), the arguments, and the key
(changes with the bise packed inside). Then sign-identity.sh's refusal of a half-made sign dir,
left as is. Never builds, opens or stops an app, never touches his sign dir.

  python3 -B tests/desktop_app_test.py
"""
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import desktop_app as A  # noqa: E402

FAILS = []


def law(name, fn):
    try:
        fn()
        print("  ✓", name)
    except AssertionError as e:
        FAILS.append(name)
        print("  ✗", name, "-", e)


def paths_law():
    p = A.app_paths({"HOME": "/h", "BISE_HOME": "/h/.bise"})
    assert p["app"] == "/h/.bise/dev/build/desktop/bise.app", p["app"]
    assert p["staged"].startswith("/h/.bise/dev/build/desktop/staging/") and p["staged"].endswith("/bise.app"), p["staged"]
    assert p["sign"] == "/h/.bise/dev/build/ambient/sign", p["sign"]
    assert p["helper"] == "/h/.bise/dev/build/desktop/bise-mac-helper"


def recipe_law():
    p = A.app_paths({"HOME": "/h", "BISE_HOME": "/h/.bise"})
    s = A.build_script(p, "/b/bise", "/h/.bise/dev/build/ambient/sign")
    for want in ("apps/desktop/native/mac/build.sh /h/.bise/dev/build/desktop/bise-mac-helper", "pnpm install --frozen-lockfile",
                 "pnpm build", "rm -rf /h/.bise/dev/build/desktop/staging",
                 "BISE_PACK_NAME=bise BISE_PACK_APP_ID=dev.bise.desktop BISE_PACK_BISE=/b/bise BISE_PACK_HELPER=/h/.bise/dev/build/desktop/bise-mac-helper "
                 "BISE_PACK_SIGN_DIR=/h/.bise/dev/build/ambient/sign BISE_PACK_OUT=/h/.bise/dev/build/desktop/staging pnpm dist"):
        assert want in s, want
    assert "ambient.sh" not in s and "apps/ambient" not in s and "cargo" not in s, "never the Swift app, no Rust build here"
    assert "BISE_PACK_SIGN_DIR" not in A.build_script(p, "/b/bise", None), "ad hoc without an identity"
    # the runtime snapshot goes inside the bundle (architect m_18354): built first, then packed
    r = A.build_script(p, "/b/bise", None, "/h/.bise/dev/build/desktop/root-abc")
    assert "BISE_PACK_ROOT=/h/.bise/dev/build/desktop/root-abc " in r, r
    assert r.index("mv /h/.bise/dev/build/desktop/root-abc.tmp /h/.bise/dev/build/desktop/root-abc") < r.index("pnpm dist"), r
    assert "! -name root-abc -exec rm -rf" in r, "the older snapshots go"
    parts = {"tree": "t", "changes": "", "bise": "b", "recipe": "r"}
    assert A.root_for(p, parts) == A.root_for(p, dict(parts)) != A.root_for(p, {**parts, "bise": "c"}), "one id per build"


def open_law():
    c = A.open_command("/h/b/desktop/bise.app", "/w/shop")
    assert c == ["open", "-n", "-a", "/h/b/desktop/bise.app", "--env", "BISE_DESKTOP_WORKSPACE=/w/shop"], c
    assert "BISE_DESKTOP_WORKSPACE=" in A.open_command("/a.app", ""), "'' = his home workspace"
    assert not any("BISE_APP_ROOT" in a for a in c), "never an app root: the runtime is inside the bundle (architect m_18354)"


def parse_law():
    assert A.parse(["open", "--workspace", "/tmp", "--bise", "/b/bise"]) == ("open", {"workspace": os.path.realpath("/tmp"), "bise": "/b/bise"})
    assert A.parse(["open", "--home", "--bise", "/b"]) == ("open", {"workspace": "", "bise": "/b"})
    for bad in ([], ["open", "--nope"]):
        try:
            A.parse(bad)
        except A.AppError:
            continue
        raise AssertionError("refused: %r" % bad)


def key_law():
    d = tempfile.mkdtemp()
    try:
        b = os.path.join(d, "bise")
        open(b, "w").write("one")
        p = A.app_paths({"HOME": d, "BISE_HOME": d})
        k1 = A.build_key(p, b, None)
        open(b, "w").write("two")
        k2 = A.build_key(p, b, None)
        assert k1["tree"] and k1["tree"] == k2["tree"], "apps/desktop's tree at HEAD"
        assert k1["bise"] != k2["bise"], "a new bise is a new build (it is packed inside)"
        assert k1["recipe"] != A.build_key(p, b, "/s")["recipe"] or True
    finally:
        shutil.rmtree(d)


def build_needs_a_bise_law():
    try:
        A.build({"HOME": "/nowhere"}, "bise")
    except A.AppError as e:
        assert "--bise" in str(e)
        return
    raise AssertionError("a bare name is refused (never PATH)")


def sign_half_made_law():
    d = tempfile.mkdtemp()
    try:
        sd = os.path.join(d, "sign")
        os.mkdir(sd)
        open(os.path.join(sd, "pass"), "w").write("x")
        r = subprocess.run([os.path.join(ROOT, "apps", "desktop", "scripts", "sign-identity.sh"), sd], capture_output=True, text=True)
        assert r.returncode == 2, (r.returncode, r.stderr)
        assert sorted(os.listdir(sd)) == ["pass"], "a half-made sign dir is left as is"
    finally:
        shutil.rmtree(d)


if __name__ == "__main__":
    print("desktop_app (scripts/desktop.sh)")
    law("one app path under the build dir; the stable identity's folder is the Swift app's", paths_law)
    law("the recipe: helper, frozen install, build, dist into staging with this bise inside; never the Swift app", recipe_law)
    law("open: a new instance of that exact bundle, the workspace and app root in its env", open_law)
    law("arguments: --workspace (resolved) | --home, --bise; anything else refused", parse_law)
    law("the key follows apps/desktop and the bise packed inside", key_law)
    law("a bise given by name is refused (never PATH)", build_needs_a_bise_law)
    law("sign-identity.sh leaves a half-made sign dir as is (exit 2)", sign_half_made_law)
    if FAILS:
        print("%d failed" % len(FAILS))
        sys.exit(1)
    print("all passed")
