"""The project's pause and /usage in the TUI (cost-pause, designer
m_18789), through the real binaries: a throwaway hub on the fake
provider, tmux at 150 and 80 columns, dark and light.

  main runs a 30 s bash; /pause: the notice, the header's `‖ paused ·
      /resume`, main's thread says `‖ paused · its turn stopped`
  a message typed while paused is held (no turn: main stays idle)
  /usage: its title, `today` and `7 days`, `all agents`, `by agent`
      with main, `by model`, the foot and its key bar; esc closes it
  /resume: the notice, the header's mark gone, the held message and
      bise's go-on note reach main and its turn runs

PAUSE_SHOTS=<dir> keeps the captures (.txt and .ansi) for the designer.

python3 -u tests/tui_pause_tmux.py
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
from tui_tmux import tui_session, run, MAIN_IDLE  # noqa: E402

SHOTS = os.environ.get("PAUSE_SHOTS")


def shot(t, name):
    if SHOTS:
        os.makedirs(SHOTS, exist_ok=True)
        with open(os.path.join(SHOTS, name + ".ansi"), "w") as f:
            f.write(t.screen(colors=True))
        with open(os.path.join(SHOTS, name + ".txt"), "w") as f:
            f.write(t.screen())


def command(t, line, needle):
    t.typed(line)
    t.wait(line)
    t.keys("Enter")
    return t.wait(needle)


def usage(t, width):
    command(t, "/usage", "by model")
    # the hub's first read counts the transcripts: main's row comes after
    t.wait_gone("counting the week's transcripts", 40)
    # under load the first read can end before main's turn is counted (the
    # screen stays at `—`, 160 s at x4.0): r reads again until main's row
    main_row = re.compile(r"\bmain · ")
    for _ in range(6):
        try:
            sc = t.wait_re(main_row.pattern, 20)
            break
        except AssertionError:
            t.keys("r")
    else:
        sc = t.wait_re(main_row.pattern, 20)
    for needle in ("usage", "today", "7 days", "all agents", "by agent", "main", "plans count tokens only", "r refresh   esc close"):
        assert needle in sc, "%r not in /usage:\n%s" % (needle, sc)
    shot(t, width + "-usage")
    t.keys("Escape")
    t.wait_gone("by model")


def pause_cycle(t, width, first):
    t.wait_re(MAIN_IDLE)
    if first:
        # a turn to cut
        t.typed("[[bash: sleep 30; echo late]]")
        t.keys("Enter")
        t.wait("sleep 30")
        # its turn runs (the panel's ∿; at 80 columns no panel: the key
        # bar's interrupt), else /pause has no turn to cut
        t.wait_re(r"∿ main\b|ctrl\+c interrupt", 60)
    sc = command(t, "/pause", "/resume goes on.")
    t.wait("paused · /resume")
    if first:
        t.wait("‖ paused · its turn stopped")
    shot(t, width + "-paused")
    # a message while paused: held
    command(t, "still there?", "still there?")
    t.wait_re(MAIN_IDLE)
    shot(t, width + "-held")
    usage(t, width)
    sc = command(t, "/resume", "resumed:")
    t.wait_gone("paused · /resume")
    if first:
        t.wait("the project was paused. go on where your turn stopped.")
    shot(t, width + "-resumed")
    t.wait_re(MAIN_IDLE)
    assert "paused · /resume" not in t.screen(), t.screen()


def light(t, width):
    command(t, "/theme light", "light")
    t.wait_re(MAIN_IDLE)
    command(t, "/pause", "/resume goes on.")
    t.wait("paused · /resume")
    shot(t, width + "-paused-light")
    command(t, "/usage", "by model")
    shot(t, width + "-usage-light")
    t.keys("Escape")
    t.wait_gone("by model")
    command(t, "/resume", "resumed:")
    t.wait_gone("paused · /resume")
    command(t, "/theme dark", "dark")


def main():
    # one fresh hub and terminal per width: each capture is that width
    # (designer m_18932: the 80 shots were the 150 terminal)
    for width, height in ((150, 40), (80, 32)):
        E = e2e.Env()
        with tui_session(width, height, E=E) as t:
            t.wait("bise :*")
            pause_cycle(t, str(width), True)
            light(t, str(width))
            print("PASS tui pause %d" % width)


if __name__ == "__main__":
    run(main)
