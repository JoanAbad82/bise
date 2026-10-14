"""ambient-qa: the page runs' truths and checks (morning, meetings, mentions, promises) and the flows table.
Moved out of qa.py as is (the 1,000-line cap, architect S1); qa.py re-exports every name."""

import datetime
import json
import os
import re
import subprocess
import time

from qa_core import (  # noqa: E402
    FAKE_ACCOUNTS, QAError, REPO, _hub, _port, _wait, tick)
from qa_pages import (  # noqa: E402
    page_meta, page_notes)
from qa_flows import (  # noqa: E402
    _body, _flow_checklist, _flow_feedback, _flow_newsletter, _rows, _sections, _until,
    _writes)


COOKIE_QUESTION = """<section data-kit="heading" data-id="title">
  <h1>the cookie banner</h1>
  <p>one decision before the banner ships</p>
</section>

<section data-kit="question" data-id="q1">
  <p>who sees the cookie banner?</p>
  <ol>
    <li>everyone, opt-in</li>
    <li>only visitors from the EU</li>
  </ol>
</section>
"""

KIT_EXAMPLES = os.path.join(REPO, "kit", "examples")


def _seed_morning(info, timeout=600):
    """roadmap E's night, on the scripted hub (amb-kit m_5643): an agent done
    with its PR, an agent asking a question (a card), the inbox review with
    replies not sent, the domain plan with his steps, the launch watch and
    its timer. The model hub then reuses this state and makes the morning page."""
    c, _ = _hub()
    _wait(lambda: c.state, 30, "the seeded hub's state")
    seed = os.path.join(info["tmp"], "seed")
    os.makedirs(seed, exist_ok=True)
    q = os.path.join(seed, "cookie-question.html")
    open(q, "w").write(COOKIE_QUESTION)
    ex = lambda n: os.path.join(KIT_EXAMPLES, n)
    says = [
        '/new fix-csv: {{bash: sb report done "CSV export keeps the due dates: PR https://github.test/acme/app/pull/241"}}',
        '/new cookies: {{bash: sb page publish %s --id cookie-question --title "the cookie banner"}}' % q,
        '[[bash: sb card "the cookie banner: everyone opt-in, or only the EU? (page cookie-question)"]]',
        '[[bash: sb page publish %s --id inbox --title "your inbox"]]' % ex("inbox-review.html"),
        '[[bash: sb page publish %s --id domain --title "buy the domain"]]' % ex("buy-domain.html"),
        '[[bash: sb page publish %s --id launch-watch --title "the launch"]]' % ex("launch-watch.html"),
        '[[bash: sb every 30m "check the launch, republish launch-watch" --page launch-watch]]',
    ]
    for s in says:
        c.wait_idle("main", timeout=timeout)
        n0 = len(c.lines("main"))
        c.say(s)
        if s.startswith("/new "):
            # no turn of main's: the agent itself, then its own scripted turn
            name = s[5:].split(":")[0]
            _wait(lambda: c.agent(name), timeout, "agent " + name)
            _wait(lambda: any(l.strip().startswith("obs: turn_done") for l in c.lines(name)), timeout, name + "'s turn")
            c.wait_idle("main", timeout=timeout)
            continue
        _wait(lambda: any(l.strip().startswith("obs: turn_done") for l in c.lines("main")[n0:]), timeout, "main's turn on: " + s[:60])
        # a step that fails fails the seed at once (a bise older than the kit's lint or sb every)
        bad = [l for l in c.lines("main")[n0:] if re.match(r"tool_result #\d+ fail", l)]
        if bad:
            raise QAError("the seed's step failed: %s -> %s (a stale bise? pass --bise or AMBIENT_QA_BISE built at ambient-app's tip)" % (s[:80], bad[0][:300]))
    want = {"cookie-question", "inbox", "domain", "launch-watch"}
    pages = lambda: {p["id"] for p in (c.state or {}).get("pages", [])}
    try:
        _wait(lambda: want <= pages() and c.agent("fix-csv") and c.agent("cookies") and c.cards()
              and all(a.get("status") in ("idle", "done", "blocked") for a in c.state.get("agents", [])), timeout, "the seed")
    except QAError:
        raise QAError("the seed didn't settle in %d s: pages %s (want %s), agents %s, %d card(s); main's last lines: %s"
                      % (timeout, sorted(pages()), sorted(want), [(a["name"], a.get("status")) for a in (c.state or {}).get("agents", [])],
                         len(c.cards()), " | ".join(l[:160] for l in c.lines("main")[-6:])))
    return {"pages": sorted(pages()), "agents": [(a["name"], a.get("status")) for a in c.state.get("agents", [])],
            "cards": [cd.get("text") for cd in c.cards()]}


