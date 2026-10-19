"""ambient-qa world: a throwaway bise with several projects, for bise desktop (S12).

One isolated HOME under ~/.bise/gate holds bise's home workspace (<HOME>/bise,
no git) and 2 or 3 projects (<HOME>/code/<name>, git repos). Each runs its
own hub with tests/e2e.py's scripted provider. The hubs find their state by
the user's own rules (<HOME>/.bise/hubs/<name>-<hash>), the way the app's
core finds his, never through SB_STATE_DIR. The fake mains then seed each
project through their own `sb`: agents in worktrees, a committed diff
ready for review, a dirty worktree with an agent at work, cards with
options, a merge question, a blocked agent, an artifact.

  qa.py world up [--projects 2|3] [--bise EXE]  the hubs, seeded; returns the world
  qa.py world state                             what each hub holds: agents, cards, diffs
  qa.py world say <project|bise> "<words>"      words to that project's main (the fake one)
  qa.py world computer <project> <agent> driving|paused|stopped|none [place]
                                                that agent's row in the fake computer use (fake_cu.py)
  qa.py world computer-log                      the calls the fake computer-use broker got
  qa.py world down                              stops every hub of the world by its pid

`up` takes the heavy lock (/usr/bin/lockf -k ~/.bise/run/heavy.lock nice
-n 10) only around a rebuild of the tree's helpers (scripts/bins.sh) that
will compile; with built helpers and an existing bise it never waits on it
(main m_10008: the lock is for cargo builds and gates). The hubs
then idle until `down`; a daemon holds a `hello` on each, so none of them
stops through idle-exit. `world.json` (in the world's folder) names every hub:
its workspace, socket, state folder and pid. Nothing here touches the user's
hubs, app or accounts: every path is under ~/.bise/gate, checked before start.

The fixtures (PROJECTS, main_script, agent_script) are pure, tested in
tests/ambient_qa_test.py; the daemon only runs them.
"""
import glob
import json
import os
import re
import shutil
import signal
import subprocess
import sys
import tempfile
import time

# the fixtures and the seeding live in world_fixtures.py and world_seed.py (moved as is, the 1,000-line
# cap, architect S1); every name stays world.<name> for qa.py, the tests and the desktop checks
from world_fixtures import (  # noqa: E402
    CODE, CROWD, GATE, HERE, HOME_NAME, LATENCY_AFTER, LATENCY_BEFORE,
    LIST, LOCK, LOG_LINE, LOG_LINES, LONG, LONG_OUT_BYTES, METRICS,
    P99_ANSWER, P99_ASK, PROJECTS, QUEUED_TEXT, QUOTED, QUOTE_REPLY, QUOTE_WORDS,
    REGIONS, RICH_AGENTS, RICH_DROPPED, SCREEN_CONTEXT, SCREEN_REPLY, SCREEN_TEXT, SEED_WORDS,
    STEER_REPLY, STEER_TEXT, STEER_TURN, SUBJECTS, TABLE, USAGE_TURN, agent_reply, bar_turns,
    crowd, dash_messages, long_answer, plan, put_script, queued_count, quoted_message,
    rich_messages, screen_input, scripts_dir)
from world_seed import (  # noqa: E402
    FAKE_ACCOUNT, FEATURE_FILE, agent_script, approval_command, approval_seed, ask_file, checker_off,
    fake_gh, feature_script, home_account, main_script, make_repo, marker, rich_seed,
    seed_words, try_real, write_seeds)


# ---------------------------------------------------------------- where

def world_dir():
    import qa
    return os.environ.get("AMBIENT_WORLD_DIR") or os.path.join(GATE, "w-" + qa._short_agent())


def _paths(world):
    return {"home": os.path.join(world, "h"), "json": os.path.join(world, "world.json"), "log": os.path.join(world, "world.log")}


def guard(world, values=()):
    """Refuse a world outside ~/.bise/gate, or any value that reaches his own state."""
    import qa
    gate = os.path.realpath(GATE) + "/"
    if not os.path.realpath(world).startswith(gate):
        raise qa.QAError("refused: the world %s is not under ~/.bise/gate" % world)
    if isinstance(values, dict):
        for k, v in values.items():
            try:
                qa.refuse_his_state([v])
            except qa.QAError as e:
                raise qa.QAError("%s (env %s)" % (e, k))
        return
    qa.refuse_his_state(values)


