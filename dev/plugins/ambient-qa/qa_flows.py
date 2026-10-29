"""ambient-qa: the scripted product runs' scenarios and their flows (newsletter, feedback, checklist) with their card, question and page-section helpers.
Moved out of qa.py as is (the 1,000-line cap, architect S1); qa.py re-exports every name."""

import calendar
import json
import os
import re
import time

from qa_core import (  # noqa: E402
    FAKE_ACCOUNTS, _http)
from qa_pages import (  # noqa: E402
    page_meta, page_notes)


# ---------------------------------------------------------------- scripted product runs

# ambient-lead m_5306: the same asks, notes and measures every time, on a
# model hub with the fake accounts only (never the user's accounts)
SCENARIOS = {
    "weekly-update": {"ask": "draft my weekly update from Slack and Linear", "no_send": False},
    "inbox": {"ask": "go through my mail, draft replies, don't send", "no_send": True},
    "offsite": {"ask": "plan the offsite: the venue we decided, the budget, and an agenda for the two days, from my mail and Slack", "no_send": False},
    # roadmap B (ambient-lead m_5447): a review page, republished after a tick
    # with the new comments, cards only for what needs an answer, nothing posted
    "launch-watch": {"ask": "watch the launch until tomorrow, tell me what needs an answer", "no_send": True, "no_writes": True,
                     "notes": False, "ticks": 1},
}


SCENARIOS.update({
    # roadmap A (ambient-lead m_5616): a Kit draft only after his word, the went line, no send
    "newsletter": {"ask": "write the newsletter for the launch from the release notes", "no_send": True, "notes": False, "flow": "newsletter"},
    # roadmap C: the feedback review, 'start an agent' on two items, agents with the item as brief, nothing leaves
    # no_send off: the flow checks nothing leaves before his send note, then exactly one Slack message
    "feedback": {"ask": "Benjamin's bug reports in #acme-feedback: handle them so adoption is easy", "no_send": False, "notes": False, "flow": "feedback",
                 "picks": {"q-language": 2}},
    # roadmap D (amb-core 527fa441): a step-by-step plan, bise ticks its own, a card per step of his when its turn comes
    # no_send off: a send is checked against his word on its draft card by the flow (ambient-pm m_5932)
    "checklist": {"ask": "check my mail and give me a step by step to buy the domain", "no_send": False, "notes": False, "flow": "checklist",
                  "note_texts": {"legal": "legal@acme.test"}},
    # roadmap E (amb-kit m_5643): a seeded night (a PR done, a question card, unsent replies,
    # his domain steps, the launch watch), then the morning page from it; nothing leaves
    "morning": {"ask": "make today's morning page", "no_send": True, "no_writes": True, "notes": False,
                "set": "today", "seed": "morning", "flow": "morning"},
    # meetings (amb-kit m_5656): real time, about 75 min: the briefs before the renewal (+15 min)
    # and the sync (+60), the renewal's follow-ups after Granola's notes (+47); no card, nothing leaves
    "meetings": {"ask": "brief me before my meetings today, and do the follow-ups after", "no_send": True, "no_writes": True,
                 "notes": False, "set": "today", "flow": "meetings", "timed": True},
    # F, mentions for him (amb-kit m_5997): 6 asks over 3 batches (the start, 2 ticks), noise that must
    # not show, cards for his team's questions only; his send on Sophie's item, a start on Nora's
    "mentions": {"ask": "watch for what's asked of me on Slack and mail", "no_send": False, "notes": False,
                 "set": "mentions", "flow": "mentions", "tick_min": 0},
    # G, his promises (ambient-lead m_6016): the promises page, sb page waiting, the morning page; no card, nothing leaves
    "promises": {"ask": "keep track of what i promised people", "no_send": True, "no_writes": True, "notes": False,
                 "set": "promises", "flow": "promises"},
})


def _writes(info):
    try:
        return [json.loads(l) for l in open(os.path.join(info["tmp"], "outbox.jsonl")) if l.strip()]
    except FileNotFoundError:
        return []


def _body(x, n):
    st, b = _http(x["port"], "GET", "/p/%s/v/%d/body" % (x["page"]["id"], n))
    open(os.path.join(x["d"], "v%d.body.html" % n), "w").write(b)
    return b


