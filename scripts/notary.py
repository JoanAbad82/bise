#!/usr/bin/env python3
"""notary: Apple's notarization for every macOS build bise ships (the desktop app,
scripts/desktop_release.py; the terminal release's app root, scripts/dist_sign.py).

  submit(path, workdir): a .app or a folder is zipped (ditto) into workdir, a .zip/.dmg goes
  as it is; notarytool submits it and waits; a refusal prints Apple's log and raises.
  staple(path): stapler staple + validate (a bundle or a DMG; a bare Mach-O or a tarball can't
  carry a ticket: Gatekeeper looks those up online).

The credentials, never in argv as secrets: the App Store Connect API key (APPLE_API_KEY_PATH,
the .p8 file's path, APPLE_API_KEY_ID, APPLE_API_ISSUER: CI's), else a notarytool keychain
profile (APPLE_KEYCHAIN_PROFILE: a local build, `xcrun notarytool store-credentials`).
Pure parts tested in tests/mac_sign_test.py.
"""
import json
import os
import subprocess
import sys

KEY_VARS = ("APPLE_API_KEY_PATH", "APPLE_API_KEY_ID", "APPLE_API_ISSUER")
PROFILE_VAR = "APPLE_KEYCHAIN_PROFILE"


class NotaryError(Exception):
    pass


def say(*a):
    print("notary:", *a, file=sys.stderr)


def creds(env):
    """notarytool's credential args from the env (the API key first, else a profile), or a
    NotaryError naming what is missing. Pure."""
    if all(env.get(k) for k in KEY_VARS):
        return ["--key", env["APPLE_API_KEY_PATH"], "--key-id", env["APPLE_API_KEY_ID"], "--issuer", env["APPLE_API_ISSUER"]]
    if env.get(PROFILE_VAR):
        return ["--keychain-profile", env[PROFILE_VAR]]
    missing = [k for k in KEY_VARS if not env.get(k)]
    raise NotaryError("notarizing needs %s (or %s)" % (", ".join(missing), PROFILE_VAR))


def notary_argv(path, cred):
    """notarytool's submit, waiting for the verdict. Pure."""
    return ["xcrun", "notarytool", "submit", path] + cred + ["--wait", "--timeout", "45m", "--output-format", "json"]


def verdict(stdout):
    """notarytool's JSON answer as a dict ({} when it is not JSON). Pure."""
    try:
        res = json.loads(stdout or "{}")
    except ValueError:
        return {}
    return res if isinstance(res, dict) else {}


def submit(path, workdir, env=None):
    """Notarize path; returns the submission id. A folder or a .app is zipped first."""
    env = os.environ if env is None else env
    cred = creds(env)
    sub = path
    if os.path.isdir(path):
        os.makedirs(workdir, exist_ok=True)
        sub = os.path.join(workdir, os.path.basename(path.rstrip("/")) + ".zip")
        if os.path.exists(sub):
            os.remove(sub)
        r = subprocess.run(["ditto", "-c", "-k", "--sequesterRsrc", "--keepParent", path, sub], capture_output=True, text=True)
        if r.returncode:
            raise NotaryError("ditto %s: %s" % (path, r.stderr.strip()))
    r = subprocess.run(notary_argv(sub, cred), capture_output=True, text=True)
    res = verdict(r.stdout)
    if res.get("status") != "Accepted":
        if res.get("id"):
            log = subprocess.run(["xcrun", "notarytool", "log", res["id"]] + cred, capture_output=True, text=True)
            say(log.stdout[-4000:])
        raise NotaryError("notarization of %s: %s %s" % (os.path.basename(path), res.get("status") or "no verdict",
                                                          (r.stderr or "").strip()[-400:]))
    say("notarized %s (%s)" % (os.path.basename(path), res.get("id")))
    return res.get("id")


# the waits between staple tries: Apple serves a fresh ticket seconds after the verdict most
# nights, so short first (a flat 30 s cost desktop 10.4 60 s for a ticket there at once)
STAPLE_WAITS = (3, 5, 10, 20, 30)


def staple(path, waits=STAPLE_WAITS, sleep=None):
    """Staple the ticket to a bundle or a DMG and validate it.

    Right after an accepted notarization Apple may not serve the ticket yet (stapler's
    Error 68, run 38950522744's darwin-x86_64): each step is tried once, then again after
    each wait in `waits` (68 s in all by default), before it fails."""
    import time
    sleep = sleep or time.sleep
    tries = len(waits) + 1
    for argv in (["xcrun", "stapler", "staple", path], ["xcrun", "stapler", "validate", path]):
        for n in range(1, tries + 1):
            r = subprocess.run(argv, capture_output=True, text=True)
            if not r.returncode:
                break
            err = (r.stderr or r.stdout).strip()[-400:]
            if n == tries:
                raise NotaryError("%s (%d tries): %s" % (" ".join(argv[:3]), tries, err))
            say("%s failed (try %d of %d), again in %d s: %s" % (" ".join(argv[:3]), n, tries, waits[n - 1], err[-160:]))
            sleep(waits[n - 1])