def _read(path):
    try:
        with open(path) as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def _alive(pid):
    try:
        os.kill(int(pid), 0)
        return True
    except (OSError, TypeError, ValueError):
        return False


# ---------------------------------------------------------------- the daemon

def daemon(bise, root, n, rich=False, agents=0):
    """Detached (`qa.py _world`): the hubs, seeded, held until SIGTERM, then stopped."""
    import qa
    world = world_dir()
    P = _paths(world)
    sys.path.insert(0, os.path.join(qa.REPO, "tests"))
    tmp = os.path.join(world, "t")
    os.makedirs(tmp, exist_ok=True)
    tempfile.tempdir = tmp
    os.environ["BISE_APP_ROOT"] = root    # e2e.Env passes it on: the hubs' repl-live
    import e2e  # noqa: E402
    e2e.EXE = bise
    try:
        from wait import load_factor
    except ImportError:
        load_factor = getattr(e2e, "load_factor", lambda: 1.0)
    home = P["home"]
    qa._prepare_home(home)
    checker_off(home)
    home_ws = os.path.join(home, HOME_NAME)
    os.makedirs(home_ws, exist_ok=True)
    projects = plan(n, rich)
    stop = {"now": False}
    signal.signal(signal.SIGTERM, lambda *_: stop.update(now=True))
    signal.signal(signal.SIGINT, lambda *_: stop.update(now=True))
    hubs, envs, holds = [], [], []
    t_up = time.time()     # each step's time goes to world.log (ambient-lead m_15705)
    bindir = fake_gh(world, projects)
    try:
        for name, files in [(HOME_NAME, None)] + [(p["name"], p["files"]) for p in projects]:
            ws = home_ws if files is None else os.path.join(home, "code", name)
            if files is not None:
                make_repo(ws, files, next((p.get("origin") for p in projects if p["name"] == name), None))
            E = e2e.Env()
            E.env = world_env(E.env)      # never his keys (main m_10585)
            if rich:
                # D5: scripted calls and answers for his plain words, no echo (fake_provider.py)
                os.makedirs(scripts_dir(world), exist_ok=True)
                E.env.update(FAKE_SCRIPTS=scripts_dir(world), FAKE_PLAIN="1")
            fresh_fake(E)
            E.env["PATH"] = bindir + os.pathsep + E.env.get("PATH", "/usr/bin:/bin")
            envs.append(E)
            E.ws = ws
            sb_core = os.path.join(root, "sb-core")
            if os.path.exists(sb_core):
                E.env["SB_CORE_BIN"] = sb_core
            E.env["BISE_HOME_WORKSPACE"] = home_ws
            qa.real_home_env(E.env, home)
            # the caller's shell folders are stale here (the hub runs in e2e.ROOT) and may be an
            # agent's tmp under his ~/.bise/hubs: never handed on
            for k in ("PWD", "OLDPWD"):
                E.env.pop(k, None)
            guard(world, dict(E.env, _ws=ws, _home_ws=home_ws))
            before = set(glob.glob(os.path.join(home, ".bise", "hubs", "*", "hub.sock")))
            err = open(os.path.join(E.tmp, "hub.stderr"), "a")
            E.hub = subprocess.Popen([bise, "sbd", "--workspace", ws], cwd=e2e.ROOT, env=E.env,
                                     stdin=subprocess.DEVNULL, stdout=err, stderr=err)
            t0, limit, sock = time.time(), 60 * load_factor(), None
            while not sock:
                new = set(glob.glob(os.path.join(home, ".bise", "hubs", "*", "hub.sock"))) - before
                sock = sorted(new)[0] if new else None
                if not sock and (E.hub.poll() is not None or time.time() - t0 > limit):
                    raise RuntimeError("the %s hub did not start in %.0f s (exit %s): %s" % (
                        name, limit, E.hub.poll(), open(os.path.join(E.tmp, "hub.stderr"), errors="replace").read()[-2000:]))
                time.sleep(0.1)
            refuse_leak("the %s hub" % name, E.hub.pid)
            refuse_leak("the %s fake provider" % name, E.fake.pid)
            E.state = os.path.dirname(sock)
            c = e2e.Client(sock)     # the world's hold: its hello keeps idle-exit away
            holds.append(c)
            hubs.append({"project": name, "ws": ws, "sock": sock, "state": E.state, "hub_pid": E.hub.pid,
                         "fake_pid": E.fake.pid, "fake_log": E.fake_log, "home": files is None})
        for h, c in zip(hubs, holds):
            c.wait_status("main", "idle", 120 * load_factor())
        print("world: step hubs (%d up, mains idle) in %.0f s" % (len(hubs), time.time() - t_up), flush=True)
        t_step = time.time()
        want = write_seeds(world, projects, rich)
        for p in projects:
            c = holds[[h["project"] for h in hubs].index(p["name"])]
            c.say(seed_words(p, rich))
        for p in projects:
            # a message to main can be lost while it is busy (seen in the rich world's runs; likely
            # qa-flows' one 'not seeded in time' world, ambient-lead m_12599): when none of the
            # project's agents exists 90 s after the seed was said, main gets it again, once
            c = holds[[h["project"] for h in hubs].index(p["name"])]
            names = {a["name"] for a in p["agents"]}
            spawned = lambda: names & {a.get("name") for a in (c.state or {}).get("agents", [])}  # noqa: E731
            try:
                c.wait(spawned, 90 * load_factor(), "%s's first agent" % p["name"])
            except Exception:  # noqa: BLE001 - wait.until's timeout
                print("world: %s's seed never started: said again" % p["name"], flush=True)
                c.wait_status("main", "idle", 120 * load_factor())
                c.say(seed_words(p, rich))
        t0 = time.time()
        while [m for m in want if not os.path.exists(m)]:
            if stop["now"] or time.time() - t0 > 300 * load_factor():
                raise RuntimeError("not seeded in time: %s" % [os.path.basename(m) for m in want if not os.path.exists(m)])
            time.sleep(0.3)
        print("world: step seed (%d agents) in %.0f s" % (len(want), time.time() - t_step), flush=True)
        t_step = time.time()
        for p in projects:
            if p.get("approval"):
                c = holds[[h["project"] for h in hubs].index(p["name"])]
                approval_seed(c, home, p["approval"], 120 * load_factor(), scripts_dir(world) if rich else None)
        print("world: step approval in %.0f s" % (time.time() - t_step), flush=True)
        t_step = time.time()
        rich_out = rich_seed(world, hubs, holds, agents, 300 * load_factor()) if rich else None
        if rich:
            print("world: step rich in %.0f s" % (time.time() - t_step), flush=True)
        home_env = envs[[h["home"] for h in hubs].index(True)].env
        real = try_real(os.path.join(world, "try-real"), [h for h in hubs if not h["home"]], home_env["BEND_PROVIDER_URL"])
        home_account(home, home_env["BEND_PROVIDER_URL"])
        print("world: up in %.0f s (load factor %.1f)" % (time.time() - t_up, load_factor()), flush=True)
        info = {"pid": os.getpid(), "world": world, "home": home, "bise": bise, "root": root, "projects": n,
                "hubs": hubs, "registry": register(bise, home, [h["ws"] for h in hubs if not h["home"]]),
                "rich": rich_out, "try_real": real, "up_ms": int(time.time() * 1000)}
        with open(P["json"] + ".tmp", "w") as f:
            json.dump(info, f, indent=1)
        os.replace(P["json"] + ".tmp", P["json"])
        while not stop["now"]:
            for h, E in zip(hubs, envs):
                if E.fake.poll() is not None:
                    h["fake_pid"] = revive_fake(E, h["project"])     # same port: try-real's config stays right
                    with open(P["json"] + ".tmp", "w") as f:
                        json.dump(info, f, indent=1)
                    os.replace(P["json"] + ".tmp", P["json"])
            time.sleep(0.3)
    finally:
        for E in envs:
            E.keep = True        # the world's files stay for reading; `up` clears them
            os.environ["SB_KEEP"] = "1"
            try:
                E.close()
            except Exception:  # noqa: BLE001
                pass
        try:
            os.unlink(P["json"])
        except OSError:
            pass


