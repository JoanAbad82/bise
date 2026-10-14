"""The client protocol on a real hub, his message as typed parts
(msg-parts, architect m_17621; bise-proto parts, rust/switchboard/src/
parts_in.rs): the hub renders the model's text from them and keeps them
on his entry; the same message sent as text reads back as the same
parts and the model reads the same bytes; a command/run line carries
them when it is their text; an image part by its source is stored by
the hub; the window's positional message and the capsule's hint
(tests/proto_parts.py); a card answer keeps them on its row. At the
size limits: an 8000-char quote and a 2000-line paste.

Run: python3 -u tests/proto_e2e_parts.py (after scripts/bins.sh)
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
from e2e import EXE, check  # noqa: E402
from proto_parts import hint_round, positional_round, render  # noqa: E402
from proto_rpc import check_keys, entries, ok, refused, req, run, subscribe, transcript, unsubscribe  # noqa: E402


def asked(c, who, words, what):
    """The id (`m_<n>`) of `who`'s message in main's feed with `words`."""
    r = c.wait(lambda: next((r for r in c.feed("main", "msg-in") if r.get("from") == who and words in r.get("body", "") and r.get("id")), None), 45, what)
    return "m_%d" % r["id"]


def parts_round(c, E):
    def yous():
        return entries(c, "main", "you")

    def reads(text):
        """main's model requests whose user text ends with `text` (the
        fake provider logs its first 3000 chars and its last 300; bise's
        notes may come before his words, never after)"""
        tail = text[-250:]
        return sum(1 for r in E.fake_requests() if r.get("agent") == "main" and tail in r.get("user_tail", "") + "\x00" + r.get("user", ""))

    subscribe(c, "main")
    big_quote = "\n".join(("q%d " % i) + "x" * 74 for i in range(100))[:8000]
    big_paste = "\n".join("paste line %d" % i for i in range(1, 2001))
    parts = [
        {"kind": "quote", "from": "main", "text": big_quote},
        {"kind": "text", "text": "parts one "},
        {"kind": "paste", "n": 1, "text": big_paste},
        {"kind": "text", "text": " end"},
    ]
    text = render(parts)
    ok(req(c, "turn/send", agent="main", text="", parts=parts, mode="now"), "a send with parts")
    c.wait(lambda: any(x.get("parts") == parts for x in yous()), 30, "his parts on his entry")
    c.wait_idle("main", timeout=30)
    e = [x for x in yous() if x.get("parts") == parts][-1]
    check(e["text"] == text, "the entry's text is the parts' template: %r" % e["text"][:200])
    # the fake provider logs a request after its reply's last byte, and a
    # streamed reply ends the turn as soon as it is read: the log line can
    # come after main is idle
    try:
        c.wait(lambda: reads(text) > 0, 30, "the model read the parts' template")
    except Exception:
        check(False, "the model read the parts' template: %r" % [r.get("user_tail") for r in E.fake_requests() if r.get("agent") == "main"][-2:])
    check(any((e2e.feed_rec(l) or ("",))[0] == "you-parts" for l in transcript(E)), "the you-parts line is journaled")
    # both shapes: the same message as text alone (an older client) reads
    # back as the same parts, and the model reads the same bytes
    parts2 = [{"kind": "quote", "from": "t1", "text": "le process"}, {"kind": "text", "text": "Son process prenait tout mon CPU!"}]
    text2 = render(parts2)
    ok(req(c, "turn/send", agent="main", text=text2, mode="now"), "the same message as text")
    c.wait(lambda: any(x["text"] == text2 and x.get("parts") == parts2 for x in yous()), 30, "a text read back as its parts")
    c.wait_idle("main", timeout=30)
    try:
        c.wait(lambda: reads(text2) > 0, 30, "the text shape read")
    except Exception:
        pass
    n_reads = reads(text2)
    check(n_reads > 0, "the text shape read: %r" % [r.get("user_tail") for r in E.fake_requests() if r.get("agent") == "main"][-2:])
    ok(req(c, "turn/send", agent="main", text="", parts=parts2, mode="now"), "the same message as parts")
    c.wait(lambda: len([x for x in yous() if x.get("parts") == parts2]) >= 2, 30, "the same message as parts")
    c.wait_idle("main", timeout=30)
    try:
        c.wait(lambda: reads(text2) > n_reads, 30, "both shapes: the model reads the same bytes")
    except Exception:
        check(False, "both shapes: %r" % [(r.get("user_tail"), r.get("user", "")[:300]) for r in E.fake_requests() if r.get("agent") == "main"][-3:])
    # the terminal's path: a command/run line that is the parts' text
    # after its verb; a line that isn't is refused, and so is a kind this
    # hub doesn't know (it would drop his words)
    parts3 = [{"kind": "text", "text": "via slash "}, {"kind": "paste", "n": 2, "text": "a\nb"}]
    ok(run(c, "say " + render(parts3), parts=parts3, mode="now"), "a command/run line with its parts")
    c.wait(lambda: any(x.get("parts") == parts3 for x in yous()), 30, "a command/run line's parts")
    c.wait_idle("main", timeout=30)
    e = refused(run(c, "say not the parts", parts=parts3, mode="now"), "a line that isn't its parts")
    check("parts" in e["message"], "refused, saying why: %r" % e)
    e = refused(req(c, "turn/send", agent="main", text="", parts=[{"kind": "sticker", "id": 3}], mode="now"), "an unknown part")
    check("sticker" in e["message"], "the unknown kind named: %r" % e)
    check(not any("not the parts" in l for l in c.lines("main")), "nothing delivered on a refusal")
    # an image part sent with its source only (the window's pasted or
    # dropped file, ambient-lead m_17967): the hub stores it itself
    # (bend_images::store_file), the entry's part names its store file and
    # mime, and the model gets it as an image part; a relative source is
    # refused, nothing delivered
    shot = os.path.join(E.tmp, "by-source.png")
    with open(shot, "wb") as f:
        f.write(e2e.tiny_png())
    iparts = [{"kind": "text", "text": "by source "}, {"kind": "image", "name": "[Image #1]", "source": shot}]
    n_img = len([r for r in E.fake_requests() if r.get("agent") == "main" and r.get("images")])
    ok(req(c, "turn/send", agent="main", text="", parts=iparts, mode="now"), "an image part by its source")
    c.wait(lambda: any(any(p.get("kind") == "image" and p.get("source") == shot for p in x.get("parts", [])) for x in yous()), 30, "the image part on his entry")
    c.wait_idle("main", timeout=30)
    ip = [p for x in yous() for p in x.get("parts", []) if p.get("kind") == "image" and p.get("source") == shot][-1]
    check(ip.get("b64_file", "").endswith(".b64") and os.path.isfile(ip["b64_file"]) and ip.get("mime") == "image/png",
          "the hub stored the image and named it on the part: %r" % ip)
    imgs = [r for r in E.fake_requests() if r.get("agent") == "main" and r.get("images")]
    check(len(imgs) > n_img and any(i.startswith("data:image/png;base64,") for i in imgs[-1]["images"]),
          "main's model got the image sent by its source: %r" % [[i[:40] for i in r.get("images", [])] for r in E.fake_requests() if r.get("agent") == "main"][-2:])
    # his image message's parts are the same values all the way (architect
    # m_19059): sb-core keeps them as a string on the message and parses
    # them into its you-parts record (core.bend parts_json), so the parts
    # journaled on his message, the transcript's you-parts record and his
    # entry's parts must be equal as JSON values (key order and number
    # format may differ, never a value)
    def has_shot(ps):
        return any(isinstance(p, dict) and p.get("kind") == "image" and p.get("source") == shot for p in ps or [])
    journaled = []
    for l in open(os.path.join(E.state, "journal.jsonl")):
        ev = json.loads(l)
        if ev.get("type") == "message_sent" and isinstance(ev.get("msg", {}).get("parts"), str) and shot in ev["msg"]["parts"]:
            journaled.append(json.loads(ev["msg"]["parts"]))
    recs = [r for r in (e2e.feed_rec(l) for l in transcript(E)) if r and r[0] == "you-parts" and has_shot(r[1].get("parts"))]
    entry = [x.get("parts") for x in yous() if has_shot(x.get("parts"))][-1]
    check(len(journaled) == 1 and len(recs) == 1, "one journaled message and one you-parts record with the image: %d, %d" % (len(journaled), len(recs)))
    check(journaled[-1] == recs[-1][1]["parts"] == entry,
          "the image message's parts are the same values journaled, in the feed record and on his entry: %r / %r / %r" % (journaled[-1:], recs[-1:], entry))
    rel = [{"kind": "text", "text": "relative "}, {"kind": "image", "name": "[Image #1]", "source": "by-source.png"}]
    check("absolute" in refused(req(c, "turn/send", agent="main", text="", parts=rel, mode="now"), "a relative image source")["message"], "the refusal says why")
    for rnd in (positional_round, hint_round):
        rnd(c, E, yous, shot)

    # his screenshot: a card answer with a quote of main
    c.say("/new t3: say hi")
    c.wait(lambda: c.agent("t3") is not None, 30, "t3")
    c.wait_idle("t3", timeout=45)
    c.say('[[bash: sb send main --expect-reply "quel process ?"]]', focus="t3")
    mid = asked(c, "t3", "quel process", "t3 asks main (parts)")
    c.wait_idle("main", "t3", timeout=45)
    c.say('[[bash: sb card --for %s "quel process ?"]]' % mid)
    c.wait(lambda: any(x["kind"] == "question" for x in c.cards()), 30, "the parts card")
    card = [x for x in c.cards() if x["kind"] == "question"][0]
    c.wait_idle("main", timeout=30)
    aparts = [{"kind": "quote", "from": "main", "text": "le process"}, {"kind": "text", "text": "Son process prenait tout mon CPU!"}]
    ok(req(c, "card/answer", card=card["id"], reply="", parts=aparts), "a card answer with parts")
    c.wait(lambda: not c.cards(), 30, "the parts card closed by the answer")
    c.wait(lambda: any(x["kind"] == "approval" and x.get("parts") == aparts for x in entries(c, "main")), 30, "the answer's row keeps its parts")
    row = [x for x in entries(c, "main") if x["kind"] == "approval" and x.get("parts") == aparts][-1]
    check("<selection" not in row["text"] + row["approval"].get("note", "") and "you answered t3" in row["text"], "no tag on the row: %r" % row)
    c.wait_line("t3", "Son process prenait", 30)
    c.wait_idle("t3", timeout=30)
    t3tr = open(os.path.join(E.state, "agents", "t3", "transcript.log")).read()
    check(render(aparts).replace("\n", "\\n") in t3tr or "le process" in t3tr, "t3 got his quote and words: %s" % t3tr[-600:])
    unsubscribe(c, "main")


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: scripts/bins.sh")
    E = e2e.Env()
    ok_ = False
    try:
        c = E.start_hub()
        c.wait_status("main", "idle", 30)
        parts_round(c, E)
        check_keys(c)
        ok_ = True
        print("PASS proto_e2e_parts", flush=True)
    finally:
        E.close()
    sys.exit(0 if ok_ else 1)


if __name__ == "__main__":
    main()
