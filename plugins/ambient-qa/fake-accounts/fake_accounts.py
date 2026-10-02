#!/usr/bin/env python3
"""Fake accounts for QA hubs: a stdio MCP server per service (gmail, slack,
linear, calendar) over fixtures.json. The user's rule (main m_5200): no
test, QA or demo touches his real accounts, so a QA hub's main reads these
canned items and its writes (drafts, sends, posts, issues, events) go to
$FAKE_ACCOUNTS_OUTBOX (one JSON line each), never anywhere else.

  fake_accounts.py <service>     the MCP server (qa.py installs one plugin per service)
"""
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.realpath(__file__))
DATA = json.load(open(os.path.join(HERE, "fixtures.json")))
OUTBOX = os.environ.get("FAKE_ACCOUNTS_OUTBOX") or os.path.join(os.environ.get("PLUGIN_DATA") or HERE, "outbox.jsonl")
NOTE = "fake QA account (fixture data): nothing here is real, writes go to a QA outbox"


def S(**props):
    return {"type": "object", "properties": {k: {"type": v} for k, v in props.items()}}


def match(item, query):
    if not query:
        return True
    q = query.lower()
    return all(w in json.dumps(item, ensure_ascii=False).lower() for w in q.split())


def write(service, action, args):
    rec = {"at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "service": service, "action": action, "args": args}
    os.makedirs(os.path.dirname(OUTBOX) or ".", exist_ok=True)
    with open(OUTBOX, "a") as f:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    return {"ok": True, "fake": True, "id": "fake-%s-%d" % (action, int(time.time() * 1000)), "note": NOTE}


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
    return {
        "list_channels": ("The channels.", S(), lambda a: {"channels": s["channels"]}),
        "read_channel": ("A channel's latest messages.", S(channel="string", limit="integer"),
                         lambda a: {"messages": [m for m in s["messages"] if m["channel"] == (a.get("channel") or "").lstrip("#")][: int(a.get("limit") or 20)]}),
        "search_messages": ("Search messages.", S(query="string"), lambda a: {"messages": [m for m in s["messages"] if match(m, a.get("query", ""))]}),
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


SERVICES = {"gmail": gmail, "slack": slack, "linear": linear, "calendar": calendar}


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
