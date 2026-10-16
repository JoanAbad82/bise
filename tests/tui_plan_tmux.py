"""A plan an agent proposes, in a real terminal (tmux, 80 columns) against
the fake provider (plan-ok, Gabriel's pick A): main publishes a page whose
plan lean-install runs; the inbox box has lean-install's item, and opened
in place it reads 'lean-install proposes a plan', the question, the gist
whole, its 4 choices, and 'or type what to change: lean-install reads it';
words typed there answer it, and lean-install gets them.

python3 -u tests/tui_plan_tmux.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from words import w  # noqa: E402
from tui_tmux import tui_session, run, MAIN_IDLE  # noqa: E402

COLS, ROWS = 80, 46
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CTRL = "\x1b[%d;5u"   # ctrl+digit, the kitty keyboard protocol's form


def main():
    with tui_session(COLS, ROWS, env="BISE_CTRL_DIGITS=1") as t:
        t.wait("bise :*")
        t.wait_re(MAIN_IDLE)
        page = os.path.join(t.E.tmp, "lean.html")
        open(page, "w").write(open(os.path.join(ROOT, "kit", "examples", "lean-plan.html")).read())
        t.typed("/new lean-install: making installs lean by default {{bash: sleep 300}}")
        t.keys("Enter")
        t.wait("lean-install")
        t.typed('[[bash: sb page publish %s --id lean --title "lean installs"]]' % page)
        t.keys("Enter")
        t.wait("1 waiting for you", 90)
        t.typed(CTRL % ord("1"))
        sc = t.wait(w("inbox.title_plan", agent="lean-install"))
        sc = t.wait(w("inbox.type_plan", agent="lean-install"))
        for words in ("lean installs: start the plan lean-install recommends?", "1 start the plan", "open the plan"):
            assert words in sc.replace("\n", " ") or words in sc, (words, sc)
        assert "bise asks" not in sc and "send these" not in sc, sc
        # the thread's line says the same as the box (designer m_26765)
        assert "? lean-install proposes a plan: lean installs ↗" in sc and "lean-install asks" not in sc, sc
        assert w("inbox.page_chip_v", title="lean installs", v=1) + "   ctrl+t " + w("inbox.key_open_browser") in sc, sc
        assert "{{bash" not in sc.split("inbox ·")[1], sc
        if os.environ.get("SHOT_OUT"):
            open(os.environ["SHOT_OUT"], "w").write(sc)
        # his words answer it: lean-install gets them
        t.typed("ok, but keep win32: we need it")
        t.keys("Enter")
        t.wait("sent to lean-install", 30)


if __name__ == "__main__":
    run(main)
