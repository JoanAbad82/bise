#!/usr/bin/env python3
"""The desktop app's release (scripts/desktop_release.py, desktop_sign.py, desktop_feed.py,
desktop_publish.py): its pure parts, and one inside-out ad hoc signing of a fake bundle, on fake data.

  - signing: what is code (thin, fat, Java class, text), the order (deepest first, the app
    last), the codesign argv (hardened, a timestamp only with a certificate, the entitlements on
    executables and apps, never a library), and a fake .app with a nested framework signed and
    verified deep and strict;
  - the feed: the shape agreed with dist-updater and dist-site (the reader's fields, built = the
    app's VERSION built=, absolute URLs on the immutable desktop-v* release, the DMG under one
    name), the tag scheme, and the channels' rules (never back, stable never ahead of beta);
  - publishing: every gh release create/edit says --latest=false, a build is a draft first,
    prerelease while only beta has it;
  - the runtime: one terminal tag on the commit, the darwin-arm64 archive, the seams;
  - the DMG settings: the designer's layout.json and background (with its @2x) are there.

No network, no gh, no keychain, no notarization.

  python3 -B tests/desktop_release_test.py
"""
import json
import os
import shutil
import struct
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(REPO, "scripts"))
import desktop_feed as F  # noqa: E402
import desktop_publish as P  # noqa: E402
import desktop_release as R  # noqa: E402
import desktop_sign as S  # noqa: E402

SHA = "a" * 64
SHB = "b" * 64


def check(ok, what):
    if not ok:
        raise AssertionError(what)


def raises(exc, fn, *a):
    try:
        fn(*a)
    except exc:
        return True
    return False


def thin(filetype):
    return b"\xcf\xfa\xed\xfe" + struct.pack("<III", 0x0100000C, 0, filetype) + b"\0" * 48


def test_what_is_code():
    check(S.macho_kind(thin(2)) == "exec", "MH_EXECUTE is an executable")
    check(S.macho_kind(thin(6)) == "lib", "MH_DYLIB is a library")
    check(S.macho_kind(thin(8)) == "lib", "MH_BUNDLE (a .node module) is signed like a library")
    check(S.macho_kind(b"#!/bin/sh\necho hi\n" + b"\0" * 50) is None, "a script is not code")
    fat = b"\xca\xfe\xba\xbe" + struct.pack(">I", 2) + struct.pack(">IIIII", 0x0100000C, 0, 4096, 100, 14) + b"\0" * 40
    check(S.fat_slice(fat) == 4096, "a universal binary's first slice")
    java = b"\xca\xfe\xba\xbe" + struct.pack(">I", 52) + b"\0" * 56
    check(S.fat_slice(java) is None, "a Java class is not a universal binary")


