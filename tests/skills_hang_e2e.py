#!/usr/bin/env python3
"""A SKILL.md that never answers does not stop main's first model call
(release-1007: ~/.vibe/skills/grill-me/SKILL.md linked into ~/Documents,
macOS's privacy check made the startup scan's `sed` wait ~40 min, and
main never called the model: e2e and agents_md_e2e failed on 'a model
call of main').

The scan is the session bridge's now (bend_plugins::skills, run by
`bise plugins serve` before it says it is ready). A real hub (e2e.Env),
the scripted provider, a HOME of the test's own:
  ~/.vibe/skills/stuck/SKILL.md  a link to a FIFO no one writes (its
                                 open() blocks, as on the privacy check):
                                 not a regular file, never opened
  ~/.agents/skills/alpha         a good skill
1. main's first model call comes within 30 s of the hub's start;
2. main's session index (the bridge's D/skills-index.txt) holds alpha,
   not stuck, and its first request lists alpha;
3. nothing is left reading the FIFO.
A regular file whose read hangs cannot be faked for a Rust reader
without a hook in the product: the bounded wait and the stuck list are
bend_plugins::skills's unit tests (a_stuck_path_is_named_once_...).
Never the user's ~/Documents: everything is under the test's tmp.
"""
import glob
import json
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from e2e import Env, check  # noqa: E402

SKILL = "---\nname: %s\ndescription: The %s skill.\n---\nBody.\n"

def main():
    E = Env()
    home = os.path.join(E.tmp, "home")
    for d in (".vibe/skills/stuck", ".agents/skills/alpha", "outside"):
        os.makedirs(os.path.join(home, d))
    fifo = os.path.join(home, "outside", "fifo")
    os.mkfifo(fifo)
    os.symlink(fifo, os.path.join(home, ".vibe/skills/stuck/SKILL.md"))
    open(os.path.join(home, ".agents/skills/alpha/SKILL.md"), "w").write(SKILL % ("alpha", "alpha"))
    E.env.update(HOME=home)
    ok = False
    try:
        t0 = time.time()
        c = E.start_hub()
        c.wait_status("main", "idle", 60)
        c.say("hello")
        c.wait(lambda: E.fake_requests(), 30, "main's first model call")
        took = time.time() - t0
        check(took < 30, "main's first model call %.1f s after the hub's start" % took)
        idxs = glob.glob(os.path.join(E.env["BEND_RUN_DIR"], "*", "plugins", "skills-index.txt"))
        idx = "".join(open(f).read() for f in idxs)
        names = [l.split("\t")[0] for l in idx.splitlines()]
        check(names == ["alpha"], "main's session index holds alpha alone: %r" % idx)
        body = json.dumps(E.fake_requests()[0])
        check("alpha" in body and "stuck" not in body, "main's first request lists alpha, not stuck")
        held = subprocess.run(["lsof", fifo], capture_output=True, text=True).stdout
        check(not held.strip(), "nothing holds the FIFO open: %r" % held)
        c.wait_idle("main")
        ok = True
    finally:
        E.close()
    print("PASS skills_hang_e2e" if ok else "FAIL skills_hang_e2e")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
