#!/usr/bin/env python3
"""Fake accounts for QA hubs: a stdio MCP server per service (gmail, slack,
linear, calendar, github, hn, reddit, x, bluesky) over fixtures.json; the
launch's comments on hn, reddit, x and bluesky grow in batches over hub
time ($FAKE_ACCOUNTS_CLOCK, `qa.py tick`), read-only like the real ones. The user's rule (main m_5200): no
test, QA or demo touches his real accounts, so a QA hub's main reads these
canned items and its writes (drafts, sends, posts, issues, events) go to
$FAKE_ACCOUNTS_OUTBOX (one JSON line each), never anywhere else.

  fake_accounts.py <service>     the MCP server (qa.py installs one plugin per service)
"""
import datetime
import json
import os
import re
import sys
import time

HERE = os.path.dirname(os.path.realpath(__file__))
ISO_DAY = re.compile(r"(?<!\d)(\d{4}-\d{2}-\d{2})(?!\d)")


def load(today=None):
    """fixtures.json with every YYYY-MM-DD moved by whole days from its
    _today to today (FAKE_ACCOUNTS_TODAY, else the local date), so 'today's
    meetings' and 'yesterday's mails' mean the hub's today."""
    text = open(os.path.join(HERE, "fixtures.json")).read()
    base = datetime.date.fromisoformat(json.loads(text)["_today"])
    today = datetime.date.fromisoformat(today or os.environ.get("FAKE_ACCOUNTS_TODAY") or datetime.date.today().isoformat())
    delta = today - base
    if delta:
        text = ISO_DAY.sub(lambda m: (datetime.date.fromisoformat(m.group(1)) + delta).isoformat(), text)
    return json.loads(text)


DATA = load()
OUTBOX = os.environ.get("FAKE_ACCOUNTS_OUTBOX") or os.path.join(os.environ.get("PLUGIN_DATA") or HERE, "outbox.jsonl")
NOTE = "fake QA account (fixture data): nothing here is real, writes go to a QA outbox"


def S(**props):
    return {"type": "object", "properties": {k: {"type": v} for k, v in props.items()}}


def match(item, query):
    if not query:
        return True
    q = query.lower()
    return all(w in json.dumps(item, ensure_ascii=False).lower() for w in q.split())


