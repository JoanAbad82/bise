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
import shlex
import shutil
import signal
import subprocess
import sys
import tempfile
import time

HERE = os.path.dirname(os.path.realpath(__file__))
GATE = os.path.expanduser("~/.bise/gate")
LOCK = os.path.expanduser("~/.bise/run/heavy.lock")
HOME_NAME = "bise"     # bise's own hub: the home workspace, its main is bise


# ---------------------------------------------------------------- the fixtures (pure)

LATENCY_BEFORE = '''"""request latency percentiles for the dashboard"""


def p99(samples):
    # the mean of the slowest 10%: rises with every slow outlier
    slow = sorted(samples)[int(len(samples) * 0.9):]
    return sum(slow) / len(slow)
'''

LATENCY_AFTER = '''"""request latency percentiles for the dashboard"""


def percentile(samples, q):
    s = sorted(samples)
    return s[min(len(s) - 1, int(len(s) * q))]


def p99(samples):
    # the real 99th percentile: one slow outlier no longer moves it
    return percentile(samples, 0.99)
'''

PROJECTS = [
    {"name": "telemetry",
     "files": {"README.md": "# telemetry\n\nlatency and error dashboards.\n", "src/latency.py": LATENCY_BEFORE,
               "src/alerts.py": "ALERTS = []\n"},
     "cards": ["which window for the p99 alert?\n1. 5 min\n2. 15 min"],
     "agents": [
         {"name": "p99", "place": "new", "objective": "p99 rises since tuesday: find why and fix it",
          "steps": [{"write": "src/latency.py", "text": LATENCY_AFTER},
                    {"commit": "latency: p99 is the real 99th percentile, not the mean of the slowest 10%"},
                    {"report": "done", "text": "p99 rose because it averaged the slowest 10%; it is the real percentile now (src/latency.py). ready to merge."}]},
         {"name": "alerts", "place": "new", "objective": "page on-call when p99 stays above 800 ms",
          "steps": [{"write": "src/alerts.py", "text": "ALERTS = [{'metric': 'p99', 'above_ms': 800, 'for': '5m'}]\n"},
                    {"report": "progress", "text": "wiring the p99 alert", "step": "2/4"},
                    # a question main answers for him (qa-flows m_11510 (b): the 'answered for you' row, with why)
                    {"ask": "page on-call through PagerDuty or Slack?\n1. PagerDuty\n2. Slack",
                     "main_answers": {"text": "PagerDuty", "why": "the runbook pages on-call through PagerDuty; Slack is for FYI only"}},
                    {"work": 3600}]},
     ]},
    {"name": "shop",
     "files": {"README.md": "# shop\n\nthe store front.\n", "search/index.py": "def find(q, items):\n    return [i for i in items if q == i['name']]\n",
               "checkout/cart.py": "def total(items):\n    return sum(i['price'] for i in items)\n"},
     "cards": ["merge checkout into main? (2 files, tests pass)\n1. merge\n2. not yet"],
     "agents": [
         {"name": "checkout", "place": "new", "objective": "apply the discount codes at checkout",
          "steps": [{"write": "checkout/cart.py", "text": "def total(items, discount=0):\n    return round(sum(i['price'] for i in items) * (1 - discount), 2)\n"},
                    {"write": "checkout/codes.py", "text": "CODES = {'SPRING10': 0.10}\n"},
                    {"commit": "checkout: discount codes (SPRING10) applied to the total"},
                    {"report": "done", "text": "discount codes work at checkout (checkout/cart.py, checkout/codes.py). waiting for your merge."}]},
         {"name": "search", "place": "", "objective": "search doesn't find tshirt",
          "steps": [{"report": "blocked", "text": "search ne trouve pas tshirt: the index matches whole names only. fuzzy match or a synonym list?"}]},
         # a worktree agent with a draft PR, checks running (#415 below)
         {"name": "receipts", "place": "new", "objective": "email the receipt after checkout",
          "steps": [{"write": "checkout/receipt.py", "text": "def receipt(order):\n    return 'total: %.2f' % order['total']\n"},
                    {"commit": "receipts: the receipt text"},
                    # a message between two other agents (qa-flows m_11510 (c): the 'a → b' row)
                    {"send": "checkout", "text": "the receipt shows the discounted total: does total() round before or after the code?"},
                    {"report": "progress", "text": "draft PR #415 open, e2e running", "step": "2/3"}]},
         # a FEATURE with 2 agents (qa-flows m_10155): each in its own worktree from the feature's tip,
         # landing on the feature branch, so a try and a merge are possible (sb feature ready / merge)
         {"name": "gift-api", "feature": "gift-cards", "objective": "gift cards: the balance API",
          "steps": [{"write": "checkout/gift.py", "text": "BALANCES = {}\n\n\ndef balance(code):\n    return BALANCES.get(code, 0)\n"},
                    {"commit": "gift cards: balance(code) for the cart and checkout"},
                    {"land": "gift cards: the balance API, checkout/gift.py"},
                    {"report": "done", "text": "gift card balance API landed on gift-cards (checkout/gift.py)."}]},
         # ...and an agent with an open QUESTION of its own: it asks main, main escalates it as a card
         # tied to the agent's message (sb card --for), so the card is the agent's, not main's
         {"name": "gift-ui", "feature": "gift-cards", "objective": "gift cards: show the balance to the buyer",
          "steps": [{"write": "checkout/gift_ui.py", "text": "def label(balance):\n    return 'gift card: %.2f' % balance\n"},
                    {"commit": "gift cards: the balance label"},
                    {"land": "gift cards: the balance label, checkout/gift_ui.py"},
                    {"ask": "gift cards: show the balance on the cart page, or only at checkout?\n1. on the cart page\n2. only at checkout"},
                    {"report": "blocked", "text": "waiting for your answer: cart page or checkout only?"}]},
     ],
     "feature": "gift-cards",
     # a tool approval he answers with a note, in auto mode (qa-flows m_11510 (a)): after the seeds,
     # the world switches this hub to auto for the session, an agent force-pushes (a hard rule: a
     # card even in auto), the world answers 'no: <note>' as him, then yolo again. The call never
     # runs; its remote is a path in the world's home that doesn't exist, never the network.
     "approval": {"agent": "release", "objective": "publish the release branch",
                  "remote": "nowhere.git", "note": "use a branch, never force main"},
     # the shop's GitHub, for the PR list (ambient-lead m_10397): an origin on github.com that only the
     # world's fake gh (fake_gh.py, first on the hubs' PATH) ever answers; nothing reaches the network
     "origin": "https://github.com/acme-qa/shop.git",
     "prs": [
         {"number": 412, "branch": "sb/checkout", "title": "checkout: discount codes", "draft": False,
          "review": "CHANGES_REQUESTED", "rollup": "FAILURE",
          "checks": [{"name": "unit", "conclusion": "SUCCESS"},
                     {"name": "e2e", "conclusion": "FAILURE", "log": ["FAIL checkout/test_total.py::test_spring10 - assert 90.0 == 89.99"]}],
          "reviews": [{"state": "CHANGES_REQUESTED", "author": "lea-qa", "body": "round after the discount, not before"}]},
         # the hub follows PRs of plain worktree places only (core.rs pr_watches): a feature agent's
         # branch is never asked, so the draft is on receipts' worktree branch
         {"number": 415, "branch": "sb/receipts", "title": "receipts: email the receipt after checkout", "draft": True,
          "review": None, "rollup": "PENDING",
          "checks": [{"name": "unit", "conclusion": "SUCCESS"}, {"name": "e2e", "status": "IN_PROGRESS", "conclusion": None}],
          "reviews": []},
     ]},
    {"name": "docs",
     "files": {"README.md": "# docs\n\nthe user guide.\n", "guide/start.md": "# getting started\n\nInstal the app, then run it.\n"},
     "cards": [],
     "agents": [
         {"name": "typos", "place": "new", "objective": "fix the typos in the guide",
          "steps": [{"write": "guide/start.md", "text": "# getting started\n\nInstall the app, then run it.\n"},
                    {"commit": "guide: install, not instal"},
                    {"write": "notes.md", "text": "# style notes\n\n- one idea per sentence\n- say install, never setup\n"},
                    {"artifact": "notes.md", "title": "style notes"},
                    {"report": "done", "text": "one typo fixed in guide/start.md; style notes for the next pass."}]},
     ]},
]