SEEDS = {"morning": _seed_morning}


# what the seeded night must show on the morning page (a word of each, lower case)
MORNING_TRUTH = {"the cookie question": ("cookie",), "the inbox replies": ("inbox",), "his domain steps": ("domain",),
                 "the CSV PR": ("241", "fix-csv", "csv"), "the launch watch": ("launch-watch", "launch")}
MORNING_MEETINGS = {"e401": ("renewal", "northwind"), "e402": ("sync",), "e403": ("yann", "coffee")}


def morning_check(body, page_id, today=None):
    """roadmap E's page laws (bise-pages morning.md) on a body: the id of
    today, four parts at most (no review, question or sources), every line
    outside the meetings links to its place, a meeting's brief 3 lines at
    most, and the seeded night all there. Returns (facts, fails)."""
    today = today or time.strftime("%Y-%m-%d")
    fails, secs = [], _sections(body)
    if page_id != "morning-" + today:
        fails.append("page id %s (morning-%s expected)" % (page_id, today))
    bad = sorted({s["kit"] for s in secs if s["kit"] in ("review", "question", "sources")})
    if bad:
        fails.append("blocks the morning page never has: %s" % ", ".join(bad))
    heads = [s for s in secs if s["kit"] == "heading"]
    if len(heads) > 5:
        fails.append("%d headings (the title and 4 parts at most)" % len(heads))
    # the title: its <h1> first, then the meta line (amb-kit m_5771)
    title = heads[0]["html"] if heads else ""
    if "<h1" in title and "<p" in title and title.index("<p") < title.index("<h1"):
        fails.append("the title's <p> comes before its <h1>")
    meetings, unlinked, bare, part = {}, [], [], ""
    for s in secs:
        if s["kit"] == "heading":
            h2 = re.search(r"<h2[^>]*>(.*?)</h2>", s["html"], re.S)
            part = re.sub(r"<[^>]+>", "", h2.group(1)).strip().lower() if h2 else part
        if s["kit"] != "prose":
            continue
        if part == "needs you":
            # a page's item, never the bare page (amb-kit m_5771): /p/<page>#<item>
            bare += [h for h in re.findall(r'<a [^>]*href="(/p/[^"#]+)"', s["html"])]
        lis = re.findall(r"<li[^>]*>(.*?)</li>", s["html"], re.S)
        if re.search(r"<p[^>]*>\s*<strong>", s["html"]):
            low = re.sub(r"<[^>]+>", " ", s["html"]).lower()
            ev = next((e for e, ws in MORNING_MEETINGS.items() if any(w in low for w in ws)), s["id"])
            meetings[ev] = len(lis)
            continue
        unlinked += [re.sub(r"<[^>]+>", "", li).strip()[:60] for li in lis
                     if not re.search(r'<a [^>]*href="(/p/[^"]+|https://[^"]+)"', li)]
    if unlinked:
        fails.append("%d line(s) without a link to their place: %s" % (len(unlinked), "; ".join(unlinked[:3])))
    if bare:
        fails.append("needs you links to a bare page, not its item (/p/<page>#<item>): %s" % ", ".join(bare[:4]))
    long_ = {e: n for e, n in meetings.items() if n > 3}
    if long_:
        fails.append("meeting briefs over 3 lines: %s" % long_)
    missing_m = [e for e in MORNING_MEETINGS if e not in meetings]
    if missing_m:
        fails.append("meetings missing: %s" % ", ".join(missing_m))
    low = (body or "").lower()
    missing = [k for k, ws in MORNING_TRUTH.items() if not any(w in low for w in ws)]
    if missing:
        fails.append("the night's items missing: %s" % ", ".join(missing))
    return {"headings": len(heads), "kits": [s["kit"] for s in secs], "meetings": meetings, "unlinked": unlinked, "bare": bare,
            "found": [k for k in MORNING_TRUTH if k not in missing], "missing": missing}, fails


def _flow_morning(x):
    """E: the morning page of the seeded night, checked against morning.md."""
    facts, fails = morning_check(x["body"], x["page"]["id"])
    x["r"]["flow"] = facts
    x["r"]["fails"] += fails