def test_the_order_and_argv():
    items = [("Contents/MacOS/bise", "exec"), ("Contents/Frameworks/Electron Framework.framework", "bundle"),
             ("Contents/Frameworks/Electron Framework.framework/Versions/A/Electron Framework", "lib"),
             ("Contents/Frameworks/bise Helper.app", "bundle"),
             ("Contents/Frameworks/bise Helper.app/Contents/MacOS/bise Helper", "exec"),
             ("Contents/Resources/bin/bise", "exec")]
    order = [r for r, _ in S.plan(items)]
    check(order[-1] == ".", "the app is signed last")
    for inner, outer in (("Contents/Frameworks/Electron Framework.framework/Versions/A/Electron Framework",
                          "Contents/Frameworks/Electron Framework.framework"),
                         ("Contents/Frameworks/bise Helper.app/Contents/MacOS/bise Helper", "Contents/Frameworks/bise Helper.app")):
        check(order.index(inner) < order.index(outer), "%s before the bundle around it" % inner)
    check(S.plan(list(reversed(items))) == S.plan(items), "the order doesn't depend on the walk")
    ent = "/e.plist"
    a = S.codesign_argv("/x/bise.app/Contents/Resources/bin/bise", "exec", "ABC", ent, "/k", "Contents/Resources/bin/bise")
    check("--options" in a and a[a.index("--options") + 1] == "runtime", "hardened runtime")
    check("--timestamp" in a and "--timestamp=none" not in a, "a certificate gets a secure timestamp")
    check(a[a.index("--identifier") + 1] == "dev.bise.bise", "a bare executable is dev.bise.<name>")
    check(a[a.index("--entitlements") + 1] == ent and a[a.index("--keychain") + 1] == "/k", "entitlements and keychain")
    lib = S.codesign_argv("/x/l.dylib", "lib", "ABC", ent, None, "Contents/l.dylib")
    check("--entitlements" not in lib and "--identifier" not in lib, "a library gets no entitlements")
    fw = S.codesign_argv("/x/E.framework", "bundle", "ABC", ent, None, "Contents/Frameworks/E.framework")
    check("--entitlements" not in fw, "a framework gets no entitlements")
    for rel in (".", "Contents/Frameworks/bise Helper.app"):
        check("--entitlements" in S.codesign_argv("/x", "bundle", "ABC", ent, None, rel), "%s gets the entitlements" % rel)
    adhoc = S.codesign_argv("/x", "bundle", "-", ent, None, ".")
    check("--timestamp=none" in adhoc and "--timestamp" not in adhoc, "ad hoc: no timestamp (Apple stamps certificates only)")
    check(S.ident("Contents/Frameworks/bise Helper (GPU)") == "dev.bise.bise-Helper-GPU", S.ident("bise Helper (GPU)"))


def test_entitlements_file():
    import plistlib
    with open(S.ENTITLEMENTS, "rb") as f:
        e = plistlib.load(f)
    for k in ("com.apple.security.cs.allow-jit", "com.apple.security.cs.allow-unsigned-executable-memory",
              "com.apple.security.device.audio-input", "com.apple.security.automation.apple-events"):
        check(e.get(k) is True, "entitlements: %s" % k)
    check(not any("get-task-allow" in k or "disable-library-validation" in k for k in e), "nothing notarization refuses or needs not")


def fake_app(root):
    """A fake bise.app: a real executable (a copy of /usr/bin/true, thin arm64 slice not needed:
    codesign signs any Mach-O), a nested framework holding a dylib-shaped copy, a script."""
    app = os.path.join(root, "bise.app")
    for d in ("Contents/MacOS", "Contents/Resources/bin", "Contents/Frameworks/X.framework/Versions/A/Resources"):
        os.makedirs(os.path.join(app, d))
    with open(os.path.join(app, "Contents", "Info.plist"), "w") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?><plist version="1.0"><dict>'
                '<key>CFBundleIdentifier</key><string>dev.bise.test</string><key>CFBundleExecutable</key><string>bise</string>'
                '<key>CFBundlePackageType</key><string>APPL</string></dict></plist>')
    fw = os.path.join(app, "Contents/Frameworks/X.framework")
    with open(os.path.join(fw, "Versions/A/Resources/Info.plist"), "w") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?><plist version="1.0"><dict>'
                '<key>CFBundleIdentifier</key><string>dev.bise.x</string><key>CFBundleExecutable</key><string>X</string>'
                '<key>CFBundlePackageType</key><string>FMWK</string></dict></plist>')
    for dst in ("Contents/MacOS/bise", "Contents/Resources/bin/sb-core", "Contents/Frameworks/X.framework/Versions/A/X"):
        p = os.path.join(app, dst)
        shutil.copy("/usr/bin/true", p)
        subprocess.run(["codesign", "--remove-signature", p], capture_output=True)
    os.symlink("A", os.path.join(fw, "Versions/Current"))
    os.symlink("Versions/Current/X", os.path.join(fw, "X"))
    os.symlink("Versions/Current/Resources", os.path.join(fw, "Resources"))
    with open(os.path.join(app, "Contents/Resources/bin/run.sh"), "w") as f:
        f.write("#!/bin/sh\n")
    return app


