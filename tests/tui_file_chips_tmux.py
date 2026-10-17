"""File chips in the terminal (file-chips: architect m_21764, designer
m_21765, main m_21751), in a real terminal (tmux) against the fake
provider: a drop of a pdf, a csv, an xlsx, a docx and a pptx (their
shell-escaped paths pasted, as a terminal does) and an image becomes one
chip each in the composer (`▯ deck.pptx`, `▣ N`), with the attachments box rows
`▯ 5  deck.pptx  …  <folder>`; an `@` pick of a document, of code and of
an image is a chip too, where the `@` was, the cursor after it (at-chips).
On send the model gets each file as `<file name="[File #N]" path="…">`
where its chip was, next to the image; the history shows `▯ deck.pptx`,
and `· missing` for one deleted before the send. A click on a chip
previews it, ⌥ click shows it in Finder (recorded, BISE_OPEN_RECORD);
the key bar says so on hover. After a reload (a new TUI on the same hub)
the chips are still drawn.

python3 -u tests/tui_file_chips_tmux.py
"""
import base64
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
import wait  # noqa: E402
from tui_tmux import tui_session, run, tmux, wait_until, MAIN_IDLE  # noqa: E402
from tui_composer_tmux import composer  # noqa: E402
from words import w  # noqa: E402

PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==")
DOCS = ["q3.pdf", "data.csv", "plan.xlsx", "brief.docx", "deck.pptx"]


def paste(t, text):
    """A bracketed paste, as a terminal does for a dropped file."""
    tmux("set-buffer", "-b", "drop", text)
    tmux("paste-buffer", "-p", "-d", "-b", "drop", "-t", t.name)


def click(t, x, y, alt=False):
    """A click (press + release, SGR 1006) at the 0-based cell; ⌥ held."""
    b = 8 if alt else 0
    t.typed("\x1b[<%d;%d;%dM\x1b[<%d;%d;%dm" % (b, x + 1, y + 1, b, x + 1, y + 1))


def hover(t, x, y):
    """The mouse moved over the 0-based cell (SGR 1006, button 35)."""
    t.typed("\x1b[<35;%d;%dM" % (x + 1, y + 1))


def norm(sc):
    """A chip keeps its words on one row with no-break spaces: plain ones here."""
    return sc.replace("\xa0", " ")


def shown(t, words, timeout=40):
    """Wait for `words` on the screen (no-break spaces as spaces); the screen."""
    def on(sc):
        return words in norm(sc)
    on.__doc__ = "on screen: %r" % words
    return norm(t.wait_any([on], timeout)[1])


def recorded(path):
    return open(path).read().splitlines() if os.path.exists(path) else []