def write(service, action, args, extra=None):
    # kind: gmail-draft, kit-draft, slack-post_message... (amb-kit m_5538 reads it)
    kind = "%s-%s" % (service, action[len("create_"):] if action.startswith("create_") else action)
    rid = "fake-%s-%d" % (action, int(time.time() * 1000))
    rec = {"at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "service": service, "action": action, "kind": kind, "id": rid, "args": args}
    rec.update(extra or {})
    os.makedirs(os.path.dirname(OUTBOX) or ".", exist_ok=True)
    with open(OUTBOX, "a") as f:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    return dict({"ok": True, "fake": True, "id": rid, "note": NOTE}, **(extra or {}))


def gmail():
    g = DATA["gmail"]
    short = lambda m: {k: m[k] for k in ("id", "thread", "from", "date", "subject", "labels", "unread")}
    return {
        "search_messages": ("Search the inbox (words, from:, label names); newest first.", S(query="string", max_results="integer"),
                            lambda a: {"messages": [short(m) for m in sorted(g["messages"], key=lambda m: m["date"], reverse=True)
                                                    if match(m, a.get("query", ""))][: int(a.get("max_results") or 20)]}),
        "read_message": ("One message, whole.", S(id="string"), lambda a: next((m for m in g["messages"] if m["id"] == a.get("id")), {"error": "no message %s" % a.get("id")})),
        "read_thread": ("A thread's messages, oldest first.", S(thread="string"),
                        lambda a: {"messages": sorted([m for m in g["messages"] if m["thread"] == a.get("thread")], key=lambda m: m["date"])}),
        "list_labels": ("The labels.", S(), lambda a: {"labels": g["labels"]}),
        "create_draft": ("Create a draft (to, subject, body, thread?).", S(to="string", subject="string", body="string", thread="string"), lambda a: write("gmail", "create_draft", a)),
        "send_message": ("Send a message (to, subject, body, thread?).", S(to="string", subject="string", body="string", thread="string"), lambda a: write("gmail", "send_message", a)),
        "modify_labels": ("Add or remove labels on a message.", S(id="string", add="array", remove="array"), lambda a: write("gmail", "modify_labels", a)),
    }


def slack():
    s = DATA["slack"]
    cid = {c["name"]: c["id"] for c in s["channels"]}

    def linked(m):
        # the message's permalink (amb-kit m_5529: https://acme.slack.com/archives/<channel>/p<ts>)
        t = datetime.datetime.fromisoformat(m["ts"].replace("Z", "+00:00")).timestamp()
        return dict(m, url="https://acme.slack.com/archives/%s/p%d" % (cid.get(m["channel"], m["channel"]), int(t * 1e6)))
    return {
        "list_channels": ("The channels.", S(), lambda a: {"channels": s["channels"]}),
        "read_channel": ("A channel's latest messages.", S(channel="string", limit="integer"),
                         lambda a: {"messages": [linked(m) for m in s["messages"] if m["channel"] == (a.get("channel") or "").lstrip("#")][: int(a.get("limit") or 20)]}),
        "search_messages": ("Search messages.", S(query="string"), lambda a: {"messages": [linked(m) for m in s["messages"] if match(m, a.get("query", ""))]}),
        "post_message": ("Post in a channel.", S(channel="string", text="string"), lambda a: write("slack", "post_message", a)),
    }


def linear():
    l = DATA["linear"]
    return {
        "list_issues": ("Issues, filtered by words, state or assignee.", S(query="string", state="string", assignee="string"),
                        lambda a: {"issues": [i for i in l["issues"] if match(i, a.get("query", "")) and (not a.get("state") or i["state"].lower() == a["state"].lower())
                                              and (not a.get("assignee") or i["assignee"] == a["assignee"])]}),
        "get_issue": ("One issue.", S(id="string"), lambda a: next((i for i in l["issues"] if i["id"] == a.get("id")), {"error": "no issue %s" % a.get("id")})),
        "create_issue": ("Create an issue.", S(title="string", description="string", priority="integer"), lambda a: write("linear", "create_issue", a)),
        "add_comment": ("Comment on an issue.", S(id="string", body="string"), lambda a: write("linear", "add_comment", a)),
        "update_issue": ("Change an issue's state, assignee or priority.", S(id="string", state="string", assignee="string", priority="integer"), lambda a: write("linear", "update_issue", a)),
    }


def calendar():
    c = DATA["calendar"]
    return {
        "list_events": ("Events between start and end (ISO), else all.", S(start="string", end="string"),
                        lambda a: {"events": [e for e in c["events"] if (not a.get("start") or e["end"] >= a["start"]) and (not a.get("end") or e["start"] <= a["end"])]}),
        "get_event": ("One event.", S(id="string"), lambda a: next((e for e in c["events"] if e["id"] == a.get("id")), {"error": "no event %s" % a.get("id")})),
        "create_event": ("Create an event.", S(title="string", start="string", end="string", attendees="array"), lambda a: write("calendar", "create_event", a)),
    }


def github():
    g = DATA["github"]
    return {
        "repo_stats": ("The repo's stars, forks, open issues and PRs, 14-day traffic, latest release downloads.", S(), lambda a: dict(g["stats"], repo=g["repo"])),
        "list_issues": ("Issues, newest first, filtered by words or state.", S(query="string", state="string"),
                        lambda a: {"issues": [i for i in g["issues"] if match(i, a.get("query", "")) and (not a.get("state") or i["state"] == a["state"])]}),
        "list_pulls": ("Pull requests, filtered by state (open, merged).", S(state="string"),
                       lambda a: {"pulls": [p for p in g["pulls"] if not a.get("state") or p["state"] == a["state"]]}),
        "comment_issue": ("Comment on an issue or PR.", S(number="integer", body="string"), lambda a: write("github", "comment_issue", a)),
        "list_releases": ("The repo's releases, newest first, with their notes.", S(limit="integer"),
                          lambda a: {"releases": g.get("releases", [])[: int(a.get("limit") or 10)]}),
    }


def kit():
    """Kit (the newsletter): read the list and past broadcasts, write a draft
    to the outbox only. No send or schedule tool, like the real one."""
    k = DATA["kit"]

    def draft(a):
        n = int(time.time() * 1000) % 10000000
        return write("kit", "create_draft", a, {"draft_id": n, "url": "https://app.kit.com/campaigns/%d/draft" % n})
    return {
        "subscriber_count": ("The newsletter's active subscribers.", S(), lambda a: {"count": k["subscribers"]}),
        "list_broadcasts": ("Past broadcasts, newest first: id, subject, created_at, draft, published_at.", S(limit="integer"),
                            lambda a: {"broadcasts": [{x: b[x] for x in ("id", "subject", "created_at", "draft", "published_at")} for b in k["broadcasts"]][: int(a.get("limit") or 10)]}),
        "broadcast_stats": ("One broadcast's stats: recipients, open rate, click rate, unsubscribes.", S(id="integer"),
                            lambda a: next((b["stats"] for b in k["broadcasts"] if str(b["id"]) == str(a.get("id"))), {"error": "no broadcast %s" % a.get("id")})),
        "create_draft": ("Create a draft broadcast (subject, html, preview). It is never scheduled or sent: the user sends it from Kit himself.",
                         S(subject="string", html="string", preview="string"), draft),
    }


# ---- the launch (roadmap B): comments that grow, numbers that move

CLOCK = os.environ.get("FAKE_ACCOUNTS_CLOCK")
STARTED = time.time()


def batches(now=None):
    """The times the launch's comment batches came in: batch 0 at the hub's
    start, then one per `qa.py tick` and one every every_min of hub time
    ($FAKE_ACCOUNTS_CLOCK: {start, ticks: [t...], every_min})."""
    now = now or time.time()
    try:
        c = json.load(open(CLOCK))
    except (TypeError, OSError, ValueError):
        c = {}
    start = float(c.get("start") or STARTED)
    every = float(c.get("every_min", DATA["launch"].get("every_min", 0)) or 0)
    times = [float(t) for t in c.get("ticks", []) if float(t) <= now]
    k = 1
    while every > 0 and start + k * every * 60 <= now:
        times.append(start + k * every * 60)
        k += 1
    return [start] + sorted(times)


def iso(t):
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(t))


