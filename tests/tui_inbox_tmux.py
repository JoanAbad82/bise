"""/inbox as a list (inbox-history pick A, designer m_24225 (7)) in a real
terminal (tmux) against the fake provider: one notification answered
(ctrl+1, → ⏎), one withdrawn, one waiting. /inbox shows the waiting one
on top, then today's: `✓ main  first: pick one` and `you: alpha · in the
inbox`, the withdrawn one `–` with `withdrawn: moot now`. ⏎ on the
answered one opens main's thread at his answer; esc comes back to the
list; esc again closes it. The screens at 150 and 80 columns are written
to $INBOX_SHOTS (designer's sign) when it is set.

python3 -u tests/tui_inbox_tmux.py
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tui_tmux import tui_session, run, in_view, tmux, MAIN_IDLE  # noqa: E402
from words import w  # noqa: E402

# the inbox's words, by key (bise_proto::words::inbox): a word designer changes moves this test
TODAY = w("inbox.day_today")
ALPHA = w("inbox.answered_at", said="alpha", place=w("inbox.where_inbox"))
MOOT = w("inbox.withdrawn", why="moot now")

COLS, ROWS = 150, 42
CTRL = "\x1b[%d;5u"   # ctrl+digit, the kitty keyboard protocol's form


def card(text):
    return "[[bash: sb card \"$(printf '%s')\"]]" % text


def shot(t, name):
    sc = t.screen()
    out = os.environ.get("INBOX_SHOTS")
    if out:
        os.makedirs(out, exist_ok=True)
        with open(os.path.join(out, name + ".txt"), "w") as f:
            f.write(sc)
    return sc


def main():
    with tui_session(COLS, ROWS, env="BISE_CTRL_DIGITS=1") as t:
        t.wait("bise :*")
        t.wait_re(MAIN_IDLE)
        t.typed(card("first: pick one\\n1. alpha\\n2. beta"))
        t.keys("Enter")
        t.wait("│ 1 ? main · first: pick one")
        # answered in the inbox: option 1, its words
        t.typed(CTRL % ord("1"))
        t.wait("┃ 1 alpha   2 beta")
        t.keys("Right")
        t.wait("⏎ alpha")
        t.keys("Enter")
        t.wait("✓ you answered main: alpha")
        t.wait_re(MAIN_IDLE)
        # one withdrawn, one left waiting
        t.typed(card("second: never mind") + " [[bash: sb card --withdraw 2 'moot now']]")
        t.keys("Enter")
        t.wait("withdrawn")
        t.wait_re(MAIN_IDLE)
        t.typed(card("third: ship the readme?"))
        t.keys("Enter")
        t.wait("third: ship the readme?")
        t.wait("#3 opened")
        # it may open in place (the box moved on after the answer): esc,
        # back to main's composer
        t.sync()
        if t.wait_any(["you → ? main · your answer", re.compile(MAIN_IDLE)])[0] == 0:
            t.keys("Escape")
            t.wait_gone("you → ? main · your answer")
        t.wait_re(MAIN_IDLE)
        # the list: waiting on top, then today's answers on two lines
        t.typed("/inbox")
        t.keys("Enter")
        sc = t.wait_all([w("inbox.list_waiting", n=1), "› 1  main  third: ship the readme?", TODAY,
                         "✓ main  first: pick one", ALPHA,
                         "– main  second: never mind", MOOT])
        assert sc.index(w("thread.gate_waits")) < sc.index(TODAY) < sc.index("✓ main"), sc
        shot(t, "inbox-150")
        tmux("resize-window", "-t", t.name, "-x", "80")
        t.wait_gone("╭─ " + w("inbox.head") + " · " + w("common.count_waiting", n=1))  # the frame redrawn narrow
        sc = t.wait_all(["› 1  main  third: ship the readme?", ALPHA])
        assert all(len(r.rstrip()) <= 80 for r in sc.splitlines()), sc
        shot(t, "inbox-80")
        tmux("resize-window", "-t", t.name, "-x", str(COLS))
        # ⏎ on the answered one: main's thread at his answer; esc: back
        # newest first: the withdrawn one (#2), then the answered one (#1)
        t.keys("Down")
        t.wait("› – main  second: never mind")
        t.keys("Down")
        t.wait("› ✓ main  first: pick one")
        t.keys("Enter")
        t.wait_gone(w("inbox.list_waiting", n=1))
        sc = t.wait("✓ you answered main: alpha")
        t.wait_re(in_view("main"))
        shot(t, "jumped-150")
        # esc: the list as he left it, the same row selected
        t.keys("Escape")
        t.wait_all(["› ✓ main  first: pick one", w("inbox.list_waiting", n=1)])
        t.keys("Escape")
        t.wait_gone(w("inbox.list_waiting", n=1))
        t.wait_re(in_view("main"))
    print("PASS tui inbox")


if __name__ == "__main__":
    run(main)
