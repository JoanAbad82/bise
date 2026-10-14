"""Queued messages (BISE-89) on a throwaway hub (tmux, fake provider),
held by the hub (issue 23): during a slow turn, tab sends the composer
text to the hub as a queued message (the model gets nothing yet); the
queue shows above the composer with its hint and the panel row counts
it, drawn from the hub's row, so a second terminal on the same hub shows
the same queue; ↑ in an empty composer takes the newest back from the
hub to edit, tab queues it again; when the turn ends the hub says the
whole queue in order, in one turn (sb-core's law
user_queued_said_at_idle, the window's behavior).

python3 -u tests/tui_queue_tmux.py
"""
import itertools
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tui_tmux import Tui, tui_session, run, in_view, pane_rows, start_tui, tmux, wait_until  # noqa: E402

HINT = "queued · sent when this turn ends · ↑ edit"


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
    """The composer's text (book §8 "The frame"): the rows with the bar
    under the divider, their text after the bar."""
    return " ".join(x for x in pane_rows(t.screen().splitlines()) if x)


_second = itertools.count()


def second_terminal(t):
    """Another TUI on `t`'s hub, in its own tmux session (closed by the
    caller with `tmux kill-session`; the hub stays `t`'s)."""
    u = Tui(t.E, "%s_b%d" % (t.name, next(_second)))
    start_tui(t.E, 150, 42, "", u.name)
    return u


def main():
    with tui_session(150, 42) as t:
        t.wait("bise :*")
        t.wait_re(in_view("main"))
        u = second_terminal(t)
        try:
            u.wait_re(in_view("main"))
            # a slow turn: main runs `sleep 8`
            t.typed("[[bash: sleep 8]]")
            t.keys("Enter")
            # tab queues on the hub: the model gets nothing yet; the key
            # bar offers it only once the composer has text (5e3873d)
            t.typed("queued-one")
            t.wait("tab queue   ⏎ steer", 20)
            t.keys("Tab")
            t.wait(" › queued-one", 10)
            t.typed("queued-two")
            t.keys("Tab")
            t.wait(" › queued-two", 10)
            sc = t.wait("· 2 queued", 5)
            assert HINT in sc, sc
            assert sc.index(" › queued-one") < sc.index(" › queued-two"), sc
            assert not any("queued-" in m for m in sent(t.E)), sent(t.E)
            # the second terminal shows the same queue (the hub's row)
            sc = u.wait_all([" › queued-one", " › queued-two", "· 2 queued", HINT], 10)
            assert sc.index(" › queued-one") < sc.index(" › queued-two"), sc
            # ↑ in an empty composer: the newest back from the hub to
            # edit; tab queues it again
            t.keys("Up")
            t.wait("· 1 queued", 10)
            t.wait_any([lambda sc: "queued-two" in composer_row(t)], 10)
            u.wait("· 1 queued", 10)
            assert " › queued-two" not in u.screen(), u.screen()
            t.typed(" edited")
            t.keys("Tab")
            t.wait(" › queued-two edited", 10)
            t.wait("· 2 queued", 5)
            assert "queued" not in composer_row(t), t.screen()
            u.wait(" › queued-two edited", 10)
            assert not any("queued-" in m for m in sent(t.E)), sent(t.E)

            # the turn ends: the hub says the whole queue in one turn, in
            # order (law user_queued_said_at_idle)
            def queued():
                return [m for m in sent(t.E) if "queued-" in m]
            got = wait_until(lambda: queued(), 60,
                             lambda: "the queue did not go out: %r" % queued(), poll=0.3)
            assert len(got) == 1, "one turn: %r" % got
            one, two = got[0].find("queued-one"), got[0].find("queued-two edited")
            assert 0 <= one < two, "in order: %r" % got
            t.wait("queued-two edited", 30)
            t.wait_gone(HINT, 10)
            u.wait_gone(HINT, 10)
            sc = t.screen()
            print(sc)
            assert "· 2 queued" not in sc and "· 1 queued" not in sc, sc
        finally:
            tmux("kill-session", "-t", u.name)
        print("PASS tui queue")


if __name__ == "__main__":
    run(main)