def test_signs_a_fake_bundle():
    if sys.platform != "darwin":
        return
    with tempfile.TemporaryDirectory() as t:
        app = fake_app(t)
        found = dict(S.scan(app))
        check("Contents/Resources/bin/run.sh" not in found, "a script is not signed on its own")
        check("Contents/Frameworks/X.framework/X" not in found, "a symlink is signed where it points")
        check(found.get("Contents/Frameworks/X.framework") == "bundle", "the framework is a bundle")
        steps = S.sign(app, "-")
        check(steps[-1] == (".", "bundle"), steps[-1])
        d = subprocess.run(["codesign", "-dv", os.path.join(app, "Contents/Resources/bin/sb-core")], capture_output=True, text=True).stderr
        check("Identifier=dev.bise.sb-core" in d and R.hardened(d), d)
        e = subprocess.run(["codesign", "-d", "--entitlements", ":-", app], capture_output=True, text=True).stdout
        check("allow-jit" in e, "the app carries its entitlements")


def version(tag="desktop-v2026.10.1", built="2026-10-12T08:40:00Z"):
    return F.version_text(F.app_id(tag), built, "c" * 40, "8c13fd8")


def test_tags_and_version():
    check(F.app_id("desktop-v2026.10.1") == "desktop-2026.10.1", "a tag's app id")
    for bad in ("v2026.10.2-34", "desktop-v2026.10", "desktop-latest", "desktop-v2026.10.1-beta", ""):
        check(raises(F.FeedError, F.app_id, bad), "%r is no desktop release tag" % bad)
    check(F.dry_id("0123456789abcdef") == "desktop-dry-0123456789ab", "a dry run's id")
    v = F.read_version(version())
    check(v["id"] == "desktop-2026.10.1" and v["built"] == "2026-10-12T08:40:00Z" and v["runtime_id"] == "8c13fd8", v)
    for bad in ("2026-10-12T08:40:00+00:00", "2026-10-12", "2026-10-12T08:40:00.5Z"):
        check(raises(F.FeedError, F.version_text, "x", bad, "c", "r"), "built %r is refused" % bad)


def feed(tag="desktop-v2026.10.1", built="2026-10-12T08:40:00Z", channel="beta"):
    return F.feed("gvergnaud/bise", tag, channel, version(tag, built), SHA, 1000, SHB, 2000, built)


def test_the_feed_shape():
    f = feed()
    check(f["kind"] == "desktop" and f["channel"] == "beta" and f["version"] == "desktop-v2026.10.1", f)
    check(f["paused"] is False and f["runtime_id"] == "8c13fd8", f)
    t = f["targets"]["darwin-arm64"]
    check(t["id"] == "desktop-2026.10.1" and t["built"] == "2026-10-12T08:40:00Z", "built is the VERSION's, byte for byte")
    check(t["url"] == "https://github.com/gvergnaud/bise/releases/download/desktop-v2026.10.1/bise-mac-arm64.zip", t["url"])
    check(t["dmg"]["url"].endswith("/desktop-v2026.10.1/bise-mac-arm64.dmg") and t["dmg"]["size"] == 2000, t["dmg"])
    check(t["sha256"] == SHA and t["size"] == 1000 and t["min_macos"] == R.MACOS_TARGET, t)
    check(f["notes_url"] == "https://github.com/gvergnaud/bise/releases/tag/desktop-v2026.10.1", f["notes_url"])
    check(F.parse(F.dumps(f)) == f, "the feed round-trips")
    check(raises(F.FeedError, F.feed, "gvergnaud/bise", "desktop-v2026.10.2", "beta", version(), SHA, 1, SHB, 1,
                 "2026-10-12T08:40:00Z"), "a VERSION from another tag is refused")
    check(raises(F.FeedError, F.parse, json.dumps({"version": "x", "targets": {}})), "a terminal latest.json is no feed")
    s = F.on_channel(dict(f, paused=True), "stable", "2026-10-13T00:00:00Z")
    check(s["channel"] == "stable" and s["paused"] is False and s["targets"] == f["targets"], "promote keeps the build")
    check(F.with_paused(f, True)["paused"] is True, "pause")