def plan(n=3):
    """The projects of a world of n (2 or 3)."""
    if n not in (2, 3):
        raise ValueError("a world has 2 or 3 projects, not %r" % (n,))
    return PROJECTS[:n]


def marker(world, project, agent):
    return os.path.join(world, "seeded", "%s.%s" % (project, agent))


def ask_file(world, project, agent):
    return os.path.join(world, "asks", "%s.%s" % (project, agent))


def agent_script(world, project, agent):
    """The bash an agent runs in its own folder (worktree or the shared one): its steps, then the
    seeded marker (before a long `work`, so an agent at work counts as seeded)."""
    out = ["set -u", "cd \"$PWD\""]
    done = "mkdir -p %s && touch %s" % (shlex.quote(os.path.join(world, "seeded")), shlex.quote(marker(world, project, agent["name"])))
    marked = False
    for s in agent["steps"]:
        if "write" in s:
            d = os.path.dirname(s["write"])
            if d:
                out.append("mkdir -p %s" % shlex.quote(d))
            out.append("printf %%s %s > %s" % (shlex.quote(s["text"]), shlex.quote(s["write"])))
        elif "commit" in s:
            out.append("git add -A && git -c commit.gpgsign=false commit -q --no-verify -m %s" % shlex.quote(s["commit"]))
        elif "report" in s:
            out.append("sb report %s %s%s" % (s["report"], shlex.quote(s["text"]),
                                              " --step %s" % shlex.quote(s["step"]) if s.get("step") else ""))
        elif "land" in s:
            out.append("sb land %s" % shlex.quote(s["land"]))
        elif "ask" in s:
            # its question to main; main's script waits for the message id and escalates it
            f = ask_file(world, project, agent["name"])
            out.append("mkdir -p %s" % shlex.quote(os.path.dirname(f)))
            out.append("sb send main --expect-reply %s | sed -n 's/^sent \\(m_[0-9]*\\).*/\\1/p' > %s.tmp && mv %s.tmp %s"
                       % (shlex.quote(s["ask"]), shlex.quote(f), shlex.quote(f), shlex.quote(f)))
        elif "send" in s:
            out.append("sb send %s %s" % (shlex.quote(s["send"]), shlex.quote(s["text"])))
        elif "artifact" in s:
            out.append("sb artifact add %s --title %s" % (shlex.quote(s["artifact"]), shlex.quote(s["title"])))
        elif "work" in s:
            out.append(done)
            marked = True
            out.append("sleep %d" % int(s["work"]))
        else:
            raise ValueError("unknown step %r" % (s,))
    if not marked:
        out.append(done)
    out.append("echo seeded %s" % agent["name"])
    return "\n".join(out) + "\n"