def since_ts(s):
    """ISO, epoch seconds, or 30m / 2h / 1d ago."""
    if not s:
        return None
    s = str(s).strip()
    m = re.fullmatch(r"(\d+(?:\.\d+)?)\s*([smhd])", s)
    if m:
        return time.time() - float(m.group(1)) * {"s": 1, "m": 60, "h": 3600, "d": 86400}[m.group(2)]
    try:
        return float(s)
    except ValueError:
        pass
    try:
        return datetime.datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()
    except ValueError:
        return None


def at(series, n):
    return series[min(n, len(series)) - 1]


LAUNCH_LINK = {
    "hn": lambda L, c: "https://news.ycombinator.com/item?id=%s" % c["id"],
    "reddit": lambda L, c: "https://www.reddit.com/r/%s/comments/%s/_/%s" % (L["reddit"]["sub"], L["reddit"]["id"], c["id"]),
    "x": lambda L, c: "https://x.com/%s/status/%s" % (c["author"], c["id"]),
    "bluesky": lambda L, c: "https://bsky.app/profile/%s/post/%s" % (c["author"], c["id"]),
}


def launch_comments(place, since=None):
    """The comments seen so far on one place, oldest first, without the QA's
    truth (kind, needs_answer)."""
    L = DATA["launch"]
    bt = batches()
    out = []
    for c in L["comments"]:
        if c["place"] != place or c["batch"] >= len(bt):
            continue
        t = bt[c["batch"]] - c.get("ago_min", 0) * 60
        if since is not None and t < since:
            continue
        v = {"id": c["id"], "author": c["author"], "time": iso(t), "text": c["text"], "url": LAUNCH_LINK[place](L, c),
             "parent": c.get("parent"), "depth": 1 if c.get("parent") else 0}
        if place == "reddit":
            v["score"] = 3 + len(c["text"]) % 17
        out.append((t, v))
    return [v for _, v in sorted(out, key=lambda x: x[0])]


