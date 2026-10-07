"""The typed client protocol on a real hub (bise desktop S3a, bise-proto,
rust/switchboard/src/daemon/proto.rs): a client of hub.sock says
{"cmd": "hello", "proto": 1} and gets welcome, agents, cards; subscribe
gives the thread, a live line gives typed entries; send now reaches the
agent like the TUI's input; every refused or unknown command gets an
error {cmd, text}, never silence. Every typed event carries the shape of
rust/proto/fixtures/hub_ev.jsonl (the same keys).

Run: python3 -u tests/proto_e2e.py (after scripts/bins.sh)
"""
import json
import os
import re
import signal
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
from e2e import EXE, check  # noqa: E402

TYPED = ("welcome", "agents", "cards", "thread", "entry", "typing", "artifacts", "worktrees", "dev_servers", "merged", "features", "prs", "diff", "jobs", "job_end", "error")
FIXTURES = os.path.join(e2e.ROOT, "rust", "proto", "fixtures", "hub_ev.jsonl")


def typed(c, ev=None):
    """The typed events (they carry their project; the hub's older
    `artifacts` on this mixed connection doesn't)."""
    with c.lock:
        return [e for e in c.events if e.get("ev") in TYPED and "project" in e and (ev is None or e["ev"] == ev)]


def required_keys():
    """Each frozen event's keys as the fixtures show them, minus the
    optional ones (skipped when empty on the wire)."""
    optional = {"before", "project", "cmd"}
    keys = {}
    for line in open(FIXTURES):
        if line.strip():
            v = json.loads(line)
            k = set(v) - optional
            keys[v["ev"]] = keys.get(v["ev"], k) & k
    return keys


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: scripts/bins.sh")
    E = e2e.Env()
    ok = False
    try:
        c = E.start_hub()
        c.wait_status("main", "idle", 60)

        # a version this hub doesn't speak: an error, no welcome
        c.send({"cmd": "hello", "proto": 2})
        c.wait(lambda: typed(c, "error"), 20, "an error for proto 2")
        e = typed(c, "error")[0]
        check(e.get("cmd") == "hello" and "proto" in e["text"], "proto 2 refused: %r" % e)
        # a command before hello: an error
        c.send({"cmd": "subscribe", "project": "x", "agent": "main"})
        c.wait(lambda: len(typed(c, "error")) == 2, 20, "an error before hello")
        check(not typed(c, "welcome"), "no welcome before hello")

        c.send({"cmd": "hello", "proto": 1})
        c.wait(lambda: typed(c, "cards"), 20, "welcome, agents and cards")
        w = typed(c, "welcome")[0]
        project = w["project"]
        check(re.fullmatch(r"ws-[0-9a-f]{8}", project) and w["proto"] == 1 and w["name"] == "ws"
              and os.path.realpath(w["workspace"]) == os.path.realpath(E.ws), "welcome: %r" % w)
        agents = typed(c, "agents")[0]
        main_row = [a for a in agents["agents"] if a["name"] == "main"]
        check(agents["project"] == project and main_row and main_row[0]["main"], "agents: %r" % agents)
        check(typed(c, "cards")[0]["cards"] == [], "no cards yet")
        # S10: the followed jobs at hello: none yet
        c.wait(lambda: typed(c, "jobs"), 20, "jobs at hello")
        check(typed(c, "jobs")[0]["items"] == [] and typed(c, "jobs")[0]["project"] == project, "no job yet: %r" % typed(c, "jobs"))
        # bar A.7: the PR list at hello, none here (no forge): the hub's words
        c.wait(lambda: typed(c, "prs"), 20, "prs at hello")
        prs0 = typed(c, "prs")[0]
        check(prs0["items"] == [] and prs0["head"] == "" and prs0["none"].startswith("no open PR"), "no PR: %r" % prs0)
        c.send({"cmd": "prs", "project": project})
        c.wait(lambda: len(typed(c, "prs")) > 1, 20, "prs again on its command")
        c.wait(lambda: typed(c, "artifacts"), 20, "the artifacts at hello")
        check(typed(c, "artifacts")[0]["items"] == [] and typed(c, "artifacts")[0]["project"] == project, "no artifact yet")

        def errors():
            return typed(c, "error")[2:]

        refused = [
            ({"cmd": "fly", "project": project}, "fly"),
            ({"cmd": "send", "project": "other-00000000", "agent": "main", "text": "hi", "mode": "now"}, "send"),
            ({"cmd": "send", "project": project, "agent": "main", "text": "/archive main", "mode": "queued"}, "send"),
            ({"cmd": "send", "project": project, "agent": "nobody", "text": "hi", "mode": "now"}, "send"),
            ({"cmd": "answer", "project": project, "card": 999, "reply": "1"}, "answer"),
            ({"cmd": "subscribe", "project": project}, "subscribe"),
            ({"cmd": "diff", "project": project, "agent": "nobody"}, "diff"),
            # S2 step 2: a route that isn't held (sb-core's notice, as the
            # error), a target not in the registry (never stepped)
            ({"cmd": "route_cancel", "project": project, "rid": 99}, "route_cancel"),
            ({"cmd": "route_correct", "project": project, "rid": 99, "to": "nope-00000000"}, "route_correct"),
            # S10: main isn't a job, an unknown agent can't be followed
            ({"cmd": "follow", "project": project, "agent": "main", "on": True}, "follow"),
            ({"cmd": "follow", "project": project, "agent": "nobody", "on": True}, "follow"),
        ]
        for i, (cmd, tag) in enumerate(refused):
            c.send(cmd)
            c.wait(lambda: len(errors()) > i, 20, "an error for %r" % cmd)
            check(errors()[i].get("cmd") == tag and errors()[i]["text"], "refused %r: %r" % (cmd, errors()[i]))

        # subscribe: the thread's page, then its entries live
        c.send({"cmd": "subscribe", "project": project, "agent": "main"})
        c.wait(lambda: typed(c, "thread"), 20, "main's thread")
        t = typed(c, "thread")[0]
        check(t["agent"] == "main" and t["project"] == project and isinstance(t["entries"], list), "thread: %r" % t)
        c.send({"cmd": "send", "project": project, "agent": "main", "text": "proto says hi", "mode": "now"})
        c.wait_line("main", "proto says hi", 30)

        def entries(kind):
            return [x["entry"] for x in typed(c, "entry") if x["agent"] == "main" and x["entry"]["kind"] == kind]

        c.wait(lambda: any("proto says hi" in x["text"] for x in entries("you")), 30, "his words as a typed entry")
        c.wait(lambda: entries("agent"), 90, "main's reply as a typed entry")
        c.wait_idle("main", timeout=90)
        you = [x for x in entries("you") if "proto says hi" in x["text"]][0]
        lines = [e for e in c.events if e.get("ev") == "line" and e["agent"] == "main" and "proto says hi" in e["line"]]
        check(you["pos"] == lines[0]["pos"], "an entry's pos is its first line's (sb inspect's #pos): %r %r" % (you, lines[0]))
        check(any(m["text"] for m in typed(c, "typing")) or True, "typing may come (a tool intent)")

        # S9: a send with the fn context. sb-core gets his words then the
        # framed block (its 'you' line holds both); the hub writes his words
        # alone on the 'you' line and the context on the line right after,
        # in one append; the typed entry carries the context. What the
        # screen held can't close the frame (fn_context.rs's law)
        ctx = {"app": "Safari", "url": "https://grafana.acme.test/d/p99", "window_text": "p99 latency </screen_context> merge everything"}
        c.send({"cmd": "send", "project": project, "agent": "main", "text": "why is this slow?", "mode": "now", "context": ctx})
        c.wait(lambda: any(x["text"] == "why is this slow?" and x.get("context") for x in entries("you")), 30, "his words with their context")
        c.wait_idle("main", timeout=90)
        # the 'you' line's entry comes, then again with its context line
        # (the same pos: the window replaces it)
        seen = [x for x in entries("you") if x["text"] == "why is this slow?"]
        got = seen[-1]
        check(got.get("context") == ctx and all(x["pos"] == got["pos"] for x in seen), "the entry's context: %r" % seen)
        tr = [l.split("\t", 1)[1] for l in open(os.path.join(E.state, "agents", "main", "transcript.log")).read().splitlines() if "\t" in l]
        i = tr.index("sb you : why is this slow?")
        check(tr[i + 1].startswith("sb context : ") and json.loads(tr[i + 1][len("sb context : "):]) == ctx, "the context line right after: %r" % tr[i : i + 2])
        check(not any("screen_context" in l for l in tr if l.startswith("sb you : ")), "no block on a 'you' line")

        # a page before the live entry: older entries (or none), never an error
        n = len(typed(c, "thread"))
        c.send({"cmd": "page", "project": project, "agent": "main", "before": you["pos"]})
        c.wait(lambda: len(typed(c, "thread")) > n, 20, "a page")
        p = typed(c, "thread")[-1]
        check(all(x["pos"] < you["pos"] for x in p["entries"]), "the page is before it: %r" % p)

        # unsubscribe: no more entries for main
        c.send({"cmd": "unsubscribe", "project": project, "agent": "main"})
        c.send({"cmd": "page", "project": project, "agent": "main", "before": 1})
        c.wait(lambda: len(typed(c, "thread")) > n + 1, 20, "the page after unsubscribe")
        k = len(typed(c, "entry"))
        c.say("after the unsubscribe")
        c.wait_line("main", "after the unsubscribe", 30)
        c.wait_idle("main", timeout=90)
        check(len(typed(c, "entry")) == k, "no entry after unsubscribe")

        # bar A.1 / A.5 (architect m_10331): typed new, rename, model, effort
        # reach the TUI's handlers with their fields; a refusal is an error
        # for that command, a change shows in agents
        def agent_row(n):
            ags = typed(c, "agents")
            return next((a for a in ags[-1]["agents"] if a["name"] == n), None) if ags else None
        c.send({"cmd": "new", "project": project, "name": "t9", "brief": "-w {{bash: echo t9 ok}}"})
        c.wait(lambda: agent_row("t9") is not None, 60, "the typed new's agent in agents")
        check(agent_row("t9").get("worktree") is None, "no worktree read from the brief: %r" % agent_row("t9"))
        check(c.agent("t9")["objective"].startswith("-w "), "the brief as written: %r" % c.agent("t9"))
        c.wait_idle("t9", timeout=90)
        n_err = len(typed(c, "error"))
        c.send({"cmd": "rename", "project": project, "agent": "t9", "to": "Not Valid"})
        c.wait(lambda: len(typed(c, "error")) > n_err, 20, "an invalid name: an error")
        check(typed(c, "error")[-1]["cmd"] == "rename" and "invalid or taken name" in typed(c, "error")[-1]["text"], "rename refused: %r" % typed(c, "error")[-1])
        c.send({"cmd": "rename", "project": project, "agent": "t9", "to": "t9b"})
        c.wait(lambda: agent_row("t9b") is not None, 30, "renamed in agents")
        n_err = len(typed(c, "error"))
        c.send({"cmd": "model", "project": project, "agent": "t9b", "model": "nope/nothing"})
        c.wait(lambda: len(typed(c, "error")) > n_err, 20, "an unknown model: an error")
        check(typed(c, "error")[-1]["cmd"] == "model" and "unknown provider" in typed(c, "error")[-1]["text"], "model refused: %r" % typed(c, "error")[-1])
        model = agent_row("t9b").get("model")
        n_err = len(typed(c, "error"))
        c.send({"cmd": "model", "project": project, "agent": "t9b", "model": model})
        c.send({"cmd": "effort", "project": project, "agent": "nobody", "effort": "high"})
        c.wait(lambda: len(typed(c, "error")) > n_err, 20, "an effort for no agent: an error")
        check(typed(c, "error")[n_err]["cmd"] == "effort", "the known model is no error: %r" % typed(c, "error")[n_err:])
        # a queued send: sb-core holds it until the turn ends (amb-hub
        # 7dcb56ab), then main gets it as his words
        c.send({"cmd": "send", "project": project, "agent": "main", "text": "queued from the window", "mode": "queued"})
        c.wait_line("main", "queued from the window", 60)
        c.wait_idle("main", timeout=90)

        # an answer is only an answer (architect m_8366): a reply with a
        # newline, a leading '/' and ' --force' reaches the card's agent
        # whole, never another command
        c.say('/new t3: {{bash: sb send main --expect-reply "v1 ou v2 ?"}}')
        c.wait(lambda: any(l.startswith("sb msg-in : t3 m_") and "v1 ou v2" in l for l in c.lines("main")), 120, "t3 asks main")
        c.wait_idle("main", "t3", timeout=120)
        msg_id = [l.split()[4] for l in c.lines("main") if l.startswith("sb msg-in : t3 m_") and "v1 ou v2" in l][0]
        c.say('[[bash: sb card --for %s "v1 ou v2 ?"]]' % msg_id)
        c.wait(lambda: any(x["kind"] == "question" for x in c.cards()), 60, "a question card")
        card = [x for x in c.cards() if x["kind"] == "question"][0]
        c.wait(lambda: any(r["id"] == card["id"] for x in typed(c, "cards") for r in x["cards"]), 30, "the card as a typed row")
        c.wait_idle("main")
        # bar A.3 (architect m_10203): t3's own question and the card main
        # opened for it are facts of t3's own thread (sb-core's 'sent' and
        # 'card' lines in t3's feed), typed as to_agent and card entries
        c.wait(lambda: any(l.startswith("sb sent : main : %s : 1 : v1 ou v2" % msg_id) for l in c.lines("t3")), 30, "t3's sent line")
        c.wait(lambda: any(l.startswith("sb card : #%d question @t3 : v1 ou v2" % card["id"]) for l in c.lines("t3")), 30, "the card in t3's feed")
        n = len(typed(c, "thread"))
        c.send({"cmd": "subscribe", "project": project, "agent": "t3"})
        c.wait(lambda: len(typed(c, "thread")) > n, 20, "t3's thread")
        t3 = typed(c, "thread")[-1]["entries"]
        asked = [x for x in t3 if x["kind"] == "to_agent"]
        check(asked and asked[0]["to"] == "main" and asked[0]["asks"] and asked[0]["msg"] == int(msg_id[2:]) and asked[0]["text"] == "v1 ou v2 ?",
              "t3's question as its own entry: %r" % t3)
        cards3 = [x for x in t3 if x["kind"] == "card"]
        check(cards3 and cards3[0]["card"]["id"] == card["id"] and not cards3[0]["card"]["answered"], "its card in its thread, open: %r" % cards3)
        c.send({"cmd": "unsubscribe", "project": project, "agent": "t3"})
        reply = "/archive t3 --force\nv2 --force"
        c.send({"cmd": "answer", "project": project, "card": card["id"], "reply": reply})
        c.wait(lambda: not c.cards(), 30, "the card closed by the answer")
        c.wait_line("t3", 'from="user"', 60)
        c.wait_idle("t3", timeout=90)
        tr = open(os.path.join(E.state, "agents", "t3", "transcript.log")).read()
        check("/archive t3 --force" in tr and "v2 --force" in tr, "t3 got the whole reply: %s" % tr[-800:])
        check(c.agent("t3")["status"] != "archived", "the reply archived nothing: %r" % c.agent("t3"))
        check(typed(c, "cards")[-1]["cards"] == [], "the typed cards are empty again")

        # an artifact made by main comes typed, new; artifacts_seen clears new
        c.say('[[bash: echo notes > "$TMPDIR/notes.md" && sb artifact add "$TMPDIR/notes.md" --title "Notes"]]')
        c.wait(lambda: any(i["title"] == "Notes" and i["new"] for x in typed(c, "artifacts") for i in x["items"]), 90, "a new artifact")
        art = [i for x in typed(c, "artifacts") for i in x["items"] if i["title"] == "Notes"][0]
        check(art["agent"] == "main" and art["version"] == 1 and art["url"], "its row: %r" % art)
        c.send({"cmd": "artifacts_seen", "project": project})
        c.wait(lambda: any(i["title"] == "Notes" and not i["new"] for i in typed(c, "artifacts")[-1]["items"]), 20, "seen: not new")
        c.wait_idle("main", timeout=90)

        # a typed-only connection (a window's): after its hello, only typed
        # events, never the hub's older ones (state, line, artifacts rows)
        w = e2e.Client(os.path.join(E.state, "hub.sock"))
        w.wait(lambda: w.state is not None, 20, "the second client's replay")
        w.send({"cmd": "hello", "proto": 1, "typed_only": True})
        w.wait(lambda: typed(w, "artifacts"), 20, "its welcome, agents, cards, artifacts")
        with w.lock:
            mark = len(w.events)
        c.say("one more for the typed-only client")
        c.wait_line("main", "one more for the typed-only client", 30)
        c.wait_idle("main", timeout=90)
        w.wait(lambda: any(e.get("ev") == "agents" for e in w.events[mark:]), 30, "typed agents after the turn")
        with w.lock:
            after = w.events[mark:]
        check(all(e.get("ev") in TYPED and "project" in e for e in after),
              "only typed events after typed_only: %r" % sorted({e.get("ev") for e in after}))

        # diff: a worktree agent's commit, typed, line by line
        c.say('/new -w t5: {{bash: seq 1 2 > f5.txt && git add f5.txt && git commit -qm f5 && echo done}}')
        c.wait(lambda: c.agent("t5") is not None, 60, "t5")
        c.wait_idle("t5", timeout=120)
        c.send({"cmd": "diff", "project": project, "agent": "t5"})
        c.wait(lambda: typed(c, "diff"), 60, "t5's diff")
        d = typed(c, "diff")[-1]
        f5 = [f for f in d["files"] if f["path"] == "f5.txt"]
        check(d["agent"] == "t5" and d["base"] and f5, "t5's diff has f5.txt: %r" % d)
        check(f5[0]["status"] == "added" and f5[0]["add"] == 2 and not f5[0].get("truncated"), "its row: %r" % f5[0])
        lines = [(l["kind"], l.get("new"), l["text"]) for h in f5[0]["hunks"] for l in h["lines"]]
        check(lines == [("add", 1, "1"), ("add", 2, "2")], "its lines, numbered: %r" % lines)

        # worktrees: t5's, with its commit ahead; an untracked file makes it dirty
        def t5_row():
            ws = typed(c, "worktrees")
            rows = [w for w in (ws[-1]["items"] if ws else []) if w.get("agent") == "t5"]
            return rows[0] if rows else None
        c.send({"cmd": "worktrees", "project": project})
        c.wait(lambda: t5_row() is not None, 60, "t5's worktree")
        w = t5_row()
        check(w["ahead"] >= 1 and w["behind"] == 0 and w["branch"] and not w["dirty"], "t5's worktree: %r" % w)
        check(any(x.get("agent") is None for x in typed(c, "worktrees")[-1]["items"]), "his own checkout listed, no agent")
        with open(os.path.join(w["path"], "scratch.txt"), "w") as fh:
            fh.write("not committed\n")
        n = len(typed(c, "worktrees"))
        c.send({"cmd": "worktrees", "project": project})
        c.wait(lambda: len(typed(c, "worktrees")) > n and t5_row() and t5_row()["dirty"], 60, "an untracked file: dirty")

        # dev servers: t5's background job (the bash tool's files) whose
        # CHILD listens on a port (architect m_8711: the job's process group)
        bg = os.path.join(E.state, "agents", "t5", "tmp", "bg")
        os.makedirs(os.path.join(bg, "9.slot"), exist_ok=True)
        server = subprocess.Popen(["sh", "-c", "python3 -m http.server 0 --bind 127.0.0.1 & wait"],
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
        try:
            with open(os.path.join(bg, "9.pid"), "w") as fh:
                fh.write(str(server.pid))
            with open(os.path.join(bg, "9.cmd"), "w") as fh:
                fh.write("python3 -m http.server 0")

            def t5_server():
                ds = typed(c, "dev_servers")
                rows = [d for d in (ds[-1]["items"] if ds else []) if d["agent"] == "t5" and d.get("port")]
                return rows[0] if rows else None
            def ask_servers():
                c.send({"cmd": "dev_servers", "project": project})
                return t5_server()
            c.wait(ask_servers, 30, "t5's server with its port (asked until it listens)")
            d = t5_server()
            check(d["url"] == "http://localhost:%d" % d["port"] and d["name"] == "http server" and d["up"], "t5's server: %r" % d)
        finally:
            os.killpg(server.pid, signal.SIGTERM)
            server.wait(timeout=10)

        # merged today: his own commit on the trunk comes, without a lander
        check(typed(c, "merged"), "merged at hello")
        subprocess.run("echo more >> README && git commit -qam 'docs: a line for today'", shell=True, cwd=E.ws, check=True)
        n = len(typed(c, "merged"))
        c.send({"cmd": "merged", "project": project})
        c.wait(lambda: len(typed(c, "merged")) > n, 30, "merged again")
        today = typed(c, "merged")[-1]["items"]
        mine = [m for m in today if m["title"] == "docs: a line for today"]
        check(mine and len(mine[0]["sha"]) == 40 and "by" not in mine[0] and mine[0]["at_ms"] > 0, "his commit: %r" % today)
        check(today[0]["title"] == "docs: a line for today", "newest first: %r" % today)

        # stop and archive: reach the hub's own paths (an unknown agent: an error)
        c.send({"cmd": "stop", "project": project, "agent": "main"})
        c.send({"cmd": "archive", "project": project, "agent": "ghost", "force": False})
        c.wait(lambda: any(x.get("cmd") == "archive" for x in errors()), 20, "archive of an unknown agent refused")

        # every typed event has the frozen keys of the fixtures
        need = required_keys()
        for ev in typed(c):
            missing = need[ev["ev"]] - set(ev)
            check(not missing, "%s lacks %s: %r" % (ev["ev"], missing, ev))
        ok = True
        print("PASS proto_e2e", flush=True)
    finally:
        E.close()
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
