"""plugins/ambient-qa: the QA plugin of bise ambient.app.

Offline (default, no app, no hub): the manifest, the MCP server's
handshake and tools, the scenes built from apps/ambient/web/fakecore.js
(every SPEC §2 state covered), the shot times, and the socket client
against a fake QA socket (ids, errors).

--live: the real app in QA mode on a throwaway hub (never the mic, the
speaker, the user's screen or real main): launch, a scene with its
contact sheet, the voice loop (hold fn -> words -> send -> main answers ->
spoken), a fn + key, then stop. It starts the app: run it by hand, never
from the gate (docs/ambient-app.md §7).

Run: python3 -u tests/ambient_qa_test.py [--live]
"""
import datetime
import json
import os
import socket
import subprocess
import sys
import tempfile
import threading
import time

HERE = os.path.dirname(os.path.abspath(__file__))
PLUGIN = os.path.join(HERE, "..", "plugins", "ambient-qa")
sys.path.insert(0, PLUGIN)
import qa  # noqa: E402
sys.path.insert(0, os.path.join(PLUGIN, "fake-accounts"))
import fake_accounts as fake  # noqa: E402


def iso_now():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

SPEC_STATES = {"idle", "hold fn", "let go", "main speaks", "end of turn", "needs you", "answered", "done", "failed"}
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
def manifest():
    """the manifest and mcp.json follow the 1.0.0 schemas; opt-in"""
    m = json.load(open(os.path.join(PLUGIN, "plugin.json")))
    check(m["$schema"].endswith("/1.0.0/plugin.schema.json") and m["name"] == "ambient-qa", m)
    check(m["extensions"]["dev.bise"]["default"] == "off", "opt-in")
    mc = json.load(open(os.path.join(PLUGIN, "mcp.json")))
    s = mc["mcpServers"]["ambient_qa"]
    check(s["command"] == "python3" and "${PLUGIN_ROOT}/server.py" in s["args"], s)
    sk = open(os.path.join(PLUGIN, "skills", "ambient-qa", "SKILL.md")).read()
    check(sk.startswith("---\nname: ambient-qa\ndescription: "), "skill frontmatter")


def mcp(*msgs):
    p = subprocess.run([sys.executable, "-B", os.path.join(PLUGIN, "server.py")], input="".join(json.dumps(m) + "\n" for m in msgs),
                       capture_output=True, text=True, timeout=60, env=dict(os.environ, AMBIENT_QA_DIR=tempfile.mkdtemp(prefix="aq-")))
    return [json.loads(l) for l in p.stdout.splitlines() if l.strip()]


@test
def server_handshake():
    """the MCP server: initialize, tools/list, a call without the app is a tool error, not a crash"""
    r = mcp({"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2025-06-18"}},
            {"jsonrpc": "2.0", "method": "notifications/initialized"},
            {"jsonrpc": "2.0", "id": 2, "method": "tools/list"},
            {"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "state", "arguments": {}}},
            {"jsonrpc": "2.0", "id": 4, "method": "nope"})
    check([m["id"] for m in r] == [1, 2, 3, 4], r)
    check(r[0]["result"]["serverInfo"]["name"] == "ambient-qa", r[0])
    names = {t["name"] for t in r[1]["result"]["tools"]}
    want = {"launch", "stop", "inject", "fn", "key", "say", "snapshot", "state", "events", "scenes", "play", "reset", "list_scenes"}
    check(want <= names, names)
    for t in r[1]["result"]["tools"]:
        check(t["inputSchema"]["type"] == "object", t)
    check(r[2]["result"]["isError"] and "isn't running" in r[2]["result"]["content"][0]["text"], r[2])
    check(r[3]["error"]["code"] == -32601, r[3])


@test
def scenes_cover_spec():
    """the scenes (fakecore.js + extras) cover every SPEC §2 state and ambient's list"""
    sc, respond = qa.all_scenes()
    ids = [s["id"] for s in sc]
    check(len(ids) == len(set(ids)), "unique ids")
    covered = set().union(*(set(s["spec"]) for s in sc))
    check(SPEC_STATES <= covered, SPEC_STATES - covered)
    for need in ("idle-0", "idle-1", "idle", "needs-noopt", "needs-2", "spot", "spot-text", "agents-5", "agents-15", "hide", "hub", "still",
                 "perm", "perm-denied", "perm-mic-ask", "perm-mic-denied", "perm-screen-ask", "perm-screen-denied"):
        check(need in ids, need)
    for s in sc:
        check(all(isinstance(e[0], (int, float)) and "ev" in e[1] for e in s["events"]), s["id"])
    check({"answer", "send", "hush", "cut_in", "talk_cancel"} <= set(respond), respond.keys())
    check(any("$text" in json.dumps(e) for e in respond["send"]), "send echoes the text")


