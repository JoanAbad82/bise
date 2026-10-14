#!/usr/bin/env python3
"""Office artifacts end to end (docs/office-artifacts-plan.md, the merge proof).

A real hub, the scripted provider (e2e.Env), a temp HOME, fake data only.
The task t1 works in its own worktree and runs `bise office run` as its
bash would (SB_SOCKET, SB_AGENT=t1, BEND_WORKDIR, its own TMPDIR).

  1. t1 makes an xlsx, a pptx and a docx (`{ artifact: true }`): three rows,
     v1 each, the kinds sheet/slides/doc, each with a frame_url on the
     viewer (`/a/<id>/view`) that the pages server answers with its shell;
  2. t1 edits each one: v2; the add carries what changed (art-live's
     `changed`, the SDK's diff), and the viewer serves v2;
  3. he selects a cell of the sheet and asks about it: a `Part::Anchor`
     in his message to t1; the hub records it sent in the artifact's
     notes (`GET /a/<id>/notes`), and the model reads the anchor's JSON;
  4. t1 answers with the sheet's next version in its next turn: the note
     is done in that version;
  5. an anchor on a version that does not exist is refused at the door.
"""
import json
import os
import subprocess
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from e2e import EXE, Env, check  # noqa: E402

MAKE = r'''
import { sheets, slides, docs, run } from "@bise/office";
const book = await sheets.create({ sheet: "Q3", rows: [["Region", "Q2", "Q3"], ["North", 410, 446], ["South", 230, 231], ["West", 330, 341]] });
book.range("Q3!A5").set("Total");
book.range("Q3!B5").set("=SUM(B2:B4)");
book.range("Q3!C5").set("=SUM(C2:C4)");
book.range("Q3!A1:C1").style({ bold: true });
console.log(await run.write("out/q3.xlsx", await book.save(), { artifact: true }));
const deck = await slides.create();
const s = deck.addSlide({ layout: "title-body" });
s.placeholder("title")!.setText("Q3: revenue up 4%");
s.placeholder("body")!.setText(["North carried the quarter", "South flat"]);
console.log(await run.write("out/q3.pptx", await deck.save(), { artifact: true }));
const doc = await docs.create({ title: "Q3 memo" });
doc.add({ kind: "title", text: "Q3: revenue up 4%" });
doc.add({ kind: "para", text: "North carried the quarter; South was flat." });
console.log(await run.write("out/q3-memo.docx", await doc.save(), { artifact: true }));
'''

EDIT = r'''
import { sheets, slides, docs, run } from "@bise/office";
const book = await sheets.open(await run.read("out/q3.xlsx"));
book.range("Q3!C3").set(%(south)s);
console.log(await run.write("out/q3.xlsx", await book.save()));
const deck = await slides.open(await run.read("out/q3.pptx"));
const s = deck.addSlide({ layout: "title-body" });
s.placeholder("title")!.setText("Churn is the risk for Q4");
console.log(await run.write("out/q3.pptx", await deck.save()));
const doc = await docs.open(await run.read("out/q3-memo.docx"));
doc.add({ kind: "para", text: "West came back to growth." });
console.log(await run.write("out/q3-memo.docx", await doc.save()));
'''

ANSWER = r'''
import { sheets, run } from "@bise/office";
const book = await sheets.open(await run.read("out/q3.xlsx"));
book.at(%(anchor)s).style({ fill: "#fff3c4" });
console.log(await run.write("out/q3.xlsx", await book.save()));
'''


def get(url):
    with urllib.request.urlopen(url, timeout=10) as r:
        return r.status, r.read().decode("utf-8", "replace")