def launch_story():
    L, n = DATA["launch"], len(batches())
    h = L["hn"]
    return {"id": h["id"], "title": h["title"], "url": h["url"], "by": h["by"], "points": at(h["points"], n),
            "comments": len(launch_comments("hn")), "posted": iso(batches()[0] - h["posted_min"] * 60),
            "hn_url": "https://news.ycombinator.com/item?id=%s" % h["id"]}


def hn():
    L = DATA["launch"]

    def stories(a):
        out = [launch_story()] + [{k: s[k] for k in ("id", "title", "by", "points", "comments", "posted")} for s in DATA["hn"]["stories"]]
        return {"stories": [s for s in out if match(s, a.get("query", ""))]}

    def status(a):
        sid = str(a.get("id", "")).split("id=")[-1]
        if sid == str(L["hn"]["id"]):
            return dict(launch_story(), rank=at(L["hn"]["rank"], len(batches())))
        s = next((s for s in DATA["hn"]["stories"] if str(s["id"]) == sid), None)
        return s or {"error": "no story %s" % a.get("id")}

    def comments(a):
        sid = str(a.get("id", "")).split("id=")[-1]
        if sid != str(L["hn"]["id"]):
            return {"comments": []}
        cut = int(a.get("max_chars") or 800)
        return {"comments": [dict(c, text=c["text"][:cut]) for c in launch_comments("hn", since_ts(a.get("since")))]}
    return {
        "find_story": ("Search Hacker News stories (words), with points, comment count, age.", S(query="string", hours="number"), stories),
        "story_status": ("Live status of one HN story: points, comment count, age, and its rank on the front page, /top, /show, /newest (null = not listed).",
                         S(id="string"), status),
        "comments": ("Flattened comment tree of an HN story (oldest first): id, author, time, parent, depth, text. since = only newer ones (ISO, epoch, or 30m/2h/1d).",
                     S(id="string", since="string", max_chars="number"), comments),
    }


def reddit():
    L = DATA["launch"]
    r = L["reddit"]

    def post(a=None):
        n = len(batches())
        return {"id": r["id"], "subreddit": r["sub"], "title": r["title"], "author": r["by"], "score": at(r["score"], n), "upvote_ratio": at(r["ratio"], n),
                "num_comments": len(launch_comments("reddit")), "created": iso(batches()[0] - r["posted_min"] * 60),
                "url": "https://www.reddit.com/r/%s/comments/%s/" % (r["sub"], r["id"]), "removed": False, "locked": False}

    def mine(a):
        return r["id"] in str(a.get("url_or_id", ""))
    return {
        "post": ("One Reddit post (url or id): score, upvote ratio, comment count, age, removed/locked.", S(url_or_id="string"),
                 lambda a: post() if mine(a) else {"error": "no post %s" % a.get("url_or_id")}),
        "comments": ("Comments of a Reddit post flattened (oldest first): id, author, time, parent, depth, score, text. since = only newer ones.",
                     S(url_or_id="string", since="string", max_chars="number"),
                     lambda a: {"comments": launch_comments("reddit", since_ts(a.get("since")))} if mine(a) else {"comments": []}),
        "search": ("Search Reddit posts (words), optionally inside some subreddits.", S(q="string", subs="array", sort="string", time="string", limit="number"),
                   lambda a: {"posts": [p for p in [post()] if match(p, a.get("q", ""))]}),
    }


