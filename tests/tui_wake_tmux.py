"""An agent waiting on an event, in the TUI (agent-waiting-states A,
designer m_22899/m_22934), through the real binaries: a throwaway hub on
the fake provider, tmux at 150 and 80 columns, dark and light.

  perf's brief backgrounds `cargo test -p storefront --release` (a fake
      cargo that sleeps, then prints 3 lines; BEND_BG_AFTER 2 s) and its
      turn ends: a PAUSE. Its panel row says `…` with its age in the time
      column, never `○`; its view's top edge and the line under its
      thread say `… continues when cargo test ends · <age>`
  the command ends: the live line goes, its thread says `· cargo test
      ended · rc 0 · after …  ▸ its last 3 lines`, never bise's message
      (`background 0 ended`); ctrl+o opens the lines
  `sb wake --on-file` with a note: an ALARM. perf stays `○`, no live
      line; the panel's `watching` says `◌ perf  →<clock>`, the note
      `if the reindex` under it;
      its rc file with 101: `the reindex ended · rc 101`, the rc in red
  the same with `--then`: a pause, `… continues when the reindex`;
      `sb wake --stop`: `– stopped waiting for the reindex`, `○` again
  at 80 columns (no panel) the alarm is `◌ 1 watching` on the composer
      rule, and the same in the light palette
  a reply still pending (ask-wait, its own hub: no BEND_BG_AFTER, so
      search's `sleep 25` holds its turn): docs asks search with `sb ask
      --timeout 3`; the hold ends with no reply and docs stays a PAUSE,
      `… continues when search answers · <age>` counted from the ask and
      counting up live, `…` on its panel row; search's turn ends, its
      reply wakes docs and the line goes

WAKE_SHOTS=<dir> keeps the captures (.txt and .ansi) for the designer.

python3 -u tests/tui_wake_tmux.py
"""
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
from tui_tmux import tui_session, run, in_view, MAIN_IDLE  # noqa: E402
from words import w  # noqa: E402

PAUSED = w("thread.pause_state")

SHOTS = os.environ.get("WAKE_SHOTS")
SECS = int(os.environ.get("WAKE_TUI_SECS", "25"))
WAITING = re.compile(r"… continues when cargo test ends · \d+[sm]")


def shot(t, name):
    if SHOTS:
        os.makedirs(SHOTS, exist_ok=True)
        with open(os.path.join(SHOTS, name + ".ansi"), "w") as f:
            f.write(t.screen(colors=True))
        with open(os.path.join(SHOTS, name + ".txt"), "w") as f:
            f.write(t.screen())


