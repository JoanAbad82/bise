#!/usr/bin/env python3
"""scripts/desktop_try.py ('bise-ambient --try'), on fake data only.

The pure parts: the try's environment (no bise override or internal variable of the caller
survives, BISE_HOME and BISE_HOME_WORKSPACE are the try's: architect m_9176 (1)-(2)), the guard
(everything under ~/.bise/try or a test's ~/.bise/gate), his config without [pages] and with a
key_command per auth entry (never the key itself), his projects.json read, the clone names.

Then one run of the script on a throwaway HOME-like tree under ~/.bise/gate (a fake 'real' bise
home with config.toml, auth.json and projects.json naming two fake repos), with the tree's bise
and --no-build --no-open: the clones (no alternates, push URL disabled, his repos untouched),
the try's projects.json, its config.toml (0600, no key), a re-run that reuses the clones,
--fresh, and --stop stopping a hub started on the try home (by its socket, then its pid).
Never his ~/.bise, never an app (an app on the try home is the off-screen harness's job).

  python3 -B tests/desktop_try_test.py        (the integration part needs rust/target/debug/bise)
"""
import json
import os
import plistlib
import shlex
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import desktop_try as T  # noqa: E402
import desktop_try_env as E  # noqa: E402  (its pure where and what, split out for size)

sys.path.insert(0, HERE)
import wait  # noqa: E402

FAILS = []


def check(ok, what):
    if not ok:
        FAILS.append(what)
        print("FAIL", what)


def pure():
    # one heavy slot (main m_13151, ambient-lead m_13161): heavy-run when there, the old lock
    # without it, nice alone when already in a slot (never both slots, never nested)
    cmd, lock = ["/bin/bash", "-c", "x"], "/l/heavy.lock"
    hr = os.path.join(tempfile.mkdtemp(prefix="dt-hr-"), "heavy-run")
    with open(hr, "w") as f:
        f.write("#!/bin/sh\n")
    os.chmod(hr, 0o755)
    check(T.heavy_argv(cmd, lock, under=False, heavy_run=hr) == [hr] + cmd, "through heavy-run")
    check(T.heavy_argv(cmd, lock, under=False, heavy_run=hr + "-none") == ["/usr/bin/lockf", "-k", lock, "nice", "-n", "10"] + cmd, "the old lock")
    check(T.heavy_argv(cmd, lock, under=True, heavy_run=hr) == ["nice", "-n", "10"] + cmd, "in a slot already: no second one")
    check(T.under_heavy_slot() is False, "this test runs in no slot")
    real = os.path.expanduser("~/.bise")
    tryh = os.path.join(real, "try", "desktop")
    base = {"HOME": "/Users/x", "PATH": "/usr/bin", "BEND_RUN_DIR": real + "/run", "SB_SOCKET": "/s", "BISE_ROLE": "task",
            "BISE_EXPORTS_FOR": "x", "BISE_HOME": real, "BISE_HOME_WORKSPACE": "/Users/x/bise", "SB_BUILD_DIR": "/b", "ANTHROPIC_FOUNDRY_API_KEY": "k"}
    e = T.try_env(base, real, tryh)
    check(e["BISE_HOME"] == tryh and e["BISE_HOME_WORKSPACE"] == tryh + "/bise", "the try's homes: %s" % e)
    check(not [k for k in ("BEND_RUN_DIR", "SB_SOCKET", "BISE_ROLE", "BISE_EXPORTS_FOR", "SB_BUILD_DIR") if k in e], "no override or internal var survives: %s" % e)
    check(e["HOME"] == "/Users/x" and e["ANTHROPIC_FOUNDRY_API_KEY"] == "k", "HOME and his provider env stay")
    e2 = T.try_env(dict(base, PATH="%s/hubs/h-1/bin:/usr/bin:%s/run/x:/bin" % (real, real)), real, tryh)
    check(e2["PATH"] == "/usr/bin:/bin", "an agent shell's hub bin (his sb) leaves the try's PATH: %s" % e2["PATH"])
    other = "/Users/x/.bise"
    check(E.clean_path("%s/hubs/h/bin:/usr/bin:%s/run/r:%s/try/bin" % (other, other, other), real, homes=(other,)) == "/usr/bin:%s/try/bin" % other,
          "the default ~/.bise's hubs/ and run/ go too when the real home is a stand-in")
    h = T.his_env(base)
    check("BISE_HOME" not in h and "SB_SOCKET" not in h and h["HOME"] == "/Users/x", "his env: no BISE_HOME, no hub var")

    T.guard(real, tryh, [tryh + "/repos/a"])
    for bad_home in (real, os.path.join(real, "hubs"), "/tmp/try"):
        try:
            T.guard(real, bad_home)
            check(False, "guard refuses the try home %s" % bad_home)
        except T.TryError:
            pass
    try:
        T.guard(real, tryh, [real + "/config.toml"])
        check(False, "guard refuses a write into his ~/.bise")
    except T.TryError:
        pass

    cfg = ('model = "opus-5.5"\napprovals = "yolo"\n\n[providers.foundry]\nbase_url = "https://p/v1"\n\n'
           '[providers.openrouter]\nkey_command = "old"\nname = "x"\n\n[pages]\nmirror = "~/.bise/pages-mirror/deploy.sh"\n\n[voice]\nsounds = true\n')
    out = T.config_for_try(cfg, {"openrouter": {"type": "api", "key": "sk-or-SECRET"}, "chatgpt": {"type": "oauth", "refresh": "rt-SECRET"},
                                 "weird": {"type": "oauth"}}, real, "/b/bise")
    check("SECRET" not in out, "no key or token in the try's config")
    check("[pages]" not in out and "mirror" not in out, "no [pages]: its mirror would publish to his site")
    check('model = "opus-5.5"' in out and "[voice]" in out and 'base_url = "https://p/v1"' in out, "the rest of his config stays")
    check(out.count("[providers.openrouter]") == 1 and "old" not in out
          and "key_command = \"jq -r .openrouter.key '%s/auth.json'\"" % real in out, "openrouter: one table, a jq key_command:\n" + out)
    check("[providers.chatgpt]\nkey_command = \"BISE_HOME='%s' '/b/bise' auth token chatgpt\"" % real in out, "chatgpt: his grant through his home")
    check("[providers.weird]" not in out, "an unknown sign-in gets nothing")
    import tomllib
    tomllib.loads(out)

    check(T.his_repos(json.dumps({"v": 1, "projects": [{"path": "/b", "order": 1}, {"path": "/a", "order": 0}, {"name": "x"}]})) == ["/a", "/b"], "projects.json by order")
    check(T.his_repos("not json") == [], "a bad projects.json: none")
    check(T.clone_names(["/x/app", "/y/app", "/z/my repo"]) == ["app", "app-2", "my-repo"], "clone names")
    # the NEW app (lead m_11012): its own bundle, built and packed with the try's bise, opened on the try home
    p = T.try_paths({"HOME": "/h", "BISE_HOME": "/h/.bise"})
    check(p["bise"] == "/h/.bise/dev/build/target/debug/bise" and p["app"].endswith("/apps/desktop/dist/mac-arm64/bise try.app")
          and p["helper"] == "/h/.bise/dev/build/desktop-try/bise-mac-helper", "try paths: %s" % p)
    check(T.app_exe(p["app"]).endswith("bise try.app/Contents/MacOS/bise try"), "the app's executable")
    sc = T.build_script(p, "/h/sign")
    order = [sc.index(x) for x in ("cargo build -p bend-harness", "bins.sh repl-live repl-scripted sb-core", "native/mac/build.sh",
                                   "pnpm install --frozen-lockfile", "pnpm build", "pnpm dist")]
    check(order == sorted(order), "build: bise, helpers, native helper, then install, build, dist: %s" % sc)
    check("BISE_PACK_NAME='bise try' BISE_PACK_APP_ID=dev.bise.desktop.try BISE_PACK_BISE=/h/.bise/dev/build/target/debug/bise" in sc
          and "BISE_PACK_SIGN_DIR=/h/sign pnpm dist" in sc and "ambient.sh" not in sc and "apps/ambient" not in sc,
          "dist packs the try's bise into its own bundle, signed stable; no old app: %s" % sc)
    check("BISE_PACK_SIGN_DIR" not in T.build_script(p, None), "no sign dir: ad hoc")
    ae = T.app_env("/h/.bise/try/desktop", {"PATH": "/usr/bin"}, "/h/build/desktop-try/root-abc")
    check(not any(e.startswith("BISE_APP_ROOT=") for e in ae),
          "never an app root in the app's env: the snapshot is inside the bundle (architect m_18354): %s" % ae)
    sr = T.build_script(p, "/h/sign", root="/h/build/desktop-try/root-abc")
    check("BISE_PACK_ROOT=/h/build/desktop-try/root-abc " in sr and "BISE_PACK_ROOT" not in sc,
          "the snapshot is packed into the bundle when there is one: %s" % sr)
    check(ae[:2] == ["BISE_HOME=/h/.bise/try/desktop", "BISE_HOME_WORKSPACE=/h/.bise/try/desktop/bise"] and "PATH=/usr/bin" in ae
          and not any(e.split("=")[0] in ("BISE_DESKTOP_TEST", "BISE_TEST_HOME", "BISE_DESKTOP_USER_DATA", "BISE_DESKTOP_HELPER", "BISE_DESKTOP_BISE")
                      for e in ae), "the app's env: the try home, never a test variable: %s" % ae)