MEETING_PAGE = re.compile(r"^meeting-[a-z0-9-]+-\d{4}-\d{2}-\d{2}$")
# the meetings of the today set the run follows (fixtures sets.today): words of their page id
MEETINGS_RUN = {"e401": ("renewal", "northwind"), "e402": ("sync",)}
# the today set's overdue promise: Granola's last Northwind call has Camille owing Hélène the SSO
# timeline in writing by 26 sep, and no mail sent it (the live run's brief found it)
MEETINGS_OVERDUE = {"e401"}


def meeting_brief_check(body, page_id, overdue=False):
    """meetings.md's brief (v1): its id, who (Hélène from people.md), last
    time linked, what is open as a checklist, three questions; with
    `overdue` (a promise of his past due, amb-kit 4fb9c90e), a risk callout
    right after the title heading. (facts, fails)"""
    fails, secs = [], _sections(body)
    if overdue:
        nxt = secs[1] if len(secs) > 1 and secs[0]["kit"] == "heading" else None
        if not (nxt and nxt["kit"] == "callout" and 'data-tone="risk"' in nxt["attrs"]):
            fails.append("%s: the overdue promise doesn't lead the brief (a data-tone=\"risk\" callout right after the title)" % page_id)
    low = (body or "").lower()
    if not MEETING_PAGE.match(page_id or ""):
        fails.append("brief id %s (meeting-<slug>-<YYYY-MM-DD> expected)" % page_id)
    kits = [s["kit"] for s in secs]
    if "checklist" not in kits:
        fails.append("%s: no checklist of what is open" % page_id)
    asks = max([len(re.findall(r"<li[^>]*>", s["html"])) for s in secs if s["kit"] == "prose" and "<ol" in s["html"]] or [0])
    if asks < 3:
        fails.append("%s: %d questions to ask (3 expected, a prose <ol>)" % (page_id, asks))
    if not re.search(r'<a [^>]*href="(https://|/p/)', body or ""):
        fails.append("%s: last time is not linked" % page_id)
    return {"kits": kits, "asks": asks, "names_helene": "hélène" in low or "helene" in low}, fails


def meeting_followup_check(body, page_id):
    """meetings.md's follow-ups (v2): decided, who does what with his rows
    yours, the drafts in their own blocks, Granola's decisions there. (facts, fails)"""
    fails, secs = [], _sections(body)
    low = (body or "").lower()
    rows = _rows(body)
    # his actions: his own rows, or rows bise took by drafting for his word (data-who="bise"
    # with data-draft: amb-kit dc32a7c9 'bise takes every step it can')
    taken = len(re.findall(r'<li[^>]*data-who="bise"[^>]*data-draft="[^"]+"', body or ""))
    if not any(w["yours"] for w in rows) and not taken:
        fails.append("%s v2: no action of his in who does what (a data-who=\"yours\" row, or one bise drafted for his word)" % page_id)
    drafts = [s["kit"] for s in secs if s["kit"] in ("email", "message")]
    if not drafts:
        fails.append("%s v2: no follow-up draft (an email or message block)" % page_id)
    said = {"3-year": ("3-year", "3 year", "three-year", "three year", "36 month"), "SSO": ("sso",), "45 seats": ("45",)}
    missing = [k for k, ws in said.items() if not any(w in low for w in ws)]
    if missing:
        fails.append("%s v2: Granola's decisions missing: %s" % (page_id, ", ".join(missing)))
    return {"rows": len(rows), "yours": sum(w["yours"] for w in rows), "bise_drafted": taken, "drafts": drafts, "decided": "decided" in low}, fails