def test_the_feed_reader_reads_it():
    """The Rust reader's fields, as parse_desktop wants them (kind, targets.<t>.{id,url,sha256,built})."""
    t = feed()["targets"][F.TARGET]
    for k in ("id", "url", "sha256", "built"):
        check(isinstance(t.get(k), str) and t[k], "the reader needs %s" % k)


def test_the_channels():
    n1, n2 = feed(built="2026-10-12T08:40:00Z"), feed("desktop-v2026.10.2", "2026-10-14T08:40:00Z")
    check(F.may_publish(n1, None, "beta") is None, "the first beta")
    check(F.may_publish(n1, n1, "beta") is None, "a re-run")
    check("never goes back" in F.may_publish(n1, n2, "beta"), "beta never goes back")
    check("beta first" in F.may_publish(n1, None, "stable", None), "stable needs a beta")
    check("beta first" in F.may_publish(n2, None, "stable", n1), "stable never ahead of beta")
    check(F.may_publish(n1, None, "stable", n2) is None, "an older build beta went through")
    check(F.may_publish(n2, n1, "stable", n2) is None, "the promote")
    check("never goes back" in F.may_publish(n1, n2, "stable", n2), "stable never goes back")
    check(F.may_publish(n1, None, "nightly") is not None, "two channels only")
    check(F.CHANNELS == {"beta": "desktop-beta", "stable": "desktop-latest"}, F.CHANNELS)
    check(F.notes_from_tag_message("  - one\n- two\n", "t") == "- one\n- two\n", "the tag's notes")
    check(F.notes_from_tag_message("", "desktop-v2026.10.1") == "bise for Mac, desktop-v2026.10.1.\n", "a stand-in")


def test_publish_argv():
    argvs = [P.draft_argv("desktop-v2026.10.1", "n.md", ["a"]), P.publish_build_argv("desktop-v2026.10.1", "beta"),
             P.publish_build_argv("desktop-v2026.10.1", "stable"), P.rolling_create_argv("desktop-beta", "t", "n", "main"),
             P.rolling_edit_argv("desktop-latest", "t", "n"), P.upload_argv("desktop-beta", ["x"])]
    check(P.every_gh_write(argvs), "every gh release create/edit says --latest=false")
    check(not P.every_gh_write([["gh", "release", "edit", "x", "--draft=false"]]), "the pin catches a missing one")
    check("--draft" in argvs[0] and "--prerelease" in argvs[0], "a build is a prerelease draft first")
    check("--prerelease=true" in argvs[1] and "--prerelease=false" in argvs[2], "prerelease until stable has it")
    for n in ("latest.json", "install.sh") + tuple(x for x in P.ASSETS if x.endswith(".tar.gz")):
        check(n not in P.ASSETS, "the desktop never uploads %s" % n)
    check(F.DMG in P.ASSETS and F.FEED in P.ASSETS and F.ZIP in P.ASSETS, P.ASSETS)
    src = open(os.path.join(REPO, "scripts", "desktop_publish.py")).read()
    check("--latest=true" not in src and "make_latest" not in src, "never latest")


def test_runtime_rules():
    check(R.runtime_tag("v2026.10.2-35\ndesktop-v2026.10.1\n") == "v2026.10.2-35", "the terminal tag on the commit")
    check(raises(R.ReleaseError, R.runtime_tag, "desktop-v2026.10.1"), "no terminal release on the commit")
    check(raises(R.ReleaseError, R.runtime_tag, "v1 v2"), "two terminal tags: ambiguous")
    names = ["bise-8c13fd8-darwin-arm64.tar.gz", "bise-8c13fd8-darwin-arm64.tar.gz.sha256", "bise-8c13fd8-darwin-x86_64.tar.gz",
             "latest.json"]
    check(R.archive_name(names) == "bise-8c13fd8-darwin-arm64.tar.gz", "the arm64 archive")
    check(R.skew("rust/proto/x.rs\nrust/home/src/a.rs\napps/desktop/x.ts\nrust/protocol/y\n") == ["rust/proto/x.rs", "rust/home/src/a.rs"],
          "the seams")


