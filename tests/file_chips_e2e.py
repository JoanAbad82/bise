"""File chips on a real hub (file-chips, architect m_21764): his message as
typed parts with an image and five documents (pdf, csv, xlsx, docx, pptx),
each a positional reference by its absolute path, never copied. Fake data
only: a throwaway HOME, the fake provider, files made here.

  1. turn/send with parts: the model's request (the fake provider's log)
     has the image block and each `<file name="[File #N]" path="...">` in
     the sentence where its chip was, in order; the file's bytes never;
  2. a file gone at send time: kept on his entry with missing=true and
     `missing="true"` in the model's text, never dropped;
  3. his entry keeps the parts (thread/subscribe), the same after the hub
     restarts (the journal);
  4. an older desktop's `files` list: the old `[files he attached:]`
     text, and parts on his entry;
  5. a relative file path: refused, nothing delivered.

Run: python3 -u tests/file_chips_e2e.py (after scripts/bins.sh)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
from e2e import EXE, check  # noqa: E402

SECRET = "FILE-BYTES-NEVER-SENT"


def marker(n, path, missing=False):
    return '<file name="[File #%d]" path="%s"%s>' % (n, path, ' missing="true"' if missing else "")


def yous(c, project):
    r = c.rpc("thread/subscribe", {"project": project, "agent": "main"}, timeout=30)
    entries = (r.get("result") or {}).get("entries") or []
    return [e for e in entries if e.get("kind") == "you"]


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: scripts/bins.sh")
    E = e2e.Env()
    ok = False
    try:
        docs = os.path.join(E.tmp, "Desktop")
        os.makedirs(docs)
        files = {}
        for name in ["q3.pdf", "data.csv", "plan.xlsx", "brief.docx", "deck.pptx", "gone.csv"]:
            files[name] = os.path.join(docs, name)
            with open(files[name], "w") as f:
                f.write(SECRET + " " + name)
        logo = os.path.join(docs, "logo.png")
        with open(logo, "wb") as f:
            f.write(e2e.tiny_png())

        c = E.start_hub()
        c.wait_status("main", "idle", 60)
        project = c.project()

        # 1. the brief's sentence, then the four other documents and a gone one
        parts = [
            {"kind": "text", "text": "ajouter l'image "},
            {"kind": "image", "name": "[Image #1]", "source": logo},
            {"kind": "text", "text": " dans la presentation powerpoint "},
            {"kind": "file", "name": "[File #2]", "path": files["deck.pptx"]},
            {"kind": "text", "text": ", avec "},
            {"kind": "file", "name": "[File #3]", "path": files["q3.pdf"]},
            {"kind": "text", "text": " "},
            {"kind": "file", "name": "[File #4]", "path": files["data.csv"]},
            {"kind": "text", "text": " "},
            {"kind": "file", "name": "[File #5]", "path": files["plan.xlsx"]},
            {"kind": "text", "text": " "},
            {"kind": "file", "name": "[File #6]", "path": files["brief.docx"]},
            {"kind": "text", "text": " et "},
            {"kind": "file", "name": "[File #7]", "path": files["gone.csv"]},
        ]
        os.remove(files["gone.csv"])
        r = c.rpc("turn/send", {"project": project, "agent": "main", "text": "", "parts": parts, "mode": "now"})
        check("error" not in r, "the send is taken: %r" % r)
        c.wait_idle("main", timeout=120)

        def asked():
            return [q for q in E.fake_requests() if q.get("agent") == "main" and "dans la presentation powerpoint" in q.get("user", "")]
        c.wait(lambda: asked(), 30, "main's model got the message")
        q = asked()[-1]
        user = q["user"]
        print("the model's text:\n" + user)
        order = [
            "ajouter l'image ",
            '<image name=[Image #1] path="%s">' % logo,
            " dans la presentation powerpoint " + marker(2, files["deck.pptx"]),
            ", avec " + marker(3, files["q3.pdf"]) + " " + marker(4, files["data.csv"]) + " " + marker(5, files["plan.xlsx"]) + " " + marker(6, files["brief.docx"]),
            " et " + marker(7, files["gone.csv"], missing=True),
        ]
        at = [user.find(s) for s in order]
        check(all(i >= 0 for i in at) and at == sorted(at), "each chip at its place, in order: %r" % list(zip(order, at)))
        check(len(q.get("images") or []) == 1 and (q.get("anth_images") or ["message"]) == ["message"], "one image block: %r" % q.get("images"))
        check(SECRET not in user and SECRET not in "".join(q.get("users") or []), "no file's bytes reach the model")

        # 2. + 3. his entry keeps the parts, the gone one marked
        sent = [p for p in parts]
        sent[1] = None  # the image: completed by the hub (its b64_file, mime)
        sent[13] = dict(parts[13], missing=True)

        def same(e):
            got = e.get("parts") or []
            return len(got) == len(parts) and all(w is None or g == w for g, w in zip(got, sent)) and got[1].get("kind") == "image"
        mine = [e for e in yous(c, project) if same(e)]
        check(len(mine) == 1, "his entry keeps his parts, the gone file missing: %r" % [e.get("parts") for e in yous(c, project)][-1:])

        E.stop_hub(keep_agents=False)
        c = E.start_hub()
        c.wait_status("main", "idle", 60)
        mine = [e for e in yous(c, project) if same(e)]
        check(len(mine) == 1, "the parts after a restart (the journal)")

        # 4. an older desktop's files list: the old text, parts on the entry
        r = c.rpc("turn/send", {"project": project, "agent": "main", "text": "lis ces fichiers", "files": [files["q3.pdf"], files["data.csv"]], "mode": "now"})
        check("error" not in r, "a files list is taken: %r" % r)
        old = "lis ces fichiers\n\n[files he attached:]\n%s\n%s" % (files["q3.pdf"], files["data.csv"])
        c.wait(lambda: any(old in q.get("user", "") for q in E.fake_requests() if q.get("agent") == "main"), 60, "the old list's text")
        listed = [{"kind": "text", "text": "lis ces fichiers"}, {"kind": "file", "path": files["q3.pdf"]}, {"kind": "file", "path": files["data.csv"]}]
        c.wait(lambda: any(e.get("parts") == listed for e in yous(c, project)), 30, "the files list's parts on his entry")
        check(True, "a files list: the old text, parts on his entry")

        # 5. a relative path: refused
        r = c.rpc("turn/send", {"project": project, "agent": "main", "text": "", "parts": [{"kind": "file", "name": "[File #1]", "path": "deck.pptx"}], "mode": "now"})
        check("error" in r and "absolute" in r["error"].get("message", ""), "a relative file path is refused: %r" % r)
        ok = True
    finally:
        E.close()
    if not ok:
        sys.exit(1)
    print("PASS file_chips_e2e")


if __name__ == "__main__":
    main()
