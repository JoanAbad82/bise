#!/usr/bin/env python3
"""`bise office run` on a real hub (docs/office.md; plan §2, §9.2-3).

A real hub, the scripted provider (e2e.Env), a temp HOME. The task t1
works in its own worktree; `bise office run` runs from this script as
t1's bash would (SB_SOCKET, SB_AGENT=t1, BEND_WORKDIR its worktree, its
own TMPDIR), with bend-jsrt and office/dist/office.js from the dev tree.

  a plain run.write of a new file: written, "not an artifact", no row
  run.write(.., { artifact: true }): the artifact, v1, its ↗ line in t1's thread
  a plain run.write of that file again: its v2 (known_only)
  inspect of a file that is no office file: exit 1, the words on stderr
  a read outside the worktree and TMPDIR: refused, exit 1, the roots named
"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from e2e import EXE, Env, check  # noqa: E402

SCRIPT = r'''
import { run, kindOf } from "@bise/office";
const bytes = await run.read(%(src)s);
console.log("kind", kindOf(bytes));
console.log(await run.write("out/plain.docx", bytes));
console.log(await run.write("out/deck.docx", bytes, { artifact: true }));
console.log(await run.write("out/deck.docx", new Uint8Array([...bytes, 0])));
'''


def main():
    E = Env()
    home = os.path.join(E.tmp, "home")
    os.makedirs(home)
    E.env.update(HOME=home, XDG_STATE_HOME=os.path.join(home, "state"))
    ok = False

    def office(agent, wt, tmp, *args):
        env = {**E.env, "SB_SOCKET": os.path.join(E.state, "agent.sock"), "SB_AGENT": agent,
               "BEND_WORKDIR": wt, "TMPDIR": tmp}
        env.pop("BISE_APP_ROOT", None)
        return subprocess.run([EXE, "office", *args], env=env, cwd=wt, capture_output=True, text=True, timeout=120)

    try:
        c = E.start_hub()
        c.wait_status("main", "idle", 60)
        out = subprocess.run([EXE, "sb", "spawn", "t1", "--place", "new", "--objective", "hello t1"], cwd=E.ws, text=True,
                             capture_output=True, timeout=60,
                             env={**E.env, "SB_SOCKET": os.path.join(E.state, "agent.sock"), "SB_AGENT": "main"}).stdout
        check(" in worktree " in out, out)
        wt = out.split(" in worktree ")[1].split(" (branch ")[0]
        c.wait_idle("t1")
        tmp = os.path.join(E.tmp, "t1-tmp")
        os.makedirs(tmp)
        os.makedirs(os.path.join(wt, "out"))
        src = os.path.join(tmp, "tiny.docx")
        open(src, "wb").write(open(os.path.join(ROOT, "office/fixtures/tiny.docx"), "rb").read())
        open(os.path.join(wt, "make.ts"), "w").write(SCRIPT % {"src": '"%s"' % src})

        r = office("t1", wt, tmp, "run", "make.ts")
        check(r.returncode == 0, "run: %s / %s" % (r.stdout, r.stderr))
        lines = r.stdout.splitlines()
        real = os.path.realpath(wt)
        plain = os.path.join(real, "out", "plain.docx")
        # each hub answer once from the relay, once from the script's own log
        check(lines[0] == "kind docx", lines)
        check(lines[1] == lines[2] == "%s is not an artifact: written only" % plain, lines)
        check(lines[3] == lines[4] and lines[3].startswith("added deck.docx (doc) · v1"), lines)
        check(lines[5] == lines[6] and lines[5].startswith("added deck.docx (doc) · v2"), lines)
        check(os.path.getsize(plain) == os.path.getsize(src), "plain.docx written whole")
        c.wait_feed("t1", "artifact", 10, agent="t1", version=1)
        c.wait_feed("t1", "artifact", 10, agent="t1", version=2)
        rows = subprocess.run([EXE, "sb", "artifact", "list"], cwd=wt, capture_output=True, text=True, timeout=60,
                              env={**E.env, "SB_SOCKET": os.path.join(E.state, "agent.sock"), "SB_AGENT": "t1"}).stdout
        check("deck" in rows and "plain" not in rows, rows)

        open(os.path.join(wt, "notes.txt"), "w").write("words")
        r = office("t1", wt, tmp, "inspect", "notes.txt")
        check(r.returncode == 1 and "notes.txt is not an xlsx, pptx or docx file" in r.stderr, r.stderr)

        outside = os.path.join(E.tmp, "his.xlsx")
        open(outside, "w").write("x")
        open(os.path.join(wt, "peek.ts"), "w").write('import { run } from "@bise/office";\nawait run.read(%r);\n' % outside)
        r = office("t1", wt, tmp, "run", "peek.ts")
        check(r.returncode == 1 and "is outside; a script may only use files under %s, %s" % (wt, tmp) in r.stderr, r.stderr)

        ok = True
        print("office_run_e2e: PASS")
    finally:
        if not ok:
            print("hub.stderr:", open(os.path.join(E.tmp, "hub.stderr")).read()[-3000:])
        E.close()


if __name__ == "__main__":
    main()