def main_script(world, project):
    """The bash the project's fake main runs: its agents (each with its script as the brief's
    {{bash:}}), then its cards."""
    out = ["set -u"]
    if project.get("feature"):
        out.append("sb feature new %s" % shlex.quote(project["feature"]))
    for a in project["agents"]:
        script = os.path.join(world, "seed", project["name"], a["name"] + ".sh")
        brief = "%s {{bash: bash %s}}" % (a["objective"], script)
        where = " --feature %s" % shlex.quote(a["feature"]) if a.get("feature") else (" --place %s" % a["place"] if a.get("place") else "")
        out.append("sb spawn %s%s --objective %s" % (a["name"], where, shlex.quote(brief)))
    for c in project["cards"]:
        out.append("sb card %s" % shlex.quote(c))
    # an agent's question: wait (up to 300 s) for its message to main, then the card for it, or
    # main's own answer with its why (main_answers: the hub's 'answered' line)
    for a in project["agents"]:
        for st in a["steps"]:
            if "ask" in st:
                f = shlex.quote(ask_file(world, project["name"], a["name"]))
                out.append("for i in $(seq 600); do [ -s %s ] && break; sleep 0.5; done" % f)
                if st.get("main_answers"):
                    ans = st["main_answers"]
                    out.append("[ -s %s ] && sb send %s --reply-to \"$(cat %s)\" --why %s %s"
                               % (f, shlex.quote(a["name"]), f, shlex.quote(ans["why"]), shlex.quote(ans["text"])))
                else:
                    out.append("[ -s %s ] && sb card --for \"$(cat %s)\" %s" % (f, f, shlex.quote(st["ask"])))
    out.append("echo seeded main")
    return "\n".join(out) + "\n"


