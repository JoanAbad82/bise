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
import shlex
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import desktop_try as T  # noqa: E402

sys.path.insert(0, HERE)
import wait  # noqa: E402

FAILS = []


def check(ok, what):
    if not ok:
        FAILS.append(what)
        print("FAIL", what)


def pure():
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
    check(T.clean_path("%s/hubs/h/bin:/usr/bin:%s/run/r:%s/try/bin" % (other, other, other), real, homes=(other,)) == "/usr/bin:%s/try/bin" % other,
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
    check("BISE_APP_ROOT=/h/build/desktop-try/root-abc" in ae and "BISE_APP_ROOT=%s" % ROOT not in ae,
          "the app root is the build's snapshot, never the checkout: %s" % ae)
    check(ae[:2] == ["BISE_HOME=/h/.bise/try/desktop", "BISE_HOME_WORKSPACE=/h/.bise/try/desktop/bise"] and "PATH=/usr/bin" in ae
          and not any(e.split("=")[0] in ("BISE_DESKTOP_TEST", "BISE_TEST_HOME", "BISE_DESKTOP_USER_DATA", "BISE_DESKTOP_HELPER", "BISE_DESKTOP_BISE")
                      for e in ae), "the app's env: the try home, never a test variable: %s" % ae)


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
        if cmd and cmd[0] == "/usr/bin/lockf":
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
        if cmd and cmd[0] == "/usr/bin/lockf":
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
        check(old == paths["app"] + ".old" and mark(paths["app"]) == "build 2" and mark(old) == "build 1"
              and not os.path.exists(paths["staged"]), "swapped: live is the staged build, the old one at .old")
        check(T.read_stamp(paths)["where"] == "live", "the stamp says live")
        check(T.try_root(paths) == root2, "the swap moves the root with the bundle: the app opens on %s" % T.try_root(paths))
        check(T.build(env, paths) is False and len(scripts) == 2, "the swapped build is up to date: no build call")
        T.core_up = lambda app: app == paths["app"]
        check(T.finish_swap(old, paths["app"], timeout=5, paths=paths) and not os.path.exists(old) and not os.path.exists(root1)
              and os.path.isdir(root2) and "old_root" not in T.read_stamp(paths), ".old and its root removed once the core answers")
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
        check(r.returncode == 0 and "your own app stays closed" in r.stderr, "--stop: %s" % r.stderr[-400:])
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


if __name__ == "__main__":
    pure()
    stamp_skips_build()
    staged_never_over_a_running_try()
    if "--pure" not in sys.argv:
        hook_keeps_pid()
        integration()
    print("desktop-try: %s" % ("all pass" if not FAILS else "%d FAIL" % len(FAILS)))
    sys.exit(1 if FAILS else 0)
