#!/usr/bin/env python3
"""desktop-sign: sign bise desktop's bundle from the inside out, hardened, with one identity.

  scripts/desktop_sign.py <bise.app> --identity <sha1|name|-> [--keychain <kc>] [--entitlements <plist>]

The release's signing (desktop-release.yml, scripts/desktop_release.py): never `codesign --deep`.
Every piece of code in the bundle is signed on its own, deepest first, so each one's seal is
made before the bundle around it seals it: the Mach-O files (the runtime's bise, repl-live,
sb-core, bend-jsrt, the native helper, Electron's dylibs and its .node modules), then the
nested bundles (Electron's frameworks, the 'bise Helper' apps), then bise.app.

  - hardened runtime (--options runtime) on everything, a secure timestamp with a real identity
    (--timestamp; none with '-', the dry run's ad hoc identity: Apple's timestamp server only
    stamps certificates);
  - the entitlements (apps/desktop/resources/entitlements.mac.plist: V8's JIT for Electron and
    bend-jsrt, the microphone, Apple Events) on the executables and the apps, never on a library;
  - a bare executable is named dev.bise.<name> (scripts/bins.sh's names); a bundle keeps its
    Info.plist's id.

What a symlink points at is signed where it lives, never twice. The pure parts (what is code, the
order, the codesign argv) are tested in tests/desktop_release_test.py.
"""
import argparse
import os
import re
import struct
import subprocess
import sys

HERE = os.path.dirname(os.path.realpath(__file__))
ENTITLEMENTS = os.path.join(os.path.dirname(HERE), "apps", "desktop", "resources", "entitlements.mac.plist")
BUNDLES = (".app", ".framework", ".xpc", ".appex", ".bundle")
MH_EXECUTE = 2


class SignError(Exception):
    pass


def macho_kind(head):
    """'exec', 'lib' or None for a file's first bytes (64 are enough for a thin file; a fat one
    needs its first slice's header too: see read_kind). Pure."""
    if len(head) < 16:
        return None
    if head[:4] in (b"\xcf\xfa\xed\xfe", b"\xce\xfa\xed\xfe"):
        return "exec" if struct.unpack("<I", head[12:16])[0] == MH_EXECUTE else "lib"
    if head[:4] in (b"\xfe\xed\xfa\xcf", b"\xfe\xed\xfa\xce"):
        return "exec" if struct.unpack(">I", head[12:16])[0] == MH_EXECUTE else "lib"
    return None


def fat_slice(head):
    """The offset of a universal binary's first slice, or None (not fat; a Java class shares the
    magic but its 'count' is its version, 45 and up). Pure."""
    if len(head) < 28 or head[:4] != b"\xca\xfe\xba\xbe":
        return None
    n = struct.unpack(">I", head[4:8])[0]
    if not 0 < n < 20:
        return None
    return struct.unpack(">I", head[16:20])[0]


def read_kind(path):
    try:
        with open(path, "rb") as f:
            head = f.read(64)
            off = fat_slice(head)
            if off is not None:
                f.seek(off)
                head = f.read(64)
    except OSError:
        return None
    return macho_kind(head)


def scan(app):
    """Every piece of code under the app, as (path relative to it, 'exec' | 'lib' | 'bundle'):
    real files and dirs only (a symlink is the place it points at, signed there)."""
    found = []
    for d, dirs, files in os.walk(app):
        rel = os.path.relpath(d, app)
        for name in sorted(dirs):
            p = os.path.join(d, name)
            if not os.path.islink(p) and name.endswith(BUNDLES):
                found.append((os.path.normpath(os.path.join(rel, name)), "bundle"))
        dirs[:] = [n for n in dirs if not os.path.islink(os.path.join(d, n))]
        for name in sorted(files):
            p = os.path.join(d, name)
            if os.path.islink(p):
                continue
            k = read_kind(p)
            if k:
                found.append((os.path.normpath(os.path.join(rel, name)), k))
    return found


def depth(rel):
    return len([c for c in rel.split(os.sep) if c not in ("", ".")])


def plan(items):
    """The signing order: deepest first (what a bundle holds is sealed before the bundle), then
    by path, so two runs sign alike; the app itself ('.') last. Each step: (rel, kind). Pure."""
    inner = sorted((i for i in items if i[0] != "."), key=lambda i: (-depth(i[0]), i[0]))
    return inner + [(".", "bundle")]


def ident(rel):
    """A bare executable's identifier: dev.bise.<name>, its name's spaces and odd chars as '-'. Pure."""
    return "dev.bise." + re.sub(r"[^A-Za-z0-9.-]+", "-", os.path.basename(rel)).strip("-")


def codesign_argv(path, kind, identity, entitlements=None, keychain=None, rel=None):
    """codesign's argv for one step. Pure."""
    argv = ["codesign", "--force", "--sign", identity, "--options", "runtime",
            "--timestamp=none" if identity == "-" else "--timestamp"]
    if keychain:
        argv += ["--keychain", keychain]
    if kind == "exec":
        argv += ["--identifier", ident(rel or path)]
    an_app = kind == "bundle" and (rel == "." or (rel or path).rstrip("/").endswith(".app"))
    if entitlements and (kind == "exec" or an_app):
        argv += ["--entitlements", entitlements]
    return argv + [path]


def sign(app, identity, keychain=None, entitlements=ENTITLEMENTS, say=None):
    """Sign every step of plan(scan(app)), then verify the whole: deep and strict."""
    if not os.path.isdir(app) or not app.rstrip("/").endswith(".app"):
        raise SignError("not an app bundle: %s" % app)
    if entitlements and not os.path.isfile(entitlements):
        raise SignError("no entitlements file at %s" % entitlements)
    steps = plan(scan(app))
    for rel, kind in steps:
        path = os.path.normpath(os.path.join(app, rel))
        r = subprocess.run(codesign_argv(path, kind, identity, entitlements, keychain, rel), capture_output=True, text=True)
        if r.returncode != 0:
            raise SignError("codesign %s: %s" % (rel, (r.stderr or r.stdout).strip()))
    if say:
        say("signed %d pieces of code in %s, inside out" % (len(steps), os.path.basename(app)))
    r = subprocess.run(["codesign", "--verify", "--deep", "--strict", "--verbose=2", app], capture_output=True, text=True)
    if r.returncode != 0:
        raise SignError("codesign --verify --deep --strict: %s" % r.stderr.strip())
    return steps


def main(argv):
    ap = argparse.ArgumentParser(prog="desktop_sign.py")
    ap.add_argument("app")
    ap.add_argument("--identity", required=True, help="a codesigning identity (its SHA-1 or name), '-' for ad hoc")
    ap.add_argument("--keychain")
    ap.add_argument("--entitlements", default=ENTITLEMENTS)
    a = ap.parse_args(argv)
    try:
        sign(a.app, a.identity, a.keychain, a.entitlements, say=lambda m: print("desktop-sign:", m, file=sys.stderr))
        return 0
    except SignError as e:
        print("desktop-sign: %s" % e, file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