def _agent_settled(a):
    """An agent of the run's hub is settled when it is idle, done or blocked, or when it
    declared itself working but is between turns (no turn_ms: the hub sets it from the
    turn's start to its end): a watch says 'working · watching every 10m' for its whole
    life, and the mentions run waited forever for it after the watcher's republish."""
    if a.get("status") in ("idle", "done", "blocked"):
        return True
    return a.get("status") == "working" and a.get("turn_ms") is None


def _until(x, pred, what):
    """Polls the run (its main lines, cards) until pred() or the timeout; the seconds it took, or None (a fail recorded)."""
    t = time.time()
    while time.time() - t < x["timeout"]:
        x["poll"]()
        try:
            if pred():
                return round(time.time() - t, 1)
        except Exception:  # noqa: BLE001
            pass
        time.sleep(2)
    x["r"]["fails"].append("%s: not within %d s" % (what, x["timeout"]))
    return None


def _flow_newsletter(x):
    """A: nothing in the outbox before his word; 'put it in my drafts' on the
    page; then one Kit draft in the outbox and the page's went line."""
    r, pid = x["r"], x["page"]["id"]
    early = [w for w in _writes(x["info"]) if w.get("kind", "").endswith("draft")]
    if early:
        r["fails"].append("%d draft(s) before his word" % len(early))
    blocks = x["last"].get("blocks", [])
    r["t"]["go"] = x["rel"]()
    page_notes(pid, [{"block": blocks[0]["id"] if blocks else "page", "kind": "drafts", "text": "put it in my drafts"}], send=True)
    took = _until(x, lambda: any(w.get("kind") == "kit-draft" for w in _writes(x["info"]))
                  and any(g.get("kind") == "kit-draft" for g in page_meta(pid).get("went", [])) and x["settled"](), "a Kit draft and the went line after 'put it in my drafts'")
    r["t"]["draft_after_go"] = took
    meta = page_meta(pid)
    r["went"] = meta.get("went", [])
    kd = [w for w in _writes(x["info"]) if w.get("kind") == "kit-draft"]
    if len(kd) > 1:
        r["fails"].append("%d Kit drafts (one expected)" % len(kd))
    r["flow"] = {"kit_drafts": len(kd), "went": [(g.get("kind"), g.get("url")) for g in r["went"]], "version": meta["versions"][-1]["n"]}
    _body(x, meta["versions"][-1]["n"])


def _flow_feedback(x):
    """C: the review names Benjamin's three reports; 'start an agent' on two;
    two agents start with the item as their brief; nothing leaves."""
    r, c, pid = x["r"], x["c"], x["page"]["id"]
    reports = [m for m in json.load(open(os.path.join(FAKE_ACCOUNTS, "fixtures.json")))["slack"]["messages"] if m["channel"] == "acme-feedback"]
    low = x["body"].lower()
    words = {"s212": "fish", "s213": "proxy", "s214": "fran"}
    r["coverage"] = {"v1": {"found": sum(words[m["id"]] in low for m in reports), "of": len(reports),
                            "missing": [m["id"] for m in reports if words[m["id"]] not in low]}}
    items = re.findall(r'<li[^>]*\bdata-id="([^"]+)"', re.search(r'<section[^>]*data-kit="review".*?</section>', x["body"], re.S).group(0)) \
        if 'data-kit="review"' in x["body"] else []
    if len(items) < 2:
        r["fails"].append("the review has %d items (2 needed to start agents)" % len(items))
        return
    block = re.search(r'<section[^>]*data-kit="review"[^>]*data-id="([^"]+)"|<section[^>]*data-id="([^"]+)"[^>]*data-kit="review"', x["body"])
    block = next(g for g in block.groups() if g) if block else items[0]
    names0 = {a["name"] for a in (c.state or {}).get("agents", [])}
    r["t"]["start"] = x["rel"]()
    page_notes(pid, [{"block": block, "item": i, "kind": "start"} for i in items[:2]], send=True)
    new = lambda: [a for a in (c.state or {}).get("agents", []) if a["name"] not in names0]
    r["t"]["agents_after_start"] = _until(x, lambda: len(new()) >= 2, "two agents started from the page")
    agents = new()
    briefs = {}
    for a in agents:
        # its brief: its own first lines, and main's lines that start it ('sb spawn : main → new
        # agent @<name> : <objective>' carries the objective, ambient-pm m_5887)
        spawn = [l for l in c.lines("main") if ("sb spawn" in l or "new agent" in l) and a["name"] in l]
        text = " ".join(c.lines(a["name"])[:40] + spawn).lower()
        briefs[a["name"]] = [k for k, w in words.items() if w in text]
    r["flow"] = {"items": items, "started": [a["name"] for a in agents], "briefs": briefs}
    if agents and not all(briefs.values()):
        r["fails"].append("an agent's brief doesn't name its report: %s" % briefs)
    # the items show their agents (data-agent) once the page republishes
    took = _until(x, lambda: page_meta(pid)["versions"][-1]["n"] > x["last"]["n"]
                  and _body(x, page_meta(pid)["versions"][-1]["n"]).count("data-agent=") >= 2, "the items showing their agents (data-agent)")
    r["t"]["items_show_agents"] = took
    if took is not None and agents:
        _feedback_loop_end(x, [a["name"] for a in agents])


