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


def job_ends(p, secs=30):
    """The process's rc once it ends, waiting as wait.until does (scaled by
    the machine's load: a fixed 30 s timed out at load 120); None if not."""
    wait_for(lambda: p.poll() is not None, secs, "the job ends")
    return p.poll()


def held(slot):
    """The slot is taken (a probe with lockf -t 0 fails)."""
    return subprocess.run(["/usr/bin/lockf", "-k", "-t", "0", slot, "true"], capture_output=True).returncode != 0


with tempfile.TemporaryDirectory() as home:
    # plenty of faked free space: the real disk's never makes a job wait here
    open(os.path.join(home, "plenty_kb"), "w").write(str(500 * 1048576))
    # on AC as far as heavy-run knows (HEAVY_ON_BATTERY=0): the --alone cases run on battery too
    env = dict(os.environ, HOME=home, HEAVY_SLOTS="1", HEAVY_FREE_KB_FILE=os.path.join(home, "plenty_kb"), HEAVY_ON_BATTERY="0",
               # the machine's real load never holds a job here (the load cases fake it)
               HEAVY_LOAD_MAX="9999", HEAVY_START_GAP="0", HEAVY_RECLAIM_GAP="0", HEAVY_RECLAIM="true")
    env.pop("SB_AGENT", None)
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
    # (no release lane here: a --prio job would run in it at once, no waiter)
    dead = subprocess.Popen([HEAVY, "--prio", "true"], env=dict(env, HEAVY_SUBMIT="1", HEAVY_NO_LANE="1"), stderr=subprocess.DEVNULL)
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
    # the release lane (heavy5.lock, fast-loop): every agent slot held, a --prio
    # job runs at once in the lane; a plain job never takes it
    go5 = os.path.join(home, "go5")
    hold = subprocess.Popen([HEAVY, "sh", "-c", 'while [ ! -e "$0" ]; do sleep 0.1; done', go5], env=env)
    check(wait_for(lambda: held(os.path.join(run, "heavy.lock"))), "a job holds the one agent slot")
    r = subprocess.run([HEAVY, "--prio", "sh", "-c", 'echo "$HEAVY_SLOT"'], env=env, capture_output=True, text=True, timeout=30)
    check(r.returncode == 0 and r.stdout.split()[:1] == ["heavy5.lock"], "a --prio job runs in the release lane: %r" % r.stdout)
    plain = subprocess.Popen([HEAVY, "true"], env=env, stderr=subprocess.DEVNULL)
    check(stays(lambda: plain.poll() is None, 2, "the plain job waits"), "a plain job never takes the release lane")
    open(go5, "w").close()
    check(plain.wait(timeout=30) == 0, "the plain job runs once the agent slot frees")
    hold.wait(timeout=10)
    # a slot held without heavy-run (an old caller's lockf) is busy; an --alone
    # waiter (the nightly) drains the queue: a job after it never takes the
    # free slot 2 meanwhile
    on_ac = True  # HEAVY_ON_BATTERY=0 in env
    if on_ac:
        os.remove(order)
        go2 = os.path.join(home, "go2")
        env2 = dict(env, HEAVY_SLOTS="2", HEAVY_ALONE_DRAIN_MIN="0")  # past its drain time at once
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
        # a young --alone waiter (main m_37006) holds no slot and nobody back: a job after it
        # runs in the free slot 2 while slot 1 is busy; the --alone job runs once all are free
        os.remove(order)
        go7 = os.path.join(home, "go7")
        envy = dict(env, HEAVY_SLOTS="2", HEAVY_ALONE_DRAIN_MIN="10")
        hold = subprocess.Popen(["/usr/bin/lockf", "-k", os.path.join(run, "heavy.lock"), "sh", "-c",
                                 'while [ ! -e "$0" ]; do sleep 0.1; done', go7])
        wait_for(lambda: held(os.path.join(run, "heavy.lock")), what="the plain lockf holds slot 1")
        alone = subprocess.Popen([HEAVY, "--alone", "sh", "-c", 'echo alone >> "$0"', order], env=envy)
        check(wait_for(lambda: any(open(os.path.join(q, f)).read().split()[-1:] == ["alone"] for f in os.listdir(q))),
              "the young --alone waiter has its ticket")
        rest = subprocess.Popen([HEAVY, "sh", "-c", 'echo rest >> "$0"', order], env=envy, stderr=subprocess.DEVNULL)
        check(job_ends(rest, 30) == 0 and open(order).read().split() == ["rest"],
              "a job after a young --alone waiter runs in the free slot: %r" % (open(order).read() if os.path.exists(order) else None))
        check(alone.poll() is None and not held(os.path.join(run, "heavy2.lock")),
              "the --alone waiter holds no slot while one is busy")
        open(go7, "w").close()
        job_ends(hold, 10)
        check(job_ends(alone, 30) == 0 and open(order).read().split() == ["rest", "alone"], "the --alone job runs once all 4 are free")
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
        job_ends(land)
        job_ends(meas)
        job_ends(hold)
        got = open(order).read().split() if os.path.exists(order) else []
        check(got == ["land", "alone"], "a land check before an --alone measure: %r" % got)
        # an --alone job that ran while a release-lane job ran: its end line says
        # 'lane=busy' (the lane runs beside it; a timing red may come from it)
        go6 = os.path.join(home, "go6")
        lane = subprocess.Popen([HEAVY, "--prio", "sh", "-c", 'while [ ! -e "$0" ]; do sleep 0.1; done', go6], env=env1,
                                stderr=subprocess.DEVNULL)
        # read from heavy.log, not by probing the lock: a probe holds the lock for
        # a moment, and at load 100+ the --prio job's own try met it and took slot 1
        check(wait_for(lambda: any(l.split("\t")[2:4] == ["-", "heavy5.lock"] and "go6" in l for l in lines())),
              "a --prio job holds the release lane")
        a = subprocess.run([HEAVY, "--alone", "sh", "-c", "echo marked"], env=env1, capture_output=True, text=True, timeout=30)
        open(go6, "w").close()
        lane.wait(timeout=10)
        end = [l for l in lines() if l.split("\t")[2] != "-" and "echo marked" in l]
        check(a.returncode == 0 and len(end) == 1 and end[0].endswith("rc=0\tlane=busy"), "an --alone job beside the lane is marked: %r" % end)
    else:
        print("skip --alone on battery (it waits for AC power)")
    # the disk (disk-guard): faked free space; under 15 GB a job waits and
    # says why (stderr and the agent's status, a fake sb); a running job is
    # stopped under 5 GB with rc=28 and a clear line
    GB = 1048576
    freef = os.path.join(home, "free_kb")
    said = os.path.join(home, "sb_said")
    fbin = os.path.join(home, "bin")
    os.makedirs(fbin, exist_ok=True)
    with open(os.path.join(fbin, "sb"), "w") as fh:
        fh.write('#!/bin/sh\necho "$*" >> "%s"\n' % said)
    os.chmod(os.path.join(fbin, "sb"), 0o755)
    envd = dict(env, HEAVY_FREE_KB_FILE=freef, HEAVY_DISK_POLL="0.2", SB_AGENT="fake",
                PATH=fbin + os.pathsep + env["PATH"])
    open(freef, "w").write(str(12 * GB))
    ran = os.path.join(home, "disk_ran")
    errf = open(os.path.join(home, "disk_err"), "w+")
    waiter = subprocess.Popen([HEAVY, "sh", "-c", 'touch "$0"', ran], env=envd, stderr=errf)
    check(stays(lambda: not os.path.exists(ran), 2, "the job waits"), "12 GB free: the job waits for disk")
    sb_lines = lambda: open(said).read() if os.path.exists(said) else ""
    check("waiting for disk room: 12 GB free" in sb_lines() and sb_lines().startswith("status working --note"),
          "the waiting agent's status says why: %r" % sb_lines())
    open(freef, "w").write(str(20 * GB))
    check(waiter.wait(timeout=30) == 0 and os.path.exists(ran), "20 GB free: the job runs")
    errf.seek(0)
    err = errf.read()
    check("heavy-run: waiting for disk room: 12 GB free" in err and "disk room again (20 GB free)" in err,
          "stderr names the wait and its end: %r" % err)
    r = subprocess.Popen([HEAVY, "sh", "-c", 'sleep 60 & wait', "x"], env=envd, stderr=subprocess.PIPE, text=True)
    wait_for(lambda: len([l for l in lines() if l.split("\t")[2] == "-"]) > len(
        [l for l in lines() if l.split("\t")[2] != "-"]), what="the long job runs")
    t0 = time.time()
    open(freef, "w").write(str(3 * GB))
    try:
        _, err = r.communicate(timeout=20)
    except subprocess.TimeoutExpired:
        r.kill()
        _, err = r.communicate()
    check(r.returncode == 28 and time.time() - t0 < 15, "3 GB free: the running job is stopped, rc=28: %r" % r.returncode)
    check("heavy-run: stopped" in err and "3 GB free" in err, "the stop line says why: %r" % err)
    check("heavy-run: stopped" in sb_lines(), "the stop goes to the agent's status")
    check(lines()[-1].endswith("rc=28"), "heavy.log ends the job with rc=28: %r" % lines()[-1])
    check(not [f for f in os.listdir(run) if f.startswith("disk-stop.")], "no disk-stop marker left")
    # the reserves (mac-budget): a job needs 15 GB + its reserve + what the
    # running jobs reserved; while it waits, the reclaim runs (a fake here)
    reclaimed = os.path.join(home, "reclaim_args")
    fake_reclaim = os.path.join(fbin, "reclaim")
    with open(fake_reclaim, "w") as fh:
        fh.write('#!/bin/sh\necho "$*" >> "%s"\n' % reclaimed)
    os.chmod(fake_reclaim, 0o755)
    envr = dict(envd, HEAVY_SLOTS="2", HEAVY_RECLAIM=fake_reclaim)
    open(freef, "w").write(str(25 * GB))
    go_r = os.path.join(home, "go_reserve")
    big = subprocess.Popen([HEAVY, "sh", "-c", 'while [ ! -e "$0" ]; do sleep 0.1; done', go_r],
                           env=dict(envr, HEAVY_RESERVE_GB="10"), stderr=subprocess.DEVNULL)
    check(wait_for(lambda: [f for f in os.listdir(os.path.join(run, "reserve")) if f.startswith("heavy")]
                   if os.path.isdir(os.path.join(run, "reserve")) else False),
          "a running job leaves its reserve in ~/.bise/run/reserve")
    ran2 = os.path.join(home, "ran2")
    e2 = open(os.path.join(home, "err2"), "w+")
    second = subprocess.Popen([HEAVY, "sh", "-c", 'touch "$0"', ran2], env=envr, stderr=e2)
    check(stays(lambda: not os.path.exists(ran2), 2, "the second job waits"),
          "25 GB free, 10 reserved by a running job: a 2 GB job waits (needs 27) %r" % lines()[-3:])
    check(wait_for(lambda: os.path.exists(reclaimed) and "--want 27" in open(reclaimed).read(), 10),
          "the waiting job asks the reclaim for 27 GB")
    e2.seek(0)
    check("starts at 27 GB (15 kept free + 2 it may write + 10 the running jobs may still write)" in e2.read(), "the wait says the sum")
    open(freef, "w").write(str(27 * GB))
    check(job_ends(second, 30) == 0 and os.path.exists(ran2), "27 GB free: it runs")
    # what the disk lost since the running job started counts as written by
    # it: started at 30 GB free, now 22 (8 written): 2 left, a 2 GB job
    # needs 19 and runs (the whole sum would want 27: main m_36317)
    open(go_r, "w").close()
    job_ends(big, 30)
    open(freef, "w").write(str(30 * GB))
    go_w = os.path.join(home, "go_written")
    big = subprocess.Popen([HEAVY, "sh", "-c", 'while [ ! -e "$0" ]; do sleep 0.1; done', go_w],
                           env=dict(envr, HEAVY_RESERVE_GB="10"), stderr=subprocess.DEVNULL)
    check(wait_for(lambda: [f for f in os.listdir(os.path.join(run, "reserve")) if f.startswith("heavy")]),
          "the 10 GB job runs")
    open(freef, "w").write(str(22 * GB))
    ran5 = os.path.join(home, "ran5")
    r = subprocess.run([HEAVY, "sh", "-c", 'touch "$0"', ran5], env=envr, capture_output=True, text=True, timeout=30)
    check(r.returncode == 0 and os.path.exists(ran5), "8 GB written since it started: a 2 GB job runs at 22 GB free: %r" % r.stderr[-300:])
    open(go_w, "w").close()
    job_ends(big, 30)
    check(not [f for f in os.listdir(os.path.join(run, "reserve"))], "the reserves are gone with their jobs")
    # the load (mac-budget): with a heavy job running, a new one waits while
    # the load is over HEAVY_LOAD_MAX; a lone job never waits for it
    loadf = os.path.join(home, "load")
    open(loadf, "w").write("50")
    envl = dict(envr, HEAVY_LOAD_FILE=loadf, HEAVY_LOAD_MAX="24")
    ran3 = os.path.join(home, "ran3")
    lone = subprocess.run([HEAVY, "sh", "-c", 'touch "$0"', ran3], env=envl, capture_output=True, timeout=30)
    check(lone.returncode == 0 and os.path.exists(ran3), "load 50, no heavy job: a lone job runs")
    go_l = os.path.join(home, "go_load")
    hold = subprocess.Popen([HEAVY, "sh", "-c", 'while [ ! -e "$0" ]; do sleep 0.1; done', go_l], env=envl,
                            stderr=subprocess.DEVNULL)
    # its start line, not a probe of the lock (a probe can meet a waiter's own try)
    wait_for(lambda: any(l.split("\t")[2] == "-" and "go_load" in l for l in lines()), what="slot 1 held")
    ran4 = os.path.join(home, "ran4")
    e4 = open(os.path.join(home, "err4"), "w+")
    w4 = subprocess.Popen([HEAVY, "sh", "-c", 'touch "$0"', ran4], env=envl, stderr=e4)
    check(stays(lambda: not os.path.exists(ran4), 3, "it waits"), "load 50, a heavy job runs: the next one waits %r" % lines()[-3:])
    e4.seek(0)
    check("the machine is busy (load 50, the limit 24" in e4.read(), "the wait says the load")
    # the load gate keeps the queue's order (rank, then submit time) and
    # never holds the --prio lane (review-gates m_36096)
    lorder = os.path.join(home, "load_order")
    rest_a = subprocess.Popen([HEAVY, "sh", "-c", 'echo rest-a >> "$0"', lorder], env=dict(envl, HEAVY_SUBMIT="5000"),
                              stderr=subprocess.DEVNULL)
    rest_b = subprocess.Popen([HEAVY, "sh", "-c", 'echo rest-b >> "$0"', lorder], env=dict(envl, HEAVY_SUBMIT="5001"),
                              stderr=subprocess.DEVNULL)
    land2 = subprocess.Popen([HEAVY, "--land", "sh", "-c", 'echo land >> "$0"', lorder], env=dict(envl, HEAVY_SUBMIT="5002"),
                             stderr=subprocess.DEVNULL)
    r = subprocess.run([HEAVY, "--prio", "sh", "-c", 'echo "$HEAVY_SLOT"'], env=dict(envl, HEAVY_NO_LANE=""), capture_output=True,
                       text=True, timeout=30)
    check(r.returncode == 0 and r.stdout.startswith("heavy5.lock"), "load 50: a --prio job still runs in the lane: %r" % r.stdout)
    check(wait_for(lambda: len(os.listdir(q)) >= 4), "the held jobs wait with their tickets")
    open(loadf, "w").write("10")
    check(job_ends(w4, 30) == 0 and os.path.exists(ran4), "load 10: it runs")
    for j in (rest_a, rest_b, land2):
        job_ends(j, 60)
    # the load never starves a job: past HEAVY_LOAD_WAIT_MAX it goes
    open(loadf, "w").write("50")
    ran6 = os.path.join(home, "ran6")
    r = subprocess.run([HEAVY, "sh", "-c", 'touch "$0"', ran6], env=dict(envl, HEAVY_LOAD_WAIT_MAX="3"), capture_output=True,
                       text=True, timeout=60)
    check(r.returncode == 0 and os.path.exists(ran6) and "3 s at most" in r.stderr,
          "load 50 for good: the job goes after HEAVY_LOAD_WAIT_MAX: %r" % r.stderr[-300:])
    got = open(lorder).read().split() if os.path.exists(lorder) else []
    check(got == ["land", "rest-a", "rest-b"], "after the load wait, by rank then submit time: %r" % got)
    open(go_l, "w").close()
    job_ends(hold, 30)
    # the time limit: a job over HEAVY_MAX_MIN is stopped, rc=124
    r = subprocess.run([HEAVY, "sh", "-c", "sleep 60 & wait"], env=dict(envr, HEAVY_MAX_MIN="1", HEAVY_MAX_SEC="2"),
                       capture_output=True, text=True, timeout=40)
    check(r.returncode == 124 and "over its limit (HEAVY_MAX_MIN=1)" in r.stderr,
          "a job over its time limit is stopped, rc=124: %r %r" % (r.returncode, r.stderr[-200:]))
    check(lines()[-1].endswith("rc=124"), "heavy.log ends it with rc=124")
    # an --alone job that uses no CPU (main m_36953: a hung caffeinate held every slot 3 h at 0 %):
    # stopped past HEAVY_IDLE_MIN, rc=124, said; one that burns CPU runs on (0.1 s a window here: the
    # test machine may be loaded); a plain job never
    # (plenty of disk: envr carries the disk cases' low free space, an --alone job reserves 10 GB)
    roomy = dict(envr, HEAVY_FREE_KB_FILE=os.path.join(home, "plenty_kb"))
    idle = dict(roomy, HEAVY_IDLE_MIN="1", HEAVY_IDLE_SEC="4", HEAVY_IDLE_POLL="1", HEAVY_IDLE_CPU_CS="10", HEAVY_DISK_POLL="1")
    try:
        r = subprocess.run([HEAVY, "--alone", "sh", "-c", "sleep 60 & wait"], env=idle, capture_output=True, text=True, timeout=60)
    except subprocess.TimeoutExpired as e:
        r = subprocess.CompletedProcess(e.cmd, -1, "", (e.stderr or b"").decode() if isinstance(e.stderr, bytes) else (e.stderr or ""))
    check(r.returncode == 124 and "an --alone job (it holds every slot) used no CPU for 1 min" in r.stderr,
          "an idle --alone job is stopped, rc=124: %r %r" % (r.returncode, r.stderr[-300:]))
    burn = 'import time\nt = time.time()\nwhile time.time() - t < 8: pass'
    r = subprocess.run([HEAVY, "--alone", sys.executable, "-c", burn], env=idle, capture_output=True, text=True, timeout=60)
    check(r.returncode == 0, "a busy --alone job runs past HEAVY_IDLE_SEC: %r %r" % (r.returncode, r.stderr[-300:]))
    r = subprocess.run([HEAVY, "sh", "-c", "sleep 6 & wait"], env=idle, capture_output=True, text=True, timeout=60)
    check(r.returncode == 0, "a plain job is never stopped for idling: %r %r" % (r.returncode, r.stderr[-300:]))
    # the waiting line names the jobs holding the slots (slot, folder, minutes, command)
    go_h = os.path.join(home, "go_h")
    hw = os.path.join(home, "holder-wt")
    os.makedirs(hw)
    hold2 = [subprocess.Popen([HEAVY, "sh", "-c", 'while [ ! -e "$0" ]; do sleep 0.2; done', go_h], env=roomy, cwd=hw) for _ in range(2)]
    wait_for(lambda: len([f for f in os.listdir(os.path.join(run, "reserve")) if not f.startswith(".")]) >= 2, 30, "two jobs hold both slots")
    eh = open(os.path.join(home, "errh"), "w+")
    wh = subprocess.Popen([HEAVY, "true"], env=roomy, stderr=eh)
    wait_for(lambda: "busy or promised" in open(eh.name).read(), 30, "the waiter's line")
    eh.seek(0)
    said = eh.read()
    check("held by: heavy" in said and " holder-wt 0 min: sh -c while" in said, "the waiting line names the holders: %r" % said)
    open(go_h, "w").close()
    for j in hold2 + [wh]:
        job_ends(j, 30)
    # an --alone job's time limit is the rest's (120 min); the nightly's stays 360
    check("*\" --alone \"*) echo 120" in open(HEAVY).read() and "*nightly_gate.sh*) echo 360" in open(HEAVY).read(),
          "max_min: --alone 120, the nightly 360")
    # the battery: on battery under 30 %, no job starts; plugged in, it runs
    ranb = os.path.join(home, "ranb")
    eb = open(os.path.join(home, "errb"), "w+")
    wb = subprocess.Popen([HEAVY, "sh", "-c", 'touch "$0"', ranb], env=dict(envr, HEAVY_ON_BATTERY="1", HEAVY_BATTERY_PCT="12"),
                          stderr=eb)
    check(stays(lambda: not os.path.exists(ranb), 2, "it waits"), "on battery at 12 %: the job waits")
    wb.kill()
    wb.wait()
    eb.seek(0)
    check("on battery at 12 %, under 30 %: plug the Mac in" in eb.read(), "the wait says plug it in")
    r = subprocess.run([HEAVY, "sh", "-c", 'touch "$0"', ranb], env=dict(envr, HEAVY_ON_BATTERY="1", HEAVY_BATTERY_PCT="80"),
                       capture_output=True, timeout=30)
    check(r.returncode == 0 and os.path.exists(ranb), "on battery at 80 %: it runs")
    # the per-slot threads, and an --alone job keeps the defaults
    r = subprocess.run([HEAVY, "sh", "-c", 'echo "$RUST_TEST_THREADS/$SB_TEST_JOBS/$CARGO_BUILD_JOBS"'],
                       env={k: v for k, v in envr.items() if k not in ("RUST_TEST_THREADS", "SB_TEST_JOBS", "CARGO_BUILD_JOBS")},
                       capture_output=True, text=True, timeout=30)
    check(r.stdout.strip() == "4/2/4", "a slot gets 4 test threads, 2 e2e jobs, 4 cargo jobs: %r" % r.stdout)
    # a reclaimed target: the owner's next job there says so, once
    wt = os.path.join(home, "wt")
    os.makedirs(os.path.join(wt, "rust", "target"))
    open(os.path.join(wt, "rust", "target", "RECLAIMED.txt"), "w").write("heavy-run: this cargo target was deleted at X\n")
    r = subprocess.run([HEAVY, "true"], env=envr, cwd=wt, capture_output=True, text=True, timeout=30)
    check("this cargo target was deleted at X" in r.stderr and not os.path.exists(os.path.join(wt, "rust", "target", "RECLAIMED.txt")),
          "the next job in that worktree prints RECLAIMED.txt and removes it: %r" % r.stderr[-300:])
    # --install
    r = subprocess.run([HEAVY, "--install"], env=env, capture_output=True, text=True)
    dst = os.path.join(run, "heavy-run")
    check(r.returncode == 0 and os.access(dst, os.X_OK) and open(dst).read() == open(HEAVY).read(),
          "--install copies the script to ~/.bise/run/heavy-run")
    check(open(os.path.join(run, "disk_reclaim.py")).read() == open(os.path.join(HERE, "..", "scripts", "disk_reclaim.py")).read(),
          "--install puts disk_reclaim.py next to it")

sys.exit(1 if fails else 0)