# ---------------------------------------------------------------- his keys, never

# main m_10585 / lead m_10587: world.py passed os.environ (through e2e.Env's clean_env) to the
# world's hubs, so his real provider keys reached throwaway hubs. Now every process the world starts
# (hubs, fake providers, and what they start) gets an env built from this ALLOWLIST: the system's
# few, the world's own paths and the fake provider; never a *KEY*/*TOKEN*/*SECRET*/*PASSWORD* name,
# except the fake key e2e's model needs.
ENV_KEEP = {"PATH", "LANG", "LC_ALL", "LC_CTYPE", "USER", "LOGNAME", "SHELL", "TERM", "__CF_USER_TEXT_ENCODING",
            "HOME", "TMPDIR", "TMP", "TEMP", "TMUX_TMPDIR", "CARGO_HOME", "RUSTUP_HOME", "BISE_APP_ROOT", "SB_CORE_BIN",
            "BISE_HOME_WORKSPACE", "SB_ONBOARDING", "BISE_APPROVALS", "SB_STATE_DIR", "FAKE_LOG", "FAKE_SCRIPTS", "FAKE_PLAIN", "FAKE_BODIES", "PYTHONUNBUFFERED"}
SECRET = re.compile(r"KEY|TOKEN|SECRET|PASSWORD|PASSWD|CREDENTIAL|COOKIE|SESSION_ID", re.I)
FAKE_KEYS = {"MISTRAL_API_KEY": "fake-key"}


