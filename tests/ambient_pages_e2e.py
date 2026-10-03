"""bise ambient v2's page loop against a real hub (docs/ambient-pages.md §2).

A real hub (bise sbd, scripted model) on a throwaway repo: main publishes a
page with `sb page publish`, the page server serves it (shell, CSP, token),
the notes API refuses a request without the token or from another origin,
a note is saved then sent, main's input carries the notes message and its
<page-notes> block, the page is `updating` until main's turn ends, and a
new version with --notes-done reaches an open SSE stream as `version 2`
with the note done. No browser, no app.

Run: python3 -u tests/ambient_pages_e2e.py
"""
import http.client
import json
import os
import sys
import threading

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
from e2e import EXE, check  # noqa: E402

PAGE_V1 = '<section data-kit="prose" data-id="p1"><p>the week: dark mode shipped.</p></section>\n'
PAGE_V2 = '<section data-kit="prose" data-id="p1"><p>the week: dark mode shipped, March numbers.</p></section>\n'
BUGS = (
    '<section data-kit="review" data-id="bugs"><ol>'
    '<li data-id="b1" data-agent="fixer"><p>login loops on Safari</p></li>'
    '<li data-id="b2"><p>the CSV export drops rows</p></li>'
    '</ol></section>\n'
    '<section data-kit="message" data-id="reply-nina" data-to="Slack · Nina Park"><p>we can reproduce it.</p></section>\n'
)
PAGE_V3 = PAGE_V2 + (
    '<section data-kit="question" data-id="q1"><p>post it in #team now, or wait for Marc?</p>'
    '<ol><li>post now</li><li>wait for Marc</li></ol></section>'
    '<section data-kit="question" data-id="q2"><p>add the March chart?</p>'
    '<ol><li>yes</li><li>no</li></ol></section>'
)


def settle(c, timeout=120):
    """main is idle and no turn of its runs, twice 2 s apart: a message
    the hub sent main (a notes message, a tick) has had its turn. Else
    the next [[bash]] steers into that turn and the scripted model answers
    the first message instead (a race on a loaded machine)."""
    import time

    def quiet():
        lines = c.lines("main")
        started = max((i for i, l in enumerate(lines) if l.strip() == "obs: turn_started"), default=-1)
        idle = max((i for i, l in enumerate(lines) if l == "--- idle"), default=-1)
        return idle >= started

    for _ in range(2):
        c.wait_idle("main", timeout=timeout)
        c.wait(quiet, timeout, "main's turn over")
        time.sleep(2)


def request(port, method, path, body=None, headers=None):
    c = http.client.HTTPConnection("127.0.0.1", port, timeout=10)
    h = {"Host": "127.0.0.1:%d" % port}
    h.update(headers or {})
    data = json.dumps(body).encode() if body is not None else None
    if data is not None:
        h["Content-Type"] = "application/json"
    c.request(method, path, body=data, headers=h)
    r = c.getresponse()
    out = (r.status, dict(r.getheaders()), r.read().decode())
    c.close()
    return out