def test_pack_and_dmg_settings():
    p = R.paths("/o")
    apple = {"APPLE_API_KEY_PATH": "/k.p8", "APPLE_API_KEY_ID": "K", "APPLE_API_ISSUER": "I", "APPLE_ID": "a@b",
             "APPLE_APP_SPECIFIC_PASSWORD": "p", "APPLE_TEAM_ID": "T", "APPLE_KEYCHAIN_PROFILE": "bise-notary"}
    env = R.pack_env({"PATH": "/bin", "BISE_PACK_SIGN_DIR": "/s", "CSC_LINK": "x", "CSC_KEY_PASSWORD": "y", **apple}, p, "/rt")
    check("BISE_PACK_SIGN_DIR" not in env and "CSC_LINK" not in env and "CSC_KEY_PASSWORD" not in env,
          "no other signing reaches electron-builder")
    check(not [k for k in env if k.startswith("APPLE_")], "no notary key reaches electron-builder (it would notarize)")
    check(env["PATH"] == "/bin" and env["CSC_IDENTITY_AUTO_DISCOVERY"] == "false" and env["BISE_PACK_IDENTITY"] == "-", env)
    check(env["BISE_PACK_APP_ID"] == "dev.bise.desktop" and env["BISE_PACK_NAME"] == "bise", env)
    check(env["BISE_PACK_BISE"] == "/rt/bise" and env["BISE_PACK_ROOT"] == "/rt" and env["BISE_PACK_VERSION"] == "/o/VERSION", env)
    check(p["dmg"].endswith("/release/bise-mac-arm64.dmg") and p["zip"].endswith("/release/bise-mac-arm64.zip"), p)
    lay = R.layout()
    s = R.dmg_settings("/o/bise.app", lay)
    check(s["files"] == ["/o/bise.app"] and s["symlinks"] == {"Applications": "/Applications"}, s)
    check(set(s["icon_locations"]) == {"bise.app", "Applications"}, s["icon_locations"])
    check(s["window_rect"][1] == (lay["window"]["width"], lay["window"]["height"]), s["window_rect"])
    check(os.path.isfile(s["background"]), "the background %s" % s["background"])
    base, ext = os.path.splitext(s["background"])
    check(os.path.isfile(base + "@2x" + ext), "its @2x next to it (one HiDPI tiff)")
    check(not s["show_toolbar"] and not s["show_sidebar"], "a bare window")
    if shutil.which("node"):
        # electron-builder.mjs itself, with the notary keys in the env: it never notarizes
        with tempfile.TemporaryDirectory() as t:
            for f in ("bise", "helper", "VERSION", "repl-live", "sb-core"):
                open(os.path.join(t, f), "w").close()
            js = "import(process.argv[1]).then(m => console.log(JSON.stringify(m.default.mac)))"
            r = subprocess.run(["node", "-e", js, "file://" + os.path.join(R.DESKTOP, "electron-builder.mjs")],
                               capture_output=True, text=True,
                               env=dict(R.pack_env({"PATH": os.environ.get("PATH", ""), **apple}, R.paths(t), t),
                                        BISE_PACK_BISE=os.path.join(t, "bise"), BISE_PACK_HELPER=os.path.join(t, "helper"),
                                        BISE_PACK_VERSION=os.path.join(t, "VERSION"), **apple))
            check(r.returncode == 0, r.stderr)
            mac = json.loads(r.stdout)
            check(mac.get("notarize") is False, "electron-builder's config says notarize: false: %s" % mac)
    na = R.notary_argv("/x.zip")
    check("--wait" in na and "${APPLE_API_KEY_PATH}" in na, "notarytool waits, the key is a path from the env")
    check(R.dmgbuild_argv("s.py", "bise", "o.dmg")[-4:] == ["-s", "s.py", "bise", "o.dmg"], "dmgbuild's argv")


def main():
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for t in tests:
        t()
    print("desktop release: %d tests ok" % len(tests))


if __name__ == "__main__":
    main()