def world_env(env):
    """`env` cut to the allowlist (ENV_KEEP and the world's own BEND_* paths and URLs), no secret-named
    variable, plus the fake key. Pure."""
    out = {k: v for k, v in env.items() if (k in ENV_KEEP or k.startswith("BEND_")) and not SECRET.search(k)}
    out.update(FAKE_KEYS)
    return out


def leaked(env):
    """The secret-named variables of `env` that aren't the world's fake ones (names only). Pure."""
    return sorted(k for k, v in env.items() if SECRET.search(k) and FAKE_KEYS.get(k) != v)


def proc_env(pid):
    """A running process's environment (ps -E), for the law below; never printed."""
    r = subprocess.run(["/bin/ps", "-wwE", "-o", "command=", "-p", str(pid)], capture_output=True, text=True)
    return dict(re.findall(r" ([A-Za-z_][A-Za-z0-9_]*)=(\S*)", r.stdout))


def refuse_leak(what, pid):
    """The law (main m_10585): a world process holding any real key stops the world, naming the
    variables only."""
    names = leaked(proc_env(pid))
    if names:
        raise RuntimeError("%s (pid %s) holds secret-named variables: %s (values never shown): the world refuses to run"
                           % (what, pid, ", ".join(names)))


def fresh_fake(E):
    """e2e.Env starts its fake provider with clean_env (his whole env): replaced at once by one with
    the world's env, on the same port."""
    import e2e
    port = E.env["BEND_PROVIDER_URL"].split("127.0.0.1:")[1].split("/")[0]
    try:
        E.fake.kill()
        E.fake.wait(5)
    except Exception:  # noqa: BLE001
        pass
    E.fake = subprocess.Popen([sys.executable, "-u", os.path.join(e2e.HERE, "fake_provider.py"), port],
                              stdout=subprocess.PIPE, text=True, env=world_env(dict(E.env, FAKE_LOG=E.fake_log)))
    line = E.fake.stdout.readline()
    if not line.startswith("PORT"):
        raise RuntimeError("the world's fake provider didn't start on port %s: %r" % (port, line))


def revive_fake(E, project):
    """A world lives for hours and its fake providers died under one (exit seen by the daemon, no
    traceback; amb-tools' wwin3 run): a dead one is reaped, its exit logged, and a new one started on
    the same port, so the hub's BEND_PROVIDER_URL stays right. Returns the new pid."""
    import e2e
    port = E.env["BEND_PROVIDER_URL"].split("127.0.0.1:")[1].split("/")[0]
    print("world: %s's fake provider exited (%s): restarted on port %s" % (project, E.fake.returncode, port), flush=True)
    E.fake = subprocess.Popen([sys.executable, "-u", os.path.join(e2e.HERE, "fake_provider.py"), port],
                              stdout=subprocess.PIPE, text=True, env=world_env(dict(E.env, FAKE_LOG=E.fake_log)))
    line = E.fake.stdout.readline()
    if not line.startswith("PORT"):
        print("world: %s's fake provider didn't come back: %r" % (project, line), flush=True)
    return E.fake.pid


