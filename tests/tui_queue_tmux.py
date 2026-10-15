"""The queue drawer (BISE-89, designer m_25146) on a throwaway hub (tmux,
fake provider), his queued messages held by the hub (issue 23). During a
slow turn, tab sends the composer to the hub as a queued message (the
model gets nothing yet); a framed drawer above the composer shows them,
`╭─ 2 queued · sent when main's turn ends ─╮`, one `│ › text` row each,
drawn from the hub's row, so a second terminal on the same hub shows the
same queue. 3 rows, then it scrolls (`↓ 2 more`). ↑ in an empty composer
moves into the drawer on the newest row (`⏎ send now   e edit   d delete
esc back`): d deletes it ('deleted · u undo', u queues it again), e takes
it back into the composer, ⏎ says it now (turn/steerQueued). When the
turn ends the hub says the rest in order, in one turn (law
user_queued_said_at_idle). Run dark, then light; the screens at 150 and
80 columns go to $QUEUE_SHOTS (designer's sign) when it is set.

python3 -u tests/tui_queue_tmux.py
"""
import itertools
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tui_tmux import Tui, tui_session, run, in_view, pane_rows, start_tui, tmux, wait_until  # noqa: E402

COLS, ROWS = 150, 42
HEAD2 = "╭─ 2 queued · sent when main's turn ends ─"
KEYS = "⏎ send now   e edit   d delete   esc back"


def sent(E):
    """The messages main's model answered, in order (the fake provider
    answers `ack: <the message>`)."""
    out = []
    for r in E.fake_requests():
        reply = r.get("reply")
        text = reply.get("content", "") if isinstance(reply, dict) else str(reply or "")
        if r.get("agent") == "main" and text.startswith("ack: "):
            out.append(text[len("ack: "):])
    return out


def composer_row(t):
    """The composer's text: the rows with the bar under the divider."""
    return " ".join(x for x in pane_rows(t.screen().splitlines()) if x)


def drawer(sc):
    """The drawer's rows, from its top edge to its bottom one."""
    rows = sc.splitlines()
    top = next(i for i, r in enumerate(rows) if "╭─ " in r and ("queued" in r or "deleted" in r))
    col = rows[top].index("╭─ ")
    end = rows[top].index("╮", col) + 1
    bottom = next(i for i in range(top, len(rows)) if rows[i][col:col + 1] == "╰")
    return [r[col:end] for r in rows[top:bottom + 1]]


def shot(t, theme, name, wait80):
    """The screen at 150 and at 80 columns (`wait80`: what shows once
    narrow), to $QUEUE_SHOTS as text and with its colors."""
    out = os.environ.get("QUEUE_SHOTS")
    for cols in (COLS, 80):
        if cols != COLS:
            tmux("resize-window", "-t", t.name, "-x", str(cols))
            # redrawn narrow: the frame's right edge at column 80
            t.wait_any([lambda sc: wait80 in sc and sc.splitlines()[0].rstrip().endswith("╮") and len(sc.splitlines()[0].rstrip()) == cols])
        sc = t.screen()
        assert all(len(r.rstrip()) <= cols for r in sc.splitlines()), sc
        if out:
            os.makedirs(out, exist_ok=True)
            base = os.path.join(out, "%s-%s-%d" % (name, theme, cols))
            with open(base + ".txt", "w") as f:
                f.write(sc)
            with open(base + ".ansi", "w") as f:
                f.write(t.screen(colors=True))
    tmux("resize-window", "-t", t.name, "-x", str(COLS))


_second = itertools.count()


def second_terminal(t):
    """Another TUI on `t`'s hub, in its own tmux session (closed by the
    caller with `tmux kill-session`; the hub stays `t`'s)."""
    u = Tui(t.E, "%s_b%d" % (t.name, next(_second)))
    start_tui(t.E, COLS, ROWS, "", u.name)
    return u


def queue(t, text):
    t.typed(text)
    t.keys("Tab")
    t.wait("│ › " + text, 10)


