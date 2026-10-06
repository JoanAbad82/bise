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
    if "--pure" not in sys.argv:
        integration()
    print("desktop-try: %s" % ("all pass" if not FAILS else "%d FAIL" % len(FAILS)))
    sys.exit(1 if FAILS else 0)
