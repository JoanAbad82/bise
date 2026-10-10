"""The answer as it streams in, in the terminal (livetext.rs, designer
m_12372), in a real terminal (tmux) against the fake provider streaming
in slow pieces ([[pieces: N S]]):

- the reply shows while it streams, at its final place, and grows;
- the final answer replaces it with no jump: every row the live text
  drew is the final row at the same height (its last row a prefix);
- a stop mid-stream clears it: its words leave the screen, nothing of
  it comes back.

python3 -u tests/tui_live_text_tmux.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import wait  # noqa: E402
from tui_tmux import tui_session, run, MAIN_IDLE  # noqa: E402

COLS, ROWS = 100, 40
FIRST = ("streaming first words of the answer, then more of them, "
         "until the whole paragraph is there and settles in place. ") * 4
SECOND = "zebra quartz never lands, a stop clears it before the end. " * 12


def rows_with(screen, words):
    """The (y, cell) of the screen's rows that hold one of `words`: the
    cell is the thread pane's part of the row (the panes are split by
    '│'), so the side pane and the borders never enter the comparison."""
    out = []
    for y, r in enumerate(screen.splitlines()):
        cells = [c for c in r.split("│") if any(w in c for w in words)]
        if cells:
            out.append((y, cells[0].rstrip()))
    return out


def main():
    with tui_session(COLS, ROWS) as t:
        t.wait("bise :*")
        t.wait_re(MAIN_IDLE)
        first = os.path.join(t.E.tmp, "first.txt")
        second = os.path.join(t.E.tmp, "second.txt")
        open(first, "w", encoding="utf-8").write(FIRST.strip())
        open(second, "w", encoding="utf-8").write(SECOND.strip())

        # 1. it streams in, grows, and settles with no jump
        t.typed("[[pieces: 40 0.12]] [[reply: %s]] stream it" % first)
        t.keys("Enter")
        t.wait("streaming first words", 60)
        words = ("streaming", "until the whole", "settles in place", "then more of")
        seen = []

        def sample():
            # one screen per poll: the live rows as they grow
            s = t.screen()
            seen.append(rows_with(s, words))
            return "ack:" in s or len(seen[-1]) >= 4
        try:
            wait.until(sample, 60, "the live text grown to 4 rows")
        except AssertionError:
            pass  # the rows seen so far are checked below, as before
        t.wait_re(MAIN_IDLE, 90)
        final = rows_with(t.screen(), words)
        assert final, t.screen()
        live = [r for r in seen if r and r != final]
        assert len(live) >= 2, "the live text grew on screen: %r" % seen
        assert sum(len(r[-1][1]) for r in live[:1]) <= sum(len(r[-1][1]) for r in live[-1:]) or len(live[-1]) > len(live[0]), live
        at = dict(final)
        for snap in live:
            for k, (y, row) in enumerate(snap):
                assert y in at, "a live row at y=%d the final has not: %r / %r" % (y, snap, final)
                if k < len(snap) - 1:
                    assert row == at[y], "a live row moved or changed: %r vs %r" % (row, at[y])
                else:
                    assert at[y].startswith(row.rstrip(" …")), "the last live row is a prefix: %r vs %r" % (row, at[y])

        # 2. a stop mid-stream clears it, nothing comes back
        t.typed("[[pieces: 24 0.2]] [[reply: %s]] stream it slowly" % second)
        t.keys("Enter")
        t.wait("zebra quartz", 60)
        t.keys("C-c")  # the TUI's interrupt (its hint: 'ctrl+c interrupt')
        t.wait_gone("zebra quartz", 20)
        t.wait_re(MAIN_IDLE, 60)
        wait.holds(lambda: "zebra quartz" not in t.screen(), 1.0, "nothing of the stopped answer comes back")
        print("PASS tui live text (%d live screens, settled in place, stop cleared)" % len(live))


if __name__ == "__main__":
    run(main)