def sb(E, agent, *args):
    env = {**E.env, "SB_SOCKET": os.path.join(E.state, "agent.sock"), "SB_AGENT": agent}
    r = subprocess.run([e2e.EXE, "sb", *args], env=env, cwd=E.ws, capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, "sb %s: %s %s" % (" ".join(args), r.stdout, r.stderr)
    return r.stdout.strip()


def fake_cargo(E):
    """A `cargo` that sleeps, then prints 3 lines (the real one never runs)."""
    d = os.path.join(E.tmp, "bin")
    os.makedirs(d, exist_ok=True)
    p = os.path.join(d, "cargo")
    with open(p, "w") as f:
        f.write("#!/bin/sh\nsleep %d\necho 'running 212 tests'\necho 'test result: ok. 212 passed'\necho 'finished'\n" % SECS)
    os.chmod(p, 0o755)
    return d


def light(t, name, still):
    """`name`'s shot in the light palette, then dark again."""
    if not SHOTS:
        return
    t.typed("/theme light")
    t.keys("Enter")
    t.wait(still)
    shot(t, name)
    t.typed("/theme dark")
    t.keys("Enter")
    t.wait(still)


def view(t, name):
    t.keys("C-u")
    t.typed("/switch " + name)
    t.keys("Enter")
    t.wait("you → find an agent")
    t.keys("Enter")
    t.wait_re(in_view(name), 20)


def row(sc, name):
    """The panel's row of `name` (its glyph and columns)."""
    return next((l for l in sc.splitlines() if re.search(r"\b\d+ \S+ %s\b" % re.escape(name), l)), "")


def watch_id(E, note):
    out = sb(E, "perf", "wake")
    m = re.search(r"#(\d+) .*%s" % re.escape(note), out)
    assert m, out
    return m.group(1)


def wide(t, E, bin_dir):
    t.wait("bise :*")
    t.wait_re(MAIN_IDLE)
    brief = "the cache fix is in [[bash: PATH=%s:$PATH cargo test -p storefront --release]]" % bin_dir
    sb(E, "main", "spawn", "perf", "--objective", brief)
    t.wait("perf")
    # its turn ended, the command runs: `…`, the wait, never `○`
    sc = t.wait_re(r"\b\d+ … perf\b", 90)
    assert "○ perf" not in sc, sc
    view(t, "perf")
    sc = t.wait_re(WAITING.pattern, 30)
    # the top edge and the line under the thread
    assert len(WAITING.findall(sc)) >= 2, sc
    # the live line under the thread has a blank row above it (designer
    # m_17730): its row's left part, the feed's, is empty above it
    rows = sc.splitlines()
    k = max(i for i, r in enumerate(rows) if WAITING.search(r))
    col = rows[k].index("…")
    assert rows[k - 1][1:col + 20].strip("│ ") == "", rows[k - 1]
    shot(t, "150-waiting")
    # the command ends: the hub's line, the live line gone
    sc = t.wait(" · ".join([w("thread.wake_ended", what="cargo test"), w("thread.wake_rc", rc=0), w("thread.wake_after", dur="")]), SECS + 60)
    assert w("thread.wake_tail", n=3) in sc, sc
    # bise's wake is no message row of its own (the fake model's reply
    # echoes its words, `ack: <agent_message …> background 0 ended`)
    assert "✉︎ bise" not in sc and "✉ bise" not in sc, "bise's wake folds into the line: " + sc
    assert not any(r.strip("│ ").startswith(w("thread.wake_ended", what="background 0")) for r in sc.splitlines()), sc
    t.wait_gone("continues when cargo test", 20)
    shot(t, "150-ended")
    # a file with a note: an alarm. perf is free (○, no live line); the
    # panel's `watching` has it with its end
    rc = os.path.join(E.tmp, "reindex.rc")
    sb(E, "perf", "wake", "--on-file", rc, "--note", "the reindex")
    # designer m_22997: the agent and its end on a row, the note under it
    sc = t.wait_re(r"◌ perf +→\S+ +│\n.*│ +if the reindex", 30)
    # perf's turn on the wake above (the fake model's ack) may still run
    # under load: wait for it to end, then it is free
    sc = t.wait_re(r"\b\d+ ○ perf\b", 30)
    assert "○ perf" in row(sc, "perf"), row(sc, "perf")
    assert PAUSED not in sc, sc
    shot(t, "150-alarm")
    light(t, "150-alarm-light", "if the reindex")
    with open(rc, "w") as f:
        f.write("101\n")
    # a note names the thing (designer m_17730): `ended`, no `appeared`
    t.wait(" · ".join([w("thread.wake_ended", what="the reindex"), w("thread.wake_rc", rc=101)]), 30)
    ansi = t.screen(colors=True)
    assert re.search(r"\x1b\[[0-9;]*m\s*rc 101", ansi), "the rc in its own color"
    shot(t, "150-failed")
    t.wait_gone("◌ perf", 20)
    # the same with --then: a pause; stopped by the agent: faint, ○ again
    sb(E, "perf", "wake", "--then", "--on-file", rc + ".2", "--note", "the reindex")
    sc = t.wait("… continues when the reindex", 30)
    assert "… perf" in row(sc, "perf"), row(sc, "perf")
    shot(t, "150-pause-note")
    light(t, "150-pause-note-light", "… continues when the reindex")
    sb(E, "perf", "wake", "--stop", watch_id(E, "the reindex"))
    sc = t.wait("– stopped waiting for the reindex", 30)
    t.wait_gone("… continues when the reindex", 20)
    t.wait_re(r"\b\d+ ○ perf\b", 20)
    shot(t, "150-stopped")


def narrow(t, E):
    t.start(80, 30)
    t.wait("bise :*")
    view(t, "perf")
    t.wait(" · ".join([w("thread.wake_ended", what="cargo test"), w("thread.wake_rc", rc=0)]))
    sb(E, "perf", "wake", "--on-file", os.path.join(E.tmp, "x.rc"), "--note", "the reindex")
    sc = t.wait_re(r"you → perf .*◌ 1 watching", 30)
    for line in sc.splitlines():
        # `✉︎` is 2 code points (its text-style selector) in 1 cell
        assert len(line.replace("\ufe0e", "")) <= 80, line
    assert PAUSED not in sc, sc
    shot(t, "80-alarm")
    light(t, "80-alarm-light", "◌ 1 watching")
    # /scheduled lists it under `watching`: x stops it
    t.typed("/scheduled")
    t.keys("Enter")
    t.wait("x stop watching", 20)
    shot(t, "80-scheduled")
    t.keys("Escape")
    t.wait_gone("x stop watching", 20)
    sb(E, "perf", "wake", "--then", "--on-file", os.path.join(E.tmp, "y.rc"), "--note", "the reindex ends")
    t.wait("… continues when the reindex ends", 30)
    shot(t, "80-pause")
    t.typed("/theme light")
    t.keys("Enter")
    t.wait("… continues when the reindex ends")
    shot(t, "80-pause-light")
    t.typed("/theme dark")
    t.keys("Enter")


def reply_row(t, E):
    t.wait("bise :*")
    t.wait_re(MAIN_IDLE)
    sb(E, "main", "spawn", "search", "--objective", "look it up [[bash: sleep 25; echo found]]")
    sb(E, "main", "spawn", "docs", "--objective", "write the docs")
    t.wait_re(r"\b\d+ ○ docs\b", 90)
    env = {**E.env, "SB_SOCKET": os.path.join(E.state, "agent.sock"), "SB_AGENT": "docs"}
    r = subprocess.run([e2e.EXE, "sb", "ask", "search", "which port?", "--timeout", "3"], env=env, cwd=E.ws, capture_output=True, text=True, timeout=60)
    assert "no answer" in (r.stdout + r.stderr).lower() or "timeout" in (r.stdout + r.stderr).lower(), (r.stdout, r.stderr)
    view(t, "docs")
    line = re.compile(r"… continues when search answers · (\d+)s")
    sc = t.wait_re(line.pattern, 30)
    first = int(line.search(sc).group(1))
    assert first >= 3, "counted from the ask, not from the hold's end: " + sc
    assert "… docs" in row(sc, "docs"), row(sc, "docs")
    shot(t, "150-reply-pause")
    # it counts up live
    t.wait_re(r"… continues when search answers · (?:%s)s" % "|".join(str(n) for n in range(first + 3, 60)), 20)
    # search's turn ends: its reply wakes docs, the line goes
    t.wait_gone("%s %s" % (PAUSED, w("thread.event_answers", name="search")), 90)
    shot(t, "150-reply-answered")


def main():
    E = e2e.Env()
    E.env["BEND_BG_AFTER"] = "2"
    bin_dir = fake_cargo(E)
    with tui_session(150, 40, E=E) as t:
        wide(t, E, bin_dir)
        print("PASS tui wake 150")
        narrow(t, E)
        print("PASS tui wake 80")
    with tui_session(150, 40) as t:
        reply_row(t, t.E)
        print("PASS tui wake reply")


if __name__ == "__main__":
    run(main)
