"""Scheduled tasks in the TUI (site/m/timers), through the real binaries:
a throwaway hub on the fake provider, the real `sb every`, tmux at 150
and 80 columns, dark and light.

  t1 schedules its own (every 2m, 6 times), main schedules one for t2
      (every day HM, 3 h from now): main's thread has main's ◷ line only; the
      agents panel shows ◷ and the next run on both rows, its legend
  t1's thread: its ◷ scheduled line, never `switchboard`
  /scheduled: the list soonest first, its key bar; ⏎ opens one; r runs
      it now (a ◷ run line in t1's thread, outside the count); x asks on
      the row, n keeps, x y stops: tab shows it ended, t1's thread says
      `ended · stopped by you`, and the note of the stop never shows
  the same screens at 80 columns and in the light palette

SCHED_SHOTS=<dir> keeps the captures (.txt and .ansi) for the designer.

python3 -u tests/tui_scheduled_tmux.py
"""
import os
import subprocess
import time
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
from tui_tmux import tui_session, run, MAIN_IDLE  # noqa: E402
from words import w, w_re  # noqa: E402

SHOTS = os.environ.get("SCHED_SHOTS")
# the daily task's time: 3 h from now, so the panel shows its clock time (`◷ 07:30`)
# and never `◷ 40m` (within the hour, sb/panel.rs next_run): a fixed 07:30 was red
# from 06:30 to 07:30 (state-schema m_34465)
HM = time.strftime("%H:%M", time.localtime(time.time() + 3 * 3600))

# the scheduled screen's words, by key (bise_proto::words::scheduled): a word designer changes moves this test
NAME = "fake timer name"   # the fake model's name for a task
HEAD = w("scheduled.heading") + " · " + w("scheduled.subtitle")
SUB = w("scheduled.subtitle")
ENDED_TOO = "tab " + w("scheduled.key_ended_too")
ACTIVE_ONLY = "tab " + w("scheduled.key_active_only")
STOP_KEYS = "y %s   n %s esc %s" % (w("scheduled.key_stop"), w("scheduled.key_or"), w("scheduled.key_keep"))


def active(n):
    return w("scheduled.count_active", n=n)


def keybar(*pairs):
    """'⏎ open   r run now', the keys with their words by key."""
    return "   ".join("%s %s" % (k, w("scheduled." + name)) for k, name in pairs)


def label(name, value):
    """An opened task's field: its label padded to 12 columns, then its value."""
    return "%-12s%s" % (w("scheduled." + name), value)


def shot(t, name):
    if SHOTS:
        os.makedirs(SHOTS, exist_ok=True)
        with open(os.path.join(SHOTS, name + ".ansi"), "w") as f:
            f.write(t.screen(colors=True))
        with open(os.path.join(SHOTS, name + ".txt"), "w") as f:
            f.write(t.screen())