def register(bise, home, workspaces):
    """`bise project add` for each project once S1 has it (amb-hub); until then the hubs are
    independent and this says so."""
    import qa
    env = {"HOME": home, "BISE_HOME_WORKSPACE": os.path.join(home, HOME_NAME), "PATH": qa.own_path(os.environ.get("PATH", "/usr/bin:/bin"))}
    h = subprocess.run([bise, "project", "--help"], capture_output=True, text=True, env=env, timeout=20)
    if h.returncode != 0 or "add" not in (h.stdout + h.stderr):
        return "no `bise project` in this bise yet (S1, f1e91b82): the hubs are independent"
    out = []
    for ws in workspaces:
        r = subprocess.run([bise, "project", "add", ws], capture_output=True, text=True, env=env, timeout=30)
        out.append({"ws": ws, "rc": r.returncode, "out": (r.stdout + r.stderr).strip()[-300:]})
    r = subprocess.run([bise, "project", "list", "--json"], capture_output=True, text=True, env=env, timeout=30)
    try:
        listed = json.loads(r.stdout)
    except ValueError:
        listed = (r.stdout + r.stderr).strip()[-300:]
    return {"added": out, "list": listed}


# ---------------------------------------------------------------- the commands

# heavy-run's slots: heavy.lock, heavy2.lock, and heavy3/heavy4.lock on AC power (since 2026-10-18)
SLOTS = (LOCK,) + tuple(os.path.join(os.path.dirname(LOCK), "heavy%d.lock" % n) for n in (2, 3, 4))


def slot_pid(env=None):
    """The pid of the heavy job heavy-run says this process inherits (HEAVY_SLOT="<slot> <pid>",
    exported in each job since gate-reds), or None. Pure."""
    tail = (env if env is not None else os.environ).get("HEAVY_SLOT", "").rsplit(" ", 1)[-1]
    return int(tail) if tail.isdigit() else None


def holds_a_slot(cmd):
    """True when this command line holds one of the heavy slots: a `lockf ... heavy.lock` or
    `lockf ... heavy2|3|4.lock` (~/.bise/run/heavy-run takes the first free one), or the
    heavy-run script itself (`/bin/bash .../heavy-run ...`), which holds a slot for all it runs.
    Pure."""
    argv = cmd.split()
    if not argv:
        return False
    if os.path.basename(argv[0]) == "lockf" and any(s in argv for s in SLOTS):
        return True
    return any(os.path.basename(a) == "heavy-run" for a in argv[:2])


def _ps(pid):
    r = subprocess.run(["ps", "-ww", "-o", "ppid=,command=", "-p", str(pid)], capture_output=True, text=True)
    ppid, _, cmd = r.stdout.strip().partition(" ")
    return (int(ppid.strip() or 0), cmd.strip()) if r.stdout.strip() else None


def under_heavy_lock(pid=None, ps=_ps, env=None):
    """True when this process (or the given one) runs under a heavy slot of its own ancestry (either
    slot, or heavy-run around it): taking the lock again would wait on itself, or on the other slot's
    job while this one already holds a slot (qa-flows 82b584d6: a world up under heavy-run around
    real.sh, 'not seeded in time: shop.gift-ui'). ps(pid) -> (ppid, command) or None."""
    pid = pid or os.getpid()
    job = slot_pid(env)
    for _ in range(64):
        # heavy-run's own rule (it refuses a nested call): its HEAVY_SLOT job among the ancestors
        if job is not None and pid == job:
            return True
        got = ps(pid)
        if not got:
            return False
        ppid, cmd = got
        if holds_a_slot(cmd):
            return True
        if ppid <= 1 or ppid == pid:
            return False
        pid = ppid
    return False


def helpers_fresh(root):
    """True when the tree's helpers are the build of its sources now: each <root>/<helper> is there
    with a <helper>.key (written by bins.sh) equal to `bins.sh key` of the sources. Then nothing
    compiles, and bins.sh isn't called at all (its cache may have been pruned: a call would compile)."""
    import qa
    bins = os.path.join(root, "scripts", "bins.sh")
    for h in qa.HELPERS:
        exe = os.path.join(root, h)
        try:
            have = open(exe + ".key").read().strip()
        except OSError:
            return False
        if not have or not os.access(exe, os.X_OK):
            return False
        k = subprocess.run([bins, "key", "--src", root, h], capture_output=True, text=True, cwd=root, timeout=120)
        if k.returncode != 0 or k.stdout.strip() != have:
            return False
    return True


