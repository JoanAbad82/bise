"""His answer to a page question's card with an image and words, on a real
hub (card-image-parts, architect m_35268): card/answer's typed parts take
the page's path whole. The pick note keeps his parts (his words alone as
its text, never the image's marker), main's model gets the image as an
image block, and main's thread entry carries the page part with that
note typed, so both apps draw words + an image chip, never a tag.

Run: python3 -u tests/page_answer_parts_e2e.py (after scripts/bins.sh)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
from e2e import EXE, check  # noqa: E402

PAGE = ('<section data-kit="question" data-id="pick"><p>la salle de bloc : quel plan ?</p>'
        '<ol><li>A · la halle à côté</li><li>B · les murs autour du bureau</li></ol></section>\n')
WORDS = "les murs ne sont pas réalistes, un seul mur continu"


def page_entries(c, project):
    r = c.rpc("thread/subscribe", {"project": project, "agent": "main"}, timeout=30)
    entries = (r.get("result") or {}).get("entries") or []
    return [e for e in entries if any(p.get("kind") == "page" for p in e.get("parts") or [])]


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: scripts/bins.sh")
    E = e2e.Env()
    ok = False
    try:
        shot = os.path.join(E.tmp, "shot.png")
        with open(shot, "wb") as f:
            f.write(e2e.tiny_png())
        page = os.path.join(E.tmp, "climb.html")
        with open(page, "w") as f:
            f.write(PAGE)

        c = E.start_hub()
        c.wait_status("main", "idle", 60)
        project = c.project()
        c.say('[[bash: sb page publish %s --id climb --title "la salle de bloc"]]' % page)
        c.wait_line("main", "published climb v1", 90)
        c.wait_status("main", "idle", 60)

        def card():
            return next((x for x in c.cards() if (x.get("page") or {}).get("block") == "pick"), None)
        c.wait(card, 30, "the question's card")
        n = len(E.fake_requests())

        parts = [{"kind": "image", "name": "[Image #1]", "source": shot}, {"kind": "text", "text": " " + WORDS}]
        r = c.rpc("card/answer", {"project": project, "card": card()["id"], "reply": "", "parts": parts})
        check("error" not in r, "his answer is taken: %r" % r)

        # main's model gets the image itself (an image block), his words beside it
        def asked():
            return [q for q in E.fake_requests()[n:] if q.get("agent") == "main" and WORDS in q.get("user", "")]
        c.wait(asked, 60, "main's model got his answer")
        q = asked()[-1]
        check(len(q.get("images") or []) == 1, "one image block reaches the model: %r" % q.get("images"))

        # his entry: the page part, its pick note typed, its text his words alone
        c.wait(lambda: page_entries(c, project), 30, "main's page answer row")
        e = page_entries(c, project)[-1]
        p = next(p for p in e["parts"] if p.get("kind") == "page")
        note = p["notes"][0]
        check(note.get("kind") == "pick" and note.get("text") == WORDS, "the note's text is his words alone: %r" % note)
        check("<image" not in note.get("text", ""), "never a tag in his words: %r" % note)
        kinds = [x.get("kind") for x in note.get("parts") or []]
        check(kinds == ["image", "text"], "the note keeps his parts: %r" % note.get("parts"))
        img = note["parts"][0]
        check(img.get("source") == shot and (img.get("b64_file") or "").endswith(".b64"), "the image stored by the hub: %r" % img)
        ok = True
    finally:
        E.close()
    if not ok:
        sys.exit(1)
    print("PASS page_answer_parts_e2e")


if __name__ == "__main__":
    main()
