"""Benjamin's bug in a real terminal (tmux) against the fake provider: he
was half way through an answer to an inbox item when a new item came in,
and his words were gone. Passes when, with item A open and half an answer
typed, a new item B arrives (main asks it a few seconds later, from the
same turn): A stays the open item, his words are all there and the caret
still types at their end, B waits as a row of the box (`2 waiting`); ⏎
answers A with all his words, and B opens next.

python3 -u tests/tui_card_draft_keep_tmux.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from words import w  # noqa: E402
from tui_tmux import tui_session, run, MAIN_IDLE  # noqa: E402

COLS, ROWS = 150, 42
CTRL = "\x1b[%d;5u"   # ctrl+digit, the kitty keyboard protocol's form
HALF = "warm but only after the reindex"


def box(sc):
    """The inbox box's lines (its border to its bottom), never the feed's
    card lines above it (they draw `┃` too)."""
    rows = sc.splitlines()
    top = next(i for i, r in enumerate(rows) if "╭─ inbox" in r)
    end = next(i for i in range(top + 1, len(rows)) if "╰─" in rows[i])
    return "\n".join(rows[top:end + 1])


def main():
    with tui_session(COLS, ROWS, env="BISE_CTRL_DIGITS=1") as t:
        t.wait("bise :*")
        t.wait_re(MAIN_IDLE)
        # main asks A, then B some seconds later in the same turn; later
        # still it withdraws A (answered in chat) and asks C: the re-ask
        # that took Benjamin's half answer
        t.typed("[[bash: a=$(sb card \"$(printf 'which bench?\\n1. cold\\n2. warm')\" | tr -dc 0-9); sleep 8; "
                "sb card \"$(printf 'and the p99 too?\\n1. yes\\n2. no')\"; sleep 8; "
                "sb card --withdraw $a \"answered in chat\"; sb card \"which bench, cold or warm?\"]]")
        t.keys("Enter")
        t.wait(w("inbox.head") + " · " + w("common.waiting_for_you", n=1))
        # A opens in place; half an answer
        t.typed(CTRL % ord("1"))
        t.wait("↳ " + w("inbox.answering", who="main"))
        t.wait("┃ which bench?")
        t.typed(HALF)
        t.wait(HALF)
        # B comes in: A stays, his words stay
        sc = t.wait(w("inbox.head") + " · " + w("common.waiting_for_you", n=2), 30)
        assert HALF in sc, "his half answer is gone when B came in:\n" + sc
        b = box(sc)
        assert "┃ which bench?" in b, "A is no longer the open item:\n" + sc
        assert "┃ and the p99 too?" not in b and "2 ? main · and the p99 too?" in b, "B took the view:\n" + sc
        # the caret still types at the end of his words
        t.typed(" tonight")
        t.wait(HALF + " tonight")
        assert "┃ which bench?" in box(t.screen()), t.screen()
        # main withdraws A and asks C: A stays open, closed, his words stay
        sc = t.wait("you → main · " + w("inbox.question_closed"), 30)
        b = box(sc)
        assert "· closed" in b, sc
        assert HALF + " tonight" in sc, "his words are gone when A closed:\n" + sc
        assert "┃ which bench?" in b, "A left the view:\n" + sc
        assert "┃ which bench, cold or warm?" not in b, "C took the view:\n" + sc
        t.wait("⏎ " + w("inbox.key_send_message"))
        # ⏎: his words go to main as a message; the view moves on
        t.keys("Enter")
        t.wait_gone("the question is closed", 10)
        t.wait("↳ " + w("inbox.answering", who="main"))
        t.keys("Escape")
        t.wait(HALF + " tonight")
    print("PASS tui card draft keep")


if __name__ == "__main__":
    run(main)