FEATURE_FILE = ("FEATURE.md", "# %s\n\nwhat this feature adds, for the review.\n")


def feature_script(world, ws, name):
    """The bash a project's fake main runs for `world feature`: the real dev-flow feature
    (sb feature new), one commit on its branch made in a throwaway worktree of the project's own
    checkout (removed after), then `sb feature ready`, which opens the user's feature_try card
    (an approval kind: Card.approval). Answering it 1 (try it) opens feature_merge, the second."""
    tmp = os.path.join(world, "feature", "%s-%s" % (os.path.basename(ws), name))
    rel, text = FEATURE_FILE
    q = shlex.quote
    return "\n".join([
        "set -eu",
        "sb feature new %s" % q(name),
        "rm -rf %s" % q(tmp),
        "git -C %s worktree add -q %s %s" % (q(ws), q(tmp), q(name)),
        "printf %%s %s > %s" % (q(text % name), q(os.path.join(tmp, rel))),
        "git -C %s add -A" % q(tmp),
        "git -C %s -c commit.gpgsign=false commit -q --no-verify -m %s" % (q(tmp), q("%s: what it adds" % name)),
        "git -C %s worktree remove --force %s" % (q(ws), q(tmp)),
        "sb feature ready %s" % q(name),
        "echo seeded feature %s" % q(name),
    ]) + "\n"


def checker_off(home):
    """The world's bise home has the approvals checker off ([roles] classify = "off"): a gated call
    in auto mode is a card, never a model call (the hubs run yolo anyway, but for approval_seed)."""
    cfg = os.path.join(home, ".bise", "config.toml")
    text = open(cfg).read() if os.path.exists(cfg) else ""
    if "classify" not in text:
        with open(cfg, "a") as f:
            f.write(("\n" if text and not text.endswith("\n") else "") + "[roles]\nclassify = \"off\"\n")


def approval_command(home, spec):
    """The seeded agent's call the gate asks about: a forced push (tier 0, a card in auto whatever
    the sandbox; a write outside the workspace was let through to the sandbox, no card), to a
    remote that is a missing path in the world's home: it could never reach the network. Pure."""
    return "git push --force %s HEAD:main" % shlex.quote(os.path.join(home, spec["remote"]))


def approval_seed(c, home, spec, timeout):
    """qa-flows m_11510 (a): his answer to a tool approval with a note, in auto mode. The hub goes
    auto for this session (BISE_APPROVALS is set, so config.toml keeps yolo), an agent's call that
    writes outside its workspace raises the gate's card, the world answers '/answer N no: <note>' as
    him (the hold client is the hub's starter), the call never runs, the hub goes back to yolo."""
    def mode():
        evs = [e for e in list(c.events) if e.get("ev") == "approvals"]
        return evs[-1].get("mode") if evs else None
    c.send({"op": "approvals", "mode": "auto"})
    c.wait(lambda: mode() == "auto", timeout, "the hub in auto")
    try:
        c.say("/new %s: %s {{bash: %s}}" % (spec["agent"], spec["objective"], approval_command(home, spec)))
        card = c.wait(lambda: next((cd for cd in c.cards() if cd.get("kind") == "confirm" and cd.get("agent") == spec["agent"]), None),
                      timeout, "the approval card for %s" % spec["agent"])
        c.say("/answer %d no: %s" % (card["id"], spec["note"]))
        c.wait(lambda: not any(cd.get("id") == card["id"] for cd in c.cards()), timeout, "the approval card closed")
        c.wait_line("main", "sb approval : no : %s" % spec["agent"], timeout)
    finally:
        c.send({"op": "approvals", "mode": "yolo"})
        c.wait(lambda: mode() == "yolo", timeout, "the hub back in yolo")