def ensure_helpers_locked(root):
    """The tree's helpers current, taking the heavy lock only around a compile that will run (main
    m_10008: the lock is for builds and gates only): fresh helpers take no lock; stale ones are
    rebuilt by scripts/bins.sh under `lockf -k heavy.lock nice -n 10`, or directly when this
    process already runs under the lock (one take, never two: main m_9310)."""
    import qa
    if helpers_fresh(root):
        return
    if os.environ.get("AMBIENT_WORLD_LOCKED") == "1" or under_heavy_lock():
        qa.ensure_helpers(root)
        return
    os.makedirs(os.path.dirname(LOCK), exist_ok=True)
    bins = os.path.join(root, "scripts", "bins.sh")
    p = subprocess.run(["/usr/bin/lockf", "-k", LOCK, "nice", "-n", "10", bins, "--src", root] + list(qa.HELPERS),
                       capture_output=True, text=True, cwd=root, timeout=1800)
    if p.returncode != 0:
        raise qa.QAError("scripts/bins.sh %s failed in %s: %s" % (" ".join(qa.HELPERS), root, (p.stderr or p.stdout)[-1200:]))


def up(n=3, bise=None, root=None, rich=False, agents=0):
    """Clear the old world, start the daemon, wait until seeded. The heavy lock only around a
    helpers compile that runs (ensure_helpers_locked); an up with built helpers never waits on it.
    rich: the try gate's world (always 3 projects); agents: telemetry's agent count with rich."""
    import qa
    world = world_dir()
    P = _paths(world)
    guard(world)
    old = _read(P["json"])
    if old and _alive(old.get("pid")):
        raise qa.QAError("a world is up (pid %s): `qa.py world down` first" % old["pid"])
    if agents and not rich:
        raise qa.QAError("--agents goes with --rich")
    if rich:
        n = 3
        crowd(agents, len(plan(3, True)[0]["agents"]))     # refuses a count above the names it has
    plan(n)
    if bise:
        bise, root = os.path.abspath(bise), root or qa.app_root_of(bise)
    else:
        bise, root2 = qa.find_bise()
        root = root or root2
    if not root:
        raise qa.QAError("%s has no app root with a built repl-live (--root)" % bise)
    ensure_helpers_locked(root)
    if os.path.exists(world):
        shutil.rmtree(world)
    os.makedirs(world)
    log = open(P["log"], "a")
    env = {k: v for k, v in os.environ.items() if not k.startswith("SB_") and k not in ("BISE_ROLE", "BISE_EXPORTS_FOR", "AMBIENT_WORLD_LOCKED")}
    env["AMBIENT_WORLD_DIR"] = world     # the daemon has no SB_AGENT: same folder as this caller's
    p = subprocess.Popen([sys.executable, "-u", "-B", os.path.join(HERE, "qa.py"), "_world", "--bise", bise, "--root", root, "--projects", str(n)]
                         + (["--rich", "--agents", str(agents)] if rich else []),
                         stdin=subprocess.DEVNULL, stdout=log, stderr=log, start_new_session=True, cwd=qa.REPO, env=env)
    t0, limit = time.time(), world_timeout()
    print("world: up within %.0f s at most (load factor %.1f%s)" % (limit, _load_factor(),
          ", AMBIENT_QA_WORLD_TIMEOUT" if os.environ.get("AMBIENT_QA_WORLD_TIMEOUT") else ""), file=log, flush=True)
    while time.time() - t0 < limit:
        info = _read(P["json"])
        if info and info.get("pid") == p.pid:
            return dict(state(), log=P["log"])
        if p.poll() is not None:
            raise qa.QAError("the world's daemon exited (%s): %s" % (p.returncode, open(P["log"], errors="replace").read()[-2500:]))
        time.sleep(0.3)
    p.terminate()
    raise qa.QAError("the world didn't come up in %.0f s (AMBIENT_QA_WORLD_TIMEOUT raises it): see %s; its steps' times are in that log"
                     % (limit, P["log"]))


WORLD_UP_S = 900


def _load_factor():
    """tests/wait.py's load factor (load average per core, 1 to 4), 1 when it can't be read."""
    try:
        return max(1.0, min(4.0, os.getloadavg()[0] / (os.cpu_count() or 1)))
    except OSError:
        return 1.0


def world_timeout(env=None, lf=None):
    """How long `up` waits for the world (qa-native's 19d26863 rerun: the crowd step alone took 822 s
    at load 27, past the fixed 900 s): $AMBIENT_QA_WORLD_TIMEOUT seconds when it is a positive number,
    else 900 s times the load factor (1 to 4, as every e2e wait). Pure but for the load."""
    env = os.environ if env is None else env
    try:
        v = float(env.get("AMBIENT_QA_WORLD_TIMEOUT") or 0)
    except ValueError:
        v = 0
    if v > 0:
        return v
    return WORLD_UP_S * (_load_factor() if lf is None else max(1.0, lf))


