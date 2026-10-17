"""bise_proto::parts in Python for proto_e2e_parts: the model's text of
his typed parts, and the check that a window-shaped message keeps its
order (his m_22231, architect m_22248)."""

import json

from e2e import check
from proto_rpc import refused, req
from words import w


def quote_tag(frm, text, n=None):
    at = ' n="%d"' % n if n is not None else ""
    return '<selection from="%s"%s>\n%s\n</selection>' % (frm, at, text)


def paste_tag(n, text):
    return '<pasted n="%d" lines="%d">\n%s\n</pasted>' % (n, max(1, len(text.rstrip("\n").split("\n"))), text)


def render(parts):
    """bise_proto::parts::render for quotes, words and pastes: the quotes
    without a number in front one per line, then the words with the
    pastes and the numbered quotes in place."""
    head = [quote_tag(p["from"], p["text"]) for p in parts if p["kind"] == "quote" and "n" not in p]

    def inline(p):
        if p["kind"] == "text":
            return p["text"]
        if p["kind"] == "paste":
            return paste_tag(p["n"], p["text"])
        return quote_tag(p["from"], p["text"], p["n"])
    body = "".join(inline(p) for p in parts if p["kind"] in ("text", "paste") or (p["kind"] == "quote" and "n" in p))
    return "\n".join(head + ([body] if body else []))


def positional_round(c, E, yous, shot):
    """His m_22231: 'regarding [Image #1] and [Image #2] and ❝ 3, …' as
    the window sends it (parts, no text). His entry keeps the parts in
    their order, the model reads the quote at its place, after both
    images. A window before desktop-v2026.10.1 sent his words with the
    chips' labels beside the parts (not their render): refused with its
    cid, nothing delivered (issue 31; it was logged and taken before)."""
    quote = {"kind": "quote", "from": "main", "text": "the cache is warm", "n": 3}
    parts = [
        {"kind": "text", "text": "regarding "},
        {"kind": "image", "name": "[Image #1]", "source": shot},
        {"kind": "text", "text": " and "},
        {"kind": "image", "name": "[Image #2]", "source": shot},
        {"kind": "text", "text": " and "},
        quote,
        {"kind": "text", "text": ", which is right?"},
    ]
    r = req(c, "turn/send", agent="main", text="", parts=parts, mode="now", cid=81)
    try:
        c.wait(lambda: any(any(p.get("n") == 3 for p in x.get("parts", [])) for x in yous()), 30, "the numbered quote on his entry")
    except AssertionError:
        print("its response: %r" % r, flush=True)
        print("last yous: %r" % [(x.get("text", "")[:120], x.get("parts")) for x in yous()][-2:], flush=True)
        raise
    e = [x for x in yous() if any(p.get("n") == 3 for p in x.get("parts", []))][-1]
    shape = [p["text"] if p["kind"] == "text" else p.get("name", "q%s" % p.get("n")) for p in e["parts"]]
    check(shape == ["regarding ", "[Image #1]", " and ", "[Image #2]", " and ", "q3", ", which is right?"], "his entry's parts keep his order: %r" % shape)
    tag = quote_tag("main", quote["text"], 3)
    check(e["text"].count("<selection") == 1 and e["text"].index("[Image #2]") < e["text"].index(tag) and e["text"].endswith(tag + ", which is right?"),
          "the entry's text has the quote at its place: %r" % e["text"][-300:])
    c.wait_idle("main", timeout=30)
    tail = " and " + tag + ", which is right?"
    reqs = [r for r in E.fake_requests() if r.get("agent") == "main"]
    check(any(tail in r.get("user_tail", "") + r.get("user", "") for r in reqs), "the model read the quote after both images: %r" % [r.get("user_tail") for r in reqs][-2:])
    old = [{"kind": "quote", "from": "main", "text": "the released app"}, {"kind": "text", "text": "sent its words too"}]
    before = len(yous())
    r = req(c, "turn/send", agent="main", text="sent its words too", parts=old, mode="now", cid=82)
    err = refused(r, "a text beside its parts")
    check(err["message"] == w("composer.refused_text_beside_parts"), "its words: %r" % err)
    c.wait_idle("main", timeout=30)
    check(len(yous()) == before and not any(x.get("parts") == old for x in yous()), "nothing delivered")
    check(not any("sent its words too" in json.dumps(q) for q in E.fake_requests()), "the model never read it")


CAPSULE_HINT = "\n\n[from the capsule: answer in one short line]"


def hint_round(c, E, yous, shot):
    """ambient-lead m_22706: his words typed with fn space (via capsule).
    The model still reads the capsule's line after them, byte for byte;
    his entry carries it as the hub's hidden hint part (of: capsule),
    never in his words."""
    words = "what is running right now?"
    c.say(words, via="capsule")
    c.wait(lambda: any(any(p.get("kind") == "hint" for p in x.get("parts", [])) for x in yous()), 30, "his capsule message with its hint part")
    e = [x for x in yous() if any(p.get("kind") == "hint" for p in x.get("parts", []))][-1]
    hint = [p for p in e["parts"] if p.get("kind") == "hint"]
    check(hint == [{"kind": "hint", "of": "capsule", "text": CAPSULE_HINT}], "one capsule hint: %r" % e["parts"])
    his = "".join(p.get("text", "") for p in e["parts"] if p.get("kind") == "text")
    check(his == words, "his words alone in his text parts: %r" % e["parts"])
    c.wait_idle("main", timeout=30)
    got = [r for r in E.fake_requests() if r.get("agent") == "main" and words in json.dumps(r)]
    check(got and any((words + CAPSULE_HINT) in json.dumps(r.get("users", r.get("last_user", ""))) or json.dumps(words + CAPSULE_HINT)[1:-1] in json.dumps(r) for r in got),
          "the model reads the capsule's line after his words: %r" % [r.get("last_user", "")[-200:] for r in got][-2:])