def write_seeds(world, projects):
    """The scripts on disk; returns the markers to wait for."""
    want = []
    for p in projects:
        d = os.path.join(world, "seed", p["name"])
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "main.sh"), "w") as f:
            f.write(main_script(world, p))
        for a in p["agents"]:
            with open(os.path.join(d, a["name"] + ".sh"), "w") as f:
                f.write(agent_script(world, p["name"], a))
            want.append(marker(world, p["name"], a["name"]))
    return want


def make_repo(ws, files, origin=None):
    """A project's git repo on main, its files committed; `origin` its remote (never fetched or pushed:
    only the world's fake gh reads it)."""
    os.makedirs(ws, exist_ok=True)
    for rel, text in files.items():
        p = os.path.join(ws, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "w") as f:
            f.write(text)
    env = dict(os.environ, GIT_AUTHOR_NAME="qa", GIT_AUTHOR_EMAIL="qa@world.test", GIT_COMMITTER_NAME="qa", GIT_COMMITTER_EMAIL="qa@world.test")
    for cmd in (["git", "init", "-q", "-b", "main"], ["git", "config", "user.email", "qa@world.test"], ["git", "config", "user.name", "qa"],
                ["git", "config", "commit.gpgsign", "false"], ["git", "add", "-A"], ["git", "commit", "-q", "--no-verify", "-m", "init"]):
        r = subprocess.run(cmd, cwd=ws, capture_output=True, text=True, env=env)
        if r.returncode != 0:
            raise RuntimeError("make_repo %s: %s: %s" % (ws, " ".join(cmd), (r.stderr or r.stdout).strip()))
    if origin:
        subprocess.run(["git", "remote", "add", "origin", origin], cwd=ws, check=True, capture_output=True)
        subprocess.run(["git", "config", "remote.origin.pushurl", "DISABLED-in-world"], cwd=ws, check=True, capture_output=True)


def fake_gh(world, projects):
    """<world>/bin/gh: the world's gh (fake_gh.py) over the PRs of every project with an origin, put
    first on the world hubs' PATH. Returns the bin folder."""
    bindir = os.path.join(world, "bin")
    os.makedirs(bindir, exist_ok=True)
    for p in projects:
        if p.get("origin"):
            ref = p["origin"].rstrip("/").removesuffix(".git").split("/")
            with open(os.path.join(world, "prs-%s.json" % p["name"]), "w") as f:
                json.dump({"owner": ref[-2], "name": ref[-1], "prs": p.get("prs", [])}, f, indent=1)
    gh = os.path.join(bindir, "gh")
    with open(gh, "w") as f:
        # one gh for every hub: the PR data of the repo the hub asks about (its owner/name in the query)
        f.write("#!/bin/sh\n# the world's fake gh (plugins/ambient-qa/fake_gh.py): never his gh, his login or the network\n"
                "exec %s %s %s \"$@\"\n" % (shlex.quote(sys.executable), shlex.quote(os.path.join(HERE, "fake_gh.py")),
                                              shlex.quote(world)))
    os.chmod(gh, 0o755)
    return bindir


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

