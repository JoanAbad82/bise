"""notif-artifact: a page's notification in the terminal (tmux, fake
provider, a throwaway hub, a fake page; designer m_26560 item 4). main
publishes a page with a drawn pick (`k-pick`): its notification opens in
the inbox. Opened (ctrl+1), at 150 and 80 columns:

- under what it asks, the page's line `↗ where does my answer go · page
  · v1   ctrl+t open in your browser`;
- its options are the page's, the asker's own pick says `my pick`;
- the hint says who reads typed words (`or type: main reads it`, the
  page's agent, main included), the key bar `1-2 pick   ctrl+t open`;
- ctrl+t opens the page in the browser at its block (BISE_OPEN: a script
  that logs what it opens), nothing is sent: the item still waits;
- the thread's line is one line: `? main asks: which composer look? ↗
  where does my answer go`;
- `2` answers it: the item leaves, the thread says `you picked B`.

python3 -u tests/tui_page_link_tmux.py
"""
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
from tui_tmux import tui_session, run, wait_until, MAIN_IDLE  # noqa: E402

CTRL = "\x1b[%d;5u"   # ctrl+digit, the kitty keyboard protocol's form

PAGE = ('<section data-kit="ui" data-id="look"><div class="k-pick" data-ui="pick" data-ask="which composer look?">'
        '<div class="k-option" data-pick="a"><span class="k-mark">my pick</span><h3>A · a pink border</h3><p>and a clear label.</p></div>'
        '<div class="k-option" data-pick="b"><h3>B · one frame</h3><p>the card and the field together.</p></div>'
        '</div></section>\n')


def one(cols, rows, tmp):
    log = os.path.join(tmp, "opened-%d" % cols)
    opener = os.path.join(tmp, "open-fake-%d" % cols)
    with open(opener, "w") as f:
        f.write('#!/bin/sh\necho "$1" >> %s\n' % log)
    os.chmod(opener, 0o755)
    with tui_session(cols, rows, "BISE_CTRL_DIGITS=1 BISE_OPEN=%s" % opener) as t:
        t.wait("bise :*")
        t.wait_re(MAIN_IDLE)
        page = os.path.join(t.E.tmp, "look.html")
        open(page, "w").write(PAGE)
        t.typed('[[bash: sb page publish %s --id composer-look --title "where does my answer go"]]' % page)
        t.keys("Enter")
        t.wait("waiting for you", 90)
        # the thread's line is the card's head alone (designer m_26776)
        sc = t.wait("? main asks: which composer look? ↗ where does my answer go")
        assert "1. A · a pink border" not in sc.split("main asks:")[0], "no card block in the thread:\n" + sc
        t.typed(CTRL % ord("1"))
        sc = t.wait("which composer look?")
        t.wait("ctrl+t open in your browser")
        sc = t.screen()
        print(sc)
        assert "↗ where does my answer go · page · v1   ctrl+t open in your browser" in sc, "the page's line:\n" + sc
        assert "A · a pink border   my pick" in sc, "the asker's pick:\n" + sc
        assert "or type: main reads it" in sc, "who reads typed words:\n" + sc
        assert "1-2 pick" in sc and "ctrl+t open" in sc, "the key bar:\n" + sc
        # ctrl+t: the page in the browser at its block, nothing sent
        t.keys("C-t")
        wait_until(lambda: os.path.exists(log) and "/p/composer-look#look" in open(log).read(), 10, lambda: "nothing opened: %r" % (open(log).read() if os.path.exists(log) else None))
        opened = open(log).read().split()
        assert len(opened) == 1 and opened[0].startswith("http://127.0.0.1:") and opened[0].endswith("/p/composer-look#look"), opened
        c = e2e.Client(os.path.join(t.E.state, "hub.sock"))
        c.wait(lambda: c.cards(), 20, "the hub's state")
        assert any((x.get("page") or {}).get("id") == "composer-look" for x in c.cards()), "the item still waits: %r" % c.cards()
        assert "ctrl+t open in your browser" in t.screen(), "still open in place:\n" + t.screen()
        # 2: answered; the thread says what he picked
        t.keys("2")
        c.wait(lambda: not any((x.get("page") or {}).get("id") == "composer-look" for x in c.cards()), 20, "the item answered")
        sc = t.wait("you picked B")
        print(sc)
        print("PASS the page's line, ctrl+t opens %s, '2' answers at %d cols" % (opened[0], cols))


def main():
    tmp = tempfile.mkdtemp(prefix="page-link-")
    for cols, rows in ((150, 42), (80, 40)):
        one(cols, rows, tmp)


if __name__ == "__main__":
    run(main)