def _flow_meetings(x):
    """Meetings (amb-kit m_5656), on real time: the today set puts the
    Northwind renewal 15 min after the hub's start (Granola's notes 2 min
    after its end at 45) and the team sync at 60. The ask sets the timers;
    the brief (v1) must be there before each start, the renewal's
    follow-ups (v2) within 30 min of its end; no card; nothing leaves."""
    r, c = x["r"], x["c"]
    clock = json.load(open(os.path.join(x["info"]["tmp"], "fake-clock.json")))
    s0 = clock["start"]
    fx = json.load(open(os.path.join(FAKE_ACCOUNTS, "fixtures.json")))["sets"]["today"]["calendar"]["events"]
    when = {e["id"]: (s0 + e["start_in_min"] * 60, s0 + e["end_in_min"] * 60) for e in fx}
    x["port"] = _port(x["info"]["state"])
    time.sleep(10)   # main takes the ask
    _until(x, x["settled"], "main done with the ask")
    timers = [l for l in c.lines() if re.search(r"\bsb every\b", l) and l.startswith(("tool #", "tool_code #"))]
    r["flow"] = {"timers": sorted({re.sub(r"^tool(_code)? #\d+ \w+ ?: ", "", l)[:200] for l in timers}), "meetings": {}}
    page_of = lambda words: next((p for p in (c.state or {}).get("pages", []) if p["id"].startswith("meeting-")
                                  and any(w in p["id"] for w in words)), None)
    pages_seen = {}
    last_end = max(when[e][1] for e in MEETINGS_RUN) + 30 * 60
    while time.time() < last_end:
        x["poll"]()
        for e, words in MEETINGS_RUN.items():
            p = page_of(words)
            m = r["flow"]["meetings"].setdefault(e, {})
            if p and "v1_at" not in m and p.get("version", 0) >= 1:
                m.update(id=p["id"], v1_at=round(time.time() - when[e][0]), v1_n=page_meta(p["id"])["versions"][-1]["n"])
                pages_seen[e] = p["id"]
            # the brief as it stands at the meeting's start: its latest version until then (a first
            # publish may be the skeleton, filled a minute later)
            if "v1_n" in m and time.time() < when[e][0]:
                n = page_meta(m["id"])["versions"][-1]["n"]
                if n != m.get("brief_n"):
                    b = _body(dict(x, page={"id": m["id"]}), n)
                    m["brief"], m["brief_fails"] = meeting_brief_check(b, m["id"], overdue=(e in MEETINGS_OVERDUE))
                    m["brief_n"] = n
            if e == "e401" and "v1_n" in m and "v2_at" not in m:
                meta = page_meta(m["id"])
                n = meta["versions"][-1]["n"]
                if n > m["v1_n"] and time.time() > when[e][1] and x["settled"]():
                    m.update(v2_at=round(time.time() - when[e][1]), v2_n=n)
                    m["followups"], fails = meeting_followup_check(_body(dict(x, page={"id": m["id"]}), n), m["id"])
                    r["fails"].extend(fails)
        done = all("v1_at" in r["flow"]["meetings"].get(e, {}) and time.time() > when[e][0] for e in MEETINGS_RUN) \
            and "v2_at" in r["flow"]["meetings"]["e401"]
        if done:
            break
        time.sleep(5)
    for e in MEETINGS_RUN:
        m = r["flow"]["meetings"].get(e, {})
        r["fails"].extend(m.get("brief_fails", []))
        if "v1_at" not in m:
            r["fails"].append("%s: no brief page by %s" % (e, time.strftime("%H:%M", time.localtime(when[e][0]))))
        elif m["v1_at"] > 0:
            r["fails"].append("%s: the brief came %d s after the start" % (e, m["v1_at"]))
    if "v1_at" in r["flow"]["meetings"].get("e401", {}) and "v2_at" not in r["flow"]["meetings"]["e401"]:
        r["fails"].append("e401: no follow-ups (v2) within 30 min of its end")
    # a card that stands for a brief or a follow-up (its text names the meeting or its page);
    # the agent's name doesn't count, and every card is listed for the reader
    about = [cd for cd in x["cards"].values() if any(w in (cd.get("text") or "").lower() + json.dumps(cd.get("page") or {}).lower()
                                                   for ws in MEETINGS_RUN.values() for w in ws + ("meeting-", "brief", "follow-up"))]
    r["flow"]["cards"] = [{"agent": cd.get("agent"), "text": (cd.get("text") or "")[:160]} for cd in x["cards"].values()]
    if about:
        r["fails"].append("%d card(s) about the meetings (the page is enough)" % len(about))


# the mention his scripted 'send' goes to: an answer in words only (Sophie asks for a call slot), never
# one that needs a file (Hugo's March invoice: bise can't attach it, so his send rightly leaves nothing)
SEND_ON = {"num": "306", "who": "Sophie", "to": "sophie@northwind.test"}


def mentions_truth():
    """The mentions set's truth (fixtures sets.mentions): each direct ask of
    him with its batch, whether it is from his team and is work; the noise."""
    m = json.load(open(os.path.join(FAKE_ACCOUNTS, "fixtures.json")))["sets"]["mentions"]
    # 'messages' (not '+messages'): the set replaces the base Slack and Gmail, so the base fixtures'
    # own asks of Camille (the offsite, the weekly update, Nora's La Grange mail…) never mix in
    msgs = lambda svc: m[svc].get("messages") or m[svc].get("+messages") or []
    items = [dict(x, kind="slack") for x in msgs("slack")] + [dict(x, kind="gmail") for x in msgs("gmail")]
    users = {"lea": "Léa", "nora": "Nora", "theo": "Théo", "slackbot": "Slackbot", "camille": "Camille"}
    for x in items:
        x["who"] = (x.get("from") or "").split("<")[0].strip() or users.get(x.get("user"), x.get("user", ""))
        x["num"] = re.sub(r"\D", "", x["id"])
    return {"asks": [x for x in items if x.get("mention")], "noise": [x for x in items if x.get("noise") and x.get("user") != "camille"]}