def x():
    L = DATA["launch"]
    xp = L["x"]

    def metrics(a):
        if xp["id"] not in str(a.get("tweet_id", "")):
            return {"error": "no post %s" % a.get("tweet_id")}
        m = at(xp["metrics"], len(batches()))
        return dict(m, replies=len([c for c in launch_comments("x") if not c.get("quote")]), id=xp["id"], text=xp["text"],
                    url="https://x.com/%s/status/%s" % (xp["handle"], xp["id"]))

    def quotes(a):
        ids = {c["id"] for c in L["comments"] if c["place"] == "x" and c.get("quote")}
        return {"quotes": [c for c in launch_comments("x") if c["id"] in ids]}
    return {
        "mentions": ("Recent X posts mentioning the product or its handle (not from it). since = ISO or 30m/2h/1d.", S(since="string", query="string", max_results="number"),
                     lambda a: {"posts": launch_comments("x", since_ts(a.get("since")))[: int(a.get("max_results") or 25)]}),
        "thread_replies": ("Replies in the conversation of one X post, oldest first.", S(tweet_id="string", since="string", max_results="number"),
                           lambda a: {"replies": [c for c in launch_comments("x", since_ts(a.get("since"))) if c["id"] not in {q["id"] for q in quotes(a)["quotes"]}]}
                           if xp["id"] in str(a.get("tweet_id", "")) else {"replies": []}),
        "post_metrics": ("Public metrics of one X post: likes, reposts, quotes, replies, impressions, bookmarks.", S(tweet_id="string"), metrics),
        "quotes": ("Quote posts of one X post, with their text.", S(tweet_id="string", max_results="number"), quotes),
    }


def bluesky():
    L = DATA["launch"]
    b = L["bluesky"]

    def post():
        n = len(batches())
        return {"uri": "at://%s/app.bsky.feed.post/%s" % (b["handle"], b["id"]), "url": "https://bsky.app/profile/%s/post/%s" % (b["handle"], b["id"]),
                "author": b["handle"], "text": b["text"], "likes": at(b["likes"], n), "reposts": at(b["reposts"], n), "quotes": at(b["quotes"], n),
                "replies": len(launch_comments("bluesky"))}
    return {
        "search_posts": ("Search Bluesky posts (words, a handle). since = ISO or 30m/2h/1d. Returns author, text, counts, url.",
                         S(q="string", since="string", sort="string", limit="number", max_chars="number"),
                         lambda a: {"posts": [p for p in [post()] + launch_comments("bluesky", since_ts(a.get("since"))) if match(p, a.get("q", ""))
                                              or b["handle"] in a.get("q", "") or "acme" in a.get("q", "").lower()]}),
        "thread": ("One Bluesky post (at:// uri or bsky.app url) with its counts, and its replies flattened (oldest first).", S(uri="string", since="string", depth="number"),
                   lambda a: dict(post(), replies_list=launch_comments("bluesky", since_ts(a.get("since"))))
                   if b["id"] in str(a.get("uri", "")) else {"error": "no post %s" % a.get("uri")}),
    }


SERVICES = {"gmail": gmail, "slack": slack, "linear": linear, "calendar": calendar, "github": github, "hn": hn,
            "reddit": reddit, "x": x, "bluesky": bluesky, "kit": kit}


def main():
    service = sys.argv[1] if len(sys.argv) > 1 else ""
    if service not in SERVICES:
        sys.exit("usage: fake_accounts.py %s" % "|".join(SERVICES))
    tools = SERVICES[service]()
    for line in sys.stdin:
        try:
            msg = json.loads(line)
        except ValueError:
            continue
        mid, method = msg.get("id"), msg.get("method")
        if mid is None:
            continue
        if method == "initialize":
            res = {"protocolVersion": (msg.get("params") or {}).get("protocolVersion", "2025-06-18"), "capabilities": {"tools": {}},
                   "serverInfo": {"name": "fake-" + service, "version": "0.1.0"}, "instructions": NOTE}
        elif method == "ping":
            res = {}
        elif method == "tools/list":
            res = {"tools": [{"name": n, "description": "%s (%s)" % (d, NOTE), "inputSchema": sch} for n, (d, sch, _) in tools.items()]}
        elif method == "tools/call":
            p = msg.get("params") or {}
            t = tools.get(p.get("name"))
            if not t:
                res = {"content": [{"type": "text", "text": "no tool %s" % p.get("name")}], "isError": True}
            else:
                res = {"content": [{"type": "text", "text": json.dumps(t[2](p.get("arguments") or {}), ensure_ascii=False)}]}
        else:
            sys.stdout.write(json.dumps({"jsonrpc": "2.0", "id": mid, "error": {"code": -32601, "message": "no method %s" % method}}) + "\n")
            sys.stdout.flush()
            continue
        sys.stdout.write(json.dumps({"jsonrpc": "2.0", "id": mid, "result": res}) + "\n")
        sys.stdout.flush()


if __name__ == "__main__":
    main()