# what a reply about a done fix says, in his words or the reporter's (Benjamin writes French)
FIX_WORDS = r"\bfix|\blanded\b|\bready\b|\bshipped\b|\bsolved\b|\bresolved\b|corrig|résolu|réglé|\bprêt|remplac|livr"


def feedback_done_check(body, agent, v1=None):
    """feedback.md once an agent is done: its item still carries it
    (data-agent, the kit shows '✓ <name> done'), and a reply draft (a
    message or email block) says the fix is there in any words (fix, ready,
    landed, French too), or is new or changed since `v1` (ambient-pm m_5918:
    'The fix is ready', 'On la remplace'). Returns (the reply block or None, fails)."""
    fails = []
    if not re.search(r'<li[^>]*data-agent="%s"' % re.escape(agent), body or ""):
        fails.append("the done item lost its agent (data-agent=\"%s\")" % agent)
    before = {s["id"]: (s["kit"], s["html"]) for s in _sections(v1)} if v1 is not None else None
    replies = [s for s in _sections(body) if s["kit"] in ("message", "email")
               and (re.search(FIX_WORDS, re.sub(r"<[^>]+>", " ", s["html"]).lower())
                    or (before is not None and before.get(s["id"]) != (s["kit"], s["html"])))]
    if not replies:
        fails.append("no reply draft about the fix (a message or email block saying it's fixed or ready, or new since v1)")
    return (replies[0] if replies else None), fails