def daemon(bise, root, n):
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
    projects = plan(n)
    stop = {"now": False}
    signal.signal(signal.SIGTERM, lambda *_: stop.update(now=True))
    signal.signal(signal.SIGINT, lambda *_: stop.update(now=True))
    hubs, envs, holds = [], [], []
    bindir = fake_gh(world, projects)
    try:
        for name, files in [(HOME_NAME, None)] + [(p["name"], p["files"]) for p in projects]:
            ws = home_ws if files is None else os.path.join(home, "code", name)
            if files is not None:
                make_repo(ws, files, next((p.get("origin") for p in projects if p["name"] == name), None))
            E = e2e.Env()
            E.env = world_env(E.env)      # never his keys (main m_10585)
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
        want = write_seeds(world, projects)
        for p in projects:
            c = holds[[h["project"] for h in hubs].index(p["name"])]
            c.say("[[bash: bash %s]]" % os.path.join(world, "seed", p["name"], "main.sh"))
        t0 = time.time()
        while [m for m in want if not os.path.exists(m)]:
            if stop["now"] or time.time() - t0 > 300 * load_factor():
                raise RuntimeError("not seeded in time: %s" % [os.path.basename(m) for m in want if not os.path.exists(m)])
            time.sleep(0.3)
        for p in projects:
            if p.get("approval"):
                c = holds[[h["project"] for h in hubs].index(p["name"])]
                approval_seed(c, home, p["approval"], 120 * load_factor())
        info = {"pid": os.getpid(), "world": world, "home": home, "bise": bise, "root": root, "projects": n,
                "hubs": hubs, "registry": register(bise, home, [h["ws"] for h in hubs if not h["home"]]),
                "up_ms": int(time.time() * 1000)}
        with open(P["json"] + ".tmp", "w") as f:
            json.dump(info, f, indent=1)
        os.replace(P["json"] + ".tmp", P["json"])
        while not stop["now"]:
            for h, E in zip(hubs, envs):
                if E.fake.poll() is not None:
                    h["fake_pid"] = revive_fake(E, h["project"])
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
            "BISE_HOME_WORKSPACE", "SB_ONBOARDING", "BISE_APPROVALS", "SB_STATE_DIR", "FAKE_LOG", "PYTHONUNBUFFERED"}
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

def under_heavy_lock(pid=None):
    """True when this process (or the given one) runs under a `lockf ... heavy.lock` of its own
    ancestry: taking the lock again would wait on itself."""
    pid = pid or os.getpid()
    for _ in range(32):
        r = subprocess.run(["ps", "-o", "ppid=,command=", "-p", str(pid)], capture_output=True, text=True)
        line = r.stdout.strip()
        if not line:
            return False
        ppid, _, cmd = line.partition(" ")
        if "lockf" in cmd.split(" ", 1)[0] and LOCK in cmd:
            return True
        pid = int(ppid.strip() or 0)
        if pid <= 1:
            return False
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


def up(n=3, bise=None, root=None):
    """Clear the old world, start the daemon, wait until seeded. The heavy lock only around a
    helpers compile that runs (ensure_helpers_locked); an up with built helpers never waits on it."""
    import qa
    world = world_dir()
    P = _paths(world)
    guard(world)
    old = _read(P["json"])
    if old and _alive(old.get("pid")):
        raise qa.QAError("a world is up (pid %s): `qa.py world down` first" % old["pid"])
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
    p = subprocess.Popen([sys.executable, "-u", "-B", os.path.join(HERE, "qa.py"), "_world", "--bise", bise, "--root", root, "--projects", str(n)],
                         stdin=subprocess.DEVNULL, stdout=log, stderr=log, start_new_session=True, cwd=qa.REPO, env=env)
    t0 = time.time()
    while time.time() - t0 < 900:
        info = _read(P["json"])
        if info and info.get("pid") == p.pid:
            return dict(state(), log=P["log"])
        if p.poll() is not None:
            raise qa.QAError("the world's daemon exited (%s): %s" % (p.returncode, open(P["log"], errors="replace").read()[-2500:]))
        time.sleep(0.3)
    p.terminate()
    raise qa.QAError("the world didn't come up in 900 s: see %s" % P["log"])


def down():
    """SIGTERM the daemon (it stops each hub), then make sure every recorded pid is gone."""
    P = _paths(world_dir())
    info = _read(P["json"])
    if not info:
        return {"down": "no world up"}
    pids = [info["pid"]] + [h[k] for h in info["hubs"] for k in ("hub_pid", "fake_pid")]
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
            "registry": info.get("registry"), "hubs": out}


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
