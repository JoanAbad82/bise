"""notif-open: an inbox option that opens an artifact (tmux, fake
provider, a throwaway hub, a fake page). main publishes a plan with two
drafted mails: its hub opens ONE drafts notification ('2 drafts wait for
you · <title> … 1 review / 2 send both'). The hub's row gives option 1 a
typed act (bise_proto OptAct::Open: the page as its artifact, at its
first draft). He picks 1 in the terminal's inbox:

- the page opens as /artifacts opens a page (BISE_OPEN: a script that
  logs what it opens), at its first draft (`…/p/<id>#b1`);
- nothing is sent: main's thread has no '1' from him, the notification
  is still open in the hub.

Before: the TUI sent '1' to the hub, which answered a notice line only.

python3 -u tests/tui_notif_open_tmux.py
"""
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
from tui_tmux import tui_session, run, wait_until, MAIN_IDLE  # noqa: E402

CTRL = "\x1b[%d;5u"   # ctrl+digit, the kitty keyboard protocol's form


def em(i, to):
    return ('<section data-kit="email" data-id="%s" data-verb="draft"><p data-field="to">%s</p>'
            '<p data-field="subject">v5.9.1</p><p>x</p></section>' % (i, to))


PAGE = ('<section data-kit="checklist" data-id="plan" data-plan><ol>'
        '<li data-id="b1" data-who="bise" data-did="drafted" data-draft="mail-lucas">reply to Lucas</li>'
        '<li data-id="b2" data-who="bise" data-did="drafted" data-draft="mail-marc">reply to Marc</li></ol></section>'
        + em("mail-lucas", "lucas@acme.test") + em("mail-marc", "marc@acme.test"))


def main():
    tmp = tempfile.mkdtemp(prefix="notif-open-")
    log = os.path.join(tmp, "opened")
    opener = os.path.join(tmp, "open-fake")
    with open(opener, "w") as f:
        f.write('#!/bin/sh\necho "$1" >> %s\n' % log)
    os.chmod(opener, 0o755)
    with tui_session(150, 42, "BISE_CTRL_DIGITS=1 BISE_OPEN=%s" % opener) as t:
        t.wait("bise :*")
        t.wait_re(MAIN_IDLE)
        page = os.path.join(t.E.tmp, "rel.html")
        open(page, "w").write(PAGE)
        t.typed("[[bash: sb page publish %s --id rel --title \"release replies\"]]" % page)
        t.keys("Enter")
        t.wait("drafts wait for you", 90)
        t.typed(CTRL % ord("1"))
        sc = t.wait("send both")
        print(sc)
        t.keys("1")
        wait_until(lambda: os.path.exists(log) and "/p/rel#b1" in open(log).read(), 10, lambda: "nothing opened: %r" % (open(log).read() if os.path.exists(log) else None))
        opened = open(log).read().split()
        assert len(opened) == 1 and opened[0].startswith("http://127.0.0.1:") and opened[0].endswith("/p/rel#b1"), opened
        # nothing sent, the notification stays
        c = e2e.Client(os.path.join(t.E.state, "hub.sock"))
        c.wait(lambda: c.cards(), 20, "the hub's state")
        cards = c.cards()
        assert any((x.get("page") or {}).get("id") == "rel" for x in cards), "the drafts notification stays open: %r" % cards
        sc = t.screen()
        assert "drafts wait for you" in sc, "still in the inbox:\n" + sc
        print(sc)
        print("PASS '1 review' opens the page at its first draft, nothing sent: %s" % opened[0])


if __name__ == "__main__":
    run(main)
