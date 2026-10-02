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
