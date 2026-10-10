"""dev/plugins/ambient-qa: the throwaway world's fixtures (qa.py world up and world up --rich), offline.

Split out of tests/ambient_qa_test.py with world.py's split (file cap): the
same two tests, moved as they were.

Run: python3 -u tests/ambient_qa_world_test.py
"""
import json
import os
import re
import shlex
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
PLUGIN = os.path.join(HERE, "..", "dev", "plugins", "ambient-qa")
sys.path.insert(0, PLUGIN)
import qa  # noqa: E402

failures = []


def test(f):
    try:
        f()
        print("ok   " + f.__doc__)
    except Exception as e:  # noqa: BLE001
        failures.append(f.__name__)
        print("FAIL " + f.__doc__ + ": %r" % e)
    return f


def check(c, msg):
    if not c:
        raise AssertionError(msg)


@test
def world_fixtures_seed_every_desktop_shape():
    """qa.py world: 2 or 3 projects; together they hold a committed diff ready to merge, an agent at work in a dirty
    worktree, a blocked agent, a merge question and a question with options, an artifact; every seed script is valid
    bash with absolute paths, each agent marks itself seeded (before a long work); a world outside ~/.bise/gate or a
    value reaching his hubs is refused"""
    import world
    check([p["name"] for p in world.plan(2)] == ["telemetry", "shop"], "2 projects")
    for bad in (1, 4):
        try:
            world.plan(bad)
            check(False, "plan(%d) refused" % bad)
        except ValueError:
            pass
    steps = [s for p in world.plan(3) for a in p["agents"] for s in a["steps"]]
    kinds = {k for s in steps for k in s}
    check({"write", "commit", "report", "artifact", "work"} <= kinds, "every step kind used: %s" % kinds)
    check({s["report"] for s in steps if "report" in s} >= {"done", "blocked", "progress"}, "done, blocked and progress reports")
    check(any(a["place"] == "new" for p in world.plan(3) for a in p["agents"]) and any(not a["place"] for p in world.plan(3) for a in p["agents"]),
          "worktree agents and a shared-folder one")
    # qa-flows m_10155: a feature with 2 agents (worktrees from its tip, landing on it) and an agent's own question
    shop = world.plan(2)[1]
    feat = [a for a in shop["agents"] if a.get("feature") == shop.get("feature")]
    check(shop.get("feature") and len(feat) == 2 and all(any("land" in st for st in a["steps"]) for a in feat), "a feature with 2 agents that land on it")
    ms = world.main_script(os.path.join(world.GATE, "w-test"), shop)
    check(ms.index("sb feature new gift-cards") < ms.index("sb spawn gift-api --feature gift-cards"), "the feature exists before its agents")
    check(any("ask" in st for a in feat for st in a["steps"]), "an agent asks its own question")
    # ambient-lead m_10397: the shop's GitHub is the world's fake gh, first on the hubs' PATH
    check(shop.get("origin", "").startswith("https://github.com/") and {p["number"] for p in shop["prs"]} == {412, 415}, "shop has an origin and PRs #412, #415")
    gw = tempfile.mkdtemp()
    bindir = world.fake_gh(gw, world.plan(2))
    gh = lambda *a: subprocess.run([os.path.join(bindir, "gh")] + list(a), capture_output=True, text=True)  # noqa: E731
    check(gh("auth", "status", "--hostname", "github.com").returncode == 0, "fake gh: logged in")
    r = gh("api", "graphql", "-f", 'query=query { repository(owner: "acme-qa", name: "shop") { b0: pullRequests(headRefName: "sb/checkout", first: 3) { nodes { x } } '
           'b1: pullRequests(headRefName: "sb/receipts", first: 3) { nodes { x } } b2: pullRequests(headRefName: "sb/search", first: 3) { nodes { x } } } }')
    rep = json.loads(r.stdout)["data"]["repository"]
    n412, n415 = rep["b0"]["nodes"][0], rep["b1"]["nodes"][0]
    check(n412["number"] == 412 and n412["reviewDecision"] == "CHANGES_REQUESTED" and not n412["isDraft"]
          and n412["commits"]["nodes"][0]["commit"]["statusCheckRollup"]["state"] == "FAILURE", "#412: changes requested, checks fail")
    check(n415["number"] == 415 and n415["isDraft"] and n415["commits"]["nodes"][0]["commit"]["statusCheckRollup"]["state"] == "PENDING"
          and rep["b2"]["nodes"] == [], "#415 draft, checks running; no PR on sb/search")
    check("e2e" in gh("run", "view", "7412", "--log-failed", "-R", "github.com/acme-qa/shop").stdout, "the failed e2e's log")
    check(gh("pr", "merge", "412").returncode != 0, "fake gh never merges")
    other = json.loads(gh("api", "graphql", "-f", 'query=query { repository(owner: "someone", name: "else") { b0: pullRequests(headRefName: "sb/checkout", first: 3) { nodes { x } } } }').stdout)
    check(other["data"]["repository"]["b0"]["nodes"] == [], "a repo it doesn't know has no PRs")
    check(len(open(os.path.join(gw, "gh.log")).read().splitlines()) == 5, "every call logged")
    shutil.rmtree(gw, ignore_errors=True)
    # main m_10585: a world process never holds his keys: the env is an allowlist, and the law refuses a leak
    his = {"PATH": "/usr/bin", "HOME": "/x/h", "OPENAI_API_KEY": "sk-real", "MISTRAL_API_KEY": "real-m", "ANTHROPIC_FOUNDRY_API_KEY": "a",
           "OPENROUTER_API_KEY": "o", "GH_TOKEN": "g", "GITHUB_TOKEN": "g", "AWS_SECRET_ACCESS_KEY": "s", "AZURE_OPENAI_KEY": "z",
           "SLACK_BOT_TOKEN": "x", "SOME_PASSWORD": "p", "BEND_PROVIDER_URL": "http://127.0.0.1:1/v1/chat/completions",
           "BEND_MODEL": "mistral-small-latest", "SSH_AUTH_SOCK": "/tmp/agent", "EDITOR": "vim", "BISE_HOME": "/Users/x/.bise"}
    we = world.world_env(his)
    check(we["MISTRAL_API_KEY"] == "fake-key" and world.leaked(we) == [], "world_env: no key of his, the fake one only: %s" % sorted(we))
    check(set(we) == {"PATH", "HOME", "MISTRAL_API_KEY", "BEND_PROVIDER_URL", "BEND_MODEL"}, "world_env: the allowlist only: %s" % sorted(we))
    check(set(world.leaked(his)) >= {"OPENAI_API_KEY", "MISTRAL_API_KEY", "GH_TOKEN", "AWS_SECRET_ACCESS_KEY", "SOME_PASSWORD"},
          "leaked names every real key (MISTRAL_API_KEY too when it isn't the fake one)")
    check(world.leaked({"MISTRAL_API_KEY": "fake-key", "PATH": "/bin"}) == [], "the fake key isn't a leak")
    cards = [c for p in world.plan(3) for c in p["cards"]]
    check(any("merge" in c and "\n1. " in c for c in cards) and len(cards) >= 2, "a merge question and a question with options")
    w = os.path.join(world.GATE, "w-test")
    for p in world.plan(3):
        m = world.main_script(w, p)
        asks = [st for a in p["agents"] for st in a["steps"] if "ask" in st and not st.get("main_answers")]
        answered = [(a["name"], st["main_answers"]) for a in p["agents"] for st in a["steps"] if st.get("main_answers")]
        check(m.count("sb spawn ") == len(p["agents"]) and m.count("sb card ") == len(p["cards"]) + len(asks), "main's script: %s" % p["name"])
        check(m.count("sb card --for ") == len(asks), "an agent's question is main's card for that agent's message: %s" % p["name"])
        for who, ans in answered:
            # qa-flows m_11510 (b): main answers for him, a reply to the agent's message with its why
            check("sb send %s --reply-to \"$(cat " % who in m and "--why %s" % shlex.quote(ans["why"]) in m,
                  "main answers %s's question itself, with why: %s" % (who, p["name"]))
    plan3 = world.plan(3)
    check(any(st.get("main_answers") for st in plan3[0]["agents"][1]["steps"]) and world.plan(2)[0] is not None,
          "telemetry (in every world) has the question main answers")
    sends = [(a["name"], st["send"]) for p in plan3 for a in p["agents"] for st in a["steps"] if "send" in st]
    check(("receipts", "checkout") in sends and "sb send checkout " in world.agent_script(w, "shop", plan3[1]["agents"][2]),
          "a message between two other agents (receipts -> checkout, m_11510 (c)): %s" % sends)
    ap = plan3[1].get("approval")
    check(ap and ap["note"] and world.approval_command("/w/h", ap) == "git push --force /w/h/nowhere.git HEAD:main",
          "the approval seed is a forced push to a missing path in the world's home, never the network (m_11510 (a)): %s" % ap)
    ch = tempfile.mkdtemp(prefix="aqa-cfg-")
    try:
        os.makedirs(os.path.join(ch, ".bise"))
        world.checker_off(ch)
        world.checker_off(ch)
        cfg = open(os.path.join(ch, ".bise", "config.toml")).read()
        check(cfg.count('classify = "off"') == 1 and "[roles]" in cfg, "the world's checker is off, written once: %r" % cfg)
    finally:
        shutil.rmtree(ch, ignore_errors=True)
        check("{{bash: bash %s/seed/%s/" % (w, p["name"]) in m, "the brief carries the agent's script by absolute path")
        scripts = [m] + [world.agent_script(w, p["name"], a) for a in p["agents"]]
        for s in scripts:
            r = subprocess.run(["bash", "-n"], input=s, capture_output=True, text=True)
            check(r.returncode == 0, "bash -n: %s" % r.stderr)
        for a in p["agents"]:
            s = world.agent_script(w, p["name"], a)
            mk = world.marker(w, p["name"], a["name"])
            check(mk in s, "%s marks itself seeded" % a["name"])
            if any("work" in st for st in a["steps"]):
                check(s.index(mk) < s.index("sleep "), "marked before its long work")
    fs = world.feature_script(w, os.path.join(w, "h", "code", "shop"), "try me")
    r = subprocess.run(["bash", "-n"], input=fs, capture_output=True, text=True)
    check(r.returncode == 0, "feature script, bash -n: %s" % r.stderr)
    order = [fs.index(x) for x in ("sb feature new 'try me'", "worktree add", "commit -q", "worktree remove", "sb feature ready 'try me'")]
    check(order == sorted(order), "feature: new, a commit in a throwaway worktree, removed, then ready: %s" % fs)
    check(os.path.join(w, "feature", "shop-try me") in fs and "~" not in fs, "the feature's worktree is in the world, by absolute path")
    try:
        world.guard("/tmp/w")
        check(False, "a world outside ~/.bise/gate")
    except qa.QAError:
        pass
    try:
        world.guard(w, [os.path.expanduser("~/.bise/hubs/harness-1/hub.sock")])
        check(False, "his hub's socket")
    except qa.QAError:
        pass
    world.guard(w, [os.path.join(w, "h")])