def down():
    """SIGTERM the daemon (it stops each hub), then make sure every recorded pid is gone."""
    P = _paths(world_dir())
    info = _read(P["json"])
    if not info:
        return {"down": "no world up"}
    pids = [info["pid"]] + [h[k] for h in info["hubs"] for k in ("hub_pid", "fake_pid")]
    import fake_cu
    fake_cu.stop(_run_dir(info))
    if _alive(info["pid"]):
        os.kill(info["pid"], signal.SIGTERM)
    t0 = time.time()
    while any(_alive(p) for p in pids) and time.time() - t0 < 60:
        time.sleep(0.3)
    killed = [p for p in pids if _alive(p)]
    for p in killed:
        os.kill(p, signal.SIGKILL)
    left = subprocess.run(["ps", "-axww", "-o", "pid=,args="], capture_output=True, text=True).stdout
    left = [l.strip() for l in left.splitlines() if info["world"] in l]
    return {"down": True, "killed": killed, "left": left}


def _hub_state(sock, timeout=10):
    import qa
    sys.path.insert(0, os.path.join(qa.REPO, "tests"))
    import e2e  # noqa: E402
    c = e2e.Client(sock)
    try:
        t0 = time.time()
        while c.state is None and time.time() - t0 < timeout:
            time.sleep(0.05)
        return c.state or {}
    finally:
        c.s.close()


def _git(path, *args):
    r = subprocess.run(["git", "-C", path] + list(args), capture_output=True, text=True)
    return r.stdout.strip() if r.returncode == 0 else None


def state():
    """Each hub's agents (status, place, branch, commits ahead of main, dirty files) and cards."""
    import qa
    info = _read(_paths(world_dir())["json"])
    if not info:
        raise qa.QAError("no world up: `qa.py world up`")
    out = []
    for h in info["hubs"]:
        st = _hub_state(h["sock"])
        agents = []
        for a in st.get("agents", []):
            row = {"name": a.get("name"), "status": a.get("status"), "mode": a.get("mode"), "branch": a.get("branch")}
            if a.get("mode") == "worktree" and a.get("path") and os.path.isdir(a["path"]):
                row["path"] = a["path"]
                row["commits"] = (_git(a["path"], "log", "--format=%s", "main..HEAD") or "").splitlines()
                row["diff"] = _git(a["path"], "diff", "--shortstat", "main...HEAD")
                row["dirty"] = (_git(a["path"], "status", "--porcelain") or "").splitlines()
            agents.append(row)
        cards = [{"id": c.get("id"), "kind": c.get("kind"), "place": c.get("place"),
                  "text": (c.get("text") or c.get("question") or "")[:160]} for c in st.get("cards", [])]
        out.append({"project": h["project"], "home": h["home"], "ws": h["ws"], "sock": h["sock"], "hub_pid": h["hub_pid"],
                    "alive": _alive(h["hub_pid"]), "agents": agents, "cards": cards})
    return {"world": info["world"], "home": info["home"], "pid": info["pid"], "bise": info["bise"],
            "registry": info.get("registry"), "rich": info.get("rich"), "try_real": info.get("try_real"), "hubs": out}


def say(project, text):
    """Words to that project's main (bise = the home hub), as typed in its TUI."""
    import qa
    info = _read(_paths(world_dir())["json"])
    if not info:
        raise qa.QAError("no world up")
    h = [h for h in info["hubs"] if h["project"] == project or (project == HOME_NAME and h["home"])]
    if not h:
        raise qa.QAError("no project %r in the world (%s)" % (project, ", ".join(x["project"] for x in info["hubs"])))
    sys.path.insert(0, os.path.join(qa.REPO, "tests"))
    import e2e  # noqa: E402
    c = e2e.Client(h[0]["sock"])
    try:
        c.say(text)
        time.sleep(0.3)
    finally:
        c.s.close()
    return {"sent": text, "project": h[0]["project"]}


def _run_dir(info):
    """The world's run dir: its hubs', its TUI's and the app's core's (HOME/.bise/run, worldEnv)."""
    return os.path.join(info["home"], ".bise", "run")