def root_ships_what_a_version_dir_has():
    """The app's runtime snapshot carries what scripts/versions.sh puts in a version dir for the
    agents: the built-in plugins and the office SDK's bundles (without office/dist the app's
    agents loaded the office skills and `bise office run` had no office.js). Pure."""
    s = "\n".join(T.root_script("/r/root-abc"))
    for what in ("cp -R plugins /r/root-abc.tmp/plugins", "cp -R office/dist /r/root-abc.tmp/office/dist",
                 "cp -R kit /r/root-abc.tmp/kit", "cp -R prompts /r/root-abc.tmp/prompts"):
        check(what in s, "root_script: %s" % what)


def root_of(script):
    """The snapshot app root a build script makes (root_script's last line: rm -rf R && mv R.tmp R)."""
    for line in script.splitlines():
        if line.startswith("rm -rf ") and " && mv " in line:
            return shlex.split(line)[-1]
    return None


def stamp_skips_build():
    """An up-to-date try build opens with no build call (ambient-lead m_11206): the stamp (HEAD,
    the uncommitted changes, the recipe) matches and every output exists -> no lockf, no cargo, no
    pnpm, 'up to date (<sha>), opening'. A missing stamp, another recipe or a missing output builds
    (under the lock) and writes the stamp. The build itself is faked: never a real cargo or pnpm."""
    w = tempfile.mkdtemp(prefix="dtry-stamp-")
    build = os.path.join(w, "build")
    paths = {"target": os.path.join(build, "target"), "bise": os.path.join(build, "target", "debug", "bise"),
             "helper": os.path.join(build, "desktop-try", "bise-mac-helper"), "sign": os.path.join(build, "ambient", "sign"),
             "app": os.path.join(w, "dist", "bise try.app"),
             "staged_dir": os.path.join(build, "desktop-try", "staged"),
             "staged": os.path.join(build, "desktop-try", "staged", "mac-arm64", "bise try.app")}
    calls, said = [], []
    real_run, real_say, old_sign = T.subprocess.run, T.say, os.environ.pop("BISE_TRY_SIGN_DIR", None)

    def outputs(script):
        for p in (paths["bise"], paths["helper"], T.packed_bise(paths["app"]), os.path.join(root_of(script), "repl-live")):
            os.makedirs(os.path.dirname(p), exist_ok=True)
            open(p, "w").close()

    def fake_run(cmd, *a, **k):
        # the build, whatever runs it (heavy-run, the old lockf, or nice alone in a slot): never for real
        if cmd and cmd[-3:-1] == ["/bin/bash", "-c"]:
            calls.append(cmd)
            outputs(cmd[-1])
            return subprocess.CompletedProcess(cmd, 0)
        return real_run(cmd, *a, **k)
    T.subprocess.run, T.say = fake_run, (lambda *a: said.append(" ".join(str(x) for x in a)))
    try:
        env = dict(os.environ)
        check(T.build(env, paths) is True and len(calls) == 1 and os.path.exists(T.stamp_path(paths)),
              "no stamp: builds under the lock and writes the stamp: %s" % said)
        del calls[:], said[:]
        check(T.build(env, paths) is False and not calls, "a stamped tree: no build call (%d)" % len(calls))
        head = real_run(["git", "-C", ROOT, "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip()
        check(any(s.startswith("up to date (%s" % head[:8]) and s.endswith("), opening") for s in said), "says up to date: %s" % said)
        os.remove(T.packed_bise(paths["app"]))
        del calls[:]
        check(T.build(env, paths) is True and len(calls) == 1, "a missing output (the packed bise) builds again")
        stamp = json.load(open(T.stamp_path(paths)))
        with open(T.stamp_path(paths), "w") as f:
            json.dump(dict(stamp, recipe="older"), f)
        del calls[:]
        check(T.build(env, paths) is True and len(calls) == 1, "another recipe builds again")
        with open(T.stamp_path(paths), "w") as f:
            json.dump(dict(stamp, head="0" * 40), f)
        del calls[:]
        check(T.build(env, paths) is True and len(calls) == 1, "another HEAD builds again")
        s = T.build_stamp(env, paths, None)
        r = T.read_stamp(paths)["root"]
        check(T.up_to_date(s, dict(s, root=r), paths) and not T.up_to_date(s, dict(s, root=r, changes="x"), paths) and not T.up_to_date(s, None, paths)
              and not T.up_to_date(s, dict(s), paths),
              "up_to_date: same stamp only")
    finally:
        T.subprocess.run, T.say = real_run, real_say
        if old_sign is not None:
            os.environ["BISE_TRY_SIGN_DIR"] = old_sign
        shutil.rmtree(w, ignore_errors=True)


def staged_never_over_a_running_try():
    """The law of a running try (ambient-lead m_11607), with faked processes and bundles, never a
    real build: while anything runs from the live 'bise try.app' the build is packed into the
    staging dir (BISE_PACK_OUT, a fresh dir) and the live bundle isn't touched; the stamp says
    'staged'; a swap is refused while it runs ('your try is open: quit it to get the new build');
    once nothing runs: live -> .old, staged -> live, stamp 'live', the next build call is up to
    date; .old goes once the new core answers; a stamp saying 'staged' with no staged bundle swaps
    nothing."""
    w = tempfile.mkdtemp(prefix="dtry-staged-")
    build = os.path.join(w, "build")
    staged_dir = os.path.join(build, "desktop-try", "staged")
    paths = {"target": os.path.join(build, "target"), "bise": os.path.join(build, "target", "debug", "bise"),
             "helper": os.path.join(build, "desktop-try", "bise-mac-helper"), "sign": os.path.join(build, "ambient", "sign"),
             "app": os.path.join(w, "dist", "mac-arm64", "bise try.app"),
             "staged_dir": staged_dir, "staged": os.path.join(staged_dir, "mac-arm64", "bise try.app")}
    scripts, said, running = [], [], []
    real_run, real_say, real_pids, real_core = T.subprocess.run, T.say, T.bundle_pids, T.core_up
    old_sign = os.environ.pop("BISE_TRY_SIGN_DIR", None)

    def mark(app):
        p = os.path.join(app, "Contents", "build.txt")
        return open(p).read() if os.path.exists(p) else None

    def pack(app, n, root):
        for p in (paths["bise"], paths["helper"], T.packed_bise(app), os.path.join(root, "repl-live")):
            os.makedirs(os.path.dirname(p), exist_ok=True)
            open(p, "w").close()
        with open(os.path.join(app, "Contents", "build.txt"), "w") as f:
            f.write("build %d" % n)

    def fake_run(cmd, *a, **k):
        if cmd and cmd[-3:-1] == ["/bin/bash", "-c"]:
            script = cmd[-1]
            scripts.append(script)
            pack(paths["staged"] if "BISE_PACK_OUT=" in script else paths["app"], len(scripts), root_of(script))
            return subprocess.CompletedProcess(cmd, 0)
        return real_run(cmd, *a, **k)
    T.subprocess.run, T.say = fake_run, (lambda *a: said.append(" ".join(str(x) for x in a)))
    T.bundle_pids = lambda app: list(running) if app == paths["app"] else []
    try:
        env = dict(os.environ)
        check(T.build(env, paths) is True and mark(paths["app"]) == "build 1" and T.read_stamp(paths)["where"] == "live",
              "nothing runs: the build is packed live")
        root1 = T.try_root(paths)
        check(root1 and root1.startswith(os.path.join(build, "desktop-try", "root-")) and not root1.startswith(ROOT)
              and "cp -R prompts %s.tmp/prompts" % root1 in scripts[0] and "bins.sh path --src" in scripts[0],
              "the app root is a snapshot in the build dir, never the checkout: %s" % root1)
        # his try opens from the live bundle; the source changes (a new HEAD in the stamp)
        running.append(77328)
        T.write_stamp(paths, dict(T.read_stamp(paths), head="0" * 40))
        del said[:]
        check(T.build(env, paths) is True and len(scripts) == 2, "a change while it runs builds")
        check("BISE_PACK_OUT=%s" % staged_dir in scripts[1] and "rm -rf %s" % staged_dir in scripts[1],
              "into a fresh staging dir: %s" % scripts[1][-400:])
        check(mark(paths["app"]) == "build 1" and mark(paths["staged"]) == "build 2", "the running bundle is never written over")
        check(T.read_stamp(paths)["where"] == "staged", "the stamp says staged")
        root2 = T.read_stamp(paths)["root"]
        check(root2 != root1 and os.path.isdir(root1) and T.try_root(paths) == root1,
              "a staged build gets its own root; the running try keeps reading its own: %s %s" % (root1, root2))
        check(any("quit it to get the new build" in s for s in said), "it says so: %s" % said)
        check(T.build(env, paths) is False and len(scripts) == 2, "staged and up to date: no second build")
        del said[:]
        check(T.swap_staged(paths) is None and mark(paths["app"]) == "build 1",
              "no swap while it runs: the live bundle stays")
        check(said == ["your try is open: quit it to get the new build"], "it says: %s" % said)
        # he quits: the next --try swaps it in, with no build step
        running.clear()
        old = T.swap_staged(paths)
        check(old == os.path.join(build, "desktop-try", "prev", "mac-arm64", "bise try.app") and mark(paths["app"]) == "build 2"
              and mark(old) == "build 1" and not os.path.exists(paths["staged"]),
              "swapped: live is the staged build, the old one in prev/: %s" % old)
        check(not os.path.exists(paths["app"] + ".old") and not any(n.endswith(".old") for n in os.listdir(os.path.dirname(paths["app"]))),
              "nothing next to the bundle: '<app>.old' is the app updater's alone (ambient-lead m_18341)")
        check(T.read_stamp(paths)["where"] == "live", "the stamp says live")
        check(T.try_root(paths) == root2, "the swap moves the root with the bundle: the app opens on %s" % T.try_root(paths))
        check(T.build(env, paths) is False and len(scripts) == 2, "the swapped build is up to date: no build call")
        T.core_up = lambda app: app == paths["app"]
        check(T.finish_swap(old, paths["app"], timeout=5, paths=paths) and os.path.isdir(old) and os.path.isdir(root1)
              and os.path.isdir(root2) and T.read_stamp(paths).get("old_root") == root1,
              "prev/ and its root stay after the core answers, for a rollback (ambient-lead m_21844)")
        # the next swap retires them: a fake staged build over the live one
        os.makedirs(os.path.join(paths["staged"], "Contents"))
        T.write_stamp(paths, dict(T.read_stamp(paths), where="staged", live_root=root2))
        real_out, T.outputs_there = T.outputs_there, lambda *a: True
        try:
            check(T.swap_staged(paths) == old and not os.path.exists(root1) and mark(old) == "build 2"
                  and T.read_stamp(paths).get("old_root") is None,
                  "the next swap removes the root before (prev/ now holds the build it replaced)")
        finally:
            T.outputs_there = real_out
        # put build 2 back live for the rest
        shutil.rmtree(paths["app"])
        os.rename(old, paths["app"])
        T.write_stamp(paths, dict(T.read_stamp(paths), where="live"))
        # a stamp that says staged with no staged bundle: nothing to swap
        T.write_stamp(paths, dict(T.read_stamp(paths), where="staged"))
        check(T.swap_staged(paths) is None and mark(paths["app"]) == "build 2", "no staged bundle: no swap")
        # the recipe in the stamp doesn't depend on where it's packed
        check(T.build_script(paths, None, out=staged_dir).replace(" BISE_PACK_OUT=%s" % staged_dir, "")
              .replace("rm -rf %s\n" % staged_dir, "") == T.build_script(paths, None), "out only adds the staging lines")
    finally:
        T.subprocess.run, T.say, T.bundle_pids, T.core_up = real_run, real_say, real_pids, real_core
        if old_sign is not None:
            os.environ["BISE_TRY_SIGN_DIR"] = old_sign
        shutil.rmtree(w, ignore_errors=True)


def legacy_old_retired():
    """A launcher before prev/ left 'bise try.app.old' next to the bundle, which the app's updater
    read as a failed update ('the new bise didn't start right', ambient-lead m_18341): the next
    --try or swap moves it to prev/ (or drops it when prev/ holds one), never touching the bundle."""
    w = tempfile.mkdtemp(prefix="dtry-legacy-")
    try:
        staged_dir = os.path.join(w, "build", "desktop-try", "staged")
        paths = {"app": os.path.join(w, "dist", "mac-arm64", "bise try.app"), "staged_dir": staged_dir,
                 "staged": os.path.join(staged_dir, "mac-arm64", "bise try.app")}
        prev = T.prev_bundle(paths)
        check(prev == os.path.join(w, "build", "desktop-try", "prev", "mac-arm64", "bise try.app"), "prev/ is under desktop-try: %s" % prev)
        check(T.retire_legacy_old(paths) is None, "no legacy .old: nothing to do")
        for d, mark in ((paths["app"], "live"), (paths["app"] + ".old", "old")):
            os.makedirs(os.path.join(d, "Contents"))
            open(os.path.join(d, "Contents", "m"), "w").write(mark)
        check(T.retire_legacy_old(paths) == prev and not os.path.exists(paths["app"] + ".old")
              and open(os.path.join(prev, "Contents", "m")).read() == "old"
              and open(os.path.join(paths["app"], "Contents", "m")).read() == "live", "the legacy .old moves to prev/, the bundle stays")
        os.makedirs(paths["app"] + ".old")
        check(T.retire_legacy_old(paths) is None and not os.path.exists(paths["app"] + ".old") and os.path.isdir(prev),
              "prev/ holds one already: the legacy .old goes")
    finally:
        shutil.rmtree(w, ignore_errors=True)


def real_opens_with_nothing():
    """bise-ambient --real (ambient-lead m_18348): his own home gets no variable at all; a stand-in
    home (amb-tools' real-shaped world, under ~/.bise/gate, BISE_TRY_REAL=<home>/.bise) gets HOME
    and BISE_HOME, plus BISE_DESKTOP_OFFSCREEN only when the caller set it; anything else is
    refused. A bundle without its runtime inside (amb-core m_18365) is refused, never patched
    with BISE_APP_ROOT. Then one run through the open hook on a stand-in: the legacy .old is
    retired and the app gets exactly HOME and BISE_HOME."""
    his = os.path.expanduser("~/.bise")
    check(T.real_app_env({"BISE_DESKTOP_OFFSCREEN": "1", "BISE_APP_ROOT": "/x", "BISE_DESKTOP_TEST": "1"}, his, his) == [],
          "his own home: no variable, not even the off-screen knob or a test one")
    stand = os.path.join(T.GATE, "real-shape", "w", "h", ".bise")
    check(T.real_app_env({}, stand, his) == ["HOME=%s" % os.path.dirname(stand), "BISE_HOME=%s" % stand],
          "a stand-in home: HOME and BISE_HOME, the projects scan stays in it")
    check(T.real_app_env({"BISE_DESKTOP_OFFSCREEN": "1", "BISE_DESKTOP_TEST": "1"}, stand, his)[-1] == "BISE_DESKTOP_OFFSCREEN=1"
          and len(T.real_app_env({"BISE_DESKTOP_OFFSCREEN": "1"}, stand, his)) == 3, "the off-screen run adds that knob only")
    for bad in ("/tmp/h/.bise", os.path.join(T.GATE, "w", "h")):
        try:
            T.real_app_env({}, bad, his)
            check(False, "%s refused" % bad)
        except T.TryError:
            check(True, "%s refused" % bad)
    w = tempfile.mkdtemp(prefix="dtry-real-", dir=T.GATE if os.path.isdir(T.GATE) else None)
    try:
        app = os.path.join(w, "dist", "mac-arm64", "bise try.app")
        os.makedirs(os.path.join(app, "Contents", "Resources", "bin"))
        check(T.self_contained(app) == ["bise", "VERSION", "repl-live", "sb-core"], "an empty bundle lacks its runtime")
        for n in T.SELF_CONTAINED:
            open(os.path.join(app, "Contents", "Resources", "bin", n), "w").close()
        check(T.self_contained(app) == [], "the runtime inside: self-contained")
        if not os.path.isdir(T.GATE):
            return
        real = os.path.join(w, "h", ".bise")
        os.makedirs(real)
        os.makedirs(app + ".old")
        staged_dir = os.path.join(w, "build", "desktop-try", "staged")
        paths = {"app": app, "staged_dir": staged_dir, "staged": os.path.join(staged_dir, "mac-arm64", "bise try.app"),
                 "helper": os.path.join(w, "build", "desktop-try", "bise-mac-helper"), "bise": os.path.join(w, "build", "bise")}
        got = os.path.join(w, "got")
        hook = os.path.join(w, "hook.sh")
        with open(hook, "w") as f:
            f.write("#!/bin/sh\nprintf '%%s\\n' \"$@\" > %s\n" % shlex.quote(got))
        os.chmod(hook, 0o755)
        # the bundle carries 1c5659b8; the try checkout's stamp says a newer build waits, staged (m_21726)
        with open(os.path.join(app, "Contents", "Resources", "bin", "VERSION"), "w") as f:
            f.write("id=root-1c5659b8-abcdef\ncommit=1c5659b8aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n")
        T.write_stamp(paths, {"head": "b51422c0" + "b" * 32, "changes": "", "recipe": "r", "where": "staged", "root": os.path.join(w, "nowhere")})
        said, real_say, old_hook = [], T.say, os.environ.get("BISE_TRY_OPEN")
        T.say = lambda *a: said.append(" ".join(str(x) for x in a))
        os.environ["BISE_TRY_OPEN"] = hook
        try:
            T.open_real(real, os.path.join(real, "try", "desktop"), paths, environ={"BISE_DESKTOP_TEST": "1", "PATH": "/usr/bin:/bin"}, timeout=0.5)
        finally:
            T.say = real_say
            if old_hook is None:
                os.environ.pop("BISE_TRY_OPEN", None)
            else:
                os.environ["BISE_TRY_OPEN"] = old_hook
        check(open(got).read().split("\n")[:3] == [app, "HOME=%s" % os.path.join(w, "h"), "BISE_HOME=%s" % real],
              "the app gets HOME and BISE_HOME only: %r" % open(got).read())
        check(not os.path.exists(app + ".old"), "the legacy .old is out of the updater's path")
        check(any(("your home %s" % real) in s and app in s for s in said), "it says the home and the bundle: %s" % said)
        check(any(("your home %s" % real) in s and "(1c5659b8" in s for s in said), "the open line names the bundle's own build: %s" % said)
        loud = [s for s in said if s.startswith("NOT UPDATED")]
        check(len(loud) == 1 and "OLD build 1c5659b8" in loud[0] and "staged build b51422c0" in loud[0],
              "a staged build that did not go live is said loudly, old and staged named: %s" % said)
    finally:
        shutil.rmtree(w, ignore_errors=True)


def real_open_in_background_offscreen():
    """--real with BISE_DESKTOP_OFFSCREEN=1 opens with 'open -g' (never in front, amb-tools m_18713);
    his own --real opens as before."""
    app = "/A/bise try.app"
    check(T.real_open_cmd(app, [], {}) == ["open", "-n", "-a", app], "his --real: a plain open")
    off = T.real_open_cmd(app, ["HOME=/g/h", "BISE_HOME=/g/h/.bise", "BISE_DESKTOP_OFFSCREEN=1"], {"BISE_DESKTOP_OFFSCREEN": "1"})
    check(off[:5] == ["open", "-g", "-n", "-a", app], "the knob: open -g: %r" % off)
    check(off[5:] == ["--env", "HOME=/g/h", "--env", "BISE_HOME=/g/h/.bise", "--env", "BISE_DESKTOP_OFFSCREEN=1"], "its env passes")
    check(T.real_open_cmd(app, [], {"BISE_DESKTOP_OFFSCREEN": "0"})[1] == "-n", "'0' is not the knob")


def real_stop_never_his_hubs():
    """bise-ambient --real --stop (ambient-lead m_18642): the bundle quits; on his own home his hubs
    are never touched; a stand-in outside ~/.bise/gate is refused; on a stand-in under it, its hubs
    are stopped (here: none running, nothing killed). quit_bundle is faked: no app is touched."""
    real_quit = T.quit_bundle
    T.quit_bundle = lambda app: []
    try:
        his = os.path.expanduser("~/.bise")
        r = T.stop_real(his, "/nowhere/bise try.app", default_real=his)
        check(r == {"app": [], "hubs": [], "killed": []}, "his home: only the app, never his hubs: %r" % r)
        try:
            T.stop_real("/tmp/x/.bise", "/nowhere/bise try.app", default_real=his)
            check(False, "a stand-in outside the gate is refused")
        except T.TryError:
            check(True, "a stand-in outside the gate is refused")
        if os.path.isdir(T.GATE):
            w = tempfile.mkdtemp(prefix="dtry-realstop-", dir=T.GATE)
            try:
                r = T.stop_real(os.path.join(w, ".bise"), "/nowhere/bise try.app", default_real=his)
                check(r == {"app": [], "hubs": [], "killed": []}, "a stand-in with no hub: nothing to stop: %r" % r)
            finally:
                shutil.rmtree(w, ignore_errors=True)
    finally:
        T.quit_bundle = real_quit


def quit_only_this_bundle():
    """quit_bundle and quit_app never quit by bundle id (ambient-lead m_22006): a stand-in or a copy
    of his try has his id, and 'tell application id … to quit' quit his app too. Only the pids whose
    executable is inside THIS bundle's path get a signal; another bundle's app of the same name and
    id, this bundle's helpers and its core don't; no pid: nothing at all. ps and kill are faked."""
    src = open(os.path.join(ROOT, "scripts", "desktop_try.py")).read()
    check("osascript" not in src and "tell application" not in src, "the launcher never sends an Apple Event")
    app, his = "/g/build/desktop-try/mac-arm64/bise try.app", "/Users/x/.bise/dev/build/desktop-try/mac-arm64/bise try.app"
    ps = "".join("%d %s%s" % (p, c, chr(10)) for p, c in (
        (11, his + "/Contents/MacOS/bise try"), (12, app + "/Contents/MacOS/bise try --flag"),
        (13, app + "/Contents/Frameworks/bise try Helper.app/Contents/MacOS/bise try Helper"),
        (14, app + "/Contents/Resources/bin/bise ambient-core --workspace /w")))
    calls, alive = [], {12}
    real = (T.subprocess.run, T.os.kill, T.pid_alive)

    def run(argv, **kw):
        calls.append(argv)
        return subprocess.CompletedProcess(argv, 0, stdout=ps if argv[0] == "ps" else "", stderr="")

    def kill(pid, sig):
        calls.append(("kill", pid, sig))
        alive.discard(pid)
    T.subprocess.run, T.os.kill, T.pid_alive = run, kill, lambda p: p in alive
    try:
        check(T.quit_bundle(app, timeout=1) == [12], "only this bundle's app")
        kills = [c for c in calls if c[0] == "kill"]
        check(kills == [("kill", 12, T.signal.SIGTERM)], "one SIGTERM to its pid, nothing else: %r" % kills)
        check([c for c in calls if c[0] != "ps" and c[0] != "kill"] == [], "no other command: %r" % calls)
        del calls[:]
        ps = ""
        check(T.quit_bundle(app, timeout=1) == [] and [c for c in calls if c[0] != "ps"] == [], "no app of this bundle: nothing sent")
    finally:
        T.subprocess.run, T.os.kill, T.pid_alive = real


def hook_keeps_pid():
    """BISE_TRY_OPEN (the gate's open): the app the hook starts is found and its pid kept in
    <try>/dev/desktop/app.pid, so --stop finds it (qa-native m_11066). The 'app' is a throwaway
    bundle whose executable is a link to this python (not /bin/sleep: ps -E hides a platform
    binary's env), started by the hook with the env it gets, sleeping."""
    gate = os.path.realpath(os.path.expanduser("~/.bise/gate"))
    os.makedirs(gate, exist_ok=True)
    w = tempfile.mkdtemp(prefix="dtry-hook-", dir=gate)
    tryh, app = os.path.join(w, "try"), os.path.join(w, "bise try.app")
    started = []
    old = os.environ.get("BISE_TRY_OPEN")
    try:
        os.makedirs(os.path.join(app, "Contents", "MacOS"))
        os.symlink(os.path.realpath(sys.executable), T.app_exe(app))
        hook = os.path.join(w, "open.sh")
        with open(hook, "w") as f:
            f.write('#!/bin/sh\napp="$1"; shift\nenv "$@" "$app/Contents/MacOS/bise try" -c "import signal; signal.pause()" </dev/null >/dev/null 2>&1 &\necho $! > "%s/started"\n' % w)
        os.chmod(hook, 0o755)
        os.environ["BISE_TRY_OPEN"] = hook
        pid = T.open_app(app, tryh, {"PATH": "/usr/bin:/bin"}, os.path.join(w, "root"))
        started.append(int(open(os.path.join(w, "started")).read()))
        check(pid == started[0], "the hook's app is found: %s vs %s" % (pid, started))
        check(T.read_pid(T.app_pid_file(tryh)) == started[0], "its pid is kept in app.pid")
        check(T.app_running(app, tryh) == started[0], "app_running (what --stop reads) sees it")
    finally:
        if old is None:
            os.environ.pop("BISE_TRY_OPEN", None)
        else:
            os.environ["BISE_TRY_OPEN"] = old
        for p in started:
            try:
                os.kill(p, 15)
            except OSError:
                pass
        shutil.rmtree(w, ignore_errors=True)


def git(*a, cwd=None):
    return subprocess.run(["git"] + list(a), cwd=cwd, capture_output=True, text=True, check=True).stdout.strip()


def integration():
    bise = os.path.join(ROOT, "rust", "target", "debug", "bise")
    if not os.access(bise, os.X_OK):
        print("skip the integration part: no %s" % bise)
        return
    gate = os.path.realpath(os.path.expanduser("~/.bise/gate"))
    os.makedirs(gate, exist_ok=True)
    w = tempfile.mkdtemp(prefix="dtry-", dir=gate)
    real, tryh = os.path.join(w, "real"), os.path.join(w, "real", "try", "desktop")
    try:
        os.makedirs(real)
        repos = []
        for n in ("alpha", "beta"):
            r = os.path.join(w, "code", n)
            os.makedirs(r)
            git("init", "-q", "-b", "main", cwd=r)
            with open(os.path.join(r, "README.md"), "w") as f:
                f.write("# %s\n" % n)
            git("-c", "user.email=t@t", "-c", "user.name=t", "-c", "commit.gpgsign=false", "add", "-A", cwd=r)
            git("-c", "user.email=t@t", "-c", "user.name=t", "-c", "commit.gpgsign=false", "commit", "-q", "-m", "init", cwd=r)
            repos.append(r)
        with open(os.path.join(real, "projects.json"), "w") as f:
            json.dump({"v": 1, "projects": [{"path": p, "name": os.path.basename(p), "order": i} for i, p in enumerate(repos)]}, f)
        with open(os.path.join(real, "config.toml"), "w") as f:
            f.write('model = "mistral-small-latest"\n\n[pages]\nmirror = "/nowhere/deploy.sh"\n')
        with open(os.path.join(real, "auth.json"), "w") as f:
            json.dump({"openrouter": {"type": "api", "key": "sk-or-FAKE"}}, f)
        before = {r: git("rev-parse", "HEAD", cwd=r) + git("status", "--porcelain", cwd=r) for r in repos}
        env = dict(T.his_env(os.environ), BISE_TRY_REAL=real, BISE_TRY_BISE=bise)

        def go(*args):
            return subprocess.run([sys.executable, "-B", os.path.join(ROOT, "scripts", "desktop_try.py"), "--try"] + list(args),
                                  env=env, capture_output=True, text=True, timeout=180)
        r = go("--no-build", "--no-open")
        check(r.returncode == 0, "the first run: %s" % r.stderr[-800:])
        for n in ("alpha", "beta"):
            c = os.path.join(tryh, "repos", n)
            check(os.path.isdir(os.path.join(c, ".git")), "clone %s" % n)
            check(not os.path.exists(os.path.join(c, ".git", "objects", "info", "alternates")), "no alternates in %s" % n)
            check(git("remote", "get-url", "--push", "origin", cwd=c) == "DISABLED-in-try", "push disabled in %s" % n)
        listed = [p["path"] for p in json.load(open(os.path.join(tryh, "projects.json")))["projects"]]
        check(sorted(os.path.basename(p) for p in listed) == ["alpha", "beta"] and all(p.startswith(tryh) for p in listed),
              "the try's projects are the clones: %s" % listed)
        cfg = os.path.join(tryh, "config.toml")
        text = open(cfg).read()
        check(oct(os.stat(cfg).st_mode & 0o777) == "0o600" and "FAKE" not in text and "jq -r .openrouter.key" in text and "[pages]" not in text,
              "the try's config: 0600, a key_command, no key, no [pages]:\n" + text)
        check(not os.path.exists(os.path.join(real, "hubs")) and json.load(open(os.path.join(real, "projects.json")))["projects"][0]["path"] == repos[0],
              "his home untouched")
        check({r: git("rev-parse", "HEAD", cwd=r) + git("status", "--porcelain", cwd=r) for r in repos} == before, "his repos untouched")

        r = go("--no-build", "--no-open")
        check(r.returncode == 0 and "reused" in r.stderr and "cloned" not in r.stderr, "a re-run reuses the clones: %s" % r.stderr[-400:])
        check(len(json.load(open(os.path.join(tryh, "projects.json")))["projects"]) == 2, "no project added twice")

        # a hub on the try home, then --stop
        henv = T.try_env(T.his_env(os.environ), real, tryh)
        henv["BEND_PROVIDER_URL"] = "http://127.0.0.1:9/v1/chat/completions"
        ws = os.path.join(tryh, "repos", "alpha")
        hub = subprocess.Popen([bise, "sbd", "--workspace", ws], env=henv, stdin=subprocess.DEVNULL,
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
        wait.until(lambda: T.hub_socks(tryh), 30, "the try hub's socket under %s/hubs" % tryh, poll=0.2)
        check(T.hub_socks(tryh) and T.hub_socks(tryh)[0].startswith(tryh + "/hubs/"), "the hub's state is in the try home: %s" % T.hub_socks(tryh))
        r = go("--stop")
        check(r.returncode == 0 and "your own bise wasn't touched" in r.stderr, "--stop: %s" % r.stderr[-400:])
        try:
            hub.wait(timeout=20)
        except subprocess.TimeoutExpired:
            check(False, "--stop left the hub running")
            hub.kill()
        check(not T.try_pids(tryh), "nothing of the try left: %s" % T.try_pids(tryh))

        r = go("--no-build", "--no-open", "--fresh")
        check(r.returncode == 0 and r.stderr.count("cloned") == 2, "--fresh clones again: %s" % r.stderr[-400:])
    finally:
        for pid in T.try_pids(tryh):
            try:
                os.kill(pid, 15)
            except OSError:
                pass
        shutil.rmtree(w, ignore_errors=True)


def candidate_then_promote():
    """ambient-lead m_14320: --candidate <sha> builds into its own dir and never touches the try
    checkout, the try stamp or the staged dir; built twice, it builds once; --promote <sha> moves the
    try checkout to it and the built bundle + root in (no build), stamped as the try checkout's own
    script computes it (his next --try is up to date), and the candidate dir goes. The build is faked."""
    import re
    w = tempfile.mkdtemp(prefix="dt-cand-")
    repo, trysrc = os.path.join(w, "repo"), os.path.join(w, "try-src")
    genv = dict(os.environ, GIT_AUTHOR_NAME="t", GIT_AUTHOR_EMAIL="t@t", GIT_COMMITTER_NAME="t", GIT_COMMITTER_EMAIL="t@t")
    git = lambda *a, cwd=repo: subprocess.run(["git"] + list(a), cwd=cwd, env=genv, check=True, capture_output=True, text=True).stdout.strip()  # noqa: E731
    os.makedirs(os.path.join(repo, "scripts"))
    os.makedirs(os.path.join(repo, "tests"))
    for f in ("desktop_try.py", "desktop_try_env.py", "heavy_slot.py"):
        shutil.copy(os.path.join(ROOT, "scripts", f), os.path.join(repo, "scripts", f))
    shutil.copy(os.path.join(ROOT, "tests", "bise_env.py"), os.path.join(repo, "tests", "bise_env.py"))
    with open(os.path.join(repo, ".gitignore"), "w") as f:
        f.write("dist/\n__pycache__/\n")      # as the real repo's .gitignore: the packed app is no change
    git("init", "-q", "-b", "main")
    git("add", "-A")
    git("-c", "commit.gpgsign=false", "commit", "-q", "-m", "a")
    a = git("rev-parse", "HEAD")
    with open(os.path.join(repo, "NEW.md"), "w") as f:
        f.write("the gate's candidate\n")
    git("add", "-A")
    git("-c", "commit.gpgsign=false", "commit", "-q", "-m", "b")
    b = git("rev-parse", "HEAD")
    git("worktree", "add", "-q", "--detach", trysrc, a)
    env = dict(genv, SB_BUILD_DIR=os.path.join(w, "build"), BISE_TRY_CHECKOUT=trysrc)
    env.pop("BISE_TRY_SIGN_DIR", None)
    paths = T.try_paths(env)
    # his current try: live at a, with its root
    old_root = os.path.join(os.path.dirname(paths["helper"]), "root-old")
    os.makedirs(old_root)
    open(os.path.join(old_root, "repl-live"), "w").close()
    T.write_stamp(paths, {"head": a, "changes": "", "recipe": "r", "where": "live", "root": old_root})
    before = open(T.stamp_path(paths)).read()
    builds, fail_next = [], []
    real_run, real_say = T.subprocess.run, T.say

    def fake_run(cmd, *k, **kw):
        if cmd and cmd[-3:-1] == ["/bin/bash", "-c"]:
            script = cmd[-1]
            builds.append(script)
            if fail_next:
                fail_next.pop()
                return subprocess.CompletedProcess(cmd, 1)
            out = shlex.split(re.search(r"BISE_PACK_OUT=(\S+)", script).group(1))[0]
            name = shlex.split(re.search(r"BISE_PACK_NAME=('[^']*'|\S+)", script).group(1))[0]
            app_id = re.search(r"BISE_PACK_APP_ID=(\S+)", script).group(1)
            app = os.path.join(out, paths["arch"], name + ".app")
            made = [T.packed_bise(app)]
            roots = re.findall(r"rm -rf \S+ && mv \S+ (\S+)", script)
            if roots:   # a full build (the candidate's): its root, the try bise and helper too
                made += [os.path.join(shlex.split(roots[-1])[0], "repl-live"), paths["bise"], paths["helper"]]
            for p in made:
                os.makedirs(os.path.dirname(p), exist_ok=True)
                open(p, "w").close()
            with open(os.path.join(app, "Contents", "Info.plist"), "wb") as f:
                plistlib.dump({"CFBundleIdentifier": app_id, "CFBundleName": name}, f)
            with open(os.path.join(app, "Contents", "build.txt"), "w") as f:
                f.write("build %d %s" % (len(builds), app_id))
            return subprocess.CompletedProcess(cmd, 0)
        return real_run(cmd, *k, **kw)
    T.subprocess.run, T.say = fake_run, (lambda *x: None)
    try:
        info = T.candidate(env, paths, b[:8], repo=repo)
        c = T.cand_paths(paths, b)
        check(len(builds) == 1 and info["sha"] == b and info["app"] == c["app"] and T.cand_built(c), "the candidate is built: %s" % info)
        check("cd %s/rust" % shlex.quote(c["src"]) in builds[0] and "BISE_PACK_OUT=%s" % shlex.quote(c["dist"]) in builds[0],
              "built from its own worktree into its own dir")
        check(git("rev-parse", "HEAD", cwd=c["src"]) == b, "the candidate's worktree is at b")
        check(git("rev-parse", "HEAD", cwd=trysrc) == a, "the try checkout never moved")
        check(open(T.stamp_path(paths)).read() == before and not os.path.exists(paths["staged_dir"]), "the try stamp and staged dir untouched")
        check(json.load(open(c["json"]))["root"] == c["root"], "cand.json says where the root is")
        T.candidate(env, paths, b, repo=repo)
        check(len(builds) == 1, "built once: %d builds" % len(builds))
        # ambient-lead m_20670: a candidate is its own bundle, never his id (LaunchServices mixed them)
        check(c["app"].endswith("/bise cand.app") and T.bundle_id(c["app"]) == T.CAND_ID == "dev.bise.desktop.cand",
              "the candidate's Info.plist has the candidate's id: %s" % T.bundle_id(c["app"]))
        check("BISE_PACK_NAME='bise cand' BISE_PACK_APP_ID=dev.bise.desktop.cand " in builds[0] and "desktop.try" not in builds[0],
              "the candidate is packed as 'bise cand' (its own userData): %s" % builds[0])
        check(T.CAND_ID != T.APP_ID and T.CAND_NAME != T.APP_NAME, "candidate and try never share an id or a name")
        plist = os.path.join(c["app"], "Contents", "Info.plist")
        good = open(plist, "rb").read()
        with open(plist, "wb") as f:
            plistlib.dump({"CFBundleIdentifier": T.APP_ID}, f)
        check(not T.cand_built(c), "a candidate with his id (built before m_20670) is not built: it builds again")
        with open(plist, "wb") as f:
            f.write(good)

        # a failed repack moves nothing
        fail_next.append(1)
        try:
            T.promote(env, b, repo=repo)
            check(False, "a failed repack promotes")
        except T.TryError:
            pass
        check(git("rev-parse", "HEAD", cwd=trysrc) == a and open(T.stamp_path(paths)).read() == before and T.cand_built(c),
              "a failed repack leaves the try checkout, stamp and candidate as they were")
        builds.pop()

        stamp = T.promote(env, b, repo=repo)
        m = T.try_module(trysrc)
        tp = m.try_paths(env)
        check(len(builds) == 2, "promote repacks once: %d" % len(builds))
        rp = builds[1]
        check(all(x not in rp for x in ("cargo build", "pnpm install", "pnpm build", "bins.sh")) and "pnpm dist" in rp
              and "cd %s" % shlex.quote(os.path.join(c["src"], "apps", "desktop")) in rp,
              "the repack is electron-builder only, in the candidate's worktree: %s" % rp)
        check("BISE_PACK_NAME='bise try' BISE_PACK_APP_ID=dev.bise.desktop.try " in rp
              and "BISE_PACK_BISE=%s" % shlex.quote(T.packed_bise(c["app"])) in rp
              and "BISE_PACK_HELPER=%s" % shlex.quote(os.path.join(c["app"], "Contents", "MacOS", "bise-mac-helper")) in rp
              and "BISE_PACK_ROOT=%s" % shlex.quote(c["root"]) in rp,
              "repacked as his try from the candidate's own bise, helper and root: %s" % rp)
        check(git("rev-parse", "HEAD", cwd=trysrc) == b, "the try checkout moved to b")
        check(stamp["head"] == b and stamp["where"] == "live" and stamp.get("old_root") == old_root, "live now (no try open): %s" % stamp)
        check(open(os.path.join(tp["app"], "Contents", "build.txt")).read() == "build 2 dev.bise.desktop.try"
              and T.bundle_id(tp["app"]) == T.APP_ID == "dev.bise.desktop.try",
              "the promoted bundle is the repack, with his try's id: %s" % T.bundle_id(tp["app"]))
        check(m.up_to_date(m.build_stamp(env, tp, None), m.read_stamp(tp), tp), "his next --try is up to date: no rebuild")
        check(not os.path.exists(c["dir"]) and c["src"] not in git("worktree", "list"), "the candidate dir and worktree are gone")
        try:
            T.promote(env, b, repo=repo)
            check(False, "a second promote without a candidate")
        except T.TryError:
            pass
    finally:
        T.subprocess.run, T.say = real_run, real_say
        shutil.rmtree(w, ignore_errors=True)


if __name__ == "__main__":
    pure()
    root_ships_what_a_version_dir_has()
    stamp_skips_build()
    staged_never_over_a_running_try()
    legacy_old_retired()
    real_opens_with_nothing()
    real_stop_never_his_hubs()
    quit_only_this_bundle()
    real_open_in_background_offscreen()
    candidate_then_promote()
    if "--pure" not in sys.argv:
        hook_keeps_pid()
        integration()
    print("desktop-try: %s" % ("all pass" if not FAILS else "%d FAIL" % len(FAILS)))
    sys.exit(1 if FAILS else 0)
