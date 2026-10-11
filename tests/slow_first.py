#!/usr/bin/env python3
"""The order run_all.sh starts its tests in: the longest first.

  python3 tests/slow_first.py <timings.tsv> <test>...   # prints the tests

timings.tsv is run_all's history (one line per test run: time, commit,
test, rc, wall s, cpu s, load). A test's weight is the median wall of its
last 10 runs; a test with no history weighs more than any other (a new
test may be long), and ties keep the given order. With 4 jobs and a few
3-5 min tests, starting one of them last made the batch end minutes after
the others (loop-speed.md §10).

  python3 tests/slow_first.py --self-test
"""
import statistics
import sys

UNKNOWN = float("inf")


def weights(lines):
    """{test: median wall of its last 10 runs} from timings.tsv lines."""
    runs = {}
    for line in lines:
        f = line.rstrip("\n").split("\t")
        if len(f) < 5:
            continue
        try:
            wall = float(f[4])
        except ValueError:
            continue
        runs.setdefault(f[2], []).append(wall)
    return {t: statistics.median(w[-10:]) for t, w in runs.items()}


def order(tests, w):
    i = {t: n for n, t in enumerate(tests)}
    return sorted(tests, key=lambda t: (-w.get(t, UNKNOWN), i[t]))


def self_test():
    w = weights([
        "1\tabc\ta\t0\t10\t5\t3.0\n",
        "2\tabc\tb\t0\t200\t50\t3.0\n",
        "3\tabc\tb\t0\t100\t50\t3.0\n",
        "bad line\n",
        "4\tabc\tc\t1\tx\t0\t3.0\n",
    ])
    assert w == {"a": 10.0, "b": 150.0}, w
    assert order(["a", "b", "new", "a2"], w) == ["new", "a2", "b", "a"], order(["a", "b", "new", "a2"], w)
    print("slow_first self-test: ok")


def main(argv):
    if argv[1:] == ["--self-test"]:
        return self_test()
    path, tests = argv[1], argv[2:]
    try:
        with open(path, errors="replace") as fh:
            w = weights(fh)
    except OSError:
        w = {}
    print(" ".join(order(tests, w)))


if __name__ == "__main__":
    main(sys.argv)