def mentions_cards_check(truth, cards, flow):
    """mentions.md's cards (amb-kit 78500b1b): one card per batch (the start, each tick) that
    added asks from his team, about one of that batch's team items; none about anything else
    (people outside his team, noise), none twice for a batch. Records {batch: n} in flow."""
    batches = {}
    for a in truth["asks"]:
        if a["mention"] == "team":
            batches.setdefault(a.get("batch", 0), []).append({"id": a["id"], "author": a["who"], "text": a["text"]})
    per = {b: [cd for cd in cards if _card_about(cd, items)] for b, items in sorted(batches.items())}
    other = [cd for cd in cards if not any(cd in v for v in per.values())]
    flow["cards"] = {"batch %s" % b: len(v) for b, v in per.items()}
    if any(len(v) != 1 for v in per.values()) or other:
        return ["cards: %s for his team's asks (one per batch expected), %d other(s): %s"
                % (flow["cards"], len(other), "; ".join((cd.get("text") or "")[:60] for cd in other))]
    # each opened by main and linked to its item (amb-kit m_6156: card.page {id, item}, item = a
    # team ask of that batch, s-301 for s301), so fn + o opens the page there
    unlinked = [cd.get("id") for b, v in per.items() for cd in v
                if cd.get("agent") not in (None, "main")
                or re.sub(r"\D", "", str((cd.get("page") or {}).get("item") or "")) not in {re.sub(r"\D", "", i["id"]) for i in batches[b]}]
    if unlinked:
        return ["cards %s aren't main's or don't link their item (card.page.item = the batch's team ask)" % unlinked]
    return []


def mentions_items(body):
    """The review's items, in order: id, its html, the truth's number its id carries."""
    rev = next((s for s in _sections(body) if s["kit"] == "review"), None)
    if not rev:
        return []
    return [{"id": i, "html": h, "num": re.sub(r"\D", "", i)} for i, h in re.findall(r'<li[^>]*\bdata-id="([^"]+)"[^>]*>(.*?)</li>', rev["html"], re.S)]


def mentions_check(body, page_id, batches, prev_ids=(), today=None):
    """mentions.md on a body after `batches` batches came in: id
    mentions-<today>, titled 'for you', one review data-verb=reply, one item
    per ask so far (newest on top, ids kept from before), each who · where ·
    when, a blockquote and a drafted answer; no noise. (facts, fails)"""
    today = today or time.strftime("%Y-%m-%d")
    truth, fails, secs = mentions_truth(), [], _sections(body)
    if page_id != "mentions-" + today:
        fails.append("page id %s (mentions-%s expected)" % (page_id, today))
    if not re.search(r"<h1[^>]*>\s*for you\s*</h1>", body or "", re.I):
        fails.append("the title isn't 'for you'")
    revs = [s for s in secs if s["kit"] == "review"]
    if len(revs) != 1 or 'data-verb="reply"' not in revs[0]["attrs"]:
        fails.append("%d review block(s); one with data-verb=\"reply\" expected" % len(revs))
    items = mentions_items(body)
    want = [a for a in truth["asks"] if a["batch"] < batches]
    by_num = {a["num"]: a for a in truth["asks"]}
    noise_nums = {n["num"] for n in truth["noise"]}
    got = [by_num[i["num"]] for i in items if i["num"] in by_num]
    missing = [a["id"] for a in want if a not in got]
    if missing:
        fails.append("asks missing after batch %d: %s" % (batches, ", ".join(missing)))
    noise = [i["id"] for i in items if i["num"] in noise_nums]
    # noise shown anywhere but the sources: the sources list every place the watcher read, a
    # notification included ('Lucas mentioned you in ENG-412 · Gmail', live run 07:16), which is no item
    shown = " ".join(s["html"] for s in _sections(body) if s["kit"] != "sources") if _sections(body) else (body or "")
    low = re.sub(r"<[^>]+>", " ", shown).lower()
    noise += [n["id"] for n in truth["noise"] if n["id"] not in noise and n.get("subject") and n["subject"].lower()[:30] in low]
    if noise:
        fails.append("noise on the page: %s" % ", ".join(noise))
    order = [a["batch"] for a in got]
    if order != sorted(order, reverse=True):
        fails.append("not newest on top (batches in order: %s)" % order)
    lost = [i for i in prev_ids if i not in {x["id"] for x in items}]
    if lost:
        fails.append("item ids not kept from the version before: %s" % ", ".join(lost))
    bad = [i["id"] for i in items if i["num"] in by_num and not (
        re.search(r"<p[^>]*>[^<]*·[^<]*·", i["html"]) and "<blockquote" in i["html"]
        and re.search(r"</blockquote>\s*<p[^>]*>.+?</p>", i["html"], re.S))]
    if bad:
        fails.append("items without who · where · when, the quote and a drafted answer: %s" % ", ".join(bad))
    return {"items": [i["id"] for i in items], "asks": len(got), "of": len(want)}, fails


