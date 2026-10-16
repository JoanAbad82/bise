"""page-answer-row: his answer on a page shows as a clean answer row in
the terminal (tmux, fake provider, a throwaway hub, a fake page), his
words alone, never the message the agent gets (its 'you sent 1 note on
your page', the 'answer with: sb page publish' hint, the <page-notes>
JSON, the '[from the page: …]' line):

1. main publishes a page with a question: its card opens in the inbox;
   he picks its option there: one row, '✓ you answered main' with his
   words, not twice (the card's own fold, the hub's entry skipped);
2. he picks on the page itself (the page's answer API): the same row,
   with what the card asked;
3. he sends a note on the page: 'you sent main a note on ↗ <title>' and
   his note under it (designer m_20985: a note is not an answer).
At 150 and 80 columns.

python3 -u tests/tui_page_answer_tmux.py
"""
import http.client
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tui_tmux import tui_session, run, in_view, MAIN_IDLE  # noqa: E402
from words import w  # noqa: E402

CTRL = "\x1b[%d;5u"   # ctrl+digit, the kitty keyboard protocol's form

PAGE = (
    '<section data-kit="prose" data-id="p1"><p>the plan: ship the table.</p></section>\n'
    '<section data-kit="question" data-id="q1"><p>which table first?</p>'
    '<ol><li>the effort table now</li><li>the API lists later</li></ol></section>\n'
    '<section data-kit="question" data-id="q2"><p>read the lists from the API?</p>'
    '<ol><li>yes, right after the table</li><li>no</li></ol></section>\n'
)

# what only the agent gets: never on his screen
TEMPLATE = ["you sent 1 note", "answer with:", "sb page publish <file>", "page-notes", "[from the page", "--notes-done"]


def request(port, method, path, body=None, headers=None):
    c = http.client.HTTPConnection("127.0.0.1", port, timeout=10)
    h = {"Host": "127.0.0.1:%d" % port}
    h.update(headers or {})
    data = json.dumps(body).encode() if body is not None else None
    if data is not None:
        h["Content-Type"] = "application/json"
    c.request(method, path, body=data, headers=h)
    r = c.getresponse()
    out = (r.status, r.read().decode())
    c.close()
    return out


def his_rows(sc):
    """The screen without the agent's replies: the fake provider answers
    `ack: <what it got>`, the template whole; that is the agent's words,
    not his row. A reply runs from its `ack:` line to the next blank row."""
    out, reply = [], False
    for row in sc.splitlines():
        body = row.split("│")[1] if row.count("│") >= 2 else row
        if "ack: " in body:
            reply = True
        elif not body.strip():
            reply = False
        if not reply:
            out.append(row)
    return "\n".join(out)


def clean(sc):
    bad = [w for w in TEMPLATE if w in his_rows(sc)]
    assert not bad, "the agent's template on his screen %r:\n%s" % (bad, sc)


def one(t, cols, rows):
    with tui_session(cols, rows, env="BISE_CTRL_DIGITS=1") as t:
        t.wait("bise :*")
        t.wait_re(MAIN_IDLE)
        page = os.path.join(t.E.tmp, "plan.html")
        open(page, "w").write(PAGE)
        t.typed('[[bash: sb page publish %s --id plan --title "the plan"]]' % page)
        t.keys("Enter")
        t.wait(w("common.waiting_for_you", n="2"), 90)
        # 1. his pick in the terminal's inbox
        t.typed(CTRL % ord("1"))
        t.wait("which table first?")
        t.keys("Right")
        t.keys("Enter")
        t.wait(w("thread.answered_to", who="main"))
        t.keys("Escape")
        t.wait_re(in_view("main"))
        sc = t.wait("the effort table now")
        clean(sc)
        assert sc.count(w("thread.answered_to", who="main")) == 1, "one answer row, not doubled:\n" + sc
        # 2. his pick on the page itself
        port = int(open(os.path.join(t.E.state, "pages.port")).read().strip())
        st, body = request(port, "GET", "/p/plan")
        assert st == 200, (st, body[:200])
        token = body.split('<meta name="bise-token" content="')[1].split('"')[0]
        hdr = {"Origin": "http://127.0.0.1:%d" % port, "X-Bise-Token": token}
        st, body = request(port, "POST", "/api/p/plan/answer", {"block": "q2", "option": 1}, hdr)
        assert st == 200, (st, body)
        sc = t.wait("yes, right after the table")
        t.wait("read the lists from the API?")
        clean(t.screen())
        # 3. a note on the page
        st, body = request(port, "POST", "/api/p/plan/notes", {"notes": [{"block": "p1", "kind": "note", "text": "make it shorter"}]}, hdr)
        assert st == 200, (st, body)
        st, body = request(port, "POST", "/api/p/plan/send", {}, hdr)
        assert st == 200, (st, body)
        t.wait("you sent main a note on ↗ the plan")
        sc = t.wait("make it shorter")
        clean(sc)
        print(sc)


def main():
    for cols, rows in ((150, 42), (80, 40)):
        one(None, cols, rows)
        print("PASS page answer rows at %d cols" % cols)


if __name__ == "__main__":
    run(main)