@test
def shot_times_rule():
    """shots: after each moment, merged when close, the end included, capped"""
    evs = [[0, {"ev": "hub", "up": True}], [0, {"ev": "state", "agents": [], "cards": []}],
           [100, {"ev": "level", "v": 0.3}], [2000, {"ev": "phase", "phase": "working"}], [2300, {"ev": "main", "text": "x"}]]
    t = qa.shot_times(evs)
    check(t == [600, 2900, 3500], t)
    many = [[i * 1000, {"ev": "phase", "phase": "working"}] for i in range(30)]
    t = qa.shot_times(many, cap=8)
    check(len(t) == 8 and t[0] == 600 and t[-1] == 29000 + 1200, t)
    check(qa.shot_times([]) == [1200], "an empty scene: one shot")


@test
def hub_plugins_off():
    """a QA hub's plugins: none of the user's, the computer plugin off; his file untouched"""
    d = tempfile.mkdtemp(prefix="aq-")
    user = os.path.join(d, "user.json")
    json.dump({"enabled": ["computer", "ambient-qa", "gmail-thing"], "disabled": ["x"]}, open(user, "w"))
    old = os.environ.get("BEND_PLUGINS_STATE")
    os.environ["BEND_PLUGINS_STATE"] = user
    try:
        off = json.load(open(qa.hub_plugins_state(d)))
        check(off["enabled"] == [] and "computer" in off["disabled"], off)
        asked = json.load(open(qa.hub_plugins_state(d, computer=True, keep_user=True)))
        check("computer" in asked["enabled"] and "gmail-thing" in asked["enabled"] and "computer" not in asked["disabled"], asked)
        check(json.load(open(user))["enabled"] == ["computer", "ambient-qa", "gmail-thing"], "the user's own state is untouched")
    finally:
        if old is None:
            os.environ.pop("BEND_PLUGINS_STATE")
        else:
            os.environ["BEND_PLUGINS_STATE"] = old