def computer(project, agent, state, place=None):
    """One agent's computer-use row in the world's fake computer-use world (fake_cu.py): driving,
    paused, stopped or none, on `place` ('Chrome · amazon.fr'); its fake broker's commands' socket
    started if it isn't up. Returns {key, agent: the row or None}."""
    import qa
    import fake_cu
    info = _read(_paths(world_dir())["json"])
    if not info:
        raise qa.QAError("no world up")
    guard(info["world"])
    h = [h for h in info["hubs"] if h["project"] == project or (project == HOME_NAME and h["home"])]
    if not h:
        raise qa.QAError("no project %r in the world (%s)" % (project, ", ".join(x["project"] for x in info["hubs"])))
    if state not in fake_cu.STATES:
        raise qa.QAError("state is one of %s" % "|".join(fake_cu.STATES))
    run = _run_dir(info)
    key = fake_cu.agent_key(fake_cu.hub_id(os.path.dirname(h[0]["sock"])), agent)
    fake_cu.ensure(run, os.path.join(os.path.dirname(os.path.abspath(__file__)), "qa.py"))
    return {"key": key, "agent": fake_cu.set_agent(run, key, state, place)}


def computer_log():
    """Every call the world's fake computer-use broker got so far: [{act, agent, key, args, ok}]."""
    import qa
    import fake_cu
    info = _read(_paths(world_dir())["json"])
    if not info:
        raise qa.QAError("no world up")
    return fake_cu.calls(_run_dir(info))


def feature(project, name, timeout=120):
    """A real approval card in that project: its fake main runs feature_script, then this waits
    on the hub's state for the feature_try card of `feature:<name>` and returns it."""
    import qa
    info = _read(_paths(world_dir())["json"])
    if not info:
        raise qa.QAError("no world up")
    h = [h for h in info["hubs"] if h["project"] == project and not h["home"]]
    if not h:
        raise qa.QAError("no project %r with a git checkout in the world (%s)" % (project, ", ".join(x["project"] for x in info["hubs"] if not x["home"])))
    h = h[0]
    guard(info["world"], [h["ws"]])
    path = os.path.join(info["world"], "seed", project, "feature-%s.sh" % name)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(feature_script(info["world"], h["ws"], name))
    say(project, "[[bash: bash %s]]" % path)
    want = "feature:%s" % name
    t0 = time.time()
    while time.time() - t0 < timeout:
        cards = [c for c in _hub_state(h["sock"]).get("cards", []) if c.get("kind") == "feature_try" and c.get("place") == want]
        if cards:
            c = cards[-1]
            return {"project": project, "feature": name, "card": {"id": c.get("id"), "kind": c.get("kind"), "place": c.get("place"),
                                                                   "text": c.get("text") or c.get("question")}, "script": path}
        time.sleep(0.5)
    raise qa.QAError("no feature_try card for %s in %s after %d s: see %s and the hub's main" % (want, project, timeout, path))


# the names moved to world_fixtures and world_seed stay world.<name> (qa.py, the tests, the desktop checks)
__all__ = [
    'CODE', 'CROWD', 'FAKE_ACCOUNT', 'FEATURE_FILE', 'GATE', 'HERE',
    'HOME_NAME', 'LATENCY_AFTER', 'LATENCY_BEFORE', 'LIST', 'LOCK', 'LOG_LINE',
    'LOG_LINES', 'LONG', 'LONG_OUT_BYTES', 'METRICS', 'P99_ANSWER', 'P99_ASK',
    'PROJECTS', 'QUEUED_TEXT', 'QUOTED', 'QUOTE_REPLY', 'QUOTE_WORDS', 'REGIONS',
    'RICH_AGENTS', 'RICH_DROPPED', 'SCREEN_CONTEXT', 'SCREEN_REPLY', 'SCREEN_TEXT', 'SEED_WORDS',
    'STEER_REPLY', 'STEER_TEXT', 'STEER_TURN', 'SUBJECTS', 'TABLE', 'USAGE_TURN', 'agent_reply',
    'agent_script', 'approval_command', 'approval_seed', 'ask_file', 'bar_turns', 'checker_off',
    'crowd', 'dash_messages', 'fake_gh', 'feature_script', 'home_account', 'long_answer',
    'main_script', 'make_repo', 'marker', 'plan', 'put_script', 'queued_count',
    'quoted_message', 'rich_messages', 'rich_seed', 'screen_input', 'scripts_dir', 'seed_words',
    'try_real', 'write_seeds',
]
