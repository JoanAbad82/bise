#!/usr/bin/env python3
"""scripts/heavy-run's queue (flow-time): jobs get a slot by rank (--prio, a
land check, the rest, --low), then first come first served; a dead waiter's
ticket blocks nobody; heavy.log gets a start and an end line; --install puts
the script in ~/.bise/run. Runs in a temp HOME with one slot (HEAVY_SLOTS=1),
~15 s."""
import os
import subprocess
import sys
import tempfile
import time

HERE = os.path.dirname(os.path.abspath(__file__))
HEAVY = os.path.join(HERE, "..", "scripts", "heavy-run")
fails = []


def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        fails.append(what)


def wait_for(pred, secs=30):
    end = time.time() + secs
    while time.time() < end:
        if pred():
            return True
        time.sleep(0.1)
    return False


with tempfile.TemporaryDirectory() as home:
    env = dict(os.environ, HOME=home, HEAVY_SLOTS="1")
    env.pop("HEAVY_SLOT", None)
    env.pop("HEAVY_SUBMIT", None)
    run = os.path.join(home, ".bise", "run")
    log = os.path.join(run, "heavy.log")
    order = os.path.join(home, "order")
    go = os.path.join(home, "go")
    q = os.path.join(run, "queue")

    def lines():
        return open(log).read().splitlines() if os.path.exists(log) else []

    holder = subprocess.Popen([HEAVY, "sh", "-c", 'while [ ! -e "$0" ]; do sleep 0.1; done', go], env=env)
    check(wait_for(lambda: len(lines()) == 1), "the first job gets the free slot at once")
    os.makedirs(q, exist_ok=True)
    # a ticket of a waiter that died: ahead of everyone, it must block nobody
    open(os.path.join(q, "0-1-99999999"), "w").close()

    def job(name, submit, *flags):
        e = dict(env, HEAVY_SUBMIT=str(submit))
        cmd = [HEAVY, *flags, "sh", "-c", 'echo "$0" >> "$1"', name, order]
        return subprocess.Popen(cmd, env=e, stderr=subprocess.DEVNULL)

    jobs = [job("low", 999, "--low"), job("rest-a", 1000), job("land", 1002, "--land"),
            job("prio", 1003, "--prio"), job("rest-b", 1001)]
    check(wait_for(lambda: len([f for f in os.listdir(q) if not f.startswith("0-1-")]) == 5),
          "each waiting job holds a ticket")
    open(go, "w").close()
    rcs = [j.wait(timeout=60) for j in jobs]
    holder.wait(timeout=10)
    got = open(order).read().split()
    check(rcs == [0] * 5, "every job ran: %r" % rcs)
    check(got == ["prio", "land", "rest-a", "rest-b", "low"], "by rank, then by submit time: %r" % got)
    check(os.listdir(q) == [], "no ticket left behind: %r" % os.listdir(q))
    ends = [l for l in lines() if l.split("\t")[2] != "-"]
    starts = [l for l in lines() if l.split("\t")[2] == "-"]
    check(len(starts) == 6 and len(ends) == 6, "a start and an end line per job: %d/%d" % (len(starts), len(ends)))
    check(all(l.endswith("rc=0") and l.split("\t")[2].isdigit() for l in ends), "the end line has its end time and rc")

    # the job's rc comes back; a land check is ranked without --land
    r = subprocess.run([HEAVY, "sh", "-c", "exit 3", "tests/gate.sh", "full"], env=env, capture_output=True)
    check(r.returncode == 3, "the job's rc comes back: %d" % r.returncode)
    # nested: refused
    r = subprocess.run([HEAVY, "sh", "-c", '"$0" true', HEAVY], env=env, capture_output=True, text=True)
    check(r.returncode == 2 and "refused" in r.stderr, "a heavy-run inside a heavy job is refused")
    # a slot held without heavy-run (an old caller's lockf) is busy; an --alone
    # waiter (the nightly) drains the queue: a job after it never takes the
    # free slot 2 meanwhile
    on_ac = "Battery Power" not in subprocess.run(["pmset", "-g", "batt"], capture_output=True, text=True).stdout
    if on_ac:
        os.remove(order)
        go2 = os.path.join(home, "go2")
        env2 = dict(env, HEAVY_SLOTS="2")
        hold = subprocess.Popen(["/usr/bin/lockf", "-k", os.path.join(run, "heavy.lock"), "sh", "-c",
                                 'while [ ! -e "$0" ]; do sleep 0.1; done', go2])
        time.sleep(0.5)
        alone = subprocess.Popen([HEAVY, "--alone", "sh", "-c", 'echo alone >> "$0"', order], env=env2)
        check(wait_for(lambda: any(open(os.path.join(q, f)).read().strip() == "alone" for f in os.listdir(q))),
              "an --alone waiter holds an 'alone' ticket")
        rest = subprocess.Popen([HEAVY, "sh", "-c", 'echo rest >> "$0"', order], env=env2, stderr=subprocess.DEVNULL)
        time.sleep(5)
        check(not os.path.exists(order), "slot 2 free, slot 1 held by a plain lockf: nothing ran past the --alone waiter")
        open(go2, "w").close()
        alone.wait(timeout=30)
        rest.wait(timeout=30)
        hold.wait(timeout=10)
        got = open(order).read().split() if os.path.exists(order) else []
        check(got == ["alone", "rest"], "the --alone job first, then the rest: %r" % got)
    else:
        print("skip --alone on battery (it waits for AC power)")
    # --install
    r = subprocess.run([HEAVY, "--install"], env=env, capture_output=True, text=True)
    dst = os.path.join(run, "heavy-run")
    check(r.returncode == 0 and os.access(dst, os.X_OK) and open(dst).read() == open(HEAVY).read(),
          "--install copies the script to ~/.bise/run/heavy-run")

sys.exit(1 if fails else 0)
