"""The popup over a selection, in a real terminal (tmux) against the
fake provider: a drag over the reply puts ` type to ask about it · tab
quote · cmd+c copy ` on the row right above the selection, at its first
column; typing takes the selection as a quote and the popup goes away.
(Space, tab and a click on the popup: tui_quote_keys_tmux.py.)

python3 -u tests/tui_select_popup_tmux.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import wait  # noqa: E402
from tui_tmux import tui_session, run, wait_until, MAIN_IDLE  # noqa: E402

COLS, ROWS = 120, 36
HINT = " type to ask about it · tab quote · cmd+c copy "


def main():
    with tui_session(COLS, ROWS) as t:
        t.wait("bise :*")
        t.wait_re(MAIN_IDLE)
        t.typed("the login breaks on safari")
        t.keys("Enter")
        t.wait("ack: the login breaks on safari")
        # the turn's end, then a settled screen: the reply's row is read
        # once, the drag aimed at it; read while the turn still ran (its
        # rows, the keybar, the marks move after the reply shows, seconds
        # later under load), the drag hit another row and no popup came
        t.wait_re(MAIN_IDLE)
        rows = wait.stable(t.screen, 10, "the screen after the turn").splitlines()
        y = max(i for i, r in enumerate(rows) if "ack: the login" in r)
        x = rows[y].find("login")
        # press, drag (SGR 1006: button 32 is the left one moving), release
        t.typed("\x1b[<0;%d;%dM\x1b[<32;%d;%dM\x1b[<0;%d;%dm" % (x + 1, y + 1, x + 7, y + 1, x + 7, y + 1))

        def shown():
            r = t.screen().splitlines()
            return HINT in r[y - 1] and r[y - 1].find(HINT) == x and "ack: the login" in r[y]

        wait_until(shown, 10, lambda: "the popup right above the selection:\n" + t.screen())
        t.typed("w")
        t.wait("❝ 1")
        wait_until(lambda: HINT not in t.screen(), 10, lambda: "typing puts the popup away:\n" + t.screen())
        print("PASS tui select popup")


if __name__ == "__main__":
    run(main)