def _flow_mentions(x):
    """F (amb-kit m_5997): the 'for you' page after each of 3 batches (the
    start, then two ticks: republished on the watcher's timer), cards only
    for his team's direct questions, once each; then his send on one item:
    exactly that item leaves and the page shows where it went; a 'start an
    agent' on the work ask starts an agent with it."""
    r, c, pid = x["r"], x["c"], x["page"]["id"]
    truth = mentions_truth()
    facts, fails = mentions_check(x["body"], pid, 1)
    r["flow"] = {"v1": facts}
    r["fails"] += fails
    prev, n = facts["items"], x["last"]["n"]
    for k in (1, 2):
        tick()
        r["t"]["tick%d" % k] = x["rel"]()
        got = {}

        def republished():
            m = page_meta(pid)["versions"][-1]["n"]
            if m <= n:
                return False
            b = _body(x, m)
            f, fl = mentions_check(b, pid, k + 1, prev)
            if f["asks"] < f["of"] or not x["settled"]():
                return False
            got.update(n=m, facts=f, fails=fl)
            return True
        took = _until(x, republished, "the page with batch %d's asks" % (k + 1))
        if took is None:
            return
        r["t"]["republish%d_after_tick" % k] = took
        r["flow"]["tick%d" % k] = got["facts"]
        r["fails"] += got["fails"]
        prev, n = got["facts"]["items"], got["n"]
    # cards: ONE per batch that brought asks from his team (questions and requests alike, amb-kit
    # 78500b1b: 'Nora asks: … · 1 more'), never again for an item already carded, never another
    fails = mentions_cards_check(truth, list(x["cards"].values()), r["flow"])
    r["fails"] += fails
    if _writes(x["info"]):
        r["fails"].append("%d write(s) before his send" % len(_writes(x["info"])))
        return
    # his send on Sophie's mail (a text answer: 'Thursday after 2pm'): exactly that leaves, and the
    # page says where it went. never Hugo's: his asks for the March invoice PDF, which bise can't
    # attach, so the agent rightly keeps it (live run 05:45: the flow waited 900 s on it)
    items = mentions_items(_body(x, n))
    pick = next((i for i in items if i["num"] == SEND_ON["num"]), None)
    rev = next((s for s in _sections(_body(x, n)) if s["kit"] == "review"), None)
    if pick and rev:
        page_notes(pid, [{"block": rev["id"], "item": pick["id"], "kind": "send"}], send=True)
        r["t"]["send"] = x["rel"]()
        took = _until(x, lambda: _writes(x["info"]) and any(g for g in page_meta(pid).get("went", [])) and x["settled"](),
                      "%s's answer leaving and the page's went line" % SEND_ON["who"])
        w = _writes(x["info"])
        r["flow"]["after_send"] = [(w_.get("kind"), (w_.get("args") or {}).get("to") or (w_.get("args") or {}).get("channel")) for w_ in w]
        if took is not None and (len(w) != 1 or w[0].get("service") != "gmail" or SEND_ON["to"] not in json.dumps(w[0].get("args", {})).lower()):
            r["fails"].append("after his send on %s's item: %s (exactly one Gmail send to %s expected)" % (SEND_ON["who"], r["flow"]["after_send"], SEND_ON["to"]))
    elif rev:
        r["fails"].append("no item for %s's mail (m%s) to send on" % (SEND_ON["who"], SEND_ON["num"]))
    # 'start an agent' on Nora's work ask
    nora = next((i for i in mentions_items(_body(x, page_meta(pid)["versions"][-1]["n"])) if i["num"] == "303"), None)
    if nora and rev:
        names0 = {a["name"] for a in (c.state or {}).get("agents", [])}
        page_notes(pid, [{"block": rev["id"], "item": nora["id"], "kind": "start"}], send=True)
        new = lambda: [a for a in (c.state or {}).get("agents", []) if a["name"] not in names0]
        took = _until(x, lambda: new(), "an agent started on Nora's ask")
        if took is not None:
            a = new()[0]
            spawn = [l for l in c.lines("main") if a["name"] in l and ("sb spawn" in l or "new agent" in l)]
            text = " ".join(c.lines(a["name"])[:40] + spawn).lower()
            r["flow"]["started"] = {"agent": a["name"], "names_ask": "due date" in text or "export" in text}
            if not r["flow"]["started"]["names_ask"]:
                r["fails"].append("the agent's brief doesn't name Nora's ask (the export's due dates)")