def sb(E, agent, cwd, *args):
    env = {**E.env, "SB_SOCKET": os.path.join(E.state, "agent.sock"), "SB_AGENT": agent}
    r = subprocess.run([e2e.EXE, "sb", *args], env=env, cwd=cwd, capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, "sb %s: %s %s" % (" ".join(args), r.stdout, r.stderr)
    return r.stdout.strip()


def command(t, line, needle):
    t.typed(line)
    t.wait(line)
    t.keys("Enter")
    return t.wait(needle)


def no_switchboard(sc):
    assert "switchboard" not in sc, "the hub's old name reached the user:\n" + sc


def setup(t, E):
    t.wait("bise :*")
    t.wait_re(MAIN_IDLE)
    for name, what in (("t1", "fix the build"), ("t2", "ship the release")):
        sb(E, "main", E.ws, "spawn", name, "--objective", what)
        t.wait(name)
    out = sb(E, "t1", E.ws, "every", "2m", "check the build and tell me what failed", "--times", "6")
    # sched-names: the list's line, its name (the fallback until the model's) after its agent
    assert "timer set: #1 @t1  " in out and " · every 2m · " in out, out
    out = sb(E, "main", E.ws, "every", "day", HM, "ship a release if main landed something", "--to", "t2")
    assert "timer set: #2 @t2  " in out and " · every day %s · " % HM in out, out


def wide(t, E):
    setup(t, E)
    # main's thread: main's own, never t1's; the panel's ◷ and its legend
    # sched-names: its name (the fake model's), never its id (designer m_14531)
    sc = t.wait(w("scheduled.set_for", by="main", title=NAME, agent="t2") + " · every day " + HM)
    assert w("scheduled.set_own", agent="t1", title="") not in sc and "scheduled #" not in sc, sc
    sc = t.wait("◷ " + HM)
    assert "◷ 2m" in sc and "◷ " + HM in sc, sc
    assert "= its next run" not in sc, sc
    no_switchboard(sc)
    shot(t, "150-main-thread")
    # /scheduled: the list, soonest first
    command(t, "/scheduled", HEAD)
    sc = t.wait(active(2) + "   " + ENDED_TOO)
    assert "/ " + w("scheduled.find_hint") in sc, sc
    rows = [l for l in sc.splitlines() if "◷ t1" in l or "◷ t2" in l]
    # designer m_15602: its name right after its agent, no id on the screen
    assert len(rows) == 2 and "◷ t1" in rows[0] and NAME in rows[0] and "› " in rows[0], sc
    assert "#" not in "\n".join(rows), sc
    assert "every 2m" in rows[0] and w("scheduled.n_of", count=0, total=6) in rows[0] and w("scheduled.by", who="t1") in rows[0], rows[0]
    assert "every day " + HM in rows[1] and w("scheduled.by", who="main") in rows[1], rows[1]
    assert keybar(("⏎", "key_open"), ("r", "key_run_now"), ("x", "key_stop"), ("/", "key_find"), ("tab", "key_ended_too"), ("esc", "key_close")) in sc, sc
    shot(t, "150-list")
    # one opened
    t.keys("Enter")
    sc = t.wait(NAME + " · t1")
    for want in (label("label_wakes", "t1"), label("label_set_by", "t1"),
                 label("label_when", "every 2m · " + w("scheduled.n_times", n=6)),
                 label("label_ends", w("scheduled.ends_after_nth", nth="6th")),
                 w("scheduled.words_it_sends"), "check the build and tell me what failed",
                 keybar(("r", "key_run_now"), ("x", "key_stop"), ("esc", "key_back"))):
        assert want in sc, want + "\n" + sc
    shot(t, "150-opened")
    # run now: outside the count
    t.keys("r")
    sc = t.wait_re(w_re("scheduled.ran_now_note", title=NAME, agent="t1"))
    shot(t, "150-run-now")
    t.keys("Escape")
    t.wait(active(2) + "   " + ENDED_TOO)
    # x asks on the row: n keeps
    t.keys("x")
    ask = w("scheduled.stop_ask", title=NAME, agent="t1")
    sc = t.wait(ask + "   " + STOP_KEYS)
    shot(t, "150-stop-ask")
    t.keys("n")
    t.wait_gone(ask)
    t.keys("x")
    t.wait(ask)
    t.keys("y")
    sc = t.wait(active(1) + "   " + ENDED_TOO)
    t.keys("Tab")
    sc = t.wait(active(1) + " · " + w("scheduled.count_ended", n=1) + "   " + ACTIVE_ONLY)
    assert w("scheduled.stopped_by_you") in sc, sc
    shot(t, "150-ended")
    t.keys("Escape")
    t.wait_gone(SUB)
    # t1's thread: set, the run now, ended; never `switchboard`, never the stop's note
    t.keys("M-1")
    sc = t.wait(w("scheduled.ended", title=NAME, why=w("scheduled.stopped_by_you")))
    assert "%s · every 2m · %s · %s" % (w("scheduled.set_own", agent="t1", title=NAME), w("scheduled.n_times", n=6),
                                        w("scheduled.next_at", at="")) in sc, sc
    assert NAME + " · " + w("scheduled.ran_now_by_you") in sc, sc
    # the fake model's `ack: <its input>` replies quote what the agent read:
    # only the thread's lines before them are bise's
    lines = sc.split(" ack: ")[0]
    assert "the user stopped timer" not in lines and "(stop it:" not in lines, sc
    no_switchboard(sc)
    shot(t, "150-agent-thread")
    t.keys("M-0")
    light(t, "150")


def light(t, width):
    command(t, "/theme light", "light")
    t.wait_re(MAIN_IDLE)
    shot(t, width + "-main-thread-light")
    command(t, "/scheduled", active(1))
    shot(t, width + "-list-light")
    t.keys("Enter")
    t.wait(NAME + " · t2")
    shot(t, width + "-opened-light")
    t.keys("Escape")
    t.keys("Escape")
    t.wait_gone(ENDED_TOO)
    command(t, "/theme dark", "dark")


def narrow(t):
    t.start(80, 30)
    t.wait("bise :*")
    t.wait_re(MAIN_IDLE)
    command(t, "/scheduled", w("scheduled.heading"))
    sc = t.wait(active(1))
    assert SUB not in sc, sc
    assert keybar(("⏎", "key_open"), ("r", "key_run_now"), ("x", "key_stop"), ("esc", "key_close")) in sc, sc
    # 80 columns (designer m_15602): who it wakes, its name, its next run; no rhythm
    assert "◷ t2" in sc and NAME in sc and w("scheduled.daily", hm=HM) not in sc, sc
    for line in sc.splitlines():
        assert len(line) <= 80, line
    shot(t, "80-list")
    t.keys("Enter")
    t.wait(NAME + " · t2")
    shot(t, "80-opened")
    t.keys("Escape")
    t.keys("Escape")
    t.wait_gone(active(1))
    light(t, "80")


def main():
    E = e2e.Env()
    with tui_session(150, 40, E=E) as t:
        wide(t, E)
        print("PASS tui scheduled 150")
        narrow(t)
        print("PASS tui scheduled 80")


if __name__ == "__main__":
    run(main)
