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
        c.wait_idle("main")
        check(not os.path.exists(os.path.join(E.state, "pages", "weekly-update")), "a refused page stores nothing")

        # main publishes
        c.say('[[bash: sb page publish %s --id weekly-update --title "weekly update"]]' % v1)
        c.wait_line("main", "published weekly-update v1", 90)
        c.wait_idle("main")
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
        c.wait_idle("main")
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
        c.wait_idle("main")
        c.say('/new t1: {{bash: sb page publish %s --id t1-page --title "t1 page"}}' % v1)
        c.wait(lambda: any(p["id"] == "t1-page" for p in (c.state or {}).get("pages", [])), 120, "t1's page")
        check(json.loads(request(port, "GET", "/p/t1-page/meta")[2])["agent"] == "t1", "t1 owns its page")
        c.wait_idle("main", "t1")
        c.say("/archive t1 --force")
        c.wait_status("t1", ["archived", "stopped"], 60)
        c.wait_idle("main")
        st, _, _ = request(port, "POST", "/api/p/t1-page/notes", {"notes": [{"block": "p1", "kind": "drop"}]}, {"Origin": origin, "X-Bise-Token": token})
        check(st == 200, "a note on t1's page: %d" % st)
        st, _, _ = request(port, "POST", "/api/p/t1-page/send", {}, {"Origin": origin, "X-Bise-Token": token})
        check(st == 200, "send on t1's page: %d" % st)
        c.wait(lambda: any("you sent 1 note" in l and "t1-page v1" in l for l in c.lines("main")), 30, "t1's notes in main's feed")
        c.wait_idle("main")
        c.say('[[bash: sb page publish %s --id t1-page --notes-done n1]]' % v2)
        c.wait_line("main", "published t1-page v2", 90)
        m = json.loads(request(port, "GET", "/p/t1-page/meta")[2])
        check(m["agent"] == "main" and m["notes"][0]["status"] == "done", "main took the page over: %r" % m)
    except AssertionError as e:
        print("FAIL", e)
        ok = False
    finally:
        E.close()
    print("ambient_pages_e2e:", "ok" if ok else "FAILED")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