def scenario(theme):
    with tui_session(COLS, ROWS) as t:
        t.wait("bise :*")
        t.wait_re(in_view("main"))
        if theme != "dark":
            t.typed("/theme " + theme)
            t.keys("Enter")
            t.wait_re(in_view("main"))
        u = second_terminal(t)
        try:
            u.wait_re(in_view("main"))
            # a slow turn: main runs `sleep 40`
            t.typed("[[bash: sleep 40]]")
            t.keys("Enter")
            # tab queues on the hub: the model gets nothing yet; the key
            # bar offers it only once the composer has text (5e3873d)
            t.typed("queued-one")
            t.wait("tab queue   ⏎ steer", 20)
            t.keys("Tab")
            t.wait("│ › queued-one", 10)
            queue(t, "queued-two")
            sc = t.wait(HEAD2, 5)
            d = drawer(sc)
            assert len(d) == 4 and "queued-one" in d[1] and "queued-two" in d[2] and d[3].startswith("╰"), d
            assert not any("queued-" in m for m in sent(t.E)), sent(t.E)
            # an empty composer: ↑ edits them (the window's words)
            t.wait("↑ edit queued   ctrl+c interrupt", 5)
            # the second terminal shows the same drawer (the hub's row)
            sc = u.wait_all([HEAD2, "│ › queued-one", "│ › queued-two"], 10)
            assert sc.index("queued-one") < sc.index("queued-two"), sc
            shot(t, theme, "2-queued", "╭─ 2 queued")
            # 5: 3 rows, then it scrolls
            for x in ("three", "four", "five"):
                queue(t, "queued-" + x) if x == "three" else (t.typed("queued-" + x), t.keys("Tab"))
            sc = t.wait("↓ 2 more", 10)
            assert "queued-four" not in sc and "queued-five" not in sc, sc
            shot(t, theme, "5-queued", "↓ 2 more")
            # ↑: into the drawer on the newest row, scrolled to it
            t.keys("Up")
            sc = t.wait_all([KEYS, "↑ 2 more", "│ › queued-five"], 10)
            assert "↓" not in "".join(drawer(sc)), drawer(sc)
            shot(t, theme, "focused", "│ › queued-five")
            # d: gone from both terminals, 'deleted · u undo'; u: back
            t.keys("d")
            sc = t.wait("╭─ deleted · u undo", 10)
            assert "queued-five" not in sc, sc
            u.wait("↓ 1 more", 10)   # the other terminal shows the oldest 3
            shot(t, theme, "deleted", "╭─ deleted · u undo")
            t.keys("u")
            t.wait("│ › queued-five", 10)
            t.wait_gone("deleted · u undo", 5)
            u.wait("↓ 2 more", 10)
            # e on the newest: back into the composer; tab queues it again
            t.keys("Escape")
            t.wait_gone(KEYS, 5)
            t.keys("Up")
            t.wait(KEYS, 5)
            t.keys("e")
            t.wait_gone("│ › queued-five", 10)
            t.wait_any([lambda sc: "queued-five" in composer_row(t)], 10)
            u.wait("↓ 1 more", 10)
            t.typed(" edited")
            t.keys("Tab")
            t.wait("╭─ 5 queued", 10)   # at the end, under '↓ 2 more' 
            assert "queued" not in composer_row(t), t.screen()
            # ⏎ on the oldest: said now, mid-turn, alone
            t.keys("Up")
            for _ in range(4):
                t.keys("Up")
            t.wait("↓ 2 more", 5)
            t.keys("Enter")
            t.wait_gone("│ › queued-one", 10)
            u.wait_gone("│ › queued-one", 10)
            assert not any("queued-" in m for m in sent(t.E)), "steered into the turn, not said yet: %r" % sent(t.E)
            t.keys("Escape")

            # the turn ends: the hub says the rest in one turn, in
            # order (law user_queued_said_at_idle), queued-one not again
            def queued():
                return [m for m in sent(t.E) if "queued-two" in m]
            got = wait_until(lambda: queued(), 90,
                             lambda: "the queue did not go out: %r" % sent(t.E), poll=0.3)
            assert len(got) == 1, "one turn: %r" % got
            order = [got[0].find(x) for x in ("queued-two", "queued-three", "queued-four", "queued-five edited")]
            assert all(i >= 0 for i in order) and order == sorted(order), "in order: %r" % got
            assert "queued-one" not in got[0], "steered already: %r" % got
            t.wait_gone("queued · sent when", 30)
            u.wait_gone("queued · sent when", 10)
        finally:
            tmux("kill-session", "-t", u.name)


def main():
    for theme in ("dark", "light"):
        scenario(theme)
        print("PASS tui queue drawer (%s)" % theme)


if __name__ == "__main__":
    run(main)