# his promises in the promises set and the base fixtures (words of each, lower case); overdue = due before today
PROMISES = {"sso": {"words": ("sso",), "overdue": True}, "nda": {"words": ("nda",), "overdue": True},
            "deck": {"words": ("deck",), "kept": True}, "pricing": {"words": ("pricing",), "overdue": False}}
NOT_HIS = ("case study draft", "sso login ready")


def promises_check(body, page_id, today=None):
    """promises.md on a body: id promises-YYYY-wNN, titled 'your promises',
    one checklist (never data-plan) of rows of his, each promise there, the
    overdue ones dated in the past with a draft or a question they point
    at, the kept one ticked (data-done) or folded as kept, sources quoted,
    nothing others promised. (facts, fails)"""
    d = datetime.date.fromisoformat(today) if today else datetime.date.today()
    y, w, _ = d.isocalendar()
    fails, secs = [], _sections(body)
    if page_id != "promises-%d-w%02d" % (y, w):
        fails.append("page id %s (promises-%d-w%02d expected)" % (page_id, y, w))
    if not re.search(r"<h1[^>]*>\s*your promises\s*</h1>", body or "", re.I):
        fails.append("the title isn't 'your promises'")
    lists = [s for s in secs if s["kit"] == "checklist"]
    if len(lists) != 1 or "data-plan" in (lists[0]["attrs"] if lists else ""):
        fails.append("%d checklist(s); one without data-plan expected" % len(lists))
    rows = re.findall(r"<li([^>]*)>(.*?)</li>", lists[0]["html"], re.S) if lists else []
    ids = {s["id"] for s in secs}
    facts = {"rows": len(rows)}
    low = re.sub(r"<[^>]+>", " ", body or "").lower()
    for k, p in PROMISES.items():
        row = next(((a, h) for a, h in rows if any(w in h.lower() for w in p["words"])), None)
        facts[k] = "missing"
        if p.get("kept"):
            if row and "data-done" in row[0] or re.search(r"kept[^.]{0,60}%s|%s[^.]{0,60}kept" % (p["words"][0], p["words"][0]), re.sub(r"\s+", " ", low)):
                facts[k] = "kept"
            else:
                fails.append("the %s promise, kept by his mail, isn't ticked or folded as kept" % k)
            continue
        if not row:
            fails.append("the %s promise is missing" % k)
            continue
        a = row[0]
        facts[k] = "row"
        if 'data-who="yours"' not in a:
            fails.append("the %s row isn't his (data-who=\"yours\")" % k)
        due = re.search(r'data-due="(\d{4}-\d{2}-\d{2})"', a)
        if p["overdue"]:
            if not due or due.group(1) >= d.isoformat():
                fails.append("the %s row isn't dated in the past (data-due %s)" % (k, due.group(1) if due else "none"))
            ref = re.search(r'data-(draft|question)="([^"]+)"', a)
            if not ref or ref.group(2) not in ids:
                fails.append("the overdue %s row points at no draft or question on the page" % k)
            else:
                facts[k] = ref.group(1)
    src = next((s for s in secs if s["kit"] == "sources"), None)
    if not src or not re.search(r"[\"“”'‘’]", re.sub(r"<[^>]+>", "", src["html"])):
        fails.append("no sources with his words quoted")
    # others' promises must not be rows of his list; quoting one as a source (a risk callout
    # checking his date against Lucas's 'SSO login ready for the beta by January') is fine
    row_text = " ".join(re.sub(r"<[^>]+>", " ", h) for _, h in rows).lower()
    theirs = [t for t in NOT_HIS if t in re.sub(r"\s+", " ", row_text)]
    if theirs:
        fails.append("others' promises on his page: %s" % ", ".join(theirs))
    return facts, fails