def main():
    E = e2e.Env()
    # in the test's HOME, as his ~/Desktop: the strip says '~/My Desktop'
    # whatever the run's tmp. Under the gate's ~/.bise/gate/<pid> a folder
    # in E.tmp made the row's '2 kB  <folder>' too wide, and the strip drops
    # a source that doesn't fit (attach::box_row): no size (issue 26)
    desk = os.path.join(E.env["HOME"], "My Desktop")
    os.makedirs(desk)
    paths = {}
    for name in DOCS + ["gone.csv"]:
        paths[name] = os.path.join(desk, name)
        with open(paths[name], "w") as f:
            f.write("x" * 2100)
    logo = os.path.join(desk, "logo.png")
    with open(logo, "wb") as f:
        f.write(PNG)
    os.makedirs(os.path.join(E.ws, "docs"))
    with open(os.path.join(E.ws, "docs", "roadmap.pdf"), "w") as f:
        f.write("pdf")
    # at-chips: an @ pick of code and of an image are chips at the @ too
    os.makedirs(os.path.join(E.ws, "extension", "test"))
    with open(os.path.join(E.ws, "extension", "test", "e2e.mjs"), "w") as f:
        f.write("import { test } from 'node:test';\n")
    os.makedirs(os.path.join(E.ws, "shots"))
    with open(os.path.join(E.ws, "shots", "screen.png"), "wb") as f:
        f.write(PNG)
    E.env["BEND_IMAGE_DIR"] = os.path.join(E.tmp, "images")
    rec = os.path.join(E.tmp, "opened")
    with tui_session(150, 42, "BISE_OPEN_RECORD=%s" % rec, E=E) as t:
        t.wait("bise :*")
        t.wait_re(MAIN_IDLE)
        # the brief's sentence: an image, then a pptx
        t.typed("ajouter l'image ")
        paste(t, logo.replace(" ", "\\ "))
        wait_until(lambda: "▣ 1" in composer(t), 10, lambda: "no image chip: %r" % composer(t))
        t.typed("dans la presentation powerpoint ")
        paste(t, paths["deck.pptx"].replace(" ", "\\ "))
        wait_until(lambda: "▯ deck.pptx" in composer(t), 10, lambda: "no file chip: %r" % composer(t))
        t.wait("╭─ %s ─" % w("composer.box_title"))
        # the row whole, its size with it: a wait on the name alone took a
        # screen captured while the row was drawn, name before size (issue 26)
        sc = t.wait_re(r"▯ 2  deck\.pptx +2 kB")
        assert "~" not in sc.split("deck.pptx")[0][-3:], sc
        # the four other documents in one drop, and one deleted before the send
        t.typed("avec ")
        paste(t, " ".join(paths[n].replace(" ", "\\ ") for n in DOCS[:4] + ["gone.csv"]))
        wait_until(lambda: "▯ gone.csv" in composer(t), 10, lambda: "not five more chips: %r" % composer(t))
        # an @ pick of a document: a chip, not its path
        t.typed(" @roadm")
        t.wait("docs/roadmap.pdf")
        t.keys("Tab")
        wait_until(lambda: "▯ roadmap.pdf" in composer(t), 10, lambda: "the @ pick is no chip: %r" % composer(t))
        # at-chips: code and an image picked with @ are chips where the @ was, the
        # cursor right after them (the words typed next come after), no path as text
        t.typed(" @e2e")
        t.wait("extension/test/e2e.mjs")
        t.keys("Enter")
        wait_until(lambda: "▯ e2e.mjs" in composer(t), 10, lambda: "the @ pick of code is no chip: %r" % composer(t))
        t.typed("puis @scre")
        t.wait("shots/screen.png")
        t.keys("Enter")
        wait_until(lambda: "▣ 10" in composer(t), 10, lambda: "the @ pick of an image is no chip: %r" % composer(t))
        t.typed("fin")
        # a file chip says its name (designer m_27881), never its path; the box's row its number
        assert "extension/test" not in composer(t) and "screen.png" not in composer(t), composer(t)
        t.wait_re(r"▯ 9  e2e\.mjs")
        os.remove(paths["gone.csv"])
        t.keys("Enter")
        # the model's text: each chip at its place, next to the image block
        reqs = wait_until(lambda: [r for r in t.E.fake_requests() if "presentation powerpoint" in r.get("user", "")], 40,
                          lambda: "no request: %r" % t.E.fake_requests()[-1:])
        user = reqs[-1]["user"]
        mk = lambda n, p, gone=False: '<file name="[File #%d]" path="%s"%s>' % (n, p, ' missing="true"' if gone else "")
        order = ["ajouter l'image", "<image name=[Image #1]", "dans la presentation powerpoint " + mk(2, paths["deck.pptx"]),
                 mk(3, paths["q3.pdf"]), mk(6, paths["brief.docx"]), mk(7, paths["gone.csv"], True),
                 mk(8, os.path.join(os.path.realpath(E.ws), "docs", "roadmap.pdf")),
                 mk(9, os.path.join(os.path.realpath(E.ws), "extension", "test", "e2e.mjs")) + " puis ",
                 "<image name=[Image #10]", " fin"]
        at = [user.find(s) for s in order]
        assert all(i >= 0 for i in at) and at == sorted(at), (user, list(zip(order, at)))
        assert len(reqs[-1]["images"]) == 2, reqs[-1]["images"]
        # the history: the chips by name, the gone one missing, no marker
        sc = shown(t, "▯ deck.pptx")
        assert "▯ gone.csv · missing" in sc and "▯ roadmap.pdf" in sc, sc
        t.wait_re(MAIN_IDLE)
        rows = norm(t.screen()).splitlines()
        # his rows have the bar (the fake model's ack echoes the markers)
        assert not any("<file name=" in r for r in rows if r.startswith("│            │  ")), "a marker in his row: %s" % sc
        y = next(i for i, r in enumerate(rows) if "▯ deck.pptx" in r)
        x = rows[y].find("▯ deck.pptx") + 3
        hover(t, x, y)
        t.wait("click " + w("composer.bar_preview"))
        t.wait("⌥ click " + w("composer.bar_show_in_finder"))
        click(t, x, y)
        wait_until(lambda: ("preview " + paths["deck.pptx"]) in recorded(rec), 10, lambda: "no preview: %r" % recorded(rec))
        # past the double-click's time (a second click there selects a word):
        # that one click previewed once, and nothing more comes of it
        once = recorded(rec)
        wait.holds(lambda: recorded(rec) == once, 0.8, lambda: "a second open after one click: %r" % recorded(rec))
        click(t, x, y, alt=True)
        wait_until(lambda: ("reveal " + paths["deck.pptx"]) in recorded(rec), 10, lambda: "no reveal: %r" % recorded(rec))
        # the image's chip previews too (Benjamin's ask)
        xi = rows[y].find("▣ logo.png")
        if xi >= 0:
            click(t, xi + 3, y)
            wait_until(lambda: ("preview " + logo) in recorded(rec), 10, lambda: "no image preview: %r" % recorded(rec))
        # the gone file: says so, opens nothing
        yg = next(i for i, r in enumerate(rows) if "▯ gone.csv" in r)
        n = len(recorded(rec))
        click(t, rows[yg].find("▯ gone.csv") + 3, yg)
        t.wait("gone.csv is gone from")
        assert len(recorded(rec)) == n, recorded(rec)
        # a reload: a new TUI on the same hub draws the chips again
        t.start(150, 42, "BISE_OPEN_RECORD=%s" % rec)
        sc = shown(t, "▯ deck.pptx")
        assert "▯ gone.csv · missing" in sc, sc
    print("PASS tui file chips")


if __name__ == "__main__":
    run(main)