@test
def real_accounts_refused():
    """real connectors and the computer plugin are refused without the user's own approval"""
    for kw in ({"connectors": True}, {"computer": True}, {"connectors": True, "real_accounts_approved_by_user": "  "}):
        try:
            qa.launch("model", **kw)
            check(False, "launched with %r" % kw)
        except qa.QAError as e:
            check("refused" in str(e) and "real accounts" in str(e), e)
    r = mcp({"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "launch", "arguments": {"hub": "model", "connectors": True}}})
    check(r[0]["result"]["isError"] and "refused" in r[0]["result"]["content"][0]["text"], r)


@test
def fake_accounts():
    """the fake accounts: each service answers MCP from fixtures, writes only to the outbox, installs as valid plugins"""
    d = tempfile.mkdtemp(prefix="aq-")
    box = os.path.join(d, "outbox.jsonl")
    srv = os.path.join(PLUGIN, "fake-accounts", "fake_accounts.py")

    def call(svc, *msgs):
        p = subprocess.run([sys.executable, "-B", srv, svc], input="".join(json.dumps(m) + "\n" for m in msgs),
                           capture_output=True, text=True, timeout=30, env=dict(os.environ, FAKE_ACCOUNTS_OUTBOX=box))
        return [json.loads(l) for l in p.stdout.splitlines() if l.strip()]
    init = {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}}
    for svc in qa.FAKE_SERVICES:
        r = call(svc, init, {"jsonrpc": "2.0", "id": 2, "method": "tools/list"})
        check(r[0]["result"]["serverInfo"]["name"] == "fake-" + svc and len(r[1]["result"]["tools"]) >= 2, (svc, r))
        check(all("fake QA account" in t["description"] for t in r[1]["result"]["tools"]), "every tool says it's fake")
    r = call("gmail", init, {"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "search_messages", "arguments": {"query": "offsite"}}})
    found = json.loads(r[1]["result"]["content"][0]["text"])["messages"]
    check({"m102", "m106", "m109", "m110", "m111"} <= {m["id"] for m in found}, found)
    data = fake.load()
    check(len(data["gmail"]["messages"]) >= 20 and {"team", "launch"} <= {c["name"] for c in data["slack"]["channels"]}, "20+ mails, #team and #launch")
    check(any("acme-team-planner-hq.app" in m["subject"] for m in data["gmail"]["messages"]), "roadmap D's domain mails")
    check(len([m for m in data["gmail"]["messages"] if m["thread"] == "t109"]) == 3, "a thread with a decision")
    today = datetime.date.today().isoformat()
    check(sum(e["start"].startswith(today) for e in data["calendar"]["events"]) >= 4, "today's meetings are on the real today")
    later = fake.load("2026-11-20")
    check(sum(e["start"].startswith("2026-11-20") for e in later["calendar"]["events"]) >= 4 and "INV-2026-09-4471" in json.dumps(later), "dates move by whole days, ids don't")
    r = call("github", init, {"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "repo_stats", "arguments": {}}})
    check(json.loads(r[1]["result"]["content"][0]["text"])["stars"] == 1284, r)
    r = call("hn", init, {"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "story_status", "arguments": {"id": "41712001"}}})
    check(json.loads(r[1]["result"]["content"][0]["text"])["rank"]["front"] == 7, r)
    r = call("gmail", init, {"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "create_draft", "arguments": {"to": "marc@acme.test", "subject": "weekly", "body": "x"}}})
    check(json.loads(r[1]["result"]["content"][0]["text"])["fake"] is True, r)
    r = call("slack", init, {"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "post_message", "arguments": {"channel": "team", "text": "hi"}}})
    w = [json.loads(l) for l in open(box)]
    check([(x["service"], x["action"]) for x in w] == [("gmail", "create_draft"), ("slack", "post_message")], w)
    check(w[0]["kind"] == "gmail-draft", w[0])
    # roadmap A (amb-kit m_5538): a fake Kit, drafts only, no send tool; the inputs its jobs read
    r = call("kit", init, {"jsonrpc": "2.0", "id": 2, "method": "tools/list"})
    names = {t["name"] for t in r[1]["result"]["tools"]}
    check(names == {"subscriber_count", "list_broadcasts", "broadcast_stats", "create_draft"}, names)
    r = call("kit", init, {"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "create_draft", "arguments": {"subject": "Acme 2.5", "html": "<p>x</p>"}}})
    kd = json.loads(r[1]["result"]["content"][0]["text"])
    check(kd["url"].startswith("https://app.kit.com/campaigns/") and kd["url"].endswith("/draft"), kd)
    w = [json.loads(l) for l in open(box)]
    check(w[-1]["kind"] == "kit-draft" and w[-1]["url"] == kd["url"], w[-1])
    # roadmap D (ambient-lead m_5816): a fake registry, so the plan never asks the live web
    r = call("registry", init, {"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "lookup", "arguments": {"domain": "Acme-Team-Planner-HQ.app"}}})
    lk = json.loads(r[1]["result"]["content"][0]["text"])
    check(lk["available"] is True and lk["price"]["per_year"] == 14.0 and lk["registrar"] == "Gandi", lk)
    r = call("registry", init, {"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "lookup", "arguments": {"domain": "acme.app"}}})
    check(json.loads(r[1]["result"]["content"][0]["text"])["available"] is False, "another domain is taken")
    check(len([json.loads(l) for l in open(box)]) == len(w), "a lookup writes nothing")
    data = fake.load()
    check(any(m["channel"] == "@benjamin.roy" for m in data["slack"]["messages"]) and any(m.get("user") == "lelio" for m in data["slack"]["messages"]), "the DM and the HR ask")
    check(data["github"]["releases"][0]["tag"] == "v2.5.0", "release notes")
    ws = os.path.join(d, "ws")
    os.makedirs(os.path.join(ws, ".git", "info"))
    root = qa.install_fake_accounts(ws)
    for svc in qa.FAKE_SERVICES:
        m = json.load(open(os.path.join(root, svc, "plugin.json")))
        check(m["name"] == svc and m["$schema"].endswith("/1.0.0/plugin.schema.json") and "extensions" not in m, m)
        mc = json.load(open(os.path.join(root, svc, "mcp.json")))
        srv = mc["mcpServers"][qa.FAKE_SERVER_NAMES.get(svc, svc)]
        check(srv["args"][-1] == svc and os.path.exists(srv["args"][1]), mc)
    check("/.agents/" in open(os.path.join(ws, ".git", "info", "exclude")).read(), "out of the throwaway repo's git")
    # every agent of the hub reads the hub's user root, a worktree too (ambient-lead m_5865)
    home = os.path.join(d, "qa-user-plugins")
    qa.install_fake_accounts(root=home)
    check(sorted(os.listdir(home)) == sorted(qa.FAKE_SERVICES), os.listdir(home))
    # acme's code where Benjamin's reports live, committed in the workspace
    repo = os.path.join(d, "repo-ws")
    os.makedirs(repo)
    subprocess.run("git init -q && git config user.email t@t && git config user.name t", shell=True, cwd=repo, check=True)
    qa.seed_repo(repo)
    files = subprocess.run(["git", "ls-files"], cwd=repo, capture_output=True, text=True).stdout.split()
    check({"install.sh", "acme/http.py", "acme/assistant.py", "acme/sync.py", "bin/acme", "README.md"} <= set(files), files)
    src = {f: open(os.path.join(repo, f)).read() for f in ("install.sh", "acme/http.py", "acme/assistant.py")}
    check("fish" not in src["install.sh"] and ".zshrc" in src["install.sh"], "the fish bug (s212)")
    check("ProxyHandler({})" in src["acme/http.py"], "the proxy bug (s213)")
    check("Always answer in English" in src["acme/assistant.py"], "the French ask (s214)")


@test
def launch_grows():
    """the launch's comments come in batches (start, then a tick or every_min of hub time), numbers move, links are the real places', and the QA's truth never shows"""
    d = tempfile.mkdtemp(prefix="aq-")
    clk = os.path.join(d, "clock.json")
    srv = os.path.join(PLUGIN, "fake-accounts", "fake_accounts.py")
    init = {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}}

    def tool(svc, name, args):
        msgs = [init, {"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": name, "arguments": args}}]
        p = subprocess.run([sys.executable, "-B", srv, svc], input="".join(json.dumps(m) + "\n" for m in msgs),
                           capture_output=True, text=True, timeout=30, env=dict(os.environ, FAKE_ACCOUNTS_CLOCK=clk))
        return json.loads(json.loads(p.stdout.splitlines()[1])["result"]["content"][0]["text"])
    t0 = time.time() - 120
    json.dump({"start": t0, "ticks": [], "every_min": 0}, open(clk, "w"))
    first = tool("hn", "comments", {"id": "41712001"})["comments"]
    pts0 = tool("hn", "story_status", {"id": "41712001"})["points"]
    check(len(first) == 3 and "Claude Code" not in json.dumps(first), first)
    check(not any(k in json.dumps(first) for k in ("needs_answer", "\"kind\"")), "the QA's truth stays hidden")
    qa.tick(clock=clk)
    later = tool("hn", "comments", {"id": "41712001"})["comments"]
    check(len(later) == 5 and any("Claude Code" in c["text"] for c in later), later)
    check(tool("hn", "story_status", {"id": "41712001"})["points"] > pts0, "points move")
    check([c["author"] for c in tool("hn", "comments", {"id": "41712001", "since": "30m"})["comments"]] == ["agentsmith", "skeptic42"], "since")
    check(later[0]["url"] == "https://news.ycombinator.com/item?id=41712140", later[0])
    xs = tool("x", "mentions", {})["posts"]
    check(xs and all(p["url"].startswith("https://x.com/") for p in xs), xs)
    check(tool("bluesky", "thread", {"uri": "https://bsky.app/profile/acme.test/post/3l5acmelaunch"})["replies"] == 2, "bluesky grows")
    check(tool("reddit", "comments", {"url_or_id": "1fx9k2q"})["comments"][0]["url"].startswith("https://www.reddit.com/r/SaaS/comments/1fx9k2q/"), "reddit link")
    json.dump({"start": time.time() - 3 * 60 - 5, "ticks": [], "every_min": 1}, open(clk, "w"))
    check(len(tool("hn", "comments", {"id": "41712001"})["comments"]) == 7, "every_min of hub time")
    fb = tool("slack", "read_channel", {"channel": "acme-feedback"})["messages"]
    check(len(fb) == 3 and {m["user"] for m in fb} == {"benjamin.roy"} and fb[0]["url"].startswith("https://acme.slack.com/archives/C05/p"), fb)
    # the 'today' set (roadmap E, meetings): three meetings around the hub's now, Granola's notes once a meeting is over
    env = dict(os.environ, FAKE_ACCOUNTS_CLOCK=clk, FAKE_ACCOUNTS_SET="today")

    def tool2(svc, name, args):
        msgs = [init, {"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": name, "arguments": args}}]
        p = subprocess.run([sys.executable, "-B", srv, svc], input="".join(json.dumps(m) + "\n" for m in msgs), capture_output=True, text=True, timeout=30, env=env)
        return json.loads(json.loads(p.stdout.splitlines()[1])["result"]["content"][0]["text"])
    json.dump({"start": time.time(), "ticks": [], "every_min": 0}, open(clk, "w"))
    ev = tool2("calendar", "list_events", {})["events"]
    check([e["id"] for e in ev] == ["e401", "e402", "e403"] and ev[0]["start"] > iso_now() and ev[2]["moved_from"] and ev[0]["start_local"], ev)
    notes = tool2("granola", "list_meetings", {})["meetings"]
    check({m["title"] for m in notes} == {"Q2 review with Northwind", "Team sync"}, notes)
    json.dump({"start": time.time() - 50 * 60, "ticks": [], "every_min": 0}, open(clk, "w"))
    later = tool2("granola", "list_meetings", {})["meetings"]
    check(len(later) == 3 and later[0]["title"] == "Q3 renewal with Northwind", "today's notes once it is over")
    full = tool2("granola", "get_meetings", {"meeting_ids": [later[0]["id"]]})["meetings"][0]
    check(full["action_items"] and full["decisions"] and "[[0]]" in tool2("granola", "query_granola_meetings", {"query": "northwind renewal"})["response"], full)
    check(any(m["id"] == "m130" for m in tool2("gmail", "search_messages", {"query": "renewal"})["messages"]), "the last mail with the attendee")
    truth = qa.launch_truth(batches=2)
    check(truth["needs_answer"] == 8 and len(truth["new_needs_answer"]) == 4, truth)


@test
def run_scenarios():
    """scripted runs: the three asks, an unknown one refused before any hub, a one-screen report that names times, notes, outbox and verdict"""
    check({"weekly-update", "inbox", "offsite", "launch-watch"} <= set(qa.SCENARIOS) and qa.SCENARIOS["inbox"]["no_send"], qa.SCENARIOS)
    lw = qa.SCENARIOS["launch-watch"]
    check(lw["no_writes"] and lw["ticks"] == 1 and not lw["notes"], lw)
    need = [c for c in qa.launch_truth(2)["new"] if c["needs_answer"]]
    check(qa._card_about({"text": "agentsmith asks if it works with Claude Code"}, need), "a card about a comment")
    check(not qa._card_about({"text": "approve: run sb every 30m"}, need), "a card off the ask")
    body = '<li data-id="hn-41713010">agentsmith</li><li data-id="reddit-lq2e6f7"></li>'
    check(qa._covered(body, need)["found"] == 2, qa._covered(body, need))
    # roadmap A, C, D runs (ambient-lead m_5616)
    for k in ("newsletter", "feedback", "checklist"):
        check(qa.SCENARIOS[k]["flow"] in qa.FLOWS and qa.SCENARIOS[k]["no_send"] and not qa.SCENARIOS[k]["notes"], k)
    plan = ('<section data-kit="checklist" data-id="buy"><ol><li data-id="s1" data-done>read the mails</li>'
            '<li data-id="s2" data-who="yours">sign in to Gandi</li><li data-id="s3" data-who="bise">check the price</li>'
            '<li data-id="s4" data-who="yours">pay</li></ol></section><section data-kit="prose" data-id="p"><p>x</p></section>')
    rows = qa._rows(plan)
    check([(w["item"], w["yours"], w["done"]) for w in rows] == [("s1", False, True), ("s2", True, False), ("s3", False, False), ("s4", True, False)]
          and {w["block"] for w in rows} == {"buy"}, rows)
    try:
        qa.run("nope")
        check(False, "ran an unknown scenario")
    except qa.QAError as e:
        check("weekly-update" in str(e), e)
    r = {"scenario": "inbox", "ask": qa.SCENARIOS["inbox"]["ask"], "headless": True, "at": "2026-10-02 23:50", "dir": "/x",
         "t": {"page_first": 8.2, "v1": 61.0, "send": 63.0, "v2_after_send": 40.5, "v2_n": 2, "end": 61.0},
         "main_lines": [{"at": 4.1, "text": "inbox triage is on it. you'll get a page.", "len": 41}],
         "page": {"id": "inbox", "blocks": [{"id": "h1", "kit": "heading"}, {"id": "p1", "kit": "prose"}]},
         "notes": [{"id": "n1", "block": "p1", "text": "drop this part", "status": "done", "answer": None}],
         "outbox": {"writes": [{"service": "gmail", "action": "create_draft"}], "sends": []}, "cards": [], "fails": []}
    rep = qa.run_report(r)
    for want in ("main's line: 41 chars at 4.1 s", "first seen 8.2 s, v1 61.0 s", "v2 40.5 s after send", "1 writes (gmail.create_draft), 0 sends", "verdict: pass"):
        check(want in rep, (want, rep))
    check(len(rep.splitlines()) <= 25, "one screen")
    r["page"], r["fails"] = None, ["no page v1 in 61 s"]
    check("page: none" in qa.run_report(r) and "FAIL: no page" in qa.run_report(r), qa.run_report(r))


@test
def page_drive_local_only():
    """the page driver refuses any non-local URL before it starts Chrome (never a real site, never the user's browser)"""
    for url in ("https://mail.google.com/", "http://example.com/p/x"):
        try:
            qa.page_drive(url=url, out=tempfile.mkdtemp(prefix="aq-"))
            check(False, "drove %s" % url)
        except qa.QAError as e:
            check("local pages only" in str(e), e)


@test
def morning_page_laws():
    """run morning: the page laws of morning.md, a good page passes, each law fails alone"""
    good = """<section data-kit="heading" data-id="title"><h1>your saturday</h1><p>3 need you</p></section>
<section data-kit="heading" data-id="h-needs"><h2>needs you</h2></section>
<section data-kit="prose" data-id="needs"><ul>
<li><a href="/p/cookie-question#q1">the cookie banner</a> · a card</li>
<li><a href="/p/inbox#m2">reply to Marc</a> · inbox</li>
<li><a href="/p/domain#s2">sign in to the registrar</a> · yours</li></ul></section>
<section data-kit="heading" data-id="h-done"><h2>done overnight</h2></section>
<section data-kit="prose" data-id="done"><ul><li>fix-csv: <a href="https://github.test/acme/app/pull/241">PR #241</a></li></ul></section>
<section data-kit="heading" data-id="h-today"><h2>today</h2></section>
<section data-kit="prose" data-id="m1"><p><strong>09:15</strong> Q3 renewal with Northwind · Hélène Roux</p><ul><li>a</li><li>b</li><li>c</li></ul></section>
<section data-kit="prose" data-id="m2"><p><strong>10:00</strong> Team sync</p><ul><li>weekly</li></ul></section>
<section data-kit="prose" data-id="m3"><p><strong>11:30</strong> Coffee with Yann</p><ul><li>no notes from last time</li></ul></section>
<section data-kit="heading" data-id="h-watched"><h2>watched</h2></section>
<section data-kit="prose" data-id="watched"><ul><li><a href="/p/launch-watch">the launch</a> · 2 need a reply</li></ul></section>"""
    facts, fails = qa.morning_check(good, "morning-2026-10-03", today="2026-10-03")
    check(not fails and facts["meetings"] == {"e401": 3, "e402": 1, "e403": 1}, (facts, fails))
    _, f = qa.morning_check(good, "morning", today="2026-10-03")
    check(len(f) == 1 and "page id" in f[0], f)
    _, f = qa.morning_check(good.replace('<a href="/p/inbox#m2">reply to Marc</a>', "reply to Marc"), "morning-2026-10-03", today="2026-10-03")
    check(len(f) == 1 and "without a link" in f[0], f)
    _, f = qa.morning_check(good.replace('href="/p/inbox#m2"', 'href="/p/inbox"'), "morning-2026-10-03", today="2026-10-03")
    check(len(f) == 1 and "bare page" in f[0] and "/p/inbox" in f[0], f)
    _, f = qa.morning_check(good.replace("<h1>your saturday</h1><p>3 need you</p>", "<p>3 need you</p><h1>your saturday</h1>"), "morning-2026-10-03", today="2026-10-03")
    check(len(f) == 1 and "<h1>" in f[0], f)
    # outside needs you a bare page is fine (the launch watch under watched)
    check("/p/launch-watch\"" in good, "the good page links the bare watch page under watched")
    _, f = qa.morning_check(good.replace("<li>c</li>", "<li>c</li><li>d</li>"), "morning-2026-10-03", today="2026-10-03")
    check(len(f) == 1 and "over 3 lines" in f[0], f)
    _, f = qa.morning_check(good + '<section data-kit="sources" data-id="s"><ol><li>x</li></ol></section>', "morning-2026-10-03", today="2026-10-03")
    check(len(f) == 1 and "sources" in f[0], f)
    _, f = qa.morning_check(good.replace("Coffee with Yann", "a walk"), "morning-2026-10-03", today="2026-10-03")
    check(len(f) == 1 and "e403" in f[0], f)
    _, f = qa.morning_check(good.replace("cookie", "banner"), "morning-2026-10-03", today="2026-10-03")
    check(len(f) == 1 and "the cookie question" in f[0], f)
    sc = qa.SCENARIOS["morning"]
    check(sc["seed"] in qa.SEEDS and sc["flow"] in qa.FLOWS and sc["no_writes"] and sc["set"] == "today", sc)
    for n in ("inbox-review.html", "buy-domain.html", "launch-watch.html"):
        check(os.path.exists(os.path.join(qa.KIT_EXAMPLES, n)), n)


@test
def meeting_page_laws():
    """run meetings: the brief and the follow-ups laws of meetings.md on the kit's examples"""
    ex = lambda n: open(os.path.join(qa.KIT_EXAMPLES, n)).read()
    facts, fails = qa.meeting_brief_check(ex("meeting-brief.html"), "meeting-q3-renewal-2026-05-19")
    check(not fails and facts["asks"] >= 3 and "checklist" in facts["kits"], (facts, fails))
    _, f = qa.meeting_brief_check(ex("meeting-brief.html"), "q3-renewal")
    check(len(f) == 1 and "brief id" in f[0], f)
    # the kit's follow-up is Camille's renewal, not Hélène's: only the decisions differ
    facts, fails = qa.meeting_followup_check(ex("meeting-followup.html"), "meeting-q3-renewal-2026-05-19")
    check(facts["yours"] >= 1 and facts["drafts"] and len(fails) == 1 and "Granola's decisions" in fails[0], (facts, fails))
    good = ex("meeting-followup.html").replace("24 months at 5 % off", "3-year renewal if SSO ships, 45 seats")
    check(not qa.meeting_followup_check(good, "meeting-x-2026-05-19")[1], "a follow-up with the decisions passes")
    _, f = qa.meeting_followup_check(good.replace('data-who="yours"', 'data-who="Lucas"'), "meeting-x-2026-05-19")
    check(len(f) == 1 and "yours" in f[0], f)
    # a step bise took by drafting it for his word counts as his action (the live run's v2)
    took = good.replace('data-who="yours"', 'data-who="bise" data-did="drafted" data-draft="mail-a1"')
    facts, f = qa.meeting_followup_check(took, "meeting-x-2026-05-19")
    check(not f and facts["bise_drafted"] == 1, (facts, f))
    sc = qa.SCENARIOS["meetings"]
    check(sc["timed"] and sc["flow"] in qa.FLOWS and sc["no_writes"] and sc["set"] == "today", sc)


@test
def launch_watch_cards_may_be_a_teammates_question():
    """launch-watch: a card about a teammate's question to him passes (ambient-pm m_5855), a card about news still fails"""
    asks = qa.team_asks()
    check({"s210", "s215"} <= {a["id"] for a in asks} and "s217" not in {a["id"] for a in asks}, asks)
    marc = {"id": 3, "kind": "question", "text": "Marc asks in #launch: can the weekly update carry these numbers?"}
    check(qa._card_about(marc, asks), "Marc's question in #launch")
    news = {"id": 4, "kind": "info", "text": "the Show HN reached the front page, rank 12"}
    check(not qa._card_about(news, asks) and not qa._card_about(news, [c for c in qa.launch_truth(3)["new"] if c["needs_answer"]]), "news is no ask")


@test
def one_run_at_a_time():
    """qa.py run: a second run in the same QA dir is refused while one is live (ambient-pm m_5841)"""
    lock = os.path.join(qa.QA_DIR, "run.lock")
    os.makedirs(qa.QA_DIR, exist_ok=True)
    old = open(lock).read() if os.path.exists(lock) else None
    if old and qa._pid_alive((json.loads(old) or {}).get("pid")):
        return   # a real run is live here: nothing to fake
    p = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(30)"])
    try:
        with open(lock, "w") as f:
            json.dump({"pid": p.pid, "scenario": "launch-watch", "at": "01:00:00"}, f)
        try:
            qa.run("checklist", headless=True)
            check(False, "a second run started")
        except qa.QAError as e:
            check("a run is live" in str(e) and "launch-watch" in str(e), e)
        check(json.load(open(lock))["pid"] == p.pid, "the live run's lock is kept")
    finally:
        p.kill()
        os.unlink(lock)


@test
def http_retries_a_reset():
    """the page server's GET: a reset connection is tried again (ambient-pm m_5709), a POST never"""
    import struct
    srv = socket.socket()
    srv.bind(("127.0.0.1", 0))
    srv.listen(4)
    port = srv.getsockname()[1]
    seen = []

    def serve():
        for _ in range(3):   # the GET's two tries and the POST, then the thread ends
            try:
                c, _ = srv.accept()
            except OSError:
                return
            try:
                c.recv(4096)
            except OSError:
                pass
            seen.append(1)
            if len(seen) in (1, 3):   # the first GET and the POST: a reset
                c.setsockopt(socket.SOL_SOCKET, socket.SO_LINGER, struct.pack("ii", 1, 0))
            else:
                c.sendall(b"HTTP/1.1 200 OK\r\nContent-Length: 2\r\nConnection: close\r\n\r\nok")
            c.close()
    threading.Thread(target=serve, daemon=True).start()
    check(qa._http(port, "GET", "/p/x/meta") == (200, "ok") and len(seen) == 2, seen)
    try:
        qa._http(port, "POST", "/p/x/notes", body={})
        check(False, "a POST was retried or passed")
    except ConnectionError:
        check(len(seen) == 3, seen)
    srv.close()


@test
def client_protocol():
    """the socket client: one JSON line each way, ids matched, errors raised"""
    d = tempfile.mkdtemp(prefix="aq-", dir="/tmp" if len(tempfile.gettempdir()) > 60 else None)
    path = os.path.join(d, "qa.sock")
    srv = socket.socket(socket.AF_UNIX)
    srv.bind(path)
    srv.listen(1)

    def serve():
        c, _ = srv.accept()
        f = c.makefile("rb")
        for line in f:
            q = json.loads(line)
            # a stale reply first: the client must skip it
            c.sendall((json.dumps({"id": -1, "ok": True}) + "\n").encode())
            r = {"id": q["id"], "ok": q["op"] != "bad", "echo": q}
            if q["op"] == "bad":
                r["error"] = "unknown op bad"
            c.sendall((json.dumps(r) + "\n").encode())
    threading.Thread(target=serve, daemon=True).start()
    cl = qa.Client(path)
    r = cl.call("inject", ev={"ev": "phase", "phase": "idle"})
    check(r["echo"]["ev"]["phase"] == "idle" and "id" not in r and "ok" not in r, r)
    try:
        cl.call("bad")
        check(False, "no error")
    except qa.QAError as e:
        check("unknown op bad" in str(e), e)
    cl.close()
    try:
        qa.Client(os.path.join(d, "none.sock"))
        check(False, "no error for a missing socket")
    except qa.QAError as e:
        check("launch() first" in str(e), e)


def live():
    """the real app on a throwaway hub"""
    r = qa.launch("fake", restart=True)
    check(r["hub_up"], "the fake hub is up in the app: %r" % r)
    try:
        st = qa.state()
        check(st["app"]["mode"] == "fake" and st["model"]["hub"]["up"], st["app"])
        out = tempfile.mkdtemp(prefix="aq-live-")
        sc = qa.scenes(["idle", "needs"], ["dark"], out=out)
        check(len(sc["sheets"]) == 2 and all(os.path.getsize(p) > 10000 for p in sc["sheets"]), sc["sheets"])
        shots = [s for x in sc["scenes"] for s in x["shots"]]
        check(all(os.path.exists(s["panel"]) and os.path.exists(s["screen"]) for s in shots), shots)
        print("ok   scenes: %s" % sc["sheets"][0])
        s = qa.say("dark mode for the settings page")
        check(s.get("main") == "ack: dark mode for the settings page", s)
        evs = qa.events(400)["events"]
        sent = [e for e in evs if e["dir"] == "app>core" and e["ev"].get("cmd") == "send"]
        check(sent and sent[-1]["ev"]["text"] == "dark mode for the settings page", "the words went to the core")
        check(not any(e["ev"].get("cmd") == "talk_start" and e["dir"] == "app>core" for e in evs), "talk_start never reached the core")
        check(any(e["ev"].get("ev") == "phase" and e["ev"].get("phase") == "speaking" for e in evs), "spoken")
        print("ok   say: main answered %r" % s["main"])
        qa.inject({"ev": "state", "agents": [], "cards": [{"id": "c1", "kind": "question", "agent": "cookies", "text": "keep it?",
                                                            "options": [{"n": 1, "label": "yes"}, {"n": 2, "label": "no"}]}]})
        time.sleep(0.5)
        qa.key("1")
        # the page answers through its message handler, a beat later
        answered = False
        for _ in range(30):
            evs = qa.events(60)["events"]
            answered = any(e["ev"].get("cmd") == "answer" and e["dir"] == "app>core" and e["ev"].get("reply") == "1" for e in evs)
            if answered:
                break
            time.sleep(0.1)
        check(answered, "fn + 1 answered the card")
        print("ok   fn + 1 answers a card")
    finally:
        qa.stop()


if __name__ == "__main__":
    if "--live" in sys.argv:
        test(live)
    print("%d failed" % len(failures) if failures else "all ambient-qa tests pass")
    sys.exit(1 if failures else 0)