def main():
    E = Env()
    home = os.path.join(E.tmp, "home")
    os.makedirs(home)
    E.env.update(HOME=home, XDG_STATE_HOME=os.path.join(home, "state"))
    ok = False
    sock = os.path.join(E.state, "agent.sock")

    def sb(agent, cwd, *args):
        return subprocess.run([EXE, "sb", *args], cwd=cwd, capture_output=True, text=True, timeout=60,
                              env={**E.env, "SB_SOCKET": sock, "SB_AGENT": agent})

    def office(wt, tmp, *args):
        env = {**E.env, "SB_SOCKET": sock, "SB_AGENT": "t1", "BEND_WORKDIR": wt, "TMPDIR": tmp}
        env.pop("BISE_APP_ROOT", None)
        return subprocess.run([EXE, "office", *args], env=env, cwd=wt, capture_output=True, text=True, timeout=180)

    def script(wt, tmp, name, body):
        open(os.path.join(tmp, name), "w").write(body)
        r = office(wt, tmp, "run", os.path.join(tmp, name))
        check(r.returncode == 0, "%s: %s / %s" % (name, r.stdout, r.stderr))
        return r.stdout

    try:
        c = E.start_hub()
        c.wait_status("main", "idle", 60)
        out = sb("main", E.ws, "spawn", "t1", "--place", "new", "--objective", "make the q3 files").stdout
        check(" in worktree " in out, out)
        wt = out.split(" in worktree ")[1].split(" (branch ")[0]
        c.wait_idle("t1")
        tmp = os.path.join(E.tmp, "t1-tmp")
        os.makedirs(tmp)
        os.makedirs(os.path.join(wt, "out"))
        port = open(os.path.join(E.state, "pages.port")).read().strip()
        base = "http://127.0.0.1:%s" % port

        # 1. three new artifacts, v1, each with the viewer as its frame
        out = script(wt, tmp, "make.ts", MAKE)
        for name, kind in (("q3.xlsx", "sheet"), ("q3.pptx", "slides"), ("q3-memo.docx", "doc")):
            check("added %s (%s) · v1" % (name, kind) in out, out)
        listed = sb("t1", wt, "artifact", "list").stdout
        ids = {}
        for name in ("q3.xlsx", "q3.pptx", "q3-memo.docx"):
            line = next((l for l in listed.splitlines() if name in l), "")
            check("artifact:" in line, listed)
            ids[name] = line.split("artifact:")[1].split(")")[0]
        for name, aid in ids.items():
            status, body = get("%s/a/%s/view" % (base, aid))
            check(status == 200 and "kit/office" in body, "%s view: %s" % (name, body[:300]))

        # 2. the edits: v2 each, with what changed
        out = script(wt, tmp, "edit.ts", EDIT % {"south": 244})
        for name in ids:
            check("%s" % name in out and "v2" in out, out)
        for name, aid in ids.items():
            meta = json.load(open(os.path.join(E.state, "artifacts", aid, "meta.json")))
            last = meta["versions"][-1]
            check(last["v"] == 2, "%s: %s" % (name, last))
            check(any(r.get("changed") for r in last.get("revs", [])), "%s v2 carries what changed: %s" % (name, last))

        # 3. he asks about a cell of the sheet: Part::Anchor to t1
        sheet = ids["q3.xlsx"]
        anchor = {"kind": "cell", "sheet": "Q3", "range": "C3"}
        part = {"kind": "anchor", "artifact": sheet, "version": 2, "anchor": anchor, "quote": "244", "n": 1}
        r = c.rpc("turn/send", {"project": c.project(), "agent": "t1", "text": "why did South move?",
                                "parts": [part], "mode": "now"})
        check("error" not in r, r)
        status, body = get("%s/a/%s/notes" % (base, sheet))
        notes = json.loads(body)["notes"]
        check(status == 200 and any(n.get("status") == "sent" for n in notes), body)
        c.wait_idle("t1")
        check(any('"range":"C3"' in l.replace(" ", "") for l in c.lines("t1")), "the model reads the anchor")

        # 4. the answer: the sheet's next version, after the send: the note is done
        script(wt, tmp, "answer.ts", ANSWER % {"anchor": json.dumps(anchor)})
        status, body = get("%s/a/%s/notes" % (base, sheet))
        check('"done"' in body or "done_in" in body, body)

        # 5. an anchor on a version that does not exist: refused at the door
        bad = dict(part, version=9)
        r = c.rpc("turn/send", {"project": c.project(), "agent": "t1", "text": "and this?", "parts": [bad], "mode": "now"})
        check("error" in r, r)

        ok = True
        print("office_artifacts_e2e: PASS")
    finally:
        if not ok:
            print("hub.stderr:", open(os.path.join(E.tmp, "hub.stderr")).read()[-3000:])
        E.close()


if __name__ == "__main__":
    main()