def _feedback_loop_end(x, started):
    """C's end (ambient-lead m_5877, ambient-pm m_5875): one started agent
    finishes (a small real fix in the workspace's acme code), its item
    shows it and its reply draft says fixed; nothing leaves until a send
    note on that reply, then exactly one Slack message."""
    r, c, pid = x["r"], x["c"], x["page"]["id"]
    done = lambda: next((a["name"] for a in (c.state or {}).get("agents", []) if a["name"] in started and a.get("status") == "done"), None)
    # main's questions on the way (how to ship code here, the page's own questions): answered as he would
    if _until(x, lambda: answer_questions(x) or done() is not None, "one started agent done") is None:
        return
    name = done()
    r["t"]["agent_done"] = x["rel"]()
    r["flow"]["done"] = name
    got = {}

    def shown():
        n = page_meta(pid)["versions"][-1]["n"]
        b = _body(x, n)
        reply, fails = feedback_done_check(b, name, x["body"])
        if not fails and x["settled"]():
            got.update(n=n, reply=reply)
            return True
        got["fails"] = fails
        return False
    if _until(x, shown, "the done item republished with its reply draft ('fixed …')") is None:
        r["fails"].extend(got.get("fails", []))
        return
    r["t"]["reply_drafted"] = x["rel"]()
    early = _writes(x["info"])
    if early:
        r["fails"].append("%d write(s) before his word: %s" % (len(early), ", ".join(w.get("kind", "?") for w in early)))
        return
    reply = got["reply"]
    r["flow"]["reply"] = {"block": reply["id"], "kit": reply["kit"], "text": re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", reply["html"])).strip()[:200]}
    # 2+ replies waiting make ONE batch card (amb-core 7a5ebb2e: '3 drafts wait for you … 1. review /
    # 2. send all 3'): he answers 'send all' on it, and exactly that many Slack posts leave (pm m_6167)
    # the newest batch card still open (ambient-pm's C fail 43: two batch cards were open and
    # 'send all' on the older one did nothing): the hub's open cards now, never one seen before
    batch = _soft_until(x, lambda: max((cd for cd in x["c"].cards() if batch_card(cd)), key=lambda cd: cd.get("id") or 0, default=None), 240)
    if batch:
        n, pick = batch_card(batch)
        r["flow"]["batch_card"] = {"id": batch["id"], "drafts": n, "pick": pick, "text": (batch.get("text") or "")[:160]}
        answer_card(x, batch["id"], pick)
        r["t"]["send_all"] = x["rel"]()
        # the batch's drafts leave each by its own kind (ambient-pm m_6189: '6 drafts' = 3 Slack
        # replies + 3 Linear issues → 3 slack post_message + 3 linear create_issue): n writes in all
        took = _until(x, lambda: len(_writes(x["info"])) >= n and x["settled"](),
                      "the %d drafts gone out after his 'send all'" % n)
        w = _writes(x["info"])
        r["flow"]["after_send"] = [w_.get("kind") for w_ in w]
        if took is not None:
            r["t"]["posted_after_send"] = took
            kinds = {}
            for w_ in w:
                kinds[w_.get("service") or "?"] = kinds.get(w_.get("service") or "?", 0) + 1
            r["flow"]["batch_card"]["went"] = kinds
            if len(w) != n or not kinds.get("slack"):
                r["fails"].append("after his 'send all %d': %d write(s) (%s), exactly %d expected, the Slack replies among them"
                                  % (n, len(w), ", ".join(r["flow"]["after_send"]), n))
        return
    r["flow"]["batch_card"] = None
    page_notes(pid, [{"block": reply["id"], "kind": "send"}], send=True)
    r["t"]["send"] = x["rel"]()
    took = _until(x, lambda: _writes(x["info"]) and x["settled"](), "the reply posted after his send")
    w = _writes(x["info"])
    r["flow"]["after_send"] = [w_.get("kind") for w_ in w]
    if took is not None:
        r["t"]["posted_after_send"] = took
        slack = [w_ for w_ in w if w_.get("service") == "slack"]
        if len(w) != 1 or len(slack) != 1:
            r["fails"].append("after his send: %d write(s) (%s), exactly one Slack message expected" % (len(w), ", ".join(r["flow"]["after_send"])))


def batch_card(card):
    """A batch draft card (amb-core 34703bf0/7a5ebb2e: '3 drafts wait for you · <page> … 1. review /
    2. send all 3', card.batch {count, …}, card.page.drafts): (its draft count, the 'send all'
    option's number), else None."""
    text = card.get("text") or ""
    b = card.get("batch") if isinstance(card.get("batch"), dict) else {}
    m = re.search(r"(\d+) drafts? wait for you", text)
    if not (b or (card.get("page") or {}).get("drafts") or m):
        return None
    n = int(b.get("count") or (m.group(1) if m else 0) or 0)
    opt = re.search(r"(?m)^\s*(\d+)[.)]?\s+send all", text, re.I)
    if not n:
        all_n = re.search(r"send all (\d+)", text, re.I)
        n = int(all_n.group(1)) if all_n else 0
    return (n, opt.group(1) if opt else "2") if n else None


def _soft_until(x, get, secs):
    """Polls the run like _until for at most `secs` and returns get()'s first truthy value, or
    None, without recording a fail (for what may or may not come)."""
    t = time.time()
    while time.time() - t < secs:
        x["poll"]()
        try:
            v = get()
            if v:
                return v
        except Exception:  # noqa: BLE001
            pass
        time.sleep(2)
    return None


def answer_card(x, card_id, reply):
    """His answer to a card, as the desktop app sends it: {cmd: answer, card, reply} on the
    run's core child's stdin."""
    cmd = {"cmd": "answer", "card": card_id, "reply": str(reply)}
    core = x["core"]
    core.p.stdin.write(json.dumps(cmd) + "\n")
    core.p.stdin.flush()
    x["r"].setdefault("answers", []).append(dict(cmd, at=round(time.time(), 1), path="core"))


def question_pick(card, picks=None, default=1):
    """The reply the QA gives a question card: the scenario's pick for its
    page block (picks {"q-language": 2}), else the option bise marked
    suggested ('← suggested', 'recommended'), else `default`."""
    block = (card.get("page") or {}).get("block")
    if picks and block in picks:
        return str(picks[block])
    for line in (card.get("text") or "").splitlines():
        m = re.match(r"\s*(\d+)[.)]?\s+(.*)", line)
        if m and re.search(r"suggested|recommended|←", m.group(2), re.I):
            return m.group(1)
    for o in card.get("options") or []:
        if re.search(r"suggested|recommended", str(o.get("label", "")), re.I):
            return str(o.get("n"))
    return str(default)


def option_label(card, pick):
    """The words of option `pick` on a question card (its text lines, or its options)."""
    for o in card.get("options") or []:
        if str(o.get("n")) == str(pick):
            return str(o.get("label", ""))
    for line in (card.get("text") or "").splitlines():
        m = re.match(r"\s*(\d+)[.)]?\s+(.*)", line)
        if m and m.group(1) == str(pick):
            return m.group(2)
    return ""


def answer_questions(x):
    """Answers every open question card that isn't one of his step cards
    (no page item) through the core, once each, as he would; recorded in
    flow.questions (ambient-pm m_5901: main asked how agents ship code and
    the page asked the assistant's language, and the run never answered)."""
    answered = x["r"].setdefault("flow", {}).setdefault("questions", [])
    done = {a["id"] for a in answered}
    for q in x["c"].cards():
        if q.get("kind") == "question" and not (q.get("page") or {}).get("item") and q.get("id") not in done and not batch_card(q):
            pick = question_pick(q, x.get("picks"), x.get("pick") or 1)
            answer_card(x, q["id"], pick)
            answered.append({"id": q["id"], "text": (q.get("text") or "")[:160], "reply": pick})
            # an option that promises a note ('i'll leave a note with the address'): the note
            # follows on that block, with the scenario's words for it (ambient-pm m_5904)
            pg = q.get("page") or {}
            label = option_label(q, pick)
            if pg.get("id") and pg.get("block") and re.search(r"\bnote\b", label, re.I):
                # the scenario's words: a key that is in the block id or the question
                # (ambient-pm m_5950: the block was 'legal-to', not 'q-legal', so the label went instead)
                where = (pg["block"] + " " + (q.get("text") or "")).lower()
                text = next((t for k, t in (x.get("note_texts") or {}).items() if k.lower() in where), None) or label
                saved = page_notes(pg["id"], [{"block": pg["block"], "kind": "note", "text": text}], send=True)
                answered[-1]["note"] = text
                # in run.json's notes, so the flow's notes read apart from the product's
                x["r"].setdefault("notes", []).append({"by": "qa flow", "page": pg["id"], "block": pg["block"], "kind": "note", "text": text,
                                                     "for_card": q["id"], "ids": [n.get("id") for n in (saved or {}).get("saved", [])]})


def _rows(body):
    """A page body's checklist rows: block, item, yours, done."""
    out = []
    for sec in re.finditer(r"<section([^>]*)>(.*?)</section>", body, re.S):
        if 'data-kit="checklist"' not in sec.group(1):
            continue
        b = re.search(r'data-id="([^"]+)"', sec.group(1))
        for li in re.finditer(r"<li([^>]*)>", sec.group(2)):
            a = li.group(1)
            i = re.search(r'data-id="([^"]+)"', a)
            if i:
                out.append({"block": b.group(1) if b else "", "item": i.group(1), "yours": 'data-who="yours"' in a, "done": "data-done" in a})
    return out


def _flow_checklist(x):
    """D: a plan of steps, his marked yours; one card per step of his when
    its turn comes; the first closed by a tick note on the page, the next
    by 'done' on its card; at the end every step done or ticked, no card left."""
    r, c, pid = x["r"], x["c"], x["page"]["id"]
    rows = _rows(x["body"])
    yours = [w for w in rows if w["yours"]]
    r["flow"] = {"steps": len(rows), "yours": len(yours), "cards": [], "closed_by": []}
    if len(rows) < 3 or not yours:
        r["fails"].append("the plan has %d steps, %d of his (a checklist with his steps expected)" % (len(rows), len(yours)))
        return
    step_card = lambda: next((cd for cd in c.cards() if (cd.get("page") or {}).get("id") == pid and (cd.get("page") or {}).get("item")), None)
    # every step card as it comes, until none is left (ambient-pm m_5925: a drafted bise step,
    # 'send the draft?', also makes a step card, so counting his rows ended the loop too early):
    # his own rows close by a tick note on the page and by 'done' on the card in turn, a drafted
    # row (bise's or Lucas's 'send the draft?') by 'done' on its card; question cards are answered
    mine = {w["item"] for w in yours}
    handled, quiet, t0 = set(), None, time.time()
    while time.time() - t0 < x["timeout"]:
        x["poll"]()
        answer_questions(x)
        cd = next((d for d in c.cards() if (d.get("page") or {}).get("id") == pid and (d.get("page") or {}).get("item")
                   and d.get("id") not in handled), None)
        if cd is None:
            quiet = quiet or time.time()
            if x["settled"]() and not step_card() and time.time() - quiet > 30:
                break
            time.sleep(2)
            continue
        quiet = None
        handled.add(cd["id"])
        item, block = cd["page"]["item"], cd["page"]["block"]
        his = item in mine
        r["flow"]["cards"].append({"item": item, "his": his, "text": cd.get("text"), "after": round(time.time() - t0, 1)})
        if his and sum(1 for k in r["flow"]["cards"] if k["his"]) % 2 == 1:
            page_notes(pid, [{"block": block, "item": item, "kind": "tick"}], send=False)   # a tick on the page, even a draft
            r["flow"]["closed_by"].append("tick note")
        else:
            answer_card(x, cd["id"], "1")
            r["flow"]["closed_by"].append("card answer")
            if not his:
                # his word for a draft: a send may follow it, and only it
                r["flow"].setdefault("words", []).append({"item": item, "at": time.time()})
        if _until(x, lambda: all(d.get("id") != cd["id"] for d in c.cards()), "the card of %s closing" % item) is None:
            return
    else:
        r["fails"].append("step cards still coming after %d s" % x["timeout"])
    _until(x, lambda: x["settled"]() and not step_card(), "no step card left")
    meta = page_meta(pid)
    ticks = {(n["block"], n.get("item")) for n in meta.get("notes", []) if n.get("kind") == "tick"}
    final = _rows(_body(x, meta["versions"][-1]["n"]))
    left = [w["item"] for w in final if not w["done"] and (w["block"], w["item"]) not in ticks]
    # his part must be done; rows waiting on someone else after it (Lucas's DNS, bise's check
    # after it) are the right end state (ambient-pm m_5932)
    his_left = [w["item"] for w in final if w["yours"] and w["item"] in left]
    r["flow"]["left"], r["flow"]["waiting_on_others"] = his_left, [i for i in left if i not in his_left]
    if his_left:
        r["fails"].append("his steps neither done nor ticked: %s" % ", ".join(his_left))
    # his 'send' on a draft's card and the sends must match one to one (ambient-pm m_5932, m_5940):
    # never a send before his first word, never more sends than words, and each word leads to its
    # send within the settle time (a word that led to nothing fails too)
    words = sorted(k["at"] for k in r["flow"].get("words", []))
    sends_of = lambda: sorted((w for w in _writes(x["info"]) if w["action"] in SENDS), key=lambda w: w["at"])
    if words:
        t_end = time.time() + 60   # ~60 s (ambient-lead m_5942)
        while len(sends_of()) < len(words) and time.time() < t_end:
            x["poll"]()
            time.sleep(3)
    sends = sends_of()
    early = [w for w in sends if not words or calendar.timegm(time.strptime(w["at"], "%Y-%m-%dT%H:%M:%SZ")) < int(words[0]) - 1]
    r["flow"]["sends"] = [w.get("kind") for w in sends]
    if early or len(sends) != len(words):
        r["fails"].append("%d send(s) for %d 'send' answer(s) of his on drafts (%d before the first; one each expected)" % (len(sends), len(words), len(early)))




def _sections(body):
    """A page body's sections: kit, id, inner html."""
    out = []
    for s in re.finditer(r"<section([^>]*)>(.*?)</section>", body or "", re.S):
        k = re.search(r'data-kit="([^"]+)"', s.group(1))
        i = re.search(r'data-id="([^"]+)"', s.group(1))
        out.append({"kit": k.group(1) if k else "", "id": i.group(1) if i else "", "html": s.group(2), "attrs": s.group(1)})
    return out


# writes that leave the user's hands (a draft does not)
SENDS = {"send_message", "post_message", "comment_issue", "add_comment", "create_issue", "update_issue", "create_event", "modify_labels"}
