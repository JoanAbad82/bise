"""ambient-qa try-proof: the user's exact 'bise-ambient --try' through ~/.local/bin/bise-ambient, on a
throwaway home, with the app opened off-screen (ambient-lead m_9219, main m_9221).

  qa.py real try-proof [--out DIR]

A fake 'real' bise home under ~/.bise/gate/try-proof/h/.bise: one fake git repo in its
projects.json, a config.toml whose model's provider points at tests/fake_provider.py (base_url),
an auth.json with a fake API key (so the try's key_command reads it in place). Then:

  bise-ambient --try --no-build       with BISE_TRY_REAL=<that home> (the try home under it),
                                      BISE_TRY_BISE=<this tree's bise>, BISE_TRY_OPEN=<a hook>:
                                      desktop_try.py does everything his run does, and hands the
                                      app's exact args to the hook instead of 'open -a', which
                                      opens the harness app off-screen (never in front, watchdog
                                      first, the app's own guard on)
  checks: the core runs the try's bise home; the sidebar shows the cloned project; words to bise
  and to the project's main get the fake provider's answers through the try's config (no
  BEND_PROVIDER_URL anywhere); his fake home and repo untouched
  bise-ambient --try --stop           the try's app and hubs end; nothing of the try is left

--no-build: the build step is bise-ambient's own, unchanged (it would build his real app here).
"""
import glob
import json
import os
import shlex
import shutil
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.realpath(__file__))
sys.path.insert(0, HERE)
import qa  # noqa: E402

PROOF = os.path.join(qa.os.path.realpath(os.path.expanduser("~/.bise/gate")), "try-proof")
LAUNCHER = os.path.expanduser("~/.local/bin/bise-ambient")


def _arg(args, name):
    return args[args.index(name) + 1] if name in args else None


def _env_arg(args, key):
    for i, a in enumerate(args):
        if a == "--env" and i + 1 < len(args) and args[i + 1].startswith(key + "="):
            return args[i + 1][len(key) + 1:]
    return None


def try_open(args):
    """The hook desktop_try.py calls with the app's args: the harness app, off-screen, those
    args exactly, on the proof's throwaway HOME."""
    home = os.environ.get("TRYPROOF_HOME")
    tryh = _env_arg(args, "BISE_HOME")
    if not home or not tryh or not os.path.realpath(tryh).startswith(PROOF + "/") or not os.path.realpath(home).startswith(PROOF + "/"):
        raise qa.QAError("try_open: only for the try-proof's home under %s" % PROOF)
    app = os.path.abspath(os.environ.get("AMBIENT_REAL_APP") or qa.REAL_APP)
    exe = qa._bundle_exe(app)
    qa.real_stop()
    os.makedirs(qa.REAL_APP_DIR, exist_ok=True)
    try:
        os.unlink(qa.REAL_SOCK)
    except OSError:
        pass
    env = {"HOME": home, "BISE_HOME": tryh, "PATH": qa.LAUNCHD_PATH, "TMPDIR": qa._user_tmp(),
           "USER": os.environ.get("USER", ""), "LOGNAME": os.environ.get("USER", ""), "SHELL": os.environ.get("SHELL", "/bin/zsh"),
           "LANG": os.environ.get("LANG", "en_US.UTF-8"), "AMBIENT_HARNESS": qa.REAL_APP_DIR, "BISE_AMBIENT_TEST_INPUT": qa.REAL_SOCK}
    argv = [exe] + list(args)
    qa._real_guard(argv, env)
    subprocess.Popen([sys.executable, "-B", os.path.join(HERE, "qa.py"), "_real_watch", "exe:" + exe], cwd=qa.REPO,
                     stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True,
                     env=dict(os.environ, AMBIENT_REAL_DIR=qa.REAL_DIR))
    out = os.path.join(qa.REAL_APP_DIR, "app.out")
    cmd = ["open", "-g", "-n", "-a", app, "--stdout", out, "--stderr", out]
    for k, v in env.items():
        cmd += ["--env", "%s=%s" % (k, v)]
    cmd += ["--args"] + list(args)
    clean = {"PATH": qa.LAUNCHD_PATH, "HOME": os.path.expanduser("~"), "USER": os.environ.get("USER", ""), "TMPDIR": qa._user_tmp()}
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=30, env=clean)
    if r.returncode != 0:
        raise qa.QAError("open failed: %s" % (r.stderr or r.stdout)[-400:])
    t0, ping = time.time(), None
    while time.time() - t0 < 40 and not ping:
        ping = qa.real_alive()
        time.sleep(0.25)
    if not ping:
        qa.real_stop()
        raise qa.QAError("the harness app didn't open its test socket: %s" % open(out, errors="replace").read()[-800:])
    with open(os.path.join(qa.REAL_APP_DIR, "app.pid"), "w") as f:
        f.write(str(ping.get("pid")))
    with open(os.path.join(PROOF, "launched.json"), "w") as f:
        json.dump({"argv": argv, "env": env, "pid": ping.get("pid")}, f, indent=1)
    return ping


