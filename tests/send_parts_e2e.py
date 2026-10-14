"""Agents send images and files to each other (send-parts, architect
m_23962), on a throwaway hub with the fake provider and the TUI in tmux.
Fake data only: a temp HOME, a tiny PNG and a CSV made here.

  1. main's `sb spawn t1 --attach <png>`: t1's first request carries the
     image as an image part (data:image/png), its brief keeps the parts;
  2. main's `sb send t1 --attach <png> --attach <csv in main's TMPDIR>`:
     t1's request has the image part and `<file name="[File #2]" ...>`
     naming a copy in t1's own TMPDIR; t1's thread has the msg-parts line,
     and its entry (thread/subscribe) carries the parts;
  3. his message to main with an image, then main's
     `sb send t1 --attach m_<n>`: t1's request has his image;
  4. refused at the door, nothing sent: a path sb can't read, an m_<n>
     the hub doesn't hold (another agent's message: attach_tests);
  5. the TUI draws the attachment as a chip `▣ …` on main's message row,
     never the `<image …>` marker.

Run: python3 -u tests/send_parts_e2e.py (after scripts/bins.sh)
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
import wait  # noqa: E402
from e2e import EXE, check  # noqa: E402
from proto_rpc import ok as answered, req  # noqa: E402
from tui_tmux import tui_session, run  # noqa: E402


def journal(state):
    try:
        return [json.loads(l) for l in open(os.path.join(state, "journal.jsonl")) if l.strip()]
    except FileNotFoundError:
        return []


def sent(state, needle):
    """The messages whose text has `needle` (the journal's message_sent)."""
    return [e["msg"] for e in journal(state) if e.get("type") == "message_sent" and needle in e["msg"]["text"]]


def images_to(E, agent, needle, since=0):
    """`agent`'s requests from `since` that hold `needle` and an image part."""
    return [r for r in E.fake_requests()[since:]
            if r.get("agent") == agent and needle in json.dumps(r)
            and any(i.startswith("data:image/png;base64,") for i in r.get("images", []))]


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: scripts/bins.sh")
    E = e2e.Env()
    png = os.path.join(E.tmp, "shelf.png")
    with open(png, "wb") as f:
        f.write(e2e.tiny_png())
    with tui_session(150, 42, E=E) as t:
        t.wait("bise :*", 90)
        sock = os.path.join(E.state, "hub.sock")
        wait.until(lambda: os.path.exists(sock), 30, "the TUI's hub")
        c = e2e.Client(sock)
        c.wait_status("main", "idle", 60)

        # 1. a spawn with an image: t1's model sees it
        c.say('[[bash: sb spawn t1 --objective "what is on the shelf? {{bash: echo seen}}" --attach %s]]' % png)
        c.wait(lambda: c.agent("t1") is not None, 60, "t1 exists")
        wait.until(lambda: images_to(E, "t1", "what is on the shelf"), 90, "t1's first request carries the image")
        brief = [m for m in sent(E.state, "what is on the shelf") if m["to"] == "t1"]
        check(brief and json.loads(brief[0].get("parts") or "[]")[0] == {"kind": "text", "text": "# Task `t1`\n\n"},
              "the brief keeps its parts, the head in front: %r" % brief[:1])
        c.wait_idle("main", "t1")

        # 2. a send with an image and a file of main's tmp
        mtmp = os.path.join(E.state, "agents", "main", "tmp")
        os.makedirs(mtmp, exist_ok=True)
        csv = os.path.join(mtmp, "notes.csv")
        with open(csv, "w") as f:
            f.write("a,b\n1,2\n")
        n = len(E.fake_requests())
        c.say('[[bash: sb send t1 --attach %s --attach %s "see these two"]]' % (png, csv))
        wait.until(lambda: images_to(E, "t1", "see these two", n), 90, "t1's request carries the image")
        copy = os.path.join(E.state, "agents", "t1", "tmp", "attached", "notes.csv")
        r = images_to(E, "t1", "see these two", n)[0]
        check('<file name=\\"[File #2]\\" path=\\"%s\\">' % copy in json.dumps(r), "the file by its copy in t1's tmp: %s" % json.dumps(r)[-600:])
        check(os.path.isfile(copy) and open(copy).read() == "a,b\n1,2\n", "the copy is there")
        m = sent(E.state, "see these two")[-1]
        recs = [x for x in c.feed("t1", "msg-parts") if x.get("id") == m["id"]]
        check(len(recs) == 1, "t1's thread has its msg-parts line by id: %r" % c.feed("t1", "msg-parts"))
        th = req(c, "thread/subscribe", agent="t1")
        es = [e for e in (th.get("result") or {}).get("entries", []) if e.get("msg") == m["id"]]
        check(es and [p["kind"] for p in es[0].get("parts", [])] == ["text", "image", "file"], "t1's entry carries the parts: %r" % es[:1])
        c.wait_idle("main", "t1")

        # 3. his image, forwarded by reference
        d = e2e.Client(sock, name="window")
        answered(req(d, "turn/send", agent="main", text="", mode="now",
                     parts=[{"kind": "text", "text": "this one is broken "}, {"kind": "image", "name": "[Image #1]", "source": png}]), "his image sent")
        wait.until(lambda: sent(E.state, "this one is broken"), 15, "his message")
        his = sent(E.state, "this one is broken")[0]["id"]
        c.wait_idle("main")
        n = len(E.fake_requests())
        c.say('[[bash: sb send t1 --attach m_%d "the user shows you this"]]' % his)
        wait.until(lambda: images_to(E, "t1", "the user shows you this", n), 90, "t1 sees his image")
        c.wait_idle("main", "t1")

        # 4. refused at the door: nothing sent
        n = len(E.fake_requests())

        def refused():
            return [r for r in E.fake_requests()[n:] if r.get("agent") == "main"
                    and "cannot read it" in json.dumps(r) and "too old to forward" in json.dumps(r)]
        c.say('[[bash: sb send t1 --attach /no/such.png "never"; sb send t1 --attach m_9999 "nor this"]]')
        wait.until(refused, 90, "main's model reads the words of both refusals")
        to_t1 = [m for m in sent(E.state, "never") + sent(E.state, "nor this") if m["from"] == "main" and m["to"] == "t1"]
        check(not to_t1, "nothing sent to t1: %r" % to_t1)

        # 5. the TUI: the chip, never the marker
        sc = t.wait("▣", 40)
        check("<image name=" not in sc and "<file name=" not in sc, "no raw marker on screen:\n" + sc)
        print("send_parts_e2e: ok")


if __name__ == "__main__":
    run(main)