@test
def rich_world_fixtures():
    """qa.py world up --rich: 3 projects with every agent status, 110 different messages to telemetry's main (tables, code,
    lists), each answered in markdown, one 40+ line answer at least (R18), 30 tool turns (failing bash, edits), filler agents
    up to --agents, his fn context as the input op's context, a try-real dir on the fake provider; no marker in his words
    or the briefs (D5)"""
    import world
    # up's limit (ambient-lead m_15705): 900 s x the load factor (1 to 4), or $AMBIENT_QA_WORLD_TIMEOUT when positive
    check(world.world_timeout({}, 1.0) == 900 and world.world_timeout({}, 2.5) == 2250 and world.world_timeout({}, 0.3) == 900, "load-scaled")
    check(world.world_timeout({"AMBIENT_QA_WORLD_TIMEOUT": "3000"}, 4.0) == 3000, "the override wins")
    check(world.world_timeout({"AMBIENT_QA_WORLD_TIMEOUT": "x"}, 2.0) == 1800 and world.world_timeout({"AMBIENT_QA_WORLD_TIMEOUT": "0"}, 1.0) == 900,
          "a bad or zero override falls back")
    # the bar's seeds (ambient-lead m_16108): an 'other' step with a paced thinking row, a > 4 KB output of known size
    other, long_out = world.bar_turns()
    check([t for t, _ in other["calls"]].count("skill") == 1 and other["think"] and other["stream"]["every"] > 0, other)
    out = subprocess.run(["bash", "-c", long_out["calls"][0][1].split(" @@ ")[0]], capture_output=True).stdout
    check(len(out) == world.LONG_OUT_BYTES > 4096 * 4 and out.startswith(b"batch 0001  ingest ok"), (len(out), out[:40]))
    check(not any(world.P99_ASK.split("\n")[0] in t for t in [other["text"], long_out["text"]] + list(world.SEED_WORDS.values())),
          "p99's question is matched by main's script only")
    # a bise from another branch's tree (client-protocol, 1286 behind) is never picked (ambient-lead m_16321)
    check(qa.other_branch("/x/bise", "/x", n=1286) and "1286" in qa.other_branch("/x/bise", "/x", n=1286), "another branch refused")
    check(qa.other_branch("/x/bise", "/x", n=10 ** 6) and "all" in qa.other_branch("/x/bise", "/x", n=10 ** 6), "unknown tree refused")
    check(qa.other_branch("/x/bise", "/x", n=0) is None and qa.other_branch("/x/bise", "/x", n=qa.OTHER_BRANCH) is None,
          "ambient-app's tree, or one a little behind, is fine")
    # a world up under heavy-run takes no slot again (qa-flows 82b584d6, ambient-lead m_16227): either slot's
    # lockf, or the heavy-run script, in its ancestry
    run_ = os.path.dirname(world.LOCK)
    check(world.holds_a_slot("/usr/bin/lockf -k -t 0 %s/heavy.lock nice -n 10 bash real.sh" % run_), "slot 1")
    check(world.holds_a_slot("/usr/bin/lockf -k -t 0 %s/heavy2.lock nice -n 10 bash real.sh" % run_), "slot 2")
    check(world.holds_a_slot("/bin/bash %s/heavy-run bash tests/checks/real.sh" % run_), "heavy-run itself")
    check(not world.holds_a_slot("/usr/bin/lockf -k /tmp/other.lock make") and not world.holds_a_slot("bash real.sh heavy.lock")
          and not world.holds_a_slot(""), "other locks and words")
    tree = {50: (40, "python3 qa.py world up"), 40: (30, "node playwright test"), 30: (20, "bash tests/checks/real.sh"),
            20: (10, "nice -n 10 bash tests/checks/real.sh"), 10: (5, "/usr/bin/lockf -k -t 0 %s/heavy2.lock nice -n 10 bash real.sh" % run_),
            5: (1, "/bin/bash %s/heavy-run bash real.sh" % run_)}
    check(world.under_heavy_lock(50, ps=tree.get), "under slot 2, five levels up")
    del tree[10], tree[5]
    tree[20] = (1, "nice -n 10 bash tests/checks/real.sh")
    check(not world.under_heavy_lock(50, ps=tree.get), "no slot in the ancestry")
    # the client-protocol's agent rows (ambient-lead m_16823): queued is a list, msgs_queued its count
    check(world.queued_count({"queued": [{"id": 215, "text": "x"}], "msgs_queued": 1}) == 1 and world.queued_count({"queued": 2}) == 2
          and world.queued_count({"queued": []}) == 0 and world.queued_count(None) == 0, "queued counts")
    # his right-aligned messages (ambient-lead m_16198): queued, steered, quoting an earlier answer
    q = world.quoted_message()
    check(q == '<selection from="main">\n%s\n</selection>\n%s' % (world.QUOTED, world.QUOTE_WORDS), q)
    check(world.long_answer("the api").split("\n")[0] == world.QUOTED, "the quote is the first line of an earlier answer")
    mine = [world.QUEUED_TEXT, world.STEER_TURN["text"], world.STEER_TEXT, world.QUOTE_WORDS]
    check(len(set(mine)) == 4 and not any("<" in t or "[[" in t or "{{" in t for t in mine), "plain, different")
    others = ([m["text"] for m in world.rich_messages()] + [m["text"] for m in world.dash_messages()] + list(world.SEED_WORDS.values())
              + [other["text"], long_out["text"], world.P99_ASK])
    check(not any(t in o or o in t for t in mine for o in others), "each of his phrases picks its own script only")
    check(not any(a in b for a in mine for b in mine if a != b), "no phrase inside another")
    panels = "".join("# %s\n" % ("%s · %s" % (m, r)) for r in world.REGIONS for m in world.METRICS)
    for m in world.dash_messages():
        for t, a in m["calls"]:
            if t == "edit":
                panels = panels.replace(a["old_string"], a["new_string"], 1)
    check("# p99 latency · eu-west (last 24 h, by host)\n" in panels, "the steer's edit finds its line in panels.md")
    check(world.STEER_TURN["calls"][0][1].startswith("sleep ") and world.STEER_REPLY.split(",")[0] == world.STEER_TURN["reply"].rstrip("."),
          "a slow first step, and the reply's first clause is waited on")
    ps = world.plan(3, rich=True)
    names = {p["name"]: [a["name"] for a in p["agents"]] for p in ps}
    check({"dashboards", "ingest"} <= set(names["telemetry"]) and "perf" in names["shop"] and "changelog" in names["docs"], names)
    check(world.plan(3) == world.PROJECTS[:3], "the plain world is unchanged")
    d = tempfile.mkdtemp(prefix="aq-rich-")
    marker = re.compile(r"\[\[|\{\{|\(#|ack:")
    msgs = world.rich_messages()
    check(len(msgs) == 110 and len({m["text"] for m in msgs}) == 110 and len({m["match"] for m in msgs}) == 110, "110 different")
    check(all(m["needle"] not in m["text"] and m["match"] in m["text"] and not marker.search(m["text"]) for m in msgs), "plain words")
    for m in msgs:   # a match must pick its own message only (the fake provider takes the longest that matches)
        check([o["match"] for o in msgs if o["match"] in m["text"]] == [m["match"]], m["match"])
    replies = "".join(m["reply"] for m in msgs)
    check("|---|" in replies and "```python" in replies and "- [ ]" in replies and "## " in replies, "markdown kinds")
    check(max(m["reply"].count("\n") + 1 for m in msgs) >= 40, "a 40-line answer (R18)")
    dash = world.dash_messages()
    check(len(dash) == 30 and len({m["text"] for m in dash}) == 30 and all(m["needle"] not in m["text"] and not marker.search(m["text"]) for m in dash), "dash")
    calls = [c for m in dash for c in m["calls"]]
    check(sum("sys.exit(1)" in a for t, a in calls if t == "bash") == 10 and sum(t == "edit" for t, _ in calls) == 30, "fails and edits")
    check(all(a["file_path"] == "panels.md" for t, a in calls if t == "edit"), "edits on panels.md")
    briefs = [a["objective"] for p in ps for a in p["agents"]]
    check(len(set(briefs)) == len(briefs) and not any(marker.search(b) for b in briefs), "plain, different briefs")
    check(not any(o != b and b in o for b in briefs for o in briefs + [m["text"] for m in msgs] + list(world.SEED_WORDS.values())),
          "a brief's phrase is in no other message")
    main = world.main_script(d, ps[0], rich=True)
    check("{{" not in main and "[[" not in main and "sb spawn dashboards" in main, main)
    check("{{bash: bash" in world.main_script(d, world.PROJECTS[0]), "the plain world keeps its markers")
    have = len(names["telemetry"])
    check(len(world.crowd(30, have)) == 30 - have and world.crowd(3, have) == [], "filler agents")
    try:
        world.crowd(200, have)
        check(False, "more filler than names")
    except ValueError:
        pass
    s = world.screen_input()
    check(s["op"] == "input" and s["text"] == world.SCREEN_TEXT and "<" not in s["text"]
          and set(s["context"]) <= {"app", "title", "url", "file", "selection", "window_text"} and s["context"]["app"] == "Figma", s)
    sd = os.path.join(d, "scripts")
    world.put_script(sd, "x", "a phrase", [("bash", "true"), ("edit", {"file_path": "f"})], "the answer", slow=3)
    sc = json.load(open(os.path.join(sd, "x.json")))
    check(sc == {"match": "a phrase", "calls": [{"tool": "bash", "arg": "true"}, {"tool": "edit", "arg": {"file_path": "f"}}],
                 "reply": "the answer", "slow": 3} and os.listdir(sd) == ["x.json"], sc)
    # the fake provider runs the script for a message holding the phrase, then answers verbatim; FAKE_PLAIN: no echo
    sys.path.insert(0, os.path.join(qa.REPO, "tests"))
    import fake_provider as fp
    old = {k: os.environ.get(k) for k in ("FAKE_SCRIPTS", "FAKE_PLAIN")}
    os.environ.update(FAKE_SCRIPTS=sd, FAKE_PLAIN="1")
    try:
        sysm = {"role": "system", "text": "# Your role: `main`", "calls": 0, "images": []}
        user = {"role": "user", "text": '<user_message id="m_3">please, a phrase here</user_message>', "calls": 0, "images": []}
        t1 = fp.reply_for([sysm, user])
        check([c["name"] for c in t1["calls"]] == ["bash"] and t1["calls"][0]["args"]["arg"] == "true", t1)
        done1 = [{"role": "assistant", "text": "", "calls": 1, "images": []}, {"role": "tool", "text": "tool bash ok:", "calls": 0, "images": []}]
        t2 = fp.reply_for([sysm, user] + done1)
        check(t2["calls"][0]["name"] == "edit" and t2["calls"][0]["args"] == {"file_path": "f"}, t2)
        t3 = fp.reply_for([sysm, user] + done1 + done1)
        check(t3["text"] == "the answer" and not t3["calls"], t3)
        other = {"role": "user", "text": '<user_message id="m_4">something else</user_message>', "calls": 0, "images": []}
        t4 = fp.reply_for([sysm, other])
        check(t4["text"] in fp.PLAIN_USER and "ack" not in t4["text"], t4)
        t5 = fp.reply_for([sysm, other, {"role": "assistant", "text": "", "calls": 1, "images": []},
                           {"role": "tool", "text": "tool bash failed: exit 1", "calls": 0, "images": []}])
        check(t5["text"] in fp.PLAIN_FAIL, t5)
        role = [{"role": "system", "text": "# bise role line\nyou write…", "calls": 0, "images": []},
                {"role": "user", "text": "What it was asked: The cart page is slow on mobile: measure first\nIts last report: x", "calls": 0, "images": []}]
        check(fp.reply_for(role)["text"] == "the cart page is slow on mobile", fp.reply_for(role))
        # "stream": the scripted answer in N text deltas, every family (qa-native m_12784, designer R40)
        world.put_script(sd, "s", "streamed please", [], "one two three four five six seven eight nine ten eleven twelve")
        sp = json.load(open(os.path.join(sd, "s.json")))
        sp["stream"] = {"chunks": 12, "every": 0.25}
        json.dump(sp, open(os.path.join(sd, "s.json"), "w"))
        os.utime(sd)
        st = fp.reply_for([sysm, {"role": "user", "text": "streamed please", "calls": 0, "images": []}])
        check(st["stream"] == {"chunks": 12, "every": 0.25}, st)
        for fam in ("anthropic", "openai-chat", "openai-responses", "gemini"):
            evs = fp.render(fam, st, "fake", True, {})
            n = sum(fp.is_text_delta(fam, *e) for e in evs)
            check(n == 12, (fam, n))
        # "think": reasoning on the script's first step only, in N paced deltas under "stream" (the thinking row)
        sp.update(think="the three empty panels are all in us-east", calls=[{"tool": "skill", "arg": "bise-pages"}])
        json.dump(sp, open(os.path.join(sd, "s.json"), "w"))
        os.utime(sd)
        ask = {"role": "user", "text": "streamed please", "calls": 0, "images": []}
        t1 = fp.reply_for([sysm, ask])
        check(t1["reasoning"] == sp["think"] and t1["calls"][0]["name"] == "skill" and t1["calls"][0]["args"] == {"name": "bise-pages"}, t1)
        t2 = fp.reply_for([sysm, ask, {"role": "assistant", "text": "", "calls": 1, "images": []},
                           {"role": "tool", "text": "the guide", "calls": 0, "images": []}])
        check(t2["reasoning"] == "" and t2["text"].startswith("one two"), t2)
        for fam in ("anthropic", "openai-chat", "openai-responses", "gemini"):
            evs = fp.render(fam, t1, "fake", True, {})
            n = sum(fp.is_think_delta(fam, *e) for e in evs)
            check(n == 12 and not any(fp.is_think_delta(fam, *e) and fp.is_text_delta(fam, *e) for e in evs), (fam, "think", n))
    finally:
        for k, v in old.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v
    real = world.try_real(os.path.join(d, "try-real"), [{"ws": "/w/telemetry", "project": "telemetry"}, {"ws": "/w/shop", "project": "shop"}],
                          "http://127.0.0.1:4242/v1/chat/completions")
    pj = json.load(open(os.path.join(real, "projects.json")))
    cfg = open(os.path.join(real, "config.toml")).read()
    check([p["name"] for p in pj["projects"]] == ["telemetry", "shop"] and 'base_url = "http://127.0.0.1:4242/v1"' in cfg
          and 'key_env = "BISE_TRY_FAKE_KEY"' in cfg and 'key_command = "echo fake-key"' in cfg and cfg.count("[roles]") == 1, cfg)
    # the world's own home gets the same account (the gate's window runs there, qa-native m_12883), once, no role
    h = os.path.join(d, "h")
    os.makedirs(os.path.join(h, ".bise"))
    world.checker_off(h)
    for _ in range(2):
        world.home_account(h, "http://127.0.0.1:4343/v1/chat/completions")
    hc = open(os.path.join(h, ".bise", "config.toml")).read()
    check(hc.count("[providers.fake]") == 1 and 'base_url = "http://127.0.0.1:4343/v1"' in hc and 'key_command = "echo fake-key"' in hc
          and "main =" not in hc and 'classify = "off"' in hc, hc)
    shutil.rmtree(d, ignore_errors=True)


if __name__ == "__main__":
    print("%d failed" % len(failures) if failures else "all ambient-qa world tests pass")
    sys.exit(1 if failures else 0)