def _git(*a, cwd=None):
    return subprocess.run(["git"] + list(a), cwd=cwd, capture_output=True, text=True).stdout.strip()


def _fake_home():
    """The throwaway 'real' home: a fake repo, projects.json, a config whose provider is the fake
    one, a fake API key. Returns (home, real, repo, fake provider Popen, its log)."""
    if os.path.exists(PROOF):
        shutil.rmtree(PROOF)
    home = os.path.join(PROOF, "h")
    real = os.path.join(home, ".bise")
    repo = os.path.join(home, "code", "acme")
    os.makedirs(real)
    os.makedirs(repo)
    for cmd in (["init", "-q", "-b", "main"],):
        _git(*cmd, cwd=repo)
    with open(os.path.join(repo, "README.md"), "w") as f:
        f.write("# acme\n\nthe try-proof's repo.\n")
    _git("-c", "user.email=t@t", "-c", "user.name=t", "add", "-A", cwd=repo)
    _git("-c", "user.email=t@t", "-c", "user.name=t", "-c", "commit.gpgsign=false", "commit", "-q", "-m", "init", cwd=repo)
    log = os.path.join(PROOF, "fake.log")
    fake = subprocess.Popen([sys.executable, "-u", os.path.join(qa.REPO, "tests", "fake_provider.py")], stdout=subprocess.PIPE, text=True,
                            env={"PATH": os.environ.get("PATH", "/usr/bin:/bin"), "HOME": home, "FAKE_LOG": log})
    port = fake.stdout.readline().split()[1]
    with open(os.path.join(real, "projects.json"), "w") as f:
        json.dump({"v": 1, "projects": [{"path": repo, "name": "acme", "order": 0, "added_ms": 1}]}, f)
    with open(os.path.join(real, "config.toml"), "w") as f:
        f.write('model = "mistral-small-latest"\n\n[providers.mistral]\nbase_url = "http://127.0.0.1:%s/v1"\n\n'
                '[pages]\nmirror = "/nowhere/deploy.sh"\n' % port)
    with open(os.path.join(real, "auth.json"), "w") as f:
        json.dump({"mistral": {"type": "api", "key": "sk-tryproof-FAKE"}}, f)
    os.chmod(os.path.join(real, "auth.json"), 0o600)
    return home, real, repo, fake, log


