#!/usr/bin/env python3
"""tests/wait.py counts awake time, never the wall clock (issue 26).

The Mac took 'Maintenance Sleep' under the gate (display off, caffeinate -i
held): at the wake the wall clock had jumped 349 s, and partial_e2e's
120 s wait for main's answer failed at once ("timeout after 365 s", last
seen: []). A wall clock that jumps 1000 s mid-wait stands for that sleep
here: until, holds and stable go on with what is left of their wait.
Also checks that wait.now is a clock that stops in sleep (macOS: the mach
clock, mach_absolute_time) and that a real timeout still fires.

  python3 -B tests/wait_test.py
"""
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import wait  # noqa: E402

FAILS = []


def check(ok, what):
    print("%s %s" % ("ok  " if ok else "FAIL", what))
    if not ok:
        FAILS.append(what)


def jumping_wall_clock():
    """time.time that jumps 1000 s at its second call (a sleep): the
    restore function."""
    real, calls = time.time, [0]

    def fake():
        calls[0] += 1
        return real() + (1000 if calls[0] > 1 else 0)
    time.time = fake
    return lambda: setattr(time, "time", real)


def after(seconds):
    """A state that comes `seconds` of awake time from now."""
    t0 = wait.now()
    return lambda: wait.now() - t0 >= seconds and "there"


def main():
    if sys.platform == "darwin":
        info = time.get_clock_info("monotonic")
        check(wait.now is time.monotonic and info.implementation.startswith("mach_absolute_time"),
              "wait.now is the mach clock, which stops while the Mac sleeps (%s)" % info.implementation)
    else:
        check(wait.now is time.monotonic, "wait.now is time.monotonic")

    restore = jumping_wall_clock()
    try:
        got = None
        try:
            got = wait.until(after(0.3), 1, "a state 0.3 s away")
        except AssertionError as e:
            got = e
        check(got == "there", "until: a 1000 s jump of the wall clock is no timeout: %r" % got)
        try:
            got = wait.holds(lambda: True, 0.3, "a true state")
        except AssertionError as e:
            got = e
        check(got is True, "holds: the window is 0.3 s of awake time, not cut by the jump: %r" % got)
        n = [0]

        def settles():
            n[0] += 1
            return min(n[0], 3)
        try:
            got = wait.stable(settles, 2, "a value that settles", quiet=0.3, poll=0.05)
        except AssertionError as e:
            got = e
        check(got == 3, "stable: settled after its quiet time, not timed out by the jump: %r" % got)
    finally:
        restore()

    # its wait is 0.2 s times load_factor() (up to x4: "timeout after 1 s"
    # on a loaded machine, the full suite's): it fires, and near that end
    t0 = wait.now()
    try:
        wait.until(lambda: False, 0.2, "a state that never comes", poll=0.05)
        got = "returned"
    except AssertionError as e:
        got = str(e)
    spent = wait.now() - t0
    check(got.startswith("timeout after ") and "waiting for a state that never comes" in got
          and spent < 0.2 * wait.load_factor() + 2, "a real timeout still fires: %r after %.1f s" % (got, spent))

    if FAILS:
        sys.exit("wait_test: %d failed" % len(FAILS))
    print("wait_test: ok")


if __name__ == "__main__":
    main()