def _hub_sb(info, *args):
    """`sb <args>` as the QA hub's main would run it (its own state dir and sb)."""
    env = {k: v for k, v in os.environ.items() if not k.startswith("SB_")}
    # sb finds its hub by SB_SOCKET + SB_AGENT (the caller's own SB_* were dropped above, so
    # this never reaches the hub the QA tool runs in). An agent's socket is agent.sock
    # (docs/issues/16): hub.sock serves no agent request since debt-t3
    sock = os.path.join(info["state"], "agent.sock")
    env.update(SB_STATE_DIR=info["state"], SB_SOCKET=sock, SB_AGENT="main")
    p = subprocess.run([os.path.join(info["state"], "bin", "sb")] + list(args), capture_output=True, text=True, env=env, timeout=30)
    return p.stdout + p.stderr


def _flow_promises(x):
    """G (ambient-lead m_6016): the promises page held to promises.md, sb
    page waiting listing the overdue rows first, then the morning page
    leading with them; no card ever, nothing leaves."""
    r, c, pid = x["r"], x["c"], x["page"]["id"]
    facts, fails = promises_check(x["body"], pid)
    r["flow"] = {"page": facts}
    r["fails"] += fails
    out = _hub_sb(x["info"], "page", "waiting")
    lines = [l for l in out.splitlines() if l.strip()]
    r["flow"]["waiting"] = lines[:12]
    first = " ".join(lines[:2]).lower()
    if not any(w in first for w in ("sso", "nda")):
        r["fails"].append("sb page waiting doesn't list an overdue promise first: %s" % (lines[:2] or out[:200]))
    # the morning page leads with them
    before = {p["id"] for p in (c.state or {}).get("pages", [])}
    x["core"].send("make today's morning page")
    r["t"]["morning_ask"] = x["rel"]()
    mp = lambda: next((p for p in (c.state or {}).get("pages", []) if p["id"].startswith("morning-") and p["id"] not in before and p.get("version", 0) >= 1), None)
    if _until(x, lambda: mp() and x["settled"](), "the morning page") is None:
        return
    m = mp()
    body = _body(dict(x, page=m), page_meta(m["id"])["versions"][-1]["n"])
    needs = re.search(r"needs you</h2>.*?<section[^>]*data-kit=\"prose\"[^>]*>(.*?)</section>", body, re.S | re.I)
    lis = re.findall(r"<li[^>]*>(.*?)</li>", needs.group(1), re.S) if needs else []
    r["flow"]["morning_needs"] = [re.sub(r"<[^>]+>", "", l).strip()[:100] for l in lis[:4]]
    lead = (lis[0] if lis else "").lower()
    if not (("/p/" + pid) in lead and any(w in lead for w in ("sso", "nda", "overdue", "late"))):
        r["fails"].append("the morning page's needs you doesn't lead with an overdue promise: %s" % r["flow"]["morning_needs"][:2])
    cards = list(x["cards"].values())
    if cards:
        r["fails"].append("%d card(s): a promise never makes one" % len(cards))


FLOWS = {"newsletter": _flow_newsletter, "feedback": _flow_feedback, "checklist": _flow_checklist, "morning": _flow_morning,
         "meetings": _flow_meetings, "mentions": _flow_mentions, "promises": _flow_promises}


def _covered(body, items):
    """Which comments a page body names (its id, as in amb-kit's data-id, or its author)."""
    low = (body or "").lower()
    hit = [c for c in items if str(c["id"]).lower() in low or c["author"].lower() in low]
    return {"found": len(hit), "of": len(items), "missing": ["%s on %s" % (c["author"], c["place"]) for c in items if c not in hit]}


def team_asks():
    """The fixtures' direct questions to him from his team: a Slack message
    that @-names him with a question, a mail from acme with one. As
    _card_about's items (id, author, text)."""
    fx = json.load(open(os.path.join(FAKE_ACCOUNTS, "fixtures.json")))
    out = [{"id": m["id"], "author": m.get("user") or "", "text": m["text"]} for m in fx["slack"]["messages"]
           if "?" in m["text"] and "@camille" in m["text"].lower()]
    out += [{"id": m["id"], "author": m["from"].split("<")[0].strip(), "text": m["subject"] + " " + m["body"]} for m in fx["gmail"]["messages"]
            if "@acme.test" in m["from"] and "?" in m["subject"] + m["body"]]
    return out


def _card_about(card, items):
    """A card is about a comment when it names its author or shares its words."""
    t = json.dumps(card, ensure_ascii=False).lower()
    for c in items:
        if c["author"].lower() in t or str(c["id"]) in t:
            return True
        words = [w for w in re.findall(r"[a-z0-9]{5,}", c["text"].lower())]
        if sum(w in t for w in words) >= 2:
            return True
    return False
