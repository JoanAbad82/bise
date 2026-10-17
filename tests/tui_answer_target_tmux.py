"""His pick A on page composer-target (designer m_26531) in a real
terminal (tmux) against the fake provider: where his words go while an
item is open, the same rule as the desktop's composer. Passes when, at
80 columns:
  - a question open (main asks `which size system…`): the divider reads
    `├─ ↳ answering main · which size system… ─── esc to main instead ─┤`,
    the label and its rule in the accent, the end dim; the composer's bar
    is the item's heavy accent `┃` on every row; the key bar says
    `1-2 answer   ⏎ send the answer` … `esc to main`;
  - esc: the item folds, the divider is `you → main` again and the bar
    the plain `│`;
  - an approval open (a force push to main in auto): none of it: the
    divider keeps `you → ? main · your answer`, the bar `│`.

SB_DUMP=<dir>: every screen checked is written there (designer's review).

python3 -u tests/tui_answer_target_tmux.py
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tui_tmux import tui_session, run, MAIN_IDLE  # noqa: E402
from words import w  # noqa: E402

COLS, ROWS = 80, 34
CTRL1 = "\x1b[49;5u"   # ctrl+1, the kitty keyboard protocol's form
QUESTION = "which size system should the filter use: EU, or US too?"
# the accent (theme.rs): any 256/true colour SGR before the text is
# enough here; the plain rule is drawn without the accent's
SGR = re.compile(r"\x1b\[[0-9;]*m")


def dump(t, name, sc):
    d = os.environ.get("SB_DUMP")
    if d:
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "%s.txt" % name), "w") as f:
            f.write(sc)
        with open(os.path.join(d, "%s.ansi" % name), "w") as f:
            f.write(t.screen(colors=True))


def divider(sc):
    """The divider's row: the last `├─` row (framed) or `─ ` row with a label."""
    rows = [r for r in sc.split("\n") if "├─" in r or "─ you →" in r or "─ ↳ answering" in r]
    assert rows, sc
    return rows[-1]


def bar_rows(sc):
    """The composer's rows under the divider, the frame's own `│` (or
    `╰`) taken off: the bar is their first mark."""
    rows = sc.rstrip("\n").split("\n")
    i = max(n for n, r in enumerate(rows) if r == divider(sc))
    return [r[1:].lstrip() if r[:1] in "│╰" else r.lstrip() for r in rows[i + 1:]]


def colored_divider(t):
    """The divider's row with its SGR escapes."""
    rows = t.screen(colors=True).split("\n")
    return [r for r in rows if "answering" in SGR.sub("", r) or "you →" in SGR.sub("", r)][-1]


def main():
    with tui_session(COLS, ROWS, env="BISE_CTRL_DIGITS=1 BISE_APPROVALS=auto") as t:
        t.wait("bise :*")
        t.wait_re(MAIN_IDLE)
        plain = colored_divider(t)
        # main asks a question with two options
        t.typed("[[bash: sb card \"$(printf '%s\\n1. EU only\\n2. EU and US')\"]]" % QUESTION)
        t.keys("Enter")
        t.wait(w("common.waiting_for_you", n="1"), 60)
        t.typed(CTRL1)
        sc = t.wait("↳ answering main")
        d = divider(sc)
        assert re.search(r"[├─]─ ↳ answering main · which size system[^─]*… ─+ esc to main instead ─", d), d
        rows = bar_rows(sc)
        bars = [r for r in rows if r.startswith(("┃", "│"))]
        assert len(bars) >= 3 and all(r.startswith("┃") for r in bars), "the composer's bar is not the heavy ┃:\n" + sc
        assert "1-2 answer" in sc and "⏎ send the answer" in sc and "esc to main" in sc, sc
        # the label and its rule in the accent, the plain rule's colour gone
        cd = colored_divider(t)
        assert cd != plain and SGR.sub("", cd).startswith(SGR.sub("", d)[:3]), (cd, plain)
        lead = SGR.findall(cd.split("↳")[0])
        assert lead and lead != SGR.findall(plain.split("you")[0]), (cd, plain)
        dump(t, "1-answering", sc)
        # his half answer, then esc: back to main, the plain bar
        t.typed("EU only for now")
        sc = t.wait("EU only for now")
        assert "⏎ send the answer" in sc and "esc to main" in sc, sc
        dump(t, "2-typed", sc)
        t.keys("Escape")
        sc = t.wait_re(MAIN_IDLE)
        assert "↳ answering" not in sc, sc
        assert not any(r.startswith("┃") for r in bar_rows(sc)) and any(r.startswith("│") for r in bar_rows(sc)), sc
        dump(t, "3-after-esc", sc)
        # the question again: his half answer waits with it; clear it, fold
        t.typed(CTRL1)
        sc = t.wait("↳ answering main")
        assert "EU only for now" in sc, sc
        t.keys("C-u")
        t.wait_gone("EU only for now")
        t.keys("Escape")
        t.wait_re(MAIN_IDLE)
        # an approval: words never approve, the divider and bar stay plain
        t.typed("[[bash: git push origin main --force]]")
        t.keys("Enter")
        t.wait(w("thread.gate_waits"), 60)
        t.wait("$ git push origin main --force")
        # the approval in the inbox (row 1) before ctrl+1: the thread's
        # line comes before the hub's cards under load, and a ctrl+1 on an
        # inbox of one opened the question (release-40's red: "answering
        # main · which size system…" where the approval was wanted)
        t.wait(w("inbox.head") + " · " + w("common.waiting_for_you", n="2"), 60)
        t.typed(CTRL1)
        sc = t.wait("type why not, ⏎ says no")
        assert "↳ answering" not in sc, sc
        assert "you → ? main · your answer" in divider(sc), divider(sc)
        assert not any(r.startswith("┃") for r in bar_rows(sc)) and any(r.startswith("│") for r in bar_rows(sc)), sc
        dump(t, "4-approval", sc)


if __name__ == "__main__":
    run(main)
