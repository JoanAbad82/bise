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

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import wait  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
HEAVY = os.path.join(HERE, "..", "scripts", "heavy-run")
fails = []


def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        fails.append(what)


def wait_for(pred, secs=30, what="the state"):
    try:
        return bool(wait.until(pred, secs, what))
    except AssertionError as e:
        print("     " + str(e)[:300])
        return False


def stays(pred, secs, what):
    try:
        return bool(wait.holds(pred, secs, what))
    except AssertionError as e:
        print("     " + str(e)[:300])
        return False


def held(slot):
    """The slot is taken (a probe with lockf -t 0 fails)."""
    return subprocess.run(["/usr/bin/lockf", "-k", "-t", "0", slot, "true"], capture_output=True).returncode != 0


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

    # a SIGKILLed waiter's ticket and a reused pid's ticket (a process
    # younger than the ticket) block nobody
    go3 = os.path.join(home, "go3")
    holder = subprocess.Popen([HEAVY, "sh", "-c", 'while [ ! -e "$0" ]; do sleep 0.1; done', go3], env=env)
    check(wait_for(lambda: len([l for l in lines() if l.split("\t")[2] == "-"]) == 7), "a holder takes the slot")
    dead = subprocess.Popen([HEAVY, "--prio", "true"], env=dict(env, HEAVY_SUBMIT="1"), stderr=subprocess.DEVNULL)
    check(wait_for(lambda: any(f.startswith("0-1-") for f in os.listdir(q))), "a --prio waiter's ticket")
    dead.kill()
    dead.wait()
    young = subprocess.Popen(["sleep", "60"])
    with open(os.path.join(q, "0-2-%d" % young.pid), "w") as fh:
        fh.write("%d" % (time.time() - 1000))
    after = subprocess.Popen([HEAVY, "sh", "-c", 'echo "$HEAVY_SLOT" > "$0"', os.path.join(home, "slotenv")], env=env,
                             stderr=subprocess.DEVNULL)
    wait_for(lambda: any(f.startswith("2-") for f in os.listdir(q)), what="the next job's ticket")
    open(go3, "w").close()
    check(after.wait(timeout=30) == 0, "the next job runs past a killed waiter's and a reused pid's tickets")
    young.kill()
    holder.wait(timeout=10)
    slot_env = open(os.path.join(home, "slotenv")).read().split()
    check(len(slot_env) == 2 and slot_env[0] == "heavy.lock" and slot_env[1].isdigit(),
          "the job has HEAVY_SLOT=<slot> <pid>: %r" % slot_env)
    check(os.listdir(q) == [], "the dead tickets are gone: %r" % os.listdir(q))

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
        wait_for(lambda: held(os.path.join(run, "heavy.lock")), what="the plain lockf holds slot 1")
        alone = subprocess.Popen([HEAVY, "--alone", "sh", "-c", 'echo alone >> "$0"', order], env=env2)
        check(wait_for(lambda: any(open(os.path.join(q, f)).read().split()[-1:] == ["alone"] for f in os.listdir(q))),
              "an --alone waiter holds an 'alone' ticket")
        rest = subprocess.Popen([HEAVY, "sh", "-c", 'echo rest >> "$0"', order], env=env2, stderr=subprocess.DEVNULL)
        check(stays(lambda: not os.path.exists(order), 3, "nothing runs"),
              "slot 2 free, slot 1 held by a plain lockf: nothing ran past the --alone waiter")
        open(go2, "w").close()
        alone.wait(timeout=30)
        rest.wait(timeout=30)
        hold.wait(timeout=10)
        got = open(order).read().split() if os.path.exists(order) else []
        check(got == ["alone", "rest"], "the --alone job first, then the rest: %r" % got)
        # an --alone measure keeps its class: after a land check submitted before it
        os.remove(order)
        go4 = os.path.join(home, "go4")
        hold = subprocess.Popen(["/usr/bin/lockf", "-k", os.path.join(run, "heavy.lock"), "sh", "-c",
                                 'while [ ! -e "$0" ]; do sleep 0.1; done', go4])
        wait_for(lambda: held(os.path.join(run, "heavy.lock")), what="the plain lockf holds slot 1")
        env1 = dict(env, HEAVY_SLOTS="1")
        land = subprocess.Popen([HEAVY, "--land", "sh", "-c", 'echo land >> "$0"', order], env=dict(env1, HEAVY_SUBMIT="3000"),
                                stderr=subprocess.DEVNULL)
        meas = subprocess.Popen([HEAVY, "--alone", "sh", "-c", 'echo alone >> "$0"', order], env=dict(env1, HEAVY_SUBMIT="3001"))
        check(wait_for(lambda: len(os.listdir(q)) == 2), "both wait with a ticket")
        check(stays(lambda: not os.path.exists(order), 2, "nothing runs"),
              "the --alone measure takes no slot while a land check is ahead")
        open(go4, "w").close()
        land.wait(timeout=30)
        meas.wait(timeout=30)
        hold.wait(timeout=10)
        got = open(order).read().split() if os.path.exists(order) else []
        check(got == ["land", "alone"], "a land check before an --alone measure: %r" % got)
    else:
        print("skip --alone on battery (it waits for AC power)")
    # --install
    r = subprocess.run([HEAVY, "--install"], env=env, capture_output=True, text=True)
    dst = os.path.join(run, "heavy-run")
    check(r.returncode == 0 and os.access(dst, os.X_OK) and open(dst).read() == open(HEAVY).read(),
          "--install copies the script to ~/.bise/run/heavy-run")

sys.exit(1 if fails else 0)
