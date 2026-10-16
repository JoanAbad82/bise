"""A notification and its page as one thing (notif-artifact, Gabriel's
pick A; designer m_26560), against a real hub (bise sbd, scripted model)
on a throwaway repo. No browser, no app.

- a drawn pick (`k-pick` in a ui block) on a published page makes its own
  notification: a question card the page's agent asks, its options the
  options' h3s, each with its why, the agent's `my pick` named, and the
  page's chip (title, version) on the card;
- the page's meta says it waits in the inbox (`asks`: open);
- answered in the inbox (`/answer N 2`): the card closes, the page hears
  `answered` with its key, `via: inbox` and the time, the meta keeps it,
  the page's agent reads the pick;
- a second page answered on the page (POST /answer): its card closes too,
  `via: page`;
- `data-notify="none"` makes no card; `sb notify --page <id>#<block>`
  links a hand-made notification to the page with its title and version.

Run: python3 -u tests/notif_artifact_e2e.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
from e2e import EXE, check  # noqa: E402
from ambient_pages_e2e import Sse, request, settle  # noqa: E402


def pick_page(block, ask, notify=""):
    return (
        '<section data-kit="heading" data-id="h"><h1>where does my answer go</h1></section>\n'
        '<section data-kit="ui" data-id="%s"%s><div class="k-pick" data-ui="pick" data-ask="%s">'
        '<div class="k-option" data-pick="a"><span class="k-mark">my pick</span><h3>A · a pink border</h3><p>and a clear label.</p></div>'
        '<div class="k-option" data-pick="b"><h3>B · one frame</h3><p>the card and the field together.</p></div>'
        '</div></section>\n' % (block, notify, ask)
    )


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: cd rust && cargo build")
    E = e2e.Env()
    ok = True
    try:
        c = E.start_hub()
        c.wait_status("main", "idle", 60)

        def card(page, block):
            return next((x for x in c.cards() if (x.get("page") or {}).get("id") == page and (x.get("page") or {}).get("block") == block), None)

        def publish(name, html, title):
            f = os.path.join(E.tmp, name + ".html")
            open(f, "w").write(html)
            settle(c)
            c.say('[[bash: sb page publish %s --id %s --title "%s"]]' % (f, name, title))
            c.wait_line("main", "published %s v1" % name, 90)

        # 1. a drawn pick makes its notification, linked to its page
        publish("composer-look", pick_page("look", "which composer look when a notification is open?"), "where does my answer go")
        port = int(open(os.path.join(E.state, "pages.port")).read().strip())
        origin = "http://127.0.0.1:%d" % port
        c.wait(lambda: card("composer-look", "look"), 30, "the pick's card")
        k = card("composer-look", "look")
        check(k["kind"] == "question" and k["agent"] == "main", "a question the page's agent asks: %r" % k)
        check(k["page"] == {"id": "composer-look", "block": "look", "url": "%s/p/composer-look#look" % origin, "title": "where does my answer go", "v": 1}, "the page's chip: %r" % k["page"])
        check(k["question"] == "which composer look when a notification is open?", "its words: %r" % k["question"])
        opts = [(o["n"], o["label"], o.get("why"), o.get("mine", False)) for o in k["options"]]
        check(opts == [(1, "A · a pink border", "and a clear label.", True), (2, "B · one frame", "the card and the field together.", False)], "the options, their why, the agent's pick: %r" % opts)
        st, _, m = request(port, "GET", "/p/composer-look/meta")
        check(st == 200 and json.loads(m)["asks"] == [{"block": "look", "open": True, "count": 2}], "the page says it waits in the inbox: %s" % m)
        st, _, body = request(port, "GET", "/p/composer-look")
        check('/kit/ask.js' in body, "the shell loads ask.js")

        # 2. answered in the inbox: the card closes, the page marks the pick, its agent reads it
        sse = Sse(port, "/p/composer-look/events")
        settle(c)
        c.say("/answer %d 2" % k["id"])
        c.wait(lambda: sse.seen("answered", lambda d: d.get("block") == "look" and d.get("key") == "b" and d.get("via") == "inbox" and d.get("n") == 2 and d.get("at_ms")), 30, "SSE answered via the inbox")
        c.wait(lambda: card("composer-look", "look") is None, 30, "the card closed")
        c.wait(lambda: any("B · one frame" in l for l in c.lines("main")), 30, "the page's agent reads the pick")
        st, _, m = request(port, "GET", "/p/composer-look/meta")
        a = json.loads(m)["asks"][0]
        check((a["reply"], a["key"], a["via"]) == ("B · one frame", "b", "inbox"), "the meta keeps the answer: %r" % a)
        token = body.split('<meta name="bise-token" content="')[1].split('"')[0]
        st, _, _ = request(port, "POST", "/api/p/composer-look/answer", {"block": "look", "option": 1}, {"Origin": origin, "X-Bise-Token": token})
        check(st == 409, "one answer closes both: the page refuses a second (%d)" % st)

        # 3. answered on the page: the card closes too, via page
        publish("composer-look-2", pick_page("look2", "and the dark one?"), "the dark look")
        c.wait(lambda: card("composer-look-2", "look2"), 30, "the second pick's card")
        k2 = card("composer-look-2", "look2")
        s2 = Sse(port, "/p/composer-look-2/events")
        st, _, r = request(port, "POST", "/api/p/composer-look-2/answer", {"block": "look2", "option": 1}, {"Origin": origin, "X-Bise-Token": token})
        check(st == 200 and json.loads(r)["reply"] == "A · a pink border", "the page's pick: %d %s" % (st, r))
        c.wait(lambda: s2.seen("answered", lambda d: d.get("key") == "a" and d.get("via") == "page"), 30, "SSE answered via the page")
        c.wait(lambda: not any(x["id"] == k2["id"] for x in c.cards()), 30, "the card left the inbox")

        # 4. data-notify="none": no card; sb notify --page links one by hand
        publish("composer-look-3", pick_page("look3", "later?", ' data-notify="none"'), "a later look")
        settle(c)
        check(card("composer-look-3", "look3") is None, "data-notify=\"none\" makes no card")
        c.say('[[bash: sb notify --page composer-look-3#look3 "pick the later look?\n1. A\n2. B"]]')
        c.wait(lambda: card("composer-look-3", "look3"), 60, "the hand-made notification, linked")
        k3 = card("composer-look-3", "look3")
        check((k3["page"].get("title"), k3["page"].get("v")) == ("a later look", 1), "its chip: %r" % k3["page"])
        check(k3.get("artifact") == {"id": "composer-look-3", "kind": "page", "title": "a later look", "v": 1, "url": "%s/p/composer-look-3#look3" % origin, "at": {"kind": "block", "block": "look3"}},
              "a page link is an artifact link too (card-links): %r" % k3.get("artifact"))

        # 5. card-links (main m_27429, architect m_27431): main links any artifact, a site
        # here, with --artifact: the card's one link, its kind; no page link beside it
        proto = os.path.join(E.tmp, "proto.html")
        open(proto, "w").write("<html><body>proto</body></html>\n")
        settle(c)
        c.say('[[bash: sb artifact add %s --title "t proto" --kind site && sb notify --artifact t-proto "the prototype ok?"]]' % proto)
        site = lambda: next((x for x in c.cards() if (x.get("artifact") or {}).get("id") == "t-proto"), None)  # noqa: E731
        c.wait(site, 60, "the notification linked to the site")
        s5 = site()
        check(s5.get("page") is None and (s5["artifact"]["kind"], s5["artifact"]["title"], s5["artifact"]["v"]) == ("site", "t proto", 1), "the site link: %r" % s5)
        c.wait_idle("main")
        c.say('[[bash: sb notify --artifact t-proto#look "x?" ; sb notify --artifact nope "y?"]]')
        c.wait_line("main", 'is a site, not a page: no #look in it', 60)
        c.wait_line("main", '(sb artifact list)', 60)
    except Exception as e:  # noqa: BLE001
        ok = False
        print("FAIL", e)
        try:
            for l in c.lines("main")[-25:]:
                print("  main:", l)
        except Exception:  # noqa: BLE001
            pass
    finally:
        E.close()
    print("notif_artifact_e2e:", "ok" if ok else "FAILED")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
