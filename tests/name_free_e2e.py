#!/usr/bin/env python3
"""name-free (architect m_31139): an archived agent's name and an old
name are free to take, on a real hub (fake provider, throwaway HOME and
state, never the user's hub).

  1. /new x, /archive x, /new x: the old x is now x-2 (archived, its
     folder agents/x kept), the new x works in agents/x.2;
  2. /restore x-2 brings the old one back as x-2, next to the new x;
  3. sb history finds both threads, each under its own name;
  4. sb rename to a freed old name: a renamed to alpha, then b renamed
     to a works (it was refused while a was alpha's old name).
"""
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from e2e import EXE, Env, check  # noqa: E402


def main():
    E = Env()
    ok = False

    def sb(*args):
        env = {**E.env, "SB_SOCKET": os.path.join(E.state, "agent.sock"), "SB_AGENT": "main"}
        r = subprocess.run([EXE, "sb", *args], env=env, cwd=E.ws, capture_output=True, text=True, timeout=60)
        check(r.returncode == 0, "sb %s: %s %s" % (" ".join(args), r.stdout, r.stderr))
        return r.stdout.strip()

    try:
        c = E.start_hub()
        c.wait_status("main", "idle", 60)
        # 1. a name an archived agent had goes to a new one
        c.say("/new x: zorglub-first brief")
        c.wait_idle("x")
        c.say("/archive x --force")
        c.wait_status("x", "archived", 30)
        c.say("/new x: zorglub-second brief")
        c.wait(lambda: c.agent("x-2") is not None and (c.agent("x") or {}).get("status") != "archived", 30, "x-2 and a new x")
        check(c.agent("x-2")["status"] == "archived", "the old x is archived as x-2: %r" % c.agent("x-2"))
        c.wait_idle("x")
        agents = os.path.join(E.state, "agents")
        check("zorglub-first" in open(os.path.join(agents, "x", "transcript.log")).read(), "the old thread stays in agents/x")
        check("zorglub-second" in open(os.path.join(agents, "x.2", "transcript.log")).read(), "the new x has agents/x.2")
        c.wait_line("main", "@x (archived) is now @x-2: its name went to the new @x")
        # 2. restore the old one: x-2, the new x untouched
        c.say("/restore x-2")
        c.wait_status("x-2", ["idle", "starting", "working"], 60)
        check(c.agent("x")["status"] != "archived", "the new x still works")
        # 3. sb history finds both, each under its name
        out = sb("history", "zorglub")
        check(re.search(r"^x-2#\d+ ", out, re.M) is not None, "the old thread as x-2: " + out)
        check(re.search(r"^x#\d+ ", out, re.M) is not None, "the new thread as x: " + out)
        pos = re.search(r"^x-2#(\d+) ", out, re.M).group(1)
        check("zorglub-first" in sb("show", "x-2#" + pos), "sb show x-2#n opens the old thread")
        # 4. a rename to a freed old name
        c.say("/new a: alias owner")
        c.say("/new b: alias taker")
        c.wait_idle("a", "b")
        sb("rename", "a", "alpha")
        c.wait(lambda: c.agent("alpha") is not None, 30, "a renamed alpha")
        check(sb("rename", "b", "a") != "", "b takes a, alpha's old name")
        c.wait(lambda: c.agent("a") is not None and c.agent("b") is None, 30, "b renamed a")
        check(c.agent("alpha") is not None, "alpha keeps its name")
        ok = True
        print("ok   name-free: archived x -> x-2, new x in x.2, restore, history, rename to a freed old name")
    finally:
        if not ok:
            os.environ["SB_KEEP"] = "1"
        E.close()


if __name__ == "__main__":
    main()
