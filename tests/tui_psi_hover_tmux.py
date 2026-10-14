"""What a ψ says on hover (wt-sign, designer m_24019), in a real terminal
(tmux) against the fake provider on a throwaway hub: a task in its own
worktree; the mouse over its panel row's ψ, then over the ψ of the
composer line in its view, puts `ψ worktree: its own copy of the repo,
on sb/t1 · <folder>` in the key bar; off it, the keys come back. Then
Benjamin's 'ψ ven-bots': main's `cd <t1's worktree> && ls` gives main no
ψ (its line and its row stay plain).

python3 -u tests/tui_psi_hover_tmux.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
from tui_tmux import tui_session, run, panel_row, in_view, MAIN_IDLE  # noqa: E402

COLS, ROWS = 150, 42
WORDS = "ψ worktree: its own copy of the repo, on sb/t1"


def move(t, x, y):
    """A mouse move with no button (SGR 1006, any-motion: 35), 0-based."""
    t.typed("\x1b[<35;%d;%dM" % (x + 1, y + 1))


def psi_on_row(t, pred):
    """(x, y) of the last ψ on the first screen row `pred` takes."""
    for y, row in enumerate(t.screen().splitlines()):
        if pred(row) and "ψ" in row:
            return row.rfind("ψ"), y
    raise AssertionError("no ψ row:\n" + t.screen())


def main():
    with tui_session(COLS, ROWS) as t:
        t.wait("bise :*")
        t.wait_re(MAIN_IDLE)
        t.typed("/new -w t1: idle")
        t.keys("Enter")
        t.wait_re(panel_row(1, "t1"), 30)
        c = e2e.Client(os.path.join(t.E.state, "hub.sock"))
        c.wait_idle("t1", timeout=60)
        wt = c.agent("t1")["path"]
        folder = os.path.basename(os.path.dirname(wt))
        # the panel row's ψ (its last column)
        x, y = psi_on_row(t, lambda r: " t1" in r[COLS // 2:])
        move(t, x, y)
        sc = t.wait(WORDS, 20)
        assert folder in sc.splitlines()[-2] or folder in sc, sc
        print("---- hover on the panel's ψ ----\n" + sc)
        move(t, 5, 3)
        t.wait_gone(WORDS)
        # in t1's view: the composer line's `ψ sb/t1`
        t.keys("M-1")
        t.wait_re(in_view("t1"))
        x, y = psi_on_row(t, lambda r: "you → t1" in r)
        move(t, x, y)
        sc = t.wait(WORDS, 20)
        print("---- hover on the composer line's ψ ----\n" + sc)
        move(t, 5, 3)
        t.wait_gone(WORDS)
        # Benjamin's 'ψ ven-bots': main looks into t1's worktree, no ψ
        t.keys("M-0")
        t.wait_re(in_view("main"))
        t.typed("[[bash: cd %s && ls]]" % wt)
        t.keys("Enter")
        c.wait_idle("main", timeout=60)
        t.wait_re(MAIN_IDLE)
        main_a = c.agent("main")
        assert not main_a.get("place") and main_a.get("place_id") in (None, "", "shared"), main_a
        rows = t.screen().splitlines()
        line = [r for r in rows if "you → main" in r]
        assert line and "ψ" not in line[-1], "\n".join(rows)
        mrow = [r for r in rows if " main" in r[COLS // 2:] and r.strip().startswith("0 ")]
        assert all("ψ" not in r for r in mrow), "\n".join(rows)
        print("PASS tui psi hover")


if __name__ == "__main__":
    run(main)