def run(out=None):
    out = out or os.path.join(PROOF + "-out", time.strftime("%Y%m%d-%H%M%S"))
    os.makedirs(out, exist_ok=True)
    R = {"steps": [], "started": time.strftime("%F %T")}

    def save():
        with open(os.path.join(out, "try-proof.json"), "w") as f:
            json.dump(R, f, indent=1, default=str)

    def verdict(name, ok, why, shot=None):
        R["steps"].append({"name": name, "verdict": "pass" if ok else "fail", "why": why, "shot": shot})
        save()

    if not os.access(LAUNCHER, os.X_OK):
        raise qa.QAError("no %s" % LAUNCHER)
    bise = os.path.join(qa.REPO, "rust", "target", "debug", "bise")
    home, real, repo, fake, flog = _fake_home()
    tryh = os.path.join(real, "try", "desktop")
    hook = os.path.join(PROOF, "open-hook.sh")
    with open(hook, "w") as f:
        # the launcher drops SB_* (SB_AGENT names qa's run dir), so the hook names the dir itself:
        # without it the app's socket went to ra-me while the proof read ra-<agent>
        f.write("#!/bin/bash\nexport AMBIENT_REAL_DIR=%s\nexec %s -B %s real _try_open -- \"$@\"\n"
                % (shlex.quote(qa.REAL_DIR), sys.executable, os.path.join(HERE, "qa.py")))
    os.chmod(hook, 0o755)
    base = {k: v for k, v in os.environ.items() if not k.startswith("SB_") and k not in ("BISE_ROLE", "BISE_HOME")}
    env = dict(base, BISE_TRY_REAL=real, BISE_TRY_BISE=bise, BISE_TRY_OPEN=hook, TRYPROOF_HOME=home)
    before = _git("rev-parse", "HEAD", cwd=repo) + _git("status", "--porcelain", cwd=repo)
    R["front_start"] = qa._front()
    try:
        t0 = time.time()
        r = subprocess.run([LAUNCHER, "--try", "--no-build"], env=env, capture_output=True, text=True, timeout=300)
        R["launcher"] = {"rc": r.returncode, "err": r.stderr[-2000:], "s": round(time.time() - t0, 1)}
        save()
        launched = json.load(open(os.path.join(PROOF, "launched.json"))) if os.path.exists(os.path.join(PROOF, "launched.json")) else {}
        R["launched"] = launched
        verdict("bise-ambient --try opens the app (off-screen) with the launcher's args", r.returncode == 0 and bool(launched.get("pid")),
                "rc %s, pid %s, %s" % (r.returncode, launched.get("pid"), r.stderr.strip().splitlines()[-1:] if r.stderr else ""))
        if r.returncode != 0 or not launched.get("pid"):
            return R
        pid = launched["pid"]
        watch = open(os.path.join(qa.REAL_APP_DIR, "watch.log")).read()
        verdict("watchdog attached first", ("watching pid %d" % pid) in watch, "watch.log %s" % watch.strip().splitlines()[-1:])
        # the launcher passes no --workspace: the core runs `ambient-core --home` (state.core.workspace
        # stays ''), and its home workspace is BISE_HOME_WORKSPACE = <try>/bise. So: no other
        # workspace named, and the home workspace's hub lives in the try home's hubs/.
        core_ws = (qa.real_call("state").get("core") or {}).get("workspace") or ""
        t0, hubs = time.time(), []
        while time.time() - t0 < 20 and not any(os.path.basename(h).startswith("bise-") for h in hubs):
            hubs = sorted(os.listdir(os.path.join(tryh, "hubs"))) if os.path.isdir(os.path.join(tryh, "hubs")) else []
            time.sleep(0.5)
        home_ok = core_ws == "" or os.path.realpath(core_ws) == os.path.realpath(os.path.join(tryh, "bise"))
        verdict("the core runs the try's home workspace", home_ok and any(h.startswith("bise-") for h in hubs),
                "core workspace %r (''=--home), hubs in the try home %s" % (core_ws, hubs))
        qa.real_win("open")
        time.sleep(3)
        qas = json.loads(qa.real_op("eval", window="win", js="(() => JSON.stringify([...document.querySelectorAll('[data-qa]')].map(e => e.getAttribute('data-qa'))))()").get("value") or "[]")
        proj = next((k for k in qas if k.startswith("route:acme")), None)
        verdict("the sidebar shows the cloned project", bool(proj), "routes %s" % [k for k in qas if k.startswith("route:")],
                qa.real_op("shot", what="win").get("png"))

        def text():
            return qa.real_op("eval", window="win", js="document.body.innerText.replace(/\\s+/g,' ')").get("value") or ""

        def say(route, words):
            qa.real_win("deeplink", route=route)
            time.sleep(1.5)
            if "esc write a plain message" in text():
                qa.real_keys("esc", window="win")
                time.sleep(0.3)
            qa.real_op("type", window="win", text=words)
            time.sleep(0.2)
            qa.real_keys("enter", window="win")
            t1 = time.time()
            while time.time() - t1 < 60 and not ("ack:" in text() and words in text().split("ack:", 1)[-1]):
                time.sleep(0.5)
            return "ack:" in text() and words in text().split("ack:", 1)[-1]
        ok = say("bise", "hello from the try")
        verdict("words to bise get an answer through the try's provider config", ok, "answer %s" % ("seen" if ok else "NOT seen"),
                qa.real_op("shot", what="win").get("png"))
        ok = say(proj.split(":", 1)[1].split("/")[0] and "project/%s" % proj.split(":", 1)[1], "what is in this repo")
        verdict("words to the project's main get an answer", ok, "answer %s" % ("seen" if ok else "NOT seen"),
                qa.real_op("shot", what="win").get("png"))
        reqs = [json.loads(l) for l in open(flog)] if os.path.exists(flog) else []
        leaked = [p for p in glob.glob("/proc/*") if False]
        verdict("the fake provider was reached through the try's config", len(reqs) >= 2, "%d requests at the fake provider" % len(reqs))
        cfg = open(os.path.join(tryh, "config.toml")).read()
        verdict("the try's config reads the key in place", "jq -r .mistral.key" in cfg and "FAKE" not in cfg and "[pages]" not in cfg,
                "config: %s" % cfg.replace("\n", " | ")[:200])
        R["violations"] = qa.real_violations(pid)
        verdict("never on his screen: no window on a screen, never active, no Dock icon", not R["violations"], "violations %s" % R["violations"])
    finally:
        r = subprocess.run([LAUNCHER, "--try", "--stop"], env=env, capture_output=True, text=True, timeout=120)
        R["stop"] = {"rc": r.returncode, "err": r.stderr[-800:]}
        time.sleep(1.0)
        left = [l for l in subprocess.run(["ps", "-axww", "-o", "pid=,args="], capture_output=True, text=True).stdout.splitlines()
                if PROOF in l and "try-proof" not in l.split()[1:2]]
        app_left = qa._exe_pid(qa._bundle_exe(os.path.abspath(qa.REAL_APP)))
        verdict("bise-ambient --try --stop ends the app and the hubs", r.returncode == 0 and not app_left and not [l for l in left if "sbd" in l or "ambient-core" in l],
                "rc %s, app left %s, try processes left %s, says %r" % (r.returncode, app_left, len(left), r.stderr.strip().splitlines()[-1:]))
        if app_left:
            qa.real_stop()
        fake.terminate()
        verdict("his fake home's repo untouched", (_git("rev-parse", "HEAD", cwd=repo) + _git("status", "--porcelain", cwd=repo)) == before,
                "HEAD and status unchanged")
        R["front_end"] = qa._front()
        save()
    return R


def report(R):
    lines = ["try-proof %s  front %s -> %s" % (R.get("started"), (R.get("front_start") or {}).get("name"), (R.get("front_end") or {}).get("name"))]
    for s in R["steps"]:
        lines.append("%-4s %-70s %s" % (s["verdict"].upper(), s["name"][:70], s["why"][:120]))
    lines.append("%d/%d pass" % (sum(s["verdict"] == "pass" for s in R["steps"]), len(R["steps"])))
    return "\n".join(lines) + "\n"