class Sse:
    """One SSE stream, its frames collected on a thread."""

    def __init__(self, port, path):
        self.frames = []
        self.lock = threading.Lock()
        self.c = http.client.HTTPConnection("127.0.0.1", port, timeout=120)
        self.c.request("GET", path, headers={"Host": "127.0.0.1:%d" % port})
        self.r = self.c.getresponse()
        threading.Thread(target=self._read, daemon=True).start()

    def _read(self):
        ev, data = None, None
        while True:
            line = self.r.fp.readline()
            if not line:
                return
            line = line.decode().rstrip("\n")
            if line.startswith("event: "):
                ev = line[7:]
            elif line.startswith("data: "):
                data = json.loads(line[6:])
            elif line == "" and ev:
                with self.lock:
                    self.frames.append((ev, data))
                ev, data = None, None

    def seen(self, ev, pred=lambda d: True):
        with self.lock:
            return any(e == ev and pred(d) for e, d in self.frames)


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: cd rust && cargo build")
    E = e2e.Env()
    ok = True
    try:
        c = E.start_hub()
        c.wait_status("main", "idle", 60)
        v1 = os.path.join(E.tmp, "page-v1.html")
        v2 = os.path.join(E.tmp, "page-v2.html")
        open(v1, "w").write(PAGE_V1)
        open(v2, "w").write(PAGE_V2)
        bad = os.path.join(E.tmp, "bad.html")
        open(bad, "w").write('<section data-kit="prose" data-id="p1" style="color:red"><p>x</p></section>\n')

        # a page the lint refuses: one line, nothing stored
        c.say('[[bash: sb page publish %s --id weekly-update]]' % bad)
        c.wait_line("main", "style", 90)
        settle(c)
        check(not os.path.exists(os.path.join(E.state, "pages", "weekly-update")), "a refused page stores nothing")

        # main publishes
        c.say('[[bash: sb page publish %s --id weekly-update --title "weekly update"]]' % v1)
        c.wait_line("main", "published weekly-update v1", 90)
        settle(c)
        port = int(open(os.path.join(E.state, "pages.port")).read().strip())
        check(47100 <= port < 47900, "the port is in the pages range: %d" % port)
        c.wait(lambda: any(p["id"] == "weekly-update" for p in (c.state or {}).get("pages", [])), 30, "state.pages")
        check(any(e.get("ev") == "page" and e.get("id") == "weekly-update" for e in c.events), "a page event")

        # the page in its shell, with the CSP
        st, h, body = request(port, "GET", "/p/weekly-update")
        check(st == 200, "GET page: %d" % st)
        check("default-src 'self'" in h.get("Content-Security-Policy", ""), "the CSP: %r" % h)
        check('data-page="weekly-update"' in body and "dark mode shipped" in body, "the fragment in the shell")
        token = body.split('<meta name="bise-token" content="')[1].split('"')[0]
        origin = "http://127.0.0.1:%d" % port
        st, _, home = request(port, "GET", "/")
        check(st == 200 and 'href="/p/weekly-update"' in home, "for you lists it")

        # the notes API: no token, another origin: refused
        note = {"notes": [{"block": "p1", "quote": "dark mode", "kind": "note", "text": "use the March numbers"}]}
        st, _, _ = request(port, "POST", "/api/p/weekly-update/notes", note, {"Origin": origin})
        check(st == 403, "no token: 403, got %d" % st)
        st, _, _ = request(port, "POST", "/api/p/weekly-update/notes", note, {"Origin": "http://evil.example", "X-Bise-Token": token})
        check(st == 403, "another origin: 403, got %d" % st)
        st, _, saved = request(port, "POST", "/api/p/weekly-update/notes", note, {"Origin": origin, "X-Bise-Token": token})
        check(st == 200, "a draft saved: %d %s" % (st, saved))
        nid = json.loads(saved)["notes"][0]["id"]

        sse = Sse(port, "/p/weekly-update/events")
        c.wait(lambda: sse.seen("version", lambda d: d["n"] == 1), 10, "SSE version 1 at once")

        # send: main's input has the notes block; the page updates
        st, _, sent = request(port, "POST", "/api/p/weekly-update/send", {}, {"Origin": origin, "X-Bise-Token": token})
        check(st == 200 and json.loads(sent)["sent"] == 1, "send: %d %s" % (st, sent))
        c.wait_line("main", "you sent 1 note on your page", 30)
        check(any("page-notes" in l and nid in l for l in c.lines("main")), "the notes block in main's input")
        c.wait(lambda: sse.seen("state", lambda d: d["state"] == "updating"), 10, "SSE updating")
        # main's turn ends without a publish: ready again, the note stays sent
        settle(c)
        c.wait(lambda: sse.seen("state", lambda d: d["state"] == "ready"), 30, "SSE ready again")
        m = json.loads(request(port, "GET", "/p/weekly-update/meta")[2])
        check([n["status"] for n in m["notes"] if n["id"] == nid] == ["sent"], "no publish: the note stays sent, never done: %r" % m["notes"])

        # the next version answers the note
        c.say('[[bash: sb page publish %s --id weekly-update --notes-done %s]]' % (v2, nid))
        c.wait_line("main", "published weekly-update v2", 90)
        c.wait(lambda: sse.seen("version", lambda d: d["n"] == 2), 30, "SSE version 2")
        st, _, meta = request(port, "GET", "/p/weekly-update/meta")
        m = json.loads(meta)
        check(len(m["versions"]) == 2 and m["state"] == "ready", "two versions, ready: %r" % m)
        check([n["status"] for n in m["notes"] if n["id"] == nid] == ["done"], "the note is done: %r" % m["notes"])
        st, _, body2 = request(port, "GET", "/p/weekly-update/v/2/body")
        check(body2 == PAGE_V2, "v2's fragment as published")

        # the page's agent is gone: its notes go to main, main takes the page over
        settle(c)
        c.say('/new t1: {{bash: sb page publish %s --id t1-page --title "t1 page"}}' % v1)
        c.wait(lambda: any(p["id"] == "t1-page" for p in (c.state or {}).get("pages", [])), 120, "t1's page")
        check(json.loads(request(port, "GET", "/p/t1-page/meta")[2])["agent"] == "t1", "t1 owns its page")
        c.wait_idle("main", "t1")
        c.say("/archive t1 --force")
        c.wait_status("t1", ["archived", "stopped"], 60)
        settle(c)
        st, _, _ = request(port, "POST", "/api/p/t1-page/notes", {"notes": [{"block": "p1", "kind": "drop"}]}, {"Origin": origin, "X-Bise-Token": token})
        check(st == 200, "a note on t1's page: %d" % st)
        st, _, _ = request(port, "POST", "/api/p/t1-page/send", {}, {"Origin": origin, "X-Bise-Token": token})
        check(st == 200, "send on t1's page: %d" % st)
        c.wait(lambda: any("you sent 1 note" in l and "t1-page v1" in l for l in c.lines("main")), 30, "t1's notes in main's feed")
        settle(c)
        c.say('[[bash: sb page publish %s --id t1-page --notes-done n1]]' % v2)
        c.wait_line("main", "published t1-page v2", 90)
        m = json.loads(request(port, "GET", "/p/t1-page/meta")[2])
        check(m["agent"] == "main" and m["notes"][0]["status"] == "done", "main took the page over: %r" % m)

        # §4.1 a note talk's words: the page_voice op reaches the page's
        # SSE as `voice`, never main's input
        c.send({"op": "page_voice", "page": "weekly-update", "phase": "heard", "text": "make it shorter"})
        c.wait(lambda: sse.seen("voice", lambda d: d == {"phase": "heard", "text": "make it shorter"}), 10, "SSE voice")
        c.send({"op": "page_voice", "page": "weekly-update", "phase": "end", "text": "make it shorter"})
        c.wait(lambda: sse.seen("voice", lambda d: d["phase"] == "end"), 10, "SSE voice end")
        check(not any("make it shorter" in l for l in c.lines("main")), "a note talk never reaches main")

        # §4.2 questions in two places: each question block is one card
        # with its page link
        settle(c)
        v3 = os.path.join(E.tmp, "page-v3.html")
        open(v3, "w").write(PAGE_V3)
        c.say('[[bash: sb page publish %s --id weekly-update]]' % v3)
        c.wait_line("main", "published weekly-update v3", 90)

        def card(block):
            return next((x for x in c.cards() if (x.get("page") or {}).get("block") == block), None)

        c.wait(lambda: card("q1") and card("q2"), 30, "the question cards")
        q1, q2 = card("q1"), card("q2")
        check(q1["kind"] == "question" and q1["agent"] == "main", "q1's card: %r" % q1)
        check(q1["page"] == {"id": "weekly-update", "block": "q1", "url": "%s/p/weekly-update#q1" % origin}, "q1's link: %r" % q1["page"])
        check("1. post now" in q1["text"] and "2. wait for Marc" in q1["text"], "q1's options: %r" % q1["text"])
        st, _, home = request(port, "GET", "/")
        li = [l for l in home.split("<li") if 'data-page="weekly-update"' in l]
        check(li and "data-asking" in li[0], "for you: the page is asking: %r" % li)
        # the same question again: the same card
        settle(c)
        c.say('[[bash: sb page publish %s --id weekly-update]]' % v3)
        c.wait_line("main", "published weekly-update v4", 90)
        check(card("q1")["id"] == q1["id"] and len([x for x in c.cards() if x.get("page")]) == 2, "one card per question")

        # answered on the page: the card closes, the page hears it
        st, _, _ = request(port, "POST", "/api/p/weekly-update/answer", {"block": "q1", "option": 2})
        check(st == 403, "an answer without the token: %d" % st)
        st, _, r = request(port, "POST", "/api/p/weekly-update/answer", {"block": "q1", "option": 2}, {"Origin": origin, "X-Bise-Token": token})
        check(st == 200 and json.loads(r)["reply"] == "wait for Marc", "the answer: %d %s" % (st, r))
        c.wait(lambda: sse.seen("answered", lambda d: d == {"block": "q1", "reply": "wait for Marc"}), 30, "SSE answered q1")
        c.wait(lambda: card("q1") is None, 30, "q1's card closed")
        c.wait(lambda: any("wait for Marc" in l for l in c.lines("main")), 30, "main reads the answer")
        st, _, _ = request(port, "POST", "/api/p/weekly-update/answer", {"block": "q1", "option": 1}, {"Origin": origin, "X-Bise-Token": token})
        check(st == 409, "answered twice: %d" % st)
        # answered from the capsule or the TUI (/answer N 1): its words on the page
        c.say("/answer %d 1" % q2["id"])
        c.wait(lambda: sse.seen("answered", lambda d: d == {"block": "q2", "reply": "yes"}), 30, "SSE answered q2")
        c.wait(lambda: card("q2") is None, 30, "q2's card closed")
        st, _, home = request(port, "GET", "/")
        li = [l for l in home.split("<li") if 'data-page="weekly-update"' in l]
        check(li and "data-asking" not in li[0], "nothing asked any more: %r" % li)

        # §4.4 the frame's versions, newest first
        st, _, vs = request(port, "GET", "/p/weekly-update/versions")
        vs = json.loads(vs)["versions"]
        check(st == 200 and [v["n"] for v in vs] == [4, 3, 2, 1] and vs[0]["latest"], "versions: %r" % vs)
        check(sorted(vs[1]["changed"]) == ["q1", "q2"] and vs[0]["changed"] == [], "what each changed: %r" % vs)

        # sb page start (m_5000): the page shows at once, writing, empty
        settle(c)
        # subscribed before it exists: the scripted turn ends at once
        plan = Sse(port, "/p/the-plan/events")
        c.say('[[bash: sb page start the-plan --title "the plan" --ask "plan my week"]]')
        c.wait_line("main", "started the-plan", 90)
        c.wait(lambda: any(e.get("ev") == "page" and e.get("id") == "the-plan" and e.get("state") == "writing" for e in c.events), 10, "a writing page event")
        st, _, body = request(port, "GET", "/p/the-plan")
        check(st == 200 and 'data-version="0"' in body and 'data-agent="main"' in body, "the placeholder: %d %s" % (st, body[-400:]))
        check('data-ask="plan my week"' in body and 'data-started="' in body, "the ask and the start: %s" % body[-400:])
        c.wait(lambda: plan.seen("state", lambda d: d["state"] == "writing"), 10, "SSE writing")
        # its turn ends with no publish: ready, still no version, and why
        settle(c)
        c.wait(lambda: plan.seen("state", lambda d: d == {"state": "ready", "reason": "the turn ended without a page"}), 30, "the placeholder back to ready, with its reason")
        m = json.loads(request(port, "GET", "/p/the-plan/meta")[2])
        check(m["versions"] == [] and m["state"] == "ready", "no version yet: %r" % m)
        # another agent's page needs that agent; the first publish is v1
        c.say('[[bash: sb page start x-plan --agent nobody]]')
        c.wait_line("main", "no agent nobody", 90)
        settle(c)
        c.say('[[bash: sb page start the-plan && sb page publish %s --id the-plan]]' % v1)
        c.wait_line("main", "published the-plan v1", 90)
        c.wait(lambda: plan.seen("state", lambda d: d["state"] == "writing") and plan.seen("version", lambda d: d["n"] == 1), 30, "writing, then v1")
        m = json.loads(request(port, "GET", "/p/the-plan/meta")[2])
        check([v["n"] for v in m["versions"]] == [1] and m["state"] == "ready", "the first publish is v1: %r" % m)

        # a question with no open card (a fixture page written on disk,
        # amb-kit m_5336): the pick still closes the loop, as a sent
        # 'pick' note to the page's agent, and the page hears 'answered'
        settle(c)
        fx = os.path.join(E.state, "pages", "fixture-q")
        os.makedirs(fx)
        open(os.path.join(fx, "v1.html"), "w").write(PAGE_V3)
        json.dump({"id": "fixture-q", "title": "fixture", "agent": "main", "created_ms": 1,
                   "versions": [{"n": 1, "at_ms": 1, "blocks": []}], "state": "ready"}, open(os.path.join(fx, "meta.json"), "w"))
        json.dump([{"block": "q1", "text": "post now?", "options": ["post now", "wait for Marc"], "card": 0}], open(os.path.join(fx, "questions.json"), "w"))
        fq = Sse(port, "/p/fixture-q/events")
        st, _, r = request(port, "POST", "/api/p/fixture-q/answer", {"block": "q1", "option": 1}, {"Origin": origin, "X-Bise-Token": token})
        check(st == 200, "a pick with no card: %d %s" % (st, r))
        c.wait(lambda: fq.seen("answered", lambda d: d == {"block": "q1", "reply": "post now"}), 30, "SSE answered with no card")
        c.wait(lambda: any("you sent 1 note" in l and "fixture-q" in l for l in c.lines("main")), 30, "the pick note in main's feed")
        notes = json.loads(request(port, "GET", "/p/fixture-q/meta")[2])["notes"]
        check([(n["kind"], n["block"], n["text"], n["status"]) for n in notes] == [("pick", "q1", "post now", "sent")], "the pick note: %r" % notes)
        st, _, _ = request(port, "POST", "/api/p/fixture-q/answer", {"block": "q1", "option": 2}, {"Origin": origin, "X-Bise-Token": token})
        check(st == 409, "picked twice: %d" % st)

        # (amb-home) slice C: an item's agent shows live on the page
        # ('agent' frames for each data-agent of the latest version, at
        # connect and on each change), and start notes go to main
        settle(c)
        c.say("/new fixer: stay around")
        c.wait_status("fixer", "idle", 90)
        bugs = os.path.join(E.tmp, "bugs.html")
        open(bugs, "w").write(BUGS)
        c.say('[[bash: sb page publish %s --id bugs --title "bugs today"]]' % bugs)
        c.wait_line("main", "published bugs v1", 90)
        settle(c)
        bs = Sse(port, "/p/bugs/events")
        c.wait(lambda: bs.seen("agent", lambda d: d["name"] == "fixer" and d["status"] == "idle"), 15, "fixer idle at connect")
        c.say("[[bash: sleep 2]]", focus="fixer")
        c.wait(lambda: bs.seen("agent", lambda d: d["name"] == "fixer" and d["status"] == "working"), 30, "fixer working, live")
        c.wait(lambda: bs.seen("agent", lambda d: d["name"] == "fixer" and d["status"] == "idle" and bs.frames.index(("agent", d)) > 1), 30, "fixer idle again")
        check(not bs.seen("agent", lambda d: d["name"] != "fixer"), "only the items' agents")
        st, _, _ = request(port, "POST", "/api/p/bugs/notes", {"notes": [{"block": "b2", "quote": "CSV export", "kind": "start"}]}, {"Origin": origin, "X-Bise-Token": token})
        check(st == 200, "a start note: %d" % st)
        n_main = len(c.lines("main"))
        st, _, sent = request(port, "POST", "/api/p/bugs/send", {}, {"Origin": origin, "X-Bise-Token": token})
        check(st == 200 and json.loads(sent)["sent"] == 1, "send the start note: %s" % sent)
        c.wait(lambda: any("you asked for an agent on these items" in l for l in c.lines("main")[n_main:]), 30, "the start message to main")
        check(any("page-start" in l and "b2" in l for l in c.lines("main")[n_main:]), "its <page-start> block")
        check(not any("you sent 1 note" in l for l in c.lines("main")[n_main:]), "no notes message for a start note")
        check(not bs.seen("state", lambda d: d["state"] == "updating"), "a start note alone never puts the page in updating")
        # main's turn on that message is over (else the next [[bash]]
        # steers into it and the scripted model answers the first one)
        c.wait(lambda: any("assistant: ack: you asked for an agent" in l for l in c.lines("main")[n_main:]), 60, "main's turn on the start message")
        settle(c)
        notes = json.loads(request(port, "GET", "/p/bugs/meta")[2])["notes"]
        check([(n["kind"], n["status"], n.get("to")) for n in notes] == [("start", "sent", "main")], "the start note, routed: %r" % notes)

        # (amb-home) slice A: --went, kept in the meta and pushed as 'went'
        c.say('[[bash: sb page publish %s --id bugs --went "gmail-draft:r-1@reply-nina=https://mail.google.com/mail/#drafts/r-1"]]' % bugs)
        c.wait_line("main", "published bugs v2", 90)
        c.wait(lambda: bs.seen("went", lambda d: [w["ref"] for w in d["went"]] == ["r-1"]), 15, "went on the stream")
        m = json.loads(request(port, "GET", "/p/bugs/meta")[2])
        w = m["went"][0]
        check((w["kind"], w["block"], w["url"]) == ("gmail-draft", "reply-nina", "https://mail.google.com/mail/#drafts/r-1") and w["at"] > 0, "meta.went: %r" % m["went"])
        settle(c)
        c.say('[[bash: sb page publish %s --id bugs --went "gmail-draft:r-1=https://mail.google.com/mail/#drafts/r-1b" --went "kit-draft:42=https://app.kit.com/b/42"]]' % bugs)
        c.wait_line("main", "published bugs v3", 90)
        m = json.loads(request(port, "GET", "/p/bugs/meta")[2])
        check([(w["kind"], w["url"]) for w in m["went"]] == [("gmail-draft", "https://mail.google.com/mail/#drafts/r-1b"), ("kit-draft", "https://app.kit.com/b/42")], "the same draft replaced, another added: %r" % m["went"])
        bs2 = Sse(port, "/p/bugs/events")
        c.wait(lambda: bs2.seen("went", lambda d: len(d["went"]) == 2) and bs2.seen("agent", lambda d: d["name"] == "fixer"), 15, "went and the agents at connect")
        settle(c)
        c.say('[[bash: sb page publish %s --id bugs --went "gmail-draft:r-1=file:///etc/passwd"]]' % bugs)
        c.wait_line("main", "must be an http(s) link", 90)
        check(json.loads(request(port, "GET", "/p/bugs/meta")[2])["versions"][-1]["n"] == 3, "a bad --went publishes nothing")

        # (amb-home) roadmap B: a watched page. sb every --page puts the
        # timer in the state, meta.watch and SSE 'watch'; the page's stop
        # note ends it with no model turn; the menu's every_stop op too
        settle(c)
        c.say('[[bash: sb page publish %s --id launch-watch --title "the launch" && sb every 1h "check HN and republish" --page launch-watch --until 2h]]' % v1)
        c.wait_line("main", "timer set", 90)
        settle(c)
        timers = (c.state or {}).get("timers", [])
        lw = [t for t in timers if t.get("page") == "launch-watch"]
        check(len(lw) == 1 and lw[0]["label"] == "every 1h" and lw[0]["agent"] == "main" and "until_ms" in lw[0], "the timer in the state: %r" % timers)
        tid = lw[0]["id"]
        m = json.loads(request(port, "GET", "/p/launch-watch/meta")[2])
        check(m.get("watch", {}).get("timer") == tid and m["watch"]["every"] == "every 1h" and m["watch"]["checked_ms"] > 0 and m["watch"]["until_ms"], "meta.watch: %r" % m.get("watch"))
        ws = Sse(port, "/p/launch-watch/events")
        c.wait(lambda: ws.seen("watch", lambda d: d and d["timer"] == tid), 15, "watch at connect")
        st, _, _ = request(port, "POST", "/api/p/launch-watch/notes", {"notes": [{"block": "frame", "kind": "stop"}]}, {"Origin": origin, "X-Bise-Token": token})
        check(st == 200, "a stop note: %d" % st)
        n_main = len(c.lines("main"))
        st, _, sent = request(port, "POST", "/api/p/launch-watch/send", {}, {"Origin": origin, "X-Bise-Token": token})
        check(st == 200, "send the stop: %s" % sent)
        c.wait(lambda: ws.seen("watch", lambda d: d is None), 15, "watch null after the stop")
        c.wait(lambda: any("the user stopped timer #%d" % tid in l for l in c.lines("main")[n_main:]), 30, "main hears the stop from bise")
        check(not any("you sent 1 note" in l for l in c.lines("main")[n_main:]), "no notes message for a stop")
        c.wait(lambda: not any(t["id"] == tid for t in (c.state or {}).get("timers", [])), 15, "the timer gone from the state")
        m = json.loads(request(port, "GET", "/p/launch-watch/meta")[2])
        check("watch" not in m and [n["status"] for n in m["notes"]] == ["done"], "no watch, the stop note done: %r" % m)
        settle(c)
        c.say('[[bash: sb every 1h "later" --page launch-watch]]')
        lwt = lambda: [t for t in (c.state or {}).get("timers", []) if t.get("page") == "launch-watch"]
        c.wait(lambda: lwt(), 90, "a second watch timer")
        settle(c)
        t2 = lwt()[0]["id"]
        c.wait(lambda: ws.seen("watch", lambda d: d and d["timer"] == t2), 15, "watching again")
        c.send({"op": "every_stop", "id": t2})
        c.wait(lambda: ws.seen("watch", lambda d: d is None) and not (c.state or {}).get("timers"), 15, "the menu's stop")

        # roadmap D: a 6-step plan, bise does 4 and asks for 2, all
        # ticked, none forgotten (plus a second checklist answered on its card)
        def plan_html(done):
            rows = [("t1", ""), ("t2", "yours"), ("t3", ""), ("t4", ""), ("t5", "yours"), ("t6", "")]
            lis = "".join('<li data-id="%s"%s%s>step %s</li>' % (i, ' data-who="yours"' if w else "", " data-done" if i in done else "", i) for i, w in rows)
            return ('<section data-kit="checklist" data-id="steps"><ol>%s</ol></section>'
                    '<section data-kit="checklist" data-id="other"><ol><li data-id="o1" data-who="yours">sign the form</li></ol></section>' % lis)

        def publish_plan(done, n):
            f = os.path.join(E.tmp, "plan-%d.html" % n)
            open(f, "w").write(plan_html(done))
            settle(c)
            c.say('[[bash: sb page publish %s --id plan --title "buy the domain"]]' % f)
            c.wait_line("main", "published plan v%d" % n, 90)

        def step_card(item):
            return next((x for x in c.cards() if (x.get("page") or {}).get("item") == item), None)

        ps = Sse(port, "/p/plan/events")
        publish_plan([], 1)
        # t1 is bise's and not done: no card for t2 yet; o1 opens its block
        c.wait(lambda: step_card("o1"), 30, "o1's card")
        check(step_card("t2") is None, "t2 waits for t1")
        o1 = step_card("o1")
        check(o1["page"]["block"] == "other" and o1["page"]["url"].endswith("/p/plan#o1") and o1["kind"] == "question", "o1's card: %r" % o1)
        # answered 'done' on its card: ticked on the page, its agent told
        c.say("/answer %d 1" % o1["id"])
        c.wait(lambda: ps.seen("ticked", lambda d: d == {"block": "other", "item": "o1"}), 30, "SSE ticked o1")
        c.wait(lambda: step_card("o1") is None, 30, "o1's card closed")
        c.wait(lambda: any("you sent 1 note" in l and "plan v1" in l for l in c.lines("main")), 30, "the tick in main's feed")
        # bise does t1: t2's turn comes
        publish_plan(["t1"], 2)
        c.wait(lambda: step_card("t2"), 30, "t2's card")
        # ticked on the page (a draft): its card closes at once
        st, _, _ = request(port, "POST", "/api/p/plan/notes", {"notes": [{"block": "steps", "item": "t2", "kind": "tick"}]}, {"Origin": origin, "X-Bise-Token": token})
        check(st == 200, "a tick on the page: %d" % st)
        c.wait(lambda: step_card("t2") is None, 30, "t2's card closed by the page's tick")
        # bise does t3 and t4: t5's turn; 'done with the payment' from the capsule names it to main
        publish_plan(["t1", "t3", "t4"], 3)
        c.wait(lambda: step_card("t5"), 30, "t5's card")
        settle(c)
        c.send({"op": "input", "focus": "main", "text": "done with the payment", "via": "capsule"})
        c.wait(lambda: any("his open steps: plan t5" in l for l in c.lines("main")), 30, "the open step in main's input")
        settle(c)
        c.say("[[bash: sb page tick plan t5]]")
        c.wait_line("main", "ticked plan t5", 90)
        c.wait(lambda: ps.seen("ticked", lambda d: d == {"block": "steps", "item": "t5"}), 30, "SSE ticked t5")
        c.wait(lambda: step_card("t5") is None, 30, "t5's card closed")
        # bise does t6: every row done or ticked, no card left, none forgotten
        publish_plan(["t1", "t3", "t4", "t6"], 4)
        notes = json.loads(request(port, "GET", "/p/plan/meta")[2])["notes"]
        ticks = sorted(n.get("item") for n in notes if n["kind"] == "tick")
        check(ticks == ["o1", "t2", "t5"], "his steps all ticked: %r" % notes)
        check(not [x for x in c.cards() if (x.get("page") or {}).get("id") == "plan"], "no card left for the plan")

        # a task's page (pm's 25): its first row is his, so its card comes at
        # publish; a question on it gets its card too (sb-core makes cards
        # for main only: the hub asks as main, answers on the page's path)
        tp = os.path.join(E.tmp, "task-plan.html")
        open(tp, "w").write('<section data-kit="checklist" data-id="steps"><ol>'
                            '<li data-id="s1" data-who="yours">pay the domain</li><li data-id="s2">point the DNS</li></ol></section>'
                            + PAGE_V3.split(PAGE_V2)[1])
        settle(c)
        c.say('/new t4: {{bash: sb page publish %s --id task-plan --title "task plan"}}' % tp)
        c.wait(lambda: step_card("s1"), 120, "the first row's card, on a task's page")
        c.wait(lambda: any((x.get("page") or {}).get("id") == "task-plan" and (x.get("page") or {}).get("block") == "q1" for x in c.cards()), 30, "the task page's question card")
        tq = next(x for x in c.cards() if (x.get("page") or {}).get("id") == "task-plan" and (x.get("page") or {}).get("block") == "q1")
        tps = Sse(port, "/p/task-plan/events")
        c.say("/answer %d 2" % tq["id"])
        c.wait(lambda: tps.seen("answered", lambda d: d == {"block": "q1", "reply": "wait for Marc"}), 30, "the task page's answer on the page")
        c.say("/answer %d done" % step_card("s1")["id"])
        c.wait(lambda: tps.seen("ticked", lambda d: d == {"block": "steps", "item": "s1"}), 30, "the task page's step ticked")
        # q2 (PAGE_V3's second question) stays asked; s1 and q1 are done
        left = lambda: sorted((x["page"].get("item") or x["page"]["block"]) for x in c.cards() if (x.get("page") or {}).get("id") == "task-plan")
        c.wait(lambda: left() == ["q2"], 30, "only q2 left on the task's page")
        # sb page waiting (amb-kit m_5762): what waits on him, one line each
        settle(c)
        c.say("[[bash: sb page waiting]]")
        c.wait_line("main", "task-plan#q2 · question · add the March chart?", 90)
        check(not any("task-plan#s1" in l or "task-plan#q1 " in l for l in c.lines("main")[-40:]), "answered and ticked items wait no more")

        # a drafted step of bise's before one of his (pm's D fail 30): the
        # draft waits for his word, so it is his turn: its card comes; his
        # send approves the draft, then his own step's card comes
        lp = os.path.join(E.tmp, "legal-plan.html")
        open(lp, "w").write('<section data-kit="checklist" data-id="plan"><ol>'
                            '<li data-id="d1" data-who="bise" data-did="drafted" data-draft="mail-legal">ask legal</li>'
                            '<li data-id="d2" data-who="yours">sign the renewal</li></ol></section>'
                            '<section data-kit="email" data-id="mail-legal" data-verb="draft"><p data-field="to">legal</p>'
                            '<p data-field="subject">the renewal</p><p>can we sign?</p></section>')
        settle(c)
        c.say('[[bash: sb page publish %s --id legal-plan --title "legal plan"]]' % lp)
        c.wait(lambda: step_card("d1"), 90, "the drafted step's card")
        check(step_card("d1")["text"].startswith("ask legal: send the draft?"), "its card asks to send: %r" % step_card("d1"))
        check(not step_card("d2"), "his step waits for the draft")
        c.say("/answer %d 1" % step_card("d1")["id"])
        c.wait(lambda: step_card("d2") and not step_card("d1"), 30, "sent: his own step's card comes")
        notes = json.loads(request(port, "GET", "/p/legal-plan/meta")[2])["notes"]
        check(any(n["kind"] == "approve" and n["block"] == "mail-legal" for n in notes), "his send approves the draft: %r" % notes)

        # a copied page whose question names a card this hub never had,
        # read at the hub's start (pm's m_5456): the first pick is no 409,
        # the page hears it, the pick goes as a note
        fs = os.path.join(E.state, "pages", "fixture-stale")
        os.makedirs(fs)
        open(os.path.join(fs, "v1.html"), "w").write(PAGE_V3)
        json.dump({"id": "fixture-stale", "title": "stale", "agent": "main", "created_ms": 1,
                   "versions": [{"n": 1, "at_ms": 1, "blocks": []}], "state": "ready"}, open(os.path.join(fs, "meta.json"), "w"))
        json.dump([{"block": "q1", "text": "post now?", "options": ["post now", "wait for Marc"], "card": 9999}], open(os.path.join(fs, "questions.json"), "w"))
        settle(c)
        E.stop_hub()
        c = E.start_hub()
        c.wait_status("main", "idle", 60)
        port = int(open(os.path.join(E.state, "pages.port")).read().strip())
        origin = "http://127.0.0.1:%d" % port
        st, _, body = request(port, "GET", "/p/fixture-stale")
        token = body.split('<meta name="bise-token" content="')[1].split('"')[0]
        fss = Sse(port, "/p/fixture-stale/events")
        st, _, r = request(port, "POST", "/api/p/fixture-stale/answer", {"block": "q1", "option": 2}, {"Origin": origin, "X-Bise-Token": token})
        check(st == 200, "the first pick on a stale card: %d %s" % (st, r))
        c.wait(lambda: fss.seen("answered", lambda d: d == {"block": "q1", "reply": "wait for Marc"}), 30, "SSE answered on the stale page")

        # pm's B (m_5765): a reader polling a page while its agent republishes
        # it 20 times always gets a whole answer, never a dropped connection
        # (first the stale page's pick reaches main as a note: let that turn
        # end, or our command lands in the same turn and is never run)
        c.wait_line("main", 'on your page "stale"', 60)
        c.wait_idle("main")
        busy = os.path.join(E.tmp, "busy.html")
        open(busy, "w").write(PAGE_V1)
        c.say('[[bash: sb page publish %s --id busy-watch --title "busy watch"]]' % busy)
        c.wait_line("main", "published busy-watch v1", 90)
        c.wait_idle("main")
        polls = {"n": 0, "bad": []}
        stop = threading.Event()

        def poll():
            while not stop.is_set():
                for path in ("/p/busy-watch/meta", "/p/busy-watch"):
                    try:
                        st, _, b = request(port, "GET", path)
                        if st != 200 or (path.endswith("/meta") and json.loads(b).get("id") != "busy-watch"):
                            polls["bad"].append("%s: %s" % (path, st))
                    except Exception as e:  # a dropped connection is the bug
                        polls["bad"].append("%s: %r" % (path, e))
                    polls["n"] += 1
        t = threading.Thread(target=poll, daemon=True)
        t.start()
        # a failed publish says which one and why (amb-core m_5830)
        c.say('[[bash: n=0; for i in $(seq 2 21); do out=$(sb page publish %s --id busy-watch 2>&1) && n=$((n+1)) || echo "FAILED $i: $out"; done; echo "republished $n"]]' % busy)
        c.wait_line("main", "republished", 180)
        stop.set()
        t.join(20)
        last = lambda: json.loads(request(port, "GET", "/p/busy-watch/meta")[2])["versions"][-1]["n"]
        try:
            c.wait(lambda: last() == 21, 15, "busy-watch at v21")
        except AssertionError:
            pass
        said = [l for l in c.lines("main") if "FAILED" in l or "republished " in l]
        check(last() == 21, "20 republishes: v%s, main's bash said: %s" % (last(), said[-4:]))
        check(polls["n"] > 20 and not polls["bad"], "%d reads during the republishes, bad: %s" % (polls["n"], polls["bad"][:3]))
    except AssertionError as e:
        print("FAIL", e)
        ok = False
        # what main and the hub said last, to see why
        try:
            for l in c.lines("main")[-12:]:
                print("  main:", l[:300])
            print(open(os.path.join(E.tmp, "hub.stderr")).read()[-1500:])
        except Exception:
            pass
    finally:
        E.close()
    print("ambient_pages_e2e:", "ok" if ok else "FAILED")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
